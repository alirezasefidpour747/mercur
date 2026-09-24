import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

import {
  DIDAR_LOCALES,
  isDidarLocale,
  type DidarLocale,
} from "@/lib/helpers/storefront-locale"

type HomeCopy = {
  title: string
  description: string
  eyebrow: string
  headline: string
  intro: string
  explore: string
  storyLink: string
  values: string[]
  collectionEyebrow: string
  collectionTitle: string
  collectionIntro: string
  collectionCards: { title: string; note: string }[]
  storyEyebrow: string
  storyTitle: string
  storyText: string
  careEyebrow: string
  careTitle: string
  careText: string
  imageAlt: string[]
}

const copy = {
  fa: {
    title: "زیورآلات با روایت",
    description:
      "با جهان دیدار آشنا شوید؛ مجموعه‌ای از زیورآلات، روایت‌ها و تجربه‌های انتخاب آگاهانه.",
    eyebrow: "دیدار · هنرِ ماندن",
    headline: "زیبایی، در جزئیاتی که می‌مانند",
    intro:
      "در دیدار، هر آفرینش از پیوند هنر، ماده و داستان‌های انسانی شکل می‌گیرد؛ برای لحظه‌هایی که ارزش به‌خاطر سپردن دارند.",
    explore: "دیدن مجموعه‌ها",
    storyLink: "با جهان دیدار آشنا شوید",
    values: ["نگاه هنرمندانه", "انتخاب با آگاهی", "همراهی در مسیر"],
    collectionEyebrow: "گزیده‌ای از دیدار",
    collectionTitle: "هر فرم، روایتی تازه",
    collectionIntro:
      "از خطوط آرام طلا تا رنگ‌های زندهٔ سنگ‌ها؛ مجموعه‌ها را با نگاه خودتان کشف کنید.",
    collectionCards: [
      { title: "خطوطی از طلا", note: "فرم‌های ماندگار" },
      { title: "رنگ و درخشش", note: "سنگ‌هایی برای به‌یادماندن" },
      { title: "امضای دیدار", note: "جزئیاتی با شخصیت" },
    ],
    storyEyebrow: "داستان دیدار",
    storyTitle: "ساخته‌شده برای نزدیک‌تر شدن",
    storyText:
      "دیدار جایی‌ست برای آشنایی دوباره با زیبایی؛ جایی که طراحی، هنر ساخت و تجربهٔ انسانی در کنار هم قرار می‌گیرند.",
    careEyebrow: "انتخابی با شناخت بیشتر",
    careTitle: "هر انتخاب، آغاز یک همراهی‌ست",
    careText:
      "شناخت ویژگی‌های یک قطعه، بخشی از لذت انتخاب آن است؛ از روایت طراحی تا راهنمای نگهداری.",
    imageAlt: [
      "زیورآلات دیدار در فضایی روشن",
      "زیورآلات طلایی با طراحی ظریف",
      "زیورآلات با سنگ سبز",
      "ترکیبی از طلا و سنگ‌های رنگی",
      "روایت تصویری جهان دیدار",
    ],
  },
  en: {
    title: "Jewellery with a story",
    description:
      "Discover Didar: considered jewellery, thoughtful stories and a more informed way to choose.",
    eyebrow: "DIDAR · MADE TO STAY",
    headline: "Beauty lives in the details that stay",
    intro:
      "At Didar, each creation brings together art, material and human stories—for moments worth remembering.",
    explore: "Explore the collections",
    storyLink: "Discover the world of Didar",
    values: ["An artistic point of view", "A considered choice", "Care along the way"],
    collectionEyebrow: "A selection from Didar",
    collectionTitle: "Every form tells a story",
    collectionIntro:
      "From the quiet lines of gold to the vivid colour of stones, discover the collections in your own way.",
    collectionCards: [
      { title: "Lines in gold", note: "Enduring forms" },
      { title: "Colour and light", note: "Stones to remember" },
      { title: "The Didar signature", note: "Details with character" },
    ],
    storyEyebrow: "The Didar story",
    storyTitle: "Created to bring us closer",
    storyText:
      "Didar is a place to meet beauty again, where design, craft and human experience come together.",
    careEyebrow: "Choose with more understanding",
    careTitle: "Every choice begins a relationship",
    careText:
      "Understanding a piece is part of choosing it—from the story of its design to the care it needs.",
    imageAlt: [
      "Didar jewellery in a light-filled setting",
      "Gold jewellery with a delicate design",
      "Jewellery set with green stones",
      "A combination of gold and coloured stones",
      "A visual story of the Didar world",
    ],
  },
  ar: {
    title: "مجوهرات تحمل حكاية",
    description:
      "اكتشفوا عالم ديدار: مجوهرات مختارة بعناية وحكايات تساعدكم على الاختيار بوعي.",
    eyebrow: "ديدار · فنّ البقاء",
    headline: "الجمال في التفاصيل التي تبقى",
    intro:
      "في ديدار، يجتمع الفن والمادة والحكايات الإنسانية في كل إبداع، للحظات تستحق أن تبقى في الذاكرة.",
    explore: "اكتشفوا المجموعات",
    storyLink: "اكتشفوا عالم ديدار",
    values: ["رؤية فنية", "اختيار بوعي", "مرافقة في كل خطوة"],
    collectionEyebrow: "مختارات من ديدار",
    collectionTitle: "كل شكل يروي حكاية",
    collectionIntro:
      "من خطوط الذهب الهادئة إلى ألوان الأحجار النابضة، اكتشفوا المجموعات بطريقتكم.",
    collectionCards: [
      { title: "خطوط من الذهب", note: "أشكال تدوم" },
      { title: "لون وبريق", note: "أحجار لا تُنسى" },
      { title: "بصمة ديدار", note: "تفاصيل ذات شخصية" },
    ],
    storyEyebrow: "حكاية ديدار",
    storyTitle: "صُنع لنكون أقرب",
    storyText:
      "ديدار مساحة لاكتشاف الجمال من جديد، حيث يلتقي التصميم والحرفة والتجربة الإنسانية.",
    careEyebrow: "اختيار بمعرفة أوسع",
    careTitle: "كل اختيار بداية لمرافقة",
    careText:
      "معرفة خصائص القطعة جزء من متعة اختيارها، من حكاية تصميمها إلى طريقة العناية بها.",
    imageAlt: [
      "مجوهرات ديدار في مساحة مضيئة",
      "مجوهرات ذهبية بتصميم رقيق",
      "مجوهرات مرصعة بأحجار خضراء",
      "مزيج من الذهب والأحجار الملونة",
      "حكاية بصرية لعالم ديدار",
    ],
  },
  fr: {
    title: "Des bijoux qui racontent",
    description:
      "Découvrez Didar : des bijoux choisis avec soin, des récits et une expérience de choix plus éclairée.",
    eyebrow: "DIDAR · L’ART DE DURER",
    headline: "La beauté dans les détails qui restent",
    intro:
      "Chez Didar, chaque création relie l’art, la matière et les histoires humaines, pour les instants dont on se souvient.",
    explore: "Découvrir les collections",
    storyLink: "Découvrir l’univers Didar",
    values: ["Un regard artistique", "Un choix éclairé", "Un accompagnement attentif"],
    collectionEyebrow: "Une sélection Didar",
    collectionTitle: "Chaque forme raconte",
    collectionIntro:
      "Des lignes paisibles de l’or aux couleurs des pierres, découvrez les collections à votre rythme.",
    collectionCards: [
      { title: "Lignes d’or", note: "Des formes durables" },
      { title: "Couleur et lumière", note: "Des pierres à retenir" },
      { title: "La signature Didar", note: "Des détails singuliers" },
    ],
    storyEyebrow: "L’histoire Didar",
    storyTitle: "Créé pour nous rapprocher",
    storyText:
      "Didar est un lieu pour rencontrer à nouveau la beauté, où le design, le savoir-faire et l’expérience humaine se rejoignent.",
    careEyebrow: "Choisir en connaissance de cause",
    careTitle: "Chaque choix ouvre une relation",
    careText:
      "Comprendre une pièce fait partie du choix, de l’histoire de sa création aux gestes pour en prendre soin.",
    imageAlt: [
      "Bijoux Didar dans un espace lumineux",
      "Bijoux en or au dessin délicat",
      "Parure ornée de pierres vertes",
      "Association d’or et de pierres colorées",
      "Récit visuel de l’univers Didar",
    ],
  },
} satisfies Record<DidarLocale, HomeCopy>

const languageTags: Record<DidarLocale, string> = {
  fa: "fa-IR",
  en: "en-US",
  ar: "ar",
  fr: "fr-FR",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params
  const locale = isDidarLocale(requestedLocale) ? requestedLocale : "fa"
  const content = copy[locale]
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const languages = Object.fromEntries(
    DIDAR_LOCALES.map((language) => [
      languageTags[language],
      `${baseUrl}/${language}`,
    ])
  )
  languages["x-default"] = `${baseUrl}/fa`

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages,
    },
    openGraph: {
      title: `${content.title} | Didar`,
      description: content.description,
      url: `${baseUrl}/${locale}`,
      siteName: "Didar",
      type: "website",
      images: [{ url: `${baseUrl}/didar/hero.webp`, alt: content.title }],
    },
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: requestedLocale } = await params
  const locale: DidarLocale = isDidarLocale(requestedLocale)
    ? requestedLocale
    : "fa"
  const content = copy[locale]
  const direction = locale === "fa" || locale === "ar" ? "rtl" : "ltr"
  const collectionsUrl = `/${locale}#collections`

  return (
    <main className="didar-site" lang={locale} dir={direction}>
      <section className="didar-hero" aria-labelledby="didar-home-title">
        <div className="didar-hero-copy">
          <p className="didar-eyebrow">{content.eyebrow}</p>
          <h1 id="didar-home-title">{content.headline}</h1>
          <p className="didar-lead">{content.intro}</p>
          <div className="didar-hero-actions">
            <Link className="didar-button didar-button-primary" href={collectionsUrl}>
              {content.explore}
            </Link>
            <Link className="didar-text-link" href={`/${locale}#story`}>
              {content.storyLink}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="didar-hero-media">
          <Image
            src="/didar/hero.webp"
            alt={content.imageAlt[0]}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 52vw"
          />
          <span className="didar-image-caption">{content.eyebrow}</span>
        </div>
      </section>

      <div className="didar-values" aria-label={content.eyebrow}>
        {content.values.map((value, index) => (
          <p key={value}>
            <span>0{index + 1}</span>
            {value}
          </p>
        ))}
      </div>

      <section
        className="didar-section didar-collections"
        id="collections"
        aria-labelledby="didar-collections-title"
      >
        <div className="didar-section-heading">
          <div>
            <p className="didar-eyebrow">{content.collectionEyebrow}</p>
            <h2 id="didar-collections-title">{content.collectionTitle}</h2>
          </div>
          <p>{content.collectionIntro}</p>
        </div>
        <div className="didar-collection-grid">
          {content.collectionCards.map((card, index) => (
            <article className="didar-collection-card" key={card.title}>
              <div className="didar-collection-image">
                <Image
                  src={`/didar/collection-0${index + 1}.webp`}
                  alt={content.imageAlt[index + 1]}
                  fill
                  sizes="(max-width: 760px) 90vw, 31vw"
                />
              </div>
              <div className="didar-card-copy">
                <div>
                  <p>{card.note}</p>
                  <h3>{card.title}</h3>
                </div>
                <span aria-hidden="true">↗</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="didar-story" id="story" aria-labelledby="didar-story-title">
        <div className="didar-story-media">
          <Image
            src="/didar/story.webp"
            alt={content.imageAlt[4]}
            fill
            sizes="(max-width: 760px) 100vw, 48vw"
          />
        </div>
        <div className="didar-story-copy">
          <p className="didar-eyebrow">{content.storyEyebrow}</p>
          <h2 id="didar-story-title">{content.storyTitle}</h2>
          <p>{content.storyText}</p>
        </div>
      </section>

      <section className="didar-care" id="care" aria-labelledby="didar-care-title">
        <div>
          <p className="didar-eyebrow">{content.careEyebrow}</p>
          <h2 id="didar-care-title">{content.careTitle}</h2>
        </div>
        <div className="didar-care-action">
          <p>{content.careText}</p>
        </div>
      </section>
    </main>
  )
}
