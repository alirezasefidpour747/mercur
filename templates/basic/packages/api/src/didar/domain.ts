/**
 * Didar's first domain contract. This file has no storage or authorization
 * side effects; API routes must enforce permissions and ownership server-side.
 */
export const DIDAR_LOCALES = ["fa", "ar", "en", "fr"] as const
export type DidarLocale = (typeof DIDAR_LOCALES)[number]

export const localePresentation: Record<
  DidarLocale,
  { dir: "rtl" | "ltr"; font: "Doran" | "IBM Plex Sans Arabic" | "Inter" }
> = {
  fa: { dir: "rtl", font: "Doran" },
  ar: { dir: "rtl", font: "IBM Plex Sans Arabic" },
  en: { dir: "ltr", font: "Inter" },
  fr: { dir: "ltr", font: "Inter" },
}

export type DidarActor =
  | "guest"
  | "consumer"
  | "retailer_pending"
  | "retailer_approved"
  | "supplier_pending"
  | "supplier_approved"
  | "wholesaler_pending"
  | "wholesaler_approved"
  | "employee"
  | "field_agent"

export type DidarCapability =
  | "catalog.read_public"
  | "authenticity.read_public"
  | "warranty.submit_own"
  | "retailer.profile_submit_own"
  | "retailer.inquiry_submit_own"
  | "retailer.inquiry_read_own"
  | "retailer.commercial_read_own"
  | "supplier.profile_submit_own"
  | "supplier.product_submit_own"
  | "supplier.product_read_own"
  | "agent.bag_receive"
  | "agent.bag_return"
  | "admin.retailer_approve"
  | "admin.supplier_approve"
  | "admin.inquiry_review"
  | "admin.catalog_publish"

/** An employee needs the exact approved permission for each operation. */
const actorCapabilities: Record<DidarActor, readonly DidarCapability[]> = {
  guest: ["catalog.read_public", "authenticity.read_public"],
  consumer: ["catalog.read_public", "authenticity.read_public", "warranty.submit_own"],
  retailer_pending: ["catalog.read_public", "authenticity.read_public", "retailer.profile_submit_own", "retailer.inquiry_read_own"],
  retailer_approved: ["catalog.read_public", "authenticity.read_public", "retailer.profile_submit_own", "retailer.inquiry_submit_own", "retailer.inquiry_read_own", "retailer.commercial_read_own", "warranty.submit_own"],
  supplier_pending: ["supplier.profile_submit_own"],
  supplier_approved: ["supplier.profile_submit_own", "supplier.product_submit_own", "supplier.product_read_own"],
  wholesaler_pending: [],
  wholesaler_approved: [],
  employee: [],
  field_agent: [],
}

export function hasDidarCapability(
  actor: DidarActor,
  capability: DidarCapability,
  explicitEmployeeGrants: readonly DidarCapability[] = []
): boolean {
  if (actor === "employee" || actor === "field_agent") {
    return explicitEmployeeGrants.includes(capability)
  }
  return actorCapabilities[actor].includes(capability)
}

/** A style and its sellable variant are distinct from each physical piece. */
export type DidarCatalogIdentity = {
  medusaProductId: string | null
  medusaVariantId: string | null
  sourceUrl: string
  sourceSlug: string
  /** Only a validated master-data SKU, never a URL slug. */
  sku: string | null
}

export type DidarPhysicalPiece = {
  /** Assigned by the authoritative item-registration process. */
  uid: string
  medusaVariantId: string
  status: "pending_qc" | "available" | "reserved" | "assigned" | "delivered" | "returned"
}

export function canExposeCommercialData(actor: DidarActor): boolean {
  return hasDidarCapability(actor, "retailer.commercial_read_own")
}
