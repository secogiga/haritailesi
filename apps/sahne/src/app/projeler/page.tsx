import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { ProjeGonderButton } from '@/components/ProjeGonder';
import { SahneProjelerGrid } from '@/components/SahneProjelerGrid';

export const metadata: Metadata = {
  title: 'Projeler',
  description: "Meslektaşlarımızın Sahne veya Haritakademi'den paylaştığı projeler.",
};

const mutfakUrl = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const SAHNE_PINNED = [
  {
    id: 'sahne-4',
    initials: 'AHK',
    avatarColor: 'bg-emerald-600',
    author: 'Ahmet Hakan Köksal',
    title: 'Ahmet Hakan Köksal — GeoPorsuk',
    tag: 'CBS & 3B Modelleme',
    tagColor: 'bg-emerald-100 text-emerald-700',
    accent: 'from-emerald-400 to-emerald-600',
    images: ['/projects/ahmet-geoporsuk-1.jpg'],
    body: `Meslektaşlarımızın vizyoner projelerini paylaşmaktan mutluluk duyuyoruz. Değerli meslektaşımız Ahmet Hakan Köksal'ı "GeoPorsuk" projesinden dolayı tebrik ve takdir ederiz. GeoPorsuk, kullanıcıların interaktif bir 3D dünya haritası üzerinde kendi poligonlarını çizerek, sadece seçili noktalara özel yüksek hassasiyetli 3D arazi modelleri ve mekansal analiz kütleleri üretebildiği OSM üzerinden çekilen veriler ile web tabanlı bir veri görselleştirme aracı. Ahmet Hakan Köksal'a çalışmalarında kolaylıklar diliyoruz.`,
    tags: ['meslekiuygulama', 'meslektaşınıtakdiret', 'haritakademi', 'OSM', '3B', 'web', 'CBS', 'arazimodeliimi', 'poligon'],
    links: [{ label: 'GeoPorsuk Hakkında', href: 'https://lnkd.in/d3G3vu6E' }],
  },
  {
    id: 'sahne-3',
    initials: 'HG',
    avatarColor: 'bg-amber-600',
    author: 'Hamdi Gündüz',
    title: 'Hamdi Gündüz — Veriden Ocağa: Netpromine ile Sıfırdan Açık Ocak Tasarımı',
    tag: 'Maden & Tasarım',
    tagColor: 'bg-amber-100 text-amber-700',
    accent: 'from-amber-400 to-amber-600',
    images: ['/projects/hamdi-veridenocaga-1.png'],
    body: `Mesleğimizin özellikle madencilik ölçmelerinde önemi aşikar, değerli meslektaşımız Hamdi Gündüz de çalışmasıyla ocak tasarımına yönelik yeni bir vizyoner bakış açısı ortaya koyuyor. Birçok meslektaşımızı yakından takip ediyoruz, değerli meslektaşımız Hamdi Gündüz da bunlardan bir tanesi, sadece meslek alanında değil özellikle madencilik alanında çok ciddi çalışmaları var.

Hamdi Gündüz, çalışmasında Netpromine ile sıfırdan bir açık ocak linyit projelendirme akışını uçtan uca yöneterek, sondaj verisini doğru okuyup, yer altındaki potansiyeli sahada kazılabilir bir projeye dönüştürüyor. Hamdi Gündüz'ü çalışmasından dolayı tebrik ve takdir ederiz, çalışmalarında başarılar dileriz.`,
    tags: ['madencilikölçmeleri', 'ocaktasarımı', 'meslektaşınıtakdiret', 'haritakademi', 'Netpromine', 'linyit', 'açıkocak', 'sondaj'],
  },
  {
    id: 'sahne-2',
    initials: 'EA',
    avatarColor: 'bg-[#66aca9]',
    author: 'Ertan Selçuk Atalay',
    title: 'Ertan Selçuk Atalay — AxisTrack: LandXML Survey',
    tag: 'Ölçme & CBS',
    tagColor: 'bg-blue-100 text-blue-700',
    accent: 'from-blue-400 to-blue-600',
    images: ['/projects/ertan-axistrack-1.jpg'],
    body: `Mesleğimizde saha geri bildirimleriyle büyüyen uygulamaları önemsiyoruz. Libya, Uganda, Romanya ve Türkiye gibi farklı projelerde çalışanların talepleri ve geri bildirimleri doğrultusunda değerli meslektaşımız Ertan Selçuk Atalay'ın karayolu, demiryolu ve altyapı projelerinde çalışan mühendisler ve saha ekipleri için geliştirdiği "AxisTrack" ile güzergah imalatının en güncel halini artık sahada mobil cihazdan anlık olarak görebilmek artık mümkün.

AxisTrack: LandXML Survey, ayrıca projelerinizi sahaya taşıyarak alignment, KM/Offset, enkesit, koordinat sistemi ve proje katmanlarını mobil cihaz üzerinden kontrol etmenizi sağlar. Ertan Selçuk Atalay'ı geliştirdiği uygulamasından dolayı tebrik ve takdir ederiz, çalışmalarında kolaylıklar dileriz.`,
    tags: ['güzergahtasarımı', 'meslekiuygulama', 'meslektaşınıtakdiret', 'haritakademi', 'LandXML', 'karayolu', 'demiryolu', 'iOS', 'Android'],
    links: [
      { label: 'iOS App Store', href: 'https://lnkd.in/eh5g4U-b' },
      { label: 'Google Play', href: 'https://lnkd.in/e4aUerEG' },
    ],
  },
  {
    id: 'sahne-1',
    initials: 'SC',
    avatarColor: 'bg-[#26496b]',
    author: 'Selinay Civelek',
    title: 'Selinay Civelek — Akıllı Kazı & Dolgu Eklentisi',
    tag: 'İnşaat & Mühendislik',
    tagColor: 'bg-orange-100 text-orange-700',
    accent: 'from-orange-400 to-orange-600',
    images: ['/projects/selinay-kazi-1.jpg', '/projects/selinay-kazi-2.jpg'],
    body: `Hafriyat ve altyapı projelerinde özellikle kazı ve dolgu çalışmalarında meslektaşlarımızın rolü yadsınamaz. Değerli meslektaşımız Selinay Civelek de hafriyat ve altyapı projelerinde Civil 3D verilerini Google Earth'e (KMZ) aktarırken yaşanan görsel kayıp ve karmaşa sorununu çözmek için C# ile geliştirdiği AutoCAD eklentisi "Akıllı Kazı & Dolgu"yu geliştirdi.

"Akıllı Kazı & Dolgu" eklentisi ile artık sahanın topoğrafyasını, net metraj verilerini ve kot analizlerini tek tıkla Google Earth üzerinde interaktif bir ısı haritasına dönüştürebiliyor. Selinay Civelek'in uygulaması; birebir renk ve analiz aktarımı, akıllı 3B modelleme, interaktif metraj lejantı, otomatik masaüstü çıktısı çözümlerini üretirken bunu yüksek performans ile sunuyor.

Selinay Civelek'i bu vizyoner çalışmasından dolayı tebrik ve takdir ederiz, çalışmalarında kolaylıklar dileriz.`,
    tags: ['altyapı', 'hafriyat', 'kazı', 'dolgu', 'meslekiuygulama', 'C#', 'AutoCAD', 'Civil 3D', 'Google Earth'],
  },
];

const PINNED = [
  {
    id: 'li-1', initials: 'SC', avatarColor: 'bg-[#26496b]',
    author: 'Selinay Civelek', title: 'Akıllı Kazı & Dolgu',
    tag: 'İnşaat & Mühendislik', tagColor: 'bg-orange-100 text-orange-700',
    href: 'https://www.linkedin.com/feed/update/urn:li:activity:7459954591409872896',
    accent: 'from-orange-400 to-orange-600',
  },
  {
    id: 'li-2', initials: 'EA', avatarColor: 'bg-[#66aca9]',
    author: 'Ertan Selçuk Atalay', title: 'AxisTrack: LandXML Survey',
    tag: 'Ölçme & CBS', tagColor: 'bg-blue-100 text-blue-700',
    href: 'https://www.linkedin.com/feed/update/urn:li:activity:7453806050744651777',
    accent: 'from-blue-400 to-blue-600',
  },
  {
    id: 'li-3', initials: 'HG', avatarColor: 'bg-amber-600',
    author: 'Hamdi Gündüz', title: 'Veriden Ocağa: Netpromine ile Sıfırdan Açık Ocak Tasarımı',
    tag: 'Maden & Tasarım', tagColor: 'bg-amber-100 text-amber-700',
    href: 'https://www.linkedin.com/feed/update/urn:li:activity:7450884103790284802',
    accent: 'from-amber-400 to-amber-600',
  },
];

function ProjeCta() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#26496b] to-[#1a3350] p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-bold mb-1">Projen mi var?</p>
          <p className="text-sm text-white/70 max-w-lg">
            Sahne veya Haritakademi&apos;de paylaştığın projeyi topluluğa duyur.
            Mutfak üzerinden oluşturabilir ya da LinkedIn linkini gönderebilirsin.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <a
            href={`${mutfakUrl}/projeler/yeni`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 text-sm font-semibold text-[#26496b] bg-white hover:bg-white/90 rounded-xl transition-colors"
          >
            Mutfak&apos;ta Oluştur
          </a>
          <ProjeGonderButton />
        </div>
      </div>
    </div>
  );
}

export default function ProjelerPage() {

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">

        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-3">
              Sahne Modülleri
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Projeler
            </h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl">
              Meslektaşlarımızın Sahne veya Haritakademi&apos;den paylaştığı projeler.
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

            {/* Üst CTA */}
            <ProjeCta />

            {/* Sahne'den Projeler */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#66aca9] animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#66aca9]">Sahne&apos;den Projeler</span>
              </div>
              <SahneProjelerGrid pinned={SAHNE_PINNED} />
            </div>

            {/* Haritakademi'den Seçmeler */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-3.5 h-3.5 text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#66aca9]">Haritakademi&apos;den Seçmeler</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {PINNED.map((p) => (
                  <a
                    key={p.id}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-gray-200 dark:hover:border-slate-700 transition-all overflow-hidden"
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${p.accent}`} />
                    <div className="flex flex-col flex-1 p-5 gap-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                            {p.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">{p.author}</div>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.tagColor}`}>{p.tag}</span>
                          </div>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0a66c2]/10 text-[#0a66c2]">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug flex-1 group-hover:text-[#26496b] dark:group-hover:text-[#66aca9] transition-colors">{p.title}</h2>
                      <div className="pt-3 border-t border-gray-100 dark:border-slate-800 mt-auto">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a66c2] group-hover:underline">
                          LinkedIn&apos;de Gör →
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Alt CTA */}
            <ProjeCta />

          </div>
        </section>
      </main>
    </>
  );
}
