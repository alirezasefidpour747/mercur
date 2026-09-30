import { model } from "@medusajs/framework/utils";

export const CandidateAttribute = model
  .define("didar_candidate_attribute", {
    id: model.id({ prefix: "dcattr" }).primaryKey(),
    candidate_id: model.text(),
    attribute_id: model.text(),
    value_id: model.text(),
  })
  .indexes([
    {
      name: "IDX_didar_candidate_attribute_0",
      on: ["candidate_id", "attribute_id", "value_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);
