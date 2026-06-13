'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TurkeyMap, { type MemberCityStat } from '@/components/TurkeyMap';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface SectorReport {
  year: number;
  totalResponses: number;
  avgScore: number | null;
  monthlyTrend: { month: string; count: number }[];
  profBreakdown: { profession: string; count: number; avgScore: number }[];
  cityBreakdown: { city: string; count: number }[];
  topSurveys: { title: string; count: number }[];
}

const MONTH_COLORS = [
  '#0ea5e9','#38bdf8','#7dd3fc','#0284c7','#0369a1','#0c4a6e',
  '#0ea5e9','#38bdf8','#7dd3fc','#0284c7','#0369a1','#0c4a6e',
];

const EXAMPLE_REPORT: SectorReport = {
  year: 2026,
  totalResponses: 1243,
  avgScore: 68,
  monthlyTrend: [
    { month: 'Oca', count: 74 }, { month: 'Şub', count: 91 }, { month: 'Mar', count: 118 },
    { month: 'Nis', count: 143 }, { month: 'May', count: 167 }, { month: 'Haz', count: 134 },
    { month: 'Tem', count: 89 }, { month: 'Ağu', count: 72 }, { month: 'Eyl', count: 108 },
    { month: 'Eki', count: 124 }, { month: 'Kas', count: 83 }, { month: 'Ara', count: 40 },
  ],
  profBreakdown: [
    { profession: 'Harita Mühendisi', count: 412, avgScore: 71 },
    { profession: 'Kadastro Teknikeri', count: 287, avgScore: 64 },
    { profession: 'CBS Uzmanı', count: 198, avgScore: 76 },
    { profession: 'Fotogrametri Uzmanı', count: 143, avgScore: 69 },
    { profession: 'Uzaktan Algılama', count: 98, avgScore: 72 },
    { profession: 'Öğrenci', count: 105, avgScore: 58 },
  ],
  cityBreakdown: [
    { city: 'Ankara', count: 234 }, { city: 'İstanbul', count: 198 }, { city: 'İzmir', count: 112 },
    { city: 'Konya', count: 87 }, { city: 'Trabzon', count: 74 }, { city: 'Bursa', count: 68 },
    { city: 'Adana', count: 54 }, { city: 'Samsun', count: 49 }, { city: 'Eskişehir', count: 43 },
    { city: 'Kayseri', count: 38 },
  ],
  topSurveys: [
    { title: 'Mesleğin Geleceği Araştırması 2026', count: 387 },
    { title: 'CBS Yeterlilik Testi 2026', count: 312 },
    { title: 'Sektörde Uzaktan Çalışma Anketi', count: 278 },
    { title: 'Drone ve Fotogrametri Testi', count: 189 },
    { title: 'Sektör Teknoloji Benimseme Anketi', count: 77 },
  ],
};

export default function SektorRaporuPage() {
  const [report, setReport] = useState<SectorReport | null>(null);
  const [isExample, setIsExample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/v1/surveys/sector-report?year=${year}`)
      .then(r => r.ok ? r.json() as Promise<SectorReport> : null)
      .then(data => {
        if (data && (data as SectorReport).totalResponses > 0) {
          setReport(data as SectorReport); setIsExample(false);
        } else {
          setReport(EXAMPLE_REPORT); setIsExample(true);
        }
      })
      .catch(() => { setReport(EXAMPLE_REPORT); setIsExample(true); })
      .finally(() => setLoading(false));
  }, [year]);

  const maxMonthly = Math.max(...(report?.monthlyTrend.map(m => m.count) ?? [1]), 1);
  const maxProf    = Math.max(...(report?.profBreakdown.map(p => p.count) ?? [1]), 1);
  const cityStats: MemberCityStat[] = report?.cityBreakdown.map(c => ({ city: c.city, count: c.count })) ?? [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-[#0c1a2e] pt-14 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Link href="/sen-ne-dersin" className="hover:text-gray-300 transition-colors">Sen Ne Dersin?</Link>
              <span>/</span>
              <span className="text-gray-300">Sektör Raporu</span>
            </div>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Harita Sektörü</h1>
                <p className="text-sky-400 font-semibold text-lg">Sektör Raporu {year}</p>
                <p className="text-gray-400 text-sm mt-1.5 max-w-lg">
                  Platform genelindeki test ve anket katılımlarından derlenen yıllık veri özeti.
                </p>
                {isExample && (
                  <span className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Örnek veri — gerçek katılımlar arttıkça güncellenir
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setYear(y => y - 1)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-white font-bold text-lg w-16 text-center">{year}</span>
                <button onClick={() => setYear(y => Math.min(y + 1, new Date().getFullYear()))} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-10">
          {loading ? (
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
              ))}
            </div>
          ) : report === null ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">Veri bulunamadı.</div>
          ) : (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-4xl font-black text-[#26496b]">{report.totalResponses.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">Toplam Katılım</p>
                </div>
                {report.avgScore !== null && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                    <p className="text-4xl font-black text-emerald-600">%{report.avgScore}</p>
                    <p className="text-xs text-gray-500 mt-1.5 font-medium">Ortalama Test Skoru</p>
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-4xl font-black text-violet-600">{report.cityBreakdown.length}</p>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">Şehirden Katılım</p>
                </div>
              </div>

              {/* Monthly trend */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-sm mb-5">Aylık Katılım Trendi</h2>
                <div className="flex items-end gap-1.5" style={{ height: 96 }}>
                  {report.monthlyTrend.map((m, i) => {
                    const barH = maxMonthly > 0 ? Math.max(Math.round((m.count / maxMonthly) * 72), 4) : 4;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity leading-none">{m.count}</span>
                        <div className="w-full rounded-t-md transition-all duration-500" style={{ height: barH, backgroundColor: MONTH_COLORS[i] ?? '#0ea5e9' }} />
                        <span className="text-[10px] text-gray-400 leading-none">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Profession breakdown */}
              {report.profBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 text-sm mb-5">Mesleğe Göre Katılım</h2>
                  <div className="space-y-3">
                    {report.profBreakdown.map(row => (
                      <div key={row.profession} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-40 shrink-0 truncate">{row.profession}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${Math.round((row.count / maxProf) * 100)}%`, backgroundColor: '#26496b' }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right shrink-0">{row.count}</span>
                        {row.avgScore > 0 && (
                          <span className="text-xs text-emerald-600 font-semibold w-14 text-right shrink-0">~%{row.avgScore}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Turkey map */}
              {cityStats.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 text-sm mb-4">Coğrafi Dağılım</h2>
                  <TurkeyMap members={cityStats} />
                </div>
              )}

              {/* Top surveys */}
              {report.topSurveys.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 text-sm mb-4">En Çok Katılım Alan İçerikler</h2>
                  <div className="space-y-2">
                    {report.topSurveys.map((s, i) => (
                      <div key={s.title} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className="text-lg font-black text-gray-200 w-6 text-center">{i + 1}</span>
                        <p className="flex-1 text-sm text-gray-800 font-medium">{s.title}</p>
                        <span className="text-xs font-bold text-[#26496b] bg-[#26496b]/10 px-2.5 py-1 rounded-full">{s.count} katılım</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
