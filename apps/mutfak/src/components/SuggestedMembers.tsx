'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { mutfakApi } from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { Avatar } from '@/components/Avatar';

export function SuggestedMembers() {
  const token = useToken();

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggested-members', token],
    queryFn: () => mutfakApi.getSuggestedMembers(token),
    staleTime: 10 * 60_000,
    enabled: !!token,
  });

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-5 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-50">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Tanıyor Olabilirsiniz</p>
      </div>
      <div className="divide-y divide-gray-50">
        {suggestions.map((member) => (
          <Link
            key={member.id}
            href={`/uyeler/${member.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <Avatar
              src={member.avatarUrl}
              name={member.displayName ?? member.profession ?? '?'}
              size={32}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {member.displayName ?? '—'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {[member.profession, member.city].filter(Boolean).join(' · ')}
              </p>
              {member.skillTags?.length > 0 && (
                <p className="text-xs text-[#66aca9] mt-0.5 truncate">
                  {member.skillTags.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-gray-50">
        <Link href="/uyeler" className="text-xs text-[#26496b] hover:underline font-medium">
          Tüm üyeleri gör →
        </Link>
      </div>
    </div>
  );
}
