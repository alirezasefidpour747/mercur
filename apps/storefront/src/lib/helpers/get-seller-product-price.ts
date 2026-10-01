import type { HttpTypes } from "@medusajs/types"

type PricedVariant = Pick<HttpTypes.StoreProductVariant, "id" | "sku"> & {
  prices?: { amount: number; currency_code: string }[] | null
}
type PricedProduct = Pick<HttpTypes.StoreProduct, "id"> & {
  variants?: PricedVariant[] | null
}

import { convertToLocale } from "./money"

export const getPricesForVariant = (variant?: PricedVariant | null) => {
  if (!variant?.prices?.[0]?.amount) {
    return null
  }

  return {
    calculated_price_number: variant.prices[0].amount,
    calculated_price: convertToLocale({
      amount: variant.prices[0].amount,
      currency_code: variant.prices[0].currency_code,
    }),
    original_price_number: variant.prices[0].amount,
    original_price: convertToLocale({
      amount: variant.prices[0].amount,
      currency_code: variant.prices[0].currency_code,
    }),
  }
}

export function getSellerProductPrice({
  product,
  variantId,
}: {
  product: PricedProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const cheapestVariant = product.variants
      .filter((v) => !!v.prices?.[0])
      .sort((a, b) => {
        return (a.prices?.[0]?.amount ?? Number.POSITIVE_INFINITY) -
          (b.prices?.[0]?.amount ?? Number.POSITIVE_INFINITY)
      })[0]

    return getPricesForVariant(cheapestVariant)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    )

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
