'use client';

import { Fragment, useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/ui';

type Feedback = {
  id: string; email: string | null; subject: string; body: string;
  type: string; source: string; status: string; adminNotes: string | null; createdAt: string;
};

const STATUS_LABELS: Record<string, string> = { open: 'Açık', in_progress: 'İşlemde', resolved: 'Çözüldü' };
const STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
};
const STATUS_BAR: Record<string, string> = {
  open: '#ef4444',
  in_progress: '#f59e0b',
  resolved: '#22c55e',
};
const TYPE_LABELS: Record<string, string> = { talep: 'Talep', gorus: 'Görüş' };
const TYPE_ICON: Record<string, string> = { gorus: '💬', talep: '📋' };
const TYPE_GRAD: Record<string, string> = {
  gorus: 'linear-gradient(135deg,#818cf8,#6366f1)',
  talep: 'linear-gradient(135deg,#38bdf8,#0284c7)',
};

function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg className="w-4 h-4 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function GoruslerPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set('status', statusFilter);
    if (typeFilter) qs.set('type', typeFilter);
    adminApi.listFeedback(Object.fromEntries(qs) as Record<string, string>)
      .then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter, typeFilter]); // eslint-disable-line

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    // Optimistic update so UI responds immediately
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    try {
      await adminApi.updateFeedbackStatus(id, status, notes[id]);
    } catch {
      // Revert on failure by reloading
      load();
    } finally {
      setUpdating(null);
    }
  }

  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';
  const openCount = items.filter(i => i.status === 'open').length;
  const inProgCount = items.filter(i => i.status === 'in_progress').length;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Görüşler & Geri Bildirim</h1>
          <div className="flex items-center gap-3 mt-2">
            {openCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                {openCount} açık
              </span>
            )}
            {inProgCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {inProgCount} işlemde
              </span>
            )}
            {openCount === 0 && inProgCount === 0 && (
              <span className="text-sm text-gray-400">Tüm görüşler çözüldü</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className={sel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Tüm Tipler</option>
            <option value="gorus">Görüş</option>
            <option value="talep">Talep</option>
          </select>
          <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 font-medium">Görüş bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const isOpen = expanded === item.id;
            const barColor = STATUS_BAR[item.status] ?? '#94a3b8';
            const typeGrad = TYPE_GRAD[item.type] ?? 'linear-gradient(135deg,#94a3b8,#64748b)';
            const typeIcon = TYPE_ICON[item.type] ?? '📝';
            return (
              <Fragment key={item.id}>
                {/* Card row */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex">
                  {/* Status accent bar */}
                  <div className="w-[4px] shrink-0" style={{ backgroundColor: barColor }} />

                  <div className="flex-1 flex items-center gap-3.5 px-4 py-3.5 min-w-0">
                    {/* Type icon avatar */}
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-xl shadow-sm select-none"
                      style={{ background: typeGrad }}>
                      {typeIcon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        {item.source && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLORS[item.source] ?? 'bg-gray-100 text-gray-600'}`}>
                            {SOURCE_LABELS[item.source] ?? item.source}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{item.email ?? '—'} · {new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <p className="font-semibold text-sm text-gray-900 leading-snug">{item.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.body}</p>
                    </div>

                    {/* Action buttons — always visible */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {item.status !== 'in_progress' && item.status !== 'resolved' && (
                        <button title="İşleme Al" disabled={updating === item.id}
                          onClick={() => void updateStatus(item.id, 'in_progress')}
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      {item.status !== 'resolved' ? (
                        <button title="Çözüldü olarak işaretle" disabled={updating === item.id}
                          onClick={() => void updateStatus(item.id, 'resolved')}
                          className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : (
                        <button title="Yeniden Aç" disabled={updating === item.id}
                          onClick={() => void updateStatus(item.id, 'open')}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      <button title={isOpen ? 'Kapat' : 'Detay'} onClick={() => setExpanded(isOpen ? null : item.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                        <IcoChevron open={isOpen} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline detail — opens directly below its card */}
                {isOpen && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden -mt-1 border-t-0 rounded-t-none">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.subject}</p>
                      <button onClick={() => setExpanded(null)} className="text-gray-400 hover:text-gray-700 text-xs font-medium">Kapat ✕</button>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
                        {item.body}
                      </div>
                      {item.adminNotes && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
                          <span className="font-semibold text-xs uppercase tracking-wide text-amber-600 block mb-1">Mevcut Admin Notu</span>
                          {item.adminNotes}
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Not Ekle</label>
                        <textarea rows={2} value={notes[item.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] bg-white"
                          placeholder="Dahili not…" />
                      </div>
                      <div className="flex gap-2">
                        {item.status !== 'in_progress' && (
                          <button disabled={updating === item.id} onClick={() => void updateStatus(item.id, 'in_progress')}
                            className="px-4 py-2 text-xs font-semibold border border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 disabled:opacity-50">
                            ⏱ İşleme Al
                          </button>
                        )}
                        {item.status !== 'resolved' ? (
                          <button disabled={updating === item.id} onClick={() => void updateStatus(item.id, 'resolved')}
                            className="px-4 py-2 text-xs font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50">
                            ✓ Çözüldü
                          </button>
                        ) : (
                          <button disabled={updating === item.id} onClick={() => void updateStatus(item.id, 'open')}
                            className="px-4 py-2 text-xs font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50">
                            ↩ Yeniden Aç
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
