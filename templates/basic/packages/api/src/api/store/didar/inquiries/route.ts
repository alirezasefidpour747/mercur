import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { approvedRetailerMembership, didarService, requiredText, requestBody, requirePublishedProduct, actorId } from "../../../didar-access"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const organizationId = requiredText(req.query.organization_id, "organization_id", 128)
  await approvedRetailerMembership(req, organizationId)
  const inquiries = await didarService(req).listDidarInquiries(
    { organization_id: organizationId },
    { take: 50, order: { created_at: "DESC" } }
  )
  res.json({ inquiries })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const body = requestBody(req)
  const organizationId = requiredText(body.organization_id, "organization_id", 128)
  const productId = requiredText(body.medusa_product_id, "medusa_product_id", 128)
  const message = requiredText(body.message, "message", 2000)
  await approvedRetailerMembership(req, organizationId)
  await requirePublishedProduct(req, productId)
  const inquiry = await didarService(req).createDidarInquiries({
    organization_id: organizationId,
    created_by_customer_id: actorId(req),
    medusa_product_id: productId,
    message,
  })
  res.status(201).json({ inquiry })
}
