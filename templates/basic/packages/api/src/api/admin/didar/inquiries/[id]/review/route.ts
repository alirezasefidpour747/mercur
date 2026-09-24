import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { actorId, didarService, requestBody, requiredText, requireDidarStaffGrant } from "../../../../../didar-access"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  await requireDidarStaffGrant(req, "admin.inquiry_review")
  const body = requestBody(req)
  if (body.status !== "under_review" && body.status !== "answered") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid review status")
  }
  const service = didarService(req)
  const existing = (await service.listDidarInquiries({ id: req.params.id }))[0]
  if (!existing) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Inquiry not found")
  if (existing.status === "answered" || (existing.status === "under_review" && body.status !== "answered")) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid status transition")
  }
  const answer = body.status === "answered"
    ? requiredText(body.answer, "answer", 4000)
    : null
  await service.updateDidarInquiries({
    selector: { id: existing.id },
    data: {
      status: body.status,
      answer,
      reviewed_by_user_id: actorId(req),
      reviewed_at: new Date(),
    },
  })
  const inquiry = (await service.listDidarInquiries({ id: existing.id }))[0]
  res.json({ inquiry })
}
