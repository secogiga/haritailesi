'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi, refreshAccessToken } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  registered_user:     'Kayıtlı',
  haritailesi_genc:    'Haritailesi Genç',
  new_graduate_member: 'Mesleğin Geleceği',
  individual_member:   'Mesleğin Değer Ortağı',
  corporate_member:    'Kurumsal Üye',
};
const TIER_KEYS = Object.keys(TIER_LABELS);
type Target = 'user' | 'tier' | 'all';

// ─── Shared types ─────────────────────────────────────────────────────────────

interface SentRecord {
  id: string;
  subject: string;
  body: string;
  target: string;
  targetTier: string | null;
  sentCount: number;
  sentEmail: boolean;
  sentNotification: boolean;
  sentAt: string;
  adminDisplayName: string | null;
}

type InboxThread = Awaited<ReturnType<typeof adminApi.getAdminInboxThreads>>[number];
type InboxMessage = Awaited<ReturnType<typeof adminApi.getAdminInboxMessages>>[number];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  return `${Math.floor(diff / 86400)}g`;
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

function SuccessToast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#26496b] text-white px-5 py-3.5 rounded-xl shadow-xl animate-in slide-in-from-bottom-4 duration-300">
      <svg className="w-5 h-5 text-[#66aca9] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm font-medium">{msg}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Broadcast tab ────────────────────────────────────────────────────────────

type Channel = 'both' | 'notification' | 'email';

function BroadcastTab() {
  const [target, setTarget] = useState<Target>('tier');
  const [targetTier, setTargetTier] = useState('individual_member');
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; displayName: string; email: string; tier: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; displayName: string; email: string } | null>(null);
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<Channel>('both');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<SentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    adminApi.getBroadcastHistory()
      .then((rows) => setHistory(rows.map((r) => ({
        id: r.id,
        subject: r.subject,
        body: r.body,
        target: r.target === 'tier' ? (TIER_LABELS[r.targetTier ?? ''] ?? r.targetTier ?? 'Bilinmeyen Tip') :
                r.target === 'all' ? 'Tüm aktif üyeler' : 'Tekil üye',
        targetTier: r.targetTier,
        sentCount: r.sentCount,
        sentEmail: r.sentEmail,
        sentNotification: r.sentNotification,
        sentAt: r.createdAt,
        adminDisplayName: r.adminDisplayName,
      }))))
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (target === 'user') { setRecipientCount(selectedUser ? 1 : null); return; }
    const tier = target === 'tier' ? targetTier : undefined;
    adminApi.previewBroadcastCount(target, tier)
      .then((r) => setRecipientCount(r.count))
      .catch(() => setRecipientCount(null));
  }, [target, targetTier, selectedUser]);

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) { setUserSearchResults([]); return; }
    try {
      const res = await adminApi.listUsers({ search: q, limit: '10' });
      setUserSearchResults(res.data.map((u) => ({ id: u.id, displayName: u.displayName ?? u.email, email: u.email, tier: u.membershipTier })));
    } catch { setUserSearchResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void searchUsers(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch, searchUsers]);

  // Auto-derive subject from first line / first 60 chars of body
  const derivedSubject = body.trim().split('\n')[0]?.slice(0, 60) ?? '';
  const canSend = body.trim().length >= 2 && (target !== 'user' || !!selectedUser);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || sending) return;
    setError('');
    setSending(true);
    try {
      const res = await adminApi.sendBroadcast({
        target,
        ...(target === 'tier' ? { targetTier } : {}),
        ...(target === 'user' && selectedUser ? { targetUserId: selectedUser.id } : {}),
        subject: derivedSubject || 'Haritailesi Yönetiminden',
        body: body.trim(),
        sendEmail: channel === 'both' || channel === 'email',
        sendNotification: channel === 'both' || channel === 'notification',
      });
      const targetLabel =
        target === 'all' ? 'Tüm aktif üyeler' :
        target === 'tier' ? (TIER_LABELS[targetTier] ?? targetTier) :
        selectedUser?.displayName ?? 'Seçili üye';
      setHistory((prev) => [{
        id: Date.now().toString(),
        subject: derivedSubject || 'Haritailesi Yönetiminden',
        body: body.trim(),
        target: targetLabel,
        targetTier: target === 'tier' ? targetTier : null,
        sentCount: res.sent,
        sentEmail: channel === 'both' || channel === 'email',
        sentNotification: channel === 'both' || channel === 'notification',
        sentAt: new Date().toISOString(),
        adminDisplayName: null,
      }, ...prev.slice(0, 49)]);
      setToast(`${res.sent} kişiye mesaj gönderildi.`);
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderim başarısız.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={(e) => void handleSend(e)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Target */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Kimler görecek?</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {([
              { key: 'tier', label: 'Üyelik Tipine Göre' },
              { key: 'user', label: 'Tekil Üye' },
              { key: 'all', label: 'Herkese' },
            ] as Array<{ key: Target; label: string }>).map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => { setTarget(key); setSelectedUser(null); setUserSearch(''); setUserSearchResults([]); }}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  target === key ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b]/40'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {target === 'tier' && (
            <select value={targetTier} onChange={(e) => setTargetTier(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]">
              {TIER_KEYS.map((k) => <option key={k} value={k}>{TIER_LABELS[k]}</option>)}
            </select>
          )}

          {target === 'user' && (
            <div className="relative">
              {selectedUser ? (
                <div className="flex items-center gap-3 px-3 py-2.5 border border-[#26496b]/30 bg-[#26496b]/5 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-[#26496b] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {selectedUser.displayName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedUser.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{selectedUser.email}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedUser(null); setUserSearch(''); }}
                    className="text-gray-400 hover:text-red-500 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="İsim veya e-posta ile ara..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]" />
                  {userSearchResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {userSearchResults.map((u) => (
                        <button key={u.id} type="button"
                          onClick={() => { setSelectedUser(u); setUserSearch(''); setUserSearchResults([]); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#26496b] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.displayName[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{u.displayName}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          <Badge color="bg-[#26496b]/10 text-[#26496b]">{TIER_LABELS[u.tier] ?? u.tier}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {recipientCount !== null && (
            <p className="mt-2 text-xs text-gray-500">
              <span className="font-semibold text-[#26496b]">{recipientCount}</span> kişiye gidecek
              {target === 'all' && <span className="ml-1 text-amber-600">— dikkatli kullanın</span>}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Mesaj</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            maxLength={2000} rows={5}
            placeholder="Mesajınızı buraya yazın..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] resize-none" />
          <p className="text-[11px] text-gray-300 text-right mt-1">{body.length} / 2000</p>
        </div>

        {/* Channel */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Nasıl gönderilsin?</label>
          <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 w-fit">
            {([
              { key: 'both',         label: 'Bildirim + E-posta' },
              { key: 'notification', label: 'Sadece Bildirim' },
              { key: 'email',        label: 'Sadece E-posta' },
            ] as Array<{ key: Channel; label: string }>).map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setChannel(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  channel === key ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={!canSend || sending}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {sending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
          {sending ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </form>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Gönderim Geçmişi</h2>
        {historyLoading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz mesaj gönderilmedi.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((h) => (
              <div key={h.id} className="py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2">{h.body}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-1.5">
                    <Badge color="bg-gray-100 text-gray-600">{h.target}</Badge>
                    <span className="text-xs text-gray-500">{h.sentCount} kişi</span>
                    {h.sentEmail && <Badge color="bg-blue-50 text-blue-700">E-posta</Badge>}
                    {h.sentNotification && <Badge color="bg-purple-50 text-purple-700">Bildirim</Badge>}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(h.sentAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <SuccessToast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Inbox tab ────────────────────────────────────────────────────────────────

function InboxTab() {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUserInfo, setActiveUserInfo] = useState<{ id: string; displayName: string } | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [newUserSearch, setNewUserSearch] = useState('');
  const [newUserResults, setNewUserResults] = useState<Array<{ id: string; displayName: string; email: string }>>([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeUserIdRef = useRef(activeUserId);
  useEffect(() => { activeUserIdRef.current = activeUserId; }, [activeUserId]);

  const activeThread = threads.find((t) => t.counterpart?.id === activeUserId);
  const activeDisplayName = activeThread?.counterpart?.displayName ?? activeUserInfo?.displayName ?? null;

  const loadThreads = useCallback(() => {
    void adminApi.getAdminInboxThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Load messages when thread changes
  useEffect(() => {
    if (!activeUserId) return;
    setMessages([]);
    setHasMore(false);
    setMessagesLoading(true);
    adminApi.getAdminInboxMessages(activeUserId)
      .then(({ data, hasMore: hm }) => {
        setMessages(data);
        setHasMore(hm);
        // Refresh thread list — creates the thread entry if this is a new conversation
        loadThreads();
      })
      .catch(console.error)
      .finally(() => setMessagesLoading(false));
  }, [activeUserId]);

  // Scroll to bottom on new messages
  const prevCount = useRef(0);
  useEffect(() => {
    const isInitial = prevCount.current === 0 && messages.length > 0;
    const isNew = messages.length > prevCount.current && prevCount.current !== 0;
    if (isInitial || isNew) bottomRef.current?.scrollIntoView({ behavior: isInitial ? 'instant' : 'smooth' });
    prevCount.current = messages.length;
  }, [messages]);

  // SSE — real-time DM stream (admin is also a user, same endpoint)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
    let alive = true;
    let retryDelay = 2_000;

    async function connect() {
      while (alive) {
        // Always read the latest token at connection time (may have been refreshed)
        let token = localStorage.getItem('access_token');
        if (!token) { setConnected(false); return; }

        try {
          const res = await fetch(`${API_URL}/api/v1/messages/stream`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Token expired — attempt refresh once then retry immediately
          if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) {
              // Refresh token also gone — session fully expired
              window.location.href = '/login';
              return;
            }
            token = newToken;
            continue; // reconnect with fresh token, no delay
          }

          if (!res.body) throw new Error('no body');
          retryDelay = 2_000;
          setConnected(true);
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
                  const receipt = parsed as { threadId: string; readBy: string };
                  setMessages((prev) =>
                    prev.map((m) => m.threadId === receipt.threadId ? { ...m, isRead: true } : m),
                  );
                } else {
                  const msg = parsed as InboxMessage;
                  const curUserId = activeUserIdRef.current;
                  if (msg.senderId === curUserId) {
                    setMessages((prev) => {
                      if (prev.some((m) => m.id === msg.id)) return prev;
                      return [...prev, msg];
                    });
                  }
                  loadThreads();
                }
              } catch { /* non-data line */ }
            }
          }
        } catch {
          setConnected(false);
          if (!alive) return;
          await new Promise((r) => setTimeout(r, retryDelay));
          retryDelay = Math.min(retryDelay * 2, 30_000);
        }
      }
    }

    void connect();
    return () => { alive = false; setConnected(false); };
  }, [loadThreads]);

  async function loadMore() {
    if (!activeUserId || !hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const before = messages[0]?.createdAt;
    try {
      const { data, hasMore: hm } = await adminApi.getAdminInboxMessages(activeUserId, { before });
      setMessages((prev) => [...data, ...prev]);
      setHasMore(hm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }

  const searchNewUser = useCallback(async (q: string) => {
    if (q.length < 2) { setNewUserResults([]); return; }
    try {
      const res = await adminApi.listUsers({ search: q, limit: '8' });
      setNewUserResults(res.data.map((u) => ({ id: u.id, displayName: u.displayName ?? u.email, email: u.email })));
    } catch { setNewUserResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void searchNewUser(newUserSearch), 300);
    return () => clearTimeout(t);
  }, [newUserSearch, searchNewUser]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !activeUserId || sending) return;
    setSending(true);
    try {
      const msg = await adminApi.sendAdminInboxMessage(activeUserId, body.trim());
      setMessages((prev) => [...prev, msg]);
      setBody('');
      loadThreads();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-13rem)] min-h-[500px]">
      {/* Thread list */}
      <div className="w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Konuşmalar</p>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-300'}`} title={connected ? 'Bağlı' : 'Bağlanıyor...'} />
        </div>

        {/* New conversation search */}
        <div className="px-3 py-2.5 border-b border-gray-50 relative">
          <input
            type="text"
            value={newUserSearch}
            onChange={(e) => setNewUserSearch(e.target.value)}
            placeholder="Yeni konuşma başlat..."
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
          />
          {newUserResults.length > 0 && (
            <div className="absolute left-3 right-3 top-full z-20 mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {newUserResults.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setActiveUserId(u.id); setActiveUserInfo({ id: u.id, displayName: u.displayName }); setNewUserSearch(''); setNewUserResults([]); }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-900">{u.displayName}</p>
                  <p className="text-[10px] text-gray-400">{u.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {threadsLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">Yükleniyor...</div>
          ) : threads.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              Henüz konuşma yok.<br />Yukarıdan üye arayın.
            </div>
          ) : (
            threads.map((t) => {
              const cp = t.counterpart;
              const isActive = cp?.id === activeUserId;
              return (
                <div key={t.threadId} className={`group relative flex items-center hover:bg-gray-50 transition-colors ${isActive ? 'bg-[#26496b]/5' : ''}`}>
                  <button
                    onClick={() => { setActiveUserId(cp?.id ?? null); if (cp) setActiveUserInfo({ id: cp.id, displayName: cp.displayName ?? 'Bilinmeyen' }); }}
                    className="flex-1 text-left px-3 py-3 flex items-center gap-2.5 min-w-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#26496b] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(cp?.displayName ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900 truncate">{cp?.displayName ?? 'Bilinmeyen'}</span>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-1">{timeAgo(t.lastMessageAt)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{t.lastBody ?? ''}</p>
                    </div>
                    {t.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[16px] h-4 bg-[#26496b] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                        {t.unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (!cp?.id) return;
                      void adminApi.deleteAdminInboxThread(cp.id).then(() => {
                        setThreads((prev) => prev.filter((x) => x.threadId !== t.threadId));
                        if (activeUserId === cp.id) { setActiveUserId(null); setMessages([]); }
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 mr-2 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
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
      </div>

      {/* Message pane */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-gray-400">
            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Soldaki listeden bir konuşma seçin<br />veya yeni konuşma başlatın.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#26496b] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(activeDisplayName ?? '?')[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{activeDisplayName ?? '...'}</p>
                {activeThread?.counterpart?.profession && (
                  <p className="text-xs text-gray-400">{activeThread.counterpart.profession}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {/* Load more older */}
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

              {messagesLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Yükleniyor...
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Henüz mesaj yok. İlk mesajı siz başlatın.</p>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.recipientId === activeUserId;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isAdmin
                          ? 'bg-[#26496b] text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {msg.body}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isAdmin ? 'text-white/60' : 'text-gray-400'}`}>
                          <span className="text-[10px]">{timeAgo(msg.createdAt)}</span>
                          {isAdmin && (
                            <span className={`inline-flex ml-0.5 ${msg.isRead ? 'text-[#66aca9]' : 'text-white/50'}`}>
                              <svg width="14" height="9" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1,5 4,8 10,2" />
                                <polyline points="6,5 9,8 15,2" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
                {sending ? '...' : 'Gönder'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMesajlarPage() {
  const [tab, setTab] = useState<'broadcast' | 'inbox'>('broadcast');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mesajlaşma</h1>
        <p className="text-sm text-gray-500 mt-1">Toplu yayın gönderin veya üyelerle doğrudan yazışın.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'broadcast', label: 'Yayın', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
          { key: 'inbox', label: 'Gelen Kutusu', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        ] as Array<{ key: 'broadcast' | 'inbox'; label: string; icon: string }>).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-[#26496b] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
            {label}
          </button>
        ))}
      </div>

      {tab === 'broadcast' ? <BroadcastTab /> : <InboxTab />}
    </div>
  );
}
