"use client"

import { useEffect, useState } from "react"

import { type DidarLocale } from "@/lib/helpers/storefront-locale"

export const didarGuestFavoritesKey = "didar-guest-favorites-v1"
const favoritesChangedEvent = "didar:guest-favorites-changed"

function parseFavorites(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

export function readDidarGuestFavorites(): string[] {
  if (typeof window === "undefined") return []
  return parseFavorites(window.localStorage.getItem(didarGuestFavoritesKey))
}

export function consumeDidarGuestFavorites(): string[] {
  const favorites = readDidarGuestFavorites()
  if (typeof window !== "undefined" && favorites.length) {
    window.localStorage.removeItem(didarGuestFavoritesKey)
    window.dispatchEvent(new CustomEvent(favoritesChangedEvent, { detail: [] }))
  }
  return favorites
}

const labels: Record<DidarLocale, { add: string; remove: string }> = {
  fa: { add: "ذخیره در علاقه‌مندی‌ها", remove: "حذف از علاقه‌مندی‌ها" },
  ar: { add: "حفظ في المفضلة", remove: "إزالة من المفضلة" },
  en: { add: "Save to favourites", remove: "Remove from favourites" },
  fr: { add: "Ajouter aux favoris", remove: "Retirer des favoris" },
}

export function DidarFavoriteButton({ slug, locale, className = "" }: { slug: string; locale: DidarLocale; className?: string }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => setActive(readDidarGuestFavorites().includes(slug))
    sync()
    window.addEventListener(favoritesChangedEvent, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(favoritesChangedEvent, sync)
      window.removeEventListener("storage", sync)
    }
  }, [slug])

  function toggle() {
    const current = readDidarGuestFavorites()
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    window.localStorage.setItem(didarGuestFavoritesKey, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(favoritesChangedEvent, { detail: next }))
  }

  const label = active ? labels[locale].remove : labels[locale].add
  return <button type="button" className={className} aria-label={label} aria-pressed={active} onClick={toggle}>{active ? "♥" : "♡"}<span>{label}</span></button>
}
