import type { MutfakTierActions } from './api';

export type TierCfg = { label: string; short: string; color: string; bg: string; ring: string; accent: string };
export type ActionCfgItem = { key: keyof MutfakTierActions; label: string; icon: string; color: string; solid: string; group: string };

export const TIER_CFG: Record<string, TierCfg> = {
  registered_user:     { label: 'Sahne Üyesi',               short: 'Sahne',  color: '#64748b', bg: 'bg-slate-50',  ring: 'ring-slate-300',  accent: 'text-slate-600'  },
  haritailesi_genc:    { label: 'Haritailesi Genç',           short: 'H.Genç', color: '#0d9488', bg: 'bg-teal-50',   ring: 'ring-teal-300',   accent: 'text-teal-700'   },
  new_graduate_member: { label: 'Mesleğin Geleceği',          short: 'M.Gel.', color: '#f97316', bg: 'bg-orange-50', ring: 'ring-orange-300', accent: 'text-orange-700' },
  individual_member:   { label: 'Mesleğin Değer Ortağı',      short: 'M.D.O.', color: '#3b82f6', bg: 'bg-blue-50',   ring: 'ring-blue-300',   accent: 'text-blue-700'   },
  corporate_member:    { label: 'Mesleğe Değer Katan Marka',  short: 'Marka',  color: '#8b5cf6', bg: 'bg-violet-50', ring: 'ring-violet-300', accent: 'text-violet-700' },
};

export const TIER_ORDER = [
  'registered_user', 'haritailesi_genc', 'new_graduate_member', 'individual_member', 'corporate_member',
] as const;

export const ACTION_CFG: ActionCfgItem[] = [
  { key: 'visitHaberita',          label: 'Haberita',        icon: '📰', color: 'bg-slate-300',   solid: '#cbd5e1', group: 'Ziyaret' },
  { key: 'visitHaritakariyer',     label: 'Kariyer',         icon: '💼', color: 'bg-slate-300',   solid: '#cbd5e1', group: 'Ziyaret' },
  { key: 'visitHaritakademi',      label: 'Kademi',          icon: '🏫', color: 'bg-slate-300',   solid: '#cbd5e1', group: 'Ziyaret' },
  { key: 'visitHaritailesiTV',     label: 'TV',              icon: '📺', color: 'bg-slate-300',   solid: '#cbd5e1', group: 'Ziyaret' },
  { key: 'visitReklam',            label: 'Reklam',          icon: '📣', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitForum',             label: 'Forum',           icon: '🗨️', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitMentorluk',         label: 'Mentorluk',       icon: '🎓', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitSoruCevap',         label: 'S&C',             icon: '❓', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitAnketler',          label: 'Anketler',        icon: '📊', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitHaritailesiVakfi',  label: 'Vakıf',           icon: '🏛️', color: 'bg-slate-300',   solid: '#cbd5e1', group: 'Ziyaret' },
  { key: 'visitMutfak',            label: 'Mutfak',          icon: '🔒', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitMagaza',            label: 'Mağaza',          icon: '🛍️', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitEgitimler',         label: 'Eğitimler',       icon: '🎯', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitEtkinlikler',       label: 'Etkinlikler',     icon: '📅', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitTalepGorus',        label: 'Talep',           icon: '📬', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitBagis',             label: 'Bağış',           icon: '❤️', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitIlanPanosu',        label: 'İlan',            icon: '🏷️', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitHaritailesiGenc',   label: 'H.Genç',          icon: '🌱', color: 'bg-slate-300',   solid: '#cbd5e1', group: 'Ziyaret' },
  { key: 'visitYarismalar',        label: 'Yarışma',         icon: '🏆', color: 'bg-slate-400',   solid: '#94a3b8', group: 'Ziyaret' },
  { key: 'visitSinavlar',          label: 'Sınavlar',        icon: '📝', color: 'bg-slate-300',   solid: '#cbd5e1', group: 'Ziyaret' },
  { key: 'posts',                  label: 'Gönderi',         icon: '✍️', color: 'bg-blue-400',    solid: '#60a5fa', group: 'Feed' },
  { key: 'comments',               label: 'Yorum',           icon: '💬', color: 'bg-teal-400',    solid: '#2dd4bf', group: 'Feed' },
  { key: 'reactions',              label: 'Reaksiyon',       icon: '👍', color: 'bg-emerald-400', solid: '#34d399', group: 'Feed' },
  { key: 'forumQuestions',         label: 'Forum Soru',      icon: '🗣️', color: 'bg-sky-500',     solid: '#0ea5e9', group: 'Forum' },
  { key: 'forumAnswers',           label: 'Forum Cevap',     icon: '↩️', color: 'bg-sky-300',     solid: '#7dd3fc', group: 'Forum' },
  { key: 'mentorlukMenteeApplied', label: 'Mentee Başv.',    icon: '📩', color: 'bg-indigo-300',  solid: '#a5b4fc', group: 'Mentorluk' },
  { key: 'mentorlukMentorApplied', label: 'Mentor Başv.',    icon: '📨', color: 'bg-purple-400',  solid: '#c084fc', group: 'Mentorluk' },
  { key: 'menteeSessions',         label: 'Mentee Seans',    icon: '📚', color: 'bg-indigo-400',  solid: '#818cf8', group: 'Mentorluk' },
  { key: 'mentorSessions',         label: 'Mentor Seans',    icon: '🎓', color: 'bg-purple-500',  solid: '#a855f7', group: 'Mentorluk' },
  { key: 'qaQuestions',            label: 'S&C Soru',        icon: '❓', color: 'bg-amber-400',   solid: '#fbbf24', group: 'S&C' },
  { key: 'qaAnswers',              label: 'S&C Cevap',       icon: '✅', color: 'bg-lime-500',    solid: '#84cc16', group: 'S&C' },
  { key: 'surveyAnswers',          label: 'Anket Cevap',     icon: '📊', color: 'bg-violet-400',  solid: '#a78bfa', group: 'Diğer' },
  { key: 'competitionEntries',     label: 'Yarışma Katıl',   icon: '🏆', color: 'bg-yellow-400',  solid: '#facc15', group: 'Diğer' },
  { key: 'eventsAttended',         label: 'Etkinlik Katıl',  icon: '📅', color: 'bg-rose-400',    solid: '#fb7185', group: 'Etkinlik' },
  { key: 'etkinlikCreated',        label: 'Etkinlik Oluştur',icon: '➕', color: 'bg-rose-300',    solid: '#fda4af', group: 'Etkinlik' },
  { key: 'trainingsAccessed',      label: 'Eğitim Eriş',    icon: '🎯', color: 'bg-cyan-400',    solid: '#22d3ee', group: 'Eğitim' },
  { key: 'egitimCreated',          label: 'Eğitim Oluştur',  icon: '➕', color: 'bg-cyan-300',    solid: '#67e8f9', group: 'Eğitim' },
  { key: 'magazaProductCreated',   label: 'Ürün Oluştur',    icon: '📦', color: 'bg-orange-400',  solid: '#fb923c', group: 'Mağaza' },
  { key: 'magazaPurchased',        label: 'Satın Al',        icon: '🛒', color: 'bg-orange-300',  solid: '#fdba74', group: 'Mağaza' },
  { key: 'ilanCreated',            label: 'İlan Oluştur',    icon: '🏷️', color: 'bg-orange-200',  solid: '#fed7aa', group: 'İlan' },
  { key: 'reklamFormSubmitted',    label: 'Reklam Form',     icon: '📣', color: 'bg-pink-400',    solid: '#f472b6', group: 'Form' },
  { key: 'talepFormSubmitted',     label: 'Talep Form',      icon: '📬', color: 'bg-pink-300',    solid: '#f9a8d4', group: 'Form' },
  { key: 'bagisFormSubmitted',     label: 'Bağış Form',      icon: '❤️', color: 'bg-red-300',     solid: '#fca5a5', group: 'Form' },
];

export const GROUP_COLORS: Record<string, string> = {
  'Ziyaret': '#94a3b8', 'Feed': '#60a5fa', 'Forum': '#0ea5e9', 'Mentorluk': '#a855f7',
  'S&C': '#fbbf24', 'Diğer': '#a78bfa', 'Etkinlik': '#fb7185', 'Eğitim': '#22d3ee',
  'Mağaza': '#fb923c', 'İlan': '#fed7aa', 'Form': '#f472b6',
};

export const TIER_CAPABILITIES = [
  {
    tier: 'registered_user', emoji: '👤',
    sections: [
      { title: 'Platform Erişimi', items: ['Sadece Sahne — Mutfak platformuna erişim yok'] },
      { title: 'Ziyaret (tüm modüller)', items: [
        'Haberita, Haritakariyer, Haritakademi, Haritailesi TV — site ziyareti',
        'Reklam & İşbirliği — ziyaret + form gönder',
        'Mentorluk, Mağaza, Eğitimler, Etkinlikler, İlan Panosu — ziyaret',
        'Haritailesi Genç, Haritailesi Vakfı, Mutfak (link), Sınavlar — ziyaret',
      ]},
      { title: 'Aksiyon', items: [
        'Soru & Cevap → soru sor, cevap yaz (Sahne)',
        'Anketler → cevapla (Sahne)',
        'Yarışmalar → katıl (Sahne)',
        'Etkinlikler → katıl',
        'Mağaza → satın al',
        'Eğitimler → satın al / ücretsiz yararlan',
        'Talep & Görüş → form gönder (Sahne)',
        'Bağış → yap (Sahne)',
        'İlan Panosu → ilan oluştur formu, ilanlara bak',
      ]},
      { title: 'Kısıtlamalar', items: [
        'Forum erişimi yok',
        'Mentorluk başvurusu (mentee/mentor) yok',
        'İçerik oluşturma (mağaza ürün, eğitim, etkinlik) yok',
      ]},
    ],
  },
  {
    tier: 'haritailesi_genc', emoji: '🌱',
    sections: [
      { title: 'Platform Erişimi', items: ['Sahne + Mutfak tam erişim'] },
      { title: 'Ziyaret (tüm modüller)', items: [
        'Haberita, Haritakariyer, Haritakademi, Haritailesi TV — site ziyareti',
        'Tüm 20 modülü Sahne & Mutfak üzerinden ziyaret et',
      ]},
      { title: 'Aksiyon', items: [
        'Forum → ziyaret, soru sor, cevap yaz (Mutfak)',
        'Mentorluk → mentee başvurusu (Sahne & Mutfak)',
        'Soru & Cevap → soru sor, cevap yaz (Sahne & Mutfak)',
        'Anketler → cevapla (Sahne & Mutfak)',
        'Yarışmalar → katıl (Sahne & Mutfak)',
        'Etkinlikler → etkinlik oluştur formu, katıl',
        'Mağaza → ürün oluştur formu, satın al',
        'Eğitimler → eğitim oluştur formu, yararlan / satın al',
        'Talep & Görüş → form gönder (Sahne & Mutfak)',
        'Bağış → yap (Sahne & Mutfak)',
        'İlan Panosu → ilan oluştur formu, ilanlara bak',
        'Mutfak → gönderi, yorum, reaksiyon',
      ]},
      { title: 'Kısıtlamalar', items: [
        'Reklam & İşbirliği formu yok',
        'Mentor başvurusu yok (sadece mentee)',
      ]},
    ],
  },
  {
    tier: 'new_graduate_member', emoji: '🎓',
    sections: [
      { title: 'Platform Erişimi', items: ['Sahne + Mutfak tam erişim'] },
      { title: 'Ziyaret (tüm modüller)', items: ['Tüm 20 modülü Sahne & Mutfak üzerinden ziyaret et'] },
      { title: 'Aksiyon (Haritailesi Genç ile aynı)', items: [
        'Forum → ziyaret, soru sor, cevap yaz (Mutfak)',
        'Mentorluk → mentee başvurusu (Sahne & Mutfak)',
        'Soru & Cevap → soru sor, cevap yaz (Sahne & Mutfak)',
        'Anketler → cevapla (Sahne & Mutfak)',
        'Yarışmalar → katıl (Sahne & Mutfak)',
        'Etkinlikler → etkinlik oluştur formu, katıl',
        'Mağaza → ürün oluştur formu, satın al',
        'Eğitimler → eğitim oluştur formu, yararlan / satın al',
        'Talep & Görüş → form gönder (Sahne & Mutfak)',
        'Bağış → yap (Sahne & Mutfak)',
        'İlan Panosu → ilan oluştur formu, ilanlara bak',
        'Mutfak → gönderi, yorum, reaksiyon',
      ]},
      { title: 'Kısıtlamalar', items: [
        'Reklam & İşbirliği formu yok',
        'Mentor başvurusu yok (sadece mentee)',
      ]},
    ],
  },
  {
    tier: 'individual_member', emoji: '⭐',
    sections: [
      { title: 'Platform Erişimi', items: ['Sahne + Mutfak tam erişim'] },
      { title: 'Ziyaret (tüm modüller)', items: ['Tüm 20 modülü Sahne & Mutfak üzerinden ziyaret et'] },
      { title: 'Aksiyon', items: [
        'Forum → ziyaret, soru sor, cevap yaz (Mutfak)',
        'Mentorluk → mentee başvurusu + mentor başvurusu (Sahne & Mutfak)',
        'Reklam & İşbirliği → form gönder (Sahne veya Mutfak paneli)',
        'Soru & Cevap → soru sor, cevap yaz (Sahne & Mutfak)',
        'Anketler → cevapla (Sahne & Mutfak)',
        'Yarışmalar → katıl (Sahne & Mutfak)',
        'Etkinlikler → etkinlik oluştur formu, katıl',
        'Mağaza → ürün oluştur formu, satın al',
        'Eğitimler → eğitim oluştur formu, yararlan / satın al',
        'Talep & Görüş → form gönder (Sahne & Mutfak)',
        'Bağış → yap (Sahne & Mutfak)',
        'İlan Panosu → ilan oluştur formu, ilanlara bak',
        'Mutfak → gönderi, yorum, reaksiyon',
      ]},
      { title: 'Özel Ayrıcalık', items: ['Tek mentee + mentor başvurusu yapabilen tier'] },
    ],
  },
  {
    tier: 'corporate_member', emoji: '🏢',
    sections: [
      { title: 'Platform Erişimi', items: ['Sahne + Mutfak tam erişim — Temsilci üzerinden yönetilir'] },
      { title: 'Ziyaret (tüm modüller)', items: ['Tüm 20 modülü Sahne & Mutfak üzerinden ziyaret et'] },
      { title: 'Aksiyon', items: [
        'Forum → ziyaret, soru sor, cevap yaz (Mutfak)',
        'Mentorluk → temsilci mentor başvurusu yapabilir',
        'Reklam & İşbirliği → form gönder (Sahne veya Mutfak paneli)',
        'Soru & Cevap → soru sor, cevap yaz (Sahne & Mutfak)',
        'Anketler → cevapla (Sahne & Mutfak)',
        'Yarışmalar → katıl (Sahne & Mutfak)',
        'Etkinlikler → etkinlik oluştur formu, katıl',
        'Mağaza → ürün oluştur formu, satın al',
        'Eğitimler → eğitim oluştur formu, yararlan / satın al',
        'Talep & Görüş → form gönder (Sahne & Mutfak)',
        'Bağış → yap (Sahne & Mutfak)',
        'İlan Panosu → ilan oluştur formu, ilanlara bak',
        'Mutfak → gönderi, yorum, reaksiyon',
      ]},
    ],
  },
];
