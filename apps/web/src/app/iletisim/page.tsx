import type { Metadata } from 'next';
import { cms } from '@/lib/api';
import { EditableSection } from '@/components/EditableSection';

export const metadata: Metadata = { title: 'İletişim' };

export default async function IletisimPage() {
  const page = await cms.page('iletisim');

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">İletişim</h1>
          <p className="text-white/70 text-lg">Bizimle iletişime geçin</p>
        </div>
      </section>

      <EditableSection
        sectionKey="page:iletisim"
        label="Sayfa İçeriği"
        initialData={{ title: page?.title ?? 'İletişim', body: page?.body ?? '', isPublished: page?.isPublished ?? true, metaDescription: page?.metaDescription ?? '' }}
      >
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {page?.body ? (
            <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: page.body }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">İletişim Bilgileri</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[var(--color-mavi)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">E-posta</p>
                        <a href="mailto:iletisim@haritailesi.org" className="text-[var(--color-mavi)] hover:underline text-sm">
                          iletisim@haritailesi.org
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[var(--color-mavi)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Adres</p>
                        <p className="text-sm text-gray-600">Türkiye</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-6 italic">
                    Bu sayfa içeriği admin panelinden güncellenebilir.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Sosyal Medya</h2>
                <div className="space-y-3">
                  <a href="https://linkedin.com/company/haritailesi" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-[var(--color-mavi)] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <span className="text-sm font-medium">LinkedIn</span>
                  </a>
                  <a href="https://instagram.com/haritailesi" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-[var(--color-mavi)] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    <span className="text-sm font-medium">Instagram</span>
                  </a>
                  <a href="https://youtube.com/@haritailesi" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-[var(--color-mavi)] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span className="text-sm font-medium">YouTube</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      </EditableSection>
    </main>
  );
}
