import { Actor, CatalogError, fail, hash, id } from "./domain";
import type DidarCatalogService from "./service";
import { Modules } from "@medusajs/framework/utils";
import type { ILockingModule } from "@medusajs/framework/types";

/** Native Medusa locking spans independent native service calls. A durable
 * receipt precedes side effects; retrying the same command resumes with its
 * stable command ID. Extension state/history/result commit in one SQL tx. */
export async function execute(
  scope: any,
  actor: Actor,
  resource: string,
  input: any,
  fn: (tx: any, receipt: any) => Promise<any>,
) {
  const service = scope.resolve("didar_catalog") as DidarCatalogService;
  return (scope.resolve(Modules.LOCKING) as ILockingModule).execute(
    `didar:p01:${resource}`,
    async (signal?: AbortSignal) =>
      service.database(async (db) => {
        signal?.throwIfAborted();
        let receipt: any,
          attempting = false;
        try {
          const key = {
            actor_id: actor.id,
            organization_id: actor.organization_id,
            resource_key: resource,
            idempotency_key: input.idempotency_key,
          };
          receipt = await db("didar_command_receipt").where(key).first();
          const digest = hash(input);
          if (receipt && receipt.payload_hash !== digest)
            fail(
              409,
              "IDEMPOTENCY_CONFLICT",
              "Command key was used for another payload",
            );
          if (receipt?.state === "DONE") return receipt.result;
          const inFlight = await db("didar_command_receipt")
            .where({ resource_key: resource, state: "RUNNING" })
            .whereNot("id", receipt?.id ?? "")
            .first();
          if (inFlight)
            fail(
              409,
              "RECOVERY_REQUIRED",
              "Retry the interrupted command before changing this resource",
            );
          if (!receipt) {
            receipt = {
              id: id("dcommand"),
              ...key,
              payload_hash: digest,
              state: "RUNNING",
              result: { input },
              created_at: new Date(),
              updated_at: new Date(),
            };
            await db("didar_command_receipt").insert(receipt);
          } else
            await db("didar_command_receipt").where({ id: receipt.id }).update({
              state: "RUNNING",
              failure: null,
              updated_at: new Date(),
            });
          attempting = true;
          const result = await db.transaction(async (tx: any) => {
            signal?.throwIfAborted();
            const result = await fn(tx, receipt);
            signal?.throwIfAborted();
            await tx("didar_command_receipt")
              .where({ id: receipt.id })
              .update({
                state: "DONE",
                result: JSON.stringify(result),
                updated_at: new Date(),
              });
            return result;
          });
          return result;
        } catch (error) {
          if (attempting && receipt && receipt.state !== "DONE") {
            const safe =
              error instanceof CatalogError
                ? error.code
                : "NATIVE_OR_DATABASE_FAILURE";
            // Invalid commands can be replaced. Unexpected failures retain RUNNING
            // so a new command cannot race an uncompleted native side effect.
            await db("didar_command_receipt")
              .where({ id: receipt.id })
              .update({
                state: error instanceof CatalogError ? "FAILED" : "RUNNING",
                failure: safe,
                updated_at: new Date(),
              });
          }
          throw error;
        }
      }),
    { timeout: 10, expire: 60 },
  );
}

export async function event(tx: any, actor: Actor, receipt: any, data: any) {
  await tx("didar_catalog_event").insert({
    id: id("devent"),
    entity_type: data.entity_type ?? (data.offer_id ? "OFFER" : "PRODUCT"),
    entity_id: data.entity_id ?? data.offer_id ?? data.product_id,
    category_id: data.category_id ?? null,
    subcategory_id: data.subcategory_id ?? null,
    product_id: data.product_id ?? null,
    offer_id: data.offer_id ?? null,
    submission_id: data.submission_id ?? null,
    candidate_id: data.candidate_id ?? null,
    event_code: data.event_code,
    from_state: data.from_state ?? null,
    to_state: data.to_state ?? null,
    actor_id: actor.id,
    actor_type: actor.type,
    actor_organization_id: actor.organization_id,
    owner_organization_id: data.owner_organization_id,
    role_context: actor.roles.join(","),
    on_behalf_of:
      actor.organization_id !== data.owner_organization_id
        ? data.owner_organization_id
        : null,
    reason: data.reason ?? null,
    command_id: receipt.id,
    occurred_at: new Date(),
    details: JSON.stringify(data.details ?? {}),
  });
}
export const version = (row: any, expected: number) => {
  if (row.version !== expected)
    fail(
      409,
      "STALE_VERSION",
      "Reload the current resource before changing it",
    );
};
