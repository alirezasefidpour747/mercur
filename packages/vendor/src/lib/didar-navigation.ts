const allowedLocales = new Set(["fa", "ar", "en", "fr"])

export function getDidarLocale() {
  const current = typeof window === "undefined" ? "fa" : localStorage.getItem("didar-locale") || "fa"
  return allowedLocales.has(current) ? current : "fa"
}

export function getDidarHomeUrl() {
  if (typeof window === "undefined") return "/fa"
  const storedReturnTo = localStorage.getItem("didar-return-to")
  if (storedReturnTo) return storedReturnTo
  const base = localStorage.getItem("didar-storefront-url") || `${window.location.protocol}//${window.location.hostname}:3000`
  return `${base.replace(/\/$/, "")}/${getDidarLocale()}`
}

export function getDidarBackLabel() {
  const locale = getDidarLocale()
  if (locale === "fa") return "بازگشت به فروشگاه دیدار"
  if (locale === "ar") return "العودة إلى متجر ديدار"
  if (locale === "fr") return "Retour à la boutique Didar"
  return "Back to Didar store"
}

export function getDidarWorkspaceCopy() {
  const locale = getDidarLocale()
  if (locale === "ar") return { eyebrow: "DIDAR · SUPPLIER WORKSPACE", title: "مساحة عمل مورّد ديدار", description: "إدارة المنتجات وعروض التوريد والمخزون والطلبات ضمن مساحة متصلة بمنصة Medusa." }
  if (locale === "fr") return { eyebrow: "DIDAR · ESPACE FOURNISSEUR", title: "Espace fournisseur Didar", description: "Gérez les produits, les offres, les stocks et les commandes dans un espace connecté au noyau Medusa." }
  if (locale === "en") return { eyebrow: "DIDAR · SUPPLIER WORKSPACE", title: "Didar supplier workspace", description: "Manage products, supply offers, inventory, and orders in a workspace connected to the Medusa core." }
  return { eyebrow: "DIDAR · SUPPLIER WORKSPACE", title: "میز کار تأمین‌کننده دیدار", description: "مدیریت محصولات، پیشنهادهای عرضه، موجودی و سفارش‌ها در یک فضای متصل به هسته Medusa." }
}
