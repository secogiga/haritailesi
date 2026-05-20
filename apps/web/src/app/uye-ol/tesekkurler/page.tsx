import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Başvurunuz Alındı' };

const MESAJLAR = {
  bireysel: {
    baslik: 'Başvurunuz Alındı!',
    aciklama: 'Başvurunuz tarafımıza ulaştı. Değerlendirme sürecini tamamladıktan sonra uygun bulunan adaylarla iletişime geçeceğiz.',
  },
  kurumsal: {
    baslik: 'Teşekkürler!',
    aciklama: 'Sizi daha iyi tanıyabilmemiz için ekibimiz yakında kısa bir görüşme planlamak üzere sizinle iletişime geçecek.',
  },
  'meslegin-gelecekleri': {
    baslik: 'Başvurunuz Alındı!',
    aciklama: 'Başvurular değerlendirme sürecinden geçmektedir. Uygun bulunan adaylarla kısa bir görüşme planlanacaktır.',
  },
  ogrenci: {
    baslik: 'Haritailesi Genç Başvurun Alındı!',
    aciklama: 'Başvurun incelemeye alındı. Onaylandığında e-posta adresine hesap kurulum bağlantısı gönderilecek.',
  },
  yeni_mezun: {
    baslik: 'Haritailesi Genç Başvurun Alındı!',
    aciklama: 'Başvurun incelemeye alındı. Onaylandığında e-posta adresine hesap kurulum bağlantısı gönderilecek.',
  },
};

export default async function TesekkurlerPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const { tip } = await searchParams;
  const mesaj = MESAJLAR[tip as keyof typeof MESAJLAR] ?? MESAJLAR['bireysel'];

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-xl shadow-sm p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{mesaj.baslik}</h1>
          <p className="text-gray-600 mb-8">{mesaj.aciklama}</p>
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 px-6 text-white font-semibold rounded-lg bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
            <p className="text-sm text-gray-500">
              E-posta adresinize bir onay maili gönderildi.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
