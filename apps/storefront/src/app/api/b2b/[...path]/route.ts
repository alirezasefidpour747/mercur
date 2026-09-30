import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params,
    route = path.join('/');
  if (
    !/^(context|catalog\/(categories|definitions|facets|products(?:\/prod_[\w-]+)?))$/.test(route)
  )
    return NextResponse.json({ code: 'FORBIDDEN' }, { status: 403 });
  const token = (await cookies()).get('_medusa_jwt')?.value;
  if (!token) return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY)
    headers['x-publishable-api-key'] = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  try {
    const upstream = await fetch(
      `${process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'}/store/b2b/${route}${req.nextUrl.search}`,
      { headers, cache: 'no-store', signal: AbortSignal.timeout(10000) }
    );
    const body = await upstream.json();
    return NextResponse.json(body, {
      status: upstream.status,
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch {
    return NextResponse.json(
      { code: 'CATALOG_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
