import { didarFamilies, didarTaxonomy } from "@/lib/didar/product-taxonomy"

export type DidarProductLifecycle = "draft" | "review" | "approved" | "published" | "rejected" | "archived"
export type DidarSaleStatus = "available" | "inquiry" | "made-to-order" | "unavailable"
export type DidarInventorySource = "didar" | "supplier" | "made-to-order"

export type DidarProductSource = {
  slug: string
  sourceUrl: string
  title: string
  image: string
  category: string | null
  material: string | null
  gallery: string[]
  detailVerified: boolean
}

export type DidarProduct = DidarProductSource & {
  id: string
  sku: string | null
  familyId: string | null
  categoryId: string | null
  subtypeId: string | null
  familyLabel: string | null
  categoryLabel: string | null
  subtypeLabel: string | null
  purity: number | null
  minWeight: number | null
  maxWeight: number | null
  nominalWeight: number | null
  wagePercentMin: number | null
  wagePercentMax: number | null
  supplierId: string | null
  supplierName: string | null
  quantity: number | null
  issuer: string | null
  story: string | null
  warrantyMonths: number | null
  saleStatus: DidarSaleStatus
  inventorySource: DidarInventorySource
  lifecycle: DidarProductLifecycle
}

export type DidarProductDraft = {
  id: string
  name: string
  slug: string
  sku: string
  family: string
  category: string
  subtype: string
  minWeight: string
  maxWeight: string
  nominalWeight: string
  purity: string
  wagePercentMin: string
  wagePercentMax: string
  quantity: string
  issuer: string
  supplierName: string
  story: string
  warrantyMonths: string
  saleStatus: DidarSaleStatus
  inventorySource: DidarInventorySource
  photos: string[]
  status: "draft" | "review"
}

const categoryRules: Array<[RegExp, string, string]> = [
  [/نیم[‌\s-]?ست/i, "half-set", "half-set-set"],
  [/سرویس/i, "full-set", "full-set-set"],
  [/انگشتر|حلقه/i, "rings", "rings-fantasy"],
  [/گوشواره/i, "earrings", "earrings-stud"],
  [/بنگل/i, "bangles", "bangles-bangle"],
  [/دستبند/i, "bracelets", "bracelets-clasp"],
  [/گردنبند|گردنی|طوق/i, "necklaces", "necklaces-pendant"],
  [/پلاک|آویز/i, "pendants", "pendants-fixed"],
  [/زنجیر/i, "chains", "chains-plain"],
]

function inferTaxonomy(title: string) {
  const match = categoryRules.find(([pattern]) => pattern.test(title))
  const categoryId = match?.[1] ?? null
  const subtypeId = match?.[2] ?? null
  const category = didarTaxonomy.find((item) => item.id === categoryId)
  const subtype = category?.types.find((item) => item.id === subtypeId)
  const family = didarFamilies.find((item) => item.id === category?.family)
  return {
    familyId: family?.id ?? null,
    categoryId,
    subtypeId,
    familyLabel: family?.fa ?? null,
    categoryLabel: category?.fa ?? null,
    subtypeLabel: subtype?.fa ?? null,
  }
}

function codeFromImage(image: string) {
  const match = image.match(/\/products\/([^/]+)\//i)
  return match?.[1] ?? null
}

export function normalizeDidarProduct(source: DidarProductSource): DidarProduct {
  const taxonomy = inferTaxonomy(source.title)
  return {
    ...source,
    id: source.slug,
    sku: codeFromImage(source.image),
    ...taxonomy,
    purity: source.material?.includes("۱۸") ? 750 : null,
    minWeight: null,
    maxWeight: null,
    nominalWeight: null,
    wagePercentMin: null,
    wagePercentMax: null,
    supplierId: null,
    supplierName: null,
    quantity: null,
    issuer: null,
    story: null,
    warrantyMonths: null,
    saleStatus: "inquiry",
    inventorySource: "supplier",
    lifecycle: "published",
  }
}

export function productWeightLabel(product: DidarProduct) {
  if (product.nominalWeight != null) return `${product.nominalWeight} گرم`
  if (product.minWeight != null && product.maxWeight != null) return `${product.minWeight} تا ${product.maxWeight} گرم`
  return null
}

export function productWageLabel(product: DidarProduct) {
  if (product.wagePercentMin == null) return null
  return product.wagePercentMax != null && product.wagePercentMax !== product.wagePercentMin
    ? `${product.wagePercentMin} تا ${product.wagePercentMax}٪`
    : `${product.wagePercentMin}٪`
}
