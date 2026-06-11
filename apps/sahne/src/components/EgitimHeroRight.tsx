'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Stat {
  value: number | string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

interface Props {
  count?: number;
  stats: Stat[];
  bannerSub?: string;
  modalTitle?: string;
  modalSub?: string;
}

export function EgitimHeroRight({
  count = 250,
  stats,
  bannerSub = 'yeni eğitim ve etkinlikleri ilk öğreniyor',
  modalTitle = 'Yeni eğitimleri kaçırma',
  modalSub = 'Eğitim, etkinlik ve proje duyurularını ilk sen öğren.',
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [modalPos, setModalPos] = useState({ top: 0, right: 0 });
  const bannerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouse(e: MouseEvent) {
      if (
        modalRef.current && !modalRef.current.contains(e.target as Node) &&
        bannerRef.current && !bannerRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', onMouse);
    return () => document.removeEventListener('mousedown', onMouse);
  }, [open]);

  function toggle() {
    if (!open && bannerRef.current) {
      const rect = bannerRef.current.getBoundingClientRect();
      setModalPos({ top: rect.bottom + window.scrollY + 8, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
    setStatus('idle');
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col gap-3 shrink-0">

      {/* Banner */}
      <button
        ref={bannerRef}
        onClick={toggle}
        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all cursor-pointer group text-left ${
          open
            ? 'bg-white/10 border-white/20'
            : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/15'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-[#66aca9]/15 border border-[#66aca9]/20 flex items-center justify-center shrink-0">
          <svg className="text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#66aca9] leading-tight">{count}+ meslektaş</p>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{bannerSub}</p>
        </div>
        <div className="w-px self-stretch my-3 shrink-0 bg-white/10" />
        <div className="flex items-center gap-1 shrink-0 text-[#66aca9] text-xs font-semibold group-hover:gap-2 transition-all whitespace-nowrap">
          E-bültene Katıl
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Stat kutuları — modal açıkken gizle */}
      <div className={`flex gap-3 sm:gap-4 transition-all duration-300 ${open ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
        {stats.map(stat => (
          <div key={stat.label} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center backdrop-blur-sm min-w-[90px]">
            <p className={`text-2xl sm:text-3xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{stat.label}</p>
            <div className="flex justify-center mt-2">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Portal Modal */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={modalRef}
          style={{ position: 'absolute', top: modalPos.top, right: modalPos.right, zIndex: 9999 }}
          className="w-[340px] bg-[#0d1b2a] rounded-2xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden"
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-white/8">
            <div className="w-10 h-10 rounded-2xl bg-[#66aca9]/20 flex items-center justify-center shrink-0">
              <svg className="text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{modalTitle}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{modalSub}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 p-1 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/8 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-4">
            {status === 'done' ? (
              <div className="flex items-center gap-2 py-2 text-emerald-400">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold">Kaydedildiniz!</p>
              </div>
            ) : (
              <form onSubmit={subscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  className="flex-1 min-w-0 text-sm px-3 py-2.5 rounded-xl border border-white/12 bg-white/8 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#66aca9]/40 focus:border-[#66aca9]/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="shrink-0 px-4 py-2.5 text-sm font-bold text-white bg-[#66aca9] hover:bg-[#7bbcba] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                >
                  {status === 'loading' ? '…' : 'Katıl'}
                </button>
              </form>
            )}
            {status === 'error' && <p className="text-xs text-red-400 mt-2">Bir hata oluştu, tekrar deneyin.</p>}

            <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-white/8">
              <div className="flex -space-x-1.5">
                {(['#26496b', '#2a7a6e', '#66aca9'] as const).map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-[#0d1b2a] flex items-center justify-center text-white text-[7px] font-bold" style={{ backgroundColor: c }}>
                    {['S', 'A', 'M'][i]}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                <span className="font-semibold text-[#66aca9]">{count}+ meslektaş</span> aramızda, sen de katıl!
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
