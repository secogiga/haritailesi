'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi, type FeedbackStats, type SimilarResolvedTicket } from '@/lib/api';

function Bar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-xs text-gray-600 truncate flex-shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 text-xs text-gray-500 text-right flex-shrink-0">{count}</div>
    </div>
  );
}

function StatCard({ label, value, sub, color, textColor }: {
  label: string; value: string | number; sub?: string; color?: string; textColor?: string;
}) {
  return (
    <div className={`rounded-xl border p-5 ${color ?? 'bg-white border-gray-100'}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${textColor ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatTicketNo(ticketNo: number, createdAt: string) {
  return `HDM-${new Date(createdAt).getFullYear()}-${String(ticketNo).padStart(4, '0')}`;
}

function ArchiveTicket({ ticket, expanded, onToggle, onFillSearch }: {
  ticket: SimilarResolvedTicket;
  expanded: boolean;
  onToggle: () => void;
  onFillSearch: (v: string) => void;
}) {
  const subj = ticket.subject.replace(/^\[([^\]]+)\]\s*/, '');
  const catMatch = ticket.subject.match(/^\[([^\]]+)\]/);
  const cat = catMatch?.[1];

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
        <div className="w-1 rounded-full bg-green-400 flex-shrink-0 self-stretch mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-[#26496b] font-mono">
              {formatTicketNo(ticket.ticketNo, ticket.createdAt)}
            </span>
            {cat && (
              <button type="button" onClick={e => { e.stopPropagation(); onFillSearch(cat); }}
                className="text-[10px] bg-gray-100 hover:bg-[#26496b]/10 text-gray-500 hover:text-[#26496b] px-1.5 py-0.5 rounded-full transition-colors">
                {cat}
              </button>
            )}
            {ticket.subCategory && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{ticket.subCategory}</span>
            )}
            {ticket.satisfactionScore && (
              <span className="text-[10px] text-yellow-500">{'★'.repeat(ticket.satisfactionScore)}</span>
            )}
            <span className="text-[10px] text-gray-400 uppercase">{ticket.source}</span>
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">{subj}</p>
          {!expanded && ticket.adminReply && (
            <p className="text-xs text-gray-400 truncate mt-0.5">Yanıt: {ticket.adminReply.slice(0, 90)}…</p>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-0.5 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 space-y-3 pt-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Talep</p>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-2.5 max-h-24 overflow-y-auto whitespace-pre-wrap">{ticket.body}</p>
          </div>
          {ticket.adminNotes && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">İç Not / Çözüm Süreci</p>
              <p className="text-xs text-gray-700 leading-relaxed bg-amber-50 rounded-lg p-2.5 whitespace-pre-wrap">{ticket.adminNotes}</p>
            </div>
          )}
          {ticket.adminReply && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Verilen Yanıt</p>
              <p className="text-xs text-gray-700 leading-relaxed bg-green-50 rounded-lg p-2.5 border border-green-100 whitespace-pre-wrap">{ticket.adminReply}</p>
            </div>
          )}
          <p className="text-[10px] text-gray-400">
            {ticket.resolvedAt
              ? `Çözüldü: ${new Date(ticket.resolvedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : `Oluşturuldu: ${new Date(ticket.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </p>
        </div>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Yeni', reviewing: 'İncelemede', awaiting_info: 'Bilgi Bekleniyor',
  in_progress: 'Ekibimizde', mentoring: 'Mentöre Yönlendirildi', expert_review: 'Uzman İncelemesinde',
  partner_referred: 'Partnere Yönlendirildi', offer_pending: 'Teklif Bekleniyor',
  education_suggested: 'Eğitim Önerildi', gpt_responded: 'GPT Yanıt Verdi',
  suggested: 'Öneri Verildi', resolved: 'Çözüldü', archived: 'Arşivlendi',
};
const BAR_COLORS = [
  'bg-[#26496b]', 'bg-blue-400', 'bg-teal-400', 'bg-purple-400',
  'bg-amber-400', 'bg-rose-400', 'bg-cyan-400', 'bg-indigo-400',
];

export default function RaporlarPage() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [tab, setTab] = useState<'stats' | 'arsiv'>('stats');

  // Archive state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [archive, setArchive] = useState<SimilarResolvedTicket[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getFeedbackStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadArchive = useCallback(async () => {
    setLoadingArchive(true);
    try {
      const rows = await adminApi.findSimilarResolved({ q: debouncedSearch || undefined, limit: 30 });
      setArchive(rows);
    } catch {
      setArchive([]);
    } finally {
      setLoadingArchive(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (tab === 'arsiv') void loadArchive();
  }, [tab, loadArchive]);

  const openCount = stats?.byStatus.find(s => s.status === 'open')?.count ?? 0;
  const resolvedCount = stats?.byStatus.find(s => s.status === 'resolved')?.count ?? 0;
  const activeCount = (stats?.byStatus ?? [])
    .filter(s => ['reviewing', 'awaiting_info', 'in_progress', 'mentoring', 'expert_review', 'partner_referred', 'offer_pending'].includes(s.status))
    .reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-sm text-gray-500 mt-1">Haritailesi Pusula istatistikleri ve çözüm arşivi</p>
        </div>
        <a href="/gorusler" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#26496b] bg-[#26496b]/5 hover:bg-[#26496b]/10 px-3 py-2 rounded-lg transition-colors">
          ← Pusula
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: 'stats', label: '📊 İstatistikler' },
          { id: 'arsiv', label: '🗂 Çözüm Arşivi' },
        ].map(t => (
          <button key={t.id} type="button"
            onClick={() => setTab(t.id as 'stats' | 'arsiv')}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id ? 'border-[#26496b] text-[#26496b]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── İSTATİSTİKLER ── */}
      {tab === 'stats' && (
        loadingStats ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        ) : !stats ? (
          <p className="text-center text-gray-400 py-12">Veriler yüklenemedi.</p>
        ) : (
          <div className="space-y-6">
            {/* KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Toplam Talep" value={stats.total} />
              <StatCard label="Yeni / Bekleyen" value={openCount} color="bg-red-50 border-red-100" textColor="text-red-600" sub="henüz atanmamış" />
              <StatCard label="Aktif İşlemde" value={activeCount} color="bg-amber-50 border-amber-100" textColor="text-amber-600" />
              <StatCard label="Ort. Memnuniyet"
                value={stats.avgSatisfaction ? `${stats.avgSatisfaction} / 5` : '—'}
                textColor="text-yellow-500"
                sub={`${resolvedCount} çözülen talep`} />
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Duruma Göre Dağılım</h2>
                <div className="space-y-2.5">
                  {stats.byStatus.sort((a, b) => b.count - a.count).map((s, i) => (
                    <Bar key={s.status} label={STATUS_LABELS[s.status] ?? s.status} count={s.count}
                      max={Math.max(...stats.byStatus.map(x => x.count), 1)} color={BAR_COLORS[i % BAR_COLORS.length]!} />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4">En Çok Gelen Kategoriler</h2>
                <div className="space-y-2.5">
                  {stats.topCategories.sort((a, b) => b.count - a.count).slice(0, 10).map((c, i) => (
                    <Bar key={c.category} label={c.category} count={c.count}
                      max={Math.max(...stats.topCategories.map(x => x.count), 1)} color={BAR_COLORS[i % BAR_COLORS.length]!} />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Kaynağa Göre</h2>
                <div className="flex items-end gap-6 h-36 px-4">
                  {stats.bySource.map((s, i) => {
                    const pct = stats.total > 0 ? (s.count / stats.total) * 100 : 0;
                    const colors = ['bg-[#26496b]', 'bg-amber-400', 'bg-emerald-400'];
                    return (
                      <div key={s.source} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-gray-700">{s.count}</span>
                        <div className={`w-full rounded-t-xl ${colors[i % colors.length]!}`}
                          style={{ height: `${Math.max(pct, 6)}%` }} />
                        <span className="text-[11px] text-gray-500 capitalize font-semibold">{s.source}</span>
                        <span className="text-[10px] text-gray-400">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Aciliyete Göre</h2>
                <div className="space-y-2.5">
                  {stats.byUrgency.sort((a, b) => b.count - a.count).map((u, i) => (
                    <Bar key={u.urgency ?? 'none'}
                      label={{ kritik: '🔴 Kritik', yuksek: '🟠 Yüksek', normal: '🟡 Normal', dusuk: '🟢 Düşük' }[u.urgency ?? ''] ?? u.urgency ?? 'Belirtilmemiş'}
                      count={u.count} max={Math.max(...stats.byUrgency.map(x => x.count), 1)} color={BAR_COLORS[i % BAR_COLORS.length]!} />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Kullanıcı Tipine Göre</h2>
                <div className="space-y-2.5">
                  {stats.byUserType.sort((a, b) => b.count - a.count).map((u, i) => (
                    <Bar key={u.userType ?? 'none'}
                      label={{ ogrenci: 'Öğrenci', yeni_mezun: 'Yeni Mezun', calisan: 'Çalışan', yonetici: 'Yönetici', firma_sahibi: 'Firma Sahibi', kurumsal: 'Kurumsal' }[u.userType ?? ''] ?? u.userType ?? 'Belirtilmemiş'}
                      count={u.count} max={Math.max(...stats.byUserType.map(x => x.count), 1)} color={BAR_COLORS[i % BAR_COLORS.length]!} />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Beklentiye Göre</h2>
                <div className="space-y-2.5">
                  {stats.byExpectation.filter(e => e.expectation).sort((a, b) => b.count - a.count).map((e, i) => (
                    <Bar key={e.expectation ?? 'none'} label={e.expectation ?? 'Belirtilmemiş'}
                      count={e.count} max={Math.max(...stats.byExpectation.map(x => x.count), 1)} color={BAR_COLORS[i % BAR_COLORS.length]!} />
                  ))}
                </div>
              </div>
            </div>

            {/* Satisfaction banner */}
            {stats.avgSatisfaction && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-5 flex items-center gap-5">
                <div className="text-4xl font-bold text-green-700">{stats.avgSatisfaction}</div>
                <div>
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className={`w-5 h-5 ${s <= Math.round(Number(stats.avgSatisfaction)) ? 'text-yellow-400' : 'text-gray-200'}`}
                        fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-green-700">Ortalama Kullanıcı Memnuniyeti</p>
                  <p className="text-xs text-green-500 mt-0.5">{resolvedCount} çözülen talep üzerinden hesaplandı</p>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── ÇÖZÜM ARŞİVİ ── */}
      {tab === 'arsiv' && (
        <div className="space-y-4">
          {/* Search box */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-3">
              Çözülmüş ve arşivlenmiş biletlerde tam metin arama yapın.
              Konu, talep içeriği, verilen yanıt ve iç notlarda taranır.
              Kategoriye tıklayarak aynı türdeki tüm çözümleri listeleyin.
            </p>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Örn: CBS yazılım, kariyer danışmanlığı, mentör eşleştirme…"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b]/50"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button type="button" onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {loadingArchive ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : archive.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
              <p className="text-gray-400 text-sm">
                {search ? `"${search}" için eşleşen çözüm bulunamadı.` : 'Arama yaparak çözümleri görüntüleyin.'}
              </p>
              {search && <p className="text-xs text-gray-300 mt-1">Farklı anahtar kelimeler deneyin.</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium px-1">{archive.length} çözüm bulundu</p>
              {archive.map(ticket => (
                <ArchiveTicket key={ticket.id} ticket={ticket}
                  expanded={expandedId === ticket.id}
                  onToggle={() => setExpandedId(prev => prev === ticket.id ? null : ticket.id)}
                  onFillSearch={setSearch}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
