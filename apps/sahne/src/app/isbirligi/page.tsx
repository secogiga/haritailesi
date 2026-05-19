'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const PACKAGES = [
  {
    title: 'Tanıtım Paketi',
    desc: 'Sahne ve Mutfak platformlarında marka görünürlüğü, etkinlik duyuruları.',
    price: 'İletişime geçin',
    features: ['Logo yerleşimi (Sahne footer)', 'Etkinlik sponsor banner', 'Bülten duyurusu (1 adet)', 'Üye kitlesine erişim'],
    color: 'border-gray-200 dark:border-slate-800',
    badge: null,
  },
  {
    title: 'Kurumsal Üyelik',
    desc: 'Tam kapsamlı platform erişimi, 5 çalışan hesabı ve öncelikli içerik kanalı.',
    price: 'İletişime geçin',
    features: ['5 çalışan hesabı (Mutfak)', 'Etkinlik co-sponsorluk', 'İlan panosu (sınırsız)', 'Profilte "Kurumsal Üye" rozeti', 'Aylık raporlama'],
    color: 'border-[var(--color-mavi)] ring-1 ring-[var(--color-mavi)]/20',
    badge: 'Popüler',
  },
  {
    title: 'Etkinlik Sponsorluğu',
    desc: 'Kongre, webinar ve çalıştaylara ana ya da katkı sponsoru olun.',
    price: 'İletişime geçin',
    features: ['Ana sponsor logosu ve sunuş hakkı', 'Kayıt kitlerine ürün/materyal', 'Etkinlik sayfasında yer', 'Sosyal medya paylaşımı'],
    color: 'border-gray-200 dark:border-slate-800',
    badge: null,
  },
];

export default function IsbirligiPage() {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', interest: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/community/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `İşbirliği Talebi — ${form.company} (${form.interest})`,
          body: `Ad: ${form.name}\nŞirket: ${form.company}\nTelefon: ${form.phone}\n\n${form.message}`,
          email: form.email,
          type: 'talep',
          source: 'sahne',
        }),
      });
      if (!res.ok) throw new Error('Gönderim başarısız.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400 dark:placeholder-slate-500';

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">Sahne Modülleri</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Reklam, Tanıtım & İşbirliği</h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl text-sm sm:text-base">
              Harita ve geomatik sektörünün önde gelen profesyonellerine ve öğrencilerine ulaşın.
              Sponsorluk, kurumsal üyelik veya içerik işbirliği için birlikte çalışalım.
            </p>
          </div>
        </section>

        {/* Stats */}
        <div className="bg-[var(--color-mavi)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {[
                { label: 'Kayıtlı Üye', value: '500+' },
                { label: 'Aylık Aktif Kullanıcı', value: '200+' },
                { label: 'Şehir', value: '40+' },
              ].map((s) => (
                <div key={s.label} className="px-6 py-5 text-center text-white">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

          {/* Packages */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">İşbirliği Paketleri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.title}
                className={`relative bg-white dark:bg-slate-900 rounded-2xl border ${pkg.color} shadow-sm p-6 flex flex-col`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[var(--color-mavi)] text-white text-xs font-semibold px-3 py-1 rounded-full">{pkg.badge}</span>
                  </div>
                )}
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1">{pkg.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 flex-1">{pkg.desc}</p>
                <ul className="space-y-1.5 mb-5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-gray-600 dark:text-slate-300">
                      <svg className="w-4 h-4 text-[var(--color-teal)] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="text-sm font-bold text-[var(--color-mavi)] dark:text-blue-400">{pkg.price}</div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">İletişime Geçin</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                Teklifinizi veya ilgilendiğiniz paketi belirtin. 48 saat içinde geri dönüş yapacağız.
              </p>
              <div className="flex flex-col gap-4 text-sm text-gray-600 dark:text-slate-400">
                {[
                  { icon: '📧', label: 'isbirligi@haritailesi.org' },
                  { icon: '🌐', label: 'haritailesi.org' },
                ].map((i) => (
                  <div key={i.label} className="flex items-center gap-3">
                    <span className="text-lg">{i.icon}</span>
                    <span>{i.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {done ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">Talebiniz Alındı</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">48 saat içinde iletişime geçeceğiz.</p>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
                    <input required className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ad Soyad" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Şirket / Kurum *</label>
                    <input required className={inp} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Şirket Adı" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta *</label>
                    <input required type="email" className={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="e-posta@sirket.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Telefon</label>
                    <input className={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90 5XX XXX XX XX" />
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
                <button type="submit" disabled={busy} className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60 text-sm">
                  {busy ? 'Gönderiliyor…' : 'Teklif Gönder'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
