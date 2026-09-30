import { model } from "@medusajs/framework/utils";

export const Grant = model
  .define("didar_grant", {
    id: model.id({ prefix: "dgrant" }).primaryKey(),
    membership_id: model.text(),
    role: model.text(),
    permission: model.text(),
  })
  .indexes([
    {
      name: "IDX_didar_grant_0",
      on: ["membership_id", "permission"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);
