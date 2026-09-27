import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { DidarFavoriteButton } from "@/components/didar/DidarFavoriteButton"
import { DidarProductMeta } from "@/components/didar/DidarProductMeta"
import {
  filterDidarCatalog,
  hasDidarCatalogFilters,
  parseDidarCatalogFilters,
} from "@/lib/didar/catalog-filters"
import { getDidarCatalog } from "@/lib/didar/medusa-catalog"
import { didarFamilies, didarTaxonomy } from "@/lib/didar/product-taxonomy"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import {
  isDidarLocale,
  type DidarLocale,
} from "@/lib/helpers/storefront-locale"

type SearchValue = string | string[] | undefined
type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, SearchValue>>
}

const filterCopy = {
  fa: {
    filters: "فیلتر محصولات",
    family: "خانواده محصول",
    category: "دسته محصول",
    subtype: "نوع محصول",
    purity: "عیار",
    weight: "بازه وزن (گرم)",
    wage: "بازه اجرت (درصد)",
    inventory: "منبع تأمین",
    availability: "وضعیت عرضه",
    verified: "کامل بودن اطلاعات",
    sort: "مرتب‌سازی",
    min: "از",
    max: "تا",
    apply: "اعمال فیلتر",
    clear: "حذف همه فیلترها",
    all: "همه",
    didar: "انبار دیدار",
    supplier: "انبار تأمین‌کننده",
    made: "سفارش ساخت",
    available: "آماده عرضه",
    inquiry: "استعلام موجودی",
    unavailable: "ناموجود",
    complete: "اطلاعات تأییدشده",
    incomplete: "نیازمند تکمیل",
    defaultSort: "پیشنهاد دیدار",
    titleSort: "نام محصول",
    weightSort: "وزن سبک‌تر",
    dataNotice:
      "وزن، اجرت و تأمین‌کننده فقط برای محصولاتی فیلتر می‌شوند که این اطلاعات در شناسنامه آن‌ها ثبت شده باشد.",
  },
  ar: {
    filters: "تصفية المنتجات", family: "عائلة المنتج", category: "الفئة", subtype: "النوع", purity: "العيار", weight: "نطاق الوزن", wage: "نطاق المصنعية", inventory: "مصدر المخزون", availability: "حالة العرض", verified: "اكتمال البيانات", sort: "الترتيب", min: "من", max: "إلى", apply: "تطبيق", clear: "مسح الكل", all: "الكل", didar: "مخزون ديدار", supplier: "مخزون المورد", made: "حسب الطلب", available: "متاح", inquiry: "استعلام", unavailable: "غير متاح", complete: "بيانات مؤكدة", incomplete: "بحاجة للاستكمال", defaultSort: "اختيار ديدار", titleSort: "اسم المنتج", weightSort: "الأخف وزناً", dataNotice: "تعمل فلاتر الوزن والمصنعية والمورد عند اكتمال بطاقة المنتج.",
  },
  en: {
    filters: "Product filters", family: "Product family", category: "Category", subtype: "Product type", purity: "Fineness", weight: "Weight range (g)", wage: "Making range (%)", inventory: "Inventory source", availability: "Availability", verified: "Data completeness", sort: "Sort", min: "From", max: "To", apply: "Apply filters", clear: "Clear all", all: "All", didar: "Didar inventory", supplier: "Supplier inventory", made: "Made to order", available: "Available", inquiry: "Availability inquiry", unavailable: "Unavailable", complete: "Verified data", incomplete: "Needs completion", defaultSort: "Didar selection", titleSort: "Product name", weightSort: "Lowest weight", dataNotice: "Weight, making and supplier filters apply when those fields are present in the product passport.",
  },
  fr: {
    filters: "Filtres produits", family: "Famille", category: "Catégorie", subtype: "Type de produit", purity: "Titre", weight: "Plage de poids (g)", wage: "Façon (%)", inventory: "Source du stock", availability: "Disponibilité", verified: "Complétude", sort: "Tri", min: "De", max: "À", apply: "Appliquer", clear: "Tout effacer", all: "Tous", didar: "Stock Didar", supplier: "Stock fournisseur", made: "Sur commande", available: "Disponible", inquiry: "Sur demande", unavailable: "Indisponible", complete: "Données vérifiées", incomplete: "À compléter", defaultSort: "Sélection Didar", titleSort: "Nom du produit", weightSort: "Poids croissant", dataNotice: "Les filtres de poids, façon et fournisseur s’appliquent lorsque la fiche produit est renseignée.",
  },
} as const

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return { title: isDidarLocale(locale) ? didarUiCopy[locale].catalog : "Didar" }
}

const localized = (
  value: { fa: string; ar: string; en: string; fr: string },
  locale: DidarLocale
) => value[locale]

export default async function DidarJewellery({ params, searchParams }: PageProps) {
  const { locale } = await params
  if (!isDidarLocale(locale)) notFound()

  const copy = didarUiCopy[locale]
  const labels = filterCopy[locale]
  const filters = parseDidarCatalogFilters(await searchParams)
  const results = filterDidarCatalog(await getDidarCatalog(), filters)
  const selectedCategory = didarTaxonomy.find((item) => item.id === filters.category)
  const visibleCategories = filters.family
    ? didarTaxonomy.filter((item) => item.family === filters.family)
    : didarTaxonomy
  const rtl = locale === "fa" || locale === "ar"

  return (
    <main className="didar-site didar-catalog" lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <nav className="didar-breadcrumb" aria-label={locale === "fa" ? "مسیر صفحه" : "Breadcrumb"}>
        <Link href={`/${locale}`}>{locale === "fa" ? "خانه" : "Home"}</Link>
        <span>‹</span><span>{copy.catalog}</span>
      </nav>

      <div className="didar-catalog-heading">
        <h1>{copy.catalog}</h1>
        <p>{copy.explore}</p>
      </div>

      <div className="didar-master-catalog-layout">
        <aside className="didar-master-filters">
          <div className="didar-master-filter-title">
            <h2>{labels.filters}</h2>
            {hasDidarCatalogFilters(filters) && <Link href={`/${locale}/jewellery`}>{labels.clear}</Link>}
          </div>

          <form action={`/${locale}/jewellery`} method="get">
            <label className="didar-filter-wide">
              <span>{copy.search}</span>
              <input name="q" type="search" defaultValue={filters.q} maxLength={80} />
            </label>

            <label>
              <span>{labels.family}</span>
              <select name="family" defaultValue={filters.family}>
                <option value="">{labels.all}</option>
                {didarFamilies.map((item) => <option key={item.id} value={item.id}>{localized(item, locale)}</option>)}
              </select>
            </label>

            <label>
              <span>{labels.category}</span>
              <select name="category" defaultValue={filters.category}>
                <option value="">{labels.all}</option>
                {visibleCategories.map((item) => <option key={item.id} value={item.id}>{localized(item, locale)}</option>)}
              </select>
            </label>

            <label>
              <span>{labels.subtype}</span>
              <select name="subtype" defaultValue={filters.subtype}>
                <option value="">{labels.all}</option>
                {(selectedCategory?.types ?? []).map((item) => <option key={item.id} value={item.id}>{localized(item, locale)}</option>)}
              </select>
            </label>

            <label>
              <span>{labels.purity}</span>
              <select name="purity" defaultValue={filters.purity}>
                <option value="">{labels.all}</option>
                <option value="750">۱۸ عیار / 750‰</option>
                <option value="900">سکه بانکی / 900‰</option>
                <option value="916">۲۲ عیار / 916‰</option>
                <option value="995">شمش / 995‰</option>
                <option value="999">۲۴ عیار / 999‰</option>
                <option value="999.9">شمش خالص / 999.9‰</option>
              </select>
            </label>

            <fieldset>
              <legend>{labels.weight}</legend>
              <div><input aria-label={`${labels.weight} ${labels.min}`} name="minWeight" type="number" min="0" step="0.01" placeholder={labels.min} defaultValue={filters.minWeight ?? ""} /><input aria-label={`${labels.weight} ${labels.max}`} name="maxWeight" type="number" min="0" step="0.01" placeholder={labels.max} defaultValue={filters.maxWeight ?? ""} /></div>
            </fieldset>

            <fieldset>
              <legend>{labels.wage}</legend>
              <div><input aria-label={`${labels.wage} ${labels.min}`} name="minWage" type="number" min="0" step="0.1" placeholder={labels.min} defaultValue={filters.minWage ?? ""} /><input aria-label={`${labels.wage} ${labels.max}`} name="maxWage" type="number" min="0" step="0.1" placeholder={labels.max} defaultValue={filters.maxWage ?? ""} /></div>
            </fieldset>

            <label>
              <span>{labels.inventory}</span>
              <select name="inventory_source" defaultValue={filters.inventorySource}>
                <option value="">{labels.all}</option><option value="didar">{labels.didar}</option><option value="supplier">{labels.supplier}</option><option value="made-to-order">{labels.made}</option>
              </select>
            </label>

            <label>
              <span>{labels.availability}</span>
              <select name="sale_status" defaultValue={filters.saleStatus}>
                <option value="">{labels.all}</option><option value="available">{labels.available}</option><option value="inquiry">{labels.inquiry}</option><option value="made-to-order">{labels.made}</option><option value="unavailable">{labels.unavailable}</option>
              </select>
            </label>

            <label>
              <span>{labels.verified}</span>
              <select name="verified" defaultValue={filters.verified}>
                <option value="">{labels.all}</option><option value="yes">{labels.complete}</option><option value="no">{labels.incomplete}</option>
              </select>
            </label>

            <label>
              <span>{labels.sort}</span>
              <select name="sort" defaultValue={filters.sort}>
                <option value="default">{labels.defaultSort}</option><option value="title">{labels.titleSort}</option><option value="weight">{labels.weightSort}</option>
              </select>
            </label>

            <button type="submit">{labels.apply}</button>
            <p className="didar-filter-note">{labels.dataNotice}</p>
          </form>
        </aside>

        <section className="didar-master-results">
          <div className="didar-catalog-summary">
            <p className="didar-catalog-count" aria-live="polite">{results.length} {copy.results}</p>
            {hasDidarCatalogFilters(filters) && <Link href={`/${locale}/jewellery`}>{labels.clear}</Link>}
          </div>

          {results.length ? <div className="didar-product-grid">
            {results.map((product) => <article className="didar-product-card" key={product.slug}>
              <DidarFavoriteButton slug={product.slug} locale={locale} className="didar-product-favorite" />
              <Link href={`/${locale}/creation/${product.slug}`} aria-label={`${copy.detail}: ${product.title}`}>
                <div className="didar-product-image"><Image src={product.image} alt={product.title} fill sizes="(max-width: 760px) 50vw, 25vw" /></div>
                <div className="didar-product-info"><span>{product.categoryLabel ?? product.category ?? copy.uncategorized}</span><h2 lang="fa" dir="rtl">{product.title}</h2><DidarProductMeta product={product} locale={locale} compact /><span className="didar-product-more">{copy.detail} <span aria-hidden="true">↗</span></span></div>
              </Link>
            </article>)}
          </div> : <p className="didar-empty-state">{copy.none}</p>}
        </section>
      </div>
    </main>
  )
}
