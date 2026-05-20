'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { apiSetupPassword } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { setTokens } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError('Geçersiz bağlantı. Lütfen e-postanızdaki bağlantıyı kullanın.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      const tokens = await apiSetupPassword(token, password);
      await setTokens(tokens.accessToken, tokens.refreshToken);
      router.push('/hesabim' as Route);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
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
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirm">
          Şifreyi Onayla
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-lg hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
      >
        {loading ? 'Kaydediliyor...' : 'Şifremi Belirle ve Giriş Yap'}
      </button>
    </form>
  );
}

export default function SifreBelirle() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#26496b]">Şifrenizi Belirleyin</h1>
          <p className="mt-2 text-sm text-gray-500">
            Haritailesi üyeliğiniz onaylandı! Hesabınıza erişmek için şifrenizi belirleyin.
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-gray-500 py-8">Yükleniyor...</div>}>
          <SetupPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
