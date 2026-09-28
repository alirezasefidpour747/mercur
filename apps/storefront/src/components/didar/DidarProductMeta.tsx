import { productWageLabel, productWeightLabel, type DidarProduct } from "@/lib/didar/product-model"
import { type DidarLocale } from "@/lib/helpers/storefront-locale"

const words = {
  fa: { code: "کد", purity: "عیار", weight: "وزن", wage: "اجرت", supplier: "تأمین‌کننده", warranty: "گارانتی", unknown: "پس از تأیید" },
  ar: { code: "الرمز", purity: "العيار", weight: "الوزن", wage: "المصنعية", supplier: "المورّد", warranty: "الضمان", unknown: "بعد الاعتماد" },
  en: { code: "Code", purity: "Fineness", weight: "Weight", wage: "Making", supplier: "Supplier", warranty: "Warranty", unknown: "After approval" },
  fr: { code: "Code", purity: "Titre", weight: "Poids", wage: "Façon", supplier: "Fournisseur", warranty: "Garantie", unknown: "Après validation" },
} as const

export function DidarProductMeta({ product, locale, compact = false, commercial = false }: { product: DidarProduct; locale: DidarLocale; compact?: boolean; commercial?: boolean }) {
  const copy = words[locale]
  const weight = productWeightLabel(product)
  const wage = productWageLabel(product)
  const taxonomy = [product.familyLabel, product.categoryLabel, product.subtypeLabel].filter(Boolean).join(" / ")
  if (compact) return <p className="didar-product-meta-compact"><span>{taxonomy || product.category || copy.unknown}</span>{product.sku && <bdi dir="ltr">{product.sku}</bdi>}{product.purity && <span>{product.purity}‰</span>}{weight && <span>{weight}</span>}{commercial && wage && <span>{wage}</span>}</p>

  return <dl className="didar-product-master-data">
    <div><dt>{copy.code}</dt><dd><bdi dir="ltr">{product.sku || copy.unknown}</bdi></dd></div>
    <div><dt>{copy.purity}</dt><dd>{product.purity ? `${product.purity}‰` : copy.unknown}</dd></div>
    <div><dt>{copy.weight}</dt><dd>{weight || copy.unknown}</dd></div>
    <div><dt>{copy.supplier}</dt><dd>{product.supplierName || copy.unknown}</dd></div>
    <div><dt>{copy.warranty}</dt><dd>{product.warrantyMonths != null ? `${product.warrantyMonths}` : copy.unknown}</dd></div>
    {commercial && <div><dt>{copy.wage}</dt><dd>{wage || copy.unknown}</dd></div>}
  </dl>
}
