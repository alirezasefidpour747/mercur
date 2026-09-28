import { type DidarRole } from "@/lib/didar/service-paths"

export type DidarDemoSession = {
  role: DidarRole
  identifier: string
  accountKey: string
  displayName: string
}

export const didarDemoSessionKey = "didar-ui-session-v2"
export const didarDemoSessionEvent = "didar:demo-session-changed"

export function readDidarDemoSession(): DidarDemoSession | null {
  if (typeof window === "undefined") return null
  try {
    const value = JSON.parse(window.localStorage.getItem(didarDemoSessionKey) || "null") as Partial<DidarDemoSession> | null
    if (!value?.role || !value.identifier) return null
    const storedRole = String(value.role)
    const role: DidarRole | null = storedRole === "wholesaler"
      ? "supplier"
      : ["consumer", "retailer", "supplier"].includes(storedRole) ? storedRole as DidarRole : null
    if (!role) return null
    const demoNames: Record<string, string> = {
      "consumer@didar.demo": "مشتری نمونه",
      "09120000001": "مشتری نمونه",
      "retailer@didar.demo": "خرده‌فروشی نمونه",
      "09120000002": "خرده‌فروشی نمونه",
      "supplier@didar.demo": "تأمین‌کننده نمونه",
      "09120000003": "تأمین‌کننده نمونه",
      "wholesaler@didar.demo": "بنکدار نمونه",
      "09120000004": "بنکدار نمونه",
    }
    const storedAccounts = JSON.parse(window.localStorage.getItem("didar-ui-accounts-v2") || "[]") as Array<{
      role?: DidarRole
      email?: string
      mobile?: string
      name?: string
    }>
    const storedName = Array.isArray(storedAccounts)
      ? storedAccounts.find((account) => account.role === value.role && (account.email === value.identifier || account.mobile === value.identifier))?.name
      : undefined
    return {
      role,
      identifier: value.identifier,
      accountKey: value.accountKey || value.identifier,
      displayName: value.displayName || demoNames[value.identifier] || storedName || value.identifier,
    }
  } catch {
    return null
  }
}

export function writeDidarDemoSession(session: DidarDemoSession) {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(didarDemoSessionKey, JSON.stringify(session)) } catch {}
  window.dispatchEvent(new CustomEvent(didarDemoSessionEvent, { detail: session }))
}

export function clearDidarDemoSession() {
  if (typeof window === "undefined") return
  try { window.localStorage.removeItem(didarDemoSessionKey) } catch {}
  window.dispatchEvent(new CustomEvent(didarDemoSessionEvent, { detail: null }))
}
