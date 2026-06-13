'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const IAN_TYPES = [
  { value: 'isbirligi',         label: 'İşbirliği' },
  { value: 'proje',             label: 'Projeler' },
  { value: 'teknik_destek',     label: 'Teknik Destek' },
  { value: 'freelancer',        label: 'Freelancer' },
  { value: 'teknoloji_ekipman', label: 'Teknoloji & Ekipman' },
  { value: 'ikinci_el',         label: 'İkinci El & Satış' },
  { value: 'mesleki_arac',      label: 'Mesleki Araçlar' },
  { value: 'firsat',            label: 'Fırsatlar' },
  { value: 'duyuru',            label: 'Duyurular' },
];

const inp = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] transition';

export default function IlanGonderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showPhone, setShowPhone] = useState(false);

  const [form, setForm] = useState({
    title:        '',
    ilanType:     '',
    company:      user?.profile?.displayName ?? '',
    location:     user?.profile?.city ?? '',
    description:  '',
    price:        '',
    applyEmail:   user?.email ?? '',
    contactPhone: '',
    tags:         '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError]   = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading'); setError('');

    const typeLabel = IAN_TYPES.find(t => t.value === form.ilanType)?.label ?? form.ilanType;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const descFull = [
      `Kategori: ${typeLabel}`,
      form.company  ? `Firma / Kurum: ${form.company}` : '',
      form.location ? `Konum: ${form.location}` : '',
      form.price    ? `Fiyat / Bütçe: ${form.price}` : '',
      tags.length   ? `Etiketler: ${tags.join(', ')}` : '',
      form.contactPhone && showPhone  ? `Telefon (ilanda gösterilsin): ${form.contactPhone}` : '',
      form.contactPhone && !showPhone ? `Telefon (sadece iç kullanım, gösterilmesin): ${form.contactPhone}` : '',
      '',
      form.description,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch(`${API_URL}/api/v1/marketplace/content-requests/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: user?.profile?.displayName ?? form.company,
          email:       user?.email ?? form.applyEmail,
          source:      'mutfak',
          type:        'ilan',
          title:       form.title,
          description: descFull,
          contactInfo: form.contactPhone || form.applyEmail || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? 'Gönderim başarısız.');
      }
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setStatus('error');
    }
  }

  if (status === 'success') return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-black text-gray-900 dark:text-slate-100 mb-2">İlanınız Alındı!</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
        Ekibimiz en kısa sürede inceleyip yayına alacak. Onay e-posta ile bildirilecek.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { setStatus('idle'); setForm({ title: '', ilanType: '', company: user?.profile?.displayName ?? '', location: user?.profile?.city ?? '', description: '', price: '', applyEmail: user?.email ?? '', contactPhone: '', tags: '' }); }}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          Yeni İlan
        </button>
        <button
          onClick={() => router.push('/ilanlar')}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-[#26496b] text-white hover:bg-[#1d3a57] transition-colors"
        >
          İlanlarıma Git
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">Yeni İlan Yayınla</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Ekibimiz 48 saat içinde inceleyip yayına alır. İlan bilgileriniz profil bilgilerinizle ön doldurulmuştur.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Temel Bilgiler</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">İlan Başlığı *</label>
            <input required type="text" value={form.title} onChange={set('title')}
              placeholder="İlanınızın kısa, açıklayıcı başlığı"
              className={inp} />
            <p className="text-[11px] text-gray-400 mt-1">Türkçe karakterleri doğru kullanın: İstanbul, ölçüm, büyük ölçekli…</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Kategori *</label>
              <select required value={form.ilanType} onChange={set('ilanType')} className={inp}>
                <option value="">Seçin…</option>
                {IAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Firma / Kurum *</label>
              <input required type="text" value={form.company} onChange={set('company')}
                placeholder="Firma adı veya adınız" className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Konum</label>
              <input type="text" value={form.location} onChange={set('location')}
                placeholder="İstanbul, Uzaktan…" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Fiyat / Bütçe</label>
              <input type="text" value={form.price} onChange={set('price')}
                placeholder="₺5.000 veya Pazarlıklı" className={inp} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Açıklama *</label>
            <textarea required rows={5} value={form.description} onChange={set('description')}
              placeholder="İlanınızı detaylı açıklayın: ne arıyorsunuz, koşullar, beklentiler, gereksinimler…"
              className={`${inp} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Etiketler</label>
            <input type="text" value={form.tags} onChange={set('tags')}
              placeholder="RTK GPS, İzmir, kadastro (virgülle ayırın)"
              className={inp} />
            <p className="text-[11px] text-gray-400 mt-1">
              Özel isimler büyük — <span className="font-medium">İzmir, LiDAR, CBS</span>.
              Genel terimler küçük — <span className="font-medium">halihazır, freelance</span>.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">İletişim</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">E-posta</label>
              <input type="email" value={form.applyEmail} onChange={set('applyEmail')}
                placeholder="iletisim@firma.com" className={inp} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Telefon</label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">
                    {showPhone ? 'İlanda görünür' : 'İlanda gizli'}
                  </span>
                  <div
                    role="checkbox"
                    aria-checked={showPhone}
                    onClick={() => setShowPhone(v => !v)}
                    className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${showPhone ? 'bg-[#26496b]' : 'bg-gray-200 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${showPhone ? 'translate-x-4' : ''}`} />
                  </div>
                </label>
              </div>
              <input type="tel" value={form.contactPhone} onChange={set('contactPhone')}
                placeholder="+90 500 000 00 00" className={inp} />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-slate-500 leading-snug">
            Moderatörler inceler, uygunsa 48 saat içinde yayına alınır.
          </p>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="shrink-0 text-sm font-bold px-6 py-3 rounded-xl bg-[#26496b] text-white hover:bg-[#1d3a57] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {status === 'loading' && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {status === 'loading' ? 'Gönderiliyor…' : 'İlan Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
}
