'use client';

import { useEffect, useState } from 'react';
import { adminApi, type ContentRequestItem } from '@/lib/api';
import { STATUS_CLS as STATUS_COLORS, SOURCE_LABELS, SOURCE_COLORS } from '@/lib/ui';

type JobListing = {
  id: string; title: string; company: string; location: string | null;
  type: string; description: string;
  applyEmail: string | null; contactPhone: string | null; price: string | null;
  source: string | null;
  tags: string[]; status: string; createdAt: string;
};

const STATUS_LABELS: Record<string, string> = { draft: 'Taslak', published: 'Yayında', closed: 'Kapalı' };
const LISTING_TYPES: Record<string, string> = {
  isbirligi: 'İşbirliği', proje: 'Projeler', teknik_destek: 'Teknik Destek',
  freelancer: 'Freelancer', teknoloji_ekipman: 'Teknoloji & Ekipman',
  ikinci_el: 'İkinci El & Satış', mesleki_arac: 'Mesleki Araçlar',
  firsat: 'Fırsatlar', duyuru: 'Duyurular',
};
const LISTING_GRADS: Record<string, string> = {
  isbirligi: 'linear-gradient(135deg,#3b82f6,#2563eb)',
  proje: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  teknik_destek: 'linear-gradient(135deg,#f97316,#ea580c)',
  freelancer: 'linear-gradient(135deg,#14b8a6,#0d9488)',
  teknoloji_ekipman: 'linear-gradient(135deg,#64748b,#475569)',
  ikinci_el: 'linear-gradient(135deg,#f59e0b,#d97706)',
  mesleki_arac: 'linear-gradient(135deg,#10b981,#059669)',
  firsat: 'linear-gradient(135deg,#ec4899,#db2777)',
  duyuru: 'linear-gradient(135deg,#26496b,#1e3a56)',
};
const LISTING_ICONS: Record<string, string> = {
  isbirligi: '🤝', proje: '📐', teknik_destek: '🔧', freelancer: '💼',
  teknoloji_ekipman: '📡', ikinci_el: '♻️', mesleki_arac: '🗺️',
  firsat: '✨', duyuru: '📢',
};
const STATUS_PUB_CLS: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-600',
};

const EMPTY_FORM = {
  title: '', company: '', location: '', type: 'isbirligi', description: '',
  applyEmail: '', contactPhone: '', price: '', tags: '',
};

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

export default function IlanlarPage() {
  const [tab, setTab] = useState<'talepler' | 'ilanlar'>('talepler');

  const [requests, setRequests] = useState<ContentRequestItem[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqStatus, setReqStatus] = useState('pending');
  const [reqSource, setReqSource] = useState('');
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [deletingReq, setDeletingReq] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [items, setItems] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedIlan, setExpandedIlan] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<JobListing | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function loadRequests() {
    setReqLoading(true);
    const qs: Record<string, string> = { type: 'ilan', status: reqStatus };
    if (reqSource) qs.source = reqSource;
    adminApi.listContentRequests(qs)
      .then(r => setRequests(r.data)).catch(() => {}).finally(() => setReqLoading(false));
  }

  function loadListings() {
    setLoading(true);
    adminApi.listAdminJobListings(statusFilter ? { status: statusFilter } : {})
      .then(data => setItems(data as JobListing[])).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { loadRequests(); }, [reqStatus, reqSource]); // eslint-disable-line
  useEffect(() => { if (tab === 'ilanlar') loadListings(); }, [tab, statusFilter]); // eslint-disable-line

  async function handleReview(id: string, status: 'approved' | 'rejected') {
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

  function openCreate() { setEditItem(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); }

  function openEdit(item: JobListing) {
    setEditItem(item);
    setForm({
      title: item.title, company: item.company, location: item.location ?? '',
      type: item.type, description: item.description,
      applyEmail: item.applyEmail ?? '', contactPhone: item.contactPhone ?? '',
      price: item.price ?? '', tags: (item.tags ?? []).join(', '),
    });
    setError(''); setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {
        title: form.title, company: form.company,
        type: form.type, description: form.description,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        ...(form.location ? { location: form.location } : {}),
        ...(form.applyEmail ? { applyEmail: form.applyEmail } : {}),
        ...(form.contactPhone ? { contactPhone: form.contactPhone } : {}),
        ...(form.price ? { price: form.price } : {}),
      };
      if (editItem) await adminApi.updateJobListing(editItem.id, payload);
      else await adminApi.createJobListing(payload);
      setShowForm(false); loadListings();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function toggleStatus(item: JobListing) {
    const next = item.status === 'published' ? 'closed' : 'published';
    setUpdating(item.id);
    try { await adminApi.updateJobListingStatus(item.id, next as 'published' | 'closed'); loadListings(); }
    finally { setUpdating(null); }
  }

  async function deleteIlan(id: string) {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    try { await adminApi.deleteJobListing(id); loadListings(); }
    finally { setDeleting(null); }
  }

  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';
  const inp = 'w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]';

  return (
    <div className="max-w-5xl">
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editItem ? 'İlanı Düzenle' : 'Yeni İlan'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void save(e)} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label>
                  <input required className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Hesap makinesi satılıyor…" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Veren Kişi / Kurum *</label>
                  <input required className={inp} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Ad Soyad / Şirket" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Şehir / Lokasyon</label>
                  <input className={inp} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="İstanbul / Online" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Kategori</label>
                  <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(LISTING_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Fiyat / Ücret</label>
                  <input className={inp} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1.500 TL / Pazarlıklı" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">İletişim E-posta</label>
                  <input type="email" className={inp} value={form.applyEmail} onChange={e => setForm(f => ({ ...f, applyEmail: e.target.value }))} placeholder="ornek@mail.com" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">İletişim Telefon</label>
                  <input className={inp} value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+90 5xx xxx xx xx" /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Etiketler (virgülle ayır)</label>
                  <input className={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="topcon, total station, harita" /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama *</label>
                  <textarea required rows={4} className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="İlan detayları…" /></div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
              <button onClick={(e) => void save(e as unknown as React.FormEvent)} disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                {saving ? 'Kaydediliyor…' : editItem ? 'Güncelle' : 'Yayınla'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">İlan Panosu</h1>
        <p className="text-sm text-gray-500 mt-1">İşbirliği, proje, teknik destek, ekipman, freelancer, fırsat ve duyuru ilanları</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button onClick={() => setTab('talepler')}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${tab === 'talepler' ? 'border-[#26496b] text-[#26496b] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Gelen Talepler
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{requests.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
        <button onClick={() => setTab('ilanlar')}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${tab === 'ilanlar' ? 'border-[#26496b] text-[#26496b] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Yayındaki İlanlar
        </button>
      </div>

      {/* ── Talepler ── */}
      {tab === 'talepler' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              {(['', 'sahne', 'mutfak'] as const).map(s => (
                <button key={s} onClick={() => setReqSource(s)}
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-colors ${reqSource === s ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b] hover:text-[#26496b]'}`}>
                  {s === '' ? 'Tümü' : s === 'sahne' ? 'Sahne' : 'Mutfak'}
                </button>
              ))}
            </div>
            <select className={sel} value={reqStatus} onChange={e => setReqStatus(e.target.value)}>
              <option value="pending">Bekleyen</option>
              <option value="approved">Onaylanan</option>
              <option value="rejected">Reddedilen</option>
            </select>
          </div>
          {reqLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              {reqStatus === 'pending' ? 'Bekleyen ilan talebi yok.' : 'Talep bulunamadı.'}
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(r => {
                const isOpen = expandedReq === r.id;
                const grad = r.source === 'sahne'
                  ? 'linear-gradient(135deg,#26496b,#1e3a56)'
                  : 'linear-gradient(135deg,#66aca9,#4d8f8c)';
                const initials = (r.displayName ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                const statusCls = r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                const statusLabel = r.status === 'pending' ? 'Bekliyor' : r.status === 'approved' ? 'Onaylandı' : 'Reddedildi';
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ background: grad }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusCls}`}>{statusLabel}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLORS[r.source] ?? 'bg-gray-100 text-gray-600'}`}>{SOURCE_LABELS[r.source] ?? r.source}</span>
                          <span className="text-[10px] text-gray-400">{r.displayName} · {new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 leading-snug truncate">{r.title}</p>
                        {r.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.description}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button title="Sil" disabled={deletingReq === r.id} onClick={() => void deleteReq(r.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <IcoTrash />
                        </button>
                        <button title={isOpen ? 'Kapat' : 'Detay'} onClick={() => setExpandedReq(isOpen ? null : r.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                          <IcoChevron open={isOpen} />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/60 space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Açıklama</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{r.description}</p>
                        </div>
                        {r.contactInfo && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">İletişim</p>
                            <p className="text-sm text-gray-700">{r.contactInfo}</p>
                          </div>
                        )}
                        {r.adminNotes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                            <span className="font-semibold">Admin Notu: </span>{r.adminNotes}
                          </div>
                        )}
                        {r.status === 'pending' && (
                          <div className="space-y-2 pt-1">
                            <textarea rows={2} value={notes[r.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b] bg-white"
                              placeholder="Onay/red gerekçesi (opsiyonel)…" />
                            <div className="flex gap-2">
                              <button disabled={reviewing === r.id} onClick={() => void handleReview(r.id, 'approved')}
                                className="px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">✓ Onayla</button>
                              <button disabled={reviewing === r.id} onClick={() => void handleReview(r.id, 'rejected')}
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

      {/* ── Yayındaki İlanlar ── */}
      {tab === 'ilanlar' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56]">
              + Yeni İlan
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">İlan bulunamadı.</div>
          ) : (
            <div className="space-y-2">
              {items.map(item => {
                const isOpen = expandedIlan === item.id;
                const grad = LISTING_GRADS[item.type] ?? 'linear-gradient(135deg,#64748b,#475569)';
                const icon = LISTING_ICONS[item.type] ?? '📌';
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      {/* Category avatar */}
                      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl shadow-sm select-none"
                        style={{ background: grad }}>
                        {icon}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_PUB_CLS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[item.status] ?? item.status}</span>
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{LISTING_TYPES[item.type] ?? item.type}</span>
                          {item.source && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLORS[item.source] ?? 'bg-gray-100 text-gray-600'}`}>{SOURCE_LABELS[item.source] ?? item.source}</span>}
                        </div>
                        <p className="font-semibold text-sm text-gray-900 leading-snug">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.company}{item.location && ` · ${item.location}`}</p>
                      </div>
                      {/* Action buttons — always visible */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button title="Düzenle" onClick={() => { openEdit(item); setExpandedIlan(null); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors">
                          <IcoEdit />
                        </button>
                        <button title={item.status === 'published' ? 'Kapat' : 'Yayınla'}
                          disabled={updating === item.id} onClick={() => void toggleStatus(item)}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${item.status === 'published' ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                          {item.status === 'published' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>
                        <button title="Sil" disabled={deleting === item.id} onClick={() => void deleteIlan(item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <IcoTrash />
                        </button>
                        <button title={isOpen ? 'Kapat' : 'Detaylar'} onClick={() => setExpandedIlan(isOpen ? null : item.id)}
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
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {item.price && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Fiyat</p><p className="text-sm text-green-700 font-medium">{item.price}</p></div>}
                          {item.applyEmail && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">E-posta</p><p className="text-sm text-gray-700">{item.applyEmail}</p></div>}
                          {item.contactPhone && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Telefon</p><p className="text-sm text-gray-700">{item.contactPhone}</p></div>}
                        </div>
                        {(item.tags ?? []).length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {item.tags.map(t => <span key={t} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{t}</span>)}
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
    </div>
  );
}
