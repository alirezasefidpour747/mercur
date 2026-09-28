import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { approvedRetailerMembership, didarService } from "../../../../didar-access"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const inquiries = await didarService(req).listDidarInquiries({ id: req.params.id })
  const inquiry = inquiries[0]
  if (!inquiry) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Inquiry not found")
  await approvedRetailerMembership(req, inquiry.organization_id)
  res.json({ inquiry })
}
