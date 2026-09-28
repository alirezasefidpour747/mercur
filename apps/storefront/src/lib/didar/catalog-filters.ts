import type { DidarProduct } from "@/lib/didar/product-model"

export type DidarCatalogSort = "default" | "title" | "weight"

export type DidarCatalogFilters = {
  q: string
  family: string
  category: string
  subtype: string
  purity: string
  inventorySource: string
  saleStatus: string
  verified: string
  minWeight: number | null
  maxWeight: number | null
  minWage: number | null
  maxWage: number | null
  sort: DidarCatalogSort
}

type SearchValue = string | string[] | undefined

const first = (value: SearchValue) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? ""

const limited = (value: SearchValue, max = 80) => first(value).slice(0, max)

const numberOrNull = (value: SearchValue) => {
  const raw = first(value)
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function parseDidarCatalogFilters(
  params: Record<string, SearchValue>
): DidarCatalogFilters {
  const requestedSort = first(params.sort)

  return {
    q: limited(params.q),
    family: limited(params.family),
    category: limited(params.category),
    subtype: limited(params.subtype),
    purity: limited(params.purity, 8),
    inventorySource: limited(params.inventory_source, 24),
    saleStatus: limited(params.sale_status, 24),
    verified: limited(params.verified, 8),
    minWeight: numberOrNull(params.minWeight),
    maxWeight: numberOrNull(params.maxWeight),
    minWage: numberOrNull(params.minWage),
    maxWage: numberOrNull(params.maxWage),
    sort: (["title", "weight"] as const).includes(
      requestedSort as "title" | "weight"
    )
      ? (requestedSort as DidarCatalogSort)
      : "default",
  }
}

function overlaps(
  productMin: number | null,
  productMax: number | null,
  requestedMin: number | null,
  requestedMax: number | null
) {
  if (requestedMin == null && requestedMax == null) return true
  if (productMin == null && productMax == null) return false

  const low = productMin ?? productMax!
  const high = productMax ?? productMin!
  if (requestedMin != null && high < requestedMin) return false
  if (requestedMax != null && low > requestedMax) return false
  return true
}

function contains(value: string | null | undefined, query: string) {
  return (value ?? "").toLocaleLowerCase().includes(query)
}

export function filterDidarCatalog(
  products: readonly DidarProduct[],
  filters: DidarCatalogFilters
) {
  const query = filters.q.toLocaleLowerCase()

  const filtered = products.filter((product) => {
    const matchesQuery =
      !query ||
      [
        product.title,
        product.sku,
        product.category,
        product.familyLabel,
        product.categoryLabel,
        product.subtypeLabel,
        product.supplierName,
        product.material,
      ].some((value) => contains(value, query))

    return (
      matchesQuery &&
      (!filters.family || product.familyId === filters.family) &&
      (!filters.category ||
        product.categoryId === filters.category ||
        product.category === filters.category) &&
      (!filters.subtype || product.subtypeId === filters.subtype) &&
      (!filters.purity || product.purity === Number(filters.purity)) &&
      (!filters.inventorySource || product.inventorySource === filters.inventorySource) &&
      (!filters.saleStatus || product.saleStatus === filters.saleStatus) &&
      (!filters.verified ||
        (filters.verified === "yes" ? product.detailVerified : !product.detailVerified)) &&
      overlaps(
        product.minWeight,
        product.maxWeight,
        filters.minWeight,
        filters.maxWeight
      ) &&
      overlaps(
        product.wagePercentMin,
        product.wagePercentMax,
        filters.minWage,
        filters.maxWage
      )
    )
  })

  if (filters.sort === "title") {
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "fa"))
  }

  if (filters.sort === "weight") {
    return [...filtered].sort(
      (a, b) =>
        (a.nominalWeight ?? a.minWeight ?? Number.MAX_SAFE_INTEGER) -
        (b.nominalWeight ?? b.minWeight ?? Number.MAX_SAFE_INTEGER)
    )
  }

  return filtered
}

export function hasDidarCatalogFilters(filters: DidarCatalogFilters) {
  return Boolean(
    filters.q ||
      filters.family ||
      filters.category ||
      filters.subtype ||
      filters.purity ||
      filters.inventorySource ||
      filters.saleStatus ||
      filters.verified ||
      filters.minWeight != null ||
      filters.maxWeight != null ||
      filters.minWage != null ||
      filters.maxWage != null ||
      filters.sort !== "default"
  )
}
