'use client';

import { useEffect, useState, useCallback } from 'react';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const NAVY = '#26496b';

function getToken() {
  return typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : '';
}

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/v1${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Survey {
  id: string; title: string; description: string | null;
  type: string; slug: string | null; status: string; endsAt: string | null;
  responseCount: number; timeLimit: number | null; passingScore: number | null;
  allowAnonymous: boolean; showResults: boolean; createdAt: string; updatedAt: string;
}

interface SurveyQuestion {
  id: string; surveyId: string; questionText: string;
  type: 'single' | 'multiple' | 'text' | 'rating' | 'truefalse';
  options: string[] | null; correctOptions: string[] | null;
  points: number; explanation: string | null; required: boolean; sortOrder: number;
  imageUrl: string | null;
  scenarioText: string | null;
  difficulty: string;
  topicTags: string[];
}

interface SurveyWithQuestions extends Survey { questions: SurveyQuestion[]; }

interface QuestionResult {
  questionId: string; questionText: string; type: string;
  total?: number; breakdown?: { option: string; count: number; percent: number }[];
  answers?: string[];
}

interface ResultsData {
  survey: { id: string; title: string; responseCount: number };
  results: QuestionResult[];
}

interface RawResponse {
  id: string; respondentEmail: string | null;
  answers: Record<string, string | string[]>;
  source: string; createdAt: string;
}

interface ResponsesData {
  questions: SurveyQuestion[]; responses: RawResponse[]; total: number;
}

interface SegmentRow { profession?: string; city?: string; range?: string; status?: string; count: number; avgScore?: number; passRate?: number; }
interface SegmentedData {
  total: number;
  byProfession: (SegmentRow & { profession: string })[];
  byCity: (SegmentRow & { city: string })[];
  byExperience: (SegmentRow & { range: string; avgScore: number })[];
  byWorkStatus: (SegmentRow & { status: string })[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = { draft: 'Taslak', active: 'Aktif', ended: 'Kapalı', archived: 'Arşiv' };
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-emerald-100 text-emerald-700',
  ended: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-400',
};
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  anket: { label: 'Anket', color: 'bg-sky-100 text-sky-700' },
  test:  { label: 'Test',  color: 'bg-violet-100 text-violet-700' },
};
const Q_TYPE_LABELS: Record<string, string> = { single: 'Tek Seçim', multiple: 'Çok Seçim', text: 'Açık Uçlu', rating: 'Puanlama', truefalse: 'D/Y' };
const Q_TYPE_COLORS: Record<string, string> = {
  single: 'bg-blue-50 text-blue-700',
  multiple: 'bg-purple-50 text-purple-700',
  text: 'bg-orange-50 text-orange-700',
  rating: 'bg-yellow-50 text-yellow-700',
  truefalse: 'bg-teal-50 text-teal-700',
};

const inp = 'w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] transition-colors';

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Kolay',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'medium', label: 'Orta',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'hard',   label: 'Zor',    color: 'bg-red-100 text-red-700 border-red-200' },
];

const HARITA_TOPICS = [
  'CBS / GIS', 'Kadastro', 'Fotogrametri', 'Uzaktan Algılama',
  'Arazi Ölçmeleri', 'Jeodezi', 'Harita Üretimi', 'İHA / Drone',
  'GNSS / GPS', 'Navigasyon', 'Mesleki Mevzuat', 'Yersel Ölçme',
  'Konumsal Analiz', '3D Modelleme', 'Veri Tabanı', 'Genel',
];

// ── CSV Export ───────────────────────────────────────────────────────────────

function exportCsv(data: ResponsesData, surveyTitle: string) {
  const qs = data.questions.sort((a, b) => a.sortOrder - b.sortOrder);
  const headers = ['#', 'E-posta', 'Kaynak', 'Tarih', ...qs.map(q => q.questionText)];
  const rows = data.responses.map((r, i) => [
    String(i + 1),
    r.respondentEmail ?? '—',
    r.source,
    new Date(r.createdAt).toLocaleString('tr-TR'),
    ...qs.map(q => {
      const ans = r.answers[q.id];
      if (!ans) return '';
      return Array.isArray(ans) ? ans.join('; ') : ans;
    }),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const bom = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${surveyTitle.replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ ]/g, '_')}_yanıtlar.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SurveyModal({
  survey, onClose, onSaved, defaultType = 'anket',
}: {
  survey: Survey | null; onClose: () => void; onSaved: () => void; defaultType?: 'anket' | 'test';
}) {
  const isEdit = !!survey;
  const [form, setForm] = useState({
    title: survey?.title ?? '',
    type: survey?.type ?? defaultType,
    description: survey?.description ?? '',
    slug: survey?.slug ?? '',
    status: survey?.status ?? 'active',
    endsAt: survey?.endsAt ? survey.endsAt.slice(0, 16) : '',
    timeLimit: survey?.timeLimit ? String(Math.round(survey.timeLimit / 60)) : '',
    passingScore: survey?.passingScore ? String(survey.passingScore) : '',
    allowAnonymous: survey?.allowAnonymous ?? true,
    showResults: survey?.showResults ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const payload = {
        title: form.title,
        type: form.type,
        description: form.description || undefined,
        slug: form.slug || undefined,
        status: form.status,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        timeLimit: form.timeLimit ? parseInt(form.timeLimit) * 60 : undefined,
        passingScore: form.passingScore ? parseInt(form.passingScore) : undefined,
        allowAnonymous: form.allowAnonymous,
        showResults: form.showResults,
      };
      if (isEdit) {
        await api(`/surveys/admin/${survey!.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/surveys/admin/create', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
      onClose();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Anketi Düzenle' : 'Yeni Anket Oluştur'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={(e) => void save(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label>
            <input required className={inp} value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Anket / Test başlığı…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tür</label>
              <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="anket">Anket</option>
                <option value="test">Test</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Durum</label>
              <select className={inp} value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label>
            <textarea rows={2} className={inp} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Katılımcılara gösterilecek açıklama (opsiyonel)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Slug (URL)</label>
              <input className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ornek-anket" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Bitiş Tarihi</label>
              <input type="datetime-local" className={inp} value={form.endsAt}
                onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} />
            </div>
          </div>
          {form.type === 'test' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Süre Limiti (dk)</label>
                <input type="number" min="1" className={inp} value={form.timeLimit} onChange={e => setForm(f => ({ ...f, timeLimit: e.target.value }))} placeholder="Boş = süresiz" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Geçme Notu (%)</label>
                <input type="number" min="0" max="100" className={inp} value={form.passingScore} onChange={e => setForm(f => ({ ...f, passingScore: e.target.value }))} placeholder="Örn: 70" />
              </div>
            </div>
          )}
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.allowAnonymous} onChange={e => setForm(f => ({ ...f, allowAnonymous: e.target.checked }))} className="rounded" />
              <span className="font-medium text-gray-600">Anonim katılım</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.showResults} onChange={e => setForm(f => ({ ...f, showResults: e.target.checked }))} className="rounded" />
              <span className="font-medium text-gray-600">Sonuçları göster</span>
            </label>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={busy}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
              style={{ backgroundColor: NAVY }}>
              {busy ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionForm({
  surveyId, question, onClose, onSaved, nextOrder,
}: {
  surveyId: string; question: SurveyQuestion | null;
  onClose: () => void; onSaved: () => void; nextOrder: number;
}) {
  const isEdit = !!question;
  const [text, setText] = useState(question?.questionText ?? '');
  const [scenario, setScenario] = useState(question?.scenarioText ?? '');
  const [type, setType] = useState<'single' | 'multiple' | 'text' | 'rating' | 'truefalse'>(question?.type ?? 'single');
  const [options, setOptions] = useState<string[]>(question?.options ?? ['', '', '']);
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set(question?.correctOptions ?? []));
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [required, setRequired] = useState(question?.required ?? true);
  const [imageUrl, setImageUrl] = useState(question?.imageUrl ?? '');
  const [difficulty, setDifficulty] = useState(question?.difficulty ?? 'medium');
  const [topicTags, setTopicTags] = useState<string[]>(question?.topicTags ?? []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function addOption() { setOptions(o => [...o, '']); }
  function removeOption(i: number) {
    const removed = options[i];
    setOptions(o => o.filter((_, idx) => idx !== i));
    if (removed) setCorrectSet(s => { const n = new Set(s); n.delete(removed); return n; });
  }
  function setOption(i: number, v: string) {
    const prev = options[i];
    setOptions(o => o.map((x, idx) => idx === i ? v : x));
    if (prev && correctSet.has(prev)) {
      setCorrectSet(s => { const n = new Set(s); n.delete(prev); if (v) n.add(v); return n; });
    }
  }
  function toggleCorrect(opt: string) {
    if (type === 'single') {
      setCorrectSet(new Set(opt ? [opt] : []));
    } else {
      setCorrectSet(s => { const n = new Set(s); n.has(opt) ? n.delete(opt) : n.add(opt); return n; });
    }
  }
  function toggleTopic(t: string) {
    setTopicTags(tags => tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/v1/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Yükleme başarısız');
      const data = await res.json() as { url: string };
      setImageUrl(data.url);
    } catch (e) { setError((e as Error).message); }
    finally { setUploading(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const needsOptions = type !== 'text' && type !== 'truefalse';
      const filteredOptions = needsOptions ? options.filter(o => o.trim()) : null;
      if (needsOptions && (!filteredOptions || filteredOptions.length < 2)) {
        throw new Error('En az 2 seçenek giriniz.');
      }
      const payload = {
        surveyId, questionText: text.trim(), type,
        options: filteredOptions,
        correctOptions: correctSet.size > 0 ? Array.from(correctSet) : undefined,
        points: parseInt(points) || 1,
        explanation: explanation || undefined,
        required,
        sortOrder: question?.sortOrder ?? nextOrder,
        imageUrl: imageUrl || undefined,
        scenarioText: scenario || undefined,
        difficulty,
        topicTags,
      };
      if (isEdit) {
        await api(`/surveys/admin/questions/${question!.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/surveys/admin/questions', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const tfOpts = ['Doğru', 'Yanlış'];
  const displayOptions = type === 'truefalse' ? tfOpts : options;
  const showOptions = type !== 'text';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm">{isEdit ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form onSubmit={(e) => void save(e)} className="p-5 space-y-5">

        {/* Senaryo / Bağlam */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Senaryo / Bağlam
            <span className="font-normal text-gray-400 ml-1">(opsiyonel — sorudan önce gösterilir)</span>
          </label>
          <textarea rows={2} className={`${inp} resize-none`} value={scenario}
            onChange={e => setScenario(e.target.value)}
            placeholder="Örn: Aşağıdaki koordinat tablosunu inceleyerek soruyu cevaplayın…" />
        </div>

        {/* Görsel */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Görsel (opsiyonel)</label>
          {imageUrl && (
            <div className="relative mb-2 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
              <img src={imageUrl} alt="Soru görseli" className="max-h-48 w-full object-contain" />
              <button type="button" onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 bg-white/90 rounded-lg p-1 text-gray-500 hover:text-red-500 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              className={`${inp} flex-1`}
              value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://… veya aşağıdan dosya yükle"
            />
            <label className={`shrink-0 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? '…' : 'Yükle'}
              <input type="file" accept="image/*" className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f) void uploadImage(f); }} />
            </label>
          </div>
        </div>

        {/* Soru metni */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Soru *</label>
          <textarea required rows={2} className={`${inp} resize-none`} value={text}
            onChange={e => setText(e.target.value)} placeholder="Soru metnini yazın…" />
        </div>

        {/* Soru tipi */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Soru Tipi</label>
          <div className="flex flex-wrap gap-2">
            {(['single', 'multiple', 'truefalse', 'text', 'rating'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCorrectSet(new Set()); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  type === t ? 'border-[#26496b] bg-[#26496b] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {Q_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Seçenekler + doğru işaretleme */}
        {showOptions && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-500">
                Seçenekler
                {(type === 'single' || type === 'multiple' || type === 'truefalse') && (
                  <span className="font-normal text-gray-400 ml-1">— doğru cevabı tıklayarak işaretle</span>
                )}
              </label>
            </div>
            <div className="space-y-2">
              {(type === 'truefalse' ? tfOpts : options).map((opt, i) => {
                const isCorrect = correctSet.has(opt);
                return (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                    {(type === 'single' || type === 'multiple' || type === 'truefalse') && (
                      <button type="button" onClick={() => opt && toggleCorrect(opt)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}>
                        {isCorrect && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </button>
                    )}
                    {type !== 'truefalse' && type !== 'rating' ? (
                      <input className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                        value={opt} onChange={e => setOption(i, e.target.value)}
                        placeholder={`Seçenek ${i + 1}`} />
                    ) : (
                      <span className="flex-1 text-sm text-gray-700">{opt}</span>
                    )}
                    {type !== 'truefalse' && options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                );
              })}
              {type !== 'truefalse' && type !== 'rating' && (
                <button type="button" onClick={addOption}
                  className="flex items-center gap-1.5 text-xs text-[#26496b] font-medium hover:text-[#1e3a56] mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Seçenek Ekle
                </button>
              )}
            </div>
          </div>
        )}

        {/* Açıklama */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Açıklama
            <span className="font-normal text-gray-400 ml-1">(test sonucunda gösterilir)</span>
          </label>
          <textarea rows={2} className={`${inp} resize-none`} value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="Doğru cevabın açıklaması, kaynak veya ipucu…" />
        </div>

        {/* Zorluk + Puan */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Zorluk</label>
            <div className="flex gap-1.5">
              {DIFFICULTY_OPTIONS.map(d => (
                <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                  className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    difficulty === d.value ? d.color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Puan</label>
            <input type="number" min="1" className={inp} value={points} onChange={e => setPoints(e.target.value)} />
          </div>
        </div>

        {/* Konu etiketleri */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Konu Etiketleri</label>
          <div className="flex flex-wrap gap-1.5">
            {HARITA_TOPICS.map(t => {
              const active = topicTags.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleTopic(t)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    active ? 'bg-[#26496b] text-white border-[#26496b]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zorunlu */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="req" checked={required} onChange={e => setRequired(e.target.checked)} className="rounded" />
          <label htmlFor="req" className="text-xs font-medium text-gray-600 cursor-pointer">Yanıt zorunlu</label>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            İptal
          </button>
          <button type="submit" disabled={busy}
            className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: NAVY }}>
            {busy ? '…' : isEdit ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </form>
    </div>
  );
}

function BarChart({ breakdown }: { breakdown: { option: string; count: number; percent: number }[] }) {
  return (
    <div className="space-y-3 mt-3">
      {breakdown.map(({ option, count, percent }) => (
        <div key={option}>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span className="font-medium">{option}</span>
            <span className="text-gray-400">{count} yanıt · <span className="font-semibold text-gray-700">{percent}%</span></span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${percent}%`, backgroundColor: NAVY }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type View = 'list' | 'manage' | 'results';
type ResultsTab = 'summary' | 'raw' | 'segmented';

export function SurveyAdminPage({ fixedType }: { fixedType: 'anket' | 'test' }) {
  const [view, setView] = useState<View>('list');
  const [resultsTab, setResultsTab] = useState<ResultsTab>('summary');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeSurvey, setActiveSurvey] = useState<SurveyWithQuestions | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [showQForm, setShowQForm] = useState(false);
  const [editingQ, setEditingQ] = useState<SurveyQuestion | null>(null);
  const [deletingQ, setDeletingQ] = useState<string | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [responses, setResponses] = useState<ResponsesData | null>(null);
  const [segmented, setSegmented] = useState<SegmentedData | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  const loadSurveys = useCallback(() => {
    setLoading(true);
    api<Survey[]>('/surveys/admin/all')
      .then(data => setSurveys(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadSurveys(); }, [loadSurveys]);

  async function openManage(survey: Survey) {
    setManageLoading(true);
    setView('manage');
    setShowQForm(false);
    setEditingQ(null);
    try {
      const data = await api<SurveyWithQuestions>(`/surveys/admin/${survey.id}`);
      setActiveSurvey(data);
    } finally { setManageLoading(false); }
  }

  async function openResults(survey: Survey) {
    setResultsLoading(true);
    setView('results');
    setResultsTab('summary');
    setResults(null);
    setResponses(null);
    setSegmented(null);
    setActiveSurvey({ ...survey, questions: [] });
    try {
      const [res, raw, seg] = await Promise.all([
        api<ResultsData>(`/surveys/${survey.id}/results`),
        api<ResponsesData>(`/surveys/admin/${survey.id}/responses`),
        api<SegmentedData>(`/surveys/${survey.id}/results/segmented`),
      ]);
      setResults(res);
      setResponses(raw);
      setSegmented(seg);
    } finally { setResultsLoading(false); }
  }

  async function quickStatusChange(survey: Survey, status: string) {
    await api(`/surveys/admin/${survey.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadSurveys();
    if (activeSurvey?.id === survey.id) {
      setActiveSurvey(s => s ? { ...s, status } : s);
    }
  }

  async function reloadManage() {
    if (!activeSurvey) return;
    const data = await api<SurveyWithQuestions>(`/surveys/admin/${activeSurvey.id}`);
    setActiveSurvey(data);
  }

  async function deleteQuestion(q: SurveyQuestion) {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    setDeletingQ(q.id);
    try {
      await api(`/surveys/admin/questions/${q.id}`, { method: 'DELETE' });
      await reloadManage();
    } finally { setDeletingQ(null); }
  }

  async function handleExport() {
    if (!responses || !activeSurvey) return;
    setExportBusy(true);
    try { exportCsv(responses, activeSurvey.title); }
    finally { setExportBusy(false); }
  }

  const filtered = surveys
    .filter(s => !statusFilter || s.status === statusFilter)
    .filter(s => s.type === fixedType);
  const activeCount = surveys.filter(s => s.status === 'active' && s.type === fixedType).length;
  const totalResponses = surveys.filter(s => s.type === fixedType).reduce((sum, s) => sum + (s.responseCount ?? 0), 0);

  // ── Results view ───────────────────────────────────────────────────────────
  if (view === 'results') {
    return (
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anketler
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="font-bold text-gray-900 text-lg truncate max-w-xs">{activeSurvey?.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">Sonuçlar</span>
          </div>
          <button
            onClick={() => void handleExport()}
            disabled={exportBusy || !responses || responses.total === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportBusy ? 'İndiriliyor…' : 'Excel İndir'}
          </button>
        </div>

        {resultsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-28 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <p className="text-3xl font-bold" style={{ color: NAVY }}>{results?.survey.responseCount ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Toplam Katılımcı</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <p className="text-3xl font-bold text-gray-700">{results?.results.length ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Soru</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <p className="text-3xl font-bold text-gray-700">
                  {activeSurvey?.endsAt
                    ? new Date(activeSurvey.endsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                    : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Bitiş Tarihi</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
              {(['summary', 'segmented', 'raw'] as const).map(tab => (
                <button key={tab} onClick={() => setResultsTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    resultsTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab === 'summary' ? 'Soru Özeti' : tab === 'segmented' ? 'Segmentasyon' : `Yanıtlar (${responses?.total ?? 0})`}
                </button>
              ))}
            </div>

            {/* Summary tab */}
            {resultsTab === 'summary' && (
              <div className="space-y-4">
                {!results || results.results.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                    Henüz yanıt yok.
                  </div>
                ) : (
                  results.results.map((q, qi) => (
                    <div key={q.questionId} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <div className="flex items-start gap-3 mb-1">
                        <span className="text-sm font-bold shrink-0" style={{ color: NAVY }}>{qi + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{q.questionText}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${Q_TYPE_COLORS[q.type] ?? 'bg-gray-100 text-gray-600'}`}>
                              {Q_TYPE_LABELS[q.type] ?? q.type}
                            </span>
                            {q.total != null && (
                              <span className="text-xs text-gray-400">{q.total} yanıt</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {q.type === 'text' ? (
                        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                          {(q.answers ?? []).length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Yanıt yok.</p>
                          ) : (q.answers ?? []).map((a, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-600 italic border border-gray-100">
                              &ldquo;{a}&rdquo;
                            </div>
                          ))}
                        </div>
                      ) : (
                        <BarChart breakdown={q.breakdown ?? []} />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Segmented tab */}
            {resultsTab === 'segmented' && (
              <div className="space-y-6">
                {!segmented || segmented.total === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                    Segmentasyon için yeterli veri yok. (Katılımcıların profil bilgisi gerekli)
                  </div>
                ) : (
                  <>
                    {/* By Profession */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">Mesleğe Göre</h3>
                      <div className="space-y-2.5">
                        {segmented.byProfession.map(row => {
                          const pct = segmented.total > 0 ? Math.round((row.count / segmented.total) * 100) : 0;
                          return (
                            <div key={row.profession} className="flex items-center gap-3">
                              <span className="text-xs text-gray-600 w-36 shrink-0 truncate">{row.profession}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: NAVY }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right shrink-0">{row.count}</span>
                              {row.avgScore > 0 && <span className="text-xs text-emerald-600 font-semibold w-12 text-right shrink-0">~%{row.avgScore}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      {/* By Experience */}
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-sm mb-4">Deneyime Göre</h3>
                        <div className="space-y-2.5">
                          {segmented.byExperience.map(row => {
                            const pct = segmented.total > 0 ? Math.round((row.count / segmented.total) * 100) : 0;
                            return (
                              <div key={row.range} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 w-24 shrink-0">{row.range}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#7c3aed' }} />
                                </div>
                                <span className="text-xs text-gray-500 w-8 text-right">{row.count}</span>
                                {row.avgScore > 0 && <span className="text-xs text-violet-600 font-semibold w-12 text-right">~%{row.avgScore}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* By Work Status */}
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-sm mb-4">Çalışma Durumuna Göre</h3>
                        <div className="space-y-2.5">
                          {segmented.byWorkStatus.map(row => {
                            const pct = segmented.total > 0 ? Math.round((row.count / segmented.total) * 100) : 0;
                            return (
                              <div key={row.status} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{row.status}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#0284c7' }} />
                                </div>
                                <span className="text-xs text-gray-500 w-8 text-right">{row.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Top Cities */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">Şehre Göre (ilk 10)</h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        {segmented.byCity.slice(0, 10).map(row => {
                          const pct = segmented.total > 0 ? Math.round((row.count / segmented.total) * 100) : 0;
                          return (
                            <div key={row.city} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-20 shrink-0 truncate">{row.city}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#059669' }} />
                              </div>
                              <span className="text-xs text-gray-500 w-6 text-right">{row.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Raw responses tab */}
            {resultsTab === 'raw' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {!responses || responses.responses.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">Henüz yanıt yok.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">E-posta</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tarih</th>
                          {responses.questions.sort((a, b) => a.sortOrder - b.sortOrder).map(q => (
                            <th key={q.id}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider max-w-[180px]">
                              <span className="truncate block">{q.questionText}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {responses.responses.map((r, i) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{r.respondentEmail ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                              {new Date(r.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            {responses.questions.sort((a, b) => a.sortOrder - b.sortOrder).map(q => {
                              const ans = r.answers[q.id];
                              const text = Array.isArray(ans) ? ans.join(', ') : (ans ?? '—');
                              return (
                                <td key={q.id} className="px-4 py-3 text-gray-700 text-xs max-w-[180px]">
                                  <span className="line-clamp-2">{text}</span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Manage view ────────────────────────────────────────────────────────────
  if (view === 'manage') {
    const questions = [...(activeSurvey?.questions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
      <div className="max-w-5xl">
        {showSurveyModal && activeSurvey && (
          <SurveyModal
            survey={activeSurvey}
            defaultType={fixedType}
            onClose={() => setShowSurveyModal(false)}
            onSaved={() => { loadSurveys(); void reloadManage(); }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('list'); setActiveSurvey(null); setShowQForm(false); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anketler
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="font-bold text-gray-900 text-lg truncate max-w-xs">
              {manageLoading ? '…' : activeSurvey?.title}
            </h1>
            {activeSurvey && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[activeSurvey.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABELS[activeSurvey.status] ?? activeSurvey.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeSurvey && (
              <>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <button key={v}
                      onClick={() => void quickStatusChange(activeSurvey, v)}
                      className={`px-3 py-1.5 transition-colors ${
                        activeSurvey.status === v
                          ? 'text-white'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      style={activeSurvey.status === v ? { backgroundColor: NAVY } : {}}>
                      {l}
                    </button>
                  ))}
                </div>
                <button onClick={() => void openResults(activeSurvey)}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                  Sonuçlar →
                </button>
                <button onClick={() => setShowSurveyModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                  Düzenle
                </button>
              </>
            )}
          </div>
        </div>

        {manageLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-20 animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Question list */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-gray-700">Sorular ({questions.length})</h2>
                {activeSurvey && (
                  <button onClick={() => { setEditingQ(null); setShowQForm(true); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: NAVY }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Soru Ekle
                  </button>
                )}
              </div>

              {questions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-400">Henüz soru eklenmedi.</p>
                  <p className="text-xs text-gray-300 mt-1">Sağdaki formu kullanarak soru ekleyin.</p>
                </div>
              ) : (
                questions.map((q, qi) => (
                  <div key={q.id}
                    className={`bg-white rounded-2xl border shadow-sm p-4 transition-colors ${
                      editingQ?.id === q.id ? 'border-[#26496b]' : 'border-gray-200'
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                        style={{ backgroundColor: NAVY }}>
                        {qi + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        {q.scenarioText && (
                          <p className="text-xs text-gray-400 italic mb-1 line-clamp-1">"{q.scenarioText}"</p>
                        )}
                        <p className="text-sm font-medium text-gray-900 mb-2 leading-snug">{q.questionText}</p>
                        {q.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-gray-100 w-24 h-16">
                            <img src={q.imageUrl} alt="görsel" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${Q_TYPE_COLORS[q.type]}`}>
                            {Q_TYPE_LABELS[q.type]}
                          </span>
                          {q.difficulty && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                              DIFFICULTY_OPTIONS.find(d => d.value === q.difficulty)?.color ?? 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {DIFFICULTY_OPTIONS.find(d => d.value === q.difficulty)?.label ?? q.difficulty}
                            </span>
                          )}
                          {q.topicTags?.map(tag => (
                            <span key={tag} className="text-[10px] bg-[#26496b]/10 text-[#26496b] px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                          {q.correctOptions && q.correctOptions.length > 0 && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ {q.correctOptions.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditingQ(q); setShowQForm(true); }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => void deleteQuestion(q)}
                          disabled={deletingQ === q.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Question form panel */}
            <div className="lg:col-span-2">
              {showQForm && activeSurvey ? (
                <QuestionForm
                  surveyId={activeSurvey.id}
                  question={editingQ}
                  nextOrder={questions.length}
                  onClose={() => { setShowQForm(false); setEditingQ(null); }}
                  onSaved={() => {
                    setShowQForm(false);
                    setEditingQ(null);
                    void reloadManage();
                  }}
                />
              ) : (
                <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center sticky top-4">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-xs text-gray-400 mb-3">Yeni soru eklemek veya düzenlemek için</p>
                  <button onClick={() => { setEditingQ(null); setShowQForm(true); }}
                    className="text-xs font-semibold text-white px-4 py-2 rounded-lg"
                    style={{ backgroundColor: NAVY }}>
                    Soru Ekle
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div>
      {showSurveyModal && (
        <SurveyModal
          survey={editingSurvey}
          defaultType={fixedType}
          onClose={() => { setShowSurveyModal(false); setEditingSurvey(null); }}
          onSaved={loadSurveys}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {fixedType === 'test' ? 'Testler' : 'Anketler'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {fixedType === 'test' ? 'Sen Ne Dersin? — bilgi testleri ve sınavlar' : 'Sen Ne Dersin? — topluluk anketleri'}
          </p>
        </div>
        <button
          onClick={() => { setEditingSurvey(null); setShowSurveyModal(true); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors hover:opacity-90"
          style={{ backgroundColor: NAVY }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {fixedType === 'test' ? 'Yeni Test' : 'Yeni Anket'}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
          <p className="text-2xl font-bold text-gray-900">{surveys.filter(s => s.type === fixedType).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">{fixedType === 'test' ? 'Toplam Test' : 'Toplam Anket'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">{fixedType === 'test' ? 'Aktif Test' : 'Aktif Anket'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
          <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
          <p className="text-xs text-gray-500 mt-0.5">Toplam Katılımcı</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { value: '', label: 'Tüm Durumlar' },
            { value: 'active', label: 'Aktif' },
            { value: 'draft', label: 'Taslak' },
            { value: 'ended', label: 'Kapalı' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === value ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Survey list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-400">
            {statusFilter ? `${STATUS_LABELS[statusFilter]} anket bulunamadı.` : 'Henüz anket oluşturulmadı.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(survey => (
            <div key={survey.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:border-gray-300 transition-colors">
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${NAVY}15` }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: NAVY }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{survey.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_LABELS[survey.type]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[survey.type]?.label ?? survey.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[survey.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[survey.status] ?? survey.status}
                  </span>
                </div>
                {survey.description && (
                  <p className="text-xs text-gray-400 truncate mb-1">{survey.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="font-semibold text-gray-700">{survey.responseCount} katılımcı</span>
                  {survey.endsAt && (
                    <span>Bitiş: {new Date(survey.endsAt).toLocaleDateString('tr-TR')}</span>
                  )}
                  <span>{new Date(survey.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {survey.status === 'draft' && (
                  <button onClick={() => void quickStatusChange(survey, 'active')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                    Yayınla
                  </button>
                )}
                <button onClick={() => void openResults(survey)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  Sonuçlar
                </button>
                <button onClick={() => void openManage(survey)}
                  className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: NAVY }}>
                  Yönet →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnketlerPage() {
  return <SurveyAdminPage fixedType="anket" />;
}
