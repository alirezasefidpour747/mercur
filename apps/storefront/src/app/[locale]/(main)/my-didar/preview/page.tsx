import Link from "next/link"
import { notFound } from "next/navigation"

import { isDidarLocale } from "@/lib/helpers/storefront-locale"

const copy = {
  fa: { title: "پیش‌نمایش تعاملی خدمات دیدار", note: "تمام اطلاعات، نقش‌ها، شناسه‌های قطعه، مانده‌ها و تراکنش‌های این بخش نمونه‌اند. هیچ ثبت، رزرو، خرید، تأیید یا استعلام واقعی انجام نمی‌شود.", back: "بازگشت به مای دیدار" },
  ar: { title: "معاينة تفاعلية لخدمات ديدار", note: "جميع الحسابات والقطع والأرصدة والعمليات هنا تجريبية. لا يُرسل أي طلب حقيقي.", back: "العودة إلى ديدار الخاص بي" },
  en: { title: "Interactive Didar service preview", note: "Accounts, pieces, balances and transactions in this view are samples. No real submission, reservation, purchase or verification occurs.", back: "Back to My Didar" },
  fr: { title: "Aperçu interactif des services Didar", note: "Les comptes, pièces, soldes et opérations sont fictifs. Aucune demande, réservation, vente ou vérification réelle n’est effectuée.", back: "Retour à Mon Didar" },
} as const

export default async function DidarPreview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isDidarLocale(locale)) notFound()
  const text = copy[locale]
  return <main className="didar-site didar-interactive-page" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
    <div className="didar-preview-intro">
      <Link href={`/${locale}/my-didar`}>{text.back}</Link>
      <h1>{text.title}</h1>
      <p role="note">{text.note}</p>
    </div>
    <iframe
      className="didar-interactive-frame"
      title={text.title}
      src={`/didar/interactive-preview.html?lang=${locale}`}
      sandbox="allow-scripts allow-forms"
      referrerPolicy="no-referrer"
    />
  </main>
}
