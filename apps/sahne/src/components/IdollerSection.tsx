import { IdolCard, type Idol } from './IdolCard';

const SEED_IDOLS: Idol[] = [
  {
    id: '1',
    name: 'Dr. Mete Ercan Pakdil',
    title: 'Dr. Harita Mühendisi',
    organization: 'Mott MacDonald · İngiltere',
    mediaUrl: 'https://youtu.be/_c80uftW368?si=a75lZunVTTwxVo6D',
    description:
      'İngiltere\'de Mott MacDonald\'da Coğrafi Bilgi Sistemleri üzerine çalışan Dr. Harita Mühendisi Mete Ercan Pakdil, "Meslekte Yeni İdoller"in ilk konuğu.',
  },
];

async function fetchIdols(): Promise<Idol[]> {
  try {
    const res = await fetch(
      `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/api/v1/cms/settings/meslekte_yeni_idoller`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return SEED_IDOLS;
    const data = (await res.json()) as { idols?: Idol[] } | null;
    if (data?.idols && data.idols.length > 0) return data.idols;
  } catch {
    // fall through
  }
  return SEED_IDOLS;
}

export default async function IdollerSection() {
  const IDOLS = await fetchIdols();
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-[#070c1a] border-b border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Başlık */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Meslekte Yeni İdoller
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              Mesleğimizin yeni usta çırak dönemini kuruyoruz.
            </h2>
            <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Bir öğrenci, bir yeni mezun, bir örnek insan arar ve bir meslektaşını idol alır.<br />
              <span className="font-semibold text-gray-700 dark:text-slate-300">Haritailesi Vakfı</span>{' '}
              gençlerimize örnek olacak{' '}
              <span className="font-semibold text-gray-700 dark:text-slate-300">
                &ldquo;Meslekte Yeni İdoller&rdquo;
              </span>
              ini iftiharla sunar.
            </p>
          </div>
          <a
            href="https://www.youtube.com/@haritailesi"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Haritailesi TV →
          </a>
        </div>

        {/* Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {IDOLS.map((idol) => (
            <IdolCard key={idol.id} idol={idol} />
          ))}

          {/* Boş slot — daha fazlası gelecek */}
          {IDOLS.length < 4 && Array.from({ length: Math.min(3, 4 - IDOLS.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="relative flex flex-col items-center justify-center rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/10 dark:to-slate-900 p-8 text-center min-h-[280px] overflow-hidden"
            >
              {/* Dekoratif arka plan yıldızları */}
              <svg className="absolute top-4 right-5 w-4 h-4 text-amber-200 dark:text-amber-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-5 left-4 w-3 h-3 text-amber-200 dark:text-amber-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>

              <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 shadow-sm flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">
                Yeni İdol Yakında!
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-500/70 leading-snug">
                Bir sonraki ilham<br />verici isim geliyor…
              </p>
            </div>
          ))}
        </div>

        {/* Alt not */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-slate-500">
          Bu isimler aynı zamanda{' '}
          <span className="font-semibold text-gray-500 dark:text-slate-400">Haritailesi Mentörlük Programı</span>
          {' '}mentörlerimizdir.
        </p>
      </div>
    </section>
  );
}
