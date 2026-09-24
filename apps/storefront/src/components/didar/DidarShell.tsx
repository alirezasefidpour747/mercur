import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

import {
  isDidarLocale,
  type DidarLocale,
} from "@/lib/helpers/storefront-locale"
import { DidarLanguageLinks } from "./DidarLanguageLinks"

const directionFor = (locale: DidarLocale) =>
  locale === "fa" || locale === "ar" ? "rtl" : "ltr"

const shellCopy = {
  fa: {
    navLabel: "ناوبری اصلی",
    home: "خانه",
    collections: "مجموعه‌ها",
    products: "زیورآلات",
    myDidar: "مای دیدار",
    story: "جهان دیدار",
    care: "راهنمای انتخاب",
    language: "زبان",
    search: "جست‌وجو",
    footer: "زیبایی در جزئیاتی که می‌مانند.",
  },
  en: {
    navLabel: "Main navigation",
    home: "Home",
    collections: "Collections",
    products: "Jewellery",
    myDidar: "My Didar",
    story: "The Didar world",
    care: "Choosing well",
    language: "Language",
    search: "Search",
    footer: "Beauty in the details that stay.",
  },
  ar: {
    navLabel: "التنقل الرئيسي",
    home: "الرئيسية",
    collections: "المجموعات",
    products: "المجوهرات",
    myDidar: "ديدار الخاص بي",
    story: "عالم ديدار",
    care: "دليل الاختيار",
    language: "اللغة",
    search: "بحث",
    footer: "جمال في تفاصيل تبقى.",
  },
  fr: {
    navLabel: "Navigation principale",
    home: "Accueil",
    collections: "Collections",
    products: "Bijoux",
    myDidar: "Mon Didar",
    story: "L’univers Didar",
    care: "Bien choisir",
    language: "Langue",
    search: "Recherche",
    footer: "La beauté dans les détails qui restent.",
  },
} satisfies Record<DidarLocale, Record<string, string>>

export function DidarHeader({ locale }: { locale: string }) {
  if (!isDidarLocale(locale)) return null

  const copy = shellCopy[locale]
  const direction = directionFor(locale)

  return (
    <header className="didar-header" dir={direction} lang={locale}>
      <div className="didar-header-inner">
        <div className="didar-header-top">
          <Link className="didar-header-account" href={`/${locale}/my-didar`}>{copy.myDidar}</Link>
          <Link className="didar-brand" href={`/${locale}`} aria-label="DidarGold">
            <Image src="/didar/logo.png" width={25} height={24} alt="" priority />
            <span dir="ltr">DIDARGOLD</span>
          </Link>
          <Link className="didar-header-search" href={`/${locale}/jewellery`}>{copy.search} <span aria-hidden="true">⌕</span></Link>
        </div>

        <nav className="didar-nav" aria-label={copy.navLabel}>
          <Link href={`/${locale}`}>{copy.home}</Link>
          <Link href={`/${locale}/jewellery`}>{copy.products}</Link>
          <Link href={`/${locale}#collections`}>{copy.collections}</Link>
          <Link href={`/${locale}#story`}>{copy.story}</Link>
          <Link href={`/${locale}#care`}>{copy.care}</Link>
          <Link href={`/${locale}/my-didar`}>{copy.myDidar}</Link>
        </nav>

        <div className="didar-header-actions">
          <nav className="didar-languages" aria-label={copy.language}>
            <Suspense fallback={null}>
              <DidarLanguageLinks locale={locale} />
            </Suspense>
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
      </div>
      <div className="didar-footer-bottom">
        <span>© Didar</span>
      </div>
    </footer>
  )
}
