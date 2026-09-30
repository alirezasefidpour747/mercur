import { model } from "@medusajs/framework/utils";

export const Organization = model
  .define("didar_organization", {
    id: model.id({ prefix: "org" }).primaryKey(),
    kind: model.text(),
    name: model.text(),
    seller_id: model.text().nullable(),
    active: model.boolean(),
  })
  .indexes([
    {
      name: "IDX_didar_organization_0",
      on: ["seller_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);
