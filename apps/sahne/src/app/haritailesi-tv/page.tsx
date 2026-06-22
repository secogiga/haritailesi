import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { TVCtaButtons } from '@/components/TVCtaButtons';

export const metadata: Metadata = {
  title: 'Haritailesi TV',
  description: '5 özgün program serisi ile mesleğin yeni sesiyiz.',
};

const PROGRAMS = [
  {
    name: 'Meslekte Yeni İdoller',
    desc: 'Bir öğrenci, bir yeni mezun, bir örnek insan arar ve bir meslektaşını idol alır.',
    count: '1 video',
    thumb: '/meslekte-yeni-idoller.jpg',
    bg: 'linear-gradient(140deg, #431407 0%, #7c2d12 45%, #c2410c 80%, #ea580c 100%)',
    glow: 'rgba(251,191,36,0.5)',
    glowPos: 'top-right',
    pattern: 'radial',
    tagline: '',
    taglineColor: '#fcd34d',
    icon: '⭐',
    iconBg: '#fff7ed',
    iconBorder: '#fed7aa',
    countColor: '#f59e0b',
    arrowBorder: '#fed7aa',
    ytUrl: 'https://youtu.be/_c80uftW368',
  },
  {
    name: 'Bir Derdim(iz) Var',
    desc: 'Sorunları dinliyor, tespit ediyor ve birlikte çözüm yolları üretiyoruz.',
    count: '2 video',
    thumb: '/yardim-eli.jpg',
    bg: 'linear-gradient(140deg, #0f0a2e 0%, #1e1060 45%, #4c1d95 80%, #6d28d9 100%)',
    glow: 'rgba(167,139,250,0.45)',
    glowPos: 'center',
    pattern: 'grid',
    tagline: '',
    taglineColor: '#fca5a5',
    icon: '💬',
    iconSvg: (
      <svg width="38" height="38" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="17" cy="15" rx="14" ry="12" fill="#dc2626"/>
        <path d="M10 25 C9 28 7 31 5 33 C9 32 14 30 16 27" fill="#dc2626"/>
      </svg>
    ),
    iconBg: '#fff1f2',
    iconBorder: '#fecdd3',
    countColor: '#dc2626',
    arrowBorder: '#fecdd3',
    ytUrl: 'https://youtu.be/wpRJBcKyOvA',
  },
  {
    name: 'Mesleğimizin Filizleri',
    desc: "Meslek liselerinin harita tapu kadastro alanlarını destekliyor ve Türkiye'ye tanıtıyoruz.",
    count: '1 video',
    thumb: '/lise-ogrencisi.jpg',
    imgPos: 'center calc(50% + 30px)',
    bg: 'linear-gradient(160deg, #082f49 0%, #0c4a6e 30%, #064e3b 65%, #14532d 100%)',
    glow: 'rgba(74,222,128,0.4)',
    glowPos: 'bottom-left',
    pattern: 'topo',
    tagline: '',
    taglineColor: '#86efac',
    icon: '🌱',
    iconImg: '/filiz.png',
    iconBg: '#f0fdf4',
    iconBorder: '#bbf7d0',
    countColor: '#16a34a',
    arrowBorder: '#bbf7d0',
    ytUrl: 'https://youtu.be/gcVcwsaw_Do',
  },
  {
    name: 'Biz Daha Yetenekliyiz :)',
    desc: 'Yeteneklerimizi paylaşıyor, birbirimizden ilham alıyoruz.',
    count: '2 video',
    thumb: '/yetenek.jpg',
    bg: 'linear-gradient(140deg, #09090f 0%, #1a0533 50%, #3b0764 100%)',
    glow: 'rgba(249,168,212,0.5)',
    glowPos: 'top-center',
    pattern: 'lines',
    tagline: '',
    taglineColor: '#f9a8d4',
    icon: '🎵',
    iconBg: '#fdf2f8',
    iconBorder: '#f9a8d4',
    countColor: '#db2777',
    arrowBorder: '#f9a8d4',
    ytUrl: 'https://youtu.be/82Wgj-m0sNE',
  },
  {
    name: 'Mesleğin Yeni Evi: Haritailesi',
    desc: "Haritailesi Vakfı'mızın amacını, vizyonunu, misyonunu ve projelerini anlatıyoruz.",
    count: '1 video',
    thumb: '/ev.png',
    bg: 'linear-gradient(140deg, #0a1628 0%, #0f2d54 45%, #1e4d8c 80%, #1d4ed8 100%)',
    glow: 'rgba(147,197,253,0.45)',
    glowPos: 'top-right',
    pattern: 'dots',
    tagline: '',
    taglineColor: '#bfdbfe',
    icon: '🏠',
    iconImg: '/haritailesi-logo.svg',
    iconBg: '#fff',
    iconBorder: '#bfdbfe',
    countColor: '#2563eb',
    arrowBorder: '#bfdbfe',
    ytUrl: 'https://youtu.be/EwKvUGP-zzk',
  },
];

const VIDEOS = [
  {
    title: 'Meslekte Yeni İdoller "Mete Ercan Pakdil"',
    thumb: 'https://img.youtube.com/vi/_c80uftW368/maxresdefault.jpg',
    duration: '6:17',
    views: '24 B görüntüleme',
    time: '1 yıl önce',
    badge: '⭐ Yeni İdoller',
    badgeBg: 'rgba(245,158,11,0.9)',
    badgeColor: '#0b1829',
    ytUrl: 'https://youtu.be/_c80uftW368',
  },
  {
    title: 'Meslekte Neredeyiz ve Nereye Gitmeliyiz?',
    thumb: 'https://img.youtube.com/vi/wpRJBcKyOvA/maxresdefault.jpg',
    duration: '24:14',
    views: '33 B görüntüleme',
    time: '2 yıl önce',
    badge: '🎙️ Bir Derdimiz Var',
    badgeBg: 'rgba(74,144,217,0.9)',
    badgeColor: '#fff',
    ytUrl: 'https://youtu.be/wpRJBcKyOvA',
  },
  {
    title: 'Mesleğimizin Filizleri "Meslek Liseleri Harita Tapu Kadastro"',
    thumb: 'https://img.youtube.com/vi/gcVcwsaw_Do/maxresdefault.jpg',
    duration: '12:16',
    views: '15 B görüntüleme',
    time: '2 yıl önce',
    badge: '🌱 Filizler',
    badgeBg: 'rgba(16,185,129,0.9)',
    badgeColor: '#fff',
    ytUrl: 'https://youtu.be/gcVcwsaw_Do',
  },
  {
    title: 'Gökhan Demir "Yolcu"',
    thumb: 'https://img.youtube.com/vi/82Wgj-m0sNE/maxresdefault.jpg',
    duration: '5:45',
    views: '24 B görüntüleme',
    time: '2 yıl önce',
    badge: '🎵 Biz Daha Yetenekliyiz',
    badgeBg: 'rgba(236,72,153,0.85)',
    badgeColor: '#fff',
    ytUrl: 'https://youtu.be/82Wgj-m0sNE',
  },
  {
    title: 'Alper Girgin "Adab-ı Muaşeret"',
    thumb: 'https://img.youtube.com/vi/EwKvUGP-zzk/maxresdefault.jpg',
    duration: '20:39',
    views: '17 B görüntüleme',
    time: '2 yıl önce',
    badge: '🏠 Yeni Ev',
    badgeBg: 'rgba(59,130,246,0.9)',
    badgeColor: '#fff',
    ytUrl: 'https://youtu.be/EwKvUGP-zzk',
  },
];

const PILLARS = [
  { icon: '⭐', name: 'İlham Veriyoruz', desc: 'Başarı hikâyeleriyle yeni nesillere ilham oluyoruz.' },
  { icon: '🎙️', name: 'Dinliyoruz', desc: 'Sorunları dinliyor, çözümler üretmek için yola çıkıyoruz.' },
  { icon: '🌱', name: 'Destekliyoruz', desc: 'Eğitimden projelere, gençlerden meslek liselerine destek oluyoruz.' },
  { icon: '👥', name: 'Birlikte Büyüyoruz', desc: 'Dayanışma ve paylaşım kültürüyle mesleğimizi geleceğe taşıyoruz.' },
];

const STATS = [
  { val: '7+', lbl: 'Video' },
  { val: '5', lbl: 'Program' },
  { val: '3,01 B', lbl: 'Abone' },
  { val: '150 B+', lbl: 'İzlenme' },
];

export default function HaritailesiTVPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">

        {/* ── HERO ── */}
        <div style={{ background: '#0b1829', position: 'relative', overflow: 'hidden', paddingTop: 52 }}>
          <div className="absolute inset-0 left-[38%]"
            style={{ backgroundImage: "url('/haritailesi-tv.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, #0b1829 0%, #0b1829 4%, rgba(11,24,41,0.65) 35%, rgba(11,24,41,0.0) 100%)' }} />
          </div>
          <div className="max-w-[1200px] mx-auto px-6">
            <div style={{ position: 'relative', paddingBottom: 52 }}>

              {/* Sol */}
              <div>
                <div className="flex items-center gap-1.5 mb-5 text-xs">
                  <Link href="/" className="text-white/35 hover:text-white/60 transition-colors">Ana Sayfa</Link>
                  <span className="text-white/20">›</span>
                  <span className="text-white/50">Haritailesi TV</span>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 12px', marginBottom: 20 }}>
                  <div className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Haritailesi Medya</span>
                </div>

                <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: '#fff', marginBottom: 14 }}>
                  Haritailesi <span style={{ color: '#f59e0b' }}>TV</span>
                </h1>

                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: 420, marginBottom: 28 }}>
                  Mesleğin hikâyelerini, insanlarını ve geleceğini anlatıyoruz.<br />
                  5 özgün program serisi ile mesleğin yeni sesiyiz.
                </p>

                <div style={{ display: 'inline-flex', marginBottom: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                  {STATS.map((s, i) => (
                    <div key={s.lbl} style={{ padding: '14px 22px', borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.38)', marginTop: 3, fontWeight: 500 }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <a href="https://youtu.be/_c80uftW368" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] font-bold text-[#0b1829] px-[22px] py-3 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] hover:-translate-y-px transition-all duration-150">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
                    Son Bölümü İzle
                  </a>
                  <a href="https://www.youtube.com/@haritailesi" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] font-bold text-white px-[22px] py-3 rounded-xl hover:bg-white/[0.07] hover:-translate-y-px transition-all duration-150"
                    style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    Haritailesi TV&apos;ye Git
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── PROGRAMS ── */}
        <div className="bg-white">
          <div className="max-w-[1200px] mx-auto px-6" style={{ paddingTop: 52, paddingBottom: 42 }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: 8 }}>Orijinal Programlarımız</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0b1829', letterSpacing: -0.5, marginBottom: 8 }}>5 Program Serisi</h2>
              <p style={{ fontSize: 13.5, color: '#6b7280', maxWidth: 540, margin: '0 auto' }}>Haritailesi TV&apos;de mesleğimizin farklı yönlerini 5 özgün program serimizle ele alıyoruz.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
              {PROGRAMS.map((prog) => (
                <a key={prog.name} href={prog.ytUrl} target="_blank" rel="noopener noreferrer"
                  className="group flex flex-col bg-white rounded-[20px] border border-gray-100 overflow-hidden cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-200">
                  {/* Görsel alanı */}
                  <div style={{ position: 'relative', height: 180, overflow: 'hidden', borderRadius: '20px 20px 0 0', background: prog.bg }}>
                    {(prog as { thumb?: string }).thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(prog as { thumb: string }).thumb} alt={prog.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: (prog as { imgPos?: string }).imgPos ?? 'center' }} />
                    )}
                    {!(prog as { thumb?: string }).thumb && (
                      <>
                        {/* Ambient glow */}
                        <div style={{
                          position: 'absolute',
                          top: prog.glowPos === 'bottom-left' ? 'auto' : -30,
                          bottom: prog.glowPos === 'bottom-left' ? -20 : 'auto',
                          left: prog.glowPos === 'bottom-left' ? -20 : prog.glowPos === 'top-center' ? '50%' : 'auto',
                          right: prog.glowPos === 'center' ? '50%' : prog.glowPos === 'bottom-left' || prog.glowPos === 'top-center' ? 'auto' : -20,
                          transform: prog.glowPos === 'top-center' ? 'translateX(-50%)' : prog.glowPos === 'center' ? 'translateX(50%)' : 'none',
                          width: 160, height: 160, borderRadius: '50%',
                          background: `radial-gradient(circle, ${prog.glow} 0%, transparent 70%)`,
                        }} />
                        {prog.pattern === 'grid' && (
                          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,1) 0px,transparent 1px,transparent 22px,rgba(255,255,255,1) 23px),repeating-linear-gradient(90deg,rgba(255,255,255,1) 0px,transparent 1px,transparent 22px,rgba(255,255,255,1) 23px)' }} />
                        )}
                        {prog.pattern === 'lines' && (
                          <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,1) 0px,transparent 1px,transparent 16px,rgba(255,255,255,1) 17px)' }} />
                        )}
                        {prog.pattern === 'dots' && (
                          <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                        )}
                        {prog.pattern === 'topo' && (
                          <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-radial-gradient(circle at 40% 60%, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 18px, rgba(255,255,255,0.9) 19px, rgba(255,255,255,0) 20px)' }} />
                        )}
                        <div style={{ position: 'absolute', right: 14, bottom: 14, fontSize: 72, opacity: 0.09, lineHeight: 1 }}>{prog.icon}</div>
                      </>
                    )}
                    {/* Alt fade */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: 'linear-gradient(to bottom,transparent,rgba(0,0,0,0.28))' }} />
                    {/* Tagline */}
                    <div style={{ position: 'absolute', top: 16, left: 16, right: 16, fontStyle: 'italic', fontSize: 14, color: prog.taglineColor, fontWeight: 500, lineHeight: 1.35, fontFamily: 'Georgia, serif' }}>{prog.tagline}</div>
                  </div>
                  {/* Floating ikon */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: -28, position: 'relative', zIndex: 10 }}>
                    <div style={{
                      width: 80, height: 80,
                      borderRadius: '50%', background: prog.iconBg, border: `1.5px solid ${prog.iconBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, boxShadow: '0 4px 14px rgba(0,0,0,0.08)', overflow: 'hidden',
                    }}>
                      {(prog as { iconImg?: string }).iconImg
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={(prog as { iconImg: string }).iconImg} alt={prog.name} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                        : (prog as { iconSvg?: React.ReactNode }).iconSvg ?? prog.icon}
                    </div>
                  </div>
                  {/* Kart içeriği */}
                  <div style={{ padding: '12px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0b1829', lineHeight: 1.3, textAlign: 'center', maxWidth: 105, margin: '0 auto' }}>{prog.name}</div>
                    <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, textAlign: 'center', flex: 1 }}>{prog.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: prog.countColor }}>
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
                        {prog.count}
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${prog.arrowBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: prog.countColor, fontSize: 14, fontWeight: 700 }}>→</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Topluluk CTA */}
            <div style={{ marginTop: 38 }}>
              <div style={{ background: 'linear-gradient(135deg,#0b1829 0%,#1a3350 100%)', borderRadius: 24, padding: '36px 40px', display: 'flex', alignItems: 'center', gap: 48 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: 10 }}>Haritailesi Topluluğu</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.25, letterSpacing: -0.3, marginBottom: 10 }}>Mesleğin sesini duyur,<br />paylaş ve ilham ver.</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>Hikayeni paylaş, yeteneğini göster, deneyimli bir meslektaşla buluş.</div>
                </div>
                <TVCtaButtons />
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: '#e8e9ec', maxWidth: 1200, margin: '0 auto' }} />

        {/* ── HAKKINDA ── */}
        <div className="bg-white">
          <div className="max-w-[1200px] mx-auto px-6 py-[52px]">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Haritailesi TV Hakkında
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0b1829', marginBottom: 12, lineHeight: 1.3, letterSpacing: -0.3 }}>
                  Haritailesi TV,<br />Haritailesi Vakfı&apos;nın<br />resmi medya platformudur.
                </h3>
                <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.75 }}>
                  Mesleğimize değer katmak için üretiyor, paylaşıyor ve topluluğumuzu büyütüyoruz.<br />Her video bir hikâye, her hikâye bir mesleğin sesi.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {PILLARS.map((p) => (
                  <div key={p.name} style={{ background: '#fff', border: '1px solid #e8e9ec', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{p.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0b1829', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.55 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SON YÜKLENEN VİDEOLAR ── */}
        <div style={{ background: '#f5f6f8' }}>
          <div className="max-w-[1200px] mx-auto px-6 py-[52px]">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0b1829', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                Son Yüklenen Videolar
              </div>
              <a href="https://www.youtube.com/@haritailesi" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Tüm Videolar →</a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
              {VIDEOS.map((vid) => (
                <a key={vid.title} href={vid.ytUrl} target="_blank" rel="noopener noreferrer"
                  className="group bg-white rounded-[16px] overflow-hidden border border-gray-100 cursor-pointer hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)] hover:-translate-y-[2px] transition-all duration-200">
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a3350', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={vid.thumb} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" fill="#0b1829" viewBox="0 0 24 24" style={{ marginLeft: 2 }}><polygon points="5,3 19,12 5,21" /></svg>
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700, color: '#fff' }}>{vid.duration}</div>
                    <div style={{ position: 'absolute', top: 8, left: 8, background: vid.badgeBg, color: vid.badgeColor, borderRadius: 5, padding: '3px 8px', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>{vid.badge}</div>
                  </div>
                  <div style={{ padding: '12px 14px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1829', lineHeight: 1.4, marginBottom: 6 }}>{vid.title}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{vid.views} · {vid.time}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── YT FOOTER ── */}
        <div style={{ background: '#f5f6f8' }}>
          <div className="max-w-[1200px] mx-auto px-6 pb-[52px]">
            <div style={{ background: 'linear-gradient(135deg,#0b1829 0%,#1a3350 100%)', borderRadius: 24, padding: '36px 40px', display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ width: 68, height: 68, borderRadius: 18, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>📺</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Haritailesi TV&apos;ye destek olun!</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Daha fazla hikâye, daha fazla insan, daha güçlü bir meslek için siz de bu yolculuğun bir parçası olun.</div>
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0b1829', padding: '14px 28px', border: 'none', borderRadius: 999, cursor: 'pointer', background: '#f59e0b', whiteSpace: 'nowrap' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                Destek Ol
              </button>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
