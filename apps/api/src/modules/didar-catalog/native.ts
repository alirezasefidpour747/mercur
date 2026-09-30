import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  stageProductChangeWorkflow,
  confirmProductChangeWorkflow,
  confirmProductsWorkflow,
  rejectProductWorkflow,
  requestProductChangeWorkflow,
  rejectProductChangeWorkflow,
  recordProductAuditChangeWorkflow,
} from "@mercurjs/core/workflows";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import { fingerprint, fail, hash } from "./domain";

export const graph = async (
  scope: any,
  entity: string,
  fields: string[],
  filters: any,
) =>
  (
    await scope
      .resolve(ContainerRegistrationKeys.QUERY)
      .graph({ entity, fields, filters })
  ).data;
export const productFields = [
  "id",
  "title",
  "handle",
  "description",
  "material",
  "type_id",
  "status",
  "images.url",
  "variants.id",
  "variants.sku",
  "categories.id",
  "product_attribute_values.id",
  "product_attribute_values.attribute.id",
];
export async function nativeProduct(scope: any, product_id: string) {
  const [p] = await graph(scope, "product", productFields, { id: product_id });
  if (!p) fail(404, "NOT_FOUND", "Product not found");
  return p;
}
export async function ancestry(scope: any, leafId: string) {
  const [leaf] = await graph(
    scope,
    "product_category",
    ["id", "name", "handle", "parent_category_id", "is_active", "is_internal"],
    { id: leafId },
  );
  if (!leaf || !leaf.parent_category_id || !leaf.is_active || leaf.is_internal)
    fail(422, "INVALID_SUBCATEGORY", "Select an active public Subcategory");
  const [root] = await graph(
    scope,
    "product_category",
    ["id", "name", "handle", "parent_category_id", "is_active", "is_internal"],
    { id: leaf.parent_category_id },
  );
  if (!root || root.parent_category_id || !root.is_active || root.is_internal)
    fail(
      422,
      "INVALID_CATEGORY",
      "Subcategory must have an active public root Category",
    );
  return { root, leaf };
}
export async function createNativeProduct(
  scope: any,
  actor: any,
  candidate: any,
  product_id: string,
  db?: any,
) {
  const existing = await graph(scope, "product", productFields, {
    id: product_id,
  });
  if (existing.length && fingerprint(existing[0]) !== fingerprint(candidate))
    fail(
      409,
      "NATIVE_CONFLICT",
      "Native create recovery requires matching draft",
    );
  if (!existing.length) {
    if (
      candidate.type_id &&
      !(await graph(scope, "product_type", ["id"], { id: candidate.type_id }))
        .length
    )
      fail(422, "INVALID_TYPE", "Product type not found");
    // Mercur retains its native default option, Seller links, attributes and Product audit.
    // Its ecommerce Variant workflow creates an empty price-set even without prices.
    // Use the native Variant service below instead: no pricing or inventory workflow.
    await createProductsWorkflow(scope).run({
      input: {
        products: [
          {
            id: product_id,
            title: candidate.title,
            handle: candidate.handle,
            description: candidate.description,
            material: candidate.material,
            type_id: candidate.type_id,
            status: "draft",
            category_ids: [candidate.subcategory_id],
            images: candidate.images.map((url: string) => ({ url })),
            variants: [],
            attributes: await nativeAttributes(
              scope,
              candidate.attribute_value_ids ?? [],
              db,
            ),
            seller_ids: [actor.seller_id],
          } as any,
        ],
        created_by: actor.seller_id,
      },
    });
  }
  let p = await nativeProduct(scope, product_id);
  const variant_id = `variant_${hash(product_id + ":p01-default").slice(0, 26)}`;
  if (!p.variants?.length) {
    await scope.resolve(Modules.PRODUCT).createProductVariants({
      id: variant_id,
      product_id,
      title: "Default",
      sku: candidate.product_code,
      manage_inventory: false,
      allow_backorder: false,
      options: { __default__: "__default__" },
    });
    p = await nativeProduct(scope, product_id);
  }
  if (
    p.variants.length !== 1 ||
    p.variants[0].id !== variant_id ||
    p.variants[0].sku !== candidate.product_code
  )
    fail(
      409,
      "VARIANT_INVARIANT",
      "P01 requires exactly one matching native Variant",
    );
  const history = await graph(
    scope,
    "product_change",
    ["id", "actions.action", "actions.details"],
    { product_id, status: "confirmed", created_by: actor.id },
  );
  if (
    !history.some((c: any) =>
      c.actions.some(
        (a: any) =>
          a.action === "VARIANT_ADD" && a.details?.variant?.id === variant_id,
      ),
    )
  )
    await recordProductAuditChangeWorkflow(scope).run({
      input: {
        actor_id: actor.id,
        changes: [
          {
            product_id,
            actions: [
              {
                product_id,
                action: "VARIANT_ADD",
                details: {
                  variant: {
                    id: variant_id,
                    title: "Default",
                    sku: candidate.product_code,
                    manage_inventory: false,
                  },
                },
              },
            ],
          },
        ],
      },
    });
  return p;
}
export async function createNativeOffer(
  scope: any,
  actor: any,
  profile: any,
  offer_id: string,
) {
  const service = scope.resolve("offer");
  const found = await service.listOffers({ id: offer_id });
  if (found.length) {
    const o = found[0];
    if (
      o.seller_id !== actor.seller_id ||
      o.product_id !== profile.product_id ||
      o.manage_inventory
    )
      fail(409, "OFFER_CONFLICT", "Offer identity mismatch");
    return o;
  }
  const profiles = await scope
    .resolve(Modules.FULFILLMENT)
    .listShippingProfiles({ type: "default" }, { take: 1 });
  if (!profiles.length)
    fail(
      409,
      "SHIPPING_PROFILE_REQUIRED",
      "Configure a native default shipping profile before seeding P01",
    );
  return service.createOffers({
    id: offer_id,
    seller_id: actor.seller_id,
    product_id: profile.product_id,
    variant_id: profile.variant_id,
    shipping_profile_id: profiles[0].id,
    sku: `DIDAR-${offer_id}`,
    created_by: actor.id,
    manage_inventory: false,
    allow_backorder: false,
  });
}
export async function stageNative(
  scope: any,
  actor: any,
  c: any,
  previousChange: string | null,
  db?: any,
) {
  if (previousChange) {
    const [change] = await graph(scope, "product_change", ["id", "status"], {
      id: previousChange,
    });
    if (change?.status === "pending") return previousChange;
  }
  const p = await nativeProduct(scope, c.product_id);
  const actions: any[] = [];
  for (const field of ["title", "handle", "description", "material", "type_id"])
    if ((p[field] ?? null) !== (c[field] ?? null))
      actions.push({
        product_id: c.product_id,
        action: "UPDATE",
        details: { field, value: c[field] ?? null },
      });
  if (
    JSON.stringify((p.images ?? []).map((i: any) => i.url).sort()) !==
    JSON.stringify(c.images.slice().sort())
  )
    actions.push({
      product_id: c.product_id,
      action: "UPDATE",
      details: {
        field: "images",
        value: c.images.map((url: string) => ({ url })),
      },
    });
  if (
    !p.categories?.some((v: any) => v.id === c.subcategory_id) ||
    p.categories.length !== 1
  )
    actions.push({
      product_id: c.product_id,
      action: "UPDATE",
      details: { field: "categories", value: [{ id: c.subcategory_id }] },
    });
  // A common code edit must update the single native Variant under the same review.
  if (p.variants?.[0]?.sku !== c.product_code)
    actions.push({
      product_id: c.product_id,
      action: "VARIANT_UPDATE",
      details: {
        variant_id: p.variants[0].id,
        fields: { sku: c.product_code },
      },
    });
  const oldAttributes = p.product_attribute_values ?? [];
  const wanted = c.attribute_value_ids ?? [];
  if (
    JSON.stringify(oldAttributes.map((v: any) => v.id).sort()) !==
    JSON.stringify(wanted.slice().sort())
  ) {
    for (const attribute_id of [
      ...new Set<string>(
        oldAttributes.map((v: any) => v.attribute?.id).filter(Boolean),
      ),
    ])
      actions.push({
        product_id: c.product_id,
        action: "ATTRIBUTE_REMOVE",
        details: { attribute_id },
      });
    for (const attribute of await nativeAttributes(scope, wanted, db))
      actions.push({
        product_id: c.product_id,
        action: "ATTRIBUTE_ADD",
        details: { attribute },
      });
  }
  if (!actions.length) return null;
  const pending = await graph(
    scope,
    "product_change",
    [
      "id",
      "created_by",
      "actions.action",
      "actions.product_id",
      "actions.details",
    ],
    { product_id: c.product_id, status: "pending", created_by: actor.id },
  );
  const matching = pending.find(
    (change: any) =>
      hash(
        change.actions.map((a: any) => ({
          product_id: a.product_id,
          action: a.action,
          details: a.details,
        })),
      ) === hash(actions),
  );
  if (matching) return matching.id;
  const { result } = await stageProductChangeWorkflow(scope).run({
    input: {
      product_id: c.product_id,
      created_by: actor.id,
      actions,
      auto_confirm: false,
    },
  });
  return result.id;
}
export async function publishNative(
  scope: any,
  actor: any,
  submission: any,
  candidate: any,
) {
  if (candidate.native_change_id) {
    const [change] = await graph(scope, "product_change", ["id", "status"], {
      id: candidate.native_change_id,
    });
    if (!change) fail(409, "MISSING_CHANGE", "Native change is missing");
    if (change.status === "pending")
      await confirmProductChangeWorkflow(scope).run({
        input: { ids: [change.id], confirmed_by: actor.id },
      });
    else if (change.status !== "confirmed")
      fail(409, "CHANGE_CONFLICT", "Native change is not publishable");
  }
  const p = await nativeProduct(scope, submission.product_id);
  if (p.status === "proposed")
    await confirmProductsWorkflow(scope).run({
      input: { product_ids: [p.id], actor_id: actor.id },
    });
  else if (p.status !== "published")
    fail(409, "NATIVE_STATE_CONFLICT", "Native Product is not publishable");
  return nativeProduct(scope, submission.product_id);
}
export async function updateNativeStatus(
  scope: any,
  product_id: string,
  status: string,
) {
  await updateProductsWorkflow(scope).run({
    input: { products: [{ id: product_id, status } as any] },
  });
}
export async function reviewNative(
  scope: any,
  actor: any,
  submission: any,
  action: string,
  reason: string | null,
) {
  const p = await nativeProduct(scope, submission.product_id);
  if (action === "reject") {
    const candidate = await scope
      .resolve("didar_catalog")
      .database((db: any) =>
        db("didar_candidate").where({ id: submission.candidate_id }).first(),
      );
    if (candidate?.native_change_id) {
      const [change] = await graph(scope, "product_change", ["id", "status"], {
        id: candidate.native_change_id,
      });
      if (change?.status === "pending")
        await rejectProductChangeWorkflow(scope).run({
          input: {
            id: change.id,
            declined_by: actor.id,
            declined_reason: reason!,
          },
        });
    }
  }
  // Didar's immutable event records the request against the pending revision.
  // Requesting changes never updates the currently published native Product.
  if (p.status !== "proposed") return;
  if (action === "request_changes")
    await requestProductChangeWorkflow(scope).run({
      input: { product_id: p.id, actor_id: actor.id, message: reason! },
    });
  if (action === "reject")
    await rejectProductWorkflow(scope).run({
      input: { product_id: p.id, actor_id: actor.id, message: reason! },
    });
}

export async function nativeAttributes(scope: any, ids: string[], db?: any) {
  if (!ids.length) return [];
  const values = await graph(
    scope,
    "product_attribute_value",
    [
      "id",
      "attribute_id",
      "is_active",
      "attribute.id",
      "attribute.handle",
      "attribute.type",
      "attribute.is_active",
      "attribute.is_filterable",
      "attribute.is_variant_axis",
    ],
    { id: ids },
  );
  const approvedRows = (connection: any) =>
    connection("didar_attribute_approval")
      .where({ active: true })
      .whereNull("deleted_at");
  const approvals = db
    ? await approvedRows(db)
    : await scope.resolve("didar_catalog").database(approvedRows);

  if (
    values.length !== ids.length ||
    values.some(
      (v: any) =>
        !v.is_active ||
        !v.attribute?.is_active ||
        !v.attribute.is_filterable ||
        v.attribute.is_variant_axis ||
        !["single_select", "multi_select"].includes(v.attribute.type) ||
        !approvals.some((a: any) => a.attribute_id === v.attribute.id),
    )
  )
    fail(
      422,
      "INVALID_ATTRIBUTES",
      "Use approved active filterable non-variant native attributes",
    );
  const grouped = new Map<string, string[]>();
  for (const v of values)
    grouped.set(v.attribute.id, [...(grouped.get(v.attribute.id) ?? []), v.id]);
  if (
    values.some(
      (v: any) =>
        v.attribute.type === "single_select" &&
        grouped.get(v.attribute.id)!.length > 1,
    )
  )
    fail(
      422,
      "INVALID_ATTRIBUTES",
      "Single-select attribute has multiple values",
    );
  return [...grouped].map(([id, value_ids]) => ({ id, value_ids }));
}
