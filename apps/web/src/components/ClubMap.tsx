'use client';

import { useEffect, useRef } from 'react';

interface Club {
  id: string; name: string; slug: string; university: string; city: string;
  memberCount: number; description: string | null;
  contactEmail: string; contactPhone: string | null; website: string | null;
}

const CITY_COORDS: Record<string, [number, number]> = {
  'İstanbul': [41.015, 28.98],
  'Ankara':   [39.925, 32.865],
  'İzmir':    [38.418, 27.128],
  'Bursa':    [40.183, 29.067],
  'Antalya':  [36.897, 30.713],
  'Adana':    [37.001, 35.321],
  'Konya':    [37.871, 32.485],
  'Trabzon':  [41.002, 39.717],
  'Samsun':   [41.286, 36.33],
  'Eskişehir':[39.776, 30.52],
  'Erzurum':  [39.905, 41.267],
  'Kayseri':  [38.731, 35.487],
};

const CLUB_COLORS: Record<string, string> = {
  'itu-haritacilik-jeodezi':   '#3b82f6',
  'odtu-cbs-toplulugu':        '#10b981',
  'iyte-jeodezi-fotogrametri': '#8b5cf6',
};

// Hesaplanan centroid yanlış düşen iller için manuel düzeltme
const LABEL_OVERRIDES: Record<string, [number, number]> = {
  'Balıkesir': [39.66, 28.10],
  'Muğla':     [37.20, 28.55],
  'Antalya':   [37.10, 31.10],
  'Konya':     [37.85, 32.30],
  'Adana':     [37.40, 35.40],
  'Şanlıurfa': [37.00, 38.90],
  'Çanakkale': [40.05, 27.10],
};

function getColor(slug: string) {
  return CLUB_COLORS[slug] ?? '#26496b';
}

const TURKEY_BOUNDS: [[number, number], [number, number]] = [
  [35.8, 25.6],
  [42.2, 44.8],
];

export default function ClubMap({ clubs }: { clubs: Club[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef   = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<unknown>(null);

  useEffect(() => {
    const el      = containerRef.current;
    const overlay = overlayRef.current;
    if (!el || !overlay) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((el as any)._leaflet_id) return;

    let destroyed = false;

    Promise.all([
      import('leaflet'),
      fetch('/tr-cities.json').then(r => r.json()),
    ]).then(([L, geoData]) => {
      if (destroyed || !el || !overlay) return;
      const ov = overlay;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((el as any)._leaflet_id) return;

      const map = L.map(el, {
        dragging: false,
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        attributionControl: false,
      });

      map.fitBounds(TURKEY_BOUNDS);
      map.setMaxBounds(TURKEY_BOUNDS);
      map.setMinZoom(map.getZoom());
      map.setMaxZoom(map.getZoom());
      mapRef.current = map;

      // city → club lookup
      const cityMap: Record<string, Club> = {};
      clubs.forEach(c => { cityMap[c.city] = c; });

      // En büyük polygon ring'inin koordinat ortalaması
      function ringCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coords = (geometry as any).coordinates as unknown;
        let ring: number[][] = [];
        if (geometry.type === 'Polygon') {
          ring = ((coords as number[][][])[0]) ?? [];
        } else if (geometry.type === 'MultiPolygon') {
          let max = 0;
          for (const poly of (coords as number[][][][])) {
            const outer = poly[0] ?? [];
            if (outer.length > max) { max = outer.length; ring = outer; }
          }
        }
        if (!ring.length) return null;
        let lng = 0, lat = 0;
        for (const pt of ring) { lng += pt[0] ?? 0; lat += pt[1] ?? 0; }
        return [lat / ring.length, lng / ring.length];
      }

      // GeoJSON il katmanı + SVG path referansları
      const provincePaths: Record<string, SVGPathElement> = {};

      const geoLayer = L.geoJSON(geoData as GeoJSON.FeatureCollection, {
        style: (feature) => {
          const cityName = feature?.properties?.name as string | undefined;
          const club = cityName ? cityMap[cityName] : undefined;
          if (club) {
            const color = getColor(club.slug);
            return { fillColor: color, fillOpacity: 0.22, color, weight: 1.8, opacity: 0.6 };
          }
          return { fillColor: '#e2e8f0', fillOpacity: 0.7, color: '#cbd5e1', weight: 0.8, opacity: 1 };
        },
      }).addTo(map);

      // Path ref'lerini topla (addTo sonrası _path set edilir)
      geoLayer.eachLayer((layer) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (layer as any).feature?.properties?.name as string | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const path = (layer as any)._path as SVGPathElement | undefined;
        if (name && path) provincePaths[name] = path;
      });

      // İl adı marker'ları
      (geoData as GeoJSON.FeatureCollection).features.forEach((feature) => {
        const name = feature?.properties?.name as string | undefined;
        if (!name) return;
        const center: [number, number] = LABEL_OVERRIDES[name] ?? (ringCentroid(feature.geometry) ?? [0, 0]);
        if (!center[0] && !center[1]) return;
        L.marker(center, {
          icon: L.divIcon({
            className: 'province-label',
            html: name,
            iconSize: [60, 12],
            iconAnchor: [30, 6],
          }),
          interactive: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          keyboard: false as any,
        }).addTo(map);
      });

      // Tüm province animasyonlarını sıfırla
      function deactivateAll() {
        Object.values(provincePaths).forEach(path => {
          path.classList.remove('province-active');
        });
      }

      // Kart + animasyon kapat
      function closeAllCards() {
        ov.querySelectorAll('.club-custom-card').forEach(n => n.remove());
        deactivateAll();
      }
      map.on('click', closeAllCards);

      // Marker + kart + province animasyonu
      clubs.forEach((club) => {
        const coords = CITY_COORDS[club.city];
        if (!coords) return;

        const color = getColor(club.slug);

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="
                width:36px;height:36px;border-radius:50%;
                background:${color};border:3px solid white;
                box-shadow:0 3px 10px rgba(0,0,0,0.25);
                display:flex;align-items:center;justify-content:center;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="2" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <ellipse cx="12" cy="12" rx="4.5" ry="10"/>
                </svg>
              </div>
              <div style="width:3px;height:7px;background:${color};border-radius:0 0 2px 2px;"></div>
            </div>
          `,
          iconSize: [36, 44],
          iconAnchor: [18, 44],
        });

        const marker = L.marker(coords, { icon });

        marker.on('click', function (e) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          L.DomEvent.stopPropagation(e as any);
          closeAllCards();

          // Province 3D rise animasyonu
          const path = provincePaths[club.city];
          if (path) {
            void (path as unknown as HTMLElement).offsetWidth; // animasyonu yeniden başlatmak için reflow
            path.classList.add('province-active');
          }

          const pt = map.latLngToContainerPoint(L.latLng(coords));

          const card = document.createElement('div');
          card.className = 'club-custom-card';
          card.style.cssText = `
            position:absolute;
            left:${pt.x}px;
            top:${pt.y + 10}px;
            transform:translateX(-50%);
            z-index:1000;
            pointer-events:auto;
          `;
          card.innerHTML = `
            <div style="
              background:white;
              border:1px solid #e5e7eb;
              border-radius:14px;
              box-shadow:0 6px 24px rgba(0,0,0,0.14);
              padding:12px 14px;
              min-width:185px;
              max-width:215px;
              position:relative;
            ">
              <div style="
                position:absolute;top:-6px;left:50%;transform:translateX(-50%);
                width:0;height:0;
                border-left:6px solid transparent;
                border-right:6px solid transparent;
                border-bottom:6px solid white;
                filter:drop-shadow(0 -1px 0 #e5e7eb);
              "></div>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;align-items:flex-start;gap:9px;">
                  <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;margin-top:3px;"></div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:12.5px;color:#111;line-height:1.3;word-break:break-word;">${club.name}</div>
                    <div style="font-size:10.5px;color:#888;margin-top:2px;">${club.university} · ${club.city}</div>
                  </div>
                </div>
                <a href="/genc/ogrenci-kulupler/${club.slug}" style="
                  display:block;text-align:center;
                  padding:7px 10px;border-radius:9px;
                  font-size:11.5px;font-weight:600;
                  color:white;text-decoration:none;
                  background:${color};
                  cursor:pointer;
                ">Kulüp Sayfasına Git →</a>
              </div>
            </div>
          `;

          ov.appendChild(card);
        });

        marker.addTo(map);
      });
    }).catch(() => { /* GeoJSON yüklenemezse sessizce geç */ });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`
        .leaflet-container {
          background: #eef2f7 !important;
          cursor: default !important;
        }
        .leaflet-marker-icon { cursor: pointer !important; }

        .province-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          font-size: 7.5px !important;
          font-weight: 600 !important;
          color: #475569 !important;
          white-space: nowrap !important;
          pointer-events: none !important;
          text-align: center !important;
          line-height: 12px !important;
          text-shadow: 0 0 4px #eef2f7, 0 0 4px #eef2f7, 0 0 4px #eef2f7 !important;
        }

        @keyframes province-rise {
          0%   { transform: scale(1)    translateY(0px);  filter: drop-shadow(0 0px 0px rgba(0,0,0,0)); }
          100% { transform: scale(1.05) translateY(-7px); filter: drop-shadow(0 12px 16px rgba(0,0,0,0.22)); }
        }
        .province-active {
          transform-box: fill-box;
          transform-origin: center;
          animation: province-rise 2s ease-out forwards;
        }
      `}</style>
      <div style={{ position: 'relative', height: '420px', width: '100%', overflow: 'visible' }}>
        <div ref={containerRef} style={{ height: '420px', width: '100%' }} />
        <div ref={overlayRef}   style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }} />
      </div>
    </>
  );
}
