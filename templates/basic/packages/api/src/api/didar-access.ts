import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { DIDAR_CORE_MODULE } from "../modules/didar-core"
import type DidarCoreService from "../modules/didar-core/service"

export function didarService(req: AuthenticatedMedusaRequest): DidarCoreService {
  return req.scope.resolve(DIDAR_CORE_MODULE)
}

export function actorId(req: AuthenticatedMedusaRequest): string {
  const id = req.auth_context?.actor_id
  if (!id) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Authentication required")
  return id
}

export function requiredText(value: unknown, name: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `${name} must contain 1–${max} characters`)
  }
  return value.trim()
}

export function requestBody(req: AuthenticatedMedusaRequest): Record<string, unknown> {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Expected a JSON object")
  }
  return req.body as Record<string, unknown>
}

export async function approvedRetailerMembership(
  req: AuthenticatedMedusaRequest,
  organizationId: string
) {
  const service = didarService(req)
  const members = await service.listDidarMemberships({
    organization_id: organizationId,
    actor_type: "customer",
    actor_id: actorId(req),
    is_active: true,
  })
  if (!members.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Organization not found")
  }
  const organizations = await service.listDidarOrganizations({ id: organizationId })
  if (organizations[0]?.kind !== "retailer" || organizations[0]?.approval_status !== "approved") {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Retailer approval required")
  }
  return organizations[0]
}

export async function requireDidarStaffGrant(
  req: AuthenticatedMedusaRequest,
  capability: string
) {
  const grants = await didarService(req).listDidarStaffGrants({
    user_id: actorId(req), capability, is_active: true,
  })
  if (!grants.length) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Didar permission required")
  }
}

export async function requirePublishedProduct(req: AuthenticatedMedusaRequest, id: string) {
  const products = req.scope.resolve(Modules.PRODUCT)
  const product = await products.retrieveProduct(id)
  if (product.status !== "published") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Product is not published")
  }
}
