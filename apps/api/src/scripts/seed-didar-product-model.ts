import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  AttributeType,
  didarFamilies,
  didarTaxonomy,
} from "@mercurjs/types"
import { createProductAttributesWorkflow } from "@mercurjs/core/workflows"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

type CategorySeed = {
  handle: string
  parentHandle?: string
  name: string
  rank: number
  metadata: Record<string, unknown>
}

type AttributeSeed = {
  handle: string
  name: string
  type: AttributeType
  values: readonly string[]
  filterable?: boolean
  metadata: Record<string, unknown>
}

const categoryLevels: CategorySeed[][] = [
  didarFamilies.map((family, rank) => ({
    handle: family.id,
    name: family.fa,
    rank,
    metadata: {
      didar_level: "family",
      i18n: { fa: family.fa, ar: family.ar, en: family.en, fr: family.fr },
      pending: "pending" in family ? Boolean(family.pending) : false,
    },
  })),
  didarTaxonomy.map((category, rank) => ({
    handle: category.id,
    parentHandle: category.family,
    name: category.fa,
    rank,
    metadata: {
      didar_level: "category",
      i18n: {
        fa: category.fa,
        ar: category.ar,
        en: category.en,
        fr: category.fr,
      },
      future: Boolean(category.future),
    },
  })),
  didarTaxonomy.flatMap((category) =>
    category.types.map((subtype, rank) => ({
      handle: subtype.id,
      parentHandle: category.id,
      name: subtype.fa,
      rank,
      metadata: {
        didar_level: "subtype",
        i18n: {
          fa: subtype.fa,
          ar: subtype.ar,
          en: subtype.en,
          fr: subtype.fr,
        },
      },
    }))
  ),
]

const attributeDefinitions: readonly AttributeSeed[] = [
  {
    handle: "purity",
    name: "عیار طلا",
    type: AttributeType.SINGLE_SELECT,
    values: ["750", "875", "916", "999"],
    metadata: { didar_master: true, unit: "permille" },
  },
  {
    handle: "gold_color",
    name: "رنگ طلا",
    type: AttributeType.MULTI_SELECT,
    values: ["طلای زرد", "طلای سفید", "رزگلد", "ترکیبی"],
    metadata: { didar_master: true },
  },
  {
    handle: "weight",
    name: "وزن",
    type: AttributeType.UNIT,
    values: [],
    filterable: false,
    metadata: { didar_master: true, unit: "g", precision: 3 },
  },
  {
    handle: "weight_range",
    name: "بازه وزن",
    type: AttributeType.SINGLE_SELECT,
    values: ["کمتر از ۳ گرم", "۳ تا ۶ گرم", "۶ تا ۱۲ گرم", "۱۲ تا ۲۰ گرم", "بیش از ۲۰ گرم"],
    metadata: { didar_master: true, unit: "g" },
  },
  {
    handle: "wage_percentage",
    name: "درصد اجرت",
    type: AttributeType.UNIT,
    values: [],
    filterable: false,
    metadata: { didar_master: true, unit: "percent", precision: 2 },
  },
  {
    handle: "wage_range",
    name: "بازه اجرت",
    type: AttributeType.SINGLE_SELECT,
    values: ["کمتر از ۱۰٪", "۱۰ تا ۱۵٪", "۱۵ تا ۲۰٪", "۲۰ تا ۲۵٪", "بیش از ۲۵٪"],
    metadata: { didar_master: true, unit: "percent" },
  },
  {
    handle: "audience",
    name: "مخاطب",
    type: AttributeType.MULTI_SELECT,
    values: ["زنانه", "مردانه", "کودک", "یونیسکس"],
    metadata: { didar_master: true },
  },
  {
    handle: "stone_type",
    name: "نوع سنگ",
    type: AttributeType.MULTI_SELECT,
    values: ["بدون سنگ", "الماس", "برلیان", "فیروزه", "مالاکیت", "مروارید", "سنگ رنگی", "سایر"],
    metadata: { didar_master: true },
  },
  {
    handle: "style",
    name: "سبک",
    type: AttributeType.MULTI_SELECT,
    values: ["روزمره", "لوکس روزمره", "لوکس", "کلاسیک", "مدرن", "مینیمال", "مناسبتی"],
    metadata: { didar_master: true },
  },
  {
    handle: "inventory_source",
    name: "منبع موجودی",
    type: AttributeType.SINGLE_SELECT,
    values: ["انبار دیدار", "انبار تأمین‌کننده", "سفارش ساخت"],
    metadata: { didar_master: true },
  },
  {
    handle: "sale_status",
    name: "وضعیت عرضه",
    type: AttributeType.SINGLE_SELECT,
    values: ["آماده عرضه", "استعلام موجودی", "سفارش ساخت", "ناموجود"],
    metadata: { didar_master: true },
  },
  {
    handle: "warranty_status",
    name: "گارانتی دیدار",
    type: AttributeType.TOGGLE,
    values: [],
    metadata: { didar_master: true },
  },
  {
    handle: "authenticity_status",
    name: "شناسنامه اصالت",
    type: AttributeType.TOGGLE,
    values: [],
    metadata: { didar_master: true, uid_xrf: true },
  },
]

export default async function seedDidarProductModel({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)

  logger.info("Seeding Didar product taxonomy...")

  const existingCategories = await productModule.listProductCategories(
    {},
    { take: 1000 }
  )
  const categoriesByHandle = new Map(
    existingCategories
      .filter((category) => Boolean(category.handle))
      .map((category) => [category.handle!, category])
  )

  for (const level of categoryLevels) {
    const missing = level.filter((item) => !categoriesByHandle.has(item.handle))
    if (!missing.length) continue

    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missing.map((item) => ({
          name: item.name,
          handle: item.handle,
          rank: item.rank,
          is_active: true,
          parent_category_id: item.parentHandle
            ? categoriesByHandle.get(item.parentHandle)?.id
            : undefined,
          metadata: item.metadata,
        })),
      },
    })

    result.forEach((category) => {
      if (category.handle) categoriesByHandle.set(category.handle, category)
    })
  }

  logger.info("Seeding Didar global product attributes...")

  const { data: existingAttributes } = await query.graph({
    entity: "product_attribute",
    fields: ["id", "handle"],
    filters: {
      handle: attributeDefinitions.map((attribute) => attribute.handle),
      product_id: null,
    },
  })
  const existingHandles = new Set(
    existingAttributes.map((attribute: { handle?: string | null }) => attribute.handle)
  )
  const missingAttributes = attributeDefinitions.filter(
    (attribute) => !existingHandles.has(attribute.handle)
  )

  if (missingAttributes.length) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: missingAttributes.map((attribute, rank) => ({
          name: attribute.name,
          handle: attribute.handle,
          type: attribute.type,
          is_required: false,
          is_filterable: attribute.filterable ?? true,
          is_variant_axis: false,
          rank,
          metadata: attribute.metadata,
          values: attribute.values.map((name, valueRank) => ({
            name,
            rank: valueRank,
          })),
        })),
      },
    })
  }

  logger.info(
    `Didar product model ready: ${categoriesByHandle.size} categories, ${attributeDefinitions.length} master attributes.`
  )
}
