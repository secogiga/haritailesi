'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';

type AttendeeRow = {
  userId: string | null;
  email?: string;
  displayName: string | null;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  ticketCode: string | null;
  ticketTier: string;
  joinedAt: string;
  registrationType: 'member' | 'public';
};

const TIER_COLORS: Record<string, string> = {
  vip:      'bg-amber-100 text-amber-800 border-amber-300',
  standard: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function KayitMasasiPage() {
  const [rows, setRows] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Tüm etkinlikleri getir, her birinin katılımcılarını çek
      const events = await adminApi.listEvents();
      const allRows: AttendeeRow[] = [];

      await Promise.all(events.map(async (ev) => {
        const att = await adminApi.listEventAttendees(ev.id);
        att.attendees.forEach(a => {
          allRows.push({
            userId: a.userId,
            displayName: a.displayName,
            eventTitle: ev.title,
            eventSlug: ev.slug,
            eventDate: ev.dateStart,
            ticketCode: null,
            ticketTier: 'standard',
            joinedAt: a.joinedAt,
            registrationType: 'member',
          });
        });
      }));

      setRows(allRows.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = rows.filter(r => {
    if (search && !r.displayName?.toLowerCase().includes(search.toLowerCase()) && !r.eventTitle.toLowerCase().includes(search.toLowerCase())) return false;
    if (tierFilter && r.ticketTier !== tierFilter) return false;
    if (typeFilter && r.registrationType !== typeFilter) return false;
    return true;
  });

  // Etkinliğe göre grupla
  const grouped = filtered.reduce<Record<string, AttendeeRow[]>>((acc, row) => {
    const key = row.eventTitle;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(row);
    return acc;
  }, {});

  const sel = 'border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#26496b]/30';

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kayıt Masası</h1>
        <p className="text-sm text-gray-500 mt-1">Tüm etkinliklerin katılımcı listesi — Standard / VIP bilet tipi</p>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Katılımcı veya etkinlik ara…"
          className={`${sel} flex-1 min-w-[180px]`}
        />
        <select className={`${sel} min-w-[130px]`} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
          <option value="">Tüm Biletler</option>
          <option value="standard">Standard</option>
          <option value="vip">VIP</option>
        </select>
        <select className={`${sel} min-w-[130px]`} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Tüm Kayıtlar</option>
          <option value="member">Üye</option>
          <option value="public">Genel</option>
        </select>
        <span className="text-sm text-gray-500 whitespace-nowrap ml-auto">
          <span className="font-semibold text-gray-900">{filtered.length}</span> kayıt
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Kayıt bulunamadı.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([eventTitle, attendees]) => (
            <div key={eventTitle}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-bold text-gray-800">{eventTitle}</h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{attendees.length} katılımcı</span>
                <span className="text-xs text-gray-400">{new Date(attendees[0]!.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Katılımcı</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Bilet Tipi</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Kayıt Türü</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendees.map((a, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#26496b] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {a.displayName?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <span className="font-medium text-gray-900 text-xs">{a.displayName ?? a.email ?? 'Kullanıcı'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TIER_COLORS[a.ticketTier] ?? TIER_COLORS['standard']}`}>
                              {a.ticketTier === 'vip' ? '⭐ VIP' : 'Standard'}
                            </span>
                            {a.ticketCode && (
                              <span className="text-[9px] font-mono text-gray-400">{a.ticketCode.split('-')[0]?.toUpperCase()}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${a.registrationType === 'member' ? 'bg-[#26496b]/10 text-[#26496b]' : 'bg-teal-100 text-teal-700'}`}>
                            {a.registrationType === 'member' ? '👤 Üye' : '🌐 Genel'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">
                          {new Date(a.joinedAt).toLocaleDateString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
