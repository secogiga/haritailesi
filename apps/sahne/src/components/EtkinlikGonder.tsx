'use client';

import { useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const EVENT_TYPES = [
  { value: 'kongre', label: 'Kongre' },
  { value: 'networking', label: 'Networking Buluşması' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'calistay', label: 'Çalıştay / Workshop' },
  { value: 'sempozyum', label: 'Sempozyum' },
  { value: 'odul', label: 'Ödül Töreni' },
  { value: 'diger', label: 'Diğer' },
];

const EMPTY = {
  displayName: '',
  email: '',
  title: '',
  eventType: '',
  date: '',
  location: '',
  description: '',
  contactInfo: '',
};

type Status = 'idle' | 'loading' | 'success' | 'error';
type Mode = 'choose' | 'form';

function Modal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('choose');
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const typeLabel = EVENT_TYPES.find((t) => t.value === form.eventType)?.label ?? form.eventType;
    const descriptionFull = [
      `Etkinlik Türü: ${typeLabel || '—'}`,
      form.date ? `Tarih: ${form.date}` : '',
      form.location ? `Lokasyon: ${form.location}` : '',
      '',
      form.description,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch(`${API_URL}/api/v1/marketplace/content-requests/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          email: form.email,
          source: 'sahne',
          type: 'etkinlik',
          title: form.title,
          description: descriptionFull,
          contactInfo: form.contactInfo || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? 'Gönderim başarısız.');
      }

      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setStatus('error');
    }
  }

  const inp = 'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] dark:focus:border-blue-500 transition';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Etkinlik Gönder</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Düzenleyeceğin etkinliği topluluğa duyur. Ekibimiz inceler ve sayfaya ekler.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-4 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Başarı ekranı */}
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Gönderildi!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Etkinlik talebiniz alındı. Ekibimiz inceleyip en kısa sürede sayfaya ekleyecektir.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors"
            >
              Kapat
            </button>
          </div>
        ) : mode === 'choose' ? (
          /* Seçim ekranı */
          <div className="px-6 py-6 space-y-3 flex-1">
            {/* Mutfak üyesi */}
            <a
              href={`${MUTFAK_URL}/etkinlikler`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 w-full bg-gradient-to-br from-[#26496b] to-[#1a3350] hover:from-[#1d3a57] hover:to-[#162b40] rounded-2xl p-5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm mb-0.5">Üye Girişi ile Duyur</p>
                <p className="text-xs text-white/60 leading-snug">Mutfak hesabınla hızlıca ekle. Bilgilerin otomatik doldurulur.</p>
              </div>
              <svg className="w-5 h-5 text-white/50 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Form ile */}
            <button
              onClick={() => setMode('form')}
              className="group flex items-center gap-4 w-full bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-[#26496b]/10 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-[#26496b] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-slate-100 text-sm mb-0.5">Form ile Duyur</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-snug">Üye olmadan gönderebilirsin. Ad, e-posta ve etkinlik bilgilerini doldur.</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-[11px] text-center text-gray-400 dark:text-slate-500 pt-1">
              Etkinlikler editörler tarafından incelenir ve uygun bulunursa sayfaya eklenir.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <button type="button" onClick={() => setMode('choose')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors mb-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Ad Soyad *</label>
                <input
                  required type="text" value={form.displayName} onChange={set('displayName')}
                  placeholder="Adınız ve soyadınız" className={inp}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">E-posta *</label>
                <input
                  required type="email" value={form.email} onChange={set('email')}
                  placeholder="ornek@eposta.com" className={inp}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Etkinlik Adı *</label>
              <input
                required type="text" value={form.title} onChange={set('title')}
                placeholder="Etkinliğin tam adı" className={inp}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Tür *</label>
                <select required value={form.eventType} onChange={set('eventType')} className={inp}>
                  <option value="">Seçin…</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Tarih</label>
                <input
                  type="text" value={form.date} onChange={set('date')}
                  placeholder="15 Eylül 2025" className={inp}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Lokasyon</label>
              <input
                type="text" value={form.location} onChange={set('location')}
                placeholder="İstanbul / Online / Hibrit" className={inp}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Açıklama *</label>
              <textarea
                required rows={3} value={form.description} onChange={set('description')}
                placeholder="Etkinlik hakkında kısa bilgi, hedef kitle, kayıt linki…"
                className={`${inp} resize-none`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                İletişim / Kayıt Linki
                <span className="text-gray-400 font-normal ml-1">(isteğe bağlı)</span>
              </label>
              <input
                type="text" value={form.contactInfo} onChange={set('contactInfo')}
                placeholder="https://kayit.link veya telefon/e-posta" className={inp}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
                Editörler inceleyip sayfaya ekler.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button" onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit" disabled={status === 'loading'}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {status === 'loading' && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
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

export function EtkinlikGonderButton({
  label = 'Etkinlik Gönder',
  variant = 'outline',
}: {
  label?: string;
  variant?: 'outline' | 'solid' | 'dark';
}) {
  const [open, setOpen] = useState(false);

  const cls =
    variant === 'dark'
      ? 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors'
      : variant === 'solid'
        ? 'px-5 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors'
        : 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/8 rounded-xl transition-all';

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {label}
      </button>
      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}
