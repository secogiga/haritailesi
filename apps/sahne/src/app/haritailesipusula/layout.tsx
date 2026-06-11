import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haritailesi Pusula',
};

export default function GoruslerinizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
