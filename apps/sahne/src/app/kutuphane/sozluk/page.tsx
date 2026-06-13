import type { Metadata } from 'next';
import SozlukClient, { type Term } from './SozlukClient';

export const metadata: Metadata = {
  title: 'Meslek Sözlüğü | Meslek Kütüphanesi',
  description: 'Mesleğimizde kullanılan terimlerin doğrulanmış tanımları.',
};

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const EXAMPLE_TERMS: Term[] = [
  { id: 'ex-1', slug: null, term: 'Fotogrametri', fullForm: 'Photogrammetry', definition: 'Fotoğraf veya dijital görüntülerden nesne ve alanların geometrik özelliklerini ölçme ve haritalama bilimidir. Hava ve yersel platformlarından elde edilen görüntüler kullanılarak 3B modeller ve ortofoto haritalar üretilir.', fields: ['fotogrametri'], tags: [], isFeatured: true, viewCount: 842, createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() },
  { id: 'ex-2', slug: null, term: 'GNSS', fullForm: 'Global Navigation Satellite System', definition: 'Uydu sinyalleri aracılığıyla Dünya üzerindeki herhangi bir noktanın üç boyutlu konumunu ve zamanını belirlemeye yarayan sistemlerin genel adıdır. GPS, GLONASS, Galileo ve BeiDou başlıca GNSS sistemleridir.', fields: ['klasik_haritacilik'], tags: [], isFeatured: false, viewCount: 1204, createdAt: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString() },
  { id: 'ex-3', slug: null, term: 'CBS', fullForm: 'Coğrafi Bilgi Sistemi', definition: 'Coğrafi verilerin toplanması, depolanması, analiz edilmesi ve görselleştirilmesi için tasarlanmış bilgisayar tabanlı sistemdir. Mekânsal sorgu, ağ analizi ve tematik haritalama gibi işlemlere olanak tanır.', fields: ['cbs'], tags: [], isFeatured: true, viewCount: 1587, createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
  { id: 'ex-4', slug: null, term: 'Ortofoto', fullForm: 'Orthorectified Photograph', definition: 'Hava veya uydu görüntülerinin perspektif bozulmaları ve arazi yükseklik farklarından arındırılarak düzeltilmesiyle elde edilen, ölçekli ve koordinatlı fotoğraf haritasıdır.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: [], isFeatured: false, viewCount: 634, createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString() },
  { id: 'ex-5', slug: null, term: 'Kadastro', fullForm: null, definition: "Taşınmaz mülklerin sınır, konum, alan ve sahiplik bilgilerinin sistematik olarak belirlenerek kayıt altına alındığı resmi envanter sistemidir. Türkiye'de TKGM tarafından yürütülür.", fields: ['kadastro', 'kamu'], tags: [], isFeatured: false, viewCount: 921, createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
  { id: 'ex-6', slug: null, term: 'LiDAR', fullForm: 'Light Detection and Ranging', definition: 'Lazer ışınları göndererek nesnelerden geri dönen sinyallerin süresini ölçen uzaktan algılama teknolojisidir. Yüksek yoğunluklu nokta bulutu üretiminde ve sayısal yüzey modellemesinde yaygın olarak kullanılır.', fields: ['fotogrametri', 'uzaktan_algilama'], tags: [], isFeatured: false, viewCount: 756, createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString() },
  { id: 'ex-7', slug: null, term: 'Projeksiyon', fullForm: 'Map Projection', definition: 'Küresel ya da elipsoidal Dünya yüzeyinin bir düzleme aktarılması işlemidir. Her projeksiyon, alan, şekil, mesafe veya yön özelliklerinden birini ya da birkaçını bozarak matematiksel dönüşümler uygular.', fields: ['klasik_haritacilik', 'cbs'], tags: [], isFeatured: false, viewCount: 489, createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
  { id: 'ex-8', slug: null, term: 'RTK', fullForm: 'Real-Time Kinematic', definition: 'Bir baz istasyonundan gerçek zamanlı düzeltme verisi alarak santimetre düzeyinde hassasiyetle konum belirleyen diferansiyel GNSS tekniğidir. Kadastro, inşaat ve mühendislik uygulamalarında yaygın olarak kullanılır.', fields: ['klasik_haritacilik'], tags: [], isFeatured: false, viewCount: 1103, createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
];

async function getTerms(): Promise<Term[]> {
  try {
    const res = await fetch(`${API}/api/v1/library/terms?limit=500`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return EXAMPLE_TERMS;
    const data = await res.json() as Term[];
    return Array.isArray(data) && data.length > 0 ? data : EXAMPLE_TERMS;
  } catch {
    return EXAMPLE_TERMS;
  }
}

export default async function SozlukPage() {
  const terms = await getTerms();
  return <SozlukClient initialTerms={terms} />;
}
