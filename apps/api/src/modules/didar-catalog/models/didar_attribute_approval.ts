import { model } from "@medusajs/framework/utils";

export const AttributeApproval = model
  .define("didar_attribute_approval", {
    id: model.id({ prefix: "dattr" }).primaryKey(),
    attribute_id: model.text(),
    handle: model.text(),
    approved_by: model.text(),
    approved_at: model.dateTime(),
    active: model.boolean(),
  })
  .indexes([
    {
      name: "IDX_didar_attribute_approval_0",
      on: ["attribute_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_attribute_approval_1",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);
