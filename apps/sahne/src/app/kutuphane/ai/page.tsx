'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  const key = 'hi_ai_session';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

const SUGGESTIONS = [
  'CBS ve GIS arasındaki fark nedir?',
  'KPSS harita bölümü konuları neler?',
  'Fotogrametri nedir, ne işe yarar?',
  'Gayrimenkul değerleme lisansı nasıl alınır?',
];

export default function KutuphaneAiPage() {
  return (
    <Suspense fallback={null}>
      <KutuphaneAiInner />
    </Suspense>
  );
}

function KutuphaneAiInner() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const q = searchParams.get('question');
    if (q && !sentInitial.current) {
      sentInitial.current = true;
      setInput(q);
    }
  }, [searchParams]);

  const contextTitle = searchParams.get('title');
  const contextType = searchParams.get('type');

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
          sessionId: getSessionId(),
          context: 'library',
        }),
      });

      if (!res.ok) throw new Error('Yanıt alınamadı');

      const data = await res.json() as { conversationId: string; message: Message };
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, data.message]);
    } catch {
      setError('Yanıt alınamadı. Lütfen tekrar deneyin.');
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0c1a2e] to-[#26496b] text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
              <Link href="/kutuphane" className="hover:text-white/80 transition-colors">Meslek Kütüphanesi</Link>
              <span>›</span>
              <span className="text-white/80">AI Asistan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="font-black text-lg">Kütüphane Asistanı</h1>
                <p className="text-xs text-white/60">Haritacılık ve geomatik alanında sorularını yanıtlar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">

          {/* Empty state / suggestions */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#26496b]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
                </svg>
              </div>
              {contextTitle ? (
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#26496b]/60 uppercase tracking-wide mb-1">
                    {contextType === 'term' ? 'Terim' : contextType === 'guide' ? 'Rehber' : contextType === 'regulation' ? 'Mevzuat' : 'İçerik'} hakkında sor
                  </p>
                  <p className="font-bold text-gray-900 mb-1 text-lg">{contextTitle}</p>
                  <p className="text-sm text-gray-500">Sorunuzu yazın veya aşağıdaki önerilerden birini seçin.</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-bold text-gray-900 mb-1">Nasıl yardımcı olabilirim?</p>
                  <p className="text-sm text-gray-500">Haritacılık, CBS, sınavlar veya kariyer hakkında sorularını sor.</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="text-left text-sm px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-[#26496b]/40 hover:bg-[#26496b]/5 transition-colors text-gray-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#26496b] flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#26496b] text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 text-gray-900 rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#26496b] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesleğin hakkında bir şeyler sor…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]/50 max-h-32 overflow-y-auto"
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={() => void send(input)}
                disabled={!input.trim() || loading}
                className="shrink-0 w-11 h-11 rounded-xl bg-[#26496b] text-white flex items-center justify-center hover:bg-[#1e3a56] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              AI yanıtları bilgi amaçlıdır. Kritik kararlar için yetkili kaynaklara başvurun.
            </p>
          </div>
        </div>

      </main>
    </>
  );
}
