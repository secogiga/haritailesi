'use client';

import { useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type ApplyType = 'mentor' | 'mentee';

export function MentorApplyForm() {
  const [applyType, setApplyType] = useState<ApplyType>('mentee');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    expertise: '',
    goals: '',
    preferredFormat: 'online',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/community/mentor-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          displayName: form.displayName,
          type: applyType,
          source: 'sahne',
          expertise: applyType === 'mentor' ? form.expertise : undefined,
          goals: applyType === 'mentee' ? form.goals : undefined,
          preferredFormat: form.preferredFormat,
        }),
      });
      if (!res.ok) throw new Error('Başvuru gönderilemedi.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]';

  return (
    <div className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 py-14">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Mentorluk Programına Başvur</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
            Başvurunuz ekibimiz tarafından incelenir ve uygun eşleştirme yapılır.
          </p>
        </div>

        {done ? (
          <div className="bg-green-50 rounded-2xl border border-green-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Başvurunuz Alındı!</h3>
            <p className="text-sm text-gray-500">Ekibimiz inceleyip size dönüş yapacak.</p>
            <button
              onClick={() => { setDone(false); setForm({ email: '', displayName: '', expertise: '', goals: '', preferredFormat: 'online' }); }}
              className="mt-4 text-sm text-[#26496b] hover:underline font-medium"
            >
              Yeni başvuru
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Tip seçimi */}
            <div className="flex">
              {(['mentee', 'mentor'] as ApplyType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setApplyType(t)}
                  className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${
                    applyType === t
                      ? 'border-[#26496b] text-[#26496b] bg-[#26496b]/5'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'mentee' ? '🎓 Mentee Olmak İstiyorum' : '🤝 Mentor Olmak İstiyorum'}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    className={inp}
                    placeholder="Adınız Soyadınız"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta *</label>
                  <input
                    type="email"
                    required
                    className={inp}
                    placeholder="ornek@email.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              {applyType === 'mentor' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Uzmanlık Alanınız</label>
                  <textarea
                    rows={3}
                    className={inp}
                    placeholder="Hangi konularda rehberlik yapabilirsiniz? (CBS, kadastro, kariyer danışmanlığı...)"
                    value={form.expertise}
                    onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hedefleriniz</label>
                  <textarea
                    rows={3}
                    className={inp}
                    placeholder="Mentorluktan ne öğrenmek istiyorsunuz? Kariyer hedefiniz nedir?"
                    value={form.goals}
                    onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tercih Ettiğiniz Format</label>
                <select
                  className={inp}
                  value={form.preferredFormat}
                  onChange={(e) => setForm((f) => ({ ...f, preferredFormat: e.target.value }))}
                >
                  <option value="online">Online</option>
                  <option value="in_person">Yüz Yüze</option>
                  <option value="both">Her İkisi</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
              >
                {busy ? 'Gönderiliyor...' : applyType === 'mentor' ? 'Mentor Başvurusu Gönder' : 'Mentee Başvurusu Gönder'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
