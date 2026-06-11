'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Props {
  count?: number;
  bannerSub?: string;
  modalTitle?: string;
  modalSub?: string;
  variant?: 'dark' | 'light';
  avatars?: boolean;
}

export function HeroNewsletterBanner({
  count = 250,
  bannerSub = 'haberleri ve duyuruları ilk öğreniyor',
  modalTitle = 'Haberdar ol',
  modalSub = 'Haritailesi e-bülteni ile güncel gelişmeleri ilk sen öğren.',
  variant = 'dark',
  avatars = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [modalPos, setModalPos] = useState({ top: 0, left: 0 });
  const bannerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isLight = variant === 'light';

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
      setModalPos({ top: rect.bottom + window.scrollY + 8, left: rect.left });
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

  const bannerClass = isLight
    ? `w-full flex items-stretch gap-4 px-5 py-4 transition-all cursor-pointer group text-left ${open ? 'bg-gray-50 dark:bg-slate-800/60' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'}`
    : `flex items-stretch gap-4 px-4 py-4 rounded-2xl border transition-all cursor-pointer group text-left ${open ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/15'}`;

  return (
    <>
      <button ref={bannerRef} onClick={toggle} className={bannerClass}>
        {(!isLight && avatars) ? (
          /* Dark + avatars: avatar cluster */
          <div className="flex items-center gap-2 shrink-0 self-center">
            <div className="flex -space-x-2">
              {[
                'https://i.pravatar.cc/40?img=47',
                'https://i.pravatar.cc/40?img=32',
                'https://i.pravatar.cc/40?img=11',
              ].map((src, i) => (
                <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-[#0c1a2e] object-cover" />
              ))}
            </div>
            <span className="text-sm font-bold text-white/80">+{count - 3}</span>
          </div>
        ) : (
          /* Envelope icon (light variant veya dark without avatars) */
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 self-center ${isLight ? 'bg-[#66aca9]/10 border border-[#66aca9]/15' : 'bg-[#66aca9]/15 border border-[#66aca9]/20'}`}>
            <svg className="text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-sm font-bold text-[#66aca9] leading-tight">{count}+ meslektaş</p>
          <p className={`text-[11px] leading-tight mt-0.5 ${isLight ? 'text-gray-400 dark:text-slate-500' : 'text-slate-400'}`}>{bannerSub}</p>
        </div>
        <div className={`w-px my-3 shrink-0 ${isLight ? 'bg-gray-200 dark:bg-slate-700' : 'bg-white/10'}`} />
        <div className="flex items-center gap-1 shrink-0 self-center text-[#66aca9] text-xs font-semibold group-hover:gap-2 transition-all whitespace-nowrap">
          E-bültene Katıl
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={modalRef}
          style={{ position: 'absolute', top: modalPos.top, left: modalPos.left, zIndex: 9999 }}
          className={`w-[340px] rounded-2xl shadow-2xl overflow-hidden border ${
            isLight
              ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-black/10'
              : 'bg-[#0d1b2a] border-white/10 shadow-black/40'
          }`}
        >
          <div className={`flex items-start gap-3 px-5 pt-5 pb-4 border-b ${isLight ? 'border-gray-100 dark:border-slate-800' : 'border-white/8'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isLight ? 'bg-[#66aca9]/10' : 'bg-[#66aca9]/20'}`}>
              <svg className="text-[#66aca9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${isLight ? 'text-gray-900 dark:text-slate-100' : 'text-white'}`}>{modalTitle}</p>
              <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? 'text-gray-500 dark:text-slate-400' : 'text-slate-400'}`}>{modalSub}</p>
            </div>
            <button onClick={() => setOpen(false)} className={`shrink-0 p-1 rounded-lg transition-colors cursor-pointer ${isLight ? 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:text-slate-600 dark:hover:text-slate-400 dark:hover:bg-slate-800' : 'text-white/25 hover:text-white/60 hover:bg-white/8'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-4">
            {status === 'done' ? (
              <div className={`flex items-center gap-2 py-2 ${isLight ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-400'}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold">Kaydedildiniz!</p>
              </div>
            ) : (
              <form onSubmit={subscribe} className="flex gap-2">
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  className={`flex-1 min-w-0 text-sm px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#66aca9]/30 focus:border-[#66aca9]/50 transition-colors ${
                    isLight
                      ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500'
                      : 'border-white/12 bg-white/8 text-white placeholder-white/30'
                  }`}
                />
                <button type="submit" disabled={status === 'loading'}
                  className="shrink-0 px-4 py-2.5 text-sm font-bold text-white bg-[#66aca9] hover:bg-[#7bbcba] disabled:opacity-60 rounded-xl transition-colors cursor-pointer">
                  {status === 'loading' ? '…' : 'Katıl'}
                </button>
              </form>
            )}
            {status === 'error' && <p className="text-xs text-red-500 mt-2">Bir hata oluştu, tekrar deneyin.</p>}
            <div className={`flex items-center gap-2.5 mt-3 pt-3 border-t ${isLight ? 'border-gray-100 dark:border-slate-800' : 'border-white/8'}`}>
              <div className="flex -space-x-1.5">
                {(['#26496b', '#2a7a6e', '#66aca9'] as const).map((c, i) => (
                  <div key={i} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-[7px] font-bold ${isLight ? 'border-white dark:border-slate-900' : 'border-[#0d1b2a]'}`} style={{ backgroundColor: c }}>
                    {['S', 'A', 'M'][i]}
                  </div>
                ))}
              </div>
              <p className={`text-[11px] ${isLight ? 'text-gray-400 dark:text-slate-500' : 'text-slate-400'}`}>
                <span className="font-semibold text-[#66aca9]">{count}+ meslektaş</span> aramızda, sen de katıl!
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
