'use client';

import { useEffect, useState } from 'react';
import { useToken } from '@/hooks/useToken';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1';

type Subscription = {
  id: string;
  memberNumber: string;
  membershipTier: string;
  status: string;
  startsAt: string;
  expiresAt: string;
};

const TIER_LABELS: Record<string, string> = {
  haritailesi_genc: 'Haritailesi Genç',
  new_graduate_member: 'Mesleğin Geleceği',
  individual_member: 'Mesleğin Değer Ortağı',
  corporate_member: 'Kurumsal Üye',
};

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

function countdownStyle(days: number) {
  if (days > 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (days > 30) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  if (days > 0) return 'text-orange-700 bg-orange-50 border-orange-200';
  return 'text-gray-500 bg-gray-50 border-gray-200';
}

function countdownBar(days: number) {
  if (days > 90) return '#66aca9';
  if (days > 30) return '#d97706';
  return '#ea580c';
}

export function MembershipWidget() {
  const token = useToken();
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/membership/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? (r.json() as Promise<Subscription>) : Promise.resolve(null)))
      .then(setSub)
      .catch(() => setSub(null));
  }, [token]);

  if (sub === undefined) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-48" />;
  }

  if (!sub) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-[#26496b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9a2 2 0 10-4 0v5a2 2 0 104 0V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2h-4" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">Aktif üyelik bulunamadı</h3>
        <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">
          Haritailesi Vakfı üyesi olun, mesleğin gelişimine katkı sağlayın.
        </p>
        <a
          href={`${process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://haritailesi.org'}/bagis`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex px-5 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors"
        >
          Üye Ol →
        </a>
      </div>
    );
  }

  const days = daysLeft(sub.expiresAt);
  const expired = days <= 0;
  const progressPct = Math.max(0, Math.min(100, (days / 365) * 100));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-[#26496b] to-[#1d3a57] px-6 py-5 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="mw-topo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <ellipse cx="40" cy="40" rx="36" ry="26" fill="none" stroke="white" strokeWidth="1" />
              <ellipse cx="40" cy="40" rx="22" ry="15" fill="none" stroke="white" strokeWidth="1" />
              <ellipse cx="40" cy="40" rx="10" ry="7" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mw-topo)" />
        </svg>
        <div className="relative">
          <p className="text-[#66aca9] text-[10px] font-bold uppercase tracking-widest mb-1.5">Haritailesi Vakfı</p>
          <h3 className="text-white font-bold text-lg leading-tight">
            {TIER_LABELS[sub.membershipTier] ?? sub.membershipTier}
          </h3>
          <p className="text-white/50 text-xs font-mono mt-1.5 tracking-wider">{sub.memberNumber}</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Countdown badge */}
        <div className={`flex items-center justify-between p-3.5 rounded-xl border ${countdownStyle(days)}`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">
              {expired ? 'Süre Doldu' : 'Kalan Süre'}
            </p>
            <p className="text-2xl font-bold leading-none">
              {expired ? '—' : `${days} gün`}
            </p>
          </div>
          <svg className="w-7 h-7 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Progress bar */}
        {!expired && (
          <div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, backgroundColor: countdownBar(days) }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
              <span>{new Date(sub.startsAt).toLocaleDateString('tr-TR')}</span>
              <span>{new Date(sub.expiresAt).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        )}

        {/* Details */}
        <dl className="space-y-2 text-sm border-t border-gray-100 pt-4">
          {[
            { label: 'Üye No', value: <span className="font-mono font-semibold text-gray-900">{sub.memberNumber}</span> },
            { label: 'Başlangıç', value: new Date(sub.startsAt).toLocaleDateString('tr-TR') },
            { label: 'Bitiş', value: new Date(sub.expiresAt).toLocaleDateString('tr-TR') },
            {
              label: 'Durum',
              value: (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {sub.status === 'active' ? 'Aktif' : sub.status === 'expired' ? 'Süresi Doldu' : sub.status}
                </span>
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <dt className="text-gray-500">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {/* Renewal CTA */}
        {(expired || days <= 30) && (
          <div className="pt-2">
            <a
              href={`${process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://haritailesi.org'}/bagis`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2.5 bg-[#26496b] text-white font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors text-sm"
            >
              {expired ? 'Üyeliği Yenile →' : `Şimdi Yenile — ${days} gün kaldı →`}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
