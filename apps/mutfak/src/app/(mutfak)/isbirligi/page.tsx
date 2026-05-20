'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mutfakApi } from '@/lib/api';

const PACKAGES = [
  {
    title: 'Tanıtım Paketi',
    desc: 'Sahne ve Mutfak platformlarında marka görünürlüğü, etkinlik duyuruları.',
    features: ['Logo yerleşimi (Sahne footer)', 'Etkinlik sponsor banner', 'Bülten duyurusu (1 adet)', 'Üye kitlesine erişim'],
    color: 'border-gray-200',
    badge: null,
  },
  {
    title: 'Kurumsal Üyelik',
    desc: 'Tam kapsamlı platform erişimi, 5 çalışan hesabı ve öncelikli içerik kanalı.',
    features: ['5 çalışan hesabı (Mutfak)', 'Etkinlik co-sponsorluk', 'İlan panosu (sınırsız)', 'Profilte "Kurumsal Üye" rozeti', 'Aylık raporlama'],
    color: 'border-[#26496b] ring-1 ring-[#26496b]/20',
    badge: 'Popüler',
  },
  {
    title: 'Etkinlik Sponsorluğu',
    desc: 'Kongre, webinar ve çalıştaylara ana ya da katkı sponsoru olun.',
    features: ['Ana sponsor logosu ve sunuş hakkı', 'Kayıt kitlerine ürün/materyal', 'Etkinlik sayfasında yer', 'Sosyal medya paylaşımı'],
    color: 'border-gray-200',
    badge: null,
  },
];

export default function IsbirligiPage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({
    company: '',
    interest: '',
    message: '',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      await mutfakApi.submitCommunityFeedback({
        subject: `İşbirliği Talebi — ${form.company} (${form.interest})`,
        body: `Şirket: ${form.company}\n\n${form.message}`,
        type: 'talep',
      }, token);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400';

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Reklam & İşbirliği</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Harita ve geomatik sektörünün profesyonellerine ulaşmak için birlikte çalışalım.
        </p>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.title}
            className={`relative bg-white dark:bg-slate-900 rounded-2xl border ${pkg.color} shadow-sm p-5 flex flex-col`}
          >
            {pkg.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#26496b] text-white text-xs font-semibold px-3 py-1 rounded-full">{pkg.badge}</span>
              </div>
            )}
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1">{pkg.title}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 flex-1">{pkg.desc}</p>
            <ul className="space-y-1.5">
              {pkg.features.map((f) => (
                <li key={f} className="flex gap-2 text-xs text-gray-600 dark:text-slate-300">
                  <svg className="w-3.5 h-3.5 text-[#66aca9] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4">İşbirliği Talebi Gönder</h2>

        {done ? (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Talebiniz Alındı</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">48 saat içinde iletişime geçeceğiz.</p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad</label>
                <input className={inp} value={user?.profile?.displayName ?? user?.email ?? ''} disabled placeholder="Profilden alınıyor" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Şirket / Kurum *</label>
                <input required className={inp} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Şirket Adı" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">İlgilendiğiniz Paket *</label>
              <select required className={inp} value={form.interest} onChange={e => setForm(f => ({ ...f, interest: e.target.value }))}>
                <option value="">Seçiniz…</option>
                <option>Tanıtım Paketi</option>
                <option>Kurumsal Üyelik</option>
                <option>Etkinlik Sponsorluğu</option>
                <option>Özel Teklif</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mesajınız</label>
              <textarea rows={4} className={inp} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Beklentilerinizi ve varsa özel taleplerinizi yazın…" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={busy} className="bg-[#26496b] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60 text-sm">
              {busy ? 'Gönderiliyor…' : 'Teklif Gönder'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400 dark:text-slate-500">
        Detaylı bilgi için: <span className="font-medium">isbirligi@haritailesi.org</span>
      </div>
    </div>
  );
}
