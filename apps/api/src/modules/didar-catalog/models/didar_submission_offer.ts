import { model } from "@medusajs/framework/utils";

export const SubmissionOffer = model
  .define("didar_submission_offer", {
    id: model.id({ prefix: "dreviewoffer" }).primaryKey(),
    submission_id: model.text(),
    offer_id: model.text(),
    revision_id: model.text(),
  })
  .indexes([
    {
      name: "IDX_didar_submission_offer_0",
      on: ["submission_id", "offer_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);
