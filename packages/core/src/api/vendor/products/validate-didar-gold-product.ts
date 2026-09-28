import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  DIDAR_GOLD_ATTRIBUTE_LABELS,
  DIDAR_GOLD_REQUIRED_ATTRIBUTE_HANDLES,
} from "@mercurjs/types"

type AttributeInput = {
  id?: string
  value_ids?: string[]
  value?: string | number | boolean
}

type ProductSubmission = {
  title?: string
  description?: string
  status?: ProductStatus
  categories?: Array<{ id: string }>
  attributes?: AttributeInput[]
  variants?: Array<{ sku?: string | null }>
  images?: Array<{ url: string }>
  thumbnail?: string
}

const numericValue = (
  inputByHandle: Map<string, AttributeInput>,
  handle: string
) => {
  const value = inputByHandle.get(handle)?.value
  if (typeof value === "number") return value
  if (typeof value !== "string" || !value.trim()) return Number.NaN
  return Number(value.replace(/[٫,]/g, "."))
}

const hasValue = (input: AttributeInput | undefined) =>
  Boolean(
    input &&
      ((input.value_ids?.length ?? 0) > 0 ||
        (input.value !== undefined &&
          input.value !== null &&
          String(input.value).trim() !== ""))
  )

/**
 * Drafts intentionally stay permissive. A vendor submission, however, must
 * satisfy the Didar gold catalogue contract before it can enter admin review.
 */
export const validateDidarGoldProductSubmission = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const payload = req.validatedBody as ProductSubmission
  const status = payload.status ?? ProductStatus.PROPOSED

  if (status === ProductStatus.DRAFT) {
    return next()
  }

  const issues: string[] = []

  if ((payload.title?.trim().length ?? 0) < 3) {
    issues.push("نام محصول باید حداقل ۳ نویسه باشد")
  }
  if ((payload.description?.trim().length ?? 0) < 20) {
    issues.push("شرح محصول باید حداقل ۲۰ نویسه باشد")
  }
  if (!payload.thumbnail && !payload.images?.length) {
    issues.push("حداقل یک تصویر محصول الزامی است")
  }

  const categoryIds = payload.categories?.map(({ id }) => id) ?? []
  if (categoryIds.length !== 1) {
    issues.push("انتخاب دقیقاً یک زیرنوع از طبقه‌بندی دیدار الزامی است")
  }

  const variants = payload.variants ?? []
  if (!variants.length || variants.some((variant) => !variant.sku?.trim())) {
    issues.push("کد SKU برای تمام تنوع‌های محصول الزامی است")
  }
  const skus = variants
    .map((variant) => variant.sku?.trim())
    .filter(Boolean) as string[]
  if (new Set(skus).size !== skus.length) {
    issues.push("کد SKU تنوع‌ها باید یکتا باشد")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  if (categoryIds.length === 1) {
    const { data: categories } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle", "metadata"],
      filters: { id: categoryIds },
    })
    const category = categories[0] as
      | { metadata?: Record<string, unknown> | null }
      | undefined
    if (!category || category.metadata?.didar_level !== "subtype") {
      issues.push("دسته انتخابی باید زیرنوع نهایی استاندارد طلای دیدار باشد")
    }
  }

  const attributeInputs = (payload.attributes ?? []).filter(
    (attribute) => Boolean(attribute.id)
  )
  const attributeIds = attributeInputs.map((attribute) => attribute.id!)
  const { data: attributes } = attributeIds.length
    ? await query.graph({
        entity: "product_attribute",
        fields: ["id", "handle"],
        filters: { id: attributeIds },
      })
    : { data: [] }

  const handleById = new Map(
    (attributes as Array<{ id: string; handle?: string | null }>)
      .filter((attribute) => Boolean(attribute.handle))
      .map((attribute) => [attribute.id, attribute.handle!])
  )
  const inputByHandle = new Map<string, AttributeInput>()
  for (const input of attributeInputs) {
    const handle = handleById.get(input.id!)
    if (handle) inputByHandle.set(handle, input)
  }

  const missingAttributes = DIDAR_GOLD_REQUIRED_ATTRIBUTE_HANDLES.filter(
    (handle) => !hasValue(inputByHandle.get(handle))
  )
  if (missingAttributes.length) {
    issues.push(
      `مشخصات اجباری ناقص است: ${missingAttributes
        .map((handle) => DIDAR_GOLD_ATTRIBUTE_LABELS[handle] ?? handle)
        .join("، ")}`
    )
  }

  const minWeight = numericValue(inputByHandle, "weight_min_g")
  const maxWeight = numericValue(inputByHandle, "weight_max_g")
  if (!Number.isFinite(minWeight) || !Number.isFinite(maxWeight)) {
    issues.push("مقادیر وزن باید عددی باشند")
  } else if (minWeight <= 0 || maxWeight < minWeight) {
    issues.push("بازه وزن معتبر نیست؛ حداکثر وزن باید از حداقل کمتر نباشد")
  }

  const minFee = numericValue(inputByHandle, "making_fee_min_percent")
  const maxFee = numericValue(inputByHandle, "making_fee_max_percent")
  if (!Number.isFinite(minFee) || !Number.isFinite(maxFee)) {
    issues.push("مقادیر اجرت باید عددی باشند")
  } else if (minFee < 0 || maxFee > 100 || maxFee < minFee) {
    issues.push("بازه اجرت باید بین صفر تا صد و به ترتیب صعودی باشد")
  }

  const warrantyMonths = numericValue(inputByHandle, "warranty_months")
  if (
    !Number.isFinite(warrantyMonths) ||
    warrantyMonths < 0 ||
    !Number.isInteger(warrantyMonths)
  ) {
    issues.push("مدت گارانتی باید تعداد صحیح و نامنفی ماه باشد")
  }

  if (issues.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `محصول با استاندارد طلای دیدار منطبق نیست: ${issues.join("؛ ")}`
    )
  }

  return next()
}

export const assertStoredProductMeetsDidarGoldStandard = async (
  container: MedusaContainer,
  productId: string,
  expectedStatus: ProductStatus = ProductStatus.DRAFT
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "status",
      "thumbnail",
      "images.url",
      "categories.id",
      "categories.metadata",
      "variants.sku",
      "product_attribute_values.name",
      "product_attribute_values.attribute.handle",
    ],
    filters: { id: productId },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const record = product as any
  const issues: string[] = []
  if (record.status !== expectedStatus) {
    issues.push(
      expectedStatus === ProductStatus.DRAFT
        ? "فقط محصول پیش‌نویس قابل ارسال برای بررسی است"
        : "محصول در وضعیت صحیح برای تأیید مدیر نیست"
    )
  }
  if ((record.title?.trim().length ?? 0) < 3) {
    issues.push("نام محصول باید حداقل ۳ نویسه باشد")
  }
  if ((record.description?.trim().length ?? 0) < 20) {
    issues.push("شرح محصول باید حداقل ۲۰ نویسه باشد")
  }
  if (!record.thumbnail && !record.images?.length) {
    issues.push("حداقل یک تصویر محصول الزامی است")
  }
  if (
    record.categories?.length !== 1 ||
    record.categories[0]?.metadata?.didar_level !== "subtype"
  ) {
    issues.push("انتخاب یک زیرنوع نهایی استاندارد طلای دیدار الزامی است")
  }
  if (
    !record.variants?.length ||
    record.variants.some((variant: { sku?: string | null }) => !variant.sku?.trim())
  ) {
    issues.push("کد SKU برای تمام تنوع‌های محصول الزامی است")
  }

  const valueByHandle = new Map<string, string>()
  for (const linkedValue of record.product_attribute_values ?? []) {
    const handle = linkedValue.attribute?.handle
    if (handle && !valueByHandle.has(handle)) {
      valueByHandle.set(handle, linkedValue.name)
    }
  }

  const missingAttributes = DIDAR_GOLD_REQUIRED_ATTRIBUTE_HANDLES.filter(
    (handle) => !valueByHandle.has(handle)
  )
  if (missingAttributes.length) {
    issues.push(
      `مشخصات اجباری ناقص است: ${missingAttributes
        .map((handle) => DIDAR_GOLD_ATTRIBUTE_LABELS[handle] ?? handle)
        .join("، ")}`
    )
  }

  const numberFor = (handle: string) =>
    Number((valueByHandle.get(handle) ?? "").replace(/[٫,]/g, "."))
  const minWeight = numberFor("weight_min_g")
  const maxWeight = numberFor("weight_max_g")
  if (
    !Number.isFinite(minWeight) ||
    !Number.isFinite(maxWeight) ||
    minWeight <= 0 ||
    maxWeight < minWeight
  ) {
    issues.push("بازه وزن معتبر نیست")
  }
  const minFee = numberFor("making_fee_min_percent")
  const maxFee = numberFor("making_fee_max_percent")
  if (
    !Number.isFinite(minFee) ||
    !Number.isFinite(maxFee) ||
    minFee < 0 ||
    maxFee > 100 ||
    maxFee < minFee
  ) {
    issues.push("بازه اجرت معتبر نیست")
  }

  const warrantyMonths = numberFor("warranty_months")
  if (
    !Number.isFinite(warrantyMonths) ||
    warrantyMonths < 0 ||
    !Number.isInteger(warrantyMonths)
  ) {
    issues.push("مدت گارانتی معتبر نیست")
  }

  if (issues.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `محصول با استاندارد طلای دیدار منطبق نیست: ${issues.join("؛ ")}`
    )
  }

  return product
}
