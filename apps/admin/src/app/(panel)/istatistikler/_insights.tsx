'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { OnboardingInsights } from '@/lib/api';
import { EmptyState, Card, SectionHeader } from './_shared';

// ─── Keyframes ────────────────────────────────────────────────────────────────

const STYLES = `
@keyframes ins-slide {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes ins-pulse-ring {
  0%,100% { transform:scale(1); opacity:1; }
  50%      { transform:scale(1.5); opacity:0; }
}
@keyframes ins-shimmer {
  0%   { background-position:-400px 0; }
  100% { background-position:400px 0; }
}
.ins-slide { animation: ins-slide 0.45s cubic-bezier(.22,1,.36,1) both; }
.ins-shimmer {
  background: linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%);
  background-size:800px 100%;
  animation: ins-shimmer 1.4s infinite linear;
}
`;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, enabled = true) {
  const [v, setV] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled || target === 0) { setV(target); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / 700, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, enabled]);
  return v;
}

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV = {
  critical: {
    border: 'border-l-red-500',
    badge: 'bg-red-50 text-red-700',
    dot: 'bg-red-500',
    label: 'Kritik',
    ring: 'ring-red-200',
  },
  warning: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    label: 'Uyarı',
    ring: 'ring-amber-200',
  },
  info: {
    border: 'border-l-blue-400',
    badge: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-400',
    label: 'Bilgi',
    ring: 'ring-blue-200',
  },
} as const;

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({
  insight, delay = 0,
}: {
  insight: OnboardingInsights['insights'][number]; delay?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV[insight.severity];
  return (
    <div
      className={`ins-slide bg-white rounded-xl border border-gray-100 border-l-4 ${sev.border} shadow-sm overflow-hidden`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="flex items-start gap-3 px-4 py-3.5 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${sev.badge}`}>
              {sev.label}
            </span>
            {insight.metric !== undefined && (
              <span className="text-xs font-bold text-gray-700 tabular-nums">
                {insight.metric}{insight.unit ?? ''}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug">{insight.title}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50">
          <p className="text-xs text-gray-600 leading-relaxed mb-3">{insight.body}</p>
          <div className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
            <svg className="w-3.5 h-3.5 text-[#26496b] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-[#26496b] font-medium leading-relaxed">{insight.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Segment table row ────────────────────────────────────────────────────────

function SegmentRow({ seg, maxAha }: {
  seg: OnboardingInsights['segmentFunnel'][number]; maxAha: number;
}) {
  const COLOR_MAP: Record<string, string> = {
    haritailesi_genc: 'bg-teal-400',
    new_graduate_member: 'bg-cyan-400',
    individual_member: 'bg-blue-500',
    corporate_member: 'bg-violet-500',
    mentor: 'bg-amber-500',
    content_creator: 'bg-rose-500',
  };
  const barColor = COLOR_MAP[seg.key] ?? 'bg-gray-400';
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="py-2.5 px-3 text-sm font-medium text-gray-800">{seg.segment}</td>
      <td className="py-2.5 px-3 text-right tabular-nums text-xs text-gray-500">
        {seg.total.toLocaleString('tr-TR')}
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-xs font-medium text-gray-700">
        %{seg.profilePct}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-700`}
              style={{ width: maxAha > 0 ? `${(seg.ahaPct / maxAha) * 100}%` : '0%' }}
            />
          </div>
          <span className="w-8 text-right text-xs font-bold text-gray-800">%{seg.ahaPct}</span>
        </div>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-xs">
        <span className={`px-2 py-0.5 rounded-full font-semibold ${
          seg.active30dPct >= 50 ? 'bg-emerald-50 text-emerald-700' :
          seg.active30dPct >= 25 ? 'bg-amber-50 text-amber-700' :
          'bg-red-50 text-red-600'
        }`}>
          %{seg.active30dPct}
        </span>
      </td>
    </tr>
  );
}

// ─── Score distribution bar ───────────────────────────────────────────────────

function ScoreDist({ label, data, colors }: {
  label: string;
  data: Record<string, number>;
  colors: string[];
}) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  const buckets = ['0-25', '26-50', '51-75', '76-100'];
  const labels = ['Başlangıç', 'Gelişiyor', 'Aktif', 'Lider'];
  return (
    <div>
      <div className="text-xs font-semibold text-gray-600 mb-2">{label}</div>
      <div className="flex h-4 rounded-full overflow-hidden mb-1.5">
        {buckets.map((b, i) => {
          const count = data[b] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return pct > 0 ? (
            <div
              key={b}
              className={`${colors[i]} transition-all duration-700`}
              style={{ width: `${pct}%` }}
              title={`${labels[i]}: ${count.toLocaleString('tr-TR')} (%${Math.round(pct)})`}
            />
          ) : null;
        })}
      </div>
      <div className="flex gap-3 flex-wrap">
        {buckets.map((b, i) => {
          const count = data[b] ?? 0;
          return (
            <div key={b} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-sm ${colors[i]}`} />
              <span className="text-[10px] text-gray-500">{labels[i]}: <strong className="text-gray-700">{count.toLocaleString('tr-TR')}</strong></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Retention correlation card ───────────────────────────────────────────────

function RetentionCorrelationCard({ item }: {
  item: OnboardingInsights['retentionCorrelations'][number];
}) {
  const displayRate = useCountUp(item.retentionRate);
  const color = item.retentionRate >= 60 ? 'text-emerald-600' : item.retentionRate >= 40 ? 'text-amber-600' : 'text-gray-500';
  return (
    <div className="bg-gray-50 rounded-xl p-3.5 ins-slide">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{displayRate}%</div>
      <div className="text-xs font-semibold text-gray-700 mt-0.5">{item.label}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{item.sampleSize.toLocaleString('tr-TR')} kullanıcı · 30 günlük aktiflik</div>
    </div>
  );
}

// ─── Anomaly row ──────────────────────────────────────────────────────────────

function AnomalyRow({ anomaly }: { anomaly: OnboardingInsights['anomalies'][number] }) {
  const up = anomaly.changePct > 0;
  const abs = Math.abs(anomaly.changePct);
  const sevColor = anomaly.severity === 'high' ? 'text-red-600' : 'text-amber-600';
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{anomaly.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 tabular-nums">{anomaly.previous} → {anomaly.current}</span>
        <span className={`text-xs font-bold ${sevColor} flex items-center gap-0.5`}>
          {up ? '↑' : '↓'}{abs}%
        </span>
      </div>
    </div>
  );
}

// ─── Event tracking summary ───────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  onboarding_started:       'Onboarding Başlatıldı',
  onboarding_step_completed:'Adım Tamamlandı',
  aha_moment_triggered:     'Farkındalık Anı',
  mentor_request_sent:      'Mentör Talebi',
  first_post_created:       'İlk Gönderi',
  first_event_joined:       'İlk Etkinlik',
  '7_day_return':           '7 Gün Sonra Dönüş',
  '30_day_return':          '30 Gün Sonra Dönüş',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ h }: { h: string }) {
  return <div className={`ins-shimmer rounded-xl ${h}`} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InsightsPanel({
  data,
  loading,
}: {
  data: OnboardingInsights | null;
  loading: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Sk h="h-28" />
        <div className="grid md:grid-cols-3 gap-3">{[0,1,2].map(i=><Sk key={i} h="h-20" />)}</div>
        <Sk h="h-48" />
        <div className="grid md:grid-cols-2 gap-4"><Sk h="h-56" /><Sk h="h-56" /></div>
      </div>
    );
  }

  const { insights, segmentFunnel, scoreDistribution, retentionCorrelations, anomalies, eventTracking, meta } = data;
  const maxAha = Math.max(...segmentFunnel.map(s => s.ahaPct), 1);

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Retention multiplier hero ── */}
      {meta.ahaRetentionMultiplier > 0 && (
        <div className="bg-gradient-to-r from-[#26496b] to-[#1e3a56] rounded-2xl p-5 text-white ins-slide mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">Farkındalık Anı Etkisi</div>
              <div className="text-4xl font-bold tabular-nums">
                {meta.ahaRetentionMultiplier}×
              </div>
              <div className="text-sm text-white/80 mt-1">
                Farkındalık Anı yaşayan kullanıcılar daha uzun kalıyor
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">{meta.ahaRetentionRate}%</div>
                <div className="text-[11px] text-white/60">Farkındalık Anı → 30g aktif</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white/50">{meta.nonAhaRetentionRate}%</div>
                <div className="text-[11px] text-white/60">Farkındalık Anı yok → 30g aktif</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Retention correlations ── */}
      {retentionCorrelations.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {retentionCorrelations.map((c, i) => (
            <RetentionCorrelationCard key={c.action} item={c} />
          ))}
        </div>
      )}

      {/* ── Insights ── */}
      {insights.length > 0 && (
        <Card
          title="Otomatik İçgörüler"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          accent="bg-[#26496b]/10 text-[#26496b]"
          className="mb-4"
        >
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} delay={i * 60} />
            ))}
          </div>
        </Card>
      )}

      {insights.length === 0 && (
        <Card title="Otomatik İçgörüler" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} accent="bg-gray-50 text-gray-500" className="mb-4">
          <EmptyState label="Şu an için içgörü üretilecek yeterli veri yok." />
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* ── Segment Funnel Table ── */}
        <Card
          title="Segment Bazlı Onboarding"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          accent="bg-indigo-50 text-indigo-600"
        >
          {segmentFunnel.length === 0 ? (
            <EmptyState label="Segment verisi yok" />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 font-semibold text-gray-500">Segment</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-500">Üye</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-500">Profil</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-500 w-36">Farkındalık Anı</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-500">30g Aktif</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentFunnel.map((seg) => (
                    <SegmentRow key={seg.key} seg={seg} maxAha={maxAha} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Score Distributions ── */}
        <Card
          title="Kullanıcı Skor Dağılımı"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          accent="bg-amber-50 text-amber-600"
        >
          <div className="space-y-5">
            <ScoreDist
              label="Onboarding Skoru"
              data={scoreDistribution.onboarding}
              colors={['bg-gray-300','bg-blue-300','bg-blue-500','bg-[#26496b]']}
            />
            <ScoreDist
              label="Katılım Skoru"
              data={scoreDistribution.engagement}
              colors={['bg-gray-300','bg-violet-300','bg-violet-500','bg-violet-700']}
            />
            <ScoreDist
              label="Topluluk Sağlık Skoru"
              data={scoreDistribution.communityHealth}
              colors={['bg-gray-300','bg-teal-300','bg-teal-500','bg-teal-700']}
            />
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ── Anomaly detection ── */}
        <Card
          title="Haftalık Anomali Tespiti"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          accent="bg-red-50 text-red-500"
        >
          {anomalies.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Son 7 günde belirgin anomali tespit edilmedi.
            </div>
          ) : (
            <div>
              {anomalies.map((a) => <AnomalyRow key={a.metric} anomaly={a} />)}
            </div>
          )}
        </Card>

        {/* ── Event tracking summary ── */}
        <Card
          title="Event Takip Özeti (Son 30 Gün)"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          accent="bg-violet-50 text-violet-600"
        >
          {Object.keys(eventTracking).length === 0 ? (
            <EmptyState label="Henüz event kaydedilmemiş. Frontend event firing aktif edilince burada görünecek." />
          ) : (
            <div className="space-y-2">
              {Object.entries(EVENT_LABELS).map(([key, label]) => {
                const count = eventTracking[key] ?? 0;
                const maxCount = Math.max(...Object.values(eventTracking), 1);
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-600 w-40 shrink-0 truncate">{label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full transition-all duration-700"
                        style={{ width: count > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 tabular-nums w-8 text-right">{count.toLocaleString('tr-TR')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
