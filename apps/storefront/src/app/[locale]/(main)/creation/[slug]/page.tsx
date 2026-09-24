import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { publicProduct } from "@/lib/didar/public-catalog"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const product = publicProduct(slug)
  return { title: product?.title ?? "Didar", robots: product && isDidarLocale(locale) ? undefined : { index: false } }
}

export default async function DidarCreation({ params }: Props) {
  const { locale, slug } = await params
  if (!isDidarLocale(locale)) notFound()
  const product = publicProduct(slug)
  if (!product) notFound()
  const copy = didarUiCopy[locale]
  const images = product.gallery.length ? product.gallery : [product.image]

  return <main className="didar-site didar-detail" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
    <nav className="didar-breadcrumb" aria-label={locale === "fa" ? "مسیر صفحه" : "Breadcrumb"}><Link href={`/${locale}/jewellery`}>{copy.catalog}</Link><span>‹</span><span>{product.category ?? copy.uncategorized}</span></nav>
    <div className="didar-detail-layout">
      <div className="didar-detail-gallery">
        {images.map((src, i) => <div className="didar-detail-media" key={src}>
          <Image src={src} alt={`${product.title} ${i + 1}`} fill sizes="(max-width: 800px) 50vw, 34vw" priority={i === 0} />
        </div>)}
      </div>
      <div className="didar-detail-copy">
        <p className="didar-detail-category">{product.category ?? copy.uncategorized}</p>
        <h1 lang="fa" dir="rtl">{product.title}</h1>
        {product.material && <p className="didar-detail-material">{product.material}</p>}
        <a className="didar-detail-anchor" href="#creation-details">{locale === "fa" ? "جزئیات اثر" : copy.detail} ↓</a>
        <div className="didar-detail-gate">{locale === "fa" ? "اجرت و ثبت سفارش فقط پس از تأیید مجوز همکاری فعال می‌شود." : copy.detailsNote}<br /><Link href={`/${locale}/my-didar/retailer/application`}>{locale === "fa" ? "ورود و تکمیل پروندهٔ همکاری ←" : copy.viewServices}</Link></div>
        <div className="didar-detail-inquiry"><h2>{locale === "fa" ? "استعلام همکاری" : copy.viewServices}</h2><p>{locale === "fa" ? "اجرت، موجودی، وزن نهایی و شرایط تسویه با استعلام تأیید می‌شود." : copy.detailsNote}</p></div>
        <Link className="didar-detail-primary" href={`/${locale}/my-didar/retailer/application`}>{locale === "fa" ? "ورود و تأیید همکاری" : copy.viewServices}</Link>
        <Link className="didar-detail-action" href={`/${locale}/my-didar/preview`}>{locale === "fa" ? "ذخیره در انتخاب‌های من" : copy.viewServices} ♡</Link>
        <Link className="didar-detail-action" href={`/${locale}/my-didar/retailer/inquiries`}>{locale === "fa" ? "ارسال مشخصات برای استعلام" : copy.viewServices} ↗</Link>
        <div className="didar-detail-benefits"><Link href={`/${locale}/my-didar/consumer/authenticity`}>{locale === "fa" ? "اصالت با کد اختصاصی" : copy.viewServices} ◇</Link><Link href={`/${locale}/my-didar/consumer/warranty`}>{locale === "fa" ? "گارانتی معتبر دیدار" : copy.viewServices} ◇</Link><Link href={`/${locale}/my-didar/consumer/buyback`}>{locale === "fa" ? "بازخرید شفاف" : copy.viewServices} ◇</Link></div>
        <section id="creation-details" className="didar-detail-facts"><h2>{locale === "fa" ? "جزئیات اثر" : copy.detail}</h2><dl><div><dt>{copy.category}</dt><dd>{product.category ?? copy.unknown}</dd></div><div><dt>{copy.material}</dt><dd>{product.material ?? copy.unknown}</dd></div></dl></section>
        {!product.detailVerified && <p className="didar-data-note">{copy.galleryNote}</p>}
        <a className="didar-detail-source" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">{copy.source} ↗</a>
      </div>
    </div>
  </main>
}
