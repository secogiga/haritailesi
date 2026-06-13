'use client';

import React from 'react';
import type { SenNeDersinStats } from '@/lib/api';
import { Card, BarRow, EmptyState } from './_shared';

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif', draft: 'Taslak', ended: 'Bitti', archived: 'Arşiv',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500', draft: 'bg-gray-300', ended: 'bg-blue-400', archived: 'bg-gray-200',
};

function KpiCard({
  value, label, sub, accent, icon,
}: {
  value: string | number; label: string; sub?: React.ReactNode; accent: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="mt-2">{sub}</div>}
    </div>
  );
}

function DailyChart({ data }: { data: SenNeDersinStats['dailyResponses'] }) {
  if (!data.length) return <EmptyState label="Son 30 günde yanıt yok" />;

  const max = Math.max(...data.map((d) => d.count), 1);
  const H = 80;

  // Fill missing days
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 86400_000);
  const days: { day: string; count: number }[] = [];
  const dataMap = new Map(data.map((d) => [d.day, d.count]));
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, count: dataMap.get(key) ?? 0 });
  }

  const barW = 7;
  const gap = 2;
  const total = days.length;
  const svgW = total * (barW + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg width={svgW} height={H + 20} className="min-w-full">
        {days.map((d, i) => {
          const bh = max > 0 ? Math.round((d.count / max) * H) : 0;
          const x = i * (barW + gap);
          const y = H - bh;
          const isFirst = i === 0 || days[i - 1]!.day.slice(8, 10) === '01' || d.day.slice(8, 10) === '01';
          return (
            <g key={d.day}>
              <rect
                x={x} y={y} width={barW} height={bh}
                rx={2}
                className={d.count > 0 ? 'fill-[#26496b]' : 'fill-gray-100'}
                opacity={d.count > 0 ? 0.85 : 1}
              />
              {isFirst && (
                <text
                  x={x + barW / 2} y={H + 14}
                  textAnchor="middle"
                  className="fill-gray-400"
                  style={{ fontSize: 8 }}
                >
                  {d.day.slice(5, 10)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>30 gün önce</span>
        <span>Bugün</span>
      </div>
    </div>
  );
}

function TopContentTable({ rows }: { rows: SenNeDersinStats['topContent'] }) {
  if (!rows.length) return <EmptyState label="Henüz içerik yok" />;
  const maxCount = Math.max(...rows.map((r) => r.responseCount), 1);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.id} className="flex items-center gap-3">
          <span className="w-5 text-center text-xs font-bold text-gray-300">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                r.type === 'test' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {r.type === 'test' ? 'Test' : 'Anket'}
              </span>
              <span className="text-xs text-gray-700 truncate font-medium">{r.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#26496b]"
                  style={{ width: `${Math.round((r.responseCount / maxCount) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600 tabular-nums w-12 text-right">
                {r.responseCount.toLocaleString('tr-TR')} yanıt
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SenNeDersinIstatistikleri({
  data,
  loading,
}: {
  data: SenNeDersinStats | null;
  loading: boolean;
}) {
  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return <EmptyState label="Veri yüklenemedi" />;

  const { summary, topContent, dailyResponses, byStatus } = data;

  const activeCount = (byStatus['active'] ?? 0);
  const draftCount = (byStatus['draft'] ?? 0);
  const endedCount = (byStatus['ended'] ?? 0);
  const statusMax = Math.max(activeCount, draftCount, endedCount, 1);

  return (
    <div className="space-y-5">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          value={summary.totalSurveys + summary.totalTests}
          label="Toplam İçerik"
          accent="bg-rose-50 text-rose-600"
          sub={
            <div className="flex gap-2 text-xs text-gray-400">
              <span className="text-rose-600 font-medium">{summary.totalTests} test</span>
              <span>·</span>
              <span>{summary.totalSurveys} anket</span>
            </div>
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KpiCard
          value={summary.totalResponses}
          label="Toplam Yanıt"
          accent="bg-blue-50 text-blue-600"
          sub={
            <div className="text-xs text-gray-400">
              <span className="text-blue-600 font-medium">+{summary.responsesThisMonth}</span> bu ay
            </div>
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          }
        />
        <KpiCard
          value={summary.responsesThisMonth}
          label="Bu Ay Katılım"
          accent="bg-emerald-50 text-emerald-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KpiCard
          value={summary.testPassRate !== null ? `%${summary.testPassRate}` : '—'}
          label="Test Geçme Oranı"
          accent="bg-amber-50 text-amber-600"
          sub={
            summary.testAttempts > 0
              ? <div className="text-xs text-gray-400">{summary.testAttempts.toLocaleString('tr-TR')} deneme</div>
              : undefined
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Daily responses chart */}
        <Card
          title="Son 30 Gün — Günlük Yanıt"
          accent="bg-blue-50 text-blue-600"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          }
        >
          <DailyChart data={dailyResponses} />
        </Card>

        {/* Status distribution */}
        <Card
          title="Durum Dağılımı"
          accent="bg-gray-50 text-gray-500"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        >
          <div className="space-y-3">
            {Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, cnt]) => (
              <BarRow
                key={status}
                label={STATUS_LABELS[status] ?? status}
                count={cnt}
                max={statusMax}
                color={STATUS_COLORS[status] ?? 'bg-gray-300'}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* ── Top Content ── */}
      <Card
        title="En Çok Yanıtlanan İçerikler (Top 5)"
        accent="bg-rose-50 text-rose-600"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        }
      >
        <TopContentTable rows={topContent} />
      </Card>

    </div>
  );
}
