'use client';

import { useEffect, useState } from 'react';
import { adminApi, type ContentRequestItem, type TrainingItem } from '@/lib/api';
import { STATUS_CLS as STATUS_COLORS, SOURCE_LABELS, SOURCE_COLORS } from '@/lib/ui';

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' };

const LEVEL_COLORS: Record<string, string> = {
  'Başlangıç': 'bg-emerald-100 text-emerald-700',
  'Orta': 'bg-blue-100 text-blue-700',
  'İleri': 'bg-purple-100 text-purple-700',
  'Başlangıç – Orta': 'bg-emerald-100 text-emerald-700',
  'Orta – İleri': 'bg-orange-100 text-orange-700',
};

const LEVEL_GRADS: Record<string, string> = {
  'Başlangıç': 'linear-gradient(135deg,#10b981,#0d9488)',
  'Başlangıç – Orta': 'linear-gradient(135deg,#34d399,#3b82f6)',
  'Orta': 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'Orta – İleri': 'linear-gradient(135deg,#3b82f6,#7c3aed)',
  'İleri': 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
};

const inp = 'w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]';

type Tab = 'talepler' | 'egitimler' | 'analitik' | 'odemeler';

interface TrainingAnalytics {
  totalEnrollments: number;
  completedCount: number;
  completionRate: number;
  avgProgress: number;
  quizAttempts: number;
  quizPassRate: number;
  avgQuizScore: number;
  totalCertificates: number;
  topCourses: Array<{ id: string; title: string; slug: string; enrollmentCount: number; level: string | null; format: string | null }>;
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const EMPTY_FORM = {
  slug: '', title: '', instructor: '', instructorTitle: '',
  format: 'Online', level: 'Orta', duration: '', price: '', memberPrice: '',
  description: '', registrationUrl: '', startDate: '', isPublished: true,
  coverImageKey: '',
  featuredOnSinavMerkezi: false,
  sinavKey: '',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: '▶ Video', text: '📄 Metin', pdf: '📎 PDF', quiz: '✏️ Quiz', live: '🔴 Canlı',
};

type SectionWithLessons = {
  id: string; title: string; description: string | null; sortOrder: number;
  lessons: Array<{ id: string; slug: string; title: string; contentType: string; durationMinutes: number | null; isFree: boolean; sortOrder: number; isPublished: boolean; videoUrl: string | null; body: string | null; viewCount: number }>;
};

type Announcement = { id: string; title: string; body: string; createdAt: string };

type QuizRow = { id: string; title: string; passingScore: number; maxAttempts: number; randomizeQuestions: boolean; questionPoolSize: number | null; showCorrectAnswers: boolean; timeLimitMinutes: number | null; questions: Array<{ id: string; question: string; questionType: string; options: string[] | null; correctAnswers: string[]; explanation: string | null; sortOrder: number }> };

function CourseContentPanel({ trainingId, trainingSlug, enrollmentCount }: { trainingId: string; trainingSlug: string; enrollmentCount: number }) {
  const [sections, setSections] = useState<SectionWithLessons[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'mufredat' | 'duyurular' | 'bilgi' | 'quizler'>('mufredat');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annLoaded, setAnnLoaded] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annSaving, setAnnSaving] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [addingLesson, setAddingLesson] = useState<string | null>(null); // sectionId
  const [lessonForm, setLessonForm] = useState({ slug: '', title: '', contentType: 'video', videoUrl: '', durationMinutes: '', isFree: false, xpReward: '10' });
  const [saving, setSaving] = useState(false);

  // Quiz state
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [quizzesLoaded, setQuizzesLoaded] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRow | null>(null);
  const [quizSettings, setQuizSettings] = useState({ title: '', passingScore: 70, maxAttempts: 3, randomizeQuestions: false, questionPoolSize: '', showCorrectAnswers: true, timeLimitMinutes: '' });
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [qForm, setQForm] = useState({ question: '', questionType: 'single', options: ['', '', '', ''], correctAnswers: [] as string[], explanation: '' });
  const [savingQ, setSavingQ] = useState(false);
  const [deletingQ, setDeletingQ] = useState<string | null>(null);

  const inp2 = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';

  useEffect(() => {
    adminApi.listSections(trainingId)
      .then(d => { setSections(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [trainingId]); // eslint-disable-line

  useEffect(() => {
    if (activeTab !== 'duyurular' || annLoaded) return;
    adminApi.listAnnouncements(trainingId)
      .then(d => { setAnnouncements(d); setAnnLoaded(true); })
      .catch(() => setAnnLoaded(true));
  }, [activeTab, trainingId, annLoaded]); // eslint-disable-line

  useEffect(() => {
    if (activeTab !== 'quizler' || quizzesLoaded) return;
    adminApi.listQuizzes(trainingId)
      .then(d => { setQuizzes(d as QuizRow[]); setQuizzesLoaded(true); if (d.length > 0) setSelectedQuiz(d[0] as QuizRow); })
      .catch(() => setQuizzesLoaded(true));
  }, [activeTab, trainingId, quizzesLoaded]); // eslint-disable-line

  useEffect(() => {
    if (!selectedQuiz) return;
    setQuizSettings({
      title: selectedQuiz.title,
      passingScore: selectedQuiz.passingScore,
      maxAttempts: selectedQuiz.maxAttempts,
      randomizeQuestions: selectedQuiz.randomizeQuestions,
      questionPoolSize: selectedQuiz.questionPoolSize ? String(selectedQuiz.questionPoolSize) : '',
      showCorrectAnswers: selectedQuiz.showCorrectAnswers,
      timeLimitMinutes: selectedQuiz.timeLimitMinutes ? String(selectedQuiz.timeLimitMinutes) : '',
    });
  }, [selectedQuiz]);

  async function saveQuizSettings() {
    if (!selectedQuiz) return;
    setSavingQuiz(true);
    try {
      const updated = await adminApi.updateQuizSettings(selectedQuiz.id, {
        title: quizSettings.title,
        passingScore: quizSettings.passingScore,
        maxAttempts: quizSettings.maxAttempts,
        randomizeQuestions: quizSettings.randomizeQuestions,
        questionPoolSize: quizSettings.questionPoolSize ? Number(quizSettings.questionPoolSize) : null,
        showCorrectAnswers: quizSettings.showCorrectAnswers,
        timeLimitMinutes: quizSettings.timeLimitMinutes ? Number(quizSettings.timeLimitMinutes) : null,
      });
      setQuizzes(prev => prev.map(q => q.id === selectedQuiz.id ? { ...q, ...updated } : q));
      setSelectedQuiz(prev => prev ? { ...prev, ...updated } : prev);
    } finally { setSavingQuiz(false); }
  }

  async function createQuiz() {
    if (!newQuizTitle.trim()) return;
    setCreatingQuiz(true);
    try {
      const q = await adminApi.listQuizzes(trainingId); // placeholder — need create endpoint
      // We use the admin cms create quiz endpoint directly
      const res = await fetch(`${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/api/v1/admin/cms/trainings/${trainingId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}` },
        body: JSON.stringify({ title: newQuizTitle.trim(), passingScore: 70 }),
      });
      if (res.ok) {
        const newQ = await res.json() as QuizRow;
        const fullQ = { ...newQ, questions: [], randomizeQuestions: false, questionPoolSize: null, showCorrectAnswers: true, timeLimitMinutes: null };
        setQuizzes(prev => [...prev, fullQ]);
        setSelectedQuiz(fullQ);
        setNewQuizTitle('');
        void q; // suppress unused
      }
    } finally { setCreatingQuiz(false); }
  }

  async function addQuestion() {
    if (!selectedQuiz || !qForm.question.trim()) return;
    setSavingQ(true);
    try {
      const filledOpts = qForm.options.filter(o => o.trim());
      const res = await fetch(`${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/api/v1/admin/cms/quizzes/${selectedQuiz.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}` },
        body: JSON.stringify({
          question: qForm.question.trim(),
          questionType: qForm.questionType,
          options: qForm.questionType !== 'text' ? filledOpts : undefined,
          correctAnswers: qForm.correctAnswers,
          explanation: qForm.explanation.trim() || undefined,
          sortOrder: selectedQuiz.questions.length,
        }),
      });
      if (res.ok) {
        const newQ = await res.json() as QuizRow['questions'][number];
        setSelectedQuiz(prev => prev ? { ...prev, questions: [...prev.questions, newQ] } : prev);
        setQuizzes(prev => prev.map(q => q.id === selectedQuiz.id ? { ...q, questions: [...q.questions, newQ] } : q));
        setQForm({ question: '', questionType: 'single', options: ['', '', '', ''], correctAnswers: [], explanation: '' });
        setAddingQuestion(false);
      }
    } finally { setSavingQ(false); }
  }

  async function deleteQuestion(qId: string) {
    if (!selectedQuiz) return;
    setDeletingQ(qId);
    try {
      await fetch(`${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/api/v1/admin/cms/quiz-questions/${qId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}` },
      });
      setSelectedQuiz(prev => prev ? { ...prev, questions: prev.questions.filter(q => q.id !== qId) } : prev);
      setQuizzes(prev => prev.map(q => q.id === selectedQuiz.id ? { ...q, questions: q.questions.filter(q2 => q2.id !== qId) } : q));
    } finally { setDeletingQ(null); }
  }

  async function createAnnouncement() {
    if (!annTitle.trim() || !annBody.trim()) return;
    setAnnSaving(true);
    try {
      const a = await adminApi.createAnnouncement(trainingId, { title: annTitle, body: annBody });
      setAnnouncements(prev => [a, ...prev]);
      setAnnTitle(''); setAnnBody('');
    } finally { setAnnSaving(false); }
  }

  async function deleteAnnouncement(id: string) {
    await adminApi.deleteAnnouncement(id).catch(() => {});
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  async function createSection() {
    if (!sectionTitle.trim()) return;
    setSaving(true);
    try {
      const s = await adminApi.createSection(trainingId, { title: sectionTitle, sortOrder: sections.length });
      setSections(prev => [...prev, { ...s, lessons: [] }]);
      setSectionTitle(''); setAddingSection(false);
    } finally { setSaving(false); }
  }

  async function deleteSection(id: string) {
    if (!confirm('Bu bölümü silmek istediğinize emin misiniz? İçindeki dersler de silinir.')) return;
    await adminApi.deleteSection(id).catch(() => {});
    setSections(prev => prev.filter(s => s.id !== id));
  }

  async function createLesson(sectionId: string) {
    if (!lessonForm.title.trim() || !lessonForm.slug.trim()) return;
    setSaving(true);
    try {
      const dm = lessonForm.durationMinutes ? parseInt(lessonForm.durationMinutes, 10) : undefined;
      const xp = lessonForm.xpReward ? parseInt(lessonForm.xpReward, 10) : 10;
      const l = await adminApi.createLesson(sectionId, {
        slug: lessonForm.slug, title: lessonForm.title, contentType: lessonForm.contentType,
        ...(lessonForm.videoUrl ? { videoUrl: lessonForm.videoUrl } : {}),
        ...(dm !== undefined ? { durationMinutes: dm } : {}),
        isFree: lessonForm.isFree,
        xpReward: xp,
      });
      const newLesson = {
        id: l.id, slug: lessonForm.slug, title: lessonForm.title,
        contentType: lessonForm.contentType, isPublished: true,
        videoUrl: lessonForm.videoUrl || null, body: null,
        sortOrder: 0, isFree: lessonForm.isFree,
        durationMinutes: dm ?? null, viewCount: 0,
      };
      setSections(prev => prev.map(s => s.id === sectionId
        ? { ...s, lessons: [...s.lessons, newLesson] }
        : s,
      ));
      setLessonForm({ slug: '', title: '', contentType: 'video', videoUrl: '', durationMinutes: '', isFree: false, xpReward: '10' });
      setAddingLesson(null);
    } finally { setSaving(false); }
  }

  async function deleteLesson(sectionId: string, lessonId: string) {
    await adminApi.deleteLesson(lessonId).catch(() => {});
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) } : s));
  }

  async function moveLesson(sectionId: string, lessonId: string, direction: 'up' | 'down') {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const idx = s.lessons.findIndex(l => l.id === lessonId);
      if (idx < 0) return s;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= s.lessons.length) return s;
      const lessons = [...s.lessons];
      [lessons[idx], lessons[newIdx]] = [lessons[newIdx]!, lessons[idx]!];
      // Persist in background
      void Promise.all([
        adminApi.updateLesson(lessons[idx]!.id, { sortOrder: idx }),
        adminApi.updateLesson(lessons[newIdx]!.id, { sortOrder: newIdx }),
      ]).catch(() => {});
      return { ...s, lessons: lessons.map((l, i) => ({ ...l, sortOrder: i })) };
    }));
  }

  async function moveSection(sectionId: string, direction: 'up' | 'down') {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sectionId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const sections = [...prev];
      [sections[idx], sections[newIdx]] = [sections[newIdx]!, sections[idx]!];
      void Promise.all([
        adminApi.updateSection(sections[idx]!.id, { sortOrder: idx }),
        adminApi.updateSection(sections[newIdx]!.id, { sortOrder: newIdx }),
      ]).catch(() => {});
      return sections.map((s, i) => ({ ...s, sortOrder: i }));
    });
  }

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);

  // Drag state
  const [dragLesson, setDragLesson] = useState<{ sectionId: string; lessonId: string } | null>(null);
  const [dragSection, setDragSection] = useState<string | null>(null);
  const [dragOverLesson, setDragOverLesson] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  function onLessonDragStart(sectionId: string, lessonId: string) { setDragLesson({ sectionId, lessonId }); }
  function onLessonDragOver(e: React.DragEvent, sectionId: string, lessonId: string) {
    e.preventDefault(); setDragOverLesson(lessonId);
    if (dragLesson && dragLesson.sectionId === sectionId && dragLesson.lessonId !== lessonId) {
      setSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        const from = s.lessons.findIndex(l => l.id === dragLesson.lessonId);
        const to   = s.lessons.findIndex(l => l.id === lessonId);
        if (from < 0 || to < 0) return s;
        const lessons = [...s.lessons];
        const [moved] = lessons.splice(from, 1);
        lessons.splice(to, 0, moved!);
        return { ...s, lessons };
      }));
    }
  }
  async function onLessonDrop(sectionId: string) {
    if (!dragLesson) return;
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    await Promise.all(section.lessons.map((l, i) => adminApi.updateLesson(l.id, { sortOrder: i }))).catch(() => {});
    setDragLesson(null); setDragOverLesson(null);
  }

  function onSectionDragStart(sectionId: string) { setDragSection(sectionId); }
  function onSectionDragOver(e: React.DragEvent, sectionId: string) {
    e.preventDefault(); setDragOverSection(sectionId);
    if (dragSection && dragSection !== sectionId) {
      setSections(prev => {
        const from = prev.findIndex(s => s.id === dragSection);
        const to   = prev.findIndex(s => s.id === sectionId);
        if (from < 0 || to < 0) return prev;
        const arr = [...prev];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved!);
        return arr;
      });
    }
  }
  async function onSectionDrop() {
    await Promise.all(sections.map((s, i) => adminApi.updateSection(s.id, { sortOrder: i }))).catch(() => {});
    setDragSection(null); setDragOverSection(null);
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/60">
      {/* Sekmeler */}
      <div className="flex gap-0.5 px-4 pt-3 border-b border-gray-200 bg-white overflow-x-auto">
        {([
          { key: 'mufredat', label: `Müfredat (${totalLessons} ders)` },
          { key: 'quizler', label: `Quizler${quizzes.length > 0 ? ` (${quizzes.length})` : ''}` },
          { key: 'duyurular', label: `Duyurular${announcements.length > 0 ? ` (${announcements.length})` : ''}` },
          { key: 'bilgi', label: `Bilgiler · ${enrollmentCount} kayıt` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${activeTab === t.key ? 'border-[#26496b] text-[#26496b]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'mufredat' && (
          <div className="space-y-3">
            {!loaded ? (
              <div className="space-y-2">{[1,2].map(i => <div key={i} className="bg-white rounded-xl h-12 animate-pulse" />)}</div>
            ) : sections.length === 0 && !addingSection ? (
              <p className="text-xs text-gray-400 py-2">Henüz bölüm eklenmemiş.</p>
            ) : (
              sections.map((section, si) => (
                <div key={section.id} className="bg-white rounded-xl border border-gray-100">
                  {/* Bölüm başlığı */}
                  <div
                    draggable
                    onDragStart={() => onSectionDragStart(section.id)}
                    onDragOver={e => onSectionDragOver(e, section.id)}
                    onDrop={() => void onSectionDrop()}
                    className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-50 group cursor-grab active:cursor-grabbing ${dragOverSection === section.id && dragSection !== section.id ? 'bg-[#26496b]/5' : ''}`}>
                    <span className="text-gray-300 group-hover:text-gray-400 transition-colors text-xs mr-0.5" title="Sürükle">⠿</span>
                    <span className="text-xs font-bold text-gray-400 w-5 text-center">{si + 1}</span>
                    <span className="text-sm font-semibold text-gray-800 flex-1">{section.title}</span>
                    <span className="text-[10px] text-gray-400">{section.lessons.length} ders</span>
                    <button onClick={() => deleteSection(section.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-xs">✕</button>
                  </div>
                  {/* Dersler */}
                  <div className="divide-y divide-gray-50">
                    {section.lessons.map((lesson, li) => (
                      <div key={lesson.id}
                        draggable
                        onDragStart={() => onLessonDragStart(section.id, lesson.id)}
                        onDragOver={e => onLessonDragOver(e, section.id, lesson.id)}
                        onDrop={() => void onLessonDrop(section.id)}
                        className={`flex items-center gap-2.5 px-4 py-2 group/lesson cursor-grab active:cursor-grabbing transition-colors ${dragOverLesson === lesson.id && dragLesson?.lessonId !== lesson.id ? 'bg-[#26496b]/5' : ''}`}>
                        <span className="text-gray-200 group-hover/lesson:text-gray-400 transition-colors text-xs" title="Sürükle">⠿</span>
                        <span className="text-[10px] text-gray-300 w-5 text-center">{li + 1}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium shrink-0">
                          {CONTENT_TYPE_LABELS[lesson.contentType] ?? lesson.contentType}
                        </span>
                        <span className="text-xs text-gray-700 flex-1">{lesson.title}</span>
                        {lesson.isFree && <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">Önizleme</span>}
                        {lesson.durationMinutes && <span className="text-[10px] text-gray-400">{lesson.durationMinutes}dk</span>}
                        {lesson.viewCount > 0 && <span className="text-[10px] text-blue-400" title="Görüntülenme">👁 {lesson.viewCount}</span>}
                        <span className="text-[9px] text-amber-500 bg-amber-50 px-1 py-0.5 rounded font-bold" title="XP Ödülü">⚡{(lesson as {xpReward?: number}).xpReward ?? 10}</span>
                        <button onClick={() => deleteLesson(section.id, lesson.id)} className="opacity-0 group-hover/lesson:opacity-100 text-gray-300 hover:text-red-500 text-xs transition-all">✕</button>
                      </div>
                    ))}
                  </div>
                  {/* Ders ekle */}
                  {addingLesson === section.id ? (
                    <div className="p-3 border-t border-gray-50 space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Yeni Ders</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input className={inp2} placeholder="Başlık *" value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} />
                        <input className={inp2} placeholder="Slug * (kisa-tanim)" value={lessonForm.slug} onChange={e => setLessonForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
                        <select className={inp2} value={lessonForm.contentType} onChange={e => setLessonForm(f => ({ ...f, contentType: e.target.value }))}>
                          {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <input className={inp2} placeholder="Süre (dakika)" type="number" value={lessonForm.durationMinutes} onChange={e => setLessonForm(f => ({ ...f, durationMinutes: e.target.value }))} />
                        <input className={inp2} placeholder="XP Ödülü" type="number" min="0" value={lessonForm.xpReward} onChange={e => setLessonForm(f => ({ ...f, xpReward: e.target.value }))} />
                        {(lessonForm.contentType === 'video' || lessonForm.contentType === 'live') && (
                          <input className={`${inp2} col-span-2`} placeholder="Video URL (YouTube/Vimeo)" value={lessonForm.videoUrl} onChange={e => setLessonForm(f => ({ ...f, videoUrl: e.target.value }))} />
                        )}
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 col-span-2">
                          <input type="checkbox" checked={lessonForm.isFree} onChange={e => setLessonForm(f => ({ ...f, isFree: e.target.checked }))} /> Üye olmadan izlenebilir (önizleme)
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setAddingLesson(null); setLessonForm({ slug: '', title: '', contentType: 'video', videoUrl: '', durationMinutes: '', isFree: false, xpReward: '10' }); }} className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                        <button disabled={saving || !lessonForm.title.trim() || !lessonForm.slug.trim()} onClick={() => void createLesson(section.id)} className="px-4 py-1 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                          {saving ? '…' : 'Ekle'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2">
                      <button onClick={() => setAddingLesson(section.id)} className="text-xs text-[#26496b] hover:underline font-medium">+ Ders Ekle</button>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Bölüm ekle */}
            {addingSection ? (
              <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Yeni Bölüm</p>
                <input className={inp2} placeholder="Bölüm başlığı *" value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') void createSection(); if (e.key === 'Escape') setAddingSection(false); }} />
                <div className="flex gap-2">
                  <button onClick={() => { setAddingSection(false); setSectionTitle(''); }} className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                  <button disabled={saving || !sectionTitle.trim()} onClick={() => void createSection()} className="px-4 py-1 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">Ekle</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingSection(true)} className="text-xs font-medium text-[#26496b] hover:underline">+ Bölüm Ekle</button>
            )}
          </div>
        )}

        {activeTab === 'quizler' && (
          <div className="space-y-3">
            {/* Quiz seçici + yeni quiz */}
            <div className="flex items-center gap-2 flex-wrap">
              {quizzes.map(q => (
                <button key={q.id} onClick={() => setSelectedQuiz(q)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${selectedQuiz?.id === q.id ? 'bg-[#26496b] text-white border-[#26496b]' : 'border-gray-200 text-gray-600 hover:border-[#26496b]/40'}`}>
                  {q.title}
                </button>
              ))}
              {creatingQuiz ? (
                <div className="flex items-center gap-1.5">
                  <input className={inp2} value={newQuizTitle} onChange={e => setNewQuizTitle(e.target.value)} placeholder="Quiz başlığı" autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') void createQuiz(); if (e.key === 'Escape') { setCreatingQuiz(false); setNewQuizTitle(''); } }} />
                  <button onClick={() => void createQuiz()} className="px-3 py-1 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56]">Ekle</button>
                  <button onClick={() => { setCreatingQuiz(false); setNewQuizTitle(''); }} className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg">İptal</button>
                </div>
              ) : (
                <button onClick={() => setCreatingQuiz(true)} className="text-xs text-[#26496b] hover:underline font-medium">+ Quiz Ekle</button>
              )}
            </div>

            {!quizzesLoaded && <div className="h-32 bg-white rounded-xl animate-pulse" />}

            {quizzesLoaded && quizzes.length === 0 && !creatingQuiz && (
              <p className="text-xs text-gray-400 py-2">Henüz quiz eklenmemiş.</p>
            )}

            {selectedQuiz && (
              <>
                {/* Ayarlar */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Quiz Ayarları</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500 font-medium">Başlık</label>
                      <input className={inp2} value={quizSettings.title} onChange={e => setQuizSettings(s => ({ ...s, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Geçme Notu (%)</label>
                      <input type="number" className={inp2} value={quizSettings.passingScore} onChange={e => setQuizSettings(s => ({ ...s, passingScore: Number(e.target.value) }))} min={1} max={100} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Max Deneme (0=sınırsız)</label>
                      <input type="number" className={inp2} value={quizSettings.maxAttempts} onChange={e => setQuizSettings(s => ({ ...s, maxAttempts: Number(e.target.value) }))} min={0} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Soru Havuzu (boş=hepsi)</label>
                      <input type="number" className={inp2} value={quizSettings.questionPoolSize} onChange={e => setQuizSettings(s => ({ ...s, questionPoolSize: e.target.value }))} min={1} placeholder="Tüm sorular" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Süre Limiti (dk, boş=süresiz)</label>
                      <input type="number" className={inp2} value={quizSettings.timeLimitMinutes} onChange={e => setQuizSettings(s => ({ ...s, timeLimitMinutes: e.target.value }))} min={1} placeholder="Süresiz" />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input type="checkbox" checked={quizSettings.randomizeQuestions} onChange={e => setQuizSettings(s => ({ ...s, randomizeQuestions: e.target.checked }))} />
                      Soruları Karıştır
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input type="checkbox" checked={quizSettings.showCorrectAnswers} onChange={e => setQuizSettings(s => ({ ...s, showCorrectAnswers: e.target.checked }))} />
                      Doğru Cevabı Göster
                    </label>
                  </div>
                  <button onClick={() => void saveQuizSettings()} disabled={savingQuiz}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                    {savingQuiz ? 'Kaydediliyor…' : 'Kaydet'}
                  </button>
                </div>

                {/* Sorular */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sorular ({selectedQuiz.questions.length})</p>
                    {!addingQuestion && (
                      <button onClick={() => setAddingQuestion(true)} className="text-xs text-[#26496b] hover:underline font-medium">+ Soru Ekle</button>
                    )}
                  </div>

                  {/* Soru listesi */}
                  <div className="space-y-2 mb-3">
                    {selectedQuiz.questions.map((q, i) => (
                      <div key={q.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg group/q">
                        <span className="text-[10px] font-bold text-gray-300 w-5 shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 leading-snug">{q.question}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{q.questionType}</span>
                            {q.correctAnswers.map((a, ai) => (
                              <span key={ai} className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{a}</span>
                            ))}
                          </div>
                          {q.explanation && <p className="text-[10px] text-gray-400 italic mt-0.5">{q.explanation}</p>}
                        </div>
                        <button onClick={() => void deleteQuestion(q.id)} disabled={deletingQ === q.id}
                          className="opacity-0 group-hover/q:opacity-100 text-gray-300 hover:text-red-500 text-xs shrink-0 transition-all">
                          {deletingQ === q.id ? '…' : '✕'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Yeni soru formu */}
                  {addingQuestion && (
                    <div className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/60">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Yeni Soru</p>
                      <textarea className={`${inp2} resize-none`} rows={2} placeholder="Soru metni *" value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className={inp2} value={qForm.questionType} onChange={e => setQForm(f => ({ ...f, questionType: e.target.value, correctAnswers: [] }))}>
                          <option value="single">Tek Seçenek</option>
                          <option value="multi">Çoklu Seçenek</option>
                          <option value="text">Metin</option>
                        </select>
                      </div>
                      {qForm.questionType !== 'text' && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-medium">Seçenekler (doğru olanları işaretle)</p>
                          {qForm.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input type={qForm.questionType === 'multi' ? 'checkbox' : 'radio'}
                                name="correct" value={opt}
                                checked={qForm.correctAnswers.includes(opt)}
                                onChange={e => {
                                  if (!opt.trim()) return;
                                  setQForm(f => ({
                                    ...f,
                                    correctAnswers: qForm.questionType === 'multi'
                                      ? (e.target.checked ? [...f.correctAnswers, opt] : f.correctAnswers.filter(a => a !== opt))
                                      : [opt],
                                  }));
                                }} />
                              <input className={inp2} placeholder={`Seçenek ${i + 1}`} value={opt}
                                onChange={e => setQForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? e.target.value : o), correctAnswers: f.correctAnswers.map(a => a === opt ? e.target.value : a) }))} />
                            </div>
                          ))}
                        </div>
                      )}
                      <input className={inp2} placeholder="Açıklama (opsiyonel)" value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} />
                      <div className="flex gap-2">
                        <button onClick={() => { setAddingQuestion(false); setQForm({ question: '', questionType: 'single', options: ['', '', '', ''], correctAnswers: [], explanation: '' }); }}
                          className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                        <button onClick={() => void addQuestion()} disabled={savingQ || !qForm.question.trim() || (qForm.questionType !== 'text' && qForm.correctAnswers.length === 0)}
                          className="px-4 py-1 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                          {savingQ ? '…' : 'Ekle'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'duyurular' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase">Yeni Duyuru</p>
              <input className={inp2} placeholder="Başlık *" value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
              <textarea className={`${inp2} resize-none`} rows={3} placeholder="Mesaj *" value={annBody} onChange={e => setAnnBody(e.target.value)} />
              <p className="text-[9px] text-gray-400">Kayıtlı tüm öğrencilere e-posta gönderilecek.</p>
              <button disabled={annSaving || !annTitle.trim() || !annBody.trim()} onClick={() => void createAnnouncement()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                {annSaving ? 'Gönderiliyor…' : '📢 Duyur'}
              </button>
            </div>
            {announcements.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Henüz duyuru yok.</p>
            ) : announcements.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-3 group/ann">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-800">{a.title}</p>
                  <button onClick={() => void deleteAnnouncement(a.id)} className="opacity-0 group-hover/ann:opacity-100 text-gray-300 hover:text-red-500 text-xs transition-all">✕</button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{a.body}</p>
                <p className="text-[9px] text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bilgi' && (
          <div className="space-y-3 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-2xl font-black text-[#26496b]">{enrollmentCount}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Kayıtlı Üye</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-2xl font-black text-gray-700">{totalLessons}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Toplam Ders</p>
              </div>
            </div>

            {/* Kullanıcı davet et */}
            <InvitePanel trainingId={trainingId} inp2={inp2} />

            <a href={`/egitim/${trainingSlug}`} target="_blank" rel="noreferrer" className="block text-xs text-[#26496b] hover:underline font-medium">Sahne'de Görüntüle →</a>
          </div>
        )}
      </div>
    </div>
  );
}

function InvitePanel({ trainingId, inp2 }: { trainingId: string; inp2: string }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function invite() {
    if (!email.trim()) return;
    setSending(true); setMsg(null);
    try {
      const r = await adminApi.inviteUserToCourse(trainingId, email.trim());
      setMsg({ type: 'ok', text: `${r.displayName} davet edildi ✓` });
      setEmail('');
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Hata oluştu' });
    } finally { setSending(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Kullanıcı Davet Et</p>
      <div className="flex gap-2">
        <input className={inp2} type="email" placeholder="E-posta adresi" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void invite(); }} />
        <button onClick={() => void invite()} disabled={sending || !email.trim()}
          className="px-3 py-1 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50 shrink-0">
          {sending ? '…' : 'Davet Et'}
        </button>
      </div>
      {msg && <p className={`text-[11px] ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</p>}
    </div>
  );
}

function IcoEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IcoTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg className="w-4 h-4 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function EgitimlerPage() {
  const [tab, setTab] = useState<Tab>('talepler');

  const [requests, setRequests] = useState<ContentRequestItem[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sourceFilter, setSourceFilter] = useState('');
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [deletingReq, setDeletingReq] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainLoaded, setTrainLoaded] = useState(false);
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<'30' | '90' | '365' | 'all'>('all');

  type CoursePayment = {
    id: string; amount: string; status: string;
    paymentRef: string | null; adminNote: string | null;
    createdAt: string; trainingId: string; trainingTitle: string;
    userId: string; displayName: string | null; email: string;
  };
  const [payments, setPayments] = useState<CoursePayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [paymentNote, setPaymentNote] = useState<Record<string, string>>({});
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [expandedYay, setExpandedYay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<TrainingItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  function loadRequests() {
    setReqLoading(true);
    const qs: Record<string, string> = { type: 'egitim' };
    if (statusFilter) qs.status = statusFilter;
    if (sourceFilter) qs.source = sourceFilter;
    adminApi.listContentRequests(qs)
      .then(r => setRequests(r.data)).catch(() => {}).finally(() => setReqLoading(false));
  }

  function loadTrainings() {
    setTrainLoading(true);
    adminApi.listTrainings()
      .then(setTrainings).catch(() => {}).finally(() => { setTrainLoading(false); setTrainLoaded(true); });
  }

  function loadAnalytics(range?: typeof analyticsRange) {
    setAnalyticsLoading(true);
    const r = range ?? analyticsRange;
    const qs = r !== 'all' ? `?days=${r}` : '';
    adminApi.getTrainingAnalytics(qs)
      .then(setAnalytics).catch(() => {}).finally(() => { setAnalyticsLoading(false); setAnalyticsLoaded(true); });
  }

  function loadPayments() {
    setPaymentsLoading(true);
    adminApi.listCoursePayments()
      .then(setPayments).catch(() => {}).finally(() => { setPaymentsLoading(false); setPaymentsLoaded(true); });
  }

  useEffect(() => { loadRequests(); }, [statusFilter, sourceFilter]); // eslint-disable-line
  useEffect(() => { if (tab === 'egitimler' && !trainLoaded) loadTrainings(); }, [tab]); // eslint-disable-line
  useEffect(() => { if (tab === 'analitik' && !analyticsLoaded) loadAnalytics(); }, [tab]); // eslint-disable-line
  useEffect(() => { if (tab === 'analitik') { setAnalyticsLoaded(false); loadAnalytics(analyticsRange); } }, [analyticsRange]); // eslint-disable-line
  useEffect(() => { if (tab === 'odemeler' && !paymentsLoaded) loadPayments(); }, [tab]); // eslint-disable-line

  async function review(id: string, status: 'approved' | 'rejected') {
    setReviewing(id);
    try { await adminApi.reviewContentRequest(id, status, notes[id]); loadRequests(); }
    finally { setReviewing(null); }
  }

  async function deleteReq(id: string) {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
    setDeletingReq(id);
    try { await adminApi.deleteContentRequest(id); loadRequests(); }
    finally { setDeletingReq(null); }
  }

  function openForm(item?: TrainingItem) {
    if (item) {
      setEditItem(item);
      setForm({
        slug: item.slug, title: item.title,
        instructor: item.instructor ?? '', instructorTitle: item.instructorTitle ?? '',
        format: item.format ?? 'Online', level: item.level ?? 'Orta',
        duration: item.duration ?? '', price: item.price ?? '', memberPrice: item.memberPrice ?? '',
        description: item.description ?? '', registrationUrl: item.registrationUrl ?? '',
        startDate: item.startDate ? item.startDate.slice(0, 10) : '',
        isPublished: item.isPublished,
        coverImageKey: item.coverImageKey ?? '',
        featuredOnSinavMerkezi: (item as TrainingItem & { featuredOnSinavMerkezi?: boolean }).featuredOnSinavMerkezi ?? false,
        sinavKey: (item as TrainingItem & { sinavKey?: string }).sinavKey ?? '',
      });
    } else {
      setEditItem(null);
      setForm(EMPTY_FORM);
    }
    setFormErr('');
    setShowForm(true);
  }

  async function saveTraining(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormErr('');
    try {
      const dto: Record<string, unknown> = { ...form };
      if (!dto.instructor) delete dto.instructor;
      if (!dto.instructorTitle) delete dto.instructorTitle;
      if (!dto.price) delete dto.price;
      if (!dto.memberPrice) delete dto.memberPrice;
      if (!dto.registrationUrl) delete dto.registrationUrl;
      if (!dto.startDate) delete dto.startDate;
      if (!dto.coverImageKey) delete dto.coverImageKey;
      if (editItem) await adminApi.updateTraining(editItem.id, dto);
      else await adminApi.createTraining(dto);
      setShowForm(false);
      loadTrainings();
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Hata oluştu');
    } finally { setSaving(false); }
  }

  async function deleteTraining(id: string) {
    if (!confirm('Bu eğitimi silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    await adminApi.deleteTraining(id).catch(() => {});
    setDeleting(null);
    loadTrainings();
  }

  async function confirmPayment(id: string) {
    setProcessingPayment(id);
    try {
      await adminApi.confirmCoursePayment(id, paymentNote[id]);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'confirmed' } : p));
    } catch { /* noop */ } finally { setProcessingPayment(null); }
  }

  async function rejectPayment(id: string) {
    if (!confirm('Bu ödeme talebini reddetmek istediğinize emin misiniz?')) return;
    setProcessingPayment(id);
    try {
      await adminApi.rejectCoursePayment(id, paymentNote[id]);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    } catch { /* noop */ } finally { setProcessingPayment(null); }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;
  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Eğitimler</h1>
        <p className="text-sm text-gray-500 mt-1">Gelen eğitim talepleri ve yayındaki eğitim içerikleri</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('talepler')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${tab === 'talepler' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Gelen Talepler
          {pendingCount > 0 && <span className="bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
        </button>
        <button onClick={() => setTab('egitimler')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'egitimler' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Yayındaki Eğitimler
        </button>
        <button onClick={() => setTab('analitik')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'analitik' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Analitik
        </button>
        <button onClick={() => setTab('odemeler')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${tab === 'odemeler' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Ödemeler
          {pendingPaymentsCount > 0 && <span className="bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingPaymentsCount}</span>}
        </button>
      </div>

      {/* ── Tab 1: Talepler ── */}
      {tab === 'talepler' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              {(['', 'sahne', 'mutfak'] as const).map(s => (
                <button key={s} onClick={() => setSourceFilter(s)}
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-colors ${sourceFilter === s ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b] hover:text-[#26496b]'}`}>
                  {s === '' ? 'Tümü' : s === 'sahne' ? 'Sahne' : 'Mutfak'}
                </button>
              ))}
            </div>
            <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {reqLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Eğitim talebi bulunamadı.</div>
          ) : (
            <div className="space-y-2">
              {requests.map(item => {
                const isOpen = expandedReq === item.id;
                const grad = item.source === 'sahne'
                  ? 'linear-gradient(135deg,#26496b,#1e3a56)'
                  : 'linear-gradient(135deg,#66aca9,#4d8f8c)';
                const initials = (item.displayName ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ background: grad }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[item.status] ?? ''}`}>{STATUS_LABELS[item.status] ?? item.status}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLORS[item.source] ?? 'bg-gray-100 text-gray-600'}`}>{SOURCE_LABELS[item.source] ?? item.source}</span>
                          <span className="text-[10px] text-gray-400">{item.displayName} · {new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 leading-snug truncate">{item.title}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button title="Sil" disabled={deletingReq === item.id} onClick={() => void deleteReq(item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <IcoTrash />
                        </button>
                        <button title={isOpen ? 'Kapat' : 'Detay'} onClick={() => setExpandedReq(isOpen ? null : item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                          <IcoChevron open={isOpen} />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/60 space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Açıklama</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                        </div>
                        {item.contactInfo && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">İletişim</p>
                            <p className="text-sm text-gray-700">{item.contactInfo}</p>
                          </div>
                        )}
                        {item.adminNotes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                            <span className="font-semibold">Admin Notu: </span>{item.adminNotes}
                          </div>
                        )}
                        {item.status === 'pending' && (
                          <div className="space-y-2 pt-1">
                            <textarea rows={2} value={notes[item.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b] bg-white"
                              placeholder="Onay/red gerekçesi (opsiyonel)…" />
                            <div className="flex gap-2">
                              <button disabled={reviewing === item.id} onClick={() => void review(item.id, 'approved')}
                                className="px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">✓ Onayla</button>
                              <button disabled={reviewing === item.id} onClick={() => void review(item.id, 'rejected')}
                                className="px-4 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">✕ Reddet</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Analitik ── */}
      {tab === 'analitik' && (
        <div>
          {/* Zaman filtresi */}
          <div className="flex gap-1 mb-5">
            {([
              { key: '30', label: 'Son 30 Gün' },
              { key: '90', label: 'Son 3 Ay' },
              { key: '365', label: 'Son 1 Yıl' },
              { key: 'all', label: 'Tüm Zamanlar' },
            ] as const).map(r => (
              <button key={r.key} onClick={() => setAnalyticsRange(r.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${analyticsRange === r.key ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white border-gray-200 text-gray-500 hover:border-[#26496b]/40 hover:text-[#26496b]'}`}>
                {r.label}
              </button>
            ))}
          </div>

          {analyticsLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}
            </div>
          )}
          {!analyticsLoading && analytics && (
            <>
              {/* Özet kartlar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Toplam Kayıt', value: analytics.totalEnrollments, sub: `${analytics.completedCount} tamamlandı`, color: 'text-[#26496b]' },
                  { label: 'Tamamlanma Oranı', value: `%${analytics.completionRate}`, sub: `Ort. ilerleme %${analytics.avgProgress}`, color: 'text-emerald-600' },
                  { label: 'Quiz Girişimi', value: analytics.quizAttempts, sub: `%${analytics.quizPassRate} geçme oranı`, color: 'text-amber-600' },
                  { label: 'Sertifika', value: analytics.totalCertificates, sub: `Ort. puan %${analytics.avgQuizScore}`, color: 'text-violet-600' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <p className={`text-3xl font-black ${stat.color} mb-0.5`}>{stat.value}</p>
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">{stat.label}</p>
                    <p className="text-[10px] text-gray-400">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Bar charts — kurs bazında kayıt */}
              {analytics.topCourses.length > 0 && (() => {
                const maxEnroll = Math.max(...analytics.topCourses.map(c => c.enrollmentCount), 1);
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Kayıt bar chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Kursa Göre Kayıt</p>
                        <span className="text-[10px] text-gray-400">toplam: {analytics.totalEnrollments}</span>
                      </div>
                      <div className="p-5 space-y-3">
                        {analytics.topCourses.slice(0, 8).map((c) => {
                          const pct = Math.round((c.enrollmentCount / maxEnroll) * 100);
                          return (
                            <div key={c.id}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{c.title}</p>
                                <span className="text-xs font-black text-[#26496b] ml-2 shrink-0">{c.enrollmentCount}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="h-2 rounded-full bg-[#26496b] transition-all duration-500"
                                  style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tamamlanma + İlerleme chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Öğrenci Durumu</p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Bitti</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Devam</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />Başlamadı</span>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        {trainings.filter(t => t.enrollStats && t.enrollStats.total > 0).slice(0, 8).map((t) => {
                          const total = t.enrollStats!.total;
                          const finishedPct = Math.round((t.enrollStats!.finished / total) * 100);
                          const ongoingPct = Math.round((t.enrollStats!.ongoing / total) * 100);
                          return (
                            <div key={t.id}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{t.title}</p>
                                <span className="text-xs text-gray-400 ml-2 shrink-0">{total} kayıt</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="h-2 flex">
                                  <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${finishedPct}%` }} />
                                  <div className="bg-amber-400 transition-all duration-500" style={{ width: `${ongoingPct}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
          {!analyticsLoading && !analytics && analyticsLoaded && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Analitik verisi alınamadı.</div>
          )}
        </div>
      )}

      {/* ── Tab: Ödemeler ── */}
      {tab === 'odemeler' && (
        <div>
          {/* Gelir KPI kartları */}
          {!paymentsLoading && payments.length > 0 && (() => {
            const confirmed = payments.filter(p => p.status === 'confirmed');
            const pending   = payments.filter(p => p.status === 'pending');
            const rejected  = payments.filter(p => p.status === 'rejected');
            const parseAmount = (s: string) => parseFloat(s.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            const totalRevenue = confirmed.reduce((s, p) => s + parseAmount(p.amount), 0);
            const pendingRevenue = pending.reduce((s, p) => s + parseAmount(p.amount), 0);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Toplam Gelir', value: `₺${totalRevenue.toLocaleString('tr-TR')}`, sub: `${confirmed.length} onaylı ödeme`, color: 'text-emerald-600' },
                  { label: 'Bekleyen', value: `₺${pendingRevenue.toLocaleString('tr-TR')}`, sub: `${pending.length} talep`, color: 'text-amber-600' },
                  { label: 'Reddedilen', value: rejected.length, sub: 'ödeme talebi', color: 'text-red-500' },
                  { label: 'Toplam Talep', value: payments.length, sub: 'kurs ödeme kaydı', color: 'text-[#26496b]' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
                    <p className="text-[10px] text-gray-400">{s.sub}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {paymentsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Kurs ödeme talebi bulunamadı.</div>
          ) : (
            <div className="space-y-3">
              {payments.map(p => {
                const isPending = p.status === 'pending';
                const statusCls = p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
                const statusLabel = p.status === 'confirmed' ? 'Onaylandı' : p.status === 'rejected' ? 'Reddedildi' : 'Bekliyor';
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
                          <span className="text-base font-black text-[#26496b]">{p.amount}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.trainingTitle}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.displayName ?? 'İsimsiz'} · {p.email}
                        </p>
                        {p.paymentRef && (
                          <p className="text-xs text-gray-400 mt-0.5">Ref: {p.paymentRef}</p>
                        )}
                        {p.adminNote && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">Not: {p.adminNote}</p>
                        )}
                        <p className="text-[10px] text-gray-300 mt-1">{new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          value={paymentNote[p.id] ?? ''}
                          onChange={e => setPaymentNote(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Yönetici notu (opsiyonel)"
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30"
                        />
                        <button
                          onClick={() => void confirmPayment(p.id)}
                          disabled={processingPayment === p.id}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors">
                          {processingPayment === p.id ? '…' : 'Onayla'}
                        </button>
                        <button
                          onClick={() => void rejectPayment(p.id)}
                          disabled={processingPayment === p.id}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors">
                          Reddet
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Yayındaki Eğitimler ── */}
      {tab === 'egitimler' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              {trainings.length === 0 ? 'Henüz eğitim eklenmedi' : (
                <><span className="text-base font-bold text-gray-800">{trainings.length}</span> eğitim yayında</>
              )}
            </p>
            <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Eğitim Ekle
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">{editItem ? 'Eğitimi Düzenle' : 'Yeni Eğitim'}</h2>
              <form onSubmit={(e) => void saveTraining(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label><input required className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editItem ? f.slug : toSlug(e.target.value) }))} /></div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">URL Adresi <span className="font-normal text-gray-400">(otomatik)</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">/egitim/</span>
                      <input required className={`${inp} pl-[60px] font-mono text-xs`} value={form.slug}
                        onChange={e => setForm(f => ({ ...f, slug: toSlug(e.target.value) }))}
                        placeholder="otomatik-doldurulur" />
                    </div>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Eğitmen</label><input className={inp} value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Eğitmen Ünvanı</label><input className={inp} value={form.instructorTitle} onChange={e => setForm(f => ({ ...f, instructorTitle: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Format</label>
                    <select className={inp} value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                      {['Online', 'Yüz Yüze', 'Hibrit'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Seviye</label>
                    <select className={inp} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                      {['Başlangıç', 'Başlangıç – Orta', 'Orta', 'Orta – İleri', 'İleri'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Süre</label><input className={inp} placeholder="12 saat · 6 oturum" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Fiyat</label><input className={inp} placeholder="1500 TL (boş = ücretsiz)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Üye Fiyatı</label><input className={inp} placeholder="1100 TL" value={form.memberPrice} onChange={e => setForm(f => ({ ...f, memberPrice: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Başlangıç Tarihi</label><input type="date" className={inp} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Kayıt URL</label><input className={inp} value={form.registrationUrl} onChange={e => setForm(f => ({ ...f, registrationUrl: e.target.value }))} /></div>
                  <div className="flex flex-col gap-2 pt-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="published" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                      <label htmlFor="published" className="text-sm text-gray-700">Yayında</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="sinavMerkezi" checked={form.featuredOnSinavMerkezi} onChange={e => setForm(f => ({ ...f, featuredOnSinavMerkezi: e.target.checked }))} className="rounded" />
                      <label htmlFor="sinavMerkezi" className="text-sm text-gray-700">Sınav Merkezinde Göster</label>
                    </div>
                    {form.featuredOnSinavMerkezi && (
                      <select className={inp} value={form.sinavKey} onChange={e => setForm(f => ({ ...f, sinavKey: e.target.value }))}>
                        <option value="">Tüm Sınavlar (genel)</option>
                        <option value="kpss">KPSS</option>
                        <option value="gayrimenkul">Gayrimenkul Değerleme</option>
                        <option value="iha">İHA Sertifikası</option>
                      </select>
                    )}
                  </div>
                </div>
                {/* Kapak Görseli */}
                <div className="col-span-full">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Kapak Görseli</label>
                  <div className="flex items-start gap-4">
                    {/* Önizleme */}
                    <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center">
                      {form.coverImageKey ? (
                        <img
                          src={`${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/api/v1/media?key=${encodeURIComponent(form.coverImageKey)}`}
                          alt="Kapak" className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#26496b] hover:text-[#26496b] transition-colors ${uploadingCover ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {uploadingCover ? 'Yükleniyor…' : 'Görsel Yükle'}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingCover(true);
                            try {
                              const result = await adminApi.uploadFile(file);
                              setForm(f => ({ ...f, coverImageKey: result.key }));
                            } catch {} finally { setUploadingCover(false); }
                          }}
                        />
                      </label>
                      {form.coverImageKey && (
                        <button type="button" onClick={() => setForm(f => ({ ...f, coverImageKey: '' }))}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline">
                          Görseli kaldır
                        </button>
                      )}
                      <p className="text-[10px] text-gray-400">JPG/PNG, max 5MB. Önerilen: 1200×675px (16:9)</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-full"><label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label>
                  <textarea rows={3} className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                {formErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formErr}</p>}
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-lg hover:bg-[#1e3a56] disabled:opacity-60">{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
                </div>
              </form>
            </div>
          )}

          {trainLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : trainings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <p>Henüz yayında eğitim yok.</p>
              <button onClick={() => openForm()} className="mt-3 text-sm text-[#26496b] hover:underline font-medium">İlk eğitimi ekle →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {trainings.map(item => {
                const isOpen = expandedYay === item.id;
                const grad = LEVEL_GRADS[item.level ?? ''] ?? 'linear-gradient(135deg,#64748b,#475569)';
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      {/* Cover image ya da renk avatar */}
                      <div className="w-14 h-10 rounded-xl shrink-0 overflow-hidden shadow-sm">
                        {item.coverImageKey ? (
                          <img
                            src={`${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/api/v1/media?key=${encodeURIComponent(item.coverImageKey)}`}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-base font-bold"
                            style={{ background: grad }}>
                            {item.title[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          {item.level && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[item.level] ?? 'bg-gray-100 text-gray-600'}`}>{item.level}</span>}
                          {item.format && <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{item.format}</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.isPublished ? 'Yayında' : 'Taslak'}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 leading-snug">{item.title}</p>
                        {item.instructor && (
                          <p className="text-xs text-[#26496b]/70 mt-0.5">{item.instructor}{item.instructorTitle ? ` · ${item.instructorTitle}` : ''}</p>
                        )}
                        {(item.duration || item.price) && (
                          <p className="text-xs text-gray-400 mt-0.5">{[item.duration, item.price].filter(Boolean).join(' · ')}</p>
                        )}
                        {/* Enrollment istatistikleri */}
                        {item.enrollStats && item.enrollStats.total > 0 && (
                          <div className="flex items-center gap-3 mt-1.5">
                            {[
                              { label: 'Kayıtlı', value: item.enrollStats.total, color: 'text-[#26496b]' },
                              { label: 'Devam', value: item.enrollStats.ongoing, color: 'text-amber-600' },
                              { label: 'Bitirdi', value: item.enrollStats.finished, color: 'text-emerald-600' },
                            ].map(s => (
                              <div key={s.label} className="flex items-center gap-1">
                                <span className={`text-xs font-black ${s.color}`}>{s.value}</span>
                                <span className="text-[10px] text-gray-400">{s.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Action buttons — always visible */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button title="Düzenle" onClick={() => { openForm(item); setExpandedYay(null); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors">
                          <IcoEdit />
                        </button>
                        <button title="Sil" disabled={deleting === item.id} onClick={() => void deleteTraining(item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <IcoTrash />
                        </button>
                        <button title={isOpen ? 'Kapat' : 'Detaylar'} onClick={() => setExpandedYay(isOpen ? null : item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                          <IcoChevron open={isOpen} />
                        </button>
                      </div>
                    </div>
                    {isOpen && <CourseContentPanel trainingId={item.id} trainingSlug={item.slug} enrollmentCount={item.enrollmentCount} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
