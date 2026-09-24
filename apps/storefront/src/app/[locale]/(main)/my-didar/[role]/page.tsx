import Link from "next/link"
import { notFound } from "next/navigation"

import { didarServicePaths, isDidarRole } from "@/lib/didar/service-paths"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import { isDidarLocale } from "@/lib/helpers/storefront-locale"

type Props = { params: Promise<{ locale: string; role: string }> }

export default async function DidarRoleHome({ params }: Props) {
  const { locale, role } = await params
  if (!isDidarLocale(locale) || !isDidarRole(role)) notFound()
  const copy = didarUiCopy[locale]
  const services = copy[`${role}Services` as const]
  return <main className="didar-site didar-services" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
    <Link className="didar-back" href={`/${locale}/my-didar`}>{copy.myDidar}</Link>
    <div className="didar-catalog-heading"><p className="didar-eyebrow">DIDAR · MY DIDAR</p><h1>{copy[role]}</h1><p>{copy.gatewayIntro}</p></div>
    <div className="didar-service-grid">
      {didarServicePaths[role].map((service, index) => <Link className="didar-service-card didar-service-card-link" href={`/${locale}/my-didar/${role}/${service}`} key={service}>
        <span className="didar-service-number">0{index + 1}</span><h2>{services[index]}</h2><p>{copy.serviceState} ↗</p>
      </Link>)}
    </div>
    <p className="didar-service-disclaimer">{copy.serviceNote}</p>
  </main>
}
