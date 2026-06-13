'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface InterviewInfo {
  id: string;
  state: string;
  meetUrl: string | null;
  confirmedAt: string | null;
  slot: {
    startAt: string;
    endAt: string;
  };
  application: {
    formData: Record<string, unknown>;
  };
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const defaultAction = searchParams.get('action') as 'confirm' | 'reschedule' | null;

  const [info, setInfo]       = useState<InterviewInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [action, setAction]           = useState<'confirm' | 'reschedule' | null>(defaultAction);
  const [rescheduleNote, setNote]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState<'confirmed' | 'reschedule_requested' | null>(null);
  const [submitErr, setSubmitErr]     = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadErr('Geçersiz bağlantı. Lütfen e-postanızdaki bağlantıyı kullanın.');
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/v1/scheduling/confirm/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({})) as { message?: string };
          throw new Error(err.message ?? 'Bağlantı geçersiz veya süresi dolmuş.');
        }
        return r.json() as Promise<InterviewInfo>;
      })
      .then(setInfo)
      .catch((e: Error) => setLoadErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit() {
    if (!token || !action) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/scheduling/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rescheduleNote: rescheduleNote || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'İşlem gerçekleştirilemedi.');
      }
      const data = await res.json() as { status: string };
      setResult(data.status as 'confirmed' | 'reschedule_requested');
    } catch (e) {
      setSubmitErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6fa]">
        <div className="w-10 h-10 border-3 border-[#294f73] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6fa] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Bağlantı Geçersiz</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{loadErr}</p>
          <p className="mt-4 text-sm text-gray-400">
            Yardım için:{' '}
            <a href="mailto:destek@haritailesi.org" className="text-[#294f73] font-medium hover:underline">
              destek@haritailesi.org
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!info) return null;

  // Zaten işlenmiş
  if (info.state !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6fa] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">{info.state === 'confirmed' ? '✅' : '🔄'}</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {info.state === 'confirmed' ? 'Görüşme Zaten Onaylandı' : 'Bu Talep Zaten İşlendi'}
          </h1>
          <p className="text-gray-500 text-sm">
            Bu bağlantı daha önce kullanıldı. Sorularınız için destek@haritailesi.org adresine yazabilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  // Sonuç göster
  if (result === 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6fa] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Görüşme Onaylandı!</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Görüşme zamanını onayladınız. Onay e-postası kısa süre içinde e-posta adresinize gönderilecektir.
          </p>
          <div className="bg-[#f5f8fc] rounded-xl p-4 text-sm text-gray-700">
            <strong>Görüşme Zamanı:</strong><br />
            {fmtDateTime(info.slot.startAt)}
          </div>
          {info.meetUrl && (
            <a href={info.meetUrl} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-[#294f73] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              Görüşmeye Katıl →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (result === 'reschedule_requested') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6fa] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Yeniden Zamanlama Talebiniz Alındı</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Ekibimiz yeni bir görüşme zamanı belirleyecek ve kısa süre içinde size ulaşacaktır.
          </p>
        </div>
      </div>
    );
  }

  // Ana sayfa — seçim yap
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f6fa] px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="https://raw.githubusercontent.com/secogiga/haritailesi/main/apps/sahne/public/logo-email.png"
            alt="Haritailesi"
            className="h-10 w-auto"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#294f73] px-6 py-5">
            <h1 className="text-white text-xl font-bold">Görüşme Daveti</h1>
            <p className="text-white/70 text-sm mt-1">Haritailesi Vakfı üyelik görüşmeniz planlandı</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Görüşme Bilgisi */}
            <div className="bg-[#f5f8fc] border border-[#dce5f0] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Görüşme Tarihi & Saati</p>
                  <p className="text-gray-900 font-semibold text-sm">{fmtDateTime(info.slot.startAt)}</p>
                </div>
              </div>
              {info.meetUrl && (
                <div className="flex items-start gap-3 mt-3 pt-3 border-t border-[#dce5f0]">
                  <span className="text-2xl">🎥</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Görüşme Platformu</p>
                    <a href={info.meetUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[#294f73] text-sm font-medium hover:underline break-all">
                      Görüşme Linkine Git →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Seçim */}
            {!action && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">Bu görüşme zamanı size uygun mu?</p>
                <button
                  onClick={() => setAction('confirm')}
                  className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  ✓ Evet, Zamanı Onaylıyorum
                </button>
                <button
                  onClick={() => setAction('reschedule')}
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  🔄 Başka Bir Zaman İstiyorum
                </button>
              </div>
            )}

            {/* Onaylama */}
            {action === 'confirm' && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  Görüşme zamanını onaylıyorsunuz: <strong>{fmtDateTime(info.slot.startAt)}</strong>
                </div>
                {submitErr && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitErr}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setAction(null)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Geri
                  </button>
                  <button onClick={() => void handleSubmit()} disabled={submitting}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
                    {submitting ? 'Onaylanıyor…' : 'Onayla →'}
                  </button>
                </div>
              </div>
            )}

            {/* Yeniden zamanlama */}
            {action === 'reschedule' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Yeniden zamanlama nedeninizi kısaca belirtebilirsiniz (isteğe bağlı):</p>
                <textarea
                  value={rescheduleNote}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="örn. Bu haftaya uygun değilim, önümüzdeki hafta olabilir mi?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#294f73]/20 resize-none"
                />
                {submitErr && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitErr}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setAction(null)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Geri
                  </button>
                  <button onClick={() => void handleSubmit()} disabled={submitting}
                    className="flex-1 py-2.5 bg-[#294f73] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
                    {submitting ? 'Gönderiliyor…' : 'Talebi Gönder →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Sorularınız için:{' '}
          <a href="mailto:destek@haritailesi.org" className="text-[#294f73] hover:underline">
            destek@haritailesi.org
          </a>
        </p>
      </div>
    </div>
  );
}

export default function GorusmeOnaylaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6fa]">
        <div className="w-10 h-10 border-[3px] border-[#294f73] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmPage />
    </Suspense>
  );
}
