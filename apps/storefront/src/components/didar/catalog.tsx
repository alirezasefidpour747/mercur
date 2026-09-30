'use client';

import { Suspense, useEffect, useState } from 'react';

import { Button } from '@medusajs/ui';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  direction,
  language,
  languages,
  messages,
  type Language
} from '../../../../../shared/p01/messages';
import { ProductGallery } from '../organisms/ProductGallery/ProductGallery';

type CategoryNode = { id: string; name: string; handle: string; children: CategoryNode[] };
type Attribute = {
  id: string;
  name: string;
  handle: string;
  values: { id: string; name: string }[];
};
type PublicProduct = {
  id: string;
  name: string;
  handle: string;
  product_code: string;
  description: string | null;
  technical_description: string | null;
  karat: number;
  material: string;
  images: { url: string }[];
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
  attributes: { value_id: string; name: string; value: string }[];
  indicative_weight: { min: string; max: string } | null;
  indicative_making_fee: { min: string; max: string } | null;
};
type CatalogData = {
  categories: CategoryNode[];
  products: PublicProduct[];
  product?: PublicProduct;
  count: number;
  offset: number;
  limit: number;
  attributes: Attribute[];
  types: { id: string; value: string }[];
  values: { material: string }[];
};
type Result = { data: CatalogData | null; status: number; loading: boolean };
function useApi(path: string) {
  const [retry, setRetry] = useState(0),
    [result, setResult] = useState<Result>({ data: null, status: 0, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setResult({ data: null, status: 0, loading: true });
    fetch(`/api/b2b/${path}`, { cache: 'no-store', signal: controller.signal })
      .then(async r => {
        const data = await r.json();
        setResult({ data: r.ok ? data : null, status: r.status, loading: false });
      })
      .catch(e => {
        if (e.name !== 'AbortError') setResult({ data: null, status: 503, loading: false });
      });
    return () => controller.abort();
  }, [path, retry]);
  return { ...result, reload: () => setRetry(v => v + 1) };
}
function State({ result, lang }: { result: ReturnType<typeof useApi>; lang: Language }) {
  const t = messages[lang];
  if (result.loading)
    return (
      <p
        role="status"
        className="didar-message"
      >
        {t.loading}
      </p>
    );
  if (result.status < 400) return null;
  return (
    <div
      role="alert"
      className="didar-message"
    >
      <p>
        {result.status === 401
          ? t.unauthorized
          : result.status === 403
            ? t.forbidden
            : result.status === 409
              ? t.conflict
              : result.status === 422
                ? t.invalid
                : t.error}
      </p>
      {result.status === 401 ? (
        <Link href={`/${lang}/login`}>{t.login}</Link>
      ) : (
        <Button onClick={result.reload}>{t.retry}</Button>
      )}
    </div>
  );
}
export function CatalogShell({ lang: raw, children }: { lang: string; children: React.ReactNode }) {
  const lang = language(raw),
    t = messages[lang],
    path = usePathname(),
    query = useSearchParams(),
    router = useRouter();
  return (
    <div
      lang={lang}
      dir={direction(lang)}
      className="didar-shell"
    >
      <header className="didar-header">
        <Link href={`/${lang}/products`}>{t.brand}</Link>
        <nav className="didar-nav">
          <Link href={`/${lang}/categories`}>{t.categories}</Link>
          <Link href={`/${lang}/products`}>{t.products}</Link>
          <Link href={`/${lang}/login`}>{t.login}</Link>
          <Button
            variant="secondary"
            onClick={async () => {
              await fetch('/api/b2b/session', { method: 'DELETE' });
              router.push(`/${lang}/login`);
              router.refresh();
            }}
          >
            {t.logout}
          </Button>
        </nav>
        <label>
          {t.language}
          <select
            value={lang}
            onChange={e =>
              router.push(
                `${path.replace(/^\/(fa|en|ar|fr)/, `/${e.target.value}`)}${query.size ? `?${query}` : ''}`
              )
            }
          >
            {languages.map(l => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      </header>
      {children}
    </div>
  );
}
export function CatalogLogin({ lang: raw }: { lang: string }) {
  const lang = language(raw),
    t = messages[lang],
    router = useRouter(),
    [state, setState] = useState(0),
    [pending, setPending] = useState(false);
  return (
    <section>
      <h1>{t.login}</h1>
      <form
        className="didar-panel"
        onSubmit={async e => {
          e.preventDefault();
          if (pending) return;
          setPending(true);
          setState(0);
          const f = new FormData(e.currentTarget);
          try {
            const r = await fetch('/api/b2b/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: f.get('email'), password: f.get('password') })
            });
            setState(r.status);
            if (r.ok) {
              router.push(`/${lang}/products`);
              router.refresh();
            }
          } catch {
            setState(503);
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="didar-fields">
          <label>
            {t.email}
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              dir="ltr"
            />
          </label>
          <label>
            {t.password}
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
        </div>
        <Button
          disabled={pending}
          type="submit"
        >
          {pending ? t.loading : t.login}
        </Button>
        {state >= 400 && <p role="alert">{state === 401 ? t.unauthorized : t.error}</p>}
      </form>
    </section>
  );
}
export function Categories({ lang: raw }: { lang: string }) {
  const lang = language(raw),
    t = messages[lang],
    result = useApi('catalog/categories');
  return (
    <section>
      <h1>{t.categories}</h1>
      <State
        result={result}
        lang={lang}
      />
      {result.status === 200 && (
        <div className="didar-grid">
          {result.data!.categories.map((c: CategoryNode) => (
            <article
              className="didar-panel"
              key={c.id}
            >
              <h2>
                <Link href={`/${lang}/products?category_id=${c.id}`}>{c.name}</Link>
              </h2>
              {c.children.map((s: CategoryNode) => (
                <p key={s.id}>
                  <Link href={`/${lang}/products?category_id=${c.id}&subcategory_id=${s.id}`}>
                    {s.name}
                  </Link>
                </p>
              ))}
            </article>
          ))}
        </div>
      )}
      {result.status === 200 && !result.data!.categories.length && <p>{t.empty}</p>}
    </section>
  );
}
const number = (lang: Language, v: string | number) =>
  new Intl.NumberFormat(lang, { maximumFractionDigits: 6 }).format(Number(v));
export function Indicative({ product, lang }: { product: PublicProduct; lang: Language }) {
  const t = messages[lang];
  return (
    <>
      <p>{t.indicative}</p>
      {product.indicative_weight && (
        <p>
          {t.weight}:{' '}
          <bdi>
            {number(lang, product.indicative_weight.min)} –{' '}
            {number(lang, product.indicative_weight.max)}
          </bdi>{' '}
          g
        </p>
      )}
      {product.indicative_making_fee && (
        <p>
          {t.making_fee}:{' '}
          <bdi>
            {number(lang, product.indicative_making_fee.min)} –{' '}
            {number(lang, product.indicative_making_fee.max)}
          </bdi>{' '}
          %
        </p>
      )}
    </>
  );
}
export function CatalogList({
  lang: raw,
  categoryHandle
}: {
  lang: string;
  categoryHandle?: string;
}) {
  const lang = language(raw),
    t = messages[lang],
    url = useSearchParams(),
    router = useRouter(),
    path = usePathname(),
    tree = useApi('catalog/categories'),
    query = new URLSearchParams(url.toString());
  let unknown = false;
  if (categoryHandle && tree.status === 200) {
    const c = tree.data!.categories.find(
      (r: CategoryNode) =>
        r.handle === categoryHandle ||
        r.children.some((s: CategoryNode) => s.handle === categoryHandle)
    );
    if (c) {
      query.set('category_id', c.id);
      const s = c.children.find((s: CategoryNode) => s.handle === categoryHandle);
      if (s) query.set('subcategory_id', s.id);
    } else unknown = true;
  }
  const ready = !categoryHandle || tree.status === 200;
  const product = useApi(`catalog/products?${query}`),
    facet = useApi(`catalog/facets?${query}`);
  const changePage = (offset: number) => {
    const q = new URLSearchParams(url.toString());
    q.set('offset', String(offset));
    router.push(`${path}?${q}`);
  };
  if (unknown) return <p role="alert">{t.empty}</p>;
  const root = tree.data?.categories.find((c: CategoryNode) => c.id === query.get('category_id')),
    subcategories = root
      ? root.children
      : (tree.data?.categories.flatMap((c: CategoryNode) => c.children) ?? []);
  return (
    <section>
      <h1>{t.products}</h1>
      <State
        result={tree}
        lang={lang}
      />
      <form
        key={query.toString()}
        onSubmit={e => {
          e.preventDefault();
          const form = new FormData(e.currentTarget),
            q = new URLSearchParams();
          for (const [k, v] of form.entries()) if (String(v)) q.set(k, String(v));
          q.set('offset', '0');
          router.push(`/${lang}/products?${q}`);
        }}
      >
        <div className="didar-fields">
          <label>
            {t.search}
            <input
              name="q"
              defaultValue={query.get('q') ?? ''}
            />
          </label>
          <label>
            {t.category}
            <select
              name="category_id"
              defaultValue={query.get('category_id') ?? ''}
              onChange={e => {
                const q = new URLSearchParams(url.toString());
                if (e.target.value) q.set('category_id', e.target.value);
                else q.delete('category_id');
                q.delete('subcategory_id');
                q.delete('offset');
                router.push(`/${lang}/products?${q}`);
              }}
            >
              <option value="">{t.all}</option>
              {tree.data?.categories.map((c: CategoryNode) => (
                <option
                  value={c.id}
                  key={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.subcategory}
            <select
              name="subcategory_id"
              defaultValue={query.get('subcategory_id') ?? ''}
            >
              <option value="">{t.all}</option>
              {subcategories.map((c: CategoryNode) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {(
            [
              ['weight_min', 'weightMin'],
              ['weight_max', 'weightMax'],
              ['fee_min', 'feeMin'],
              ['fee_max', 'feeMax'],
              ['karat', 'karat']
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {t[label]}
              <input
                name={key}
                inputMode="decimal"
                type="number"
                min="0"
                step={key === 'karat' ? '1' : '0.000001'}
                defaultValue={query.get(key) ?? ''}
              />
            </label>
          ))}
          <label>
            {t.material}
            <select
              name="material"
              defaultValue={query.get('material') ?? ''}
            >
              <option value="">{t.all}</option>
              {[
                ...new Set<string>(
                  (facet.data?.values ?? []).map((v: { material: string }) => v.material)
                )
              ].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            {t.type}
            <select
              name="type_id"
              defaultValue={query.get('type_id') ?? ''}
            >
              <option value="">{t.all}</option>
              {facet.data?.types.map((v: { id: string; value?: string; name?: string }) => (
                <option
                  value={v.id}
                  key={v.id}
                >
                  {v.value}
                </option>
              ))}
            </select>
          </label>
          {facet.data?.attributes.map((a: Attribute) => (
            <label key={a.id}>
              {a.name}
              <select
                name={`attributes[${a.handle}]`}
                defaultValue={query.get(`attributes[${a.handle}]`) ?? ''}
              >
                <option value="">{t.all}</option>
                {a.values.map((v: { id: string; value?: string; name?: string }) => (
                  <option
                    key={v.id}
                    value={v.id}
                  >
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            {t.sort}
            <select
              name="sort"
              defaultValue={query.get('sort') ?? 'newest'}
            >
              {(['newest', 'name', 'weight', 'making_fee'] as const).map(v => (
                <option
                  key={v}
                  value={v}
                >
                  {t[v]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="didar-actions">
          <Button type="submit">{t.apply}</Button>
          <Link href={`/${lang}/products`}>{t.reset}</Link>
        </div>
      </form>
      <State
        result={facet}
        lang={lang}
      />
      <State
        result={product}
        lang={lang}
      />
      {ready && product.status === 200 && (
        <>
          <p role="status">
            {t.productCount}: {number(lang, product.data!.count)}
          </p>
          {!product.data!.products.length ? (
            <p>{t.empty}</p>
          ) : (
            <div className="didar-grid">
              {product.data!.products.map((p: PublicProduct) => (
                <article
                  className="didar-panel"
                  key={p.id}
                  data-testid="b2b-product-card"
                >
                  <Link href={`/${lang}/products/${encodeURIComponent(p.handle)}`}>
                    {p.images[0]?.url && (
                      <Image
                        src={p.images[0].url}
                        width={320}
                        height={240}
                        alt={p.name}
                        className="didar-card-image"
                      />
                    )}
                    <h2>{p.name}</h2>
                  </Link>
                  <bdi>{p.product_code}</bdi>
                  <Indicative
                    product={p}
                    lang={lang}
                  />
                </article>
              ))}
            </div>
          )}
          <div className="didar-actions didar-pagination">
            <Button
              variant="secondary"
              disabled={product.data!.offset === 0}
              onClick={() => changePage(Math.max(0, product.data!.offset - product.data!.limit))}
            >
              {t.previous}
            </Button>
            <Button
              variant="secondary"
              disabled={product.data!.offset + product.data!.limit >= product.data!.count}
              onClick={() => changePage(product.data!.offset + product.data!.limit)}
            >
              {t.next}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
export function CatalogDetail({ lang: raw, handle }: { lang: string; handle: string }) {
  const lang = language(raw),
    t = messages[lang],
    lookup = useApi(`catalog/products?handle=${encodeURIComponent(handle)}&limit=1`),
    p = lookup.data?.products?.[0];
  const result = useApi(
      p
        ? `catalog/products/${p.id}`
        : `catalog/products?handle=${encodeURIComponent(handle)}&limit=1`
    ),
    product = result.data?.product ?? result.data?.products?.[0];
  return (
    <section>
      <State
        result={lookup}
        lang={lang}
      />
      {lookup.status === 200 && (
        <State
          result={result}
          lang={lang}
        />
      )}
      <Link href={`/${lang}/products`}>{t.back}</Link>
      {result.status === 200 && product ? (
        <>
          <nav>
            <Link href={`/${lang}/products?category_id=${product.category.id}`}>
              {product.category.name}
            </Link>{' '}
            /{' '}
            <Link href={`/${lang}/products?subcategory_id=${product.subcategory.id}`}>
              {product.subcategory.name}
            </Link>
          </nav>
          <h1>{product.name}</h1>
          <div className="didar-detail">
            <ProductGallery
              alt={product.name}
              images={product.images.map((i: { url: string }, index: number) => ({
                id: `public-image-${index}`,
                url: i.url
              }))}
            />
            <div>
              <p>
                <bdi>{product.product_code}</bdi>
              </p>
              <p>
                {t.karat}: {number(lang, product.karat)} — {t.material}: {product.material}
              </p>
              <p>{product.description}</p>
              <p>{product.technical_description}</p>
              {product.attributes.map((a: { value_id: string; name: string; value: string }) => (
                <p key={a.value_id}>
                  {a.name}: {a.value}
                </p>
              ))}
              <Indicative
                product={product}
                lang={lang}
              />
              <label>
                {t.quantity}
                <input
                  type="number"
                  min="1"
                  step="1"
                  defaultValue="1"
                />
              </label>
              <Button disabled>{t.requestUnavailable}</Button>
            </div>
          </div>
        </>
      ) : result.status === 200 && !product ? (
        <p>{t.empty}</p>
      ) : null}
    </section>
  );
}
export function CatalogBoundary({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p role="status">…</p>}>{children}</Suspense>;
}
