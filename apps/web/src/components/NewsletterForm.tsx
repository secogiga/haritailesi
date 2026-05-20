'use client';

import { useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) setEmail('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="text-emerald-400 text-sm font-medium py-3">
        Abone oldunuz! Haberlerimizi takip edin.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
        <input
          type="email"
          required
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/50 text-sm max-w-sm"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-[var(--color-altin)] hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors text-sm shrink-0 disabled:opacity-70"
        >
          {status === 'loading' ? 'Gönderiliyor...' : 'Abone Ol'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-2 text-center">Bir hata oluştu. Lütfen tekrar deneyin.</p>
      )}
    </div>
  );
}
