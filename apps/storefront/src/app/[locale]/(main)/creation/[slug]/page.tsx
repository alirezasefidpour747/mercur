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
    <Link className="didar-back" href={`/${locale}/jewellery`}>{copy.back}</Link>
    <div className="didar-detail-layout">
      <div className="didar-detail-gallery">
        {images.map((src, i) => <div className="didar-detail-media" key={src}>
          <Image src={src} alt={`${product.title} ${i + 1}`} fill sizes="(max-width: 800px) 50vw, 34vw" priority={i === 0} />
        </div>)}
      </div>
      <div className="didar-detail-copy">
        <p className="didar-eyebrow">DIDAR · CREATION</p>
        <h1 lang="fa" dir="rtl">{product.title}</h1>
        <dl>
          <div><dt>{copy.category}</dt><dd>{product.category ?? copy.unknown}</dd></div>
          <div><dt>{copy.material}</dt><dd>{product.material ?? copy.unknown}</dd></div>
        </dl>
        <p className="didar-data-note">{copy.detailsNote}</p>
        {!product.detailVerified && <p className="didar-data-note">{copy.galleryNote}</p>}
        <a className="didar-source-link" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">{copy.source} ↗</a>
        <Link className="didar-secondary-link" href={`/${locale}/my-didar`}>{copy.viewServices}</Link>
      </div>
    </div>
  </main>
}
