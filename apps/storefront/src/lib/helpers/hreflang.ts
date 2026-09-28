export const toHreflang = (code: string): string => {
  const map: Record<string, string> = {
    fa: "fa-IR",
    en: "en-US",
    ar: "ar",
    us: "en-US",
    gb: "en-GB",
    au: "en-AU",
    ca: "en-CA",
    ie: "en-IE",
    pl: "pl-PL",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    it: "it-IT",
    nl: "nl-NL",
    se: "sv-SE",
    no: "nb-NO",
    dk: "da-DK",
    cz: "cs-CZ",
    sk: "sk-SK",
    pt: "pt-PT",
    br: "pt-BR",
    at: "de-AT",
    ch: "de-CH",
    cn: "zh-CN",
    jp: "ja-JP",
    kr: "ko-KR",
    tw: "zh-TW",
    hk: "zh-HK",
    sg: "en-SG",
    my: "ms-MY",
  }
  return map[code] || code
}

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

export const resolveXDefaultLocale = (locales: string[]): string => {
  if (!locales.length) return "fa"
  for (const preferred of ["fa", DEFAULT_REGION, "us", "gb"]) {
    if (locales.includes(preferred)) return preferred
  }
  return locales[0]
}

export const getStorefrontLocales = (
  _regions: { countries?: { iso_2?: string | null }[] | null }[] | null
): string[] => ["fa", "en", "ar", "fr"]

type HreflangAlternates = {
  canonical: string
  languages: Record<string, string>
}

export const buildHreflangAlternates = ({
  baseUrl,
  path,
  locale,
  locales,
}: {
  baseUrl: string
  path: string
  locale: string
  locales: string[]
}): HreflangAlternates => {
  const list = locales.length ? locales : [locale]
  const languages = list.reduce<Record<string, string>>((acc, code) => {
    acc[toHreflang(code)] = `${baseUrl}/${code}${path}`
    return acc
  }, {})

  languages["x-default"] = `${baseUrl}/${resolveXDefaultLocale(list)}${path}`

  return {
    canonical: `${baseUrl}/${locale}${path}`,
    languages,
  }
}
