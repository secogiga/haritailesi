import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { cms } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Projeler',
  description: 'Haritailesi topluluğunun geliştirdiği harita, CBS ve geomatik projeleri.',
};

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

export default async function ProjelerPage() {
  const projects = await cms.projects();

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
              Sahne Modülleri
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Projeler
            </h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl">
              Topluluk tarafından geliştirilen harita, CBS ve geomatik projelerini keşfedin.
            </p>
          </div>
        </section>

        {/* Projects grid */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all p-6"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status] ?? STATUS_COLORS['active']}`}
                      >
                        {STATUS_LABELS[project.status] ?? project.status}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">
                        {new Date(project.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2 leading-snug">
                      {project.title}
                    </h2>
                    {project.summary && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed flex-1 line-clamp-3">
                        {project.summary}
                      </p>
                    )}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <Link
                        href={`/projeler/${project.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-mavi)] dark:text-blue-400 hover:gap-2.5 transition-all"
                      >
                        Detaylar
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Henüz proje yok</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Topluluk projeleri yakında burada görünecek.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
