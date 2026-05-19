import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { cms } from '@/lib/api';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await cms.project(slug);
  if (!project) return { title: 'Proje Bulunamadı' };
  return {
    title: project.title,
    description: project.summary ?? undefined,
  };
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  archived: 'Arşiv',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default async function ProjeDetayPage({ params }: Props) {
  const { slug } = await params;
  const project = await cms.project(slug);
  if (!project || !project.isPublished) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/projeler"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-[var(--color-mavi)] dark:hover:text-blue-400 transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tüm Projeler
            </Link>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status] ?? STATUS_COLORS['active']}`}
            >
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mt-4 mb-3">
              {project.title}
            </h1>
            {project.summary && (
              <p className="text-gray-500 dark:text-slate-400 text-base leading-relaxed">
                {project.summary}
              </p>
            )}
          </div>
        </section>

        {project.body && (
          <section className="py-10 sm:py-14">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: project.body }} />
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
