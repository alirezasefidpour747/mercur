import { CatalogBoundary, CatalogShell } from '@/components/didar/catalog';

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <CatalogBoundary>
      <CatalogShell lang={locale}>{children}</CatalogShell>
    </CatalogBoundary>
  );
}
