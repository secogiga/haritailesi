'use client';

import { useState, useEffect } from 'react';
import { adminApi, type CmsTalent } from '@/lib/api';

const CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: 'enstruman_calmak', label: 'Enstrüman çalmak',  emoji: '🎸' },
  { value: 'sarki_soylemek',   label: 'Şarkı söylemek',    emoji: '🎤' },
  { value: 'resim_yapmak',     label: 'Resim yapmak',      emoji: '🎨' },
  { value: 'dijital_cizim',    label: 'Dijital çizim',     emoji: '💻' },
  { value: 'fotografcilik',    label: 'Fotoğrafçılık',     emoji: '📷' },
  { value: 'oyunculuk',        label: 'Oyunculuk',          emoji: '🎭' },
  { value: 'dans_etmek',       label: 'Dans etmek',         emoji: '💃' },
  { value: 'yazarlik',         label: 'Yazarlık',            emoji: '✍️' },
  { value: 'moda_tasarimi',    label: 'Moda tasarımı',      emoji: '👗' },
  { value: 'ahsap_iscilik',    label: 'Ahşap işçiliği',     emoji: '🪵' },
  { value: 'seramik_yapmak',   label: 'Seramik yapmak',     emoji: '🏺' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' };
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

type Tab = 'pending' | 'approved' | 'rejected';

type FormData = {
  displayName: string;
  category: string;
  title: string;
  description: string;
  mediaUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  isPublished: boolean;
  adminNotes: string;
};

const EMPTY_FORM: FormData = {
  displayName: '', category: '', title: '', description: '',
  mediaUrl: '', status: 'approved', isPublished: true, adminNotes: '',
};

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400';

// ─── Form Modal ───────────────────────────────────────────────────────────────

function TalentFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial: FormData | null;
  onSave: (data: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial ?? EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isEdit = initial !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Yeteneği Düzenle' : 'Yeni Yetenek Ekle'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
              <input required type="text" className={inp} value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Başlık *</label>
              <input required type="text" className={inp} placeholder='"Klasik Gitar"…' value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Kategori *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button key={cat.value} type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                    form.category === cat.value
                      ? 'border-[#26496b] bg-[#26496b]/5 text-[#26496b]'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <span>{cat.emoji}</span><span>{cat.label}</span>
                </button>
              ))}
            </div>
            <input type="text" required readOnly className="sr-only" tabIndex={-1} value={form.category} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Açıklama</label>
            <textarea rows={3} className={`${inp} resize-none`} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Medya Linki
              <span className="text-gray-400 font-normal ml-1">(YouTube, Instagram, Behance…)</span>
            </label>
            <input type="url" className={inp} placeholder="https://youtube.com/watch?v=…" value={form.mediaUrl}
              onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))} />
            <p className="text-[11px] text-gray-400 mt-1">
              Video için önce YouTube/Instagram&apos;a yükle, sonra linki buraya yapıştır.
              Fotoğraf için Google Drive, Behance veya Instagram linki de olur.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Durum</label>
              <select className={inp} value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FormData['status'] }))}>
                <option value="approved">Onaylandı</option>
                <option value="pending">Bekliyor</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]/30" />
                <span className="text-sm text-gray-700">Yayında</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Admin Notu</label>
            <input type="text" className={inp} placeholder="İç not…" value={form.adminNotes}
              onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
              İptal
            </button>
            <button type="submit" disabled={busy || !form.displayName || !form.category || !form.title}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors disabled:opacity-50">
              {busy ? 'Kaydediliyor…' : isEdit ? 'Kaydet' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function YeteneklerPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [talents, setTalents] = useState<CmsTalent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; talent?: CmsTalent } | null>(null);

  async function load() {
    setLoading(true);
    try {
      setTalents(await adminApi.listTalents());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = talents.filter((t) => t.status === tab);
  const pendingCount = talents.filter((t) => t.status === 'pending').length;
  const approvedCount = talents.filter((t) => t.status === 'approved').length;
  const rejectedCount = talents.filter((t) => t.status === 'rejected').length;

  async function approve(id: string) {
    setBusy(id);
    try {
      const notes = notesInput[id];
      await adminApi.updateTalent(id, { status: 'approved', isPublished: true, ...(notes ? { adminNotes: notes } : {}) });
      setTalents((prev) => prev.map((t) => t.id === id ? { ...t, status: 'approved', isPublished: true } : t));
      setExpanded(null);
    } finally { setBusy(null); }
  }

  async function reject(id: string) {
    setBusy(id);
    try {
      const notes = notesInput[id];
      await adminApi.updateTalent(id, { status: 'rejected', isPublished: false, ...(notes ? { adminNotes: notes } : {}) });
      setTalents((prev) => prev.map((t) => t.id === id ? { ...t, status: 'rejected', isPublished: false } : t));
      setExpanded(null);
    } finally { setBusy(null); }
  }

  async function togglePublished(talent: CmsTalent) {
    setBusy(talent.id);
    try {
      await adminApi.updateTalent(talent.id, { isPublished: !talent.isPublished });
      setTalents((prev) => prev.map((t) => t.id === talent.id ? { ...t, isPublished: !talent.isPublished } : t));
    } finally { setBusy(null); }
  }

  async function deleteTalent(id: string) {
    if (!confirm('Bu yeteneği silmek istediğinize emin misiniz?')) return;
    setBusy(id);
    try {
      await adminApi.deleteTalent(id);
      setTalents((prev) => prev.filter((t) => t.id !== id));
    } finally { setBusy(null); }
  }

  async function handleSave(data: FormData) {
    if (modal?.mode === 'edit' && modal.talent) {
      const updated = await adminApi.updateTalent(modal.talent.id, data);
      setTalents((prev) => prev.map((t) => t.id === modal.talent!.id ? updated : t));
    } else {
      const created = await adminApi.createTalent(data);
      setTalents((prev) => [created, ...prev]);
      setTab(created.status as Tab);
    }
  }

  function openEdit(talent: CmsTalent) {
    setModal({ mode: 'edit', talent });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Yetenekler</h1>
          <p className="text-sm text-gray-500 mt-1">Üyelerin paylaştığı yetenekleri yönetin ve yayına alın.</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Ekle
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {([
          { key: 'pending',  label: 'Bekleyen',      count: pendingCount },
          { key: 'approved', label: 'Onaylananlar',   count: approvedCount },
          { key: 'rejected', label: 'Reddedilenler',  count: rejectedCount },
        ] as { key: Tab; label: string; count: number }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                t.key === 'pending' ? 'bg-amber-100 text-amber-700' :
                t.key === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                'bg-red-100 text-red-700'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#26496b] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {tab === 'pending' ? 'Bekleyen yetenek yok.' : tab === 'approved' ? 'Onaylanmış yetenek yok.' : 'Reddedilmiş yetenek yok.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((talent) => {
            const cat = CAT_MAP[talent.category];
            const isExpanded = expanded === talent.id;
            return (
              <div key={talent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : talent.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(isExpanded ? null : talent.id); }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#26496b]/8 flex items-center justify-center text-xl shrink-0">
                    {cat?.emoji ?? '✨'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{talent.displayName}</span>
                      <span className="text-gray-400 text-sm">·</span>
                      <span className="text-sm text-gray-600">{talent.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400 bg-gray-100 rounded-lg px-2 py-0.5">{cat?.label ?? talent.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${STATUS_COLORS[talent.status]}`}>{STATUS_LABELS[talent.status]}</span>
                      {talent.status === 'approved' && (
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${talent.isPublished ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {talent.isPublished ? 'Yayında' : 'Gizli'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">{new Date(talent.createdAt).toLocaleDateString('tr-TR')}</span>
                    {/* Düzenle butonu */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEdit(talent); }}
                      className="text-xs font-medium text-[#26496b] hover:underline px-2 py-1 rounded-lg hover:bg-[#26496b]/5 transition-colors"
                    >
                      Düzenle
                    </button>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    {talent.description && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Açıklama</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{talent.description}</p>
                      </div>
                    )}
                    {talent.mediaUrl && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Medya Linki</div>
                        <a href={talent.mediaUrl} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-[#26496b] hover:underline break-all">{talent.mediaUrl}</a>
                      </div>
                    )}
                    {talent.adminNotes && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Admin Notu</div>
                        <p className="text-sm text-gray-500 italic">{talent.adminNotes}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Not ekle</label>
                      <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
                        placeholder="İç not…"
                        value={notesInput[talent.id] ?? ''}
                        onChange={(e) => setNotesInput((prev) => ({ ...prev, [talent.id]: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {talent.status === 'pending' && (
                        <>
                          <button onClick={() => void approve(talent.id)} disabled={busy === talent.id}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60">
                            Onayla
                          </button>
                          <button onClick={() => void reject(talent.id)} disabled={busy === talent.id}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60">
                            Reddet
                          </button>
                        </>
                      )}
                      {talent.status === 'approved' && (
                        <button onClick={() => void togglePublished(talent)} disabled={busy === talent.id}
                          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 ${
                            talent.isPublished ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}>
                          {talent.isPublished ? 'Gizle' : 'Yayına Al'}
                        </button>
                      )}
                      {talent.status === 'rejected' && (
                        <button onClick={() => void approve(talent.id)} disabled={busy === talent.id}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60">
                          Tekrar Onayla
                        </button>
                      )}
                      <button onClick={() => void deleteTalent(talent.id)} disabled={busy === talent.id}
                        className="ml-auto px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm disabled:opacity-60">
                        Sil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <TalentFormModal
          initial={modal.mode === 'edit' && modal.talent ? {
            displayName: modal.talent.displayName,
            category: modal.talent.category,
            title: modal.talent.title,
            description: modal.talent.description ?? '',
            mediaUrl: modal.talent.mediaUrl ?? '',
            status: modal.talent.status,
            isPublished: modal.talent.isPublished,
            adminNotes: modal.talent.adminNotes ?? '',
          } : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
