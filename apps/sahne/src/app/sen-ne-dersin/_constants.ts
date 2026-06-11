export type Filter = 'tumu' | 'anketler' | 'testler' | 'yarismalar' | 'sonuclananlar' | 'populerler' | 'en_yeni' | 'gecmisim';

export const FILTER_ITEMS: { key: Filter; label: string; authOnly?: boolean }[] = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'anketler', label: 'Anketler' },
  { key: 'testler', label: 'Testler' },
  { key: 'yarismalar', label: 'Yarışmalar' },
  { key: 'sonuclananlar', label: 'Sonuçlananlar' },
  { key: 'populerler', label: 'Popülerler' },
  { key: 'en_yeni', label: 'En Yeni' },
  { key: 'gecmisim', label: 'Geçmişim', authOnly: true },
];
