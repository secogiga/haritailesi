'use client';

import { useState, useEffect } from 'react';

interface Rates { USD: number; EUR: number; GBP: number | null }

let _cached: { rates: Rates; fetchedAt: number } | null = null;

export function useExchangeRate() {
  const [rates, setRates] = useState<Rates | null>(() => _cached?.rates ?? null);

  useEffect(() => {
    if (_cached && Date.now() - _cached.fetchedAt < 4 * 60 * 60 * 1000) return;
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then((d: { rates: Rates }) => {
        _cached = { rates: d.rates, fetchedAt: Date.now() };
        setRates(d.rates);
      })
      .catch(() => {});
  }, []);

  function tryToUsd(amountKurus: number): string {
    if (!rates?.USD) return '';
    return `≈ ${(amountKurus / 100 * rates.USD).toFixed(0)} USD`;
  }

  function tryToEur(amountKurus: number): string {
    if (!rates?.EUR) return '';
    return `≈ ${(amountKurus / 100 * rates.EUR).toFixed(0)} EUR`;
  }

  return { rates, tryToUsd, tryToEur };
}
