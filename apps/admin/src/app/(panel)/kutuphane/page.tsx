'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  adminApi,
  type LibraryTerm, type LibraryGuide, type LibraryDocument, type LibraryRegulation, type LibraryExamQuestion, type LibraryPath, type LibraryPathItem,
} from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: '', label: 'Tümü' },
  { value: 'draft', label: 'Taslak' },
  { value: 'published', label: 'Yayında' },
  { value: 'archived', label: 'Arşiv' },
];

const STATUS_CLS: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700',
  published: 'bg-green-50 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

const GUIDE_TYPES = [
  { value: 'guide', label: 'Rehber' },
  { value: 'article', label: 'Makale' },
  { value: 'roadmap', label: 'Yol Haritası' },
  { value: 'technical_doc', label: 'Teknik Doküman' },
  { value: 'career_guide', label: 'Kariyer Rehberi' },
];

const DOC_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'technical_spec', label: 'Teknik Şartname' },
  { value: 'academic', label: 'Akademik' },
  { value: 'report', label: 'Rapor' },
  { value: 'standard', label: 'Standart' },
  { value: 'guide_doc', label: 'Kılavuz' },
];

const REG_TYPES = [
  { value: 'kanun', label: 'Kanun' },
  { value: 'yonetmelik', label: 'Yönetmelik' },
  { value: 'genelge', label: 'Genelge' },
  { value: 'teknik_teblig', label: 'Teknik Tebliğ' },
  { value: 'kurum_yazisi', label: 'Kurum Yazısı' },
];

const FIELD_OPTS = [
  'klasik_haritacilik', 'cbs', 'fotogrametri', 'kadastro', 'uzaktan_algilama',
  'gayrimenkul_degerleme', 'yazilim', 'kariyer', 'egitim', 'kamu', 'ozel_sektor', 'insaat', 'genel',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';
const tagsFromStr = (s: string) => s.split(',').map(t => t.trim()).filter(Boolean);
const tagsToStr = (arr: string[]) => arr.join(', ');

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${STATUS_CLS[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {STATUS_OPTS.find(s => s.value === status)?.label ?? status}
    </span>
  );
}

function DeleteConfirm({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-red-600">{label} silinsin?</span>
      <button onClick={onConfirm} className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg">Evet</button>
      <button onClick={onCancel} className="text-sm text-gray-500 px-3 py-1 border rounded-lg">Vazgeç</button>
    </div>
  );
}

// ─── TermsTab ─────────────────────────────────────────────────────────────────

interface TermForm {
  term: string; fullForm: string; definition: string;
  fields: string; tags: string; status: string; isFeatured: boolean;
}

const EMPTY_TERM: TermForm = { term: '', fullForm: '', definition: '', fields: '', tags: '', status: 'draft', isFeatured: false };

// ─── SuggestionsTab ───────────────────────────────────────────────────────────

function parseSubmitter(tags: string[]): { name: string | null; email: string | null } {
  const nameTag = tags.find(t => t.startsWith('__submitted_name:'));
  const emailTag = tags.find(t => t.startsWith('__submitted_by:'));
  return {
    name: nameTag ? nameTag.replace('__submitted_name:', '') : null,
    email: emailTag ? emailTag.replace('__submitted_by:', '') : null,
  };
}

function SuggestionsTab() {
  const [items, setItems] = useState<LibraryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listAdminTerms({ status: 'draft' })
      .then((all) => {
        const suggestions = all.filter(t =>
          t.tags.some(tag => tag.startsWith('__submitted_by:') || tag.startsWith('__submitted_name:'))
        );
        setItems(suggestions);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    setActionId(id);
    try {
      await adminApi.updateLibraryTerm(id, { status: 'published' });
      setItems(prev => prev.filter(t => t.id !== id));
    } catch { alert('Onaylama başarısız.'); }
    finally { setActionId(null); }
  }

  async function reject(id: string) {
    if (!confirm('Bu öneriyi silmek istiyor musunuz?')) return;
    setActionId(id);
    try {
      await adminApi.deleteLibraryTerm(id);
      setItems(prev => prev.filter(t => t.id !== id));
    } catch { alert('Silme başarısız.'); }
    finally { setActionId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Topluluk üyelerinin gönderdiği terim önerileri. Onayladıktan sonra sözlükte yayınlanır.
        </p>
        <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 mb-1">Bekleyen öneri yok</p>
          <p className="text-sm text-gray-400">Topluluktan yeni terim önerisi geldiğinde burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const sub = parseSubmitter(item.tags);
            const busy = actionId === item.id;
            return (
              <div key={item.id} className="bg-white rounded-xl border border-amber-200 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-900">{item.term}</h3>
                      {item.fullForm && <span className="text-xs text-gray-400">({item.fullForm})</span>}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.definition}</p>
                    {(sub.name ?? sub.email) && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{sub.name ?? ''}</span>
                        {sub.name && sub.email && <span>·</span>}
                        {sub.email && <span>{sub.email}</span>}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-300 mt-1.5">
                      {new Date(item.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => void approve(item.id)}
                      disabled={busy}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {busy ? '…' : 'Onayla'}
                    </button>
                    <button
                      onClick={() => void reject(item.id)}
                      disabled={busy}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors border border-red-200"
                    >
                      {busy ? '…' : 'Reddet'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TermsTab ─────────────────────────────────────────────────────────────────

function TermsTab() {
  const [items, setItems] = useState<LibraryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LibraryTerm | null>(null);
  const [form, setForm] = useState<TermForm>(EMPTY_TERM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listAdminTerms(statusFilter ? { status: statusFilter } : {})
      .then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_TERM);
    setError('');
    setShowModal(true);
  }

  function openEdit(item: LibraryTerm) {
    setEditing(item);
    setForm({
      term: item.term, fullForm: item.fullForm ?? '',
      definition: item.definition, fields: tagsToStr(item.fields),
      tags: tagsToStr(item.tags), status: item.status, isFeatured: item.isFeatured,
    });
    setError('');
    setShowModal(true);
  }

  async function save() {
    if (!form.term.trim() || !form.definition.trim()) { setError('Terim ve tanım zorunlu.'); return; }
    setSaving(true); setError('');
    try {
      const base: Record<string, unknown> = {
        term: form.term.trim(), definition: form.definition.trim(),
        fields: tagsFromStr(form.fields), tags: tagsFromStr(form.tags),
        isFeatured: form.isFeatured,
      };
      if (form.fullForm.trim()) base['fullForm'] = form.fullForm.trim();
      if (editing) {
        await adminApi.updateLibraryTerm(editing.id, { ...base, status: form.status });
      } else {
        await adminApi.createLibraryTerm({
          term: base['term'] as string, definition: base['definition'] as string,
          ...(base['fullForm'] ? { fullForm: base['fullForm'] as string } : {}),
          fields: base['fields'] as string[], tags: base['tags'] as string[],
          isFeatured: form.isFeatured,
        });
      }
      setShowModal(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    await adminApi.deleteLibraryTerm(id);
    setDeleteId(null);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {STATUS_OPTS.map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s.value ? 'bg-white shadow text-[#26496b]' : 'text-gray-500 hover:text-gray-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Terim
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Bu filtrede terim yok</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-gray-900">{item.term}</span>
                  {item.fullForm && <span className="text-xs text-gray-400">— {item.fullForm}</span>}
                  <StatusBadge status={item.status} />
                  {item.isFeatured && <span className="text-xs text-amber-600">⭐</span>}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{item.definition}</p>
              </div>
              {deleteId === item.id ? (
                <DeleteConfirm label={`"${item.term}"`} onConfirm={() => del(item.id)} onCancel={() => setDeleteId(null)} />
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-[#26496b] rounded-lg hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#26496b] text-lg">{editing ? 'Terimi Düzenle' : 'Yeni Terim'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Terim *</label>
                  <input value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))} className={inp} placeholder="CBS" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Açık Adı</label>
                  <input value={form.fullForm} onChange={e => setForm(f => ({ ...f, fullForm: e.target.value }))} className={inp} placeholder="Coğrafi Bilgi Sistemi" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Tanım *</label>
                <textarea value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))} rows={4} maxLength={2000} className={inp + ' resize-none'} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Alanlar (virgülle ayır)</label>
                <input value={form.fields} onChange={e => setForm(f => ({ ...f, fields: e.target.value }))} className={inp} placeholder="cbs, yazilim" />
                <p className="text-xs text-gray-400 mt-1">{FIELD_OPTS.join(', ')}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Etiketler (virgülle ayır)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className={inp} placeholder="gnss, koordinat" />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Durum</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                    {STATUS_OPTS.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    className="rounded border-gray-300 text-[#26496b]" />
                  <span className="text-sm text-gray-700">⭐ Öne çıkar</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl border">İptal</button>
                <button onClick={save} disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GuidesTab ────────────────────────────────────────────────────────────────

interface GuideForm {
  slug: string; title: string; summary: string; body: string; type: string;
  fields: string; tags: string; authorName: string; readingTimeMinutes: string;
  status: string; isFeatured: boolean; featuredOnSinavMerkezi: boolean;
}

const EMPTY_GUIDE: GuideForm = {
  slug: '', title: '', summary: '', body: '', type: 'guide',
  fields: '', tags: '', authorName: '', readingTimeMinutes: '', status: 'draft', isFeatured: false, featuredOnSinavMerkezi: false,
};

function GuidesTab() {
  const [items, setItems] = useState<LibraryGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LibraryGuide | null>(null);
  const [form, setForm] = useState<GuideForm>(EMPTY_GUIDE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listAdminGuides(statusFilter ? { status: statusFilter } : {})
      .then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null); setForm(EMPTY_GUIDE); setError(''); setShowModal(true);
  }

  function openEdit(item: LibraryGuide) {
    setEditing(item);
    setForm({
      slug: item.slug, title: item.title, summary: item.summary, body: item.body ?? '',
      type: item.type, fields: tagsToStr(item.fields), tags: tagsToStr(item.tags),
      authorName: item.authorName ?? '', readingTimeMinutes: item.readingTimeMinutes?.toString() ?? '',
      status: item.status, isFeatured: item.isFeatured, featuredOnSinavMerkezi: item.featuredOnSinavMerkezi,
    });
    setError(''); setShowModal(true);
  }

  async function save() {
    if (!form.slug.trim() || !form.title.trim() || !form.summary.trim()) { setError('Slug, başlık ve özet zorunlu.'); return; }
    setSaving(true); setError('');
    try {
      const base: Record<string, unknown> = {
        title: form.title.trim(), summary: form.summary.trim(),
        type: form.type, fields: tagsFromStr(form.fields), tags: tagsFromStr(form.tags),
        isFeatured: form.isFeatured, featuredOnSinavMerkezi: form.featuredOnSinavMerkezi,
      };
      if (form.body.trim()) base['body'] = form.body.trim();
      if (form.authorName.trim()) base['authorName'] = form.authorName.trim();
      if (form.readingTimeMinutes) base['readingTimeMinutes'] = parseInt(form.readingTimeMinutes);
      if (editing) {
        await adminApi.updateLibraryGuide(editing.id, { ...base, status: form.status });
      } else {
        await adminApi.createLibraryGuide({
          slug: form.slug.trim(), title: base['title'] as string, summary: base['summary'] as string,
          ...(base['body'] ? { body: base['body'] as string } : {}),
          type: base['type'] as string, fields: base['fields'] as string[], tags: base['tags'] as string[],
          ...(base['authorName'] ? { authorName: base['authorName'] as string } : {}),
          ...(base['readingTimeMinutes'] ? { readingTimeMinutes: base['readingTimeMinutes'] as number } : {}),
        });
      }
      setShowModal(false); load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally { setSaving(false); }
  }

  async function del(id: string) {
    await adminApi.deleteLibraryGuide(id);
    setDeleteId(null); load();
  }

  const TYPE_LABEL: Record<string, string> = Object.fromEntries(GUIDE_TYPES.map(t => [t.value, t.label]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {STATUS_OPTS.map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s.value ? 'bg-white shadow text-[#26496b]' : 'text-gray-500 hover:text-gray-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Yeni Rehber
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Bu filtrede içerik yok</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900">{item.title}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-medium">{TYPE_LABEL[item.type] ?? item.type}</span>
                  <StatusBadge status={item.status} />
                  {item.isFeatured && <span className="text-xs text-amber-600">⭐</span>}
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{item.summary}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">/kutuphane/rehberler/{item.slug}</p>
              </div>
              {deleteId === item.id ? (
                <DeleteConfirm label={`"${item.title}"`} onConfirm={() => del(item.id)} onCancel={() => setDeleteId(null)} />
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-[#26496b] rounded-lg hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#26496b] text-lg">{editing ? 'Rehberi Düzenle' : 'Yeni Rehber'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Slug * {editing && <span className="text-gray-400">(değiştirilemez)</span>}</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} disabled={!!editing} className={inp + (editing ? ' bg-gray-50 text-gray-400' : '')} placeholder="cbs-giris-rehberi" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Tür</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                    {GUIDE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Başlık *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} maxLength={200} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Özet *</label>
                <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2} maxLength={500} className={inp + ' resize-none'} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">İçerik (Markdown)</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8} className={inp + ' resize-y font-mono text-xs'} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Yazar</label>
                  <input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Okuma Süresi (dk)</label>
                  <input type="number" value={form.readingTimeMinutes} onChange={e => setForm(f => ({ ...f, readingTimeMinutes: e.target.value }))} className={inp} min={1} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Durum</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                    {STATUS_OPTS.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Alanlar (virgülle)</label>
                  <input value={form.fields} onChange={e => setForm(f => ({ ...f, fields: e.target.value }))} className={inp} placeholder="cbs, yazilim" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Etiketler (virgülle)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded border-gray-300 text-[#26496b]" />
                  <span className="text-sm text-gray-700">⭐ Öne çıkar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featuredOnSinavMerkezi} onChange={e => setForm(f => ({ ...f, featuredOnSinavMerkezi: e.target.checked }))} className="rounded border-gray-300 text-emerald-600" />
                  <span className="text-sm text-gray-700">📚 Sınav Merkezi'nde göster</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl border">İptal</button>
                <button onClick={save} disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DocumentsTab ─────────────────────────────────────────────────────────────

interface DocForm {
  title: string; description: string; type: string; fields: string; tags: string;
  authorName: string; publishYear: string; fileUrl: string; externalUrl: string;
  status: string; isFeatured: boolean; featuredOnSinavMerkezi: boolean;
}

const EMPTY_DOC: DocForm = {
  title: '', description: '', type: 'pdf', fields: '', tags: '',
  authorName: '', publishYear: '', fileUrl: '', externalUrl: '', status: 'draft', isFeatured: false, featuredOnSinavMerkezi: false,
};

function DocumentsTab() {
  const [items, setItems] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LibraryDocument | null>(null);
  const [form, setForm] = useState<DocForm>(EMPTY_DOC);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listAdminDocuments(statusFilter ? { status: statusFilter } : {})
      .then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(EMPTY_DOC); setError(''); setShowModal(true); }

  function openEdit(item: LibraryDocument) {
    setEditing(item);
    setForm({
      title: item.title, description: item.description ?? '', type: item.type,
      fields: tagsToStr(item.fields), tags: tagsToStr(item.tags),
      authorName: item.authorName ?? '', publishYear: item.publishYear?.toString() ?? '',
      fileUrl: item.fileUrl ?? '', externalUrl: item.externalUrl ?? '',
      status: item.status, isFeatured: item.isFeatured, featuredOnSinavMerkezi: item.featuredOnSinavMerkezi,
    });
    setError(''); setShowModal(true);
  }

  async function save() {
    if (!form.title.trim()) { setError('Başlık zorunlu.'); return; }
    setSaving(true); setError('');
    try {
      const base: Record<string, unknown> = {
        title: form.title.trim(), type: form.type,
        fields: tagsFromStr(form.fields), tags: tagsFromStr(form.tags),
        isFeatured: form.isFeatured, featuredOnSinavMerkezi: form.featuredOnSinavMerkezi,
      };
      if (form.description.trim()) base['description'] = form.description.trim();
      if (form.authorName.trim()) base['authorName'] = form.authorName.trim();
      if (form.publishYear) base['publishYear'] = parseInt(form.publishYear);
      if (form.fileUrl.trim()) base['fileUrl'] = form.fileUrl.trim();
      if (form.externalUrl.trim()) base['externalUrl'] = form.externalUrl.trim();
      if (editing) {
        await adminApi.updateLibraryDocument(editing.id, { ...base, status: form.status });
      } else {
        await adminApi.createLibraryDocument({
          title: base['title'] as string, type: base['type'] as string,
          ...(base['description'] ? { description: base['description'] as string } : {}),
          ...(base['authorName'] ? { authorName: base['authorName'] as string } : {}),
          ...(base['publishYear'] ? { publishYear: base['publishYear'] as number } : {}),
          ...(base['fileUrl'] ? { fileUrl: base['fileUrl'] as string } : {}),
          ...(base['externalUrl'] ? { externalUrl: base['externalUrl'] as string } : {}),
          fields: base['fields'] as string[], tags: base['tags'] as string[],
        });
      }
      setShowModal(false); load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally { setSaving(false); }
  }

  async function del(id: string) { await adminApi.deleteLibraryDocument(id); setDeleteId(null); load(); }

  const TYPE_LABEL: Record<string, string> = Object.fromEntries(DOC_TYPES.map(t => [t.value, t.label]));
  const TYPE_CLS: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700', technical_spec: 'bg-blue-100 text-blue-700',
    academic: 'bg-violet-100 text-violet-700', report: 'bg-amber-100 text-amber-700',
    standard: 'bg-teal-100 text-teal-700', guide_doc: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {STATUS_OPTS.map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s.value ? 'bg-white shadow text-[#26496b]' : 'text-gray-500 hover:text-gray-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Yeni Doküman
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Bu filtrede doküman yok</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900">{item.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${TYPE_CLS[item.type] ?? 'bg-gray-100 text-gray-600'}`}>{TYPE_LABEL[item.type] ?? item.type}</span>
                  <StatusBadge status={item.status} />
                  {item.isFeatured && <span className="text-xs text-amber-600">⭐</span>}
                </div>
                {item.description && <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>}
                {item.authorName && <p className="text-[11px] text-gray-400">{item.authorName}{item.publishYear ? ` · ${item.publishYear}` : ''}</p>}
              </div>
              {deleteId === item.id ? (
                <DeleteConfirm label={`"${item.title}"`} onConfirm={() => del(item.id)} onCancel={() => setDeleteId(null)} />
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-[#26496b] rounded-lg hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#26496b] text-lg">{editing ? 'Dokümanı Düzenle' : 'Yeni Doküman'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Başlık *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} maxLength={200} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Açıklama</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} maxLength={500} className={inp + ' resize-none'} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Tür</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Yazar</label>
                  <input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Yayın Yılı</label>
                  <input type="number" value={form.publishYear} onChange={e => setForm(f => ({ ...f, publishYear: e.target.value }))} className={inp} min={1900} max={2100} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Dosya URL</label>
                <input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} className={inp} placeholder="https://…" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Dış Link</label>
                <input value={form.externalUrl} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))} className={inp} placeholder="https://…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Alanlar (virgülle)</label>
                  <input value={form.fields} onChange={e => setForm(f => ({ ...f, fields: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Durum</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                    {STATUS_OPTS.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded border-gray-300 text-[#26496b]" />
                  <span className="text-sm text-gray-700">⭐ Öne çıkar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featuredOnSinavMerkezi} onChange={e => setForm(f => ({ ...f, featuredOnSinavMerkezi: e.target.checked }))} className="rounded border-gray-300 text-emerald-600" />
                  <span className="text-sm text-gray-700">📚 Sınav Merkezi'nde göster</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl border">İptal</button>
                <button onClick={save} disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RegulationsTab ───────────────────────────────────────────────────────────

interface RegForm {
  slug: string; title: string; shortTitle: string; type: string; fields: string;
  issuingBody: string; referenceNumber: string; publishDate: string;
  summary: string; fullText: string; aiSummary: string; externalUrl: string;
  status: string; isFeatured: boolean; featuredOnSinavMerkezi: boolean; changeNote: string;
}

const EMPTY_REG: RegForm = {
  slug: '', title: '', shortTitle: '', type: 'yonetmelik', fields: '',
  issuingBody: '', referenceNumber: '', publishDate: '',
  summary: '', fullText: '', aiSummary: '', externalUrl: '',
  status: 'draft', isFeatured: false, featuredOnSinavMerkezi: false, changeNote: '',
};

function RegulationsTab() {
  const [items, setItems] = useState<LibraryRegulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LibraryRegulation | null>(null);
  const [form, setForm] = useState<RegForm>(EMPTY_REG);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listAdminRegulations(statusFilter ? { status: statusFilter } : {})
      .then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(EMPTY_REG); setError(''); setShowModal(true); }

  function openEdit(item: LibraryRegulation) {
    setEditing(item);
    setForm({
      slug: item.slug, title: item.title, shortTitle: item.shortTitle ?? '',
      type: item.type, fields: tagsToStr(item.fields),
      issuingBody: item.issuingBody ?? '', referenceNumber: item.referenceNumber ?? '',
      publishDate: item.publishDate ?? '', summary: item.summary ?? '',
      fullText: item.fullText ?? '', aiSummary: item.aiSummary ?? '',
      externalUrl: item.externalUrl ?? '', status: item.status, isFeatured: item.isFeatured,
      featuredOnSinavMerkezi: item.featuredOnSinavMerkezi, changeNote: '',
    });
    setError(''); setShowModal(true);
  }

  async function save() {
    if (!form.slug.trim() || !form.title.trim()) { setError('Slug ve başlık zorunlu.'); return; }
    setSaving(true); setError('');
    try {
      const base: Record<string, unknown> = {
        title: form.title.trim(), type: form.type,
        fields: tagsFromStr(form.fields), isFeatured: form.isFeatured,
        featuredOnSinavMerkezi: form.featuredOnSinavMerkezi,
      };
      if (form.shortTitle.trim()) base['shortTitle'] = form.shortTitle.trim();
      if (form.issuingBody.trim()) base['issuingBody'] = form.issuingBody.trim();
      if (form.referenceNumber.trim()) base['referenceNumber'] = form.referenceNumber.trim();
      if (form.publishDate.trim()) base['publishDate'] = form.publishDate.trim();
      if (form.summary.trim()) base['summary'] = form.summary.trim();
      if (form.fullText.trim()) base['fullText'] = form.fullText.trim();
      if (form.externalUrl.trim()) base['externalUrl'] = form.externalUrl.trim();
      if (editing) {
        const updateDto: Record<string, unknown> = { ...base, status: form.status };
        if (form.aiSummary.trim()) updateDto['aiSummary'] = form.aiSummary.trim();
        if (form.changeNote.trim()) updateDto['changeNote'] = form.changeNote.trim();
        await adminApi.updateLibraryRegulation(editing.id, updateDto);
      } else {
        const createDto: Parameters<typeof adminApi.createLibraryRegulation>[0] = {
          slug: form.slug.trim(), title: base['title'] as string, type: base['type'] as string,
          fields: base['fields'] as string[],
          ...(base['shortTitle'] ? { shortTitle: base['shortTitle'] as string } : {}),
          ...(base['issuingBody'] ? { issuingBody: base['issuingBody'] as string } : {}),
          ...(base['referenceNumber'] ? { referenceNumber: base['referenceNumber'] as string } : {}),
          ...(base['publishDate'] ? { publishDate: base['publishDate'] as string } : {}),
          ...(base['summary'] ? { summary: base['summary'] as string } : {}),
          ...(base['fullText'] ? { fullText: base['fullText'] as string } : {}),
          ...(base['externalUrl'] ? { externalUrl: base['externalUrl'] as string } : {}),
        };
        await adminApi.createLibraryRegulation(createDto);
      }
      setShowModal(false); load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally { setSaving(false); }
  }

  async function del(id: string) { await adminApi.deleteLibraryRegulation(id); setDeleteId(null); load(); }

  const TYPE_LABEL: Record<string, string> = Object.fromEntries(REG_TYPES.map(t => [t.value, t.label]));
  const TYPE_CLS: Record<string, string> = {
    kanun: 'bg-rose-100 text-rose-700', yonetmelik: 'bg-orange-100 text-orange-700',
    genelge: 'bg-amber-100 text-amber-700', teknik_teblig: 'bg-pink-100 text-pink-700',
    kurum_yazisi: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {STATUS_OPTS.map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s.value ? 'bg-white shadow text-[#26496b]' : 'text-gray-500 hover:text-gray-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Yeni Mevzuat
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Bu filtrede mevzuat yok</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900 line-clamp-1">{item.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${TYPE_CLS[item.type] ?? 'bg-gray-100 text-gray-600'}`}>{TYPE_LABEL[item.type] ?? item.type}</span>
                  <StatusBadge status={item.status} />
                  {item.isFeatured && <span className="text-xs text-amber-600">⭐</span>}
                  {item.aiSummary && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">AI Özeti</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  {item.issuingBody && <span>{item.issuingBody}</span>}
                  {item.referenceNumber && <span>Ref: {item.referenceNumber}</span>}
                  {item.publishDate && <span>{item.publishDate}</span>}
                </div>
              </div>
              {deleteId === item.id ? (
                <DeleteConfirm label={`"${item.shortTitle ?? item.title}"`} onConfirm={() => del(item.id)} onCancel={() => setDeleteId(null)} />
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-[#26496b] rounded-lg hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#26496b] text-lg">{editing ? 'Mevzuatı Düzenle' : 'Yeni Mevzuat'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Slug * {editing && <span className="text-gray-400">(değiştirilemez)</span>}</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} disabled={!!editing} className={inp + (editing ? ' bg-gray-50 text-gray-400' : '')} placeholder="tapu-kanunu-2644" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Tür</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                    {REG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Tam Başlık *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} maxLength={300} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Kısa Başlık</label>
                  <input value={form.shortTitle} onChange={e => setForm(f => ({ ...f, shortTitle: e.target.value }))} className={inp} maxLength={100} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Yayınlayan Kurum</label>
                  <input value={form.issuingBody} onChange={e => setForm(f => ({ ...f, issuingBody: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Referans No</label>
                  <input value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Yayın Tarihi</label>
                  <input value={form.publishDate} onChange={e => setForm(f => ({ ...f, publishDate: e.target.value }))} className={inp} placeholder="2024-01-15" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Durum</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                    {STATUS_OPTS.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Dış Link (Resmî metin)</label>
                <input value={form.externalUrl} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))} className={inp} placeholder="https://www.resmigazete.gov.tr/…" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Özet</label>
                <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={3} maxLength={1000} className={inp + ' resize-none'} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">AI Özeti</label>
                <textarea value={form.aiSummary} onChange={e => setForm(f => ({ ...f, aiSummary: e.target.value }))} rows={3} className={inp + ' resize-none'} placeholder="Yapay zeka tarafından üretilen özet…" />
              </div>
              {editing && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <label className="text-xs font-bold text-amber-700 block mb-1">
                    Güncelleme Notu <span className="font-normal text-amber-500">(isteğe bağlı — takipçilere e-posta bildirimi gönderir)</span>
                  </label>
                  <textarea
                    value={form.changeNote}
                    onChange={e => setForm(f => ({ ...f, changeNote: e.target.value }))}
                    rows={2}
                    placeholder="Örn: Madde 12 değiştirildi — yeni kadastro müdürlüğü yetkileri eklendi"
                    className={inp + ' resize-none bg-white border-amber-300 focus:ring-amber-400/30'}
                    maxLength={500}
                  />
                  <p className="text-[10px] text-amber-600 mt-1">Bu alana yazarsanız changelog'a kaydedilir ve bu mevzuatı takip eden üyelere bildirim gönderilir.</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Tam Metin</label>
                <textarea value={form.fullText} onChange={e => setForm(f => ({ ...f, fullText: e.target.value }))} rows={4} className={inp + ' resize-y text-xs'} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Alanlar (virgülle)</label>
                <input value={form.fields} onChange={e => setForm(f => ({ ...f, fields: e.target.value }))} className={inp} placeholder="kadastro, kamu" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded border-gray-300 text-[#26496b]" />
                  <span className="text-sm text-gray-700">⭐ Öne çıkar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featuredOnSinavMerkezi} onChange={e => setForm(f => ({ ...f, featuredOnSinavMerkezi: e.target.checked }))} className="rounded border-gray-300 text-emerald-600" />
                  <span className="text-sm text-gray-700">📚 Sınav Merkezi'nde göster</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl border">İptal</button>
                <button onClick={save} disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ExamQuestionsTab ─────────────────────────────────────────────────────────

const DIFF_CLS: Record<string, string> = {
  easy: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', hard: 'bg-red-50 text-red-700',
};
const DIFF_LABELS: Record<string, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

function ExamQuestionsTab() {
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; examType: string }[]>([]);
  const [questions, setQuestions] = useState<LibraryExamQuestion[]>([]);
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    categoryId: '', questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '',
    correctOption: 'a', explanation: '', difficulty: 'medium', source: '', relatedTermSlugs: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, qs] = await Promise.all([
        adminApi.listExamCategories(),
        adminApi.listExamQuestions(filterCat || undefined),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setQuestions(Array.isArray(qs) ? qs : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [filterCat]);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => setForm({
    categoryId: '', questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '',
    correctOption: 'a', explanation: '', difficulty: 'medium', source: '', relatedTermSlugs: '',
  });

  const save = async () => {
    if (!form.categoryId || !form.questionText.trim() || !form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
      setError('Kategori, soru metni ve A–D şıkları zorunludur.'); return;
    }
    setSaving(true); setError('');
    try {
      await adminApi.createExamQuestion({
        categoryId: form.categoryId,
        questionText: form.questionText.trim(),
        optionA: form.optionA.trim(), optionB: form.optionB.trim(),
        optionC: form.optionC.trim(), optionD: form.optionD.trim(),
        ...(form.optionE.trim() ? { optionE: form.optionE.trim() } : {}),
        correctOption: form.correctOption,
        ...(form.explanation.trim() ? { explanation: form.explanation.trim() } : {}),
        difficulty: form.difficulty,
        ...(form.source.trim() ? { source: form.source.trim() } : {}),
        relatedTermSlugs: form.relatedTermSlugs.split(',').map(t => t.trim()).filter(Boolean),
      });
      setShowModal(false); resetForm(); void load();
    } catch { setError('Kaydedilemedi.'); } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    setDeleting(null);
    try { await adminApi.deleteExamQuestion(id); void load(); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className={`${inp} w-64`}>
          <option value="">Tüm Kategoriler</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.examType.toUpperCase()})</option>)}
        </select>
        <span className="text-sm text-gray-400">{questions.length} soru</span>
        <div className="ml-auto">
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57]">
            + Soru Ekle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Bu kategoride soru yok.</div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div key={q.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] font-bold bg-[#26496b]/10 text-[#26496b] px-2 py-0.5 rounded-md">{q.categoryName}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${DIFF_CLS[q.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>{DIFF_LABELS[q.difficulty] ?? q.difficulty}</span>
                    {q.source && <span className="text-[11px] text-gray-400">{q.source}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-2 leading-relaxed">{q.questionText}</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    {(['a','b','c','d','e'] as const).map(k => {
                      const text = k === 'a' ? q.optionA : k === 'b' ? q.optionB : k === 'c' ? q.optionC : k === 'd' ? q.optionD : q.optionE;
                      if (!text) return null;
                      return (
                        <span key={k} className={`px-2 py-0.5 rounded ${k === q.correctOption ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''}`}>
                          {k.toUpperCase()}. {text}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="shrink-0">
                  {deleting === q.id ? (
                    <DeleteConfirm label="Bu soru" onConfirm={() => void del(q.id)} onCancel={() => setDeleting(null)} />
                  ) : (
                    <button onClick={() => setDeleting(q.id)} className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50">Sil</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#26496b] text-lg">Yeni Sınav Sorusu</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Kategori *</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className={inp}>
                  <option value="">Seçiniz…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.examType.toUpperCase()})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Soru Metni *</label>
                <textarea value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} rows={3} className={inp + ' resize-none'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['A','B','C','D','E'] as const).map(l => (
                  <div key={l}>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Şık {l}{l !== 'E' && ' *'}</label>
                    <input value={form[`option${l}` as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [`option${l}`]: e.target.value }))} className={inp} />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Doğru Cevap *</label>
                  <select value={form.correctOption} onChange={e => setForm(f => ({ ...f, correctOption: e.target.value }))} className={inp}>
                    {['a','b','c','d','e'].map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Zorluk</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className={inp}>
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Kaynak</label>
                  <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={inp} placeholder="ör. KPSS 2023" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Açıklama</label>
                <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} rows={2} className={inp + ' resize-none'} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">İlgili Terim Slug'ları (virgülle)</label>
                <input value={form.relatedTermSlugs} onChange={e => setForm(f => ({ ...f, relatedTermSlugs: e.target.value }))} className={inp} placeholder="datum, koordinat-sistemi" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl border">İptal</button>
                <button onClick={() => void save()} disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PathsTab ─────────────────────────────────────────────────────────────────

interface PathForm {
  slug: string; title: string; description: string; field: string;
  difficulty: string; estimatedMinutes: string; coverEmoji: string; status: string;
}
const EMPTY_PATH: PathForm = {
  slug: '', title: '', description: '', field: '',
  difficulty: 'beginner', estimatedMinutes: '', coverEmoji: '📚', status: 'draft',
};

const CONTENT_TYPE_OPTS = [
  { value: 'guide', label: 'Rehber' },
  { value: 'term', label: 'Sözlük' },
  { value: 'regulation', label: 'Mevzuat' },
  { value: 'document', label: 'Doküman' },
];
const CONTENT_TYPE_CLS: Record<string, string> = {
  guide: 'bg-emerald-100 text-emerald-700',
  term: 'bg-violet-100 text-violet-700',
  regulation: 'bg-rose-100 text-rose-700',
  document: 'bg-amber-100 text-amber-700',
};

const EMPTY_NEW_ITEM = { contentType: 'guide', slug: '', title: '' };

function PathsTab() {
  const [items, setItems] = useState<LibraryPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LibraryPath | null>(null);
  const [form, setForm] = useState<PathForm>(EMPTY_PATH);
  const [pathItems, setPathItems] = useState<LibraryPathItem[]>([]);
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listAdminPaths()
      .then(data => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_PATH); setPathItems([]); setNewItem(EMPTY_NEW_ITEM); setShowModal(true);
  };
  const openEdit = (p: LibraryPath) => {
    setEditing(p);
    setForm({
      slug: p.slug, title: p.title, description: p.description ?? '', field: p.field ?? '',
      difficulty: p.difficulty, estimatedMinutes: p.estimatedMinutes?.toString() ?? '',
      coverEmoji: p.coverEmoji ?? '📚', status: p.status,
    });
    setPathItems([...(p.items ?? [])].sort((a, b) => a.order - b.order));
    setNewItem(EMPTY_NEW_ITEM);
    setShowModal(true);
  };

  function addItem() {
    if (!newItem.slug.trim() || !newItem.title.trim()) return;
    setPathItems(prev => [...prev, {
      contentType: newItem.contentType as LibraryPathItem['contentType'],
      contentId: crypto.randomUUID(),
      slug: newItem.slug.trim(),
      title: newItem.title.trim(),
      order: prev.length,
    }]);
    setNewItem(EMPTY_NEW_ITEM);
  }

  function removeItem(idx: number) {
    setPathItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order: i })));
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= pathItems.length) return;
    setPathItems(prev => {
      const arr = [...prev];
      const tmp = arr[idx]; arr[idx] = arr[next]; arr[next] = tmp;
      return arr.map((it, i) => ({ ...it, order: i }));
    });
  }

  async function save() {
    if (!form.slug.trim() || !form.title.trim()) { alert('Slug ve başlık zorunlu.'); return; }
    setSaving(true);
    try {
      const dto = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.field ? { field: form.field } : {}),
        difficulty: form.difficulty,
        ...(form.estimatedMinutes ? { estimatedMinutes: parseInt(form.estimatedMinutes, 10) } : {}),
        coverEmoji: form.coverEmoji || '📚',
        status: form.status as 'draft' | 'published' | 'archived',
        items: pathItems,
      };
      if (editing) {
        await adminApi.updateLibraryPath(editing.id, dto);
      } else {
        await adminApi.createLibraryPath(dto);
      }
      setShowModal(false);
      load();
    } catch { alert('Kayıt başarısız.'); }
    finally { setSaving(false); }
  }

  async function doDelete(id: string) {
    try {
      await adminApi.deleteLibraryPath(id);
      setItems(prev => prev.filter(p => p.id !== id));
    } catch { alert('Silme başarısız.'); }
    finally { setDeleteId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{items.length} öğrenme yolu</p>
        <button onClick={openCreate} className="px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57]">
          + Yeni Yol
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">Henüz öğrenme yolu yok.</div>
      ) : (
        <div className="space-y-2">
          {items.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-2xl">{p.coverEmoji ?? '📚'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">{p.title}</span>
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-gray-400">{p.items?.length ?? 0} adım</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deleteId === p.id ? (
                  <DeleteConfirm label={p.title} onConfirm={() => void doDelete(p.id)} onCancel={() => setDeleteId(null)} />
                ) : (
                  <>
                    <button onClick={() => openEdit(p)} className="text-xs text-[#26496b] font-medium hover:underline">Düzenle</button>
                    <button onClick={() => setDeleteId(p.id)} className="text-xs text-red-500 hover:underline">Sil</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Yolu Düzenle' : 'Yeni Öğrenme Yolu'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-4">

              {/* ── Temel bilgiler ─────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Başlık *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Slug *</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={inp} placeholder="cbs-temel-egitim" disabled={!!editing} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Açıklama</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inp + ' resize-none'} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Zorluk</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className={inp}>
                    <option value="beginner">Başlangıç</option>
                    <option value="intermediate">Orta</option>
                    <option value="advanced">İleri</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Alan</label>
                  <select value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} className={inp}>
                    <option value="">—</option>
                    {FIELD_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Emoji</label>
                  <input value={form.coverEmoji} onChange={e => setForm(f => ({ ...f, coverEmoji: e.target.value }))} className={inp} maxLength={2} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Durum</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                    <option value="draft">Taslak</option>
                    <option value="published">Yayında</option>
                    <option value="archived">Arşiv</option>
                  </select>
                </div>
              </div>

              {/* ── Adımlar ────────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">İçerik Adımları</label>
                  <span className="text-xs text-gray-400">{pathItems.length} adım</span>
                </div>

                {pathItems.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-3 text-center border border-dashed border-gray-200 rounded-xl">
                    Henüz adım eklenmedi. Aşağıdan ekleyin.
                  </p>
                ) : (
                  <div className="space-y-1.5 mb-3">
                    {pathItems.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                        <span className="w-5 h-5 rounded-full bg-[#26496b]/10 text-[#26496b] text-[10px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${CONTENT_TYPE_CLS[it.contentType] ?? 'bg-gray-100 text-gray-600'}`}>
                          {CONTENT_TYPE_OPTS.find(o => o.value === it.contentType)?.label ?? it.contentType}
                        </span>
                        <span className="text-xs font-medium text-gray-800 flex-1 min-w-0 truncate">{it.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono truncate max-w-[80px] shrink-0">{it.slug}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">↑</button>
                          <button onClick={() => moveItem(idx, 1)} disabled={idx === pathItems.length - 1} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">↓</button>
                          <button onClick={() => removeItem(idx)} className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 text-xs">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yeni adım ekle */}
                <div className="bg-[#26496b]/5 border border-[#26496b]/15 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-[#26496b] uppercase tracking-wider mb-2">Adım Ekle</p>
                  <div className="flex gap-2">
                    <select
                      value={newItem.contentType}
                      onChange={e => setNewItem(n => ({ ...n, contentType: e.target.value }))}
                      className={inp + ' w-32 shrink-0 text-xs py-1.5'}
                    >
                      {CONTENT_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input
                      value={newItem.slug}
                      onChange={e => setNewItem(n => ({ ...n, slug: e.target.value }))}
                      placeholder="slug"
                      className={inp + ' text-xs py-1.5 font-mono'}
                    />
                    <input
                      value={newItem.title}
                      onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))}
                      placeholder="Başlık"
                      className={inp + ' text-xs py-1.5 flex-1'}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                    />
                    <button
                      onClick={addItem}
                      disabled={!newItem.slug.trim() || !newItem.title.trim()}
                      className="px-3 py-1.5 bg-[#26496b] text-white text-xs font-semibold rounded-lg hover:bg-[#1d3a57] disabled:opacity-40 shrink-0"
                    >
                      + Ekle
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl border">İptal</button>
                <button onClick={() => void save()} disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'oneriler' | 'sozluk' | 'rehberler' | 'dokumanlar' | 'mevzuat' | 'sinavlar' | 'yollar';

const TABS: { key: Tab; label: string }[] = [
  { key: 'oneriler', label: 'Öneriler' },
  { key: 'sozluk', label: 'Sözlük' },
  { key: 'rehberler', label: 'Rehberler' },
  { key: 'dokumanlar', label: 'Dokümanlar' },
  { key: 'mevzuat', label: 'Mevzuat' },
  { key: 'sinavlar', label: 'Sınav Soruları' },
  { key: 'yollar', label: 'Öğrenme Yolları' },
];

export default function KutuphanePage() {
  const [activeTab, setActiveTab] = useState<Tab>('oneriler');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#26496b]">Meslek Kütüphanesi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sahne kütüphane içeriklerini yönet — sözlük, rehberler, dokümanlar, mevzuat, sınav soruları</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-white shadow text-[#26496b]' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'oneriler' && <SuggestionsTab />}
      {activeTab === 'sozluk' && <TermsTab />}
      {activeTab === 'rehberler' && <GuidesTab />}
      {activeTab === 'dokumanlar' && <DocumentsTab />}
      {activeTab === 'mevzuat' && <RegulationsTab />}
      {activeTab === 'sinavlar' && <ExamQuestionsTab />}
      {activeTab === 'yollar' && <PathsTab />}
    </div>
  );
}
