import { notFound } from "next/navigation"

import { DidarWorkspace } from "@/components/didar/DidarWorkspace"
import { isDidarRole, isDidarService } from "@/lib/didar/service-paths"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string; role: string; service: string }> }

export default async function DidarServiceView({ params }: Props) {
  const { locale, role, service } = await params
  if (!isDidarLocale(locale) || !isDidarRole(role) || !isDidarService(role, service)) notFound()
  return <DidarWorkspace locale={locale} role={role} initialService={service} />
}
