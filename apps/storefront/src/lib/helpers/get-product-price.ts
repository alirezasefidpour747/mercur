import type { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-precentage-diff"
import { convertToLocale } from "./money"

export const getPricesForVariant = (
  variant?: HttpTypes.StoreProductVariant | null
) => {
  const price = variant?.calculated_price
  if (!price) return null

  const calculated = price.calculated_amount_with_tax ?? price.calculated_amount
  const original = price.calculated_amount_with_tax != null
    ? price.original_amount_with_tax
    : price.original_amount
  const withoutTax = price.calculated_amount_without_tax
  if (
    typeof calculated !== "number" ||
    typeof original !== "number" ||
    typeof withoutTax !== "number" ||
    typeof price.calculated_amount !== "number" ||
    typeof price.original_amount !== "number" ||
    !price.currency_code
  ) return null

  return {
    calculated_price_number: calculated,
    calculated_price: convertToLocale({
      amount: calculated,
      currency_code: price.currency_code,
    }),
    calculated_price_without_tax: convertToLocale({
      amount: withoutTax,
      currency_code: price.currency_code,
    }),
    calculated_price_without_tax_number: withoutTax,
    original_price_number: original,
    original_price: convertToLocale({
      amount: original,
      currency_code: price.currency_code,
    }),
    currency_code: price.currency_code,
    price_type: price.calculated_price?.price_list_type,
    percentage_diff: getPercentageDiff(price.original_amount, price.calculated_amount),
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) throw new Error("No product provided")

  const pricedVariants = (product.variants ?? [])
    .map((variant) => ({ variant, price: getPricesForVariant(variant) }))
    .filter((entry): entry is typeof entry & {
      price: NonNullable<ReturnType<typeof getPricesForVariant>>
    } => entry.price !== null)
    .sort((a, b) => a.price.calculated_price_number - b.price.calculated_price_number)

  const selected = variantId
    ? product.variants?.find((variant) => variant.id === variantId || variant.sku === variantId)
    : undefined

  return {
    product,
    cheapestPrice: pricedVariants[0]?.price ?? null,
    variantPrice: getPricesForVariant(selected),
    cheapestVariant: pricedVariants[0]?.variant ?? null,
  }
}
