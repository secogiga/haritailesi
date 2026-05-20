'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

export default function MesajlarPage() {
  const token = useToken();
  const { user: me } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeUserId = searchParams.get('with');

  const [threads, setThreads] = useState<DmThread[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(
    (t) => t.counterpart?.id === activeUserId,
  );

  useEffect(() => {
    if (!token) return;
    mutfakApi.getThreads(token).then(setThreads).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token || !activeUserId) return;
    mutfakApi.getMessages(activeUserId, token).then(setMessages).catch(console.error);
  }, [token, activeUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // SSE stream — receives new DMs in real time
  useEffect(() => {
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/messages/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            const line = part.split('\n').find((l) => l.startsWith('data:'));
            if (!line) continue;
            try {
              const msg = JSON.parse(line.slice(5).trim()) as DirectMessage;
              // Add to active conversation if relevant
              setMessages((prev) => {
                if (!activeUserId) return prev;
                if (msg.senderId !== activeUserId && msg.recipientId !== activeUserId) return prev;
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              // Refresh thread list
              mutfakApi.getThreads(token).then(setThreads).catch(console.error);
            } catch { /* non-data line */ }
          }
        }
      } catch { /* aborted */ }
    })();

    return () => controller.abort();
  }, [token, activeUserId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !activeUserId || !token || sending) return;
    setSending(true);
    try {
      const msg = await mutfakApi.sendMessage(activeUserId, body.trim(), token);
      setMessages((prev) => [...prev, msg]);
      setBody('');
      // Refresh threads
      const updated = await mutfakApi.getThreads(token);
      setThreads(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] overflow-hidden -mx-4 md:mx-0 md:rounded-2xl md:border md:border-gray-100 md:shadow-sm bg-white">
      {/* Thread list — slides left on mobile when chat is open */}
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
            const isActive = t.counterpart?.id === activeUserId;
            return (
              <button
                key={t.threadId}
                onClick={() => router.push(`/mesajlar?with=${cp?.id ?? ''}`)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-[#26496b]/5' : ''}`}
              >
                <div className="flex-shrink-0">
                  <Avatar name={cp?.displayName ?? '?'} src={cp?.avatarUrl ?? null} size={40} />
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

      {/* Message pane — slides in from right on mobile */}
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
              <Avatar name={activeThread?.counterpart?.displayName ?? '?'} src={activeThread?.counterpart?.avatarUrl ?? null} size={36} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{activeThread?.counterpart?.displayName ?? 'Yükleniyor...'}</p>
                {activeThread?.counterpart?.profession && (
                  <p className="text-xs text-gray-400">{activeThread.counterpart.profession}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                      <div className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                        {timeAgo(msg.createdAt)}
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
