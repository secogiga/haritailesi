'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useToken } from '@/hooks/useToken';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type Lesson = {
  id: string; slug: string; title: string; description: string | null;
  contentType: string; videoUrl: string | null; videoEmbed: string | null;
  body: string | null; pdfKey: string | null; durationMinutes: number | null;
};

type SectionNav = {
  id: string; title: string;
  lessons: Array<{ id: string; slug: string; title: string; contentType: string; durationMinutes: number | null; quizId?: string }>;
};

type LessonQuestion = {
  id: string; question: string; answer: string | null;
  answeredAt: string | null; createdAt: string;
  askerName: string | null; askerAvatar: string | null;
};

function getYouTubeId(url: string | null) {
  if (!url) return null;
  return url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? null;
}

function getVimeoId(url: string | null) {
  if (!url) return null;
  return url.match(/vimeo\.com\/(\d+)/)?.[1] ?? null;
}

const CTYPE_ICONS: Record<string, string> = {
  video: '▶', text: '📄', pdf: '📎', quiz: '✏️', live: '🔴',
};

const CTYPE_COLOR: Record<string, string> = {
  video: 'text-blue-500', text: 'text-slate-400', pdf: 'text-orange-400', quiz: 'text-violet-500', live: 'text-rose-500',
};

export default function LessonPlayerPage({ params }: { params: Promise<{ trainingSlug: string; lessonSlug: string }> }) {
  const { trainingSlug, lessonSlug } = use(params);
  const token = useToken();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [sections, setSections] = useState<SectionNav[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  // XP toast
  const [xpToast, setXpToast] = useState<{ xp: number; rank: string; rankUp: boolean } | null>(null);
  // Q&A
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [askingQ, setAskingQ] = useState(false);

  // Ders içeriğini yükle
  useEffect(() => {
    if (!token) return;
    setLoading(true); setError('');
    fetch(`${API_URL}/api/v1/cms/trainings/${trainingSlug}/lessons/${lessonSlug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => { setLesson(d as Lesson); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [token, trainingSlug, lessonSlug]);

  // Kurs yapısını + ilerlemeyi yükle
  useEffect(() => {
    fetch(`${API_URL}/api/v1/cms/trainings/${trainingSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { id?: string; sections?: SectionNav[] } | null) => {
        if (!d) return;
        setSections(d.sections ?? []);
        if (d.id) setTrainingId(d.id);
      })
      .catch(() => {});
  }, [trainingSlug]);

  useEffect(() => {
    if (!token || !trainingId) return;
    fetch(`${API_URL}/api/v1/cms/trainings/${trainingId}/my-progress`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : [])
      .then(ids => {
        const idList = ids as string[];
        setCompletedIds(idList);
        if (lesson) setCompleted(idList.includes(lesson.id));
      }).catch(() => {});
  }, [token, trainingId, lesson]);

  const markComplete = useCallback(async () => {
    if (!token || !lesson) return;
    setMarking(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/lessons/${lesson.id}/complete`, {
        method: completed ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { completed: boolean; xpGained?: number; xp?: number; rankUp?: boolean; current?: { label: string; emoji: string } };
        const next = data.completed;
        setCompleted(next);
        setCompletedIds(prev => next ? [...prev, lesson.id] : prev.filter(id => id !== lesson.id));
        if (next && data.xpGained && data.xpGained > 0 && data.current) {
          setXpToast({ xp: data.xpGained, rank: data.current.label, rankUp: data.rankUp ?? false });
          setTimeout(() => setXpToast(null), data.rankUp ? 5000 : 3000);
        }
      }
    } finally { setMarking(false); }
  }, [token, lesson, completed]);

  // Q&A yükle
  useEffect(() => {
    if (!lesson) return;
    fetch(`${API_URL}/api/v1/cms/lessons/${lesson.id}/questions`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setQuestions(d as LessonQuestion[]))
      .catch(() => {});
  }, [lesson]);

  async function submitQuestion() {
    if (!token || !lesson || !newQuestion.trim()) return;
    setAskingQ(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/lessons/${lesson.id}/questions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion.trim() }),
      });
      if (res.ok) {
        const q = await res.json() as LessonQuestion;
        setQuestions(prev => [{ ...q, askerName: 'Sen', askerAvatar: null }, ...prev]);
        setNewQuestion('');
      }
    } finally { setAskingQ(false); }
  }

  // Tüm dersleri flat liste
  const allLessons = sections.flatMap(s => s.lessons);
  const currentIdx = allLessons.findIndex(l => l.slug === lessonSlug);
  const prevLesson = allLessons[currentIdx - 1];
  const nextLesson = allLessons[currentIdx + 1];

  const totalLessons = allLessons.length;
  const doneCount = completedIds.length;
  const progressPct = totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0;

  const ytId = getYouTubeId(lesson?.videoUrl ?? null);
  const vimeoId = getVimeoId(lesson?.videoUrl ?? null);
  const hasQuiz = sections.some(s => s.lessons.some(l => l.contentType === 'quiz'));

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Sidebar müfredat ───────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-80 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800
        transform transition-transform duration-300 lg:static lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col overflow-hidden mt-14 lg:mt-0
      `}>
        {/* Sidebar başlık */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <Link href={`/egitim/${trainingSlug}`}
            className="flex items-center gap-2 text-xs font-semibold text-[var(--color-mavi)] dark:text-blue-400 hover:underline mb-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kursa Dön
          </Link>
          {/* Toplam ilerleme */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mb-1.5">
            <span>{doneCount}/{totalLessons} ders tamamlandı</span>
            <span className="font-bold text-[var(--color-mavi)] dark:text-blue-400">%{progressPct}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-[var(--color-mavi)] transition-all duration-500"
              style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Bölüm listesi */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section, si) => (
            <div key={section.id}>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 sticky top-0 z-10">
                <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 w-4">{si + 1}</span>
                <span className="text-xs font-bold text-gray-700 dark:text-slate-200 flex-1 truncate">{section.title}</span>
                {(() => { const mins = section.lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0); return mins > 0 ? <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{mins}dk</span> : null; })()}
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {section.lessons.map((l) => {
                  const isCurrent = l.slug === lessonSlug;
                  const isDone = completedIds.includes(l.id);
                  return (
                    <Link key={l.id} href={`/egitim/${trainingSlug}/ders/${l.slug}`}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                        isCurrent
                          ? 'bg-[var(--color-mavi)]/8 dark:bg-blue-900/20 border-r-2 border-[var(--color-mavi)]'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                      }`}>
                      {/* Durum dairesi */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold border-2 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isCurrent
                            ? 'border-[var(--color-mavi)] bg-[var(--color-mavi)]/10 text-[var(--color-mavi)]'
                            : 'border-gray-200 dark:border-slate-700 text-gray-400'
                      }`}>
                        {isDone ? '✓' : <span className={CTYPE_COLOR[l.contentType] ?? 'text-gray-400'}>{CTYPE_ICONS[l.contentType] ?? '▶'}</span>}
                      </div>
                      <span className={`text-xs flex-1 leading-snug ${isCurrent ? 'font-semibold text-[var(--color-mavi)] dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'}`}>
                        {l.title}
                      </span>
                      {l.durationMinutes && (
                        <span className="text-[10px] text-gray-400 shrink-0">{l.durationMinutes}dk</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quiz linki */}
          {sections.flatMap(s => s.lessons).filter(l => l.contentType === 'quiz' && l.quizId).map(l => (
            <div key={l.id} className="px-4 py-4 border-t border-gray-100 dark:border-slate-800">
              <Link href={`/egitim/${trainingSlug}/quiz/${l.quizId}`}
                className="flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                ✏️ {l.title}
              </Link>
            </div>
          ))}
        </div>
      </aside>

      {/* Sidebar overlay (mobil) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* XP Toast / Level-up modal */}
      {xpToast && (
        xpToast.rankUp ? (
          // Tam ekran kutlama
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setXpToast(null)}>
            <div className="text-center px-8 py-10 bg-[#0d1b2a] rounded-3xl border border-[#66aca9]/30 shadow-2xl max-w-sm mx-4"
              onClick={e => e.stopPropagation()}>
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <p className="text-xs font-bold text-[#66aca9] uppercase tracking-widest mb-2">Seviye Atlama!</p>
              <h2 className="text-3xl font-black text-white mb-1">{xpToast.rank}</h2>
              <p className="text-5xl font-black text-[#66aca9] my-4">+{xpToast.xp} XP</p>
              <p className="text-sm text-white/50 mb-6">Yeni bir seviyeye ulaştın, tebrikler!</p>
              <button onClick={() => setXpToast(null)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#66aca9] hover:bg-[#4d9490] rounded-xl transition-colors">
                Devam Et
              </button>
            </div>
          </div>
        ) : (
          // Küçük köşe toast
          <div className="fixed bottom-6 right-6 z-50">
            <div className="flex items-center gap-3 bg-[#0d1b2a] border border-[#66aca9]/40 text-white px-5 py-3 rounded-2xl shadow-2xl">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-sm font-black text-[#66aca9]">+{xpToast.xp} XP</p>
                <p className="text-[10px] text-white/50">{xpToast.rank}</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Ana içerik ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Üst bar */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 px-4 py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {!loading && lesson && (
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 truncate">{lesson.title}</p>
            )}
            {totalLessons > 0 && (
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                {currentIdx + 1} / {totalLessons} · %{progressPct} tamamlandı
              </p>
            )}
          </div>
          {/* Müfredat toggle (mobil) */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Müfredat
          </button>
        </div>

        {/* Ders içeriği */}
        <div className="max-w-3xl mx-auto px-4 py-6">
          {!token ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-slate-400 mb-4">Bu derse erişmek için giriş yapmanız gerekiyor.</p>
              <Link href="/giris" className="text-sm font-semibold text-[var(--color-mavi)] hover:underline">Giriş Yap →</Link>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <div className="h-7 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse w-2/3" />
              <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            </div>
          ) : error || !lesson ? (
            <div className="text-center py-16">
              <p className="text-red-500 dark:text-red-400 mb-3">{error || 'Ders yüklenemedi.'}</p>
              <Link href={`/egitim/${trainingSlug}`} className="text-sm text-[var(--color-mavi)] hover:underline">← Kursa dön</Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-5 leading-snug">{lesson.title}</h1>

              {/* Video */}
              {lesson.videoEmbed ? (
                <div className="rounded-2xl overflow-hidden mb-6 bg-black aspect-video shadow-lg"
                  dangerouslySetInnerHTML={{ __html: lesson.videoEmbed }} />
              ) : ytId ? (
                <div className="rounded-2xl overflow-hidden mb-6 aspect-video shadow-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen className="w-full h-full" title={lesson.title}
                  />
                </div>
              ) : vimeoId ? (
                <div className="rounded-2xl overflow-hidden mb-6 aspect-video shadow-lg">
                  <iframe src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0`}
                    allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
                    className="w-full h-full" title={lesson.title} />
                </div>
              ) : null}

              {/* PDF */}
              {lesson.pdfKey && (
                <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-2xl p-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Ders Materyali</p>
                    <a href={`${API_URL}/api/v1/media?key=${encodeURIComponent(lesson.pdfKey)}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium">
                      PDF İndir →
                    </a>
                  </div>
                </div>
              )}

              {/* Metin içerik */}
              {lesson.body && (
                <div className="prose prose-gray dark:prose-invert max-w-none mb-6 prose-sm">
                  <div dangerouslySetInnerHTML={{ __html: lesson.body }} />
                </div>
              )}
              {lesson.description && !lesson.body && (
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-6">{lesson.description}</p>
              )}

              {/* Alt bar: tamamlandı + navigasyon */}
              <div className="flex items-center justify-between gap-3 pt-5 border-t border-gray-100 dark:border-slate-800 mt-6">
                <button onClick={() => void markComplete()} disabled={marking}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                    completed
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] transition-all ${
                    completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-400 dark:border-slate-500'
                  }`}>
                    {completed ? '✓' : ''}
                  </div>
                  {marking ? '…' : completed ? 'Tamamlandı' : 'Tamamlandı İşaretle'}
                </button>

                <div className="flex gap-2">
                  {prevLesson && (
                    <Link href={`/egitim/${trainingSlug}/ders/${prevLesson.slug}`}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Önceki
                    </Link>
                  )}
                  {nextLesson ? (
                    <Link href={`/egitim/${trainingSlug}/ders/${nextLesson.slug}`}
                      onClick={() => { if (!completed) void markComplete(); }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-dark)] rounded-xl transition-colors">
                      Sonraki
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <Link href={`/egitim/${trainingSlug}`}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
                      ✓ Kursu Bitir
                    </Link>
                  )}
                </div>
              </div>
              {/* Q&A Bölümü */}
              {lesson && (
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800">
                  <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--color-mavi)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Soru & Cevap
                    {questions.length > 0 && <span className="text-xs text-gray-400 font-normal">({questions.length})</span>}
                  </h2>

                  {/* Soru sor */}
                  {token ? (
                    <div className="flex gap-2 mb-5">
                      <input
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitQuestion(); } }}
                        placeholder="Bu dersle ilgili sorunuzu yazın…"
                        className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30"
                      />
                      <button
                        onClick={() => void submitQuestion()}
                        disabled={askingQ || !newQuestion.trim()}
                        className="px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-dark)] rounded-xl disabled:opacity-40 transition-colors shrink-0"
                      >
                        {askingQ ? '…' : 'Sor'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Soru sormak için <Link href="/giris" className="text-[var(--color-mavi)] hover:underline font-medium">giriş yap</Link>.</p>
                  )}

                  {/* Sorular listesi */}
                  {questions.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">Henüz soru sorulmamış. İlk soruyu sen sor!</p>
                  ) : (
                    <div className="space-y-4">
                      {questions.map(q => (
                        <div key={q.id} className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                              {(q.askerName ?? '?')[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{q.askerName ?? 'Üye'}</span>
                                <span className="text-[10px] text-gray-400">{new Date(q.createdAt).toLocaleDateString('tr-TR')}</span>
                              </div>
                              <p className="text-sm text-gray-800 dark:text-slate-200 leading-relaxed">{q.question}</p>
                            </div>
                          </div>
                          {q.answer && (
                            <div className="ml-10 bg-white dark:bg-slate-900 border border-[var(--color-mavi)]/20 rounded-xl p-3 mt-2">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-4 h-4 rounded-full bg-[var(--color-mavi)] flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <span className="text-[11px] font-bold text-[var(--color-mavi)] uppercase tracking-wide">Eğitmen Cevabı</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{q.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
