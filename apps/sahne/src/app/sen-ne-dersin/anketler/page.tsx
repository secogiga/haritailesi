import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const SenNeDersinHub = dynamic(() => import('../_hub'), { ssr: true });

export const metadata: Metadata = {
  title: 'Anketler — Sen Ne Dersin? | Haritailesi',
  description: 'Haritailesi topluluğunun anketlerine katıl, görüşlerini paylaş ve sektörün nabzını tut.',
};

export default function AnketlerPage() {
  return <SenNeDersinHub initialFilter="anketler" />;
}
