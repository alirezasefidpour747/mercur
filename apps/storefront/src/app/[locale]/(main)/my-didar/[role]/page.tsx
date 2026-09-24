import { notFound } from "next/navigation"

import { DidarWorkspace } from "@/components/didar/DidarWorkspace"
import { isDidarRole } from "@/lib/didar/service-paths"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string; role: string }> }

export default async function DidarRoleHome({ params }: Props) {
  const { locale, role } = await params
  if (!isDidarLocale(locale) || !isDidarRole(role)) notFound()
  return <DidarWorkspace locale={locale} role={role} />
}
