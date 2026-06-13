'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import type { AvailabilitySlot } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ─── Boş slot formu ────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 45; // dakika

function defaultStartAt() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalInputValue(d);
}

function addMinutes(localIso: string, mins: number) {
  const d = new Date(localIso);
  d.setMinutes(d.getMinutes() + mins);
  return toLocalInputValue(d);
}

// ─── Grup slotları güne göre ─────────────────────────────────────────────────

function groupByDay(slots: AvailabilitySlot[]) {
  const map = new Map<string, AvailabilitySlot[]>();
  for (const s of slots) {
    const day = new Date(s.startAt).toISOString().slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(s);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export default function TakvimPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [startAt, setStartAt] = useState(defaultStartAt);
  const [endAt, setEndAt] = useState(() => addMinutes(defaultStartAt(), DEFAULT_DURATION));
  const [capacity, setCapacity] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Silme onayı
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date().toISOString();

  useEffect(() => {
    load();
  }, [showPast]);

  async function load() {
    setLoading(true);
    try {
      const data = await adminApi.listSlots({
        slotType: 'membership',
        ...(showPast ? {} : { from: new Date().toISOString() }),
      });
      setSlots(data.sort((a, b) => a.startAt.localeCompare(b.startAt)));
    } finally {
      setLoading(false);
    }
  }

  function onStartChange(val: string) {
    setStartAt(val);
    setEndAt(addMinutes(val, DEFAULT_DURATION));
  }

  async function handleCreate() {
    setError('');
    if (!startAt || !endAt) { setError('Başlangıç ve bitiş saati zorunlu.'); return; }
    if (new Date(endAt) <= new Date(startAt)) { setError('Bitiş saati başlangıçtan sonra olmalı.'); return; }
    setSaving(true);
    try {
      const created = await adminApi.createSlot({
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        slotType: 'membership',
        capacity,
        notes: notes || undefined,
      });
      setSlots(prev => [...prev, created].sort((a, b) => a.startAt.localeCompare(b.startAt)));
      setFormOpen(false);
      setStartAt(defaultStartAt());
      setEndAt(addMinutes(defaultStartAt(), DEFAULT_DURATION));
      setCapacity(1);
      setNotes('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Slot oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await adminApi.deleteSlot(id);
      setSlots(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const grouped = groupByDay(slots);
  const upcomingCount = slots.filter(s => s.startAt > now).length;
  const bookedCount = slots.filter(s => s.bookedCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Görüşme Takvimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Üyelik görüşmesi için müsait zaman dilimleri oluşturun. Başvurularda bu slotlar seçilebilir.
          </p>
        </div>
        <button
          onClick={() => { setFormOpen(true); setError(''); }}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Slot
        </button>
      </div>

      {/* Özet istatistikler */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Yaklaşan Slot', value: upcomingCount, color: 'text-blue-700' },
          { label: 'Rezerveli', value: bookedCount, color: 'text-orange-600' },
          { label: 'Toplam', value: slots.length, color: 'text-gray-700' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Yeni slot formu */}
      {formOpen && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-700">Yeni Görüşme Slotu</p>
            <button onClick={() => setFormOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">İptal</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Başlangıç</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={e => onStartChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Bitiş</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={e => setEndAt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Kapasite (aynı slota kaç kişi?)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={capacity}
                onChange={e => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Not (isteğe bağlı)</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Görüşmeci adı, platform vb."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            onClick={() => void handleCreate()}
            disabled={saving}
            className="px-5 py-2 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Oluşturuluyor…' : 'Slotu Oluştur →'}
          </button>
        </div>
      )}

      {/* Geçmiş toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 select-none">
          <input
            type="checkbox"
            checked={showPast}
            onChange={e => setShowPast(e.target.checked)}
            className="rounded border-gray-300 text-[var(--color-mavi)]"
          />
          Geçmiş slotları da göster
        </label>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[var(--color-mavi)] rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Henüz slot yok.</p>
          <p className="text-xs mt-1">Yukarıdan yeni slot oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, daySlots]) => (
            <div key={day}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                {fmtDate(daySlots[0].startAt)}
              </p>
              <div className="space-y-2">
                {daySlots.map(slot => {
                  const isPast = slot.startAt < now;
                  const isFull = slot.bookedCount >= slot.capacity;
                  const available = slot.capacity - slot.bookedCount;

                  return (
                    <div key={slot.id}
                      className={`flex items-center gap-4 bg-white rounded-xl border px-4 py-3 transition-opacity ${
                        isPast ? 'opacity-50 border-gray-100' : isFull ? 'border-orange-100' : 'border-gray-100'
                      }`}
                    >
                      {/* Saat */}
                      <div className="shrink-0 text-center w-20">
                        <p className="text-sm font-bold text-gray-800">{fmtTime(slot.startAt)}</p>
                        <p className="text-xs text-gray-400">{fmtTime(slot.endAt)}</p>
                      </div>

                      {/* Doluluk çubuğu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            {slot.bookedCount} / {slot.capacity} rezervasyon
                          </span>
                          <span className={`text-xs font-semibold ${
                            isFull ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {isFull ? 'Dolu' : `${available} müsait`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-orange-400' : 'bg-green-400'}`}
                            style={{ width: `${Math.round((slot.bookedCount / slot.capacity) * 100)}%` }}
                          />
                        </div>
                        {slot.notes && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{slot.notes}</p>
                        )}
                      </div>

                      {/* Sil */}
                      {!isPast && slot.bookedCount === 0 && (
                        <button
                          onClick={() => void handleDelete(slot.id)}
                          disabled={deletingId === slot.id}
                          className="shrink-0 p-1.5 text-gray-300 hover:text-red-400 disabled:opacity-40 transition-colors"
                          title="Sil"
                        >
                          {deletingId === slot.id ? (
                            <div className="w-4 h-4 border-2 border-gray-200 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                      {slot.bookedCount > 0 && (
                        <span className="shrink-0 text-xs text-orange-500 font-medium">rezerveli</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
