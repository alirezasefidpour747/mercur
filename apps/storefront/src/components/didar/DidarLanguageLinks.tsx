"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { DIDAR_LOCALES, type DidarLocale } from "@/lib/helpers/storefront-locale"

const localeNames: Record<DidarLocale, string> = {
  fa: "فارسی",
  en: "English",
  ar: "العربية",
  fr: "Français",
}

/** Keep the current page and its filters when changing the display language. */
export function DidarLanguageLinks({
  locale,
}: {
  locale: DidarLocale
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const match = pathname?.match(/^\/(?:fa|ar|en|fr)(?=\/|$)/i)
  const rest = match ? pathname.slice(match[0].length) : ""
  const query = searchParams?.toString()

  return (
    <>
      {DIDAR_LOCALES.map((language) => (
        <Link
          key={language}
          href={`/${language}${rest}${query ? `?${query}` : ""}`}
          lang={language}
          aria-current={language === locale ? "page" : undefined}
          title={localeNames[language]}
        >
          {language.toUpperCase()}
        </Link>
      ))}
    </>
  )
}
