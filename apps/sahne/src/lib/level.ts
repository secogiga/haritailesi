/**
 * Kanonik kademe hesaplama (API level.utils.ts ile birebir senkron).
 * d- ≥1 → etki_yaratan | c- ≥2 → katki_sunan | p- ≥3 → katilimci | else → izleyici
 */

export type LevelId = 'izleyici' | 'katilimci' | 'katki_sunan' | 'etki_yaratan';

export const LEVEL_META: Record<LevelId, { no: number; label: string; prefix: string; min: number }> = {
  izleyici:     { no: 1, label: 'Keşif',       prefix: 'v-', min: 4 },
  katilimci:    { no: 2, label: 'Katılımcı',   prefix: 'p-', min: 3 },
  katki_sunan:  { no: 3, label: 'Katkı Sunan', prefix: 'c-', min: 2 },
  etki_yaratan: { no: 4, label: 'Etki Yaratan',prefix: 'd-', min: 1 },
};

export const LEVEL_ORDER: LevelId[] = ['izleyici', 'katilimci', 'katki_sunan', 'etki_yaratan'];

export function calculateLevel(completedIds: string[]): LevelId {
  const d = completedIds.filter(id => id.startsWith('d-')).length;
  if (d >= 1) return 'etki_yaratan';
  const c = completedIds.filter(id => id.startsWith('c-')).length;
  if (c >= 2) return 'katki_sunan';
  const p = completedIds.filter(id => id.startsWith('p-')).length;
  if (p >= 3) return 'katilimci';
  return 'izleyici';
}

export function levelProgress(completedIds: string[], levelId: LevelId): { done: number; total: number; pct: number } {
  const meta = LEVEL_META[levelId];
  const done = completedIds.filter(id => id.startsWith(meta.prefix)).length;
  const total = meta.min;
  return { done, total, pct: Math.min((done / total) * 100, 100) };
}
