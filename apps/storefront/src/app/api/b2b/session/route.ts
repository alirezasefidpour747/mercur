import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (
      typeof b.email !== 'string' ||
      typeof b.password !== 'string' ||
      Object.keys(b).some(k => !['email', 'password'].includes(k))
    )
      return NextResponse.json({ code: 'INVALID_PAYLOAD' }, { status: 422 });
    const remote = await fetch(
      `${process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'}/auth/customer/emailpass`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      }
    );
    const body = await remote.json();
    if (!remote.ok || typeof body.token !== 'string')
      return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    (await cookies()).set('_medusa_jwt', body.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 86400
    });
    return NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ code: 'CATALOG_UNAVAILABLE' }, { status: 503 });
  }
}
export async function DELETE() {
  (await cookies()).delete('_medusa_jwt');
  return NextResponse.json({ authenticated: false });
}
