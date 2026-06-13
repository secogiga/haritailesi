'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mutfakApi } from '@/lib/api';

function SifreBelirleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
      const tokens = await mutfakApi.setupPassword(token, password);
      localStorage.setItem('mutfak_access', tokens.accessToken);
      localStorage.setItem('mutfak_refresh', tokens.refreshToken);
      setDone(true);
      setTimeout(() => router.replace('/akis'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre belirlenemedi. Bağlantı geçersiz veya süresi dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <p className="text-sm text-red-600">Geçersiz veya eksik hesap kurulum bağlantısı.</p>
        <p className="mt-3 text-sm text-gray-500">Lütfen e-postanızdaki bağlantıyı kullanın.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Hesabınız Hazır!</h2>
        <p className="text-sm text-gray-500">Mutfak'a yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
      <h1 className="text-lg font-bold text-gray-900 mb-2 text-center">Şifrenizi Belirleyin</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Mutfak hesabınız için bir şifre oluşturun. En az 8 karakter kullanın.</p>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            Şifre
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
          {loading ? 'Kaydediliyor...' : 'Hesabı Oluştur'}
        </button>
      </form>
    </div>
  );
}

export default function SifreBelirlePage() {
  return (
    <main className="min-h-screen bg-[#26496b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-white">harit</span><span className="text-[#66aca9]">a</span><span className="text-white">ilesi</span>
          </span>
          <p className="mt-2 text-white/60 text-sm font-medium">Mutfak</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
            <p className="text-sm text-gray-500">Yükleniyor...</p>
          </div>
        }>
          <SifreBelirleForm />
        </Suspense>
      </div>
    </main>
  );
}
