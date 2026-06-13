'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { mutfakApi, type DmThread, type DirectMessage } from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  return `${Math.floor(diff / 86400)}g`;
}

function Ticks({ isMe, isRead }: { isMe: boolean; isRead: boolean }) {
  if (!isMe) return null;
  return (
    <span className={`inline-flex ml-1 ${isRead ? 'text-[#66aca9]' : 'text-white/50'}`} aria-label={isRead ? 'Okundu' : 'İletildi'}>
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1,5 4,8 10,2" />
        <polyline points="6,5 9,8 15,2" />
      </svg>
    </span>
  );
}

function StaffAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-[#26496b] flex items-center justify-center shrink-0"
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.3 }}>HY</span>
    </div>
  );
}

export default function MesajlarPage() {
  const token = useToken();
  const { user: me } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const activeUserId = searchParams.get('with');

  const [threads, setThreads] = useState<DmThread[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const activeUserIdRef = useRef(activeUserId);
  useEffect(() => { activeUserIdRef.current = activeUserId; }, [activeUserId]);

  const activeThread = threads.find((t) => t.counterpart?.id === activeUserId);

  // Load threads
  useEffect(() => {
    if (!token) return;
    mutfakApi.getThreads(token).then(setThreads).catch(console.error);
  }, [token]);

  // Load messages when switching threads
  useEffect(() => {
    if (!token || !activeUserId) return;
    setMessages([]);
    setHasMore(false);
    mutfakApi.getMessages(activeUserId, token)
      .then(({ data, hasMore: hm }) => {
        setMessages(data);
        setHasMore(hm);
      })
      .catch(console.error);
  }, [token, activeUserId]);

  // Scroll to bottom on new messages (not on load-more)
  const prevMessageCount = useRef(0);
  useEffect(() => {
    const isNewMessage = messages.length > prevMessageCount.current && prevMessageCount.current !== 0;
    const isInitialLoad = prevMessageCount.current === 0 && messages.length > 0;
    if (isInitialLoad || isNewMessage) {
      bottomRef.current?.scrollIntoView({ behavior: isInitialLoad ? 'instant' : 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  async function loadMore() {
    if (!token || !activeUserId || !hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const before = messages[0]?.createdAt;
    try {
      const { data, hasMore: hm } = await mutfakApi.getMessages(activeUserId, token, { before });
      setMessages((prev) => [...data, ...prev]);
      setHasMore(hm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }

  // SSE — auto-reconnects on drop, refreshes token on 401
  useEffect(() => {
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
    let alive = true;
    let retryDelay = 2_000;
    let currentToken = token; // mutable — updated on inline refresh

    async function tryRefresh(): Promise<boolean> {
      const rt = localStorage.getItem('mutfak_refresh');
      if (!rt) return false;
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) return false;
        const data = await res.json() as { accessToken: string; refreshToken: string };
        localStorage.setItem('mutfak_access', data.accessToken);
        localStorage.setItem('mutfak_refresh', data.refreshToken);
        currentToken = data.accessToken;
        return true;
      } catch {
        return false;
      }
    }

    async function connect() {
      while (alive) {
        try {
          const res = await fetch(`${API_URL}/api/v1/messages/stream`, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });

          // Token expired — refresh once then retry immediately
          if (res.status === 401) {
            const refreshed = await tryRefresh();
            if (!refreshed) { alive = false; return; }
            continue; // retry with fresh token, no delay
          }

          if (!res.body) throw new Error('no body');
          retryDelay = 2_000;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (alive) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() ?? '';
            for (const part of parts) {
              const line = part.split('\n').find((l) => l.startsWith('data:'));
              if (!line) continue;
              try {
                const parsed = JSON.parse(line.slice(5).trim()) as { type?: string };
                if (parsed.type === 'read_receipt') {
                  const receipt = parsed as { type: string; threadId: string; readBy: string };
                  setMessages((prev) =>
                    prev.map((m) => m.threadId === receipt.threadId ? { ...m, isRead: true } : m),
                  );
                } else {
                  // dm_message
                  const msg = parsed as DirectMessage;
                  const curUserId = activeUserIdRef.current;
                  setMessages((prev) => {
                    if (!curUserId) return prev;
                    if (msg.senderId !== curUserId && msg.recipientId !== curUserId) return prev;
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                  });
                  void mutfakApi.getThreads(currentToken).then(setThreads);
                  void queryClient.invalidateQueries({ queryKey: ['dm-threads'] });
                }
              } catch { /* non-data line */ }
            }
          }
        } catch {
          if (!alive) return;
          await new Promise((r) => setTimeout(r, retryDelay));
          retryDelay = Math.min(retryDelay * 2, 30_000);
        }
      }
    }

    void connect();
    return () => { alive = false; };
  }, [token, queryClient]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !activeUserId || !token || sending) return;
    setSending(true);
    try {
      const msg = await mutfakApi.sendMessage(activeUserId, body.trim(), token);
      setMessages((prev) => [...prev, msg]);
      setBody('');
      const updated = await mutfakApi.getThreads(token);
      setThreads(updated);
      void queryClient.invalidateQueries({ queryKey: ['dm-threads'] });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] overflow-hidden -mx-4 md:mx-0 md:rounded-2xl md:border md:border-gray-100 md:shadow-sm bg-white">
      {/* Thread list */}
      <div className={`
        absolute inset-0 z-10 flex flex-col bg-white border-r border-gray-100
        transition-transform duration-300 ease-in-out
        md:relative md:inset-auto md:w-72 lg:md:w-80 md:flex-shrink-0 md:translate-x-0
        ${activeUserId ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900">Mesajlar</h1>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {threads.length === 0 && (
            <EmptyState
              illustration="inbox"
              title="Henüz mesajınız yok"
              description="Bir üye profiline giderek mesaj gönderin."
            />
          )}
          {threads.map((t) => {
            const cp = t.counterpart;
            const isActive = cp?.id === activeUserId;
            return (
              <button
                key={t.threadId}
                onClick={() => router.push(`/mesajlar?with=${cp?.id ?? ''}`)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-[#26496b]/5' : ''}`}
              >
                <div className="flex-shrink-0">
                  {cp?.isStaff
                    ? <StaffAvatar size={40} />
                    : <Avatar name={cp?.displayName ?? '?'} src={cp?.avatarUrl ?? null} size={40} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">{cp?.displayName ?? 'Bilinmeyen'}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeAgo(t.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{t.lastBody ?? ''}</p>
                </div>
                {t.unreadCount > 0 && (
                  <span className="flex-shrink-0 min-w-[18px] h-4.5 bg-[#26496b] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {t.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message pane */}
      <div className={`
        absolute inset-0 flex flex-col bg-white
        transition-transform duration-300 ease-in-out
        md:relative md:inset-auto md:flex-1 md:translate-x-0
        ${activeUserId ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {!activeUserId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Bir sohbet seçin
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => router.push('/mesajlar')}
                className="md:hidden text-gray-500 hover:text-gray-800 mr-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {activeThread?.counterpart?.isStaff
                ? <StaffAvatar size={36} />
                : <Avatar name={activeThread?.counterpart?.displayName ?? '?'} src={activeThread?.counterpart?.avatarUrl ?? null} size={36} />
              }
              <div>
                <p className="text-sm font-semibold text-gray-900">{activeThread?.counterpart?.displayName ?? 'Yükleniyor...'}</p>
                {activeThread?.counterpart?.isStaff ? (
                  <p className="text-xs text-[#66aca9]">Resmi Mesaj</p>
                ) : activeThread?.counterpart?.profession ? (
                  <p className="text-xs text-gray-400">{activeThread.counterpart.profession}</p>
                ) : null}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center">
                  <button
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="text-xs text-[#26496b] hover:text-[#1e3a56] font-medium disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loadingMore ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                    {loadingMore ? 'Yükleniyor...' : 'Daha eski mesajlar'}
                  </button>
                </div>
              )}

              <div ref={topRef} />

              {messages.map((msg) => {
                const isMe = msg.senderId === me?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs lg:max-w-sm px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-[#26496b] text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.body}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                        <span className="text-[10px]">{timeAgo(msg.createdAt)}</span>
                        <Ticks isMe={isMe} isRead={msg.isRead} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={(e) => void handleSend(e)} className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(e as never); } }}
                placeholder="Mesaj yaz..."
                className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
              />
              <button
                type="submit"
                disabled={!body.trim() || sending}
                className="px-4 py-2.5 bg-[#26496b] text-white rounded-xl text-sm font-medium hover:bg-[#1e3a56] transition-colors disabled:opacity-50"
              >
                Gönder
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
