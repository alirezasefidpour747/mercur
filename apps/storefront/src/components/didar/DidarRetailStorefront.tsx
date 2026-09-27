"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import {
  didarDemoSessionEvent,
  didarDemoSessionKey,
  readDidarDemoSession,
  type DidarDemoSession,
} from "@/lib/didar/demo-auth"
import { didarProductsForStore, didarRetailStore } from "@/lib/didar/retail-stores"
import { type DidarLocale } from "@/lib/helpers/storefront-locale"

const words = {
  fa: { eyebrow: "فروشگاه همکار دیدار", available: "محصولات موجود دیدار در این فروشگاه", note: "این ویترین فقط محصولات دیداری را نشان می‌دهد که فروشگاه منتخب در اختیار دارد. موجودی فعلاً نمایشی است.", login: "برای مشاهدهٔ ویترین فروشگاه وارد حساب مشتری شوید", enter: "ورود مشتری", detail: "مشاهده محصول", back: "بازگشت به محصولات دیدار" },
  ar: { eyebrow: "متجر شريك ديدار", available: "منتجات ديدار المتوفرة في هذا المتجر", note: "تعرض هذه الواجهة فقط منتجات ديدار المتوفرة لدى المتجر المحدد. المخزون تجريبي حالياً.", login: "سجّل الدخول كعميل لعرض واجهة المتجر", enter: "دخول العميل", detail: "عرض المنتج", back: "العودة إلى منتجات ديدار" },
  en: { eyebrow: "Didar retail partner", available: "Didar creations available at this store", note: "This storefront shows only the Didar creations carried by the selected retailer. Availability is illustrative for now.", login: "Sign in as a customer to view this storefront", enter: "Customer sign-in", detail: "View creation", back: "Back to Didar creations" },
  fr: { eyebrow: "Détaillant partenaire Didar", available: "Créations Didar disponibles dans cette boutique", note: "Cette vitrine affiche uniquement les créations Didar proposées par le détaillant. La disponibilité est fictive.", login: "Connectez-vous comme client pour voir cette boutique", enter: "Connexion client", detail: "Voir la création", back: "Retour aux créations Didar" },
} as const

export function DidarRetailStorefront({ locale, storeSlug }: { locale: DidarLocale; storeSlug: string }) {
  const [session, setSession] = useState<DidarDemoSession | null>(null)
  const [ready, setReady] = useState(false)
  const store = didarRetailStore(storeSlug)!
  const products = didarProductsForStore(storeSlug)
  const text = words[locale]
  const rtl = locale === "fa" || locale === "ar"

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

  if (!ready) return <main className="didar-site didar-storefront-loading" />
  if (!session) {
    const returnTo = `/${locale}/stores/${storeSlug}`
    return <main className="didar-site didar-storefront-gate" dir={rtl ? "rtl" : "ltr"} lang={locale}>
      <p>{text.login}</p>
      <Link className="didar-detail-primary" href={`/${locale}/my-didar?role=consumer&returnTo=${encodeURIComponent(returnTo)}`}>{text.enter}</Link>
    </main>
  }

  return <main className="didar-site didar-retail-storefront" dir={rtl ? "rtl" : "ltr"} lang={locale}>
    <nav className="didar-breadcrumb"><Link href={`/${locale}/jewellery`}>{text.back}</Link><span>‹</span><span>{locale === "fa" ? store.faName : store.enName}</span></nav>
    <header>
      <p className="didar-eyebrow">{text.eyebrow}</p>
      <h1>{locale === "fa" ? store.faName : store.enName}</h1>
      <p>{locale === "fa" ? `${store.cityFa}، ${store.areaFa}` : `${store.cityEn}, ${store.areaEn}`}</p>
    </header>
    <section>
      <h2>{text.available}</h2>
      <p className="didar-product-stores-note">{text.note}</p>
      <div className="didar-product-grid">{products.map((product) => <article className="didar-product-card" key={product.slug}>
        <Link href={`/${locale}/creation/${product.slug}`}>
          <div className="didar-product-image"><Image src={product.image} alt={product.title} fill sizes="(max-width: 760px) 50vw, 25vw" /></div>
          <div className="didar-product-info"><span>{product.category}</span><h3 lang="fa" dir="rtl">{product.title}</h3><span className="didar-product-more">{text.detail} ↗</span></div>
        </Link>
      </article>)}</div>
    </section>
  </main>
}
