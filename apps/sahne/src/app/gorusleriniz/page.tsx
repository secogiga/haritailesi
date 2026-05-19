'use client';

import { useState } from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type FormType = 'talep' | 'gorus';

export default function GoruslerinizPage() {
  const [type, setType] = useState<FormType>('gorus');
  const [form, setForm] = useState({ email: '', subject: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/community/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email || undefined,
          subject: form.subject,
          body: form.body,
          type,
          source: 'sahne',
        }),
      });
      if (!res.ok) throw new Error('Gönderim başarısız oldu.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f4f7fa] py-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[#26496b]">Görüş & Talep</h1>
            <p className="text-gray-500 mt-2 text-sm">Öneri, istek veya görüşlerinizi bizimle paylaşın.</p>
          </div>

          {done ? (
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Teşekkürler!</h2>
              <p className="text-gray-500 text-sm">Görüşünüz ekibimize iletildi. En kısa sürede dönüş yapacağız.</p>
              <button
                onClick={() => { setDone(false); setForm({ email: '', subject: '', body: '' }); }}
                className="mt-6 text-sm font-medium text-[#26496b] hover:underline"
              >
                Yeni form gönder
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              {/* Tip seçimi */}
              <div className="flex gap-3 mb-6">
                {(['gorus', 'talep'] as FormType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      type === t
                        ? 'bg-[#26496b] text-white shadow-sm'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {t === 'gorus' ? '💬 Görüş Bildir' : '📋 Talep Gönder'}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta (opsiyonel)</label>
                  <input
                    type="email"
                    className={inp}
                    placeholder="yanit@email.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
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
                        ? 'Platform, etkinlikler veya hizmetler hakkında görüşünüzü yazın...'
                        : 'Detaylı talebinizi açıklayın...'
                    }
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
                >
                  {busy ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
