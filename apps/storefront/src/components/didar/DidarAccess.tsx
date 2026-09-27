"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"

import { DidarWorkspace } from "@/components/didar/DidarWorkspace"
import {
  clearDidarDemoSession,
  readDidarDemoSession,
  writeDidarDemoSession,
  type DidarDemoSession,
} from "@/lib/didar/demo-auth"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import { type DidarRole } from "@/lib/didar/service-paths"
import { type DidarLocale } from "@/lib/helpers/storefront-locale"

type Channel = "email" | "mobile"
type Account = { role: DidarRole; email?: string; mobile?: string; name: string; city: string; demo?: boolean }
type Stage = "roles" | "login" | "otp" | "register"
type OtpIntent = "signin" | "register"

const accountsKey = "didar-ui-accounts-v2"
const demoOtp = "246810"
const roles: DidarRole[] = ["retailer", "consumer", "supplier", "wholesaler"]
const sampleAccounts: Account[] = [
  { role: "consumer", email: "consumer@didar.demo", mobile: "09120000001", name: "مشتری نمونه", city: "تهران", demo: true },
  { role: "retailer", email: "retailer@didar.demo", mobile: "09120000002", name: "خرده‌فروشی نمونه", city: "تهران", demo: true },
  { role: "supplier", email: "supplier@didar.demo", mobile: "09120000003", name: "تأمین‌کننده نمونه", city: "اصفهان", demo: true },
  { role: "wholesaler", email: "wholesaler@didar.demo", mobile: "09120000004", name: "بنکدار نمونه", city: "تهران", demo: true },
]

const words = {
  fa: { choose: "با چه عنوانی وارد دیدار می‌شوید؟", intro: "مسیر خود را انتخاب کنید.", login: "ورود به دیدار من", otpTitle: "تأیید رمز یک‌بارمصرف", change: "تغییر نقش", identifier: "شماره موبایل یا ایمیل", requestOtp: "دریافت رمز یک‌بارمصرف", verify: "تأیید و ورود", resend: "ارسال دوباره رمز", register: "حساب ندارید؟ ثبت‌نام کنید", registerTitle: "ثبت‌نام موقت", name: "نام و نام خانوادگی / مجموعه", city: "شهر", submit: "ثبت اطلاعات و دریافت رمز", back: "بازگشت", invalid: "ایمیل یا شماره موبایل معتبر وارد کنید. نمونه موبایل: 09121234567", error: "حسابی با این شناسه و نقش پیدا نشد. می‌توانید ثبت‌نام کنید.", duplicate: "این ایمیل یا موبایل برای این نقش قبلاً ثبت شده است؛ وارد شوید.", otpError: "رمز یک‌بارمصرف صحیح نیست.", sample: "حساب آمادهٔ این نقش", notice: "این مرحله پیش‌نمایش ورود با OTP است. ارسال واقعی ایمیل و پیامک پس از اتصال سرویس احراز هویت فعال می‌شود.", signout: "خروج", pending: "ثبت‌نام موقت تکمیل شد و پرونده در وضعیت «در انتظار بررسی» قرار گرفت.", sentEmail: "رمز موقت به ایمیل ارسال شد.", sentMobile: "رمز موقت با پیامک ارسال شد.", demoCode: "رمز نمایشی", code: "رمز ۶ رقمی", destination: "مقصد" },
  ar: { choose: "بأي صفة تود الدخول إلى ديدار؟", intro: "اختر دورك للمتابعة.", login: "الدخول إلى ديدار", otpTitle: "تأكيد الرمز المؤقت", change: "تغيير الدور", identifier: "رقم الهاتف أو البريد الإلكتروني", requestOtp: "إرسال الرمز المؤقت", verify: "تأكيد ودخول", resend: "إعادة إرسال الرمز", register: "لا تملك حساباً؟ سجّل", registerTitle: "تسجيل مؤقت", name: "الاسم / المؤسسة", city: "المدينة", submit: "حفظ وإرسال الرمز", back: "رجوع", invalid: "أدخل بريداً أو رقم هاتف صالحاً.", error: "لا يوجد حساب بهذه البيانات والدور. يمكنك التسجيل.", duplicate: "هذه البيانات مسجلة لهذا الدور؛ يمكنك الدخول.", otpError: "الرمز المؤقت غير صحيح.", sample: "حساب تجريبي لهذا الدور", notice: "هذه معاينة لتسجيل الدخول بالرمز المؤقت. سيتم تفعيل البريد والرسائل الحقيقية بعد ربط خدمة التحقق.", signout: "خروج", pending: "اكتمل التسجيل المؤقت والملف قيد المراجعة.", sentEmail: "تم إرسال الرمز المؤقت إلى البريد.", sentMobile: "تم إرسال الرمز المؤقت برسالة نصية.", demoCode: "رمز العرض", code: "الرمز المكون من 6 أرقام", destination: "الوجهة" },
  en: { choose: "How would you like to use Didar?", intro: "Choose your role to continue.", login: "Sign in to My Didar", otpTitle: "Verify one-time code", change: "Change role", identifier: "Mobile number or email", requestOtp: "Send one-time code", verify: "Verify and sign in", resend: "Resend code", register: "No account? Register", registerTitle: "Temporary registration", name: "Name / organisation", city: "City", submit: "Save and send code", back: "Back", invalid: "Enter a valid email or Iranian mobile number.", error: "No account found for this identifier and role. You can register.", duplicate: "This email or mobile is already registered for this role; sign in.", otpError: "The one-time code is incorrect.", sample: "Ready-to-use account for this role", notice: "This is an OTP sign-in preview. Real email and SMS delivery will be enabled when the authentication service is connected.", signout: "Sign out", pending: "Temporary registration completed; the application is pending review.", sentEmail: "A temporary code was sent by email.", sentMobile: "A temporary code was sent by SMS.", demoCode: "Demo code", code: "6-digit code", destination: "Destination" },
  fr: { choose: "Comment souhaitez-vous utiliser Didar ?", intro: "Choisissez votre rôle.", login: "Connexion à Mon Didar", otpTitle: "Vérifier le code temporaire", change: "Changer de rôle", identifier: "Téléphone ou e-mail", requestOtp: "Envoyer le code", verify: "Vérifier et se connecter", resend: "Renvoyer le code", register: "Pas de compte ? S'inscrire", registerTitle: "Inscription temporaire", name: "Nom / entreprise", city: "Ville", submit: "Enregistrer et envoyer le code", back: "Retour", invalid: "Saisissez un e-mail ou un mobile iranien valide.", error: "Aucun compte pour cet identifiant et ce rôle. Vous pouvez vous inscrire.", duplicate: "Cet e-mail ou mobile existe déjà pour ce rôle.", otpError: "Le code temporaire est incorrect.", sample: "Compte prêt pour ce rôle", notice: "Aperçu de la connexion OTP. L'envoi réel par e-mail et SMS sera activé après l'intégration du service d'authentification.", signout: "Déconnexion", pending: "Inscription temporaire terminée ; demande en attente.", sentEmail: "Un code temporaire a été envoyé par e-mail.", sentMobile: "Un code temporaire a été envoyé par SMS.", demoCode: "Code démo", code: "Code à 6 chiffres", destination: "Destination" },
}

const latinDigits = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))

function normalizeIdentifier(value: string): string {
  const trimmed = latinDigits(value).trim().toLowerCase().replace(/[\s()-]/g, "")
  if (trimmed.includes("@")) return trimmed
  if (trimmed.startsWith("0098")) return `0${trimmed.slice(4)}`
  if (trimmed.startsWith("+98")) return `0${trimmed.slice(3)}`
  if (trimmed.startsWith("98") && trimmed.length === 12) return `0${trimmed.slice(2)}`
  return trimmed
}

function identifierChannel(value: string): Channel | null {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email"
  if (/^09\d{9}$/.test(value)) return "mobile"
  return null
}

const accountMatches = (account: Account, identifier: string) =>
  account.email === identifier || account.mobile === identifier

export function DidarAccess({ locale, role: routeRole, service, commerceEntry = false, returnTo }: { locale: DidarLocale; role?: DidarRole; service?: string; commerceEntry?: boolean; returnTo?: string }) {
  const router = useRouter()
  const copy = didarUiCopy[locale]
  const w = words[locale]
  const [stage, setStage] = useState<Stage>(routeRole ? "login" : "roles")
  const [selected, setSelected] = useState<DidarRole>(routeRole || "retailer")
  const [accounts, setAccounts] = useState<Account[]>(sampleAccounts)
  const [session, setSession] = useState<DidarDemoSession | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [otpIntent, setOtpIntent] = useState<OtpIntent>("signin")
  const [pendingAccount, setPendingAccount] = useState<Account | null>(null)

  useEffect(() => {
    try {
      const storedAccounts = JSON.parse(localStorage.getItem(accountsKey) || "[]") as Account[]
      if (Array.isArray(storedAccounts)) setAccounts([...sampleAccounts, ...storedAccounts])
      setSession(readDidarDemoSession())
    } catch { /* Browsers may block local storage; the preview can still be viewed. */ }
    setReady(true)
  }, [])

  const activeRole = routeRole || selected
  const authorized = !!session && session.role === activeRole
  const workspaceEntry = !!routeRole && !commerceEntry
  const safeReturnTo = returnTo?.startsWith(`/${locale}/`) && !returnTo.startsWith("//") ? returnTo : undefined
  const sample = sampleAccounts.find((account) => account.role === activeRole)!
  const normalizedIdentifier = normalizeIdentifier(identifier)
  const channel = identifierChannel(normalizedIdentifier)

  function clearFeedback() { setError(""); setStatus("") }
  function choose(role: DidarRole) {
    setSelected(role); setStage("login"); setIdentifier(""); setOtp(""); setPendingAccount(null); clearFeedback()
  }
  function showOtp(nextAccount: Account, intent: OtpIntent, destination: string, delivery: Channel) {
    setIdentifier(destination); setPendingAccount(nextAccount); setOtpIntent(intent); setOtp(""); setStage("otp"); setError("")
    setStatus(delivery === "email" ? w.sentEmail : w.sentMobile)
  }
  function requestSignInOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!channel) { setError(w.invalid); return }
    const account = accounts.find((candidate) => candidate.role === activeRole && accountMatches(candidate, normalizedIdentifier))
    if (!account) { setError(w.error); setStatus(""); return }
    showOtp(account, "signin", normalizedIdentifier, channel)
  }
  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const destination = normalizeIdentifier(String(form.get("identifier") || ""))
    const delivery = identifierChannel(destination)
    if (!delivery) { setError(w.invalid); return }
    if (accounts.some((account) => account.role === activeRole && accountMatches(account, destination))) { setError(w.duplicate); return }
    const next: Account = { role: activeRole, [delivery]: destination, name: String(form.get("name") || "").trim(), city: String(form.get("city") || "").trim() }
    showOtp(next, "register", destination, delivery)
  }
  function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (latinDigits(otp).trim() !== demoOtp || !pendingAccount) { setError(w.otpError); return }
    if (otpIntent === "register") {
      const nextAccounts = [...accounts, pendingAccount]
      setAccounts(nextAccounts)
      try { localStorage.setItem(accountsKey, JSON.stringify(nextAccounts.filter((account) => !account.demo))) } catch {}
    }
    const next = {
      role: activeRole,
      identifier,
      accountKey: pendingAccount.email || pendingAccount.mobile || identifier,
      displayName: pendingAccount.name || identifier,
    }
    setSession(next)
    try { writeDidarDemoSession(next) } catch {}
    setError("")
    setStatus(otpIntent === "register" ? w.pending : "")
    if (!workspaceEntry) {
      const commerceRole = activeRole === "consumer" || activeRole === "retailer"
      router.push(commerceRole
        ? safeReturnTo || `/${locale}/jewellery`
        : `/${locale}/my-didar/${activeRole}`)
    }
  }
  function signOut() {
    setSession(null); setStage(routeRole ? "login" : "roles"); setIdentifier(""); setOtp(""); setPendingAccount(null); clearFeedback()
    try { clearDidarDemoSession() } catch {}
    if (routeRole) router.push(`/${locale}/my-didar`)
  }

  if (!ready) return <main className="didar-site didar-access" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}><p className="didar-access-loading">DIDAR</p></main>
  if (authorized && workspaceEntry) return <><div className="didar-access-session" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}><span>{copy.myDidar} · {copy[activeRole]} · <bdi dir="ltr">{session.identifier}</bdi></span><button type="button" onClick={signOut}>{w.signout}</button></div><DidarWorkspace key={`${activeRole}:${session.accountKey}`} locale={locale} role={activeRole} initialService={service} accountEmail={session.accountKey} /></>

  return <main className="didar-site didar-access" lang={locale} dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
    <div className="didar-access-heading"><p className="didar-eyebrow">DIDAR · {copy.myDidar}</p><h1>{stage === "roles" ? w.choose : stage === "login" ? w.login : stage === "otp" ? w.otpTitle : w.registerTitle}</h1><p>{stage === "roles" ? w.intro : copy[activeRole]}</p></div>
    {stage === "roles" ? <div className="didar-access-roles">{roles.map((role, index) => <button type="button" onClick={() => choose(role)} className="didar-access-role" key={role}><span>0{index + 1}</span><h2>{copy[role]}</h2><p>{copy[`${role}Services` as const].join(" · ")}</p><b aria-hidden="true">↗</b></button>)}</div> : <div className="didar-access-panel">
      <div className="didar-access-role-summary"><span>{copy[activeRole]}</span><Link href={`/${locale}/my-didar`} onClick={() => { setStage("roles"); clearFeedback() }}>{w.change}</Link></div>
      <p className="didar-access-notice">{w.notice}</p>
      {!!status && <p className="didar-work-message" role="status">{status}</p>}
      {!!error && <p className="didar-access-error" role="alert">{error}</p>}
      {stage === "login" && <>
        <div className="didar-demo-credentials"><strong>{w.sample}</strong><span><bdi dir="ltr">{sample.email}</bdi></span><span><bdi dir="ltr">{sample.mobile}</bdi></span><small>{w.demoCode}: <bdi dir="ltr">{demoOtp}</bdi></small></div>
        <form onSubmit={requestSignInOtp} className="didar-access-form"><label>{w.identifier}<input required type="text" dir="ltr" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="09121234567 / name@example.com" /></label><button type="submit">{w.requestOtp}</button></form>
        <button type="button" className="didar-access-text-button" onClick={() => { setStage("register"); clearFeedback() }}>{w.register}</button>
      </>}
      {stage === "register" && <>
        <form onSubmit={register} className="didar-access-form"><label>{w.name}<input required name="name" maxLength={100} autoComplete="name" /></label><label>{w.city}<input required name="city" maxLength={80} autoComplete="address-level2" /></label><label>{w.identifier}<input required name="identifier" type="text" dir="ltr" autoComplete="username" defaultValue={identifier} placeholder="09121234567 / name@example.com" /></label><button type="submit">{w.submit}</button></form>
        <button type="button" className="didar-access-text-button" onClick={() => { setStage("login"); clearFeedback() }}>{w.back}</button>
      </>}
      {stage === "otp" && <>
        <div className="didar-otp-destination"><span>{w.destination}</span><bdi dir="ltr">{identifier}</bdi><strong>{w.demoCode}: <bdi dir="ltr">{demoOtp}</bdi></strong></div>
        <form onSubmit={verifyOtp} className="didar-access-form"><label>{w.code}<input required value={otp} onChange={(event) => setOtp(event.target.value)} type="text" inputMode="numeric" autoComplete="one-time-code" dir="ltr" minLength={6} maxLength={6} pattern="[0-9۰-۹٠-٩]{6}" /></label><button type="submit">{w.verify}</button></form>
        <button type="button" className="didar-access-text-button" onClick={() => { setOtp(""); setError(""); setStatus(channel === "email" ? w.sentEmail : w.sentMobile) }}>{w.resend}</button><br />
        <button type="button" className="didar-access-text-button" onClick={() => { setStage(otpIntent === "register" ? "register" : "login"); setOtp(""); clearFeedback() }}>{w.back}</button>
      </>}
    </div>}
    <Link className="didar-access-reference" href={`/${locale}/my-didar/preview`}>{copy.fullPreview} ↗</Link>
  </main>
}
