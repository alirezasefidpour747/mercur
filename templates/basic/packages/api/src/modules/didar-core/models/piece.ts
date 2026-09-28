import { model } from "@medusajs/framework/utils"

// Physical inventory is distinct from the Medusa product variant / style SKU.
// Do not create a piece until an authoritative UID and variant are available.
const DidarPiece = model.define("didar_piece", {
  id: model.id().primaryKey(),
  uid: model.text().unique(),
  medusa_variant_id: model.text(),
  status: model.enum([
    "pending_qc", "available", "reserved", "assigned", "delivered", "returned",
  ]).default("pending_qc"),
  weight_mg: model.number().nullable(),
})

export default DidarPiece
