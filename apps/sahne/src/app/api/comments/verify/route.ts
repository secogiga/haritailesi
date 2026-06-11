import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/projeler?verify=invalid', req.url));
  }
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/comments/verify?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      return NextResponse.redirect(new URL('/projeler?verify=invalid', req.url));
    }
    return NextResponse.redirect(new URL('/projeler?verify=success', req.url));
  } catch {
    return NextResponse.redirect(new URL('/projeler?verify=error', req.url));
  }
}
