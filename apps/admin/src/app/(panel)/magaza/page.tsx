'use client';

import { useEffect, useState } from 'react';
import { adminApi, type ContentRequestItem } from '@/lib/api';
import { STATUS_CLS as STATUS_COLORS, SOURCE_LABELS, SOURCE_COLORS } from '@/lib/ui';

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' };

const SOURCE_GRADS: Record<string, string> = {
  sahne: 'linear-gradient(135deg,#26496b,#1e3a56)',
  mutfak: 'linear-gradient(135deg,#66aca9,#4d8f8c)',
};

type Tab = 'talepler' | 'yayinda';

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

export default function MagazaPage() {
  const [tab, setTab] = useState<Tab>('talepler');

  const [requests, setRequests] = useState<ContentRequestItem[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sourceFilter, setSourceFilter] = useState('');
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [published, setPublished] = useState<ContentRequestItem[]>([]);
  const [pubLoading, setPubLoading] = useState(false);
  const [pubLoaded, setPubLoaded] = useState(false);
  const [pubSourceFilter, setPubSourceFilter] = useState('');
  const [expandedPub, setExpandedPub] = useState<string | null>(null);

  const [editItem, setEditItem] = useState<ContentRequestItem | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', contactInfo: '' });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingReq, setDeletingReq] = useState<string | null>(null);

  function loadRequests() {
    setReqLoading(true);
    const qs: Record<string, string> = { type: 'magaza' };
    if (statusFilter) qs.status = statusFilter;
    if (sourceFilter) qs.source = sourceFilter;
    adminApi.listContentRequests(qs)
      .then(r => setRequests(r.data)).catch(() => {}).finally(() => setReqLoading(false));
  }

  function loadPublished() {
    setPubLoading(true);
    const qs: Record<string, string> = { type: 'magaza', status: 'approved' };
    if (pubSourceFilter) qs.source = pubSourceFilter;
    adminApi.listContentRequests(qs)
      .then(r => setPublished(r.data)).catch(() => {}).finally(() => { setPubLoading(false); setPubLoaded(true); });
  }

  useEffect(() => { loadRequests(); }, [statusFilter, sourceFilter]); // eslint-disable-line
  useEffect(() => { if (tab === 'yayinda') { setPubLoaded(false); } }, [pubSourceFilter]); // eslint-disable-line
  useEffect(() => { if (tab === 'yayinda' && !pubLoaded) loadPublished(); }, [tab, pubLoaded]); // eslint-disable-line

  async function review(id: string, status: 'approved' | 'rejected') {
    setReviewing(id);
    try { await adminApi.reviewContentRequest(id, status, notes[id]); loadRequests(); if (pubLoaded) { setPubLoaded(false); } }
    finally { setReviewing(null); }
  }

  async function deleteReq(id: string) {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
    setDeletingReq(id);
    try { await adminApi.deleteContentRequest(id); loadRequests(); if (pubLoaded) setPubLoaded(false); }
    finally { setDeletingReq(null); }
  }

  async function deletePub(id: string) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    try { await adminApi.deleteContentRequest(id); setExpandedPub(null); setPubLoaded(false); }
    finally { setDeleting(null); }
  }

  function openEdit(item: ContentRequestItem) {
    setEditItem(item);
    setEditForm({ title: item.title, description: item.description, contactInfo: item.contactInfo ?? '' });
    setSaveErr('');
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true); setSaveErr('');
    try {
      await adminApi.updateContentRequest(editItem.id, {
        title: editForm.title, description: editForm.description,
        contactInfo: editForm.contactInfo || '',
      });
      setEditItem(null);
      setPubLoaded(false);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Hata oluştu');
    } finally { setSaving(false); }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';
  const inp = 'w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]';

  return (
    <div className="max-w-5xl">
      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Kaydı Düzenle</h2>
              <button onClick={() => setEditItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void saveEdit(e)} className="px-6 py-4 space-y-4">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label>
                <input required className={inp} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label>
                <textarea rows={4} className={inp} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">İletişim Bilgisi</label>
                <input className={inp} value={editForm.contactInfo} onChange={e => setEditForm(f => ({ ...f, contactInfo: e.target.value }))} placeholder="Telefon, e-posta veya web sitesi" /></div>
              {saveErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveErr}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mağaza</h1>
        <p className="text-sm text-gray-500 mt-1">Gelen mağaza talepleri ve onaylanan kayıtlar</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('talepler')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${tab === 'talepler' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Gelen Talepler
          {pendingCount > 0 && <span className="bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
        </button>
        <button onClick={() => setTab('yayinda')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'yayinda' ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Yayındaki Kayıtlar
        </button>
      </div>

      {/* ── Talepler ── */}
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
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Mağaza talebi bulunamadı.</div>
          ) : (
            <div className="space-y-2">
              {requests.map(item => {
                const isOpen = expandedReq === item.id;
                const grad = SOURCE_GRADS[item.source] ?? 'linear-gradient(135deg,#64748b,#475569)';
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

      {/* ── Yayındaki Kayıtlar ── */}
      {tab === 'yayinda' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-gray-400">
              <span className="text-base font-bold text-gray-800">{published.length}</span> onaylanmış kayıt
            </p>
            <div className="flex items-center gap-1.5">
              {(['', 'sahne', 'mutfak'] as const).map(s => (
                <button key={s} onClick={() => { setPubSourceFilter(s); setPubLoaded(false); }}
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-colors ${pubSourceFilter === s ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b] hover:text-[#26496b]'}`}>
                  {s === '' ? 'Tümü' : s === 'sahne' ? 'Sahne' : 'Mutfak'}
                </button>
              ))}
            </div>
          </div>
          {pubLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
          ) : published.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <p>Henüz onaylanmış mağaza kaydı yok.</p>
              <button onClick={() => setTab('talepler')} className="mt-2 text-sm text-[#26496b] hover:underline font-medium">Taleplere git →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {published.map(item => {
                const isOpen = expandedPub === item.id;
                const grad = SOURCE_GRADS[item.source] ?? 'linear-gradient(135deg,#64748b,#475569)';
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      {/* Content avatar */}
                      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white text-xl font-bold shadow-sm select-none"
                        style={{ background: grad }}>
                        {item.title[0]?.toUpperCase() ?? '?'}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Yayında</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLORS[item.source] ?? 'bg-gray-100 text-gray-600'}`}>{SOURCE_LABELS[item.source] ?? item.source}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 leading-snug">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.displayName} · {new Date(item.createdAt).toLocaleDateString('tr-TR')}</p>
                      </div>
                      {/* Action buttons — always visible */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button title="Düzenle" onClick={() => { openEdit(item); setExpandedPub(null); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors">
                          <IcoEdit />
                        </button>
                        <button title="Sil" disabled={deleting === item.id} onClick={() => void deletePub(item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <IcoTrash />
                        </button>
                        <button title={isOpen ? 'Kapat' : 'Detaylar'} onClick={() => setExpandedPub(isOpen ? null : item.id)}
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
