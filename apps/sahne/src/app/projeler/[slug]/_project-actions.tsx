'use client';

import { useState } from 'react';

// ── Kompakt paylaş ikonları ─────────────────────────────────────────────────

export function InlineShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-400 dark:text-slate-500 mr-1">Paylaş</span>

      <a href={linkedinHref} target="_blank" rel="noopener noreferrer"
        title="LinkedIn'de Paylaş"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#0a66c2] hover:bg-[#0a66c2]/10 transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>

      <a href={twitterHref} target="_blank" rel="noopener noreferrer"
        title="X'te Paylaş"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.255 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      <button onClick={copyLink} title="Bağlantıyı Kopyala"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
        {copied ? (
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Sidebar paylaş butonları ───────────────────────────────────────────────

export function SidebarShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-2">
      <a href={linkedinHref} target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-lg bg-[#0a66c2]/10 text-[#0a66c2] flex items-center justify-center hover:bg-[#0a66c2]/20 transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
      <a href={twitterHref} target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.255 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <button onClick={copyLink}
        className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
        {copied ? (
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Beğeni & Favori ──────────────────────────────────────────────────────────

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('haritailesi_token') ?? null;
}

export function ProjectInteractions({
  projectSlug,
  initialLikeCount = 0,
  initialFavCount = 0,
  initialCommentCount = 0,
}: {
  projectSlug: string;
  initialLikeCount?: number;
  initialFavCount?: number;
  initialCommentCount?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [favCount, setFavCount] = useState(initialFavCount);
  const [commentCount] = useState(initialCommentCount);
  const [loading, setLoading] = useState(false);
  const [noAuth, setNoAuth] = useState(false);

  // İlk yüklemede kullanıcı durumunu çek
  useState(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(`${API_URL}/api/v1/cms/projects/${projectSlug}/interactions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setLiked(data.liked ?? false);
        setFavorited(data.favorited ?? false);
        setLikeCount(data.likeCount ?? initialLikeCount);
        setFavCount(data.favoriteCount ?? initialFavCount);
      })
      .catch(() => {});
  });

  async function handleLike() {
    const token = getAuthToken();
    if (!token) { setNoAuth(true); setTimeout(() => setNoAuth(false), 3000); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/projects/${projectSlug}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { liked: boolean };
      setLiked(data.liked);
      setLikeCount((c) => data.liked ? c + 1 : Math.max(0, c - 1));
    } finally { setLoading(false); }
  }

  async function handleFavorite() {
    const token = getAuthToken();
    if (!token) { setNoAuth(true); setTimeout(() => setNoAuth(false), 3000); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/projects/${projectSlug}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { favorited: boolean };
      setFavorited(data.favorited);
      setFavCount((c) => data.favorited ? c + 1 : Math.max(0, c - 1));
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-2">
      {noAuth && (
        <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-2">
          Bu özellik için Mutfak üyesi girişi gereklidir.
        </div>
      )}
      <div className="flex gap-2">
        {/* Beğen */}
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-all ${
            liked
              ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/40 text-rose-600 dark:text-rose-400'
              : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-rose-200 hover:text-rose-500'
          }`}
        >
          <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[10px] font-semibold">{likeCount > 0 ? likeCount : ''} Beğen</span>
        </button>
        {/* Kaydet */}
        <button
          onClick={handleFavorite}
          disabled={loading}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-all ${
            favorited
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-600 dark:text-amber-400'
              : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-200 hover:text-amber-500'
          }`}
        >
          <svg className="w-5 h-5" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-[10px] font-semibold">{favCount > 0 ? favCount : ''} Kaydet</span>
        </button>
      </div>
      {commentCount > 0 && (
        <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center">{commentCount} yorum</p>
      )}
    </div>
  );
}

// ── Yorum alanı ────────────────────────────────────────────────────────────

export function CommentBox({ projectSlug }: { projectSlug: string }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<'idle' | 'pending' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !firstName.trim() || !lastName.trim() || !email.trim()) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/projects/${projectSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), body: body.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        setErrorMsg(err.message ?? 'Bir hata oluştu, tekrar dene.');
        return;
      }
      setState('pending');
    } catch {
      setErrorMsg('Bağlantı hatası, tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] dark:focus:border-[#66aca9] transition';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200 mb-3">Yorum Yaz</p>

      {state === 'pending' ? (
        <div className="space-y-2 py-2">
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">Doğrulama e-postası gönderildi!</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            <strong>{email}</strong> adresine bir doğrulama bağlantısı gönderdik. Yorumun yayınlanması için e-postanı kontrol et ve bağlantıya tıkla.
          </p>
          <button onClick={() => setState('idle')} className="text-xs text-[#26496b] dark:text-[#66aca9] underline mt-1">
            Başka bir yorum yaz
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={firstName} onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ad" required minLength={2}
              className={inputCls}
            />
            <input
              value={lastName} onChange={(e) => setLastName(e.target.value)}
              placeholder="Soyad" required minLength={2}
              className={inputCls}
            />
          </div>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta adresi" required
            className={inputCls}
          />
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Bu proje hakkında bir şeyler yaz…"
            rows={3} required minLength={10}
            className={`${inputCls} resize-none`}
          />
          {errorMsg && (
            <p className="text-xs text-red-500">{errorMsg}</p>
          )}
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            Yorumun yayınlanmadan önce e-posta doğrulaması gerektirir.
          </p>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !body.trim() || !firstName.trim() || !lastName.trim() || !email.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1a3350] disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function ShareButton({ url }: { url: string }) {
  function share() {
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }
  return (
    <button onClick={share} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      <span className="text-sm">Paylaş</span>
    </button>
  );
}

export function KpiShare({ url }: { url: string }) {
  function share() {
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }
  return (
    <button onClick={share} className="flex flex-col items-center justify-center gap-1.5 bg-white/5 rounded-xl py-3 px-2 hover:bg-white/10 transition-colors w-full cursor-pointer">
      <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      <span className="text-[10px] text-white/50">Paylaş</span>
    </button>
  );
}
