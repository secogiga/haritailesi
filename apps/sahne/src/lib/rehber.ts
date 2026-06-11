// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionCategory = 1 | 2 | 3 | 4;

export type Level = 'izleyici' | 'katilimci' | 'katki_sunan' | 'etki_yaratan';

export type MembershipTier =
  | 'visitor'
  | 'registered_user'
  | 'haritailesi_genc'
  | 'new_graduate_member'
  | 'individual_member'
  | 'corporate_member';

export interface RehberAction {
  id: string;
  label: string;
  category: ActionCategory;
  href: string;
  external?: boolean;
  icon: string;
  requiredTiers?: MembershipTier[];
  prerequisiteId?: string;
  isAhaMoment?: boolean;
}

// ─── Level config ─────────────────────────────────────────────────────────────

export const LEVEL_CONFIG: Record<Level, {
  label: string;
  color: string;
  bg: string;
  dot: string;
  microtext: string;
}> = {
  izleyici: {
    label: 'İzleyici',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    dot: 'bg-slate-400',
    microtext: 'Mesleği tanımaya başlıyorsun.',
  },
  katilimci: {
    label: 'Katılımcı',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
    microtext: 'Topluluğun içindesin, sesini duyurmaya başladın.',
  },
  katki_sunan: {
    label: 'Katkı Sunan',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    microtext: 'Bilgini paylaşıyorsun, topluluk büyüyor.',
  },
  etki_yaratan: {
    label: 'Etki Yaratan',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
    microtext: 'Topluluğun yönünü şekillendiriyorsun.',
  },
};

// ─── Tier groups ──────────────────────────────────────────────────────────────

export const MEMBER_TIERS: MembershipTier[] = [
  'haritailesi_genc',
  'new_graduate_member',
  'individual_member',
  'corporate_member',
];

const MEMBER_TIERS_SET = new Set<string>(MEMBER_TIERS);

// ─── localStorage ─────────────────────────────────────────────────────────────

export const LS_LEVEL_ACTIONS = 'sahne_level_actions';

export function loadLevelActions(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_LEVEL_ACTIONS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveLevelAction(actionId: string, current: string[]): string[] {
  if (current.includes(actionId)) return current;
  const next = [...current, actionId];
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_LEVEL_ACTIONS, JSON.stringify(next));
  }
  return next;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const MUTFAK = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';
const WEB    = process.env['NEXT_PUBLIC_WEB_URL']    ?? 'https://haritailesi.org';

export const ALL_ACTIONS: RehberAction[] = [

  // ── 1: Ziyaret ────────────────────────────────────────────────────────
  { id: 'v-etkinlikler', category: 1, icon: '📅', label: 'Etkinliklere Bak',                   href: '/etkinlikler' },
  { id: 'v-mentorluk',   category: 1, icon: '🤝', label: 'Mentorluk Alanını Keşfet',           href: '/mentorluk' },
  { id: 'v-forum',       category: 1, icon: '💬', label: 'Forumu İncele',                       href: '/forum' },
  { id: 'v-sc',          category: 1, icon: '❓', label: 'Soru & Cevap\'ı Keşfet',               href: '/soru-cevap' },
  { id: 'v-projeler',    category: 1, icon: '🗺️', label: 'Projeleri Gör',                      href: '/projeler' },
  { id: 'v-egitim',      category: 1, icon: '📚', label: 'Eğitimlere Bak',                     href: '/egitim' },
  { id: 'v-hgenc',       category: 1, icon: '🎯', label: 'Haritailesi Genç Alanı',             href: '/genc' },
  { id: 'v-ilanlar',     category: 1, icon: '📌', label: 'İlanları İncele',                    href: '/ilanlar' },
  { id: 'v-magaza',      category: 1, icon: '🛍️', label: 'Mağazayı Keşfet',                   href: '/magaza' },
  { id: 'v-anketler',    category: 1, icon: '📊', label: 'Anketlere Bak',                      href: '/anketler' },
  { id: 'v-yarisma',     category: 1, icon: '🏆', label: 'Yarışmaları Keşfet',                 href: '/yarismalar' },
  { id: 'v-sinavlar',    category: 1, icon: '📝', label: 'Sınavlara Bak',                      href: '/sinavlar' },
  { id: 'v-bagis',       category: 1, icon: '❤️', label: 'Bağış Sayfasını Gör',               href: '/bagis' },
  { id: 'v-talepler',    category: 1, icon: '📋', label: 'Haritailesi Pusula',                  href: '/haritailesipusula' },
  { id: 'v-sosyaliz',    category: 1, icon: '📢', label: 'Sosyaliz\'i Keşfet',                 href: '/sosyaliz' },
  { id: 'v-idoller',     category: 1, icon: '⭐', label: 'Mesleğin Yeni İdolleri',             href: '/meslekte-yeni-idoller' },
  { id: 'v-yetenekler',  category: 1, icon: '🌟', label: 'Yeteneklere Bak',                    href: '/yetenekler' },
  { id: 'v-haberita',    category: 1, icon: '📰', label: 'Haberita\'yı Ziyaret Et',            href: 'https://haberita.com', external: true },
  { id: 'v-kariyer',     category: 1, icon: '💼', label: 'Haritakariyer\'i Ziyaret Et',        href: 'https://www.linkedin.com/showcase/haritakariyer', external: true },
  { id: 'v-akademi',     category: 1, icon: '🎓', label: 'Haritakademi\'yi Ziyaret Et',        href: 'https://www.linkedin.com/showcase/haritakademi', external: true },
  { id: 'v-tv',          category: 1, icon: '📺', label: 'Haritailesi TV\'yi İzle',            href: 'https://www.youtube.com/@haritailesi', external: true },
  { id: 'v-vakif',       category: 1, icon: '🌐', label: 'Haritailesi Vakfı\'nı Ziyaret Et',  href: WEB, external: true },

  // ── 2: Katılmak ───────────────────────────────────────────────────────
  { id: 'p-etkinlik',  category: 2, icon: '📅', label: 'Etkinliğe Katıl',                      href: '/etkinlikler',             isAhaMoment: true },
  { id: 'p-egitim',   category: 2, icon: '📚', label: 'Eğitime Katıl',                        href: '/egitim' },
  { id: 'p-mentee',    category: 2, icon: '🎯', label: 'Mentee Ol',                             href: `${MUTFAK}/mentorluk`,      external: true, requiredTiers: MEMBER_TIERS, isAhaMoment: true },
  { id: 'p-mentor',    category: 2, icon: '🤝', label: 'Mentor Ol',                             href: `${MUTFAK}/mentorluk`,      external: true, requiredTiers: MEMBER_TIERS },
  { id: 'p-anket',     category: 2, icon: '📊', label: 'Ankete Cevap Ver',                      href: '/anketler' },
  { id: 'p-yarisma',   category: 2, icon: '🏆', label: 'Yarışmaya Katıl',                       href: '/yarismalar' },
  { id: 'p-proje',     category: 2, icon: '🗺️', label: 'Projelere Destek Ver',                 href: '/projeler' },
  { id: 'p-yetenek',   category: 2, icon: '🌟', label: 'Yeteneklere Destek Ver',               href: '/yetenekler' },
  { id: 'p-bagis',     category: 2, icon: '❤️', label: 'Bağış Yap',                            href: '/bagis' },
  { id: 'p-satin',     category: 2, icon: '🛍️', label: 'Mağazadan Satın Al',                  href: '/magaza' },
  { id: 'p-hgenc',     category: 2, icon: '🎯', label: 'Haritailesi Genç\'e Katıl',            href: '/genc', requiredTiers: ['haritailesi_genc'] },
  { id: 'p-mezun',     category: 2, icon: '🎓', label: 'Mesleğin Gelecekleri Programına Katıl', href: `${MUTFAK}/meslegin-gelecekleri/program`, external: true, requiredTiers: ['new_graduate_member'] },

  // ── 3: Oluşturmak ─────────────────────────────────────────────────────
  { id: 'c-gonderi',     category: 3, icon: '✍️', label: 'Mutfak\'ta Gönderi Paylaş',          href: MUTFAK, external: true, requiredTiers: MEMBER_TIERS, isAhaMoment: true },
  { id: 'c-forum-soru',  category: 3, icon: '❓', label: 'Forum Sorusu Aç',                    href: '/soru-cevap', requiredTiers: MEMBER_TIERS },
  { id: 'c-forum-cevap', category: 3, icon: '📚', label: 'Mutfak Kütüphanesi',                  href: '/forum', requiredTiers: MEMBER_TIERS },
  { id: 'c-sc-soru',     category: 3, icon: '🤔', label: 'S&C Sorusu Sor',                     href: '/soru-cevap', requiredTiers: MEMBER_TIERS },
  { id: 'c-sc-cevap',    category: 3, icon: '✅', label: 'S&C Cevabı Ver',                     href: '/soru-cevap', requiredTiers: MEMBER_TIERS },
  { id: 'c-haberita',    category: 3, icon: '📰', label: 'Haberita\'ya İçerik Gönder',         href: 'https://haberita.com', external: true, requiredTiers: MEMBER_TIERS },
  { id: 'c-ilan',        category: 3, icon: '📌', label: 'İlan Oluştur',                        href: '/ilanlar', requiredTiers: MEMBER_TIERS },
  { id: 'c-urun',        category: 3, icon: '🛍️', label: 'Mağazada Ürün Oluştur',             href: '/magaza', requiredTiers: ['corporate_member'] },
  { id: 'c-talep',       category: 3, icon: '📋', label: 'Talebinizi İletin',                   href: '/haritailesipusula', requiredTiers: MEMBER_TIERS },
  { id: 'c-gorus',       category: 3, icon: '💭', label: 'Görüşlerinizi Gönderin',             href: '/haritailesipusula', requiredTiers: MEMBER_TIERS },

  // ── 4: Yapmak ─────────────────────────────────────────────────────────
  { id: 'd-mentor-seans', category: 4, icon: '🤝', label: 'Mentor Seansı Gerçekleştir',        href: `${MUTFAK}/mentorluk`, external: true, requiredTiers: MEMBER_TIERS, prerequisiteId: 'p-mentor', isAhaMoment: true },
  { id: 'd-etkinlik',     category: 4, icon: '📅', label: 'Etkinlik Oluştur',                   href: '/etkinlikler', requiredTiers: MEMBER_TIERS, isAhaMoment: true },
  { id: 'd-egitim',       category: 4, icon: '📚', label: 'Eğitim Oluştur',                     href: '/egitim', requiredTiers: MEMBER_TIERS },
  { id: 'd-editor',       category: 4, icon: '✏️', label: 'Haberita Editörü Ol',               href: 'https://haberita.com', external: true, requiredTiers: MEMBER_TIERS },
  { id: 'd-kose',         category: 4, icon: '📝', label: 'Haberita Köşe Yazarı Ol',           href: 'https://haberita.com', external: true, requiredTiers: MEMBER_TIERS, prerequisiteId: 'c-haberita' },
  { id: 'd-isbirligi',    category: 4, icon: '🤝', label: 'İşbirliği Yap',                      href: '/isbirligi', requiredTiers: ['corporate_member'] },
  { id: 'd-tanitim',      category: 4, icon: '📢', label: 'Tanıtım Yap',                        href: '/sosyaliz', requiredTiers: MEMBER_TIERS },
  { id: 'd-yetenek',      category: 4, icon: '🌟', label: 'Yeteneğini Paylaş',                 href: '/yetenekler', requiredTiers: MEMBER_TIERS },
  { id: 'd-kariyer',      category: 4, icon: '⭐', label: 'Kariyer Hikayeni Paylaş',           href: '/meslekte-yeni-idoller', requiredTiers: MEMBER_TIERS },
  { id: 'd-proje',        category: 4, icon: '🗺️', label: 'Projeni Gönder',                    href: '/projeler', requiredTiers: MEMBER_TIERS, isAhaMoment: true },
];

// ─── Logic ────────────────────────────────────────────────────────────────────

export function calculateLevel(doneIds: string[]): Level {
  const done = new Set(doneIds);
  const cat4 = ALL_ACTIONS.filter(a => a.category === 4 && done.has(a.id)).length;
  if (cat4 >= 1) return 'etki_yaratan';
  const cat3 = ALL_ACTIONS.filter(a => a.category === 3 && done.has(a.id)).length;
  if (cat3 >= 2) return 'katki_sunan';
  const cat2 = ALL_ACTIONS.filter(a => a.category === 2 && done.has(a.id)).length;
  if (cat2 >= 3) return 'katilimci';
  return 'izleyici';
}

export function levelProgress(doneIds: string[]): { current: number; target: number; nextLevel: Level | null } {
  const done = new Set(doneIds);
  const level = calculateLevel(doneIds);
  if (level === 'izleyici') {
    const n = ALL_ACTIONS.filter(a => a.category === 2 && done.has(a.id)).length;
    return { current: n, target: 3, nextLevel: 'katilimci' };
  }
  if (level === 'katilimci') {
    const n = ALL_ACTIONS.filter(a => a.category === 3 && done.has(a.id)).length;
    return { current: n, target: 2, nextLevel: 'katki_sunan' };
  }
  if (level === 'katki_sunan') {
    const n = ALL_ACTIONS.filter(a => a.category === 4 && done.has(a.id)).length;
    return { current: n, target: 1, nextLevel: 'etki_yaratan' };
  }
  return { current: 1, target: 1, nextLevel: null };
}

export function canAccess(action: RehberAction, tier: string | null): boolean {
  if (action.category === 1) return true;
  if (action.category === 2) {
    if (!action.requiredTiers) return true; // no restriction → open to all
    if (!tier) return false;
    return action.requiredTiers.includes(tier as MembershipTier);
  }
  // cat 3 & 4 — members only
  if (!tier || !MEMBER_TIERS_SET.has(tier)) return false;
  if (action.requiredTiers) return action.requiredTiers.includes(tier as MembershipTier);
  return true;
}

export function getNextSuggestedAction(
  doneIds: string[],
  tier: string | null,
  level: Level,
): RehberAction | null {
  const done = new Set(doneIds);
  const targetCat: ActionCategory =
    level === 'izleyici'    ? 2 :
    level === 'katilimci'   ? 3 :
    level === 'katki_sunan' ? 4 : 4;

  const candidates = ALL_ACTIONS.filter(a =>
    a.category === targetCat &&
    !done.has(a.id) &&
    canAccess(a, tier),
  );
  return candidates.find(a => a.isAhaMoment) ?? candidates[0] ?? null;
}
