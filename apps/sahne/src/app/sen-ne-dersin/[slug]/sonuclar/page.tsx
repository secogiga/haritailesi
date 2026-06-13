'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TurkeyMap, { type MemberCityStat } from '@/components/TurkeyMap';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Breakdown {
  option: string;
  count: number;
  percent: number;
  isCorrect: boolean;
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  type: string;
  total: number;
  breakdown?: Breakdown[];
  answers?: string[];
}

interface ResultData {
  survey: {
    id: string;
    slug: string | null;
    title: string;
    type: string;
    responseCount: number;
    status: string;
  };
  results: QuestionResult[];
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  percent: number;
  timeTaken: number | null;
  passed: boolean | null;
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

function BarChart({ breakdown, isTest }: { breakdown: Breakdown[]; isTest: boolean }) {
  const maxPct = Math.max(...breakdown.map(b => b.percent), 1);
  return (
    <div className="space-y-3 mt-4">
      {breakdown.map((b) => (
        <div key={b.option}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className={`font-medium ${b.isCorrect && isTest ? 'text-emerald-700' : 'text-gray-700'}`}>
              {b.isCorrect && isTest && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 mb-0.5" />
              )}
              {b.option}
            </span>
            <span className="text-xs text-gray-400 tabular-nums ml-3 shrink-0">
              {b.count} · <span className="font-bold">{b.percent}%</span>
            </span>
          </div>
          <div className="w-full h-8 bg-gray-100 rounded-xl overflow-hidden">
            <div
              className={`h-full rounded-xl transition-all duration-700 ${
                b.isCorrect && isTest
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : 'bg-gradient-to-r from-[#26496b] to-[#3a6694]'
              }`}
              style={{ width: `${(b.percent / maxPct) * 100}%`, minWidth: b.percent > 0 ? '4px' : '0' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Text answers ──────────────────────────────────────────────────────────────

function TextAnswers({ answers }: { answers: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? answers : answers.slice(0, 8);
  return (
    <div className="mt-4 space-y-2">
      {visible.map((a, i) => (
        <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed border border-gray-100">
          "{a}"
        </div>
      ))}
      {answers.length > 8 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-[#26496b] font-semibold hover:underline mt-1"
        >
          +{answers.length - 8} yanıt daha göster
        </button>
      )}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (!entries.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gray-900">Liderlik Tablosu</h2>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">Top {entries.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.map((e) => (
          <div
            key={e.rank}
            className={`flex items-center gap-4 px-6 py-3.5 ${e.rank <= 3 ? 'bg-amber-50/50' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              e.rank === 1 ? 'bg-amber-400 text-white shadow-sm' :
              e.rank === 2 ? 'bg-gray-300 text-gray-700' :
              e.rank === 3 ? 'bg-amber-600/70 text-white' :
              'bg-gray-100 text-gray-500'
            }`}>{e.rank}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{e.name}</p>
              {e.timeTaken != null && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {Math.floor(e.timeTaken / 60)}:{String(e.timeTaken % 60).padStart(2, '0')} dk
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold ${
                e.passed === true ? 'text-emerald-600' :
                e.passed === false ? 'text-red-500' :
                'text-gray-700'
              }`}>{e.percent}%</p>
              {e.passed != null && (
                <p className={`text-[10px] font-bold tracking-wide uppercase ${e.passed ? 'text-emerald-500' : 'text-red-400'}`}>
                  {e.passed ? 'Geçti' : 'Kaldı'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Share buttons ─────────────────────────────────────────────────────────────

function ShareRow({ title, isTest }: { title: string; isTest: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href.replace('/sonuclar', '') : '';
  const tweetText = encodeURIComponent(`${title} ${isTest ? 'testinin sonuçları' : 'anketi sonuçları'} — Haritailesi topluluğunun görüşleri 👇`);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Bu sonuçları paylaş</p>
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
        >
          {copied ? (
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.634 5.903-5.634zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X'te Paylaş
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0077b5] text-white rounded-xl text-sm font-medium hover:bg-[#005e94] transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn'de Paylaş
        </a>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SurveyResultsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ResultData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [cityStats, setCityStats] = useState<MemberCityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/v1/surveys/${slug}/results`)
      .then(async r => {
        const json = await r.json() as ResultData & { message?: string };
        if (!r.ok) throw new Error(json.message ?? 'Hata');
        return json;
      })
      .then(d => {
        setData(d);
        if (d.survey.type === 'test') {
          fetch(`${API}/api/v1/surveys/${slug}/leaderboard`)
            .then(r => r.ok ? r.json() as Promise<LeaderboardEntry[]> : [])
            .then(setLeaderboard)
            .catch(() => {});
        }
        fetch(`${API}/api/v1/surveys/${slug}/results/segmented`)
          .then(r => r.ok ? r.json() as Promise<{ byCity: { city: string; count: number }[] }> : { byCity: [] })
          .then(seg => setCityStats(seg.byCity))
          .catch(() => {});
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Yükleniyor…</div>
        </main>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">{error || 'Sonuçlar bulunamadı.'}</p>
            <p className="text-gray-400 text-sm mb-5">Sonuçlar kamuya açık olmayabilir.</p>
            <Link href={`/sen-ne-dersin/${slug ?? ''}`} className="text-[#26496b] text-sm font-semibold hover:underline">
              ← İçeriğe dön
            </Link>
          </div>
        </main>
      </>
    );
  }

  const isTest = data.survey.type === 'test';
  const isActive = data.survey.status === 'active';

  const avgPct = leaderboard.length
    ? Math.round(leaderboard.reduce((s, e) => s + e.percent, 0) / leaderboard.length)
    : null;
  const passRate = leaderboard.filter(e => e.passed === true).length > 0
    ? Math.round((leaderboard.filter(e => e.passed === true).length / leaderboard.length) * 100)
    : null;

  const gradientFrom = isTest ? 'from-violet-600' : 'from-sky-600';
  const gradientTo   = isTest ? 'to-purple-700'   : 'to-blue-700';
  const accentColor  = isTest ? 'text-violet-600'  : 'text-sky-600';

  const statsCount = 2 + (isTest && avgPct != null ? 1 : 0) + (isTest && passRate != null ? 1 : 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">

        {/* ── Hero header ── */}
        <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 pb-10">

            {/* Navigation row */}
            <div className="flex items-center justify-between mb-8">
              <Link
                href={`/sen-ne-dersin/${slug}`}
                className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                Geri Dön
              </Link>
              <Link
                href={isTest ? '/sen-ne-dersin/testler' : '/sen-ne-dersin/anketler'}
                className="flex items-center gap-1.5 text-white/60 hover:text-white/90 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8" />
                </svg>
                {isTest ? 'Tüm Testler' : 'Tüm Anketler'}
              </Link>
            </div>

            {/* Title area */}
            <div className="flex items-start gap-5 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                {isTest ? (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                    {isTest ? 'Test Sonuçları' : 'Anket Sonuçları'}
                  </span>
                  {!isActive && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 text-white/75 font-medium">
                      Sona Erdi
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">{data.survey.title}</h1>
              </div>
            </div>

            {/* Stats strip */}
            <div className={`grid gap-3 grid-cols-2 ${statsCount > 2 ? 'sm:grid-cols-4' : ''}`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center">
                <div className="text-3xl font-black text-white">{data.survey.responseCount.toLocaleString('tr-TR')}</div>
                <div className="text-xs text-white/55 mt-1 font-medium">Katılımcı</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center">
                <div className="text-3xl font-black text-white">{data.results.length}</div>
                <div className="text-xs text-white/55 mt-1 font-medium">Soru</div>
              </div>
              {isTest && avgPct != null && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center">
                  <div className="text-3xl font-black text-white">{avgPct}%</div>
                  <div className="text-xs text-white/55 mt-1 font-medium">Ort. Skor</div>
                </div>
              )}
              {isTest && passRate != null && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center">
                  <div className="text-3xl font-black text-white">%{passRate}</div>
                  <div className="text-xs text-white/55 mt-1 font-medium">Geçme Oranı</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-6">

          {/* CTA — aktif içerikler için */}
          {isActive && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
              <p className="text-sm text-gray-600 font-medium">
                Bu {isTest ? 'test' : 'anket'} hâlâ aktif — sen de katıl!
              </p>
              <Link
                href={`/sen-ne-dersin/${slug}`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
              >
                {isTest ? 'Testi Çöz' : 'Ankete Katıl'}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* Question results */}
          {data.results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Henüz yanıt bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {data.results.map((qr, i) => (
                <div
                  key={qr.questionId}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${
                    qr.type === 'text' ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isTest ? 'bg-violet-100 text-violet-600' : 'bg-sky-100 text-sky-600'
                    }`}>{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 leading-relaxed">{qr.questionText}</p>
                      {qr.type !== 'text' && qr.total != null && (
                        <p className="text-xs text-gray-400 mt-0.5">{qr.total} yanıt</p>
                      )}
                    </div>
                  </div>

                  {qr.type !== 'text' && qr.breakdown && qr.breakdown.length > 0 ? (
                    <BarChart breakdown={qr.breakdown} isTest={isTest} />
                  ) : qr.type === 'text' && qr.answers && qr.answers.length > 0 ? (
                    <TextAnswers answers={qr.answers} />
                  ) : (
                    <p className="text-sm text-gray-400 mt-3 pl-11">Henüz yanıt yok.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard + Harita — yan yana büyük ekranda */}
          {(isTest || cityStats.length > 0) && (
            <div className={`grid gap-5 ${isTest && cityStats.length > 0 ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
              {isTest && <Leaderboard entries={leaderboard} />}
              {cityStats.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-900">Katılımcı Dağılımı</h2>
                    <Link href="/sen-ne-dersin/sektor-raporu" className={`text-xs font-semibold hover:underline ${accentColor}`}>
                      Sektör Raporu →
                    </Link>
                  </div>
                  <TurkeyMap members={cityStats} />
                </div>
              )}
            </div>
          )}

          {/* Share */}
          <ShareRow title={data.survey.title} isTest={isTest} />

        </div>
      </main>
    </>
  );
}
