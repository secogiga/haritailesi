'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { mutfakApi } from '@/lib/api';

const FORMATS = ['Online', 'Yüz Yüze', 'Hibrit'];
const LEVELS = ['Başlangıç', 'Orta', 'İleri'];

const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] transition';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function EgitimGonderPage() {
  const { user } = useAuth();
  const token = useToken();

  const [form, setForm] = useState({
    title: '',
    format: '',
    level: '',
    duration: '',
    description: '',
    contactInfo: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !user) return;
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
      await mutfakApi.submitContentRequest({
        email: user.email,
        displayName: user.profile?.displayName ?? user.email,
        source: 'mutfak',
        type: 'egitim',
        title: form.title,
        description: descriptionFull,
        ...(form.contactInfo ? { contactInfo: form.contactInfo } : {}),
      }, token);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-slate-100 mb-2">Eğitim Talebiniz Alındı!</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
          Ekibimiz inceleyip en kısa sürede sizinle iletişime geçecek.
        </p>
        <Link href="/akis" className="px-6 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-dark)] rounded-xl transition-colors">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* Başlık */}
      <div className="mb-6">
        <Link href="/akis" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-mavi)]/10 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--color-mavi)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-slate-100 font-display">Eğitim Gönder</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 ml-[52px]">
          Vermek istediğin eğitimi anlat, ekip inceleyip kataloğa eklesin.
        </p>
      </div>

      {/* Kullanıcı bilgisi */}
      <div className="flex items-center gap-3 bg-[var(--color-mavi)]/5 dark:bg-blue-900/20 border border-[var(--color-mavi)]/15 rounded-xl px-4 py-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-[var(--color-mavi)] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {(user?.profile?.displayName ?? user?.email ?? '?')[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">
            {user?.profile?.displayName ?? user?.email}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">{user?.email}</p>
        </div>
        <span className="ml-auto text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Üye</span>
      </div>

      {/* Form */}
      <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Eğitim Başlığı *</label>
          <input required type="text" value={form.title} onChange={set('title')}
            placeholder="Eğitimin tam adı" className={inp} />
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
            <input type="text" value={form.duration} onChange={set('duration')}
              placeholder="8 saat" className={inp} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Açıklama *</label>
          <textarea required rows={4} value={form.description} onChange={set('description')}
            placeholder="Eğitimin içeriği, hedef kitle, ön gereksinimler, neden bu eğitimi vermek istiyorsun…"
            className={`${inp} resize-none`} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            İletişim / Website
            <span className="text-gray-400 font-normal ml-1">(isteğe bağlı)</span>
          </label>
          <input type="text" value={form.contactInfo} onChange={set('contactInfo')}
            placeholder="LinkedIn profil linki, telefon veya website" className={inp} />
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{errorMsg}</p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Editörler inceler ve uygunsa kataloğa eklenir.</p>
          <button type="submit" disabled={status === 'loading'}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-dark)] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 shrink-0">
            {status === 'loading' && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {status === 'loading' ? 'Gönderiliyor…' : 'Eğitimi Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
}
