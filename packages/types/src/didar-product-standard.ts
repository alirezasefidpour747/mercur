import { AttributeType } from "./product"

/**
 * Versioned master-data contract used by Didar's vendor, admin and storefront
 * applications. Keep handles stable: they are persisted and used by filters.
 */
export const DIDAR_GOLD_STANDARD_VERSION = "1.0.0"

export type DidarGoldAttributeDefinition = {
  handle: string
  name: string
  description: string
  type: AttributeType
  values: readonly string[]
  required: boolean
  filterable?: boolean
  metadata: Record<string, unknown>
}

const masterMetadata = (extra: Record<string, unknown> = {}) => ({
  didar_master: true,
  didar_standard: "gold-product",
  schema_version: DIDAR_GOLD_STANDARD_VERSION,
  ...extra,
})

export const didarGoldAttributeStandard: readonly DidarGoldAttributeDefinition[] = [
  {
    handle: "purity",
    name: "عیار طلا",
    description: "عیار رسمی فلز بر حسب هزارم",
    type: AttributeType.SINGLE_SELECT,
    values: ["750", "900", "916", "995", "999", "999.9"],
    required: true,
    metadata: masterMetadata({ unit: "permille" }),
  },
  {
    handle: "gold_color",
    name: "رنگ طلا",
    description: "رنگ غالب یا ترکیب رنگ محصول",
    type: AttributeType.MULTI_SELECT,
    values: ["طلای زرد", "طلای سفید", "رزگلد", "ترکیبی"],
    required: true,
    metadata: masterMetadata(),
  },
  {
    handle: "weight_min_g",
    name: "حداقل وزن (گرم)",
    description: "کمینه وزن قابل تحویل با دقت سه رقم اعشار",
    type: AttributeType.UNIT,
    values: [],
    required: true,
    filterable: false,
    metadata: masterMetadata({ unit: "g", precision: 3, range_role: "min" }),
  },
  {
    handle: "weight_max_g",
    name: "حداکثر وزن (گرم)",
    description: "بیشینه وزن قابل تحویل با دقت سه رقم اعشار",
    type: AttributeType.UNIT,
    values: [],
    required: true,
    filterable: false,
    metadata: masterMetadata({ unit: "g", precision: 3, range_role: "max" }),
  },
  {
    handle: "nominal_weight_g",
    name: "وزن اسمی (گرم)",
    description: "وزن اسمی برای شمش، سکه یا محصول با وزن ثابت",
    type: AttributeType.UNIT,
    values: [],
    required: false,
    filterable: false,
    metadata: masterMetadata({ unit: "g", precision: 3 }),
  },
  {
    handle: "weight_range",
    name: "بازه وزن",
    description: "بازه استاندارد برای فیلتر فروشگاه",
    type: AttributeType.SINGLE_SELECT,
    values: [
      "کمتر از ۳ گرم",
      "۳ تا ۶ گرم",
      "۶ تا ۱۲ گرم",
      "۱۲ تا ۲۰ گرم",
      "بیش از ۲۰ گرم",
    ],
    required: true,
    metadata: masterMetadata({ unit: "g", derived: true }),
  },
  {
    handle: "making_fee_min_percent",
    name: "حداقل اجرت (درصد)",
    description: "کمینه درصد اجرت قابل عرضه",
    type: AttributeType.UNIT,
    values: [],
    required: true,
    filterable: false,
    metadata: masterMetadata({ unit: "percent", precision: 2, range_role: "min" }),
  },
  {
    handle: "making_fee_max_percent",
    name: "حداکثر اجرت (درصد)",
    description: "بیشینه درصد اجرت قابل عرضه",
    type: AttributeType.UNIT,
    values: [],
    required: true,
    filterable: false,
    metadata: masterMetadata({ unit: "percent", precision: 2, range_role: "max" }),
  },
  {
    handle: "wage_range",
    name: "بازه اجرت",
    description: "بازه استاندارد برای فیلتر فروشگاه",
    type: AttributeType.SINGLE_SELECT,
    values: [
      "کمتر از ۱۰٪",
      "۱۰ تا ۱۵٪",
      "۱۵ تا ۲۰٪",
      "۲۰ تا ۲۵٪",
      "بیش از ۲۵٪",
    ],
    required: true,
    metadata: masterMetadata({ unit: "percent", derived: true }),
  },
  {
    handle: "audience",
    name: "مخاطب",
    description: "گروه مخاطب محصول",
    type: AttributeType.MULTI_SELECT,
    values: ["زنانه", "مردانه", "کودک", "یونیسکس"],
    required: true,
    metadata: masterMetadata(),
  },
  {
    handle: "stone_type",
    name: "نوع سنگ",
    description: "سنگ یا نگین به‌کاررفته در محصول",
    type: AttributeType.MULTI_SELECT,
    values: [
      "بدون سنگ",
      "الماس",
      "برلیان",
      "فیروزه",
      "مالاکیت",
      "مروارید",
      "سنگ رنگی",
      "سایر",
    ],
    required: true,
    metadata: masterMetadata(),
  },
  {
    handle: "style",
    name: "سبک",
    description: "سبک طراحی و مصرف محصول",
    type: AttributeType.MULTI_SELECT,
    values: [
      "روزمره",
      "لوکس روزمره",
      "لوکس",
      "کلاسیک",
      "مدرن",
      "مینیمال",
      "مناسبتی",
    ],
    required: true,
    metadata: masterMetadata(),
  },
  {
    handle: "inventory_source",
    name: "منبع موجودی",
    description: "محل تأمین موجودی قابل فروش",
    type: AttributeType.SINGLE_SELECT,
    values: ["انبار دیدار", "انبار تأمین‌کننده", "سفارش ساخت"],
    required: true,
    metadata: masterMetadata(),
  },
  {
    handle: "sale_status",
    name: "وضعیت عرضه",
    description: "نحوه عرضه محصول به خرده‌فروش",
    type: AttributeType.SINGLE_SELECT,
    values: ["آماده عرضه", "استعلام موجودی", "سفارش ساخت", "ناموجود"],
    required: true,
    metadata: masterMetadata(),
  },
  {
    handle: "warranty_status",
    name: "گارانتی دیدار",
    description: "مشمول خدمات گارانتی دیدار",
    type: AttributeType.TOGGLE,
    values: [],
    required: true,
    metadata: masterMetadata(),
  },
  {
    handle: "warranty_months",
    name: "مدت گارانتی (ماه)",
    description: "مدت گارانتی؛ برای بدون گارانتی عدد صفر",
    type: AttributeType.UNIT,
    values: [],
    required: true,
    filterable: false,
    metadata: masterMetadata({ unit: "month", precision: 0 }),
  },
  {
    handle: "authenticity_status",
    name: "شناسنامه اصالت",
    description: "الزام صدور شناسه اصالت برای هر قطعه قابل تحویل",
    type: AttributeType.TOGGLE,
    values: [],
    required: true,
    metadata: masterMetadata({ uid_xrf: true }),
  },
]

export const DIDAR_GOLD_REQUIRED_ATTRIBUTE_HANDLES = didarGoldAttributeStandard
  .filter((attribute) => attribute.required)
  .map((attribute) => attribute.handle)

export const DIDAR_GOLD_ATTRIBUTE_LABELS = Object.fromEntries(
  didarGoldAttributeStandard.map((attribute) => [attribute.handle, attribute.name])
) as Record<string, string>

