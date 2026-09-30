import { CatalogBoundary, CatalogDetail } from '@/components/didar/catalog';

export default async function Page({
  params
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const p = await params;
  return (
    <CatalogBoundary>
      <CatalogDetail
        lang={p.locale}
        handle={p.handle}
      />
    </CatalogBoundary>
  );
}
