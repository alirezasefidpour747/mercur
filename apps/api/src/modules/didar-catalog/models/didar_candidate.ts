import { model } from "@medusajs/framework/utils";

export const Candidate = model
  .define("didar_candidate", {
    id: model.id({ prefix: "dcandidate" }).primaryKey(),
    product_id: model.text(),
    owner_organization_id: model.text(),
    revision: model.number(),
    title: model.text(),
    handle: model.text(),
    description: model.text().nullable(),
    technical_description: model.text().nullable(),
    product_code: model.text(),
    subcategory_id: model.text(),
    karat: model.number(),
    material: model.text(),
    type_id: model.text().nullable(),
    images: model.json(),
    attribute_value_ids: model.json(),
    public_weight_min: model.bigNumber().nullable(),
    public_weight_max: model.bigNumber().nullable(),
    public_fee_min: model.bigNumber().nullable(),
    public_fee_max: model.bigNumber().nullable(),
    public_terms_approved_by: model.text().nullable(),
    public_terms_approved_at: model.dateTime().nullable(),
    native_change_id: model.text().nullable(),
    created_by: model.text(),
  })
  .indexes([
    {
      name: "IDX_didar_candidate_0",
      on: ["product_id", "revision"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_candidate_1",
      on: ["owner_organization_id", "created_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);
