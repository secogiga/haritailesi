'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { StudentClub } from '@/lib/api';

function ClubCard({ club }: { club: StudentClub }) {
  const faaliyetler = club.activities
    ? club.activities.split(/[,;]/).map((a) => a.trim()).filter(Boolean).slice(0, 4)
    : [];

  const iconBtn = 'w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors';

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Kapak */}
      <div className="relative h-24 bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <svg viewBox="0 0 400 100" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="320" cy="48" rx="130" ry="58" stroke="white" strokeWidth="1.3" />
            <ellipse cx="320" cy="48" rx="88" ry="39" stroke="white" strokeWidth="1" />
            <ellipse cx="320" cy="48" rx="48" ry="21" stroke="white" strokeWidth="1" />
          </svg>
        </div>
        {club.memberCount > 0 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full border border-white/25">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {club.memberCount}
          </span>
        )}
        <span className="absolute bottom-3 left-4 inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {club.city}
        </span>
      </div>

      {/* Avatar */}
      <div className="px-6 -mt-7 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 ring-4 ring-white dark:ring-slate-900 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
      </div>

      <div className="px-6 pt-3 pb-6 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base leading-snug">{club.name}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{club.university}</p>

        {club.description && (
          <p className="mt-3 text-sm text-gray-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {club.description}
          </p>
        )}

        {faaliyetler.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {faaliyetler.map((a) => (
              <span key={a} className="text-[11px] px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium">
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400 dark:text-slate-500 truncate">Sorumlu: {club.contactName}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <a href={`mailto:${club.contactEmail}`} className={iconBtn} title="E-posta" aria-label="E-posta">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
            {club.contactPhone && (
              <a href={`tel:${club.contactPhone}`} className={iconBtn} title={club.contactPhone} aria-label="Telefon">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            )}
            {club.website && (
              <a href={club.website} target="_blank" rel="noopener noreferrer" className={iconBtn} title="Web sitesi" aria-label="Web sitesi">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddClubCard() {
  return (
    <Link href="/kulubu-ekle" className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[260px]">
      <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
        <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">Kulübünüzü Ekleyin</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">Haritailesi&apos;ne bağlanın</p>
      </div>
      <span className="px-5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-xl group-hover:border-emerald-400 transition-colors">
        Başvur →
      </span>
    </Link>
  );
}

export function ClubsClient({ clubs }: { clubs: StudentClub[] }) {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('Tümü');

  const cities = useMemo(
    () => ['Tümü', ...Array.from(new Set(clubs.map((c) => c.city))).sort((a, b) => a.localeCompare(b, 'tr'))],
    [clubs],
  );

  // Ayın Kulübü = en çok üyeli kulüp
  const ayinKulubu = useMemo(
    () => (clubs.length ? [...clubs].sort((a, b) => b.memberCount - a.memberCount)[0] : null),
    [clubs],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLocaleLowerCase('tr');
    return clubs.filter(
      (c) =>
        (city === 'Tümü' || c.city === city) &&
        (t === '' || `${c.name} ${c.university} ${c.city}`.toLocaleLowerCase('tr').includes(t)),
    );
  }, [clubs, q, city]);

  if (clubs.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
        <div className="text-5xl mb-4">🎓</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Kulübünüzü ekleyin</h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
          Üniversitenizin haritacılık kulübü henüz burada yok. Kulübünüzü ekleyerek Haritailesi topluluğuyla bağlantı kurun.
        </p>
        <Link href="/kulubu-ekle" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
          Kulübümü Ekle
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Ayın Kulübü spotlight */}
      {ayinKulubu && (
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 sm:p-7 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-widest shrink-0 w-fit">
              ⭐ Ayın Kulübü
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold">{ayinKulubu.name}</h3>
              <p className="text-white/70 text-sm">{ayinKulubu.university} · {ayinKulubu.city} · {ayinKulubu.memberCount} üye</p>
            </div>
            <a href={`mailto:${ayinKulubu.contactEmail}`} className="shrink-0 px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-xl transition-colors w-fit">
              İletişime Geç
            </a>
          </div>
        </div>
      )}

      {/* Arama + şehir filtresi */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kulüp veya üniversite ara…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                city === c ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Sonuçlar */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 dark:text-slate-500">
          Aramanızla eşleşen kulüp bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
          <AddClubCard />
        </div>
      )}
    </div>
  );
}
