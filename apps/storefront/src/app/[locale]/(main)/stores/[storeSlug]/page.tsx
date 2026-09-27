import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DidarRetailStorefront } from "@/components/didar/DidarRetailStorefront"
import { didarRetailStore } from "@/lib/didar/retail-stores"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string; storeSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, storeSlug } = await params
  const store = didarRetailStore(storeSlug)
  return { title: store ? (locale === "fa" ? store.faName : store.enName) : "Didar" }
}

export default async function DidarRetailStorePage({ params }: Props) {
  const { locale, storeSlug } = await params
  if (!isDidarLocale(locale) || !didarRetailStore(storeSlug)) notFound()
  return <DidarRetailStorefront locale={locale} storeSlug={storeSlug} />
}
