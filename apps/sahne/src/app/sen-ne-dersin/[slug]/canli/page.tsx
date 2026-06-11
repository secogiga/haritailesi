'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Question {
  id: string;
  questionText: string;
  type: string;
  options: string[] | null;
  imageUrl: string | null;
  sortOrder: number;
}

interface LiveSession {
  id: string;
  code: string;
  status: string;
  currentQuestionIndex: number;
  participantCount: number;
  questions: Question[];
}

type Stage = 'join' | 'waiting' | 'question' | 'results';

interface LeaderboardEntry { participantId: string; participantName: string | null; score: number; }

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = total > 0 ? seconds / total : 0;
  const r = 22; const circ = 2 * Math.PI * r;
  const color = seconds <= 5 ? '#ef4444' : seconds <= 10 ? '#f59e0b' : '#0ea5e9';
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">{seconds}</span>
    </div>
  );
}

function Leaderboard({ entries, myId }: { entries: LeaderboardEntry[]; myId: string }) {
  if (entries.length === 0) return null;
  return (
    <div className="mt-4 bg-gray-50 rounded-2xl p-4">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Liderlik Tablosu</h4>
      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <div key={e.participantId} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${e.participantId === myId ? 'bg-sky-100 text-sky-900 font-semibold' : 'bg-white text-gray-700'}`}>
            <span className="w-5 text-center font-bold text-gray-400 text-xs">{i + 1}.</span>
            <span className="flex-1 truncate">{e.participantName ?? 'Anonim'}</span>
            <span className="font-bold text-sky-600">{e.score} puan</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function JoinForm({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Canlı Oturuma Katıl</h2>
        <p className="text-sm text-gray-500 mb-6">Host soruları başlatınca birlikte cevaplayacaksınız.</p>
        <input
          type="text"
          placeholder="Adınız (isteğe bağlı)"
          className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all mb-4"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onJoin(name)}
        />
        <button
          onClick={() => onJoin(name)}
          className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition-colors"
        >
          Katıl
        </button>
      </div>
    </div>
  );
}

function WaitingRoom({ session, participantName }: { session: LiveSession; participantName: string }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-sky-100 animate-ping opacity-30" />
          <div className="relative w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center">
            <svg className="w-9 h-9 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Bekleme Odası</h2>
        <p className="text-sm text-gray-500 mb-6">
          {participantName ? `Hoş geldin, ${participantName}!` : 'Hoş geldin!'} Host oturumu başlatınca otomatik ilerleyeceksiniz{dots}
        </p>
        <div className="bg-gray-50 rounded-2xl px-6 py-4">
          <div className="text-3xl font-bold text-gray-900 tracking-widest mb-1">{session.code}</div>
          <div className="text-xs text-gray-400">Katılım Kodu</div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{session.participantCount}</span> katılımcı bağlandı
        </div>
      </div>
    </div>
  );
}

export default function LiveSessionPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const code = searchParams.get('kod') ?? '';

  const [session, setSession] = useState<LiveSession | null>(null);
  const [stage, setStage] = useState<Stage>('join');
  const [participantId] = useState(() => `anon_${Math.random().toString(36).substring(2, 10)}`);
  const [participantName, setParticipantName] = useState('');
  const [answer, setAnswer] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const currentQuestion = session
    ? session.questions[session.currentQuestionIndex] ?? null
    : null;

  const connectSSE = useCallback((sessionCode: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`${API}/api/v1/surveys/live/${sessionCode}/events`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as { type: string; data: unknown };
        if (event.type === 'advance') {
          const d = event.data as { index: number; status: string; timeLimit?: number | null };
          setSession(s => s ? { ...s, currentQuestionIndex: d.index, status: d.status } : s);
          if (d.status === 'active') {
            setAnswer([]); setSubmitted(false); setResponseCount(0); setStage('question');
            if (timerRef.current) clearInterval(timerRef.current);
            if (d.timeLimit) {
              setTimeLeft(d.timeLimit); setTotalTime(d.timeLimit);
              timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                  if (prev === null || prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            } else {
              setTimeLeft(null); setTotalTime(null);
            }
          } else if (d.status === 'showing_results') {
            if (timerRef.current) clearInterval(timerRef.current);
            setStage('results');
          }
        } else if (event.type === 'joined') {
          const d = event.data as { count: number };
          setSession(s => s ? { ...s, participantCount: d.count } : s);
        } else if (event.type === 'response') {
          const d = event.data as { responseCount: number };
          setResponseCount(d.responseCount);
        } else if (event.type === 'leaderboard') {
          setLeaderboard(event.data as LeaderboardEntry[]);
        } else if (event.type === 'ended') {
          if (timerRef.current) clearInterval(timerRef.current);
          setStage('results');
          es.close();
        }
      } catch { /* ignore parse errors */ }
    };
    es.onerror = () => { /* SSE will auto-reconnect */ };
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleJoin = async (name: string) => {
    if (!code) { setError('Geçersiz katılım kodu.'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/v1/surveys/live/${code}`);
      if (!r.ok) throw new Error('Oturum bulunamadı.');
      const s = await r.json() as LiveSession;
      setSession(s);

      await fetch(`${API}/api/v1/surveys/live/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, participantName: name || undefined }),
      });

      setParticipantName(name);
      connectSSE(code);

      if (s.status === 'active' && s.currentQuestionIndex >= 0) setStage('question');
      else if (s.status === 'showing_results' || s.status === 'ended') setStage('results');
      else setStage('waiting');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && !submitted && answer.length > 0) void handleSubmit(answer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSubmit = async (sel: string[]) => {
    if (!session || !currentQuestion || submitted) return;
    setSubmitted(true);
    try {
      await fetch(`${API}/api/v1/surveys/live/${code}/respond/${currentQuestion.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, participantName: participantName || undefined, answer: sel }),
      });
    } catch { /* ignore */ }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <Link href="/sen-ne-dersin" className="hover:text-gray-600">Sen Ne Dersin?</Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link href={`/sen-ne-dersin/${slug}`} className="hover:text-gray-600">{slug}</Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-gray-600 font-medium">Canlı Oturum</span>
          </div>

          {error && <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          {stage === 'join' && <JoinForm onJoin={loading ? () => {} : handleJoin} />}
          {stage === 'waiting' && session && <WaitingRoom session={session} participantName={participantName} />}

          {stage === 'question' && session && currentQuestion && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {currentQuestion.imageUrl && (
                <img src={currentQuestion.imageUrl} alt="" className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
                    {session.currentQuestionIndex + 1} / {session.questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    {timeLeft !== null && totalTime !== null && (
                      <CountdownRing seconds={timeLeft} total={totalTime} />
                    )}
                    {submitted && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Gönderildi · {responseCount} yanıt
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-5">{currentQuestion.questionText}</h2>

                {currentQuestion.type !== 'text' && (
                  <div className="space-y-3">
                    {(currentQuestion.options ?? []).map((opt) => {
                      const selected = answer.includes(opt);
                      return (
                        <button
                          key={opt}
                          disabled={submitted}
                          onClick={() => {
                            const newAnswer = currentQuestion.type === 'multiple'
                              ? (selected ? answer.filter(a => a !== opt) : [...answer, opt])
                              : [opt];
                            setAnswer(newAnswer);
                            if (currentQuestion.type !== 'multiple') {
                              void handleSubmit(newAnswer);
                            }
                          }}
                          className={`w-full p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${selected ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'} ${submitted ? 'opacity-75 cursor-default' : 'cursor-pointer'}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                    {currentQuestion.type === 'multiple' && !submitted && (
                      <button
                        onClick={() => void handleSubmit(answer)}
                        disabled={answer.length === 0}
                        className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition-colors disabled:opacity-50 mt-2"
                      >
                        Yanıtla
                      </button>
                    )}
                  </div>
                )}

                {!submitted && (
                  <p className="text-center text-xs text-gray-400 mt-4">Host bir sonraki soruya geçince otomatik ilerlersiniz.</p>
                )}
              </div>
              {leaderboard.length > 0 && (
                <div className="px-6 pb-6">
                  <Leaderboard entries={leaderboard} myId={participantId} />
                </div>
              )}
            </div>
          )}

          {stage === 'results' && (
            <div className="text-center">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
                <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Oturum Tamamlandı!</h2>
                <p className="text-sm text-gray-500 mb-6">Sonuçlar hazırlanıyor.</p>
                {session && (
                  <Link
                    href={`/sen-ne-dersin/${slug}/sonuclar`}
                    className="inline-block px-6 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition-colors"
                  >
                    Sonuçları Gör
                  </Link>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
