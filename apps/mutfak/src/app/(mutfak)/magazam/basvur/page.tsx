'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { mutfakApi as api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SaticiBasvurPage() {
  const { user } = useAuth();
  const token = useToken();
  const router = useRouter();

  const [form, setForm] = useState({
    applicantName: user?.profile?.displayName ?? '',
    email: user?.email ?? '',
    phone: '',
    businessType: 'bireysel' as 'bireysel' | 'kurumsal',
    businessName: '',
    taxNumber: '',
    iban: '',
    productDescription: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] dark:bg-slate-900 dark:text-slate-100';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true); setError('');
    try {
      await api.applyAsSeller(token, form);
      router.push('/magazam');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Satıcı Başvurusu</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Mağazada ürün listelemek için aşağıdaki formu doldurun.
        </p>
      </div>

      <form onSubmit={(e) => void submit(e)} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Ad Soyad *</label>
            <input required className={inp} value={form.applicantName} onChange={e => setForm(f => ({ ...f, applicantName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">E-posta *</label>
            <input required type="email" className={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Telefon</label>
            <input type="tel" className={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0555 123 45 67" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Satıcı Tipi *</label>
            <select required className={inp} value={form.businessType} onChange={e => setForm(f => ({ ...f, businessType: e.target.value as 'bireysel' | 'kurumsal' }))}>
              <option value="bireysel">Bireysel</option>
              <option value="kurumsal">Kurumsal / Şirket</option>
            </select>
          </div>
        </div>

        {form.businessType === 'kurumsal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Şirket Adı</label>
              <input className={inp} value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Vergi No</label>
              <input className={inp} value={form.taxNumber} onChange={e => setForm(f => ({ ...f, taxNumber: e.target.value }))} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">IBAN</label>
          <input className={inp} value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="TR00 0000 0000 0000 0000 0000 00" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Ne Satmak İstiyorsunuz? *</label>
          <textarea
            required
            rows={5}
            minLength={20}
            className={inp}
            value={form.productDescription}
            onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))}
            placeholder="Ürün veya ürünlerinizi açıklayın. Tür (dijital/fiziksel/uygulama), fiyat aralığı, hedef kitle…"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">
            İptal
          </button>
          <button type="submit" disabled={submitting}
            className="px-6 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl transition-colors disabled:opacity-50">
            {submitting ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
}
