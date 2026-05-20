import type { Metadata } from 'next';
import Link from 'next/link';
import { cms } from '@/lib/api';
import { EditableSection } from '@/components/EditableSection';

export const metadata: Metadata = { title: 'Katılma Şartları' };

const ZORUNLU_SARTLAR = [
  'Lise, ön lisans veya lisans düzeyinde öğrenci olmak (mezun olmamış)',
  'Harita, geomatik, kadastro, CBS, inşaat, gayrimenkul değerleme veya ilgili alanlarda öğrenim görüyor olmak ya da bu sektöre güçlü ilgi duymak',
  'Aylık en az birkaç saat program faaliyetlerine zaman ayırabilmek',
  'KVKK kapsamında kişisel verilerin işlenmesine onay vermek',
];

const TERCIH_SARTLARI = [
  'Topluluk katkısına istekli olmak (içerik, etkinlik, proje vb.)',
  'Haritailesi platformunu daha önce takip etmiş olmak',
  'Üretkenlik ve öğrenme motivasyonunu somut örneklerle ifade edebilmek',
  'Mentorluk ilişkisine açık, sorumluluk alabilen bir profil sergilemek',
];

const SURE = [
  {
    adim: '1',
    baslik: 'Başvuru Formu',
    aciklama: 'Kişisel bilgiler, eğitim durumu ve motivasyon sorularını içeren formu doldur.',
  },
  {
    adim: '2',
    baslik: 'Ön Değerlendirme',
    aciklama: 'Başvurular ekip tarafından incelenir. Uygun adaylar görüşmeye davet edilir.',
  },
  {
    adim: '3',
    baslik: 'Görüşme',
    aciklama: 'Kısa bir online görüşme ile tanışma sağlanır. Görüşme yaklaşık 20–30 dakika sürer.',
  },
  {
    adim: '4',
    baslik: 'Sonuç Bildirimi',
    aciklama: 'Tüm adaylara sonuç e-posta ile bildirilir. Kabul edilenler programa hoş geldiniz mesajı alır.',
  },
];

export default async function SartlarPage() {
  const page = await cms.page('mg-sartlar');

  return (
    <EditableSection
      sectionKey="page:mg-sartlar"
      label="Katılma Şartları İçeriği"
      initialData={{ title: page?.title ?? 'Katılma Şartları', body: page?.body ?? '', isPublished: page?.isPublished ?? true }}
    >
    <div className="space-y-8">
      {page?.body ? (
        <>
          <div className="prose prose-sm prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: page.body }} />
          <div className="text-center">
            <Link
              href="/meslegin-gelecekleri/basvuru"
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
            >
              Başvuru Formuna Git
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Zorunlu şartlar */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-5">Zorunlu Şartlar</h2>
              <ul className="space-y-3">
                {ZORUNLU_SARTLAR.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tercih şartları */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-5">Tercih Nedenleri</h2>
              <p className="text-sm text-gray-500 mb-4">Zorunlu olmamakla birlikte değerlendirmede olumlu etki eden özellikler:</p>
              <ul className="space-y-3">
                {TERCIH_SARTLARI.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xs">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Süreç */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-6">Seçim Süreci</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SURE.map((s) => (
                <div key={s.adim} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-mavi)] text-white flex items-center justify-center text-sm font-bold mb-3">
                    {s.adim}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{s.baslik}</h3>
                  <p className="text-xs text-gray-500">{s.aciklama}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sık Sorulan Sorular */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-6">Sık Sorulan Sorular</h2>
            <div className="space-y-4">
              {[
                {
                  s: 'Mezun öğrenciler başvurabilir mi?',
                  c: 'Hayır. Program yalnızca aktif öğrencilere açıktır. Mezuniyet sonrasında Bireysel Üyelik başvurusu yapılabilir.',
                },
                {
                  s: 'Başvuru ücreti var mı?',
                  c: 'Hayır, program ve başvuru tamamen ücretsizdir.',
                },
                {
                  s: 'Başvurum reddedilirse tekrar başvurabilir miyim?',
                  c: 'Evet. Bir sonraki başvuru döneminde tekrar başvurabilirsiniz.',
                },
                {
                  s: 'Programa kabul edildikten sonra ayrılabilir miyim?',
                  c: 'Program gönüllülük esasına dayanır. Ancak ciddi taahhütler içerdiği için katılım sürekliliği beklenmektedir.',
                },
              ].map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{faq.s}</p>
                  <p className="text-sm text-gray-500">{faq.c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/meslegin-gelecekleri/basvuru"
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-xl transition-colors"
            >
              Başvuru Formuna Git
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </div>
    </EditableSection>
  );
}
