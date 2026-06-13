'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToken } from '@/hooks/useToken';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type Question = {
  id: string; question: string; questionType: string;
  options: string[] | null; sortOrder: number;
};

type Quiz = {
  id: string; title: string; passingScore: number; questions: Question[];
  maxAttempts: number;
  attemptInfo?: { attemptCount: number; remaining: number | null };
};

type QuestionResult = {
  id: string; question: string; isCorrect: boolean;
  userAnswer: string | string[] | null;
  correctAnswers?: string[]; explanation?: string | null;
};

type Result = {
  score: number; passed: boolean; correctCount: number; total: number;
  passingScore: number; questionResults: QuestionResult[];
  attemptCount?: number; remaining?: number | null;
};

export default function QuizPage({ params }: { params: Promise<{ trainingSlug: string; quizId: string }> }) {
  const { trainingSlug, quizId } = use(params);
  const token = useToken();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/v1/cms/quizzes/${quizId}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setQuiz(d as Quiz))
      .catch(() => {});
  }, [quizId, token]);

  function setAnswer(questionId: string, value: string, multi = false) {
    if (multi) {
      setAnswers(prev => {
        const current = (prev[questionId] as string[]) ?? [];
        const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        return { ...prev, [questionId]: next };
      });
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  }

  async function submit() {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/quizzes/${quizId}/submit`, {
        method: 'POST', credentials: 'include',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json() as Result;
        setResult(data);
        setShowDetail(false);
      }
    } finally { setSubmitting(false); }
  }

  function retry() {
    setResult(null);
    setAnswers({});
    setCurrentQ(0);
    setShowDetail(false);
    // Yeni attempt bilgisi için quiz'i yeniden yükle
    if (token) {
      fetch(`${API_URL}/api/v1/cms/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setQuiz(d as Quiz); })
        .catch(() => {});
    }
  }

  if (!token || !quiz) return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
    </div>
  );

  // Deneme hakkı kontrolü
  const remaining = quiz.attemptInfo?.remaining ?? null;
  const noAttemptsLeft = remaining !== null && remaining <= 0;

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Özet kart */}
        <div className={`rounded-3xl p-8 text-center mb-6 ${result.passed ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className="text-5xl mb-4">{result.passed ? '🏆' : '📚'}</p>
          <h2 className={`text-2xl font-black mb-2 ${result.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {result.passed ? 'Geçtiniz!' : 'Yeterli Puan Alınamadı'}
          </h2>
          <p className="text-4xl font-black text-gray-900 dark:text-slate-100 mb-1">%{result.score}</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
            {result.correctCount} / {result.total} doğru · Geçme notu: %{result.passingScore}
          </p>
          {result.remaining !== null && result.remaining !== undefined && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
              Kalan deneme hakkı: {result.remaining}
            </p>
          )}
          {result.passed && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">
              Sertifikanız oluşturuldu! Hesabım &gt; Sertifikalar bölümünden görüntüleyebilirsiniz.
            </p>
          )}
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => router.push(`/egitim/${trainingSlug}`)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl hover:bg-[var(--color-mavi-dark)] transition-colors">
              Kursa Dön
            </button>
            {!result.passed && !noAttemptsLeft && (
              <button onClick={retry}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                Tekrar Dene
              </button>
            )}
          </div>
          {!result.passed && noAttemptsLeft && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-3">Tüm deneme haklarınızı kullandınız.</p>
          )}
        </div>

        {/* Soru bazında sonuçlar */}
        {result.questionResults && result.questionResults.length > 0 && (
          <div>
            <button onClick={() => setShowDetail(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors mb-3">
              <span>Soru Bazında Sonuçlar</span>
              <span className="text-xs text-gray-400">{showDetail ? '▲ Gizle' : '▼ Göster'}</span>
            </button>
            {showDetail && (
              <div className="space-y-3">
                {result.questionResults.map((qr, i) => (
                  <div key={qr.id}
                    className={`rounded-2xl border-2 p-4 ${qr.isCorrect ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10' : 'border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${qr.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                        {qr.isCorrect ? '✓' : '✗'}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-snug">
                        {i + 1}. {qr.question}
                      </p>
                    </div>
                    <div className="ml-9 space-y-1.5">
                      {qr.userAnswer !== null && (
                        <p className="text-xs text-gray-600 dark:text-slate-400">
                          <span className="font-semibold">Yanıtınız:</span>{' '}
                          {Array.isArray(qr.userAnswer) ? qr.userAnswer.join(', ') : qr.userAnswer}
                        </p>
                      )}
                      {!qr.isCorrect && qr.correctAnswers && qr.correctAnswers.length > 0 && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          <span className="font-semibold">Doğru cevap:</span>{' '}
                          {qr.correctAnswers.join(', ')}
                        </p>
                      )}
                      {qr.explanation && (
                        <p className="text-xs text-gray-500 dark:text-slate-500 italic mt-1">{qr.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Attempt limiti aşıldıysa engel ekranı
  if (noAttemptsLeft) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <div className="rounded-3xl p-8 bg-gray-50 dark:bg-slate-800">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-200 mb-2">Deneme Hakkı Kalmadı</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
            Bu quiz için maksimum deneme hakkınızı ({quiz.maxAttempts}) kullandınız.
          </p>
          <button onClick={() => router.push(`/egitim/${trainingSlug}`)}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl hover:bg-[var(--color-mavi-dark)] transition-colors">
            Kursa Dön
          </button>
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentQ]!;
  const isMulti = q.questionType === 'multi';
  const isText = q.questionType === 'text';
  const currentAnswer = answers[q.id];
  const hasAnswer = isText ? typeof currentAnswer === 'string' && currentAnswer.trim() !== ''
    : Array.isArray(currentAnswer) ? currentAnswer.length > 0 : !!currentAnswer;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Deneme hakkı göstergesi */}
      {quiz.attemptInfo && quiz.maxAttempts > 0 && (
        <div className="flex justify-end mb-3">
          <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-3 py-1 rounded-full">
            Deneme: {quiz.attemptInfo.attemptCount + 1} / {quiz.maxAttempts}
          </span>
        </div>
      )}

      {/* İlerleme */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>{quiz.title}</span>
          <span>{currentQ + 1} / {quiz.questions.length}</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-[var(--color-mavi)] transition-all"
            style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Soru */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 mb-4">
        <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-5">{q.question}</p>

        {isText ? (
          <textarea rows={3} value={(currentAnswer as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)}
            placeholder="Yanıtınızı yazın…"
            className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/40 resize-none" />
        ) : (
          <div className="space-y-2">
            {q.options?.map((opt, i) => {
              const selected = isMulti
                ? ((currentAnswer as string[]) ?? []).includes(opt)
                : currentAnswer === opt;
              return (
                <button key={i} onClick={() => setAnswer(q.id, opt, isMulti)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm ${selected ? 'border-[var(--color-mavi)] bg-[var(--color-mavi)]/5 text-[var(--color-mavi)] font-semibold' : 'border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-slate-300'}`}>
                  <span className={`w-5 h-5 rounded-${isMulti ? 'md' : 'full'} border-2 flex items-center justify-center shrink-0 text-[10px] ${selected ? 'border-[var(--color-mavi)] bg-[var(--color-mavi)] text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                    {selected ? '✓' : ''}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigasyon */}
      <div className="flex justify-between gap-3">
        {currentQ > 0 ? (
          <button onClick={() => setCurrentQ(q => q - 1)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">← Önceki</button>
        ) : <div />}

        {currentQ < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrentQ(q => q + 1)} disabled={!hasAnswer}
            className="px-5 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl disabled:opacity-40 hover:bg-[var(--color-mavi-dark)] transition-colors">
            Sonraki →
          </button>
        ) : (
          <button onClick={() => void submit()} disabled={submitting || !hasAnswer}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl disabled:opacity-40 hover:bg-emerald-700 transition-colors flex items-center gap-2">
            {submitting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {submitting ? 'Hesaplanıyor…' : '✓ Quizi Tamamla'}
          </button>
        )}
      </div>
    </div>
  );
}
