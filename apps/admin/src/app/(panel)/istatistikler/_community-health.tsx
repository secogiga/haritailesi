'use client';

import React, { useState } from 'react';
import type { CommunityHealth } from '@/lib/api';
import { Card } from './_shared';

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
@keyframes ch-slide {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes ch-shimmer {
  0%   { background-position:-400px 0; }
  100% { background-position:400px 0; }
}
.ch-slide    { animation: ch-slide 0.4s cubic-bezier(.22,1,.36,1) both; }
.ch-shimmer  {
  background: linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%);
  background-size:800px 100%;
  animation: ch-shimmer 1.4s infinite linear;
}
`;

// ─── Risk reason config ───────────────────────────────────────────────────────

const RISK_CONFIG: Record<
  'inactive_10d' | 'abandoned_onboarding' | 'mentor_no_response',
  { label: string; color: string; bg: string }
> = {
  inactive_10d:          { label: 'Son 10 gündür pasif',          color: 'text-amber-700',  bg: 'bg-amber-50'  },
  abandoned_onboarding:  { label: 'Onboarding yarım bıraktı',     color: 'text-red-700',    bg: 'bg-red-50'    },
  mentor_no_response:    { label: 'Mentör yanıt vermedi',         color: 'text-rose-700',   bg: 'bg-rose-50'   },
};

const TIER_LABELS: Record<string, string> = {
  haritailesi_genc:    'Haritailesi Genç',
  new_graduate_member: 'Yeni Mezun',
  individual_member:   'Profesyonel',
  corporate_member:    'Şirket',
};

// ─── Insight type config ──────────────────────────────────────────────────────

const INSIGHT_CONFIG = {
  warning:     { icon: '⚠️', border: 'border-l-amber-500',  badge: 'bg-amber-50 text-amber-700',   label: 'Uyarı'     },
  opportunity: { icon: '💡', border: 'border-l-blue-400',   badge: 'bg-blue-50 text-blue-700',     label: 'Fırsat'    },
  trend:       { icon: '📈', border: 'border-l-emerald-500',badge: 'bg-emerald-50 text-emerald-700',label: 'Trend'     },
} as const;

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${accent}`}>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs font-semibold mt-0.5">{label}</div>
      {sub && <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Trend row ────────────────────────────────────────────────────────────────

function TrendRow({ trend }: { trend: CommunityHealth['trends'][number] }) {
  const up  = trend.changePct > 0;
  const abs = Math.abs(trend.changePct);
  const neutral = trend.changePct === 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{trend.label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 tabular-nums">{trend.lastWeek} → {trend.thisWeek}</span>
        {neutral ? (
          <span className="text-xs text-gray-400">→ değişim yok</span>
        ) : (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${up ? 'text-emerald-600' : 'text-red-600'}`}>
            {up ? '↑' : '↓'}{abs}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── At-risk user row ─────────────────────────────────────────────────────────

function AtRiskRow({ user, delay }: { user: CommunityHealth['atRisk'][number]; delay: number }) {
  const initials = user.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="ch-slide flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 truncate">
            {user.displayName ?? user.email}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium">
            {TIER_LABELS[user.membershipTier] ?? user.membershipTier}
          </span>
          {!user.onboardingComplete && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 font-medium">
              Onboarding eksik
            </span>
          )}
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          {user.daysSinceLogin !== null ? `${user.daysSinceLogin} gün önce giriş yaptı` : 'Hiç giriş yapmadı'}
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {user.riskReasons.map((r) => {
            const cfg = RISK_CONFIG[r];
            return (
              <span key={r} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Product insight card ─────────────────────────────────────────────────────

function ProductInsightCard({ insight, delay }: {
  insight: CommunityHealth['productInsights'][number]; delay: number;
}) {
  const cfg = INSIGHT_CONFIG[insight.type];
  return (
    <div className={`ch-slide bg-white rounded-xl border border-gray-100 border-l-4 ${cfg.border} p-4`}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-900 leading-snug">{insight.title}</p>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.body}</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ h }: { h: string }) {
  return <div className={`ch-shimmer rounded-xl ${h}`} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type RiskFilter = 'all' | 'inactive_10d' | 'abandoned_onboarding' | 'mentor_no_response';

export default function CommunityHealthPanel({
  data, loading,
}: {
  data: CommunityHealth | null;
  loading: boolean;
}) {
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [showAll, setShowAll]       = useState(false);

  if (loading && !data) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => <Sk key={i} h="h-20" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Sk h="h-64" /><Sk h="h-64" />
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  const { atRisk, healthSummary, trends, productInsights } = data;

  const filtered = riskFilter === 'all'
    ? atRisk
    : atRisk.filter(u => u.riskReasons.includes(riskFilter));

  const visible = showAll ? filtered : filtered.slice(0, 15);

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <SummaryCard
          label="Bu hafta aktif"
          value={healthSummary.totalActive.toLocaleString('tr-TR')}
          accent="bg-emerald-50 text-emerald-800"
        />
        <SummaryCard
          label="Risk altında"
          value={healthSummary.atRiskCount}
          sub="Aksiyon gerektirir"
          accent="bg-red-50 text-red-800"
        />
        <SummaryCard
          label="Farkındalık Anına Ulaşan"
          value={`%${healthSummary.ahaReachedPct}`}
          sub={`Ort. skor: ${healthSummary.avgAhaScore}`}
          accent="bg-amber-50 text-amber-800"
        />
        <SummaryCard
          label="Aktif üye oranı"
          value={`%${healthSummary.activeRatioPct}`}
          sub="Son 7 gün"
          accent="bg-blue-50 text-blue-800"
        />
        <SummaryCard
          label="Ort. Aha skoru"
          value={healthSummary.avgAhaScore}
          sub="Tüm üyeler"
          accent="bg-violet-50 text-violet-800"
        />
      </div>

      {/* ── Product insights + Trends ── */}
      <div className="grid md:grid-cols-2 gap-4 mb-5">

        {/* Product Intelligence */}
        <Card
          title="Ürün Zekası"
          accent="bg-[#26496b]/10 text-[#26496b]"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        >
          {productInsights.length === 0 ? (
            <div className="text-xs text-gray-400 py-4 text-center">
              Şu an öne çıkan bir içgörü yok.
            </div>
          ) : (
            <div className="space-y-3">
              {productInsights.map((ins, i) => (
                <ProductInsightCard key={ins.id} insight={ins} delay={i * 60} />
              ))}
            </div>
          )}
        </Card>

        {/* Weekly Trends */}
        <Card
          title="Haftalık Eğilimler"
          accent="bg-indigo-50 text-indigo-700"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        >
          <p className="text-[10px] text-gray-400 mb-3">Bu hafta vs. önceki hafta karşılaştırması</p>
          {trends.map(t => <TrendRow key={t.metric} trend={t} />)}
          {trends.length === 0 && (
            <div className="text-xs text-gray-400 py-4 text-center">Henüz yeterli veri yok.</div>
          )}
        </Card>
      </div>

      {/* ── At-risk users ── */}
      <Card
        title={`Risk Altındaki Üyeler (${atRisk.length})`}
        accent="bg-red-50 text-red-700"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      >
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
          {([
            { id: 'all',                  label: `Tümü (${atRisk.length})` },
            { id: 'inactive_10d',         label: `Pasif (${atRisk.filter(u => u.riskReasons.includes('inactive_10d')).length})` },
            { id: 'abandoned_onboarding', label: `Onboarding (${atRisk.filter(u => u.riskReasons.includes('abandoned_onboarding')).length})` },
            { id: 'mentor_no_response',   label: `Mentör (${atRisk.filter(u => u.riskReasons.includes('mentor_no_response')).length})` },
          ] as { id: RiskFilter; label: string }[]).map(f => (
            <button
              key={f.id}
              onClick={() => { setRiskFilter(f.id); setShowAll(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                riskFilter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Bu kategoride risk altında kullanıcı yok.</div>
        ) : (
          <>
            {visible.map((u, i) => (
              <AtRiskRow key={u.userId} user={u} delay={i * 30} />
            ))}
            {filtered.length > 15 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 py-2 border border-dashed border-gray-200 rounded-lg transition-colors"
              >
                {showAll ? 'Daha az göster' : `${filtered.length - 15} daha göster`}
              </button>
            )}
          </>
        )}
      </Card>
    </>
  );
}
