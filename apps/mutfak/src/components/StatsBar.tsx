'use client';

import { useQuery } from '@tanstack/react-query';
import { mutfakApi } from '@/lib/api';

export function StatsBar() {
  const { data: stats } = useQuery({
    queryKey: ['community-stats'],
    queryFn: () => mutfakApi.getCommunityStats(),
    staleTime: 5 * 60_000,
  });

  if (!stats) return null;

  const items = [
    { label: 'Aktif Üye', value: stats.memberCount },
    { label: 'Bu Hafta Gönderi', value: stats.postsThisWeek },
    { label: 'Aktif Mentor', value: stats.activeMentors },
  ];

  return (
    <div className="flex items-center gap-0 mb-5 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-x divide-gray-100">
      {items.map(({ label, value }) => (
        <div key={label} className="flex-1 text-center px-3 py-2.5">
          <div className="text-base font-bold text-[#26496b] font-display leading-none">
            {value.toLocaleString('tr-TR')}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{label}</div>
        </div>
      ))}
    </div>
  );
}
