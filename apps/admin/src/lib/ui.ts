// ─── Date / Currency Helpers ───────────────────────────────────────────────────

export function fmtTL(kurus: number): string {
  return (kurus / 100).toLocaleString('tr-TR', {
    style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
  });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Sadece gün/ay/yıl, kısa biçim — basvurular liste görünümü vb. */
export function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR');
}

/** Şehir adını düzgün büyük harfle gösterir — "ÇAnakkale" → "Çanakkale" */
export function normCity(city: string | null | undefined): string {
  if (!city) return '—';
  return city.charAt(0).toLocaleUpperCase('tr') + city.slice(1).toLocaleLowerCase('tr');
}

// ─── Avatar Helpers ────────────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-teal-500 to-teal-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-indigo-500 to-indigo-700',
  'from-rose-500 to-rose-700',
  'from-cyan-500 to-cyan-700',
];

export function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export function getInitials(name: string | null, fallback = ''): string {
  const src = (name?.trim() || fallback).trim();
  if (!src) return '?';
  const parts = src.split(' ').filter(Boolean);
  return parts.length >= 2
    ? (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
    : src.slice(0, 2).toUpperCase();
}

// ─── Source Badges (Sahne / Mutfak / Web) ─────────────────────────────────────

export const SOURCE_LABELS: Record<string, string> = {
  sahne: 'Sahne', mutfak: 'Mutfak', web: 'Web',
};

export const SOURCE_COLORS: Record<string, string> = {
  sahne: 'bg-blue-100 text-blue-700',
  mutfak: 'bg-teal-100 text-teal-700',
  web: 'bg-gray-100 text-gray-600',
};

// ─── Generic Status Colors ─────────────────────────────────────────────────────
// Tek noktadan renk değişimi için. Sayfaya özel semantikler varsa yerel override kullan.

export const STATUS_CLS: Record<string, string> = {
  // Bekleyen / taslak
  pending:        'bg-yellow-100 text-yellow-700',
  draft:          'bg-gray-100 text-gray-600',
  pending_review: 'bg-orange-100 text-orange-700',

  // Olumlu
  approved:  'bg-green-100 text-green-700',
  published: 'bg-green-100 text-green-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  verified:  'bg-emerald-100 text-emerald-700',

  // Olumsuz / kapalı
  rejected:  'bg-red-100 text-red-700',
  closed:    'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  suspended: 'bg-red-100 text-red-700',
  deleted:   'bg-red-100 text-red-700',

  // Diğer
  archived:     'bg-gray-100 text-gray-500',
  ended:        'bg-amber-100 text-amber-700',
  in_progress:  'bg-blue-100 text-blue-700',
  hidden:       'bg-yellow-100 text-yellow-800',
  open:         'bg-orange-100 text-orange-700',
  scheduled:    'bg-blue-100 text-blue-700',
  waitlisted:   'bg-purple-100 text-purple-700',
};
