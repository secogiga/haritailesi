import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandsSection } from './_brands-client';

export const metadata: Metadata = {
  title: 'Mesleğe Değer Katan Markalar | Haritailesi',
  description: 'Harita, geomatik ve CBS sektörüne katkı sunan kurumsal üyeleri ve kurucu markaları keşfedin.',
};

const STATS = [
  { value: '15', label: 'Kurumsal Üye', desc: 'Aktif Üyelik' },
  { value: '15', label: 'Kurucu Marka', desc: 'İlk 100 Kontenjandan' },
  { value: '40.500+', label: 'Meslektaşa Erişim', desc: 'Topluluk Büyüklüğü' },
];

// Kurucu Marka Programı — ilk 100 markaya özel, herkes eşit (sıralama/öne çıkarma yok)
const KURUCU_TOPLAM = 100;

const KURUCU_LOGOLAR = [
  { name: 'Koordinat A.Ş.', renk: 'bg-blue-700' },  { name: 'GeoVizyon', renk: 'bg-slate-700' },
  { name: 'MapSoft', renk: 'bg-[#26496b]' },        { name: 'SkyMap İHA', renk: 'bg-gray-800' },
  { name: 'TerraTek', renk: 'bg-blue-600' },        { name: 'VeriSoft', renk: 'bg-indigo-600' },
  { name: 'DroneMap', renk: 'bg-slate-600' },       { name: 'GeoNova', renk: 'bg-teal-700' },
  { name: 'MeridyenLtd', renk: 'bg-orange-600' },   { name: 'PlanetIQ', renk: 'bg-emerald-700' },
  { name: 'TerraBuild', renk: 'bg-amber-700' },     { name: 'MapoGIS', renk: 'bg-cyan-700' },
  { name: 'SurveyTech', renk: 'bg-rose-600' },      { name: 'GeoEdu', renk: 'bg-purple-700' },
  { name: 'KadastroPlus', renk: 'bg-violet-600' },
];

// Dolu kontenjan = mevcut kurucu marka sayısı
const KURUCU_DOLU = KURUCU_LOGOLAR.length;

const NEDEN = [
  {
    baslik: 'Topluluk Görünürlüğü',
    aciklama: '40.500+ harita, geomatik ve CBS uzmanına ulaşın. Markanızı sektörün en aktif topluluğuyla buluşturun.',
    renk: 'from-[#66aca9] to-teal-700',
    vurgu: '40.500+ profesyonel',
    ikon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    baslik: 'Etkinlik & İçerik Ortaklığı',
    aciklama: 'Kongre, webinar ve çalıştaylarda sponsor veya konuşmacı olun. Sektörel içeriklerle bilinirlik inşa edin.',
    renk: 'from-amber-400 to-amber-600',
    vurgu: 'Sponsor & konuşmacı',
    ikon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    baslik: 'Yetenek Havuzuna Erişim',
    aciklama: 'Haritailesi havuzundan nitelikli adaylara ulaşın. Kariyer ilanlarınızı doğrudan sektör profesyonellerine duyurun.',
    renk: 'from-[#26496b] to-[#1a3250]',
    vurgu: 'Doğrudan işe alım',
    ikon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function MarkalarsPage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0b1829] text-white overflow-hidden">
        {/* gokdelen_yeni.png — sağ taraf, sola geçişli */}
        <div className="absolute inset-0 left-[38%]"
          style={{ backgroundImage: "url('/gokdelen_yeni.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, #0b1829 0%, #0b1829 6%, rgba(11,24,41,0.80) 42%, rgba(11,24,41,0.15) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Kurumsal Üyelik
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-5 leading-tight">
              Mesleğe Değer<br />
              <span className="text-amber-400">Katan Markalar</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Haritailesi Vakfı&apos;na, mesleğe katkı sunan ve sektörün geleceğini<br /> birlikte inşa ettiğimiz markalar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/uye-ol/kurumsal"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Kurumsal Üyelik Başvurusu
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#markalar"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors text-sm border border-white/20"
              >
                Markaları Keşfet
              </a>
            </div>
          </div>

          {/* Hero alıntı — sağ */}
          <blockquote className="hidden lg:block shrink-0 max-w-sm">
            <svg className="w-12 h-12 text-amber-400/60 mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
            </svg>
            <p className="text-xl sm:text-2xl font-medium italic text-white/90 leading-relaxed">
              İnsanlar bir şirketle aynı değerleri paylaştıklarına inanırlarsa, markaya sadık kalırlar.
            </p>
            <cite className="block mt-5 text-base font-semibold not-italic text-amber-300">— Howard Schultz</cite>
          </blockquote>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 -mt-2.5 border-t border-white/[0.12]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {STATS.map((s) => (
                <div key={s.label} className="px-6 py-7 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-amber-400 tabular-nums">{s.value}</div>
                  <div className="mt-1.5 text-sm font-semibold text-white">{s.label}</div>
                  <div className="mt-0.5 text-xs text-white/50">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Kurucu Marka Programı ───────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-amber-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Kurucu Marka Programı
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">İlk 100 markaya özel.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Haritailesi ekosistemini ilk yıl içinde destekleyen ilk 100 marka, kalıcı &quot;Kurucu Marka&quot; rozetini taşır.
            </p>
          </div>

          {/* Doluluk sayacı */}
          <div className="max-w-md mx-auto mb-10">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Kurucu Marka Kontenjanı</span>
              <span className="text-sm font-bold text-amber-600 tabular-nums">{KURUCU_DOLU} / {KURUCU_TOPLAM}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-amber-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                style={{ width: `${(KURUCU_DOLU / KURUCU_TOPLAM) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {KURUCU_TOPLAM - KURUCU_DOLU} kontenjan kaldı
            </p>
          </div>

          {/* Eşit marka şeridi — sonsuz kayan, sıralama yok */}
          <div className="marquee-pause relative overflow-hidden mb-8 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-marquee flex w-max gap-2.5">
              {[...KURUCU_LOGOLAR, ...KURUCU_LOGOLAR].map((m, i) => (
                <span
                  key={`${m.name}-${i}`}
                  className="inline-flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${m.renk} shrink-0`} />
                  {m.name}
                </span>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/uye-ol/kurumsal"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Sen de kurucu marka ol
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Ayın Markası ────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3250] to-[#26496b] shadow-xl">
            {/* Amber ışıltı */}
            <div className="absolute -top-24 -right-12 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8 p-7 sm:p-10">
              {/* Avatar */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest mb-3">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Ayın Markası
                </div>
                <div className="w-24 h-24 rounded-3xl bg-[#0e2036] ring-1 ring-amber-500/40 shadow-lg flex items-center justify-center text-white font-bold text-3xl">
                  MS
                </div>
              </div>

              {/* Bilgi */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2.5 mb-2">
                  <h3 className="text-2xl font-bold text-white">MapSoft</h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Kurucu Marka
                  </span>
                </div>
                <p className="text-white/70 leading-relaxed mb-4 max-w-2xl">
                  Yerli CBS ve harita yazılımı alanında öncü. Harita mühendisliği iş akışlarını uçtan uca dijitalleştiren çözümleriyle topluluğumuzun kurucu üyesi.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Yazılım & GIS', 'Yerli Çözüm', '15+ Yıl Deneyim'].map((tag) => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sağ */}
              <div className="shrink-0 flex flex-row lg:flex-col items-center lg:items-end gap-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Haziran 2026</span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Yazılım Bağışı
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tüm Markalar (filtrelenebilir) ──────────────────────────────── */}
      <BrandsSection />

      {/* ── Neden Kurumsal Üye? ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#66aca9] mb-3">Kurumsal Üyelik</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Neden Haritailesi&apos;nde?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Kurumsal üyelikle markanızı 40.500+ sektör profesyoneline tanıtın. Etkinliklerde görünün, yeteneklere ulaşın.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {NEDEN.map((item, i) => (
              <div
                key={item.baslik}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Üst aksan çizgisi */}
                <div className={`h-1.5 bg-gradient-to-r ${item.renk}`} />

                {/* Hover renk dolgusu */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.renk} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Köşe sıra numarası */}
                <span className="absolute top-5 right-6 z-10 text-5xl font-black text-gray-50 group-hover:text-white/20 select-none tabular-nums leading-none transition-colors duration-300">
                  0{i + 1}
                </span>

                <div className="relative z-10 p-7">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.renk} group-hover:bg-none group-hover:bg-white/20 flex items-center justify-center text-white shadow-md mb-6 group-hover:scale-110 transition-all duration-300`}>
                    {item.ikon}
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-white text-lg mb-2.5 transition-colors duration-300">{item.baslik}</h3>
                  <p className="text-sm text-gray-500 group-hover:text-white/85 leading-relaxed mb-5 transition-colors duration-300">{item.aciklama}</p>

                  {/* Vurgu çipi */}
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 group-hover:text-white bg-gray-50 group-hover:bg-white/15 border border-gray-100 group-hover:border-white/25 rounded-full px-3 py-1.5 transition-colors duration-300">
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.renk} group-hover:bg-none group-hover:bg-white`} />
                    {item.vurgu}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
