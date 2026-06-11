import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const SenNeDersinHub = dynamic(() => import('../_hub'), { ssr: true });

export const metadata: Metadata = {
  title: 'Testler — Sen Ne Dersin? | Haritailesi',
  description: 'CBS, GIS ve geomatik alanında bilgini test et. Haritailesi topluluk testleri ve sınavları.',
};

export default function TestlerPage() {
  return <SenNeDersinHub initialFilter="testler" />;
}
