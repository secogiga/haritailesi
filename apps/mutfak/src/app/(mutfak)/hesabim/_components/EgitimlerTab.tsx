'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://sahne.haritailesi.org';

type XpData = {
  xp: number; lessonXp: number; quizXp: number; pct: number;
  current: { label: string; emoji: string; minXp: number };
  next: { label: string; emoji: string; minXp: number } | null;
};

type Enrollment = {
  trainingId: string;
  slug: string;
  title: string;
  coverImageKey: string | null;
  level: string | null;
  format: string | null;
  progressPct: number;
  completedAt: string | null;
  lastAccessedAt: string | null;
  enrolledAt: string;
};

type Certificate = {
  id: string;
  certificateCode: string;
  issuedAt: string;
  quizScore: number | null;
  trainingTitle: string;
  trainingSlug: string;
};

type Badge = {
  code: string;
  name: string;
  emoji: string;
  description: string;
  awardedAt: string;
};

function ProgressRing({ pct }: { pct: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-slate-800" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4"
        className={pct === 100 ? 'text-emerald-500' : 'text-[#26496b]'}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <g className="rotate-90" style={{ transformOrigin: '24px 24px' }}>
        <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
          className={`text-[10px] font-black fill-current ${pct === 100 ? 'text-emerald-600' : 'text-[#26496b]'}`}
          style={{ fontSize: 10 }}
        >
          {pct}%
        </text>
      </g>
    </svg>
  );
}

export function EgitimlerTab({ token }: { token: string | null }) {
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null);
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [xpData, setXpData] = useState<XpData | null>(null);
  const [attempts, setAttempts] = useState<Array<{ quizId: string; score: number; passed: boolean; completedAt: string; trainingTitle?: string }> | null>(null);
  const [tab, setTab] = useState<'kurslar' | 'sertifikalar' | 'rozetler' | 'denemeler'>('kurslar');

  useEffect(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    fetch(`${API_URL}/api/v1/cms/trainings/enrollments/mine`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(d => setEnrollments(d as Enrollment[]))
      .catch(() => setEnrollments([]));

    fetch(`${API_URL}/api/v1/cms/certificates/mine`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(d => setCertificates(d as Certificate[]))
      .catch(() => setCertificates([]));

    fetch(`${API_URL}/api/v1/cms/badges/mine`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(d => setBadges(d as Badge[]))
      .catch(() => setBadges([]));

    fetch(`${API_URL}/api/v1/cms/my-xp`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => setXpData(d as XpData))
      .catch(() => {});

    fetch(`${API_URL}/api/v1/cms/quiz-attempts/mine`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(d => setAttempts(d as typeof attempts extends Array<infer T> ? T[] : never[]))
      .catch(() => setAttempts([]));
  }, [token]);

  const certCount = certificates?.length ?? 0;
  const badgeCount = badges?.length ?? 0;
  const activeCount = enrollments?.filter(e => !e.completedAt).length ?? 0;
  const doneCount = enrollments?.filter(e => !!e.completedAt).length ?? 0;

  return (
    <div className="space-y-5">

      {/* XP + Rank kartı */}
      {xpData && (
        <div className="bg-gradient-to-br from-[#0d1b2a] to-[#26496b] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-center gap-4">
            {/* Rank rozeti */}
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex flex-col items-center justify-center shrink-0 border border-white/15">
              <span className="text-2xl leading-none">{xpData.current.emoji}</span>
              <span className="text-[9px] font-bold text-white/60 mt-0.5 uppercase tracking-wide">{xpData.current.label}</span>
            </div>
            {/* XP bilgisi */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-2xl font-black tabular-nums text-[#66aca9]">{xpData.xp}</span>
                <span className="text-xs text-white/50">XP</span>
                {xpData.next && (
                  <span className="text-xs text-white/40 ml-auto">{xpData.next.emoji} {xpData.next.label}: {xpData.next.minXp} XP</span>
                )}
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#66aca9] to-emerald-400 transition-all duration-700"
                  style={{ width: `${xpData.pct}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/40">{xpData.lessonXp} ders + {xpData.quizXp} quiz</span>
                <Link href="/egitim/siralama" className="text-[10px] text-[#66aca9]/70 hover:text-[#66aca9] transition-colors">Sıralama →</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Özet satırı */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Devam Eden', value: activeCount, color: 'text-[#26496b]' },
          { label: 'Tamamlanan', value: doneCount, color: 'text-emerald-600' },
          { label: 'Sertifika', value: certCount, color: 'text-amber-600' },
          { label: 'Rozet', value: badgeCount, color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alt sekmeler */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-slate-800">
        {([
          { key: 'kurslar', label: 'Kurslarım' },
          { key: 'sertifikalar', label: `Sertifikalar${certCount > 0 ? ` (${certCount})` : ''}` },
          { key: 'rozetler', label: `Rozetler${badgeCount > 0 ? ` (${badgeCount})` : ''}` },
          { key: 'denemeler', label: `Denemeler${attempts && attempts.length > 0 ? ` (${attempts.length})` : ''}` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key ? 'border-[#26496b] text-[#26496b]' : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Kurslar ── */}
      {tab === 'kurslar' && (
        <div className="space-y-3">
          {enrollments === null ? (
            [1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)
          ) : enrollments.length === 0 ? (
            <div className="py-14 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl">
              <p className="text-2xl mb-2">🎓</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Henüz kayıtlı kurs yok</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Sahne&apos;de eğitimlere göz atabilirsin.</p>
              <a href={`${SAHNE_URL}/egitim`} target="_blank" rel="noreferrer"
                className="text-xs font-semibold text-[#26496b] dark:text-blue-400 hover:underline">
                Eğitimlere Bak →
              </a>
            </div>
          ) : (
            <>
              {enrollments
                .sort((a, b) => {
                  if (a.lastAccessedAt && b.lastAccessedAt)
                    return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
                  return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
                })
                .map(e => (
                  <Link key={e.trainingId} href={`/egitim/${e.slug}`}
                    className="group flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                    {/* Progress ring */}
                    <div className="shrink-0">
                      <ProgressRing pct={e.progressPct} />
                    </div>

                    {/* Bilgi */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {e.level && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                            {e.level}
                          </span>
                        )}
                        {e.completedAt && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            ✓ Tamamlandı
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors">
                        {e.title}
                      </p>
                      {e.lastAccessedAt && (
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                          Son erişim: {new Date(e.lastAccessedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="shrink-0">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                        e.completedAt
                          ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                          : 'bg-[#26496b]/10 text-[#26496b] dark:bg-blue-900/30 dark:text-blue-400 group-hover:bg-[#26496b] group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white'
                      }`}>
                        {e.progressPct === 0 ? 'Başla' : e.completedAt ? 'Tekrar İzle' : 'Devam Et'}
                      </span>
                    </div>
                  </Link>
                ))
              }
            </>
          )}
        </div>
      )}

      {/* ── Sertifikalar ── */}
      {tab === 'sertifikalar' && (
        <div className="space-y-3">
          {certificates === null ? (
            [1, 2].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)
          ) : certificates.length === 0 ? (
            <div className="py-14 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl">
              <p className="text-2xl mb-2">🏆</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Henüz sertifika yok</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Kursu tamamla ve quizi geç — sertifikan hazır olsun.</p>
            </div>
          ) : (
            certificates.map(cert => (
              <div key={cert.id} className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/15 dark:to-yellow-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{cert.trainingTitle}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      {new Date(cert.issuedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {cert.quizScore !== null && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Quiz: %{cert.quizScore}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-0.5">{cert.certificateCode}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <a href={`${SAHNE_URL}/egitim/sertifika/${cert.certificateCode}`} target="_blank" rel="noreferrer"
                    className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline text-right">
                    Görüntüle →
                  </a>
                  <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${SAHNE_URL}/egitim/sertifika/${cert.certificateCode}`)}&title=${encodeURIComponent(`${cert.trainingTitle} Sertifikası — Haritailesi`)}`}
                    target="_blank" rel="noreferrer"
                    className="text-[11px] font-semibold text-[#0a66c2] hover:underline text-right">
                    LinkedIn&apos;de Paylaş
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Rozetler ── */}
      {tab === 'rozetler' && (
        <div>
          {badges === null ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : badges.length === 0 ? (
            <div className="py-14 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl">
              <p className="text-2xl mb-2">🏅</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Henüz rozet yok</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Kurslara kayıt ol ve ilerleme kaydettikçe rozetler kazanırsın.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map(b => (
                <div key={b.code} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 text-center">
                  <span className="text-3xl">{b.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100">{b.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 leading-snug">{b.description}</p>
                  </div>
                  <p className="text-[10px] text-gray-300 dark:text-slate-600">
                    {new Date(b.awardedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Denemeler ── */}
      {tab === 'denemeler' && (
        <div className="space-y-2">
          {attempts === null ? (
            [1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)
          ) : attempts.length === 0 ? (
            <div className="py-14 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl">
              <p className="text-2xl mb-2">✏️</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Henüz quiz denemesi yok</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Kurslardaki quizleri tamamladıkça denemeler burada görünecek.</p>
            </div>
          ) : (
            attempts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${a.passed ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                  {a.passed ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                    {(a as {trainingTitle?: string}).trainingTitle ?? 'Kurs'}
                    {(a as {quizTitle?: string}).quizTitle ? ` · ${(a as {quizTitle?: string}).quizTitle}` : ''}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                    {new Date(a.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-sm font-black shrink-0 ${a.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                  %{a.score}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
