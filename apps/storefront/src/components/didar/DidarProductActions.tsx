"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { DidarFavoriteButton } from "@/components/didar/DidarFavoriteButton"
import {
  didarDemoSessionEvent,
  didarDemoSessionKey,
  readDidarDemoSession,
  type DidarDemoSession,
} from "@/lib/didar/demo-auth"
import { didarStoresCarrying } from "@/lib/didar/retail-stores"
import { type DidarLocale } from "@/lib/helpers/storefront-locale"

const copy = {
  fa: { login: "ورود مشتری برای مشاهدهٔ فروشگاه‌ها", partner: "ورود خرده‌فروش و همکار فروش", guest: "برای دیدن فروشگاه‌های دارندهٔ این محصول وارد حساب مشتری شوید.", stores: "فروشگاه‌های دارندهٔ این محصول", stock: "موجودی نمایشی این محصول تأیید شده است", visit: "ورود به فروشگاه", retailTitle: "استعلام همکاری", retailNote: "اجرت، موجودی، وزن نهایی و شرایط تسویه با استعلام تأیید می‌شود.", inquiry: "افزودن محصول به مسیر استعلام", dashboard: "ورود به داشبورد تخصصی", sample: "اطلاعات فروشگاه‌ها فعلاً نمایشی است و بعداً از موجودی واقعی دریافت می‌شود." },
  ar: { login: "دخول العميل لعرض المتاجر", partner: "دخول بائع التجزئة", guest: "سجّل الدخول كعميل لعرض المتاجر التي توفر هذه القطعة.", stores: "المتاجر التي توفر هذه القطعة", stock: "توفر تجريبي مؤكد", visit: "دخول المتجر", retailTitle: "استعلام الشراكة", retailNote: "يتم تأكيد الأجرة والتوفر والوزن وشروط التسوية عبر الاستعلام.", inquiry: "إضافة إلى طلب الاستعلام", dashboard: "الدخول إلى لوحة التحكم", sample: "بيانات المتاجر تجريبية حالياً وستتصل بالمخزون الحقيقي لاحقاً." },
  en: { login: "Customer sign-in to view retailers", partner: "Retail partner sign-in", guest: "Sign in as a customer to see retailers carrying this creation.", stores: "Retailers carrying this creation", stock: "Sample availability confirmed", visit: "Enter store", retailTitle: "Trade inquiry", retailNote: "Making fee, availability, final weight and terms are confirmed by inquiry.", inquiry: "Add creation to inquiry journey", dashboard: "Open specialist dashboard", sample: "Store data is currently illustrative and will later come from verified inventory." },
  fr: { login: "Connexion client pour voir les boutiques", partner: "Connexion partenaire détaillant", guest: "Connectez-vous comme client pour voir les boutiques proposant cette création.", stores: "Boutiques proposant cette création", stock: "Disponibilité fictive confirmée", visit: "Voir la boutique", retailTitle: "Demande professionnelle", retailNote: "Façon, disponibilité, poids final et conditions sont confirmés par demande.", inquiry: "Ajouter à la demande", dashboard: "Ouvrir le tableau de bord", sample: "Les boutiques sont fictives et seront ensuite reliées au stock vérifié." },
} as const

export function DidarProductActions({ locale, slug }: { locale: DidarLocale; slug: string }) {
  const [session, setSession] = useState<DidarDemoSession | null>(null)
  const [ready, setReady] = useState(false)
  const text = copy[locale]
  const returnTo = `/${locale}/creation/${slug}`

  useEffect(() => {
    const sync = () => { setSession(readDidarDemoSession()); setReady(true) }
    sync()
    window.addEventListener(didarDemoSessionEvent, sync)
    const storage = (event: StorageEvent) => { if (event.key === didarDemoSessionKey) sync() }
    window.addEventListener("storage", storage)
    return () => {
      window.removeEventListener(didarDemoSessionEvent, sync)
      window.removeEventListener("storage", storage)
    }
  }, [])

  return <div className="didar-role-product-actions">
    <DidarFavoriteButton slug={slug} locale={locale} className="didar-detail-action didar-detail-favorite" />
    {!ready ? null : !session ? <div className="didar-detail-guest-gate">
      <p>{text.guest}</p>
      <Link className="didar-detail-primary" href={`/${locale}/my-didar?role=consumer&returnTo=${encodeURIComponent(returnTo)}`}>{text.login}</Link>
      <Link className="didar-detail-action" href={`/${locale}/my-didar?role=retailer&returnTo=${encodeURIComponent(returnTo)}`}>{text.partner} ↗</Link>
    </div> : session.role === "consumer" ? <section className="didar-product-stores">
      <h2>{text.stores}</h2>
      <p className="didar-product-stores-note">{text.sample}</p>
      <div className="didar-product-store-list">{didarStoresCarrying(slug).map((store) => <article key={store.slug}>
        <span>{locale === "fa" ? store.cityFa : store.cityEn} · {locale === "fa" ? store.areaFa : store.areaEn}</span>
        <h3>{locale === "fa" ? store.faName : store.enName}</h3>
        <p>{text.stock}</p>
        <Link href={`/${locale}/stores/${store.slug}`}>{text.visit} ↗</Link>
      </article>)}</div>
    </section> : session.role === "retailer" ? <div className="didar-detail-inquiry">
      <h2>{text.retailTitle}</h2><p>{text.retailNote}</p>
      <Link className="didar-detail-primary" href={`/${locale}/my-didar/retailer/inquiries`}>{text.inquiry}</Link>
    </div> : <Link className="didar-detail-primary" href={`/${locale}/my-didar/${session.role}`}>{text.dashboard}</Link>}
  </div>
}
