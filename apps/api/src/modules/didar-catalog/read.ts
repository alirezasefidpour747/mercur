import { Actor, fail, permit, queryParams, fingerprint } from "./domain";
import { catalogAccess, own } from "./authorization";
import { graph, nativeProduct, ancestry } from "./native";

export async function categories(scope: any, actor: Actor) {
  if (actor.kind === "RETAILER") catalogAccess(actor);
  else
    permit(actor, actor.kind === "DIDAR" ? "product.read" : "product.read_own");
  const rows = await graph(
    scope,
    "product_category",
    [
      "id",
      "name",
      "handle",
      "description",
      "rank",
      "parent_category_id",
      "is_active",
      "is_internal",
    ],
    { is_active: true, is_internal: false },
  );
  return {
    categories: rows
      .filter((r: any) => !r.parent_category_id)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        handle: r.handle,
        description: r.description,
        rank: r.rank,
        children: rows
          .filter((c: any) => c.parent_category_id === r.id)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            handle: c.handle,
            rank: c.rank,
          })),
      }))
      .sort((a: any, b: any) => a.rank - b.rank),
  };
}
export async function definitions(scope: any, actor: Actor) {
  if (actor.kind === "RETAILER") catalogAccess(actor);
  else
    permit(actor, actor.kind === "DIDAR" ? "product.read" : "product.read_own");
  const approved = await scope
    .resolve("didar_catalog")
    .database((db: any) =>
      db("didar_attribute_approval")
        .where({ active: true })
        .whereNull("deleted_at"),
    );
  const attrs = approved.length
    ? await graph(
        scope,
        "product_attribute",
        [
          "id",
          "name",
          "handle",
          "type",
          "is_active",
          "is_filterable",
          "is_variant_axis",
          "values.id",
          "values.name",
          "values.is_active",
        ],
        { id: approved.map((a: any) => a.attribute_id) },
      )
    : [];
  const typeIds =
    actor.kind === "RETAILER"
      ? await scope
          .resolve("didar_catalog")
          .database((db: any) =>
            db("didar_catalog_profile")
              .distinct("type_id")
              .where({ publication_state: "PUBLISHED" })
              .whereNotNull("type_id")
              .whereNull("deleted_at"),
          )
      : null;
  const types =
    typeIds?.length === 0
      ? []
      : await graph(
          scope,
          "product_type",
          ["id", "value"],
          typeIds ? { id: typeIds.map((p: any) => p.type_id) } : {},
        );
  return {
    attributes: attrs
      .filter((a: any) => a.is_active && a.is_filterable && !a.is_variant_axis)
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        handle: a.handle,
        type: a.type,
        values: a.values
          .filter((v: any) => v.is_active)
          .map((v: any) => ({ id: v.id, name: v.name })),
      })),
    types,
  };
}
/** Filtering/count/sort/pagination is performed by PostgreSQL before graph hydration. */
export async function catalogQuery(db: any, scope: any, params: any) {
  const q = db("didar_catalog_profile as p")
    .join("product as n", "n.id", "p.product_id")
    .join("product_category as leaf", "leaf.id", "p.subcategory_id")
    .join("product_category as root", "root.id", "p.root_category_id")
    .where({
      "p.publication_state": "PUBLISHED",
      "n.status": "published",
      "leaf.is_active": true,
      "leaf.is_internal": false,
      "root.is_active": true,
      "root.is_internal": false,
    })
    .whereNull("p.deleted_at")
    .whereNull("n.deleted_at")
    .whereNull("leaf.deleted_at")
    .whereNull("root.deleted_at")
    .whereNull("root.parent_category_id")
    .whereRaw("leaf.parent_category_id = root.id")
    .whereRaw(
      "n.title = p.public_sort_name and n.handle = p.public_handle and n.material is not distinct from p.material and n.type_id is not distinct from p.type_id",
    );
  for (const [key, col] of Object.entries({
    category_id: "root_category_id",
    subcategory_id: "subcategory_id",
    karat: "karat",
    material: "material",
    type_id: "type_id",
    handle: "public_handle",
  }))
    if (params[key] !== undefined) q.where(`p.${col}`, params[key]);
  if (params.category_id && params.subcategory_id) {
    const { root } = await ancestry(scope, params.subcategory_id);
    if (root.id !== params.category_id)
      fail(422, "CATEGORY_MISMATCH", "Subcategory does not belong to Category");
  }
  for (const [key, col, op] of [
    ["weight_min", "public_weight_max", ">="],
    ["weight_max", "public_weight_min", "<="],
    ["fee_min", "public_fee_max", ">="],
    ["fee_max", "public_fee_min", "<="],
  ])
    if (params[key] != null) q.where(`p.${col}`, op, params[key]);
  if (params.q)
    q.whereRaw(
      "to_tsvector('simple',coalesce(p.public_search_text,'')) @@ plainto_tsquery('simple',?)",
      [params.q.normalize("NFKC").replaceAll("ي", "ی").replaceAll("ك", "ک")],
    );
  for (const [handle, value] of Object.entries(params.attributes ?? {})) {
    const approved = await db("didar_attribute_approval as da")
      .join("product_attribute as a", "a.id", "da.attribute_id")
      .where({
        "da.handle": handle,
        "da.active": true,
        "a.is_active": true,
        "a.is_filterable": true,
        "a.is_variant_axis": false,
      })
      .whereNull("a.deleted_at")
      .first("a.id");
    if (!approved)
      fail(
        422,
        "UNSUPPORTED_ATTRIBUTE",
        "Attribute is not approved for retailer filtering",
      );
    const ids = (value as string).split(",");
    const values = await db("product_attribute_value")
      .where({ attribute_id: approved.id, is_active: true })
      .whereIn("id", ids)
      .whereNull("deleted_at");
    if (values.length !== new Set(ids).size)
      fail(422, "INVALID_ATTRIBUTE_VALUES", "Unsupported attribute value");
    q.whereExists(
      db("didar_public_attribute as pa")
        .select(db.raw("1"))
        .whereRaw("pa.product_id=p.product_id")
        .where({ "pa.attribute_id": approved.id })
        .whereIn("pa.value_id", ids)
        .whereNull("pa.deleted_at"),
    );
  }
  return { query: q };
}
export function safeProduct(p: any, n: any, tree: any, attributes: any[]) {
  if (fingerprint(n) !== p.native_fingerprint)
    fail(
      409,
      "CATALOG_REFRESH_REQUIRED",
      "Catalog publication is temporarily unavailable; retry after recovery",
    );
  return {
    id: n.id,
    handle: n.handle,
    name: n.title,
    product_code: p.product_code,
    category: {
      id: tree.root.id,
      name: tree.root.name,
      handle: tree.root.handle,
    },
    subcategory: {
      id: tree.leaf.id,
      name: tree.leaf.name,
      handle: tree.leaf.handle,
    },
    description: n.description ?? null,
    technical_description: p.technical_description,
    images: (n.images ?? []).map((i: any) => ({ url: i.url })),
    karat: p.karat,
    material: n.material,
    type_id: n.type_id ?? null,
    attributes,
    indicative_weight:
      p.public_weight_min == null
        ? null
        : {
            min: String(p.public_weight_min),
            max: String(p.public_weight_max),
            unit: "g",
            indicative: true,
          },
    indicative_making_fee:
      p.public_fee_min == null
        ? null
        : {
            min: String(p.public_fee_min),
            max: String(p.public_fee_max),
            type: "PERCENT",
            indicative: true,
          },
    order_mode: "REQUEST_PRODUCT",
  };
}
export async function catalog(
  scope: any,
  actor: Actor,
  raw: any,
  product_id?: string,
) {
  catalogAccess(actor);
  return readCatalog(scope, raw, product_id);
}
export async function supplierCatalog(scope: any, actor: Actor, raw: any) {
  permit(actor, "product.read_own", "SUPPLIER");
  return readCatalog(scope, raw);
}
async function readCatalog(scope: any, raw: any, product_id?: string) {
  const params = queryParams(raw);
  return scope.resolve("didar_catalog").database(async (db: any) => {
    const { query: q } = await catalogQuery(db, scope, params);
    if (product_id) q.where("p.product_id", product_id);
    const [{ count }] = await q.clone().countDistinct("p.product_id as count");
    const col: Record<string, string> = {
      newest: "p.published_at",
      name: "p.public_sort_name",
      weight: "p.public_weight_min",
      making_fee: "p.public_fee_min",
    };
    const rows = await q
      .clone()
      .select("p.*")
      .orderBy(
        col[params.sort],
        params.sort === "newest" ? "desc" : "asc",
        "last",
      )
      .orderBy("p.product_id")
      .limit(params.limit)
      .offset(params.offset);
    const products: any[] = [];
    for (const p of rows) {
      const n = await nativeProduct(scope, p.product_id),
        tree = await ancestry(scope, p.subcategory_id);
      const attrs = await db("didar_public_attribute as pa")
        .join(
          "didar_attribute_approval as aa",
          "aa.attribute_id",
          "pa.attribute_id",
        )
        .join("product_attribute as a", "a.id", "pa.attribute_id")
        .join("product_attribute_value as v", "v.id", "pa.value_id")
        .where({
          "pa.product_id": p.product_id,
          "aa.active": true,
          "a.is_active": true,
          "a.is_filterable": true,
          "v.is_active": true,
        })
        .whereNull("pa.deleted_at")
        .select(
          "a.id as attribute_id",
          "a.name",
          "a.handle",
          "v.id as value_id",
          "v.name as value",
        );
      products.push(safeProduct(p, n, tree, attrs));
    }
    if (product_id) {
      if (!products.length) fail(404, "NOT_FOUND", "Product not found");
      return { product: products[0] };
    }
    return {
      products,
      count: Number(count),
      limit: params.limit,
      offset: params.offset,
    };
  });
}
export async function facets(scope: any, actor: Actor, raw: any) {
  catalogAccess(actor);
  const params = queryParams(raw);
  return scope.resolve("didar_catalog").database(async (db: any) => {
    const { query: q } = await catalogQuery(db, scope, params);
    const bounds = await q
      .clone()
      .min("p.public_weight_min as weight_min")
      .max("p.public_weight_max as weight_max")
      .min("p.public_fee_min as fee_min")
      .max("p.public_fee_max as fee_max")
      .first();
    const values = await q
      .clone()
      .distinct("p.karat", "p.material", "p.type_id");
    const category_counts = await q
      .clone()
      .select("p.root_category_id as category_id", "p.subcategory_id")
      .countDistinct("p.product_id as count")
      .groupBy("p.root_category_id", "p.subcategory_id");
    return {
      ...(await definitions(scope, actor)),
      bounds,
      values,
      category_counts,
    };
  });
}
export async function internalProducts(
  scope: any,
  actor: Actor,
  raw: any,
  product_id?: string,
) {
  permit(
    actor,
    actor.kind === "DIDAR" ? "product.read" : "product.read_own",
    actor.kind === "DIDAR" ? "DIDAR" : "SUPPLIER",
  );
  const params = queryParams(raw, true);
  if (
    actor.kind === "SUPPLIER" &&
    params.supplier_id &&
    params.supplier_id !== actor.seller_id
  )
    fail(
      403,
      "FORGED_SUPPLIER",
      "Supplier filter is outside your organization",
    );
  return scope.resolve("didar_catalog").database(async (db: any) => {
    const q = db("didar_catalog_profile as p").whereNull("p.deleted_at");
    if (actor.kind === "SUPPLIER")
      q.whereExists(
        db("didar_submission as s")
          .select(db.raw("1"))
          .whereRaw("s.product_id=p.product_id")
          .where({ "s.owner_organization_id": actor.organization_id })
          .whereNull("s.superseded_at"),
      );
    if (product_id) q.where("p.product_id", product_id);
    if (params.category_id) q.where("p.root_category_id", params.category_id);
    if (params.subcategory_id)
      q.where("p.subcategory_id", params.subcategory_id);
    if (params.created_from) q.where("p.created_at", ">=", params.created_from);
    if (params.created_to) q.where("p.created_at", "<=", params.created_to);
    if (params.q)
      q.where((sub: any) =>
        sub
          .whereILike("p.product_code", `%${params.q}%`)
          .orWhereExists(
            db("didar_submission as s")
              .join("didar_candidate as c", "c.id", "s.candidate_id")
              .select(db.raw("1"))
              .whereRaw("s.product_id=p.product_id")
              .whereNull("s.superseded_at")
              .whereILike("c.title", `%${params.q}%`),
          ),
      );
    if (params.supplier_id)
      q.whereExists(
        db("didar_offer_profile as o")
          .select(db.raw("1"))
          .whereRaw("o.product_id=p.product_id")
          .where({ "o.seller_id": params.supplier_id })
          .whereNull("o.deleted_at"),
      );
    if (params.state)
      q.whereExists(
        db("didar_submission as s")
          .select(db.raw("1"))
          .whereRaw("s.product_id=p.product_id")
          .where({ "s.state": params.state })
          .whereNull("s.superseded_at")
          .modify((sub: any) => {
            if (actor.kind === "SUPPLIER")
              sub.where("s.owner_organization_id", actor.organization_id);
          }),
      );
    const [{ count }] = await q.clone().countDistinct("p.product_id as count");
    const rows = await q
        .select("p.*")
        .orderBy("p.created_at", "desc")
        .orderBy("p.product_id")
        .limit(params.limit)
        .offset(params.offset),
      products: any[] = [];
    for (const profile of rows) {
      const sq = db("didar_submission")
        .where({ product_id: profile.product_id })
        .whereNull("superseded_at")
        .orderBy("created_at", "desc");
      if (actor.kind === "SUPPLIER")
        sq.where({ owner_organization_id: actor.organization_id });
      const submissions = await sq,
        latest = submissions[0],
        candidate = latest
          ? await db("didar_candidate")
              .where({ id: latest.candidate_id })
              .first()
          : null;
      const oq = db("didar_offer_profile")
        .where({ product_id: profile.product_id })
        .whereNull("deleted_at");
      if (actor.kind === "SUPPLIER")
        oq.where({ owner_organization_id: actor.organization_id });
      const offers = await oq;
      for (const o of offers) {
        o.terms = await db("didar_offer_revision")
          .where({ offer_id: o.offer_id })
          .orderBy("revision", "desc")
          .first();
        o.active_terms = o.active_revision_id
          ? await db("didar_offer_revision")
              .where({ id: o.active_revision_id })
              .first()
          : null;
      }
      products.push({
        profile,
        candidate,
        submission: latest ?? null,
        offers,
        ...(actor.kind === "DIDAR" ? { submissions } : {}),
      });
    }
    if (product_id) {
      if (!products.length) fail(404, "NOT_FOUND", "Product not found");
      return { product: products[0] };
    }
    return {
      products,
      count: Number(count),
      offset: params.offset,
      limit: params.limit,
    };
  });
}
export async function reviews(
  scope: any,
  actor: Actor,
  raw: any,
  submission_id?: string,
) {
  permit(actor, "product.review", "DIDAR");
  const params = queryParams(raw, true);
  return scope.resolve("didar_catalog").database(async (db: any) => {
    const q = db("didar_submission as s")
      .join("didar_candidate as c", "c.id", "s.candidate_id")
      .join("didar_organization as o", "o.id", "s.owner_organization_id")
      .join("product_category as leaf", "leaf.id", "c.subcategory_id")
      .whereNull("s.deleted_at")
      .whereNull("s.superseded_at");
    if (submission_id) q.where("s.id", submission_id);
    for (const [k, col] of Object.entries({
      state: "s.state",
      supplier_id: "o.seller_id",
      actor_id: "s.submitted_by",
      category_id: "leaf.parent_category_id",
      subcategory_id: "c.subcategory_id",
      product_id: "s.product_id",
    }))
      if (params[k]) q.where(col, params[k]);
    if (params.submitted_from)
      q.where("s.submitted_at", ">=", params.submitted_from);
    if (params.submitted_to)
      q.where("s.submitted_at", "<=", params.submitted_to);
    if (params.q)
      q.where((sub: any) =>
        sub
          .whereILike("c.product_code", `%${params.q}%`)
          .orWhereILike("c.title", `%${params.q}%`),
      );
    const [{ count }] = await q.clone().countDistinct("s.id as count");
    const rows = await q
      .select(
        "s.*",
        "o.name as supplier_name",
        "o.seller_id",
        "c.title",
        "c.product_code",
      )
      .orderBy("s.submitted_at", "asc", "last")
      .orderBy("s.id")
      .limit(params.limit)
      .offset(params.offset);
    if (submission_id) {
      const s = rows[0];
      if (!s) fail(404, "NOT_FOUND", "Review not found");
      const candidate = await db("didar_candidate")
          .where({ id: s.candidate_id })
          .first(),
        profile = await db("didar_catalog_profile")
          .where({ product_id: s.product_id })
          .first();
      const offers = await db("didar_submission_offer as so")
        .join("didar_offer_revision as r", "r.id", "so.revision_id")
        .where({ "so.submission_id": s.id })
        .select("r.*");
      const history = await db("didar_catalog_event")
        .where({ product_id: s.product_id })
        .orderBy("occurred_at", "asc");
      const published_candidate = profile.published_candidate_id
        ? await db("didar_candidate")
            .where({ id: profile.published_candidate_id })
            .first()
        : null;
      return {
        review: s,
        candidate,
        profile,
        published_candidate,
        offers,
        history,
      };
    }
    return {
      reviews: rows,
      count: Number(count),
      offset: params.offset,
      limit: params.limit,
    };
  });
}
export async function offers(
  scope: any,
  actor: Actor,
  raw: any,
  offer_id?: string,
) {
  permit(
    actor,
    actor.kind === "DIDAR" ? "supplier_offer.read" : "supplier_offer.read_own",
    actor.kind === "DIDAR" ? "DIDAR" : "SUPPLIER",
  );
  const params = queryParams(raw, true);
  if (
    actor.kind === "SUPPLIER" &&
    params.supplier_id &&
    params.supplier_id !== actor.seller_id
  )
    fail(
      403,
      "FORGED_SUPPLIER",
      "Supplier filter is outside your organization",
    );
  return scope.resolve("didar_catalog").database(async (db: any) => {
    const q = db("didar_offer_profile as o")
      .join("offer as native_offer", "native_offer.id", "o.offer_id")
      .whereNull("native_offer.deleted_at")
      .whereRaw(
        "native_offer.product_id=o.product_id and native_offer.seller_id=o.seller_id",
      )
      .joinRaw(
        "join lateral (select * from didar_offer_revision r where r.offer_id=o.offer_id order by r.revision desc limit 1) r on true",
      )
      .whereNull("o.deleted_at");
    if (actor.kind === "SUPPLIER")
      q.where("o.owner_organization_id", actor.organization_id);
    if (offer_id) q.where("o.offer_id", offer_id);
    for (const [k, col] of Object.entries({
      product_id: "o.product_id",
      supplier_id: "o.seller_id",
      status: "o.status",
    }))
      if (params[k]) q.where(col, params[k]);
    for (const [k, expression, op] of [
      ["weight_min", "coalesce(r.weight_max,r.exact_weight)", ">="],
      ["weight_max", "coalesce(r.weight_min,r.exact_weight)", "<="],
      ["fee_min", "coalesce(r.making_fee_max,r.making_fee_value)", ">="],
      ["fee_max", "coalesce(r.making_fee_min,r.making_fee_value)", "<="],
    ])
      if (params[k] != null) q.whereRaw(`${expression} ${op} ?`, [params[k]]);
    if (params.q)
      q.where((sub: any) =>
        sub
          .whereILike("r.supplier_product_code", `%${params.q}%`)
          .orWhereIn(
            "o.product_id",
            db("didar_catalog_profile")
              .select("product_id")
              .whereILike("product_code", `%${params.q}%`),
          ),
      );
    if (params.created_from) q.where("o.created_at", ">=", params.created_from);
    if (params.created_to) q.where("o.created_at", "<=", params.created_to);
    const [{ count }] = await q.clone().countDistinct("o.offer_id as count");
    const rows = await q
      .select(
        "o.*",
        "r.id as revision_id",
        "r.revision",
        "r.weight_type",
        "r.exact_weight",
        "r.weight_min",
        "r.weight_max",
        "r.making_fee_type",
        "r.making_fee_value",
        "r.making_fee_min",
        "r.making_fee_max",
        "r.availability_type",
        "r.lead_time_days",
        "r.supplier_product_code",
      )
      .orderBy("o.created_at", "desc")
      .orderBy("o.offer_id")
      .limit(params.limit)
      .offset(params.offset);
    if (offer_id) {
      if (!rows.length) fail(404, "NOT_FOUND", "Offer not found");
      return { offer: rows[0] };
    }
    return {
      offers: rows,
      count: Number(count),
      offset: params.offset,
      limit: params.limit,
    };
  });
}
export async function events(scope: any, actor: Actor, raw: any) {
  permit(actor, "product.audit", "DIDAR");
  const p = queryParams(raw, true);
  return scope.resolve("didar_catalog").database(async (db: any) => {
    const q = db("didar_catalog_event");
    if (p.product_id) q.where({ product_id: p.product_id });
    if (p.actor_id) q.where({ actor_id: p.actor_id });
    if (p.created_from) q.where("occurred_at", ">=", p.created_from);
    if (p.created_to) q.where("occurred_at", "<=", p.created_to);
    if (p.supplier_id)
      q.whereIn(
        "owner_organization_id",
        db("didar_organization")
          .select("id")
          .where({ seller_id: p.supplier_id }),
      );
    const [{ count }] = await q.clone().count("id as count"),
      rows = await q
        .orderBy("occurred_at", "desc")
        .orderBy("id")
        .limit(p.limit)
        .offset(p.offset);
    return {
      events: rows,
      count: Number(count),
      limit: p.limit,
      offset: p.offset,
    };
  });
}
export async function reports(scope: any, actor: Actor, raw: any) {
  permit(actor, "product.report", "DIDAR");
  const p = queryParams(raw, true);
  return scope.resolve("didar_catalog").database(async (db: any) => {
    const q = db("didar_catalog_profile as p")
      .leftJoin("didar_offer_profile as o", "o.product_id", "p.product_id")
      .leftJoin(
        "didar_organization as supplier",
        "supplier.id",
        "o.owner_organization_id",
      )
      .whereNull("p.deleted_at")
      .whereNull("o.deleted_at");
    if (p.supplier_id) q.where("o.seller_id", p.supplier_id);
    if (p.product_id) q.where("p.product_id", p.product_id);
    if (p.category_id) q.where("p.root_category_id", p.category_id);
    if (p.subcategory_id) q.where("p.subcategory_id", p.subcategory_id);
    if (p.state)
      q.whereExists(
        db("didar_submission as s")
          .select(db.raw("1"))
          .whereRaw("s.product_id=p.product_id")
          .where({ "s.state": p.state })
          .whereNull("s.superseded_at"),
      );
    if (p.q)
      q.where((sub: any) =>
        sub
          .whereILike("p.product_code", `%${p.q}%`)
          .orWhereILike("p.public_sort_name", `%${p.q}%`),
      );
    if (p.created_from) q.where("p.created_at", ">=", p.created_from);
    if (p.created_to) q.where("p.created_at", "<=", p.created_to);
    if (p.actor_id)
      q.whereExists(
        db("didar_catalog_event as e")
          .select(db.raw("1"))
          .whereRaw("e.product_id=p.product_id")
          .where({ "e.actor_id": p.actor_id }),
      );
    const totals = await q
      .clone()
      .countDistinct("p.product_id as product_count")
      .countDistinct("o.offer_id as offer_count")
      .first();
    const rows = await q
      .select(
        "p.product_id",
        "p.product_code",
        "p.root_category_id",
        "p.subcategory_id",
        "p.publication_state",
        "p.created_by",
        "p.updated_by",
        "p.created_at",
        "p.updated_at",
        "o.offer_id",
        "o.seller_id",
        "o.status as offer_status",
        "o.active_revision_id",
        "supplier.name as supplier_name",
      )
      .orderBy("p.product_id")
      .orderBy("o.offer_id")
      .limit(p.limit)
      .offset(p.offset);
    return {
      grain: "PRODUCT_SUPPLIER_OFFER",
      totals: {
        product_count: Number(totals.product_count),
        offer_count: Number(totals.offer_count),
      },
      rows,
      limit: p.limit,
      offset: p.offset,
    };
  });
}
export function csv(rows: any[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const cell = (v: any) =>
    `"${String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  return [
    keys.map(cell).join(","),
    ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
  ].join("\r\n");
}
