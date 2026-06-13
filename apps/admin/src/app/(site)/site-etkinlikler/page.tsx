'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi, type CmsEvent } from '@/lib/api';

const TYPES: Record<string, string> = {
  webinar: 'Webinar', workshop: 'Atölye', conference: 'Konferans', meetup: 'Buluşma', other: 'Diğer',
};

const EMPTY: Partial<CmsEvent> = {
  slug: '', title: '', type: 'webinar',
  dateStart: '', dateEnd: '', location: '', description: '',
  registrationUrl: '', meetingUrl: '', maxCapacity: null,
  isCancelled: false, isPublished: false,
};

type Attendee = { id: string; userId: string | null; displayName: string | null; avatarUrl: string | null; profession: string | null; joinedAt: string; ticketCode: string | null; ticketTier: string; checkedIn: boolean; checkedInAt: string | null; registrationType: string };

export default function EtkinliklerPage() {
  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CmsEvent | null>(null);
  const [form, setForm] = useState<Partial<CmsEvent>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [attendeeModal, setAttendeeModal] = useState<{ event: CmsEvent; list: Attendee[]; loading: boolean } | null>(null);

  const loadEvents = useCallback(() => {
    setLoading(true);
    adminApi.listEvents(typeFilter || undefined)
      .then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function openCreate() { setEditItem(null); setForm(EMPTY); setFormError(''); setShowForm(true); }

  function openEdit(ev: CmsEvent) {
    setEditItem(ev);
    setForm({
      slug: ev.slug, title: ev.title, type: ev.type,
      dateStart: ev.dateStart?.slice(0, 16) ?? '',
      dateEnd: ev.dateEnd?.slice(0, 16) ?? '',
      location: ev.location ?? '', description: ev.description ?? '',
      registrationUrl: ev.registrationUrl ?? '', meetingUrl: ev.meetingUrl ?? '',
      maxCapacity: ev.maxCapacity ?? null,
      isCancelled: ev.isCancelled ?? false, isPublished: ev.isPublished,
    });
    setFormError(''); setShowForm(true);
  }

  async function handleSave() {
    if (!form.title?.trim() || !form.dateStart) { setFormError('Başlık ve başlangıç tarihi zorunlu.'); return; }
    if (!editItem && !form.slug?.trim()) { setFormError('Slug zorunlu.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editItem) { await adminApi.updateEvent(editItem.id, form as Parameters<typeof adminApi.updateEvent>[1]); }
      else { await adminApi.createEvent(form as Parameters<typeof adminApi.createEvent>[0]); }
      setShowForm(false); loadEvents();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" etkinliğini silmek istediğinize emin misiniz?`)) return;
    setDeleting(id);
    try { await adminApi.deleteEvent(id); setEvents(p => p.filter(e => e.id !== id)); }
    catch (e) { alert((e as Error).message); }
    finally { setDeleting(null); }
  }

  async function openAttendees(ev: CmsEvent) {
    setAttendeeModal({ event: ev, list: [], loading: true });
    try {
      const res = await adminApi.listEventAttendees(ev.id);
      setAttendeeModal({ event: ev, list: res.attendees, loading: false });
    } catch {
      setAttendeeModal({ event: ev, list: [], loading: false });
    }
  }

  async function togglePublish(ev: CmsEvent) {
    try {
      const updated = await adminApi.updateEvent(ev.id, { isPublished: !ev.isPublished });
      setEvents(p => p.map(e => e.id === ev.id ? updated : e));
    } catch (e) { alert((e as Error).message); }
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 focus:border-[var(--color-mavi)]';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etkinlikler</h1>
          <p className="text-sm text-gray-500 mt-1">Haritailesi.org etkinlik takvimi (Mutfak etkinliklerinden bağımsız)</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-mavi-acik)] transition-colors">
          + Etkinlik Ekle
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[['', 'Tümü'], ...Object.entries(TYPES)].map(([k, v]) => (
          <button key={k} onClick={() => setTypeFilter(typeFilter === (k ?? '') ? '' : (k ?? ''))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${(!k && !typeFilter) || typeFilter === k ? 'bg-[var(--color-mavi)] text-white border-[var(--color-mavi)]' : 'bg-white text-gray-600 border-gray-200 hover:border-[var(--color-mavi)]/40'}`}>
            {v}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-500">Yükleniyor…</p> : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">Etkinlik yok</p>
          <p className="text-sm">Yeni bir etkinlik ekleyin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-mavi)]/10 text-[var(--color-mavi)]">{TYPES[ev.type] ?? ev.type}</span>
                  {!ev.isPublished && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Taslak</span>}
                  {ev.isCancelled && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">İptal</span>}
                </div>
                <p className="font-semibold text-gray-900 truncate">{ev.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(ev.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {ev.location && ` · ${ev.location}`}
                  {ev.maxCapacity != null
                    ? ` · ${ev.attendeeCount ?? 0}/${ev.maxCapacity} katılımcı`
                    : ev.attendeeCount != null && ev.attendeeCount > 0
                      ? ` · ${ev.attendeeCount} katılımcı`
                      : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(ev.attendeeCount ?? 0) > 0 && (
                  <button onClick={() => void openAttendees(ev)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors">
                    {ev.attendeeCount} katılımcı
                  </button>
                )}
                <button onClick={() => void togglePublish(ev)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${ev.isPublished ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {ev.isPublished ? 'Yayında' : 'Yayınla'}
                </button>
                <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--color-mavi)] hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => void handleDelete(ev.id, ev.title)} disabled={deleting === ev.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 my-auto">
            <h3 className="font-semibold text-gray-900">{editItem ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h3>
            {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Başlık *</label><input className={inp} value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              {!editItem && <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Slug *</label><input className={inp} placeholder="ornek-etkinlik-2025" value={form.slug ?? ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>}
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Tür</label><select className={inp} value={form.type ?? 'webinar'} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Konum</label><input className={inp} value={form.location ?? ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç *</label><input type="datetime-local" className={inp} value={form.dateStart ?? ''} onChange={e => setForm(f => ({ ...f, dateStart: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label><input type="datetime-local" className={inp} value={form.dateEnd ?? ''} onChange={e => setForm(f => ({ ...f, dateEnd: e.target.value }))} /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Açıklama</label><textarea className={inp} rows={3} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Kayıt URL</label><input className={inp} value={form.registrationUrl ?? ''} onChange={e => setForm(f => ({ ...f, registrationUrl: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Online Toplantı URL</label><input className={inp} value={form.meetingUrl ?? ''} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Kapasite</label><input type="number" className={inp} value={form.maxCapacity ?? ''} onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value ? Number(e.target.value) : null }))} /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Kapak Görseli (image key)</label><input className={inp} placeholder="etkinlikler/kongre-2025.jpg" value={form.coverImageKey ?? ''} onChange={e => setForm(f => ({ ...f, coverImageKey: e.target.value || null }))} /></div>
              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isPublished ?? false} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded" /><span className="text-sm text-gray-700">Yayınla</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isCancelled ?? false} onChange={e => setForm(f => ({ ...f, isCancelled: e.target.checked }))} className="rounded" /><span className="text-sm text-gray-700">İptal</span></label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">İptal</button>
              <button onClick={() => void handleSave()} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--color-mavi)] text-white hover:bg-[var(--color-mavi-acik)] disabled:opacity-40 transition-colors">
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Katılımcı Modal */}
      {attendeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">{attendeeModal.event.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {attendeeModal.loading ? 'Yükleniyor…' : `${attendeeModal.list.length} katılımcı`}
                  {attendeeModal.event.maxCapacity != null && ` / ${attendeeModal.event.maxCapacity} kapasite`}
                </p>
              </div>
              <button onClick={() => setAttendeeModal(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {attendeeModal.loading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : attendeeModal.list.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Henüz katılımcı yok.</p>
              ) : (
                <div className="space-y-2 py-1">
                  {attendeeModal.list.map((a) => (
                    <div key={a.userId} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-mavi)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-mavi)] shrink-0">
                        {(a.displayName ?? '?')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.displayName ?? 'İsimsiz'}</p>
                        {a.profession && <p className="text-xs text-gray-400 truncate">{a.profession}</p>}
                      </div>
                      <p className="text-xs text-gray-400 ml-auto shrink-0">
                        {new Date(a.joinedAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
