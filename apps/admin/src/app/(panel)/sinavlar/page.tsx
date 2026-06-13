'use client';

import { useEffect, useState } from 'react';
import { RowMenu } from '@/components/RowMenu';
import { adminApi, type ExamResource } from '@/lib/api';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function token() {
  return typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : '';
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/v1${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error((await res.json() as { message?: string }).message ?? 'Hata');
  return res.json() as Promise<T>;
}

const EXAM_KEYS = [
  { key: 'kpss', label: 'KPSS', sub: 'Kamu Personel Seçme Sınavı', emoji: '🏛️' },
  { key: 'deger', label: 'Gayrimenkul Değerleme', sub: 'Uzmanlık Sınavı', emoji: '🏠' },
  { key: 'cbs', label: 'CBS Uzmanı', sub: 'Coğrafi Bilgi Sistemleri', emoji: '🗺️' },
  { key: 'iha', label: 'İHA Sertifikası', sub: 'Drone Sertifika Sınavı', emoji: '🚁' },
];

const RESOURCE_TYPES = [
  { value: 'tip', label: 'Tüyo / İpucu', color: 'bg-amber-100 text-amber-700', icon: '💡' },
  { value: 'document', label: 'Döküman / Kaynak', color: 'bg-blue-100 text-blue-700', icon: '📄' },
  { value: 'date', label: 'Kritik Tarih', color: 'bg-red-100 text-red-700', icon: '📅' },
  { value: 'video', label: 'Video / Eğitim', color: 'bg-purple-100 text-purple-700', icon: '🎬' },
];

interface ExamCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  examType: string;
  iconEmoji: string | null;
  questionCount: number;
  isActive: boolean;
  sortOrder: number;
}

interface ExamQuestion {
  id: string;
  categoryId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string | null;
  correctOption: string;
  explanation: string | null;
  difficulty: string;
  source: string | null;
  isActive: boolean;
}

interface AdminStats {
  categories: { id: string; name: string; questionCount: number; attemptCount: number; avgScore: number }[];
}

const EXAM_TYPES: Record<string, string> = {
  kpss: 'KPSS',
  lisans: 'Lisans Sınavı',
  uzmanlik: 'Uzmanlık Sınavı',
  diger: 'Diğer',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

const inp = 'w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b] focus:border-[#26496b]';

type Tab = 'categories' | 'questions' | 'resources' | 'stats';

export default function SinavlarAdminPage() {
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState<ExamCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', examType: 'diger', iconEmoji: '', sortOrder: 0, isActive: true });
  const [catBusy, setCatBusy] = useState(false);
  const [catErr, setCatErr] = useState('');

  // Question form
  const [selectedCat, setSelectedCat] = useState<ExamCategory | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showQForm, setShowQForm] = useState(false);
  const [editQ, setEditQ] = useState<ExamQuestion | null>(null);
  const [qForm, setQForm] = useState({
    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '',
    correctOption: 'A', explanation: '', difficulty: 'medium', source: '', isActive: true,
  });
  const [qBusy, setQBusy] = useState(false);
  const [qErr, setQErr] = useState('');

  // Resources tab
  const [resExamKey, setResExamKey] = useState('kpss');
  const [resTypeFilter, setResTypeFilter] = useState('');
  const [resources, setResources] = useState<ExamResource[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resLoaded, setResLoaded] = useState(false);
  const [showResForm, setShowResForm] = useState(false);
  const [editRes, setEditRes] = useState<ExamResource | null>(null);
  const [resForm, setResForm] = useState({
    examKey: 'kpss', resourceType: 'tip', title: '', content: '',
    resourceUrl: '', eventDate: '', isPublished: true, sortOrder: 0,
  });
  const [resBusy, setResBusy] = useState(false);
  const [resErr, setResErr] = useState('');

  function loadCategories() {
    setLoading(true);
    apiFetch<ExamCategory[]>('/exams/admin/stats')
      .then(data => {
        setStats({ categories: (data as unknown as AdminStats['categories']) });
      })
      .catch(() => {});
    apiFetch<ExamCategory[]>('/exams/categories')
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCategories(); }, []);

  async function loadQuestions(cat: ExamCategory) {
    setSelectedCat(cat);
    setQuestionsLoading(true);
    setTab('questions');
    apiFetch<ExamQuestion[]>(`/exams/admin/categories/${cat.id}/questions`)
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setQuestionsLoading(false));
  }

  function openCatForm(cat?: ExamCategory) {
    if (cat) {
      setEditCat(cat);
      setCatForm({
        name: cat.name, slug: cat.slug, description: cat.description ?? '',
        examType: cat.examType, iconEmoji: cat.iconEmoji ?? '', sortOrder: cat.sortOrder, isActive: cat.isActive,
      });
    } else {
      setEditCat(null);
      setCatForm({ name: '', slug: '', description: '', examType: 'diger', iconEmoji: '', sortOrder: 0, isActive: true });
    }
    setShowCatForm(true);
  }

  async function saveCat(e: React.FormEvent) {
    e.preventDefault();
    setCatBusy(true);
    setCatErr('');
    try {
      if (editCat) {
        await apiFetch(`/exams/admin/categories/${editCat.id}`, { method: 'PATCH', body: JSON.stringify(catForm) });
      } else {
        await apiFetch('/exams/admin/categories', { method: 'POST', body: JSON.stringify(catForm) });
      }
      setShowCatForm(false);
      loadCategories();
    } catch (e) {
      setCatErr(e instanceof Error ? e.message : 'Hata');
    } finally {
      setCatBusy(false);
    }
  }

  function openQForm(q?: ExamQuestion) {
    if (q) {
      setEditQ(q);
      setQForm({
        questionText: q.questionText, optionA: q.optionA, optionB: q.optionB,
        optionC: q.optionC, optionD: q.optionD, optionE: q.optionE ?? '',
        correctOption: q.correctOption, explanation: q.explanation ?? '',
        difficulty: q.difficulty, source: q.source ?? '', isActive: q.isActive,
      });
    } else {
      setEditQ(null);
      setQForm({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctOption: 'A', explanation: '', difficulty: 'medium', source: '', isActive: true });
    }
    setShowQForm(true);
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCat) return;
    setQBusy(true);
    setQErr('');
    try {
      const payload = { ...qForm, optionE: qForm.optionE || null, explanation: qForm.explanation || null, source: qForm.source || null };
      if (editQ) {
        await apiFetch(`/exams/admin/questions/${editQ.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/exams/admin/questions', { method: 'POST', body: JSON.stringify({ ...payload, categoryId: selectedCat.id }) });
      }
      setShowQForm(false);
      void loadQuestions(selectedCat);
    } catch (e) {
      setQErr(e instanceof Error ? e.message : 'Hata');
    } finally {
      setQBusy(false);
    }
  }

  function loadResources() {
    setResLoading(true);
    adminApi.listExamResources(resExamKey, resTypeFilter || undefined)
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => { setResLoading(false); setResLoaded(true); });
  }

  useEffect(() => {
    if (tab === 'resources') loadResources();
  }, [tab, resExamKey, resTypeFilter]); // eslint-disable-line

  function openResForm(res?: ExamResource) {
    if (res) {
      setEditRes(res);
      setResForm({
        examKey: res.examKey, resourceType: res.resourceType, title: res.title,
        content: res.content ?? '', resourceUrl: res.resourceUrl ?? '',
        eventDate: res.eventDate ? new Date(res.eventDate).toISOString().slice(0, 16) : '',
        isPublished: res.isPublished, sortOrder: res.sortOrder,
      });
    } else {
      setEditRes(null);
      setResForm({ examKey: resExamKey, resourceType: resTypeFilter || 'tip', title: '', content: '', resourceUrl: '', eventDate: '', isPublished: true, sortOrder: 0 });
    }
    setShowResForm(true);
    setResErr('');
  }

  async function saveRes(e: React.FormEvent) {
    e.preventDefault();
    setResBusy(true);
    setResErr('');
    try {
      const payload = {
        ...resForm,
        ...(resForm.content ? { content: resForm.content } : {}),
        ...(resForm.resourceUrl ? { resourceUrl: resForm.resourceUrl } : {}),
        ...(resForm.eventDate ? { eventDate: new Date(resForm.eventDate).toISOString() } : {}),
      };
      if (editRes) {
        await adminApi.updateExamResource(editRes.id, payload);
      } else {
        await adminApi.createExamResource(payload);
      }
      setShowResForm(false);
      loadResources();
    } catch (err) {
      setResErr(err instanceof Error ? err.message : 'Hata');
    } finally {
      setResBusy(false);
    }
  }

  async function deleteRes(id: string) {
    if (!confirm('Bu kaynağı silmek istediğinizden emin misiniz?')) return;
    await adminApi.deleteExamResource(id).catch(() => {});
    loadResources();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sınavlar</h1>
          <p className="text-sm text-gray-500 mt-1">Sınav kategorileri ve soru bankası yönetimi.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['categories', 'questions', 'resources', 'stats'] as Tab[]).map(t => {
          const labels: Record<Tab, string> = { categories: 'Kategoriler', questions: 'Sorular', resources: 'Kaynaklar & Tüyolar', stats: 'İstatistikler' };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── Categories Tab ──────────────────────────────────────────────── */}
      {tab === 'categories' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => openCatForm()} className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Yeni Kategori
            </button>
          </div>

          {showCatForm && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-4">{editCat ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</h2>
              <form onSubmit={(e) => void saveCat(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Ad *</label><input required className={inp} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Slug *</label><input required className={inp} value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: e.target.value }))} placeholder="kpss-haritacilik" /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Sınav Tipi</label>
                    <select className={inp} value={catForm.examType} onChange={e => setCatForm(f => ({ ...f, examType: e.target.value }))}>
                      {Object.entries(EXAM_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Emoji İkon</label><input className={inp} value={catForm.iconEmoji} onChange={e => setCatForm(f => ({ ...f, iconEmoji: e.target.value }))} placeholder="📐" /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Sıralama</label><input type="number" className={inp} value={catForm.sortOrder} onChange={e => setCatForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} /></div>
                  <div className="flex items-center gap-2 pt-5">
                    <input type="checkbox" id="catActive" checked={catForm.isActive} onChange={e => setCatForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                    <label htmlFor="catActive" className="text-sm text-gray-700">Aktif</label>
                  </div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label><textarea rows={2} className={inp} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} /></div>
                {catErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{catErr}</p>}
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => { setShowCatForm(false); setEditCat(null); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" disabled={catBusy} className="px-5 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-lg hover:bg-[#1e3a56] disabled:opacity-60">{catBusy ? 'Kaydediliyor…' : 'Kaydet'}</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-16 animate-pulse" />)}</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tip</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Soru</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Durum</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {cat.iconEmoji && <span className="text-base">{cat.iconEmoji}</span>}
                          <div>
                            <p className="font-medium text-gray-900">{cat.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{cat.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{EXAM_TYPES[cat.examType] ?? cat.examType}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-gray-900">{cat.questionCount}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <RowMenu items={[
                          { label: 'Soruları Gör', onClick: () => void loadQuestions(cat) },
                          { label: 'Düzenle', onClick: () => openCatForm(cat) },
                        ]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Questions Tab ───────────────────────────────────────────────── */}
      {tab === 'questions' && (
        <div>
          {!selectedCat ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              <p className="mb-2">Lütfen bir kategori seçin.</p>
              <button onClick={() => setTab('categories')} className="text-sm text-[#26496b] hover:underline font-medium">Kategorilere git</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setTab('categories'); setSelectedCat(null); }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h2 className="font-bold text-gray-900">{selectedCat.name} — Sorular ({questions.length})</h2>
                </div>
                <button onClick={() => openQForm()} className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Yeni Soru
                </button>
              </div>

              {showQForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
                  <h3 className="font-bold text-gray-900 mb-4">{editQ ? 'Soruyu Düzenle' : 'Yeni Soru'}</h3>
                  <form onSubmit={(e) => void saveQuestion(e)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Soru Metni *</label>
                      <textarea required rows={3} className={inp} value={qForm.questionText} onChange={e => setQForm(f => ({ ...f, questionText: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => (
                        <div key={opt}>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Seçenek {opt} *</label>
                          <input required className={inp} value={qForm[`option${opt}` as keyof typeof qForm] as string} onChange={e => setQForm(f => ({ ...f, [`option${opt}`]: e.target.value }))} />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Seçenek E (isteğe bağlı)</label>
                        <input className={inp} value={qForm.optionE} onChange={e => setQForm(f => ({ ...f, optionE: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Doğru Cevap *</label>
                        <select required className={inp} value={qForm.correctOption} onChange={e => setQForm(f => ({ ...f, correctOption: e.target.value }))}>
                          {['A', 'B', 'C', 'D', 'E'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Zorluk</label>
                        <select className={inp} value={qForm.difficulty} onChange={e => setQForm(f => ({ ...f, difficulty: e.target.value }))}>
                          {Object.entries(DIFFICULTY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Kaynak</label>
                        <input className={inp} value={qForm.source} onChange={e => setQForm(f => ({ ...f, source: e.target.value }))} placeholder="KPSS 2023 A Kitapçığı" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label>
                      <textarea rows={2} className={inp} value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Bu sorunun doğru cevabı neden E?" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="qActive" checked={qForm.isActive} onChange={e => setQForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                      <label htmlFor="qActive" className="text-sm text-gray-700">Aktif (sınavda görünsün)</label>
                    </div>
                    {qErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{qErr}</p>}
                    <div className="flex gap-3 justify-end">
                      <button type="button" onClick={() => { setShowQForm(false); setEditQ(null); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
                      <button type="submit" disabled={qBusy} className="px-5 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-lg hover:bg-[#1e3a56] disabled:opacity-60">{qBusy ? 'Kaydediliyor…' : 'Kaydet'}</button>
                    </div>
                  </form>
                </div>
              )}

              {questionsLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-16 animate-pulse" />)}</div>
              ) : questions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">Bu kategoride henüz soru yok.</div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, qi) => (
                    <div key={q.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-400">#{qi + 1}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[q.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>{DIFFICULTY_LABELS[q.difficulty]}</span>
                            {!q.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Pasif</span>}
                          </div>
                          <p className="text-sm text-gray-800 font-medium mb-2">{q.questionText}</p>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                            {['A', 'B', 'C', 'D', 'E'].map(opt => {
                              const val = q[`option${opt}` as keyof ExamQuestion] as string | null;
                              if (!val) return null;
                              const isCorrect = q.correctOption === opt;
                              return <span key={opt} className={isCorrect ? 'text-green-700 font-semibold' : ''}>{opt}) {val}</span>;
                            })}
                          </div>
                          {q.explanation && <p className="text-xs text-gray-400 mt-2 italic">{q.explanation}</p>}
                        </div>
                        <button onClick={() => openQForm(q)} className="text-xs px-3 py-1 bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] shrink-0">Düzenle</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Resources Tab ─────────────────────────────────────────────── */}
      {tab === 'resources' && (
        <div>
          {/* Exam selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {EXAM_KEYS.map(exam => (
              <button
                key={exam.key}
                onClick={() => { setResExamKey(exam.key); setResLoaded(false); }}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${resExamKey === exam.key ? 'border-[#26496b] bg-[#26496b]/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                <div className="text-2xl mb-1">{exam.emoji}</div>
                <div className={`text-sm font-bold ${resExamKey === exam.key ? 'text-[#26496b]' : 'text-gray-800'}`}>{exam.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-tight">{exam.sub}</div>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setResTypeFilter('')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${resTypeFilter === '' ? 'bg-[#26496b] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                Tümü
              </button>
              {RESOURCE_TYPES.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => setResTypeFilter(rt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${resTypeFilter === rt.value ? 'bg-[#26496b] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {rt.icon} {rt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => openResForm()}
              className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56] shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Yeni Kaynak
            </button>
          </div>

          {/* Form */}
          {showResForm && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
              <h3 className="font-bold text-gray-900 mb-4">{editRes ? 'Kaynağı Düzenle' : 'Yeni Kaynak Ekle'}</h3>
              <form onSubmit={(e) => void saveRes(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sınav</label>
                    <select className={inp} value={resForm.examKey} onChange={e => setResForm(f => ({ ...f, examKey: e.target.value }))}>
                      {EXAM_KEYS.map(ex => <option key={ex.key} value={ex.key}>{ex.emoji} {ex.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Kaynak Türü</label>
                    <select className={inp} value={resForm.resourceType} onChange={e => setResForm(f => ({ ...f, resourceType: e.target.value }))}>
                      {RESOURCE_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.icon} {rt.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label>
                    <input required className={inp} value={resForm.title} onChange={e => setResForm(f => ({ ...f, title: e.target.value }))} placeholder="Konu başlığı" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">İçerik / Açıklama</label>
                    <textarea rows={3} className={inp} value={resForm.content} onChange={e => setResForm(f => ({ ...f, content: e.target.value }))} placeholder="Tüyo, açıklama, notlar…" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Bağlantı URL (isteğe bağlı)</label>
                    <input className={inp} value={resForm.resourceUrl} onChange={e => setResForm(f => ({ ...f, resourceUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                  {resForm.resourceType === 'date' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Tarih</label>
                      <input type="datetime-local" className={inp} value={resForm.eventDate} onChange={e => setResForm(f => ({ ...f, eventDate: e.target.value }))} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sıralama</label>
                    <input type="number" className={inp} value={resForm.sortOrder} onChange={e => setResForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input type="checkbox" id="resPublished" checked={resForm.isPublished} onChange={e => setResForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                    <label htmlFor="resPublished" className="text-sm text-gray-700">Yayında</label>
                  </div>
                </div>
                {resErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{resErr}</p>}
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => { setShowResForm(false); setEditRes(null); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" disabled={resBusy} className="px-5 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-lg hover:bg-[#1e3a56] disabled:opacity-60">{resBusy ? 'Kaydediliyor…' : 'Kaydet'}</button>
                </div>
              </form>
            </div>
          )}

          {/* Resource list */}
          {resLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-20 animate-pulse" />)}</div>
          ) : resources.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              <p className="text-lg mb-1">Henüz kaynak eklenmedi.</p>
              <p className="text-sm">Bu sınav için tüyo, döküman veya kritik tarih ekleyin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map(res => {
                const rt = RESOURCE_TYPES.find(r => r.value === res.resourceType);
                return (
                  <div key={res.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rt?.color ?? 'bg-gray-100 text-gray-600'}`}>
                            {rt?.icon} {rt?.label ?? res.resourceType}
                          </span>
                          {!res.isPublished && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Taslak</span>}
                          {res.eventDate && (
                            <span className="text-xs text-gray-400">
                              📅 {new Date(res.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">{res.title}</p>
                        {res.content && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{res.content}</p>}
                        {res.resourceUrl && (
                          <a href={res.resourceUrl} target="_blank" rel="noreferrer" className="text-xs text-[#26496b] hover:underline mt-1 inline-block truncate max-w-xs">
                            🔗 {res.resourceUrl}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openResForm(res)} className="text-xs px-3 py-1 bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56]">Düzenle</button>
                        <button onClick={() => void deleteRes(res.id)} className="text-xs px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Sil</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Stats Tab ───────────────────────────────────────────────────── */}
      {tab === 'stats' && (
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Sınav İstatistikleri</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Kategori</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Sorular</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Girişimler</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Ort. Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => {
                  const s = stats?.categories.find(c => c.id === cat.id);
                  return (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {cat.iconEmoji && <span>{cat.iconEmoji}</span>}
                          <span className="font-medium text-gray-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{cat.questionCount}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{s?.attemptCount ?? 0}</td>
                      <td className="px-4 py-3 text-center">
                        {s?.avgScore ? (
                          <span className={`font-semibold ${s.avgScore >= 70 ? 'text-green-600' : s.avgScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                            %{s.avgScore.toFixed(0)}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
