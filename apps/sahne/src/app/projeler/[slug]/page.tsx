import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { cms, type CmsProject } from '@/lib/api';
import { CommentBox, SidebarShare, KpiShare, ProjectInteractions, ShareButton } from './_project-actions';
import { KpiBar } from './_kpi-bar';
import { HeroCarousel } from './_hero-carousel';
import { GalleryLightbox } from './_gallery';
import { BodyFormatter } from './_body';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://sahne.haritailesi.org';

function mediaUrl(key: string) {
  return `${API_URL}/api/v1/media?key=${encodeURIComponent(key)}`;
}

function resolveKey(key: string): string {
  if (key.startsWith('covers/')) return mediaUrl(key);
  return `/projects/${key}`;
}
function coverOf(p: CmsProject): string | null {
  if (p.coverImageKey) return resolveKey(p.coverImageKey);
  if (p.imageKeys?.[0]) return resolveKey(p.imageKeys[0]);
  return null;
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await cms.project(slug);
  if (!project) return { title: 'Proje Bulunamadı' };
  const ogImage = coverOf(project) ?? undefined;
  return {
    title: project.title,
    description: project.summary ?? undefined,
    openGraph: {
      title: project.title, description: project.summary ?? undefined,
      url: `${SITE_URL}/projeler/${slug}`, type: 'article',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: project.title }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: project.title, description: project.summary ?? undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

const MATURITY_LABELS: Record<string, string> = {
  idea: 'Fikir', prototype: 'Prototip', testing: 'Test', active: 'Aktif', commercial: 'Ticari Ürün',
};

const GAINS_MAP: Record<string, string> = {
  time: 'Zaman kazandırıyor',
  cost: 'Maliyet düşürüyor',
  quality: 'Kaliteyi artırıyor',
  safety: 'Güvenliği artırıyor',
};

const FEATURE_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-500' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-500' },
  { bg: 'bg-teal-50 dark:bg-teal-900/20', icon: 'text-teal-500' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: 'text-cyan-600' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-500' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600' },
];

const FEATURE_ICONS = [
  <svg key="f0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  <svg key="f1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 0-4 4-4 9a4 4 0 008 0c0-5-4-9-4-9z" /><path d="M12 20v2M8 22h8" /></svg>,
  <svg key="f2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>,
  <svg key="f3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
  <svg key="f4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-3 3" /></svg>,
  <svg key="f5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>,
];

function OtherProjectCard({ project }: { project: CmsProject }) {
  return (
    <Link href={`/projeler/${project.slug}`}
      className="group flex items-center gap-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg px-1 transition-colors -mx-1">
      <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ backgroundColor: project.authorAvatarColor ?? '#26496b' }}>
        {project.authorInitials ?? project.authorName?.slice(0, 2).toUpperCase() ?? '?'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-snug line-clamp-1 group-hover:text-[#26496b] dark:group-hover:text-[#66aca9] transition-colors">
          {project.title}
        </p>
        {project.authorTag && (
          <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{project.authorTag}</p>
        )}
      </div>
      {project.viewCount > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 shrink-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {project.viewCount}
        </div>
      )}
    </Link>
  );
}

function RelatedCard({ project }: { project: CmsProject & { score: number } }) {
  const accent = project.accentGradient ?? 'from-[#26496b] to-[#66aca9]';
  const category = project.projectType?.[0] ?? project.hashtags?.[0] ?? null;
  const title = project.title.includes(' — ') ? project.title.split(' — ').slice(1).join(' — ') : project.title;
  return (
    <Link href={`/projeler/${project.slug}`}
      className="group shrink-0 w-[190px] relative flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md transition-all overflow-hidden gap-2">
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${accent}`} />
      {/* Sahip */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ backgroundColor: project.authorAvatarColor ?? '#26496b' }}>
          {project.authorInitials ?? project.authorName?.slice(0, 2).toUpperCase() ?? '?'}
        </div>
        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate font-medium">{project.authorName}</p>
      </div>
      {/* Proje adı */}
      <p className="text-[14px] font-bold text-gray-800 dark:text-slate-200 leading-snug line-clamp-2 group-hover:text-[#26496b] dark:group-hover:text-[#66aca9] transition-colors">
        {title}
      </p>
      {/* Kategori pill */}
      {category && (
        <span className="self-start text-[10px] font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-full px-2.5 py-0.5">
          {category}
        </span>
      )}
      {/* Alt: görüntülenme + beğeni */}
      <div className="flex items-center gap-3 mt-auto pt-1 text-[11px] text-gray-400 dark:text-slate-500">
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {project.viewCount}
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          0
        </div>
      </div>
    </Link>
  );
}

export default async function ProjeDetayPage({ params }: Props) {
  const { slug } = await params;

  const [project, allProjects] = await Promise.all([
    cms.project(slug),
    cms.projects({ type: 'sahne' }).then((r) => r ?? []),
  ]);

  if (!project || !project.isPublished) notFound();

  const accent = project.accentGradient ?? 'from-[#26496b] to-[#66aca9]';
  const coverSrc = coverOf(project);
  const galleryImages: string[] = project.imageKeys?.length ? project.imageKeys.map(resolveKey) : [];

  // Hero carousel: gallery images önce, cover sonra (gallery yoksa cover)
  const heroSlides: string[] = galleryImages.length > 0
    ? galleryImages
    : coverSrc ? [coverSrc] : [];

  // Benzer projeler (hashtag overlap)
  const related = allProjects
    .filter((p) => p.slug !== slug && p.isPublished)
    .map((p) => ({ ...p, score: (p.hashtags ?? []).filter((t) => project.hashtags?.includes(t)).length }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  // Üyenin diğer projeleri
  const otherByAuthor = allProjects
    .filter((p) => p.slug !== slug && p.isPublished && p.authorName === project.authorName)
    .slice(0, 4);

  const pageUrl = `${SITE_URL}/projeler/${slug}`;

  const hasBody = !!project.body;

  const techTags = (project.hashtags ?? []).filter(
    (t) => !['meslektaşınıtakdiret', 'haritakademi', 'meslekiuygulama'].includes(t),
  );

  const activeGains = Object.entries(project.gains ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => GAINS_MAP[k])
    .filter(Boolean);

  // İlk dış link
  const primaryLink = project.externalLinks?.[0];
  const msgHref = project.linkedinUrl ?? primaryLink?.href;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f0f4f8] dark:bg-[#070c1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6 items-start">

            {/* ── Sol: Hero + İçerik ──────────────────────────────────────── */}
            <div className="min-w-0 space-y-5">

              {/* ── HERO KARTI ─────────────────────────────────────────────── */}
              <div className="rounded-2xl overflow-hidden bg-[#0c1824] shadow-lg">

                {/* Accent bar */}
                <div className={`h-[3px] bg-gradient-to-r ${accent}`} />

                {/* İki kolon: sol içerik + sağ carousel */}
                <div className="grid grid-cols-1 lg:grid-cols-2">

                  {/* Sol: meta */}
                  <div className="p-7 flex flex-col gap-5">

                    {/* Back + Share */}
                    <div className="flex items-center justify-between">
                      <Link href="/projeler"
                        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors group">
                        <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Tüm Projeler
                      </Link>
                      <ShareButton url={pageUrl} />
                    </div>

                    {/* Yazar */}
                    {project.authorName && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-white/10"
                          style={{ backgroundColor: project.authorAvatarColor ?? '#26496b' }}>
                          {project.authorInitials ?? project.authorName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white/90">{project.authorName}</p>
                          {project.authorTag && (
                            <p className="text-[9px] font-bold text-[#66aca9] uppercase tracking-widest">{project.authorTag}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Başlık + badge */}
                    <div>
                      <div className="flex items-start gap-3 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl font-black text-white leading-[1.1] tracking-tight">
                          {project.title}
                        </h1>
                        {project.projectCategory && (
                          <span className="shrink-0 mt-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/25">
                            {project.projectCategory}
                          </span>
                        )}
                      </div>
                      {project.summary && (
                        <p className="mt-3 text-slate-400 text-[13px] leading-relaxed line-clamp-3">{project.summary}</p>
                      )}
                    </div>


                    {/* KPI bar */}
                    <KpiBar viewCount={project.viewCount} linkedinViewCount={project.linkedinViewCount ?? 0} />

                    {/* CTA butonlar */}
                    {primaryLink && (
                      <div className="flex flex-wrap gap-2.5 mt-auto">
                        <a href={primaryLink.href} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/15 text-white/70 hover:border-white/30 hover:text-white transition-all">
                          {primaryLink.label}
                          <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Sağ: carousel */}
                  <HeroCarousel
                    slides={heroSlides}
                    title={project.title}
                    linkedinPostUrl={project.linkedinUrl}
                    linkedinViewCount={project.linkedinViewCount ?? undefined}
                    linkedinLikeCount={project.linkedinLikeCount ?? undefined}
                    linkedinCommentCount={project.linkedinCommentCount ?? undefined}
                    awardCohortMonth={project.awardCohortMonth}
                    awardRank={project.awardRank}
                    editorialScore={project.editorialScore}
                  />
                </div>
              </div>

              {/* ── Problem / Çözüm ─────────────────────────────────────────── */}
              {(project.problem || project.solution) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.problem && (
                    <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-white dark:bg-slate-900 p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-red-500">Problem</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{project.problem}</p>
                    </div>
                  )}
                  {project.solution && (
                    <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-slate-900 p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-500">Çözüm</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{project.solution}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Proje Görselleri (galeri, coverSrc dahil değil) ─────────── */}
              {galleryImages.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200 mb-4">Proje Görselleri</p>
                  <GalleryLightbox images={galleryImages} title={project.title} />
                </div>
              )}

              {/* ── Temel Özellikler ─────────────────────────────────────────── */}
              {project.features && project.features.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200 mb-4">Temel Özellikler</p>
                  <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                    {project.features.map((f, i) => {
                      const color = FEATURE_COLORS[i % FEATURE_COLORS.length]!;
                      return (
                        <div key={f} className="rounded-xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 p-4 flex flex-col items-center gap-3 text-center shadow-sm hover:shadow-md transition-shadow">
                          <div className={`w-12 h-12 rounded-2xl ${color.bg} ${color.icon} flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6`}>
                            {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                          </div>
                          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 leading-snug">{f}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Proje Hikayesi ───────────────────────────────────────────── */}
              {hasBody && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200 mb-5">Proje Hikayesi</p>
                  <div className="text-[15px] text-gray-600 dark:text-slate-400 leading-relaxed">
                    <BodyFormatter body={project.body!} />
                  </div>
                </div>
              )}

              {/* ── Benzer Projeler ──────────────────────────────────────────── */}
              {related.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Benzer Projeler</p>
                    <Link href="/projeler" className="text-[10px] text-[#26496b] dark:text-[#66aca9] font-semibold hover:underline">
                      Tümünü Gör →
                    </Link>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-5 px-5">
                    {related.map((p) => <RelatedCard key={p.slug} project={p} />)}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sağ: Yapışık Sidebar ────────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-4">

              {/* Proje Sahibi */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className={`h-[2px] bg-gradient-to-r ${accent}`} />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-gray-800 dark:text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Proje Sahibi</p>
                  </div>

                  {project.authorName && (
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: project.authorAvatarColor ?? '#26496b' }}>
                        {project.authorInitials ?? project.authorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{project.authorName}</p>
                        {project.authorTag && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{project.authorTag}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {/* LinkedIn */}
                    <a
                      href={project.linkedinUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2.5 w-full text-sm font-semibold px-3.5 py-2.5 rounded-lg border border-[#0a66c2] text-[#0a66c2] hover:bg-[#0a66c2]/5 transition-all ${!project.linkedinUrl ? 'opacity-40 pointer-events-none' : ''}`}>
                      <span className="w-5 h-5 shrink-0 rounded bg-[#0a66c2] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </span>
                      LinkedIn Profili
                    </a>
                    <a href={msgHref ?? '#'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full text-sm font-semibold px-3.5 py-2.5 rounded-lg bg-[#238179] text-white hover:bg-[#1d6e66] transition-colors">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Mesaj Gönder
                    </a>
                    <button className="flex items-center justify-center gap-2.5 w-full text-sm font-semibold px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 transition-all">
                      <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Takip Et
                    </button>
                  </div>

                  {/* Üyenin Diğer Projeleri — Proje Sahibi kartının altında */}
                  {otherByAuthor.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-slate-800 -mx-5 px-5 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Üyenin Diğer Projeleri</p>
                        <Link href="/projeler" className="text-[10px] text-[#26496b] dark:text-[#66aca9] font-semibold hover:underline">Tümünü Gör →</Link>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {otherByAuthor.map((p) => <OtherProjectCard key={p.slug} project={p} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Haritailesi Değerlendirmesi */}
              {(project.editorialNote || project.editorialScore) && (
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-gray-800 dark:text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Haritailesi Değerlendirmesi</p>
                  </div>

                  {project.editorialScore && (
                    <div className="bg-[#238179]/8 rounded-xl p-4 flex flex-col items-center gap-2.5">
                      {/* Etiket */}
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#238179]">Haritailesi Puanı</p>

                      {/* Skor */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black text-[#238179] leading-none tabular-nums">
                          {Number(project.editorialScore).toFixed(1).replace('.0', '')}
                        </span>
                        <span className="text-lg text-[#238179]/50 font-semibold">/ 10</span>
                      </div>

                      {/* Yıldızlar — gerçek yarım yıldız */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const val = Number(project.editorialScore) / 2;
                          const filled = val >= i + 1;
                          const half = !filled && val >= i + 0.5;
                          if (filled) {
                            return (
                              <svg key={i} className="w-6 h-6 text-[#238179]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            );
                          }
                          if (half) {
                            return (
                              <span key={i} className="relative inline-block w-6 h-6">
                                <svg className="absolute inset-0 w-6 h-6 text-[#238179]/20" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <svg className="absolute inset-0 w-6 h-6 text-[#238179]" fill="currentColor" viewBox="0 0 24 24"
                                  style={{ clipPath: 'inset(0 50% 0 0)' }}>
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </span>
                            );
                          }
                          return (
                            <svg key={i} className="w-6 h-6 text-[#238179]/20" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Güçlü Yönler */}
                  {(() => {
                    const strengths = project.editorialStrengths?.length
                      ? project.editorialStrengths
                      : project.features?.slice(0, 4) ?? [];
                    return strengths.length > 0 ? (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-slate-500 mb-3">Güçlü Yönler</p>
                        <ul className="space-y-2.5">
                          {strengths.map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-slate-400 leading-snug">
                              <div className="w-4 h-4 rounded-full bg-[#167066] flex items-center justify-center shrink-0 mt-0.5">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null;
                  })()}

                  <p className="text-[10px] text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-200 dark:border-slate-700">
                    Değerlendirme Tarihi: {new Date(project.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Paylaş */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200 mb-3">Projeyi Paylaş</p>
                <SidebarShare url={pageUrl} title={project.title} />
              </div>

              {/* Beğen & Kaydet */}
              <ProjectInteractions projectSlug={slug} />

              {/* Yorum Yaz */}
              <CommentBox projectSlug={slug} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
