'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { STATUS_CLS as STATUS_COLORS } from '@/lib/ui';

type ContentRequest = {
  id: string; email: string; displayName: string; source: string;
  type: string; title: string; description: string; contactInfo: string | null;
  status: string; adminNotes: string | null; createdAt: string;
};

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' };
const TYPE_LABELS: Record<string, string> = { magaza: 'Mağaza', etkinlik: 'Etkinlik', egitim: 'Eğitim', ilan: 'İlan' };
const TYPE_COLORS: Record<string, string> = {
  magaza: 'bg-purple-50 text-purple-700',
  etkinlik: 'bg-blue-50 text-blue-700',
  egitim: 'bg-teal-50 text-teal-700',
  ilan: 'bg-orange-50 text-orange-700',
};

export default function TaleplerPage() {
  const [items, setItems] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  function load() {
    setLoading(true);
    const qs: Record<string, string> = {};
    if (statusFilter) qs.status = statusFilter;
    if (typeFilter) qs.type = typeFilter;
    adminApi.listContentRequests(qs)
      .then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter, typeFilter]); // eslint-disable-line

  async function review(id: string, status: 'approved' | 'rejected') {
    setReviewing(id);
    try {
      await adminApi.reviewContentRequest(id, status, notes[id]);
      load();
    } finally { setReviewing(null); }
  }

  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';
  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İçerik Talepleri</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kullanıcılardan gelen mağaza, etkinlik, eğitim ve ilan talepleri
            {pendingCount > 0 && statusFilter === 'pending' && <> · <span className="text-yellow-600 font-medium">{pendingCount} bekliyor</span></>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className={sel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Tüm Tipler</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tümü</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Talep bulunamadı.</div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      <span className="text-xs text-gray-400">{item.displayName} · {item.email}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="text-xs text-[#26496b] hover:underline shrink-0"
                  >
                    {expanded === item.id ? 'Kapat ↑' : 'İncele →'}
                  </button>
                </div>
              </div>

              {expanded === item.id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4 rounded-b-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Açıklama</p>
                      <p className="text-gray-700 bg-white rounded-lg p-3 border border-gray-100">{item.description}</p>
                    </div>
                    {item.contactInfo && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-1">İletişim</p>
                        <p className="text-gray-700 bg-white rounded-lg p-3 border border-gray-100">{item.contactInfo}</p>
                      </div>
                    )}
                  </div>

                  {item.adminNotes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                      <span className="font-semibold">Admin Notu:</span> {item.adminNotes}
                    </div>
                  )}

                  {item.status === 'pending' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">İnceleme Notu (opsiyonel)</label>
                        <textarea rows={2} value={notes[item.id] ?? ''}
                          onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]"
                          placeholder="Onay/red gerekçesi…" />
                      </div>
                      <div className="flex gap-2">
                        <button disabled={reviewing === item.id}
                          onClick={() => void review(item.id, 'approved')}
                          className="px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                          ✓ Onayla
                        </button>
                        <button disabled={reviewing === item.id}
                          onClick={() => void review(item.id, 'rejected')}
                          className="px-4 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                          ✕ Reddet
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
