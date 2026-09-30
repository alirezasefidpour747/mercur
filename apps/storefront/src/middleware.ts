import { NextRequest, NextResponse } from 'next/server';

const langs = ['fa', 'en', 'ar', 'fr'];
export function middleware(req: NextRequest) {
  const parts = req.nextUrl.pathname.split('/').filter(Boolean);
  if (!parts.length) return NextResponse.redirect(new URL('/fa/products', req.url));
  if (!langs.includes(parts[0]))
    return NextResponse.redirect(
      new URL(`/fa${req.nextUrl.pathname}${req.nextUrl.search}`, req.url)
    );
  if (!['products', 'categories', 'login'].includes(parts[1] ?? 'products'))
    return new NextResponse('This workspace is not available in P01', { status: 403 });
  const headers = new Headers(req.headers);
  headers.set('x-didar-language', parts[0]);
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: ['/((?!api|_next|images|didar-fonts|favicon.ico|.*\\.[^/]+$).*)']
};
