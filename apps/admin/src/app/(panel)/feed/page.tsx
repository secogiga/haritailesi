'use client';

import { useEffect, useRef, useState } from 'react';
import { adminApi, type AdminPost } from '@/lib/api';
import { STATUS_CLS, fmtShortDate } from '@/lib/ui';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  published: 'Yayında', hidden: 'Gizli',
  pending_review: 'İncelemede', deleted: 'Silindi', draft: 'Taslak',
};
const STATUS_BAR: Record<string, string> = {
  published: '#22c55e', hidden: '#f59e0b',
  pending_review: '#f97316', deleted: '#ef4444', draft: '#94a3b8',
};
const TYPE_LABELS: Record<string, string> = {
  general: 'Genel', question: 'Soru', idea: 'Fikir', project_call: 'Proje Çağrısı',
  content_draft: 'İçerik Taslağı', team_search: 'Ekip Arıyorum',
  mentorship_experience: 'Mentorluk', poll: 'Anket', announcement: 'Duyuru', resource: 'Kaynak',
};
const TYPE_ICON: Record<string, string> = {
  general: '💬', question: '❓', idea: '💡', project_call: '📐',
  content_draft: '📝', team_search: '👥', mentorship_experience: '🎓',
  poll: '📊', announcement: '📢', resource: '📚',
};
const TYPE_GRAD: Record<string, string> = {
  general:               'linear-gradient(135deg,#64748b,#475569)',
  question:              'linear-gradient(135deg,#f59e0b,#d97706)',
  idea:                  'linear-gradient(135deg,#eab308,#ca8a04)',
  project_call:          'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  content_draft:         'linear-gradient(135deg,#6366f1,#4f46e5)',
  team_search:           'linear-gradient(135deg,#14b8a6,#0d9488)',
  mentorship_experience: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
  poll:                  'linear-gradient(135deg,#10b981,#059669)',
  announcement:          'linear-gradient(135deg,#26496b,#1e3a56)',
  resource:              'linear-gradient(135deg,#f97316,#ea580c)',
};
const CATEGORY_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS / GIS',
  fotogrametri_uzaktan_algilama: 'Fotogrametri', insaat: 'İnşaat',
  gayrimenkul_degerleme: 'Gayrimenkul', yazilim_teknoloji: 'Yazılım',
  kariyer: 'Kariyer', egitim: 'Eğitim', mentorluk: 'Mentorluk',
  gonullulik: 'Gönüllülük', proje_gelistirme: 'Proje', haritailesi_duyurulari: 'H. Duyuruları',
};
const POST_TYPES = [
  { value: 'general', label: 'Genel' }, { value: 'question', label: 'Soru' },
  { value: 'idea', label: 'Fikir' }, { value: 'project_call', label: 'Proje Çağrısı' },
  { value: 'content_draft', label: 'İçerik Taslağı' }, { value: 'team_search', label: 'Ekip Arıyorum' },
  { value: 'mentorship_experience', label: 'Mentorluk' }, { value: 'poll', label: 'Anket' },
  { value: 'announcement', label: 'Duyuru' }, { value: 'resource', label: 'Kaynak' },
];
const POST_CATEGORIES = [
  { value: 'haritailesi_duyurulari', label: 'H. Duyuruları' },
  { value: 'klasik_haritacilik', label: 'Klasik Haritacılık' },
  { value: 'cbs', label: 'CBS / GIS' },
  { value: 'fotogrametri_uzaktan_algilama', label: 'Fotogrametri' },
  { value: 'insaat', label: 'İnşaat' }, { value: 'gayrimenkul_degerleme', label: 'Gayrimenkul' },
  { value: 'yazilim_teknoloji', label: 'Yazılım' }, { value: 'kariyer', label: 'Kariyer' },
  { value: 'egitim', label: 'Eğitim' }, { value: 'mentorluk', label: 'Mentorluk' },
  { value: 'gonullulik', label: 'Gönüllülük' }, { value: 'proje_gelistirme', label: 'Proje' },
];
const NEXT_STATUSES = ['published', 'hidden', 'pending_review', 'deleted'];
const BULK_ACTIONS = [
  { status: 'published',      label: 'Yayınla',    cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { status: 'hidden',         label: 'Gizle',      cls: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  { status: 'pending_review', label: 'İncelemeye', cls: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { status: 'deleted',        label: 'Sil',        cls: 'bg-red-600 hover:bg-red-700 text-white' },
];
const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white';
const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] w-full';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IcoPin({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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

// ─── CreatePostModal ──────────────────────────────────────────────────────────

function CreatePostModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (post: AdminPost) => void;
}) {
  const [form, setForm] = useState({
    type: 'announcement', category: 'haritailesi_duyurulari',
    title: '', body: '', status: 'published',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));
  }

  async function handleSave() {
    if (!form.body.trim()) return;
    setSaving(true); setError('');
    try {
      const post = await adminApi.createAdminPost({
        type: form.type, category: form.category,
        title: form.title.trim() || null, body: form.body.trim(), status: form.status,
      });
      onCreated(post); onClose();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Yeni Gönderi Oluştur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tür</label>
              <select className={sel} value={form.type} onChange={set('type')}>
                {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Kategori</label>
              <select className={sel} value={form.category} onChange={set('category')}>
                {POST_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Başlık <span className="font-normal normal-case text-gray-300">(opsiyonel)</span></label>
            <input type="text" className={inp} value={form.title} onChange={set('title')} maxLength={300} placeholder="Başlık giriniz…" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">İçerik <span className="text-red-400 normal-case font-normal">*</span></label>
            <textarea className={`${inp} resize-none`} value={form.body} onChange={set('body')} maxLength={5000} rows={8} placeholder="Gönderi içeriği…" />
            <p className="text-xs text-gray-300 mt-1 text-right">{form.body.length}/5000</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Yayın Durumu</label>
            <select className={`${sel} w-auto`} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="published">Yayında</option>
              <option value="hidden">Gizli</option>
              <option value="pending_review">İncelemede</option>
              <option value="draft">Taslak</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800">İptal</button>
          <button onClick={handleSave} disabled={saving || !form.body.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl disabled:opacity-50">
            {saving ? 'Oluşturuluyor…' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditModal ────────────────────────────────────────────────────────────────

function EditModal({ post, onClose, onSaved }: {
  post: AdminPost; onClose: () => void; onSaved: (updated: AdminPost) => void;
}) {
  const [title, setTitle] = useState(post.title ?? '');
  const [body, setBody] = useState(post.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const updated = await adminApi.updateAdminPost(post.id, { title: title.trim() || null, body });
      onSaved({ ...post, title: updated.title, body: updated.body });
      onClose();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Gönderiyi Düzenle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Başlık <span className="font-normal normal-case text-gray-300">(opsiyonel)</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={300} className={inp} placeholder="Başlık giriniz…" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">İçerik</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={5000} rows={10} className={`${inp} resize-none`} />
            <p className="text-xs text-gray-300 mt-1 text-right">{body.length}/5000</p>
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800">İptal</button>
          <button onClick={handleSave} disabled={saving || !body.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl disabled:opacity-50">
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({ post, onClose, onConfirm, busy }: {
  post: AdminPost; onClose: () => void; onConfirm: () => void; busy: boolean;
}) {
  const preview = (post.title ?? post.body).slice(0, 80);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
            <IcoTrash />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Gönderiyi sil</h2>
          <p className="text-sm text-gray-500 mb-3">
            Bu gönderi <strong className="text-gray-800">"deleted"</strong> statüsüne alınacak ve kullanıcılara görünmez olacak.
          </p>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-600 italic border border-gray-100">
            "{preview}{preview.length < (post.title ?? post.body).length ? '…' : ''}"
          </div>
          <p className="text-xs text-gray-400 mt-2">Yazar: {post.displayName}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-50">İptal</button>
          <button onClick={onConfirm} disabled={busy}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50">
            {busy ? 'Siliniyor…' : 'Evet, Sil'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<AdminPost | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [toast, setToast] = useState('');
  const headerCbRef = useRef<HTMLInputElement>(null);

  function load(status: string, type: string, q: string) {
    setLoading(true); setError('');
    adminApi.listAdminPosts({
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(q ? { q } : {}),
    })
      .then(setPosts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(() => load(statusFilter, typeFilter, search), 300);
    return () => clearTimeout(t);
  }, [statusFilter, typeFilter, search]); // eslint-disable-line

  useEffect(() => { setSelectedIds(new Set()); }, [statusFilter, typeFilter, search]);

  const allSelected = posts.length > 0 && posts.every(p => selectedIds.has(p.id));
  const someSelected = posts.some(p => selectedIds.has(p.id)) && !allSelected;
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someSelected;
  }, [someSelected]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(posts.map(p => p.id)));
  }

  async function handlePin(post: AdminPost) {
    setActionLoading(post.id + '-pin');
    try {
      const updated = await adminApi.pinPost(post.id, !post.isPinned);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isPinned: updated.isPinned } : p));
    } catch (e) { alert((e as Error).message); }
    finally { setActionLoading(null); }
  }

  async function handleStatusChange(post: AdminPost, status: string) {
    setActionLoading(post.id + '-status');
    try {
      await adminApi.setPostStatus(post.id, status);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status } : p));
    } catch (e) { alert((e as Error).message); }
    finally { setActionLoading(null); }
  }

  async function handleDelete() {
    if (!deletingPost) return;
    setActionLoading(deletingPost.id + '-delete');
    try {
      await adminApi.deleteAdminPost(deletingPost.id);
      setPosts(prev => prev.filter(p => p.id !== deletingPost.id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(deletingPost.id); return n; });
      setDeletingPost(null);
    } catch (e) { alert((e as Error).message); }
    finally { setActionLoading(null); }
  }

  async function handleBulkStatus(status: string) {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      await adminApi.bulkSetPostStatus(ids, status);
      setPosts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, status } : p));
      setSelectedIds(new Set());
      showToast(`${ids.length} gönderi "${STATUS_LABELS[status] ?? status}" yapıldı`);
    } catch (e) { alert((e as Error).message); }
    finally { setBulkBusy(false); }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const hasFilter = !!(search || statusFilter || typeFilter);
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const pendingCount = posts.filter(p => p.status === 'pending_review').length;

  return (
    <div className="max-w-5xl pb-20">
      {/* Modals */}
      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={post => { setPosts(prev => [post, ...prev]); showToast('Gönderi oluşturuldu'); }}
        />
      )}
      {editingPost && (
        <EditModal post={editingPost} onClose={() => setEditingPost(null)}
          onSaved={updated => { setPosts(prev => prev.map(p => p.id === updated.id ? updated : p)); setEditingPost(null); }} />
      )}
      {deletingPost && (
        <DeleteConfirmModal post={deletingPost} onClose={() => setDeletingPost(null)}
          onConfirm={handleDelete} busy={actionLoading === deletingPost.id + '-delete'} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed Moderasyonu</h1>
          <div className="flex items-center gap-3 mt-2">
            {!loading && (
              <span className="text-sm text-gray-400">
                <span className="font-bold text-gray-800">{posts.length}</span> gönderi
              </span>
            )}
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                {pendingCount} incelemede
              </span>
            )}
            {selectedIds.size > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#26496b]/10 text-[#26496b] border border-[#26496b]/20 px-2.5 py-1 rounded-lg">
                {selectedIds.size} seçili
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Gönderi
        </button>
      </div>

      {/* Filtreler */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <div className="flex-1 min-w-56 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Başlık veya içerik ara…"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select className={sel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Tüm Türler</option>
          {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {['published', 'hidden', 'pending_review', 'deleted', 'draft'].map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        {hasFilter && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
            className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            Temizle
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      {/* Liste */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 font-medium">
            {hasFilter ? 'Arama kriterlerine uygun gönderi bulunamadı.' : 'Gönderi bulunamadı.'}
          </p>
        </div>
      ) : (
        <>
          {/* Toplu seçim başlığı */}
          <div className="flex items-center gap-3 px-4 py-2.5 mb-1">
            <input type="checkbox" ref={headerCbRef} checked={allSelected} onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]/30" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {selectedIds.size > 0 ? `${selectedIds.size} seçili` : `${posts.length} gönderi`}
            </span>
          </div>

          <div className="space-y-2">
            {posts.map(post => {
              const busy = !!actionLoading?.startsWith(post.id);
              const isSelected = selectedIds.has(post.id);
              const barColor = STATUS_BAR[post.status] ?? '#94a3b8';
              const typeGrad = TYPE_GRAD[post.type] ?? 'linear-gradient(135deg,#94a3b8,#64748b)';
              const typeIcon = TYPE_ICON[post.type] ?? '📝';
              return (
                <div key={post.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-[#26496b]/20' : ''}`}>
                  {/* Status bar */}
                  <div className="w-[4px] shrink-0" style={{ backgroundColor: barColor }} />

                  {/* Checkbox */}
                  <div className="flex items-center px-3 shrink-0">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(post.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]/30" />
                  </div>

                  {/* Type avatar */}
                  <div className="flex items-center px-1 py-3.5 shrink-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm select-none"
                      style={{ background: typeGrad }}>
                      {typeIcon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 px-3 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CLS[post.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[post.status] ?? post.status}
                      </span>
                      {post.isPinned && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">📌 Sabitlenmiş</span>
                      )}
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                        {TYPE_LABELS[post.type] ?? post.type}
                      </span>
                      <span className="text-[10px] text-gray-400">{CATEGORY_LABELS[post.category] ?? post.category}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-500 font-medium">{post.displayName}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{fmtShortDate(post.createdAt)}</span>
                    </div>
                    {post.title && (
                      <p className="font-semibold text-sm text-gray-900 leading-snug mb-0.5">{post.title}</p>
                    )}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        {post.reactionCount}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {post.commentCount}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 px-3 shrink-0">
                    <button title="Düzenle" disabled={busy} onClick={() => setEditingPost(post)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors disabled:opacity-40">
                      <IcoEdit />
                    </button>
                    <button title={post.isPinned ? 'Sabiti Kaldır' : 'Sabitle'} disabled={busy} onClick={() => handlePin(post)}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                        post.isPinned
                          ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}>
                      {actionLoading === post.id + '-pin' ? (
                        <span className="w-4 h-4 flex items-center justify-center text-xs">…</span>
                      ) : (
                        <IcoPin filled={post.isPinned} />
                      )}
                    </button>
                    <select disabled={busy} value={post.status} onChange={e => handleStatusChange(post, e.target.value)}
                      className="text-[11px] border border-gray-200 rounded-lg pl-2 pr-5 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 disabled:opacity-40 bg-white cursor-pointer">
                      {NEXT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    <button title="Sil" disabled={busy} onClick={() => setDeletingPost(post)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                      <IcoTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3">
          <span className="text-sm font-semibold text-gray-100 mr-2 whitespace-nowrap">
            {selectedIds.size} gönderi seçildi
          </span>
          {BULK_ACTIONS.map(a => (
            <button key={a.status} disabled={bulkBusy} onClick={() => handleBulkStatus(a.status)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${a.cls}`}>
              {a.label}
            </button>
          ))}
          <button onClick={() => setSelectedIds(new Set())} className="ml-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
