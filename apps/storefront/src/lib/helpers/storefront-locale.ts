export const DIDAR_LOCALES = ["fa", "en", "ar", "fr"] as const

export type DidarLocale = (typeof DIDAR_LOCALES)[number]

export const isDidarLocale = (value: string): value is DidarLocale =>
  DIDAR_LOCALES.some((locale) => locale === value.toLowerCase())

/**
 * The URL language is independent of the Medusa sales market. Until market
 * selection is exposed in the storefront, localized pages use the configured
 * default Medusa country for pricing, shipping and inventory rules.
 */
export const getMarketCountryCode = (localeOrCountryCode: string): string => {
  const value = localeOrCountryCode.toLowerCase()

  if (isDidarLocale(value)) {
    return (process.env.NEXT_PUBLIC_DEFAULT_REGION || "de").toLowerCase()
  }

  return value
}
