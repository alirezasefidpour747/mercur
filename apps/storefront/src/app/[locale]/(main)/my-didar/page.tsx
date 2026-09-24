import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { didarUiCopy } from "@/lib/didar/ui-copy"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string }> }
const paths = ["consumer", "retailer", "supplier", "wholesaler"] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: isDidarLocale(locale) ? didarUiCopy[locale].myDidar : "Didar" }
}

export default async function MyDidar({ params }: Props) {
  const { locale } = await params
  if (!isDidarLocale(locale)) notFound()
  const copy = didarUiCopy[locale]
  return <main className="didar-site didar-services" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
    <div className="didar-catalog-heading"><p className="didar-eyebrow">DIDAR · MY DIDAR</p><h1>{copy.gateway}</h1><p>{copy.gatewayIntro}</p></div>
    <div className="didar-service-grid">
      {paths.map((role, i) => {
        const label = copy[role]
        const items = copy[`${role}Services` as const]
        return <Link className="didar-service-card didar-service-card-link" href={`/${locale}/my-didar/${role}`} key={role}>
          <span className="didar-service-number">0{i + 1}</span>
          <h2>{label}</h2>
          <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
          <p>{copy.serviceState}</p>
        </Link>
      })}
    </div>
    <p className="didar-service-disclaimer">{copy.serviceNote}</p>
    <Link className="didar-source-link" href={`/${locale}/my-didar/preview`}>{copy.fullPreview}</Link>
    <Link className="didar-secondary-link" href={`/${locale}/jewellery`}>{copy.catalog}</Link>
  </main>
}
