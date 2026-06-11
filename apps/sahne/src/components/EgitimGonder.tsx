'use client';

import { useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const FORMATS = ['Online', 'Yüz Yüze', 'Hibrit'];
const LEVELS = ['Başlangıç', 'Orta', 'İleri'];

const EMPTY = {
  displayName: '',
  email: '',
  title: '',
  format: '',
  level: '',
  duration: '',
  description: '',
  contactInfo: '',
};

type Status = 'idle' | 'loading' | 'success' | 'error';
type Mode = 'choose' | 'form';

const inp = 'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] transition';

function Modal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('choose');
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const descriptionFull = [
      form.format ? `Format: ${form.format}` : '',
      form.level ? `Seviye: ${form.level}` : '',
      form.duration ? `Tahmini Süre: ${form.duration}` : '',
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
          type: 'egitim',
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 sm:rounded-2xl rounded-t-3xl shadow-2xl border-t sm:border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Eğitim Gönder</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Vermek istediğin eğitimi topluluğa duyur — ekip inceler, kataloğa ekler.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-4 shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Başarı */}
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Gönderildi!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Eğitim talebiniz alındı. Ekibimiz inceleyip en kısa sürede iletişime geçecek.
            </p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors">
              Kapat
            </button>
          </div>
        ) : mode === 'choose' ? (
          /* Seçim ekranı */
          <div className="px-6 py-6 space-y-3 flex-1">
            {/* Mutfak üyesi */}
            <a
              href={`${MUTFAK_URL}/egitim/gonder`}
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
                <p className="font-bold text-white text-sm mb-0.5">Üye Girişi ile Gönder</p>
                <p className="text-xs text-white/60 leading-snug">Mutfak hesabınla hızlıca gönder. Bilgilerin otomatik doldurulur.</p>
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
                <p className="font-bold text-gray-900 dark:text-slate-100 text-sm mb-0.5">Form ile Gönder</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-snug">Üye olmadan gönderebilirsin. Ad, e-posta ve kurs bilgilerini doldur.</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-[11px] text-center text-gray-400 dark:text-slate-500 pt-1">
              Eğitimleri editörler inceler ve uygun bulunursa kataloğa eklenir.
            </p>
          </div>
        ) : (
          /* Form ekranı */
          <form onSubmit={e => void handleSubmit(e)} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <button type="button" onClick={() => setMode('choose')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors mb-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Ad Soyad *</label>
                <input required type="text" value={form.displayName} onChange={set('displayName')} placeholder="Adınız soyadınız" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">E-posta *</label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="ornek@eposta.com" className={inp} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Eğitim Başlığı *</label>
              <input required type="text" value={form.title} onChange={set('title')} placeholder="Eğitimin tam adı" className={inp} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Format</label>
                <select value={form.format} onChange={set('format')} className={inp}>
                  <option value="">Seçin…</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Seviye</label>
                <select value={form.level} onChange={set('level')} className={inp}>
                  <option value="">Seçin…</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Süre</label>
                <input type="text" value={form.duration} onChange={set('duration')} placeholder="8 saat" className={inp} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Açıklama *</label>
              <textarea required rows={3} value={form.description} onChange={set('description')}
                placeholder="Eğitimin içeriği, hedef kitle, ön gereksinimler…"
                className={`${inp} resize-none`} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                İletişim
                <span className="text-gray-400 font-normal ml-1">(isteğe bağlı)</span>
              </label>
              <input type="text" value={form.contactInfo} onChange={set('contactInfo')}
                placeholder="Telefon, LinkedIn veya website" className={inp} />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{errorMsg}</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">Editörler inceler ve uygunsa kataloğa eklenir.</p>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={status === 'loading'}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
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

export function EgitimGonderButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/8 rounded-xl transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Eğitim Gönder
      </button>
      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}

export function EgitimGonderCTA() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d1b2a] to-[#26496b] relative">
        {/* Arka plan desen */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-7 sm:p-8">
          {/* İkon */}
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>

          {/* Metin */}
          <div className="flex-1">
            <p className="text-base font-black text-white mb-1">Eğitim mi Vermek İstiyorsun?</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Harita, geomatik veya CBS alanında paylaşmak istediğin bir eğitim varsa topluluğa duyur.
              Üye girişiyle ya da form doldurarak gönderebilirsin.
            </p>
          </div>

          {/* Butonlar */}
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <EgitimGonderButton />
          </div>
        </div>
      </div>

      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}
