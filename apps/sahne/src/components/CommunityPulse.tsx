'use client';

import { useEffect, useState } from 'react';

// ─── Bu Ayın Üyesi — editorial content ─────────────────────────────────────

const LIGHTS = [
  {
    initials: 'AK',
    color: 'bg-[#26496b]',
    name: 'Dr. Ahmet Kaya',
    title: 'Harita Mühendisi',
    city: 'Ankara',
    since: '2022',
    highlight: 'QGIS tabanlı kentsel dönüşüm analiz aracı geliştirerek 3 belediyede uygulamaya aldı.',
    level: 'Etki Üreticisi',
    levelColor: 'text-[#66aca9]',
    tags: ['CBS', 'Kentsel Planlama', 'Açık Kaynak'],
  },
];
const FEATURED = LIGHTS[0]!;

// ─── Activity feed ────────────────────────────────────────────────────────────

const ACTIVITY_SEED = [
  { id: 1, type: 'project', text: 'Yeni proje yayınlandı: "LiDAR Nokta Bulutu Segmentasyonu"', ago: '12 dk' },
  { id: 2, type: 'member', text: 'Yeni üye katıldı: Selin Öz — İzmir', ago: '28 dk' },
  { id: 3, type: 'event', text: 'Etkinliğe 14 kayıt: "QGIS Workshop — Antalya"', ago: '45 dk' },
  { id: 4, type: 'member', text: 'Yeni üye katıldı: Barış Demirtaş — İstanbul', ago: '1 sa' },
  { id: 5, type: 'project', text: 'Proje güncellendi: "CBS ile Su Havzası Yönetimi"', ago: '2 sa' },
  { id: 6, type: 'promotion', text: 'Ayşe Demir Üretici kademesine yükseldi', ago: '2 sa' },
  { id: 7, type: 'mentor', text: 'Mentorluk eşleşmesi: Mehmet Y. ↔ Zeynep K.', ago: '3 sa' },
  { id: 8, type: 'event', text: 'Canlı yayın başladı: "Kadastro Reformu Paneli"', ago: '3 sa' },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  project: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  member: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  event: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  promotion: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  mentor: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
};

const TYPE_COLOR: Record<string, string> = {
  project: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  member: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  event: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  promotion: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  mentor: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',
};

// ─── Online counter — simulated ───────────────────────────────────────────────

function useOnlineCount(base: number) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const iv = setInterval(() => {
      setCount(base + Math.floor(Math.random() * 5 - 2));
    }, 4000);
    return () => clearInterval(iv);
  }, [base]);
  return count;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommunityPulse() {
  const online = useOnlineCount(23);

  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Sol kolon: Şu an aktif + Bu Ayın Üyesi ───────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Online count */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Şu an Sahne&apos;de
                </span>
              </div>
              <div className="text-5xl font-bold text-gray-900 dark:text-slate-100 tabular-nums transition-all duration-500">
                {online}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">aktif üye</div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-slate-100">7</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">son 1 saatte</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-slate-100">41</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">son 24 saatte</div>
                </div>
              </div>
            </div>

            {/* Bu Ayın Üyesi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                    Bu Ayın Üyesi
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
                  İçerik, mentörlük, proje veya organizasyon katkısıyla öne çıkanlar.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${FEATURED.color} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                  {FEATURED.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{FEATURED.name}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">{FEATURED.title} · {FEATURED.city}</div>
                  <div className={`text-xs font-semibold mt-0.5 ${FEATURED.levelColor}`}>{FEATURED.level}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{FEATURED.highlight}</p>
              <div className="flex flex-wrap gap-1.5">
                {FEATURED.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-[#26496b]/8 text-[#26496b] dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium">
                    {t}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500">Üye {FEATURED.since}&apos;den beri</div>
            </div>
          </div>

          {/* ── Sağ kolon: Sahnede Olanlar akışı ───────────────────────── */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">Sahne&apos;de Son 24 Saat</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-500">Canlı güncelleniyor</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-800 flex-1">
              {ACTIVITY_SEED.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLOR[item.type] ?? 'bg-gray-100 text-gray-500'}`}>
                    {TYPE_ICON[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-snug">{item.text}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0 mt-0.5">{item.ago}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
              <button className="text-xs font-medium text-[#26496b] dark:text-blue-400 hover:underline">
                Tüm aktiviteyi gör →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
