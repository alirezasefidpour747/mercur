import { model } from "@medusajs/framework/utils";

export const CatalogEvent = model
  .define("didar_catalog_event", {
    id: model.id({ prefix: "devent" }).primaryKey(),
    entity_type: model.text(),
    entity_id: model.text(),
    category_id: model.text().nullable(),
    subcategory_id: model.text().nullable(),
    product_id: model.text().nullable(),
    offer_id: model.text().nullable(),
    submission_id: model.text().nullable(),
    candidate_id: model.text().nullable(),
    event_code: model.text(),
    from_state: model.text().nullable(),
    to_state: model.text().nullable(),
    actor_id: model.text(),
    actor_type: model.text(),
    actor_organization_id: model.text(),
    owner_organization_id: model.text(),
    role_context: model.text(),
    on_behalf_of: model.text().nullable(),
    reason: model.text().nullable(),
    command_id: model.text(),
    occurred_at: model.dateTime(),
    details: model.json(),
  })
  .indexes([
    {
      name: "IDX_didar_catalog_event_0",
      on: ["command_id", "event_code", "product_id", "offer_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_catalog_event_1",
      on: ["entity_type", "entity_id", "occurred_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_catalog_event_2",
      on: ["product_id", "occurred_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_catalog_event_3",
      on: ["actor_organization_id", "occurred_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_catalog_event_4",
      on: ["actor_id", "occurred_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_catalog_event_5",
      on: ["owner_organization_id", "occurred_at"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);
