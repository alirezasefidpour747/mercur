import { notFound, redirect } from "next/navigation"

import { DidarAccess } from "@/components/didar/DidarAccess"
import { isDidarRole, isDidarService } from "@/lib/didar/service-paths"
import { didarVendorPanelUrl } from "@/lib/didar/vendor-panel"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string; role: string; service: string }> }

export default async function DidarServiceView({ params }: Props) {
  const { locale, role, service } = await params
  if ((role === "wholesaler" || role === "supplier") && isDidarLocale(locale)) redirect(didarVendorPanelUrl(locale))
  if (!isDidarLocale(locale) || !isDidarRole(role) || !isDidarService(role, service)) notFound()
  return <DidarAccess locale={locale} role={role} service={service} />
}
