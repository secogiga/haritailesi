'use client';

import { useState } from 'react';
import type { EventDiscussion } from '@/lib/api';

const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

function Avatar({ name, url, size = 8 }: { name: string | null; url: string | null; size?: number }) {
  if (url) return <img src={url} alt={name ?? ''} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-[var(--color-mavi)] text-white flex items-center justify-center text-xs font-bold shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} gün`;
}

export function DiscussionSection({
  discussion,
  mutfakPostId,
}: {
  discussion: EventDiscussion;
  mutfakPostId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleComments = expanded ? discussion.comments : discussion.comments.slice(0, 3);
  const hasMore = discussion.comments.length > 3;

  return (
    <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-teal)]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--color-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Tartışma</h2>
          {discussion.commentCount > 0 && (
            <span className="text-sm text-gray-400 dark:text-slate-500 tabular-nums">{discussion.commentCount} yorum</span>
          )}
        </div>
        <a
          href={`${MUTFAK_URL}/akis?post=${mutfakPostId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-teal)] hover:underline"
        >
          Mutfak&apos;ta aç
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Ana post */}
      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2.5 mb-2">
          <Avatar name={discussion.post.authorName} url={discussion.post.authorAvatar} size={7} />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{discussion.post.authorName ?? 'Haritailesi'}</p>
            <p className="text-[10px] text-gray-400">{timeAgo(discussion.post.createdAt)}</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">
          {discussion.post.body}
        </p>
      </div>

      {/* Yorumlar */}
      {discussion.comments.length > 0 ? (
        <div className="space-y-3">
          {visibleComments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.authorName} url={c.authorAvatar} size={7} />
              <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">{c.authorName ?? 'Üye'}</span>
                  <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
          {hasMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full py-2 text-xs font-semibold text-[var(--color-mavi)] hover:text-[var(--color-mavi-acik)] bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {discussion.comments.length - 3} yorum daha göster
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
          Henüz yorum yok. İlk yorumu sen yap!
        </p>
      )}

      {/* CTA */}
      <a
        href={`${MUTFAK_URL}/akis?post=${mutfakPostId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[var(--color-teal)] border border-[var(--color-teal)]/30 hover:bg-[var(--color-teal)]/5 rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Tartışmaya katıl
      </a>
    </div>
  );
}
