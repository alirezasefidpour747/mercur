import { notFound } from "next/navigation"

import { DidarAccess } from "@/components/didar/DidarAccess"
import { isDidarRole } from "@/lib/didar/service-paths"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string; role: string }> }

export default async function DidarRoleHome({ params }: Props) {
  const { locale, role } = await params
  if (!isDidarLocale(locale) || !isDidarRole(role)) notFound()
  return <DidarAccess locale={locale} role={role} />
}
