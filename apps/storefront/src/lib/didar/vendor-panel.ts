import type { DidarLocale } from "@/lib/helpers/storefront-locale"

const DEFAULT_VENDOR_PANEL_URL = "http://localhost:7002"

export function didarVendorPanelUrl(locale: DidarLocale) {
  const base = (process.env.NEXT_PUBLIC_VENDOR_URL || DEFAULT_VENDOR_PANEL_URL).replace(/\/$/, "")
  const storefront = (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
  const params = new URLSearchParams({
    locale,
    returnTo: `${storefront}/${locale}`,
    source: "my-didar",
  })

  return `${base}/login?${params.toString()}`
}
