import { listRegions } from "../data/regions"
import { getMarketCountryCode, isDidarLocale } from "./storefront-locale"

export const checkRegion = async (localeOrCountryCode: string) => {
  const regions = await listRegions().catch(() => null)
  const countries = (regions || [])
    .flatMap((region) => region.countries?.map((country) => country.iso_2) || [])
    .filter((countryCode): countryCode is string => Boolean(countryCode))
    .map((countryCode) => countryCode.toLowerCase())

  if (isDidarLocale(localeOrCountryCode)) {
    const marketCountryCode = getMarketCountryCode(localeOrCountryCode)

    // If the configured country is absent, getRegion() falls back to the first
    // configured Medusa market so the language route can still render.
    return countries.includes(marketCountryCode) || countries.length > 0
  }

  return countries.includes(localeOrCountryCode.toLowerCase())
}
