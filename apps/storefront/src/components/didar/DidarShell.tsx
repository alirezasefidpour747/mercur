import Image from "next/image"
import Link from "next/link"

import {
  isDidarLocale,
  type DidarLocale,
} from "@/lib/helpers/storefront-locale"
import { DidarNavigation } from "./DidarNavigation"

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
  return <DidarNavigation locale={locale} />
}

export function DidarFooter({ locale }: { locale: string }) {
  if (!isDidarLocale(locale)) return null

  const copy = shellCopy[locale]
  const direction = directionFor(locale)

  return (
    <footer className="didar-footer didar-reference-footer" dir={direction} lang={locale} id="contact">
      <div className="didar-reference-footer-brand">
        <Link href={`/${locale}`} aria-label="DidarGold"><Image src="https://didargold.ir/assets/symbol.svg" unoptimized width={72} height={72} alt="" /></Link>
        <span>Crowned in Silence</span>
        <p>{locale === "fa" ? "پلتفرم طلا و جواهر دیدار گلد" : copy.footer}</p>
        <small>Powered By Beheshti</small>
      </div>
      <nav className="didar-reference-footer-links" aria-label={copy.navLabel}>
        <Link href={`/${locale}/my-didar`}>{locale === "fa" ? "خدمات همکاران" : copy.myDidar}</Link>
        <Link href={`/${locale}/my-didar/consumer/authenticity`}>{locale === "fa" ? "اصالت‌سنجی" : copy.care}</Link>
        <Link href={`/${locale}#collections`}>{copy.collections}</Link>
        <Link href={`/${locale}/jewellery`}>{copy.products}</Link>
        <Link href={`/${locale}/my-didar/preview`}>{locale === "fa" ? "انتخاب‌های من" : copy.myDidar}</Link>
        <Link href={`/${locale}#showroom`}>{locale === "fa" ? "شوروم دیدار" : copy.story}</Link>
      </nav>
      <div className="didar-reference-footer-bottom">
        <Link href={`/${locale}#story`}>{locale === "fa" ? "راهنما و مجموعه‌ها" : copy.story}</Link>
        <span>{locale === "fa" ? "تمام حقوق برای دیدار گلد محفوظ است." : "© Didar Gold"}</span>
      </div>
    </footer>
  )
}
