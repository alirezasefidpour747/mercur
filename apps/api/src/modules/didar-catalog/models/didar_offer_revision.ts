import { model } from "@medusajs/framework/utils";

export const OfferRevision = model
  .define("didar_offer_revision", {
    id: model.id({ prefix: "dterms" }).primaryKey(),
    offer_id: model.text(),
    revision: model.number(),
    supplier_product_code: model.text().nullable(),
    weight_type: model.text(),
    exact_weight: model.bigNumber().nullable(),
    weight_min: model.bigNumber().nullable(),
    weight_max: model.bigNumber().nullable(),
    making_fee_type: model.text(),
    making_fee_value: model.bigNumber().nullable(),
    making_fee_min: model.bigNumber().nullable(),
    making_fee_max: model.bigNumber().nullable(),
    availability_type: model.text(),
    lead_time_days: model.number().nullable(),
    created_by: model.text(),
    actor_organization_id: model.text(),
    owner_organization_id: model.text(),
  })
  .indexes([
    {
      name: "IDX_didar_offer_revision_0",
      on: ["offer_id", "revision"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_offer_revision_1",
      on: ["weight_min", "weight_max"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_offer_revision_2",
      on: ["making_fee_min", "making_fee_max"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_offer_revision_3",
      on: ["owner_organization_id", "created_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);
