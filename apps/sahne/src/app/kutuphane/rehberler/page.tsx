'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const PAGE_SIZE = 5;

interface Guide {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: string;
  fields: string[];
  tags: string[];
  authorName: string | null;
  isFeatured: boolean;
  readingTimeMinutes: number | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  seriesSlug: string | null;
  seriesOrder: number | null;
}

const CARD_THEMES: Record<string, { bg: string; badgeBg: string; badgeText: string; badgeBorder: string; emoji: string; label: string }> = {
  guide:        { bg: '#f0fdf4', badgeBg: '#dcfce7', badgeText: '#15803d', badgeBorder: '#bbf7d0', emoji: '📖', label: 'Rehber' },
  technical_doc:{ bg: '#fffbeb', badgeBg: '#fef3c7', badgeText: '#b45309', badgeBorder: '#fde68a', emoji: '🔧', label: 'Teknik Not' },
  career_guide: { bg: '#fff1f2', badgeBg: '#ffe4e6', badgeText: '#be123c', badgeBorder: '#fecdd3', emoji: '🏢', label: 'Kariyer' },
  roadmap:      { bg: '#eff6ff', badgeBg: '#dbeafe', badgeText: '#1d4ed8', badgeBorder: '#bfdbfe', emoji: '🗺️', label: 'Yol Haritası' },
  article:      { bg: '#faf5ff', badgeBg: '#f3e8ff', badgeText: '#7e22ce', badgeBorder: '#e9d5ff', emoji: '📝', label: 'Makale' },
};

const DEFAULT_THEME = { bg: '#f8f9fa', badgeBg: '#f3f4f6', badgeText: '#374151', badgeBorder: '#e5e7eb', emoji: '📄', label: 'İçerik' };

const TABS = [
  { key: '', label: 'Tümü', icon: '📚' },
  { key: 'guide', label: 'Rehberler', icon: '📖' },
  { key: 'technical_doc', label: 'Teknik Notlar', icon: '🔧' },
  { key: 'career_guide', label: 'Kariyer Yolları', icon: '🗺️' },
  { key: 'roadmap', label: 'Mevzuat İçerikleri', icon: '⚖️' },
  { key: 'article', label: 'Başlangıç İçerikleri', icon: '🟢' },
];

const CAT_CARDS = [
  { cls: 'cat-c-green',  field: 'klasik_haritacilik', icon: '🛰️', bg: '#f0fdf4', arrowBg: '#f0fdf4', arrowColor: '#16a34a', title: 'Sahada Uygulama',    desc: 'Ölçüm, aplikasyon, saha çalışmaları' },
  { cls: 'cat-c-blue',   field: 'cbs',                icon: '💻', bg: '#eff6ff', arrowBg: '#eff6ff', arrowColor: '#2563eb', title: 'CBS & Yazılım',       desc: 'QGIS, veri analizi, programlama' },
  { cls: 'cat-c-purple', field: 'fotogrametri',        icon: '📷', bg: '#faf5ff', arrowBg: '#faf5ff', arrowColor: '#7c3aed', title: 'İHA & Fotogrametri',  desc: 'Drone, 3B modelleme, ortofoto üretimi' },
  { cls: 'cat-c-amber',  field: 'kadastro',            icon: '📋', bg: '#fffbeb', arrowBg: '#fffbeb', arrowColor: '#d97706', title: 'Kadastro & Mevzuat', desc: 'Mevzuat, yönetmelik, yasal süreçler' },
  { cls: 'cat-c-rose',   field: 'kariyer',             icon: '🎯', bg: '#fff1f2', arrowBg: '#fff1f2', arrowColor: '#e11d48', title: 'Kariyer & Büro',      desc: 'Kariyer yolları, serbest büro, iş yönetimi' },
  { cls: 'cat-c-teal',   field: 'yazilim',             icon: '📊', bg: '#f0fdfa', arrowBg: '#f0fdfa', arrowColor: '#0d9488', title: 'Veri & Analiz',       desc: 'Veri toplama, analiz, raporlama' },
];

const COLL_CARDS = [
  { bg: '#f0fdf4', filter: { by: 'type',  val: 'career_guide'       }, icon: '🎒', title: 'Yeni Mezun İçin Başlangıç Seti', desc: 'Haritacılık kariyerine yeni başlayanlar için temel rehberler.', count: 12, arrowBg: '#16a34a' },
  { bg: '#fefce8', filter: { by: 'field', val: 'kariyer'            }, icon: '💼', title: 'Serbest Büro Açma Paketi', desc: 'Büro açma süreci, mevzuat, iş yönetimi ve uygulama rehberleri.', count: 15, arrowBg: '#ca8a04' },
  { bg: '#eff6ff', filter: { by: 'field', val: 'cbs'                }, icon: '🖥️', title: 'CBS Öğrenme Yolu', desc: "QGIS'ten ileri analize, veri yönetiminden görselleştirmeye.", count: 18, arrowBg: '#2563eb' },
  { bg: '#fff7ed', filter: { by: 'field', val: 'klasik_haritacilik' }, icon: '📐', title: 'Saha Ölçümü Temel Seti', desc: 'Saha çalışmaları, ölçüm teknikleri ve uygulama rehberleri.', count: 14, arrowBg: '#ea580c' },
  { bg: '#fdf4ff', filter: { by: 'field', val: 'fotogrametri'       }, icon: '🚁', title: 'İHA & 3B Modelleme Rehber Seti', desc: 'Drone uçuşu, veri işleme ve 3B model üretimi adımları.', count: 16, arrowBg: '#c026d3' },
];

const PAGE_STYLES = `
  .cat-card-base { background:#fff; border:1px solid #e8e9ec; border-top:3px solid #e8e9ec; border-radius:16px; padding:19px 16px 16px; display:flex; flex-direction:column; gap:8px; cursor:pointer; transition:all 0.18s; }
  .cat-card-base:hover { box-shadow:0 6px 20px rgba(0,0,0,0.08); transform:translateY(-3px); }
  .cat-c-green:hover  { border-color:#16a34a; border-top-color:#16a34a; background:#f0fdf4; }
  .cat-c-blue:hover   { border-color:#2563eb; border-top-color:#2563eb; background:#eff6ff; }
  .cat-c-purple:hover { border-color:#7c3aed; border-top-color:#7c3aed; background:#faf5ff; }
  .cat-c-amber:hover  { border-color:#d97706; border-top-color:#d97706; background:#fffbeb; }
  .cat-c-rose:hover   { border-color:#e11d48; border-top-color:#e11d48; background:#fff1f2; }
  .cat-c-teal:hover   { border-color:#0d9488; border-top-color:#0d9488; background:#f0fdfa; }
  .cat-card-base:hover .cat-arrow-inner { transform:translateX(3px); }
  .cat-arrow-inner { transition:transform 0.15s; display:inline-block; }
  .content-card-base { background:#fff; border:1px solid #e8e9ec; border-radius:14px; overflow:hidden; cursor:pointer; transition:all 0.18s; display:flex; flex-direction:column; text-decoration:none; }
  .content-card-base:hover { border-color:#d1d5db; box-shadow:0 4px 16px rgba(0,0,0,0.07); transform:translateY(-2px); }
  .featured-card-base { background:#fff; border:1px solid #e8e9ec; border-radius:18px; overflow:hidden; display:flex; flex-direction:row; align-items:stretch; min-height:280px; text-decoration:none; flex:1; }
  .top-read-item-base { display:flex; align-items:flex-start; gap:12px; padding:11px 0; border-bottom:1px solid #f3f4f6; cursor:pointer; transition:all 0.15s; text-decoration:none; }
  .top-read-item-base:last-child { border-bottom:none; }
  .top-read-item-base:hover .top-read-title { color:#16a34a; }
  .top-read-title { font-size:12px; font-weight:700; color:#1f2937; line-height:1.4; margin-bottom:3px; transition:color 0.15s; }
  .coll-card-inner { border-radius:18px; padding:20px 18px 16px; display:flex; flex-direction:column; cursor:pointer; transition:all 0.18s; }
  .coll-card-inner:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.10); }
  .coll-card-inner:hover .coll-arrow-inner { transform:translateX(3px); }
  .coll-arrow-inner { transition:transform 0.15s; display:inline-block; }
  .hero-search-input::placeholder { color:rgba(255,255,255,0.3); }
  .tab-btn:hover { border-color:#d1d5db !important; color:#374151 !important; }
  .load-more-btn:hover { border-color:#d1d5db; background:#f9fafb; }
`;

function SuggestModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', summary: '', type: '', submitterName: '', submitterEmail: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch(`${API}/api/v1/library/guides/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          summary: form.summary.trim() || undefined,
          type: form.type || undefined,
          submitterName: form.submitterName.trim() || undefined,
          submitterEmail: form.submitterEmail.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Hata');
      setStatus('success');
    } catch {
      setErrMsg('Gönderim sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      setStatus('error');
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-black text-gray-900">Rehber Öner</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Öneriniz alındı!</h3>
            <p className="text-sm text-gray-500 mb-6">Rehber öneriniz editörlerimize iletildi. Teşekkürler.</p>
            <button onClick={onClose} className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { void submit(e); }} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rehber Başlığı <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Örn: CBS'de Koordinat Dönüşümü"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kısa Açıklama</label>
              <textarea
                rows={2}
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="Bu rehber ne anlatmalı?"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">İçerik Türü</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Seçin (opsiyonel)</option>
                {TABS.filter(t => t.key).map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Adınız</label>
                <input
                  type="text"
                  value={form.submitterName}
                  onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))}
                  placeholder="Ali Veli"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">E-posta</label>
                <input
                  type="email"
                  value={form.submitterEmail}
                  onChange={e => setForm(f => ({ ...f, submitterEmail: e.target.value }))}
                  placeholder="ali@ornek.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {status === 'error' && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{errMsg}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                İptal
              </button>
              <button
                type="submit"
                disabled={status === 'sending' || !form.title.trim()}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Gönderiliyor…' : 'Öner'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RehberlerPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showSuggest, setShowSuggest] = useState(false);
  const [error, setError] = useState(false);
  const pageRef = useRef(0);
  const guidesRef = useRef<Guide[]>([]);
  const fetchedKey = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filterKey = `${typeFilter}::${fieldFilter}`;
    if (fetchedKey.current === filterKey) {
      setLoading(false);
      return;
    }
    let active = true;
    pageRef.current = 0;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const url = new URL(`${API}/api/v1/library/guides`);
        if (typeFilter) url.searchParams.set('type', typeFilter);
        if (fieldFilter) url.searchParams.set('field', fieldFilter);
        url.searchParams.set('limit', String(PAGE_SIZE));
        url.searchParams.set('offset', '0');
        const res = await fetch(url.toString());
        const batch = await res.json();
        const items: Guide[] = Array.isArray(batch?.items) ? batch.items : Array.isArray(batch) ? batch : [];
        if (!active) return;
        fetchedKey.current = filterKey;
        guidesRef.current = items;
        setGuides(items);
        setHasMore(items.length === PAGE_SIZE);
      } catch {
        if (!active) return;
        guidesRef.current = [];
        setGuides([]);
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [typeFilter, fieldFilter]);

  function loadMore() {
    pageRef.current += 1;
    setLoadingMore(true);
    void (async () => {
      try {
        const url = new URL(`${API}/api/v1/library/guides`);
        if (typeFilter) url.searchParams.set('type', typeFilter);
        if (fieldFilter) url.searchParams.set('field', fieldFilter);
        url.searchParams.set('limit', String(PAGE_SIZE));
        url.searchParams.set('offset', String(pageRef.current * PAGE_SIZE));
        const res = await fetch(url.toString());
        const batch = await res.json();
        const items: Guide[] = Array.isArray(batch?.items) ? batch.items : Array.isArray(batch) ? batch : [];
        guidesRef.current = [...guidesRef.current, ...items];
        setGuides(prev => [...prev, ...items]);
        setHasMore(items.length === PAGE_SIZE);
      } catch { /* ignore */ } finally {
        setLoadingMore(false);
      }
    })();
  }

  const featuredGuide = guides.find(g => g.isFeatured) ?? guides[0] ?? null;
  const topRead = [...guides].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  const displayedGuides = searchQuery
    ? guides.filter(g =>
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : guides;

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
      <Navbar />
      {showSuggest && <SuggestModal onClose={() => setShowSuggest(false)} />}

      <main style={{ background: '#f5f6f8' }}>

        {/* ── HERO ── */}
        <div style={{ background: '#0b1829', position: 'relative', overflow: 'hidden', paddingTop: '60px' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '38%', backgroundImage: "url('/dunya.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0b1829 0%, #0b1829 6%, rgba(11,24,41,0.82) 42%, rgba(11,24,41,0.15) 100%)' }} />
          </div>

          <div className="max-w-[1200px] mx-auto px-6" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '48px', paddingBottom: '41px' }}>

              {/* Left */}
              <div style={{ maxWidth: '520px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>
                  <Link href="/kutuphane" style={{ color: 'rgba(255,255,255,0.3)' }}>Meslek Kütüphanesi</Link>
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>Meslek Atlası</span>
                </div>

                <h1 style={{ fontSize: '52px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1.5px', marginBottom: '10px' }}>
                  <span style={{ color: '#F59E0B' }}>Meslek</span> Atlası
                </h1>

                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px', marginBottom: '22px' }}>
                  Mesleğimizin saha, teknoloji, başlangıç ve kariyer rehberi.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '480px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0 14px', height: '46px', gap: '10px', backdropFilter: 'blur(8px)' }}>
                    <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      type="text"
                      className="hero-search-input"
                      placeholder="Rehber, teknik not veya kariyer içeriği ara…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#fff' }}
                    />
                  </div>
                  <button style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#16a34a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                </div>
              </div>

              {/* Stats Panel */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'row', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(6px)' }}>
                {[
                  { num: '500+', lbl: 'Rehber' },
                  { num: '120+', lbl: 'Teknik Not' },
                  { num: '80+',  lbl: 'Kariyer' },
                ].map((s, i, arr) => (
                  <div key={s.lbl} style={{ padding: '18px 26px', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '3px', fontWeight: 500 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORY CARDS ── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e9ec', padding: '28px 0 32px' }}>
          <div className="max-w-[1200px] mx-auto px-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '3px', height: '28px', background: '#F59E0B', borderRadius: '2px' }} />
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '2px' }}>Keşfet</p>
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0b1829', lineHeight: 1 }}>Meslek Alanları</h2>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>Tüm Alanlar →</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {CAT_CARDS.map(c => {
                const isActive = fieldFilter === c.field;
                return (
                  <div
                    key={c.title}
                    className={`cat-card-base ${c.cls}`}
                    onClick={() => {
                      const next = fieldFilter === c.field ? '' : c.field;
                      fetchedKey.current = null;
                      guidesRef.current = [];
                      pageRef.current = 0;
                      setFieldFilter(next);
                      if (next) setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                    }}
                    style={isActive ? { borderColor: c.arrowColor, borderTopColor: c.arrowColor, background: c.bg, boxShadow: `0 0 0 2px ${c.arrowColor}33` } : {}}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '4px' }}>{c.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0b1829', lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.4, flex: 1 }}>{c.desc}</div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isActive ? c.arrowColor : c.arrowBg, color: isActive ? '#fff' : c.arrowColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginTop: '6px', alignSelf: 'flex-start' }}>
                      <span className="cat-arrow-inner">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FEATURED + TOP READ ── */}
        {(loading || guides.length > 0 || error) && (
          <div style={{ padding: '40px 0' }}>
            <div className="max-w-[1200px] mx-auto px-6">
              <div style={{ display: 'grid', gridTemplateColumns: '58% 1fr', gap: '20px', alignItems: 'stretch' }}>

                {/* Featured */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#6b7280', marginBottom: '14px' }}>
                    <span style={{ fontSize: '14px' }}>⭐</span>
                    ÖNE ÇIKAN REHBER
                  </div>
                  {loading ? (
                    <div className="featured-card-base animate-pulse" style={{ minHeight: 280 }}>
                      <div style={{ width: '280px', flexShrink: 0, background: '#e8e9ec' }} />
                      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ height: 20, width: '40%', background: '#f3f4f6', borderRadius: 6 }} />
                        <div style={{ height: 24, width: '80%', background: '#f3f4f6', borderRadius: 6 }} />
                        <div style={{ height: 16, width: '90%', background: '#f3f4f6', borderRadius: 6 }} />
                        <div style={{ height: 16, width: '70%', background: '#f3f4f6', borderRadius: 6 }} />
                        <div style={{ height: 38, width: '35%', background: '#f3f4f6', borderRadius: 10, marginTop: 'auto' }} />
                      </div>
                    </div>
                  ) : error ? (
                    <div className="featured-card-base" style={{ minHeight: 240, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                      <span style={{ fontSize: 32 }}>🔌</span>
                      <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Bağlantı kurulamadı</p>
                    </div>
                  ) : featuredGuide ? (() => {
                    const theme = CARD_THEMES[featuredGuide.type] ?? DEFAULT_THEME;
                    const fieldLabel = featuredGuide.fields?.[0]
                      ? featuredGuide.fields[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      : null;
                    return (
                      <Link href={`/kutuphane/rehberler/${featuredGuide.slug}`} className="featured-card-base">
                        <div style={{ width: '280px', flexShrink: 0, backgroundImage: "url('/parsel.png')", backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,24,41,0.22)' }} />
                        </div>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${theme.badgeBorder}`, background: theme.badgeBg, color: theme.badgeText }}>
                              {theme.label}
                            </span>
                            {fieldLabel && (
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d' }}>
                                {fieldLabel}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '17px', fontWeight: 800, color: '#0b1829', lineHeight: 1.35, marginBottom: '8px' }}>{featuredGuide.title}</div>
                          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: '14px' }}>{featuredGuide.summary}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#9ca3af', marginBottom: '16px' }}>
                            {featuredGuide.readingTimeMinutes && <span>⏱ {featuredGuide.readingTimeMinutes} dk okuma</span>}
                            {(featuredGuide as Guide & { level?: string }).level && <span>🔵 {(featuredGuide as Guide & { level?: string }).level}</span>}
                            {featuredGuide.authorName && <span>✍️ {featuredGuide.authorName}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#fff', background: '#166534', borderRadius: '10px', padding: '9px 18px' }}>
                              Hemen Oku →
                            </div>
                            <div style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e8e9ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#9ca3af', cursor: 'pointer' }}>
                              🔖
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })() : null}
                </div>

                {/* Top Read */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#6b7280' }}>
                      <span style={{ fontSize: '14px' }}>🔥</span>
                      BUGÜN EN ÇOK OKUNANLAR
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>Tümünü Gör →</span>
                  </div>
                  <div style={{ flex: 1, background: '#fff', border: '1px solid #e8e9ec', borderRadius: '18px', padding: '20px' }}>
                    {loading ? (
                      [1,2,3,4,5].map(i => (
                        <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < 5 ? '1px solid #f3f4f6' : 'none' }}>
                          <div style={{ width: 24, height: 24, borderRadius: 8, background: '#f3f4f6', flexShrink: 0 }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ height: 12, width: '85%', background: '#f3f4f6', borderRadius: 4 }} />
                            <div style={{ height: 10, width: '40%', background: '#f3f4f6', borderRadius: 4 }} />
                          </div>
                        </div>
                      ))
                    ) : error ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Yüklenemedi</p>
                      </div>
                    ) : topRead.map((g, i) => {
                      const rankStyle = i === 0
                        ? { background: '#fef3c7', color: '#d97706' }
                        : i === 1
                        ? { background: '#f3f4f6', color: '#374151' }
                        : i === 2
                        ? { background: '#fef3c7', color: '#d97706', opacity: 0.7 }
                        : { background: '#f9fafb', color: '#9ca3af' };
                      return (
                        <Link key={g.id} href={`/kutuphane/rehberler/${g.slug}`} className="top-read-item-base">
                          <div style={{ width: '24px', height: '24px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0, marginTop: '1px', ...rankStyle }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="top-read-title">{g.title}</div>
                            <div style={{ fontSize: '10px', color: '#9ca3af' }}>{g.readingTimeMinutes ? `${g.readingTimeMinutes} dk okuma` : ''}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT GRID ── */}
        <div ref={contentRef} style={{ paddingBottom: '40px', scrollMarginTop: '20px' }}>
          <div className="max-w-[1200px] mx-auto px-6">

            {/* Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: fieldFilter ? '10px' : '20px' }}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { fetchedKey.current = null; guidesRef.current = []; setTypeFilter(t.key); pageRef.current = 0; }}
                  className={typeFilter === t.key ? '' : 'tab-btn'}
                  style={{
                    fontSize: '12px', fontWeight: 700, padding: '7px 14px', borderRadius: '20px',
                    cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s',
                    background: typeFilter === t.key ? '#0b1829' : '#fff',
                    color: typeFilter === t.key ? '#fff' : '#6b7280',
                    borderColor: typeFilter === t.key ? 'transparent' : '#e8e9ec',
                    flexShrink: 0,
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
              <button
                onClick={() => setShowSuggest(true)}
                style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '12px', fontWeight: 700, color: '#0b1829', background: '#fff', border: '1px solid #e8e9ec', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
              >
                + Rehber Öner
              </button>
              <button
                style={{ flexShrink: 0, fontSize: '12px', fontWeight: 600, color: '#6b7280', background: '#fff', border: '1px solid #e8e9ec', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                En Yeni ▾
              </button>
            </div>

            {fieldFilter && (() => {
              const active = CAT_CARDS.find(c => c.field === fieldFilter);
              return active ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 14px', borderRadius: '14px', background: active.bg, border: `1.5px solid ${active.arrowColor}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1 }}>
                    <span style={{ width: 28, height: 28, borderRadius: '8px', background: '#fff', border: `1.5px solid ${active.arrowColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{active.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: active.arrowColor }}>{active.title}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>· {active.desc}</span>
                  </div>
                  <button
                    onClick={() => { fetchedKey.current = null; guidesRef.current = []; pageRef.current = 0; setFieldFilter(''); }}
                    style={{ width: 26, height: 26, borderRadius: '8px', border: `1px solid ${active.arrowColor}44`, background: '#fff', color: active.arrowColor, fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ) : null;
            })()}

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="animate-pulse" style={{ height: '220px', background: '#fff', borderRadius: '14px', border: '1px solid #e8e9ec' }} />
                ))}
              </div>
            ) : displayedGuides.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e8e9ec', padding: '64px', textAlign: 'center' as const }}>
                {error ? (
                  <>
                    <p style={{ fontSize: 28, marginBottom: 12 }}>🔌</p>
                    <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: 16 }}>İçerik yüklenemedi. Lütfen sayfayı yenileyin.</p>
                    <button onClick={() => window.location.reload()} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#16a34a', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Yenile</button>
                  </>
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>İçerik bulunamadı.</p>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {displayedGuides.map(g => {
                  const theme = CARD_THEMES[g.type] ?? DEFAULT_THEME;
                  return (
                    <Link key={g.id} href={`/kutuphane/rehberler/${g.slug}`} className="content-card-base">
                      <div style={{ height: '100px', background: theme.bg, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>{theme.emoji}</div>
                        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', border: `1px solid ${theme.badgeBorder}`, background: theme.badgeBg, color: theme.badgeText }}>
                            {theme.label}
                          </span>
                        </div>
                        {g.readingTimeMinutes && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 700, color: '#374151', background: 'rgba(0,0,0,0.07)', padding: '2px 7px', borderRadius: '5px' }}>
                            {g.readingTimeMinutes} dk
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0b1829', lineHeight: 1.4 }}>{g.title}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5, flex: 1 }}>{g.summary}</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
                          {g.tags.slice(0, 3).map(tag => (
                            <span key={tag} style={{ fontSize: '10px', color: '#9ca3af', background: '#f3f4f6', borderRadius: '4px', padding: '2px 6px' }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {hasMore && !loading && displayedGuides.length > 0 && !searchQuery && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="load-more-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#374151', background: '#fff', border: '1px solid #e8e9ec', borderRadius: '12px', padding: '12px 28px', cursor: 'pointer', margin: '0 auto', transition: 'all 0.15s' }}
              >
                {loadingMore ? 'Yükleniyor…' : 'Daha Fazla İçerik Yükle ↻'}
              </button>
            )}
          </div>
        </div>

        {/* ── COLLECTIONS ── */}
        <div style={{ paddingBottom: '40px' }}>
          <div className="max-w-[1200px] mx-auto px-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 900, color: '#0b1829' }}>
                <span style={{ width: '22px', height: '22px', background: '#f0fdf4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🗂️</span>
                KOLEKSİYONLAR
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>Tüm Koleksiyonlar →</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {COLL_CARDS.map(c => (
                <div
                  key={c.title}
                  className="coll-card-inner"
                  style={{ background: c.bg }}
                  onClick={() => {
                    fetchedKey.current = null;
                    guidesRef.current = [];
                    pageRef.current = 0;
                    if (c.filter.by === 'type') {
                      setFieldFilter('');
                      setTypeFilter(c.filter.val);
                    } else {
                      setTypeFilter('');
                      setFieldFilter(c.filter.val);
                    }
                    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '12px', lineHeight: 1 }}>{c.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0b1829', lineHeight: 1.35, marginBottom: '6px' }}>{c.title}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5, flex: 1, marginBottom: '14px' }}>{c.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>📚 {c.count} içerik</div>
                    <div className="coll-arrow-inner" style={{ width: '30px', height: '30px', borderRadius: '50%', background: c.arrowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: '#e9eaec' }} />

        {/* ── FOOTER CTA ── */}
        <div style={{ padding: '32px 0 48px' }}>
          <div className="max-w-[1200px] mx-auto px-6">
            <div style={{ background: '#0b1829', borderRadius: '20px', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', lineHeight: 1.35 }}>Mesleğimizin yaşayan<br />en büyük bilgi platformu</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>Katkıda bulun, soru sor, içerik üret.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button
                  onClick={() => setShowSuggest(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 18px', cursor: 'pointer' }}
                >
                  ✏️ Rehber Öner
                </button>
                <Link href="/mutfak" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 900, color: '#0b1829', background: '#F59E0B', borderRadius: '12px', padding: '10px 20px' }}>
                  Üye Ol →
                </Link>
              </div>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
