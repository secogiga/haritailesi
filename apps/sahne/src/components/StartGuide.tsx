'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { useSahneAuth, sahneTrack } from '@/contexts/SahneAuthContext';
import { MemberCard } from '@/components/MemberCard';
import {
  ALL_ACTIONS,
  LEVEL_CONFIG,
  calculateLevel,
  loadLevelActions,
  saveLevelAction,
  getNextSuggestedAction,
  canAccess,
  MEMBER_TIERS,
  type Level,
  type RehberAction,
} from '@/lib/rehber';

const MEMBER_TIERS_SET = new Set<string>(MEMBER_TIERS);
const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

// ─── SVG ikonlar ──────────────────────────────────────────────────────────────

const IcoCalendar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IcoBrain = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const IcoPencil = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
const IcoMap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);
const IcoCap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);
const IcoPeople = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IcoChart = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IcoVideo = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const IcoBriefcase = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IcoStore = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);
const IcoTrophy = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IcoLock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const IcoGlobe = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IcoStar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
const IcoNewspaper = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);
const IcoHeart = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const IcoMessage = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const IcoEye = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IcoMegaphone = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);
const IcoPusula = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2" />
    <path strokeLinecap="round" d="M12 3v6M12 15v6M3 12h6M15 12h6" />
  </svg>
);
const IcoLibrary = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
  </svg>
);

// ─── Özgür keşif kategorileri ─────────────────────────────────────────────────

const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const FREE_CATEGORIES: {
  title: string; desc: string; href: string;
  icon: React.ReactNode; gradient: string; pulse?: string; note?: string; external?: boolean;
}[] = [
  { title: 'Soru & Cevap',           desc: 'Sorular sor, cevapları birlikte bulalım.',                   href: '/kutuphane/soru-cevap', icon: <IcoPencil />, gradient: 'from-sky-500 to-blue-600', pulse: '200+ içerik' },
  { title: 'Meslek Kütüphanesi',     desc: 'Mesleğin ortak hafızası. Sözlük, rehber, mevzuat ve sınav merkezi.', href: '/kutuphane', icon: <IcoLibrary />, gradient: 'from-[#26496b] to-[#1d3a57]', pulse: 'Açık Erişim' },
  { title: 'Etkinlikler',            desc: 'Mesleki etkinlikleri keşfet, katıl ve paylaş.',              href: '/etkinlikler',  icon: <IcoCalendar />,  gradient: 'from-emerald-500 to-teal-600',       pulse: '25+ etkinlik' },
  { title: 'Mentörlük',              desc: 'Deneyimli profesyonellerden birebir rehberlik.',              href: '/mentorluk',    icon: <IcoBrain />,     gradient: 'from-amber-500 to-orange-600',       pulse: '14 aktif mentor' },
  { title: 'Projeler',               desc: 'Topluluğun projelerini keşfet, katkı ver, kendi projeni paylaş.', href: '/projeler', icon: <IcoMap />,       gradient: 'from-blue-500 to-indigo-600',        pulse: '3 aktif proje' },
  { title: 'Eğitimler',              desc: 'Mesleki gelişim için online ve yüz yüze eğitimler.',         href: '/egitim',       icon: <IcoCap />,       gradient: 'from-teal-500 to-cyan-600',          pulse: '8 program' },
  { title: 'Haritailesi Genç',       desc: 'Gençliğin avantajlarını yaşa.',                              href: '/genc',         icon: <IcoPeople />,    gradient: 'from-violet-500 to-purple-600',      pulse: '500+ üye' },
  { title: 'Yetenekler',             desc: 'Topluluğun meslek dışı yetenekleri — müzik, resim, dans.',   href: '/yetenekler',   icon: <IcoStar />,      gradient: 'from-pink-500 to-rose-600',          pulse: 'Topluluktan' },
  { title: 'Haritailesi TV',         desc: 'Sektörel içerikler ve röportajlar.',                         href: 'https://www.youtube.com/@haritailesi', icon: <IcoVideo />, gradient: 'from-red-500 to-rose-600', pulse: '50+ video', external: true },
  { title: 'İlan Panosu',            desc: 'Meslektaşlardan ilanlar, duyurular ve fırsatlar.',           href: '/ilanlar',      icon: <IcoBriefcase />, gradient: 'from-gray-500 to-slate-600',         pulse: 'Aktif ilanlar' },
  { title: 'Mağaza',                 desc: 'Topluluğun ve vakfın ürettiği ürünleri keşfet.',             href: '/magaza',       icon: <IcoStore />,     gradient: 'from-purple-500 to-indigo-600',      pulse: 'Yeni ürünler' },
  { title: 'Sen Ne Dersin?', desc: 'Anketlere katıl, testlerle kendini değerlendir ve topluluğun görüşünü şekillendir.', href: '/sen-ne-dersin', icon: <IcoMessage />, gradient: 'from-violet-500 to-purple-600', pulse: 'Topluluk Sesi' },

  { title: 'Haritailesi',            desc: 'Vakfın projelerini, topluluğunu ve ekosistemini keşfet.',    href: process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org', icon: <IcoGlobe />, gradient: 'from-[#26496b] to-[#1d3a57]', pulse: 'Ana Site', external: true },
  { title: 'Haritakademi',           desc: 'Mesleki gelişim için proje, eğitim ve etkinlik platformu.', href: 'https://www.linkedin.com/showcase/haritakademi', icon: <IcoCap />, gradient: 'from-blue-600 to-blue-800', pulse: 'LinkedIn', external: true },
  { title: 'Haberita',               desc: 'Harita sektörüne özel haberler, içerikler ve röportajlar.',  href: 'https://haberita.com', icon: <IcoNewspaper />, gradient: 'from-amber-500 to-amber-700', pulse: 'Haberler', external: true },
  { title: 'Haritakariyer',          desc: 'İş ilanları, kariyer fırsatları ve mesleki bağlantılar.',   href: 'https://www.linkedin.com/showcase/haritakariyer', icon: <IcoBriefcase />, gradient: 'from-[#66aca9] to-teal-700', pulse: 'LinkedIn', external: true },
  { title: 'Meslekte Yeni İdoller',  desc: 'İlham veren meslektaşları ve hikâyelerini keşfet.',         href: '/meslekte-yeni-idoller', icon: <IcoStar />, gradient: 'from-amber-400 to-orange-500', pulse: 'İlham' },
  { title: 'Bağış',                  desc: 'Haritailesi\'ne destek ol. Bağışınla topluluğun büyümesine katkı sun.', href: '/bagis', icon: <IcoHeart />, gradient: 'from-rose-500 to-pink-600', pulse: 'Destek Ol' },
  { title: 'Haritailesi Pusula', desc: 'İhtiyacınızı anlatın, size en uygun desteği birlikte bulalım.', href: '/haritailesipusula', icon: <IcoPusula />, gradient: 'from-[#26496b] to-[#66aca9]', pulse: 'Yönünü Bul' },
  { title: 'Öne Çık', desc: 'Projeni, markanı veya hikâyeni sektörün en aktif topluluğuyla buluştur.', href: '/one-cik', icon: <IcoMegaphone />, gradient: 'from-[#26496b] to-slate-700', pulse: 'Reklam · Tanıtım · İşbirliği' },
];

// ─── Toast bileşeni ───────────────────────────────────────────────────────────

function Toast({ msg, isAha, onDone }: { msg: string; isAha: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white animate-bounce-once ${
      isAha ? 'bg-amber-500' : 'bg-emerald-600'
    }`}>
      <span className="text-base">{isAha ? '🎉' : '✓'}</span>
      {msg}
    </div>
  );
}

// ─── Confetti burst (CSS-based) ───────────────────────────────────────────────

function ConfettiBurst({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = Array.from({ length: 18 }, (_, i) => i);
  const colors = ['#26496b', '#66aca9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {particles.map((i) => {
        const color = colors[i % colors.length]!;
        const left = 30 + Math.random() * 40;
        const delay = Math.random() * 300;
        const duration = 800 + Math.random() * 400;
        const size = 6 + Math.random() * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '40%',
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `confetti-fall ${duration}ms ease-out ${delay}ms forwards`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Tüm kategoriler için gruplar ─────────────────────────────────────────────

const ACTION_GROUPS: Record<1 | 2 | 3 | 4, { label: string; ids: string[] }[]> = {
  1: [
    { label: 'Haritailesi\'ni Keşfet',       ids: ['v-vakif', 'v-tv', 'v-bagis', 'v-talepler', 'v-sosyaliz'] },
    { label: 'Fırsatları Değerlendir',        ids: ['v-kariyer', 'v-haberita', 'v-egitim', 'v-etkinlikler', 'v-ilanlar', 'v-magaza'] },
    { label: 'Öğrenciler',                    ids: ['v-hgenc', 'p-mezun', 'v-mentorluk', 'v-idoller'] },
    { label: 'Mesleğine Sen de Değer Kat',    ids: ['v-akademi', 'v-sc', 'v-sinavlar', 'v-forum'] },
    { label: 'Fikirlerinle Mesleğe Yön Ver',  ids: ['v-yarisma', 'v-anketler'] },
  ],
  2: [
    { label: 'Etkinlik & Yarışma',  ids: ['p-etkinlik', 'p-yarisma', 'p-anket'] },
    { label: 'Mentorluk',           ids: ['p-mentee', 'p-mentor'] },
    { label: 'Destek & Satın Al',   ids: ['p-proje', 'p-yetenek', 'p-bagis', 'p-satin'] },
    { label: 'Özel Programlar',     ids: ['p-hgenc', 'p-mezun'] },
  ],
  3: [
    { label: 'Mutfak & Forum',      ids: ['c-gonderi', 'c-forum-soru', 'c-forum-cevap'] },
    { label: 'Soru & Cevap',        ids: ['c-sc-soru', 'c-sc-cevap'] },
    { label: 'İçerik & İlan',       ids: ['c-haberita', 'c-ilan', 'c-urun'] },
    { label: 'Görüş & Talep',       ids: ['c-talep', 'c-gorus'] },
  ],
  4: [
    { label: 'Mentorluk & Eğitim',  ids: ['d-mentor-seans', 'd-etkinlik', 'd-egitim'] },
    { label: 'İçerik & Tanıtım',    ids: ['d-editor', 'd-kose', 'd-tanitim', 'd-isbirligi'] },
    { label: 'Paylaş',              ids: ['d-yetenek', 'd-kariyer', 'd-proje'] },
  ],
};

// ─── Aksiyon kartı ────────────────────────────────────────────────────────────

function ActionCard({
  action, isDone, isAccessible, tier, onDone,
}: {
  action: RehberAction;
  isDone: boolean;
  isAccessible: boolean;
  tier: string | null;
  onDone: (action: RehberAction) => void;
}) {
  const isExt = action.external || action.href.startsWith('http');

  if (!isAccessible) {
    const needsLoginOnly = !tier && action.category === 2 && !action.requiredTiers;
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
        <span className="text-base shrink-0 opacity-25">{action.icon}</span>
        <span className="text-xs text-gray-300 dark:text-slate-600 flex-1 min-w-0 truncate">{action.label}</span>
        <span className="text-[9px] font-medium text-gray-400 dark:text-slate-600 border border-gray-200 dark:border-slate-700 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
          {needsLoginOnly ? 'Giriş' : 'Üye'}
        </span>
      </div>
    );
  }

  const containerCls = `group flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
    isDone
      ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/30'
      : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm'
  }`;
  const labelCls = `text-xs font-medium flex-1 min-w-0 truncate leading-snug ${
    isDone
      ? 'text-gray-400 dark:text-slate-500 line-through'
      : 'text-gray-700 dark:text-slate-300 group-hover:text-[#26496b] dark:group-hover:text-[#66aca9]'
  }`;

  return (
    <div className={containerCls}>
      <span className="text-base shrink-0">{action.icon}</span>
      {isExt ? (
        <a href={action.href} target="_blank" rel="noopener noreferrer" className={labelCls}>
          {action.label}
        </a>
      ) : (
        <Link href={action.href} className={labelCls}>
          {action.label}
        </Link>
      )}
      {action.isAhaMoment && !isDone && (
        <span className="text-amber-400 text-[10px] shrink-0">✨</span>
      )}
      <button
        onClick={() => onDone(action)}
        title={isDone ? 'Tamamlandı' : 'Yaptım olarak işaretle'}
        className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
          isDone
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
            : 'text-gray-200 dark:text-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-500'
        }`}
      >
        ✓
      </button>
    </div>
  );
}

// ─── 4 Seviye kartları ────────────────────────────────────────────────────────

const LEVEL_CARD_META: Record<1 | 2 | 3 | 4, {
  levelKey: Level; actionLabel: string; accessNote: string; icon: string;
}> = {
  1: { levelKey: 'izleyici',     actionLabel: 'Ziyaret Etmek', accessNote: 'Giriş gerekmez',               icon: '👁️' },
  2: { levelKey: 'katilimci',    actionLabel: 'Katılmak',      accessNote: 'Bazıları için üyelik gerekir',  icon: '🤝' },
  3: { levelKey: 'katki_sunan',  actionLabel: 'Oluşturmak',    accessNote: 'Üyelik gerekir',                icon: '✍️' },
  4: { levelKey: 'etki_yaratan', actionLabel: 'Yapmak',        accessNote: 'Üyelik gerekir',                icon: '⭐' },
};

// ─── Tüm seviyeler için grup + öğe verisi ────────────────────────────────────

type LevelGroupItem = { id: string; label: string; desc: string };
type LevelGroup     = { label: string; icon: string; desc: string; items: LevelGroupItem[] };

const LEVEL_GROUPS: Record<string, LevelGroup[]> = {
  izleyici: [
    { label: "Haritailesi'ni Keşfet", icon: '🌐', desc: 'Vakıf, TV, bağış ve daha fazlası', items: [
      { id: 'v-vakif',    label: 'Vakıf Sayfası',            desc: "Haritailesi Vakfı'nı ve misyonunu tanı" },
      { id: 'v-tv',       label: 'Haritailesi TV',            desc: 'Video içerikler ve sektörel röportajlar' },
      { id: 'v-bagis',    label: 'Bağış Sayfası',            desc: 'Topluluğun büyümesine destek ol' },
      { id: 'v-talepler', label: 'Haritailesi Pusula', desc: 'İhtiyacınızı anlatın, size en uygun desteği bulalım.' },
      { id: 'v-sosyaliz', label: 'Sosyaliz!',                desc: 'Projen ve markanı toplulukla buluştur' },
    ]},
    { label: 'Fırsatları Değerlendir', icon: '💼', desc: 'Kariyer, haberler, eğitim ve etkinlikler', items: [
      { id: 'v-kariyer',     label: 'Haritakariyer', desc: 'Yeni iş fırsatları' },
      { id: 'v-haberita',    label: 'Haberita',       desc: 'En güncel mesleki haberlere ulaş' },
      { id: 'v-egitim',      label: 'Eğitimler',      desc: 'En inovatif eğitimlere katıl' },
      { id: 'v-etkinlikler', label: 'Etkinlikler',    desc: 'En güncel etkinliklere ulaş' },
      { id: 'v-ilanlar',     label: 'İlanlar',         desc: 'İhtiyacına yönelik ilan paylaş' },
      { id: 'v-magaza',      label: 'Mağaza',          desc: 'Kendine ait ürünleri satışa çıkar' },
    ]},
    { label: 'Öğrenciler', icon: '🎯', desc: 'Genç alan, mentorluk ve programlar', items: [
      { id: 'v-hgenc',     label: 'Haritailesi Genç Alanı',          desc: 'Öğrencilere özel alan ve fırsatlar' },
      { id: 'p-mezun',     label: 'Mesleğin Gelecekleri Programı',   desc: 'Seçilmiş öğrenci gelişim programı' },
      { id: 'v-mentorluk', label: 'Haritailesi Mentörlük Sistemi',   desc: 'Deneyimli profesyonellerden rehberlik' },
      { id: 'v-idoller',   label: 'Bir Mesleğin İdolünden İlham Al', desc: 'İlham veren hikayeleri keşfet' },
    ]},
    { label: 'Mesleğine Sen de Değer Kat', icon: '🎓', desc: 'Akademi, forum ve sınavlar', items: [
      { id: 'v-akademi',  label: 'Haritakademi',       desc: 'Topluluğun projelerine gözat.' },
      { id: 'v-sc',       label: 'Soru & Cevap',       desc: 'Sorular soruldu, çözümler üretildi.' },
      { id: 'v-sinavlar', label: 'Sınavlar',            desc: 'Sınavlarda artık yalnız değilsin.' },
      { id: 'v-forum',    label: 'Mutfak Kütüphanesi', desc: 'Topluluğun herkese açık paylaşımları.' },
    ]},
    { label: 'Fikirlerinle Mesleğe Yön Ver', icon: '💡', desc: 'Yarışmalar ve anketler', items: [
      { id: 'v-yarisma',  label: 'Yarışmalar', desc: 'Mesleki gelişim odaklı yarışmaları incele.' },
      { id: 'v-anketler', label: 'Anketler',   desc: 'Topluluğa yön veren anketlere gözat.' },
    ]},
  ],
  katilimci: [
    { label: 'Mesleğine Sen de Değer Kat', icon: '🤝', desc: 'Projelere ve yeteneklere destek ver', items: [
      { id: 'p-proje',   label: 'Projelere Destek Ver',   desc: 'Topluluk projelerine geri bildirim ver.' },
      { id: 'p-yetenek', label: 'Yeteneklere Destek Ver', desc: 'Meslektaşlarının yeteneklerini destekle' },
    ]},
    { label: 'Öğrenci', icon: '🎓', desc: 'Öğrenci programları ve fırsatları', items: [
      { id: 'p-hgenc', label: "Haritailesi Genç'e Katıl",              desc: 'Öğrenci topluluğunun parçası ol' },
      { id: 'p-mezun', label: 'Mesleğin Gelecekleri Programına Katıl', desc: 'Seçilmiş öğrenci gelişim programı' },
    ]},
    { label: 'Mesleğine Destek Ver', icon: '💪', desc: 'Etkinlik, eğitim, bağış, satın alma ve yarışmalar', items: [
      { id: 'p-bagis',    label: 'Bağış Yap',        desc: 'Topluluğun büyümesine destek ol' },
      { id: 'p-satin',    label: 'Satın Alma Yap',   desc: 'Topluluğun ürettiği ürünleri satın al' },
      { id: 'p-etkinlik', label: 'Etkinliğe Katıl',  desc: 'Mesleki etkinliklerde yer al' },
      { id: 'p-egitim',   label: 'Eğitime Katıl',    desc: 'Mesleki eğitimlere katıl ve gelişimini sürdür' },
      { id: 'p-anket',    label: 'Ankete Katıl',      desc: 'Görüşlerinle topluluğa yön ver' },
      { id: 'p-yarisma',  label: 'Yarışmaya Katıl',  desc: 'Mesleki yarışmalarda kendini göster' },
    ]},
  ],
  katki_sunan: [
    { label: 'Mesleğine Sen de Değer Kat', icon: '⭐', desc: 'Mentörlük, gönderi ve içerik üretimiyle topluluğa katkı sun', items: [
      { id: 'p-mentor',   label: 'Mentör Ol',                  desc: 'Deneyimini paylaş, topluluğa rehberlik et' },
      { id: 'c-gonderi',  label: 'Mutfakta Gönderi Paylaş',   desc: 'Topluluk alanında içerik üret' },
      { id: 'c-haberita', label: "Haberita'ya İçerik Gönder", desc: 'Haber, analiz veya röportaj gönder' },
    ]},
    { label: 'Mesleğine Destek Ver', icon: '✍️', desc: "Forum ve S&C'ye cevap ver, görüş ilet", items: [
      { id: 'c-sc-cevap',    label: 'S&C Cevabı Ver',         desc: 'Meslektaşlarının sorularını yanıtla' },
      { id: 'c-forum-cevap', label: 'Forum Cevabı Yaz',       desc: 'Topluluk tartışmalarına katkı sun' },
      { id: 'c-gorus',       label: 'Görüşlerinizi Gönderin', desc: 'Fikir ve önerilerini ekiple paylaş' },
    ]},
    { label: 'Fırsatları Değerlendir', icon: '🚀', desc: 'İlan ve ürün oluştur, soru sor', items: [
      { id: 'c-ilan',       label: 'İlan Oluştur',            desc: 'İş ve fırsat ilanı paylaş' },
      { id: 'c-urun',       label: 'Mağazada Ürün Oluştur',   desc: 'Kendi ürününü topluluğa sun' },
      { id: 'c-talep',      label: 'Talebinizi İletin',        desc: 'Talep ve ihtiyaçlarını bildir' },
      { id: 'c-sc-soru',    label: 'S&C Sorusu Sor',          desc: 'Topluluğa soru yönelt' },
      { id: 'c-forum-soru', label: 'Forum Sorusu Aç',         desc: 'Tartışma başlat' },
    ]},
  ],
  etki_yaratan: [
    { label: 'Mesleğine Sen de Değer Kat', icon: '⭐', desc: 'Mentor seansı, eğitim ve etkinlik oluştur', items: [
      { id: 'd-mentor-seans', label: 'Mentor Seansı Gerçekleştir', desc: 'Mentee ile bire bir rehberlik görüşmesi yap' },
      { id: 'd-proje',        label: 'Projeni Gönder',              desc: 'Mesleki projenle topluluğa ilham ver' },
      { id: 'd-egitim',       label: 'Eğitim Oluştur',             desc: 'Bilgini eğitim formatında paylaş' },
      { id: 'd-etkinlik',     label: 'Etkinlik Oluştur',           desc: 'Topluluk için etkinlik düzenle' },
      { id: 'd-editor',       label: 'Haberita Editörü Ol',        desc: 'Sektör haberlerini yönet ve yayınla' },
    ]},
    { label: 'Görünür Ol', icon: '🌟', desc: 'Tanıtım yap, kariyer hikayeni ve işbirliğini paylaş', items: [
      { id: 'd-tanitim',   label: 'Tanıtım Yap',              desc: 'Çalışmalarını ve projenizi tanıt' },
      { id: 'd-kariyer',   label: 'Kariyer Hikayeni Paylaş',  desc: 'Mesleki yolculuğunla ilham ver' },
      { id: 'd-isbirligi', label: 'İşbirliği Yap',            desc: 'Ortak projeler ve iş birlikleri kur' },
      { id: 'd-kose',      label: 'Haberita Köşe Yazarı Ol',  desc: 'Düzenli köşe yazılarıyla sektöre katkı sun' },
      { id: 'd-yetenek',   label: 'Yeteneğini Paylaş',        desc: 'Meslek dışı yeteneklerini toplulukla paylaş' },
    ]},
  ],
};

function Cat1SubGroup({
  group, actions, doneIds, onDone,
}: {
  group: { label: string; ids: string[] };
  actions: RehberAction[];
  doneIds: string[];
  onDone: (action: RehberAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = (LEVEL_GROUPS['izleyici'] ?? []).find(g => g.label === group.label);
  const groupActions = actions.filter(a => group.ids.includes(a.id));
  const done = new Set(doneIds);
  const doneCount = groupActions.filter(a => done.has(a.id)).length;

  return (
    <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-lg shrink-0">{meta?.icon ?? '📌'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-tight">{group.label}</p>
          {meta?.desc && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{meta?.desc}</p>}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{doneCount}/{groupActions.length}</span>
        <svg className={`w-3 h-3 text-gray-300 dark:text-slate-600 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-50 dark:border-slate-800 px-2 pb-2 pt-1 flex flex-col gap-0.5">
          {groupActions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              isDone={done.has(action.id)}
              isAccessible={true}
              tier={null}
              onDone={onDone}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LevelGroupCard({
  group, doneIds, onSelect,
}: {
  group: LevelGroup;
  doneIds: string[];
  onSelect: () => void;
}) {
  const done      = new Set(doneIds);
  const doneCount = group.items.filter(i => done.has(i.id)).length;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:border-gray-200 dark:hover:border-slate-700 overflow-hidden p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl">
          {group.icon}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{doneCount}/{group.items.length}</span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1 leading-snug">{group.label}</h3>
      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{group.desc}</p>
      <div className="mt-4">
        <span className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9]">İncele →</span>
      </div>
    </button>
  );
}

function Cat1ItemCard({
  item, action, isDone, onDone, onVisit,
}: {
  item: { id: string; label: string; desc: string };
  action: RehberAction | undefined;
  isDone: boolean;
  onDone: (action: RehberAction) => void;
  onVisit: (action: RehberAction) => void;
}) {
  if (!action) return null;
  const isExt    = action.external || action.href.startsWith('http');
  // Cat1 (Keşif): ziyaret = tamamlandı. Cat2+: sadece navigasyon, tracking server-side gelir.
  const autoMark = action.category !== 2;
  const desc     = item.desc;

  return (
    <div className={`relative bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-5 flex flex-col gap-3 cursor-pointer ${
      isDone
        ? 'border-emerald-100 dark:border-emerald-900/30'
        : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
    }`}>
      {isExt
        ? <a href={action.href} target="_blank" rel="noopener noreferrer" onClick={() => { if (!isDone && autoMark) onDone(action); }} className="absolute inset-0 rounded-2xl" aria-label={item.label} />
        : <Link href={action.href} onClick={() => { if (!isDone && autoMark) onVisit(action); }} className="absolute inset-0 rounded-2xl" aria-label={item.label} />
      }
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl">
          {action.icon}
        </div>
      </div>
      <div className="flex-1">
        <h3 className={`text-sm font-bold leading-snug ${isDone ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-900 dark:text-slate-100'}`}>
          {item.label}
        </h3>
        {desc && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
        )}
      </div>
      <div className="relative z-10 flex items-center justify-between mt-auto gap-2">
        <span className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9]">Git →</span>
        {autoMark && isDone && (
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">Doğrulandı</span>
        )}
        {!autoMark && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); if (!isDone) onDone(action); }}
            disabled={isDone}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors duration-300 ${
              isDone
                ? 'bg-emerald-500 border-emerald-500 text-white cursor-default'
                : 'bg-white dark:bg-transparent border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            Yaptım {isDone ? '✓' : ''}
          </button>
        )}

      </div>
    </div>
  );
}

function LevelCard({
  catNum, actions, doneIds, tier, onDone, isActive, defaultExpanded,
}: {
  catNum: 1 | 2 | 3 | 4;
  actions: RehberAction[];
  doneIds: string[];
  tier: string | null;
  onDone: (action: RehberAction) => void;
  isActive: boolean;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const meta = LEVEL_CARD_META[catNum];
  const lvl  = LEVEL_CONFIG[meta.levelKey];
  const done = new Set(doneIds);
  const accessible = actions.filter(a => canAccess(a, tier));
  const doneCount  = accessible.filter(a => done.has(a.id)).length;
  const pct = accessible.length > 0 ? (doneCount / accessible.length) * 100 : 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col transition-all duration-200 ${
      isActive
        ? 'border-[#26496b]/30 dark:border-[#66aca9]/30 shadow-md'
        : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5'
    }`}>
      {/* Kart başlığı — interest selection stilinde */}
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left px-5 pt-5 pb-4">
        {/* İkon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 ${lvl.bg} dark:bg-opacity-15`}>
          {meta.icon}
        </div>
        {/* Seviye etiketi */}
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${lvl.color}`}>
          {meta.actionLabel}
        </p>
        {/* Seviye adı */}
        <p className="text-base font-bold text-gray-900 dark:text-slate-100 leading-tight">
          {lvl.label}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">{meta.accessNote}</p>

        {/* Aktif badge */}
        {isActive && (
          <span className={`inline-block mt-2 text-[9px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5 ${lvl.color} ${lvl.bg} dark:bg-opacity-15`}>
            Aktif Seviye
          </span>
        )}

        {/* İlerleme */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${lvl.dot} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{doneCount}/{accessible.length}</span>
        </div>

        <div className="flex justify-end mt-3">
          <svg className={`w-4 h-4 text-gray-300 dark:text-slate-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Açılan içerik */}
      {expanded && (
        <div className="border-t border-gray-50 dark:border-slate-800 px-3 pb-3 pt-2 flex flex-col gap-1.5 flex-1">
          {catNum === 1 ? (
            ACTION_GROUPS[1].map(group => (
              <Cat1SubGroup
                key={group.label}
                group={group}
                actions={actions}
                doneIds={doneIds}
                onDone={onDone}
              />
            ))
          ) : (
            ACTION_GROUPS[catNum].map(group => {
              const groupActions = actions.filter(a => group.ids.includes(a.id));
              if (groupActions.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1 px-1">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {groupActions.map(action => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        isDone={done.has(action.id)}
                        isAccessible={canAccess(action, tier)}
                        tier={tier}
                        onDone={onDone}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Seviye → aksiyon eşlemesi (3 görev / seviye) ───────────────────────────

const INTEREST_TASKS: Record<string, string[]> = {
  izleyici:    ['v-etkinlikler', 'v-mentorluk',  'v-haberita'],
  katilimci:   ['p-etkinlik',    'p-mentee',     'p-anket'],
  katki_sunan: ['c-gonderi',     'c-sc-soru',    'c-haberita'],
  etki_yaratan:['d-mentor-seans','d-egitim',     'd-proje'],
};

// ─── İlgi alanları ────────────────────────────────────────────────────────────

const LS_INTERESTS   = 'sahne_interests';
const LS_JOURNEY_NAV = 'sahne_journey_nav';

function loadInterests(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_INTERESTS) ?? '[]') as string[]; } catch { return []; }
}
function saveInterests(ids: string[]): void {
  if (typeof window !== 'undefined') localStorage.setItem(LS_INTERESTS, JSON.stringify(ids));
}

type JourneyNav = { mode: 'select' | 'journey' | 'free'; levelView: string | null; selectedGroup: string | null };
function loadJourneyNav(): JourneyNav | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(LS_JOURNEY_NAV) ?? 'null') as JourneyNav | null; } catch { return null; }
}
function saveJourneyNav(nav: JourneyNav): void {
  if (typeof window !== 'undefined') localStorage.setItem(LS_JOURNEY_NAV, JSON.stringify(nav));
}

const INTERESTS: { id: string; level: string; label: string; desc: string; actionCount: number; icon: React.ReactNode; iconBg: string; iconColor: string; lineColor: string; levelColor: string }[] = [
  { id: 'izleyici',     level: '1. Kademe', label: 'Keşif',        desc: 'Sistemi keşfeder, içerikleri takip eder.',         actionCount: 4, icon: <IcoEye />,    iconBg: 'bg-slate-100 dark:bg-slate-800/60',   iconColor: 'text-slate-500 dark:text-slate-400',    lineColor: 'bg-slate-400',    levelColor: 'text-slate-400 dark:text-slate-500'   },
  { id: 'katilimci',    level: '2. Kademe', label: 'Katılımcı',    desc: 'İlk aksiyonlarını alır, etkinliklere katılır.',    actionCount: 3, icon: <IcoPeople />, iconBg: 'bg-blue-50 dark:bg-blue-950/40',      iconColor: 'text-blue-600 dark:text-blue-400',      lineColor: 'bg-blue-400',     levelColor: 'text-blue-400 dark:text-blue-500'     },
  { id: 'katki_sunan',  level: '3. Kademe', label: 'Katkı Sunan',  desc: 'İçerik üretir, katkı sunar.',                     actionCount: 2, icon: <IcoPencil />, iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400', lineColor: 'bg-emerald-500',  levelColor: 'text-emerald-500 dark:text-emerald-600'},
  { id: 'etki_yaratan', level: '4. Kademe', label: 'Etki Yaratan', desc: 'Mentörlük verir, topluluğa yön verir.',           actionCount: 1, icon: <IcoStar />,   iconBg: 'bg-amber-50 dark:bg-amber-950/40',    iconColor: 'text-amber-500 dark:text-amber-400',    lineColor: 'bg-amber-400',    levelColor: 'text-amber-400 dark:text-amber-500'   },
];

// ─── Level Assistant ──────────────────────────────────────────────────────────



// ─── Ana bileşen ──────────────────────────────────────────────────────────────

export function StartGuide() {
  const { user, recordAction } = useSahneAuth();
  const tier = user?.membershipTier ?? null;

  const [mounted, setMounted]               = useState(false);
  const [mode, setMode]                     = useState<'select' | 'journey' | 'free'>('select');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [doneIds, setDoneIds]               = useState<string[]>([]);
  const [levelView, setLevelView]           = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup]   = useState<string | null>(null);
  const [toast, setToast]                   = useState<{ msg: string; isAha: boolean } | null>(null);
  const [showConfetti, setShowConfetti]     = useState(false);
  const [membershipCardId, setMembershipCardId] = useState<string | null>(null);

  const firedIds = useRef(new Set<string>());

  useEffect(() => {
    const handler = (e: Event) => {
      const { levelId, groupLabel } = (e as CustomEvent<{ levelId: string; groupLabel: string }>).detail;
      setMode('select');
      setLevelView(levelId);
      setSelectedGroup(groupLabel);
      setTimeout(() => {
        document.getElementById('kesfet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    };
    window.addEventListener('open-startguide-group', handler);
    return () => window.removeEventListener('open-startguide-group', handler);
  }, []);

  // Yolculuğa Dön butonu ile dönülünce (router cache'ten, remount olmadan)
  // localStorage'ı yeniden oku — tamamlanan kartlar görünsün
  useEffect(() => {
    function onReload() {
      setDoneIds(loadLevelActions());
    }
    window.addEventListener('sahne-reload-progress', onReload);
    return () => window.removeEventListener('sahne-reload-progress', onReload);
  }, []);

  useEffect(() => {
    setMounted(true);
    setDoneIds(loadLevelActions());
    setSelectedInterests(loadInterests());
    const nav = loadJourneyNav();
    if (nav) {
      setMode(nav.mode);
      setLevelView(nav.levelView);
      setSelectedGroup(nav.selectedGroup);
    }
    if (sessionStorage.getItem('sahne_return_journey') === '1') {
      sessionStorage.removeItem('sahne_return_journey');
      setTimeout(() => {
        document.getElementById('kesfet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, []);

  // Giriş yapılınca sunucu verisini doneIds'e merge et — localStorage silinse de korunur
  useEffect(() => {
    if (!user?.completedActionIds?.length) return;
    setDoneIds(prev => {
      const merged = Array.from(new Set([...prev, ...user.completedActionIds]));
      return merged.length !== prev.length ? merged : prev;
    });
  }, [user?.completedActionIds]);

  useEffect(() => {
    if (!mounted) return;
    saveJourneyNav({ mode, levelView, selectedGroup });
  }, [mounted, mode, levelView, selectedGroup]);

  // Browser geri tuşu desteği — levelView/selectedGroup history'ye push edilir
  useEffect(() => {
    if (!mounted) return;
    if (levelView) {
      window.history.pushState({ levelView, selectedGroup }, '');
    }
  }, [mounted, levelView, selectedGroup]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const state = e.state as { levelView?: string | null; selectedGroup?: string | null } | null;
      if (state?.levelView) {
        setLevelView(state.levelView);
        setSelectedGroup(state.selectedGroup ?? null);
      } else {
        setLevelView(null);
        setSelectedGroup(null);
        document.getElementById('kesfet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const toggleInterest = useCallback((id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleStartJourney = useCallback(() => {
    saveInterests(selectedInterests);
    setLevelView(INTERESTS[0]!.id);
    setSelectedGroup(null);
  }, [selectedInterests]);

  // Dahili link ziyaretlerinde: localStorage + server'a yaz ama state güncellenmesin.
  // Kart "Doğrulandı" göstermez; kullanıcı dönünce mount'ta localStorage okunur.
  const backToLevels = useCallback(() => {
    setLevelView(null);
    setSelectedGroup(null);
    document.getElementById('kesfet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const checkLevelComplete = useCallback((newDone: string[]) => {
    if (!levelView) return;
    const interest = INTERESTS.find(i => i.id === levelView);
    if (!interest) return;
    const groups   = LEVEL_GROUPS[levelView] ?? [];
    const levelIds = groups.flatMap(g => g.items.map(it => it.id));
    const count    = newDone.filter(id => levelIds.includes(id)).length;
    if (count >= interest.actionCount) {
      setTimeout(() => backToLevels(), 800);
    }
  }, [levelView, backToLevels]);

  const handleVisit = useCallback((action: RehberAction) => {
    const current = loadLevelActions();
    if (!current.includes(action.id)) {
      saveLevelAction(action.id, current);
      window.dispatchEvent(new CustomEvent('sahne-action-done', { detail: action.id }));
    }
    const newDone = current.includes(action.id) ? current : [...current, action.id];
    void recordAction(action.id);
    checkLevelComplete(newDone);
  }, [recordAction, checkLevelComplete]);

  const handleDone = useCallback((action: RehberAction) => {
    const current = loadLevelActions();
    if (!current.includes(action.id)) {
      saveLevelAction(action.id, current);
      window.dispatchEvent(new CustomEvent('sahne-action-done', { detail: action.id }));
    }
    const newDone = current.includes(action.id) ? current : [...current, action.id];
    setDoneIds(prev => prev.includes(action.id) ? prev : [...prev, action.id]);
    void recordAction(action.id);

    if (!firedIds.current.has(action.id)) {
      firedIds.current.add(action.id);
      if (action.isAhaMoment) {
        setShowConfetti(true);
        setToast({ msg: 'Farkındalık Anı! Harika iş!', isAha: true });
        sahneTrack('events', 'completed', { source: 'startguide', actionId: action.id });
      } else {
        sahneTrack('engagement', 'clicked', { source: 'startguide', actionId: action.id });
      }
    }
    checkLevelComplete(newDone);
  }, [recordAction, checkLevelComplete]);

  if (!mounted) return null;

  // Kişiselleştirilmiş görev listesi — seçilen ilgilerden 3'er aksiyon (dedup)
  const seen = new Set<string>();
  const visibleTasks: RehberAction[] = [];
  for (const intId of selectedInterests) {
    for (const actionId of INTEREST_TASKS[intId] ?? []) {
      if (!seen.has(actionId)) {
        seen.add(actionId);
        const action = ALL_ACTIONS.find(a => a.id === actionId);
        if (action) visibleTasks.push(action);
      }
    }
  }
  const journeyDone = visibleTasks.filter(a => doneIds.includes(a.id)).length;
  const journeyPct  = visibleTasks.length > 0 ? (journeyDone / visibleTasks.length) * 100 : 0;

  return (
    <section className="py-16 sm:py-24 dark:bg-[#070c1a]" id="kesfet">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-2">
              {mode === 'free' ? 'Özgür Keşif' : mode === 'select' ? 'Kişisel Rehber' : 'Haritailesi Yolculuğun'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              {mode === 'free'
                ? 'Her kapı sana açık.'
                : mode === 'select'
                  ? 'Mesleğine Sen de Değer Kat!'
                  : journeyDone > 0
                    ? 'Sıradaki adımın hazır.'
                    : 'Yolculuğun başlıyor.'}
            </h2>
            <p className="mt-1.5 text-gray-500 dark:text-slate-400 text-sm max-w-xl">
              {mode === 'free'
                ? 'İstediğin alana gir, istediğin hızda ilerle. Sistem bekler, zorlamaz.'
                : mode === 'select'
                  ? 'Mesleğine nasıl katkı sunmak istediğine yön verelim — sana özel adımlarını oluşturalım.'
                  : 'Haritailesi ekosisteminde adım adım ilerle. Her tamamlanan aksiyon seni bir sonraki seviyeye yaklaştırır.'}
            </p>
          </div>

          <button
            onClick={() => setMode(m => m === 'free' ? 'select' : 'free')}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:border-[#66aca9] hover:text-[#26496b] dark:hover:text-[#66aca9] hover:shadow-[0_0_12px_rgba(102,172,169,0.2)] transition-all duration-200"
          >
            {mode === 'free' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Yolculuğuma Dön
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Özgür Keşif
              </>
            )}
          </button>
        </div>

        {/* ─── Select Mode ─── */}
        {mode === 'select' && (
          <div>
            {levelView ? (
              selectedGroup ? (
                /* Katman 3 — grup içi aksiyon kartları */
                <div>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-[#26496b] dark:hover:text-[#66aca9] transition-colors mb-5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {selectedGroup}
                  </button>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(LEVEL_GROUPS[levelView]?.find(g => g.label === selectedGroup)?.items ?? []).map(item => {
                      const action = ALL_ACTIONS.find(a => a.id === item.id);
                      return (
                        <Cat1ItemCard
                          key={item.id}
                          item={item}
                          action={action}
                          isDone={doneIds.includes(item.id)}
                          onDone={handleDone}
                          onVisit={handleVisit}
                        />
                      );
                    })}
                  </div>
                  {!user && (
                    <p className="mt-4 text-xs text-gray-400 dark:text-slate-500 text-center">
                      İlerlemenin kaybolmaması için{' '}
                      <a
                        href={`${process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org'}/giris`}
                        className="underline hover:text-[#26496b] dark:hover:text-[#66aca9] transition-colors"
                      >
                        giriş yap
                      </a>
                      {' '}— tarayıcı temizlenince anonim ilerleme sıfırlanır.
                    </p>
                  )}
                </div>
              ) : (
                /* Katman 2 — grup kutuları */
                <div>
                  <button
                    onClick={backToLevels}
                    className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-[#26496b] dark:hover:text-[#66aca9] transition-colors mb-5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Seviyelere Dön
                  </button>

                  {/* ── Seviye tamamlama bandı ── */}
                  {(() => {
                    const currentInterest = INTERESTS.find(i => i.id === levelView);
                    if (!currentInterest) return null;
                    const groups   = LEVEL_GROUPS[levelView] ?? [];
                    const allIds   = groups.flatMap(g => g.items.map(it => it.id));
                    const doneCount = doneIds.filter(id => allIds.includes(id)).length;
                    if (doneCount < currentInterest.actionCount) return null;
                    const nextIdx  = INTERESTS.findIndex(i => i.id === levelView) + 1;
                    const next     = INTERESTS[nextIdx];
                    const needsMember = next && (next.id === 'katki_sunan' || next.id === 'etki_yaratan') && !MEMBER_TIERS_SET.has(tier ?? '');
                    return (
                      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/50 px-5 py-4">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl shrink-0">🎉</span>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{currentInterest.label} tamamlandı!</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              {next
                                ? needsMember
                                  ? `${next.label} bölümüne erişmek için üye olman gerekiyor.`
                                  : `Sıradaki kademe hazır — ${next.label} adımlarını keşfet.`
                                : 'Tüm kademeleri tamamladın, harika bir yolculuktu!'}
                            </p>
                          </div>
                        </div>
                        {next && (needsMember ? (
                          <a
                            href={`${WEB_URL}/uye-ol`}
                            className="shrink-0 px-4 py-2 rounded-xl bg-[#26496b] hover:bg-[#1d3a57] text-white text-xs font-bold shadow-sm"
                          >
                            Üye Ol →
                          </a>
                        ) : (
                          <button
                            onClick={() => { setLevelView(next.id); setSelectedGroup(null); }}
                            className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                          >
                            {next.label}'a Geç →
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(LEVEL_GROUPS[levelView] ?? []).map(group => (
                      <LevelGroupCard
                        key={group.label}
                        group={group}
                        doneIds={doneIds}
                        onSelect={() => setSelectedGroup(group.label)}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* Katman 1 — 4 seviye kartı */
              <>
                {/* ── Üye kartı (giriş yapanlara) ── */}
                <div className="flex justify-end mb-6">
                  <MemberCard />
                </div>

                {/* ── Kademe tamamlama bandı ── */}
                {(() => {
                  // En son tamamlanan kademeyi bul (sonraki kademe varsa göster)
                  let completedInterest: typeof INTERESTS[number] | null = null;
                  let nextInterest: typeof INTERESTS[number] | null = null;
                  for (let i = 0; i < INTERESTS.length - 1; i++) {
                    const lvl     = INTERESTS[i]!;
                    const groups  = LEVEL_GROUPS[lvl.id] ?? [];
                    const ids     = groups.flatMap(g => g.items.map(it => it.id));
                    const done    = doneIds.filter(id => ids.includes(id)).length;
                    if (done >= lvl.actionCount) {
                      completedInterest = lvl;
                      nextInterest      = INTERESTS[i + 1]!;
                    }
                  }
                  if (!completedInterest || !nextInterest) return null;
                  const needsMember = (nextInterest.id === 'katki_sunan' || nextInterest.id === 'etki_yaratan')
                    && !MEMBER_TIERS_SET.has(tier ?? '');
                  return (
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 border border-blue-100 dark:border-blue-900/50 px-5 py-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl shrink-0">🎉</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{completedInterest.label} tamamlandı!</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {needsMember
                              ? `${nextInterest.label} bölümüne erişmek için üye olman gerekiyor.`
                              : `Artık ${nextInterest.label} adımlarını alabilirsin — seni daha fazlası bekliyor.`}
                          </p>
                        </div>
                      </div>
                      {needsMember ? (
                        <a
                          href={`${WEB_URL}/uye-ol`}
                          className="shrink-0 px-4 py-2 rounded-xl bg-[#26496b] hover:bg-[#1d3a57] text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          Üye Ol →
                        </a>
                      ) : (
                        <button
                          onClick={() => { setLevelView(nextInterest!.id); setSelectedGroup(null); }}
                          className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          {nextInterest.label}'ı Keşfet →
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* ── Stepper bağlantı çizgisi ── */}
                <div className="hidden lg:grid grid-cols-4 mb-6">
                  {INTERESTS.map((interest, idx) => {
                    const prev        = INTERESTS[idx - 1];
                    const next        = INTERESTS[idx + 1];
                    const prevDone    = prev ? doneIds.filter(id => (LEVEL_GROUPS[prev.id] ?? []).some(g => g.items.some(i => i.id === id))).length : 0;
                    const isUnlocked  = idx === 0 || prevDone >= (prev?.actionCount ?? 0);
                    const doneCurrent = doneIds.filter(id => (LEVEL_GROUPS[interest.id] ?? []).some(g => g.items.some(i => i.id === id))).length;
                    const isComplete  = doneCurrent >= interest.actionCount;
                    const prevComplete = prev ? doneIds.filter(id => (LEVEL_GROUPS[prev.id] ?? []).some(g => g.items.some(i => i.id === id))).length >= (prev.actionCount) : false;
                    return (
                      <div key={interest.id} className="flex items-center">
                        {/* Sol çizgi */}
                        <div className={`flex-1 h-px transition-all duration-500 ${idx === 0 ? 'invisible' : prevComplete ? (prev?.lineColor ?? 'bg-gray-200') : 'bg-gray-200 dark:bg-slate-700'}`} />
                        {/* Daire */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isComplete ? 'bg-emerald-500' :
                          isUnlocked ? interest.iconBg :
                          'bg-gray-100 dark:bg-slate-800'
                        }`}>
                          {isComplete
                            ? <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            : isUnlocked
                              ? <span className={`${interest.iconColor} [&>svg]:w-5 [&>svg]:h-5`}>{interest.icon}</span>
                              : <svg className="w-4 h-4 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                          }
                        </div>
                        {/* Sağ çizgi */}
                        <div className={`flex-1 h-px transition-all duration-500 ${next === undefined ? 'invisible' : isComplete ? interest.lineColor : 'bg-gray-200 dark:bg-slate-700'}`} />
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {INTERESTS.map((interest, idx) => {
                    const prev        = INTERESTS[idx - 1];
                    const prevDone    = prev ? doneIds.filter(id => (LEVEL_GROUPS[prev.id] ?? []).some(g => g.items.some(i => i.id === id))).length : 0;
                    const isUnlocked  = idx === 0 || prevDone >= (prev?.actionCount ?? 0);
                    const done        = doneIds.filter(id => (LEVEL_GROUPS[interest.id] ?? []).some(g => g.items.some(i => i.id === id))).length;
                    const total       = interest.actionCount;
                    const pct         = Math.min((done / total) * 100, 100);
                    const next        = INTERESTS[idx + 1];
                    const neededMore  = prev ? (prev.actionCount - prevDone) : 0;

                    const isComplete = done >= total;

                    const progressBar = (
                      <div className="w-full mt-5 flex items-center gap-2">
                        <span className="shrink-0 text-[10px] font-medium text-gray-400 dark:text-slate-500">
                          {interest.label}
                        </span>
                        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden min-w-0">
                          <div className={`h-full rounded-full transition-all duration-500 ${interest.iconColor.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="shrink-0 text-[10px] font-medium">
                          <span className="text-gray-400 dark:text-slate-500">({done}/{total}) </span>
                          {next
                            ? <span className={interest.iconColor}>{next.label}</span>
                            : <span className="text-emerald-500">Zirve ⭐</span>
                          }
                        </span>
                      </div>
                    );

                    if (!isUnlocked) {
                      return (
                        <div
                          key={interest.id}
                          className="relative flex flex-col items-center text-center px-4 pt-10 pb-6 rounded-2xl border-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-50 cursor-default select-none"
                        >
                          <span className={`absolute top-3.5 left-4 text-[10px] font-semibold uppercase tracking-widest ${interest.levelColor}`}>
                            {interest.level}
                          </span>
                          {(interest.id === 'katki_sunan' || interest.id === 'etki_yaratan') && (
                            <span className="absolute top-3 right-3 text-[9px] font-semibold text-[#26496b] dark:text-[#66aca9] bg-[#26496b]/8 dark:bg-[#66aca9]/10 border border-[#26496b]/15 dark:border-[#66aca9]/20 px-2 py-0.5 rounded-full">
                              Üyelere Özel
                            </span>
                          )}
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gray-100 dark:bg-slate-800">
                            <svg className="w-6 h-6 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold leading-snug mb-1.5 text-gray-900 dark:text-slate-100">
                            {interest.label}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 leading-snug">{interest.desc}</p>
                          {progressBar}
                        </div>
                      );
                    }

                    const needsMembership = (interest.id === 'katki_sunan' || interest.id === 'etki_yaratan')
                      && !MEMBER_TIERS_SET.has(tier ?? '');

                    const showMembershipPrompt = needsMembership && membershipCardId === interest.id;

                    return (
                      <button
                        key={interest.id}
                        onClick={() => {
                          if (needsMembership) {
                            setMembershipCardId(interest.id);
                            return;
                          }
                          setLevelView(interest.id);
                          setSelectedGroup(null);
                        }}
                        onMouseEnter={() => window.dispatchEvent(new CustomEvent('open-journey-assistant'))}
                        className={`relative flex flex-col items-center text-center px-4 pt-10 pb-6 rounded-2xl border-2 ${
                          isComplete
                            ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700/50'
                            : showMembershipPrompt
                            ? 'border-[#26496b]/30 dark:border-[#66aca9]/30 bg-[#26496b]/4 dark:bg-[#66aca9]/5'
                            : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className={`absolute top-3.5 left-4 text-[10px] font-semibold uppercase tracking-widest ${interest.levelColor}`}>
                          {interest.level}
                        </span>
                        {!showMembershipPrompt && (isComplete ? (
                          <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                            ✓ Tamamlandı
                          </span>
                        ) : (interest.id === 'katki_sunan' || interest.id === 'etki_yaratan') ? (
                          <span className="absolute top-3 right-3 text-[9px] font-semibold text-[#26496b] dark:text-[#66aca9] bg-[#26496b]/8 dark:bg-[#66aca9]/10 border border-[#26496b]/15 dark:border-[#66aca9]/20 px-2 py-0.5 rounded-full">
                            Üyelere Özel
                          </span>
                        ) : null)}
                        {showMembershipPrompt ? (
                          <div className="flex flex-col items-center justify-center text-center gap-2.5 flex-1">
                            <p className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-snug">
                              3. ve 4. seviye yalnızca<br />Haritailesi üyelerine açıktır.
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                              Haritailesi&apos;nin üretim, etkileşim ve gelişim deneyimine erişmek için üyeliğinizi başlatın.
                            </p>
                            <a
                              href={`${WEB_URL}/uye-ol`}
                              onClick={e => e.stopPropagation()}
                              className="mt-1 px-3.5 py-1.5 rounded-lg bg-[#26496b] hover:bg-[#1d3a57] text-white text-xs font-semibold shadow-sm"
                            >
                              Üye Ol →
                            </a>
                            <button
                              onClick={e => { e.stopPropagation(); setMembershipCardId(null); }}
                              className="text-[11px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                            >
                              Geri Dön
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isComplete ? 'bg-emerald-100 dark:bg-emerald-900/30' : interest.iconBg}`}>
                              {isComplete
                                ? <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                : <span className={`${interest.iconColor} [&>svg]:w-6 [&>svg]:h-6`}>{interest.icon}</span>
                              }
                            </div>
                            <p className="text-sm font-bold leading-snug mb-1.5 text-gray-900 dark:text-slate-100">
                              {interest.label}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 leading-snug">{interest.desc}</p>
                            {progressBar}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setMode('free')}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-slate-200 transition-all duration-150"
                  >
                    Özgür Keşif →
                  </button>
                  <p className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                    Yolculuğuna istediğin zaman &quot;Özgür Keşif&quot; ile devam edebilirsin.
                  </p>
                  <button
                    onClick={handleStartJourney}
                    className="px-5 py-2 rounded-xl bg-[#26496b] hover:bg-[#1d3a57] text-white text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-md"
                  >
                    Yolculuğumu Başlat →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Journey Mode — kişiselleştirilmiş görev listesi ─── */}
        {mode === 'journey' && (
          <div className="max-w-2xl space-y-8">

            {/* İlerleme + ilgi değiştir */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {journeyDone} / {visibleTasks.length} görev tamamlandı
                </p>
                <div className="mt-2 w-48 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#26496b] dark:bg-[#66aca9] rounded-full transition-all duration-700"
                    style={{ width: `${journeyPct}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setMode('select')}
                className="text-sm text-gray-400 dark:text-slate-500 hover:text-[#26496b] dark:hover:text-[#66aca9] transition-colors"
              >
                İlgilerimi değiştir →
              </button>
            </div>

            {/* Her ilgi için görev grubu */}
            {selectedInterests.map(intId => {
              const interest = INTERESTS.find(i => i.id === intId);
              const taskIds  = INTEREST_TASKS[intId] ?? [];
              const tasks    = taskIds.map(id => ALL_ACTIONS.find(a => a.id === id)).filter(Boolean) as RehberAction[];
              const grpDone  = tasks.filter(a => doneIds.includes(a.id)).length;

              return (
                <div key={intId}>
                  {/* Grup başlığı */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${interest?.iconBg ?? 'bg-gray-50'}`}>
                      <span className={interest?.iconColor ?? 'text-gray-400'}>{interest?.icon}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100 flex-1">{interest?.label}</p>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{grpDone}/{tasks.length}</span>
                  </div>

                  {/* Görev satırları */}
                  <div className="rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden divide-y divide-gray-50 dark:divide-slate-800/50">
                    {tasks.map(action => {
                      const isDone       = doneIds.includes(action.id);
                      const isAccessible = canAccess(action, tier);
                      const isExt        = action.external || action.href.startsWith('http');

                      if (!isAccessible) {
                        return (
                          <div key={action.id} className="flex items-center gap-3 px-4 py-3.5 bg-gray-50/50 dark:bg-slate-800/20">
                            <span className="text-lg shrink-0 opacity-25">{action.icon}</span>
                            <span className="text-sm text-gray-300 dark:text-slate-600 flex-1">{action.label}</span>
                            <span className="text-[10px] border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-600 rounded-full px-2 py-0.5 shrink-0">
                              {!tier ? 'Giriş' : 'Üye'}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={action.id} className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                          isDone ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : 'hover:bg-gray-50/70 dark:hover:bg-slate-800/30'
                        }`}>
                          <span className={`text-lg shrink-0 ${isDone ? 'opacity-40' : ''}`}>{action.icon}</span>
                          <span className={`text-sm flex-1 font-medium leading-snug ${
                            isDone ? 'line-through text-gray-300 dark:text-slate-600' : 'text-gray-800 dark:text-slate-200'
                          }`}>{action.label}</span>
                          {action.isAhaMoment && !isDone && <span className="text-amber-400 shrink-0 text-base">✨</span>}
                          {!isDone && (isExt ? (
                            <a href={action.href} target="_blank" rel="noopener noreferrer"
                              className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9] hover:underline shrink-0">
                              Git →
                            </a>
                          ) : (
                            <Link href={action.href}
                              className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9] hover:underline shrink-0">
                              Git →
                            </Link>
                          ))}
                          <button
                            onClick={() => handleDone(action)}
                            className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                              isDone
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                : 'border border-gray-200 dark:border-slate-700 text-gray-300 hover:border-emerald-300 hover:text-emerald-500'
                            }`}
                          >✓</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* ─── Free Mode ─── */}
        {mode === 'free' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {FREE_CATEGORIES.map((cat) => {

              // ── Standard card ──
              const inner = (
                <>
                  <div className={`h-1 w-full bg-gradient-to-r ${cat.gradient}`} />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${cat.gradient} text-white shadow-sm`}>
                        {cat.icon}
                      </div>
                      {cat.note && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#26496b]/10 text-[#26496b] dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                          {cat.note}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1 leading-snug">{cat.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed flex-1">{cat.desc}</p>
                    {cat.pulse && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#66aca9] animate-pulse shrink-0" />
                        <span className="text-[10px] font-semibold text-[#66aca9]">{cat.pulse}</span>
                      </div>
                    )}
                  </div>
                </>
              );

              const cls = 'group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 dark:hover:border-slate-700 transition-all duration-200 overflow-hidden';

              if (cat.external) {
                return <a key={cat.title} href={cat.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
              }
              return <Link key={cat.title} href={cat.href} className={cls}>{inner}</Link>;
            })}
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} isAha={toast.isAha} onDone={() => setToast(null)} />
      )}

      {/* Confetti */}
      {showConfetti && (
        <ConfettiBurst onDone={() => setShowConfetti(false)} />
      )}

      {/* Level Assistant */}

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(300px) rotate(720deg) scale(0.3); opacity: 0; }
        }
        @keyframes bounce-once {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          30%       { transform: translateX(-50%) translateY(-8px); }
          60%       { transform: translateX(-50%) translateY(-3px); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}
