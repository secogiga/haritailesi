'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface TopicStat {
  topic: string;
  correct: number;
  total: number;
  percent: number;
  level: 'strong' | 'medium' | 'weak';
}

interface Analysis {
  topics: TopicStat[];
  totalTests: number;
  totalQuestions: number;
  totalPassed: number;
}

const LEVEL_CONFIG = {
  strong: { label: 'Güçlü',     bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  medium: { label: 'Gelişiyor', bg: 'bg-amber-400',   light: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
  weak:   { label: 'Zayıf',     bg: 'bg-red-500',     light: 'bg-red-50 border-red-200',          text: 'text-red-700',     badge: 'bg-red-100 text-red-700' },
};

// Konu rozetleri — 16 HARITA_TOPICS
const TOPIC_BADGES: Record<string, string> = {
  'CBS': '🗺️', 'GNSS': '📡', 'Fotogrametri': '📷', 'Kadastro': '📐',
  'İmar': '🏗️', 'Kamulaştırma': '⚖️', 'Harita Okuma': '🗾', 'Uzaktan Algılama': '🛰️',
  'Mühendislik Ölçmeleri': '📏', 'Hidrografi': '🌊', 'Jeodezi': '🌍', 'Kartografya': '🖊️',
  'Arazi Yönetimi': '🌾', 'Kentsel Dönüşüm': '🏙️', 'Coğrafi Veri': '💾', 'Koordinat Sistemleri': '🔢',
};

// Başarım milestone'ları
const MILESTONES = [
  { id: 'first_test',  icon: '🎯', label: 'İlk Test',       desc: 'İlk testini tamamladın',        check: (d: Analysis) => d.totalTests >= 1 },
  { id: 'tests_5',     icon: '📚', label: '5 Test',          desc: '5 test tamamladın',             check: (d: Analysis) => d.totalTests >= 5 },
  { id: 'tests_10',    icon: '🏆', label: '10 Test',         desc: '10 test tamamladın',            check: (d: Analysis) => d.totalTests >= 10 },
  { id: 'tests_25',    icon: '🔥', label: '25 Test',         desc: '25 test tamamladın',            check: (d: Analysis) => d.totalTests >= 25 },
  { id: 'q50',         icon: '🧠', label: '50 Soru',         desc: '50 soru çözdün',               check: (d: Analysis) => d.totalQuestions >= 50 },
  { id: 'q100',        icon: '💡', label: '100 Soru',        desc: '100 soru çözdün',              check: (d: Analysis) => d.totalQuestions >= 100 },
  { id: 'q500',        icon: '⚡', label: '500 Soru',        desc: '500 soru çözdün',              check: (d: Analysis) => d.totalQuestions >= 500 },
  { id: 'first_pass',  icon: '✅', label: 'İlk Başarı',      desc: 'İlk testi geçtin',             check: (d: Analysis) => d.totalPassed >= 1 },
  { id: 'passed_3',    icon: '🚀', label: 'Proje Hakkı',     desc: '3 testi başarıyla geçtin',     check: (d: Analysis) => d.totalPassed >= 3 },
  { id: 'passed_5',    icon: '⭐', label: 'Uzman Aday',      desc: '5 testi başarıyla geçtin',     check: (d: Analysis) => d.totalPassed >= 5 },
  { id: 'passed_10',   icon: '🌟', label: 'Uzman',           desc: '10 testi başarıyla geçtin',    check: (d: Analysis) => d.totalPassed >= 10 },
  { id: 'all_strong',  icon: '💎', label: 'Tam Uzman',       desc: 'Tüm konularda güçlü seviye',   check: (d: Analysis) => d.topics.length >= 3 && d.topics.every(t => t.level === 'strong') },
];

// ── Radar Chart ───────────────────────────────────────────────────────────────

function RadarChart({ topics }: { topics: TopicStat[] }) {
  const n = topics.length;
  if (n < 3) return null;
  const cx = 120, cy = 120, maxR = 80;
  const step = (2 * Math.PI) / n;

  const pt = (i: number, r: number) => {
    const a = i * step - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const gridPoly = (frac: number) =>
    Array.from({ length: n }, (_, i) => { const p = pt(i, maxR * frac); return `${p.x},${p.y}`; }).join(' ');

  const dataPoly = topics.map((t, i) => { const p = pt(i, (t.percent / 100) * maxR); return `${p.x},${p.y}`; }).join(' ');

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[260px] mx-auto">
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={gridPoly(f)} fill="none" stroke="#e5e7eb" strokeWidth="0.75" />
      ))}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const outer = pt(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e5e7eb" strokeWidth="0.75" />;
      })}
      {/* Data fill */}
      <polygon points={dataPoly} fill="#26496b" fillOpacity="0.12" stroke="#26496b" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Data dots */}
      {topics.map((t, i) => {
        const p = pt(i, (t.percent / 100) * maxR);
        const col = t.level === 'strong' ? '#10b981' : t.level === 'medium' ? '#f59e0b' : '#ef4444';
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill={col} stroke="white" strokeWidth="1" />;
      })}
      {/* Labels */}
      {topics.map((t, i) => {
        const p = pt(i, maxR + 18);
        const short = t.topic.length > 10 ? t.topic.slice(0, 9) + '…' : t.topic;
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fill="#6b7280" fontWeight="600">
            {short}
          </text>
        );
      })}
    </svg>
  );
}

// ── Radial score ───────────────────────────────────────────────────────────────

function RadialScore({ percent, level }: { percent: number; level: 'strong' | 'medium' | 'weak' }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  const strokeColor = level === 'strong' ? '#10b981' : level === 'medium' ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={strokeColor} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-800">{percent}%</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalizimPage() {
  const { user, isLoading: authLoading } = useSahneAuth();
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'weak' | 'strong'>('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`${API}/api/v1/surveys/me/topic-analysis`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<Analysis> : Promise.reject(new Error('Yüklenemedi')))
      .then(setData)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = data?.topics.filter(t =>
    filter === 'all' ? true : filter === 'weak' ? t.level === 'weak' : t.level === 'strong'
  ) ?? [];

  const weak   = data?.topics.filter(t => t.level === 'weak')   ?? [];
  const medium = data?.topics.filter(t => t.level === 'medium') ?? [];
  const strong = data?.topics.filter(t => t.level === 'strong') ?? [];
  const overallPct = data?.topics.length
    ? Math.round(data.topics.reduce((s, t) => s + t.percent, 0) / data.topics.length)
    : null;

  const earnedBadges = data?.topics.filter(t => t.percent >= 70).map(t => ({
    topic: t.topic,
    icon: TOPIC_BADGES[t.topic] ?? '🏅',
    percent: t.percent,
  })) ?? [];

  const unlockedMilestones = data ? MILESTONES.filter(m => m.check(data)) : [];
  const lockedMilestones   = data ? MILESTONES.filter(m => !m.check(data)).slice(0, 4) : [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-[#0c1a2e] py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Link href="/sen-ne-dersin" className="hover:text-gray-300 transition-colors">Sen Ne Dersin?</Link>
              <span>/</span>
              <span className="text-gray-300">Konu Analizim</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-1">Konu Analizim</h1>
            <p className="text-gray-400 text-sm mt-2">Tüm test geçmişindeki doğru/yanlış cevaplar konu bazında analiz edildi.</p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 py-10">

          {/* Auth gate */}
          {!authLoading && !user && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#26496b]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-bold text-gray-900 mb-2">Giriş yapman gerekiyor</h2>
              <p className="text-sm text-gray-500 mb-6">Konu analizini görmek için hesabınla giriş yap.</p>
              <Link href="/giris" className="inline-block px-7 py-3 bg-[#26496b] text-white rounded-2xl text-sm font-semibold hover:bg-[#1e3a56] transition-colors">
                Giriş Yap
              </Link>
            </div>
          )}

          {/* Loading */}
          {(authLoading || loading) && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-white rounded-2xl border border-red-100 p-8 text-center text-red-600 text-sm">{error}</div>
          )}

          {/* No data */}
          {!loading && !error && user && data && data.topics.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-14 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="font-bold text-gray-900 mb-2">Henüz yeterli veri yok</h2>
              <p className="text-sm text-gray-500 mb-6">
                Konu analizi için en az 2 soruluk konu etiketi olan testleri tamamlaman gerekiyor.<br />
                {data.totalTests > 0 && `${data.totalTests} test tamamladın ama sorular henüz etiketlenmemiş.`}
              </p>
              <Link href="/sen-ne-dersin/testler" className="inline-block px-7 py-3 bg-[#26496b] text-white rounded-2xl text-sm font-semibold hover:bg-[#1e3a56] transition-colors">
                Testlere Git →
              </Link>
            </div>
          )}

          {/* Analysis */}
          {!loading && !error && user && data && data.topics.length > 0 && (
            <div className="space-y-8">

              {/* ── KPI row ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-[#26496b]">{data.totalTests}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wide">Test</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-emerald-600">{data.totalPassed}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wide">Geçilen</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-gray-700">{data.totalQuestions}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wide">Soru</p>
                </div>
                {overallPct !== null && (
                  <div className={`rounded-2xl border shadow-sm p-4 text-center ${overallPct >= 70 ? 'bg-emerald-50 border-emerald-100' : overallPct >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-2xl font-black ${overallPct >= 70 ? 'text-emerald-700' : overallPct >= 50 ? 'text-amber-700' : 'text-red-700'}`}>%{overallPct}</p>
                    <p className={`text-[10px] mt-0.5 font-semibold uppercase tracking-wide ${overallPct >= 70 ? 'text-emerald-500' : overallPct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>Başarı</p>
                  </div>
                )}
              </div>

              {/* ── Yetkinlik Haritası (Radar) ───────────────────────────── */}
              {data.topics.length >= 3 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-bold text-gray-900 mb-5">Yetkinlik Haritası</h2>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-full sm:w-auto sm:shrink-0">
                      <RadarChart topics={data.topics} />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-1 gap-2">
                        {data.topics.slice(0, 6).map(t => {
                          const cfg = LEVEL_CONFIG[t.level];
                          return (
                            <div key={t.topic} className="flex items-center gap-3">
                              <span className="text-xs text-gray-600 w-32 truncate shrink-0">{t.topic}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bg}`} style={{ width: `${t.percent}%` }} />
                              </div>
                              <span className={`text-[10px] font-bold shrink-0 ${cfg.text}`}>%{t.percent}</span>
                            </div>
                          );
                        })}
                        {data.topics.length > 6 && (
                          <p className="text-xs text-gray-400 mt-1">+{data.topics.length - 6} konu daha</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Yetkinlik Rozetleri ──────────────────────────────────── */}
              {earnedBadges.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-900">Yetkinlik Rozetleri</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{earnedBadges.length} rozet</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {earnedBadges.map(b => (
                      <div key={b.topic} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="text-base">{b.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-emerald-800 leading-none">{b.topic}</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">%{b.percent} · Uzman</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {earnedBadges.length < data.topics.length && (
                    <p className="text-xs text-gray-400 mt-3">
                      {data.topics.length - earnedBadges.length} konu daha %70 üzerine çıkarsan rozet kazanırsın.
                    </p>
                  )}
                </div>
              )}

              {/* ── Özet chips ───────────────────────────────────────────── */}
              <div className="flex flex-wrap gap-2">
                {strong.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{strong.length} güçlü konu
                  </span>
                )}
                {medium.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{medium.length} gelişiyor
                  </span>
                )}
                {weak.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{weak.length} zayıf konu
                  </span>
                )}
              </div>

              {/* ── Filter ──────────────────────────────────────────────── */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {([['all', 'Tümü'], ['weak', 'Zayıflar'], ['strong', 'Güçlüler']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setFilter(v)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filter === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    {l}
                  </button>
                ))}
              </div>

              {/* ── Topic list ──────────────────────────────────────────── */}
              <div className="space-y-3">
                {filtered.map(t => {
                  const cfg = LEVEL_CONFIG[t.level];
                  return (
                    <div key={t.topic} className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${t.level === 'weak' ? 'border-red-100' : t.level === 'strong' ? 'border-emerald-100' : 'border-gray-100'}`}>
                      <RadialScore percent={t.percent} level={t.level} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-gray-900 text-sm">{t.topic}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bg}`} style={{ width: `${t.percent}%` }} />
                        </div>
                        <p className="text-xs text-gray-400">{t.correct}/{t.total} doğru</p>
                      </div>
                      {t.level === 'weak' && (
                        <Link
                          href={`/egitimler?konu=${encodeURIComponent(t.topic)}`}
                          className="shrink-0 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors whitespace-nowrap"
                        >
                          Çalış →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Başarılar ────────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900">Başarılarım</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {unlockedMilestones.length}/{MILESTONES.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {MILESTONES.map(m => {
                    const unlocked = m.check(data);
                    return (
                      <div key={m.id} className={`rounded-xl border p-3 flex items-start gap-3 transition-all ${unlocked ? 'border-[#26496b]/20 bg-[#26496b]/5' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                        <span className="text-xl leading-none">{m.icon}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${unlocked ? 'text-gray-900' : 'text-gray-400'}`}>{m.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Weak CTA ─────────────────────────────────────────────── */}
              {weak.length > 0 && filter !== 'strong' && (
                <div className="bg-[#0c1a2e] rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{weak.length} konuda gelişim alanın var</p>
                    <p className="text-gray-400 text-xs mt-0.5">En zayıf: <strong className="text-gray-200">{weak[0]?.topic}</strong> (%{weak[0]?.percent})</p>
                  </div>
                  <Link href="/sen-ne-dersin/testler" className="shrink-0 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors">
                    Test Çöz
                  </Link>
                </div>
              )}

              {/* ── All strong CTA ───────────────────────────────────────── */}
              {weak.length === 0 && medium.length === 0 && strong.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
                  <p className="text-emerald-800 font-bold">🎉 Tüm konularda güçlüsün!</p>
                  <p className="text-sm text-emerald-600 mt-1">Yarışmalara katılmayı düşünebilirsin.</p>
                  <Link href="/sen-ne-dersin/yarismalar" className="inline-block mt-3 px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                    Yarışmalara Git →
                  </Link>
                </div>
              )}

              <div className="text-center">
                <Link href="/sen-ne-dersin/testler" className="text-sm text-[#26496b] font-semibold hover:underline">
                  Daha fazla test çözerek analizi güçlendir →
                </Link>
              </div>

            </div>
          )}
        </section>
      </main>
    </>
  );
}
