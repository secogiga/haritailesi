export type Filter = 'tumu' | 'anketler' | 'testler' | 'yarismalar' | 'sonuclananlar' | 'populerler' | 'en_yeni' | 'gecmisim';

export const FILTER_ITEMS_VIEW: { key: Filter; label: string }[] = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'populerler', label: 'En Popüler' },
  { key: 'en_yeni', label: 'En Yeni' },
];

export const FILTER_ITEMS_TYPE: { key: Filter; label: string; authOnly?: boolean }[] = [
  { key: 'yarismalar', label: 'Yarışmalar' },
  { key: 'anketler', label: 'Anketler' },
  { key: 'testler', label: 'Testler' },
  { key: 'sonuclananlar', label: 'Sonuçlananlar' },
  { key: 'gecmisim', label: 'Geçmişim', authOnly: true },
];

/** Geriye dönük uyumluluk için tüm liste */
export const FILTER_ITEMS = [...FILTER_ITEMS_VIEW, ...FILTER_ITEMS_TYPE];
