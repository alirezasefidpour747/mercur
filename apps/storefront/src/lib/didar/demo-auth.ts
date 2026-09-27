import { type DidarRole } from "@/lib/didar/service-paths"

export type DidarDemoSession = {
  role: DidarRole
  identifier: string
  accountKey: string
}

export const didarDemoSessionKey = "didar-ui-session-v2"
export const didarDemoSessionEvent = "didar:demo-session-changed"

export function readDidarDemoSession(): DidarDemoSession | null {
  if (typeof window === "undefined") return null
  try {
    const value = JSON.parse(window.localStorage.getItem(didarDemoSessionKey) || "null") as Partial<DidarDemoSession> | null
    if (!value?.role || !value.identifier) return null
    if (!["consumer", "retailer", "supplier", "wholesaler"].includes(value.role)) return null
    return { role: value.role, identifier: value.identifier, accountKey: value.accountKey || value.identifier }
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
