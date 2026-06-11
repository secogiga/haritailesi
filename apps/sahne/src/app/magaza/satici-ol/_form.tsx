'use client';

import { useState } from 'react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export default function SaticiOlForm() {
  const [form, setForm] = useState({
    applicantName: '',
    email: '',
    phone: '',
    businessType: 'bireysel' as 'bireysel' | 'kurumsal',
    businessName: '',
    taxNumber: '',
    iban: '',
    productDescription: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loadTime] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] dark:bg-slate-900 dark:text-slate-100';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot || Date.now() - loadTime < 2000) return;
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/store/sellers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, appliedFrom: 'sahne' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Başvurunuz Alındı!</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
          Başvurunuzu en kısa sürede inceleyip size dönüş yapacağız.
          İletişim için <strong>{form.email}</strong> adresini kullanacağız.
        </p>
        <a href="/magaza" className="inline-block mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors">
          Mağazaya Dön
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8 space-y-5">
      {/* Honeypot — bot tuzağı */}
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', opacity: 0 }} />
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
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Ödeme transferleri için. Onay sonrası iyzico alt üye işyeri kaydında da kullanılacaktır.</p>
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
          placeholder="Ürün veya ürünlerinizi kısaca açıklayın. Tür (dijital/fiziksel/uygulama), fiyat aralığı, hedef kitle gibi bilgileri paylaşabilirsiniz."
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
        </button>
        <p className="text-xs text-center text-gray-400 dark:text-slate-500 mt-3">
          Başvurunuz incelendikten sonra e-posta ile bilgilendirileceğiniz. Onay süreç 1–3 iş günü içinde tamamlanır.
        </p>
      </div>
    </form>
  );
}
