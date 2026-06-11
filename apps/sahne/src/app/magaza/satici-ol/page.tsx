import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';
import SaticiOlForm from './_form';

export const metadata: Metadata = {
  title: 'Satıcı Ol | Haritailesi Mağaza',
  description: 'Haritailesi mağazasında ürünlerinizi listeleyin. Haritacılık alanında dijital ve fiziksel ürünler satın.',
};

export default function SaticiOlPage() {
  return (
    <>
      <Navbar />
      <PageActionTracker actionId="v-magaza-satici-ol" />
      <main className="min-h-screen dark:bg-[#070c1a]">
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">
              Mağaza
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Satıcı Başvurusu
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              Haritailesi topluluğuna yönelik dijital veya fiziksel ürünlerinizi mağazamızda listeleyin.
              Başvurunuz değerlendirildikten sonra sizinle iletişime geçeceğiz.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Ne sunuyoruz */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: '🏪', title: 'Hazır Altyapı', desc: 'Ödeme, listeleme ve müşteri yönetimi altyapısı hazır.' },
                { icon: '👥', title: 'Hedef Kitle', desc: 'Türkiye genelinde haritacılık uzmanlarına direkt erişim.' },
                { icon: '💰', title: 'Gelir Paylaşımı', desc: 'Satışlarınızın büyük kısmı size kalır; küçük komisyon bize.' },
              ].map(item => (
                <div key={item.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>

            <SaticiOlForm />
          </div>
        </section>
      </main>
    </>
  );
}
