import Link from 'next/link';
import type { Route } from 'next';
import { cms } from '@/lib/api';
import { EditableSection } from '@/components/EditableSection';
import NewsletterForm from '@/components/NewsletterForm';

type Stat = { number: string; label: string };
type Feature = { title: string; description: string };
type HomepageSettings = {
  hero?: { title?: string; highlight?: string; subtitle?: string; ctaPrimary?: string; ctaSecondary?: string };
  stats?: Stat[];
  features?: Feature[];
  mgTeaser?: { title?: string; description?: string };
  newsletter?: { title?: string; subtitle?: string };
  uyelikBolumu?: { title?: string; subtitle?: string };
};

const DEFAULT_STATS: Stat[] = [
  { number: '500+', label: 'Aktif Üye' },
  { number: '25', label: 'Mesleğin Gelecekleri Kontenjanı' },
  { number: '3', label: 'Üyelik Tipi' },
  { number: '10+', label: 'Etkinlik / Yıl' },
];

const DEFAULT_FEATURES: Feature[] = [
  { title: 'Topluluk', description: 'Sektörün tüm paydaşlarını bir araya getiren güçlü bir ağ.' },
  { title: 'Mentorluk', description: 'Deneyimli profesyonellerden birebir mentorluk ve kariyer desteği.' },
  { title: 'İçerik & Bilgi', description: 'Sektöre özgü içerikler, yayınlar ve etkinliklere erişim.' },
  { title: 'Kariyer', description: 'İş ilanları, network etkinlikleri ve kariyer gelişim fırsatları.' },
];

const FEATURE_ICONS = [
  <svg key="community" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  <svg key="mentorship" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>,
  <svg key="content" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>,
  <svg key="career" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>,
];

const UYELIK_TIPLERI = [
  {
    href: '/uye-ol/bireysel',
    baslik: 'Bireysel Üyelik',
    alt: 'Mesleğin Değer Ortakları',
    aciklama: 'Sektör profesyoneli, yeni mezun veya öğrenci olarak topluluğa katıl.',
  },
  {
    href: '/uye-ol/kurumsal',
    baslik: 'Kurumsal Üyelik',
    alt: 'Mesleğe Değer Katan Markalar',
    aciklama: 'SHKM, LİHKAB veya sektör şirketi olarak topluluğa katkı sun.',
  },
  {
    href: '/meslegin-gelecekleri',
    baslik: 'Mesleğin Gelecekleri',
    alt: 'Seçilmiş Öğrenci Programı',
    aciklama: '25 kontenjanlı, görüşmeli seçim süreciyle kabul edilen gelişim programı.',
    ozel: true,
  },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre',
  networking: 'Networking',
  odul: 'Ödül',
  webinar: 'Webinar',
  calistay: 'Çalıştay',
  sempozyum: 'Sempozyum',
  diger: 'Etkinlik',
};

export default async function HomePage() {
  const [events, s] = await Promise.all([
    cms.events(),
    cms.settings<HomepageSettings>('homepage'),
  ]);

  const hero = {
    title: s?.hero?.title ?? "Haritailesi'ne Katılan",
    highlight: s?.hero?.highlight ?? 'Kazanıyor!',
    subtitle: s?.hero?.subtitle ?? 'Harita, geomatik, kadastro ve CBS sektörünün profesyonellerini, öğrencilerini ve kurumlarını bir araya getiren topluluk ekosistemi.',
    ctaPrimary: s?.hero?.ctaPrimary ?? 'Üye Ol',
    ctaSecondary: s?.hero?.ctaSecondary ?? 'Daha Fazla Bilgi',
  };
  const stats = s?.stats ?? DEFAULT_STATS;
  const features = s?.features ?? DEFAULT_FEATURES;
  const mgTeaser = {
    title: s?.mgTeaser?.title ?? 'Mesleğin Gelecekleri',
    description: s?.mgTeaser?.description ?? 'Harita ve geomatik sektörünün geleceğini şekillendirecek öğrencilere özel gelişim programı. Mentorluk, proje geliştirme ve topluluk katkısı bir arada.',
  };
  const newsletter = {
    title: s?.newsletter?.title ?? 'Haberdar Olun',
    subtitle: s?.newsletter?.subtitle ?? 'Etkinlikler, duyurular ve sektör haberleri için e-posta listemize katılın.',
  };
  const uyelikBolumu = {
    title: s?.uyelikBolumu?.title ?? 'Haritailesi Topluluğuna Katılın',
    subtitle: s?.uyelikBolumu?.subtitle ?? 'Sektörün her kesiminden profesyonel, öğrenci ve kurumla güçlü bir ağ kurun.',
  };

  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <EditableSection sectionKey="homepage:hero" label="Hero" initialData={hero}>
      <section className="relative bg-[var(--color-mavi)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-[var(--color-altin)] font-semibold text-sm uppercase tracking-widest mb-4">
              Haritailesi Vakfı
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {hero.title}{' '}
              <br className="hidden sm:block" />
              <span className="text-[var(--color-altin)]">{hero.highlight}</span>
            </h1>
            <p className="text-base sm:text-xl text-white/75 mb-10 leading-relaxed max-w-2xl">
              {hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/uye-ol" className="px-8 py-4 bg-[var(--color-altin)] hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors text-sm">
                {hero.ctaPrimary}
              </Link>
              <Link href="/hakkimizda" className="px-8 py-4 border-2 border-white/30 hover:border-white/60 text-white font-semibold rounded-xl transition-colors text-sm">
                {hero.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>
      </EditableSection>

      {/* ─── İSTATİSTİKLER ───────────────────────────────────────────────────── */}
      <EditableSection sectionKey="homepage:stats" label="İstatistikler" initialData={stats}>
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-bold text-[var(--color-mavi)]">{s.number}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </EditableSection>

      {/* ─── TOPLULUĞA KATIL ─────────────────────────────────────────────────── */}
      <EditableSection sectionKey="homepage:uyelikBolumu" label="Üyelik Bölümü" initialData={uyelikBolumu}>
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{uyelikBolumu.title}</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              {uyelikBolumu.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {UYELIK_TIPLERI.map((tip) => (
              <Link
                key={tip.href}
                href={tip.href as Route}
                className={`block rounded-2xl p-7 transition-all group border-2 ${
                  tip.ozel
                    ? 'bg-[var(--color-mavi)] text-white border-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)]'
                    : 'bg-white border-transparent hover:border-[var(--color-mavi-acik)] shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`text-lg font-bold ${tip.ozel ? 'text-white' : 'text-gray-900'}`}>{tip.baslik}</h3>
                    {tip.ozel && (
                      <span className="inline-block mt-1 bg-[var(--color-altin)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        25 Kontenjan
                      </span>
                    )}
                  </div>
                  <svg className={`w-5 h-5 shrink-0 mt-1 ${tip.ozel ? 'text-white/60' : 'text-gray-300 group-hover:text-[var(--color-mavi-acik)]'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-2 text-[var(--color-altin)]">{tip.alt}</p>
                <p className={`text-sm leading-relaxed ${tip.ozel ? 'text-white/75' : 'text-gray-500'}`}>{tip.aciklama}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/uye-ol" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-mavi)] hover:text-[var(--color-mavi-acik)] transition-colors">
              Tüm üyelik seçeneklerini gör
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      </EditableSection>

      {/* ─── PLATFORM ÖZELLİKLERİ ────────────────────────────────────────────── */}
      <EditableSection sectionKey="homepage:features" label="Özellikler" initialData={features}>
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Haritailesi&apos;nde Ne Var?</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Üyelerin için tasarlanmış, sektörün gerçek ihtiyaçlarına yönelik bir ekosistem.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={f.title} className="text-center">
                <div className="w-14 h-14 bg-blue-50 text-[var(--color-mavi)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </EditableSection>

      {/* ─── MESLEĞIN GELECEKLERİ TANITIM ──────────────────────────────────── */}
      <EditableSection sectionKey="homepage:mgTeaser" label="MG Tanıtım" initialData={mgTeaser}>
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--color-mavi)] rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 lg:p-14">
                <span className="inline-block bg-[var(--color-altin)] text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
                  Seçilmiş Program · 25 Kontenjan
                </span>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {mgTeaser.title}
                </h2>
                <p className="text-white/70 text-lg leading-relaxed mb-8">
                  {mgTeaser.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/meslegin-gelecekleri/program" className="px-6 py-3 bg-white text-[var(--color-mavi)] font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">
                    Program Hakkında
                  </Link>
                  <Link href="/meslegin-gelecekleri/basvuru" className="px-6 py-3 bg-[var(--color-altin)] text-white font-semibold rounded-xl hover:bg-yellow-600 transition-colors text-sm">
                    Başvur
                  </Link>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center p-14">
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  {['Mentorluk', 'Proje Geliştirme', 'Network', 'Eğitim'].map((item) => (
                    <div key={item} className="bg-white/10 rounded-xl p-4 text-center">
                      <span className="text-white text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </EditableSection>

      {/* ─── ETKİNLİKLER ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Yaklaşan Etkinlikler</h2>
              <p className="text-gray-500 mt-2">Sektörün buluşma noktalarında yerinizi alın.</p>
            </div>
            <Link href="/etkinlikler" className="text-sm font-semibold text-[var(--color-mavi)] hover:text-[var(--color-mavi-acik)] hidden sm:block">
              Tüm etkinlikler →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events && events.length > 0 ? (
              events.slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  href={`/etkinlikler/${event.slug}` as Route}
                  className="block bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-[var(--color-mavi-acik)] transition-all group"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-[var(--color-mavi)] bg-blue-50 px-2.5 py-1 rounded-full">
                      {EVENT_TYPE_LABELS[event.type] ?? 'Etkinlik'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-[var(--color-mavi)] transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(event.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                  {event.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{event.description}</p>
                  )}
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">Yakında etkinlikler duyurulacak.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── BAĞIŞ ───────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-mavi)] py-20 overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <svg className="w-full h-full" aria-hidden="true">
            <defs>
              <pattern id="topo-hp" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
                <ellipse cx="80" cy="80" rx="72" ry="52" fill="none" stroke="white" strokeWidth="1" />
                <ellipse cx="80" cy="80" rx="52" ry="36" fill="none" stroke="white" strokeWidth="1" />
                <ellipse cx="80" cy="80" rx="34" ry="22" fill="none" stroke="white" strokeWidth="1" />
                <ellipse cx="80" cy="80" rx="18" ry="12" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo-hp)" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-[var(--color-altin)] text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
                Yıllık Destek Programı
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                Mesleğimize Değer<br />
                <span className="text-[#66aca9]">Birlikte Katıyoruz</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
                Bireysel veya kurumsal desteğinizle Mesleğin Gelecekleri programını, mentorluk ağını ve dijital ekosistemi ayakta tutuyoruz.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/bagis"
                  className="px-8 py-4 bg-[var(--color-altin)] hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Bağış Yap
                </Link>
                <Link
                  href="/bagis#kurumsal"
                  className="px-8 py-4 border-2 border-white/30 hover:border-white/60 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  Kurumsal Destek
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎓', label: 'Mesleğin Gelecekleri', desc: 'Seçilmiş 25 öğrenciye destek' },
                { icon: '🤝', label: 'Mentorluk Ağı', desc: '200+ profesyonel, birebir destek' },
                { icon: '📡', label: 'Dijital Platform', desc: 'Ücretsiz topluluk ekosistemi' },
                { icon: '🏆', label: 'Sektör Ödülleri', desc: 'Başarıları birlikte kutluyoruz' },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                  <span className="text-2xl block mb-2">{item.icon}</span>
                  <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
                  <div className="text-xs text-white/60">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── BÜLTEN ──────────────────────────────────────────────────────────── */}
      <EditableSection sectionKey="homepage:newsletter" label="Bülten" initialData={newsletter}>
      <section className="bg-gray-900 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            {newsletter.title}
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            {newsletter.subtitle}
          </p>
          <NewsletterForm />
        </div>
      </section>
      </EditableSection>
    </>
  );
}
