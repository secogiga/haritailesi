'use client';

import { useEffect, useRef, useState } from 'react';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import type { JobListing } from '@/lib/api';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  listing: JobListing;
  onClose: () => void;
}

export function ContactModal({ listing, onClose }: Props) {
  const { user } = useSahneAuth();
  const [name, setName]       = useState(user?.profile?.displayName ?? '');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [status, setStatus]   = useState<Status>('idle');
  const [error, setError]     = useState('');
  const firstInputRef          = useRef<HTMLInputElement>(null);

  // Pre-fill when user loads after mount
  useEffect(() => {
    if (user && !name)  setName(user.profile?.displayName ?? '');
    if (user && !email) setEmail(user.email);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus first empty field
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/v1/marketplace/job-listings/${listing.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName: name.trim(), senderEmail: email.trim(), message: message.trim() }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({})) as { message?: string };
        setError(data.message ?? 'Bir hata oluştu. Lütfen tekrar deneyin.');
        setStatus('error');
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setStatus('error');
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-teal)] mb-1">İletişime Geç</p>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 truncate">{listing.title}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{listing.company}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1">Mesajınız İletildi</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                İlan sahibi en kısa sürede sizinle iletişime geçecek.
              </p>
              <button
                onClick={onClose}
                className="text-sm font-semibold text-[var(--color-mavi)] hover:underline"
              >
                Kapat
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Adınız Soyadınız <span className="text-red-500">*</span>
                </label>
                <input
                  ref={!user?.profile?.displayName ? firstInputRef : undefined}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Adınız Soyadınız"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/40 focus:border-[var(--color-mavi)] transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  E-posta Adresiniz <span className="text-red-500">*</span>
                </label>
                <input
                  ref={!user ? firstInputRef : undefined}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ornek@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/40 focus:border-[var(--color-mavi)] transition-colors"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Mesajınız <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Kendinizi tanıtın ve ilanla ilgili düşüncelerinizi paylaşın..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/40 focus:border-[var(--color-mavi)] transition-colors resize-none"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">En az 10 karakter</p>
              </div>

              {/* Error */}
              {status === 'error' && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3.5 py-2.5">
                  {error}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 bg-[var(--color-mavi)] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[var(--color-mavi-acik)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Gönderiliyor...
                    </>
                  ) : (
                    'Mesaj Gönder'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
              </div>

              <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
                Mesajınız e-posta ile ilan sahibine iletilir. E-posta adresiniz görünür olacaktır.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
