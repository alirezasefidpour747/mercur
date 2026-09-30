import { model } from "@medusajs/framework/utils";

export const OfferProfile = model
  .define("didar_offer_profile", {
    id: model.id({ prefix: "doffer" }).primaryKey(),
    offer_id: model.text(),
    product_id: model.text(),
    seller_id: model.text(),
    owner_organization_id: model.text(),
    status: model.text(),
    version: model.number(),
    active_revision_id: model.text().nullable(),
    created_by: model.text(),
    updated_by: model.text(),
  })
  .indexes([
    {
      name: "IDX_didar_offer_profile_0",
      on: ["offer_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_offer_profile_1",
      on: ["product_id", "seller_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_offer_profile_2",
      on: ["owner_organization_id", "status"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);
