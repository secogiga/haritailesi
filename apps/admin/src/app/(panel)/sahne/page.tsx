'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SahneRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/istatistikler'); }, [router]);
  return null;
}
