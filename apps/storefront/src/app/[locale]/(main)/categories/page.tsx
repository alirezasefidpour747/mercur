import { CatalogBoundary, Categories } from '@/components/didar/catalog';

export default async function Page({
  params
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const p = await params;
  return (
    <CatalogBoundary>
      <Categories lang={p.locale} />
    </CatalogBoundary>
  );
}
