import type { Metadata } from 'next';
import Link from 'next/link';
import { cms } from '@/lib/api';
import { EditableSection } from '@/components/EditableSection';

export const metadata: Metadata = { title: 'Program Hakkında' };

const PROGRAM_ICERIGI = [
  {
    baslik: 'Mentorluk',
    aciklama:
      'Sektörde aktif çalışan profesyonellerle düzenli birebir görüşmeler. Kariyerin için yol haritası çizme fırsatı.',
    ikon: '🎓',
  },
  {
    baslik: 'Proje Geliştirme',
    aciklama:
      'Gerçek problemlere gerçek çözümler. Haritailesi bünyesindeki projelerde aktif rol alma imkânı.',
    ikon: '🛠️',
  },
  {
    baslik: 'Topluluk & Network',
    aciklama:
      'Aynı vizyonu paylaşan diğer katılımcılarla ve Haritailesi ekibiyle güçlü bir ağ kurma.',
    ikon: '🤝',
  },
  {
    baslik: 'Eğitim & İçerik Erişimi',
    aciklama:
      'Seçilmiş kaynaklar, özel etkinlik davetleri ve yayınlanmamış içeriklere erişim.',
    ikon: '📚',
  },
  {
    baslik: 'Katkı & Üretim',
    aciklama:
      'Topluluğa değer katarak öğrenme. İçerik, etkinlik, araştırma veya teknik alanlarda aktif üretim.',
    ikon: '✍️',
  },
  {
    baslik: 'Tanınma & Referans',
    aciklama:
      'Programı tamamlayan katılımcılara Haritailesi katılım belgesi ve topluluğun desteği.',
    ikon: '🏅',
  },
];

const TAKVIM = [
  { donem: 'Başvuru Dönemi', tarih: 'Her yıl Ekim–Kasım', renk: 'bg-blue-50 border-blue-200 text-blue-800' },
  { donem: 'Değerlendirme & Görüşmeler', tarih: 'Kasım–Aralık', renk: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  { donem: 'Program Başlangıcı', tarih: 'Ocak', renk: 'bg-green-50 border-green-200 text-green-800' },
  { donem: 'Program Süresi', tarih: '6 ay (Ocak–Haziran)', renk: 'bg-purple-50 border-purple-200 text-purple-800' },
];

export default async function ProgramPage() {
  const page = await cms.page('mg-program');

  return (
    <EditableSection
      sectionKey="page:mg-program"
      label="Program İçeriği"
      initialData={{ title: page?.title ?? 'Program Hakkında', body: page?.body ?? '', isPublished: page?.isPublished ?? true }}
    >
    <div className="space-y-8">
      {page?.body ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="prose prose-sm prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: page.body }} />
            </div>
            {/* Özet kutu */}
            <div className="bg-[var(--color-mavi)] text-white rounded-2xl p-6 h-fit">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Kontenjan</span>
                  <span className="font-semibold">25 kişi</span>
                </div>
                <div className="border-t border-white/10" />
                <div className="flex justify-between">
                  <span className="text-white/60">Süre</span>
                  <span className="font-semibold">6 ay</span>
                </div>
                <div className="border-t border-white/10" />
                <div className="flex justify-between">
                  <span className="text-white/60">Kimler başvurabilir</span>
                  <span className="font-semibold text-right">Lise / ÖL / Lisans</span>
                </div>
                <div className="border-t border-white/10" />
                <div className="flex justify-between">
                  <span className="text-white/60">Ücret</span>
                  <span className="font-semibold text-green-300">Ücretsiz</span>
                </div>
              </div>
              <Link
                href="/meslegin-gelecekleri/basvuru"
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-white text-[var(--color-mavi)] font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm"
              >
                Başvur
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="bg-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Hazır mısın?</h2>
            <p className="text-gray-500 text-sm mb-6">Katılma şartlarını incele, ardından başvurunu tamamla.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/meslegin-gelecekleri/sartlar"
                className="px-6 py-3 text-sm font-semibold text-[var(--color-mavi)] border-2 border-[var(--color-mavi)] rounded-xl hover:bg-white transition-colors"
              >
                Katılma Şartları
              </Link>
              <Link
                href="/meslegin-gelecekleri/basvuru"
                className="px-6 py-3 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors"
              >
                Başvur
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Üst tanıtım */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Program Nedir?</h2>
              <div className="text-sm text-gray-600 space-y-3">
                <p>
                  Mesleğin Gelecekleri, Haritailesi&apos;nin harita, geomatik ve sektörle ilgili alanlarda öğrenimini
                  sürdüren genç öğrencilere yönelik seçilmiş bir gelişim programıdır.
                </p>
                <p>
                  Yılda bir kez açılan program, <strong>25 kontenjanla</strong> sınırlıdır. Katılımcılar başvuru ve
                  görüşme sürecinden geçerek seçilir. Program boyunca mentorluk, proje geliştirme ve topluluk
                  katkısı bir arada yürütülür.
                </p>
                <p>
                  Bu bir staj değil, bir topluluğa katılmaktır. Öğrenirken üretir, üretirken büyürsün.
                </p>
              </div>
            </div>

            {/* Özet kutu */}
            <div className="bg-[var(--color-mavi)] text-white rounded-2xl p-6 h-fit">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Kontenjan</span>
                  <span className="font-semibold">25 kişi</span>
                </div>
                <div className="border-t border-white/10" />
                <div className="flex justify-between">
                  <span className="text-white/60">Süre</span>
                  <span className="font-semibold">6 ay</span>
                </div>
                <div className="border-t border-white/10" />
                <div className="flex justify-between">
                  <span className="text-white/60">Kimler başvurabilir</span>
                  <span className="font-semibold text-right">Lise / ÖL / Lisans</span>
                </div>
                <div className="border-t border-white/10" />
                <div className="flex justify-between">
                  <span className="text-white/60">Ücret</span>
                  <span className="font-semibold text-green-300">Ücretsiz</span>
                </div>
              </div>
              <Link
                href="/meslegin-gelecekleri/basvuru"
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-white text-[var(--color-mavi)] font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm"
              >
                Başvur
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Program içeriği */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-6">Program İçeriği</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROGRAM_ICERIGI.map((item) => (
                <div key={item.baslik} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="text-lg mb-2">{item.ikon}</div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.baslik}</h3>
                  <p className="text-sm text-gray-500">{item.aciklama}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Takvim */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-6">Program Takvimi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TAKVIM.map((t) => (
                <div key={t.donem} className={`rounded-xl border px-5 py-4 ${t.renk}`}>
                  <div className="font-semibold text-sm">{t.donem}</div>
                  <div className="text-sm mt-0.5 opacity-80">{t.tarih}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Hazır mısın?</h2>
            <p className="text-gray-500 text-sm mb-6">Katılma şartlarını incele, ardından başvurunu tamamla.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/meslegin-gelecekleri/sartlar"
                className="px-6 py-3 text-sm font-semibold text-[var(--color-mavi)] border-2 border-[var(--color-mavi)] rounded-xl hover:bg-white transition-colors"
              >
                Katılma Şartları
              </Link>
              <Link
                href="/meslegin-gelecekleri/basvuru"
                className="px-6 py-3 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors"
              >
                Başvur
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
    </EditableSection>
  );
}
