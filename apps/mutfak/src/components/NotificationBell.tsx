'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mutfakApi, type Notification } from '@/lib/api';

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  return `${Math.floor(diff / 86400)}g`;
}

function notificationLink(n: Notification): string | null {
  if (n.data?.link) return n.data.link;
  if (n.data?.postId) return `/akis/${n.data.postId}`;
  if (
    n.type.startsWith('mentorship_') ||
    n.type === 'session_reminder' ||
    n.type === 'mentorship_request'
  ) return '/mentorluk';
  return null;
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export function NotificationBell({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', token],
    queryFn: () => mutfakApi.getNotifications(token),
    staleTime: 5 * 60_000,
    enabled: !!token,
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: () => mutfakApi.markNotificationsRead(token),
    onSuccess: () => {
      qc.setQueryData<Notification[]>(['notifications', token], (prev) =>
        prev?.map((n) => ({ ...n, isRead: true })) ?? [],
      );
    },
  });

  // Web Push subscription — register once per session
  useEffect(() => {
    if (!token || typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;

    void (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        // Fetch VAPID public key from backend
        const res = await fetch(`${API_URL}/api/v1/notifications/vapid-public-key`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { publicKey } = await res.json() as { publicKey: string };
        if (!publicKey) return;

        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // already subscribed

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });
        const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        await fetch(`${API_URL}/api/v1/notifications/push-subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
        });
      } catch { /* push not supported or denied */ }
    })();
  }, [token]);

  // SSE real-time stream
  useEffect(() => {
    if (!token) return;

    let aborted = false;
    const controller = new AbortController();

    async function connectSse() {
      try {
        const res = await fetch(`${API_URL}/api/v1/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            const dataLine = part.split('\n').find((l) => l.startsWith('data:'));
            if (dataLine) {
              try {
                const parsed = JSON.parse(dataLine.slice(5).trim()) as Notification;
                qc.setQueryData<Notification[]>(['notifications', token], (prev) =>
                  [parsed, ...(prev ?? [])],
                );
              } catch { /* ignore */ }
            }
          }
        }
      } catch { /* connection closed */ }
    }

    void connectSse();
    return () => { aborted = true; controller.abort(); };
  }, [token, qc]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      markRead.mutate();
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        aria-label="Bildirimler"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1" style={{ animation: 'badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-scale-in origin-top-right">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">{notifications.length} bildirim</span>
            )}
          </div>

          <div className="px-4 py-2 border-b border-gray-50 flex justify-end">
            <a
              href="/ayarlar#bildirimler"
              onClick={() => setOpen(false)}
              className="text-[10px] text-gray-400 hover:text-[#26496b] transition-colors"
            >
              Bildirim Tercihleri →
            </a>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Henüz bildirim yok.
              </div>
            ) : (
              notifications.map((n) => {
                const href = notificationLink(n);
                const inner = (
                  <>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </>
                );
                const base = `px-4 py-3 block ${n.isRead ? '' : 'bg-blue-50/50'}`;
                return href ? (
                  <a
                    key={n.id}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`${base} hover:bg-gray-50 transition-colors`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={n.id} className={base}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
