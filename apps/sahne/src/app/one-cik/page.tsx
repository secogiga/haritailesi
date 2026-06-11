'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import { HikayeniPaylasButton } from '@/components/HikayeniPaylas';
import { KurumsalBasvuruButton } from '@/components/KurumsalBasvuru';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const WHY = [
  { no: '01', title: 'Doğru Kitle', desc: 'Harita, kadastro ve geomatik sektörünün aktif profesyonelleri — bu kadar niş ve bu kadar aktif bir kitleye başka platformda ulaşamazsın.' },
  { no: '02', title: 'Güven', desc: 'Vakıf çatısı altında, reklam değil ortaklık. Topluluk Haritailesi\'ne güvendiği için sana da güvenir.' },
  { no: '03', title: 'Çoklu Kanal', desc: 'Etkinlikler, dijital platformlar ve bülten — tek işbirliğiyle tüm ekosisteme erişim.' },
  { no: '04', title: 'Ölçülebilir', desc: 'Her işbirliği raporlanır. Görünürlük, erişim ve etkiyi birlikte takip ederiz.' },
];

const CHANNELS = [
  {
    label: 'Kongre & Zirve', sub: '500+ katılım · 200+/oturum',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    label: 'Webinar & Panel', sub: 'Online eğitim & tartışmalar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
  },
  {
    label: 'Çalıştay & Saha', sub: 'Uygulamalı mesleki eğitimler',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    label: 'Dijital Platformlar', sub: 'Sahne & Mutfak ekosistemi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    label: 'Haftalık Bülten', sub: 'Gelen kutusu erişimi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function OneCikPage() {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', interest: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loadTime] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot || Date.now() - loadTime < 2000) return;
    setBusy(true);
    setError('');
    const subject = `[Öne Çık] ${form.company} — ${form.interest || 'İşbirliği Talebi'}`;
    const body = [
      `Ad Soyad: ${form.name}`,
      `Şirket / Kurum: ${form.company}`,
      `E-posta: ${form.email}`,
      `Telefon: ${form.phone || '—'}`,
      `Konu: ${form.interest || '—'}`,
      '',
      form.message || '(açıklama girilmedi)',
    ].join('\n');
    try {
      const res = await fetch(`${API}/api/v1/community/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone || undefined, subject, body, type: 'reklam', source: 'isbirligi', subCategory: form.interest || undefined, urgency: 'normal' }),
      });
      if (!res.ok) throw new Error('Gönderim başarısız.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 placeholder-gray-400 transition-colors';

  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-isbirligi" />
      <main className="bg-[#f8fafc] dark:bg-[#070c1a] min-h-screen">

        {/* ── Hero ── */}
        <section className="relative bg-[#0c1824] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/40 via-transparent to-amber-400/5 pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 via-amber-400/50 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 sm:pt-24 pb-16 sm:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Sol: Metin */}
              <div>
                <div className="inline-flex items-center gap-2 mb-7">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">2026 yıllık işbirliği takviminde yer alın</span>
                </div>
                <h1 className="font-black text-white tracking-tight leading-[0.92] mb-7" style={{ fontSize: 'clamp(2.6rem, 5.5vw, 5.5rem)' }}>
                  Haritailesi ile<br />
                  <span className="text-amber-400">Öne Çık.</span>
                </h1>
                <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10">
                  Projeni, markanı, etkinliğini veya başarı hikâyeni sektörün en aktif topluluğuyla buluştur.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="#iletisim" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0c1824] font-bold px-7 py-3.5 rounded-xl transition-colors text-sm">
                    Teklif İste
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                  <a href="#neden" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-medium px-7 py-3.5 rounded-xl transition-colors text-sm">
                    Nasıl çalışır?
                  </a>
                </div>
              </div>

              {/* Sağ: Stat kartları */}
              <div className="grid grid-cols-2 gap-3">

                <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-6 transition-colors">
                  {/* İkon: topluluk */}
                  <svg className="w-6 h-6 text-amber-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="7" r="3" />
                    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                    <path d="M16 3.13a4 4 0 010 7.75" opacity=".5" />
                    <path d="M21 21v-2a4 4 0 00-3-3.87" opacity=".5" />
                  </svg>
                  <div className="text-3xl font-black text-white tabular-nums mb-1">500+</div>
                  <div className="text-xs text-slate-400 leading-snug">Sektör Profesyoneli</div>
                </div>

                <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-6 transition-colors">
                  {/* İkon: harita pin */}
                  <svg className="w-6 h-6 text-amber-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.314-2.686-6-6-6z" />
                    <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" className="opacity-40" />
                  </svg>
                  <div className="text-3xl font-black text-white tabular-nums mb-1">40+</div>
                  <div className="text-xs text-slate-400 leading-snug">Şehirde Üye</div>
                </div>

                <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-6 transition-colors">
                  {/* İkon: etkinlik / yıldız takvim */}
                  <svg className="w-6 h-6 text-amber-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                    <path d="M12 14l.9 1.8 2 .3-1.45 1.4.34 2L12 18.5l-1.79.94.34-2L9.1 16.1l2-.3z" fill="currentColor" stroke="none" className="opacity-70" />
                  </svg>
                  <div className="text-3xl font-black text-white tabular-nums mb-1">10+</div>
                  <div className="text-xs text-slate-400 leading-snug">Yıllık Etkinlik</div>
                </div>

                <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-6 transition-colors">
                  {/* İkon: platformlar / grid */}
                  <svg className="w-6 h-6 text-amber-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" stroke="none" className="opacity-30" />
                  </svg>
                  <div className="text-3xl font-black text-white tabular-nums mb-1">3</div>
                  <div className="text-xs text-slate-400 leading-snug">Dijital Platform</div>
                </div>

              </div>

            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#f8fafc] dark:bg-[#070c1a]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        </section>

        {/* ── 01 — Kim için ── */}
        <section className="bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20">
            <div className="flex items-center gap-5 mb-14">
              <span className="text-amber-500 font-mono text-xs font-bold tracking-widest">01</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-gray-400 text-xs uppercase tracking-widest">Kim için?</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Bireysel */}
              <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-10 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl font-black text-gray-900 dark:text-slate-100">Bireysel</span>
                    <span className="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-full">Ücretsiz</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">Kariyer hikâyeni paylaş, projenle öne çık, mentor deneyimini anlat.</p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {['Kariyer hikâyesi paylaşımı', 'Proje tanıtımı', 'Mentor deneyimi', 'Sosyal medyada yayın'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <HikayeniPaylasButton label="Başvur" variant="navy" />
              </div>

              {/* Kurumsal */}
              <div className="border-2 border-amber-400/40 dark:border-amber-400/30 bg-amber-50/40 dark:bg-amber-400/5 rounded-2xl p-10 flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-bl-[4rem]" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl font-black text-gray-900 dark:text-slate-100">Kurumsal</span>
                    <span className="text-[11px] font-bold bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-400/20 px-2.5 py-1 rounded-full">İşbirliği & Tanıtım</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">Marka görünürlüğü, etkinlik sponsorluğu ve içerik işbirlikleri.</p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {['Marka görünürlüğü', 'Etkinlik sponsorluğu', 'İçerik işbirliği', 'Kurumsal üyelik'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#iletisim" className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0c1824] font-bold px-6 py-3.5 rounded-xl transition-colors text-sm w-full">
                  İletişime Geç
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 — Neden ── */}
        <section id="neden" className="bg-[#f8fafc] dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20">
            <div className="flex items-center gap-5 mb-14">
              <span className="text-amber-500 font-mono text-xs font-bold tracking-widest">02</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-gray-400 text-xs uppercase tracking-widest">Neden Haritailesi?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y divide-gray-200 dark:divide-slate-800 sm:divide-y-0">
              {WHY.map((w, i) => (
                <div
                  key={w.no}
                  className={`flex gap-7 py-10 ${i % 2 === 0 ? 'sm:border-r border-gray-200 dark:border-slate-800 sm:pr-14' : 'sm:pl-14'} ${i < 2 ? 'sm:border-b border-gray-200 dark:border-slate-800 sm:pb-14' : 'sm:pt-14'}`}
                >
                  <span className="text-5xl font-black text-amber-400/25 leading-none shrink-0 tabular-nums select-none">{w.no}</span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">{w.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 03 — Kanallar ── */}
        <section className="bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20">
            <div className="flex items-center gap-5 mb-14">
              <span className="text-amber-500 font-mono text-xs font-bold tracking-widest">03</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-gray-400 text-xs uppercase tracking-widest">Erişim Kanalları</span>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100 mb-12 leading-tight">
              Markan bu kanallarda<br />
              <span className="text-amber-500">görünür olur.</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-slate-800">
              {CHANNELS.map((c) => (
                <div key={c.label} className="py-6 sm:px-6 first:pl-0 last:pr-0 flex flex-col items-center text-center">
                  <div className="text-amber-500 mb-3">{c.icon}</div>
                  <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm mb-1">{c.label}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 04 — Referans ── */}
        <section className="bg-[#f8fafc] dark:bg-[#070c1a]">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20">
            <div className="flex items-center gap-5 mb-14">
              <span className="text-amber-500 font-mono text-xs font-bold tracking-widest">04</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-gray-400 text-xs uppercase tracking-widest">Referans</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* HİG kartı */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-10 flex flex-col gap-8">
                <div className="flex flex-col gap-5">
                  <img src="/hig.jpg" alt="Harita İş Günleri" className="h-14 w-auto object-contain self-start" />
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                    Mesleğimizin ilk ve en büyük kariyer günleri organizasyonu. Yıldız Teknik Üniversitesi (2), Bülent Ecevit Üniversitesi ve Afyon Kocatepe Üniversitesinde olmak üzere toplamda <strong className="text-gray-700 dark:text-slate-300">4 kez</strong> gerçekleştirildi. ENKA gibi sektör liderlerini, üst düzey yöneticileri ve sektörün duayenlerini ağırladı.
                  </p>
                  <ul className="space-y-2">
                    {[
                      'Staj ve iş görüşmesi imkânı — kurumlarla doğrudan anlaşmalar',
                      'Türkan Şoray, Barış Akarsu gibi isimlerle kültür-sanat buluşmaları',
                      'Çekilişle mesleki eğitimler ve sektör kitapları',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-slate-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 dark:border-slate-800">
                  {[
                    { value: '2000+', label: 'Toplam Katılımcı' },
                    { value: '30+', label: 'Kurum & Kuruluş' },
                    { value: '4', label: 'Organizasyon' },
                  ].map((s) => (
                    <div key={s.label} className="border-l-2 border-amber-400 pl-4">
                      <div className="text-xl font-black text-gray-900 dark:text-slate-100">{s.value}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA kartı */}
              <div className="lg:col-span-2 bg-[#1e3a52] rounded-2xl p-10 flex flex-col justify-between gap-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="relative flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">2026 takvimi oluşturuluyor</span>
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    Bir sonraki etkinlikte markan burada olsun.
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    2000'den fazla sektör profesyoneline doğrudan ulaş.
                  </p>
                  <ul className="space-y-2.5 pt-2">
                    {[
                      'Etkinlik alanında marka görünürlüğü',
                      'Sektör medyasında tanıtım',
                      'Katılımcılarla doğrudan temas',
                      'Ölçülebilir sonuç raporu',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-white/70">
                        <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="#iletisim" className="relative inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0c1824] font-bold px-6 py-3.5 rounded-xl transition-colors text-sm w-full">
                  Teklif İste
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 — İletişim ── */}
        <section id="iletisim" className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20">
            <div className="flex items-center gap-5 mb-14">
              <span className="text-amber-500 font-mono text-xs font-bold tracking-widest">05</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-gray-400 text-xs uppercase tracking-widest">İletişim</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Sol */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-slate-100 leading-tight mb-4">
                  48 saat içinde<br />
                  <span className="text-amber-500">geri dönüyoruz.</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-8">
                  İlgilendiğiniz işbirliği türünü belirtin. Talebiniz ekibimize iletilir, en uygun seçeneklerle size ulaşırız.
                </p>

                <div className="border-l-2 border-amber-400 pl-5 mb-10">
                  <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                    <span className="font-bold text-gray-800 dark:text-slate-200">2026 yıllık takvimi oluşturuluyor.</span><br />
                    İşbirliği kontenjanı sınırlı — erken başvuranlara öncelik tanınıyor.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-400/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">E-posta</div>
                      <div className="text-sm font-semibold text-gray-700 dark:text-slate-300">isbirligi@haritailesi.org</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-400/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Yanıt Süresi</div>
                      <div className="text-sm font-semibold text-gray-700 dark:text-slate-300">48 saat içinde</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ: Form */}
              {done ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-2">Talebiniz Alındı</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">48 saat içinde iletişime geçeceğiz.</p>
                </div>
              ) : (
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                  <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Ad Soyad *</label>
                      <input required className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ad Soyad" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Şirket / Kurum *</label>
                      <input required className={inp} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Şirket Adı" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">E-posta *</label>
                      <input required type="email" className={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="e-posta@sirket.com" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Telefon</label>
                      <input className={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90 5XX XXX XX XX" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Konu *</label>
                    <select required className={inp} value={form.interest} onChange={e => setForm(f => ({ ...f, interest: e.target.value }))}>
                      <option value="">Seçiniz…</option>
                      <option>Marka Görünürlüğü</option>
                      <option>Etkinlik Sponsorluğu</option>
                      <option>Kurumsal Üyelik</option>
                      <option>İçerik İşbirliği</option>
                      <option>Özel Teklif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Mesajınız</label>
                    <textarea rows={4} className={inp} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Beklentilerinizi ve varsa özel taleplerinizi yazın…" />
                  </div>

                  {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}

                  <button type="submit" disabled={busy} className="w-full bg-amber-400 hover:bg-amber-300 text-[#0c1824] font-bold py-4 rounded-xl transition-colors disabled:opacity-50 text-sm tracking-wide">
                    {busy ? 'Gönderiliyor…' : 'Teklif Gönder →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
