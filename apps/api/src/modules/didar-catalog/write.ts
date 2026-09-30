import {
  Actor,
  fail,
  id,
  hash,
  permit,
  validateProduct,
  validateTerms,
  validatePublicTerms,
  command,
  nextState,
  fingerprint,
  productKeys,
  publicTermKeys,
} from "./domain";
import { own } from "./authorization";
import { execute, event, version } from "./commands";
import {
  ancestry,
  createNativeProduct,
  createNativeOffer,
  nativeProduct,
  stageNative,
  publishNative,
  updateNativeStatus,
  reviewNative,
  graph,
  nativeAttributes,
} from "./native";

const decimalCanonical = (value: any) =>
  value == null
    ? null
    : String(value)
        .replace(/(\.\d*?)0+$/, "$1")
        .replace(/\.$/, "");
const subset = (c: any, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, c[k] ?? null]));
const findProfile = async (tx: any, product_id: string) => {
  const p = await tx("didar_catalog_profile")
    .where({ product_id })
    .whereNull("deleted_at")
    .first();
  if (!p) fail(404, "NOT_FOUND", "Product not found");
  return p;
};
export async function latestSubmission(
  tx: any,
  actor: Actor,
  product_id: string,
) {
  const s = await tx("didar_submission")
    .where({ product_id, owner_organization_id: actor.organization_id })
    .whereNull("deleted_at")
    .whereNull("superseded_at")
    .orderBy("created_at", "desc")
    .first();
  if (!s) fail(404, "NOT_FOUND", "Submission not found");
  return s;
}
async function candidate(
  tx: any,
  scope: any,
  actor: Actor,
  p: any,
  data: any,
  prior: any = null,
) {
  const max = await tx("didar_candidate")
    .where({ product_id: p.product_id })
    .max("revision as revision")
    .first();
  const c = {
    id: id("dcandidate"),
    product_id: p.product_id,
    owner_organization_id: actor.organization_id,
    revision: Number(max?.revision ?? 0) + 1,
    ...data,
    created_by: actor.id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  c.native_change_id = await stageNative(
    scope,
    actor,
    c,
    prior &&
      JSON.stringify(prior.attribute_value_ids ?? []) ===
        JSON.stringify(c.attribute_value_ids ?? []) &&
      fingerprint(prior) === fingerprint(c) &&
      prior.subcategory_id === c.subcategory_id &&
      prior.product_code === c.product_code
      ? prior.native_change_id
      : null,
    tx,
  );
  await tx("didar_candidate").insert({
    ...c,
    images: JSON.stringify(c.images),
    attribute_value_ids: JSON.stringify(c.attribute_value_ids ?? []),
  });
  for (const attr of await nativeAttributes(
    scope,
    c.attribute_value_ids ?? [],
    tx,
  ))
    for (const value_id of attr.value_ids)
      await tx("didar_candidate_attribute").insert({
        id: id("dcattr"),
        candidate_id: c.id,
        attribute_id: attr.id,
        value_id,
      });
  return c;
}
async function offerRevision(tx: any, actor: Actor, offer: any, terms: any) {
  const last = await tx("didar_offer_revision")
    .where({ offer_id: offer.offer_id })
    .max("revision as revision")
    .first();
  const revision = {
    id: id("dterms"),
    offer_id: offer.offer_id,
    revision: Number(last?.revision ?? 0) + 1,
    ...terms,
    created_by: actor.id,
    actor_organization_id: actor.organization_id,
    owner_organization_id: offer.owner_organization_id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  await tx("didar_offer_revision").insert(revision);
  return revision;
}
async function newSubmission(
  tx: any,
  actor: Actor,
  c: any,
  prior: any = null,
  kind = "PRODUCT",
) {
  if (prior)
    await tx("didar_submission")
      .where({ id: prior.id })
      .update({ superseded_at: new Date(), updated_at: new Date() });
  const s = {
    id: id("dreview"),
    product_id: c.product_id,
    candidate_id: c.id,
    owner_organization_id: actor.organization_id,
    submission_kind: kind,
    state: prior?.state === "CHANGES_REQUESTED" ? "CHANGES_REQUESTED" : "DRAFT",
    version: (prior?.version ?? 0) + 1,
    previous_submission_id: prior?.id ?? null,
    reason: prior?.reason ?? null,
    created_by: actor.id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  await tx("didar_submission").insert(s);
  return s;
}
export async function createProduct(scope: any, actor: Actor, body: any) {
  permit(actor, "product.create_own", "SUPPLIER");
  const b = command(body, ["product", "terms"]),
    data = validateProduct(b.product),
    terms = validateTerms(b.terms);
  const tree = await ancestry(scope, data.subcategory_id);
  await nativeAttributes(scope, data.attribute_value_ids);
  return execute(
    scope,
    actor,
    `create:${data.product_code}`,
    { ...b, command_action: "create_product" },
    async (tx, receipt) => {
      const product_id = `prod_${hash(receipt.id).slice(0, 26)}`,
        offer_id = `offer_${hash(receipt.id + "offer").slice(0, 26)}`;
      if (
        await tx("didar_catalog_profile")
          .where({ product_code: data.product_code })
          .whereNull("deleted_at")
          .first()
      )
        fail(
          409,
          "PRODUCT_CODE_EXISTS",
          "Use the existing common Product identity",
        );
      const native = await createNativeProduct(
        scope,
        actor,
        data,
        product_id,
        tx,
      );
      const p = {
        id: id("dcatalog"),
        product_id,
        variant_id: native.variants[0].id,
        owner_organization_id: actor.organization_id,
        product_code: data.product_code,
        root_category_id: tree.root.id,
        subcategory_id: data.subcategory_id,
        karat: data.karat,
        material: data.material,
        technical_description: data.technical_description,
        publication_state: "DRAFT",
        version: 1,
        created_by: actor.id,
        updated_by: actor.id,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await tx("didar_catalog_profile").insert(p);
      const c = await candidate(tx, scope, actor, p, {
        ...data,
        ...Object.fromEntries(publicTermKeys.map((k) => [k, null])),
        public_terms_approved_by: null,
        public_terms_approved_at: null,
      });
      let s = await newSubmission(tx, actor, c);
      await createNativeOffer(scope, actor, p, offer_id);
      const o = {
        id: id("doffer"),
        offer_id,
        product_id,
        seller_id: actor.seller_id,
        owner_organization_id: actor.organization_id,
        status: "INACTIVE",
        version: 1,
        created_by: actor.id,
        updated_by: actor.id,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await tx("didar_offer_profile").insert(o);
      const revision = await offerRevision(tx, actor, o, terms);
      await tx("didar_submission")
        .where({ id: s.id })
        .update({ version: s.version + 1, updated_at: new Date() });
      s = { ...s, version: s.version + 1 };
      await event(tx, actor, receipt, {
        product_id,
        owner_organization_id: actor.organization_id,
        candidate_id: c.id,
        submission_id: s.id,
        event_code: "PRODUCT_CREATED",
        to_state: "DRAFT",
      });
      await event(tx, actor, receipt, {
        product_id,
        offer_id,
        owner_organization_id: actor.organization_id,
        event_code: "OFFER_CREATED",
        details: { revision_id: revision.id },
      });
      return { product_id, submission: s, offer_id };
    },
  );
}
export async function editProduct(
  scope: any,
  actor: Actor,
  product_id: string,
  body: any,
) {
  permit(actor, "product.update_own", "SUPPLIER");
  const b = command(body, ["product"]),
    data = validateProduct(b.product);
  await ancestry(scope, data.subcategory_id);
  await nativeAttributes(scope, data.attribute_value_ids);
  return execute(
    scope,
    actor,
    `product:${product_id}`,
    { ...b, command_action: "edit_product" },
    async (tx, receipt) => {
      const p = await findProfile(tx, product_id);
      own(actor, p.owner_organization_id);
      const s = await latestSubmission(tx, actor, product_id);
      version(s, b.expected_version);
      if (
        ![
          "DRAFT",
          "CHANGES_REQUESTED",
          "PUBLISHED",
          "REJECTED",
          "INACTIVE",
        ].includes(s.state)
      )
        fail(409, "INVALID_STATE", "This submission cannot be edited");
      if (
        await tx("didar_catalog_profile")
          .where({ product_code: data.product_code })
          .whereNot("product_id", product_id)
          .whereNull("deleted_at")
          .first()
      )
        fail(
          409,
          "PRODUCT_CODE_EXISTS",
          "Product code already belongs to another common identity",
        );
      const old = await tx("didar_candidate")
        .where({ id: s.candidate_id })
        .first();
      const c = await candidate(
        tx,
        scope,
        actor,
        p,
        {
          ...data,
          ...subset(old, publicTermKeys),
          public_terms_approved_by: null,
          public_terms_approved_at: null,
        },
        old,
      );
      const next = await newSubmission(tx, actor, c, s);
      await tx("didar_catalog_profile")
        .where({ id: p.id })
        .update({
          version: p.version + 1,
          updated_by: actor.id,
          updated_at: new Date(),
        });
      await event(tx, actor, receipt, {
        product_id,
        owner_organization_id: p.owner_organization_id,
        submission_id: next.id,
        candidate_id: c.id,
        event_code: "PRODUCT_EDITED",
        from_state: s.state,
        to_state: next.state,
        details: {
          previous_candidate_id: old.id,
          previous_submission_id: s.id,
        },
      });
      return { product_id, submission: next };
    },
  );
}
export async function createOffer(scope: any, actor: Actor, body: any) {
  permit(actor, "supplier_offer.create_own", "SUPPLIER");
  const b = command(body, ["product_id", "terms"]),
    terms = validateTerms(b.terms);
  if (typeof b.product_id !== "string")
    fail(422, "INVALID_PRODUCT", "Product ID required");
  return execute(
    scope,
    actor,
    `product:${b.product_id}`,
    { ...b, command_action: "create_offer" },
    async (tx, receipt) => {
      const p = await findProfile(tx, b.product_id);
      if (
        p.owner_organization_id !== actor.organization_id &&
        p.publication_state !== "PUBLISHED"
      )
        fail(404, "NOT_FOUND", "Product not found");
      let s = await tx("didar_submission")
        .where({
          product_id: b.product_id,
          owner_organization_id: actor.organization_id,
        })
        .whereNull("superseded_at")
        .orderBy("created_at", "desc")
        .first();
      if (!s && b.expected_version !== 1)
        fail(
          409,
          "STALE_VERSION",
          "A new Supplier submission starts at version 1",
        );
      if (s) {
        version(s, b.expected_version);
        if (
          ![
            "DRAFT",
            "CHANGES_REQUESTED",
            "PUBLISHED",
            "REJECTED",
            "INACTIVE",
          ].includes(s.state)
        )
          fail(409, "INVALID_STATE", "Offer cannot change during review");
      }
      const c = await tx("didar_candidate")
        .where({
          id:
            p.publication_state === "PUBLISHED"
              ? p.published_candidate_id
              : s?.candidate_id,
        })
        .first();
      if (!c) fail(409, "MISSING_CANDIDATE", "Product candidate is missing");
      if (!s || !["DRAFT", "CHANGES_REQUESTED"].includes(s.state)) {
        // Supplier B submits only its Offer; common fields are the current approved identity.
        const cloned = await candidate(
          tx,
          scope,
          actor,
          p,
          {
            ...subset(c, [...productKeys, ...publicTermKeys]),
            public_terms_approved_by: c.public_terms_approved_by,
            public_terms_approved_at: c.public_terms_approved_at,
          },
          c,
        );
        s = await newSubmission(tx, actor, cloned, s, "OFFER");
      }
      const offer_id = `offer_${hash(receipt.id).slice(0, 26)}`;
      await createNativeOffer(scope, actor, p, offer_id);
      const o = {
        id: id("doffer"),
        offer_id,
        product_id: p.product_id,
        seller_id: actor.seller_id,
        owner_organization_id: actor.organization_id,
        status: "INACTIVE",
        version: 1,
        created_by: actor.id,
        updated_by: actor.id,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await tx("didar_offer_profile").insert(o);
      const revision = await offerRevision(tx, actor, o, terms);
      await tx("didar_submission")
        .where({ id: s.id })
        .update({ version: s.version + 1, updated_at: new Date() });
      s = { ...s, version: s.version + 1 };
      await event(tx, actor, receipt, {
        product_id: p.product_id,
        offer_id,
        owner_organization_id: actor.organization_id,
        submission_id: s.id,
        event_code: "OFFER_CREATED",
        details: { revision_id: revision.id },
      });
      return { offer_id, product_id: p.product_id, submission: s };
    },
  );
}
export async function editOffer(
  scope: any,
  actor: Actor,
  offer_id: string,
  body: any,
) {
  permit(actor, "supplier_offer.update_own", "SUPPLIER");
  const b = command(body, ["terms"]),
    terms = validateTerms(b.terms);
  const service = scope.resolve("didar_catalog");
  const pId = await service.database(async (db: any) => {
    const o = await db("didar_offer_profile")
      .where({ offer_id, owner_organization_id: actor.organization_id })
      .first();
    if (!o) fail(404, "NOT_FOUND", "Offer not found");
    return o.product_id;
  });
  return execute(
    scope,
    actor,
    `product:${pId}`,
    { ...b, command_action: "edit_offer" },
    async (tx, receipt) => {
      const o = await tx("didar_offer_profile").where({ offer_id }).first();
      own(actor, o.owner_organization_id);
      version(o, b.expected_version);
      const p = await findProfile(tx, pId),
        s = await latestSubmission(tx, actor, pId);
      if (
        ![
          "DRAFT",
          "CHANGES_REQUESTED",
          "PUBLISHED",
          "REJECTED",
          "INACTIVE",
        ].includes(s.state)
      )
        fail(409, "INVALID_STATE", "Offer cannot change during review");
      let next = s;
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(s.state)) {
        const c = await tx("didar_candidate")
            .where({
              id:
                p.publication_state === "PUBLISHED"
                  ? p.published_candidate_id
                  : s.candidate_id,
            })
            .first(),
          cloned = await candidate(
            tx,
            scope,
            actor,
            p,
            {
              ...subset(c, [...productKeys, ...publicTermKeys]),
              public_terms_approved_by: c.public_terms_approved_by,
              public_terms_approved_at: c.public_terms_approved_at,
            },
            c,
          );
        next = await newSubmission(tx, actor, cloned, s, "OFFER");
      }
      const r = await offerRevision(tx, actor, o, terms);
      await tx("didar_submission")
        .where({ id: next.id })
        .update({ version: next.version + 1, updated_at: new Date() });
      next = { ...next, version: next.version + 1 };
      await tx("didar_offer_profile")
        .where({ id: o.id })
        .update({
          version: o.version + 1,
          updated_by: actor.id,
          updated_at: new Date(),
        });
      await event(tx, actor, receipt, {
        product_id: pId,
        offer_id,
        owner_organization_id: o.owner_organization_id,
        submission_id: next.id,
        event_code: "OFFER_EDITED",
        details: { revision_id: r.id },
      });
      return {
        offer_id,
        version: o.version + 1,
        revision: r,
        submission: next,
      };
    },
  );
}
export async function submit(
  scope: any,
  actor: Actor,
  product_id: string,
  body: any,
) {
  permit(actor, "product.submit_own", "SUPPLIER");
  const b = command(body);
  return execute(
    scope,
    actor,
    `product:${product_id}`,
    { ...b, command_action: "submit" },
    async (tx, receipt) => {
      const p = await findProfile(tx, product_id),
        s = await latestSubmission(tx, actor, product_id);
      own(actor, s.owner_organization_id);
      version(s, b.expected_version);
      const state = nextState(s.state, "submit"),
        c = await tx("didar_candidate").where({ id: s.candidate_id }).first();
      await ancestry(scope, c.subcategory_id);
      const offers = await tx("didar_offer_profile")
        .where({ product_id, owner_organization_id: actor.organization_id })
        .whereNull("deleted_at");
      if (!offers.length)
        fail(422, "OFFER_REQUIRED", "A Supplier Offer is required");
      for (const o of offers) {
        const r = await tx("didar_offer_revision")
          .where({ offer_id: o.offer_id })
          .orderBy("revision", "desc")
          .first();
        validateTerms(
          subset(r, [
            "supplier_product_code",
            "weight_type",
            "exact_weight",
            "weight_min",
            "weight_max",
            "making_fee_type",
            "making_fee_value",
            "making_fee_min",
            "making_fee_max",
            "availability_type",
            "lead_time_days",
          ]),
        );
        await tx("didar_submission_offer").insert({
          id: id("dreviewoffer"),
          submission_id: s.id,
          offer_id: o.offer_id,
          revision_id: r.id,
        });
      }
      const native = await nativeProduct(scope, product_id);
      if (native.status !== "published" && native.status !== "proposed")
        await updateNativeStatus(scope, product_id, "proposed");
      await tx("didar_submission")
        .where({ id: s.id })
        .update({
          state,
          version: s.version + 1,
          submitted_at: new Date(),
          submitted_by: actor.id,
          updated_at: new Date(),
        });
      await event(tx, actor, receipt, {
        product_id,
        owner_organization_id: s.owner_organization_id,
        submission_id: s.id,
        candidate_id: c.id,
        event_code: "PRODUCT_SUBMITTED",
        from_state: s.state,
        to_state: state,
      });
      return {
        product_id,
        submission: { ...s, state, version: s.version + 1 },
      };
    },
  );
}
export async function review(
  scope: any,
  actor: Actor,
  submission_id: string,
  action: string,
  body: any,
) {
  const permissions: Record<string, string> = {
    approve: "product.approve",
    reject: "product.reject",
    request_changes: "product.request_changes",
    publish: "product.publish",
  };
  permit(actor, permissions[action], "DIDAR");
  const b = command(body, action === "approve" ? ["public_terms"] : []);
  if (["reject", "request_changes"].includes(action) && !b.reason)
    fail(422, "REASON_REQUIRED", "A review reason is required");
  const publicTerms =
    action === "approve" ? validatePublicTerms(b.public_terms) : null;
  const service = scope.resolve("didar_catalog");
  const product_id = await service.database(async (db: any) => {
    const s = await db("didar_submission").where({ id: submission_id }).first();
    if (!s) fail(404, "NOT_FOUND", "Review not found");
    return s.product_id;
  });
  return execute(
    scope,
    actor,
    `product:${product_id}`,
    { ...b, command_action: action },
    async (tx, receipt) => {
      const s = await tx("didar_submission")
        .where({ id: submission_id })
        .whereNull("superseded_at")
        .first();
      if (!s) fail(404, "NOT_FOUND", "Review not found");
      version(s, b.expected_version);
      const state = nextState(s.state, action),
        p = await findProfile(tx, product_id);
      let c = await tx("didar_candidate").where({ id: s.candidate_id }).first();
      if (action === "approve") {
        if (
          s.submission_kind === "OFFER" &&
          publicTermKeys.some(
            (k) => decimalCanonical(publicTerms![k]) !== decimalCanonical(c[k]),
          )
        )
          fail(
            422,
            "OFFER_REVIEW_PUBLIC_TERMS_READ_ONLY",
            "An Offer-only review cannot change common Product presentation",
          );
        const max = await tx("didar_candidate")
          .where({ product_id })
          .max("revision as revision")
          .first();
        c = {
          ...c,
          id: id("dcandidate"),
          revision: Number(max.revision) + 1,
          ...publicTerms,
          public_terms_approved_by: actor.id,
          public_terms_approved_at: new Date(),
          created_by: actor.id,
          created_at: new Date(),
          updated_at: new Date(),
        };
        await tx("didar_candidate").insert({
          ...c,
          images: JSON.stringify(c.images),
          attribute_value_ids: JSON.stringify(c.attribute_value_ids ?? []),
        });
        const attrs = await tx("didar_candidate_attribute").where({
          candidate_id: s.candidate_id,
        });
        for (const attr of attrs)
          await tx("didar_candidate_attribute").insert({
            ...attr,
            id: id("dcattr"),
            candidate_id: c.id,
          });
      }
      if (action === "publish") {
        if (
          s.submission_kind === "OFFER" &&
          p.publication_state !== "PUBLISHED"
        )
          fail(
            409,
            "PRODUCT_NOT_PUBLISHED",
            "Publish the common Product before activating this Offer",
          );
        if (!c.public_terms_approved_by)
          fail(
            409,
            "PUBLIC_TERMS_NOT_APPROVED",
            "Product Ops must explicitly approve public indicative terms, including nullable ranges",
          );
        const { root, leaf } = await ancestry(scope, c.subcategory_id);
        const native =
          s.submission_kind === "OFFER"
            ? await nativeProduct(scope, product_id)
            : await publishNative(scope, actor, s, c);
        if (
          fingerprint(native) !== fingerprint(c) ||
          native.variants.length !== 1 ||
          !native.categories?.some((v: any) => v.id === c.subcategory_id)
        )
          fail(
            409,
            "PUBLICATION_MISMATCH",
            "Native data does not match the approved candidate",
          );
        const at = new Date();
        if (s.submission_kind !== "OFFER")
          await tx("didar_catalog_profile")
            .where({ id: p.id })
            .update({
              product_code: c.product_code,
              subcategory_id: leaf.id,
              root_category_id: root.id,
              karat: c.karat,
              material: c.material,
              technical_description: c.technical_description,
              type_id: c.type_id,
              publication_state: "PUBLISHED",
              published_candidate_id: c.id,
              published_at: at,
              version: p.version + 1,
              ...subset(c, publicTermKeys),
              public_sort_name: native.title,
              public_handle: native.handle,
              public_search_text: [
                native.title,
                c.product_code,
                root.name,
                leaf.name,
              ]
                .join(" ")
                .normalize("NFKC")
                .replaceAll("ي", "ی")
                .replaceAll("ك", "ک"),
              native_fingerprint: fingerprint(native),
              updated_by: actor.id,
              updated_at: at,
            });
        if (s.submission_kind !== "OFFER") {
          await tx("didar_public_attribute").where({ product_id }).delete();
          const attributes = await nativeAttributes(
            scope,
            c.attribute_value_ids ?? [],
            tx,
          );
          if (
            JSON.stringify(
              (native.product_attribute_values ?? [])
                .map((v: any) => v.id)
                .sort(),
            ) !== JSON.stringify((c.attribute_value_ids ?? []).slice().sort())
          )
            fail(
              409,
              "ATTRIBUTE_MISMATCH",
              "Native attributes differ from approved candidate",
            );
          for (const attr of attributes)
            for (const value_id of attr.value_ids)
              await tx("didar_public_attribute").insert({
                id: id("dvalue"),
                product_id,
                attribute_id: attr.id,
                value_id,
              });
        }
        const refs = await tx("didar_submission_offer").where({
          submission_id: s.id,
        });
        for (const ref of refs) {
          await tx("didar_offer_profile")
            .where({ offer_id: ref.offer_id })
            .update({
              status: "ACTIVE",
              active_revision_id: ref.revision_id,
              version: tx.raw("version + 1"),
              updated_by: actor.id,
              updated_at: at,
            });
          await event(tx, actor, receipt, {
            product_id,
            offer_id: ref.offer_id,
            owner_organization_id: s.owner_organization_id,
            submission_id: s.id,
            event_code: "OFFER_ACTIVATED",
            to_state: "ACTIVE",
            details: { revision_id: ref.revision_id },
          });
        }
      } else if (s.submission_kind !== "OFFER")
        await reviewNative(scope, actor, s, action, b.reason);
      await tx("didar_submission")
        .where({ id: s.id })
        .update({
          candidate_id: c.id,
          state,
          version: s.version + 1,
          reviewed_at: new Date(),
          reviewed_by: actor.id,
          reason: b.reason,
          updated_at: new Date(),
        });
      await event(tx, actor, receipt, {
        product_id,
        owner_organization_id: s.owner_organization_id,
        submission_id: s.id,
        candidate_id: c.id,
        event_code: `PRODUCT_${action.toUpperCase() === "REQUEST_CHANGES" ? "CHANGES_REQUESTED" : action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "PUBLISHED"}`,
        from_state: s.state,
        to_state: state,
        reason: b.reason,
      });
      return {
        product_id,
        review: { id: s.id, state, version: s.version + 1, candidate_id: c.id },
        publication_state:
          action === "publish" ? "PUBLISHED" : p.publication_state,
      };
    },
  );
}
export async function unpublish(
  scope: any,
  actor: Actor,
  product_id: string,
  body: any,
) {
  permit(actor, "product.unpublish", "DIDAR");
  const b = command(body);
  return execute(
    scope,
    actor,
    `product:${product_id}`,
    { ...b, command_action: "unpublish" },
    async (tx, receipt) => {
      const p = await findProfile(tx, product_id);
      version(p, b.expected_version);
      if (p.publication_state !== "PUBLISHED")
        fail(409, "INVALID_STATE", "Product is not published");
      await updateNativeStatus(scope, product_id, "draft");
      await tx("didar_catalog_profile")
        .where({ id: p.id })
        .update({
          publication_state: "INACTIVE",
          version: p.version + 1,
          updated_by: actor.id,
          updated_at: new Date(),
        });
      await event(tx, actor, receipt, {
        product_id,
        owner_organization_id: p.owner_organization_id,
        event_code: "PRODUCT_UNPUBLISHED",
        from_state: "PUBLISHED",
        to_state: "INACTIVE",
        reason: b.reason,
      });
      return {
        product_id,
        publication_state: "INACTIVE",
        version: p.version + 1,
      };
    },
  );
}
