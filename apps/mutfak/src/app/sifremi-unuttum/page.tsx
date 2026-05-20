'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mutfakApi } from '@/lib/api';

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await mutfakApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#26496b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-white">harit</span><span className="text-[#66aca9]">a</span><span className="text-white">ilesi</span>
          </span>
          <p className="mt-2 text-white/60 text-sm font-medium">Mutfak</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-2">E-posta Gönderildi</h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                Eğer bu e-posta ile kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı kısa süre içinde ulaşacak.
              </p>
              <Link href="/giris" className="mt-6 block text-sm font-medium text-[#26496b] hover:underline">
                Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900 mb-2 text-center">Şifremi Unuttum</h1>
              <p className="text-sm text-gray-500 text-center mb-6">
                E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.
              </p>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                    E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
                    placeholder="ornek@email.com"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#26496b] text-white font-semibold py-2.5 rounded-lg hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
                >
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </button>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <div className="mt-6 text-center">
            <Link href="/giris" className="text-white/60 hover:text-white text-xs transition-colors underline underline-offset-2">
              Giriş sayfasına dön
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
