/**
 * Fetches Turkey provinces GeoJSON from alpers/Turkey-Maps-GeoJSON and
 * converts each province polygon to SVG path strings.
 *
 * Output: apps/sahne/src/components/turkey-paths.ts
 *
 * Usage: node scripts/generate-turkey-paths.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Projection ─────────────────────────────────────────────────────────────
// Turkey bounding box (WGS84):
//   Lon: 25.668 – 44.834
//   Lat: 35.815 – 42.107
// We use a simple equirectangular projection with a small padding.

const LON_MIN = 25.5;
const LON_MAX = 45.0;
const LAT_MIN = 35.6;
const LAT_MAX = 42.3;

const W = 780;   // SVG viewBox width
const H = 430;   // SVG viewBox height
const PAD = 8;   // padding

function project(lon, lat) {
  const x = PAD + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (W - PAD * 2);
  // Latitude is inverted (SVG y axis goes down)
  const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (H - PAD * 2);
  return [x, y];
}

// ── Path builder ───────────────────────────────────────────────────────────

function ringToPath(ring) {
  const pts = ring.map(([lon, lat]) => {
    const [x, y] = project(lon, lat);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return 'M' + pts.join('L') + 'Z';
}

function polygonToPath(coordinates) {
  // Only use outer ring (coordinates[0]), ignore holes
  return ringToPath(coordinates[0]);
}

function geometryToPath(geometry) {
  if (geometry.type === 'Polygon') {
    return polygonToPath(geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    // Join all polygons
    return geometry.coordinates.map((poly) => polygonToPath(poly)).join(' ');
  }
  return '';
}

// ── Centroid helper (for label/pin placement) ──────────────────────────────

function ringCentroid(ring) {
  let x = 0, y = 0;
  for (const [lon, lat] of ring) {
    x += lon;
    y += lat;
  }
  return [x / ring.length, y / ring.length];
}

function geometryCentroid(geometry) {
  if (geometry.type === 'Polygon') {
    const [cx, cy] = ringCentroid(geometry.coordinates[0]);
    return project(cx, cy);
  }
  if (geometry.type === 'MultiPolygon') {
    // Use the largest polygon (most coordinates)
    const largest = geometry.coordinates.reduce((a, b) =>
      a[0].length > b[0].length ? a : b
    );
    const [cx, cy] = ringCentroid(largest[0]);
    return project(cx, cy);
  }
  return [0, 0];
}

// ── Fetch & process ────────────────────────────────────────────────────────

const URL = 'https://raw.githubusercontent.com/alpers/Turkey-Maps-GeoJSON/master/tr-cities.json';

console.log('Fetching GeoJSON…');
const res = await fetch(URL);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const geojson = await res.json();

console.log(`Processing ${geojson.features.length} provinces…`);

const provinces = geojson.features.map((feature) => {
  const name = feature.properties.name;
  const number = feature.properties.number;
  const path = geometryToPath(feature.geometry);
  const [cx, cy] = geometryCentroid(feature.geometry);
  return { name, number, path, cx: +cx.toFixed(1), cy: +cy.toFixed(1) };
});

// ── Output TypeScript file ─────────────────────────────────────────────────

const lines = [
  '// AUTO-GENERATED — run `node scripts/generate-turkey-paths.mjs` to regenerate',
  '// Source: https://github.com/alpers/Turkey-Maps-GeoJSON (Apache-2.0)',
  '',
  'export interface ProvinceShape {',
  '  name: string;',
  '  number: number;',
  '  path: string;',
  '  cx: number; // label/pin x (SVG coords, viewBox 0 0 780 430)',
  '  cy: number; // label/pin y',
  '}',
  '',
  'export const TURKEY_PROVINCES: ProvinceShape[] = [',
  ...provinces.map((p) =>
    `  { name: ${JSON.stringify(p.name)}, number: ${p.number}, cx: ${p.cx}, cy: ${p.cy}, path: ${JSON.stringify(p.path)} },`
  ),
  '];',
];

const outPath = join(ROOT, 'apps/sahne/src/components/turkey-paths.ts');
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`✓ Written to ${outPath}`);
