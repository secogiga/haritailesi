'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Props {
  module: 'ilanlar' | 'egitim' | 'etkinlikler' | 'magaza' | 'projeler' | 'yarismalar' | 'sinavlar' | 'anketler' | 'mentorluk' | 'yetenekler' | 'forum' | 'genel';
}

const COPY: Record<string, { heading: string; sub: string }> = {
  ilanlar:     { heading: 'Yeni ilanları kaçırmayın', sub: 'Haritailesi e-bülteni ile sektörün güncel ilanları doğrudan e-postanıza gelsin.' },
  egitim:      { heading: 'Yeni eğitimleri ilk siz görün', sub: 'Haritailesi e-bülteni ile kurs ve eğitimlerden anında haberdar olun.' },
  etkinlikler: { heading: 'Etkinlikleri asla kaçırmayın', sub: 'Haritailesi e-bülteni ile kongre, webinar ve buluşmalar e-postanıza gelsin.' },
  magaza:      { heading: 'Yeni ürünleri ilk siz keşfedin', sub: 'Haritailesi e-bülteni ile yeni ürün ve fırsatlardan haberdar olun.' },
  projeler:    { heading: 'Yeni projeleri ilk siz görün', sub: 'Haritailesi e-bülteni ile topluluktan yeni projeler doğrudan e-postanıza gelsin.' },
  yarismalar:  { heading: 'Yarışmaları kaçırmayın', sub: 'Haritailesi e-bülteni ile sektördeki yarışma ve ödüller doğrudan e-postanıza gelsin.' },
  sinavlar:    { heading: 'Sınav takviminden haberdar olun', sub: 'Haritailesi e-bülteni ile lisans ve sertifika sınavlarını takip edin.' },
  anketler:    { heading: 'Yeni anketleri ilk siz görün', sub: 'Haritailesi e-bülteni ile topluluk anket ve araştırmaları e-postanıza gelsin.' },
  mentorluk:   { heading: 'Mentorluk fırsatlarını kaçırmayın', sub: 'Haritailesi e-bülteni ile yeni mentor eşleşmeleri ve duyurular gelsin.' },
  yetenekler:  { heading: 'Yetenek havuzunu takip edin', sub: 'Haritailesi e-bülteni ile sektörün yetenekli isimlerinden haberdar olun.' },
  forum:       { heading: 'Güncel tartışmalara katılın', sub: 'Haritailesi e-bülteni ile forum özetleri ve öne çıkan konular e-postanıza gelsin.' },
  genel:       { heading: 'Haritailesi\'nde güncel kalın', sub: 'E-bültenimize abone olun, sektörün nabzını tutun.' },
};

const STORAGE_KEY = (m: string) => `newsletter_dismissed_${m}`;

export function ModuleNewsletterBar({ module }: Props) {
  const [visible, setVisible]   = useState(false);
  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY(module))) setVisible(true);
  }, [module]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY(module), '1');
    setVisible(false);
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('done');
        setTimeout(dismiss, 2500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (!visible) return null;

  const copy = COPY[module];
  if (!copy) return null;
  const { heading, sub } = copy;

  return (
    <div className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4 overflow-hidden">

          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[var(--color-mavi)]/8 dark:bg-[var(--color-mavi)]/20 items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[var(--color-mavi)] dark:text-[var(--color-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {status === 'done' ? (
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Kaydedildiniz! En kısa sürede haberdar edileceksiniz.
              </p>
            ) : (
              <div className="flex items-center gap-x-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-teal)] shrink-0">E-Bülten</span>
                <span className="hidden sm:inline text-gray-200 dark:text-slate-700 text-xs shrink-0">·</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{heading}</span>
                <span className="hidden lg:inline text-sm text-gray-500 dark:text-slate-400 truncate">{sub}</span>
              </div>
            )}
          </div>

          {status !== 'done' && (
            <form onSubmit={subscribe} className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="flex-1 sm:w-60 text-sm px-3.5 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 focus:border-[var(--color-mavi)]/60 transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="shrink-0 text-sm font-semibold px-5 py-2 rounded-lg bg-[var(--color-mavi)] text-white hover:bg-[var(--color-mavi-acik)] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {status === 'loading' ? '…' : 'Abone Ol'}
              </button>
            </form>
          )}

          <button
            onClick={dismiss}
            className="shrink-0 p-1 rounded-md text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
