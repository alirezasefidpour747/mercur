import { model } from "@medusajs/framework/utils"

// A buyer's request is not an order or a quoted price.
const DidarInquiry = model.define("didar_inquiry", {
  id: model.id().primaryKey(),
  organization_id: model.text(),
  created_by_customer_id: model.text(),
  medusa_product_id: model.text(),
  message: model.text(),
  status: model.enum(["submitted", "under_review", "answered"]).default("submitted"),
  answer: model.text().nullable(),
  reviewed_by_user_id: model.text().nullable(),
  reviewed_at: model.dateTime().nullable(),
}).indexes([
  { on: ["organization_id", "created_at"] },
])

export default DidarInquiry
