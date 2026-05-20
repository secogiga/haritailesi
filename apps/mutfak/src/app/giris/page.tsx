'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LoginSchema } from '@/lib/schemas';

export default function GirisPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await login(result.data.email, result.data.password);
      router.replace('/akis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.');
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
          <h1 className="text-lg font-bold text-gray-900 mb-4 text-center">Üye Girişi</h1>
          {resetSuccess && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 mb-4 text-center">
              Şifreniz güncellendi. Giriş yapabilirsiniz.
            </p>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] ${fieldErrors.email ? 'border-red-400' : 'border-gray-300'}`}
              />
              {fieldErrors.email && <p id="email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] ${fieldErrors.password ? 'border-red-400' : 'border-gray-300'}`}
              />
              {fieldErrors.password && <p id="password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#26496b] text-white font-semibold py-2.5 rounded-lg hover:bg-[#1e3a56] transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>

            <div className="text-center mt-1">
              <Link href="/sifremi-unuttum" className="text-xs text-gray-500 hover:text-[#26496b] transition-colors underline underline-offset-2">
                Şifremi unuttum
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 space-y-3 text-center">
          <p className="text-white/50 text-xs">
            Sadece onaylı Haritailesi üyeleri erişebilir.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-1.5 text-xs">
            <a
              href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}/uye-ol`}
              className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
            >
              Üye değil misiniz? Başvurun
            </a>
            <span className="text-white/20 hidden sm:inline">·</span>
            <a
              href={`${process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org'}`}
              className="text-white/60 hover:text-white transition-colors"
            >
              haritailesi.org
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
