import { model } from "@medusajs/framework/utils";

export const Submission = model
  .define("didar_submission", {
    id: model.id({ prefix: "dreview" }).primaryKey(),
    product_id: model.text(),
    candidate_id: model.text(),
    owner_organization_id: model.text(),
    state: model.text(),
    version: model.number(),
    submitted_at: model.dateTime().nullable(),
    submitted_by: model.text().nullable(),
    reviewed_at: model.dateTime().nullable(),
    reviewed_by: model.text().nullable(),
    reason: model.text().nullable(),
    created_by: model.text(),
    submission_kind: model.text(),
    previous_submission_id: model.text().nullable(),
    superseded_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_didar_submission_0",
      on: ["state", "submitted_at", "id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_submission_1",
      on: ["owner_organization_id", "state"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_didar_submission_2",
      on: ["product_id", "version"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);
