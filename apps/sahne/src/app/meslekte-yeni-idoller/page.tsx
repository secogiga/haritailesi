import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import IdollerSection from '@/components/IdollerSection';
import { HikayeniPaylasButton } from '@/components/HikayeniPaylas';

export const metadata: Metadata = {
  title: 'Meslekte Yeni İdoller',
  description: 'Haritailesi topluluğunun ilham veren isimleri. Sen de hikayeni paylaş, mentor ol ya da bir mentörden ilham al.',
};

export default function MeslekteYeniIdollerPage() {
  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-idoller" />
      <main>
        {/* Breadcrumb */}
        <div className="bg-white dark:bg-[#070c1a] border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500">
              <Link href="/" className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors">Ana Sayfa</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-600 dark:text-slate-300">Meslekte Yeni İdoller</span>
            </nav>
          </div>
        </div>

        {/* İdol kartları */}
        <IdollerSection />

        {/* CTA Butonlar */}
        <section className="py-12 bg-white dark:bg-[#070c1a] border-t border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
                Sen de bu topluluğun parçasısın.
              </h2>
              <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-lg mx-auto text-sm">
                Hikayeni paylaş, ilham ver ya da bir mentörden ilham al.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <HikayeniPaylasButton label="Sen de Hikayeni Paylaş" variant="amber" />
              <Link
                href="/mentorluk#basvuru"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#26496b] hover:bg-[#1d3a57] text-white font-semibold text-sm rounded-xl transition-colors text-center"
              >
                Mentör Ol — İlham Ver
              </Link>
              <Link
                href="/mentorluk#basvuru"
                className="w-full sm:w-auto px-8 py-3.5 border border-[#26496b]/40 dark:border-slate-600 text-[#26496b] dark:text-slate-300 hover:border-[#26496b] hover:bg-[#26496b]/5 font-semibold text-sm rounded-xl transition-colors text-center"
              >
                Mentee Ol — İlham Al
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
