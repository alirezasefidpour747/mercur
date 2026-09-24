import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { publicDidarProducts } from "@/lib/didar/public-catalog"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; category?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return { title: isDidarLocale(locale) ? didarUiCopy[locale].catalog : "Didar" }
}

export default async function DidarJewellery({ params, searchParams }: PageProps) {
  const { locale } = await params
  if (!isDidarLocale(locale)) notFound()
  const copy = didarUiCopy[locale]
  const { q = "", category = "" } = await searchParams
  const query = typeof q === "string" ? q.trim().slice(0, 80) : ""
  const selected = typeof category === "string" ? category : ""
  const categories = ["", "طلای روزمره", "طلای لوکس روزمره", "other"]
  const results = publicDidarProducts.filter((product) => {
    const matchesQuery = !query || product.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())
    const matchesCategory = !selected || (selected === "other" ? !product.category : product.category === selected)
    return matchesQuery && matchesCategory
  })
  const labels = [copy.all, copy.daily, copy.luxury, copy.uncategorized]
  const categoryLinks = [
    { label: copy.all, href: `/${locale}/jewellery` },
    { label: copy.daily, href: `/${locale}/jewellery?category=${encodeURIComponent("طلای روزمره")}` },
    { label: locale === "fa" ? "طلای لوکس روزمره" : copy.luxury, href: `/${locale}/jewellery?category=${encodeURIComponent("طلای لوکس روزمره")}` },
    { label: locale === "fa" ? "ساعت طلا" : "Gold watches", href: `/${locale}/jewellery?q=${encodeURIComponent("ساعت")}` },
  ]

  return (
    <main className="didar-site didar-catalog" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
      <nav className="didar-breadcrumb" aria-label={locale === "fa" ? "مسیر صفحه" : "Breadcrumb"}><Link href={`/${locale}`}>{locale === "fa" ? "خانه" : "Home"}</Link><span>‹</span><span>{copy.catalog}</span></nav>
      <div className="didar-catalog-heading">
        <h1>{copy.catalog}</h1>
        <p>{copy.explore}</p>
      </div>
      <nav className="didar-catalog-tabs" aria-label={locale === "fa" ? "دسته‌بندی محصولات" : "Product categories"}>{categoryLinks.map((item) => <Link key={item.href} href={item.href} aria-current={item.href === `/${locale}/jewellery${selected ? `?category=${encodeURIComponent(selected)}` : query ? `?q=${encodeURIComponent(query)}` : ""}` ? "page" : undefined}>{item.label}</Link>)}</nav>
      <form className="didar-catalog-tools" action={`/${locale}/jewellery`} method="get">
        <label>{copy.search}<input name="q" type="search" defaultValue={query} maxLength={80} /></label>
        <label>{copy.filter}<select name="category" defaultValue={selected}>
          {categories.map((value, i) => <option key={value} value={value}>{labels[i]}</option>)}
        </select></label>
        <button type="submit">{copy.explore}</button>
      </form>
      <nav className="didar-catalog-collections" aria-label={locale === "fa" ? "کالکشن‌ها" : "Collections"}><Link href={`/${locale}/jewellery`}>{copy.all}</Link><Link href={`/${locale}/jewellery?q=${encodeURIComponent("عروس")}`}>{locale === "fa" ? "کالکشن عروس" : "Bridal"}</Link><Link href={`/${locale}/jewellery`}>{locale === "fa" ? "دیدار گلد" : "Didar Gold"}</Link><Link href={`/${locale}/jewellery`}>{locale === "fa" ? "سیلون گلد" : "Silon Gold"}</Link></nav>
      <div className="didar-catalog-summary"><p className="didar-catalog-count" aria-live="polite">{results.length} {copy.results}</p><span>{locale === "fa" ? "فیلتر و مرتب‌سازی" : "Filter and sort"} ☷</span></div>
      {results.length ? <div className="didar-product-grid">
        {results.map((product) => <article className="didar-product-card" key={product.slug}>
          <Link href={`/${locale}/creation/${product.slug}`} aria-label={`${copy.detail}: ${product.title}`}>
            <div className="didar-product-image"><Image src={product.image} alt={product.title} fill sizes="(max-width: 760px) 50vw, 33vw" /></div>
            <div className="didar-product-info"><span>{product.category ?? copy.uncategorized}</span><h2 lang="fa" dir="rtl">{product.title}</h2><span className="didar-product-more">{copy.detail} <span aria-hidden="true">↗</span></span></div>
          </Link>
        </article>)}
      </div> : <p className="didar-empty-state">{copy.none}</p>}
    </main>
  )
}
