'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mutfakApi, POST_TYPE_LABELS, type FeedPost } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';

export function BookmarksTab({ token }: { token: string | null }) {
  const [bookmarks, setBookmarks] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded && token) {
      setLoading(true);
      mutfakApi.getMyBookmarks(token)
        .then(setBookmarks)
        .catch(() => {})
        .finally(() => { setLoading(false); setLoaded(true); });
    }
  }, [loaded, token]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        illustration="bookmark"
        title="Kaydedilen gönderi yok"
        description="Beğendiğiniz gönderilerdeki yer imi ikonuna tıklayarak buraya ekleyebilirsiniz."
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((p) => (
        <Link
          key={p.id}
          href={`/akis/${p.id}`}
          className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-[#26496b]/30 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#26496b]/10 text-[#26496b]">
              {POST_TYPE_LABELS[p.type] ?? p.type}
            </span>
            <span className="text-xs text-gray-400">{p.displayName}</span>
          </div>
          {p.title && <p className="text-sm font-semibold text-gray-900 mb-1">{p.title}</p>}
          <p className="text-sm text-gray-600 line-clamp-2">{p.body}</p>
        </Link>
      ))}
    </div>
  );
}
