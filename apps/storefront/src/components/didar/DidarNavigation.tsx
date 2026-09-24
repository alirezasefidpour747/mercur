"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

import { publicDidarProducts } from "@/lib/didar/public-catalog"
import { type DidarLocale } from "@/lib/helpers/storefront-locale"
import { DidarLanguageLinks } from "./DidarLanguageLinks"

const labels = {
  fa: { menu: "باز کردن منو", close: "بستن", back: "بازگشت", shop: "فروشگاه", trade: "معاملات طلا", tradeNote: "خرید و فروش طلای آب‌شده", licence: "مجوزها", services: "خدمات مشتریان", verify: "اصالت‌سنجی", contact: "تماس با دیدار", all: "همهٔ محصولات", daily: "طلای روزمره", everyday: "طلای لوکس روزمره", luxury: "طلای لوکس", watch: "ساعت طلا", collections: "کالکشن‌ها", search: "جست‌وجو", find: "جست‌وجوی یک اثر", placeholder: "جست‌وجوی جواهرات، انگشتر، گردنبند…", discover: "آثار ما را کشف کنید", account: "حساب کاربری و ورود" },
  ar: { menu: "افتح القائمة", close: "إغلاق", back: "عودة", shop: "المتجر", trade: "تداول الذهب", tradeNote: "شراء وبيع الذهب", licence: "التراخيص", services: "خدمات العملاء", verify: "التحقق من الأصالة", contact: "اتصل بنا", all: "جميع المنتجات", daily: "ذهب يومي", everyday: "ذهب فاخر يومي", luxury: "ذهب فاخر", watch: "ساعات ذهبية", collections: "المجموعات", search: "بحث", find: "ابحث عن قطعة", placeholder: "ابحث عن مجوهرات…", discover: "اكتشف إبداعاتنا", account: "حسابي" },
  en: { menu: "Open menu", close: "Close", back: "Back", shop: "Shop", trade: "Gold trading", tradeNote: "Buy and sell gold", licence: "Licences", services: "Customer services", verify: "Verify authenticity", contact: "Contact Didar", all: "All creations", daily: "Everyday gold", everyday: "Everyday luxury", luxury: "Luxury gold", watch: "Gold watches", collections: "Collections", search: "Search", find: "Find a creation", placeholder: "Search jewellery, rings, necklaces…", discover: "Discover our creations", account: "Account and sign in" },
  fr: { menu: "Ouvrir le menu", close: "Fermer", back: "Retour", shop: "Boutique", trade: "Négoce de l’or", tradeNote: "Acheter et vendre l’or", licence: "Licences", services: "Services clients", verify: "Authenticité", contact: "Contacter Didar", all: "Toutes les créations", daily: "Or quotidien", everyday: "Luxe quotidien", luxury: "Or de luxe", watch: "Montres en or", collections: "Collections", search: "Recherche", find: "Trouver une création", placeholder: "Bijoux, bagues, colliers…", discover: "Découvrir nos créations", account: "Compte et connexion" },
} as const

export function DidarNavigation({ locale }: { locale: DidarLocale }) {
  const pathname = usePathname()
  const [panel, setPanel] = useState<"none" | "menu" | "search">("none")
  const [section, setSection] = useState<"root" | "shop">("root")
  const [query, setQuery] = useState("")
  const copy = labels[locale]
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`
  const dir = locale === "fa" || locale === "ar" ? "rtl" : "ltr"
  const results = publicDidarProducts.filter((item) => item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0, 24)
  const close = () => { setPanel("none"); setSection("root") }

  useEffect(() => {
    if (panel === "none") return
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setPanel("none") }
    window.addEventListener("keydown", escape)
    return () => window.removeEventListener("keydown", escape)
  }, [panel])

  return <>
    <header className={`didar-masthead ${isHome ? "didar-masthead-home" : ""}`} dir={dir} lang={locale}>
      <button type="button" className="didar-menu-trigger" aria-label={copy.menu} onClick={() => { setPanel("menu"); setSection("root") }}>☰</button>
      <button type="button" className="didar-search-trigger" onClick={() => setPanel("search")}>{copy.search} <span aria-hidden="true">⌕</span></button>
      <Link className="didar-wordmark" href={`/${locale}`} onClick={close} aria-label="DidarGold"><Image src="https://didargold.ir/assets/wordmark.svg" unoptimized width={270} height={70} priority alt="DIDARGOLD" /></Link>
      <Link className="didar-account-trigger" href={`/${locale}/my-didar`} onClick={close} aria-label={copy.account}>♙</Link>
    </header>
    {panel === "menu" && <div className="didar-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <aside className="didar-drawer" role="dialog" aria-modal="true" aria-label={copy.menu} dir={dir}>
        <button className="didar-drawer-close" type="button" onClick={close}>{copy.close} ×</button>
        {section === "root" ? <nav className="didar-drawer-links">
          <button className="didar-drawer-feature" type="button" onClick={() => setSection("shop")}>{copy.shop}<span>‹</span></button>
          <Link className="didar-drawer-feature" href={`/${locale}/my-didar`} onClick={close}>{copy.trade}<small>{copy.tradeNote}</small></Link>
          <Link href={`/${locale}/my-didar`} onClick={close}>{copy.licence}</Link>
          <Link href={`/${locale}/my-didar`} onClick={close}>{copy.services}</Link>
          <Link href={`/${locale}/my-didar/consumer/authenticity`} onClick={close}>{copy.verify}</Link>
          <Link href={`/${locale}#contact`} onClick={close}>{copy.contact}</Link>
        </nav> : <nav className="didar-drawer-links didar-shop-links">
          <button className="didar-drawer-back" type="button" onClick={() => setSection("root")}>‹ {copy.back}</button>
          <p>{copy.shop} DIDAR</p>
          <Link href={`/${locale}/jewellery`} onClick={close}>{copy.all}</Link>
          <Link href={`/${locale}/jewellery?category=${encodeURIComponent("طلای روزمره")}`} onClick={close}>{copy.daily}</Link>
          <Link href={`/${locale}/jewellery?category=${encodeURIComponent("طلای لوکس روزمره")}`} onClick={close}>{copy.everyday}</Link>
          <Link href={`/${locale}/jewellery`} onClick={close}>{copy.luxury}</Link>
          <Link href={`/${locale}/jewellery?q=${encodeURIComponent("ساعت")}`} onClick={close}>{copy.watch}</Link>
          <p>{copy.collections}</p><Link href={`/${locale}#collections`} onClick={close}>{copy.collections}</Link>
        </nav>}
        <div className="didar-drawer-symbol" aria-hidden="true">◇</div>
        <div className="didar-drawer-languages"><Suspense fallback={null}><DidarLanguageLinks locale={locale} /></Suspense></div>
      </aside>
    </div>}
    {panel === "search" && <div className="didar-search-overlay" role="dialog" aria-modal="true" aria-label={copy.find} dir={dir}>
      <button className="didar-drawer-close" type="button" onClick={close}>{copy.close} ×</button>
      <div className="didar-search-content"><h2>{copy.find}</h2><input autoFocus type="search" aria-label={copy.find} placeholder={copy.placeholder} value={query} onChange={(event) => setQuery(event.target.value)} /><p>{copy.discover}</p>
        <div className="didar-search-results">{results.map((item) => <Link href={`/${locale}/creation/${item.slug}`} key={item.slug} onClick={close}><Image src={item.image} alt="" width={84} height={84} /><span lang="fa" dir="rtl">{item.title}</span></Link>)}</div>
      </div>
    </div>}
  </>
}
