import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Topluluk — Haritailesi',
  description: 'Haritailesi topluluğunun harita, geomatik ve kadastro uzmanları.',
};

const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';
const WEB_URL    = process.env['NEXT_PUBLIC_WEB_URL']    ?? 'https://haritailesi.org';

const STATS = [
  { value: '500+',  label: 'Aktif Üye' },
  { value: '30+',   label: 'Şehir' },
  { value: '15+',   label: 'Uzmanlık Alanı' },
  { value: '10+',   label: 'Yıl Ortalama Deneyim' },
];

const PROFILES = [
  { role: 'CBS & Mekansal Analiz',     detail: 'Kamu · Ankara',       icon: '🗺️' },
  { role: 'Fotogrametri & LiDAR',      detail: 'Özel Sektör · İstanbul', icon: '✈️' },
  { role: 'Uzaktan Algılama',          detail: 'Araştırmacı · İzmir',  icon: '🛰️' },
  { role: 'Kontrol Mühendisi',          detail: 'Kamu · Konya',          icon: '📋' },
  { role: 'UAV / İHA Operatörü',       detail: 'Girişimci · Bursa',     icon: '🚁' },
  { role: 'Harita Mühendisi',          detail: 'Serbest · Trabzon',     icon: '📐' },
  { role: 'Akademisyen',               detail: 'Üniversite · Ankara',   icon: '🎓' },
  { role: 'Yazılım & WebGIS',          detail: 'Startup · İstanbul',    icon: '💻' },
  { role: 'İnşaat & Altyapı Ölçme',   detail: 'Özel Sektör · İzmir',   icon: '🏗️' },
];

const SPECIALTIES = [
  'CBS',
  'Kadastro',
  'Klasik Haritacılık',
  'İnşaat',
  'Gayrimenkul Değerleme',
  'Fotogrametri',
  'Uzaktan Algılama',
  'Batimetri',
  'Yazılım Geliştirme',
  'Akademi',
];

export default function UyelerPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-[#070c1a]">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#26496b] via-[#1e3a56] to-[#0f2235] py-16 sm:py-24">
          {/* Dekoratif daireler */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[#66aca9]/10 blur-2xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-6 tracking-widest uppercase">
              Haritailesi Üyeleri
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
              Meslektaşlarımız<br className="hidden sm:block" />
              <span className="text-[#66aca9]"> burada buluşuyor.</span>
            </h1>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
              Öğrencisinden SHKM, LİHKAB&apos;ına CBS uzmanından akademisyenine, girişimcisine — Türkiye&apos;nin dört bir yanından öğrenci, şirketler ve meslek profesyonelleri tek çatı altında.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`${MUTFAK_URL}/uyeler`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[#26496b] bg-white hover:bg-white/90 rounded-xl transition-colors shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Üye Dizinine Gir
              </a>
              <a
                href={`${WEB_URL}/uye-ol`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl transition-colors"
              >
                Topluluğa Katıl →
              </a>
            </div>
          </div>
        </section>

        {/* ── Stat bar ── */}
        <section className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-[#26496b] dark:text-[#66aca9]">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Anonimleştirilmiş profil kartları ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#66aca9] mb-2 text-center">Kimler var?</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 text-center mb-2">
              Mesleğin profesyonelleri ve öğrenciler bir araya geliyor.
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-center text-sm mb-10 max-w-lg mx-auto">
              Siz de <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#26496b] text-white font-bold text-xs tracking-widest uppercase align-middle">Haritailesi</span>&apos;nde yer alıp mesleki faydayı çoğaltın.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROFILES.map(p => (
                <div key={p.role}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#26496b]/8 dark:bg-[#26496b]/20 flex items-center justify-center text-xl shrink-0">
                    {p.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-snug">{p.role}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{p.detail}</p>
                    {/* Anonim avatar bar */}
                    <div className="flex gap-1 mt-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-[#26496b]/30 to-[#66aca9]/30 dark:from-[#26496b]/50 dark:to-[#66aca9]/40" />
                      ))}
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 self-center ml-1">+daha fazlası</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Uzmanlık bulut ── */}
        <section className="py-12 sm:py-16 bg-gray-50 dark:bg-slate-950 border-t border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#66aca9] mb-2">Uzmanlık Alanları</p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-8">
              Hangi alanlarda çalışıyoruz?
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {SPECIALTIES.map(s => (
                <span key={s}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 shadow-sm hover:border-[#26496b]/40 hover:text-[#26496b] dark:hover:text-[#66aca9] transition-colors cursor-default">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 sm:py-20">
          <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#26496b]/8 dark:bg-[#26496b]/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#26496b] dark:text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Üyelerimizle iletişime geçmek için Mutfak&apos;a girin
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-7 leading-relaxed">
              Üye dizini Mutfak&apos;ta — isimler, profiller, uzmanlıklar ve bağlantı kurma imkânı
              üyelere açık alanda sizi bekliyor.
            </p>
            <a
              href={`${MUTFAK_URL}/uyeler`}
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl transition-colors shadow-md"
            >
              Mutfak&apos;ta Üye Dizinini Aç →
            </a>
          </div>
        </section>

      </main>
    </>
  );
}
