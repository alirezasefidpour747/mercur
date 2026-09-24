import Image from "next/image"
import Link from "next/link"

import {
  DIDAR_LOCALES,
  isDidarLocale,
  type DidarLocale,
} from "@/lib/helpers/storefront-locale"

const directionFor = (locale: DidarLocale) =>
  locale === "fa" || locale === "ar" ? "rtl" : "ltr"

const shellCopy = {
  fa: {
    home: "خانه",
    collections: "مجموعه‌ها",
    story: "جهان دیدار",
    care: "راهنمای انتخاب",
    catalog: "فهرست محصولات",
    language: "زبان",
    footer: "زیبایی در جزئیاتی که می‌مانند.",
  },
  en: {
    home: "Home",
    collections: "Collections",
    story: "The Didar world",
    care: "Choosing well",
    catalog: "Shop the catalog",
    language: "Language",
    footer: "Beauty in the details that stay.",
  },
  ar: {
    home: "الرئيسية",
    collections: "المجموعات",
    story: "عالم ديدار",
    care: "دليل الاختيار",
    catalog: "تصفح المنتجات",
    language: "اللغة",
    footer: "جمال في تفاصيل تبقى.",
  },
  fr: {
    home: "Accueil",
    collections: "Collections",
    story: "L’univers Didar",
    care: "Bien choisir",
    catalog: "Voir le catalogue",
    language: "Langue",
    footer: "La beauté dans les détails qui restent.",
  },
} satisfies Record<DidarLocale, Record<string, string>>

const localeNames: Record<DidarLocale, string> = {
  fa: "فارسی",
  en: "English",
  ar: "العربية",
  fr: "Français",
}

export function DidarHeader({ locale }: { locale: string }) {
  if (!isDidarLocale(locale)) return null

  const copy = shellCopy[locale]
  const direction = directionFor(locale)

  return (
    <header className="didar-header" dir={direction} lang={locale}>
      <div className="didar-header-inner">
        <Link className="didar-brand" href={`/${locale}`} aria-label="Didar">
          <Image
            src="/didar/logo.png"
            width={48}
            height={44}
            alt=""
            priority
          />
          <span>دیدار</span>
        </Link>

        <nav className="didar-nav" aria-label={copy.home}>
          <Link href={`/${locale}`}>{copy.home}</Link>
          <Link href={`/${locale}#collections`}>{copy.collections}</Link>
          <Link href={`/${locale}#story`}>{copy.story}</Link>
          <Link href={`/${locale}#care`}>{copy.care}</Link>
        </nav>

        <div className="didar-header-actions">
          <Link className="didar-header-catalog" href={`/${locale}/categories`}>
            {copy.catalog}
          </Link>
          <nav className="didar-languages" aria-label={copy.language}>
            {DIDAR_LOCALES.map((language) => (
              <Link
                key={language}
                href={`/${language}`}
                lang={language}
                aria-current={language === locale ? "page" : undefined}
                title={localeNames[language]}
              >
                {language.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

export function DidarFooter({ locale }: { locale: string }) {
  if (!isDidarLocale(locale)) return null

  const copy = shellCopy[locale]
  const direction = directionFor(locale)

  return (
    <footer className="didar-footer" dir={direction} lang={locale} id="contact">
      <div className="didar-footer-inner">
        <Link className="didar-brand" href={`/${locale}`} aria-label="Didar">
          <Image src="/didar/logo.png" width={42} height={38} alt="" />
          <span>دیدار</span>
        </Link>
        <p>{copy.footer}</p>
        <Link href={`/${locale}/categories`}>{copy.catalog}</Link>
      </div>
      <div className="didar-footer-bottom">
        <span>© Didar</span>
      </div>
    </footer>
  )
}
