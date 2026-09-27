import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DidarAccess } from "@/components/didar/DidarAccess"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import { isDidarRole } from "@/lib/didar/service-paths"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ role?: string; returnTo?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: isDidarLocale(locale) ? didarUiCopy[locale].myDidar : "Didar" }
}

export default async function MyDidar({ params, searchParams }: Props) {
  const { locale } = await params
  const { role, returnTo } = await searchParams
  if (!isDidarLocale(locale)) notFound()
  return <DidarAccess locale={locale} role={role && isDidarRole(role) ? role : undefined} commerceEntry returnTo={returnTo} />
}
