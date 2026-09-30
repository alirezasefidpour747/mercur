import type { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  createSellerAccountWorkflow,
  approveSellerWorkflow,
} from "@mercurjs/core/workflows";
import { graph } from "../modules/didar-catalog/native";
import {
  Actor,
  id,
  rolePermissions,
  publicTermKeys,
} from "../modules/didar-catalog/domain";
import { execute, event } from "../modules/didar-catalog/commands";
import {
  createProduct,
  createOffer,
  editProduct,
  submit,
  review,
} from "../modules/didar-catalog/write";

export default async function seedP01({ container }: ExecArgs) {
  const scope: any = container,
    logger = container.resolve("logger"),
    password = process.env.P01_SEED_PASSWORD;
  if (!password || password.length < 12)
    throw new Error(
      "Set P01_SEED_PASSWORD (at least 12 characters) for P01 fixture accounts",
    );
  const service = scope.resolve("didar_catalog"),
    auth = scope.resolve(Modules.AUTH),
    product = scope.resolve(Modules.PRODUCT),
    sellerService = scope.resolve("seller");
  const [store] = await scope
    .resolve(Modules.STORE)
    .listStores({}, { relations: ["supported_currencies"] });
  const currency = store?.supported_currencies?.find(
    (v: any) => v.is_default,
  )?.currency_code;
  if (!currency)
    throw new Error(
      "Configure a native default Store currency first; P01 does not invent a Supplier native currency or making-fee unit",
    );
  const fulfillment = scope.resolve(Modules.FULFILLMENT);
  if (!(await fulfillment.listShippingProfiles({ type: "default" })).length)
    await fulfillment.createShippingProfiles({
      name: "Default",
      type: "default",
    });
  async function actor(
    kind: Actor["kind"],
    email: string,
    name: string,
    role: string,
  ): Promise<Actor> {
    const type =
        kind === "SUPPLIER" ? "member" : kind === "DIDAR" ? "user" : "customer",
      input = {
        body: { email, password },
        headers: {},
        query: {},
        url: "seed-p01",
        protocol: "http",
      };
    let credentials = await auth.authenticate("emailpass", input);
    if (!credentials.success)
      credentials = await auth.register("emailpass", input);
    if (!credentials.success || !credentials.authIdentity)
      throw new Error(`Cannot provision fixture account ${email}`);
    const identity = credentials.authIdentity;
    let native: any, seller: any;
    if (kind === "SUPPLIER") {
      [seller] = await sellerService.listSellers({ email });
      if (!seller)
        seller = (
          await createSellerAccountWorkflow(scope).run({
            input: {
              auth_identity_id: identity.id,
              member_email: email,
              seller: { name, email, currency_code: currency },
            },
          })
        ).result;
      if (seller.status === "pending_approval")
        await approveSellerWorkflow(scope).run({
          input: { seller_id: seller.id },
        });
      [native] = await graph(scope, "member", ["id"], { email });
    } else {
      const nativeService = scope.resolve(
        kind === "DIDAR" ? Modules.USER : Modules.CUSTOMER,
      );
      [native] =
        kind === "DIDAR"
          ? await nativeService.listUsers({ email })
          : await nativeService.listCustomers({ email });
      if (!native)
        native =
          kind === "DIDAR"
            ? await nativeService.createUsers({ email, first_name: name })
            : await nativeService.createCustomers({
                email,
                first_name: name,
                has_account: true,
              });
    }
    await auth.updateAuthIdentities({
      id: identity.id,
      app_metadata: { ...identity.app_metadata, [`${type}_id`]: native.id },
    });
    return service.database(async (db: any) => {
      let org = await db("didar_organization")
        .where(kind === "DIDAR" ? { kind: "DIDAR" } : { kind, name })
        .first();
      if (!org) {
        org = {
          id: id("org"),
          kind,
          name,
          seller_id: seller?.id ?? null,
          active: true,
        };
        await db("didar_organization").insert(org);
      }
      let membership = await db("didar_membership")
        .where({
          actor_id: native.id,
          actor_type: type,
          organization_id: org.id,
        })
        .first();
      if (!membership) {
        membership = {
          id: id("dmem"),
          actor_id: native.id,
          actor_type: type,
          organization_id: org.id,
          active: true,
        };
        await db("didar_membership").insert(membership);
      }
      for (const permission of rolePermissions[role] ?? [])
        if (
          !(await db("didar_grant")
            .where({ membership_id: membership.id, permission })
            .first())
        )
          await db("didar_grant").insert({
            id: id("dgrant"),
            membership_id: membership.id,
            role,
            permission,
          });
      return {
        id: native.id,
        type,
        organization_id: org.id,
        kind,
        seller_id: seller?.id ?? null,
        permissions: rolePermissions[role] ?? [],
        roles: [role],
      };
    });
  }
  const ops = await actor(
      "DIDAR",
      "p01.ops@example.test",
      "Didar Product Ops",
      "PRODUCT_OPS",
    ),
    suppliers: Actor[] = [];
  for (let i = 1; i <= 3; i++)
    suppliers.push(
      await actor(
        "SUPPLIER",
        `p01.supplier${i}@example.test`,
        `P01 Supplier ${i}`,
        "SUPPLIER_PRODUCT_OPERATOR",
      ),
    );
  for (let i = 1; i <= 2; i++)
    await actor(
      "RETAILER",
      `p01.retailer${i}@example.test`,
      `P01 Retailer ${i}`,
      "RETAILER_PROCUREMENT",
    );
  await actor(
    "DIDAR",
    "p01.no-product-permission@example.test",
    "P01 No Product Permission",
    "NO_PRODUCT_ROLE",
  );
  async function category(handle: string, name: string, parent?: string) {
    return execute(
      scope,
      ops,
      `category:${handle}`,
      {
        idempotency_key: `seed-category-${handle}`,
        handle,
        name,
        parent: parent ?? null,
      },
      async (tx, receipt) => {
        let [c] = await product.listProductCategories({ handle });
        const existed = !!c;
        if (!c)
          c = await product.createProductCategories({
            handle,
            name,
            parent_category_id: parent ?? null,
            is_active: true,
            is_internal: false,
          });
        await event(tx, ops, receipt, {
          entity_type: parent ? "SUBCATEGORY" : "CATEGORY",
          entity_id: c.id,
          category_id: parent ?? c.id,
          subcategory_id: parent ? c.id : null,
          owner_organization_id: ops.organization_id,
          event_code: existed ? "CATEGORY_FIXTURE_LINKED" : "CATEGORY_CREATED",
        });
        return c;
      },
    );
  }
  const daily = await category("p01-daily", "Daily Gold"),
    occasion = await category("p01-occasion", "Occasion Gold");
  const leaves = [
    await category("p01-rings", "Rings", daily.id),
    await category("p01-bracelets", "Bracelets", daily.id),
    await category("p01-necklaces", "Necklaces", occasion.id),
  ];
  let [type] = await product.listProductTypes({ value: "P01 Jewelry" });
  if (!type) type = await product.createProductTypes({ value: "P01 Jewelry" });
  const attrs = scope.resolve("product_attribute");
  let [finish] = await attrs.listProductAttributes({ handle: "p01-finish" });
  if (!finish)
    finish = await attrs.createProductAttributes({
      handle: "p01-finish",
      name: "Finish",
      type: "single_select",
      is_filterable: true,
      is_variant_axis: false,
      is_active: true,
    });
  let [polished] = await attrs.listProductAttributeValues({
    attribute_id: finish.id,
    handle: "polished",
  });
  if (!polished)
    polished = await attrs.createProductAttributeValues({
      attribute_id: finish.id,
      name: "Polished",
      handle: "polished",
      is_active: true,
    });
  await service.database(async (db: any) => {
    if (
      !(await db("didar_attribute_approval")
        .where({ attribute_id: finish.id })
        .first())
    )
      await db("didar_attribute_approval").insert({
        id: id("dattr"),
        attribute_id: finish.id,
        handle: finish.handle,
        approved_by: ops.id,
        approved_at: new Date(),
        active: true,
      });
  });
  for (let i = 0; i < 5; i++) {
    const code = `P01-${1001 + i}`,
      supplier = suppliers[i % 3];
    // Replay the same durable commands to resume an interrupted fixture journey.
    const productData = {
      title: `Gold ${["Ring", "Bracelet", "Necklace"][i % 3]} ${i + 1}`,
      handle: `p01-gold-${i + 1}`,
      product_code: code,
      description: "Persisted P01 fixture",
      technical_description: "Common 18-karat specification",
      karat: 18,
      material: "gold",
      subcategory_id: leaves[i % 3].id,
      type_id: type.id,
      images: [],
      attribute_value_ids: [polished.id],
    };
    const terms = {
      weight_type: "RANGE",
      weight_min: String(5 + i),
      weight_max: String(8 + i),
      making_fee_type: i % 2 ? "PERCENT" : "RANGE_PERCENT",
      ...(i % 2
        ? { making_fee_value: "14" }
        : { making_fee_min: "12", making_fee_max: "16" }),
      availability_type: "MADE_TO_ORDER",
      lead_time_days: 14,
    };
    const created = await createProduct(scope, supplier, {
      expected_version: 1,
      idempotency_key: `seed-create-${code}`,
      product: productData,
      terms,
    });
    let s = created.submission;
    if (i === 0) {
      const sent = await submit(scope, supplier, created.product_id, {
        expected_version: s.version,
        idempotency_key: `seed-first-submit-${code}`,
      });
      const changed = await review(scope, ops, s.id, "request_changes", {
        expected_version: sent.submission.version,
        idempotency_key: `seed-changes-${code}`,
        reason: "Clarify technical description",
      });
      s = (
        await editProduct(scope, supplier, created.product_id, {
          expected_version: changed.review.version,
          idempotency_key: `seed-correct-${code}`,
          product: {
            ...productData,
            technical_description: "Reviewed common 18-karat specification",
          },
        })
      ).submission;
    }
    const sent = await submit(scope, supplier, created.product_id, {
      expected_version: s.version,
      idempotency_key: `seed-submit-${code}`,
    });
    const public_terms =
      i === 4
        ? Object.fromEntries(publicTermKeys.map((k) => [k, null]))
        : {
            public_weight_min: "6",
            public_weight_max: "9",
            public_fee_min: "14",
            public_fee_max: "18",
          };
    const approved = await review(scope, ops, s.id, "approve", {
      expected_version: sent.submission.version,
      idempotency_key: `seed-approve-${code}`,
      public_terms,
    });
    await review(scope, ops, s.id, "publish", {
      expected_version: approved.review.version,
      idempotency_key: `seed-publish-${code}`,
    });
    if (i === 0) {
      const second = await createOffer(scope, suppliers[1], {
        expected_version: 1,
        idempotency_key: `seed-second-offer-${code}`,
        product_id: created.product_id,
        terms: {
          weight_type: "EXACT",
          exact_weight: "7.5",
          making_fee_type: "PERCENT",
          making_fee_value: "13",
          availability_type: "AVAILABLE",
          lead_time_days: 3,
        },
      });
      const sent2 = await submit(scope, suppliers[1], created.product_id, {
        expected_version: second.submission.version,
        idempotency_key: `seed-second-submit-${code}`,
      });
      const c = await service.database((db: any) =>
        db("didar_candidate")
          .where({ id: second.submission.candidate_id })
          .first(),
      );
      const approved2 = await review(
        scope,
        ops,
        second.submission.id,
        "approve",
        {
          expected_version: sent2.submission.version,
          idempotency_key: `seed-second-approve-${code}`,
          public_terms: Object.fromEntries(
            publicTermKeys.map((k) => [k, c[k]]),
          ),
        },
      );
      await review(scope, ops, second.submission.id, "publish", {
        expected_version: approved2.review.version,
        idempotency_key: `seed-second-publish-${code}`,
      });
    }
  }
  const keys = scope.resolve(Modules.API_KEY);
  let [key] = await keys.listApiKeys({ title: "Didar P01 storefront" });
  if (!key)
    key = await keys.createApiKeys({
      title: "Didar P01 storefront",
      type: "publishable",
      created_by: ops.id,
    });
  logger.info(`P01 fixtures persisted; public storefront key: ${key.token}`);
}
