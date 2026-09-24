import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

import { DIDAR_CORE_MODULE } from "../modules/didar-core"
import type DidarCoreService from "../modules/didar-core/service"

// One-time, explicit, operator-controlled assignment. Never runs at startup.
export default async function grantDidarInquiryReview({ container }: ExecArgs) {
  const userId = process.env.DIDAR_REVIEWER_USER_ID
  if (!userId) throw new Error("DIDAR_REVIEWER_USER_ID must identify an existing Medusa admin user")

  const users = container.resolve(Modules.USER)
  await users.retrieveUser(userId)

  const service: DidarCoreService = container.resolve(DIDAR_CORE_MODULE)
  const capability = "admin.inquiry_review"
  const existing = await service.listDidarStaffGrants({ user_id: userId, capability })
  if (existing[0]) {
    await service.updateDidarStaffGrants({ selector: { id: existing[0].id }, data: { is_active: true } })
  } else {
    await service.createDidarStaffGrants({ user_id: userId, capability, is_active: true })
  }
  console.log(`Granted ${capability} to ${userId}`)
}
