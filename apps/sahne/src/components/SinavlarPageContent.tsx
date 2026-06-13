'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const EXAMS = [
  {
    key: 'kpss',
    emoji: '🏛️',
    label: 'KPSS',
    fullLabel: 'Kamu Personel Seçme Sınavı',
    color: 'from-blue-600 to-blue-800',
    cardBg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    activeBg: 'bg-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    desc: 'Harita, Haritacılık ve Coğrafya Bilgi Sistemleri alanında kamu istihdamı sınavı.',
  },
  {
    key: 'deger',
    emoji: '🏠',
    label: 'Gayrimenkul Değerleme',
    fullLabel: 'Gayrimenkul Değerleme Uzmanlığı Sınavı',
    color: 'from-amber-500 to-amber-700',
    cardBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    activeBg: 'bg-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    desc: 'SPK lisanslı gayrimenkul değerleme uzmanlığı yetki belgesi sınavı.',
  },
  {
    key: 'cbs',
    emoji: '🗺️',
    label: 'CBS Uzmanı',
    fullLabel: 'Coğrafi Bilgi Sistemleri Uzmanı Sınavı',
    color: 'from-teal-500 to-teal-700',
    cardBg: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    activeBg: 'bg-teal-600',
    badge: 'bg-teal-100 text-teal-700',
    desc: 'CBS/GIS uzmanı sertifikasyonu için ulusal yetkinlik sınavı.',
  },
  {
    key: 'iha',
    emoji: '🚁',
    label: 'İHA Sertifikası',
    fullLabel: 'İnsansız Hava Aracı Sertifika Sınavı',
    color: 'from-purple-500 to-purple-700',
    cardBg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    activeBg: 'bg-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    desc: 'SHT-İHA kapsamında lisanslı pilot ve operatör sertifika sınavları.',
  },
];

interface ExamResource {
  id: string;
  examKey: string;
  resourceType: string;
  title: string;
  content: string | null;
  resourceUrl: string | null;
  eventDate: string | null;
  isPublished: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  examType: string;
  iconEmoji: string | null;
  questionCount: number;
}

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string | null;
  difficulty: string;
  source: string | null;
}

interface ExamResult {
  questionId: string;
  userAnswer: string;
  correct: boolean;
  correctOption: string;
  explanation: string | null;
  questionText: string;
}

type ResourceSection = 'tip' | 'document' | 'date' | 'video';
type PageTab = 'resources' | 'quiz';

const RESOURCE_META: Record<ResourceSection, { label: string; icon: string; emptyMsg: string }> = {
  tip: { label: 'Tüyolar', icon: '💡', emptyMsg: 'Bu sınav için henüz tüyo eklenmedi.' },
  document: { label: 'Dökümanlar', icon: '📄', emptyMsg: 'Bu sınav için henüz döküman yok.' },
  date: { label: 'Kritik Tarihler', icon: '📅', emptyMsg: 'Yaklaşan kritik tarih bulunamadı.' },
  video: { label: 'Videolar', icon: '🎬', emptyMsg: 'Bu sınav için henüz video eklenmedi.' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-600', medium: 'text-amber-600', hard: 'text-red-600',
};
const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

function TipCard({ res }: { res: ExamResource }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">💡</span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{res.title}</h3>
          {res.content && <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{res.content}</p>}
          {res.resourceUrl && (
            <a href={res.resourceUrl} target="_blank" rel="noreferrer" className="text-xs text-[#26496b] dark:text-blue-400 hover:underline mt-2 inline-block">
              🔗 Kaynağa git →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ res }: { res: ExamResource }) {
  return (
    <a
      href={res.resourceUrl ?? '#'}
      target={res.resourceUrl ? '_blank' : undefined}
      rel="noreferrer"
      className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 hover:border-[#26496b]/30 hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0 text-xl">📄</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors text-sm">{res.title}</p>
        {res.content && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{res.content}</p>}
      </div>
      {res.resourceUrl && (
        <svg className="w-4 h-4 text-gray-400 group-hover:text-[#26496b] shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </a>
  );
}

function DateCard({ res }: { res: ExamResource }) {
  const eventDate = res.eventDate ? new Date(res.eventDate) : null;
  const now = new Date();
  const isPast = eventDate ? eventDate < now : false;
  const daysUntil = eventDate ? Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className={`flex items-start gap-4 rounded-2xl p-5 border ${isPast ? 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 opacity-60' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-center ${isPast ? 'bg-gray-200 dark:bg-slate-700' : 'bg-red-500'}`}>
        {eventDate ? (
          <>
            <div className="text-xs font-bold text-white leading-none">{eventDate.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}</div>
            <div className="text-lg font-bold text-white leading-tight">{eventDate.getDate()}</div>
          </>
        ) : (
          <span className="text-xl">📅</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{res.title}</h3>
          {!isPast && daysUntil !== null && daysUntil <= 30 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">
              {daysUntil === 0 ? 'Bugün!' : `${daysUntil} gün`}
            </span>
          )}
          {isPast && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-slate-300">Geçti</span>}
        </div>
        {res.content && <p className="text-xs text-gray-600 dark:text-slate-400">{res.content}</p>}
        {eventDate && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {eventDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  );
}

function VideoCard({ res }: { res: ExamResource }) {
  return (
    <a
      href={res.resourceUrl ?? '#'}
      target={res.resourceUrl ? '_blank' : undefined}
      rel="noreferrer"
      className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 hover:border-purple-300 hover:shadow-sm transition-all group"
    >
      <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0 text-2xl">🎬</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm group-hover:text-purple-700 transition-colors">{res.title}</p>
        {res.content && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{res.content}</p>}
      </div>
      {res.resourceUrl && (
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-purple-600 transition-colors">
          <svg className="w-3 h-3 text-purple-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
    </a>
  );
}

interface Props {
  mode?: 'module' | 'library';
}

export default function SinavlarPageContent({ mode = 'module' }: Props) {
  const { user } = useSahneAuth();
  const [selectedExamKey, setSelectedExamKey] = useState('kpss');
  const [pageTab, setPageTab] = useState<PageTab>('resources');
  const [resSection, setResSection] = useState<ResourceSection>('tip');

  const [resources, setResources] = useState<ExamResource[]>([]);
  const [resLoading, setResLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [quizPhase, setQuizPhase] = useState<'list' | 'exam' | 'result'>('list');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedExam = EXAMS.find(e => e.key === selectedExamKey) ?? EXAMS[0]!;

  useEffect(() => {
    setResLoading(true);
    fetch(`${API}/api/v1/cms/exam-resources?exam=${selectedExamKey}`)
      .then(r => r.json() as Promise<ExamResource[]>)
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]))
      .finally(() => setResLoading(false));
  }, [selectedExamKey]);

  useEffect(() => {
    fetch(`${API}/api/v1/exams/categories`)
      .then(r => r.json() as Promise<Category[]>)
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const filtered = resources.filter(r => r.resourceType === resSection);

  const allCats = categories;

  // ── Countdown timer ──────────────────────────────────────────────
  const submitExamRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (quizPhase !== 'exam' || questions.length === 0) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimeLeft(null);
      return;
    }
    const totalSecs = questions.length * 90;
    setTimeLeft(totalSecs);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          // auto-submit via ref to avoid stale closure
          void submitExamRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [quizPhase, questions.length]);

  const startExam = useCallback(async (cat: Category) => {
    setQuizLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/exams/categories/${cat.slug}/questions?count=20`);
      const data = await res.json() as { questions: Question[] };
      setSelectedCat(cat);
      setQuestions(data.questions ?? []);
      setAnswers({});
      setCurrentIdx(0);
      setStartTime(Date.now());
      setQuizPhase('exam');
    } catch {
      alert('Sorular yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setQuizLoading(false);
    }
  }, []);

  // Keep submitExamRef in sync so timer closure can call it
  const submitExam = useCallback(async () => {
    if (!selectedCat) return;
    setSubmitting(true);
    try {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const answersRecord: Record<string, string> = Object.fromEntries(
        questions.map(q => [q.id, answers[q.id] ?? ''])
      );
      const res = await fetch(`${API}/api/v1/exams/attempts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorySlug: selectedCat.slug, answers: answersRecord, timeTakenSeconds: elapsed }),
      });
      const data = await res.json() as { score: number; results: ExamResult[] };
      setScore(data.score ?? 0);
      setResults(data.results ?? []);
      setQuizPhase('result');
    } catch {
      alert('Sonuçlar gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedCat, questions, answers, startTime]);

  // Keep ref current so timer can call it without stale closure
  useEffect(() => { submitExamRef.current = submitExam; }, [submitExam]);

  return (
    <main className="min-h-screen dark:bg-[#070c1a]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {mode === 'library' ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#26496b] mb-3">
              <Link href="/kutuphane" className="hover:underline">Meslek Kütüphanesi</Link>
              <span className="text-gray-400">›</span>
              <span>Sınav Merkezi</span>
            </div>
          ) : (
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
              Sahne Modülleri
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
            {mode === 'library' ? 'Sınav Merkezi' : 'Sınavlar'}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 max-w-2xl">
            Mesleki sınavlar için tüyolar, kaynaklar, kritik tarihler ve pratik sınav simülasyonu.
            Harita ve geomatik alanındaki 4 temel sınav için kapsamlı hazırlık merkezi.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Exam selector ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {EXAMS.map(exam => (
            <button
              key={exam.key}
              onClick={() => { setSelectedExamKey(exam.key); setPageTab('resources'); setResSection('tip'); setQuizPhase('list'); }}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${selectedExamKey === exam.key ? 'border-[#26496b] bg-[#26496b]/5 dark:bg-[#26496b]/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-600'}`}
            >
              <div className="text-2xl mb-2">{exam.emoji}</div>
              <div className={`text-sm font-bold leading-tight mb-0.5 ${selectedExamKey === exam.key ? 'text-[#26496b] dark:text-blue-400' : 'text-gray-900 dark:text-slate-100'}`}>
                {exam.label}
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500 leading-tight hidden sm:block">{exam.fullLabel}</div>
            </button>
          ))}
        </div>

        {/* ── Exam header ──────────────────────────────────────────────── */}
        <div className={`rounded-2xl bg-gradient-to-r ${selectedExam.color} p-6 mb-6 text-white`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-3xl mb-2">{selectedExam.emoji}</div>
              <h2 className="text-xl font-bold mb-1">{selectedExam.fullLabel}</h2>
              <p className="text-white/75 text-sm">{selectedExam.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold">{resources.filter(r => r.resourceType === 'tip').length}</div>
              <div className="text-xs text-white/60">tüyo</div>
              <div className="text-3xl font-bold mt-2">{resources.filter(r => r.resourceType === 'date').length}</div>
              <div className="text-xs text-white/60">tarih</div>
            </div>
          </div>
        </div>

        {/* ── Page tabs ────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setPageTab('resources')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pageTab === 'resources' ? 'bg-white dark:bg-slate-900 text-[#26496b] dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
            📚 Kaynaklar & Tüyolar
          </button>
          <button
            onClick={() => setPageTab('quiz')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pageTab === 'quiz' ? 'bg-white dark:bg-slate-900 text-[#26496b] dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
            🎯 Sınav Simülasyonu
          </button>
        </div>

        {/* ── Resources Tab ────────────────────────────────────────────── */}
        {pageTab === 'resources' && (
          <div>
            <div className="flex gap-2 flex-wrap mb-6">
              {(Object.entries(RESOURCE_META) as [ResourceSection, typeof RESOURCE_META[ResourceSection]][]).map(([type, meta]) => {
                const cnt = resources.filter(r => r.resourceType === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setResSection(type)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${resSection === type ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#26496b]/30'}`}
                  >
                    <span>{meta.icon}</span>
                    {meta.label}
                    {cnt > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${resSection === type ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                        {cnt}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {resLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center">
                <div className="text-4xl mb-3">{RESOURCE_META[resSection].icon}</div>
                <p className="text-gray-500 dark:text-slate-400">{RESOURCE_META[resSection].emptyMsg}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resSection === 'tip' && filtered.map(res => <TipCard key={res.id} res={res} />)}
                {resSection === 'document' && filtered.map(res => <DocumentCard key={res.id} res={res} />)}
                {resSection === 'date' && filtered
                  .sort((a, b) => {
                    if (!a.eventDate) return 1;
                    if (!b.eventDate) return -1;
                    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
                  })
                  .map(res => <DateCard key={res.id} res={res} />)}
                {resSection === 'video' && filtered.map(res => <VideoCard key={res.id} res={res} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Quiz Tab ─────────────────────────────────────────────────── */}
        {pageTab === 'quiz' && (
          <div>
            {quizPhase === 'list' && (
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                  Soru kategorisi seçerek pratik sınav başlatın. Sonuçlarınız kayıt altına alınır.
                </p>
                {!user && (
                  <div className="bg-gradient-to-br from-[#0c1a2e] to-[#26496b] rounded-2xl p-5 text-white text-center mb-6">
                    <p className="text-sm font-bold mb-1">Sınav sonuçlarını kaydetmek için üye olun</p>
                    <p className="text-xs text-white/70 mb-3">Üye olarak sınav notunuzu takip edin, gelişiminizi görün.</p>
                    <a href="/uye-ol" className="inline-block text-xs font-bold text-[#26496b] bg-white rounded-xl px-4 py-2 hover:bg-white/90 transition-colors mr-2">
                      Ücretsiz Üye Ol
                    </a>
                    <a href="/giris" className="text-xs text-white/70 hover:text-white transition-colors">Giriş yap</a>
                  </div>
                )}
                {quizLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}</div>
                ) : allCats.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="text-gray-500 dark:text-slate-400">Henüz soru bankası eklenmedi.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allCats.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => void startExam(cat)}
                        disabled={cat.questionCount === 0}
                        className="flex items-start gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 text-left hover:border-[#26496b]/40 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                      >
                        <div className="w-11 h-11 bg-[#26496b]/10 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl shrink-0">
                          {cat.iconEmoji ?? '📋'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm group-hover:text-[#26496b] transition-colors">{cat.name}</p>
                          {cat.description && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{cat.description}</p>}
                          <p className="text-xs font-medium text-[#26496b] dark:text-blue-400 mt-1">{cat.questionCount} soru</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {quizPhase === 'exam' && questions.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-500 dark:text-slate-400">{selectedCat?.name}</span>
                  <div className="flex items-center gap-3">
                    {timeLeft !== null && (() => {
                      const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                      const ss = (timeLeft % 60).toString().padStart(2, '0');
                      const urgent = timeLeft <= 60;
                      return (
                        <span className={`flex items-center gap-1 font-mono font-bold text-base px-3 py-1 rounded-xl border ${urgent ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400 animate-pulse' : 'bg-gray-100 border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200'}`}>
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {mm}:{ss}
                        </span>
                      );
                    })()}
                    <span className="font-semibold text-gray-700 dark:text-slate-200">{currentIdx + 1} / {questions.length}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full mb-6">
                  <div className="h-full bg-[#26496b] rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
                </div>

                {(() => {
                  const q = questions[currentIdx]!;
                  return (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold text-gray-400">#{currentIdx + 1}</span>
                        <span className={`text-xs font-medium ${DIFFICULTY_COLORS[q.difficulty] ?? 'text-gray-500'}`}>
                          {DIFFICULTY_LABELS[q.difficulty] ?? q.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-slate-100 font-medium mb-5 leading-relaxed">{q.questionText}</p>
                      <div className="space-y-2.5">
                        {(['A', 'B', 'C', 'D', 'E'] as const).map(opt => {
                          const val = q[`option${opt}` as keyof Question] as string | null;
                          if (!val) return null;
                          const chosen = answers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${chosen ? 'border-[#26496b] bg-[#26496b]/5 dark:bg-[#26496b]/20 text-[#26496b] dark:text-blue-300 font-medium' : 'border-gray-200 dark:border-slate-700 hover:border-[#26496b]/30 text-gray-700 dark:text-slate-300'}`}
                            >
                              <span className="font-semibold mr-2">{opt})</span> {val}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button
                          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                          disabled={currentIdx === 0}
                          className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                        >
                          ← Önceki
                        </button>
                        {currentIdx < questions.length - 1 ? (
                          <button
                            onClick={() => setCurrentIdx(i => i + 1)}
                            disabled={!answers[q.id]}
                            className="px-5 py-2 text-sm bg-[#26496b] text-white rounded-xl hover:bg-[#1e3a56] disabled:opacity-40 transition-colors font-medium"
                          >
                            Sonraki →
                          </button>
                        ) : (
                          <button
                            onClick={() => void submitExam()}
                            disabled={submitting || Object.keys(answers).length < questions.length}
                            className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors font-medium"
                          >
                            {submitting ? 'Gönderiliyor…' : '✓ Sınavı Bitir'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {quizPhase === 'result' && (
              <div className="max-w-2xl mx-auto">
                <div className={`rounded-2xl p-8 text-center mb-6 ${score >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : score >= 50 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  <div className="text-6xl font-bold mb-2 text-gray-900 dark:text-slate-100">%{score}</div>
                  <div className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-1">
                    {score >= 70 ? '🎉 Harika!' : score >= 50 ? '📈 İyi Gidiyorsun' : '💪 Daha Fazla Çalış'}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {results.filter(r => r.correct).length} / {results.length} doğru
                  </p>
                  {startTime > 0 && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      Süre: {Math.floor((Date.now() - startTime) / 60000)} dk {Math.round(((Date.now() - startTime) % 60000) / 1000)} sn
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {results.map((res, i) => (
                    <div key={res.questionId} className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 ${res.correct ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${res.correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                          {res.correct ? '✓' : '✕'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1">#{i + 1} {res.questionText}</p>
                          {!res.correct && (
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">Doğru: {res.correctOption} · Senin: {res.userAnswer || '—'}</p>
                          )}
                          {res.explanation && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">{res.explanation}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setQuizPhase('list'); setResults([]); setQuestions([]); setAnswers({}); }}
                  className="w-full py-3 bg-[#26496b] text-white rounded-xl font-semibold hover:bg-[#1e3a56] transition-colors"
                >
                  Yeni Sınav Başlat
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
