const supportedLocales = new Set(["fa", "ar", "en", "fr"])

export function bootstrapDidarVendor() {
  const params = new URLSearchParams(window.location.search)
  const localeParam = params.get("locale")
  const locale = localeParam && supportedLocales.has(localeParam) ? localeParam : localStorage.getItem("didar-locale") || "fa"
  const configuredStorefront = import.meta.env.VITE_DIDAR_STOREFRONT_URL as string | undefined
  const inferredStorefront = `${window.location.protocol}//${window.location.hostname}:3000`
  let storefront = (configuredStorefront || inferredStorefront).replace(/\/$/, "")
  const requestedReturnTo = params.get("returnTo")
  let safeReturnTo = `${storefront}/${locale}`
  if (requestedReturnTo) {
    try {
      const requested = new URL(requestedReturnTo)
      const configuredOrigin = new URL(storefront)
      const localDevelopmentOrigin = !configuredStorefront && requested.hostname === window.location.hostname && ["3000", "3001"].includes(requested.port)
      if (requested.origin === configuredOrigin.origin || localDevelopmentOrigin) {
        safeReturnTo = requested.toString()
        if (localDevelopmentOrigin) storefront = requested.origin
      }
    } catch { /* Ignore an invalid or external return URL. */ }
  }

  localStorage.setItem("didar-storefront-url", storefront)
  localStorage.setItem("didar-locale", locale)
  localStorage.setItem("didar-return-to", safeReturnTo)
  localStorage.setItem("lng", locale)
  document.cookie = `lng=${locale};path=/;SameSite=Lax`
  document.documentElement.lang = locale
  document.documentElement.dir = locale === "fa" || locale === "ar" ? "rtl" : "ltr"
}
