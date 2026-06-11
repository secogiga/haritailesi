'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Question {
  id: string;
  questionText: string;
  type: 'single' | 'multiple' | 'text' | 'rating' | 'truefalse';
  options: string[] | null;
  points: number;
  required: boolean;
  sortOrder: number;
  imageUrl: string | null;
  scenarioText: string | null;
  difficulty: string;
  topicTags: string[];
  conditionQuestionId: string | null;
  conditionValues: string[] | null;
  correctOptions?: string[] | null;
}

interface Survey {
  id: string;
  slug: string | null;
  type: 'anket' | 'test';
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  endsAt: string | null;
  allowAnonymous: boolean;
  showResults: boolean;
  timeLimit: number | null;
  passingScore: number | null;
  responseCount: number;
  questions: Question[];
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  isCorrect: boolean;
  correctOptions: string[];
  explanation: string | null;
  points: number;
  earned: number;
}

interface LeaderboardEntry {
  rank: number; name: string; percent: number;
  timeTaken: number | null; passed: boolean | null;
}

interface PrevCompletion {
  percent: number | null; passed: boolean | null; completedAt: string;
}

interface PlatformLinks {
  testsPassed: number;
  canApplyToProjects: boolean;
  suggestedTrainings: { id: string; title: string; slug: string; level: string | null }[];
}

interface SubmitResult {
  id: string;
  score?: number;
  maxScore?: number;
  percent?: number;
  passed?: boolean | null;
  questionResults?: QuestionResult[];
  platformLinks?: PlatformLinks;
  companySlug?: string;
}

// ── Single-choice ─────────────────────────────────────────────────────────────

function SingleQuestion({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  const isTF = q.type === 'truefalse';
  const opts = isTF ? ['Doğru', 'Yanlış'] : (q.options ?? []);
  return (
    <div className="space-y-2.5">
      {opts.map((opt) => (
        <label key={opt} className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${value === opt ? 'border-[#26496b] bg-[#26496b] shadow-lg shadow-[#26496b]/15' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'}`}>
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${value === opt ? 'border-white/40 bg-white/20' : 'border-gray-300'}`}>
            {value === opt && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
          </span>
          <input type="radio" className="sr-only" name={q.id} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
          <span className={`text-sm font-semibold ${value === opt ? 'text-white' : 'text-gray-700'}`}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

// ── Multi-choice ──────────────────────────────────────────────────────────────

function MultiQuestion({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className="space-y-2.5">
      {(q.options ?? []).map((opt) => {
        const checked = value.includes(opt);
        return (
          <label key={opt} className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${checked ? 'border-[#26496b] bg-[#26496b] shadow-lg shadow-[#26496b]/15' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'}`} onClick={() => toggle(opt)}>
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'border-white/40 bg-white/20' : 'border-gray-300'}`}>
              {checked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </span>
            <span className={`text-sm font-semibold ${checked ? 'text-white' : 'text-gray-700'}`}>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

// ── Rating ────────────────────────────────────────────────────────────────────

function RatingQuestion({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  const [hovered, setHovered] = useState(0);
  const max = q.options?.length ?? 5;
  return (
    <div className="flex items-center gap-2 py-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button"
          className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${parseInt(value) >= n || hovered >= n ? 'border-[#26496b] bg-[#26496b] text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(String(n))}>{n}</button>
      ))}
      {q.options && q.options.length >= 2 && (
        <div className="flex items-center justify-between w-full text-xs text-gray-400 mt-1 sr-only">
          <span>{q.options[0]}</span>
          <span>{q.options[q.options.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

// ── Text ──────────────────────────────────────────────────────────────────────

function TextQuestion({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  return (
    <textarea rows={4} placeholder="Cevabınızı yazın…"
      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] resize-none transition-all"
      value={value} onChange={e => onChange(e.target.value)} />
  );
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const expired = useRef(false);

  useEffect(() => {
    if (remaining <= 0) {
      if (!expired.current) { expired.current = true; onExpire(); }
      return;
    }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const pct = (remaining / seconds) * 100;
  const urgent = remaining <= 60;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-bold ${urgent ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${urgent ? 'bg-red-500' : 'bg-[#26496b]'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Score result ──────────────────────────────────────────────────────────────

function Certificate({ survey, result, name, onClose }: {
  survey: Survey; result: SubmitResult; name: string; onClose: () => void;
}) {
  const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <>
      <style>{`@media print{body *{visibility:hidden}#cert-wrap,#cert-wrap *{visibility:visible}#cert-wrap{position:fixed;left:0;top:0;width:100%}.no-print{display:none!important}}`}</style>
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" id="cert-wrap">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-[#26496b] to-[#66aca9]" />
          <div className="px-12 py-10 text-center">
            <div className="text-[#26496b] font-bold text-2xl tracking-tight">haritailesi</div>
            <div className="text-xs text-gray-400 tracking-[0.3em] uppercase mb-8">Mesleğin Topluluğu</div>
            <div className="text-xs font-bold tracking-[0.3em] text-[#66aca9] uppercase mb-3">Başarı Sertifikası</div>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#26496b] to-transparent mx-auto mb-8" />
            <p className="text-sm text-gray-500 mb-5">Bu sertifika, aşağıdaki kişinin testi başarıyla tamamladığını onaylar.</p>
            {name && <div className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-[#26496b]/20 pb-4">{name}</div>}
            <div className="bg-gray-50 rounded-2xl px-8 py-5 mb-6">
              <p className="text-lg font-bold text-gray-900 mb-2">{survey.title}</p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <span>Skor: <strong>{result.score}/{result.maxScore} puan</strong></span>
                <span>·</span>
                <span>Başarı: <strong className="text-green-600">{result.percent}%</strong></span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-8">
              <span>Tarih: {date}</span>
              <span>·</span>
              <span className="text-green-600 font-bold">✓ GEÇTİ</span>
            </div>
            <div className="text-xs text-gray-300">haritailesi.org · Sen Ne Dersin?</div>
          </div>
          <div className="h-2 bg-gradient-to-r from-[#26496b] to-[#66aca9]" />
        </div>
        <div className="no-print fixed bottom-8 left-0 right-0 flex justify-center gap-3">
          <button onClick={() => window.print()} className="px-6 py-3 bg-[#26496b] text-white font-semibold text-sm rounded-xl hover:bg-[#1e3a56]">
            Yazdır / PDF İndir
          </button>
          <button onClick={onClose} className="px-6 py-3 bg-white text-gray-700 font-semibold text-sm rounded-xl border border-gray-200 hover:bg-gray-50">Kapat</button>
        </div>
      </div>
    </>
  );
}

function TestResultView({ result, survey, onRetake, leaderboard, challengerName }: { result: SubmitResult; survey: Survey; onRetake: () => void; leaderboard: LeaderboardEntry[]; challengerName?: string | null }) {
  const [showCert, setShowCert] = useState(false);
  const [certName, setCertName] = useState('');
  const [nameStep, setNameStep] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);
  const [poolState, setPoolState] = useState<'idle' | 'loading' | 'done'>('idle');
  const pct = result.percent ?? 0;
  const passed = result.passed;
  const communityAvg = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((sum, e) => sum + e.percent, 0) / leaderboard.length)
    : null;
  const belowCount = leaderboard.filter(e => e.percent < pct).length;
  const userPercentile = leaderboard.length > 1
    ? Math.round((belowCount / leaderboard.length) * 100)
    : null;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
        {/* Score circle */}
        <div className={`px-8 pt-10 pb-8 text-center ${passed === true ? 'bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-transparent' : passed === false ? 'bg-gradient-to-b from-red-50 via-red-50/50 to-transparent' : 'bg-gradient-to-b from-slate-50 to-transparent'}`}>
          <div className="relative w-36 h-36 mx-auto mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle cx="64" cy="64" r={radius} fill="none"
                stroke={passed === true ? '#16a34a' : passed === false ? '#dc2626' : '#26496b'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                style={{ transition: 'stroke-dasharray 1.2s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{pct}%</span>
              <span className="text-xs text-gray-500">{result.score}/{result.maxScore}</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {passed === true ? 'Tebrikler!' : passed === false ? 'Tekrar Dene' : 'Tamamlandı'}
          </h2>
          <p className="text-sm text-gray-500">
            {passed === true ? `Geçme notunu geçtin (${survey.passingScore}%)` : passed === false ? `Geçme notu: ${survey.passingScore}%` : 'Cevaplarınız kaydedildi.'}
          </p>
          {survey.passingScore != null && (
            <div className="flex items-center justify-center gap-3 mt-3 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {passed ? 'GEÇTİ' : 'KALDI'}
              </span>
              <span className="text-gray-400">Geçme notu {survey.passingScore}%</span>
            </div>
          )}
          {challengerName && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-semibold">
              {pct >= parseInt(challengerName.replace('Hedef: %', '') || '0')
                ? <span className="text-violet-700 bg-violet-50 border-violet-200 px-4 py-2 rounded-2xl">⚡ Meydan okumayı geçtin!</span>
                : <span className="text-amber-700 bg-amber-50 border-amber-200 px-4 py-2 rounded-2xl">Hedef %{challengerName.replace('Hedef: %', '')} — tekrar dene!</span>
              }
            </div>
          )}
          {communityAvg !== null && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-2xl border border-gray-100 text-xs text-gray-500">
              <span>Topluluk: <strong className="text-gray-700">{communityAvg}%</strong></span>
              <span className="text-gray-300">·</span>
              <span>Sen: <strong className="text-[#26496b]">{pct}%</strong></span>
              {userPercentile !== null && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>Üst <strong className="text-emerald-600">%{100 - userPercentile}</strong></span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Question breakdown */}
        {result.questionResults && result.questionResults.length > 0 && (
          <div className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Soru Detayı</h3>
            {result.questionResults.map((qr, i) => (
              <div key={qr.questionId} className={`p-4 rounded-xl border ${qr.isCorrect ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${qr.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    {qr.isCorrect
                      ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{i + 1}. {qr.questionText}</p>
                    {!qr.isCorrect && qr.correctOptions.length > 0 && (
                      <p className="text-xs text-green-700 mt-1.5 font-medium">Doğru cevap: {qr.correctOptions.join(', ')}</p>
                    )}
                    {qr.explanation && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{qr.explanation}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${qr.isCorrect ? 'text-green-600' : 'text-red-600'}`}>+{qr.earned}/{qr.points}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {passed === true && (
          <div className="px-6 pb-2">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
              <div className="text-green-700 font-semibold text-sm mb-1">🏆 Sertifikan Hazır!</div>
              <p className="text-xs text-green-600 mb-3">Bu testi başarıyla tamamladın. Sertifikanı oluşturup indirebilirsin.</p>
              <button
                onClick={() => setNameStep(true)}
                className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                Sertifika Al
              </button>
            </div>
          </div>
        )}

        {/* Talent pool CTA */}
        {passed === true && result.companySlug && (
          <div className="px-6 pb-2">
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-violet-900">Yetenek Havuzuna Katıl</p>
                  <p className="text-xs text-violet-700 mt-0.5 leading-relaxed">
                    Bu testi geçtiniz! <strong>{result.companySlug}</strong> şirketinin yetenek havuzuna katılarak iş fırsatlarından haberdar olabilirsiniz.
                  </p>
                  {poolState === 'done' ? (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Havuza Katıldınız
                    </div>
                  ) : (
                    <button
                      disabled={poolState === 'loading'}
                      onClick={async () => {
                        setPoolState('loading');
                        try {
                          await fetch(`${API}/api/v1/surveys/${survey.id}/join-pool`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ companySlug: result.companySlug }),
                          });
                          setPoolState('done');
                        } catch { setPoolState('idle'); }
                      }}
                      className="mt-2.5 px-4 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60"
                    >
                      {poolState === 'loading' ? 'Ekleniyor…' : 'Havuza Katıl'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform bağlantısı — geçen kullanıcıya öneriler */}
        {result.passed === true && result.platformLinks && (
          <div className="px-6 pb-2 space-y-3">
            {/* Eğitim önerileri */}
            {result.platformLinks.suggestedTrainings.length > 0 && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-xs font-bold text-sky-800">Bu konuda eğitimler var</p>
                </div>
                <div className="space-y-2">
                  {result.platformLinks.suggestedTrainings.map(t => (
                    <Link key={t.id} href={`/egitimler/${t.slug}`}
                      className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-sky-100 hover:border-sky-200 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-sky-700 transition-colors">{t.title}</p>
                        {t.level && <p className="text-[10px] text-gray-400">{t.level}</p>}
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-sky-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Proje başvurusu hakkı */}
            {result.platformLinks.canApplyToProjects && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-800">{result.platformLinks.testsPassed} test geçtin!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Proje başvurusu yapma hakkı kazandın. Açık projelere başvurabilirsin.</p>
                    <Link href="/projeler" className="inline-block mt-2.5 px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                      Projelere Göz At →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Henüz proje hakkı yok ama ilerleme var */}
            {!result.platformLinks.canApplyToProjects && result.platformLinks.testsPassed >= 1 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1 shrink-0">
                  {[1,2,3].map(n => (
                    <div key={n} className={`w-2.5 h-2.5 rounded-full ${n <= result.platformLinks!.testsPassed ? 'bg-[#26496b]' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-700">{result.platformLinks.testsPassed}/3</strong> test geçildi — 3 testte proje başvurusu hakkı açılır
                </p>
              </div>
            )}
          </div>
        )}

        {/* Share result */}
        <div className="px-6 pb-4">
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs text-gray-400 font-medium mb-2.5">Sonucunu paylaş</p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${survey.title}" testinde %${result.percent ?? 0} aldım${result.passed ? ' ve geçtim' : ''}! #haritailesi`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.634 5.903-5.634zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                Paylaş
              </a>
              <button
                onClick={() => {
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/sen-ne-dersin/${survey.slug ?? survey.id}?challenge=${pct}`;
                  void navigator.clipboard.writeText(url).then(() => {
                    setChallengeCopied(true);
                    setTimeout(() => setChallengeCopied(false), 2500);
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-violet-200 text-violet-700 bg-violet-50 rounded-xl text-xs font-medium hover:bg-violet-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {challengeCopied ? 'Link Kopyalandı!' : 'Meydan Oku'}
              </button>
              {survey.showResults && (
                <Link
                  href={`/sen-ne-dersin/${survey.slug ?? survey.id}/sonuclar`}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  Topluluk Sonuçları →
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onRetake} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors">Tekrar Çöz</button>
          <Link href="/sen-ne-dersin/analizim" className="flex-1 py-3 rounded-xl bg-[#26496b] text-white text-sm font-semibold text-center hover:bg-[#1e3a56] transition-colors">Analizim →</Link>
        </div>
      </div>

      {nameStep && !showCert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-7 text-center">
            <div className="text-lg font-bold text-gray-900 mb-1">Sertifika için adın nedir?</div>
            <p className="text-sm text-gray-500 mb-5">Sertifika üzerinde görünecek adı gir.</p>
            <input
              value={certName}
              onChange={e => setCertName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setShowCert(true); setNameStep(false); } }}
              placeholder="Ad Soyad"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b]"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setNameStep(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">İptal</button>
              <button onClick={() => { setShowCert(true); setNameStep(false); }} className="flex-1 py-3 rounded-xl bg-[#26496b] text-white text-sm font-semibold hover:bg-[#1e3a56]">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {showCert && (
        <Certificate survey={survey} result={result} name={certName} onClose={() => setShowCert(false)} />
      )}
    </div>
  );
}

// ── Survey thanks ─────────────────────────────────────────────────────────────

function SurveyThanks({ onGoBack, survey }: { onGoBack: () => void; survey: Survey }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Teşekkürler!</h2>
        <p className="text-sm text-gray-500 leading-relaxed">Yanıtlarınız kaydedildi. Topluluğun sesine katkı sağladınız.</p>
        <div className="mt-6 space-y-3">
          {survey.showResults && (
            <Link href={`/sen-ne-dersin/${survey.slug ?? survey.id}/sonuclar`} className="block w-full py-3 rounded-xl bg-[#26496b] text-white text-sm font-semibold hover:bg-[#1e3a56] transition-colors">
              Topluluk Sonuçlarını Gör →
            </Link>
          )}
          <div className="flex gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${survey.title}" anketine katıldım! #haritailesi`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-black text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.634 5.903-5.634zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              X'te Paylaş
            </a>
            <Link href={survey.type === 'test' ? '/sen-ne-dersin/testler' : '/sen-ne-dersin/anketler'} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors text-center">
              Geri Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SurveyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const challengeScore = searchParams.get('challenge');
  const { user, recordAction } = useSahneAuth();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'done'>('intro');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [email, setEmail] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [prevCompletion, setPrevCompletion] = useState<PrevCompletion | null>(null);
  const [adaptiveExtra, setAdaptiveExtra] = useState<Question[]>([]);
  const startTime = useRef<number>(0);
  const timerExpired = useRef(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/v1/surveys/${slug}`)
      .then(r => r.json() as Promise<Survey>)
      .then(s => {
        setSurvey(s);
        try {
          const stored = localStorage.getItem(`snd_${s.id}`);
          if (stored) setPrevCompletion(JSON.parse(stored) as PrevCompletion);
        } catch {}
        if (s.type === 'test') {
          fetch(`${API}/api/v1/surveys/${slug}/leaderboard`)
            .then(r => r.ok ? r.json() as Promise<LeaderboardEntry[]> : [])
            .then(setLeaderboard)
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const setAnswer = useCallback((qId: string, val: string | string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
    if (!survey || survey.type !== 'test') return;
    const q = survey.questions.find(x => x.id === qId);
    if (!q?.correctOptions?.length || !q.topicTags?.length) return;
    const givenArr = Array.isArray(val) ? val : [val];
    const correct = q.correctOptions;
    const isCorrect = givenArr.length === correct.length && givenArr.every(g => correct.includes(g));
    if (isCorrect) return;
    setAdaptiveExtra(prev => {
      const alreadyIds = new Set([...prev.map(x => x.id), ...survey.questions.map(x => x.id)]);
      const candidate = survey.questions.find(x =>
        !alreadyIds.has(x.id) && x.topicTags?.some(t => q.topicTags!.includes(t))
      );
      return candidate ? [...prev, candidate] : prev;
    });
  }, [survey]);

  const startSurvey = () => {
    startTime.current = Date.now();
    timerExpired.current = false;
    setCurrentStep('questions');
  };

  const retake = () => {
    setAnswers({});
    setResult(null);
    setError('');
    timerExpired.current = false;
    startTime.current = Date.now();
    setCurrentStep('questions');
  };

  const handleTimerExpire = useCallback(() => {
    if (timerExpired.current) return;
    timerExpired.current = true;
    void submit(true);
  }, [answers, survey]);

  async function submit(forced = false) {
    if (!survey) return;
    if (!forced) {
      const missing = visibleQuestions.filter(q => {
        if (!q.required) return false;
        const a = answers[q.id];
        return !a || (Array.isArray(a) ? a.length === 0 : a.trim() === '');
      });
      if (missing.length > 0) {
        setError(`${missing.length} zorunlu soru yanıtsız.`);
        return;
      }
    }
    setBusy(true);
    setError('');
    const timeTaken = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : undefined;
    try {
      const res = await fetch(`${API}/api/v1/surveys/${survey.id}/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, respondentEmail: email || undefined, source: 'sahne', timeTaken }),
      });
      const data = await res.json() as SubmitResult & { message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Hata oluştu.');
      setResult(data);
      setCurrentStep('done');
      try {
        localStorage.setItem(`snd_${survey.id}`, JSON.stringify({
          percent: data.percent ?? null, passed: data.passed ?? null,
          completedAt: new Date().toISOString(),
        }));
      } catch {}
      if (user) {
        void recordAction(survey.type === 'test' ? 'p-yarisma' : 'p-anket');
      }
      if (survey.type === 'test') {
        fetch(`${API}/api/v1/surveys/${survey.id}/leaderboard`)
          .then(r => r.ok ? r.json() as Promise<LeaderboardEntry[]> : [])
          .then(setLeaderboard)
          .catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

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

  if (!survey) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">İçerik bulunamadı.</p>
            <Link href="/sen-ne-dersin" className="text-[#26496b] text-sm font-semibold hover:underline">Geri dön</Link>
          </div>
        </main>
      </>
    );
  }

  const isTest = survey.type === 'test';

  // Filter visible questions based on conditional logic, then append adaptive extras
  const baseVisible = survey.questions.filter(q => {
    if (!q.conditionQuestionId || !q.conditionValues?.length) return true;
    const prevAnswer = answers[q.conditionQuestionId];
    if (!prevAnswer) return false;
    const prevArr = Array.isArray(prevAnswer) ? prevAnswer : [prevAnswer];
    return q.conditionValues.some(v => prevArr.includes(v));
  });
  const visibleQuestions = [...baseVisible, ...adaptiveExtra.filter(e => !baseVisible.find(b => b.id === e.id))];

  const completedCount = visibleQuestions.filter(q => {
    const a = answers[q.id];
    return a && (Array.isArray(a) ? a.length > 0 : a.trim() !== '');
  }).length;
  const progress = visibleQuestions.length > 0 ? (completedCount / visibleQuestions.length) * 100 : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <Link href={isTest ? '/sen-ne-dersin/testler' : '/sen-ne-dersin/anketler'} className="hover:text-gray-600">Sen Ne Dersin?</Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-gray-600 font-medium">{isTest ? 'Testler' : 'Anketler'}</span>
          </div>

          {/* Challenge banner */}
          {currentStep === 'intro' && challengeScore && isTest && (
            <div className="mb-4 flex items-center gap-3 px-5 py-3.5 bg-violet-600 text-white rounded-2xl shadow-lg">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <div className="flex-1">
                <p className="text-sm font-bold">Sana meydan okundu!</p>
                <p className="text-xs text-violet-200">Hedef: <strong className="text-white">%{challengeScore}</strong> — bunu geçebilir misin?</p>
              </div>
              <span className="text-2xl font-black text-violet-200">⚡</span>
            </div>
          )}

          {/* Intro */}
          {currentStep === 'intro' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Cover image or colored stripe */}
              {survey.coverImageUrl ? (
                <div className="relative h-52 sm:h-64 overflow-hidden">
                  <img src={survey.coverImageUrl} alt={survey.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <span className={`inline-flex text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 ${isTest ? 'bg-violet-500/90 text-white' : 'bg-sky-500/90 text-white'}`}>
                      {isTest ? 'Test' : 'Anket'}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{survey.title}</h1>
                  </div>
                </div>
              ) : (
                <div className={`h-3 ${isTest ? 'bg-gradient-to-r from-violet-500 to-purple-600' : 'bg-gradient-to-r from-sky-500 to-blue-600'}`} />
              )}
              <div className="p-8">
                {!survey.coverImageUrl && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isTest ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                      {isTest ? 'Test' : 'Anket'}
                    </span>
                    {survey.status === 'ended' && (
                      <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Sona Erdi</span>
                    )}
                  </div>
                )}
                {!survey.coverImageUrl && <h1 className="text-2xl font-bold text-gray-900 mb-3">{survey.title}</h1>}
                {survey.coverImageUrl && survey.status === 'ended' && (
                  <span className="inline-flex text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 mb-4">Sona Erdi</span>
                )}
                {survey.description && <p className="text-gray-500 text-sm leading-relaxed mb-6">{survey.description}</p>}

                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{survey.questions.length}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Soru</div>
                  </div>
                  {isTest && survey.timeLimit ? (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{Math.round(survey.timeLimit / 60)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Dakika</div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{survey.responseCount}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Katılımcı</div>
                    </div>
                  )}
                  {isTest && survey.passingScore != null ? (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{survey.passingScore}%</div>
                      <div className="text-xs text-gray-400 mt-0.5">Geçme Notu</div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{survey.allowAnonymous ? '✓' : '✗'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Anonim</div>
                    </div>
                  )}
                </div>

                {/* Previous completion banner */}
                {prevCompletion && (
                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-sm ${
                    isTest
                      ? prevCompletion.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
                      : 'bg-sky-50 border border-sky-200'
                  }`}>
                    <span className="text-lg">{isTest ? (prevCompletion.passed ? '✓' : '↻') : '✓'}</span>
                    <div>
                      {isTest && prevCompletion.percent != null ? (
                        <p className={`font-semibold text-xs ${prevCompletion.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
                          Daha önce çözdün — Skor: {prevCompletion.percent}%{prevCompletion.passed ? ' (Geçti)' : ' (Geçemedi)'}
                        </p>
                      ) : (
                        <p className="font-semibold text-xs text-sky-700">Bu ankete daha önce katıldın</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(prevCompletion.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {survey.allowAnonymous && !user && (
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta (isteğe bağlı)</label>
                    <input type="email" placeholder="ornek@email.com"
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] transition-all"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                )}
                {user && (
                  <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium">
                      {user.profile?.displayName ?? user.email} olarak katılıyorsunuz
                    </p>
                  </div>
                )}

                {survey.status !== 'active' ? (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500 text-center">Bu içerik artık yanıt almıyor.</div>
                ) : (
                  <button onClick={startSurvey} className={`w-full py-4 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 ${isTest ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-gradient-to-r from-sky-600 to-blue-600'}`}>
                    {isTest ? 'Teste Başla →' : 'Ankete Katıl →'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard (tests only, intro step) */}
          {currentStep === 'intro' && isTest && leaderboard.length > 0 && (
            <div className="mt-5 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-900">Liderlik Tablosu</h2>
                <span className="text-xs text-gray-400">{leaderboard.length} oyuncu</span>
              </div>
              <div className="divide-y divide-gray-50">
                {leaderboard.slice(0, 10).map((entry) => (
                  <div key={entry.rank} className={`flex items-center gap-3 px-6 py-3 ${entry.rank <= 3 ? 'bg-amber-50/50' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      entry.rank === 1 ? 'bg-amber-400 text-white' :
                      entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      entry.rank === 3 ? 'bg-amber-600/70 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>{entry.rank}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{entry.name}</p>
                      {entry.timeTaken != null && (
                        <p className="text-[11px] text-gray-400">{Math.floor(entry.timeTaken / 60)}:{String(entry.timeTaken % 60).padStart(2, '0')}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${entry.passed === true ? 'text-emerald-600' : entry.passed === false ? 'text-red-500' : 'text-gray-700'}`}>
                        {entry.percent}%
                      </p>
                      {entry.passed != null && (
                        <p className={`text-[10px] font-semibold ${entry.passed ? 'text-emerald-500' : 'text-red-400'}`}>
                          {entry.passed ? 'GEÇTİ' : 'KALDI'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          {currentStep === 'questions' && (
            <div>
              {/* Header */}
              <div className={`bg-white rounded-2xl border shadow-sm px-5 py-4 mb-5 flex items-center justify-between ${isTest ? 'border-violet-100' : 'border-sky-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">{completedCount} / {visibleQuestions.length} yanıtlandı</span>
                    <span className="text-xs font-bold text-gray-700">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${isTest ? 'bg-violet-500' : 'bg-sky-500'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {isTest && survey.timeLimit && (
                  <div className="ml-4 shrink-0">
                    <Timer seconds={survey.timeLimit} onExpire={handleTimerExpire} />
                  </div>
                )}
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {visibleQuestions.map((q, i) => {
                  const answered = answers[q.id] && (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : (answers[q.id] as string).trim() !== '');
                  return (
                    <div key={q.id} className={`bg-white rounded-3xl shadow-sm overflow-hidden transition-all relative border ${answered ? 'border-gray-200 shadow-md' : 'border-gray-100'}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all rounded-l-3xl ${answered ? (isTest ? 'bg-violet-500' : 'bg-sky-500') : 'bg-transparent'}`} />
                      <div className="absolute top-3 right-4 text-[80px] font-black text-gray-200 leading-none select-none pointer-events-none tabular-nums">{String(i + 1).padStart(2, '0')}</div>
                      {adaptiveExtra.some(e => e.id === q.id) && (
                        <div className="px-6 pt-3 pb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            Adaptif Soru
                          </span>
                        </div>
                      )}
                      {q.scenarioText && (
                        <div className="px-6 pt-5 pb-3 bg-amber-50/60 border-b border-amber-100">
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <p className="text-xs text-amber-800 leading-relaxed">{q.scenarioText}</p>
                          </div>
                        </div>
                      )}
                      {q.imageUrl && (
                        <img src={q.imageUrl} alt="" className="w-full max-h-56 object-contain bg-gray-50" />
                      )}
                      <div className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 transition-all ${answered ? (isTest ? 'bg-violet-500 text-white' : 'bg-sky-500 text-white') : 'bg-gray-100 text-gray-400'}`}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-relaxed">{q.questionText}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {q.required && <span className="text-xs text-red-500">Zorunlu</span>}
                              {isTest && q.points > 0 && <span className="text-xs text-gray-400">{q.points} puan</span>}
                              {isTest && q.topicTags?.length > 0 && (
                                <span className="text-xs text-[#26496b]/60 bg-[#26496b]/5 px-1.5 py-0.5 rounded-md">{q.topicTags[0]}</span>
                              )}
                            </div>
                          </div>
                          {answered && (
                            <svg className={`w-5 h-5 shrink-0 ${isTest ? 'text-violet-500' : 'text-sky-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {(q.type === 'single' || q.type === 'truefalse') && (
                          <SingleQuestion q={q} value={(answers[q.id] as string) ?? ''} onChange={v => setAnswer(q.id, v)} />
                        )}
                        {q.type === 'multiple' && (
                          <MultiQuestion q={q} value={(answers[q.id] as string[]) ?? []} onChange={v => setAnswer(q.id, v)} />
                        )}
                        {q.type === 'text' && (
                          <TextQuestion q={q} value={(answers[q.id] as string) ?? ''} onChange={v => setAnswer(q.id, v)} />
                        )}
                        {q.type === 'rating' && (
                          <RatingQuestion q={q} value={(answers[q.id] as string) ?? ''} onChange={v => setAnswer(q.id, v)} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

              <div className="mt-6 flex gap-3">
                <button onClick={() => setCurrentStep('intro')} className="px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors">
                  ← Geri
                </button>
                <button disabled={busy} onClick={() => void submit()} className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 ${isTest ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-gradient-to-r from-sky-600 to-blue-600'}`}>
                  {busy ? 'Gönderiliyor…' : isTest ? 'Testi Bitir' : 'Yanıtları Gönder'}
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {currentStep === 'done' && result && (
            isTest
              ? <TestResultView result={result} survey={survey} onRetake={retake} leaderboard={leaderboard} challengerName={challengeScore ? `Hedef: %${challengeScore}` : null} />
              : <SurveyThanks onGoBack={() => setCurrentStep('intro')} survey={survey} />
          )}

        </div>
      </main>
    </>
  );
}
