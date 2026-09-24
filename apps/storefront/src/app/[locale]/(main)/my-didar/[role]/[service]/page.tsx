import Link from "next/link"
import { notFound } from "next/navigation"

import { didarServicePaths, isDidarRole, isDidarService } from "@/lib/didar/service-paths"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string; role: string; service: string }> }

export default async function DidarServiceView({ params }: Props) {
  const { locale, role, service } = await params
  if (!isDidarLocale(locale) || !isDidarRole(role) || !isDidarService(role, service)) notFound()
  const copy = didarUiCopy[locale]
  const i = didarServicePaths[role].findIndex((item) => item === service)
  const title = copy[`${role}Services` as const][i]
  return <main className="didar-site didar-services didar-service-view" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
    <Link className="didar-back" href={`/${locale}/my-didar/${role}`}>{copy[role]}</Link>
    <div className="didar-catalog-heading"><p className="didar-eyebrow">DIDAR · {copy.myDidar}</p><h1>{title}</h1><p>{copy.serviceState}</p></div>
    <div className="didar-preview-intro"><p role="note">{copy.serviceNote}</p></div>
    <iframe
      className="didar-interactive-frame"
      title={`${copy[role]} · ${title}`}
      src={`/didar/interactive-preview.html?lang=${locale}&role=${role}`}
      sandbox="allow-scripts allow-forms"
      referrerPolicy="no-referrer"
    />
  </main>
}
