'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

const FIELD_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS', fotogrametri: 'Fotogrametri',
  kadastro: 'Kadastro', uzaktan_algilama: 'Uzaktan Algılama',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme', yazilim: 'Yazılım',
  kariyer: 'Kariyer', egitim: 'Eğitim', kamu: 'Kamu',
  ozel_sektor: 'Özel Sektör', insaat: 'İnşaat', genel: 'Genel',
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
function SuggestModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ term: '', fullForm: '', definition: '', submitterName: '', submitterEmail: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 placeholder-gray-400 bg-white';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.term.trim() || !form.definition.trim()) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`${API}/api/v1/library/terms/suggest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: form.term.trim(), fullForm: form.fullForm.trim() || undefined, definition: form.definition.trim(), submitterName: form.submitterName.trim() || undefined, submitterEmail: form.submitterEmail.trim() || undefined }),
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Adınız <span className="font-normal text-gray-400">(isteğe bağlı)</span></label>
                  <input value={form.submitterName} onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))} maxLength={100} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">E-posta <span className="font-normal text-gray-400">(isteğe bağlı)</span></label>
                  <input type="email" value={form.submitterEmail} onChange={e => setForm(f => ({ ...f, submitterEmail: e.target.value }))} maxLength={200} className={inp} />
                </div>
              </div>
              <p className="text-xs text-gray-400">Öneriler yayına girmeden önce ekibimiz tarafından incelenir.</p>
              <button type="submit" disabled={busy || !form.term.trim() || !form.definition.trim()}
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

// ─── Term Row ────────────────────────────────────────────────────────────────
function TermRow({ item, onFieldClick, activeField }: { item: Term; onFieldClick: (f: string) => void; activeField: string }) {
  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    if (item.slug) window.location.href = `/kutuphane/sozluk/${item.slug}`;
  }
  return (
    <div onClick={handleCardClick}
      className={[
        'group relative flex overflow-hidden rounded-xl border bg-white transition-all duration-150 cursor-pointer',
        'hover:shadow-md hover:-translate-y-px',
        item.isFeatured ? 'border-amber-200' : 'border-gray-200 hover:border-gray-300',
      ].join(' ')}>
      <div className={`w-[3px] shrink-0 ${item.isFeatured ? 'bg-amber-400' : 'bg-transparent group-hover:bg-[#0b1829]/20'} transition-colors`} />
      <div className="flex-1 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            <span className="text-[16px] font-black text-[#0b1829] leading-tight">{item.term}</span>
            {item.fullForm && <span className="text-[12px] text-gray-400 italic shrink-0">{item.fullForm}</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {item.isFeatured && <span className="text-[9px] font-black bg-amber-400 text-[#0b1829] px-2 py-0.5 rounded-full tracking-wide">★ ÖNE ÇIKAN</span>}
            {isNew(item.createdAt) && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full tracking-wide">YENİ</span>}
            {item.viewCount > 0 && <span className="text-[11px] text-gray-300 font-medium tabular-nums">{item.viewCount.toLocaleString('tr-TR')}</span>}
          </div>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed mt-1.5 line-clamp-2">{item.definition}</p>
        {item.fields.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {item.fields.map(f => (
              <button key={f} onClick={() => onFieldClick(f)}
                className={`text-[10px] font-bold border px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeField === f ? 'bg-[#0b1829] border-[#0b1829] text-white' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#0b1829]/40 hover:text-[#0b1829]'}`}>
                {FIELD_LABELS[f] ?? f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export default function SozlukClient({ initialTerms }: { initialTerms: Term[] }) {
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('');
  const [activeField, setActiveField] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const letterRefs = useRef<Record<string, HTMLElement | null>>({});
  const filterScrollRef = useRef<HTMLDivElement>(null);

  function scrollFilter(dir: 'left' | 'right') {
    filterScrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  }

  const isFiltered = !!(search || activeLetter || activeField);

  const filtered = useMemo(() => {
    let result = initialTerms;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.term.toLowerCase().includes(q) ||
        (t.fullForm?.toLowerCase().includes(q) ?? false) ||
        t.definition.toLowerCase().includes(q)
      );
    }
    if (activeLetter) {
      result = result.filter(t => t.term[0]?.toUpperCase() === activeLetter);
    }
    if (activeField) {
      result = result.filter(t => t.fields.includes(activeField));
    }
    return result;
  }, [initialTerms, search, activeLetter, activeField]);

  const grouped = useMemo(() => {
    if (isFiltered) return null;
    const g: Record<string, Term[]> = {};
    for (const t of initialTerms) {
      const k = t.term[0]?.toUpperCase() ?? '#';
      if (!g[k]) g[k] = [];
      g[k]!.push(t);
    }
    return g;
  }, [initialTerms, isFiltered]);

  const presentLetters = grouped ? new Set(Object.keys(grouped)) : new Set<string>();

  const trending = useMemo(() =>
    [...initialTerms].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10),
    [initialTerms]
  );
  const newest = useMemo(() =>
    [...initialTerms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [initialTerms]
  );

  function scrollToLetter(l: string) {
    letterRefs.current[l]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const displayTerms = isFiltered ? filtered : initialTerms;

  return (
    <>
      <Navbar />
      {showSuggest && <SuggestModal onClose={() => setShowSuggest(false)} />}
      <main className="min-h-screen bg-gray-50">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-[#0b1829] text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none overflow-hidden">
            <span className="text-[200px] font-black text-white/[0.03] leading-none tracking-tighter -mr-4">A–Z</span>
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-1.5 text-xs mb-7">
              <Link href="/kutuphane" className="text-white/40 hover:text-white/70 transition-colors">Meslek Kütüphanesi</Link>
              <span className="text-white/20">›</span>
              <span className="text-white/70 font-medium">Meslek Sözlüğü</span>
            </div>
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-9 bg-amber-400 rounded-full" />
                  <h1 className="text-[42px] font-black leading-none tracking-tight">Meslek Sözlüğü</h1>
                </div>
                <p className="text-white/40 text-sm leading-relaxed max-w-md pl-4">
                  Mesleğimizde kullanılan terimlerin doğrulanmış tanımları.
                </p>
              </div>
              <button onClick={() => setShowSuggest(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm text-white font-semibold transition-colors cursor-pointer">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Terim Öner
              </button>
            </div>

            <div className="relative max-w-2xl">
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

        {/* ── Field Filters — sticky ─────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-20 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* ── Main 3-col layout ─────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6">

            {/* Col 1 — A-Z rail */}
            <div className="hidden lg:block shrink-0 w-10">
              <div className="flex flex-col gap-0.5 pt-2">
                <button onClick={() => { setActiveLetter(''); setSearch(''); setActiveField(''); }}
                  className={`w-9 h-7 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${!activeLetter && !isFiltered ? 'bg-[#0b1829] text-white' : 'text-gray-400 hover:text-[#0b1829] hover:bg-gray-100'}`}>
                  Tüm
                </button>
                {ALPHABET.map(l => {
                  const active = activeLetter === l;
                  const present = presentLetters.has(l);
                  return (
                    <button key={l}
                      onClick={() => {
                        if (grouped && present) { setActiveLetter(''); scrollToLetter(l); }
                        else { setActiveLetter(activeLetter === l ? '' : l); }
                      }}
                      className={`w-9 h-7 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${active ? 'bg-[#0b1829] text-white' : present ? 'text-[#0b1829] hover:bg-gray-100' : 'text-gray-300'}`}>
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Col 2 — Terms list */}
            <div className="flex-1 min-w-0">
              {/* Mobile alphabet */}
              <div className="lg:hidden flex gap-1 mb-5 overflow-x-auto scrollbar-none pb-1">
                <button onClick={() => { setActiveLetter(''); setSearch(''); }}
                  className={`shrink-0 px-2.5 h-8 rounded-lg text-xs font-bold cursor-pointer ${!activeLetter ? 'bg-[#0b1829] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
                  Tümü
                </button>
                {ALPHABET.map(l => (
                  <button key={l} onClick={() => setActiveLetter(activeLetter === l ? '' : l)}
                    className={`shrink-0 w-8 h-8 rounded-lg text-xs font-bold cursor-pointer ${activeLetter === l ? 'bg-[#0b1829] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Active filter chips */}
              {isFiltered && (
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  {search && <span className="inline-flex items-center gap-1.5 bg-[#0b1829] text-white text-xs font-semibold px-3 py-1.5 rounded-full">"{search}" <button onClick={() => setSearch('')} className="opacity-60 hover:opacity-100 cursor-pointer">✕</button></span>}
                  {activeLetter && <span className="inline-flex items-center gap-1.5 bg-[#0b1829] text-white text-xs font-semibold px-3 py-1.5 rounded-full">Harf: {activeLetter} <button onClick={() => setActiveLetter('')} className="opacity-60 hover:opacity-100 cursor-pointer">✕</button></span>}
                  {activeField && <span className="inline-flex items-center gap-1.5 bg-[#0b1829] text-white text-xs font-semibold px-3 py-1.5 rounded-full">{FIELD_LABELS[activeField]} <button onClick={() => setActiveField('')} className="opacity-60 hover:opacity-100 cursor-pointer">✕</button></span>}
                  <span className="text-xs text-gray-400">{filtered.length} sonuç</span>
                </div>
              )}

              {/* Terms content */}
              {displayTerms.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
                  <p className="text-gray-400 text-sm mb-4">Arama kriterinize uyan terim bulunamadı.</p>
                  <button onClick={() => setShowSuggest(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b1829] text-white text-sm font-bold rounded-xl hover:bg-[#1a3350] cursor-pointer transition-colors">
                    Terim Öner
                  </button>
                </div>
              ) : grouped && !isFiltered ? (
                <div className="space-y-8">
                  {ALPHABET.filter(l => grouped[l]?.length).map(l => (
                    <div key={l} ref={el => { letterRefs.current[l] = el; }} id={`letter-${l}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0b1829] flex items-center justify-center shrink-0">
                          <span className="text-lg font-black text-amber-400 leading-none">{l}</span>
                        </div>
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[11px] text-gray-400 font-medium shrink-0">{grouped[l]!.length}</span>
                      </div>
                      <div className="space-y-2">
                        {grouped[l]!.map(item => <TermRow key={item.id} item={item} onFieldClick={setActiveField} activeField={activeField} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {displayTerms.map(item => <TermRow key={item.id} item={item} onFieldClick={setActiveField} activeField={activeField} />)}
                </div>
              )}
            </div>

            {/* Col 3 — Gündem sidebar */}
            <div className="hidden xl:block shrink-0 w-52">
              <div className="pt-2 space-y-6">
                {trending.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      <p className="text-[11px] font-black tracking-widest uppercase text-gray-500">Gündem</p>
                    </div>
                    <div className="space-y-0.5">
                      {trending.map((t, i) => (
                        <button key={t.id}
                          onClick={() => { if (t.slug) window.location.href = `/kutuphane/sozluk/${t.slug}`; else setSearch(t.term); }}
                          className="w-full text-left flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                          <span className={`text-[11px] font-black w-4 shrink-0 mt-0.5 tabular-nums ${i < 3 ? 'text-amber-500' : 'text-gray-300'}`}>{i + 1}</span>
                          <span className="text-[12px] text-gray-700 font-medium leading-snug group-hover:text-[#0b1829] flex-1 line-clamp-2">{t.term}</span>
                          {t.viewCount > 0 && <span className="text-[10px] text-gray-300 shrink-0 mt-0.5 tabular-nums">{t.viewCount.toLocaleString('tr-TR')}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {newest.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <p className="text-[11px] font-black tracking-widest uppercase text-gray-500">Yeni Eklenenler</p>
                    </div>
                    <div className="space-y-0.5">
                      {newest.map(t => (
                        <button key={t.id}
                          onClick={() => { if (t.slug) window.location.href = `/kutuphane/sozluk/${t.slug}`; else setSearch(t.term); }}
                          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-[12px] text-gray-600 font-medium group-hover:text-[#0b1829] transition-colors line-clamp-1">{t.term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Bottom CTA ─────────────────────────────────────────── */}
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
              <Link href="/kutuphane" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer">
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
