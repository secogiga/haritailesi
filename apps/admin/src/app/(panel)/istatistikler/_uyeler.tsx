import React, { useMemo } from 'react';
import Link from 'next/link';
import type { DashboardStats } from '@/lib/api';
import { Card, BarRow } from './_shared';

// ─── Label / Config Maps ─────────────────────────────────────────────────────

const TIER_CFG: Record<string, { label: string; color: string; bg: string }> = {
  visitor:             { label: 'Ziyaretçi',              color: '#9ca3af', bg: 'bg-gray-400' },
  registered_user:     { label: 'Sahne Üyesi',            color: '#64748b', bg: 'bg-slate-500' },
  haritailesi_genc:    { label: 'Haritailesi Genç',       color: '#0d9488', bg: 'bg-teal-600' },
  new_graduate_member: { label: 'Mesleğin Geleceği',      color: '#f97316', bg: 'bg-orange-500' },
  individual_member:   { label: 'Mesleğin Değer Ortağı',  color: '#3b82f6', bg: 'bg-blue-500' },
  corporate_member:    { label: 'Kurumsal Üye',           color: '#8b5cf6', bg: 'bg-violet-500' },
};
const TIER_ORDER = ['visitor', 'registered_user', 'haritailesi_genc', 'new_graduate_member', 'individual_member', 'corporate_member'];

const WORK_LABELS: Record<string, string> = {
  employed: 'Çalışıyor', self_employed: 'Serbest', unemployed: 'İş Arıyor',
  student: 'Öğrenci', retired: 'Emekli',
};
const POST_TYPE_LABELS: Record<string, string> = {
  general: 'Genel', question: 'Soru', idea: 'Fikir', project_call: 'Proje Çağrısı',
  content_draft: 'Taslak', team_search: 'Ekip Arıyorum', mentorship_experience: 'Mentorluk',
  poll: 'Anket', announcement: 'Duyuru', resource: 'Kaynak',
};
const CATEGORY_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS / GIS',
  fotogrametri_uzaktan_algilama: 'Fotogrametri', yazilim_teknoloji: 'Yazılım',
  kariyer: 'Kariyer', mentorluk: 'Mentorluk', gonullulik: 'Gönüllülük',
  proje_gelistirme: 'Proje', haritailesi_duyurulari: 'Duyurular',
};
const PIPELINE_STAGES = [
  { state: 'submitted',        label: 'Yeni',       color: '#f59e0b' },
  { state: 'under_review',     label: 'İnceleme',   color: '#3b82f6' },
  { state: 'interview_needed', label: 'Görüşme',    color: '#8b5cf6' },
  { state: 'waiting_payment',  label: 'Ödeme',      color: '#f97316' },
  { state: 'approved',         label: 'Onaylı',     color: '#10b981' },
  { state: 'active',           label: 'Aktif Üye',  color: '#059669' },
];

// ─── Primitive Components ─────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || max;
  const W = 64, H = 22;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = data[data.length - 1] ?? 0;
  const prev = data[data.length - 2] ?? 0;
  const stroke = last >= prev ? '#10b981' : '#ef4444';
  return (
    <svg width={W} height={H} className="shrink-0 opacity-70">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaBadge({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) {
  const d = current - previous;
  if (previous === 0 && d === 0) return <span className="text-[11px] text-gray-400">veri yok</span>;
  if (previous === 0) return <span className="text-[11px] text-emerald-600 font-semibold">▲ +{d}{suffix} <span className="font-normal text-gray-400">bu ay</span></span>;
  const pct = Math.round(Math.abs(d) / previous * 100);
  if (d === 0) return <span className="text-[11px] text-gray-400">≈ değişmedi</span>;
  return (
    <span className={`text-[11px] font-semibold ${d > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
      {d > 0 ? '▲' : '▼'} %{pct}
      <span className="font-normal text-gray-400 ml-1">geçen aya göre ({d > 0 ? '+' : ''}{d}{suffix})</span>
    </span>
  );
}

function GrowthChart({ data }: { data: Array<{ month: string; count: number }> }) {
  if (!data.length) return <p className="text-sm text-gray-400 py-8 text-center">Henüz veri yok</p>;
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const peak = [...data].sort((a, b) => b.count - a.count)[0]!;
  const max = Math.max(peak.count, 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 108 }}>
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        const isCurrent = d.month === currentMonthStr;
        const isPeak = d.month === peak.month && !isCurrent;
        const [yr, mon] = d.month.split('-');
        const label = new Date(Number(yr), Number(mon) - 1, 1).toLocaleDateString('tr-TR', { month: 'short' });
        const showLabel = isCurrent || isPeak || d.count === max;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center justify-end gap-[3px] h-full min-w-0">
            <span className="text-[9px] font-bold leading-none" style={{
              color: isCurrent ? '#26496b' : isPeak ? '#66aca9' : 'transparent', height: 11,
            }}>{d.count}</span>
            <div className="w-full rounded-t-sm transition-all" style={{
              height: d.count > 0 ? `${Math.max(pct, 4)}%` : 2,
              backgroundColor: isCurrent ? '#26496b' : isPeak ? '#66aca9' : '#e2e8f0',
            }} />
            <span className={`text-[8px] leading-none ${showLabel ? (isCurrent ? 'text-[#26496b] font-bold' : 'text-gray-500') : 'text-gray-300'}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TierBar({ byTier }: { byTier: Record<string, number> }) {
  const total = Object.values(byTier).reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  return (
    <div className="space-y-3">
      <div className="h-5 rounded-full overflow-hidden flex gap-[1px]">
        {TIER_ORDER.map((key) => {
          const count = byTier[key] ?? 0;
          const pct = (count / total) * 100;
          if (pct < 0.5) return null;
          const cfg = TIER_CFG[key]!;
          return <div key={key} style={{ width: `${pct}%`, backgroundColor: cfg.color }}
            title={`${cfg.label}: ${count} (%${pct.toFixed(1)})`} />;
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {TIER_ORDER.filter(k => (byTier[k] ?? 0) > 0).map((key) => {
          const count = byTier[key] ?? 0;
          const pct = ((count / total) * 100).toFixed(0);
          const cfg = TIER_CFG[key]!;
          return (
            <div key={key} className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: cfg.color }} />
              <span>{cfg.label}</span>
              <span className="font-semibold text-gray-900">{count}</span>
              <span className="text-gray-400">%{pct}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppFunnel({ byState }: { byState: Record<string, number> }) {
  const total = PIPELINE_STAGES.reduce((s, st) => s + (byState[st.state] ?? 0), 0);
  if (total === 0) return <p className="text-xs text-gray-400 py-3">Başvuru yok</p>;
  const maxCount = Math.max(...PIPELINE_STAGES.map(st => byState[st.state] ?? 0), 1);
  return (
    <div className="space-y-2">
      {PIPELINE_STAGES.map((st) => {
        const count = byState[st.state] ?? 0;
        if (count === 0) return null;
        const pct = (count / maxCount) * 100;
        return (
          <div key={st.state} className="flex items-center gap-2">
            <div className="w-20 shrink-0 text-[11px] text-gray-500">{st.label}</div>
            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
              <div className="h-full rounded flex items-center px-2"
                style={{ width: `${Math.max(pct, 10)}%`, backgroundColor: st.color + '33' }}>
                <span className="text-[10px] font-bold" style={{ color: st.color }}>{count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Tab Component ───────────────────────────────────────────────────────

export default function UyeIstatistikleri({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const last12Months = useMemo(() => {
    const byJoin = stats?.memberDetails?.byJoinMonth ?? [];
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = byJoin.find(x => x.month === monthStr);
      return { month: monthStr, count: found?.count ?? 0 };
    });
  }, [stats]); // eslint-disable-line

  const sparkData = last12Months.map(d => d.count);
  const peakEntry = useMemo(() =>
    [...last12Months].sort((a, b) => b.count - a.count)[0] ?? { month: '', count: 0 },
    [last12Months]
  );
  const peakLabel = (() => {
    if (!peakEntry.month) return '';
    const [yr, mon] = peakEntry.month.split('-');
    return new Date(Number(yr), Number(mon) - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  })();

  const prevMonthUsers = last12Months.find(d => d.month === prevMonthStr)?.count ?? stats?.users.newLastMonth ?? 0;
  const thisMonthUsers = last12Months.find(d => d.month === currentMonthStr)?.count ?? stats?.users.newThisMonth ?? 0;
  const engRate = stats ? Math.round(((stats.memberDetails?.recentlyActive ?? 0) / Math.max(stats.users.total, 1)) * 100) : 0;

  const attentionItems = stats ? [
    { label: 'Başvuru', count: stats.applications.pending, href: '/basvurular', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { label: 'İçerik Talebi', count: stats.contentRequests?.pending ?? 0, href: '/egitimler', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Mentorluk', count: stats.mentorship.pending, href: '/mentorluk', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'Kulüp Onayı', count: stats.studentClubs?.pending ?? 0, href: '/ogrenci-kulupler', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  ].filter(i => i.count > 0) : [];

  if (loading && !stats) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32" />)}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 h-48" />
    </div>
  );
  if (!stats) return null;

  const mentorshipTotal = stats.mentorship.pending + stats.mentorship.accepted + stats.mentorship.completed;

  return (
    <div className="space-y-5">

      {/* Bekleyen işlemler */}
      {attentionItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
          <span className="text-xs font-semibold text-amber-700 mr-1">Bekleyen işlemler:</span>
          {attentionItems.map(item => (
            <Link key={item.label} href={item.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${item.color} hover:opacity-80 transition-opacity`}>
              <span className="font-bold text-sm leading-none">{item.count}</span>
              {item.label}
              <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* KPI Hero */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <Sparkline data={sparkData} />
          </div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums">{stats.users.total.toLocaleString('tr-TR')}</div>
          <div className="text-sm text-gray-500 mt-0.5">Aktif Üye</div>
          <div className="mt-2"><DeltaBadge current={thisMonthUsers} previous={prevMonthUsers} suffix=" üye" /></div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            {peakEntry.count > 0 && (
              <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                En iyi: {peakEntry.count}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums">{thisMonthUsers.toLocaleString('tr-TR')}</div>
          <div className="text-sm text-gray-500 mt-0.5">Bu Ay Katılan</div>
          <div className="mt-2"><DeltaBadge current={thisMonthUsers} previous={prevMonthUsers} /></div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              engRate >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              engRate >= 25 ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-red-50 text-red-600 border-red-200'
            }`}>{engRate >= 50 ? 'Sağlıklı' : engRate >= 25 ? 'Orta' : 'Düşük'}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums">%{engRate}</div>
          <div className="text-sm text-gray-500 mt-0.5">Aktivasyon Oranı</div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${engRate >= 50 ? 'bg-emerald-500' : engRate >= 25 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${Math.min(engRate, 100)}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{(stats.memberDetails?.recentlyActive ?? 0).toLocaleString('tr-TR')} üye son 30 günde aktif</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
              {stats.feed.publishedPosts.toLocaleString('tr-TR')} toplam
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums">{stats.feed.newPostsThisMonth.toLocaleString('tr-TR')}</div>
          <div className="text-sm text-gray-500 mt-0.5">Bu Ayki Gönderi</div>
          <div className="mt-2"><DeltaBadge current={stats.feed.newPostsThisMonth} previous={stats.feed.newPostsLastMonth} suffix=" gönderi" /></div>
        </div>
      </div>

      {/* Büyüme Grafiği */}
      {last12Months.some(d => d.count > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Üye Büyüme Trendi</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Son 12 ay — aylık yeni kayıt</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#26496b]" /> Bu ay</span>
              {peakEntry.count > 0 && peakEntry.month !== currentMonthStr && (
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#66aca9]" /> En yoğun ay</span>
              )}
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-gray-200" /> Diğer</span>
            </div>
          </div>
          <GrowthChart data={last12Months} />
          <div className="mt-4 flex flex-wrap gap-3">
            {peakEntry.count > 0 && (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2">
                <span className="text-teal-600 text-base">🏆</span>
                <div>
                  <span className="text-[11px] font-semibold text-teal-800">En yoğun ay: {peakLabel}</span>
                  <span className="text-[11px] text-teal-600 ml-1">— {peakEntry.count} yeni üye</span>
                </div>
              </div>
            )}
            {prevMonthUsers > 0 && thisMonthUsers > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2">
                <span className="text-blue-600 text-base">📊</span>
                <div>
                  <span className="text-[11px] font-semibold text-blue-800">Bu ay {thisMonthUsers} katılım</span>
                  <span className="text-[11px] text-blue-600 ml-1">— geçen ayın {prevMonthUsers > 0 ? `%${Math.round((thisMonthUsers / prevMonthUsers) * 100)}` : '—'}'i</span>
                </div>
              </div>
            )}
            {(() => {
              const avg = Math.round(last12Months.reduce((s, d) => s + d.count, 0) / 12);
              return avg > 0 ? (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                  <span className="text-gray-500 text-base">📐</span>
                  <span className="text-[11px] text-gray-600">12 aylık ortalama: <strong>{avg} üye/ay</strong></span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Üye Kompozisyonu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Üyelik Dağılımı" accent="bg-blue-50 text-blue-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>
          <TierBar byTier={stats.users.byTier} />
        </Card>
        <Card title="Top 10 Şehir" accent="bg-blue-50 text-blue-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
          <div className="space-y-2">
            {stats.memberDetails?.topCities.slice(0, 8).map(r => (
              <BarRow key={r.city} label={r.city} count={r.count}
                max={Math.max(...(stats.memberDetails?.topCities.map(x => x.count) ?? [1]))}
                color="bg-blue-400" />
            ))}
          </div>
        </Card>
      </div>

      {/* Demografi */}
      {stats.memberDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Çalışma Durumu" accent="bg-teal-50 text-teal-600"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
            <div className="space-y-2">
              {stats.memberDetails.byWorkStatus.map(r => (
                <BarRow key={r.workStatus} label={WORK_LABELS[r.workStatus] ?? r.workStatus}
                  count={r.count} max={Math.max(...stats.memberDetails.byWorkStatus.map(x => x.count), 1)} color="bg-teal-500" />
              ))}
            </div>
          </Card>
          <Card title="Deneyim Dağılımı" accent="bg-indigo-50 text-indigo-600"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}>
            <div className="space-y-2">
              {(['0-2 yıl', '3-5 yıl', '6-10 yıl', '10+ yıl'] as const).map(band => {
                const cnt = stats.memberDetails.byExperienceBand.find(r => r.band === band)?.count ?? 0;
                const maxExp = Math.max(...stats.memberDetails.byExperienceBand.map(r => r.count), 1);
                return <BarRow key={band} label={band} count={cnt} max={maxExp} color="bg-indigo-400" />;
              })}
            </div>
          </Card>
          <Card title="Yaş Dağılımı" accent="bg-violet-50 text-violet-600"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
            <div className="space-y-2">
              {(['18-25', '26-35', '36-45', '46+'] as const).map(band => {
                const cnt = stats.memberDetails.byAgeBand.find(r => r.band === band)?.count ?? 0;
                const maxAge = Math.max(...stats.memberDetails.byAgeBand.map(r => r.count), 1);
                return <BarRow key={band} label={band} count={cnt} max={maxAge} color="bg-violet-400" />;
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Başvuru + Mentorluk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Başvuru Hunisi" accent="bg-orange-50 text-orange-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}>
          <AppFunnel byState={stats.applications.byState} />
          {stats.applications.pending > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
              <span className="text-xs font-medium text-orange-700">{stats.applications.pending} yeni başvuru onay bekliyor</span>
              <Link href="/basvurular" className="ml-auto text-[10px] text-orange-600 hover:underline">İncele →</Link>
            </div>
          )}
        </Card>

        <Card title="Mentorluk" accent="bg-purple-50 text-purple-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>
          <div className="space-y-3">
            {[
              { label: 'Tamamlandı', value: stats.mentorship.completed, pct: mentorshipTotal > 0 ? Math.round((stats.mentorship.completed / mentorshipTotal) * 100) : 0, color: 'bg-emerald-500', text: 'text-emerald-700' },
              { label: 'Devam Ediyor', value: stats.mentorship.accepted, pct: mentorshipTotal > 0 ? Math.round((stats.mentorship.accepted / mentorshipTotal) * 100) : 0, color: 'bg-blue-400', text: 'text-blue-700' },
              { label: 'Bekliyor', value: stats.mentorship.pending, pct: mentorshipTotal > 0 ? Math.round((stats.mentorship.pending / mentorshipTotal) * 100) : 0, color: 'bg-amber-400', text: 'text-amber-700' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className={`font-semibold ${item.text}`}>{item.value} <span className="font-normal text-gray-400">(%{item.pct})</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>{stats.mentorship.activeMentors} aktif mentor</span>
              <span>{stats.mentorship.totalSessions} Jitsi oturumu</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Topluluk Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Gönderi Türleri" accent="bg-emerald-50 text-emerald-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}>
          <div className="space-y-2">
            {stats.feed.byType.slice(0, 7).map(r => (
              <BarRow key={r.type} label={POST_TYPE_LABELS[r.type] ?? r.type}
                count={r.count} max={Math.max(...stats.feed.byType.map(x => x.count), 1)} color="bg-emerald-500" />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
            <span><strong className="text-gray-800">{stats.feed.totalComments.toLocaleString('tr-TR')}</strong> yorum</span>
            <span><strong className="text-gray-800">{stats.feed.totalReactions.toLocaleString('tr-TR')}</strong> reaksiyon</span>
          </div>
        </Card>

        <Card title="Aktif Kategoriler" accent="bg-teal-50 text-teal-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}>
          <div className="space-y-2">
            {stats.feed.topCategories.map(r => (
              <BarRow key={r.category} label={CATEGORY_LABELS[r.category] ?? r.category}
                count={r.count} max={Math.max(...stats.feed.topCategories.map(x => x.count), 1)} color="bg-teal-500" />
            ))}
          </div>
        </Card>
      </div>

      {/* Pazar + Kulüpler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.marketplace && (
          <Card title="Pazar Yeri" accent="bg-amber-50 text-amber-600"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
            <div className="text-3xl font-bold text-amber-600 tabular-nums">{stats.marketplace.publishedListings.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-gray-500 mt-1">Aktif İlan</div>
          </Card>
        )}
        {stats.studentClubs && (
          <Card title="Öğrenci Kulüpleri" accent="bg-rose-50 text-rose-600"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}>
            <div className="flex items-end gap-3">
              <div>
                <div className="text-3xl font-bold text-rose-600 tabular-nums">{stats.studentClubs.active}</div>
                <div className="text-xs text-gray-500 mt-0.5">Aktif Kulüp</div>
              </div>
              {stats.studentClubs.pending > 0 && (
                <div className="pb-0.5">
                  <div className="text-lg font-semibold text-orange-500">{stats.studentClubs.pending}</div>
                  <div className="text-[10px] text-gray-400">onay bekliyor</div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}
