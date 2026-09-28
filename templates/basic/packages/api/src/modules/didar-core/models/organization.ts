import { model } from "@medusajs/framework/utils"

const DidarOrganization = model.define("didar_organization", {
  id: model.id().primaryKey(),
  kind: model.enum(["retailer", "supplier", "wholesaler"]),
  display_name: model.text(),
  approval_status: model.enum(["pending", "approved", "rejected"]).default("pending"),
  reviewed_at: model.dateTime().nullable(),
  reviewed_by: model.text().nullable(),
})

export default DidarOrganization
