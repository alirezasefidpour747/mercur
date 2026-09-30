import { model } from "@medusajs/framework/utils";

export const PublicAttribute = model
  .define("didar_public_attribute", {
    id: model.id({ prefix: "dvalue" }).primaryKey(),
    product_id: model.text(),
    attribute_id: model.text(),
    value_id: model.text(),
  })
  .indexes([
    {
      name: "IDX_didar_public_attribute_0",
      on: ["product_id", "attribute_id", "value_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_public_attribute_1",
      on: ["attribute_id", "value_id", "product_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);
