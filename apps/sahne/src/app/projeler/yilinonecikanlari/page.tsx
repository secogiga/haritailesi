import type { Metadata } from 'next';
import type React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { cms, type CmsProject } from '@/lib/api';
import { MonthlyWinners } from './_featured-client';

export const metadata: Metadata = {
  title: 'Yılın Öne Çıkan Projeleri — Haritailesi',
  description: 'Haritailesi editör ekibinin seçtiği yılın en etkileyici projeleri.',
};

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const year = new Date().getFullYear();

function mediaUrl(key: string) {
  return `${API_URL}/api/v1/media?key=${encodeURIComponent(key)}`;
}
function coverOf(p: CmsProject): string | null {
  if (p.coverImageKey) return p.coverImageKey.startsWith('covers/') ? mediaUrl(p.coverImageKey) : `/projects/${p.coverImageKey}`;
  if (p.imageKeys?.[0]) return mediaUrl(p.imageKeys[0]);
  return null;
}
function shortTitle(p: CmsProject) {
  return p.title.includes(' — ') ? p.title.split(' — ').slice(1).join(' — ') : p.title;
}

const CATEGORY_ICONS: Record<string, string> = {
  GIS: '🗺️', Fotogrametri: '📷', Madencilik: '⛏️', 'Yapay Zeka': '🤖',
  İnşaat: '🏗️', Haritacılık: '🧭', Ulaşım: '🛣️', Tarım: '🌾',
};

export default async function OneCikanlarPage() {
  const [sahne, linkedin] = await Promise.all([
    cms.projects({ type: 'sahne' }).then((r) => r ?? []),
    cms.projects({ type: 'linkedin' }).then((r) => r ?? []),
  ]);
  const projects = [...sahne, ...linkedin];

  const topProject = [...projects].sort((a, b) => {
    if (a.editorialScore && b.editorialScore) return b.editorialScore - a.editorialScore;
    if (a.editorialScore) return -1;
    if (b.editorialScore) return 1;
    return b.viewCount - a.viewCount;
  })[0] ?? null;

  const topCover = topProject ? coverOf(topProject) : null;

  // LinkedIn görüntülenmeyi baz al (ödül sistemi için), yoksa Sahne viewCount ile tamamla
  const scoreOf = (p: CmsProject) => (p.linkedinViewCount ?? 0) + p.viewCount;
  const top5 = [...projects].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 5);

  const totalSahneViews = projects.reduce((s, p) => s + p.viewCount, 0);
  const totalLinkedinViews = projects.reduce((s, p) => s + (p.linkedinViewCount ?? 0), 0);
  const editorialCount = projects.filter((p) => p.editorialScore).length;

  // Kategori kazananları: toplam görüntülenmeye göre
  const categoryMap = new Map<string, CmsProject>();
  for (const p of projects) {
    const cat = p.projectType?.[0];
    if (!cat) continue;
    const existing = categoryMap.get(cat);
    if (!existing || scoreOf(p) > scoreOf(existing)) categoryMap.set(cat, p);
  }
  const categories = Array.from(categoryMap.entries()).slice(0, 5);

  // Wall of Fame: cover'ı olan tüm projeler
  const wallProjects = projects.filter((p) => coverOf(p)).slice(0, 21);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070c1a]">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="bg-[#0c1824] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/30 via-transparent to-[#66aca9]/15 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
            <Link href="/projeler" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-[#66aca9] transition-colors mb-8">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tüm Projeler
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Sol */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  {/*
                    Defne çelengi — Wikimedia Commons, CC0 public domain
                    Kaynak: "Greek Roman Laurel wreath vector.svg"
                    Sol yarım (x: 0–282, y: 160–680) — çelengin sol dalı
                  */}
                  <svg viewBox="-20 155 320 535" className="w-10 h-16 text-white/80 shrink-0" fill="currentColor">
                    <path d="M281.9,623.5c0,0-1.7-53.5-35.7-72.2C246.3,551.3,211.4,587,281.9,623.5z"/>
                    <path d="M281.9,623.5c0,0-4.2,69.6-74.7,55.2C207.2,678.7,203.8,650.7,281.9,623.5z"/>
                    <path d="M216.5,616.7c0,0,14.4-48.4-10.2-82.4C207.2,534.3,167.3,570.8,216.5,616.7z"/>
                    <path d="M216.5,616.7c0,0-7.6,55.2-84.9,35.7C131.6,652.3,120.6,615,216.5,616.7z"/>
                    <path d="M162.2,587.8c0,0-37.4,57.7-89.2,6.8C73,594.6,93.4,564.9,162.2,587.8z"/>
                    <path d="M162.2,587.8c0,0,29.7-14.4,11.9-80.7C174.1,507.1,122.3,534.3,162.2,587.8z"/>
                    <path d="M118,542c0,0,18.7-1.7,27.2-23.8c4.2-10.2,5.1-26.3,5.1-45.9c0,0-23.8,0.8-34.8,21.2C109.5,504.6,102.8,519.9,118,542z"/>
                    <path d="M118,542c0,0-4.2,17.8-23.8,20.4c-11.9,1.7-34,0.8-49.3-10.2C26.3,537.7,25.5,525,25.5,525s22.9-8.5,47.6,0C84.9,529.2,99.4,535.2,118,542z"/>
                    <path d="M84.1,491c0,0-51.8-55.2-84.1-43.3C0,447.7,15.3,523.3,84.1,491z"/>
                    <path d="M84.1,491c0,0,39.1-6.8,49.3-60.3C134.2,431.6,76.4,434.1,84.1,491z"/>
                    <path d="M65.4,435.8c0,0-18.7-62-62.8-68.8C2.5,367-14.4,431.6,65.4,435.8z"/>
                    <path d="M65.4,435.8c0,0,56-7.6,66.2-47.6C131.6,388.3,81.5,375.5,65.4,435.8z"/>
                    <path d="M58.6,371.3c0,0,19.5-49.3-38.2-79.8C20.4,291.4-0.8,351.7,58.6,371.3z"/>
                    <path d="M58.6,371.3c0,0,73,17,87.5-28.9C146.1,342.4,104.4,315.2,58.6,371.3z"/>
                    <path d="M83.2,312.7c0,0,21.2-57.7-17.8-93.4C65.4,219.3,21.2,282.1,83.2,312.7z"/>
                    <path d="M83.2,312.7c0,0,41.6-45,86.6-3.4C169.8,309.3,128.2,335.6,83.2,312.7z"/>
                    <path d="M118,260.9c0,0,39.1-42.5,5.1-100.2C123.1,160.7,69.6,229.5,118,260.9z"/>
                    <path d="M118,263.1c0,0,32.9-38.9,81.7,10C199.9,273.1,155,298.9,118,263.1z"/>
                    <path d="M161.3,227.8c0,0-1.7-56,75.6-59.4C236.9,168.3,237.8,226.9,161.3,227.8z"/>
                  </svg>
                  <span className="text-2xl font-black text-[#66aca9] tabular-nums">{year}</span>
                  {/* Sağ dal — aynalama */}
                  <svg viewBox="-20 155 320 535" className="w-10 h-16 text-white/80 shrink-0" fill="currentColor" style={{transform:'scaleX(-1)'}}>
                    <path d="M281.9,623.5c0,0-1.7-53.5-35.7-72.2C246.3,551.3,211.4,587,281.9,623.5z"/>
                    <path d="M281.9,623.5c0,0-4.2,69.6-74.7,55.2C207.2,678.7,203.8,650.7,281.9,623.5z"/>
                    <path d="M216.5,616.7c0,0,14.4-48.4-10.2-82.4C207.2,534.3,167.3,570.8,216.5,616.7z"/>
                    <path d="M216.5,616.7c0,0-7.6,55.2-84.9,35.7C131.6,652.3,120.6,615,216.5,616.7z"/>
                    <path d="M162.2,587.8c0,0-37.4,57.7-89.2,6.8C73,594.6,93.4,564.9,162.2,587.8z"/>
                    <path d="M162.2,587.8c0,0,29.7-14.4,11.9-80.7C174.1,507.1,122.3,534.3,162.2,587.8z"/>
                    <path d="M118,542c0,0,18.7-1.7,27.2-23.8c4.2-10.2,5.1-26.3,5.1-45.9c0,0-23.8,0.8-34.8,21.2C109.5,504.6,102.8,519.9,118,542z"/>
                    <path d="M118,542c0,0-4.2,17.8-23.8,20.4c-11.9,1.7-34,0.8-49.3-10.2C26.3,537.7,25.5,525,25.5,525s22.9-8.5,47.6,0C84.9,529.2,99.4,535.2,118,542z"/>
                    <path d="M84.1,491c0,0-51.8-55.2-84.1-43.3C0,447.7,15.3,523.3,84.1,491z"/>
                    <path d="M84.1,491c0,0,39.1-6.8,49.3-60.3C134.2,431.6,76.4,434.1,84.1,491z"/>
                    <path d="M65.4,435.8c0,0-18.7-62-62.8-68.8C2.5,367-14.4,431.6,65.4,435.8z"/>
                    <path d="M65.4,435.8c0,0,56-7.6,66.2-47.6C131.6,388.3,81.5,375.5,65.4,435.8z"/>
                    <path d="M58.6,371.3c0,0,19.5-49.3-38.2-79.8C20.4,291.4-0.8,351.7,58.6,371.3z"/>
                    <path d="M58.6,371.3c0,0,73,17,87.5-28.9C146.1,342.4,104.4,315.2,58.6,371.3z"/>
                    <path d="M83.2,312.7c0,0,21.2-57.7-17.8-93.4C65.4,219.3,21.2,282.1,83.2,312.7z"/>
                    <path d="M83.2,312.7c0,0,41.6-45,86.6-3.4C169.8,309.3,128.2,335.6,83.2,312.7z"/>
                    <path d="M118,260.9c0,0,39.1-42.5,5.1-100.2C123.1,160.7,69.6,229.5,118,260.9z"/>
                    <path d="M118,263.1c0,0,32.9-38.9,81.7,10C199.9,273.1,155,298.9,118,263.1z"/>
                    <path d="M161.3,227.8c0,0-1.7-56,75.6-59.4C236.9,168.3,237.8,226.9,161.3,227.8z"/>
                  </svg>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.05] tracking-tight mb-4">
                  Yılın Öne Çıkan<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66aca9] to-[#4d9996]">Projeleri.</span>
                </h1>
                <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
                  Haritailesi editör ekibinin her ay seçtiği en etkileyici projeler arasından yılın en iyileri.
                </p>

                {/* İstatistik kutular */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    {
                      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
                      value: editorialCount || projects.length, label: 'Seçilen Proje',
                    },
                    {
                      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                      value: projects.length, label: 'Aday Proje',
                    },
                    {
                      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                      value: totalSahneViews.toLocaleString('tr-TR'), label: 'Sahne Görüntülenme',
                    },
                    {
                      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
                      value: totalLinkedinViews.toLocaleString('tr-TR'), label: 'LinkedIn Görüntülenme',
                    },
                  ] as { icon: React.ReactNode; value: string | number; label: string }[]).map(({ icon, value, label }) => (
                    <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className="flex justify-center mb-1.5 text-[#66aca9]">{icon}</div>
                      <p className="text-lg font-black text-white tabular-nums">{value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sağ — Yılın Projesi */}
              {topProject && (
                <div className="relative bg-gradient-to-br from-[#1a2f48] to-[#0f1e2e] rounded-2xl border border-[#66aca9]/20 overflow-hidden shadow-2xl">
                  {/* Kapak arka plan */}
                  {topCover && (
                    <div className="absolute inset-0 opacity-20">
                      <img src={topCover} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1e2e] via-[#0f1e2e]/60 to-transparent" />
                    </div>
                  )}
                  <div className="relative p-6">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full mb-4">
                      <span>🏆</span> Yılın Projesi
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight mb-3">{shortTitle(topProject)}</h2>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: topProject.authorAvatarColor ?? '#26496b' }}>
                        {topProject.authorInitials ?? topProject.authorName?.slice(0, 2).toUpperCase() ?? '?'}
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{topProject.authorName}</p>
                    </div>
                    {topProject.editorialNote && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#66aca9] mb-1.5">Neden Seçildi?</p>
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">{topProject.editorialNote}</p>
                      </div>
                    )}
                    <Link href={`/projeler/${topProject.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl bg-amber-400 text-[#0c1824] hover:bg-amber-300 transition-colors">
                      Projeyi İncele →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Aylık Kazananlar (client) ─────────────────────────────────────── */}
        <MonthlyWinners projects={projects} />

        {/* ── En Çok Etkileşim ─────────────────────────────────────────────── */}
        <section className="bg-[#0c1824] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-10">
              <svg className="w-5 h-5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h2 className="text-xl font-black text-white">
                Yılın En Çok <span className="underline decoration-[#66aca9] decoration-2 underline-offset-4">Etkileşim</span> Alan Projeleri
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {top5.map((p, i) => {
                const cover = coverOf(p);
                return (
                  <Link key={p.id} href={`/projeler/${p.slug}`}
                    className="group relative flex flex-col bg-[#1a2f48]/60 border border-white/8 rounded-2xl overflow-hidden hover:border-[#66aca9]/30 hover:bg-[#1a2f48] transition-all duration-200">
                    {/* Büyük sıra numarası */}
                    <span className="absolute top-2 right-3 text-6xl font-black text-white/10 leading-none select-none">{i + 1}</span>
                    {/* Kapak */}
                    <div className="h-28 overflow-hidden bg-slate-800 shrink-0">
                      {cover
                        ? <img src={cover} alt={shortTitle(p)} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 opacity-80" />
                        : <div className={`h-full bg-gradient-to-br ${p.accentGradient ?? 'from-[#26496b] to-[#66aca9]'} opacity-20`} />
                      }
                    </div>
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[8px] font-bold shrink-0"
                          style={{ backgroundColor: p.authorAvatarColor ?? '#26496b' }}>
                          {p.authorInitials ?? p.authorName?.slice(0, 2).toUpperCase() ?? '?'}
                        </div>
                        <p className="text-[9px] text-slate-400 truncate">{p.authorName}</p>
                      </div>
                      <p className="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-[#66aca9] transition-colors">
                        {shortTitle(p)}
                      </p>
                      <div className="flex flex-col gap-1 mt-auto text-[9px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {p.viewCount.toLocaleString('tr-TR')} Sahne
                        </span>
                        <span className="flex items-center gap-1 text-[#0a66c2]/70">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          {(p.linkedinViewCount ?? 0).toLocaleString('tr-TR')} LinkedIn
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex justify-center mt-8">
              <Link href="/projeler?sort=popular"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#66aca9] border border-[#66aca9]/30 px-5 py-2.5 rounded-full hover:bg-[#66aca9]/5 transition-colors">
                İlk 10 Projeyi Görüntüle →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Kategori Kazananları ──────────────────────────────────────────── */}
        {categories.length > 0 && (
          <section className="bg-white dark:bg-[#0a1422] py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-8">
                <svg className="w-5 h-5 text-[#26496b] dark:text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h2 className="text-xl font-black text-gray-900 dark:text-slate-100">Kategori Kazananları</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 5 kategori kartı — 2 satır: 3+2 */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {categories.map(([cat, p]) => {
                    const cover = coverOf(p);
                    const icon = CATEGORY_ICONS[cat] ?? '📁';
                    return (
                      <Link key={cat} href={`/projeler/${p.slug}`}
                        className="group relative bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                        <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
                          <span className="text-lg">{icon}</span>
                          <div>
                            <p className="text-[10px] font-black text-gray-500 dark:text-slate-400">{cat}</p>
                            <p className="text-[9px] text-[#66aca9] font-bold uppercase tracking-wide">En İyi Proje</p>
                          </div>
                        </div>
                        <div className="h-24 overflow-hidden bg-gray-100 dark:bg-slate-700">
                          {cover
                            ? <img src={cover} alt={shortTitle(p)} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300" />
                            : <div className={`h-full bg-gradient-to-br ${p.accentGradient ?? 'from-[#26496b] to-[#66aca9]'} opacity-30`} />
                          }
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[8px] font-bold shrink-0"
                              style={{ backgroundColor: p.authorAvatarColor ?? '#26496b' }}>
                              {p.authorInitials ?? p.authorName?.slice(0, 2).toUpperCase() ?? '?'}
                            </div>
                            <p className="text-[9px] text-gray-400 truncate">{p.authorName}</p>
                          </div>
                          <p className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-snug line-clamp-2 group-hover:text-[#26496b] dark:group-hover:text-[#66aca9] transition-colors">
                            {shortTitle(p)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Editör Yorumu */}
                {topProject?.editorialNote && (
                  <div className="bg-[#0f1e2e] rounded-2xl p-7 flex flex-col justify-between border border-white/8">
                    {/* Başlık */}
                    <div className="flex items-center gap-2.5 mb-5">
                      <svg className="w-7 h-7 text-[#66aca9] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <p className="text-sm font-black uppercase tracking-widest text-white">Editör Yorumu</p>
                    </div>

                    {/* Alıntı metni */}
                    <div className="border-l-2 border-[#66aca9]/40 pl-4 flex-1">
                      <p className="text-[13px] italic text-slate-200 leading-7 line-clamp-9">
                        {topProject.editorialNote}
                      </p>
                    </div>

                    {/* İmza + avatarlar */}
                    <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-400">— Haritailesi Editör Ekibi</p>
                      <div className="flex -space-x-2">
                        {[
                          { initials: 'AK', color: '#26496b' },
                          { initials: 'BY', color: '#238179' },
                          { initials: 'CŞ', color: '#1a3350' },
                          { initials: 'DE', color: '#2d5a8e' },
                        ].map(({ initials, color }) => (
                          <div key={initials}
                            className="w-8 h-8 rounded-full border-2 border-[#0f1e2e] flex items-center justify-center text-[9px] font-black text-white shrink-0"
                            style={{ backgroundColor: color }}>
                            {initials}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Wall of Fame ─────────────────────────────────────────────────── */}
        {wallProjects.length > 0 && (
          <section className="bg-[#0c1824] py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <svg className="w-5 h-5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <h2 className="text-xl font-black text-white">Wall of Fame</h2>
                  </div>
                  <p className="text-slate-400 text-xs ml-8">{year} yılı finalist projeleri</p>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
                {wallProjects.map((p) => {
                  const cover = coverOf(p)!;
                  return (
                    <Link key={p.id} href={`/projeler/${p.slug}`}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800">
                      <img src={cover} alt={shortTitle(p)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-70 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                        <p className="text-[9px] font-semibold text-white line-clamp-2 leading-tight">{shortTitle(p)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="flex justify-center mt-8">
                <Link href="/projeler"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#66aca9] border border-[#66aca9]/30 px-5 py-2.5 rounded-full hover:bg-[#66aca9]/5 transition-colors">
                  Tüm Finalistleri Görüntüle →
                </Link>
              </div>
            </div>
          </section>
        )}

      </main>
    </>
  );
}
