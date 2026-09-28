import { model } from "@medusajs/framework/utils"

// Cross-module actor references stay as IDs; modules must be linked through
// Medusa's link mechanism once their ownership workflows are implemented.
const DidarMembership = model.define("didar_membership", {
  id: model.id().primaryKey(),
  organization_id: model.text(),
  actor_type: model.enum(["customer", "seller", "staff"]),
  actor_id: model.text(),
  business_role: model.text().nullable(),
  is_active: model.boolean().default(true),
}).indexes([{ on: ["organization_id", "actor_type", "actor_id"], unique: true }])

export default DidarMembership
