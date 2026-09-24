import type { Metadata } from "next"
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

  return (
    <main className="didar-site didar-catalog" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
      <div className="didar-catalog-heading">
        <p className="didar-eyebrow">DIDAR · COLLECTION</p>
        <h1>{copy.catalog}</h1>
        <p>{copy.explore}</p>
      </div>
      <form className="didar-catalog-tools" action={`/${locale}/jewellery`} method="get">
        <label>{copy.search}<input name="q" type="search" defaultValue={query} maxLength={80} /></label>
        <label>{copy.filter}<select name="category" defaultValue={selected}>
          {categories.map((value, i) => <option key={value} value={value}>{labels[i]}</option>)}
        </select></label>
        <button type="submit">{copy.explore}</button>
      </form>
      <p className="didar-catalog-count" aria-live="polite">{results.length} {copy.results}</p>
      {results.length ? <div className="didar-product-grid">
        {results.map((product) => <article className="didar-product-card" key={product.slug}>
          <Link href={`/${locale}/creation/${product.slug}`} aria-label={`${copy.detail}: ${product.title}`}>
            <div className="didar-product-image"><img src={product.image} alt={product.title} loading="lazy" /></div>
            <div className="didar-product-info"><span>{product.category ?? copy.uncategorized}</span><h2 lang="fa" dir="rtl">{product.title}</h2><span className="didar-product-more">{copy.detail} <span aria-hidden="true">↗</span></span></div>
          </Link>
        </article>)}
      </div> : <p className="didar-empty-state">{copy.none}</p>}
    </main>
  )
}
