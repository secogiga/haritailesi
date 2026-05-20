'use client';

import React, { useEffect, useRef, useState } from 'react';
import { type OnboardingMetrics } from '@/lib/api';
import { Card, EmptyState, SectionHeader } from './_shared';

// ─── Keyframes ────────────────────────────────────────────────────────────────

const STYLES = `
@keyframes ob-grow {
  from { width: 0%; }
  to   { width: var(--w); }
}
@keyframes ob-slide-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ob-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.ob-grow-bar {
  animation: ob-grow 0.7s cubic-bezier(.22,1,.36,1) both;
}
.ob-slide-up {
  animation: ob-slide-up 0.45s cubic-bezier(.22,1,.36,1) both;
}
.ob-shimmer {
  background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%);
  background-size: 800px 100%;
  animation: ob-shimmer 1.4s infinite linear;
}
`;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, enabled = true) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / 800, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, enabled]);
  return value;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`ob-shimmer rounded-lg ${className}`} />;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = 'bg-gray-50 text-gray-500' }: {
  label: string; value: number; sub?: string; accent?: string;
}) {
  const display = useCountUp(value);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ob-slide-up">
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium mb-3 ${accent}`}>
        {label}
      </div>
      <div className="text-3xl font-bold text-gray-900 tabular-nums">{display.toLocaleString('tr-TR')}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Funnel step ──────────────────────────────────────────────────────────────

function FunnelStep({ label, value, max, pct, color, delay = 0, isLast = false }: {
  label: string; value: number; max: number; pct: number;
  color: string; delay?: number; isLast?: boolean;
}) {
  const display = useCountUp(value);
  return (
    <div className="ob-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{pct}%</span>
          <span className="text-sm font-bold text-gray-900 tabular-nums w-14 text-right">
            {display.toLocaleString('tr-TR')}
          </span>
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ob-grow-bar ${color}`}
          style={{ '--w': `${pct}%`, width: `${pct}%` } as React.CSSProperties}
        />
      </div>
      {!isLast && (
        <div className="flex justify-end mt-1 pr-1">
          <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Aha breakdown row ────────────────────────────────────────────────────────

function AhaRow({ label, value, max, icon, iconColor, barColor }: {
  label: string; value: number; max: number; icon: React.ReactNode;
  iconColor: string; barColor: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const display = useCountUp(value);
  return (
    <div className="flex items-center gap-3 ob-slide-up">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 truncate">{label}</span>
          <span className="text-xs font-bold text-gray-900 tabular-nums ml-2 shrink-0">
            {display.toLocaleString('tr-TR')}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ob-grow-bar ${barColor}`}
            style={{ '--w': `${pct}%`, width: `${pct}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Drop-off pill ────────────────────────────────────────────────────────────

function DropoffRow({ label, value, severity }: { label: string; value: number; severity: 'low' | 'mid' | 'high' }) {
  const display = useCountUp(value);
  const cfg = {
    low:  { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700' },
    mid:  { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700' },
    high: { bar: 'bg-red-400',     badge: 'bg-red-50 text-red-700' },
  }[severity];
  return (
    <div className="flex items-center gap-3 ob-slide-up">
      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.bar}`} />
      <span className="flex-1 text-sm text-gray-700">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
        {display.toLocaleString('tr-TR')} kişi
      </span>
    </div>
  );
}

// ─── Retention table ──────────────────────────────────────────────────────────

function RetentionTable({ data }: { data: OnboardingMetrics['retentionByMonth'] }) {
  if (!data.length) return <EmptyState label="Henüz yeterli veri yok" />;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-2 font-semibold text-gray-500 w-20">Ay</th>
            <th className="text-right py-2 px-2 font-semibold text-gray-500">Cohort</th>
            <th className="text-right py-2 px-2 font-semibold text-gray-500">Kaldı</th>
            <th className="text-left py-2 px-2 font-semibold text-gray-500 w-32">Oran</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const color = row.rate >= 60 ? 'bg-emerald-500'
              : row.rate >= 30 ? 'bg-amber-400'
              : 'bg-red-400';
            return (
              <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-2 px-2 font-mono text-gray-600">{row.month}</td>
                <td className="py-2 px-2 text-right tabular-nums text-gray-600">{row.cohortSize.toLocaleString('tr-TR')}</td>
                <td className="py-2 px-2 text-right tabular-nums font-semibold text-gray-800">{row.retained.toLocaleString('tr-TR')}</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${row.rate}%` }} />
                    </div>
                    <span className="w-8 text-right font-bold text-gray-700">{row.rate}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingIstatistikleri({
  data,
  loading,
}: {
  data: OnboardingMetrics | null;
  loading: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const { funnel, ahaBreakdown, avgDaysToAha, dropoffByStep, retentionByMonth } = data;
  const funnelMax = funnel.applied || 1;
  const ahaMax = Math.max(ahaBreakdown.firstEventAttended, ahaBreakdown.firstMentorMatch, ahaBreakdown.firstPostCreated, ahaBreakdown.firstProjectShared, 1);

  const dropoffSeverity = (val: number, ref: number): 'low' | 'mid' | 'high' =>
    ref === 0 ? 'low' : val / ref < 0.1 ? 'low' : val / ref < 0.4 ? 'mid' : 'high';

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Özet stat kartları ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatCard label="Başvuran" value={funnel.applied} accent="bg-gray-100 text-gray-600" />
        <StatCard label="Onaylanan" value={funnel.approved} accent="bg-blue-50 text-blue-700"
          {...(funnel.applied ? { sub: `%${Math.round(funnel.approved / funnel.applied * 100)} dönüşüm` } : {})} />
        <StatCard label="Aktive Eden" value={funnel.activated} accent="bg-indigo-50 text-indigo-700"
          {...(funnel.approved ? { sub: `%${Math.round(funnel.activated / funnel.approved * 100)} dönüşüm` } : {})} />
        <StatCard label="Profil Tam" value={funnel.profileComplete} accent="bg-violet-50 text-violet-700"
          {...(funnel.activated ? { sub: `%${Math.round(funnel.profileComplete / funnel.activated * 100)} dönüşüm` } : {})} />
        <StatCard label="Aha Anı" value={funnel.ahaMoment} accent="bg-amber-50 text-amber-700"
          {...(funnel.profileComplete ? { sub: `%${Math.round(funnel.ahaMoment / funnel.profileComplete * 100)} dönüşüm` } : {})} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* ── Onboarding Funnel ── */}
        <Card
          title="Onboarding Funnel"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4h18l-7 9v6l-4-2V13L3 4z" />
            </svg>
          }
          accent="bg-[#26496b]/10 text-[#26496b]"
        >
          <div className="space-y-3">
            {[
              { label: 'Başvuran',      value: funnel.applied,        color: 'bg-gray-400' },
              { label: 'Onaylanan',     value: funnel.approved,       color: 'bg-blue-400' },
              { label: 'Aktive Eden',   value: funnel.activated,      color: 'bg-indigo-500' },
              { label: 'Profil Tamamlayan', value: funnel.profileComplete, color: 'bg-violet-500' },
              { label: 'Aha Anı Yaşayan', value: funnel.ahaMoment,   color: 'bg-amber-500' },
            ].map((step, i, arr) => (
              <FunnelStep
                key={step.label}
                label={step.label}
                value={step.value}
                max={funnelMax}
                pct={funnelMax > 0 ? Math.round(step.value / funnelMax * 100) : 0}
                color={step.color}
                delay={i * 80}
                isLast={i === arr.length - 1}
              />
            ))}
          </div>
        </Card>

        {/* ── Aha Anı Dağılımı ── */}
        <Card
          title="Aha Anı Dağılımı"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          accent="bg-amber-50 text-amber-600"
        >
          <div className="space-y-4">
            <AhaRow
              label="İlk Etkinliğe Katıldı"
              value={ahaBreakdown.firstEventAttended}
              max={ahaMax}
              iconColor="bg-blue-50 text-blue-500"
              barColor="bg-blue-400"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <AhaRow
              label="İlk Mentör Eşleşmesi"
              value={ahaBreakdown.firstMentorMatch}
              max={ahaMax}
              iconColor="bg-teal-50 text-teal-500"
              barColor="bg-teal-400"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              }
            />
            <AhaRow
              label="İlk Gönderiyi Oluşturdu"
              value={ahaBreakdown.firstPostCreated}
              max={ahaMax}
              iconColor="bg-violet-50 text-violet-500"
              barColor="bg-violet-400"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            />
            <AhaRow
              label="İçerik Talebi Oluşturdu"
              value={ahaBreakdown.firstProjectShared}
              max={ahaMax}
              iconColor="bg-green-50 text-green-500"
              barColor="bg-green-400"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>

          {/* Avg days to aha */}
          <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">Ort. Aha Anı Süresi</span>
            <span className="text-sm font-bold text-amber-600">
              {avgDaysToAha > 0 ? `${avgDaysToAha} gün` : '— gün'}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ── Drop-off Analizi ── */}
        <Card
          title="Adım Bazı Kayıp Analizi"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
          accent="bg-red-50 text-red-500"
        >
          <SectionHeader label="Her adımda kaç kişi düşüyor" />
          <div className="space-y-3">
            <DropoffRow
              label="Onaylandı ama aktive etmedi"
              value={dropoffByStep.afterApproval}
              severity={dropoffSeverity(dropoffByStep.afterApproval, funnel.approved)}
            />
            <DropoffRow
              label="Aktive etti ama profilini doldurmadı"
              value={dropoffByStep.afterActivation}
              severity={dropoffSeverity(dropoffByStep.afterActivation, funnel.activated)}
            />
            <DropoffRow
              label="Profili tam ama aha yaşamadı"
              value={dropoffByStep.afterProfile}
              severity={dropoffSeverity(dropoffByStep.afterProfile, funnel.profileComplete)}
            />
          </div>

          {/* Conversion context */}
          <div className="mt-5 pt-4 border-t border-gray-50">
            <div className="text-[11px] text-gray-400 leading-relaxed">
              <strong className="text-gray-600">Başvuru → Aha Anı</strong> dönüşümü:{' '}
              <strong className="text-[#26496b]">
                {funnel.applied > 0
                  ? `%${Math.round(funnel.ahaMoment / funnel.applied * 100)}`
                  : '—'}
              </strong>
              {' '}· {funnel.ahaMoment.toLocaleString('tr-TR')} kişi tam döngüyü tamamladı.
            </div>
          </div>
        </Card>

        {/* ── Aylık Retention ── */}
        <Card
          title="Aylık Cohort Retention"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          accent="bg-indigo-50 text-indigo-600"
        >
          <SectionHeader label="Katılım ayına göre geri dönüş oranı" />
          <RetentionTable data={retentionByMonth} />
        </Card>
      </div>
    </>
  );
}
