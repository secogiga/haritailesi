'use client';

import { useState } from 'react';

type Tab = 'total' | 'sahne' | 'linkedin';

const VerticalLabel = ({ text, active, color, onClick }: { text: string; active: boolean; color: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center text-[7px] font-bold tracking-widest transition-colors ${active ? color : 'text-white/20 hover:text-white/40'} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
  >
    {text}
  </button>
);

export function KpiBar({ viewCount, linkedinViewCount }: { viewCount: number; linkedinViewCount?: number }) {
  const [tab, setTab] = useState<Tab>('total');

  const linkedin = linkedinViewCount ?? 0;
  const displayCount =
    tab === 'sahne' ? viewCount
    : tab === 'linkedin' ? linkedin
    : Math.max(viewCount, linkedin);

  const displayLabel =
    tab === 'sahne' ? 'Sahne'
    : tab === 'linkedin' ? 'LinkedIn'
    : 'Görüntülenme';

  return (
    <div className="grid grid-cols-3 gap-2 pt-1">
      {/* Görüntülenme */}
      <div className="flex bg-white/5 rounded-xl overflow-hidden">
        <div className="flex flex-col w-6 shrink-0 border-r border-white/10">
          <VerticalLabel text="LINKEDIN" active={tab === 'linkedin'} color="text-[#5fa8e0]"
            onClick={() => setTab(tab === 'linkedin' ? 'total' : 'linkedin')} />
          <VerticalLabel text="SAHNE" active={tab === 'sahne'} color="text-[#66aca9]"
            onClick={() => setTab(tab === 'sahne' ? 'total' : 'sahne')} />
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 flex-1 cursor-default">
          <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-sm font-bold text-white/80 leading-none">
            {displayCount.toLocaleString('tr-TR')}
          </span>
          <span className="text-[10px] text-white/50 leading-tight">{displayLabel}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 bg-white/5 rounded-xl py-3 px-2 cursor-default">
        <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-sm font-bold text-white/80 leading-none">0</span>
        <span className="text-[10px] text-white/50">Yorum</span>
      </div>

      <div className="flex flex-col items-center gap-1.5 bg-white/5 rounded-xl py-3 px-2 cursor-default">
        <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-sm font-bold text-white/80 leading-none">0</span>
        <span className="text-[10px] text-white/50">Beğeni</span>
      </div>
    </div>
  );
}
