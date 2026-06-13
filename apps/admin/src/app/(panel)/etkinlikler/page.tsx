'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi, type CmsEvent, type ContentRequestItem, type EventSpeaker, type EventSession, type EventSponsor, type RegQuestion, type RegAnswer } from '@/lib/api';
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
  price: '0', paymentUrl: '',
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
  const [tab, setTab] = useState<'talepler' | 'sponsorluk' | 'yayinda'>('talepler');
  const [sponsorRequests, setSponsorRequests] = useState<ContentRequestItem[]>([]);
  const [sponsorReqLoading, setSponsorReqLoading] = useState(false);
  const [sponsorReqStatus, setSponsorReqStatus] = useState('pending');

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
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [expandedYay, setExpandedYay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CmsEvent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Record<string, { count: number; attendees: Array<{ id: string; userId: string | null; displayName: string | null; avatarUrl: string | null; profession: string | null; joinedAt: string; ticketCode: string | null; ticketTier: string; checkedIn: boolean; checkedInAt: string | null; registrationType: string }> }>>({});

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

  function loadSponsorRequests() {
    setSponsorReqLoading(true);
    adminApi.listContentRequests({ type: 'sponsorluk', status: sponsorReqStatus })
      .then(r => setSponsorRequests(r.data)).catch(() => {}).finally(() => setSponsorReqLoading(false));
  }

  useEffect(() => { loadRequests(); }, [reqStatus, reqSource]); // eslint-disable-line
  useEffect(() => { if (tab === 'yayinda') loadEvents(); }, [tab, typeFilter]); // eslint-disable-line
  useEffect(() => { if (tab === 'sponsorluk') loadSponsorRequests(); }, [tab, sponsorReqStatus]); // eslint-disable-line

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
      price: String(item.price ?? 0),
      paymentUrl: item.paymentUrl ?? '',
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
        price: parseInt(form.price || '0', 10),
        paymentUrl: form.paymentUrl || null,
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
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Fiyat (kuruş, 0 = ücretsiz)</label>
                  <input type="number" min="0" className={inp} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">
                    Ödeme Linki (iyzico vb.) {parseInt(form.price || '0', 10) > 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    className={inp}
                    required={parseInt(form.price || '0', 10) > 0}
                    value={form.paymentUrl}
                    onChange={e => setForm(f => ({ ...f, paymentUrl: e.target.value }))}
                    placeholder="https://iyzi.co/…"
                  />
                  {parseInt(form.price || '0', 10) > 0 && !form.paymentUrl && (
                    <p className="text-xs text-amber-600 mt-1">Ücretli etkinlik için ödeme linki zorunludur.</p>
                  )}
                </div>
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
        <button onClick={() => setTab('sponsorluk')}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${tab === 'sponsorluk' ? 'border-[#26496b] text-[#26496b] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Sponsorluk Talepleri
          {sponsorRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{sponsorRequests.filter(r => r.status === 'pending').length}</span>
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

      {/* ── Sponsorluk Talepleri ── */}
      {tab === 'sponsorluk' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-gray-500">İşbirliği formundan gelen sponsorluk başvuruları</p>
            <select className={sel} value={sponsorReqStatus} onChange={e => setSponsorReqStatus(e.target.value)}>
              <option value="pending">Bekleyen</option>
              <option value="approved">Onaylanan</option>
              <option value="rejected">Reddedilen</option>
            </select>
          </div>
          {sponsorReqLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : sponsorRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              {sponsorReqStatus === 'pending' ? 'Bekleyen sponsorluk talebi yok.' : 'Talep bulunamadı.'}
            </div>
          ) : (
            <div className="space-y-2">
              {sponsorRequests.map(r => {
                const statusCls = r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                const statusLabel = r.status === 'pending' ? 'Bekliyor' : r.status === 'approved' ? 'Onaylandı' : 'Reddedildi';
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusCls}`}>{statusLabel}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Sponsorluk</span>
                          <span className="text-[10px] text-gray-400">{r.displayName} · {new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900">{r.title}</p>
                        {r.description && <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{r.description}</p>}
                        {r.contactInfo && <p className="text-xs text-gray-400 mt-1">📞 {r.contactInfo}</p>}
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => adminApi.reviewContentRequest(r.id, 'approved').then(loadSponsorRequests).catch(() => {})}
                            className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">✓ Onayla</button>
                          <button onClick={() => adminApi.reviewContentRequest(r.id, 'rejected').then(loadSponsorRequests).catch(() => {})}
                            className="px-3 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50">✕ Reddet</button>
                        </div>
                      )}
                    </div>
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
            <div className="flex items-center gap-2">
              <select className={sel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Tüm Türler</option>
                {Object.entries(EVENT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-[#26496b] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  title="Liste">☰ Liste</button>
                <button onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-[#26496b] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  title="Kanban">⊞ Kanban</button>
              </div>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56]">
              + Yeni Etkinlik
            </button>
          </div>
          {evLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Etkinlik bulunamadı.</div>
          ) : viewMode === 'kanban' ? (
            (() => {
              const now = new Date();
              const cols = [
                { key: 'taslak', label: 'Taslak', filter: (e: CmsEvent) => !e.isPublished && !e.isCancelled, color: 'bg-gray-50 border-gray-200' },
                { key: 'yaklasan', label: 'Yaklaşan', filter: (e: CmsEvent) => e.isPublished && !e.isCancelled && new Date(e.dateStart) > now, color: 'bg-blue-50 border-blue-200' },
                { key: 'gectimiz', label: 'Geçmiş', filter: (e: CmsEvent) => e.isPublished && !e.isCancelled && new Date(e.dateStart) <= now, color: 'bg-green-50 border-green-200' },
                { key: 'iptal', label: 'İptal', filter: (e: CmsEvent) => !!e.isCancelled, color: 'bg-red-50 border-red-200' },
              ];
              return (
                <div className="grid grid-cols-4 gap-3 min-h-[300px]">
                  {cols.map(col => (
                    <div key={col.key} className={`rounded-xl border ${col.color} p-3`}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">{col.label} ({events.filter(col.filter).length})</p>
                      <div className="space-y-2">
                        {events.filter(col.filter).map(item => {
                          const grad = EVENT_GRADS[item.type] ?? EVENT_GRADS.other;
                          return (
                            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => { const next = expandedYay === item.id ? null : item.id; setExpandedYay(null); setViewMode('list'); if (next) setTimeout(() => { setExpandedYay(next); loadAttendees(next); }, 50); }}>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: grad }}>
                                  {EVENT_ICONS[item.type] ?? '📅'}
                                </div>
                                <p className="text-xs font-semibold text-gray-900 leading-snug truncate">{item.title}</p>
                              </div>
                              <p className="text-[10px] text-gray-400">{new Date(item.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</p>
                              {item.attendeeCount != null && item.attendeeCount > 0 && (
                                <p className="text-[10px] text-teal-600 mt-0.5">{item.attendeeCount} katılımcı</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
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
                          {(item.price ?? 0) > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">₺{((item.price ?? 0) / 100).toFixed(2)}</span>}
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
                        <button title="Kopyala" disabled={copying === item.id}
                          onClick={async () => {
                            if (!confirm(`"${item.title}" etkinliğinin bir kopyası oluşturulacak. Devam edilsin mi?`)) return;
                            setCopying(item.id);
                            try { await adminApi.copyEvent(item.id); loadEvents(); }
                            catch { /* ignore */ } finally { setCopying(null); }
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-40 text-sm">⧉</button>
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
                      <EventDetailPanel
                        item={item}
                        attendees={attendees[item.id] ?? undefined}
                        onAttendeesLoad={() => loadAttendees(item.id)}
                        onAttendeesUpdate={(updated) => setAttendees(a => ({ ...a, [item.id]: updated }))}
                      />
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

// ─── Event Detail Panel (Sekmeli) ─────────────────────────────────────────────

type DetailTab = 'genel' | 'sponsor' | 'konusmaci' | 'gundem' | 'katilimci' | 'soru' | 'davetiye' | 'bekleme';

type AttendeeRow = { id: string; userId: string | null; displayName: string | null; avatarUrl: string | null; profession: string | null; joinedAt: string; ticketCode: string | null; ticketTier: string; checkedIn: boolean; checkedInAt: string | null; registrationType: string };

function EventDetailPanel({
  item, attendees, onAttendeesLoad, onAttendeesUpdate,
}: {
  item: CmsEvent;
  attendees: { count: number; attendees: AttendeeRow[] } | undefined;
  onAttendeesLoad: () => void;
  onAttendeesUpdate: (updated: { count: number; attendees: AttendeeRow[] }) => void;
}) {
  const [tab, setTab] = useState<DetailTab>('genel');
  const [sponsors, setSponsors] = useState<EventSponsor[]>([]);
  const [sponsorsLoaded, setSponsorsLoaded] = useState(false);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [questions, setQuestions] = useState<RegQuestion[]>([]);
  const [answers, setAnswers] = useState<RegAnswer[]>([]);
  const [spLoaded, setSpLoaded] = useState(false);
  const [ssLoaded, setSsLoaded] = useState(false);
  const [qLoaded, setQLoaded] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({ companyName: '', websiteUrl: '', tier: 'bronz', description: '' });
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  const [addingSponsor, setAddingSponsor] = useState(false);
  const [sponsorUploading, setSponsorUploading] = useState(false);

  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteChannel, setInviteChannel] = useState<'email' | 'whatsapp' | 'both'>('email');
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionPostId, setDiscussionPostId] = useState<string | null>(item.mutfakPostId ?? null);
  const [discussionError, setDiscussionError] = useState<string | null>(null);

  // Analytics
  const [stats, setStats] = useState<{ viewCount: number; memberRegistrations: number; publicRegistrations: number; totalRegistrations: number; checkedInCount: number; waitlistCount: number; maxCapacity: number | null; fillRate: number | null; registrationTrend: Array<{ day: string; count: number }> } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Waitlist
  const [waitlist, setWaitlist] = useState<Array<{ id: string; userId: string | null; email: string | null; displayName: string | null; notifiedAt: string | null; createdAt: string }>>([]);
  const [waitlistLoaded, setWaitlistLoaded] = useState(false);

  // Speaker form
  const [spForm, setSpForm] = useState({ name: '', title: '', affiliation: '', bio: '', linkedinUrl: '', avatarUrl: '' });
  const [spPhotoFile, setSpPhotoFile] = useState<File | null>(null);
  const [spPhotoUploading, setSpPhotoUploading] = useState(false);
  const [addingSp, setAddingSp] = useState(false);

  // Session form
  const [ssForm, setSsForm] = useState({ title: '', sessionType: 'talk', hall: '', startTime: '', endTime: '', speakerId: '', description: '' });
  const [addingSs, setAddingSs] = useState(false);

  // Question form
  const [qForm, setQForm] = useState({ question: '', questionType: 'text', isRequired: false, options: '' });
  const [addingQ, setAddingQ] = useState(false);

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';

  function loadSpeakers() {
    if (spLoaded) return;
    adminApi.listSpeakers(item.id).then(d => { setSpeakers(d ?? []); setSpLoaded(true); }).catch(() => {});
  }
  function loadSessions() {
    if (ssLoaded) return;
    adminApi.listSessions(item.id).then(d => { setSessions(d ?? []); setSsLoaded(true); }).catch(() => {});
  }
  function loadQuestions() {
    if (qLoaded) return;
    adminApi.listRegQuestions(item.id).then(d => { setQuestions(d ?? []); setQLoaded(true); }).catch(() => {});
    adminApi.listRegAnswers(item.id).then(d => { setAnswers(d ?? []); }).catch(() => {});
  }

  function loadSponsors() {
    if (sponsorsLoaded) return;
    adminApi.listSponsors(item.id).then(d => { setSponsors(d ?? []); setSponsorsLoaded(true); }).catch(() => {});
  }

  function loadWaitlist() {
    if (waitlistLoaded) return;
    adminApi.listWaitlist(item.id).then(d => { setWaitlist(d.waitlist); setWaitlistLoaded(true); }).catch(() => {});
  }

  function loadStats() {
    setStatsLoading(true);
    adminApi.getEventStats(item.id).then(d => setStats(d)).catch(() => {}).finally(() => setStatsLoading(false));
  }

  function onTab(t: DetailTab) {
    setTab(t);
    if (t === 'katilimci') onAttendeesLoad();
    if (t === 'konusmaci') loadSpeakers();
    if (t === 'gundem') { loadSpeakers(); loadSessions(); }
    if (t === 'soru') loadQuestions();
    if (t === 'sponsor') loadSponsors();
    if (t === 'bekleme') loadWaitlist();
    if (t === 'genel' && !stats) loadStats();
  }

  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'member' | 'public'>('all');

  function toggleCheckin(attendee: AttendeeRow) {
    const rt = attendee.registrationType as 'member' | 'public';
    adminApi.checkinAttendance(attendee.id, rt).then(updated => {
      if (!attendees) return;
      onAttendeesUpdate({
        count: attendees.count,
        attendees: attendees.attendees.map(a => a.id === attendee.id ? { ...a, ...updated } : a),
      });
    }).catch(() => {});
  }

  const SESSION_TYPE_LABELS: Record<string, string> = {
    talk: 'Sunum', panel: 'Panel', keynote: 'Açılış Konuşması',
    workshop: 'Atölye', break: 'Ara', other: 'Diğer',
  };
  const SESSION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    proposal:  { label: 'Teklif',     color: 'bg-gray-100 text-gray-600' },
    confirmed: { label: 'Onaylandı',  color: 'bg-blue-100 text-blue-700' },
    announced: { label: 'Duyuruldu', color: 'bg-amber-100 text-amber-700' },
    published: { label: 'Yayında',   color: 'bg-green-100 text-green-700' },
    refused:   { label: 'Reddedildi', color: 'bg-red-100 text-red-600' },
  };

  const fillPct = item.maxCapacity && (item.attendeeCount ?? 0) > 0
    ? Math.min(100, ((item.attendeeCount ?? 0) / item.maxCapacity) * 100) : 0;

  const TIER_LABELS: Record<string, { label: string; color: string }> = {
    platin: { label: '💎 Platin', color: 'bg-sky-100 text-sky-800 border-sky-300' },
    altin:  { label: '🥇 Altın',  color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    gumus:  { label: '🥈 Gümüş',  color: 'bg-slate-100 text-slate-700 border-slate-300' },
    bronz:  { label: '🥉 Bronz',  color: 'bg-amber-100 text-amber-700 border-amber-300' },
  };
  function tierLabel(tier: string) {
    return TIER_LABELS[tier] ?? { label: `✦ ${tier}`, color: 'bg-gray-100 text-gray-600 border-gray-300' };
  }

  const TABS: { key: DetailTab; label: string }[] = [
    { key: 'genel', label: 'Genel' },
    { key: 'sponsor', label: `Sponsorlar${sponsors.length ? ` (${sponsors.length})` : ''}` },
    { key: 'konusmaci', label: 'Konuşmacılar' },
    { key: 'gundem', label: 'Gündem' },
    { key: 'katilimci', label: `Katılımcılar${attendees ? ` (${attendees.count})` : ''}` },
    { key: 'bekleme', label: `Bekleme${waitlist.length ? ` (${waitlist.length})` : ''}` },
    { key: 'soru', label: 'Kayıt Soruları' },
    { key: 'davetiye', label: 'Davetiye' },
  ];

  return (
    <div className="border-t border-gray-100 bg-gray-50/60">
      {/* Sekme başlıkları */}
      <div className="flex gap-0.5 px-4 pt-3 border-b border-gray-200 bg-white overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-[#26496b] text-[#26496b]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* ── Sponsorlar ── */}
        {tab === 'sponsor' && (
          <div className="space-y-3">
            {/* Tier açıklaması */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
              {Object.entries(TIER_LABELS).map(([k, v]) => (
                <span key={k} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${v.color}`}>{v.label}</span>
              ))}
              <span className="text-[10px] text-gray-400 self-center ml-1">— Altın en üstte gösterilir</span>
            </div>

            {/* Sponsor listesi */}
            {sponsors.filter(s => s.isActive).length === 0 && !addingSponsor && (
              <p className="text-xs text-gray-400 py-2">Henüz sponsor eklenmemiş.</p>
            )}
            <div className="space-y-2">
              {sponsors.map(sp => {
                const tier = tierLabel(sp.tier);
                return (
                  <div key={sp.id} className={`bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 group ${!sp.isActive ? 'opacity-40' : ''}`}>
                    {sp.logoKey ? (
                      <img src={`/api/v1/media?key=${encodeURIComponent(sp.logoKey)}`} alt={sp.companyName} className="w-10 h-10 object-contain rounded border border-gray-100 shrink-0 bg-white" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-lg shrink-0">🏢</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tier.color}`}>{tier.label}</span>
                        {!sp.isActive && <span className="text-[9px] text-gray-400">Pasif</span>}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{sp.companyName}</p>
                      {sp.websiteUrl && <a href={sp.websiteUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#26496b] hover:underline">{sp.websiteUrl}</a>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => adminApi.updateSponsor(sp.id, { isActive: !sp.isActive }).then(u => setSponsors(s => s.map(x => x.id === sp.id ? u : x))).catch(() => {})}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 text-[10px] transition-colors"
                        title={sp.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                      >{sp.isActive ? '⏸' : '▶'}</button>
                      <button
                        onClick={() => adminApi.deleteSponsor(sp.id).then(() => setSponsors(s => s.filter(x => x.id !== sp.id))).catch(() => {})}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Yeni sponsor formu */}
            {addingSponsor ? (
              <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500">Yeni Sponsor</p>
                <div className="grid grid-cols-2 gap-2">
                  <input className={`${inp} col-span-2`} placeholder="Şirket Adı *" value={sponsorForm.companyName} onChange={e => setSponsorForm(f => ({ ...f, companyName: e.target.value }))} />
                  <input className={inp} placeholder="Website URL" value={sponsorForm.websiteUrl} onChange={e => setSponsorForm(f => ({ ...f, websiteUrl: e.target.value }))} />
                  <div className="space-y-1">
                    <select className={inp} value={['platin','altin','gumus','bronz'].includes(sponsorForm.tier) ? sponsorForm.tier : 'ozel'}
                      onChange={e => setSponsorForm(f => ({ ...f, tier: e.target.value === 'ozel' ? '' : e.target.value }))}>
                      <option value="platin">💎 Platin</option>
                      <option value="altin">🥇 Altın</option>
                      <option value="gumus">🥈 Gümüş</option>
                      <option value="bronz">🥉 Bronz</option>
                      <option value="ozel">✏️ Özel (serbest metin)</option>
                    </select>
                    {!['platin','altin','gumus','bronz'].includes(sponsorForm.tier) && (
                      <input className={inp} placeholder="Sponsor türünü yazın (ör: Ana Sponsor, Destekçi…)"
                        value={sponsorForm.tier} onChange={e => setSponsorForm(f => ({ ...f, tier: e.target.value }))} />
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-400 mb-1">Logo (PNG/JPG)</label>
                    <input type="file" accept="image/*" className="text-xs w-full"
                      onChange={e => setSponsorLogoFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <textarea className={`${inp} col-span-2 resize-none`} rows={2} placeholder="Kısa açıklama (isteğe bağlı)" value={sponsorForm.description} onChange={e => setSponsorForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setAddingSponsor(false); setSponsorLogoFile(null); }} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                  <button
                    disabled={sponsorUploading || !sponsorForm.companyName.trim()}
                    onClick={async () => {
                      setSponsorUploading(true);
                      try {
                        let logoKey: string | undefined;
                        if (sponsorLogoFile) {
                          const uploaded = await adminApi.uploadSponsorLogo(sponsorLogoFile);
                          logoKey = uploaded.key;
                        }
                        const dto: Partial<EventSponsor> = {
                          companyName: sponsorForm.companyName,
                          tier: sponsorForm.tier,
                        };
                        if (sponsorForm.websiteUrl) dto.websiteUrl = sponsorForm.websiteUrl;
                        if (logoKey) dto.logoKey = logoKey;
                        if (sponsorForm.description) dto.description = sponsorForm.description;
                        const created = await adminApi.createSponsor(item.id, dto);
                        setSponsors(s => [...s, created]);
                        setSponsorForm({ companyName: '', websiteUrl: '', tier: 'bronz', description: '' });
                        setSponsorLogoFile(null);
                        setAddingSponsor(false);
                      } catch { /* ignore */ } finally {
                        setSponsorUploading(false);
                      }
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {sponsorUploading && <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    {sponsorUploading ? 'Yükleniyor…' : 'Ekle'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingSponsor(true)} className="text-xs font-medium text-[#26496b] hover:underline">+ Sponsor Ekle</button>
            )}
          </div>
        )}

        {/* ── Genel ── */}
        {tab === 'genel' && (
          <div className="space-y-4">
            {/* İstatistik kartları */}
            {(() => {
              const memberCount = item.attendeeCount ?? 0;
              const publicCount = item.publicCount ?? 0;
              const total = memberCount + publicCount;
              const totalFillPct = item.maxCapacity ? Math.min(100, (total / item.maxCapacity) * 100) : 0;
              return (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                      <p className="text-xl font-black text-[#26496b]">{total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Toplam Kayıt</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                      <p className="text-xl font-black text-gray-700">{item.maxCapacity ?? '∞'}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Kapasite</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                      <p className="text-xl font-black text-emerald-600">{item.maxCapacity ? `%${Math.round(totalFillPct)}` : '—'}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Doluluk</p>
                    </div>
                  </div>

                  {/* Üye / Anonim ayrımı */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#26496b] text-white flex items-center justify-center text-sm shrink-0">👤</div>
                      <div>
                        <p className="text-lg font-black text-[#26496b]">{memberCount}</p>
                        <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Üye Kayıt</p>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-xl border border-purple-100 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center text-sm shrink-0">🌐</div>
                      <div>
                        <p className="text-lg font-black text-purple-700">{publicCount}</p>
                        <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wide">Anonim Kayıt</p>
                      </div>
                    </div>
                  </div>

                  {item.maxCapacity != null && (
                    <div className="bg-white rounded-xl border border-gray-100 p-3">
                      <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                        <span>{total} kayıtlı ({memberCount} üye + {publicCount} anonim)</span>
                        <span>{item.maxCapacity - total > 0 ? `${item.maxCapacity - total} yer kaldı` : 'Dolu'}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                        <div className="h-2 bg-[#26496b] transition-all" style={{ width: item.maxCapacity ? `${Math.min(100, (memberCount / item.maxCapacity) * 100)}%` : '0%' }} />
                        <div className="h-2 bg-purple-400 transition-all" style={{ width: item.maxCapacity ? `${Math.min(100, (publicCount / item.maxCapacity) * 100)}%` : '0%' }} />
                      </div>
                      <div className="flex gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[9px] text-[#26496b] font-medium"><span className="w-2 h-2 rounded-full bg-[#26496b] inline-block" />Üye</span>
                        <span className="flex items-center gap-1 text-[9px] text-purple-500 font-medium"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />Anonim</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Analitik Dashboard */}
            {stats ? (
              <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Analitik</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-blue-700">{stats.viewCount}</p>
                    <p className="text-[9px] text-blue-500 uppercase tracking-wide">Görüntüleme</p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-teal-700">{stats.checkedInCount}</p>
                    <p className="text-[9px] text-teal-500 uppercase tracking-wide">Check-in</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-amber-700">{stats.waitlistCount}</p>
                    <p className="text-[9px] text-amber-500 uppercase tracking-wide">Bekleme</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-base font-black text-gray-700">{stats.memberRegistrations}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Üye Kayıt</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-base font-black text-gray-700">{stats.publicRegistrations}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Anonim Kayıt</p>
                  </div>
                </div>
                {stats.registrationTrend.length > 0 && (
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1.5">Son 30 Gün Kayıt Trendi</p>
                    <div className="flex items-end gap-0.5 h-12">
                      {(() => {
                        const max = Math.max(...stats.registrationTrend.map(t => Number(t.count)), 1);
                        return stats.registrationTrend.map((t, i) => (
                          <div key={i} title={`${t.day}: ${t.count} kayıt`}
                            className="flex-1 bg-[#26496b] rounded-sm min-h-[2px] transition-all"
                            style={{ height: `${(Number(t.count) / max) * 100}%` }} />
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : statsLoading ? (
              <div className="w-full py-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Analitikler yükleniyor…
              </div>
            ) : null}

            {item.description && (
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Açıklama</p>
                <p className="text-xs text-gray-700 leading-relaxed">{item.description}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {item.registrationUrl && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Kayıt Linki</p><a href={item.registrationUrl} target="_blank" rel="noreferrer" className="text-xs text-[#26496b] hover:underline break-all">{item.registrationUrl}</a></div>}
              {item.meetingUrl && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Toplantı Linki</p><a href={item.meetingUrl} target="_blank" rel="noreferrer" className="text-xs text-[#26496b] hover:underline break-all">{item.meetingUrl}</a></div>}
              {(item.price ?? 0) > 0 && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Bilet Fiyatı</p><p className="text-xs text-amber-700 font-bold">₺{((item.price ?? 0) / 100).toFixed(2)}</p></div>}
              {item.paymentUrl && <div><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ödeme Linki</p><a href={item.paymentUrl} target="_blank" rel="noreferrer" className="text-xs text-[#26496b] hover:underline break-all">{item.paymentUrl}</a></div>}
            </div>
          </div>
        )}

        {/* ── Konuşmacılar ── */}
        {tab === 'konusmaci' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {speakers.map(sp => (
                <div key={sp.id} className="bg-white border border-gray-100 rounded-xl p-3 flex gap-3 min-w-[220px] max-w-xs relative group">
                  <div className="w-10 h-10 rounded-full bg-[#26496b] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {sp.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{sp.name}</p>
                    {sp.title && <p className="text-[11px] text-gray-500">{sp.title}</p>}
                    {sp.affiliation && <p className="text-[11px] text-gray-400">{sp.affiliation}</p>}
                  </div>
                  <button
                    onClick={() => adminApi.deleteSpeaker(sp.id).then(() => setSpeakers(s => s.filter(x => x.id !== sp.id))).catch(() => {})}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                  >✕</button>
                </div>
              ))}
            </div>
            {addingSp ? (
              <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 mb-2">Yeni Konuşmacı</p>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder="Ad Soyad *" value={spForm.name} onChange={e => setSpForm(f => ({ ...f, name: e.target.value }))} />
                  <input className={inp} placeholder="Ünvan (Prof. Dr.)" value={spForm.title} onChange={e => setSpForm(f => ({ ...f, title: e.target.value }))} />
                  <input className={inp} placeholder="Kurum" value={spForm.affiliation} onChange={e => setSpForm(f => ({ ...f, affiliation: e.target.value }))} />
                  <input className={inp} placeholder="LinkedIn URL" value={spForm.linkedinUrl} onChange={e => setSpForm(f => ({ ...f, linkedinUrl: e.target.value }))} />
                  <div className="col-span-2 space-y-1">
                    <label className="block text-[10px] text-gray-400">Fotoğraf</label>
                    <input type="file" accept="image/*" className="text-[10px] w-full" onChange={e => setSpPhotoFile(e.target.files?.[0] ?? null)} />
                    {!spPhotoFile && <input className={inp} placeholder="veya fotoğraf URL" value={spForm.avatarUrl} onChange={e => setSpForm(f => ({ ...f, avatarUrl: e.target.value }))} />}
                  </div>
                  <textarea className={`${inp} col-span-2 resize-none`} rows={2} placeholder="Kısa biyografi" value={spForm.bio} onChange={e => setSpForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setAddingSp(false); setSpPhotoFile(null); }} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                  <button
                    disabled={spPhotoUploading}
                    onClick={async () => {
                      if (!spForm.name.trim()) return;
                      setSpPhotoUploading(true);
                      try {
                        let avatarUrl = spForm.avatarUrl;
                        if (spPhotoFile) {
                          const uploaded = await adminApi.uploadSpeakerPhoto(spPhotoFile);
                          avatarUrl = `/api/v1/media?key=${encodeURIComponent(uploaded.key)}`;
                        }
                        const spDto: Partial<EventSpeaker> = { name: spForm.name };
                        if (spForm.title) spDto.title = spForm.title;
                        if (spForm.affiliation) spDto.affiliation = spForm.affiliation;
                        if (spForm.bio) spDto.bio = spForm.bio;
                        if (spForm.linkedinUrl) spDto.linkedinUrl = spForm.linkedinUrl;
                        if (avatarUrl) spDto.avatarUrl = avatarUrl;
                        const sp = await adminApi.createSpeaker(item.id, spDto);
                        setSpeakers(s => [...s, sp]);
                        setSpForm({ name: '', title: '', affiliation: '', bio: '', linkedinUrl: '', avatarUrl: '' });
                        setSpPhotoFile(null);
                        setAddingSp(false);
                      } catch { /* ignore */ } finally {
                        setSpPhotoUploading(false);
                      }
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {spPhotoUploading && <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    {spPhotoUploading ? 'Yükleniyor…' : 'Ekle'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingSp(true)} className="text-xs font-medium text-[#26496b] hover:underline">+ Konuşmacı Ekle</button>
            )}
          </div>
        )}

        {/* ── Gündem ── */}
        {tab === 'gundem' && (
          <div className="space-y-2">
            {sessions.map(ss => (
              <div key={ss.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-start gap-3 group relative">
                <div className="text-center w-14 shrink-0">
                  {ss.startTime && (
                    <p className="text-xs font-bold text-[#26496b]">
                      {new Date(ss.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                    </p>
                  )}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                    ss.sessionType === 'break' ? 'bg-gray-100 text-gray-500' :
                    ss.sessionType === 'keynote' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{SESSION_TYPE_LABELS[ss.sessionType] ?? ss.sessionType}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{ss.title}</p>
                    {(() => {
                      const sStatus = (ss as EventSession & { status?: string }).status ?? 'confirmed';
                      const st = SESSION_STATUS_LABELS[sStatus] ?? SESSION_STATUS_LABELS['confirmed']!;
                      return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>;
                    })()}
                  </div>
                  {ss.speakerName && <p className="text-[11px] text-gray-500">{ss.speakerName}{ss.speakerAffiliation ? ` — ${ss.speakerAffiliation}` : ''}</p>}
                  {ss.hall && <p className="text-[10px] text-gray-400">{ss.hall}</p>}
                  <select
                    className="mt-1 text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-600 focus:outline-none"
                    value={(ss as EventSession & { status?: string }).status ?? 'confirmed'}
                    onChange={e => {
                      const newStatus = e.target.value;
                      adminApi.updateSession(ss.id, { status: newStatus } as Partial<EventSession>)
                        .then(u => setSessions(s => s.map(x => x.id === ss.id ? u : x))).catch(() => {});
                    }}
                  >
                    {Object.entries(SESSION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => adminApi.deleteSession(ss.id).then(() => setSessions(s => s.filter(x => x.id !== ss.id))).catch(() => {})}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all shrink-0 text-xs"
                >✕</button>
              </div>
            ))}
            {addingSs ? (
              <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 mb-2">Yeni Oturum</p>
                <div className="grid grid-cols-2 gap-2">
                  <input className={`${inp} col-span-2`} placeholder="Oturum Başlığı *" value={ssForm.title} onChange={e => setSsForm(f => ({ ...f, title: e.target.value }))} />
                  <select className={inp} value={ssForm.sessionType} onChange={e => setSsForm(f => ({ ...f, sessionType: e.target.value }))}>
                    <option value="talk">Sunum</option><option value="keynote">Açılış Konuşması</option>
                    <option value="panel">Panel</option><option value="workshop">Atölye</option>
                    <option value="break">Ara</option><option value="other">Diğer</option>
                  </select>
                  <select className={inp} value={ssForm.speakerId} onChange={e => setSsForm(f => ({ ...f, speakerId: e.target.value }))}>
                    <option value="">— Konuşmacı seç —</option>
                    {speakers.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                  </select>
                  <input className={inp} placeholder="Başlangıç saati" type="datetime-local" value={ssForm.startTime} onChange={e => setSsForm(f => ({ ...f, startTime: e.target.value }))} />
                  <input className={inp} placeholder="Bitiş saati" type="datetime-local" value={ssForm.endTime} onChange={e => setSsForm(f => ({ ...f, endTime: e.target.value }))} />
                  <input className={`${inp} col-span-2`} placeholder="Salon (örn: Ana Salon, Salon A)" value={ssForm.hall} onChange={e => setSsForm(f => ({ ...f, hall: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setAddingSs(false)} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                  <button
                    onClick={() => {
                      if (!ssForm.title.trim()) return;
                      const ssDto: Partial<EventSession> = { title: ssForm.title, sessionType: ssForm.sessionType };
                      if (ssForm.hall) ssDto.hall = ssForm.hall;
                      if (ssForm.speakerId) ssDto.speakerId = ssForm.speakerId;
                      if (ssForm.startTime) ssDto.startTime = ssForm.startTime;
                      if (ssForm.endTime) ssDto.endTime = ssForm.endTime;
                      adminApi.createSession(item.id, ssDto).then(ss => { setSessions(s => [...s, ss]); setSsForm({ title: '', sessionType: 'talk', hall: '', startTime: '', endTime: '', speakerId: '', description: '' }); setAddingSs(false); }).catch(() => {});
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56]"
                  >Ekle</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingSs(true)} className="text-xs font-medium text-[#26496b] hover:underline">+ Oturum Ekle</button>
            )}
          </div>
        )}

        {/* ── Katılımcılar ── */}
        {tab === 'katilimci' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Filtre */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {([
                  { key: 'all',    label: `Tümü${attendees ? ` (${attendees.count})` : ''}` },
                  { key: 'member', label: `👤 Üye${attendees ? ` (${attendees.attendees.filter(a => a.registrationType === 'member').length})` : ''}` },
                  { key: 'public', label: `🌐 Anonim${attendees ? ` (${attendees.attendees.filter(a => a.registrationType === 'public').length})` : ''}` },
                ] as const).map(({ key, label }) => (
                  <button key={key} onClick={() => setAttendeeFilter(key)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${attendeeFilter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {attendees && <span className="text-[10px] text-gray-400">{attendees.attendees.filter(a => a.checkedIn).length} check-in</span>}
                <a href={`/etkinlikler/checkin/${item.id}`}
                  className="text-[10px] font-medium text-[#26496b] bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
                  📷 QR Tarama →
                </a>
              </div>
            </div>
            {attendees && attendees.count > 0 ? (
              <div className="space-y-1.5">
                {attendees.attendees.filter(a => attendeeFilter === 'all' || a.registrationType === attendeeFilter).map(a => (
                  <div key={a.id} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.checkedIn ? 'bg-emerald-500 text-white' : 'bg-[#26496b] text-white'}`}>
                      {a.checkedIn ? '✓' : (a.displayName?.[0]?.toUpperCase() ?? '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{a.displayName ?? 'Kullanıcı'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {a.ticketCode && <span className="text-[9px] text-gray-400 font-mono">{a.ticketCode.split('-')[0]?.toUpperCase()}</span>}
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${a.ticketTier === 'vip' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{a.ticketTier.toUpperCase()}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${a.registrationType === 'public' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{a.registrationType === 'public' ? 'Anonim' : 'Üye'}</span>
                        {a.checkedIn && a.checkedInAt && <span className="text-[9px] text-emerald-600">{new Date(a.checkedInAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCheckin(a)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${a.checkedIn ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >{a.checkedIn ? '✓ İçeride' : 'Check-in'}</button>
                  </div>
                ))}
                {attendees.attendees.filter(a => attendeeFilter === 'all' || a.registrationType === attendeeFilter).length === 0 && (
                  <p className="text-xs text-gray-400 py-2">Bu filtrede kayıt yok.</p>
                )}
              </div>
            ) : <p className="text-sm text-gray-400">Henüz kayıtlı katılımcı yok.</p>}
          </div>
        )}

        {/* ── Bekleme Listesi ── */}
        {tab === 'bekleme' && (
          <div className="space-y-2">
            {waitlist.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">Bekleme listesi boş.</p>
            ) : (
              <div className="space-y-1.5">
                {waitlist.map((w, i) => (
                  <div key={w.id} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{w.displayName ?? w.email ?? 'Kullanıcı'}</p>
                      <p className="text-[9px] text-gray-400">{new Date(w.createdAt).toLocaleDateString('tr-TR')}
                        {w.notifiedAt && <span className="ml-2 text-emerald-600">· Bildirildi</span>}
                      </p>
                    </div>
                    {w.userId ? (
                      <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Üye</span>
                    ) : (
                      <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">Anonim</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Kayıt Soruları ── */}
        {tab === 'soru' && (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 group">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  <p className="text-[10px] text-gray-400">{q.questionType}{q.isRequired ? ' · Zorunlu' : ''}{q.options?.length ? ` · ${q.options.join(', ')}` : ''}</p>
                </div>
                <button
                  onClick={() => adminApi.deleteRegQuestion(q.id).then(() => setQuestions(qs => qs.filter(x => x.id !== q.id))).catch(() => {})}
                  className="opacity-0 group-hover:opacity-100 text-xs text-gray-300 hover:text-red-500 transition-all"
                >✕</button>
              </div>
            ))}
            {addingQ ? (
              <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                <input className={inp} placeholder="Soru metni *" value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <select className={inp} value={qForm.questionType} onChange={e => setQForm(f => ({ ...f, questionType: e.target.value }))}>
                    <option value="text">Serbest metin</option>
                    <option value="select">Seçenekli</option>
                    <option value="checkbox">Onay kutusu</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={qForm.isRequired} onChange={e => setQForm(f => ({ ...f, isRequired: e.target.checked }))} />
                    Zorunlu
                  </label>
                </div>
                {qForm.questionType === 'select' && (
                  <input className={inp} placeholder="Seçenekler (virgülle ayır)" value={qForm.options} onChange={e => setQForm(f => ({ ...f, options: e.target.value }))} />
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setAddingQ(false)} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                  <button
                    onClick={() => {
                      if (!qForm.question.trim()) return;
                      const qDto: { question: string; questionType?: string; options?: string[]; isRequired?: boolean } = {
                        question: qForm.question, questionType: qForm.questionType, isRequired: qForm.isRequired,
                      };
                      if (qForm.questionType === 'select') qDto.options = qForm.options.split(',').map(s => s.trim()).filter(Boolean);
                      adminApi.createRegQuestion(item.id, qDto).then(q => { setQuestions(qs => [...qs, q]); setQForm({ question: '', questionType: 'text', isRequired: false, options: '' }); setAddingQ(false); }).catch(() => {});
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56]"
                  >Ekle</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingQ(true)} className="text-xs font-medium text-[#26496b] hover:underline">+ Soru Ekle</button>
            )}
            {answers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Cevaplar</p>
                <div className="space-y-1">
                  {answers.map((a, i) => (
                    <div key={i} className="text-xs text-gray-600 flex gap-2">
                      <span className="font-medium text-gray-800 shrink-0">{a.displayName}:</span>
                      <span className="text-gray-500">{a.question}</span>
                      <span>→</span>
                      <span>{a.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Davetiye ── */}
        {tab === 'davetiye' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-1">Üyelere Davetiye Gönder</p>
              <p className="text-xs text-gray-500 mb-4">
                Tüm aktif üyelere &quot;{item.title}&quot; etkinliğine davet gönderilir.
                WhatsApp için üyenin telefon numarası ve WhatsApp onayı gereklidir.
              </p>

              {/* Kanal seçimi */}
              <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
                {([
                  { key: 'email',    icon: '📧', label: 'E-posta' },
                  { key: 'whatsapp', icon: '💬', label: 'WhatsApp' },
                  { key: 'both',     icon: '📨', label: 'İkisi' },
                ] as const).map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setInviteChannel(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      inviteChannel === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {inviteChannel === 'whatsapp' && (
                <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-3">
                  Yalnızca WhatsApp onayı vermiş ve telefon numarası kayıtlı üyelere gönderilir.
                </p>
              )}

              {inviteResult && (
                <div className="mb-3 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium">{inviteResult}</div>
              )}

              <button
                disabled={inviting}
                onClick={() => {
                  const channelLabel = inviteChannel === 'email' ? 'e-posta' : inviteChannel === 'whatsapp' ? 'WhatsApp' : 'e-posta ve WhatsApp';
                  if (!confirm(`"${item.title}" etkinliği için tüm üyelere ${channelLabel} daveti gönderilecek. Devam edilsin mi?`)) return;
                  setInviting(true);
                  setInviteResult(null);
                  adminApi.sendInvitations(item.id, { channel: inviteChannel })
                    .then(r => {
                      const parts = [];
                      if (r.emailSent > 0) parts.push(`${r.emailSent} e-posta`);
                      if (r.whatsappSent > 0) parts.push(`${r.whatsappSent} WhatsApp`);
                      setInviteResult(`✓ Gönderildi: ${parts.join(', ') || '0 mesaj'}`);
                    })
                    .catch(() => setInviteResult('Hata oluştu.'))
                    .finally(() => setInviting(false));
                }}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 ${
                  inviteChannel === 'whatsapp' ? 'bg-[#25d366] hover:bg-[#1ebe5c]' :
                  inviteChannel === 'both' ? 'bg-[#26496b] hover:bg-[#1e3a56]' :
                  'bg-[#26496b] hover:bg-[#1e3a56]'
                }`}
              >
                {inviting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {inviting ? 'Gönderiliyor…' : (
                  inviteChannel === 'email' ? '📧 E-posta Gönder' :
                  inviteChannel === 'whatsapp' ? '💬 WhatsApp Gönder' :
                  '📨 E-posta + WhatsApp Gönder'
                )}
              </button>
            </div>

            {/* Mutfak Tartışma Odası */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-1">Mutfak Tartışma Odası</p>
              <p className="text-xs text-gray-500 mb-4">
                Etkinliğe bağlı bir Mutfak tartışma gönderisi oluşturulur. Üyeler etkinlik hakkında sorularını ve deneyimlerini paylaşabilir.
              </p>
              {discussionPostId ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium">✓ Tartışma odası aktif</span>
                  <a href={`/akis?post=${discussionPostId}`} target="_blank" rel="noreferrer"
                    className="text-xs text-[#26496b] hover:underline">Mutfak'ta görüntüle →</a>
                </div>
              ) : (
                <>
                  {discussionError && (
                    <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-2">{discussionError}</p>
                  )}
                  <button
                    disabled={discussionLoading}
                    onClick={() => {
                      setDiscussionLoading(true);
                      setDiscussionError(null);
                      adminApi.createDiscussionRoom(item.id)
                        .then(r => setDiscussionPostId(r.postId))
                        .catch((e: Error) => setDiscussionError(e.message ?? 'Bir hata oluştu.'))
                        .finally(() => setDiscussionLoading(false));
                    }}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#66aca9] hover:bg-[#4d8f8c] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {discussionLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    {discussionLoading ? 'Oluşturuluyor…' : '💬 Mutfak Tartışma Odası Oluştur'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
