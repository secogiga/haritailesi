'use client';

import { useState } from 'react';

const MARKALAR = [
  { name: 'TerraTek', kategori: 'Ölçme', initials: 'TT', renk: 'bg-blue-600' },
  { name: 'VeriSoft', kategori: 'Yazılım', initials: 'VS', renk: 'bg-indigo-600', katki: '2 Webinar' },
  { name: 'DroneMap', kategori: 'İHA', initials: 'DM', renk: 'bg-slate-600' },
  { name: 'GeoNova', kategori: 'Danışmanlık', initials: 'GN', renk: 'bg-teal-700' },
  { name: 'MeridyenLtd', kategori: 'Ölçme', initials: 'ML', renk: 'bg-orange-600', katki: 'Eğitim Desteği' },
  { name: 'PlanetIQ', kategori: 'GIS', initials: 'PQ', renk: 'bg-emerald-700', katki: '1 Etkinlik Sponsorluğu' },
  { name: 'TerraBuild', kategori: 'İnşaat', initials: 'TB', renk: 'bg-amber-700' },
  { name: 'MapoGIS', kategori: 'GIS', initials: 'MG', renk: 'bg-cyan-700' },
  { name: 'SurveyTech', kategori: 'Ölçme', initials: 'ST', renk: 'bg-rose-600' },
  { name: 'GeoEdu', kategori: 'Eğitim', initials: 'GE', renk: 'bg-purple-700' },
  { name: 'KadastroPlus', kategori: 'Yazılım', initials: 'KP', renk: 'bg-violet-600', katki: 'Kongre Sponsoru' },
  { name: 'İnşaölçüm A.Ş.', kategori: 'İnşaat', initials: 'İÖ', renk: 'bg-yellow-700' },
  { name: 'HaritaKom', kategori: 'Danışmanlık', initials: 'HK', renk: 'bg-sky-700', katki: 'Yazılım Bağışı' },
  { name: 'NetGeo', kategori: 'GIS', initials: 'NG', renk: 'bg-lime-700' },
  { name: 'YerKüre Ölçüm', kategori: 'Ölçme', initials: 'YK', renk: 'bg-blue-800' },
];

const KATEGORILER = ['Tümü', 'Ölçme', 'Yazılım', 'İHA', 'GIS', 'Eğitim', 'İnşaat', 'Danışmanlık', 'Diğer'];

export function BrandsSection() {
  const [aktif, setAktif] = useState('Tümü');
  const filtered = (aktif === 'Tümü' ? MARKALAR : MARKALAR.filter(m => m.kategori === aktif))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  return (
    <section id="markalar" className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Kurumsal Üyeler
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Mesleğe Değer Katan Markalar</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Sektöre katkı sunan, eğitimleri, etkinlikleri ve mesleğin gelişimini destekleyen kurumsal üyelerimiz.
            Şu an <span className="font-semibold text-amber-600">{MARKALAR.length} marka</span> ailenin bir parçası.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {KATEGORILER.map((kat) => (
            <button
              key={kat}
              onClick={() => setAktif(kat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                aktif === kat
                  ? 'bg-[#26496b] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((marka) => (
              <div
                key={marka.name}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-[#66aca9]/10 hover:border-[#66aca9]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl ${marka.renk} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {marka.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{marka.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-400">{marka.kategori}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100 font-medium">Kurumsal Üye</span>
                  </div>
                </div>
                {marka.katki && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {marka.katki}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-gray-400">
            Bu kategoride henüz üye bulunmuyor.
          </div>
        )}
      </div>
    </section>
  );
}
