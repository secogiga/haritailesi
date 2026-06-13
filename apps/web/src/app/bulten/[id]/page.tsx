import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cms } from '@/lib/api';
import { NewsletterFrame } from './_frame';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const n = await cms.newsletter(id);
  if (!n) return { title: 'Bülten' };
  return { title: n.title, description: n.subject };
}

function formatMonth(month: string) {
  const [yr, mo] = month.split('-').map(Number);
  return new Date(yr!, mo! - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export default async function BultenDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = await cms.newsletter(id);
  if (!n) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Üst bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/bulten" className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1">
            ← Arşiv
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xs font-semibold text-[var(--color-mavi)] bg-blue-50 px-2.5 py-1 rounded-full">
            {formatMonth(n.month)}
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(n.sentAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* İçerik */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {n.htmlBody ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <NewsletterFrame html={n.htmlBody} title={n.title} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">📄</p>
            <p className="text-gray-500">Bu bültenin içeriği görüntülenemiyor.</p>
          </div>
        )}
      </div>
    </main>
  );
}
