import { HttpTypes } from '@medusajs/types'
import { NextRequest, NextResponse } from 'next/server'

import { PROTECTED_ROUTES } from './lib/constants'
import { isTokenExpired } from './lib/helpers/token'
import { isDidarLocale } from './lib/helpers/storefront-locale'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'us'
const configuredDefaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'fa'
const DEFAULT_LOCALE = isDidarLocale(configuredDefaultLocale)
  ? configuredDefaultLocale
  : 'fa'

const makeAuthRedirect = (
  req: NextRequest,
  locale: string,
  reason: 'sessionRequired' | 'sessionExpired'
) => {
  const redirectUrl = new URL(`/${locale}/login`, req.url)
  redirectUrl.searchParams.set(reason, 'true')
  const response = NextResponse.redirect(redirectUrl)

  if (reason === 'sessionExpired') response.cookies.delete('_medusa_jwt')

  return response
}

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      'Middleware.ts: Set MEDUSA_BACKEND_URL and configure at least one region in Medusa Admin.'
    )
  }

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_API_KEY! },
      next: { revalidate: 3600, tags: [`regions-${cacheId}`] },
      cache: 'force-cache',
    }).then(async (response) => {
      const json = await response.json()
      if (!response.ok) throw new Error(json.message)
      return json
    })

    if (!regions?.length) {
      throw new Error('No regions found. Please set up regions in your Medusa Admin.')
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((country) => {
        const code = country.iso_2?.toLowerCase()
        if (code) regionMapCache.regionMap.set(code, region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    const vercelCountryCode = request.headers.get('x-vercel-ip-country')?.toLowerCase()
    const urlCountryCode = request.nextUrl.pathname.split('/')[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) return urlCountryCode
    if (vercelCountryCode && regionMap.has(vercelCountryCode)) return vercelCountryCode
    if (regionMap.has(DEFAULT_REGION)) return DEFAULT_REGION
    return regionMap.keys().next().value
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware.ts: Could not determine a configured Medusa country.')
    }
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes('.')) return NextResponse.next()

  const { pathname } = request.nextUrl
  const cacheIdCookie = request.cookies.get('_medusa_cache_id')
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()
  const urlSegment = pathname.split('/')[1]?.toLowerCase() || ''
  const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment)
  const pathnameWithoutLocale = looksLikeLocale
    ? pathname.replace(/^\/[^/]+/, '')
    : pathname
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  )

  if (isProtectedRoute) {
    const jwtCookie = request.cookies.get('_medusa_jwt')
    const token = jwtCookie?.value
    const locale = looksLikeLocale ? urlSegment : DEFAULT_LOCALE

    if (!jwtCookie) return makeAuthRedirect(request, locale, 'sessionRequired')
    if (token && isTokenExpired(token)) {
      return makeAuthRedirect(request, locale, 'sessionExpired')
    }
  }

  // Language prefixes such as /fa and /ar are not Medusa country codes.
  // Preserve them in the URL; data access resolves the market separately.
  if (isDidarLocale(urlSegment)) {
    const response = NextResponse.next()
    if (!cacheIdCookie) {
      response.cookies.set('_medusa_cache_id', cacheId, { maxAge: 60 * 60 * 24 })
    }
    return response
  }

  if (looksLikeLocale && cacheIdCookie) return NextResponse.next()

  const response = NextResponse.next()
  if (!cacheIdCookie) {
    response.cookies.set('_medusa_cache_id', cacheId, { maxAge: 60 * 60 * 24 })
  }

  const regionMap = await getRegionMap(cacheId)
  const countryCode = await getCountryCode(request, regionMap)
  const urlHasCountryCode =
    countryCode && urlSegment === countryCode.toLowerCase()

  if (!urlHasCountryCode && countryCode) {
    const queryString = request.nextUrl.search || ''
    const redirectUrl = `${request.nextUrl.origin}/${DEFAULT_LOCALE}${pathname}${queryString}`
    return NextResponse.redirect(redirectUrl, 307)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)',
  ],
}
