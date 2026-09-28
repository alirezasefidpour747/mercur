import { model } from "@medusajs/framework/utils"

// Medusa admin authentication alone does not authorize a Didar business action.
const DidarStaffGrant = model.define("didar_staff_grant", {
  id: model.id().primaryKey(),
  user_id: model.text(),
  capability: model.text(),
  is_active: model.boolean().default(true),
}).indexes([{ on: ["user_id", "capability"], unique: true }])

export default DidarStaffGrant
