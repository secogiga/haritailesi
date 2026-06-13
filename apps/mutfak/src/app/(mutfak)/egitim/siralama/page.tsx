'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type Entry = {
  position: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  rank: { label: string; emoji: string };
};

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function XpLeaderboardPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/cms/xp-leaderboard?limit=30`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setEntries(d as Entry[]))
      .catch(() => setEntries([]));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 flex items-center gap-2">
          ⚡ XP Sıralaması
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Ders tamamlama ve quiz başarısına göre en çok XP kazanan üyeler
        </p>
      </div>

      {entries === null ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/40 rounded-2xl">
          <p className="text-3xl mb-3">📚</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Henüz ders tamamlayan üye yok. İlk sıraya sen gir!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 özel görünüm */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[entries[1], entries[0], entries[2]].map((e, i) => {
                if (!e) return null;
                const heights = ['h-28', 'h-36', 'h-24'];
                const isFirst = e.position === 1;
                return (
                  <Link key={e.userId} href={`/uyeler/${e.userId}`}
                    className={`flex flex-col items-center justify-end ${heights[i]} bg-gradient-to-t ${isFirst ? 'from-[#26496b] to-[#1a3350]' : 'from-gray-100 dark:from-slate-800 to-gray-50 dark:to-slate-900'} rounded-2xl p-3 text-center transition-transform hover:scale-[1.02]`}>
                    <span className="text-2xl mb-1">{MEDAL[e.position] ?? `#${e.position}`}</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black mb-1 ${isFirst ? 'bg-white/20 text-white' : 'bg-[#26496b]/10 text-[#26496b]'}`}>
                      {e.rank.emoji}
                    </div>
                    <p className={`text-[10px] font-bold truncate w-full ${isFirst ? 'text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                      {e.displayName.split(' ')[0]}
                    </p>
                    <p className={`text-xs font-black ${isFirst ? 'text-[#66aca9]' : 'text-[#26496b]'}`}>
                      {e.totalXp} XP
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Tam liste */}
          <div className="space-y-2">
            {entries.map(e => (
              <Link key={e.userId} href={`/uyeler/${e.userId}`}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-4 py-3 hover:shadow-sm hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                <span className="w-7 text-center text-sm font-black text-gray-300 dark:text-slate-600 shrink-0">
                  {MEDAL[e.position] ?? `#${e.position}`}
                </span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {e.rank.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{e.displayName}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">{e.rank.label}</p>
                </div>
                <span className="text-sm font-black text-[#26496b] dark:text-blue-400 shrink-0">
                  {e.totalXp} XP
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
