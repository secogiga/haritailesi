import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { type Filter, FILTER_ITEMS } from './_constants';

const SenNeDersinHub = dynamic(() => import('./_hub'), { ssr: true });

export const metadata: Metadata = {
  title: 'Sen Ne Dersin? — Haritailesi',
  description: 'Anketlere katıl, testlerle kendini değerlendir, yarışmalarda yer al ve topluluğun sesine katkı sun.',
};

const VALID_FILTERS = FILTER_ITEMS.map(f => f.key);

export default async function SenNeDersinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const f = params['filter'];
  const initialFilter: Filter = VALID_FILTERS.includes(f as Filter) ? (f as Filter) : 'tumu';

  return <SenNeDersinHub initialFilter={initialFilter} />;
}
