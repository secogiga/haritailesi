'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Slot {
  id: string;
  startAt: string;
  endAt: string;
  capacity: number;
  bookedCount: number;
  notes: string | null;
}

interface MeetingOption {
  type: 'video' | 'phone';
  label: string;
  value: string;
  icon: string;
}

function parseMeetingOptions(meetUrl: string | null): MeetingOption[] {
  if (!meetUrl) return [];
  return meetUrl
    .split('|')
    .filter(Boolean)
    .map(part => {
      if (part.startsWith('tel:')) {
        const phone = part.slice(4);
        return { type: 'phone' as const, label: phone, value: part, icon: '📞' };
      }
      return { type: 'video' as const, label: 'Video Görüşme', value: part, icon: '🎥' };
    });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(slots: Slot[]) {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    const day = new Date(s.startAt).toISOString().slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(s);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function SlotPicker() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [applicantName, setApplicantName] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [meetingOptions, setMeetingOptions] = useState<MeetingOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'method' | 'picking' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<MeetingOption | null>(null);
  const [confirmedSlot, setConfirmedSlot] = useState<Slot | null>(null);
  const [confirmedMethod, setConfirmedMethod] = useState<MeetingOption | null>(null);

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Geçersiz bağlantı.'); return; }
    fetch(`${API_URL}/api/v1/scheduling/pick-slot/${token}`)
      .then(r => r.ok ? r.json() : r.json().then((e: { message?: string }) => Promise.reject(e.message ?? 'Hata')))
      .then((data: { applicantName: string; slots: Slot[]; meetUrl: string | null }) => {
        setApplicantName(data.applicantName);
        setSlots(data.slots);
        const opts = parseMeetingOptions(data.meetUrl);
        setMeetingOptions(opts);
        // Tek seçenek varsa otomatik seç
        if (opts.length === 1) setSelectedMethod(opts[0] ?? null);
        setStatus('ready');
      })
      .catch((msg: string) => { setStatus('error'); setErrorMsg(String(msg)); });
  }, [token]);

  function handleSlotConfirm() {
    if (!selectedSlot) return;
    // Birden fazla iletişim seçeneği varsa ve henüz seçilmemişse → method adımına geç
    if (meetingOptions.length > 1 && !selectedMethod) {
      setStatus('method');
      return;
    }
    void doConfirm();
  }

  async function doConfirm() {
    if (!selectedSlot) return;
    setStatus('picking');
    setErrorMsg('');
    try {
      const body: Record<string, string> = { action: 'pick_slot', slotId: selectedSlot.id };
      if (selectedMethod) body['meetingPreference'] = selectedMethod.value;
      const res = await fetch(`${API_URL}/api/v1/scheduling/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(String(err.message ?? 'Hata oluştu.'));
      }
      setConfirmedSlot(selectedSlot);
      setConfirmedMethod(selectedMethod);
      setStatus('done');
    } catch (e) {
      setStatus(meetingOptions.length > 1 ? 'method' : 'ready');
      setErrorMsg(e instanceof Error ? e.message : 'Hata oluştu, tekrar deneyin.');
    }
  }

  const grouped = groupByDay(slots);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none">
            <rect width="40" height="40" rx="8" fill="#26496b" />
            <path d="M8 28 L20 12 L32 28" stroke="#66aca9" strokeWidth="3" strokeLinejoin="round" fill="none" />
            <path d="M14 28 L20 18 L26 28" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="text-xl font-bold tracking-tight" style={{ color: '#26496b' }}>haritailesi</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#294f73] px-6 py-5">
            <h1 className="text-white font-bold text-lg">Görüşme Takvimi</h1>
            <p className="text-white/70 text-sm mt-0.5">Size uygun zamanı seçin</p>
          </div>

          <div className="p-6">
            {status === 'loading' && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#294f73] rounded-full animate-spin" />
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8">
                <p className="text-red-500 font-medium">{errorMsg}</p>
                <p className="text-gray-400 text-sm mt-2">
                  Sorun yaşıyorsanız <a href="mailto:destek@haritailesi.org" className="underline">destek@haritailesi.org</a> adresine yazın.
                </p>
              </div>
            )}

            {status === 'done' && confirmedSlot && (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Görüşmeniz Onaylandı!</h2>
                {applicantName && <p className="text-gray-500 text-sm">Merhaba {applicantName},</p>}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-left space-y-2 mt-4">
                  <p className="text-sm font-semibold text-green-800">{fmtDate(confirmedSlot.startAt)}</p>
                  <p className="text-sm text-green-700">{fmtTime(confirmedSlot.startAt)} – {fmtTime(confirmedSlot.endAt)}</p>
                  {confirmedMethod && (
                    <p className="text-sm text-green-700 pt-1 border-t border-green-100">
                      {confirmedMethod.icon}{' '}
                      {confirmedMethod.type === 'phone'
                        ? `Sesli arama: ${confirmedMethod.label}`
                        : 'Video görüşme bağlantısı e-postanızda'}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500 pt-2">
                  Onay detayları e-posta adresinize gönderildi.
                </p>
              </div>
            )}

            {/* Adım 2: İletişim yöntemi seçimi */}
            {status === 'method' && selectedSlot && (
              <>
                {errorMsg && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600 mb-4">
                    {errorMsg}
                  </div>
                )}
                <div className="mb-4">
                  <button
                    onClick={() => { setStatus('ready'); setSelectedMethod(null); }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Zaman seçimine dön
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs text-gray-500 mb-0.5">Seçilen zaman</p>
                  <p className="text-sm font-semibold text-gray-800">{fmtDate(selectedSlot.startAt)}</p>
                  <p className="text-sm text-gray-600">{fmtTime(selectedSlot.startAt)} – {fmtTime(selectedSlot.endAt)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-3">Nasıl görüşmek istersiniz?</p>
                <div className="space-y-2 mb-6">
                  {meetingOptions.map(opt => {
                    const isSelected = selectedMethod?.value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedMethod(opt)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#294f73] bg-[#294f73]/5 ring-1 ring-[#294f73]'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {opt.type === 'video' ? 'Video Görüşme' : 'Sesli Arama'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {opt.type === 'video' ? 'Bağlantı onay mailinde' : opt.label}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#294f73] bg-[#294f73]' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => void doConfirm()}
                  disabled={!selectedMethod}
                  className="w-full py-3 bg-[#294f73] text-white font-semibold rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Görüşmeyi Onayla →
                </button>
              </>
            )}

            {/* Adım 1: Slot seçimi */}
            {(status === 'ready' || status === 'picking') && (
              <>
                {applicantName && (
                  <p className="text-sm text-gray-500 mb-4">
                    Merhaba <strong className="text-gray-800">{applicantName}</strong>, size uygun görüşme zamanını seçin.
                  </p>
                )}

                {errorMsg && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600 mb-4">
                    {errorMsg}
                  </div>
                )}

                {grouped.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Şu an müsait görüşme zamanı bulunmuyor.</p>
                    <p className="text-xs mt-1">En kısa sürede size ulaşacağız.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {grouped.map(([day, daySlots]) => (
                      <div key={day}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          {fmtDate(daySlots[0]!.startAt)}
                        </p>
                        <div className="space-y-2">
                          {daySlots.map(slot => {
                            const isSelected = selectedSlot?.id === slot.id;
                            return (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-[#294f73] bg-[#294f73]/5 ring-1 ring-[#294f73]'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {fmtTime(slot.startAt)} – {fmtTime(slot.endAt)}
                                  </p>
                                  {slot.notes && (
                                    <p className="text-xs text-gray-400 mt-0.5">{slot.notes}</p>
                                  )}
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-[#294f73] bg-[#294f73]' : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {grouped.length > 0 && (
                  <button
                    onClick={handleSlotConfirm}
                    disabled={!selectedSlot || status === 'picking'}
                    className="w-full mt-6 py-3 bg-[#294f73] text-white font-semibold rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    {status === 'picking'
                      ? 'Onaylanıyor…'
                      : selectedSlot
                        ? meetingOptions.length > 1
                          ? 'Devam Et →'
                          : 'Bu Zamanı Seçiyorum →'
                        : 'Bir zaman seçin'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © Haritailesi Vakfı — <a href="https://haritailesi.org" className="underline">haritailesi.org</a>
        </p>
      </div>
    </div>
  );
}

export default function GorusmeTakvimPage() {
  return (
    <Suspense>
      <SlotPicker />
    </Suspense>
  );
}
