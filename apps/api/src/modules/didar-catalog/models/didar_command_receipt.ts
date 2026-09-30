import { model } from "@medusajs/framework/utils";

export const CommandReceipt = model
  .define("didar_command_receipt", {
    id: model.id({ prefix: "dcommand" }).primaryKey(),
    actor_id: model.text(),
    organization_id: model.text(),
    resource_key: model.text(),
    idempotency_key: model.text(),
    payload_hash: model.text(),
    state: model.text(),
    result: model.json().nullable(),
    failure: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_didar_command_receipt_0",
      on: ["actor_id", "organization_id", "resource_key", "idempotency_key"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);
