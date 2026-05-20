'use client';

import { useEffect, useRef, useState } from 'react';
import { adminApi, type QaQuestion, type QaAnswer } from '@/lib/api';
import { STATUS_CLS } from '@/lib/ui';

const CATEGORY_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık',
  cbs: 'CBS',
  fotogrametri_uzaktan_algilama: 'Fotogrametri & UA',
  insaat: 'İnşaat',
  gayrimenkul_degerleme: 'Gayrimenkul',
  yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer: 'Kariyer',
  egitim: 'Eğitim',
  mentorluk: 'Mentorluk',
  gonullulik: 'Gönüllülük',
  proje_gelistirme: 'Proje Geliştirme',
  haritailesi_duyurulari: 'Haritailesi',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  hidden: 'Gizli',
};

const SOURCE_LABELS: Record<string, string> = {
  sahne: 'Sahne',
  mutfak: 'Mutfak',
  admin: 'Admin',
};

const SOURCE_COLORS: Record<string, string> = {
  sahne: 'bg-blue-50 text-blue-700',
  mutfak: 'bg-teal-50 text-teal-700',
  admin: 'bg-purple-50 text-purple-700',
};

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 ${
        checked ? 'bg-[#26496b]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ─── PublishChannels ──────────────────────────────────────────────────────────

function PublishChannels({
  question,
  onChanged,
  saving,
  setSaving,
}: {
  question: QaQuestion;
  onChanged: (q: Partial<QaQuestion>) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}) {
  async function toggle(field: 'isMutfakPublished' | 'isSahnePublished', val: boolean) {
    setSaving(true);
    try {
      const result = await adminApi.setQaPublish(question.id, { [field]: val });
      onChanged(result as Partial<QaQuestion>);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Yayın Kanalları</p>
      </div>
      {[
        { key: 'isMutfakPublished' as const, label: 'Mutfak', desc: 'Mutfak feed\'ine düşer, üyeler cevap yazabilir' },
        { key: 'isSahnePublished' as const, label: 'Sahne', desc: 'Sahne Soru & Cevap sayfasında görünür' },
      ].map((ch, i) => (
        <div key={ch.key} className={`flex items-center justify-between px-4 py-3.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
          <div>
            <p className="text-sm font-medium text-gray-800">{ch.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ch.desc}</p>
          </div>
          <Toggle
            checked={question[ch.key]}
            onChange={(v) => toggle(ch.key, v)}
            disabled={saving}
          />
        </div>
      ))}
    </div>
  );
}

// ─── AnswerRow ────────────────────────────────────────────────────────────────

function AnswerRow({
  answer,
  onTogglePublish,
  onEdit,
  onDelete,
  saving,
}: {
  answer: QaAnswer;
  onTogglePublish: (id: string, val: boolean) => void;
  onEdit: (answer: QaAnswer) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${answer.isPublished ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${SOURCE_COLORS[answer.source] ?? 'bg-gray-100 text-gray-600'}`}>
            {SOURCE_LABELS[answer.source] ?? answer.source}
          </span>
          {answer.submitterName && (
            <span className="text-xs text-gray-500">{answer.submitterName}</span>
          )}
          {answer.submitterEmail && answer.source !== 'admin' && (
            <span className="text-xs text-gray-400">{answer.submitterEmail}</span>
          )}
          <span className="text-xs text-gray-400">{new Date(answer.createdAt).toLocaleDateString('tr-TR')}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Toggle
            checked={answer.isPublished}
            onChange={(v) => onTogglePublish(answer.id, v)}
            disabled={saving}
          />
          <button
            onClick={() => onEdit(answer)}
            className="p-1.5 text-gray-400 hover:text-[#26496b] rounded-lg hover:bg-gray-100"
            title="Düzenle"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(answer.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
            title="Sil"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{answer.body}</p>
      {answer.isPublished && (
        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Yayında
        </p>
      )}
    </div>
  );
}

// ─── QuestionModal ────────────────────────────────────────────────────────────

function QuestionModal({
  question: initialQuestion,
  onClose,
  onSaved,
}: {
  question: QaQuestion;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [question, setQuestion] = useState<QaQuestion>(initialQuestion);
  const [questionText, setQuestionText] = useState(initialQuestion.questionText);
  const [displayName, setDisplayName] = useState(initialQuestion.displayName ?? '');
  const [category, setCategory] = useState(initialQuestion.category);
  const [isFeatured, setIsFeatured] = useState(initialQuestion.isFeatured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // New answer form
  const [newAnswerBody, setNewAnswerBody] = useState('');
  const [newAnswerPublish, setNewAnswerPublish] = useState(false);
  const [addingAnswer, setAddingAnswer] = useState(false);

  // Edit answer
  const [editingAnswer, setEditingAnswer] = useState<QaAnswer | null>(null);
  const [editBody, setEditBody] = useState('');

  async function saveQuestion() {
    setSaving(true);
    setError('');
    try {
      await adminApi.updateQaQuestion(question.id, {
        questionText,
        ...(displayName ? { displayName } : {}),
        category,
        isFeatured,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion() {
    setSaving(true);
    try {
      await adminApi.deleteQaQuestion(question.id);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silme başarısız.');
    } finally {
      setSaving(false);
    }
  }

  async function addAnswer() {
    if (!newAnswerBody.trim()) return;
    setAddingAnswer(true);
    try {
      const created = await adminApi.addQaAnswer(question.id, { body: newAnswerBody, isPublished: newAnswerPublish });
      setQuestion(q => ({ ...q, answers: [created, ...q.answers] }));
      setNewAnswerBody('');
      setNewAnswerPublish(false);
      onSaved();
    } finally {
      setAddingAnswer(false);
    }
  }

  async function toggleAnswerPublish(answerId: string, val: boolean) {
    setSaving(true);
    try {
      await adminApi.publishQaAnswer(answerId, val);
      setQuestion(q => ({
        ...q,
        answers: q.answers.map(a => a.id === answerId ? { ...a, isPublished: val } : a),
      }));
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function saveEditAnswer() {
    if (!editingAnswer || !editBody.trim()) return;
    setSaving(true);
    try {
      await adminApi.updateQaAnswer(editingAnswer.id, { body: editBody });
      setQuestion(q => ({
        ...q,
        answers: q.answers.map(a => a.id === editingAnswer.id ? { ...a, body: editBody } : a),
      }));
      setEditingAnswer(null);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function deleteAnswer(answerId: string) {
    setSaving(true);
    try {
      await adminApi.deleteQaAnswer(answerId);
      setQuestion(q => ({ ...q, answers: q.answers.filter(a => a.id !== answerId) }));
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const pendingAnswers = question.answers.filter(a => !a.isPublished);
  const publishedAnswers = question.answers.filter(a => a.isPublished);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-[#26496b] text-lg">Soru Yönet</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${STATUS_CLS[question.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[question.status] ?? question.status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${SOURCE_COLORS[question.source] ?? 'bg-gray-100'}`}>
                {SOURCE_LABELS[question.source]}
              </span>
              <span className="text-xs text-gray-400">{new Date(question.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Soru içeriği */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Soru İçeriği</p>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Gönderen İsim</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={80}
                  placeholder="Anonim bırakmak için boş"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">E-posta (admin görür)</label>
                <input value={question.email} disabled className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]"
                  />
                  <span className="text-sm text-gray-700">⭐ Öne çıkar</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveQuestion}
                disabled={saving || !questionText.trim()}
                className="px-4 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor…' : 'Soruyu Kaydet'}
              </button>
            </div>
          </div>

          {/* Yayın Kanalları */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Yayın Kanalları</p>
            <PublishChannels
              question={question}
              onChanged={(updates) => setQuestion(q => ({ ...q, ...updates }))}
              saving={saving}
              setSaving={setSaving}
            />
            <p className="text-xs text-gray-400 pl-1">
              Mutfak açıldığında feed'e düşer ve üyeler cevap yazabilir. Sahne açıldığında SSS bölümünde görünür.
            </p>
          </div>

          {/* Gelen cevaplar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Cevaplar
                {pendingAnswers.length > 0 && (
                  <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingAnswers.length} bekliyor</span>
                )}
              </p>
            </div>

            {/* Bekleyen cevaplar */}
            {pendingAnswers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-amber-600 font-medium">Onay bekleyen</p>
                {pendingAnswers.map(a => (
                  <AnswerRow
                    key={a.id}
                    answer={a}
                    onTogglePublish={toggleAnswerPublish}
                    onEdit={(ans) => { setEditingAnswer(ans); setEditBody(ans.body); }}
                    onDelete={deleteAnswer}
                    saving={saving}
                  />
                ))}
              </div>
            )}

            {/* Yayındaki cevaplar */}
            {publishedAnswers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-green-600 font-medium">Yayında</p>
                {publishedAnswers.map(a => (
                  <AnswerRow
                    key={a.id}
                    answer={a}
                    onTogglePublish={toggleAnswerPublish}
                    onEdit={(ans) => { setEditingAnswer(ans); setEditBody(ans.body); }}
                    onDelete={deleteAnswer}
                    saving={saving}
                  />
                ))}
              </div>
            )}

            {question.answers.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Henüz cevap yok</p>
            )}

            {/* Edit answer inline */}
            {editingAnswer && (
              <div className="border border-[#26496b]/20 rounded-xl p-4 bg-[#26496b]/5 space-y-2">
                <p className="text-xs font-medium text-[#26496b]">Cevabı Düzenle</p>
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  rows={4}
                  maxLength={3000}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingAnswer(null)} className="px-3 py-1.5 text-sm text-gray-500 border rounded-lg hover:bg-gray-50">İptal</button>
                  <button onClick={saveEditAnswer} disabled={saving} className="px-3 py-1.5 text-sm font-medium bg-[#26496b] text-white rounded-lg disabled:opacity-50">Kaydet</button>
                </div>
              </div>
            )}

            {/* Admin tarafından yeni cevap ekle */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500">Admin Cevabı Ekle</p>
              <textarea
                value={newAnswerBody}
                onChange={e => setNewAnswerBody(e.target.value)}
                rows={4}
                maxLength={3000}
                placeholder="Resmi cevabı yazın…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAnswerPublish}
                    onChange={e => setNewAnswerPublish(e.target.checked)}
                    className="rounded border-gray-300 text-[#66aca9] focus:ring-[#66aca9]"
                  />
                  <span className="text-sm text-gray-700">Hemen yayınla</span>
                </label>
                <button
                  onClick={addAnswer}
                  disabled={addingAnswer || !newAnswerBody.trim()}
                  className="px-4 py-1.5 text-sm font-medium bg-[#66aca9] text-white rounded-xl hover:bg-[#4d8f8c] disabled:opacity-50"
                >
                  {addingAnswer ? 'Ekleniyor…' : 'Cevap Ekle'}
                </button>
              </div>
            </div>
          </div>

          {/* Sil */}
          <div className="border-t border-gray-100 pt-4">
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Soruyu ve tüm cevaplarını sil?</span>
                <button onClick={deleteQuestion} disabled={saving} className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Evet, sil</button>
                <button onClick={() => setDeleteConfirm(false)} className="text-sm text-gray-500 px-3 py-1.5 rounded-lg border hover:bg-gray-50">Vazgeç</button>
              </div>
            ) : (
              <button onClick={() => setDeleteConfirm(true)} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Soruyu sil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CreateModal ──────────────────────────────────────────────────────────────

function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    email: 'admin@haritailesi.org',
    displayName: '',
    questionText: '',
    category: 'haritailesi_duyurulari',
    answerBody: '',
    mutfak: false,
    sahne: false,
    publishAnswer: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!form.questionText.trim() || !form.answerBody.trim()) {
      setError('Soru ve cevap alanları zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { id } = await adminApi.createQaQuestion({
        email: form.email,
        ...(form.displayName ? { displayName: form.displayName } : {}),
        questionText: form.questionText,
        category: form.category,
      });
      await adminApi.addQaAnswer(id, { body: form.answerBody, isPublished: form.publishAnswer });
      if (form.mutfak || form.sahne) {
        await adminApi.setQaPublish(id, { isMutfakPublished: form.mutfak, isSahnePublished: form.sahne });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#26496b] text-lg">Yeni Soru & Cevap</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Soru *</label>
            <textarea value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} rows={3} maxLength={500} placeholder="Soruyu yazın…" className={inp + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Soran kişi adı</label>
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Anonim bırakmak için boş" className={inp} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Kategori</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Resmi Cevap *</label>
            <textarea value={form.answerBody} onChange={e => setForm(f => ({ ...f, answerBody: e.target.value }))} rows={5} maxLength={3000} placeholder="Resmi cevabı yazın…" className={inp + ' resize-none'} />
          </div>

          {/* Yayın kanalları */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Yayın Kanalları</p>
            </div>
            {[
              { key: 'mutfak' as const, label: 'Mutfak', desc: 'Feed\'e düşer' },
              { key: 'sahne' as const, label: 'Sahne', desc: 'SSS bölümünde görünür' },
            ].map((ch, i) => (
              <div key={ch.key} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{ch.label}</p>
                  <p className="text-xs text-gray-400">{ch.desc}</p>
                </div>
                <Toggle checked={form[ch.key]} onChange={v => setForm(f => ({ ...f, [ch.key]: v }))} />
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.publishAnswer} onChange={e => setForm(f => ({ ...f, publishAnswer: e.target.checked }))}
              className="rounded border-gray-300 text-[#66aca9] focus:ring-[#66aca9]" />
            <span className="text-sm text-gray-700">Cevabı hemen yayınla</span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl border">İptal</button>
            <button onClick={save} disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] disabled:opacity-50">
              {saving ? 'Kaydediliyor…' : 'Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SorularPage() {
  const [tab, setTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [questions, setQuestions] = useState<QaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QaQuestion | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  function load() {
    setLoading(true);
    const params: { status?: string; category?: string } = {};
    if (tab !== 'all') params.status = tab;
    if (categoryFilter) params.category = categoryFilter;
    adminApi.listQaQuestions(params)
      .then(setQuestions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [tab, categoryFilter]); // eslint-disable-line

  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const pendingAnswersCount = questions.reduce((n, q) => n + q.answers.filter(a => !a.isPublished).length, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#26496b]">Soru & Cevap</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sahne ve Mutfak'tan gelen sorular — admin onaylı yayın</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni S&C
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Bekleyen Soru', value: pendingCount, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Bekleyen Cevap', value: pendingAnswersCount, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Toplam', value: questions.length, color: 'bg-gray-50 border-gray-200 text-gray-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-5 py-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([['pending', 'Bekleyenler'], ['approved', 'Onaylananlar'], ['all', 'Tümü']] as const).map(([t, l]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-[#26496b]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {l}
              {t === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-600 focus:outline-none"
        >
          <option value="">Tüm kategoriler</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Yükleniyor…</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">Bu sekmede soru yok</p>
          </div>
        ) : questions.map(q => {
          const pendingAns = q.answers.filter(a => !a.isPublished).length;
          const publishedAns = q.answers.filter(a => a.isPublished).length;
          return (
            <div
              key={q.id}
              onClick={() => setSelected(q)}
              className="bg-white rounded-xl border border-gray-100 hover:border-[#66aca9]/50 hover:shadow-sm p-5 cursor-pointer transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-[#26496b]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{q.questionText}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_CLS[q.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                      {CATEGORY_LABELS[q.category] ?? q.category}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${SOURCE_COLORS[q.source] ?? 'bg-gray-100'}`}>
                      {SOURCE_LABELS[q.source]}
                    </span>
                    {/* Kanal göstergeleri */}
                    {q.isMutfakPublished && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-teal-50 text-teal-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Mutfak
                      </span>
                    )}
                    {q.isSahnePublished && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Sahne
                      </span>
                    )}
                    {q.isFeatured && <span className="text-xs text-yellow-600">⭐</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{q.displayName ?? q.email}</span>
                    <span>•</span>
                    <span>{new Date(q.createdAt).toLocaleDateString('tr-TR')}</span>
                    {pendingAns > 0 && (
                      <span className="text-amber-600 font-medium">{pendingAns} bekleyen cevap</span>
                    )}
                    {publishedAns > 0 && (
                      <span className="text-green-600 font-medium">{publishedAns} yayında cevap</span>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <QuestionModal
          question={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); load(); }}
        />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}
