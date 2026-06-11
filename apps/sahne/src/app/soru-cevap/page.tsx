import type { Metadata } from 'next';
import SoruCevapClient from './SoruCevapClient';
import { PageActionTracker } from '@/components/PageActionTracker';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Soru & Cevap | Haritailesi Sahne',
  description: 'Haritacılık, CBS, fotogrametri ve geomatik alanlarında merak ettiğiniz her şeyi sorun. Uzman kadromuzun onayladığı resmi cevaplar burada.',
};

interface QaItem {
  id: string;
  displayName: string | null;
  questionText: string;
  category: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  answers: { id: string; body: string; source: string; submitterName: string | null; tierLabel: string | null; updatedAt: string }[];
}

async function getPublishedQA(category?: string): Promise<QaItem[]> {
  try {
    const qs = category ? `?category=${category}` : '';
    const res = await fetch(`${API_URL}/api/v1/qa${qs}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json() as Promise<QaItem[]>;
  } catch {
    return [];
  }
}

export default async function SoruCevapPage() {
  const items = await getPublishedQA();
  return (
    <>
      <PageActionTracker actionId="v-sc" />
      <SoruCevapClient initialItems={items} />
    </>
  );
}
