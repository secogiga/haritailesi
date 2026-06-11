'use client';

import { useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export function KurumsalBasvuruButton({ label = 'İletişime Geç' }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full text-center px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-colors border border-white/20"
      >
        {label}
      </button>
      {open && <KurumsalBasvuruModal onClose={() => setOpen(false)} />}
    </>
  );
}

type FormState = {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  colabType: string;
  message: string;
};

const COLAB_OPTIONS = [
  { value: 'reklam', label: 'Reklam & Tanıtım' },
  { value: 'etkinlik_sponsorlugu', label: 'Etkinlik Sponsorluğu' },
  { value: 'icerik_isbirligi', label: 'İçerik İşbirliği' },
  { value: 'sosyal_medya', label: 'Sosyal Medya Görünürlüğü' },
  { value: 'diger', label: 'Diğer' },
];

function KurumsalBasvuruModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>({
    company: '', contactName: '', email: '', phone: '', colabType: '', message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    const colabLabel = COLAB_OPTIONS.find(o => o.value === form.colabType)?.label ?? form.colabType;
    const bodyLines = [
      `Kurum / Şirket: ${form.company}`,
      `İletişim Kişisi: ${form.contactName}`,
      `E-posta: ${form.email}`,
      form.phone ? `Telefon: ${form.phone}` : null,
      `İşbirliği Türü: ${colabLabel}`,
      '',
      'Mesaj:',
      form.message,
    ].filter(l => l !== null).join('\n');

    try {
      const res = await fetch(`${API_URL}/api/v1/community/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          subject: `Kurumsal Başvuru: ${form.company} — ${colabLabel}`,
          body: bodyLines,
          type: 'reklam',
          source: 'sahne',
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  const inputCls =
    'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Kurumsal İşbirliği</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Reklam, sponsorluk veya içerik işbirliği için bize ulaşın.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success */}
        {status === 'success' ? (
          <div className="px-6 py-10 text-center flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#26496b]/10 dark:bg-blue-950/40 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#26496b] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-gray-900 dark:text-slate-100">Talebiniz Alındı!</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">
              En kısa sürede sizinle iletişime geçeceğiz.
            </p>
            <button onClick={onClose} className="mt-2 px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors">
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Kurum / Şirket *</label>
                <input type="text" required value={form.company} onChange={set('company')} placeholder="Şirket adı" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">İletişim Kişisi *</label>
                <input type="text" required value={form.contactName} onChange={set('contactName')} placeholder="Ad Soyad" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">E-posta *</label>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="ornek@sirket.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Telefon <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+90 5xx xxx xx xx" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">İşbirliği Türü *</label>
              <select required value={form.colabType} onChange={set('colabType')} className={inputCls}>
                <option value="">Seçiniz…</option>
                {COLAB_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Mesajınız *</label>
              <textarea
                required
                rows={4}
                minLength={10}
                value={form.message}
                onChange={set('message')}
                placeholder="Hedeflerinizi, beklentilerinizi ve varsa bütçe aralığını kısaca belirtin."
                className={`${inputCls} resize-none`}
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-500">Bir hata oluştu, lütfen tekrar deneyin.</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
                Ekibimiz 2 iş günü içinde geri dönecektir.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] disabled:opacity-60 rounded-xl transition-colors"
                >
                  {status === 'loading' ? 'Gönderiliyor…' : 'Gönder'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
