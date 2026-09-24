"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"

import { publicDidarProducts } from "@/lib/didar/public-catalog"
import { didarUiCopy } from "@/lib/didar/ui-copy"
import { didarFamilies, didarTaxonomy, metricBarWeights, coinWeights } from "@/lib/didar/product-taxonomy"
import { didarServicePaths, type DidarRole } from "@/lib/didar/service-paths"
import { type DidarLocale } from "@/lib/helpers/storefront-locale"

type SupplierItem = { id: string; name: string; sku: string; family: string; category: string; subtype: string; minWeight: string; maxWeight: string; nominalWeight: string; purity: string; quantity: string; issuer: string; story: string; photos: string[]; status: "draft" | "review" }
type Inquiry = { id: string; slugs: string[]; name: string; phone: string; city: string; note: string; date: string; status: "pending" }
type Case = { id: string; kind: "warranty" | "buyback"; uid: string; date: string; status: "pending"; note?: string; purchaseDate?: string; invoice?: string }
type Profile = { name: string; phone: string; city: string; address: string; email: string; legalType: string; businessType: string; submitted: boolean }
type DemoState = { selected: string[]; favorites: string[]; inquiries: Inquiry[]; cases: Case[]; supplierItems: SupplierItem[]; profiles: Partial<Record<DidarRole, Profile>> }
const blankProfile = (): Profile => ({ name: "", phone: "", city: "", address: "", email: "", legalType: "person", businessType: "manufacturer", submitted: false })
const initial = (): DemoState => ({ selected: [], favorites: [], inquiries: [], cases: [], supplierItems: [], profiles: {} })
const storagePrefix = "didar-ui-demo-v2"
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`

const extraMenus: Record<DidarRole, { id: string; fa: string; en: string }[]> = {
  consumer: [{ id: "favorites", fa: "انتخاب‌های من", en: "My selections" }, { id: "cases", fa: "پرونده‌های خدمات", en: "Service cases" }],
  retailer: [{ id: "directory", fa: "ساختار محصولات", en: "Product taxonomy" }, { id: "basket", fa: "سبد استعلام", en: "Inquiry basket" }, { id: "quotes", fa: "پیش‌فاکتورها", en: "Quotations" }, { id: "shipments", fa: "ارسال‌ها", en: "Shipments" }, { id: "shop", fa: "ویترین فروشگاه", en: "Shop window" }, { id: "suppliers", fa: "تأمین‌کنندگان", en: "Suppliers" }],
  supplier: [{ id: "new-product", fa: "ثبت محصول جدید", en: "New product" }, { id: "directory", fa: "ساختار محصولات", en: "Product taxonomy" }],
  wholesaler: [{ id: "products", fa: "محصولات پیشنهادی", en: "Product proposals" }],
}

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim()

export function DidarWorkspace({ locale, role, initialService, accountEmail }: { locale: DidarLocale; role: DidarRole; initialService?: string; accountEmail: string }) {
  const storageKey = `${storagePrefix}:${role}:${accountEmail}`
  const copy = didarUiCopy[locale]
  const rtl = locale === "fa" || locale === "ar"
  const [section, setSection] = useState(initialService || didarServicePaths[role][0])
  const [state, setState] = useState<DemoState>(initial)
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [catalogCategory, setCatalogCategory] = useState("")
  const [family, setFamily] = useState("")
  const [category, setCategory] = useState("")
  const [subtype, setSubtype] = useState("")
  const [weight, setWeight] = useState("")
  const [productDraft, setProductDraft] = useState<SupplierItem | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [inquiryId, setInquiryId] = useState<string | null>(null)
  const [city, setCity] = useState("")
  const [warrantyUid, setWarrantyUid] = useState("")

  useEffect(() => {
    try { const stored = localStorage.getItem(storageKey); if (stored) { const value = JSON.parse(stored) as Partial<DemoState>; setState({ ...initial(), ...value }) } } catch { /* the demo also works without storage */ }
    setLoaded(true)
  }, [storageKey])
  useEffect(() => { if (loaded) try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch { /* storage may be unavailable */ } }, [loaded, state])
  useEffect(() => { setSection(initialService || didarServicePaths[role][0]); setMessage("") }, [role, initialService])
  useEffect(() => () => { photoPreview.forEach((src) => URL.revokeObjectURL(src)) }, [photoPreview])

  const update = (change: Partial<DemoState>) => setState((before) => ({ ...before, ...change }))
  const nav = (next: string) => { setSection(next); setMessage(""); setInquiryId(null); window.scrollTo({ top: 0, behavior: "smooth" }) }
  const profile = state.profiles[role] || blankProfile()
  const isFa = locale === "fa"
  const localeLabel = (item: { fa: string; en: string; ar?: string; fr?: string }) => item[locale] || item.en
  const publicCategories = useMemo(() => [...new Set(publicDidarProducts.map((item) => item.category).filter((item): item is string => !!item))], [])
  const catalog = useMemo(() => publicDidarProducts.filter((item) => (!catalogCategory || item.category === catalogCategory) && (!search.trim() || item.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))), [search, catalogCategory])
  const selected = publicDidarProducts.filter((item) => state.selected.includes(item.slug))
  const categories = didarTaxonomy.filter((item) => item.family === family)
  const subtypes = didarTaxonomy.find((item) => item.id === category)?.types || []
  const bullion = family === "bullion"

  const roleMenu = didarServicePaths[role].map((id, index) => ({ id, label: copy[`${role}Services` as const][index] }))
  const menu = [...roleMenu, ...extraMenus[role].map((item) => ({ id: item.id, label: localeLabel(item) }))]
  const title = menu.find((item) => item.id === section)?.label || copy[role]

  function toggle(slug: string, key: "selected" | "favorites") {
    update({ [key]: state[key].includes(slug) ? state[key].filter((value) => value !== slug) : [...state[key], slug] })
  }
  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next: Profile = { name: field(data, "name"), phone: field(data, "phone"), city: field(data, "city"), address: field(data, "address"), email: field(data, "email"), legalType: field(data, "legalType"), businessType: field(data, "businessType"), submitted: true }
    update({ profiles: { ...state.profiles, [role]: next } })
    setMessage(isFa ? "پرونده در پیش‌نمایش با وضعیت «در انتظار بررسی» ذخیره شد." : "Application saved in the preview as pending review.")
  }
  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected.length) { setMessage(isFa ? "ابتدا یک محصول را به سبد استعلام اضافه کنید." : "Add a creation to the inquiry basket first."); return }
    const data = new FormData(event.currentTarget)
    const next: Inquiry = { id: uid("INQ-DEMO"), slugs: [...state.selected], name: field(data, "name"), phone: field(data, "phone"), city: field(data, "city"), note: field(data, "note"), date: new Date().toISOString().slice(0, 10), status: "pending" }
    update({ inquiries: [next, ...state.inquiries], selected: [] })
    nav("inquiries")
    setMessage(isFa ? "استعلام نمونه ثبت شد و در بخش پیگیری دیده می‌شود." : "Sample inquiry saved; you can follow it here.")
  }
  function submitCase(event: FormEvent<HTMLFormElement>, kind: "warranty" | "buyback") {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const code = field(data, "uid").toUpperCase()
    if (kind === "buyback" && !state.cases.some((item) => item.kind === "warranty" && item.uid === code)) { setMessage(isFa ? "برای مشاهدهٔ مسیر نمونهٔ بازخرید ابتدا با همین شناسه یک گارانتی نمونه ثبت کنید؛ تأیید اصالت بعداً به سرور متصل می‌شود." : "Create a sample warranty case for this ID to preview buyback. Verification requires the API."); return }
    if (state.cases.some((item) => item.kind === kind && item.uid === code)) { setMessage(isFa ? "برای این شناسه قبلاً درخواست نمونه ثبت شده است." : "A sample request already exists for this ID."); return }
    update({ cases: [{ id: uid(kind === "warranty" ? "WC-DEMO" : "RB-DEMO"), kind, uid: code, date: new Date().toISOString().slice(0, 10), status: "pending", note: field(data, "note"), purchaseDate: field(data, "date"), invoice: field(data, "invoice") }, ...state.cases] })
    setMessage(isFa ? "درخواست نمونه ثبت شد؛ هیچ استعلام یا رزرو واقعی انجام نشده است." : "Sample request saved; no real verification or reservation occurred.")
  }

  const newDraft = (): SupplierItem => ({ id: "", name: "", sku: "", family: "", category: "", subtype: "", minWeight: "", maxWeight: "", nominalWeight: "", purity: "750", quantity: "", issuer: "", story: "", photos: [], status: "draft" })
  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next: SupplierItem = { id: productDraft?.id || uid("SP-DEMO"), name: field(data, "name"), sku: field(data, "sku"), family, category, subtype, minWeight: field(data, "minWeight"), maxWeight: field(data, "maxWeight"), nominalWeight: field(data, "nominalWeight"), purity: field(data, "purity"), quantity: field(data, "quantity"), issuer: field(data, "issuer"), story: field(data, "story"), photos: productDraft?.photos || [], status: productDraft?.status || "draft" }
    const validTax = categories.some((item) => item.id === category && item.types.some((type) => type.id === subtype))
    if (!validTax || state.supplierItems.some((item) => item.id !== next.id && item.sku.toLocaleLowerCase() === next.sku.toLocaleLowerCase()) || !Number.isInteger(Number(next.quantity)) || Number(next.quantity) < 0 || Number(next.purity) <= 0 || Number(next.purity) > 1000 || (bullion ? Number(next.nominalWeight) <= 0 || !next.issuer : Number(next.minWeight) <= 0 || Number(next.maxWeight) < Number(next.minWeight))) { setMessage(isFa ? "طبقه‌بندی، کد یکتا، عیار، تعداد و وزن را بررسی کنید." : "Check taxonomy, unique SKU, fineness, quantity and weight."); return }
    if (category === "iran-coins" && (Number(next.purity) !== 900 || Number(next.nominalWeight) !== Number(coinWeights[subtype]))) { setMessage(isFa ? "سکهٔ بانکی در این پیش‌نمایش عیار ۹۰۰ و وزن قطع مشخص دارد." : "This coin requires 900 fineness and the selected denomination weight."); return }
    update({ supplierItems: [next, ...state.supplierItems.filter((item) => item.id !== next.id)] })
    setProductDraft(null); setPhotoPreview([]); nav("products")
    setMessage(isFa ? "پیش‌نویس محصول در مرورگر ذخیره شد." : "Product draft saved in this browser.")
  }

  const profileView = <form className="didar-work-form" onSubmit={submitProfile} key={role}>
    <div className="didar-work-fields"><label>{isFa ? "نام شخص / مجموعه" : "Person / business name"}<input required name="name" defaultValue={profile.name} /></label><label>{isFa ? "تلفن" : "Phone"}<input required name="phone" type="tel" dir="ltr" defaultValue={profile.phone} /></label><label>{isFa ? "ایمیل" : "Email"}<input name="email" type="email" dir="ltr" defaultValue={profile.email} /></label><label>{isFa ? "شهر" : "City"}<input required name="city" defaultValue={profile.city} /></label><label>{isFa ? "نوع شخصیت" : "Legal entity"}<select name="legalType" defaultValue={profile.legalType}><option value="person">{isFa ? "حقیقی" : "Individual"}</option><option value="company">{isFa ? "حقوقی" : "Company"}</option></select></label>{(role === "supplier" || role === "wholesaler") && <label>{isFa ? "نوع تأمین‌کننده" : "Supplier type"}<select name="businessType" defaultValue={profile.businessType}><option value="manufacturer">{isFa ? "تولیدکننده" : "Manufacturer"}</option><option value="wholesaler">{isFa ? "بنکدار" : "Wholesaler"}</option><option value="other">{isFa ? "سایر" : "Other"}</option></select></label>}<label className="didar-work-span">{isFa ? "نشانی" : "Address"}<textarea required name="address" defaultValue={profile.address} /></label></div>
    <button className="didar-work-primary" type="submit">{isFa ? "ثبت پروندهٔ نمونه" : "Save sample application"}</button>
    {profile.submitted && <p className="didar-work-status">{isFa ? "وضعیت: در انتظار بررسی (نمایشی)" : "Status: pending review (sample)"}</p>}
  </form>

  const catalogueView = <><div className="didar-work-toolbar"><input type="search" aria-label={copy.search} placeholder={copy.search} value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label={isFa ? "دستهٔ محصولات موجود" : "Available collection"} value={catalogCategory} onChange={(event) => setCatalogCategory(event.target.value)}><option value="">{isFa ? "تمام دسته‌های موجود" : "All available collections"}</option>{publicCategories.map((name) => <option value={name} key={name}>{name}</option>)}</select><span>{catalog.length} {copy.results}</span><button type="button" onClick={() => nav("basket")}>{isFa ? "سبد استعلام" : "Inquiry basket"} ({state.selected.length})</button></div><div className="didar-work-products">{catalog.map((item) => <article key={item.slug}><Link href={`/${locale}/creation/${item.slug}`}><div className="didar-work-product-image"><Image src={item.image} alt={item.title} fill sizes="(max-width: 760px) 48vw, 25vw" /></div><h3 lang="fa" dir="rtl">{item.title}</h3></Link><p>{item.category ?? copy.uncategorized}</p><div className="didar-work-actions"><button type="button" aria-pressed={state.favorites.includes(item.slug)} onClick={() => toggle(item.slug, "favorites")}>{state.favorites.includes(item.slug) ? "♥" : "♡"} {isFa ? "انتخاب‌های من" : "Favourite"}</button><button type="button" aria-pressed={state.selected.includes(item.slug)} onClick={() => toggle(item.slug, "selected")}>{state.selected.includes(item.slug) ? (isFa ? "حذف از سبد" : "Remove") : (isFa ? "افزودن به استعلام" : "Add to inquiry")}</button></div></article>)}</div>{!catalog.length && <p className="didar-work-empty">{copy.none}</p>}</>

  const inquiryList = <div className="didar-work-stack">{state.inquiries.length ? state.inquiries.map((item) => <article className="didar-work-card" key={item.id}><span className="didar-work-tag">{isFa ? "در انتظار بررسی · نمونه" : "Pending review · sample"}</span><h3 dir="ltr">{item.id}</h3><p>{item.slugs.map((slug) => publicDidarProducts.find((product) => product.slug === slug)?.title || slug).join("، ")}</p><p>{item.date} · {item.city}</p><button type="button" onClick={() => setInquiryId(inquiryId === item.id ? null : item.id)}>{isFa ? "جزئیات" : "Details"}</button>{inquiryId === item.id && <dl><dt>{isFa ? "متقاضی" : "Applicant"}</dt><dd>{item.name}</dd><dt>{isFa ? "یادداشت" : "Note"}</dt><dd>{item.note || "—"}</dd></dl>}</article>) : <div className="didar-work-empty">{isFa ? "هنوز استعلامی ثبت نشده است. از کاتالوگ، محصول انتخاب کنید." : "No inquiries yet. Select products from the catalogue."}<br /><button type="button" onClick={() => nav("catalog")}>{copy.catalog} ↗</button></div>}</div>

  const caseList = <div className="didar-work-stack">{state.cases.length ? state.cases.map((item) => <article className="didar-work-card" key={item.id}><span className="didar-work-tag">{item.kind === "warranty" ? (isFa ? "گارانتی" : "Warranty") : (isFa ? "بازخرید" : "Buyback")}</span><h3 dir="ltr">{item.id}</h3><p><bdi dir="ltr">{item.uid}</bdi> · {item.date}</p><p>{isFa ? "در انتظار بررسی · نمونه" : "Pending review · sample"}</p></article>) : <div className="didar-work-empty">{isFa ? "هنوز پروندهٔ خدماتی ندارید." : "No service cases yet."}</div>}</div>

  const productForm = <form className="didar-work-form" onSubmit={submitProduct} key={productDraft?.id || "new"}>
    <div className="didar-work-fields"><label>{isFa ? "نام محصول" : "Product name"}<input required name="name" defaultValue={productDraft?.name} /></label><label>SKU <input required name="sku" dir="ltr" defaultValue={productDraft?.sku} /></label><label>{isFa ? "خانواده محصول" : "Product family"}<select required value={family} onChange={(event) => { setFamily(event.target.value); setCategory(""); setSubtype("") }}><option value="">{isFa ? "انتخاب کنید" : "Select"}</option>{didarFamilies.filter((item) => !("pending" in item)).map((item) => <option value={item.id} key={item.id}>{localeLabel(item)}</option>)}</select></label><label>{isFa ? "دسته‌بندی" : "Category"}<select required value={category} onChange={(event) => { setCategory(event.target.value); setSubtype("") }}><option value="">{isFa ? "انتخاب کنید" : "Select"}</option>{categories.map((item) => <option value={item.id} key={item.id}>{localeLabel(item)}</option>)}</select></label><label>{isFa ? "نوع / زیرگروه" : "Type / subtype"}<select required value={subtype} onChange={(event) => setSubtype(event.target.value)}><option value="">{isFa ? "انتخاب کنید" : "Select"}</option>{subtypes.map((item) => <option value={item.id} key={item.id}>{localeLabel(item)}</option>)}</select></label><label>{isFa ? "عیار / خلوص در هزار" : "Fineness per thousand"}<input name="purity" required type="number" min="0.001" max="1000" step="0.001" dir="ltr" defaultValue={productDraft?.purity || "750"} /></label>{bullion ? <><label>{isFa ? "وزن اسمی (گرم)" : "Nominal weight (g)"}{category === "standard-bars" || category === "iran-coins" ? <select name="nominalWeight" required defaultValue={productDraft?.nominalWeight || ""}><option value="">{isFa ? "انتخاب کنید" : "Select"}</option>{(category === "standard-bars" ? subtype === "standard-bars-troy" ? ["31.1035"] : metricBarWeights : coinWeights[subtype] ? [coinWeights[subtype]] : []).map((option) => <option value={option} key={option}>{option} g</option>)}</select> : <input name="nominalWeight" type="number" required min="0.00001" step="0.00001" dir="ltr" defaultValue={productDraft?.nominalWeight} />}</label><label>{isFa ? "برند / صادرکننده" : "Issuer"}<input name="issuer" required defaultValue={productDraft?.issuer} /></label></> : <><label>{isFa ? "حداقل وزن (گرم)" : "Min weight (g)"}<input name="minWeight" type="number" required min="0.00001" step="0.00001" dir="ltr" defaultValue={productDraft?.minWeight} /></label><label>{isFa ? "حداکثر وزن (گرم)" : "Max weight (g)"}<input name="maxWeight" type="number" required min="0.00001" step="0.00001" dir="ltr" defaultValue={productDraft?.maxWeight} /></label></>}<label>{isFa ? "تعداد" : "Quantity"}<input name="quantity" type="number" required min="0" step="1" dir="ltr" defaultValue={productDraft?.quantity} /></label><label className="didar-work-span">{isFa ? "روایت / شرح محصول" : "Product story"}<textarea name="story" maxLength={1000} defaultValue={productDraft?.story} /></label><label className="didar-work-span">{isFa ? "تصاویر محصول (حداکثر ۳ عکس، نمایشی)" : "Product photos (up to 3, sample)"}<input type="file" accept="image/jpeg,image/png" multiple onChange={(event) => { const files = [...(event.target.files || [])]; if (files.length > 3 || files.some((file) => file.size > 2_000_000)) { setMessage(isFa ? "حداکثر ۳ عکس، هر کدام تا ۲ مگابایت." : "Up to 3 images, 2 MB each."); return } photoPreview.forEach((url) => URL.revokeObjectURL(url)); setPhotoPreview(files.map((file) => URL.createObjectURL(file))); setProductDraft((prev) => ({ ...(prev || newDraft()), photos: files.map((file) => file.name) })) }} /></label></div>
    {!!photoPreview.length && <div className="didar-work-photo-preview">{photoPreview.map((src) => <img src={src} alt="" key={src} />)}</div>}
    <p className="didar-work-muted">{isFa ? "عکس‌ها فقط در این صفحه پیش‌نمایش دارند؛ فایل به سرور ارسال نمی‌شود." : "Photos are previewed locally; no file is uploaded."}</p>
    <button className="didar-work-primary" type="submit">{isFa ? "ذخیرهٔ پیش‌نویس" : "Save draft"}</button>
  </form>

  let body: ReactNode
  if (["application", "profile", "cooperation"].includes(section)) body = profileView
  else if (section === "catalog") body = catalogueView
  else if (section === "basket") body = <><div className="didar-work-stack">{selected.map((item) => <article className="didar-work-line" key={item.slug}><Image src={item.image} alt="" width={70} height={70} /><span>{item.title}</span><button type="button" onClick={() => toggle(item.slug, "selected")}>{isFa ? "حذف" : "Remove"}</button></article>)}</div>{selected.length ? <form className="didar-work-form" onSubmit={submitInquiry}><h2>{isFa ? "مشخصات درخواست" : "Inquiry details"}</h2><div className="didar-work-fields"><label>{isFa ? "نام" : "Name"}<input name="name" required /></label><label>{isFa ? "شماره تماس" : "Phone"}<input name="phone" dir="ltr" required type="tel" /></label><label>{isFa ? "شهر" : "City"}<input name="city" required /></label><label>{isFa ? "یادداشت" : "Note"}<textarea name="note" /></label></div><button className="didar-work-primary" type="submit">{isFa ? "ثبت استعلام نمونه" : "Save sample inquiry"}</button></form> : <div className="didar-work-empty">{isFa ? "سبد استعلام خالی است." : "Your inquiry basket is empty."}<br /><button type="button" onClick={() => nav("catalog")}>{copy.catalog} ↗</button></div>}</>
  else if (section === "inquiries" || section === "requests") body = inquiryList
  else if (section === "orders" || section === "quotes" || section === "shipments") body = <div className="didar-work-empty">{isFa ? "برای این بخش هنوز سفارش، پیش‌فاکتور یا ارسال واقعی وجود ندارد. پس از بررسی استعلام، وضعیت اینجا نمایش داده می‌شود." : "No real order, quotation or shipment exists. Reviewed inquiries will appear here after API integration."}<br /><button type="button" onClick={() => nav("inquiries")}>{isFa ? "مشاهدهٔ استعلام‌ها" : "View inquiries"} ↗</button></div>
  else if (section === "shop") body = <><p className="didar-work-muted">{isFa ? "نمای ویترین خرده‌فروش؛ محصولات انتخابی نمونه‌اند و به‌صورت عمومی منتشر نمی‌شوند." : "Sample shop window; selected creations are not published."}</p>{catalogueView}</>
  else if (section === "suppliers") body = <div className="didar-work-grid">{["کارگاه الف", "تأمین‌کننده ب", "خانه شمش ج"].map((name, index) => <article className="didar-work-card" key={name}><span className="didar-work-tag">{isFa ? "تأمین‌کننده نمونه" : "Sample supplier"} 0{index + 1}</span><h3>{name}</h3><p>{isFa ? "پرونده و محصولات پس از تأیید قابل مشاهده‌اند." : "Profile and products become visible after approval."}</p></article>)}</div>
  else if (section === "stores") body = <><p className="didar-work-muted">{isFa ? "مکان واقعی شما دریافت نمی‌شود. شهر را برای دیدن مکان‌های نمونه انتخاب کنید." : "Your actual location is not requested. Choose a city to see sample locations."}</p><label className="didar-work-city">{isFa ? "شهر" : "City"}<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">{isFa ? "همهٔ شهرها" : "All cities"}</option><option value="tehran">{isFa ? "تهران" : "Tehran"}</option><option value="isfahan">{isFa ? "اصفهان" : "Isfahan"}</option></select></label><div className="didar-work-grid">{[{ city: "tehran", title: "فروشگاه نمایشی تهران ۱" }, { city: "tehran", title: "فروشگاه نمایشی تهران ۲" }, { city: "isfahan", title: "فروشگاه نمایشی اصفهان" }].filter((item) => !city || item.city === city).map((item) => <article className="didar-work-card" key={item.title}><span className="didar-work-tag">{isFa ? "نمونه" : "Sample"}</span><h3>{item.title}</h3><p>{isFa ? "نشانی و موجودی واقعی پس از اتصال فروشگاه‌ها نمایش داده می‌شود." : "Verified location and inventory will appear after integration."}</p></article>)}</div></>
  else if (section === "authenticity") body = <form className="didar-work-form" onSubmit={(event) => { event.preventDefault(); setMessage(isFa ? `شناسهٔ ${warrantyUid || "—"} در این پیش‌نمایش به سامانهٔ اصالت متصل نیست.` : `ID ${warrantyUid || "—"} is not connected to a verification service.`) }}><p>{isFa ? "شناسهٔ درج‌شده روی قطعه را وارد کنید؛ پاسخ این مرحله فقط نمایشی است." : "Enter the code on the piece; this is a sample interface."}</p><label>UID <input dir="ltr" value={warrantyUid} onChange={(event) => setWarrantyUid(event.target.value)} required maxLength={40} placeholder="DG-104-001" /></label><button type="submit" className="didar-work-primary">{isFa ? "بررسی نمونه" : "Sample lookup"}</button></form>
  else if (section === "warranty" || section === "buyback") body = <><form className="didar-work-form" onSubmit={(event) => submitCase(event, section === "warranty" ? "warranty" : "buyback")}><div className="didar-work-fields"><label>UID<input required name="uid" dir="ltr" maxLength={40} placeholder="DG-104-001" /></label>{section === "warranty" && <><label>{isFa ? "تاریخ خرید" : "Purchase date"}<input name="date" required type="date" /></label><label>{isFa ? "شماره فاکتور" : "Invoice number"}<input name="invoice" required dir="ltr" /></label></>}<label className="didar-work-span">{isFa ? "توضیحات" : "Notes"}<textarea name="note" maxLength={500} /></label></div><button className="didar-work-primary" type="submit">{section === "warranty" ? (isFa ? "ثبت گارانتی نمونه" : "Sample warranty request") : (isFa ? "درخواست بازخرید نمونه" : "Sample buyback request")}</button></form><h2 className="didar-work-subheading">{isFa ? "پرونده‌های ثبت‌شده در این مرورگر" : "Cases saved in this browser"}</h2>{caseList}</>
  else if (section === "favorites") body = <div className="didar-work-products">{publicDidarProducts.filter((item) => state.favorites.includes(item.slug)).map((item) => <article key={item.slug}><Link href={`/${locale}/creation/${item.slug}`}><div className="didar-work-product-image"><Image src={item.image} alt={item.title} fill sizes="33vw" /></div><h3>{item.title}</h3></Link><button type="button" onClick={() => toggle(item.slug, "favorites")}>{isFa ? "حذف از انتخاب‌ها" : "Remove"}</button></article>)}{!state.favorites.length && <div className="didar-work-empty">{isFa ? "هنوز محصولی ذخیره نکرده‌اید." : "No saved creations yet."}</div>}</div>
  else if (section === "cases") body = caseList
  else if (section === "new-product" || (section === "products" && !!productDraft)) body = productForm
  else if (section === "products" || section === "review" || section === "supply") body = <><button className="didar-work-primary" type="button" onClick={() => { setProductDraft(newDraft()); setFamily(""); setCategory(""); setSubtype(""); nav("new-product") }}>{isFa ? "ثبت محصول جدید" : "New product"}</button><div className="didar-work-stack">{state.supplierItems.map((item) => <article className="didar-work-card" key={item.id}><span className="didar-work-tag">{item.status === "draft" ? (isFa ? "پیش‌نویس" : "Draft") : (isFa ? "در انتظار بررسی · نمونه" : "Pending review · sample")}</span><h3>{item.name}</h3><p dir="ltr">{item.sku}</p><p>{didarTaxonomy.find((taxon) => taxon.id === item.category)?.fa} / {item.purity}‰ / {item.quantity}</p><div className="didar-work-actions"><button type="button" onClick={() => { setProductDraft(item); setFamily(item.family); setCategory(item.category); setSubtype(item.subtype); nav("new-product") }}>{isFa ? "ویرایش" : "Edit"}</button>{item.status === "draft" && <button type="button" onClick={() => { update({ supplierItems: state.supplierItems.map((existing) => existing.id === item.id ? { ...existing, status: "review" } : existing) }); setMessage(isFa ? "محصول نمونه برای بررسی علامت‌گذاری شد." : "Sample product marked for review.") }}>{isFa ? "ارسال برای بررسی" : "Submit for review"}</button>}</div></article>)}{!state.supplierItems.length && <div className="didar-work-empty">{isFa ? "هنوز محصولی پیشنهاد نشده است." : "No product proposals yet."}</div>}</div></>
  else if (section === "directory") body = <div className="didar-work-taxonomy">{didarFamilies.map((item) => <details key={item.id}><summary>{localeLabel(item)} {"pending" in item ? (isFa ? "· در انتظار تعریف" : "· pending") : ""}</summary>{didarTaxonomy.filter((category) => category.family === item.id).map((category) => <div key={category.id}><b>{localeLabel(category)}</b><p>{category.types.map((type) => localeLabel(type)).join(" · ")}</p></div>)}</details>)}</div>
  else body = <div className="didar-work-empty">{copy.serviceNote}</div>

  return <main className="didar-site didar-workspace" dir={rtl ? "rtl" : "ltr"} lang={locale}>
    <div className="didar-work-banner"><Link href={`/${locale}/my-didar`}>{copy.myDidar}</Link><span> / </span><span>{copy[role]}</span><span className="didar-work-demo">{isFa ? "پیش‌نمایش عملکرد · بدون اتصال به API" : "Interactive sample · API not connected"}</span></div>
    <div className="didar-work-layout"><aside className="didar-work-sidebar"><h2>{copy[role]}</h2><nav aria-label={copy[role]}>{menu.map((item) => <button key={item.id} type="button" aria-current={section === item.id ? "page" : undefined} onClick={() => nav(item.id)}>{item.label}<span aria-hidden="true">↗</span></button>)}</nav><Link href={`/${locale}/my-didar`}>{isFa ? "تغییر نقش" : "Change role"}</Link></aside><section className="didar-work-main"><p className="didar-eyebrow">DIDAR · {copy.myDidar}</p><h1>{title}</h1><p className="didar-work-intro">{copy.serviceNote}</p>{message && <p className="didar-work-message" role="status">{message}</p>}{body}</section></div>
  </main>
}
