"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { DidarWorkspace } from "@/components/didar/DidarWorkspace"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import { type DidarRole } from "@/lib/didar/service-paths"
import { type DidarLocale } from "@/lib/helpers/storefront-locale"

type Account = { role: DidarRole; email: string; name: string; city: string }
type Session = { role: DidarRole; email: string }
type Stage = "roles" | "login" | "register"
const accountsKey = "didar-ui-accounts-v1"
const sessionKey = "didar-ui-session-v1"
const roles: DidarRole[] = ["retailer", "consumer", "supplier", "wholesaler"]
const sampleAccounts: Account[] = roles.map((role) => ({ role, email: `${role}@example.test`, name: "", city: "" }))

const words = {
  fa: { choose: "با چه عنوانی وارد دیدار می‌شوید؟", intro: "مسیر خود را انتخاب کنید.", login: "ورود به مای دیدار", change: "تغییر نقش", email: "ایمیل", enter: "ورود به پیش‌نمایش", register: "حساب ندارید؟ ثبت‌نام کنید", registerTitle: "درخواست عضویت", name: "نام و نام خانوادگی / مجموعه", city: "شهر", submit: "ثبت درخواست نمونه", back: "بازگشت به ورود", error: "حسابی با این ایمیل و نقش پیدا نشد. می‌توانید ثبت‌نام کنید.", duplicate: "این ایمیل برای این نقش قبلاً ثبت شده است؛ وارد شوید.", sample: "برای بازدید نمونه، از نشانی زیر استفاده کنید:", notice: "ورود و ثبت‌نام این صفحه فقط نمایشی است؛ حساب یا دسترسی واقعی ایجاد نمی‌شود.", continue: "ادامهٔ پیش‌نمایش", signout: "خروج از پیش‌نمایش", pending: "درخواست نمونه ذخیره شد. پرونده در انتظار بررسی است؛ تأیید واقعی انجام نشده است." },
  ar: { choose: "بأي صفة تود الدخول إلى ديدار؟", intro: "اختر دورك للمتابعة.", login: "الدخول إلى ديدار", change: "تغيير الدور", email: "البريد الإلكتروني", enter: "الدخول إلى المعاينة", register: "لا تملك حساباً؟ سجّل طلبك", registerTitle: "طلب العضوية", name: "الاسم / المؤسسة", city: "المدينة", submit: "حفظ طلب تجريبي", back: "العودة للدخول", error: "لا يوجد حساب بهذا البريد والدور. يمكنك التسجيل.", duplicate: "البريد مسجل لهذا الدور؛ يمكنك الدخول.", sample: "لاستعراض النموذج استخدم:", notice: "الدخول والتسجيل هنا تجريبيان فقط؛ لا ينشئان حساباً حقيقياً.", continue: "متابعة المعاينة", signout: "الخروج من المعاينة", pending: "حُفظ الطلب التجريبي قيد المراجعة؛ لم تتم موافقة فعلية." },
  en: { choose: "How would you like to use Didar?", intro: "Choose your role to continue.", login: "Sign in to My Didar", change: "Change role", email: "Email", enter: "Enter preview", register: "No account? Register", registerTitle: "Membership application", name: "Name / organisation", city: "City", submit: "Save sample application", back: "Back to sign in", error: "No account found for this email and role. You can register.", duplicate: "This email is already registered for this role; sign in.", sample: "To explore the demo, use:", notice: "Sign in and registration are previews only; no real account or access is created.", continue: "Continue preview", signout: "Leave preview", pending: "Sample application saved as pending review; no real approval occurred." },
  fr: { choose: "Comment souhaitez-vous utiliser Didar ?", intro: "Choisissez votre rôle pour continuer.", login: "Connexion à Mon Didar", change: "Changer de rôle", email: "E-mail", enter: "Ouvrir la maquette", register: "Pas de compte ? S'inscrire", registerTitle: "Demande d'adhésion", name: "Nom / entreprise", city: "Ville", submit: "Enregistrer la demande fictive", back: "Retour à la connexion", error: "Aucun compte pour cet e-mail et ce rôle. Vous pouvez vous inscrire.", duplicate: "Cet e-mail existe déjà pour ce rôle ; connectez-vous.", sample: "Pour essayer la maquette, utilisez :", notice: "Connexion et inscription fictives : aucun compte réel n'est créé.", continue: "Continuer la maquette", signout: "Quitter la maquette", pending: "Demande fictive enregistrée en attente ; aucune approbation réelle." },
}

export function DidarAccess({ locale, role: routeRole, service }: { locale: DidarLocale; role?: DidarRole; service?: string }) {
  const router = useRouter()
  const copy = didarUiCopy[locale]
  const w = words[locale]
  const [stage, setStage] = useState<Stage>(routeRole ? "login" : "roles")
  const [selected, setSelected] = useState<DidarRole>(routeRole || "retailer")
  const [accounts, setAccounts] = useState<Account[]>(sampleAccounts)
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    try {
      const storedAccounts = JSON.parse(localStorage.getItem(accountsKey) || "[]") as Account[]
      if (Array.isArray(storedAccounts)) setAccounts([...sampleAccounts, ...storedAccounts])
      const storedSession = JSON.parse(localStorage.getItem(sessionKey) || "null") as Session | null
      if (storedSession && roles.includes(storedSession.role) && typeof storedSession.email === "string") setSession(storedSession)
    } catch { /* Browsers may block local storage; the demo can still be viewed. */ }
    setReady(true)
  }, [])

  const activeRole = routeRole || selected
  const authorized = !!session && session.role === activeRole
  function choose(role: DidarRole) { setSelected(role); setStage("login"); setEmail(""); setError(""); setStatus("") }
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const address = email.trim().toLowerCase()
    if (!accounts.some((account) => account.role === activeRole && account.email === address)) { setError(w.error); return }
    const next = { role: activeRole, email: address }
    setSession(next)
    try { localStorage.setItem(sessionKey, JSON.stringify(next)) } catch {}
    setError("")
    if (!routeRole) router.push(`/${locale}/my-didar/${activeRole}`)
  }
  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const address = String(form.get("email") || "").trim().toLowerCase()
    if (accounts.some((account) => account.role === activeRole && account.email === address)) { setError(w.duplicate); return }
    const next = { role: activeRole, email: address, name: String(form.get("name") || "").trim(), city: String(form.get("city") || "").trim() }
    setAccounts((previous) => [...previous, next])
    try { localStorage.setItem(accountsKey, JSON.stringify([...accounts.filter((account) => !sampleAccounts.includes(account)), next])) } catch {}
    setEmail(address); setStage("login"); setError(""); setStatus(w.pending)
  }
  function signOut() {
    setSession(null); setStage(routeRole ? "login" : "roles"); setError(""); setStatus("")
    try { localStorage.removeItem(sessionKey) } catch {}
    if (routeRole) router.push(`/${locale}/my-didar`)
  }

  if (!ready) return <main className="didar-site didar-access" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}><p className="didar-access-loading">DIDAR</p></main>
  if (authorized) return <><div className="didar-access-session" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}><span>{copy.myDidar} · {copy[activeRole]} · <bdi dir="ltr">{session.email}</bdi></span><button type="button" onClick={signOut}>{w.signout}</button></div><DidarWorkspace key={`${activeRole}:${session.email}`} locale={locale} role={activeRole} initialService={service} accountEmail={session.email} /></>

  return <main className="didar-site didar-access" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
    <div className="didar-access-heading"><p className="didar-eyebrow">DIDAR · {copy.myDidar}</p><h1>{stage === "roles" ? w.choose : stage === "login" ? w.login : w.registerTitle}</h1><p>{stage === "roles" ? w.intro : copy[activeRole]}</p></div>
    {stage === "roles" ? <div className="didar-access-roles">{roles.map((role, i) => <button type="button" onClick={() => choose(role)} className="didar-access-role" key={role}><span>0{i + 1}</span><h2>{copy[role]}</h2><p>{copy[`${role}Services` as const].join(" · ")}</p><b aria-hidden="true">↗</b></button>)}</div> : <div className="didar-access-panel">
      <div className="didar-access-role-summary"><span>{copy[activeRole]}</span><Link href={`/${locale}/my-didar`} onClick={() => { setStage("roles"); setError(""); setStatus("") }}>{w.change}</Link></div>
      <p className="didar-access-notice">{w.notice}</p>
      {!!status && <p className="didar-work-message" role="status">{status}</p>}
      {!!error && <p className="didar-access-error" role="alert">{error}</p>}
      {stage === "login" ? <><p className="didar-access-hint">{w.sample} <bdi dir="ltr">{activeRole}@example.test</bdi></p><form onSubmit={signIn} className="didar-access-form"><label>{w.email}<input required type="email" dir="ltr" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} /></label><button type="submit">{w.enter}</button></form><button type="button" className="didar-access-text-button" onClick={() => { setStage("register"); setError(""); setStatus("") }}>{w.register}</button></> : <><form onSubmit={register} className="didar-access-form"><label>{w.name}<input required name="name" maxLength={100} /></label><label>{w.city}<input required name="city" maxLength={80} /></label><label>{w.email}<input required name="email" type="email" dir="ltr" autoComplete="off" defaultValue={email} /></label><button type="submit">{w.submit}</button></form><button type="button" className="didar-access-text-button" onClick={() => { setStage("login"); setError("") }}>{w.back}</button></>}
    </div>}
    <Link className="didar-access-reference" href={`/${locale}/my-didar/preview`}>{copy.fullPreview} ↗</Link>
  </main>
}
