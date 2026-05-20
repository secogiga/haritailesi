'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { mutfakApi } from '@/lib/api';

export default function SifreSifirlaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await mutfakApi.resetPassword(token, password);
      router.replace('/giris?reset=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre sıfırlanamadı.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-[#26496b] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <p className="text-sm text-red-600">Geçersiz veya eksik sıfırlama bağlantısı.</p>
          <Link href="/sifremi-unuttum" className="mt-4 block text-sm font-medium text-[#26496b] hover:underline">
            Yeni bağlantı talep et
          </Link>
        </div>
      </main>
    );
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
          <h1 className="text-lg font-bold text-gray-900 mb-2 text-center">Yeni Şifre Belirle</h1>
          <p className="text-sm text-gray-500 text-center mb-6">En az 8 karakter kullanın.</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Yeni Şifre
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirm">
                Şifre Tekrar
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
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
              {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
