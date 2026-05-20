'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mutfakApi, type Notification } from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { EmptyState } from '@/components/EmptyState';

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function notificationLink(n: Notification): string | null {
  if (n.data?.link) return n.data.link;
  if (n.data?.postId) return `/akis/${n.data.postId}`;
  if (n.type.startsWith('mentorship_') || n.type === 'session_reminder') return '/mentorluk';
  return null;
}

const TYPE_LABELS: Record<string, string> = {
  new_post: 'Yeni Gönderi',
  new_comment: 'Yorum',
  new_reaction: 'Beğeni',
  mentorship_request: 'Mentorluk İsteği',
  mentorship_accepted: 'İstek Onaylandı',
  mentorship_rejected: 'İstek Reddedildi',
  session_reminder: 'Seans Hatırlatıcı',
  mentorship_completed: 'Seans Tamamlandı',
};

export default function BildirimlerPage() {
  const token = useToken();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', token],
    queryFn: () => mutfakApi.getNotifications(token),
    enabled: !!token,
  });

  const markRead = useMutation({
    mutationFn: () => mutfakApi.markNotificationsRead(token),
    onSuccess: () => {
      qc.setQueryData<Notification[]>(['notifications', token], (prev) =>
        prev?.map((n) => ({ ...n, isRead: true })) ?? [],
      );
    },
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (unread > 0) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">Bildirimler</h1>
          {unread > 0 && <p className="text-xs text-gray-500 mt-0.5">{unread} okunmamış</p>}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          illustration="bell"
          title="Henüz bildirim yok"
          description="Biri sizi mention ettiğinde, gönderinize yorum veya tepki geldiğinde burada görürsünüz."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const href = notificationLink(n);
            const typeLabel = TYPE_LABELS[n.type] ?? n.type;
            const inner = (
              <div className={`p-4 rounded-xl border transition-colors ${n.isRead ? 'bg-white border-gray-100' : 'bg-blue-50/60 border-blue-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-gray-200' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold text-[#26496b] uppercase tracking-wide">{typeLabel}</span>
                      <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                  {href && (
                    <svg className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            );
            return href ? (
              <a key={n.id} href={href} className="block hover:opacity-90 transition-opacity">{inner}</a>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
