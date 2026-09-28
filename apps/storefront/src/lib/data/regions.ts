'use server'

import { HttpTypes } from '@medusajs/types'

import medusaError from '@/lib/helpers/medusa-error'

import { sdk } from '../client'
import { getCacheOptions } from './cookies'
import { getMarketCountryCode } from '../helpers/storefront-locale'

export const listRegions = async () => {
  const next = {
    ...(await getCacheOptions('regions')),
    revalidate: 3600,
  }

  return sdk.store.regions
    .query({ fetchOptions: { next, cache: 'force-cache' } })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(['regions', id].join('-'))),
    revalidate: 3600,
  }

  return sdk.store.regions.$id
    .query({ $id: id, fetchOptions: { next, cache: 'force-cache' } })
    .then(({ region }) => region)
    .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (localeOrCountryCode: string) => {
  const countryCode = getMarketCountryCode(localeOrCountryCode)

  try {
    if (regionMap.has(countryCode)) return regionMap.get(countryCode)

    const regions = await listRegions()

    if (!regions?.length) return null

    regions.forEach((region) => {
      region.countries?.forEach((country) => {
        const code = country?.iso_2?.toLowerCase()
        if (code) regionMap.set(code, region)
      })
    })

    const defaultCountryCode = (
      process.env.NEXT_PUBLIC_DEFAULT_REGION || 'de'
    ).toLowerCase()
    const selectedRegion =
      regionMap.get(countryCode) ||
      regionMap.get(defaultCountryCode) ||
      regionMap.get('us') ||
      regions[0]

    if (selectedRegion) regionMap.set(countryCode, selectedRegion)

    return selectedRegion ?? null
  } catch {
    return null
  }
}
