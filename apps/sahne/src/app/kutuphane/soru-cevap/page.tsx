import type { Metadata } from 'next';
import SoruCevapClient from '@/app/soru-cevap/SoruCevapClient';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Soru & Cevap | Meslek Kütüphanesi',
  description: 'Haritacılık, CBS, fotogrametri ve geomatik alanlarında merak ettiğiniz her şeyi sorun.',
};

interface QaItem {
  id: string;
  displayName: string | null;
  questionText: string;
  category: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  answers: { id: string; body: string; source: string; submitterName: string | null; tierLabel: string | null; isAccepted: boolean; upvoteCount: number; updatedAt: string }[];
}

const EXAMPLE_ITEMS: QaItem[] = [
  {
    id: 'ex-1',
    displayName: 'Ahmet Y.',
    questionText: 'CORS (Continuously Operating Reference Station) ağları ile klasik GNSS ölçümü arasındaki temel fark nedir? Hangi durumlarda CORS kullanmak daha avantajlı?',
    category: 'klasik_haritacilik',
    isFeatured: true,
    viewCount: 214,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    answers: [
      {
        id: 'ex-1-a1',
        body: 'CORS ağları, sabit referans istasyonlarından sürekli yayın yaparak tek alıcıyla santimetre düzeyinde konum belirlemenizi sağlar. Klasik GNSS\'te iki alıcıya ihtiyaç duyulurken CORS\'ta yalnızca bir rover alıcısı yeterlidir; bu da ekip ve ekipman maliyetini önemli ölçüde düşürür. Özellikle büyük alanlarda, kentsel kadastro çalışmalarında ve hızlı arazi tespitlerinde CORS ağları tercih edilir.',
        source: 'expert',
        submitterName: 'Uzman Ekip',
        tierLabel: 'Uzman',
        isAccepted: true,
        upvoteCount: 18,
        updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'ex-2',
    displayName: 'Selin K.',
    questionText: 'Drone ile yapılan fotogrametrik çalışmalarda GCP (Zemin Kontrol Noktası) sayısı sonuçların doğruluğunu ne kadar etkiliyor? Az GCP ile kaliteli sonuç alınabilir mi?',
    category: 'fotogrametri_uzaktan_algilama',
    isFeatured: false,
    viewCount: 187,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    answers: [
      {
        id: 'ex-2-a1',
        body: 'GCP sayısı ve dağılımı doğruluğu doğrudan etkiler. Küçük-orta ölçekli projeler için 5–8 GCP yeterlidir; ancak önemli olan sayıdan çok projeye düzgün dağıtılmış olmalarıdır. RTK/PPK özellikli drone kullanıyorsanız 3–4 GCP bile yeterli olabilir.',
        source: 'expert',
        submitterName: 'Uzman Ekip',
        tierLabel: 'Uzman',
        isAccepted: true,
        upvoteCount: 24,
        updatedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'ex-3',
    displayName: 'Murat D.',
    questionText: 'CBS yazılımlarında (ArcGIS, QGIS) vektör ve raster veri arasındaki seçimde hangi kriterleri göz önünde bulundurmalıyım?',
    category: 'cbs',
    isFeatured: false,
    viewCount: 143,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    answers: [
      {
        id: 'ex-3-a1',
        body: 'Temel kriter veriyi neyi temsil etmek istediğinizdir. Sınırlar, yollar, parseller gibi nesne bazlı veriler için vektör; arazi yüksekliği, sıcaklık gibi sürekli yüzey verileri için raster tercih edilir. Ağ analizi vektörde, yüzey modelleme rasterda daha hızlı çalışır.',
        source: 'expert',
        submitterName: 'Uzman Ekip',
        tierLabel: 'Uzman',
        isAccepted: true,
        upvoteCount: 31,
        updatedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

async function getQA(): Promise<QaItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/qa`, { next: { revalidate: 60 } });
    if (!res.ok) return EXAMPLE_ITEMS;
    const data = await res.json() as QaItem[];
    return data.length > 0 ? data : EXAMPLE_ITEMS;
  } catch {
    return EXAMPLE_ITEMS;
  }
}

export default async function KutuphaneSoruCevapPage() {
  const items = await getQA();
  return <SoruCevapClient initialItems={items} showBreadcrumb />;
}
