import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const SenNeDersinHub = dynamic(() => import('../_hub'), { ssr: true });

export const metadata: Metadata = {
  title: 'Yarışmalar — Sen Ne Dersin? | Haritailesi',
  description: 'Haritailesi yarışmalarına katıl. CBS, geomatik ve haritacılık alanında ödüllü yarışmalar.',
};

export default function YarismalarPage() {
  return <SenNeDersinHub initialFilter="yarismalar" />;
}
