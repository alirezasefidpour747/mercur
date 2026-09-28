import { publicDidarProducts } from "@/lib/didar/public-catalog"

export type DidarRetailStore = {
  slug: string
  faName: string
  enName: string
  cityFa: string
  cityEn: string
  areaFa: string
  areaEn: string
}

export const didarRetailStores: DidarRetailStore[] = [
  { slug: "vanak-gallery", faName: "گالری نمونه ونک", enName: "Vanak sample gallery", cityFa: "تهران", cityEn: "Tehran", areaFa: "ونک", areaEn: "Vanak" },
  { slug: "isfahan-house", faName: "خانه طلای نمونه اصفهان", enName: "Isfahan sample gold house", cityFa: "اصفهان", cityEn: "Isfahan", areaFa: "چهارباغ", areaEn: "Chaharbagh" },
  { slug: "shiraz-gallery", faName: "گالری نمونه شیراز", enName: "Shiraz sample gallery", cityFa: "شیراز", cityEn: "Shiraz", areaFa: "معالی‌آباد", areaEn: "Maali Abad" },
]

export function didarStoresCarrying(productSlug: string): DidarRetailStore[] {
  const productIndex = publicDidarProducts.findIndex((product) => product.slug === productSlug)
  if (productIndex < 0) return []
  return didarRetailStores.filter((_, storeIndex) =>
    storeIndex === productIndex % didarRetailStores.length ||
    storeIndex === (productIndex + 1) % didarRetailStores.length)
}

export function didarProductsForStore(storeSlug: string) {
  const storeIndex = didarRetailStores.findIndex((store) => store.slug === storeSlug)
  if (storeIndex < 0) return []
  return publicDidarProducts.filter((_, productIndex) =>
    storeIndex === productIndex % didarRetailStores.length ||
    storeIndex === (productIndex + 1) % didarRetailStores.length)
}

export const didarRetailStore = (slug: string) =>
  didarRetailStores.find((store) => store.slug === slug)
