import { model } from "@medusajs/framework/utils";

export const Membership = model
  .define("didar_membership", {
    id: model.id({ prefix: "dmem" }).primaryKey(),
    actor_id: model.text(),
    actor_type: model.text(),
    organization_id: model.text(),
    active: model.boolean(),
  })
  .indexes([
    {
      name: "IDX_didar_membership_0",
      on: ["actor_id", "actor_type", "organization_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);
