'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi, type CmsEvent, type ContentRequestItem } from '@/lib/api';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/ui';

const EVENT_TYPES: Record<string, string> = {
  webinar: 'Webinar', workshop: 'Atölye', conference: 'Konferans', meetup: 'Buluşma', other: 'Diğer',
};

const EVENT_GRADS: Record<string, string> = {
  webinar: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  workshop: 'linear-gradient(135deg,#f97316,#ea580c)',
  conference: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  meetup: 'linear-gradient(135deg,#14b8a6,#0d9488)',
  other: 'linear-gradient(135deg,#64748b,#475569)',
};

const EVENT_ICONS: Record<string, string> = {
  webinar: '📺', workshop: '🔧', conference: '🏛️', meetup: '👥', other: '📅',
};

const EMPTY_FORM = {
  slug: '', title: '', type: 'webinar',
  dateStart: '', dateEnd: '', location: '',
  description: '', registrationUrl: '', meetingUrl: '',
  maxCapacity: '', isCancelled: false, isPublished: false,
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

export default function EtkinliklerPage() {
  const [tab, setTab] = useState<'talepler' | 'yayinda'>('talepler');

  const [requests, setRequests] = useState<ContentRequestItem[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqStatus, setReqStatus] = useState('pending');
  const [reqSource, setReqSource] = useState('');
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [deletingReq, setDeletingReq] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [evLoading, setEvLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedYay, setExpandedYay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CmsEvent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Record<string, { count: number; attendees: Array<{ userId: string; displayName: string | null; avatarUrl: string | null; profession: string | null; joinedAt: string }> }>>({});

  function loadRequests() {
    setReqLoading(true);
    const qs: Record<string, string> = { type: 'etkinlik', status: reqStatus };
    if (reqSource) qs.source = reqSource;
    adminApi.listContentRequests(qs)
      .then(r => setRequests(r.data)).catch(() => {}).finally(() => setReqLoading(false));
  }

  function loadEvents() {
    setEvLoading(true);
    adminApi.listEvents(typeFilter || undefined)
      .then(setEvents).catch(() => {}).finally(() => setEvLoading(false));
  }

  useEffect(() => { loadRequests(); }, [reqStatus, reqSource]); // eslint-disable-line
  useEffect(() => { if (tab === 'yayinda') loadEvents(); }, [tab, typeFilter]); // eslint-disable-line

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

  function openCreate() { setEditItem(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true); }

  function openEdit(item: CmsEvent) {
    setEditItem(item);
    setForm({
      slug: item.slug, title: item.title, type: item.type,
      dateStart: item.dateStart?.slice(0, 16) ?? '',
      dateEnd: item.dateEnd?.slice(0, 16) ?? '',
      location: item.location ?? '', description: item.description ?? '',
      registrationUrl: item.registrationUrl ?? '',
      meetingUrl: item.meetingUrl ?? '',
      maxCapacity: item.maxCapacity != null ? String(item.maxCapacity) : '',
      isCancelled: item.isCancelled ?? false,
      isPublished: item.isPublished,
    });
    setFormError(''); setShowForm(true);
  }

  const loadAttendees = useCallback((id: string) => {
    if (attendees[id]) return;
    adminApi.listEventAttendees(id).then(data => setAttendees(a => ({ ...a, [id]: data }))).catch(() => {});
  }, [attendees]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      const payload = {
        slug: form.slug, title: form.title, type: form.type,
        dateStart: form.dateStart,
        dateEnd: form.dateEnd || null,
        location: form.location || null,
        description: form.description || null,
        registrationUrl: form.registrationUrl || null,
        meetingUrl: form.meetingUrl || null,
        maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity, 10) : null,
        isCancelled: form.isCancelled,
        isPublished: form.isPublished,
      };
      if (editItem) { await adminApi.updateEvent(editItem.id, payload); }
      else { await adminApi.createEvent(payload); }
      setShowForm(false); loadEvents();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    try { await adminApi.deleteEvent(id); loadEvents(); }
    finally { setDeleting(null); }
  }

  const inp = 'w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]';
  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';

  return (
    <div className="max-w-5xl">
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editItem ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void save(e)} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label>
                  <input required className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Etkinlik başlığı…" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Slug *</label>
                  <input required className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="etkinlik-slug" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Tür</label>
                  <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(EVENT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Başlangıç *</label>
                  <input required type="datetime-local" className={inp} value={form.dateStart} onChange={e => setForm(f => ({ ...f, dateStart: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Bitiş</label>
                  <input type="datetime-local" className={inp} value={form.dateEnd} onChange={e => setForm(f => ({ ...f, dateEnd: e.target.value }))} /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Lokasyon</label>
                  <input className={inp} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="İstanbul / Online" /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Kısa Açıklama</label>
                  <textarea rows={2} className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Etkinlik hakkında kısa açıklama…" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Kayıt Linki</label>
                  <input className={inp} value={form.registrationUrl} onChange={e => setForm(f => ({ ...f, registrationUrl: e.target.value }))} placeholder="https://…" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Toplantı Linki</label>
                  <input className={inp} value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} placeholder="https://meet.google.com/…" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Kapasite</label>
                  <input type="number" min="1" className={inp} value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value }))} placeholder="100" /></div>
                <div className="flex items-end gap-4 pb-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isCancelled" checked={form.isCancelled} onChange={e => setForm(f => ({ ...f, isCancelled: e.target.checked }))} className="rounded border-gray-300" />
                    <label htmlFor="isCancelled" className="text-sm text-gray-700">İptal edildi</label>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded border-gray-300" />
                  <label htmlFor="isPublished" className="text-sm text-gray-700">Yayınlandı</label>
                </div>
              </div>
              {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
              <button onClick={(e) => void save(e as unknown as React.FormEvent)} disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                {saving ? 'Kaydediliyor…' : editItem ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Etkinlikler</h1>
        <p className="text-sm text-gray-500 mt-1">Gelen etkinlik talepleri ve yayındaki etkinlikler</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button onClick={() => setTab('talepler')}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${tab === 'talepler' ? 'border-[#26496b] text-[#26496b] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Gelen Talepler
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{requests.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
        <button onClick={() => setTab('yayinda')}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${tab === 'yayinda' ? 'border-[#26496b] text-[#26496b] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Yayındaki Etkinlikler
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
              {reqStatus === 'pending' ? 'Bekleyen etkinlik talebi yok.' : 'Talep bulunamadı.'}
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

      {/* ── Yayındaki Etkinlikler ── */}
      {tab === 'yayinda' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <select className={sel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Tüm Türler</option>
              {Object.entries(EVENT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56]">
              + Yeni Etkinlik
            </button>
          </div>
          {evLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Etkinlik bulunamadı.</div>
          ) : (
            <div className="space-y-2">
              {events.map(item => {
                const isOpen = expandedYay === item.id;
                const grad = EVENT_GRADS[item.type] ?? EVENT_GRADS.other;
                const icon = EVENT_ICONS[item.type] ?? '📅';
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      {/* Type avatar */}
                      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl shadow-sm select-none"
                        style={{ background: grad }}>
                        {icon}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.isPublished ? 'Yayında' : 'Taslak'}
                          </span>
                          {item.isCancelled && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">İptal</span>}
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">{EVENT_TYPES[item.type] ?? item.type}</span>
                          {item.attendeeCount != null && item.attendeeCount > 0 && (
                            <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">{item.attendeeCount} katılımcı</span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-gray-900 leading-snug">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(item.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {item.location && ` · ${item.location}`}
                        </p>
                      </div>
                      {/* Action buttons — always visible */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button title="Düzenle" onClick={() => { openEdit(item); setExpandedYay(null); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors">
                          <IcoEdit />
                        </button>
                        <button title="Sil" disabled={deleting === item.id} onClick={() => void handleDelete(item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <IcoTrash />
                        </button>
                        <button title={isOpen ? 'Kapat' : 'Detaylar'}
                          onClick={() => { const next = isOpen ? null : item.id; setExpandedYay(next); if (next) loadAttendees(item.id); }}
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
                          {item.maxCapacity != null && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Kapasite</p><p className="text-sm text-gray-700">{item.maxCapacity}</p></div>}
                          {item.registrationUrl && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Kayıt Linki</p><a href={item.registrationUrl} target="_blank" rel="noreferrer" className="text-sm text-[#26496b] hover:underline break-all">{item.registrationUrl}</a></div>}
                          {item.meetingUrl && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Toplantı Linki</p><a href={item.meetingUrl} target="_blank" rel="noreferrer" className="text-sm text-[#26496b] hover:underline break-all">{item.meetingUrl}</a></div>}
                        </div>
                        {(() => { const att = attendees[item.id]; return att && att.count > 0 ? (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Katılımcılar ({att.count})</p>
                            <div className="flex flex-wrap gap-2">
                              {att.attendees.slice(0, 20).map(a => (
                                <div key={a.userId} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-2 py-1">
                                  <div className="w-5 h-5 rounded-full bg-[#26496b] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                    {a.displayName?.[0]?.toUpperCase() ?? '?'}
                                  </div>
                                  <span className="text-xs text-gray-700">{a.displayName ?? 'Kullanıcı'}</span>
                                </div>
                              ))}
                              {att.count > 20 && <span className="text-xs text-gray-400 self-center">+{att.count - 20} kişi daha</span>}
                            </div>
                          </div>
                        ) : null; })()}
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
