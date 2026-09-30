import { Actor, fail, permit } from "./domain";
import DidarCatalogService from "./service";
import { graph } from "./native";

export async function authorize(req: any): Promise<Actor> {
  const auth = req.auth_context;
  if (!auth?.actor_id) fail(401, "UNAUTHORIZED", "Sign in is required");
  const expected = req.path.startsWith("/admin/")
    ? "user"
    : req.path.startsWith("/vendor/")
      ? "member"
      : "customer";
  if (auth.actor_type !== expected)
    fail(403, "ACTOR_MISMATCH", "Wrong actor audience");
  const [identity] = await graph(
    req.scope,
    expected,
    ["id", ...(expected === "member" ? ["is_active"] : [])],
    { id: auth.actor_id },
  );
  if (!identity || identity.is_active === false)
    fail(403, "INACTIVE_ACTOR", "Active identity is required");
  const service = req.scope.resolve("didar_catalog") as DidarCatalogService;
  return service.database(async (db) => {
    const memberships = await db("didar_membership as m")
      .join("didar_organization as o", "o.id", "m.organization_id")
      .where({
        "m.actor_id": auth.actor_id,
        "m.actor_type": auth.actor_type,
        "m.active": true,
        "o.active": true,
      })
      .whereNull("m.deleted_at")
      .whereNull("o.deleted_at")
      .select("m.id as membership_id", "o.id", "o.kind", "o.seller_id");
    const requested = req.get("x-didar-organization-id");
    const candidates = memberships.filter(
      (m: any) =>
        (!requested || m.id === requested) &&
        (expected !== "member" ||
          m.seller_id === req.seller_context?.seller_id),
    );
    if (candidates.length !== 1)
      fail(
        403,
        "ORGANIZATION_SCOPE",
        "An authorized organization context is required",
      );
    const member = candidates[0];
    const grants = await db("didar_grant")
      .where({ membership_id: member.membership_id })
      .whereNull("deleted_at");
    const actor: Actor = {
      id: auth.actor_id,
      type: auth.actor_type,
      organization_id: member.id,
      kind: member.kind,
      seller_id: member.seller_id,
      permissions: grants.map((g: any) => g.permission),
      roles: [...new Set<string>(grants.map((g: any) => g.role))],
    };
    if (
      (expected === "member" && actor.kind !== "SUPPLIER") ||
      (expected === "user" && actor.kind !== "DIDAR") ||
      (expected === "customer" && actor.kind !== "RETAILER")
    )
      fail(403, "ORGANIZATION_SCOPE", "Wrong organization audience");
    if (actor.kind === "SUPPLIER") {
      const links = await graph(req.scope, "seller_member", ["id"], {
        member_id: actor.id,
        seller_id: actor.seller_id,
      });
      if (!links.length)
        fail(
          403,
          "SUPPLIER_MEMBERSHIP",
          "Native Seller membership is required",
        );
    }
    return actor;
  });
}
export const own = (actor: Actor, owner: string) => {
  if (actor.kind !== "SUPPLIER" || actor.organization_id !== owner)
    fail(404, "NOT_FOUND", "Resource not found");
};
export const catalogAccess = (actor: Actor) =>
  permit(actor, "catalog.read_retailer", "RETAILER");
