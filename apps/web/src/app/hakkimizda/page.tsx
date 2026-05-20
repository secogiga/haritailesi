import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';
import { cms } from '@/lib/api';
import { EditableSection } from '@/components/EditableSection';

export const metadata: Metadata = { title: 'Hakkımızda' };

export default async function HakkimizdaPage() {
  const page = await cms.page('hakkimizda');

  return (
    <main>
      {/* Hero */}
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">Hakkımızda</h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Harita, geomatik, kadastro ve CBS sektörünün buluşma noktası.
          </p>
        </div>
      </section>

      {/* İçerik */}
      <EditableSection
        sectionKey="page:hakkimizda"
        label="Sayfa İçeriği"
        initialData={{ title: page?.title ?? 'Hakkımızda', body: page?.body ?? '', isPublished: page?.isPublished ?? true, metaDescription: page?.metaDescription ?? '' }}
      >
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {page?.body ? (
            <div
              className="prose prose-lg prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          ) : (
            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                Haritailesi Vakfı, harita mühendisliği, geomatik, kadastro ve coğrafi bilgi sistemleri
                alanında çalışan profesyonelleri bir araya getiren bir topluluk platformudur.
              </p>
              <p>
                Sektör profesyonellerinin birbirleriyle bağlantı kurması, bilgi paylaşması ve mesleki
                gelişimlerini desteklemesi amacıyla kurulmuştur.
              </p>
              <p className="text-sm text-gray-500 italic">
                Bu sayfa içeriği henüz admin panelinden güncellenmemiştir.
              </p>
            </div>
          )}
        </div>
      </section>
      </EditableSection>

      {/* Alt menü */}
      <section className="border-t border-gray-100 py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4">
            <Link
              href={"/hakkimizda/yonetim" as Route}
              className="px-5 py-2.5 text-sm font-medium text-[var(--color-mavi)] border border-[var(--color-mavi)] rounded-lg hover:bg-[var(--color-mavi)] hover:text-white transition-colors"
            >
              Yönetim Kurulu →
            </Link>
            <Link
              href={"/hakkimizda/tuzuk" as Route}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Tüzük &amp; Belgeler →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
