'use client';

import { useEffect, useState } from 'react';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

type EnrollStatus = 'idle' | 'loading' | 'enrolled' | 'error';

export function CourseEnrollButton({
  trainingId, trainingSlug, price, memberPrice, registrationUrl, compact = false,
}: {
  trainingId: string;
  trainingSlug: string;
  price: string | null;
  memberPrice: string | null;
  registrationUrl: string | null;
  compact?: boolean;
}) {
  const { user, isLoading } = useSahneAuth();
  const [status, setStatus] = useState<EnrollStatus>('idle');
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/v1/cms/trainings/${trainingId}/enrollment-status`, {
      credentials: 'include',
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setStatus('enrolled'); setProgressPct(d.progressPct ?? 0); }
      })
      .catch(() => {});
  }, [user, trainingId]);

  async function enroll() {
    setStatus('loading'); setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/trainings/${trainingId}/enroll`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Kayıt başarısız.');
      }
      setStatus('enrolled'); setProgressPct(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu.');
      setStatus('error');
    }
  }

  if (isLoading) return <div className={`${compact ? 'h-10' : 'h-12'} bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse`} />;

  // Dış link (ücretli veya dış platform)
  if (registrationUrl && !user) {
    return (
      <a href={registrationUrl} target="_blank" rel="noreferrer"
        className={`w-full flex items-center justify-center gap-2 font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors ${compact ? 'px-4 py-2 text-sm' : 'px-5 py-3.5 text-base'}`}>
        {price ? `Satın Al — ${price}` : 'Kayıt Ol'}
      </a>
    );
  }

  // Giriş yapmamış
  if (!user) {
    return (
      <div className="space-y-2">
        <a href={`${MUTFAK_URL}/giris`}
          className={`w-full flex items-center justify-center gap-2 font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors ${compact ? 'px-4 py-2 text-sm' : 'px-5 py-3.5 text-base'}`}>
          🎓 Üye Girişi ile Kayıt Ol
        </a>
        {memberPrice && price && memberPrice !== price && !compact && (
          <p className="text-center text-xs text-gray-400">Normal: <s>{price}</s> · Üye: <strong className="text-emerald-600">{memberPrice}</strong></p>
        )}
        {!compact && (
          <p className="text-center text-xs text-gray-400">Üye olmak için <a href="/uye-ol/bireysel" className="text-[var(--color-mavi)] hover:underline font-medium">kayıt olun →</a></p>
        )}
      </div>
    );
  }

  // Kayıtlı
  if (status === 'enrolled') {
    return (
      <div className="space-y-2">
        <a href={`/egitim/${trainingSlug}/ders`}
          className={`w-full flex items-center justify-center gap-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors ${compact ? 'px-4 py-2 text-sm' : 'px-5 py-3.5 text-base'}`}>
          ▶ {progressPct === 0 ? 'Kursa Başla' : progressPct === 100 ? '✓ Tamamlandı' : 'Devam Et'}
        </a>
        {progressPct !== null && !compact && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>İlerleme</span><span>%{progressPct}</span></div>
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => void enroll()}
        disabled={status === 'loading'}
        className={`w-full flex items-center justify-center gap-2 font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors disabled:opacity-60 ${compact ? 'px-4 py-2 text-sm' : 'px-5 py-3.5 text-base'}`}
      >
        {status === 'loading'
          ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Kaydediliyor…</>
          : `🎓 ${price ? `Satın Al — ${memberPrice ?? price}` : 'Ücretsiz Kayıt Ol'}`
        }
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      {memberPrice && price && memberPrice !== price && !compact && (
        <p className="text-center text-xs text-gray-400">Normal fiyat: <s>{price}</s> · Üye: <strong className="text-emerald-600">{memberPrice}</strong></p>
      )}
    </div>
  );
}
