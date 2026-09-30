import { useEffect, useRef, useState } from "react";
import { Button, Container, Input, Textarea, Table } from "@medusajs/ui";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useBlocker,
} from "react-router-dom";
import {
  language,
  languages,
  direction,
  messages,
  message,
  type Language,
} from "./messages";
import "./styles.css";

type Api = (path: string, options?: RequestInit) => Promise<any>;
class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
const mkApi =
  (backend: string): Api =>
  async (path, options = {}) => {
    let response: Response;
    try {
      response = await fetch(`${backend}${path}`, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options.headers },
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new ApiError(503, "UNAVAILABLE");
    }
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(response.status, data.code ?? "UNAVAILABLE");
    return data;
  };
function useData(api: Api, path: string) {
  const [state, setState] = useState<{
      data: any;
      loading: boolean;
      error: ApiError | null;
    }>({ data: null, loading: true, error: null }),
    [tick, setTick] = useState(0);
  useEffect(() => {
    let current = true;
    setState({ data: null, loading: true, error: null });
    api(path)
      .then((data) => {
        if (current) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (current) setState({ data: null, loading: false, error });
      });
    return () => {
      current = false;
    };
  }, [api, path, tick]);
  return { ...state, reload: () => setTick((v) => v + 1) };
}
function Status({ error, lang }: { error: ApiError | null; lang: Language }) {
  if (!error) return null;
  const t = messages[lang];
  return (
    <p role="alert" className="didar-message">
      {error.status === 401
        ? t.unauthorized
        : error.status === 403
          ? t.forbidden
          : error.status === 409
            ? t.conflict
            : error.status === 422
              ? t.invalid
              : t.error}{" "}
      <bdi>{error.code}</bdi>
    </p>
  );
}
function useCommand(api: Api) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState<ApiError | null>(null),
    [success, setSuccess] = useState(false),
    busy = useRef(false),
    retry = useRef<{ path: string; payload: string; key: string } | null>(null);
  return {
    pending,
    error,
    success,
    run: async (path: string, payload: any, method = "POST") => {
      if (busy.current) return null;
      busy.current = true;
      setPending(true);
      setError(null);
      setSuccess(false);
      const serialized = JSON.stringify(payload);
      if (
        !retry.current ||
        retry.current.path !== path ||
        retry.current.payload !== serialized
      )
        retry.current = { path, payload: serialized, key: crypto.randomUUID() };
      try {
        const data = await api(path, {
          method,
          body: JSON.stringify({
            ...payload,
            idempotency_key: retry.current.key,
          }),
        });
        retry.current = null;
        setSuccess(true);
        return data;
      } catch (e) {
        setError(e as ApiError);
        return null;
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
  };
}
function useDirty(dirty: boolean, lang: Language) {
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm(messages[lang].unsaved)) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker, lang]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = messages[lang].unsaved;
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, lang]);
}
const Field = ({
  label,
  name,
  value,
  type = "text",
  required = false,
  readOnly = false,
}: {
  label: string;
  name: string;
  value?: any;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}) => (
  <label>
    {label}
    <Input
      name={name}
      type={type}
      defaultValue={value ?? ""}
      required={required}
      readOnly={readOnly}
      step={type === "number" ? "0.000001" : undefined}
      dir={["email", "number"].includes(type) ? "ltr" : undefined}
    />
  </label>
);
function Terms({ lang, terms = {} }: { lang: Language; terms?: any }) {
  const t = messages[lang],
    [weight, setWeight] = useState(terms.weight_type ?? "RANGE"),
    [fee, setFee] = useState(terms.making_fee_type ?? "RANGE_PERCENT");
  return (
    <>
      <h2>{t.terms}</h2>
      <p>{t.fixedExcluded}</p>
      <div className="didar-fields">
        <Field
          label={t.supplierCode}
          name="supplier_product_code"
          value={terms.supplier_product_code}
        />
        <label>
          {t.weightType}
          <select
            name="weight_type"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          >
            {["EXACT", "RANGE"].map((v) => (
              <option key={v} value={v}>
                {message(lang, v)}
              </option>
            ))}
          </select>
        </label>
        {weight === "EXACT" ? (
          <Field
            label={t.exactWeight}
            name="exact_weight"
            value={terms.exact_weight}
            type="number"
            required
          />
        ) : (
          <>
            <Field
              label={t.weightMinInternal}
              name="weight_min"
              value={terms.weight_min}
              type="number"
              required
            />
            <Field
              label={t.weightMaxInternal}
              name="weight_max"
              value={terms.weight_max}
              type="number"
              required
            />
          </>
        )}
        <label>
          {t.feeType}
          <select
            name="making_fee_type"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          >
            {["PERCENT", "RANGE_PERCENT"].map((v) => (
              <option value={v} key={v}>
                {message(lang, v)}
              </option>
            ))}
          </select>
        </label>
        {fee === "PERCENT" ? (
          <Field
            label={t.feeValue}
            name="making_fee_value"
            value={terms.making_fee_value}
            type="number"
            required
          />
        ) : (
          <>
            <Field
              label={t.feeMinInternal}
              name="making_fee_min"
              value={terms.making_fee_min}
              type="number"
              required
            />
            <Field
              label={t.feeMaxInternal}
              name="making_fee_max"
              value={terms.making_fee_max}
              type="number"
              required
            />
          </>
        )}
        <label>
          {t.availability}
          <select
            name="availability_type"
            defaultValue={terms.availability_type ?? "MADE_TO_ORDER"}
          >
            {["AVAILABLE", "MADE_TO_ORDER", "UNAVAILABLE"].map((v) => (
              <option value={v} key={v}>
                {message(lang, v)}
              </option>
            ))}
          </select>
        </label>
        <Field
          label={t.leadTime}
          name="lead_time_days"
          value={terms.lead_time_days}
          type="number"
        />
      </div>
    </>
  );
}
const termKeys = [
  "supplier_product_code",
  "weight_type",
  "exact_weight",
  "weight_min",
  "weight_max",
  "making_fee_type",
  "making_fee_value",
  "making_fee_min",
  "making_fee_max",
  "availability_type",
  "lead_time_days",
];
const formTerms = (f: FormData) =>
  Object.fromEntries(
    termKeys.filter((k) => f.has(k)).map((k) => [k, f.get(k)]),
  );
function ProductForm({
  api,
  lang,
  record,
  base,
  onSaved,
}: {
  api: Api;
  lang: Language;
  record?: any;
  base: string;
  onSaved: (data: any) => void;
}) {
  const t = messages[lang],
    cmd = useCommand(api),
    categories = useData(api, `${base}/catalog/categories`),
    defs = useData(api, `${base}/catalog/definitions`),
    [dirty, setDirty] = useState(false),
    c = record?.candidate ?? {},
    [category, setCategory] = useState("");
  useDirty(dirty, lang);
  const tree = categories.data?.categories ?? [],
    children = category
      ? (tree.find((v: any) => v.id === category)?.children ?? [])
      : tree.flatMap((r: any) => r.children);
  if (categories.loading || defs.loading)
    return <p role="status">{t.loading}</p>;
  if (categories.error || defs.error)
    return <Status error={categories.error ?? defs.error} lang={lang} />;
  return (
    <form
      className="didar-panel"
      onChange={() => setDirty(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget),
          product = {
            title: f.get("title"),
            handle: f.get("handle"),
            product_code: f.get("product_code"),
            description: f.get("description"),
            technical_description: f.get("technical_description"),
            subcategory_id: f.get("subcategory_id"),
            karat: Number(f.get("karat")),
            material: f.get("material"),
            type_id: f.get("type_id") || null,
            images: String(f.get("images") ?? "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            attribute_value_ids: f.getAll("attribute_value_ids"),
          };
        const data = await cmd.run(
          record
            ? `${base}/products/${record.profile.product_id}`
            : `${base}/products`,
          {
            expected_version: record?.submission?.version ?? 1,
            product,
            ...(!record ? { terms: formTerms(f) } : {}),
          },
          record ? "PATCH" : "POST",
        );
        if (data) {
          setDirty(false);
          onSaved(data);
        }
      }}
    >
      <div className="didar-fields">
        <Field label={t.title} name="title" value={c.title} required />
        <Field label={t.handle} name="handle" value={c.handle} required />
        <Field
          label={t.code}
          name="product_code"
          value={c.product_code}
          required
        />
        <label>
          {t.category}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t.all}</option>
            {tree.map((v: any) => (
              <option value={v.id} key={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.subcategory}
          <select
            name="subcategory_id"
            defaultValue={c.subcategory_id ?? ""}
            required
          >
            <option value="">—</option>
            {children.map((v: any) => (
              <option value={v.id} key={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <Field
          label={t.karat}
          name="karat"
          value={c.karat ?? 18}
          type="number"
          required
        />
        <Field
          label={t.material}
          name="material"
          value={c.material ?? "gold"}
          required
        />
        <label>
          {t.type}
          <select name="type_id" defaultValue={c.type_id ?? ""}>
            <option value="">—</option>
            {defs.data.types.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="didar-fields">
        <label>
          {t.description}
          <Textarea name="description" defaultValue={c.description ?? ""} />
        </label>
        <label>
          {t.technical}
          <Textarea
            name="technical_description"
            defaultValue={c.technical_description ?? ""}
          />
        </label>
        <label>
          {t.images}
          <Textarea
            name="images"
            defaultValue={(c.images ?? []).join("\n")}
            dir="ltr"
          />
        </label>
      </div>
      {defs.data.attributes.map((a: any) => (
        <fieldset key={a.id}>
          <legend>{a.name}</legend>
          {a.values.map((v: any) => (
            <label
              key={v.id}
              style={{ display: "inline-flex", gap: 8, marginInlineEnd: 16 }}
            >
              <input
                type="checkbox"
                name="attribute_value_ids"
                value={v.id}
                defaultChecked={(c.attribute_value_ids ?? []).includes(v.id)}
                style={{ width: "auto" }}
              />
              {v.name}
            </label>
          ))}
        </fieldset>
      ))}
      {!record && <Terms lang={lang} />}
      <Status error={cmd.error} lang={lang} />
      <Button type="submit" disabled={cmd.pending}>
        {cmd.pending ? t.pending : t.save}
      </Button>
      {cmd.success && (
        <p role="status" className="didar-success">
          {t.saved}
        </p>
      )}
    </form>
  );
}
function PublishedProductPicker({
  api,
  base,
  lang,
}: {
  api: Api;
  base: string;
  lang: Language;
}) {
  const t = messages[lang],
    [search, setSearch] = useState("");
  const catalog = useData(
    api,
    `${base}/catalog/products?q=${encodeURIComponent(search)}&limit=100`,
  );
  return (
    <>
      <label>
        {t.search}
        <Input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <Status error={catalog.error} lang={lang} />
      {catalog.loading ? (
        <p role="status">{t.loading}</p>
      ) : (
        catalog.data && (
          <label>
            {t.selectPublished}
            <select name="product_id" required defaultValue="">
              <option value="">{t.selectPublished}</option>
              {catalog.data.products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.product_code} — {p.name}
                </option>
              ))}
            </select>
          </label>
        )
      )}
    </>
  );
}
function OfferForm({
  api,
  base,
  lang,
  offer,
  product_id,
  submissionVersion,
  onSaved,
}: {
  api: Api;
  base: string;
  lang: Language;
  offer?: any;
  product_id?: string;
  submissionVersion?: number;
  onSaved: () => void;
}) {
  const t = messages[lang],
    cmd = useCommand(api),
    [dirty, setDirty] = useState(false),
    [lookupError, setLookupError] = useState<ApiError | null>(null);
  useDirty(dirty, lang);
  return (
    <form
      className="didar-panel"
      onChange={() => setDirty(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        setLookupError(null);
        const f = new FormData(e.currentTarget);
        let expected = offer?.version ?? submissionVersion ?? 1;
        const selected = product_id ?? String(f.get("product_id") ?? "");
        if (!offer && submissionVersion == null) {
          try {
            const own = await api(`${base}/products/${selected}`);
            expected = own.product.submission?.version ?? 1;
          } catch (error) {
            if ((error as ApiError).status !== 404) {
              setLookupError(error as ApiError);
              return;
            }
          }
        }
        const payload = {
          terms: formTerms(f),
          expected_version: expected,
          ...(!offer ? { product_id: selected } : {}),
        };
        const data = await cmd.run(
          offer ? `${base}/offers/${offer.offer_id}` : `${base}/offers`,
          payload,
          offer ? "PATCH" : "POST",
        );
        if (data) {
          setDirty(false);
          onSaved();
        }
      }}
    >
      <h2>{offer ? t.editOffer : t.newOffer}</h2>
      {!product_id && !offer && (
        <PublishedProductPicker api={api} base={base} lang={lang} />
      )}
      <Terms lang={lang} terms={offer?.terms ?? offer ?? {}} />
      <Status error={lookupError ?? cmd.error} lang={lang} />
      <Button type="submit" disabled={cmd.pending}>
        {cmd.pending ? t.pending : t.save}
      </Button>
    </form>
  );
}
function OfferTable({ offers, lang }: { offers: any[]; lang: Language }) {
  const t = messages[lang];
  return (
    <div className="didar-table">
      <Table>
        <Table.Header>
          <Table.Row>
            {[
              t.supplier,
              t.code,
              t.weight,
              t.making_fee,
              t.availability,
              t.version,
            ].map((h) => (
              <Table.HeaderCell key={h}>{h}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {offers.map((o: any) => {
            const r = o.terms ?? o;
            return (
              <Table.Row key={o.offer_id ?? o.id}>
                <Table.Cell>
                  <bdi>{o.seller_id ?? o.owner_organization_id}</bdi>
                </Table.Cell>
                <Table.Cell>
                  <bdi>{r.supplier_product_code ?? o.offer_id}</bdi>
                </Table.Cell>
                <Table.Cell>
                  {message(lang, r.weight_type)}{" "}
                  <bdi>
                    {r.exact_weight ?? `${r.weight_min} – ${r.weight_max}`}
                  </bdi>{" "}
                  g
                </Table.Cell>
                <Table.Cell>
                  {message(lang, r.making_fee_type)}{" "}
                  <bdi>
                    {r.making_fee_value ??
                      `${r.making_fee_min} – ${r.making_fee_max}`}
                  </bdi>{" "}
                  %
                </Table.Cell>
                <Table.Cell>{message(lang, r.availability_type)}</Table.Cell>
                <Table.Cell>{r.revision}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}
function DateText({ value, lang }: { value: any; lang: Language }) {
  return value ? (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(lang, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Tehran",
      }).format(new Date(value))}
    </time>
  ) : (
    <>—</>
  );
}
function ReviewDetail({
  api,
  lang,
  base,
  reviewId,
  permissions,
}: {
  api: Api;
  lang: Language;
  base: string;
  reviewId: string;
  permissions: string[];
}) {
  const data = useData(api, `${base}/product-reviews/${reviewId}`),
    cmd = useCommand(api),
    t = messages[lang];
  if (data.loading) return <p role="status">{t.loading}</p>;
  if (data.error)
    return (
      <>
        <Status error={data.error} lang={lang} />
        <Button onClick={data.reload}>{t.retry}</Button>
      </>
    );
  const { review, candidate, published_candidate, profile, offers, history } =
    data.data;
  return (
    <>
      <h1>{candidate.title}</h1>
      <p>
        {message(lang, review.state)} — {t.version}: {review.version}
      </p>
      <p>
        {t.supplier}: {review.supplier_name}
      </p>
      <p>
        <bdi>{candidate.product_code}</bdi>
      </p>
      <p>{candidate.description}</p>
      <p>{candidate.technical_description}</p>
      <div className="didar-grid">
        {candidate.images.map((url: string) => (
          <img
            key={url}
            src={url}
            alt={candidate.title}
            className="didar-card-image"
          />
        ))}
      </div>
      <p>
        {t.publishedOnly}: {message(lang, profile.publication_state)}
      </p>
      {published_candidate && (
        <div className="didar-table">
          <Table>
            <Table.Header>
              <Table.Row>
                {[t.name, t.publishedOnly, t.reviewDetail].map((label) => (
                  <Table.HeaderCell key={label}>{label}</Table.HeaderCell>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(
                [
                  ["title", "title"],
                  ["product_code", "code"],
                  ["description", "description"],
                  ["technical_description", "technical"],
                  ["material", "material"],
                  ["karat", "karat"],
                  ["subcategory_id", "subcategory"],
                  ["public_weight_min", "weightMin"],
                  ["public_weight_max", "weightMax"],
                  ["public_fee_min", "feeMin"],
                  ["public_fee_max", "feeMax"],
                ] as const
              ).map(([field, label]) => (
                <Table.Row key={field}>
                  <Table.Cell>{t[label]}</Table.Cell>
                  <Table.Cell>
                    <bdi>{published_candidate[field] ?? "—"}</bdi>
                  </Table.Cell>
                  <Table.Cell>
                    <bdi>{candidate[field] ?? "—"}</bdi>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
      <OfferTable offers={offers} lang={lang} />
      <form
        key={review.version}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
              "value",
            );
          if (!action) return;
          const payload: any = {
            expected_version: review.version,
            reason: f.get("reason") || null,
          };
          if (action === "approve")
            payload.public_terms = Object.fromEntries(
              [
                "public_weight_min",
                "public_weight_max",
                "public_fee_min",
                "public_fee_max",
              ].map((k) => [k, f.get(k) || null]),
            );
          if (
            await cmd.run(
              `${base}/product-reviews/${reviewId}/${action.replaceAll("_", "-")}`,
              payload,
            )
          )
            data.reload();
        }}
      >
        <h2>{t.publicTerms}</h2>
        <p>{t.publicTermsHelp}</p>
        <div className="didar-fields">
          {(
            [
              ["public_weight_min", "weightMin"],
              ["public_weight_max", "weightMax"],
              ["public_fee_min", "feeMin"],
              ["public_fee_max", "feeMax"],
            ] as const
          ).map(([k, l]) => (
            <Field
              key={k}
              label={t[l]}
              name={k}
              value={candidate[k]}
              readOnly={review.submission_kind === "OFFER"}
              type="number"
            />
          ))}
        </div>
        <label>
          {t.reason}
          <Textarea name="reason" defaultValue="" />
        </label>
        <Status error={cmd.error} lang={lang} />
        <div className="didar-actions">
          {["request_changes", "reject", "approve", "publish"].map(
            (action) =>
              permissions.includes(`product.${action}`) && (
                <Button
                  key={action}
                  value={action}
                  name="action"
                  type="submit"
                  variant={action === "publish" ? "primary" : "secondary"}
                  disabled={
                    cmd.pending ||
                    (action === "publish"
                      ? review.state !== "APPROVED"
                      : review.state !== "SUBMITTED")
                  }
                >
                  {cmd.pending ? t.pending : message(lang, action)}
                </Button>
              ),
          )}
        </div>
      </form>
      <h2>{t.history}</h2>
      <div className="didar-table">
        <Table>
          <Table.Header>
            <Table.Row>
              {[t.state, t.actor, t.onBehalf, t.reason, t.submitted].map(
                (h) => (
                  <Table.HeaderCell key={h}>{h}</Table.HeaderCell>
                ),
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {history.map((h: any) => (
              <Table.Row key={h.id}>
                <Table.Cell>
                  {message(lang, h.from_state ?? "")} →{" "}
                  {message(lang, h.to_state ?? h.event_code)}
                </Table.Cell>
                <Table.Cell>
                  <bdi>{h.actor_id}</bdi>
                  <br />
                  <bdi>{h.actor_organization_id}</bdi>
                </Table.Cell>
                <Table.Cell>
                  <bdi>{h.owner_organization_id}</bdi>
                </Table.Cell>
                <Table.Cell>{h.reason}</Table.Cell>
                <Table.Cell>
                  <DateText value={h.occurred_at} lang={lang} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </>
  );
}
export function Workspace({
  backend,
  audience,
  screen,
}: {
  backend: string;
  audience: "admin" | "vendor";
  screen:
    | "products"
    | "product"
    | "new"
    | "reviews"
    | "review"
    | "offers"
    | "reports";
}) {
  const params = useParams(),
    lang = language(params.lang ?? "fa"),
    t = messages[lang],
    navigate = useNavigate(),
    location = useLocation(),
    base = `/${audience}/b2b`,
    prefix = `/${lang}/${audience === "admin" ? "ops" : "supplier"}`,
    [api] = useState(() => mkApi(backend)),
    ctx = useData(api, `${base}/context`),
    cmd = useCommand(api),
    [loginError, setLoginError] = useState<ApiError | null>(null),
    [loginPending, setLoginPending] = useState(false);
  const path =
    screen === "review"
      ? `${base}/product-reviews/${params.id}`
      : screen === "product"
        ? `${base}/products/${params.id}`
        : screen === "reviews"
          ? `${base}/product-reviews`
          : screen === "offers"
            ? `${base}/offers`
            : screen === "reports"
              ? `${base}/product-reports`
              : `${base}/products`;
  const data = useData(api, `${path}${location.search}`);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = direction(lang);
  }, [lang]);
  const can = (permission: string) =>
    ctx.data?.permissions.includes(permission);
  if (ctx.loading)
    return (
      <main lang={lang} dir={direction(lang)} className="didar-shell">
        <p role="status">{t.loading}</p>
      </main>
    );
  if (ctx.error)
    return (
      <main lang={lang} dir={direction(lang)} className="didar-shell">
        <h1>{t.brand}</h1>
        <Status error={ctx.error} lang={lang} />
        <Button onClick={ctx.reload}>{t.retry}</Button>
        {ctx.error.status === 401 && (
          <form
            className="didar-panel"
            onSubmit={async (e) => {
              e.preventDefault();
              if (loginPending) return;
              setLoginPending(true);
              setLoginError(null);
              const f = new FormData(e.currentTarget);
              try {
                const auth = await api(
                  `/auth/${audience === "admin" ? "user" : "member"}/emailpass`,
                  {
                    method: "POST",
                    body: JSON.stringify({
                      email: f.get("email"),
                      password: f.get("password"),
                    }),
                  },
                );
                await api("/auth/session", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${auth.token}` },
                });
                if (audience === "vendor") {
                  const sellers = await api("/vendor/sellers");
                  if (!sellers.sellers?.length)
                    throw new ApiError(403, "ORGANIZATION_SCOPE");
                  await api("/vendor/sellers/select", {
                    method: "POST",
                    body: JSON.stringify({ seller_id: sellers.sellers[0].id }),
                  });
                }
                ctx.reload();
                data.reload();
              } catch (error) {
                setLoginError(error as ApiError);
              } finally {
                setLoginPending(false);
              }
            }}
          >
            <div className="didar-fields">
              <Field label={t.email} name="email" type="email" required />
              <Field
                label={t.password}
                name="password"
                type="password"
                required
              />
            </div>
            <Status error={loginError} lang={lang} />
            <Button type="submit" disabled={loginPending}>
              {t.login}
            </Button>
          </form>
        )}
      </main>
    );
  const qs = new URLSearchParams(location.search),
    offset = Number(qs.get("offset") ?? 0),
    page = (o: number) => {
      const q = new URLSearchParams(location.search);
      q.set("offset", String(o));
      navigate(`${location.pathname}?${q}`);
    };
  return (
    <main lang={lang} dir={direction(lang)} className="didar-shell">
      <header className="didar-header">
        <Link to={`${prefix}/products`}>{t.brand}</Link>
        <nav className="didar-nav">
          <Link to={`${prefix}/products`}>{t.products}</Link>
          {audience === "admin" && can("product.review") && (
            <Link to={`${prefix}/product-reviews`}>{t.reviews}</Link>
          )}
          <Link to={`${prefix}/supplier-offers`}>{t.offers}</Link>
          {audience === "admin" && can("product.report") && (
            <Link to={`${prefix}/product-reports`}>{t.reports}</Link>
          )}
          <Button
            variant="secondary"
            onClick={async () => {
              await api("/auth/session", { method: "DELETE" });
              ctx.reload();
            }}
          >
            {t.logout}
          </Button>
        </nav>
        <label>
          {t.language}
          <select
            value={lang}
            onChange={(e) =>
              navigate(
                `${location.pathname.replace(/^\/(fa|en|ar|fr)/, `/${e.target.value}`)}${location.search}`,
              )
            }
          >
            {languages.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      </header>
      {screen === "new" ? (
        <>
          <h1>{t.newProduct}</h1>
          <ProductForm
            api={api}
            lang={lang}
            base={base}
            onSaved={(d) => navigate(`${prefix}/products/${d.product_id}`)}
          />
        </>
      ) : screen === "review" ? (
        <ReviewDetail
          api={api}
          lang={lang}
          base={base}
          reviewId={params.id!}
          permissions={ctx.data.permissions}
        />
      ) : (
        <>
          <h1>
            {screen === "reviews"
              ? t.reviews
              : screen === "offers"
                ? t.offers
                : screen === "reports"
                  ? t.reports
                  : t.products}
          </h1>
          {audience === "vendor" &&
            screen === "products" &&
            can("product.create_own") && (
              <Link to={`${prefix}/products/new`}>{t.newProduct}</Link>
            )}
          {!["product", "new"].includes(screen) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  q = new URLSearchParams();
                for (const [k, v] of f.entries()) if (v) q.set(k, String(v));
                navigate(`${location.pathname}?${q}`);
              }}
            >
              <div className="didar-fields">
                <Field label={t.search} name="q" value={qs.get("q")} />
                {screen === "reviews" && (
                  <label>
                    {t.state}
                    <select name="state" defaultValue={qs.get("state") ?? ""}>
                      <option value="">{t.all}</option>
                      {[
                        "DRAFT",
                        "SUBMITTED",
                        "CHANGES_REQUESTED",
                        "APPROVED",
                        "REJECTED",
                        "PUBLISHED",
                        "INACTIVE",
                      ].map((v) => (
                        <option key={v} value={v}>
                          {message(lang, v)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {audience === "admin" && (
                  <Field
                    label={t.supplier}
                    name="supplier_id"
                    value={qs.get("supplier_id")}
                  />
                )}
                <Field
                  label={t.from}
                  name={
                    screen === "reviews" ? "submitted_from" : "created_from"
                  }
                  type="date"
                  value={qs.get(
                    screen === "reviews" ? "submitted_from" : "created_from",
                  )}
                />
                <Field
                  label={t.to}
                  name={screen === "reviews" ? "submitted_to" : "created_to"}
                  type="date"
                  value={qs.get(
                    screen === "reviews" ? "submitted_to" : "created_to",
                  )}
                />
              </div>
              <Button type="submit">{t.apply}</Button>
            </form>
          )}
          {data.loading ? (
            <p role="status">{t.loading}</p>
          ) : data.error ? (
            <>
              <Status error={data.error} lang={lang} />
              <Button onClick={data.reload}>{t.retry}</Button>
            </>
          ) : (
            <>
              {screen === "product" && (
                <>
                  {audience === "vendor" &&
                  can("product.update_own") &&
                  data.data.product.profile.owner_organization_id ===
                    ctx.data.actor.organization_id &&
                  [
                    "DRAFT",
                    "CHANGES_REQUESTED",
                    "PUBLISHED",
                    "REJECTED",
                    "INACTIVE",
                  ].includes(data.data.product.submission?.state) ? (
                    <ProductForm
                      key={data.data.product.submission.version}
                      api={api}
                      lang={lang}
                      record={data.data.product}
                      base={base}
                      onSaved={() => data.reload()}
                    />
                  ) : (
                    <Container>
                      <h2>
                        {data.data.product.candidate?.title ??
                          data.data.product.profile.product_code}
                      </h2>
                      <p>{data.data.product.candidate?.description}</p>
                    </Container>
                  )}
                  <p>
                    {message(
                      lang,
                      data.data.product.submission?.state ??
                        data.data.product.profile.publication_state,
                    )}{" "}
                    — {t.version}: {data.data.product.submission?.version}
                  </p>
                  <p>{data.data.product.submission?.reason}</p>
                  <p>
                    {t.publishedOnly}:{" "}
                    {message(lang, data.data.product.profile.publication_state)}
                  </p>
                  <Status error={cmd.error} lang={lang} />
                  {audience === "vendor" &&
                    can("product.submit_own") &&
                    ["DRAFT", "CHANGES_REQUESTED"].includes(
                      data.data.product.submission?.state,
                    ) && (
                      <Button
                        disabled={cmd.pending}
                        onClick={async () => {
                          if (
                            await cmd.run(
                              `${base}/products/${params.id}/submit`,
                              {
                                expected_version:
                                  data.data.product.submission.version,
                              },
                            )
                          )
                            data.reload();
                        }}
                      >
                        {t.submit}
                      </Button>
                    )}
                  {audience === "admin" &&
                    can("product.unpublish") &&
                    data.data.product.profile.publication_state ===
                      "PUBLISHED" && (
                      <Button
                        disabled={cmd.pending}
                        onClick={async () => {
                          if (
                            await cmd.run(
                              `${base}/products/${params.id}/unpublish`,
                              {
                                expected_version:
                                  data.data.product.profile.version,
                              },
                            )
                          )
                            data.reload();
                        }}
                      >
                        {t.unpublish}
                      </Button>
                    )}
                  <OfferTable offers={data.data.product.offers} lang={lang} />
                  {audience === "vendor" &&
                    [
                      "DRAFT",
                      "CHANGES_REQUESTED",
                      "PUBLISHED",
                      "REJECTED",
                      "INACTIVE",
                    ].includes(data.data.product.submission?.state) && (
                      <>
                        {data.data.product.offers.map((o: any) => (
                          <OfferForm
                            key={o.offer_id + o.version}
                            api={api}
                            lang={lang}
                            base={base}
                            offer={o}
                            onSaved={data.reload}
                          />
                        ))}
                        <OfferForm
                          api={api}
                          lang={lang}
                          base={base}
                          product_id={params.id}
                          submissionVersion={
                            data.data.product.submission?.version
                          }
                          onSaved={data.reload}
                        />
                      </>
                    )}
                </>
              )}
              {screen === "products" && (
                <div className="didar-table">
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        {[
                          t.code,
                          t.title,
                          t.state,
                          t.publishedOnly,
                          t.detail,
                        ].map((h) => (
                          <Table.HeaderCell key={h}>{h}</Table.HeaderCell>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {data.data.products.map((p: any) => (
                        <Table.Row key={p.profile.product_id}>
                          <Table.Cell>
                            <bdi>{p.profile.product_code}</bdi>
                          </Table.Cell>
                          <Table.Cell>{p.candidate?.title}</Table.Cell>
                          <Table.Cell>
                            {message(
                              lang,
                              p.submission?.state ??
                                p.profile.publication_state,
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {message(lang, p.profile.publication_state)}
                          </Table.Cell>
                          <Table.Cell>
                            <Link
                              to={`${prefix}/products/${p.profile.product_id}`}
                            >
                              {t.detail}
                            </Link>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                  {!data.data.products.length && <p>{t.empty}</p>}
                </div>
              )}
              {screen === "reviews" && (
                <div className="didar-table">
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        {[
                          t.code,
                          t.title,
                          t.supplier,
                          t.state,
                          t.submitted,
                          t.detail,
                        ].map((h) => (
                          <Table.HeaderCell key={h}>{h}</Table.HeaderCell>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {data.data.reviews.map((r: any) => (
                        <Table.Row key={r.id}>
                          <Table.Cell>
                            <bdi>{r.product_code}</bdi>
                          </Table.Cell>
                          <Table.Cell>{r.title}</Table.Cell>
                          <Table.Cell>{r.supplier_name}</Table.Cell>
                          <Table.Cell>{message(lang, r.state)}</Table.Cell>
                          <Table.Cell>
                            <DateText value={r.submitted_at} lang={lang} />
                          </Table.Cell>
                          <Table.Cell>
                            <Link to={`${prefix}/product-reviews/${r.id}`}>
                              {t.detail}
                            </Link>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                  {!data.data.reviews.length && <p>{t.empty}</p>}
                </div>
              )}
              {screen === "offers" && (
                <>
                  <OfferTable offers={data.data.offers} lang={lang} />
                  {!data.data.offers.length && <p>{t.empty}</p>}
                  {audience === "vendor" &&
                    can("supplier_offer.create_own") && (
                      <OfferForm
                        api={api}
                        lang={lang}
                        base={base}
                        onSaved={data.reload}
                      />
                    )}
                </>
              )}
              {screen === "reports" && (
                <>
                  <p>
                    {t.productCount}: {data.data.totals.product_count} —{" "}
                    {t.offerCount}: {data.data.totals.offer_count}
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `${backend}${base}/product-reports?${location.search.slice(1)}&format=csv`,
                          { credentials: "include" },
                        );
                        if (!response.ok)
                          throw new ApiError(response.status, "EXPORT_FAILED");
                        const url = URL.createObjectURL(await response.blob()),
                          a = document.createElement("a");
                        a.href = url;
                        a.download = "didar-products.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        setLoginError(e as ApiError);
                      }
                    }}
                  >
                    {t.exportCsv}
                  </Button>
                  <Status error={loginError} lang={lang} />
                  <div className="didar-table">
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          {[t.code, t.supplier, t.offers, t.state].map((h) => (
                            <Table.HeaderCell key={h}>{h}</Table.HeaderCell>
                          ))}
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {data.data.rows.map((r: any) => (
                          <Table.Row key={`${r.product_id}-${r.offer_id}`}>
                            <Table.Cell>
                              <Link to={`${prefix}/products/${r.product_id}`}>
                                <bdi>{r.product_code}</bdi>
                              </Link>
                            </Table.Cell>
                            <Table.Cell>{r.supplier_name}</Table.Cell>
                            <Table.Cell>
                              <bdi>{r.offer_id}</bdi>
                            </Table.Cell>
                            <Table.Cell>
                              {message(lang, r.publication_state)}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                </>
              )}
              {!["product", "new"].includes(screen) && (
                <div className="didar-actions didar-pagination">
                  <Button
                    variant="secondary"
                    disabled={offset === 0}
                    onClick={() =>
                      page(Math.max(0, offset - (data.data.limit ?? 24)))
                    }
                  >
                    {t.previous}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={
                      offset + (data.data.limit ?? 24) >=
                      (data.data.count ?? data.data.totals?.offer_count ?? 0)
                    }
                    onClick={() => page(offset + (data.data.limit ?? 24))}
                  >
                    {t.next}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
