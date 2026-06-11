'use client';

import { usePageAction } from '@/hooks/usePageAction';

/** Sayfa ziyaret edildiğinde bir aksiyon ID'sini otomatik kaydeder. Render ettirme yok. */
export function PageActionTracker({ actionId }: { actionId: string }) {
  usePageAction(actionId);
  return null;
}
