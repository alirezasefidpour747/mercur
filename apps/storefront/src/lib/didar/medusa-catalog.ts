import { sdk } from "@/lib/client"
import { publicDidarProducts, publicProduct } from "@/lib/didar/public-catalog"
import type {
  DidarInventorySource,
  DidarProduct,
  DidarSaleStatus,
} from "@/lib/didar/product-model"
import { didarFamilies, didarTaxonomy } from "@/lib/didar/product-taxonomy"

type MedusaAttribute = {
  handle?: string | null
  values?: Array<{ name?: string | null }>
}

type MedusaProduct = {
  id: string
  title: string
  handle?: string | null
  description?: string | null
  material?: string | null
  thumbnail?: string | null
  images?: Array<{ url: string }>
  categories?: Array<{ handle?: string | null }>
  variants?: Array<{ sku?: string | null }>
  attributes?: MedusaAttribute[]
}

const firstAttribute = (product: MedusaProduct, handle: string) =>
  product.attributes
    ?.find((attribute) => attribute.handle === handle)
    ?.values?.[0]?.name ?? null

const numericAttribute = (product: MedusaProduct, handle: string) => {
  const raw = firstAttribute(product, handle)
  if (!raw) return null
  const parsed = Number(raw.replace(/[٫,]/g, "."))
  return Number.isFinite(parsed) ? parsed : null
}

const inventorySource = (value: string | null): DidarInventorySource => {
  if (value === "انبار دیدار") return "didar"
  if (value === "سفارش ساخت") return "made-to-order"
  return "supplier"
}

const saleStatus = (value: string | null): DidarSaleStatus => {
  if (value === "آماده عرضه") return "available"
  if (value === "سفارش ساخت") return "made-to-order"
  if (value === "ناموجود") return "unavailable"
  return "inquiry"
}

const fromMedusa = (product: MedusaProduct): DidarProduct | null => {
  const subtypeId = product.categories?.map((category) => category.handle).find(
    (handle): handle is string =>
      Boolean(
        handle &&
          didarTaxonomy.some((category) =>
            category.types.some((subtype) => subtype.id === handle)
          )
      )
  )
  const category = didarTaxonomy.find((item) =>
    item.types.some((subtype) => subtype.id === subtypeId)
  )
  const subtype = category?.types.find((item) => item.id === subtypeId)
  const family = didarFamilies.find((item) => item.id === category?.family)
  const image = product.thumbnail ?? product.images?.[0]?.url

  if (!product.handle || !image || !category || !subtype || !family) return null

  const purity = numericAttribute(product, "purity")
  const minWeight = numericAttribute(product, "weight_min_g")
  const maxWeight = numericAttribute(product, "weight_max_g")
  const minFee = numericAttribute(product, "making_fee_min_percent")
  const maxFee = numericAttribute(product, "making_fee_max_percent")
  const warrantyMonths = numericAttribute(product, "warranty_months")
  const gallery = [product.thumbnail, ...(product.images?.map(({ url }) => url) ?? [])]
    .filter((url): url is string => Boolean(url))
    .filter((url, index, all) => all.indexOf(url) === index)

  return {
    id: product.id,
    slug: product.handle,
    sourceUrl: `/fa/creation/${product.handle}`,
    title: product.title,
    image,
    category: category.fa,
    material: product.material ?? (purity ? `طلای ${purity} در هزار` : null),
    gallery,
    detailVerified: true,
    sku: product.variants?.[0]?.sku ?? null,
    familyId: family.id,
    categoryId: category.id,
    subtypeId: subtype.id,
    familyLabel: family.fa,
    categoryLabel: category.fa,
    subtypeLabel: subtype.fa,
    purity,
    minWeight,
    maxWeight,
    nominalWeight: numericAttribute(product, "nominal_weight_g"),
    wagePercentMin: minFee,
    wagePercentMax: maxFee,
    supplierId: null,
    supplierName: null,
    quantity: null,
    issuer: null,
    story: product.description ?? null,
    warrantyMonths,
    saleStatus: saleStatus(firstAttribute(product, "sale_status")),
    inventorySource: inventorySource(firstAttribute(product, "inventory_source")),
    lifecycle: "published",
  }
}

export const getDidarCatalog = async (): Promise<DidarProduct[]> => {
  const response = await (sdk.store.products.query({
    limit: 100,
    fields:
      "id,title,handle,description,material,thumbnail,images.url,categories.handle,variants.sku,product_attribute_values.id,product_attribute_values.name,product_attribute_values.attribute.id,product_attribute_values.attribute.handle,product_attribute_values.attribute.type",
    fetchOptions: { cache: "no-cache" },
  } as never) as unknown as Promise<{ products: MedusaProduct[] }>).catch(
    () => ({ products: [] as MedusaProduct[] })
  )

  const liveProducts = response.products
    .map(fromMedusa)
    .filter((product): product is DidarProduct => Boolean(product))
  const liveHandles = new Set(liveProducts.map((product) => product.slug))

  return [
    ...liveProducts,
    ...publicDidarProducts.filter((product) => !liveHandles.has(product.slug)),
  ]
}

export const getDidarProduct = async (slug: string) => {
  const catalog = await getDidarCatalog()
  return catalog.find((product) => product.slug === slug) ?? publicProduct(slug)
}
