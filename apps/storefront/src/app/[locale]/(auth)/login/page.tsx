import { CatalogBoundary, CatalogLogin } from '@/components/didar/catalog';

export default async function Page({
  params
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const p = await params;
  return (
    <CatalogBoundary>
      <CatalogLogin lang={p.locale} />
    </CatalogBoundary>
  );
}
