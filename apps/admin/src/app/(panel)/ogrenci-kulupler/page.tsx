'use client';

import { useEffect, useState } from 'react';
import { adminApi, type StudentClubItem, type ClubNewsItem, type ClubEventItem } from '@/lib/api';
import { TIER_CFG } from '@/lib/mutfak-data';

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', active: 'Aktif', suspended: 'Askıya Alındı' };
const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
};
const STATUS_GRAD: Record<string, string> = {
  pending: 'linear-gradient(135deg,#f59e0b,#d97706)',
  active: 'linear-gradient(135deg,#22c55e,#16a34a)',
  suspended: 'linear-gradient(135deg,#ef4444,#dc2626)',
};

const EMPTY_FORM = {
  name: '', slug: '', university: '', city: '', contactName: '',
  contactEmail: '', contactPhone: '', website: '', memberCount: '',
  description: '', activities: '',
};

type RepDetail = { id: string; email: string; displayName: string | null; membershipTier: string };

const MOCK_CLUBS = [
  {
    id: 'mock-1', name: 'İTÜ Haritacılık ve Jeodezi Kulübü', slug: 'itu-haritacilik',
    university: 'İstanbul Teknik Üniversitesi', city: 'İstanbul',
    contactName: 'Ahmet Kurt', contactEmail: 'haritacilik@itu.edu.tr',
    contactPhone: '+90 212 285 37 37', website: 'https://harita.itu.edu.tr',
    memberCount: 85, description: 'İTÜ bünyesinde faaliyet gösteren haritacılık kulübü.',
    activities: 'Arazi ölçümü atölyeleri, uydu görüntü işleme eğitimleri, kariyer günleri, ulusal harita olimpiyatları',
    logoKey: null, status: 'active' as const, adminNotes: null,
    representativeId: 'mock-rep-1', createdAt: '2026-05-17T00:00:00.000Z', updatedAt: '2026-05-17T00:00:00.000Z',
  },
  {
    id: 'mock-2', name: 'Hacettepe Üniversitesi Geomatik Kulübü', slug: 'hu-geomatik',
    university: 'Hacettepe Üniversitesi', city: 'Ankara',
    contactName: 'Zeynep Demir', contactEmail: 'geomatik@hacettepe.edu.tr',
    contactPhone: '+90 312 305 10 00', website: null,
    memberCount: 62, description: 'Geomatik mühendisliği öğrencilerinin buluşma noktası.',
    activities: 'CBS yazılım eğitimleri, sektör gezileri, mezun buluşmaları',
    logoKey: null, status: 'active' as const, adminNotes: null,
    representativeId: 'mock-rep-2', createdAt: '2026-05-10T00:00:00.000Z', updatedAt: '2026-05-10T00:00:00.000Z',
  },
  {
    id: 'mock-3', name: 'YTÜ Harita Mühendisliği Kulübü', slug: 'ytu-harita',
    university: 'Yıldız Teknik Üniversitesi', city: 'İstanbul',
    contactName: 'Mert Özkan', contactEmail: 'harita@ytu.edu.tr',
    contactPhone: null, website: null,
    memberCount: 41, description: null,
    activities: 'Drone eğitimleri, proje yarışmaları',
    logoKey: null, status: 'pending' as const, adminNotes: null,
    representativeId: 'mock-rep-3', createdAt: '2026-05-18T00:00:00.000Z', updatedAt: '2026-05-18T00:00:00.000Z',
  },
];

const MOCK_REP_DETAILS: Record<string, RepDetail> = {
  'mock-1': { id: 'mock-rep-1', email: 'ahmet.kurt@itu.edu.tr',         displayName: 'Ahmet Kurt',   membershipTier: 'haritailesi_genc'    },
  'mock-2': { id: 'mock-rep-2', email: 'zeynep.demir@hacettepe.edu.tr', displayName: 'Zeynep Demir', membershipTier: 'new_graduate_member'  },
  'mock-3': { id: 'mock-rep-3', email: 'mert.ozkan@ytu.edu.tr',         displayName: 'Mert Özkan',   membershipTier: 'haritailesi_genc'    },
};

type SubTab = 'info' | 'news' | 'events';

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

function clubInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function OgrenciKulupsPage() {
  const [items, setItems] = useState<StudentClubItem[]>(MOCK_CLUBS);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<StudentClubItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<Record<string, SubTab>>({});

  const [repSearch, setRepSearch] = useState<Record<string, string>>({});
  const [repResults, setRepResults] = useState<Record<string, Array<RepDetail>>>({});
  const [repLoading, setRepLoading] = useState<Record<string, boolean>>({});
  const [repAssigning, setRepAssigning] = useState<string | null>(null);
  const [repDetails, setRepDetails] = useState<Record<string, RepDetail>>(MOCK_REP_DETAILS);
  const [showAssignSearch, setShowAssignSearch] = useState<Record<string, boolean>>({});

  const [clubNews, setClubNews] = useState<Record<string, ClubNewsItem[]>>({});
  const [newsLoading, setNewsLoading] = useState<Record<string, boolean>>({});
  const [newsForm, setNewsForm] = useState<Record<string, { title: string; summary: string; body: string }>>({});
  const [newsAdding, setNewsAdding] = useState<string | null>(null);
  const [showNewsForm, setShowNewsForm] = useState<string | null>(null);

  const [clubEvents, setClubEvents] = useState<Record<string, ClubEventItem[]>>({});
  const [eventsLoading, setEventsLoading] = useState<Record<string, boolean>>({});
  const [eventForm, setEventForm] = useState<Record<string, { title: string; description: string; eventDate: string; location: string; registrationUrl: string }>>({});
  const [eventAdding, setEventAdding] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState<string | null>(null);

  function load() {
    setLoading(true);
    adminApi.listStudentClubs(statusFilter || undefined)
      .then(data => { if (data.length > 0) setItems(data); })
      .catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  function getSubTab(id: string): SubTab { return subTab[id] ?? 'info'; }

  async function loadRepDetails(clubId: string, userId: string) {
    try {
      const u = await adminApi.getUser(userId);
      setRepDetails(d => ({ ...d, [clubId]: { id: u.id, email: u.email, displayName: u.displayName, membershipTier: u.membershipTier } }));
    } catch { /* ignore */ }
  }

  async function openExpanded(id: string) {
    const isOpen = expanded === id;
    setExpanded(isOpen ? null : id);
    if (!isOpen) {
      const club = items.find(c => c.id === id);
      if (club?.representativeId && !repDetails[id] && !id.startsWith('mock-')) {
        void loadRepDetails(id, club.representativeId);
      }
      if (!clubNews[id]) loadNews(id);
      if (!clubEvents[id]) loadEvents(id);
    }
  }

  async function loadNews(clubId: string) {
    setNewsLoading(l => ({ ...l, [clubId]: true }));
    try { const data = await adminApi.listClubNews(clubId); setClubNews(n => ({ ...n, [clubId]: data })); }
    catch { /* ignore */ }
    finally { setNewsLoading(l => ({ ...l, [clubId]: false })); }
  }

  async function loadEvents(clubId: string) {
    setEventsLoading(l => ({ ...l, [clubId]: true }));
    try { const data = await adminApi.listClubEvents(clubId); setClubEvents(e => ({ ...e, [clubId]: data })); }
    catch { /* ignore */ }
    finally { setEventsLoading(l => ({ ...l, [clubId]: false })); }
  }

  async function addNews(clubId: string) {
    const f = newsForm[clubId];
    if (!f?.title) return;
    setNewsAdding(clubId);
    try {
      await adminApi.createClubNews(clubId, { title: f.title, ...(f.summary ? { summary: f.summary } : {}), ...(f.body ? { body: f.body } : {}) });
      setNewsForm(n => ({ ...n, [clubId]: { title: '', summary: '', body: '' } }));
      setShowNewsForm(null);
      await loadNews(clubId);
    } catch { /* ignore */ }
    finally { setNewsAdding(null); }
  }

  async function deleteNews(clubId: string, newsId: string) {
    if (!confirm('Bu haberi silmek istiyor musunuz?')) return;
    await adminApi.deleteClubNews(newsId);
    await loadNews(clubId);
  }

  async function addEvent(clubId: string) {
    const f = eventForm[clubId];
    if (!f?.title || !f?.eventDate) return;
    setEventAdding(clubId);
    try {
      await adminApi.createClubEvent(clubId, {
        title: f.title, eventDate: f.eventDate,
        ...(f.description ? { description: f.description } : {}),
        ...(f.location ? { location: f.location } : {}),
        ...(f.registrationUrl ? { registrationUrl: f.registrationUrl } : {}),
      });
      setEventForm(e => ({ ...e, [clubId]: { title: '', description: '', eventDate: '', location: '', registrationUrl: '' } }));
      setShowEventForm(null);
      await loadEvents(clubId);
    } catch { /* ignore */ }
    finally { setEventAdding(null); }
  }

  async function deleteEvent(clubId: string, eventId: string) {
    if (!confirm('Bu etkinliği silmek istiyor musunuz?')) return;
    await adminApi.deleteClubEvent(eventId);
    await loadEvents(clubId);
  }

  function openCreate() { setEditItem(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); }
  function openEdit(item: StudentClubItem) {
    setEditItem(item);
    setForm({
      name: item.name, slug: item.slug, university: item.university, city: item.city,
      contactName: item.contactName, contactEmail: item.contactEmail,
      contactPhone: item.contactPhone ?? '', website: item.website ?? '',
      memberCount: item.memberCount ? String(item.memberCount) : '',
      description: item.description ?? '', activities: item.activities ?? '',
    });
    setError(''); setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {
        name: form.name, slug: form.slug, university: form.university, city: form.city,
        contactName: form.contactName, contactEmail: form.contactEmail,
        ...(form.contactPhone ? { contactPhone: form.contactPhone } : {}),
        ...(form.website ? { website: form.website } : {}),
        ...(form.memberCount ? { memberCount: parseInt(form.memberCount, 10) } : {}),
        ...(form.description ? { description: form.description } : {}),
        ...(form.activities ? { activities: form.activities } : {}),
      };
      if (editItem) await adminApi.updateStudentClub(editItem.id, payload);
      else await adminApi.createStudentClub(payload);
      setShowForm(false); load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function changeStatus(id: string, status: 'active' | 'suspended' | 'pending') {
    setUpdating(id);
    try { await adminApi.updateStudentClubStatus(id, status); load(); }
    finally { setUpdating(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu kulübü silmek istediğinizden emin misiniz?')) return;
    setUpdating(id);
    try { await adminApi.deleteStudentClub(id); load(); }
    finally { setUpdating(null); }
  }

  async function searchUsers(clubId: string, q: string) {
    setRepSearch(s => ({ ...s, [clubId]: q }));
    if (q.length < 2) { setRepResults(r => ({ ...r, [clubId]: [] })); return; }
    setRepLoading(r => ({ ...r, [clubId]: true }));
    try {
      const [r1, r2] = await Promise.all([
        adminApi.listUsers({ search: q, tier: 'haritailesi_genc' }),
        adminApi.listUsers({ search: q, tier: 'new_graduate_member' }),
      ]);
      const merged = [...r1.data, ...r2.data];
      const seen = new Set<string>();
      const unique = merged.filter(u => { if (seen.has(u.id)) return false; seen.add(u.id); return true; });
      setRepResults(r => ({ ...r, [clubId]: unique.map(u => ({ id: u.id, email: u.email, displayName: u.displayName, membershipTier: u.membershipTier })) }));
    } catch { /* ignore */ }
    finally { setRepLoading(r => ({ ...r, [clubId]: false })); }
  }

  async function assignRep(clubId: string, userId: string | null) {
    setRepAssigning(clubId);
    try {
      await adminApi.assignClubRepresentative(clubId, userId);
      if (userId) {
        const found = (repResults[clubId] ?? []).find(u => u.id === userId);
        if (found) setRepDetails(d => ({ ...d, [clubId]: found }));
      } else {
        setRepDetails(d => { const n = { ...d }; delete n[clubId]; return n; });
      }
      load();
      setRepSearch(s => ({ ...s, [clubId]: '' }));
      setRepResults(r => ({ ...r, [clubId]: [] }));
      setShowAssignSearch(s => ({ ...s, [clubId]: false }));
    } catch { /* ignore */ }
    finally { setRepAssigning(null); }
  }

  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';
  const inp = 'w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]';

  const activeCount = items.filter(i => i.status === 'active').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <div className="max-w-5xl">
      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editItem ? 'Kulübü Düzenle' : 'Yeni Öğrenci Kulübü'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void save(e)} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Kulüp Adı *</label>
                  <input required className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Slug *</label>
                  <input required className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="haritacilik-kulubu" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Üniversite *</label>
                  <input required className={inp} value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Şehir *</label>
                  <input required className={inp} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Üye Sayısı</label>
                  <input type="number" className={inp} value={form.memberCount} onChange={e => setForm(f => ({ ...f, memberCount: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Sorumlu Kişi *</label>
                  <input required className={inp} value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">E-posta *</label>
                  <input required type="email" className={inp} value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Telefon</label>
                  <input className={inp} value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Website</label>
                  <input className={inp} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…" /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Kulüp Hakkında</label>
                  <textarea rows={3} className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Faaliyetler</label>
                  <textarea rows={2} className={inp} value={form.activities} onChange={e => setForm(f => ({ ...f, activities: e.target.value }))} /></div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
              <button onClick={(e) => void save(e as unknown as React.FormEvent)} disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                {saving ? 'Kaydediliyor…' : editItem ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Öğrenci Kulüpleri</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-400">
              <span className="font-bold text-gray-800">{activeCount}</span> aktif
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {pendingCount} onay bekliyor
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tüm Durumlar</option>
            <option value="pending">Bekleyen</option>
            <option value="active">Aktif</option>
            <option value="suspended">Askıya Alınmış</option>
          </select>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56]">
            + Yeni Kulüp
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-4">🎓</div>
          <p className="text-gray-500 font-medium">Henüz öğrenci kulübü yok.</p>
          <button onClick={openCreate} className="mt-4 text-sm text-[#26496b] font-semibold hover:underline">İlk kulübü ekle →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const isOpen = expanded === item.id;
            const grad = STATUS_GRAD[item.status] ?? 'linear-gradient(135deg,#64748b,#475569)';
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  {/* Club avatar */}
                  <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm select-none"
                    style={{ background: grad }}>
                    {clubInitials(item.name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                      {item.representativeId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Temsilci ✓</span>
                      )}
                      {item.memberCount != null && (
                        <span className="text-[10px] text-gray-400">{item.memberCount} üye</span>
                      )}
                      <span className="text-[10px] text-gray-400">· {item.city}</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 leading-snug">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.university}</p>
                  </div>

                  {/* Action buttons — always visible */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button title="Düzenle" onClick={() => openEdit(item)}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors">
                      <IcoEdit />
                    </button>
                    {item.status !== 'active' ? (
                      <button title="Onayla" disabled={updating === item.id} onClick={() => void changeStatus(item.id, 'active')}
                        className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    ) : (
                      <button title="Askıya Al" disabled={updating === item.id} onClick={() => void changeStatus(item.id, 'suspended')}
                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button title="Sil" disabled={updating === item.id} onClick={() => void handleDelete(item.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                      <IcoTrash />
                    </button>
                    <button title={isOpen ? 'Kapat' : 'Detaylar'} onClick={() => void openExpanded(item.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                      <IcoChevron open={isOpen} />
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    {/* Sub-tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50/60 px-4">
                      {(['info', 'news', 'events'] as SubTab[]).map(t => (
                        <button key={t} onClick={() => setSubTab(s => ({ ...s, [item.id]: t }))}
                          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                            getSubTab(item.id) === t
                              ? 'border-[#26496b] text-[#26496b]'
                              : 'border-transparent text-gray-400 hover:text-gray-700'
                          }`}>
                          {t === 'info' ? '📋 Bilgiler' : t === 'news' ? '📰 Haberler' : '📅 Etkinlikler'}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 space-y-3">

                      {/* Info tab */}
                      {getSubTab(item.id) === 'info' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">İletişim</p>
                              <p className="text-xs text-gray-700">{item.contactEmail}</p>
                              {item.contactPhone && <p className="text-xs text-gray-500 mt-0.5">{item.contactPhone}</p>}
                              {item.website && <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#26496b] hover:underline block mt-1">{item.website}</a>}
                            </div>
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Detaylar</p>
                              {item.memberCount && <p className="text-sm font-semibold text-gray-800">{item.memberCount} üye</p>}
                              <p className="text-xs text-gray-500 mt-0.5">Eklendi: {new Date(item.createdAt).toLocaleDateString('tr-TR')}</p>
                            </div>
                          </div>
                          {item.activities && (
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Faaliyetler</p>
                              <p className="text-sm text-gray-700">{item.activities}</p>
                            </div>
                          )}
                          {item.adminNotes && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Admin Notu</p>
                              <p className="text-sm text-amber-800">{item.adminNotes}</p>
                            </div>
                          )}
                          {/* Temsilci */}
                          <div className="bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Kulüp Temsilcisi</p>
                            {repDetails[item.id] ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-base shrink-0">🎓</div>
                                    <div>
                                      <p className="text-sm text-gray-800 leading-snug">
                                        <span className="font-semibold">{repDetails[item.id]?.displayName}</span>
                                        {(() => {
                                          const cfg = TIER_CFG[repDetails[item.id]!.membershipTier ?? ''];
                                          return cfg ? <span className={`ml-1.5 text-xs font-medium ${cfg.accent}`}>"{cfg.label}"</span> : null;
                                        })()}
                                      </p>
                                      {repDetails[item.id]?.email && (
                                        <p className="text-xs text-gray-400 mt-0.5">{repDetails[item.id]?.email}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button onClick={() => setShowAssignSearch(s => ({ ...s, [item.id]: !s[item.id] }))}
                                      className="text-xs px-2.5 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-white transition-colors">
                                      Değiştir
                                    </button>
                                    <button disabled={repAssigning === item.id} onClick={() => void assignRep(item.id, null)}
                                      className="text-xs px-2.5 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
                                      Kaldır
                                    </button>
                                  </div>
                                </div>
                                {showAssignSearch[item.id] && (
                                  <div className="pt-1 space-y-1.5">
                                    <div className="relative">
                                      <input className="w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] bg-white"
                                        placeholder="Üye ara (isim veya e-posta)…"
                                        value={repSearch[item.id] ?? ''}
                                        onChange={e => void searchUsers(item.id, e.target.value)} />
                                      {repLoading[item.id] && <span className="absolute right-3 top-2.5 text-xs text-gray-400">…</span>}
                                    </div>
                                    {(repResults[item.id] ?? []).length > 0 && (
                                      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                                        {(repResults[item.id] ?? []).map(u => (
                                          <button key={u.id} disabled={repAssigning === item.id}
                                            onClick={() => void assignRep(item.id, u.id)}
                                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center justify-between disabled:opacity-50">
                                            <span className="flex items-center gap-2">
                                              <span className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-sm shrink-0">🎓</span>
                                              <span>
                                                <span className="font-medium text-sm text-gray-800 block leading-tight">{u.displayName ?? '—'}</span>
                                                <span className="text-gray-400 text-xs">{u.email}</span>
                                              </span>
                                              {(() => { const cfg = TIER_CFG[u.membershipTier]; return cfg ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.accent} ml-1`}>{cfg.label}</span> : null; })()}
                                            </span>
                                            <span className="text-xs text-[#26496b] font-semibold shrink-0">Ata →</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {showAssignSearch[item.id] ? (
                                  <div className="space-y-1.5">
                                    <div className="relative">
                                      <input className="w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] bg-white"
                                        placeholder="Üye ara (isim veya e-posta)…"
                                        value={repSearch[item.id] ?? ''}
                                        onChange={e => void searchUsers(item.id, e.target.value)} />
                                      {repLoading[item.id] && <span className="absolute right-3 top-2.5 text-xs text-gray-400">…</span>}
                                    </div>
                                    {(repResults[item.id] ?? []).length > 0 && (
                                      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                                        {(repResults[item.id] ?? []).map(u => (
                                          <button key={u.id} disabled={repAssigning === item.id}
                                            onClick={() => void assignRep(item.id, u.id)}
                                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center justify-between disabled:opacity-50">
                                            <span className="flex items-center gap-2">
                                              <span className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-sm shrink-0">🎓</span>
                                              <span>
                                                <span className="font-medium text-sm text-gray-800 block leading-tight">{u.displayName ?? '—'}</span>
                                                <span className="text-gray-400 text-xs">{u.email}</span>
                                              </span>
                                              {(() => { const cfg = TIER_CFG[u.membershipTier]; return cfg ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.accent} ml-1`}>{cfg.label}</span> : null; })()}
                                            </span>
                                            <span className="text-xs text-[#26496b] font-semibold shrink-0">Ata →</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    <button onClick={() => setShowAssignSearch(s => ({ ...s, [item.id]: false }))}
                                      className="text-xs text-gray-400 hover:text-gray-600">İptal</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setShowAssignSearch(s => ({ ...s, [item.id]: true }))}
                                    className="text-xs font-semibold px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:bg-white hover:border-[#26496b] hover:text-[#26496b] transition-colors">
                                    + Temsilci Ata
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* News tab */}
                      {getSubTab(item.id) === 'news' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              <span className="font-bold text-gray-700">{(clubNews[item.id] ?? []).length}</span> haber
                            </p>
                            <button onClick={() => setShowNewsForm(showNewsForm === item.id ? null : item.id)}
                              className="text-xs font-semibold px-3 py-1.5 bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56]">
                              + Haber Ekle
                            </button>
                          </div>
                          {showNewsForm === item.id && (
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                              <input className={`${inp} bg-white`} placeholder="Başlık *"
                                value={newsForm[item.id]?.title ?? ''}
                                onChange={e => setNewsForm(n => ({ ...n, [item.id]: { ...n[item.id] ?? { title: '', summary: '', body: '' }, title: e.target.value } }))} />
                              <textarea rows={2} className={`${inp} bg-white`} placeholder="Özet"
                                value={newsForm[item.id]?.summary ?? ''}
                                onChange={e => setNewsForm(n => ({ ...n, [item.id]: { ...n[item.id] ?? { title: '', summary: '', body: '' }, summary: e.target.value } }))} />
                              <textarea rows={3} className={`${inp} bg-white`} placeholder="İçerik (opsiyonel)"
                                value={newsForm[item.id]?.body ?? ''}
                                onChange={e => setNewsForm(n => ({ ...n, [item.id]: { ...n[item.id] ?? { title: '', summary: '', body: '' }, body: e.target.value } }))} />
                              <div className="flex gap-2">
                                <button onClick={() => setShowNewsForm(null)} className="flex-1 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100">İptal</button>
                                <button disabled={newsAdding === item.id} onClick={() => void addNews(item.id)}
                                  className="flex-1 py-2 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                                  {newsAdding === item.id ? 'Ekleniyor…' : 'Kaydet'}
                                </button>
                              </div>
                            </div>
                          )}
                          {newsLoading[item.id] ? (
                            <div className="text-xs text-gray-400 py-6 text-center">Yükleniyor…</div>
                          ) : (clubNews[item.id] ?? []).length === 0 ? (
                            <div className="text-xs text-gray-400 py-6 text-center">Henüz haber yok.</div>
                          ) : (
                            <div className="space-y-2">
                              {(clubNews[item.id] ?? []).map(n => (
                                <div key={n.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-base shrink-0 select-none">📰</div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 leading-snug">{n.title}</p>
                                    {n.summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.summary}</p>}
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.publishedAt).toLocaleDateString('tr-TR')}</p>
                                  </div>
                                  <button onClick={() => void deleteNews(item.id, n.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Events tab */}
                      {getSubTab(item.id) === 'events' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              <span className="font-bold text-gray-700">{(clubEvents[item.id] ?? []).length}</span> etkinlik
                            </p>
                            <button onClick={() => setShowEventForm(showEventForm === item.id ? null : item.id)}
                              className="text-xs font-semibold px-3 py-1.5 bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56]">
                              + Etkinlik Ekle
                            </button>
                          </div>
                          {showEventForm === item.id && (
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                              <input className={`${inp} bg-white`} placeholder="Etkinlik Adı *"
                                value={eventForm[item.id]?.title ?? ''}
                                onChange={e => setEventForm(f => ({ ...f, [item.id]: { ...f[item.id] ?? { title: '', description: '', eventDate: '', location: '', registrationUrl: '' }, title: e.target.value } }))} />
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">Tarih *</label>
                                  <input type="datetime-local" className={`${inp} bg-white`}
                                    value={eventForm[item.id]?.eventDate ?? ''}
                                    onChange={e => setEventForm(f => ({ ...f, [item.id]: { ...f[item.id] ?? { title: '', description: '', eventDate: '', location: '', registrationUrl: '' }, eventDate: e.target.value } }))} />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">Konum</label>
                                  <input className={`${inp} bg-white`} placeholder="Yer / Online"
                                    value={eventForm[item.id]?.location ?? ''}
                                    onChange={e => setEventForm(f => ({ ...f, [item.id]: { ...f[item.id] ?? { title: '', description: '', eventDate: '', location: '', registrationUrl: '' }, location: e.target.value } }))} />
                                </div>
                              </div>
                              <textarea rows={2} className={`${inp} bg-white`} placeholder="Açıklama"
                                value={eventForm[item.id]?.description ?? ''}
                                onChange={e => setEventForm(f => ({ ...f, [item.id]: { ...f[item.id] ?? { title: '', description: '', eventDate: '', location: '', registrationUrl: '' }, description: e.target.value } }))} />
                              <input className={`${inp} bg-white`} placeholder="Kayıt URL (opsiyonel)"
                                value={eventForm[item.id]?.registrationUrl ?? ''}
                                onChange={e => setEventForm(f => ({ ...f, [item.id]: { ...f[item.id] ?? { title: '', description: '', eventDate: '', location: '', registrationUrl: '' }, registrationUrl: e.target.value } }))} />
                              <div className="flex gap-2">
                                <button onClick={() => setShowEventForm(null)} className="flex-1 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100">İptal</button>
                                <button disabled={eventAdding === item.id} onClick={() => void addEvent(item.id)}
                                  className="flex-1 py-2 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                                  {eventAdding === item.id ? 'Ekleniyor…' : 'Kaydet'}
                                </button>
                              </div>
                            </div>
                          )}
                          {eventsLoading[item.id] ? (
                            <div className="text-xs text-gray-400 py-6 text-center">Yükleniyor…</div>
                          ) : (clubEvents[item.id] ?? []).length === 0 ? (
                            <div className="text-xs text-gray-400 py-6 text-center">Henüz etkinlik yok.</div>
                          ) : (
                            <div className="space-y-2">
                              {(clubEvents[item.id] ?? []).map(ev => {
                                const d = new Date(ev.eventDate);
                                const isPast = d < new Date();
                                return (
                                  <div key={ev.id} className={`bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3 ${isPast ? 'opacity-60' : ''}`}>
                                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm"
                                      style={{ background: isPast ? 'linear-gradient(135deg,#94a3b8,#64748b)' : 'linear-gradient(135deg,#26496b,#1e3a56)' }}>
                                      <p className="text-[11px] font-bold text-white leading-none">{d.getDate()}</p>
                                      <p className="text-[8px] text-white/80 uppercase tracking-wide">{d.toLocaleString('tr-TR', { month: 'short' })}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-800 leading-snug">{ev.title}</p>
                                      {ev.location && <p className="text-xs text-gray-500 mt-0.5">📍 {ev.location}</p>}
                                      {isPast && <span className="text-[10px] text-gray-400 mt-0.5 block">Tamamlandı</span>}
                                    </div>
                                    <button onClick={() => void deleteEvent(item.id, ev.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
  );
}
