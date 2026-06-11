'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function FloatingJourneyButton() {
  const pathname = usePathname();
  const router   = useRouter();
  const [journeyOpen, setJourneyOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setJourneyOpen(document.body.hasAttribute('data-journey-open'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-journey-open'] });
    return () => observer.disconnect();
  }, []);

  if (pathname === '/') return null;
  if (journeyOpen) return null;

  function handleClick() {
    router.push('/');
    // Cached page'den dönerken StartGuide localStorage'ı yeniden okusun
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sahne-reload-progress'));
      document.getElementById('kesfet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#26496b] hover:bg-[#1d3a57] text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-150"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Yolculuğa Dön
    </button>
  );
}
