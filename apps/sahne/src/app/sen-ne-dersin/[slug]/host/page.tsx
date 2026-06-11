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

interface Breakdown {
  option: string;
  count: number;
  percent: number;
  isCorrect: boolean;
}

interface LiveResults {
  results: Array<{
    questionId: string;
    questionText: string;
    type: string;
    total: number;
    breakdown: Breakdown[];
  }>;
  totalParticipants: number;
}

interface LeaderboardEntry { participantId: string; participantName: string | null; score: number; }

function LiveBar({ breakdown }: { breakdown: Breakdown[] }) {
  return (
    <div className="space-y-2 mt-3">
      {breakdown.map(b => (
        <div key={b.option} className="flex items-center gap-3">
          <span className="w-32 text-sm text-gray-700 truncate">{b.option}</span>
          <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
            <div className={`h-full rounded-lg transition-all duration-500 ${b.isCorrect ? 'bg-green-500' : 'bg-[#26496b]'}`} style={{ width: `${b.percent}%` }} />
          </div>
          <span className="w-16 text-right text-xs font-mono text-gray-500">{b.count} ({b.percent}%)</span>
        </div>
      ))}
    </div>
  );
}

export default function HostPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const code = searchParams.get('kod') ?? '';

  const [session, setSession] = useState<LiveSession | null>(null);
  const [results, setResults] = useState<LiveResults | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/surveys/live/${code}`);
      if (!r.ok) throw new Error('Oturum bulunamadı.');
      const s = await r.json() as LiveSession;
      setSession(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [code]);

  const fetchResults = useCallback(async () => {
    if (!code) return;
    try {
      const r = await fetch(`${API}/api/v1/surveys/live/${code}/results`);
      if (r.ok) setResults(await r.json() as LiveResults);
    } catch { /* ignore */ }
  }, [code]);

  useEffect(() => {
    if (!code) { setError('Kod eksik.'); setLoading(false); return; }
    void fetchSession();

    const es = new EventSource(`${API}/api/v1/surveys/live/${code}/events`);
    eventSourceRef.current = es;
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as { type: string; data: unknown };
        if (event.type === 'joined') {
          const d = event.data as { count: number };
          setSession(s => s ? { ...s, participantCount: d.count } : s);
        } else if (event.type === 'advance') {
          const d = event.data as { index: number; status: string };
          setSession(s => s ? { ...s, currentQuestionIndex: d.index, status: d.status } : s);
          if (d.status === 'showing_results') void fetchResults();
        } else if (event.type === 'response') {
          void fetchResults();
        } else if (event.type === 'leaderboard') {
          setLeaderboard(event.data as LeaderboardEntry[]);
        } else if (event.type === 'ended') {
          setSession(s => s ? { ...s, status: 'ended' } : s);
          es.close();
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [code, fetchSession, fetchResults]);

  const advance = async () => {
    if (!session) return;
    setAdvancing(true);
    try {
      const r = await fetch(`${API}/api/v1/surveys/admin/live/${code}/advance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
      });
      if (!r.ok) throw new Error('İzin yok veya hata.');
      const s = await r.json() as LiveSession;
      setSession(prev => prev ? { ...prev, ...s } : s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setAdvancing(false);
    }
  };

  const endSession = async () => {
    if (!confirm('Oturumu sonlandırmak istediğinize emin misiniz?')) return;
    try {
      await fetch(`${API}/api/v1/surveys/admin/live/${code}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
      });
    } catch { /* ignore */ }
  };

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

  if (error || !session) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">{error || 'Oturum bulunamadı.'}</p>
            <Link href={`/sen-ne-dersin/${slug}`} className="text-[#26496b] text-sm font-semibold hover:underline">Geri dön</Link>
          </div>
        </main>
      </>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex] ?? null;
  const currentResults = currentQuestion
    ? results?.results.find(r => r.questionId === currentQuestion.id)
    : null;
  const isEnded = session.status === 'ended';
  const isShowingResults = session.status === 'showing_results';
  const isWaiting = session.status === 'waiting';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0c1a2e] py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
                <Link href={`/sen-ne-dersin/${slug}`} className="hover:text-white/60">Geri</Link>
                <span>/</span>
                <span className="text-white/60">Host Paneli</span>
              </div>
              <h1 className="text-white font-bold text-lg">Canlı Oturum Kontrolü</h1>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white tracking-widest">{session.code}</div>
              <div className="text-xs text-white/40">Katılım Kodu</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Katılımcı', value: session.participantCount },
              { label: 'Soru', value: `${Math.max(0, session.currentQuestionIndex + 1)} / ${session.questions.length}` },
              { label: 'Durum', value: isWaiting ? 'Bekleme' : isEnded ? 'Bitti' : isShowingResults ? 'Sonuçlar' : 'Aktif' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-2xl p-4 text-center">
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Waiting state */}
          {isWaiting && (
            <div className="bg-white/5 rounded-3xl p-10 text-center mb-6">
              <p className="text-white/60 text-sm mb-4">Katılımcılar bekleme odasında. İlk soruyu başlatmak için devam edin.</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href={`/sen-ne-dersin/${slug}/canli?kod=${session.code}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                >
                  Katılım Linkini Gör
                </Link>
              </div>
            </div>
          )}

          {/* Active question */}
          {currentQuestion && !isEnded && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              {currentQuestion.imageUrl && (
                <img src={currentQuestion.imageUrl} alt="" className="w-full h-44 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    Soru {session.currentQuestionIndex + 1}
                  </span>
                  {currentResults && (
                    <span className="text-xs text-gray-500">{currentResults.total} yanıt</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">{currentQuestion.questionText}</h2>
                {currentResults && currentResults.breakdown && (
                  <LiveBar breakdown={currentResults.breakdown} />
                )}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-5 mb-6">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Liderlik Tablosu</h3>
              <div className="space-y-1.5">
                {leaderboard.map((e, i) => (
                  <div key={e.participantId} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-amber-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-700 text-amber-100' : 'bg-white/10 text-white/50'}`}>{i + 1}</span>
                    <span className="flex-1 text-sm text-white/80 truncate">{e.participantName ?? 'Anonim'}</span>
                    <span className="text-sm font-bold text-sky-400">{e.score} puan</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          {!isEnded && (
            <div className="flex gap-3">
              <button
                onClick={() => void advance()}
                disabled={advancing || isEnded}
                className="flex-1 py-4 rounded-2xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                {advancing ? 'İlerliyor…' : isShowingResults ? 'Bitir' : isWaiting ? 'İlk Soruyu Başlat →' : 'Sonraki Soru →'}
              </button>
              <button
                onClick={() => void endSession()}
                className="px-6 py-4 rounded-2xl bg-red-600/20 text-red-400 font-bold text-sm hover:bg-red-600/30 transition-colors"
              >
                Sonlandır
              </button>
            </div>
          )}

          {isEnded && (
            <div className="bg-white/5 rounded-3xl p-8 text-center">
              <p className="text-white/70 text-sm mb-4">Oturum sona erdi.</p>
              <Link
                href={`/sen-ne-dersin/${slug}/sonuclar`}
                className="inline-block px-6 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition-colors"
              >
                Sonuçları Gör
              </Link>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
