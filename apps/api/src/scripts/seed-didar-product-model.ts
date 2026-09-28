import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  AttributeType,
  didarGoldAttributeStandard,
  didarFamilies,
  didarTaxonomy,
  MercurModules,
} from "@mercurjs/types"
import { createProductAttributesWorkflow } from "@mercurjs/core/workflows"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import type { ProductAttributeModuleService } from "@mercurjs/core/modules/product-attribute"

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
  required: boolean
  description: string
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

const attributeDefinitions: readonly AttributeSeed[] = didarGoldAttributeStandard

export default async function seedDidarProductModel({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)
  const attributeModule = container.resolve<ProductAttributeModuleService>(
    MercurModules.PRODUCT_ATTRIBUTE
  )

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
    fields: ["id", "handle", "values.id", "values.name"],
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
          description: attribute.description,
          is_required: attribute.required,
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

  const existingByHandle = new Map(
    existingAttributes.map((attribute: any) => [attribute.handle, attribute])
  )

  for (const [rank, definition] of attributeDefinitions.entries()) {
    const existing = existingByHandle.get(definition.handle) as any
    if (!existing) continue

    // Deliberately sequential: this seed may run while the dev API has an
    // active pool, so bounded connection usage is safer than fan-out.
    // eslint-disable-next-line no-await-in-loop
    await attributeModule.updateProductAttributes({
        id: existing.id,
        name: definition.name,
        description: definition.description,
        is_required: definition.required,
        is_filterable: definition.filterable ?? true,
        is_variant_axis: false,
        is_active: true,
        rank,
        metadata: definition.metadata,
    })

    const existingValueNames = new Set(
      (existing.values ?? []).map((value: { name: string }) => value.name)
    )
    const missingValues = definition.values.filter(
      (name) => !existingValueNames.has(name)
    )
    if (missingValues.length) {
      // eslint-disable-next-line no-await-in-loop
      await attributeModule.createProductAttributeValues(
        missingValues.map((name, valueRank) => ({
          attribute_id: existing.id,
          name,
          rank: (existing.values?.length ?? 0) + valueRank,
        }))
      )
    }
  }

  logger.info(
    `Didar product model ready: ${categoriesByHandle.size} categories, ${attributeDefinitions.length} master attributes.`
  )
}
