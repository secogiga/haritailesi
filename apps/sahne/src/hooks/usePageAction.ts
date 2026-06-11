'use client';

import { useEffect } from 'react';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

export function usePageAction(actionId: string) {
  const { recordAction } = useSahneAuth();

  useEffect(() => {
    void recordAction(actionId);
  }, [actionId, recordAction]); // recordAction artık stable (useCallback + userRef)
}
