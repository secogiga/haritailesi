'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface SurveyQuestion {
  id: string;
  questionText: string;
  type: 'single' | 'multiple' | 'text';
  options: string[] | null;
  sortOrder: number;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  endsAt: string | null;
  responseCount: string;
  questions?: SurveyQuestion[];
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  type: string;
  optionCounts?: Record<string, number>;
  optionPercentages?: Record<string, number>;
  textAnswers?: string[];
  totalResponses: number;
}

interface SurveyResults {
  surveyId: string;
  totalResponses: number;
  questions: QuestionResult[];
}

type Phase = 'list' | 'survey' | 'done' | 'results';

function DeadlineBadge({ endsAt }: { endsAt: string | null }) {
  if (!endsAt) return null;
  const d = new Date(endsAt);
  const now = new Date();
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return <span className="text-xs text-gray-400">Sona erdi</span>;
  if (daysLeft <= 3) return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{daysLeft} gün kaldı</span>;
  return <span className="text-xs text-gray-500 dark:text-slate-400">{d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} tarihine kadar</span>;
}

function ResultsView({ results, survey, onBack }: { results: SurveyResults; survey: Survey; onBack: () => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-[#26496b] to-[#1d3a57] px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Anket Sonuçları</p>
          <h2 className="text-lg font-bold">{survey.title}</h2>
          <p className="text-sm text-white/70 mt-1">{results.totalResponses} katılımcı</p>
        </div>

        <div className="p-6 space-y-8">
          {results.questions.map((q, qi) => (
            <div key={q.questionId}>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">
                <span className="text-[#26496b] mr-2">{qi + 1}.</span>
                {q.questionText}
              </p>

              {q.type === 'text' ? (
                <div className="space-y-2">
                  {(q.textAnswers ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400">Henüz yanıt yok.</p>
                  ) : (
                    (q.textAnswers ?? []).map((answer, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-slate-300 italic">
                        "{answer}"
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(q.optionCounts ?? {}).map(([option, count]) => {
                    const pct = q.optionPercentages?.[option] ?? 0;
                    return (
                      <div key={option}>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 mb-1">
                          <span>{option}</span>
                          <span className="font-semibold">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-[#26496b] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onBack}
            className="w-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Anketlere Dön
          </button>
        </div>
      </div>
    </div>
  );
}

function SurveyForm({ survey, onDone }: { survey: Survey; onDone: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const questions = survey.questions ?? [];

  function setAnswer(qId: string, type: string, value: string) {
    if (type === 'multiple') {
      setAnswers(prev => {
        const current = (prev[qId] as string[]) ?? [];
        const exists = current.includes(value);
        return { ...prev, [qId]: exists ? current.filter(v => v !== value) : [...current, value] };
      });
    } else {
      setAnswers(prev => ({ ...prev, [qId]: value }));
    }
  }

  function isSelected(qId: string, type: string, value: string) {
    if (type === 'multiple') return ((answers[qId] as string[]) ?? []).includes(value);
    return answers[qId] === value;
  }

  const requiredUnanswered = questions.filter(q => {
    if (q.type === 'text') return false;
    return !answers[q.id] || (Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0);
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (requiredUnanswered.length > 0) {
      setError('Lütfen tüm zorunlu soruları yanıtlayın.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/surveys/${survey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, ...(email ? { respondentEmail: email } : {}), source: 'sahne' }),
      });
      if (!res.ok) throw new Error((await res.json() as { message?: string }).message ?? 'Hata');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-[#26496b] to-[#1d3a57] px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Anket</p>
          <h2 className="text-lg font-bold">{survey.title}</h2>
          {survey.description && <p className="text-sm text-white/70 mt-1">{survey.description}</p>}
        </div>

        <form onSubmit={(e) => void submit(e)} className="p-6 space-y-8">
          {questions.map((q, qi) => (
            <div key={q.id}>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">
                <span className="text-[#26496b] mr-2">{qi + 1}.</span>
                {q.questionText}
                {q.type !== 'text' && <span className="text-red-500 ml-1">*</span>}
                {q.type === 'multiple' && <span className="text-xs font-normal text-gray-400 ml-2">(Birden fazla seçebilirsiniz)</span>}
              </p>

              {q.type === 'text' ? (
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] resize-none"
                  value={(answers[q.id] as string) ?? ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Yanıtınızı yazın…"
                />
              ) : (
                <div className="space-y-2">
                  {(q.options ?? []).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(q.id, q.type, opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        isSelected(q.id, q.type, opt)
                          ? 'border-[#26496b] bg-[#26496b]/5 text-[#26496b] font-semibold'
                          : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className={`inline-flex w-5 h-5 rounded-full border mr-3 items-center justify-center shrink-0 ${
                        isSelected(q.id, q.type, opt)
                          ? 'border-[#26496b] bg-[#26496b]'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}>
                        {isSelected(q.id, q.type, opt) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta adresiniz <span className="font-normal text-gray-400">(isteğe bağlı)</span></label>
            <input
              type="email"
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@email.com"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60 text-sm"
          >
            {busy ? 'Gönderiliyor…' : 'Yanıtları Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AnketlerPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('list');
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [results, setResults] = useState<SurveyResults | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/surveys`)
      .then(r => r.json() as Promise<Survey[]>)
      .then(data => setSurveys(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function openSurvey(survey: Survey) {
    const res = await fetch(`${API}/api/v1/surveys/${survey.id}`);
    const data = await res.json() as Survey;
    setActiveSurvey(data);
    setPhase('survey');
  }

  async function viewResults(survey: Survey) {
    const res = await fetch(`${API}/api/v1/surveys/${survey.id}/results`);
    const data = await res.json() as SurveyResults;
    setResults(data);
    setActiveSurvey(survey);
    setPhase('results');
  }

  function handleDone() {
    if (activeSurvey) {
      void viewResults(activeSurvey);
    } else {
      setPhase('list');
    }
    setPhase('done');
  }

  async function handleDoneTransition() {
    if (activeSurvey) {
      const res = await fetch(`${API}/api/v1/surveys/${activeSurvey.id}/results`);
      const data = await res.json() as SurveyResults;
      setResults(data);
      setPhase('results');
    }
  }

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-anketler" />

      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">Sahne Modülleri</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Anketler</h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl text-sm sm:text-base">
              Haritailesi topluluğunun görüşlerini şekillendiriyoruz.
              Anketlere katılın, sonuçları herkesle paylaşıyoruz.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {phase === 'list' && (
            loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 animate-pulse space-y-3">
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : surveys.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-900 dark:text-slate-100 font-bold text-lg">Aktif anket yok</p>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Yeni anketler için takipte kalın.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {surveys.map(survey => (
                  <article key={survey.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      {survey.endsAt && <DeadlineBadge endsAt={survey.endsAt} />}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">{survey.title}</h3>
                    {survey.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1">{survey.description}</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{survey.responseCount} katılımcı</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void viewResults(survey)}
                          className="text-xs text-gray-500 dark:text-slate-400 hover:text-[#26496b] font-medium transition-colors"
                        >
                          Sonuçlar
                        </button>
                        <button
                          onClick={() => void openSurvey(survey)}
                          className="px-4 py-1.5 bg-[#26496b] text-white text-xs font-semibold rounded-lg hover:bg-[#1e3a56] transition-colors"
                        >
                          Katıl
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}

          {phase === 'survey' && activeSurvey && (
            <div>
              <button
                onClick={() => setPhase('list')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anketlere Dön
              </button>
              <SurveyForm survey={activeSurvey} onDone={handleDone} />
            </div>
          )}

          {phase === 'done' && activeSurvey && (
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Yanıtlarınız Alındı!</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Katkınız için teşekkürler. Sonuçları aşağıda görebilirsiniz.</p>
              <button
                onClick={() => void handleDoneTransition()}
                className="px-6 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56] transition-colors"
              >
                Sonuçları Gör
              </button>
            </div>
          )}

          {phase === 'results' && results && activeSurvey && (
            <div>
              <button
                onClick={() => setPhase('list')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anketlere Dön
              </button>
              <ResultsView results={results} survey={activeSurvey} onBack={() => setPhase('list')} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
