import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { didarService, requireDidarStaffGrant } from "../../../didar-access"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  await requireDidarStaffGrant(req, "admin.inquiry_review")
  const inquiries = await didarService(req).listDidarInquiries(
    {}, { take: 50, order: { created_at: "DESC" } }
  )
  res.json({ inquiries })
}
