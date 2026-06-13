'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const FIELD_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS', fotogrametri: 'Fotogrametri',
  kadastro: 'Kadastro', uzaktan_algilama: 'Uzaktan Algılama',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme', yazilim: 'Yazılım',
  kariyer: 'Kariyer', egitim: 'Eğitim', kamu: 'Kamu',
  ozel_sektor: 'Özel Sektör', insaat: 'İnşaat', genel: 'Genel',
};

const FIELD_EMOJIS: Record<string, string> = {
  cbs: '🗺️', klasik_haritacilik: '📐', fotogrametri: '📸',
  kadastro: '📋', uzaktan_algilama: '🛰️', gayrimenkul_degerleme: '🏢',
  yazilim: '💻', kariyer: '🎯', kamu: '🏛️', insaat: '🏗️',
  genel: '📚', egitim: '🎓', ozel_sektor: '💼',
};

const FIELDS = Object.keys(FIELD_LABELS);

function isNew(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 30 * 24 * 60 * 60 * 1000;
}

export interface Term {
  id: string; slug: string | null; term: string; fullForm: string | null;
  definition: string; fields: string[]; tags: string[]; isFeatured: boolean;
  viewCount: number; createdAt: string; level?: string | null;
}

// ─── Suggest Modal ────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SuggestModal({ onClose }: { onClose: () => void }) {
  const { user } = useSahneAuth();
  const [form, setForm] = useState({ term: '', fullForm: '', definition: '', submitterName: '', submitterEmail: '' });
  const [emailError, setEmailError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 placeholder-gray-400 bg-white';

  function validateEmail(val: string) {
    if (val && !EMAIL_RE.test(val)) {
      setEmailError('Geçerli bir e-posta adresi girin.');
    } else {
      setEmailError('');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.term.trim() || !form.definition.trim()) return;
    if (!user && form.submitterEmail && !EMAIL_RE.test(form.submitterEmail)) return;
    setBusy(true); setError('');
    try {
      const submitterEmail = user ? user.email : (form.submitterEmail.trim() || undefined);
      const submitterName = user
        ? (user.profile?.displayName ?? undefined)
        : (form.submitterName.trim() || undefined);
      const res = await fetch(`${API}/api/v1/library/terms/suggest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ term: form.term.trim(), fullForm: form.fullForm.trim() || undefined, definition: form.definition.trim(), submitterName, submitterEmail }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch { setError('Bir hata oluştu, lütfen tekrar deneyin.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0b1829] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-[#0b1829]">Terim Öner</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5">
          {done ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Öneriniz Alındı!</h3>
              <p className="text-sm text-gray-500 mb-5">Ekibimiz inceleyip onayladıktan sonra sözlüğe eklenecek.</p>
              <button onClick={onClose} className="px-5 py-2 bg-[#0b1829] text-white text-sm font-bold rounded-xl hover:bg-[#1a3350] transition-colors cursor-pointer">Kapat</button>
            </div>
          ) : (
            <form onSubmit={e => void submit(e)} className="space-y-3">
              {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Terim *</label>
                <input value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))} placeholder="örn. Fotogrametri" required maxLength={120} className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Açık adı / İngilizce karşılığı <span className="font-normal text-gray-400">(isteğe bağlı)</span></label>
                <input value={form.fullForm} onChange={e => setForm(f => ({ ...f, fullForm: e.target.value }))} placeholder="örn. Photogrammetry" maxLength={200} className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Tanım *</label>
                <textarea value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))} rows={4} maxLength={2000} placeholder="Terimin net ve anlaşılır tanımını yazın…" required className={inp + ' resize-none'} />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.definition.length}/2000</p>
              </div>
              {user ? (
                <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-[#0b1829] flex items-center justify-center text-[11px] font-black text-amber-400 shrink-0">
                    {(user.profile?.displayName ?? user.email)[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    {user.profile?.displayName && <p className="text-sm font-semibold text-gray-800 truncate">{user.profile.displayName}</p>}
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Adınız <span className="font-normal text-gray-400">(isteğe bağlı)</span></label>
                    <input value={form.submitterName} onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))} maxLength={100} className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">E-posta <span className="font-normal text-gray-400">(isteğe bağlı)</span></label>
                    <input
                      type="text"
                      value={form.submitterEmail}
                      onChange={e => { setForm(f => ({ ...f, submitterEmail: e.target.value })); validateEmail(e.target.value); }}
                      onBlur={e => validateEmail(e.target.value)}
                      maxLength={200}
                      className={inp + (emailError ? ' border-red-400 focus:border-red-400 focus:ring-red-400/30' : '')}
                    />
                    {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400">Öneriler yayına girmeden önce ekibimiz tarafından incelenir.</p>
              <button type="submit" disabled={busy || !form.term.trim() || !form.definition.trim() || !!emailError}
                className="w-full py-3 bg-[#0b1829] text-white text-sm font-bold rounded-xl hover:bg-[#1a3350] disabled:opacity-50 transition-colors cursor-pointer">
                {busy ? 'Gönderiliyor…' : 'Öneriyi Gönder'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Compact Term Row (arama/filtre sonuçları için) ───────────────────────────
function TermRow({ item, onFieldClick, activeField }: { item: Term; onFieldClick: (f: string) => void; activeField: string }) {
  function handleClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    if (item.slug) window.location.href = `/kutuphane/sozluk/${item.slug}`;
  }
  return (
    <div onClick={handleClick}
      className={[
        'group flex items-center gap-3 px-4 py-3 rounded-xl border bg-white cursor-pointer',
        'transition-all hover:shadow-md hover:-translate-y-px',
        item.isFeatured ? 'border-l-[3px] border-l-amber-400 border-gray-200' : 'border-gray-200 hover:border-gray-300',
      ].join(' ')}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black shrink-0 ${item.isFeatured ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-[#0b1829]'}`}>
        {item.term[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[14px] font-bold text-[#0b1829]">{item.term}</span>
          {item.fullForm && <span className="text-[11px] text-gray-400 italic">{item.fullForm}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {item.fields.slice(0, 2).map(f => (
            <button key={f} onClick={() => onFieldClick(f)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${activeField === f ? 'bg-[#0b1829] text-white border-[#0b1829]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'}`}>
              {FIELD_LABELS[f] ?? f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {item.isFeatured && <span className="text-[9px] font-black bg-amber-400 text-[#0b1829] px-2 py-0.5 rounded-full">★ ÖNE ÇIKAN</span>}
        {isNew(item.createdAt) && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">YENİ</span>}
        {item.viewCount > 0 && <span className="text-[11px] text-gray-300 tabular-nums">{item.viewCount.toLocaleString('tr-TR')}</span>}
      </div>
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function SozlukClient({ initialTerms }: { initialTerms: Term[] }) {
  const [search, setSearch] = useState('');
  const [activeField, setActiveField] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  function scrollFilter(dir: 'left' | 'right') {
    filterScrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  }

  const isFiltered = !!(search || activeField);

  const filtered = useMemo(() => {
    if (!isFiltered) return [];
    let result = initialTerms;
    if (search) {
      const q = search.toLowerCase();
      const wordMatch = (str: string) => str.toLowerCase().split(/[\s\-_/]+/).some(w => w.startsWith(q));
      result = result.filter(t => wordMatch(t.term) || (t.fullForm ? wordMatch(t.fullForm) : false));
    }
    if (activeField) result = result.filter(t => t.fields.includes(activeField));
    return result;
  }, [initialTerms, search, activeField, isFiltered]);

  const dailyTerm = useMemo(() => {
    const featured = initialTerms.filter(t => t.isFeatured);
    const pool = featured.length > 0 ? featured : initialTerms;
    const idx = new Date().getDate() % pool.length;
    return pool[idx] ?? null;
  }, [initialTerms]);

  const featuredTerms = useMemo(() =>
    initialTerms.filter(t => t.isFeatured).slice(0, 4),
    [initialTerms]
  );

  const newestTerms = useMemo(() =>
    [...initialTerms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [initialTerms]
  );

  const trending = useMemo(() =>
    [...initialTerms].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10),
    [initialTerms]
  );

  const stubTerms = useMemo(() =>
    initialTerms.filter(t => !t.isFeatured && t.definition.length < 120).slice(0, 4),
    [initialTerms]
  );

  const handleFieldClick = useCallback((f: string) => {
    setActiveField(prev => prev === f ? '' : f);
  }, []);

  return (
    <>
      <Navbar />
      {showSuggest && <SuggestModal onClose={() => setShowSuggest(false)} />}
      <main className="min-h-screen bg-gray-50">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-[#0b1829] text-white relative min-h-[340px]">
          {/* Arka plan resmi — sağ taraf, sola geçişli */}
          <div className="absolute inset-0 left-[36%]"
            style={{ backgroundImage: "url('/sozluk.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, #0b1829 0%, #0b1829 4%, rgba(11,24,41,0.85) 40%, rgba(11,24,41,0.2) 100%)' }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-1.5 text-xs mb-7">
              <Link href="/kutuphane" className="text-white/40 hover:text-white/70 transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/20">›</span>
              <span className="text-white/70 font-medium">Meslek Sözlüğü</span>
            </div>
            <div className="mb-8">
              <div className="mb-3">
                <h1 className="text-[42px] font-black leading-none tracking-tight"><span className="text-amber-400">Meslek</span> Sözlüğü</h1>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-md">
                Mesleğimizde kullanılan terimlerin doğrulanmış tanımları.
              </p>
            </div>
            <div className="flex items-center gap-3 max-w-2xl">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                </svg>
                <input type="text" placeholder="Terim ara… (örn. CBS, GNSS, Ortofoto)" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-white/10 border border-white/15 hover:border-white/30 focus:border-amber-400/60 rounded-2xl text-white placeholder-white/30 text-sm focus:outline-none transition-all" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 cursor-pointer transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <button onClick={() => setShowSuggest(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-3.5 bg-amber-400 hover:bg-amber-300 text-[#0b1829] text-sm font-black rounded-2xl transition-colors cursor-pointer whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Terim Öner
              </button>
            </div>
            <div className="flex items-center gap-8 mt-8 pt-6 border-t border-white/10">
              <div><span className="text-2xl font-black text-white">{initialTerms.length}</span><span className="text-white/35 text-xs ml-1.5 font-medium uppercase tracking-wider">Terim</span></div>
              <div className="w-px h-5 bg-white/10" />
              <div><span className="text-2xl font-black text-white">{FIELDS.length}</span><span className="text-white/35 text-xs ml-1.5 font-medium uppercase tracking-wider">Alan</span></div>
              {initialTerms.filter(t => t.isFeatured).length > 0 && (
                <><div className="w-px h-5 bg-white/10" /><div><span className="text-2xl font-black text-amber-400">{initialTerms.filter(t => t.isFeatured).length}</span><span className="text-white/35 text-xs ml-1.5 font-medium uppercase tracking-wider">Öne Çıkan</span></div></>
              )}
            </div>
          </div>
        </div>

        {/* ── Alan Filtreleri ────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1">
              <button onClick={() => scrollFilter('left')}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div ref={filterScrollRef} className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none flex-1">
                <button onClick={() => setActiveField('')}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${!activeField ? 'bg-[#0b1829] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Tüm Alanlar
                </button>
                {FIELDS.map(f => (
                  <button key={f} onClick={() => setActiveField(activeField === f ? '' : f)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${activeField === f ? 'bg-[#0b1829] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {FIELD_LABELS[f]}
                  </button>
                ))}
              </div>
              <button onClick={() => scrollFilter('right')}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── İçerik ────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {isFiltered ? (
            /* Arama / alan filtresi sonuçları */
            <div>
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {search && <span className="inline-flex items-center gap-1.5 bg-[#0b1829] text-white text-xs font-semibold px-3 py-1.5 rounded-full">"{search}" <button onClick={() => setSearch('')} className="opacity-60 hover:opacity-100 cursor-pointer">✕</button></span>}
                {activeField && <span className="inline-flex items-center gap-1.5 bg-[#0b1829] text-white text-xs font-semibold px-3 py-1.5 rounded-full">{FIELD_LABELS[activeField]} <button onClick={() => setActiveField('')} className="opacity-60 hover:opacity-100 cursor-pointer">✕</button></span>}
                <span className="text-xs text-gray-400">{filtered.length} sonuç</span>
              </div>
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
                  <p className="text-gray-400 text-sm mb-4">Arama kriterinize uyan terim bulunamadı.</p>
                  <button onClick={() => setShowSuggest(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b1829] text-white text-sm font-bold rounded-xl hover:bg-[#1a3350] cursor-pointer transition-colors">
                    Terim Öner
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(item => <TermRow key={item.id} item={item} onFieldClick={handleFieldClick} activeField={activeField} />)}
                </div>
              )}
            </div>
          ) : (
            /* Editorial ana görünüm */
            <div className="grid grid-cols-1 xl:grid-cols-[75%_1fr] gap-8 items-start">

              {/* Sol: içerik kolonu */}
              <div className="flex flex-col gap-8">

                {/* Günün Terimi */}
                {dailyTerm && (
                  <div className="relative bg-white border border-gray-200 rounded-2xl px-8 py-6 flex items-center gap-8 overflow-hidden shadow-sm">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-2xl" />
                    <span className="absolute text-amber-400/10 text-[120px] font-black leading-none pointer-events-none select-none" style={{ top: '-10px', right: '180px' }}>✦</span>
                    <span className="absolute text-amber-400/10 text-[60px] font-black leading-none pointer-events-none select-none" style={{ top: '30px', right: '145px' }}>✦</span>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full tracking-widest mb-3">✦ GÜNÜN TERİMİ</div>
                      <h2 className="text-3xl font-black text-[#0b1829] mb-1">{dailyTerm.term}</h2>
                      {dailyTerm.fullForm && <p className="text-sm text-gray-400 italic mb-2">{dailyTerm.fullForm}</p>}
                      <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3 mb-4 max-w-lg">{dailyTerm.definition}</p>
                      {dailyTerm.slug ? (
                        <Link href={`/kutuphane/sozluk/${dailyTerm.slug}`}
                          className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0b1829] font-black text-sm px-5 py-2.5 rounded-xl transition-colors">
                          Detayını İncele →
                        </Link>
                      ) : (
                        <button onClick={() => setSearch(dailyTerm.term)}
                          className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0b1829] font-black text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
                          Detayını İncele →
                        </button>
                      )}
                    </div>
                    <div className="hidden sm:flex shrink-0 w-24 h-24 items-center justify-center text-6xl opacity-80">
                      {FIELD_EMOJIS[dailyTerm.fields[0] ?? ''] ?? '📖'}
                    </div>
                    {dailyTerm.viewCount > 0 && (
                      <div className="absolute bottom-3 right-4 flex items-center gap-1 text-[11px] text-gray-300">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {dailyTerm.viewCount.toLocaleString('tr-TR')} kişi okudu
                      </div>
                    )}
                  </div>
                )}

                {/* Öne Çıkan Terimler */}
                {featuredTerms.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[15px] font-black text-[#0b1829]">Öne Çıkan Terimler</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {featuredTerms.map(t => (
                        <div key={t.id}
                          onClick={() => { if (t.slug) window.location.href = `/kutuphane/sozluk/${t.slug}`; else setSearch(t.term); }}
                          className="bg-white border border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#0b1829] hover:shadow-md transition-all group">
                          <div className="text-3xl mb-2">{FIELD_EMOJIS[t.fields[0] ?? ''] ?? '📌'}</div>
                          <div className="text-[14px] font-black text-[#0b1829] mb-1 leading-tight">{t.term}</div>
                          {t.fullForm && <div className="text-[10px] text-gray-400 mb-2 leading-snug line-clamp-2">{t.fullForm}</div>}
                          {t.viewCount > 0 && (
                            <div className="flex items-center justify-center gap-1 text-[11px] text-gray-300">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              {t.viewCount.toLocaleString('tr-TR')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Son Eklenen + Katkı Bekleyen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Son Eklenen */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[14px] font-black text-[#0b1829]">Son Eklenen Terimler</h3>
                    </div>
                    <div className="space-y-0">
                      {newestTerms.map((t, i) => (
                        <div key={t.id}
                          onClick={() => { if (t.slug) window.location.href = `/kutuphane/sozluk/${t.slug}`; else setSearch(t.term); }}
                          className={`flex items-center gap-2.5 py-2.5 cursor-pointer group ${i < newestTerms.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-[13px] font-semibold text-[#0b1829] flex-1 min-w-0 truncate group-hover:text-[#26496b] transition-colors">{t.term}</span>
                          {t.fields[0] && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">{FIELD_LABELS[t.fields[0]] ?? t.fields[0]}</span>}
                          {isNew(t.createdAt) && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">YENİ</span>}
                          {t.viewCount > 0 && <span className="text-[10px] text-gray-300 shrink-0 tabular-nums">{t.viewCount}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Katkı Bekleyen */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[14px] font-black text-[#0b1829]">Katkı Bekleyen Terimler</h3>
                    </div>
                    {stubTerms.length > 0 ? (
                      <div className="space-y-0">
                        {stubTerms.map((t, i) => (
                          <div key={t.id} className={`flex items-center gap-3 py-2.5 ${i < stubTerms.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">
                              {FIELD_EMOJIS[t.fields[0] ?? ''] ?? '📝'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold text-[#0b1829] truncate">{t.term}</div>
                              <div className="text-[11px] text-gray-400">Tanım geliştiriliyor</div>
                            </div>
                            <button onClick={() => setShowSuggest(true)}
                              className="text-[11px] font-bold px-3 py-1 rounded-lg border border-[#0b1829] text-[#0b1829] hover:bg-[#0b1829] hover:text-white transition-colors cursor-pointer shrink-0">
                              Katkı Yap
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-gray-400">
                        <p className="mb-3">Eksik terim önerebilirsiniz</p>
                        <button onClick={() => setShowSuggest(true)}
                          className="text-xs font-bold text-[#26496b] hover:underline cursor-pointer">
                          Terim Öner →
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Sağ: sidebar */}
              <div className="hidden xl:flex flex-col gap-4">

                {/* Terimler TOP 10 */}
                {trending.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-3 mb-1 border-b border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-[11px] font-black tracking-widest uppercase text-gray-600">Terimler TOP 10</span>
                    </div>
                    <div className="space-y-0.5 mt-2">
                      {trending.map((t, i) => (
                        <button key={t.id}
                          onClick={() => { if (t.slug) window.location.href = `/kutuphane/sozluk/${t.slug}`; else setSearch(t.term); }}
                          className="w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                          <span className={`text-[11px] font-black w-4 shrink-0 tabular-nums text-right ${i < 3 ? 'text-amber-500' : 'text-gray-300'}`}>{i + 1}</span>
                          <span className="text-[12px] text-gray-700 font-semibold flex-1 truncate group-hover:text-[#0b1829]">{t.term}</span>
                          {t.viewCount > 0 && <span className="text-[10px] text-gray-300 shrink-0 tabular-nums">{t.viewCount.toLocaleString('tr-TR')}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* En Aktif Katkı Verenler (statik placeholder) */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-[11px] font-black tracking-widest uppercase text-gray-600">En Aktif Katkı Verenler</span>
                  </div>
                  {[
                    { init: 'Y', name: 'Yakımaz', count: 128, color: '#0b1829', text: '#F59E0B' },
                    { init: 'A', name: 'Ayşe Demir', count: 96, color: '#26496b', text: '#fff' },
                    { init: 'M', name: 'Mehmet Kaya', count: 74, color: '#374151', text: '#fff' },
                    { init: 'Z', name: 'Zeynep Arslan', count: 58, color: '#4b5563', text: '#fff' },
                    { init: 'E', name: 'Emre Yıldız', count: 41, color: '#6b7280', text: '#fff' },
                  ].map(c => (
                    <div key={c.name} className="flex items-center gap-2.5 py-1.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                        style={{ background: c.color, color: c.text }}>{c.init}</div>
                      <span className="flex-1 text-[12px] font-semibold text-gray-800 truncate">{c.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{c.count} katkı</span>
                    </div>
                  ))}
                  <div className="pt-3 mt-1 border-t border-gray-100">
                    <button className="text-[11px] font-bold text-[#26496b] hover:underline cursor-pointer">Tüm Katkı Verenler →</button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── CTA ────────────────────────────────────────────────────── */}
          <div className="border-t border-gray-200 mt-10 mb-8" />
          <div className="bg-[#0b1829] rounded-3xl px-8 sm:px-12 py-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none overflow-hidden">
              <span className="text-[160px] font-black text-white/5 leading-none -mr-4">?</span>
            </div>
            <div className="relative">
              <p className="text-white font-black text-xl sm:text-2xl leading-tight">Eksik bir terim mi gördünüz?</p>
              <p className="text-white/40 text-sm mt-1.5">Önerin onaylandığında sözlüğe eklenir, katkın kayıt altına alınır.</p>
            </div>
            <div className="relative flex items-center gap-3 shrink-0">
              <Link href="/kutuphane" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold text-white transition-colors">
                Kütüphane
              </Link>
              <button onClick={() => setShowSuggest(true)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0b1829] font-black text-sm rounded-xl transition-colors cursor-pointer">
                Terim Öner →
              </button>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
