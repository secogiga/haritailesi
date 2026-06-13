'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Geçerli e-posta girin.'),
  password: z.string().min(8, 'Şifre zorunludur.'),
});
type F = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: F) {
    try {
      const { accessToken, refreshToken } = await adminApi.login(values.email, values.password);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      router.push('/basvurular');
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Giriş başarısız.' });
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-mavi)]">Haritailesi Yönetim</h1>
          <p className="text-sm text-gray-500 mt-1">Yönetici Girişi</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-8 space-y-4">
          {errors.root && (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">{errors.root.message}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">E-Posta</label>
            <input {...register('email')} type="email" autoComplete="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-mavi-acik)] focus:ring-[var(--color-mavi-acik)]" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input {...register('password')} type="password" autoComplete="current-password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-mavi-acik)] focus:ring-[var(--color-mavi-acik)]" />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting}
            className="w-full py-2.5 text-white font-semibold rounded-lg bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </main>
  );
}
