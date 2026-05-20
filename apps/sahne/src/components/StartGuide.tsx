'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { sahneTrack } from '@/contexts/SahneAuthContext';
import Link from 'next/link';

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
const IcoCheck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IcoSparkle = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

// ─── Types & Data ──────────────────────────────────────────────────────────────

type InterestKey = 'etkinlik' | 'mentorluk' | 'icerik' | 'proje' | 'egitim' | 'topluluk';

interface Task {
  id: string;
  categoryId: InterestKey;
  label: string;
  desc: string;
  href: string;
  cta: string;
  isAhaMoment: boolean;
  external?: boolean;
}

const INTERESTS: {
  key: InterestKey; label: string; icon: React.ReactNode; desc: string;
  color: string; selectedColor: string; activeRing: string;
}[] = [
  { key: 'etkinlik',  label: 'Etkinlik & Organizasyon', icon: <IcoCalendar />, desc: 'Kongre, workshop, networking',      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',   selectedColor: 'bg-emerald-500',   activeRing: 'ring-emerald-400' },
  { key: 'mentorluk', label: 'Mentörlük',                icon: <IcoBrain />,   desc: 'Rehberlik al veya ver',            color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',           selectedColor: 'bg-amber-500',     activeRing: 'ring-amber-400' },
  { key: 'icerik',    label: 'İçerik Üretimi',           icon: <IcoPencil />,  desc: 'Yaz, paylaş, katkı sun',          color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400',                 selectedColor: 'bg-sky-500',       activeRing: 'ring-sky-400' },
  { key: 'proje',     label: 'Projeler',                 icon: <IcoMap />,     desc: 'Geliştir veya katıl',              color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',             selectedColor: 'bg-blue-500',      activeRing: 'ring-blue-400' },
  { key: 'egitim',    label: 'Eğitim & Araştırma',      icon: <IcoCap />,     desc: 'Öğren, uygula, büyü',             color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400',             selectedColor: 'bg-teal-500',      activeRing: 'ring-teal-400' },
  { key: 'topluluk',  label: 'Topluluk Alanı',           icon: <IcoPeople />,  desc: 'Tanış, konuş, katıl',             color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',     selectedColor: 'bg-violet-500',    activeRing: 'ring-violet-400' },
];

const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const ALL_TASKS: Task[] = [
  // Etkinlik
  { id: 'etk-1', categoryId: 'etkinlik',  label: 'Yaklaşan etkinliklere katıl',   desc: 'Kongre, çalıştay ve webinar takvimine gir, ilk etkinliğini seç.',      href: '/etkinlikler',  cta: 'Takvime Git →',      isAhaMoment: true },
  { id: 'etk-2', categoryId: 'etkinlik',  label: 'Etkinlik fikri öner',           desc: 'Topluluğun ihtiyaç duyduğu etkinliği öner, birlikte organize edelim.', href: '/gorusleriniz', cta: 'Öner →',             isAhaMoment: false },
  { id: 'etk-3', categoryId: 'etkinlik',  label: 'Mutfak\'ta organize ol',        desc: 'Üyelerle plan yap, ekip kur, etkinlik hazırlığı başlat.',               href: MUTFAK_URL,      cta: 'Mutfak\'a Gir →',   isAhaMoment: false, external: true },

  // Mentorluk
  { id: 'men-1', categoryId: 'mentorluk', label: 'Bir mentörle bağlan',           desc: 'Alanına uygun aktif mentörü bul, ilk bağlantını kur.',                  href: '/mentorluk',    cta: 'Mentör Bul →',       isAhaMoment: true },
  { id: 'men-2', categoryId: 'mentorluk', label: 'Mentor ol',                     desc: 'Bilgi ve deneyimini genç meslektaşlarla paylaş.',                       href: '/mentorluk',    cta: 'Başvur →',           isAhaMoment: false },
  { id: 'men-3', categoryId: 'mentorluk', label: 'Meslektaşları tanı',            desc: 'Sektörün farklı alanlarından profesyonelleri keşfet.',                   href: '/uyeler',       cta: 'Üyelere Bak →',      isAhaMoment: false },

  // İçerik
  { id: 'ice-1', categoryId: 'icerik',    label: 'İlk içeriğini paylaş',          desc: 'Yazı, analiz veya deneyimini topluluğa sun; ilk adım her zaman en değerlisidir.', href: MUTFAK_URL, cta: 'Mutfak\'a Gir →', isAhaMoment: true, external: true },
  { id: 'ice-2', categoryId: 'icerik',    label: 'Forum\'a katıl',                desc: 'Sorular sor, fikirler paylaş, tartışmalara dahil ol.',                   href: '/soru-cevap',   cta: 'Git →',              isAhaMoment: false },
  { id: 'ice-3', categoryId: 'icerik',    label: 'Haberita\'ya katkı ver',        desc: 'Sektörden haber, analiz veya köşe yazısı gönder.',                      href: 'https://haberita.com', cta: 'İncele →',    isAhaMoment: false, external: true },

  // Proje
  { id: 'prj-1', categoryId: 'proje',     label: 'Projeyi topluluğa sun',         desc: 'Geliştirdiğin ya da katkı sunduğun projeyi Sahne\'de paylaş.',          href: '/projeler',     cta: 'Projelere Bak →',    isAhaMoment: true },
  { id: 'prj-2', categoryId: 'proje',     label: 'Açık projelere katıl',          desc: 'Topluluğun aktif projelerini keşfet, ekibe dahil ol.',                  href: '/projeler',     cta: 'Keşfet →',           isAhaMoment: false },
  { id: 'prj-3', categoryId: 'proje',     label: 'İş birliği bul',               desc: 'Proje ortağı veya ekip üyesi arıyorsan topluluğa sor.',                 href: '/soru-cevap',   cta: 'Sor →',              isAhaMoment: false },

  // Eğitim
  { id: 'egt-1', categoryId: 'egitim',    label: 'Eğitim programlarını keşfet',   desc: 'Online ve yüz yüze sertifika kurslarına göz at.',                       href: '/egitim',       cta: 'Programlara Bak →',  isAhaMoment: false },
  { id: 'egt-2', categoryId: 'egitim',    label: 'Sınav kaynaklarına ulaş',       desc: 'KPSS, CBS ve sektör sınavlarına hazırlan.',                              href: '/sinavlar',     cta: 'Git →',              isAhaMoment: false },
  { id: 'egt-3', categoryId: 'egitim',    label: 'Mentörden öğren',              desc: 'Deneyimli bir profesyonelden birebir öğrenme fırsatını yakala.',          href: '/mentorluk',    cta: 'Mentor Bul →',       isAhaMoment: true },

  // Topluluk
  { id: 'top-1', categoryId: 'topluluk',  label: 'Topluluk akışına katıl',        desc: 'Mutfak\'taki üye akışını keşfet, ilk gönderini paylaş.',                href: MUTFAK_URL,      cta: 'Mutfak\'a Gir →',   isAhaMoment: true, external: true },
  { id: 'top-2', categoryId: 'topluluk',  label: 'Haritailesi Genç\'e bak',       desc: 'Öğrenci kulüpleri ve gençlik topluluğunu keşfet.',                       href: '/genc',         cta: 'Keşfet →',           isAhaMoment: false },
  { id: 'top-3', categoryId: 'topluluk',  label: 'Üyeleri keşfet',               desc: 'Sektörün farklı alanlarından insanları tanı, bağlantı kur.',             href: '/uyeler',       cta: 'Üyelere Bak →',      isAhaMoment: false },
];

// ─── Özgür keşif kategorileri ─────────────────────────────────────────────────

const FREE_CATEGORIES: {
  title: string; desc: string; href: string;
  icon: React.ReactNode; gradient: string; pulse?: string; note?: string; external?: boolean;
}[] = [
  { title: 'İçerik Üretimi',         desc: 'Yaz, paylaş, katkı sun. Forum ve Mutfak\'ta üret.',         href: '/soru-cevap',   icon: <IcoPencil />,    gradient: 'from-sky-500 to-blue-600',          pulse: '200+ içerik' },
  { title: 'Etkinlik & Organizasyon',desc: 'Kongre, workshop ve networking etkinlikleri.',                href: '/etkinlikler',  icon: <IcoCalendar />,  gradient: 'from-emerald-500 to-teal-600',       pulse: '25+ etkinlik' },
  { title: 'Mentörlük',              desc: 'Deneyimli profesyonellerden birebir rehberlik.',              href: '/mentorluk',    icon: <IcoBrain />,     gradient: 'from-amber-500 to-orange-600',       pulse: '14 aktif mentor' },
  { title: 'Projeler',               desc: 'Topluluk projelerini keşfet, Haritakademi\'de yer al.',      href: '/projeler',     icon: <IcoMap />,       gradient: 'from-blue-500 to-indigo-600',        pulse: '3 aktif proje' },
  { title: 'Eğitimler',              desc: 'Online ve yüz yüze sertifika programları.',                   href: '/egitim',       icon: <IcoCap />,       gradient: 'from-teal-500 to-cyan-600',          pulse: '8 program' },
  { title: 'Topluluk Alanı',         desc: 'Tanış, konuş, katıl. Haritailesi Genç dahil.',               href: '/genc',         icon: <IcoPeople />,    gradient: 'from-violet-500 to-purple-600',      pulse: '500+ üye' },
  { title: 'Yetenekler',             desc: 'Topluluğun meslek dışı yetenekleri — müzik, resim, dans.',   href: '/yetenekler',   icon: <IcoStar />,      gradient: 'from-pink-500 to-rose-600',          pulse: 'Topluluktan' },
  { title: 'Araştırma & Analiz',     desc: 'Soru & Cevap, anketler ve sektör verileri.',                 href: '/soru-cevap',   icon: <IcoChart />,     gradient: 'from-rose-500 to-pink-600',          pulse: '200+ soru' },
  { title: 'Medya & Video',          desc: 'Haritailesi TV — sektörel içerikler ve röportajlar.',         href: 'https://www.youtube.com/@haritailesi', icon: <IcoVideo />, gradient: 'from-red-500 to-rose-600', pulse: '50+ video', external: true },
  { title: 'İlan Panosu',            desc: 'Sektöre özel iş ilanları ve kariyer fırsatları.',            href: '/ilanlar',      icon: <IcoBriefcase />, gradient: 'from-gray-500 to-slate-600',         pulse: 'Aktif ilanlar' },
  { title: 'Mağaza',                 desc: 'Dijital kaynaklar, üye kitleri ve topluluk içerikleri.',     href: '/magaza',       icon: <IcoStore />,     gradient: 'from-purple-500 to-indigo-600',      pulse: 'Yeni ürünler' },
  { title: 'Yarışmalar',             desc: 'Fotoğraf, proje ve makale yarışmaları.',                      href: '/yarismalar',   icon: <IcoTrophy />,    gradient: 'from-amber-400 to-yellow-600',       pulse: 'Açık yarışmalar' },
  { title: 'Mutfak — Üretim Alanı', desc: 'Kapalı topluluk. Üretim, iş birliği, ekip çalışması.',      href: MUTFAK_URL,      icon: <IcoLock />,      gradient: 'from-[#26496b] to-[#1d3a57]',        pulse: 'Aktif üretim', note: 'Üyelere Özel', external: true },
  { title: 'Haritailesi',            desc: 'Vakfın ana sitesi. Misyon, projeler ve topluluğun yüzleri.', href: process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org', icon: <IcoGlobe />, gradient: 'from-[#26496b] to-[#1d3a57]', pulse: 'Ana Site', external: true },
  { title: 'Haritakademi',           desc: 'Sektörel proje, eğitim, etkinlik ve mesleki gelişim.',       href: 'https://www.linkedin.com/showcase/haritakademi', icon: <IcoCap />, gradient: 'from-blue-600 to-blue-800', pulse: 'LinkedIn', external: true },
  { title: 'Haberita',               desc: 'Harita mühendislerinin ilk ve tek haber merkezi.',            href: 'https://haberita.com', icon: <IcoNewspaper />, gradient: 'from-amber-500 to-amber-700', pulse: 'Haberler', external: true },
  { title: 'Haritakariyer',          desc: 'İş ilanları, kariyer fırsatları ve sektörel işe alım.',      href: 'https://www.linkedin.com/showcase/haritakariyer', icon: <IcoBriefcase />, gradient: 'from-[#66aca9] to-teal-700', pulse: 'LinkedIn', external: true },
];

// ─── localStorage keys ────────────────────────────────────────────────────────

const LS_INTERESTS = 'sahne_interests';
const LS_DONE = 'sahne_tasks_done';

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

// ─── Görev Kartı ─────────────────────────────────────────────────────────────

function TaskCard({
  task,
  done,
  onDone,
  isNext,
}: {
  task: Task;
  done: boolean;
  onDone: (task: Task) => void;
  isNext: boolean;
}) {
  const catInfo = INTERESTS.find((i) => i.key === task.categoryId);
  const isExt = task.external || task.href.startsWith('http');

  const linkProps = isExt
    ? { as: 'a' as const, href: task.href, target: '_blank', rel: 'noopener noreferrer' }
    : { as: Link as React.ElementType, href: task.href };

  const wrapperCls = `group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${
    done
      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20'
      : task.isAhaMoment && isNext
        ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-300/40 hover:shadow-xl hover:-translate-y-1'
        : isNext
          ? 'border-[#26496b]/30 dark:border-blue-700/50 ring-2 ring-[#26496b]/15 hover:shadow-xl hover:-translate-y-1'
          : 'border-gray-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-200 dark:hover:border-slate-700'
  }`;

  return (
    <div className={wrapperCls}>
      {/* Top stripe */}
      {task.isAhaMoment && !done && (
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 to-amber-600" />
      )}
      {done && (
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
      )}

      {/* Badges */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
        {isNext && !done && (
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            task.isAhaMoment
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-[#26496b]/10 text-[#26496b] dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {task.isAhaMoment ? '✨ Aha Anı' : 'Sıradaki'}
          </span>
        )}
        {task.isAhaMoment && !isNext && !done && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            ✨ Aha Anı
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Category */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${done ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : catInfo?.color ?? 'bg-gray-100 text-gray-500'} transition-colors`}>
          {done ? <IcoCheck /> : catInfo?.icon}
        </div>

        <div className="flex-1">
          <h3 className={`text-sm font-bold leading-snug ${done ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
            {task.label}
          </h3>
          {!done && (
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mt-1">{task.desc}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          {done ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <IcoCheck /> Tamamlandı
            </span>
          ) : (
            <LinkWrapper isExt={isExt} href={task.href}>
              <span className={`text-xs font-semibold ${task.isAhaMoment ? 'text-amber-600 dark:text-amber-400' : 'text-[#26496b] dark:text-[#66aca9]'} group-hover:underline`}>
                {task.cta}
              </span>
            </LinkWrapper>
          )}

          {!done && (
            <button
              onClick={() => onDone(task)}
              className="shrink-0 px-2.5 py-1 text-[10px] font-semibold text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
              title="Yaptım olarak işaretle"
            >
              Yaptım ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkWrapper({ isExt, href, children }: { isExt: boolean; href: string; children: React.ReactNode }) {
  if (isExt) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <Link href={href}>{children}</Link>;
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────

export function StartGuide() {
  const [mode, setMode] = useState<'select' | 'guided' | 'free'>('select');
  const [selectedInterests, setSelectedInterests] = useState<InterestKey[]>([]);
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; isAha: boolean } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const initialized = useRef(false);

  // Load from localStorage
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(LS_INTERESTS);
      if (raw) {
        const parsed = JSON.parse(raw) as InterestKey[];
        if (parsed.length > 0) {
          setSelectedInterests(parsed);
          setMode('guided');
        }
      }
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem(LS_DONE);
      if (raw) {
        setDoneTasks(new Set(JSON.parse(raw) as string[]));
      }
    } catch { /* ignore */ }
  }, []);

  function toggleInterest(key: InterestKey) {
    setSelectedInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function confirmInterests() {
    if (selectedInterests.length === 0) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_INTERESTS, JSON.stringify(selectedInterests));
    }
    setMode('guided');
  }

  function resetInterests() {
    setSelectedInterests([]);
    setMode('select');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LS_INTERESTS);
    }
  }

  const handleDone = useCallback((task: Task) => {
    setDoneTasks((prev) => {
      if (prev.has(task.id)) return prev; // idempotent — çift tık koruması
      const next = new Set([...prev, task.id]);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_DONE, JSON.stringify([...next]));
      }
      return next;
    });

    if (doneTasks.has(task.id)) return; // efektleri yalnızca ilk tamamlamada tetikle

    if (task.isAhaMoment) {
      setShowConfetti(true);
      setToast({ msg: 'Aha anına ulaştın! Harika iş!', isAha: true });
      sahneTrack('events', 'completed', { source: 'startguide', taskId: task.id, categoryId: task.categoryId });
    } else {
      setToast({ msg: 'Tamamlandı! Devam et.', isAha: false });
      sahneTrack('engagement', 'clicked', { source: 'startguide', taskId: task.id, categoryId: task.categoryId });
    }
  }, [doneTasks]);

  // Compute visible tasks
  const visibleTasks = ALL_TASKS.filter((t) => selectedInterests.includes(t.categoryId));
  const totalCount = visibleTasks.length;
  const doneCount = visibleTasks.filter((t) => doneTasks.has(t.id)).length;
  const progressPct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;

  // Next task: first uncompleted aha moment, then first uncompleted regular
  const nextTask =
    visibleTasks.find((t) => !doneTasks.has(t.id) && t.isAhaMoment) ??
    visibleTasks.find((t) => !doneTasks.has(t.id));

  return (
    <section className="py-16 sm:py-24 dark:bg-[#070c1a]" id="kesfet">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-2">
              {mode === 'free' ? 'Özgür Keşif' : mode === 'select' ? 'Kişisel Rehber' : 'Yolculuğun'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              {mode === 'free'
                ? 'Her kapı sana açık.'
                : mode === 'select'
                  ? 'Seni yönlendirelim. Ne yapmak istiyorsun?'
                  : allDone
                    ? 'Tüm adımları tamamladın! 🎉'
                    : nextTask
                      ? `Sıradaki adımın hazır.`
                      : 'Yolculuğun başlıyor.'}
            </h2>
            <p className="mt-1.5 text-gray-500 dark:text-slate-400 text-sm max-w-xl">
              {mode === 'free'
                ? 'İstediğin alana gir, istediğin hızda ilerle. Sistem bekler, zorlamaz.'
                : mode === 'select'
                  ? 'İlgilendiğin alanları seç — sana özel adımlarını hazırlayalım.'
                  : allDone
                    ? 'Bütün hedeflerini tamamladın. Haritailesi topluluğunda iz bırakıyorsun.'
                    : 'Aşağıdaki görevleri sırayla ya da istediğin sıraya göre tamamla.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {mode === 'guided' && (
              <button
                onClick={resetInterests}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                İlgilerimi Değiştir
              </button>
            )}
            <button
              onClick={() => setMode(mode === 'free' ? (selectedInterests.length > 0 ? 'guided' : 'select') : 'free')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:border-[#66aca9] hover:text-[#26496b] dark:hover:text-[#66aca9] hover:shadow-[0_0_12px_rgba(102,172,169,0.2)] transition-all duration-200"
            >
              {mode === 'free' ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>Yönlendirmeli moda dön</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>Özgür keşif</>
              )}
            </button>
          </div>
        </div>

        {/* ─── Interest Selection ─── */}
        {mode === 'select' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.key);
                return (
                  <button
                    key={interest.key}
                    onClick={() => toggleInterest(interest.key)}
                    className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 shadow-sm text-center transition-all duration-200 ${
                      isSelected
                        ? 'border-[#26496b] bg-[#26496b]/5 dark:bg-[#26496b]/20 shadow-lg -translate-y-1'
                        : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 hover:border-gray-200 dark:hover:border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#26496b] flex items-center justify-center">
                        <IcoCheck />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${interest.color} transition-all duration-200 group-hover:scale-110`}>
                      {interest.icon}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-gray-800 dark:text-slate-100 leading-snug">{interest.label}</span>
                      <span className="block text-[10px] text-gray-400 dark:text-slate-500 leading-tight mt-0.5">{interest.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {selectedInterests.length === 0
                  ? 'En az bir alan seç'
                  : `${selectedInterests.length} alan seçildi — ${selectedInterests.length * 3} kişisel görev hazırlanıyor`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('free')}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  Özgür keşfet →
                </button>
                <button
                  onClick={confirmInterests}
                  disabled={selectedInterests.length === 0}
                  className="px-6 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56] disabled:opacity-40 transition-colors shadow-sm"
                >
                  Yolculuğumu Başlat →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Guided Mode ─── */}
        {mode === 'guided' && (
          <div>
            {/* Progress bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm px-5 py-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {selectedInterests.map((key) => {
                      const info = INTERESTS.find((i) => i.key === key);
                      return (
                        <span key={key} className={`w-6 h-6 rounded-lg flex items-center justify-center ${info?.color ?? ''}`} title={info?.label}>
                          <span className="scale-75">{info?.icon}</span>
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {selectedInterests.map((k) => INTERESTS.find((i) => i.key === k)?.label).join(', ')}
                  </span>
                </div>
                <span className={`text-sm font-bold ${allDone ? 'text-emerald-600' : 'text-[#26496b] dark:text-[#66aca9]'}`}>
                  {doneCount} / {totalCount}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#26496b] to-[#66aca9]'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {allDone && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1.5">
                  <IcoSparkle /> Tüm adımları tamamladın!
                </p>
              )}
            </div>

            {/* Sıradaki Adımın - hero card */}
            {nextTask && !allDone && (
              <div className={`rounded-2xl border-2 p-6 mb-6 ${
                nextTask.isAhaMoment
                  ? 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-300 dark:border-amber-700'
                  : 'bg-gradient-to-br from-[#26496b]/5 to-white dark:from-[#26496b]/10 dark:to-slate-900 border-[#26496b]/25 dark:border-blue-800/50'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    nextTask.isAhaMoment ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-[#26496b]/10 text-[#26496b] dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {nextTask.isAhaMoment ? <IcoSparkle /> : INTERESTS.find((i) => i.key === nextTask.categoryId)?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${nextTask.isAhaMoment ? 'text-amber-500' : 'text-[#26496b]/60 dark:text-blue-500'}`}>
                        {nextTask.isAhaMoment ? '✨ Aha Anı — Sıradaki Adımın' : 'Sıradaki Adımın'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1">{nextTask.label}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{nextTask.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-5 flex-wrap">
                  <LinkWrapper isExt={nextTask.external ?? nextTask.href.startsWith('http')} href={nextTask.href}>
                    <span className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                      nextTask.isAhaMoment ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#26496b] hover:bg-[#1e3a56]'
                    }`}>
                      {nextTask.cta}
                    </span>
                  </LinkWrapper>
                  <button
                    onClick={() => handleDone(nextTask)}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors border border-gray-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800"
                  >
                    Yaptım ✓
                  </button>
                </div>
              </div>
            )}

            {/* All tasks grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  done={doneTasks.has(task.id)}
                  onDone={handleDone}
                  isNext={nextTask?.id === task.id}
                />
              ))}
            </div>

            <p className="mt-5 text-xs text-gray-400 dark:text-slate-500 text-center">
              Bunlar öneri. İstediğin alana dilediğin zaman girebilirsin.{' '}
              <button onClick={() => setMode('free')} className="text-[#26496b] dark:text-[#66aca9] hover:underline font-medium">
                Özgür keşif →
              </button>
            </p>
          </div>
        )}

        {/* ─── Free Mode ─── */}
        {mode === 'free' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {FREE_CATEGORIES.map((cat) => {
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
        <Toast
          msg={toast.msg}
          isAha={toast.isAha}
          onDone={() => setToast(null)}
        />
      )}

      {/* Confetti */}
      {showConfetti && (
        <ConfettiBurst onDone={() => setShowConfetti(false)} />
      )}

      {/* CSS for animations */}
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
