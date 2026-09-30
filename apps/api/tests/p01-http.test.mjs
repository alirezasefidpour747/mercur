import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// This suite always calls the real running Medusa server. No transport mocks.
// Use an isolated database with native migrations and seed:p01 already applied.
const origin = process.env.P01_API_URL ?? "http://127.0.0.1:9000";
const password = process.env.P01_SEED_PASSWORD;
const key = process.env.P01_PUBLISHABLE_KEY;
async function request(path, actor, method = "GET", body, extra = {}) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "x-publishable-api-key": key } : {}),
      ...(actor
        ? {
            Authorization: `Bearer ${actor.token}`,
            ...(actor.seller_id ? { "x-seller-id": actor.seller_id } : {}),
          }
        : {}),
      ...extra,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  return { status: response.status, data };
}
async function ok(path, actor, method, body) {
  const r = await request(path, actor, method, body);
  assert.equal(r.status, 200, `${path}: ${JSON.stringify(r.data)}`);
  return r.data;
}
async function login(type, email) {
  const r = await request(`/auth/${type}/emailpass`, null, "POST", {
    email,
    password,
  });
  assert.equal(r.status, 200, `Real fixture login failed: ${email}`);
  const actor = { token: r.data.token };
  if (type === "member") {
    const sellers = await ok("/vendor/sellers", actor);
    actor.seller_id = sellers.sellers[0].id;
  }
  return actor;
}
const command = (version, fields = {}) => ({
  expected_version: version,
  idempotency_key: randomUUID(),
  ...fields,
});
const forbiddenKeys = new Set([
  "seller_id",
  "supplier_id",
  "offer_id",
  "offers",
  "offer_ids",
  "metadata",
  "variants",
  "inventory_quantity",
  "inventory_items",
  "stock_location",
  "lead_time_days",
  "uid",
  "supplier_product_code",
  "making_fee_value",
]);
function safe(value) {
  if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) {
      assert.ok(!forbiddenKeys.has(k), `Retailer DTO leaked ${k}`);
      safe(v);
    }
}

test("P01 real Medusa API journey and authorization", async (t) => {
  // An unavailable runtime fails preflight; it is never treated as a passed or mocked journey.
  const health = await fetch(`${origin}/health`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(health.status, 200);
  assert.ok(password, "P01_SEED_PASSWORD is required");
  assert.ok(key, "P01_PUBLISHABLE_KEY is required");
  const a = await login("member", "p01.supplier1@example.test"),
    b = await login("member", "p01.supplier2@example.test"),
    ops = await login("user", "p01.ops@example.test"),
    retailer = await login("customer", "p01.retailer1@example.test"),
    noRole = await login("user", "p01.no-product-permission@example.test");
  let productId, submissionId, version, offerId;
  await t.test("seed catalog, native identity and real filters", async () => {
    const tree = await ok("/store/b2b/catalog/categories", retailer);
    assert.ok(tree.categories.length >= 2);
    assert.ok(tree.categories.flatMap((c) => c.children).length >= 3);
    const all = await ok(
      "/store/b2b/catalog/products?limit=1&sort=name",
      retailer,
    );
    assert.ok(all.count >= 5);
    assert.equal(all.products.length, 1);
    safe(all);
    const second = await ok(
      "/store/b2b/catalog/products?limit=1&offset=1&sort=name",
      retailer,
    );
    assert.notEqual(second.products[0].id, all.products[0].id);
    const p = all.products[0],
      detail = await ok(`/store/b2b/catalog/products/${p.id}`, retailer);
    safe(detail);
    assert.equal(detail.product.id, p.id);
    for (const filter of [
      `category_id=${p.category.id}`,
      `subcategory_id=${p.subcategory.id}`,
      `karat=${p.karat}`,
      `material=${p.material}`,
      `q=${encodeURIComponent(p.product_code)}`,
    ]) {
      const r = await ok(`/store/b2b/catalog/products?${filter}`, retailer);
      assert.ok(r.products.some((v) => v.id === p.id));
      safe(r);
    }
    assert.equal(
      (
        await request(
          "/store/b2b/catalog/products?weight_min=9&weight_max=2",
          retailer,
        )
      ).status,
      422,
    );
    assert.equal(
      (
        await request(
          "/store/b2b/catalog/products?fields=+offers.seller,metadata",
          retailer,
        )
      ).status,
      422,
    );
  });
  await t.test(
    "alternate native routes and missing permissions fail closed",
    async () => {
      for (const path of [
        "/store/products",
        "/store/product-categories",
        "/store/product-variants",
        "/store/offers",
        "/store/products?fields=*offers,*variants.inventory_items,+metadata",
      ])
        assert.equal((await request(path, retailer)).status, 403);
      assert.equal(
        (await request("/admin/b2b/product-reviews", noRole)).status,
        403,
      );
      assert.equal((await request("/vendor/products", a)).status, 403);
      assert.equal(
        (
          await request("/vendor/b2b/products", a, "GET", null, {
            "x-didar-organization-id": "org_forged",
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "supplier draft persists and cross-supplier access fails",
    async () => {
      const categories = await ok("/vendor/b2b/catalog/categories", a);
      const code = `API-${randomUUID().slice(0, 8)}`;
      const payload = command(1, {
        product: {
          title: "P01 HTTP Gold Ring",
          handle: code.toLowerCase(),
          product_code: code,
          description: "HTTP integration",
          technical_description: "18K common specification",
          karat: 18,
          material: "gold",
          subcategory_id: categories.categories[0].children[0].id,
          images: [],
          attribute_value_ids: [],
        },
        terms: {
          weight_type: "RANGE",
          weight_min: "5",
          weight_max: "8",
          making_fee_type: "RANGE_PERCENT",
          making_fee_min: "12",
          making_fee_max: "16",
          availability_type: "MADE_TO_ORDER",
          lead_time_days: 14,
        },
      });
      const created = await ok("/vendor/b2b/products", a, "POST", payload);
      productId = created.product_id;
      submissionId = created.submission.id;
      version = created.submission.version;
      offerId = created.offer_id;
      assert.deepEqual(
        await ok("/vendor/b2b/products", a, "POST", payload),
        created,
      );
      assert.equal(
        (
          await request("/vendor/b2b/products", a, "POST", {
            ...payload,
            terms: { ...payload.terms, making_fee_min: "11" },
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/vendor/b2b/products", a, "POST", {
            ...payload,
            idempotency_key: randomUUID(),
            seller_id: b.seller_id,
          })
        ).status,
        422,
      );
      assert.equal(
        (await request(`/vendor/b2b/products/${productId}`, b)).status,
        404,
      );
      assert.equal(
        (await request(`/vendor/b2b/offers/${offerId}`, b)).status,
        404,
      );
      assert.equal(
        (await request(`/store/b2b/catalog/products/${productId}`, retailer))
          .status,
        404,
      );
      const fixed = command(1, {
        product_id: productId,
        terms: {
          weight_type: "EXACT",
          exact_weight: "7",
          making_fee_type: "FIXED",
          making_fee_value: "10",
          availability_type: "AVAILABLE",
        },
      });
      assert.equal(
        (await request("/vendor/b2b/offers", a, "POST", fixed)).status,
        422,
      );
    },
  );
  await t.test(
    "review, changes, approval and publication are separate",
    async () => {
      let sent = await ok(
        `/vendor/b2b/products/${productId}/submit`,
        a,
        "POST",
        command(version),
      );
      version = sent.submission.version;
      let changed = await ok(
        `/admin/b2b/product-reviews/${submissionId}/request-changes`,
        ops,
        "POST",
        command(version, { reason: "Clarify specification" }),
      );
      version = changed.review.version;
      const own = await ok(`/vendor/b2b/products/${productId}`, a);
      const p = own.product.candidate;
      const edited = await ok(
        `/vendor/b2b/products/${productId}`,
        a,
        "PATCH",
        command(version, {
          product: Object.fromEntries(
            [
              "title",
              "handle",
              "product_code",
              "description",
              "technical_description",
              "karat",
              "material",
              "subcategory_id",
              "type_id",
              "images",
              "attribute_value_ids",
            ].map((k) => [
              k,
              k === "technical_description" ? "Corrected specification" : p[k],
            ]),
          ),
        }),
      );
      submissionId = edited.submission.id;
      version = edited.submission.version;
      sent = await ok(
        `/vendor/b2b/products/${productId}/submit`,
        a,
        "POST",
        command(version),
      );
      version = sent.submission.version;
      const approved = await ok(
        `/admin/b2b/product-reviews/${submissionId}/approve`,
        ops,
        "POST",
        command(version, {
          public_terms: {
            public_weight_min: "6",
            public_weight_max: "9",
            public_fee_min: "14",
            public_fee_max: "18",
          },
        }),
      );
      version = approved.review.version;
      assert.equal(approved.review.state, "APPROVED");
      assert.equal(
        (await request(`/store/b2b/catalog/products/${productId}`, retailer))
          .status,
        404,
      );
      const stale = await request(
        `/admin/b2b/product-reviews/${submissionId}/publish`,
        ops,
        "POST",
        command(version - 1),
      );
      assert.equal(stale.status, 409);
      const payload = command(version),
        results = await Promise.all([
          request(
            `/admin/b2b/product-reviews/${submissionId}/publish`,
            ops,
            "POST",
            payload,
          ),
          request(
            `/admin/b2b/product-reviews/${submissionId}/publish`,
            ops,
            "POST",
            payload,
          ),
        ]);
      for (const r of results) assert.equal(r.status, 200);
      assert.deepEqual(results[0].data, results[1].data);
      const visible = await ok(
        `/store/b2b/catalog/products/${productId}`,
        retailer,
      );
      safe(visible);
      assert.equal(visible.product.indicative_weight.min, "6.000000");
    },
  );
  await t.test(
    "second native supplier Offer and distinct reporting counts",
    async () => {
      const second = await ok(
        "/vendor/b2b/offers",
        b,
        "POST",
        command(1, {
          product_id: productId,
          terms: {
            weight_type: "EXACT",
            exact_weight: "7.5",
            making_fee_type: "PERCENT",
            making_fee_value: "13",
            availability_type: "AVAILABLE",
          },
        }),
      );
      assert.notEqual(second.offer_id, offerId);
      assert.equal(
        (await request(`/vendor/b2b/offers/${second.offer_id}`, a)).status,
        404,
      );
      const report = await ok(
        `/admin/b2b/product-reports?product_id=${productId}`,
        ops,
      );
      assert.equal(report.totals.product_count, 1);
      assert.equal(report.totals.offer_count, 2);
      assert.ok(
        process.env.DATABASE_URL,
        "DATABASE_URL is required for native persistence assertions",
      );
      const { Client } = require("@medusajs/framework/pg"),
        db = new Client({ connectionString: process.env.DATABASE_URL });
      await db.connect();
      try {
        const variants = (
          await db.query(
            "select id,manage_inventory from product_variant where product_id=$1 and deleted_at is null",
            [productId],
          )
        ).rows;
        assert.equal(variants.length, 1);
        assert.equal(variants[0].manage_inventory, false);
        const nativeOffers = (
          await db.query(
            "select id,seller_id,variant_id,manage_inventory from offer where product_id=$1 and deleted_at is null",
            [productId],
          )
        ).rows;
        assert.equal(nativeOffers.length, 2);
        assert.deepEqual(
          new Set(nativeOffers.map((o) => o.seller_id)),
          new Set([a.seller_id, b.seller_id]),
        );
        for (const o of nativeOffers) {
          assert.equal(o.variant_id, variants[0].id);
          assert.equal(o.manage_inventory, false);
        }
        const ids = nativeOffers.map((o) => o.id);
        assert.equal(
          Number(
            (
              await db.query(
                "select count(*) as n from offer_inventory_item where offer_id=any($1)",
                [ids],
              )
            ).rows[0].n,
          ),
          0,
        );
        const priceLinks = (
          await db.query(
            "select table_name from information_schema.columns where table_schema='public' and column_name in ('offer_id','price_id') group by table_name having count(distinct column_name)=2",
          )
        ).rows;
        assert.ok(
          priceLinks.length > 0,
          "Native Offer-price link table must be present after native migrations",
        );
        for (const link of priceLinks) {
          assert.match(link.table_name, /^[a-z0-9_]+$/);
          assert.equal(
            Number(
              (
                await db.query(
                  `select count(*) as n from "${link.table_name}" where offer_id=any($1)`,
                  [ids],
                )
              ).rows[0].n,
            ),
            0,
          );
        }
      } finally {
        await db.end();
      }

      const history = await ok(
        `/admin/b2b/catalog-events?product_id=${productId}`,
        ops,
      );
      assert.ok(
        history.events.some((e) => e.event_code === "PRODUCT_PUBLISHED"),
      );
      for (const e of history.events) {
        assert.ok(e.actor_id);
        assert.ok(e.actor_organization_id);
        assert.ok(e.owner_organization_id);
        assert.ok(e.command_id);
      }
    },
  );
});
