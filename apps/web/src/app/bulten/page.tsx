import type { Metadata } from 'next';
import Link from 'next/link';
import { cms } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Bülten Arşivi',
  description: 'Haritailesi topluluğuna gönderilmiş aylık bültenlerin arşivi.',
};

function formatMonth(month: string) {
  const [yr, mo] = month.split('-').map(Number);
  return new Date(yr!, mo! - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export default async function BultenArsiviPage() {
  const newsletters = await cms.newsletters() ?? [];

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">Bülten Arşivi</h1>
          <p className="text-white/70 text-lg">Haritailesi topluluğuna gönderilmiş aylık bültenler</p>
          <p className="text-white/50 text-sm mt-2">{newsletters.length} bülten</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {newsletters.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">📭</p>
            <p>Henüz yayınlanmış bülten yok.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {newsletters.map(n => (
              <Link
                key={n.id}
                href={`/bulten/${n.id}`}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-[var(--color-mavi)] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-xs font-semibold text-[var(--color-mavi)] bg-blue-50 px-2.5 py-1 rounded-full">
                    {formatMonth(n.month)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(n.sentAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <h2 className="font-bold text-gray-900 mb-1 group-hover:text-[var(--color-mavi)] transition-colors line-clamp-2">
                  {n.title}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-2">{n.subject}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-[var(--color-mavi)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Oku <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
