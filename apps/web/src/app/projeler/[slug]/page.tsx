import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cms } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await cms.project(slug);
  return { title: project?.title ?? 'Proje' };
}

export default async function ProjeDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await cms.project(slug);
  if (!project) notFound();

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/projeler" className="text-white/60 hover:text-white text-sm mb-4 inline-block">← Tüm Projeler</Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{project.title}</h1>
          {project.summary && <p className="text-white/80 text-lg">{project.summary}</p>}
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {project.body ? (
            <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: project.body }} />
          ) : (
            <p className="text-gray-500">Proje detayları yakında eklenecektir.</p>
          )}
        </div>
      </section>
    </main>
  );
}
