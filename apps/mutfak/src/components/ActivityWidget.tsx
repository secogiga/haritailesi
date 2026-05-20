'use client';

import { useQuery } from '@tanstack/react-query';
import { mutfakApi } from '@/lib/api';
import { useToken } from '@/hooks/useToken';

export function ActivityWidget() {
  const token = useToken();

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => mutfakApi.getMyStats(token),
    staleTime: 5 * 60_000,
    enabled: !!token,
  });

  if (!stats) return null;

  const items = [
    { label: 'Tepki', value: stats.reactionsThisWeek, icon: '👍' },
    { label: 'Yorum', value: stats.commentsThisWeek, icon: '💬' },
    { label: 'Takipçi', value: stats.newFollowersThisWeek, icon: '👥' },
    { label: 'Gönderi', value: stats.postsThisWeek, icon: '✍️' },
  ].filter((item) => item.value > 0);

  if (items.length === 0) return null;

  return (
    <div className="mb-5 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-50">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Bu Hafta Siz</p>
      </div>
      <div className="flex divide-x divide-gray-100">
        {items.map(({ label, value, icon }) => (
          <div key={label} className="flex-1 text-center px-2 py-3">
            <div className="text-base leading-none mb-0.5">{icon}</div>
            <div className="text-lg font-bold text-[#26496b] leading-none">{value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
