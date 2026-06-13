/**
 * Kanonik kademe hesaplama — hem admin controller hem users service kullanır.
 * Prefix-tabanlı: d- ≥1 → etki_yaratan, c- ≥2 → katki_sunan, p- ≥3 → katilimci, else → izleyici
 */

export type LevelId = 'izleyici' | 'katilimci' | 'katki_sunan' | 'etki_yaratan';

export const LEVEL_THRESHOLDS = [
  { id: 'etki_yaratan' as LevelId, prefix: 'd-', min: 1 },
  { id: 'katki_sunan'  as LevelId, prefix: 'c-', min: 2 },
  { id: 'katilimci'    as LevelId, prefix: 'p-', min: 3 },
] as const;

export function calculateLevel(completedIds: string[]): LevelId {
  const d = completedIds.filter(id => id.startsWith('d-')).length;
  if (d >= 1) return 'etki_yaratan';
  const c = completedIds.filter(id => id.startsWith('c-')).length;
  if (c >= 2) return 'katki_sunan';
  const p = completedIds.filter(id => id.startsWith('p-')).length;
  if (p >= 3) return 'katilimci';
  return 'izleyici';
}

export const VALID_ACTION_IDS = new Set<string>([
  // Keşif (v-)
  'v-vakif', 'v-tv', 'v-bagis', 'v-talepler', 'v-sosyaliz', 'v-kariyer',
  'v-haberita', 'v-egitim', 'v-etkinlikler', 'v-ilanlar', 'v-magaza',
  'v-hgenc', 'v-mentorluk', 'v-idoller', 'v-akademi', 'v-sinavlar',
  'v-yarisma', 'v-anketler', 'v-yetenekler', 'v-projeler', 'v-forum',
  // Katılım (p-)
  'p-mentor', 'p-proje', 'p-yetenek', 'p-hgenc', 'p-mezun', 'p-mentee',
  'p-bagis', 'p-satin', 'p-etkinlik', 'p-anket', 'p-yarisma',
  // Katkı (c-)
  'c-gonderi', 'c-sc-cevap', 'c-forum-cevap', 'c-gorus', 'c-haberita',
  'c-ilan', 'c-urun', 'c-talep', 'c-sc-soru', 'c-forum-soru',
  // Etki (d-)
  'd-mentor-seans', 'd-proje', 'd-egitim', 'd-etkinlik', 'd-editor',
  'd-tanitim', 'd-kariyer', 'd-isbirligi', 'd-kose', 'd-yetenek',
]);
