import { NextResponse } from 'next/server';

// ECB XML API — ücretsiz, key gerektirmez
const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

let cache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 saat

async function fetchRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.rates;

  try {
    const res = await fetch(ECB_URL, { next: { revalidate: 14400 } });
    const xml = await res.text();

    const rates: Record<string, number> = { EUR: 1 };
    const matches = xml.matchAll(/currency='([A-Z]+)'\s+rate='([0-9.]+)'/g);
    for (const [, currency, rate] of matches) {
      if (currency && rate) rates[currency] = parseFloat(rate);
    }

    // TRY/EUR kurunu al, USD/EUR ile TRY/USD hesapla
    cache = { rates, fetchedAt: Date.now() };
    return rates;
  } catch {
    // ECB'ye ulaşılamazsa sabit kur
    return { EUR: 1, USD: 1.08, TRY: 38.5 };
  }
}

export async function GET() {
  const rates = await fetchRates();

  // TRY bazlı kurlar (1 TRY = X yabancı para)
  const tryRate = rates['TRY'] ?? 38.5;
  const usdEur = rates['USD'] ?? 1.08;
  const usdTry = tryRate / usdEur;
  const eurTry = tryRate;

  return NextResponse.json(
    {
      base: 'TRY',
      rates: {
        USD: parseFloat((1 / usdTry).toFixed(4)),
        EUR: parseFloat((1 / eurTry).toFixed(4)),
        GBP: rates['GBP'] ? parseFloat((1 / (tryRate / rates['GBP'])).toFixed(4)) : null,
      },
      updatedAt: new Date().toISOString(),
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=3600' },
    },
  );
}
