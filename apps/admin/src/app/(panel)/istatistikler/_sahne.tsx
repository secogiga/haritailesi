import React from 'react';
import Link from 'next/link';
import type { SahneStats } from '@/lib/api';
import { Card, BarRow, EmptyState } from './_shared';

// ─── Label Maps ───────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  webinar: 'Webinar', workshop: 'Atölye', seminar: 'Seminer',
  conference: 'Konferans', field_trip: 'Arazi', meetup: 'Buluşma', other: 'Diğer',
};
const FORMAT_LABELS: Record<string, string> = {
  online: 'Online', in_person: 'Yüz Yüze', hybrid: 'Hibrit',
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri', all: 'Herkese',
};
const EXAM_KEY_LABELS: Record<string, string> = {
  tkgm: 'TKGM', hasen: 'HASEn', uzmanlik: 'Uzmanlık', yuksek_lisans: 'Y.Lisans', other: 'Diğer',
};
const TYPE_COLORS: Record<string, { bg: string; text: string; bar: string; icon: string }> = {
  event:         { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-500',   icon: '📅' },
  training:      { bg: 'bg-teal-50',   text: 'text-teal-700',   bar: 'bg-teal-500',   icon: '🎓' },
  competition:   { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500', icon: '🏆' },
  survey:        { bg: 'bg-rose-50',   text: 'text-rose-700',   bar: 'bg-rose-500',   icon: '📊' },
  exam_resource: { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: 'bg-indigo-500', icon: '📚' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ value, label, sub, accent, icon }: {
  value: string | number; label: string; sub?: React.ReactNode; accent: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 tabular-nums">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="mt-2">{sub}</div>}
    </div>
  );
}

function ContentTable({ rows, totalViews }: { rows: SahneStats['contentTable']; totalViews: number }) {
  if (!rows.length) return <EmptyState label="Henüz içerik yok" />;
  const maxViews = Math.max(...rows.map(r => r.views), 1);
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pl-5 pr-3 py-2.5 text-left font-semibold text-gray-500">İçerik Türü</th>
            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 w-16">Adet</th>
            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 w-24">Görüntülenme</th>
            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 w-20">Ort. G/İ</th>
            <th className="pl-3 pr-5 py-2.5 text-left font-semibold text-gray-500">Pay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cfg = TYPE_COLORS[row.type] ?? { bg: 'bg-gray-50', text: 'text-gray-600', bar: 'bg-gray-400', icon: '•' };
            const avg = row.count > 0 ? Math.round(row.views / row.count) : 0;
            const sharePct = totalViews > 0 ? Math.round((row.views / totalViews) * 100) : 0;
            const barWidth = Math.round((row.views / maxViews) * 100);
            return (
              <tr key={row.type} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="pl-5 pr-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{cfg.icon}</span>
                    <div className="font-medium text-gray-800">{row.label}</div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-gray-700">{row.count}</td>
                <td className="px-3 py-3 text-right font-semibold text-gray-900">{row.views.toLocaleString('tr-TR')}</td>
                <td className="px-3 py-3 text-right text-gray-600">{avg.toLocaleString('tr-TR')}</td>
                <td className="pl-3 pr-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[40px]">
                      <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${barWidth}%` }} />
                    </div>
                    <span className="text-gray-400 w-7 text-right">%{sharePct}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-100">
            <td className="pl-5 pr-3 py-3 font-bold text-gray-700 text-xs">Toplam</td>
            <td className="px-3 py-3 text-right font-bold text-gray-700">{rows.reduce((s, r) => s + r.count, 0)}</td>
            <td className="px-3 py-3 text-right font-bold text-gray-900">{totalViews.toLocaleString('tr-TR')}</td>
            <td className="px-3 py-3 text-right text-gray-500">{rows.reduce((s, r) => s + r.count, 0) > 0 ? Math.round(totalViews / rows.reduce((s, r) => s + r.count, 0)) : 0}</td>
            <td className="pl-3 pr-5 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function DonutArc({ pct, color }: { pct: number; color: string }) {
  const r = 20, cx = 24, cy = 24, circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <svg width={48} height={48} className="shrink-0 rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={7} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
    </svg>
  );
}

function MiniStatPair({ a, b }: { a: { label: string; value: number; color?: string }; b: { label: string; value: number; color?: string } }) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
        <div className={`text-xl font-bold tabular-nums ${a.color ?? 'text-gray-900'}`}>{a.value.toLocaleString('tr-TR')}</div>
        <div className="text-[11px] text-gray-500 mt-0.5">{a.label}</div>
      </div>
      <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
        <div className={`text-xl font-bold tabular-nums ${b.color ?? 'text-gray-900'}`}>{b.value.toLocaleString('tr-TR')}</div>
        <div className="text-[11px] text-gray-500 mt-0.5">{b.label}</div>
      </div>
    </div>
  );
}

function StatusPill({ label, color }: { label: string; color: 'green' | 'amber' | 'gray' | 'red' }) {
  const cls = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray:  'bg-gray-100 text-gray-500 border-gray-200',
    red:   'bg-red-50 text-red-600 border-red-200',
  }[color];
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

// ─── Main Tab Component ───────────────────────────────────────────────────────

export default function SahneIstatistikleri({
  stats,
  loading,
}: {
  stats: SahneStats | null;
  loading: boolean;
}) {
  if (loading && !stats) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36" />)}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 h-52" />
    </div>
  );
  if (!stats) return null;

  const { summary, events, trainings, competitions, surveys, examResources, qa, contentTable } = stats;
  const topViewedType = contentTable[0];
  const answerRatio = qa.publishedQuestions > 0 ? qa.publishedAnswers / qa.publishedQuestions : 0;

  return (
    <div className="space-y-5">

      {/* Q&A Uyarısı */}
      {qa.pendingQuestions > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-amber-700">{qa.pendingQuestions} soru cevap bekliyor</span>
          <Link href="/sorular" className="ml-auto text-[11px] text-amber-700 font-medium hover:underline">Soruları İncele →</Link>
        </div>
      )}

      {/* KPI Hero */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard value={summary.totalViews} label="Toplam Görüntülenme" accent="bg-blue-50 text-blue-600"
          sub={topViewedType && <span className="text-[11px] text-gray-400">En çok: <strong className="text-gray-600">{topViewedType.label}</strong></span>}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
        <KpiCard value={summary.totalPublished} label="Yayında İçerik" accent="bg-emerald-50 text-emerald-600"
          sub={<span className="text-[11px] text-gray-400">{contentTable.reduce((s, r) => s + r.count, 0)} toplam içerik</span>}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard value={events.upcoming} label="Yaklaşan Etkinlik" accent="bg-violet-50 text-violet-600"
          sub={<span className="text-[11px] text-gray-400">{events.past} tamamlandı</span>}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <KpiCard value={summary.avgViewsPerContent} label="Ort. Görüntülenme/İçerik" accent="bg-teal-50 text-teal-600"
          sub={<span className="text-[11px] text-gray-400">{qa.publishedQuestions} yanıtlı soru</span>}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      {/* İçerik Performans Tablosu */}
      <Card title="İçerik Performans Tablosu" accent="bg-[#26496b] text-white"
        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 6h4M10 18h4" /></svg>}>
        <ContentTable rows={contentTable.filter(r => r.type !== 'project')} totalViews={summary.totalViews} />
      </Card>

      {/* Etkinlikler + Eğitimler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Etkinlikler" accent="bg-blue-50 text-blue-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
          <div className="mb-4">
            <MiniStatPair a={{ label: 'Toplam Etkinlik', value: events.total }} b={{ label: 'Yayında', value: events.published, color: 'text-emerald-700' }} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            {[
              { val: events.upcoming, label: 'yaklaşan', sub: 'etkinlik', cls: 'bg-violet-50 border-violet-100 text-violet-700' },
              { val: events.past,     label: 'tamamlanan', sub: 'etkinlik', cls: 'bg-gray-50 border-gray-200 text-gray-600' },
              { val: events.totalViews, label: 'toplam', sub: 'görüntülenme', cls: 'bg-blue-50 border-blue-100 text-blue-700' },
            ].map(item => (
              <div key={item.label} className={`flex-1 flex items-center gap-2 border rounded-xl px-3 py-2.5 ${item.cls}`}>
                <div className="text-xl font-bold tabular-nums">{item.val.toLocaleString('tr-TR')}</div>
                <div className="text-[11px] leading-tight">{item.label}<br />{item.sub}</div>
              </div>
            ))}
          </div>
          {events.byType.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-gray-500 mb-2">Türe göre dağılım</div>
              {events.byType.map(r => (
                <BarRow key={r.type} label={EVENT_TYPE_LABELS[r.type] ?? r.type} count={r.views}
                  max={Math.max(...events.byType.map(x => x.views), 1)} color="bg-blue-400"
                  extra={<span className="text-[10px] text-gray-400 w-8 text-right">{r.count} adet</span>} />
              ))}
            </div>
          ) : <EmptyState label="Etkinlik türü verisi yok" />}
        </Card>

        <Card title="Eğitimler" accent="bg-teal-50 text-teal-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 7l9-5-9-5-9 5 9 5z" /></svg>}>
          <div className="mb-4">
            <MiniStatPair a={{ label: 'Toplam Eğitim', value: trainings.total }} b={{ label: 'Görüntülenme', value: trainings.totalViews, color: 'text-teal-700' }} />
          </div>
          {trainings.byFormat.length > 0 ? (
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-gray-500 mb-2">Formata göre</div>
              <div className="space-y-2">
                {trainings.byFormat.map(r => (
                  <BarRow key={r.format} label={FORMAT_LABELS[r.format] ?? r.format} count={r.views}
                    max={Math.max(...trainings.byFormat.map(x => x.views), 1)} color="bg-teal-500"
                    extra={<span className="text-[10px] text-gray-400 w-8 text-right">{r.count}</span>} />
                ))}
              </div>
            </div>
          ) : <EmptyState label="Eğitim verisi yok" />}
          {trainings.byLevel.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-gray-500 mb-2">Seviyeye göre</div>
              <div className="space-y-2">
                {trainings.byLevel.map(r => (
                  <BarRow key={r.level} label={LEVEL_LABELS[r.level] ?? r.level} count={r.count}
                    max={Math.max(...trainings.byLevel.map(x => x.count), 1)} color="bg-teal-300" />
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Yarışmalar + Anketler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Yarışmalar" accent="bg-orange-50 text-orange-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-end gap-2 mb-2">
                <div className="text-3xl font-bold text-gray-900 tabular-nums">{competitions.total}</div>
                <div className="text-sm text-gray-400 pb-0.5">yarışma</div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-gray-600">{competitions.active} aktif</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300" /><span className="text-gray-400">{competitions.ended} tamamlandı</span></div>
              </div>
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: competitions.total > 0 ? `${Math.round((competitions.active / competitions.total) * 100)}%` : '0%' }} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-orange-600 tabular-nums">{competitions.totalViews.toLocaleString('tr-TR')}</div>
              <div className="text-[11px] text-gray-400">görüntülenme</div>
            </div>
          </div>
        </Card>

        <Card title="Anketler" accent="bg-rose-50 text-rose-600"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: 'Toplam', value: surveys.total, color: 'text-gray-900' }, { label: 'Aktif', value: surveys.active, color: 'text-rose-700' }, { label: 'Yanıt', value: surveys.totalResponses, color: 'text-rose-600' }].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <div className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value.toLocaleString('tr-TR')}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
          {surveys.active > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
              <span className="text-[11px] text-rose-700 font-medium">{surveys.active} anket yanıt topluyor</span>
              <Link href="/anketler" className="ml-auto text-[10px] text-rose-600 hover:underline">Görüntüle →</Link>
            </div>
          )}
        </Card>
      </div>

      {/* Sınav Kaynakları */}
      <Card title="Sınav Kaynakları" accent="bg-indigo-50 text-indigo-600"
        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div>
            <MiniStatPair a={{ label: 'Toplam Kaynak', value: examResources.total }} b={{ label: 'Yayında', value: examResources.published, color: 'text-indigo-700' }} />
            <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-indigo-700 tabular-nums">{examResources.totalViews.toLocaleString('tr-TR')}</div>
              <div className="text-[11px] text-indigo-500 mt-0.5">toplam görüntülenme</div>
            </div>
          </div>
          {examResources.byKey.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold text-gray-500 mb-3">Sınava göre görüntülenme</div>
              <div className="space-y-2">
                {examResources.byKey.map(r => (
                  <BarRow key={r.examKey} label={EXAM_KEY_LABELS[r.examKey] ?? r.examKey} count={r.views}
                    max={Math.max(...examResources.byKey.map(x => x.views), 1)} color="bg-indigo-500"
                    extra={<span className="text-[10px] text-gray-400 w-8 text-right">{r.count} kaynak</span>} />
                ))}
              </div>
            </div>
          ) : <EmptyState label="Sınav kaynağı henüz yok" />}
        </div>
      </Card>

      {/* Soru & Cevap */}
      <Card title="Soru & Cevap" accent="bg-[#66aca9] text-white"
        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-3 gap-3">
            {[
              { label: 'Yayında Soru', value: qa.publishedQuestions, icon: '✅', color: 'bg-emerald-50 border-emerald-100', textColor: 'text-emerald-700' },
              { label: 'Yanıt Sayısı', value: qa.publishedAnswers, icon: '💬', color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-700' },
              { label: 'Bekleyen', value: qa.pendingQuestions, icon: '⏳', color: qa.pendingQuestions > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200', textColor: qa.pendingQuestions > 0 ? 'text-amber-700' : 'text-gray-500' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl border p-4 text-center ${item.color}`}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className={`text-2xl font-bold tabular-nums ${item.textColor}`}>{item.value.toLocaleString('tr-TR')}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 p-4 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-gray-500 mb-2">Yanıt / Soru Oranı</div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-gray-900 tabular-nums">{qa.publishedQuestions > 0 ? answerRatio.toFixed(1) : '—'}</span>
                <span className="text-sm text-gray-400 pb-1">yanıt/soru</span>
              </div>
              <div className="mt-2">
                <StatusPill
                  label={qa.publishedQuestions === 0 ? 'Veri yok' : answerRatio >= 2 ? 'Sağlıklı' : answerRatio >= 1 ? 'İyi' : 'Düşük'}
                  color={qa.publishedQuestions === 0 ? 'gray' : answerRatio >= 2 ? 'green' : answerRatio >= 1 ? 'amber' : 'red'}
                />
              </div>
            </div>
            <Link href="/sorular"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#26496b]/20 bg-[#26496b]/5 hover:bg-[#26496b]/10 px-3 py-2.5 text-xs font-semibold text-[#26496b] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              Soruları Yönet
            </Link>
          </div>
        </div>
      </Card>

    </div>
  );
}
