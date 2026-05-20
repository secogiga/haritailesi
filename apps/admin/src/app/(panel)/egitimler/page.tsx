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

type Tab = 'talepler' | 'egitimler';

const EMPTY_FORM = {
  slug: '', title: '', instructor: '', instructorTitle: '',
  format: 'Online', level: 'Orta', duration: '', price: '', memberPrice: '',
  description: '', registrationUrl: '', startDate: '', isPublished: true,
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
  const [expandedYay, setExpandedYay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<TrainingItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

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

  useEffect(() => { loadRequests(); }, [statusFilter, sourceFilter]); // eslint-disable-line
  useEffect(() => { if (tab === 'egitimler' && !trainLoaded) loadTrainings(); }, [tab]); // eslint-disable-line

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

  const pendingCount = requests.filter(r => r.status === 'pending').length;
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
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label><input required className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                  <div><label className="block text-xs font-semibold text-gray-500 mb-1">Slug *</label><input required className={inp} value={form.slug} placeholder="qgis-ile-cbs" onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
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
                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id="published" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                    <label htmlFor="published" className="text-sm text-gray-700">Yayında</label>
                  </div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label>
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
                      {/* Subject avatar */}
                      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white text-lg font-bold shadow-sm select-none"
                        style={{ background: grad }}>
                        {item.title[0]?.toUpperCase() ?? '?'}
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
                    {isOpen && (
                      <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/60 space-y-3">
                        {item.description && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Açıklama</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {item.memberPrice && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Üye Fiyatı</p><p className="text-sm text-gray-700">{item.memberPrice}</p></div>}
                          {item.startDate && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Başlangıç</p><p className="text-sm text-gray-700">{new Date(item.startDate).toLocaleDateString('tr-TR')}</p></div>}
                          {item.registrationUrl && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Kayıt URL</p>
                              <a href={item.registrationUrl} target="_blank" rel="noreferrer" className="text-sm text-[#26496b] hover:underline">{item.registrationUrl}</a>
                            </div>
                          )}
                        </div>
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
