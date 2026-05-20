import type { Metadata } from 'next';
import Link from 'next/link';
import { cms } from '@/lib/api';

export const metadata: Metadata = { title: 'Projeler' };

const STATUS_LABELS: Record<string, string> = {
  active: 'Devam Ediyor',
  completed: 'Tamamlandı',
  archived: 'Arşiv',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default async function ProjelerPage() {
  const projects = await cms.projects();

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">Projeler</h1>
          <p className="text-white/70 text-lg">Vakfın yürüttüğü projeler ve çalışmalar</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!projects || projects.length === 0 ? (
            <p className="text-gray-500 text-center py-12">Henüz yayınlanmış proje bulunmamaktadır.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projeler/${project.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status] ?? STATUS_COLORS.active}`}>
                      {STATUS_LABELS[project.status] ?? project.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[var(--color-mavi)] transition-colors leading-snug">
                    {project.title}
                  </h3>
                  {project.summary && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3">{project.summary}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
