'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

interface SideLink {
  title: string;
  url: string;
}

interface FeaturedForm {
  title: string;
  excerpt: string;
  imageUrl: string;
  url: string;
  category: string;
  excerptMaxChars: number;
}

interface PageState {
  featured: FeaturedForm;
  sideLinks: SideLink[];
}

const WP_API = 'https://haberita.com/wp-json/wp/v2';

interface WpPost {
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    'wp:term'?: Array<Array<{ name: string; taxonomy: string }>>;
    'wp:featuredmedia'?: Array<{
      source_url: string;
      media_details?: { sizes?: { medium?: { source_url: string }; thumbnail?: { source_url: string } } };
    }>;
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function wpCategory(post: WpPost): string {
  return post._embedded?.['wp:term']?.[0]?.[0]?.name ?? '';
}

function wpThumb(post: WpPost): string {
  const m = post._embedded?.['wp:featuredmedia']?.[0];
  return m?.media_details?.sizes?.medium?.source_url ?? m?.media_details?.sizes?.thumbnail?.source_url ?? m?.source_url ?? '';
}

async function fetchWpPosts(): Promise<WpPost[]> {
  try {
    const res = await fetch(`${WP_API}/posts?per_page=4&_embed=wp:term,wp:featuredmedia`);
    if (!res.ok) return [];
    return res.json() as Promise<WpPost[]>;
  } catch {
    return [];
  }
}

const EMPTY_FEATURED: FeaturedForm = {
  title: '',
  excerpt: '',
  imageUrl: '',
  url: '',
  category: '',
  excerptMaxChars: 220,
};

const EMPTY_LINKS: SideLink[] = Array.from({ length: 3 }, () => ({ title: '', url: '' }));

const CAT_SUGGESTIONS = [
  'İş Dünyası', 'Teknoloji', 'Yaşam', 'Dünyadan',
  'Köşe Yazıları', 'Kamu Alımları', 'Analiz',
];

const inp =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400 transition';

export default function HaberitaPage() {
  const [state, setState] = useState<PageState>({
    featured: EMPTY_FEATURED,
    sideLinks: EMPTY_LINKS,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    void (async () => {
      const data = await adminApi.getSetting('haberita_widget');
      const f = (data?.['featured'] ?? {}) as Partial<FeaturedForm>;
      const links = (data?.['sideLinks'] ?? []) as Partial<SideLink>[];

      const hasAdmin = !!(f.title && f.url);

      if (hasAdmin) {
        setState({
          featured: {
            title: stripHtml((f.title as string) ?? ''),
            excerpt: stripHtml((f.excerpt as string) ?? ''),
            imageUrl: (f.imageUrl as string) ?? '',
            url: (f.url as string) ?? '',
            category: stripHtml((f.category as string) ?? ''),
            excerptMaxChars: typeof f.excerptMaxChars === 'number' ? f.excerptMaxChars : 220,
          },
          sideLinks: Array.from({ length: 3 }, (_, i) => ({
            title: stripHtml((links[i]?.title as string) ?? ''),
            url: (links[i]?.url as string) ?? '',
          })),
        });
      } else {
        // No admin widget — pre-fill from live WP posts
        const posts = await fetchWpPosts();
        const [featured, ...rest] = posts;
        setState({
          featured: featured
            ? {
                title: stripHtml(featured.title.rendered),
                excerpt: stripHtml(featured.excerpt.rendered),
                imageUrl: wpThumb(featured),
                url: featured.link,
                category: wpCategory(featured),
                excerptMaxChars: 220,
              }
            : EMPTY_FEATURED,
          sideLinks: Array.from({ length: 3 }, (_, i) => ({
            title: rest[i] ? stripHtml(rest[i]!.title.rendered) : '',
            url: rest[i]?.link ?? '',
          })),
        });
      }

      setLoading(false);
    })();
  }, []);

  function setFeatured(patch: Partial<FeaturedForm>) {
    setState((s) => ({ ...s, featured: { ...s.featured, ...patch } }));
  }

  function setLink(i: number, patch: Partial<SideLink>) {
    setState((s) => {
      const links = [...s.sideLinks];
      links[i] = { ...links[i]!, ...patch };
      return { ...s, sideLinks: links };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.upsertSetting('haberita_widget', {
        featured: state.featured,
        sideLinks: state.sideLinks,
      });
      showToast('Kaydedildi.');
    } catch {
      showToast('Kayıt başarısız.', false);
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!confirm('Admin widget temizlensin mi? Bölüm otomatik olarak haberita.com API\'sinden içerik çekmeye başlar.')) return;
    setClearing(true);
    try {
      await adminApi.upsertSetting('haberita_widget', { featured: {}, sideLinks: [] });
      setState({ featured: EMPTY_FEATURED, sideLinks: EMPTY_LINKS });
      showToast('Widget temizlendi. Otomatik mod aktif.');
    } catch {
      showToast('Temizleme başarısız.', false);
    } finally {
      setClearing(false);
    }
  }

  const excerptPreview =
    state.featured.excerpt.length > state.featured.excerptMaxChars
      ? state.featured.excerpt.slice(0, state.featured.excerptMaxChars).trimEnd() + '…'
      : state.featured.excerpt;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#26496b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
            toast.ok ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Haberita</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sahne ana sayfasındaki Haberita bölümünü yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void handleClear()}
            disabled={clearing}
            className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {clearing ? 'Temizleniyor…' : 'Otomatik Moda Al'}
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 leading-relaxed">
        <strong>Otomatik mod:</strong> Alanlar boş bırakıldığında bölüm{' '}
        <span className="font-mono text-xs">haberita.com</span> WordPress API&apos;sinden otomatik içerik
        çeker. Admin değerleri girildiğinde bu değerler öncelik kazanır.
      </div>

      {/* Featured Article */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Öne Çıkan Haber</h2>
          <p className="text-xs text-gray-400 mt-0.5">Sol sütunda büyük kart olarak gösterilir.</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Başlık</label>
            <input
              type="text"
              className={inp}
              placeholder="Haber başlığı"
              value={state.featured.title}
              onChange={(e) => setFeatured({ title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Haber URL</label>
              <input
                type="url"
                className={inp}
                placeholder="https://haberita.com/..."
                value={state.featured.url}
                onChange={(e) => setFeatured({ url: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Görsel URL</label>
              <input
                type="url"
                className={inp}
                placeholder="https://..."
                value={state.featured.imageUrl}
                onChange={(e) => setFeatured({ imageUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Kategori
                <span className="text-gray-400 font-normal ml-1">(rozet rengi otomatik)</span>
              </label>
              <input
                type="text"
                list="cat-suggestions"
                className={inp}
                placeholder="Analiz, Kamu Alımları…"
                value={state.featured.category}
                onChange={(e) => setFeatured({ category: e.target.value })}
              />
              <datalist id="cat-suggestions">
                {CAT_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Özet karakter limiti
              </label>
              <input
                type="number"
                min={50}
                max={600}
                step={10}
                className={inp}
                value={state.featured.excerptMaxChars}
                onChange={(e) => setFeatured({ excerptMaxChars: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Özet metin
              <span className="text-gray-400 font-normal ml-1">
                ({state.featured.excerpt.length} / {state.featured.excerptMaxChars} karakter limit)
              </span>
            </label>
            <textarea
              rows={4}
              className={`${inp} resize-none`}
              placeholder="Haberin kısa özeti…"
              value={state.featured.excerpt}
              onChange={(e) => setFeatured({ excerpt: e.target.value })}
            />
          </div>

          {/* Excerpt preview */}
          {state.featured.excerpt && (
            <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Önizleme ({excerptPreview.length} karakter)
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{excerptPreview}</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Links */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Yan Haberler</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Sağ sütunda 3 haber linki gösterilir. URL yapıştırıp başlık girin — üstlerine tıklanınca o habere gider.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {state.sideLinks.map((link, i) => (
            <div key={i} className="grid grid-cols-5 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Başlık {i + 1}
                </label>
                <input
                  type="text"
                  className={inp}
                  placeholder={`Haber ${i + 1} başlığı`}
                  value={link.title}
                  onChange={(e) => setLink(i, { title: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">URL {i + 1}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    className={inp}
                    placeholder="https://haberita.com/..."
                    value={link.url}
                    onChange={(e) => setLink(i, { url: e.target.value })}
                  />
                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 text-gray-400 hover:text-[#26496b] transition-colors"
                      title="Haberi aç"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Değişiklikler kaydedildikten sonra Sahne sitesi ~5 dakika içinde güncellenir.
        </p>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="px-6 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
