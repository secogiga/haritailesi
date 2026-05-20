'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { mutfakApi } from '@/lib/api';

type FormType = 'gorus' | 'talep';

export default function TalepPage() {
  const { user } = useAuth();
  const token = useToken();

  const [type, setType] = useState<FormType>('gorus');
  const [form, setForm] = useState({
    email: user?.email ?? '',
    subject: '',
    body: '',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await mutfakApi.submitCommunityFeedback(
        {
          ...(form.email ? { email: form.email } : {}),
          subject: form.subject,
          body: form.body,
          type,
        },
        token || undefined,
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400';

  if (done) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-xl">
          <h1 className="text-xl font-bold text-gray-900 font-display mb-6">Görüş & Talep</h1>
          <div className="bg-green-50 rounded-2xl border border-green-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 mb-1">Teşekkürler!</h2>
            <p className="text-sm text-gray-500">Görüşünüz ekibimize iletildi. En kısa sürede dönüş yapacağız.</p>
            <button
              onClick={() => {
                setDone(false);
                setForm({ email: user?.email ?? '', subject: '', body: '' });
              }}
              className="mt-5 text-sm font-medium text-[#26496b] hover:underline"
            >
              Yeni form gönder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="max-w-xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 font-display">Görüş & Talep</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform, etkinlik veya hizmetler hakkında öneri ve görüşlerinizi paylaşın.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tip seçimi */}
          <div className="flex border-b border-gray-100">
            {(['gorus', 'talep'] as FormType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  type === t
                    ? 'border-[#26496b] text-[#26496b] bg-[#26496b]/4'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'gorus' ? '💬 Görüş Bildir' : '📋 Talep Gönder'}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
            {!user && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta (isteğe bağlı)</label>
                <input
                  type="email"
                  className={inp}
                  placeholder="yanit@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Konu *</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                className={inp}
                placeholder={type === 'gorus' ? 'Görüşünüzün konusu' : 'Talebinizin konusu'}
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {type === 'gorus' ? 'Görüşünüz *' : 'Talebiniz *'}
              </label>
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                className={inp}
                placeholder={
                  type === 'gorus'
                    ? 'Platform, etkinlikler veya hizmetler hakkında görüşünüzü yazın…'
                    : 'Detaylı talebinizi açıklayın…'
                }
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
            >
              {busy ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
