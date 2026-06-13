'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { mutfakApi, type DmThread, type DirectMessage, type Member } from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/Avatar';

type View = 'threads' | 'search' | 'conversation';

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  return `${Math.floor(diff / 86400)}g`;
}

export function FloatingMessenger() {
  const token = useToken();
  const { user: me } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('threads');
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeName, setActiveName] = useState('');
  const [activeAvatarUrl, setActiveAvatarUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeUserIdRef = useRef(activeUserId);
  useEffect(() => { activeUserIdRef.current = activeUserId; }, [activeUserId]);

  const loadThreads = useCallback(async () => {
    if (!token) return;
    try {
      const data = await mutfakApi.getThreads(token);
      setThreads(data);
      setTotalUnread(data.reduce((s, t) => s + Number(t.unreadCount ?? 0), 0));
    } catch {}
  }, [token]);

  // Load threads when widget opens
  useEffect(() => {
    if (!open || !token) return;
    void loadThreads();
  }, [open, token, loadThreads]);

  // SSE for real-time messages
  useEffect(() => {
    if (!token) return;
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? '';
    let alive = true;

    async function connect() {
      while (alive) {
        try {
          const res = await fetch(`${API_URL}/api/v1/messages/stream`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok || !res.body) {
            await new Promise((r) => setTimeout(r, 3_000));
            continue;
          }
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
                  const receipt = parsed as { type: string; threadId: string };
                  setMessages((prev) =>
                    prev.map((m) => m.threadId === receipt.threadId ? { ...m, isRead: true } : m),
                  );
                } else {
                  const msg = parsed as DirectMessage;
                  const curUserId = activeUserIdRef.current;
                  setMessages((prev) => {
                    if (!curUserId) return prev;
                    if (msg.senderId !== curUserId && msg.recipientId !== curUserId) return prev;
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                  });
                  void loadThreads();
                }
              } catch {}
            }
          }
        } catch {
          if (!alive) return;
          await new Promise((r) => setTimeout(r, 3_000));
        }
      }
    }

    void connect();
    return () => { alive = false; };
  }, [token, loadThreads]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (view === 'conversation') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  const openConversation = useCallback(async (userId: string, name: string, avatarUrl?: string | null) => {
    setActiveUserId(userId);
    setActiveName(name);
    setActiveAvatarUrl(avatarUrl ?? null);
    setView('conversation');
    setMessages([]);
    setLoadingMsgs(true);
    if (!token) return;
    try {
      const res = await mutfakApi.getMessages(userId, token, { limit: 40 });
      setMessages(res.data);
    } catch {}
    setLoadingMsgs(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [token]);

  const handleSend = useCallback(async () => {
    if (!activeUserId || !body.trim() || sending || !token) return;
    const text = body.trim();
    setSending(true);
    setBody('');
    try {
      const msg = await mutfakApi.sendMessage(activeUserId, text, token);
      setMessages((prev) => [...prev, msg]);
      void loadThreads();
    } catch {
      setBody(text);
    }
    setSending(false);
    textareaRef.current?.focus();
  }, [activeUserId, body, sending, token, loadThreads]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQ(q);
    clearTimeout(searchDebounce.current);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchBusy(true);
    searchDebounce.current = setTimeout(async () => {
      if (!token) return;
      try {
        const members = await mutfakApi.listMembers(token, q);
        setSearchResults(members.slice(0, 8).filter((m) => m.id !== me?.id));
      } catch {}
      setSearchBusy(false);
    }, 300);
  }, [token, me?.id]);

  const deleteThread = useCallback(async (userId: string) => {
    if (!token) return;
    try {
      await mutfakApi.deleteThread(userId, token);
      setThreads((prev) => prev.filter((t) => t.counterpart?.id !== userId));
      if (activeUserId === userId) {
        setActiveUserId(null);
        setMessages([]);
        setView('threads');
      }
    } catch {}
  }, [token, activeUserId]);

  const goBack = useCallback(() => {
    setView('threads');
    setActiveUserId(null);
    setMessages([]);
    void loadThreads();
  }, [loadThreads]);

  const openSearch = useCallback(() => {
    setView('search');
    setSearchQ('');
    setSearchResults([]);
  }, []);

  return (
    // Hidden on mobile — mobile users use the full /mesajlar page via bottom nav
    <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-3">
      {/* Panel */}
      {open && (
        <div
          className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden"
          style={{ height: 480 }}
        >
          {/* Header */}
          <div className="bg-[#26496b] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {view === 'conversation' && (
                <button onClick={goBack} className="text-white/70 hover:text-white shrink-0 p-0.5 -ml-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {view === 'conversation' && (
                <Avatar name={activeName} src={activeAvatarUrl} size={24} />
              )}
              <span className="text-white font-semibold text-sm truncate">
                {view === 'conversation' ? activeName : 'Mesajlar'}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {view === 'threads' && (
                <button
                  onClick={openSearch}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Yeni mesaj"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {view === 'search' && (
                <button onClick={() => setView('threads')} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {view === 'conversation' && (
                <button
                  onClick={() => void deleteThread(activeUserId!)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-red-300 hover:bg-white/10 transition-colors"
                  title="Konuşmayı sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Küçült"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Thread list */}
          {view === 'threads' && (
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-3 pb-6">
                  <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs">Henüz mesajınız yok</span>
                  <button onClick={openSearch} className="text-xs font-semibold text-[#26496b] hover:underline">
                    Üye ara ve mesaj gönder →
                  </button>
                </div>
              ) : (
                threads.map((t) => {
                  const cp = t.counterpart;
                  if (!cp) return null;
                  const name = cp.displayName ?? 'Üye';
                  return (
                    <div key={t.threadId} className="group relative border-b border-gray-50/80">
                      <button
                        onClick={() => openConversation(cp.id, name, cp.avatarUrl)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left pr-10"
                      >
                        <Avatar name={name} src={cp.avatarUrl} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${t.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {name}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(t.lastMessageAt)}</span>
                          </div>
                          {t.lastBody && (
                            <p className={`text-xs truncate mt-0.5 ${t.unreadCount > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                              {t.lastBody}
                            </p>
                          )}
                        </div>
                        {t.unreadCount > 0 && (
                          <span className="w-4.5 h-4.5 min-w-[18px] rounded-full bg-[#26496b] text-white text-[10px] flex items-center justify-center font-bold shrink-0 px-1">
                            {t.unreadCount > 9 ? '9+' : t.unreadCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); void deleteThread(cp.id); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Konuşmayı sil"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Search view */}
          {view === 'search' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-3 pt-3 pb-2 shrink-0">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    autoFocus
                    type="text"
                    value={searchQ}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Üye ara..."
                    className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#26496b] focus:ring-2 focus:ring-[#26496b]/10 transition-shadow"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {searchBusy && <div className="text-center text-xs text-gray-400 py-6">Aranıyor...</div>}
                {!searchBusy && searchQ.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-6">Sonuç bulunamadı</div>
                )}
                {!searchBusy && searchQ.length < 2 && (
                  <div className="text-center text-xs text-gray-400 py-6">En az 2 karakter girin</div>
                )}
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => openConversation(u.id, u.displayName, u.avatarUrl)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50/80 text-left"
                  >
                    <Avatar name={u.displayName} src={u.avatarUrl} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.displayName}</p>
                      {u.profession && <p className="text-xs text-gray-400 truncate">{u.profession}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation view */}
          {view === 'conversation' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
                {loadingMsgs && <div className="text-center text-xs text-gray-400 py-4">Yükleniyor...</div>}
                {!loadingMsgs && messages.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-8">
                    Henüz mesaj yok. İlk mesajı siz gönderin.
                  </div>
                )}
                {messages.map((m) => {
                  const isMine = m.senderId === me?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isMine
                          ? 'bg-[#26496b] text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {m.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="px-3 py-2.5 border-t border-gray-100 shrink-0 flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Mesaj yaz..."
                  rows={2}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#26496b] focus:ring-2 focus:ring-[#26496b]/10 resize-none transition-shadow"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!body.trim() || sending}
                  className="p-2.5 rounded-xl bg-[#26496b] text-white hover:bg-[#26496b]/90 disabled:opacity-40 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-14 h-14 rounded-full bg-[#26496b] text-white shadow-lg hover:bg-[#26496b]/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Mesajlar"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
