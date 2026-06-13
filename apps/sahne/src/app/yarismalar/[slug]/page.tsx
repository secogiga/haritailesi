'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import { EmailOtpVerifier } from '@/components/EmailOtpVerifier';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Competition {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  posterUrl: string | null;
  deadline: string | null;
  prizes: string | null;
  category: string | null;
  status: string;
  applicationCount: string;
  viewCount: number;
  winnersText: string | null;
  createdAt: string;
}

// ── Apply Modal ───────────────────────────────────────────────────────────────

function ApplyModal({ comp, onClose, onApplied }: { comp: Competition; onClose: () => void; onApplied: () => void }) {
  const [form, setForm] = useState({ displayName: '', email: '', notes: '' });
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const inp = (locked?: boolean) => `w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] transition-colors${locked ? ' opacity-60 pointer-events-none select-none' : ''}`;

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setShowOtp(true);
  }

  async function submitWithToken(emailToken: string) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/competitions/${comp.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, emailToken, source: 'sahne' }),
      });
      if (!res.ok) throw new Error((await res.json() as { message?: string }).message ?? 'Hata');
      const app = await res.json() as { id: string };

      if (file && app.id) {
        const fd = new FormData();
        fd.append('file', file);
        await fetch(`${API}/api/v1/competitions/applications/${app.id}/file`, {
          method: 'POST', body: fd,
        }).catch(() => {});
      }
      setDone(true);
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setShowOtp(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Yarışmaya Başvur</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{comp.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 mt-0.5 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-gray-900 text-lg">Başvurunuz Alındı!</p>
            <p className="text-sm text-gray-500 mt-2">
              {file ? 'Dosyanız yüklendi. Ekibimiz sizinle iletişime geçecek.' : 'Ekibimiz sizinle iletişime geçecek.'}
            </p>
            <button onClick={onClose} className="mt-5 text-sm text-[#26496b] hover:underline font-semibold">Kapat</button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
              <input required className={inp(showOtp)} disabled={showOtp} value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Adınız Soyadınız" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta *</label>
              <input required type="email" className={inp(showOtp)} disabled={showOtp} value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ornek@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notunuz</label>
              <textarea rows={3} className={inp(showOtp)} disabled={showOtp} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Varsa eklemek istediğiniz bilgiler…" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Dosya Yükle <span className="font-normal text-gray-400">(isteğe bağlı)</span>
              </label>
              {file ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-sm text-blue-700 truncate flex-1">{file.name}</span>
                  {!showOtp && <button type="button" onClick={() => setFile(null)} className="text-blue-400 hover:text-blue-600 text-xs">Kaldır</button>}
                </div>
              ) : !showOtp ? (
                <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#26496b]/40 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-gray-400">Dosya seç veya buraya sürükle</span>
                  <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </label>
              ) : null}
            </div>

            {showOtp ? (
              <div className="border-t border-gray-100 pt-4">
                <EmailOtpVerifier
                  email={form.email}
                  onVerified={token => void submitWithToken(token)}
                  onBack={() => { setShowOtp(false); setError(''); }}
                />
              </div>
            ) : (
              <>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={busy}
                  className="w-full bg-[#26496b] text-white font-bold py-3.5 rounded-xl hover:bg-[#1e3a56] transition-colors text-sm disabled:opacity-50">
                  Başvuruyu Gönder
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

// ── Deadline helpers ──────────────────────────────────────────────────────────

function deadlineInfo(deadline: string | null): { label: string; urgency: 'past' | 'urgent' | 'soon' | 'ok' | null } {
  if (!deadline) return { label: '', urgency: null };
  const d = new Date(deadline);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (days < 0) return { label: 'Süre Doldu', urgency: 'past' };
  if (days === 0) return { label: 'Son Gün!', urgency: 'urgent' };
  if (days <= 7) return { label: `${days} Gün Kaldı`, urgency: 'urgent' };
  if (days <= 14) return { label: `${days} Gün Kaldı`, urgency: 'soon' };
  return {
    label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
    urgency: 'ok',
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="h-72 sm:h-96 bg-gray-100 animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-4/6 animate-pulse" />
      </div>
    </main>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function YarismaDetayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, recordAction } = useSahneAuth();
  const [comp, setComp] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/v1/competitions/${slug}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json() as Promise<Competition>;
      })
      .then(data => {
        if (data) {
          setComp(data);
          try {
            setHasApplied(!!localStorage.getItem(`snd_comp_${data.id}`));
          } catch {}
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleApplied() {
    if (!comp) return;
    try { localStorage.setItem(`snd_comp_${comp.id}`, new Date().toISOString()); } catch {}
    setHasApplied(true);
    if (user) void recordAction('p-yarisma');
  }

  if (loading) return <Skeleton />;

  if (notFound || !comp) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Yarışma bulunamadı</h1>
            <p className="text-gray-500 text-sm mb-6">Bu yarışma mevcut değil ya da kaldırılmış olabilir.</p>
            <Link href="/sen-ne-dersin/yarismalar" className="text-sm font-semibold text-[#26496b] hover:underline">← Tüm Yarışmalar</Link>
          </div>
        </main>
      </>
    );
  }

  const dl = deadlineInfo(comp.deadline);
  const isActive = comp.status === 'active';
  const isEnded = comp.status === 'ended';
  const appCount = Number(comp.applicationCount ?? 0);

  return (
    <>
      <Navbar />
      {applying && <ApplyModal comp={comp} onClose={() => setApplying(false)} onApplied={handleApplied} />}

      <main className="min-h-screen bg-gray-50 dark:bg-[#070c1a]">

        {/* ── Hero ── */}
        {comp.posterUrl ? (
          <div className="relative h-72 sm:h-96 lg:h-[480px] overflow-hidden">
            <img src={comp.posterUrl} alt={comp.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <Link href="/sen-ne-dersin/yarismalar" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tüm Yarışmalar
              </Link>
              <div className="flex flex-wrap gap-2 mb-3">
                {comp.category && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-400/90 text-amber-900">
                    {comp.category}
                  </span>
                )}
                {isActive && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white">Aktif</span>}
                {isEnded && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">Sona Erdi</span>}
                {dl.urgency === 'urgent' && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/90 text-white">{dl.label}</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">{comp.title}</h1>
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-[#26496b] to-[#1a3050] overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 300 150" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                <circle cx="250" cy="30" r="120" fill="white" />
                <circle cx="40" cy="130" r="90" fill="white" />
              </svg>
            </div>
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
              <Link href="/sen-ne-dersin/yarismalar" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tüm Yarışmalar
              </Link>
              <div className="flex flex-wrap gap-2 mb-4">
                {comp.category && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">{comp.category}</span>
                )}
                {isActive && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-400/80 text-white">Aktif</span>}
                {isEnded && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70">Sona Erdi</span>}
                {dl.urgency === 'urgent' && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/80 text-white">{dl.label}</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">{comp.title}</h1>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Main content ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Description */}
              {comp.description && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 sm:p-8">
                  <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4">Yarışma Hakkında</h2>
                  <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">{comp.description}</p>
                </div>
              )}

              {/* Prizes */}
              {comp.prizes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">Ödüller</h2>
                  </div>
                  <div className="space-y-2">
                    {comp.prizes.split(/[|,]/).map((prize, i) => prize.trim() && (
                      <div key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200">{i + 1}</span>
                        </span>
                        <span className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{prize.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winners */}
              {isEnded && comp.winnersText && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl border border-violet-200 dark:border-violet-800/40 p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-800/40 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h2 className="text-base font-bold text-violet-900 dark:text-violet-200">Kazananlar</h2>
                  </div>
                  <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed whitespace-pre-line">{comp.winnersText}</p>
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">

              {/* CTA card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 sticky top-6">
                {/* Stats */}
                <div className="space-y-3 mb-6">
                  {comp.deadline && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#26496b] text-xs font-semibold">Son Başvuru Tarihi</span>
                      <span className={`text-xs font-semibold capitalize ${dl.urgency === 'urgent' ? 'text-red-600' : dl.urgency === 'past' ? 'text-gray-400' : 'text-gray-700 dark:text-slate-300'}`}>
                        {dl.urgency === 'ok'
                          ? new Date(comp.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : dl.label}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#26496b] text-xs font-semibold">Başvuru Sayısı</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{appCount} Başvuru</span>
                  </div>
                  {comp.category && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#26496b] text-xs font-semibold">Kategori</span>
                      <span className="text-xs font-normal text-gray-500 capitalize">{comp.category}</span>
                    </div>
                  )}
                </div>

                {/* Deadline progress bar */}
                {dl.urgency === 'urgent' && (
                  <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {dl.label} — başvuruyu kaçırma!
                    </p>
                  </div>
                )}

                {hasApplied && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs font-semibold text-emerald-700">Başvuru yapıldı</span>
                  </div>
                )}
                {isActive ? (
                  <button
                    onClick={() => setApplying(true)}
                    className="w-full py-4 bg-[#26496b] hover:bg-[#1e3a56] text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {hasApplied ? 'Tekrar Başvur' : 'Başvur'}
                  </button>
                ) : (
                  <div className="w-full py-4 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 font-semibold rounded-xl text-sm text-center">
                    {isEnded ? 'Başvurular kapandı' : 'Henüz aktif değil'}
                  </div>
                )}
              </div>

              {/* Share */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
                <p className="text-xs text-[#26496b] mb-3 font-semibold">Paylaş</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(window.location.href).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:border-[#26496b] hover:text-[#26496b] transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Kopyalandı!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Linki Kopyala
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      void navigator.share?.({ title: comp.title, url: window.location.href });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:border-[#26496b] hover:text-[#26496b] transition-colors"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Paylaş
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
