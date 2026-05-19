import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get('token') as string | null;
    const status = formData.get('status') as string | null;

    if (token) {
      await fetch(`${INTERNAL_API}/donations/iyzico/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, status }),
      });
    }

    const success = status === 'success' || status === 'SUCCESS';
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(new URL(`/bagis/sonuc?durum=${success ? 'basarili' : 'hata'}`, origin));
  } catch {
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(new URL('/bagis/sonuc?durum=hata', origin));
  }
}
