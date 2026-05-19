'use client';

import { useState } from 'react';
import { TURKEY_PROVINCES } from './turkey-paths';

// ─── Name normalization ───────────────────────────────────────────────────────
// GeoJSON uses some shortened names; map DB city names to GeoJSON province names.

const DB_TO_GEO: Record<string, string> = {
  Afyonkarahisar: 'Afyon',
};

function toGeoName(city: string): string {
  return DB_TO_GEO[city] ?? city;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemberCityStat = {
  city: string;
  count: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TurkeyMap({ members = [] }: { members?: MemberCityStat[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Build province → member count map
  const provMap = new Map<string, number>();
  let totalMembers = 0;
  for (const m of members) {
    const geoName = toGeoName(m.city);
    provMap.set(geoName, (provMap.get(geoName) ?? 0) + m.count);
    totalMembers += m.count;
  }

  const maxCount = Math.max(...Array.from(provMap.values()), 1);
  const hasData = provMap.size > 0;

  const hovCount = hovered ? provMap.get(hovered) : undefined;
  const hovProv = hovered ? TURKEY_PROVINCES.find((p) => p.name === hovered) : undefined;

  return (
    <div className="relative select-none">
      <style>{`
        @keyframes map-ring-pulse {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 0.5; }
        }
        .map-ring-pulse { animation: map-ring-pulse 2.4s ease-in-out infinite; }
      `}</style>

      <svg
        viewBox="0 0 780 430"
        className="w-full h-auto"
        aria-label="Türkiye üye dağılım haritası"
      >
        <defs>
          <filter id="prov-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="badge-grad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#7fcfcc" />
            <stop offset="100%" stopColor="#26496b" />
          </radialGradient>
          <radialGradient id="badge-grad-hov" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#4a9490" />
            <stop offset="100%" stopColor="#1d3a57" />
          </radialGradient>
        </defs>

        {TURKEY_PROVINCES.map((prov) => {
          const memberCount = provMap.get(prov.name);
          const isActive = !!memberCount;
          const isHov = prov.name === hovered;

          // Intensity: more members → deeper teal
          const intensity = isActive ? memberCount! / maxCount : 0;
          let fill: string;
          if (isHov && isActive)     fill = '#1d3a57';
          else if (isHov)            fill = '#b8d0e8';
          else if (isActive) {
            // Interpolate between light teal and dark teal based on intensity
            const alpha = Math.round(40 + intensity * 160);
            fill = `rgba(102,172,169,${(alpha / 255).toFixed(2)})`;
          } else {
            fill = '#dce8f5';
          }

          const badgeR = isActive ? Math.max(7, Math.min(14, 7 + Math.sqrt(memberCount! / maxCount) * 8)) : 0;

          return (
            <g
              key={prov.name}
              onMouseEnter={() => setHovered(prov.name)}
              onMouseLeave={() => setHovered(null)}
              className={isActive ? 'cursor-pointer' : 'cursor-default'}
            >
              <path
                d={prov.path}
                fill={fill}
                stroke={isHov ? '#26496b' : '#a8c4d8'}
                strokeWidth={isHov ? '1.2' : '0.6'}
                strokeLinejoin="round"
                filter={isHov && isActive ? 'url(#prov-glow)' : undefined}
                className="transition-colors duration-150"
              />

              {isActive && memberCount && (
                <>
                  {!isHov && (
                    <circle
                      cx={prov.cx}
                      cy={prov.cy}
                      r={badgeR + 5}
                      fill="none"
                      stroke="#66aca9"
                      strokeWidth="1.5"
                      className="map-ring-pulse"
                    />
                  )}
                  <circle
                    cx={prov.cx}
                    cy={prov.cy}
                    r={badgeR}
                    fill={isHov ? 'url(#badge-grad-hov)' : 'url(#badge-grad)'}
                    className="transition-all duration-150"
                  />
                  <text
                    x={prov.cx}
                    y={prov.cy + 4}
                    textAnchor="middle"
                    fontSize={memberCount > 99 ? '6' : memberCount > 9 ? '7' : '8.5'}
                    fill="white"
                    fontWeight="700"
                    fontFamily="system-ui"
                    className="pointer-events-none"
                  >
                    {memberCount}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip — active province */}
      {hovered && hovCount && (
        <div className="absolute top-3 right-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl px-4 py-3 text-sm pointer-events-none min-w-[150px]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#26496b] shrink-0" />
            <span className="font-bold text-gray-900 dark:text-slate-100">{hovered}</span>
          </div>
          <div className="text-[#66aca9] font-semibold text-base">
            {hovCount} üye
          </div>
        </div>
      )}

      {/* Tooltip — inactive province */}
      {hovered && !hovCount && (
        <div className="absolute top-3 right-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-100 dark:border-slate-700 rounded-xl shadow px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 pointer-events-none">
          {hovered} — üye yok
        </div>
      )}

      {/* Legend */}
      {hasData && (
        <div className="absolute bottom-2 left-3 flex flex-wrap items-center gap-3 text-[10px] text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded" style={{ background: 'rgba(102,172,169,0.9)' }} />
            Üye olan il
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#dce8f5]" />
            Üye yok
          </span>
          {totalMembers > 0 && (
            <span className="ml-1 font-semibold text-[#26496b] dark:text-blue-400">
              Toplam {totalMembers} üye · {provMap.size} şehir
            </span>
          )}
        </div>
      )}

      {!hasData && (
        <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-white/70 dark:bg-slate-900/70 px-3 py-1.5 rounded-full">
            Üye verisi yükleniyor…
          </span>
        </div>
      )}
    </div>
  );
}
