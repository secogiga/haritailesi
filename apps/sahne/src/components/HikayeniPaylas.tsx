'use client';

import { useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export function HikayeniPaylasButton({
  label = 'Sen de Hikayeni Paylaş',
  variant = 'amber',
}: {
  label?: string;
  variant?: 'amber' | 'navy' | 'outline';
}) {
  const [open, setOpen] = useState(false);

  const cls =
    variant === 'amber'
      ? 'px-6 py-3 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors'
      : variant === 'navy'
        ? 'px-6 py-3 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors'
        : 'px-6 py-3 text-sm font-semibold text-white border-2 border-white/40 hover:border-white/70 hover:bg-white/5 rounded-xl transition-colors';

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>{label}</button>
      {open && <HikayeniPaylasModal onClose={() => setOpen(false)} />}
    </>
  );
}

type FormState = { name: string; title: string; org: string; linkedin: string; story: string; email: string };

function HikayeniPaylasModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>({ name: '', title: '', org: '', linkedin: '', story: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    const bodyLines = [
      `Ad Soyad: ${form.name}`,
      `Unvan / Meslek: ${form.title}`,
      form.org ? `Kurum: ${form.org}` : null,
      form.linkedin ? `Profil: ${form.linkedin}` : null,
      '',
      'Hikaye:',
      form.story,
    ].filter(l => l !== null).join('\n');

    try {
      const res = await fetch(`${API_URL}/api/v1/community/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email || undefined,
          subject: `Hikaye: ${form.name} — ${form.title}`,
          body: bodyLines,
          type: 'hikaye',
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
    'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Hikayeni Paylaş</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Kariyer yolculuğunu topluluğa anlat. Editörler inceleyip yayınlar.
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
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="font-bold text-gray-900 dark:text-slate-100">Teşekkürler!</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">
              Hikayen alındı. Editörlerimiz inceledikten sonra seninle iletişime geçecek.
            </p>
            <button onClick={onClose} className="mt-2 px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors">
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Ad Soyad *</label>
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Adınız soyadınız" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Unvan / Meslek *</label>
                <input type="text" required value={form.title} onChange={set('title')} placeholder="Harita Müh., CBS Uzmanı…" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Kurum / Organizasyon <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
              </label>
              <input type="text" value={form.org} onChange={set('org')} placeholder="Çalıştığın veya temsil ettiğin kurum" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                LinkedIn veya Sahne Profil Linki <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
              </label>
              <input type="url" value={form.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/…" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Hikayeni Anlat *</label>
              <textarea
                required
                rows={5}
                minLength={10}
                value={form.story}
                onChange={set('story')}
                placeholder="Mesleki yolculuğun, ilham aldığın anlar, topluluğa vermek istediğin mesaj…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                E-posta <span className="text-gray-400 font-normal">(isteğe bağlı — seni haberdar edelim)</span>
              </label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="ornek@mail.com" className={inputCls} />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-500">Bir hata oluştu, lütfen tekrar deneyin.</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
                Editörler inceleyip seninle iletişime geçer.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl transition-colors"
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
