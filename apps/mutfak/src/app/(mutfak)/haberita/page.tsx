'use client';

import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const HABERITA_URL = 'https://haberita.com';
const WP_API = 'https://haberita.com/wp-json/wp/v2';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WpPost {
  id: number;
  date: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    author?: Array<{ name: string; link: string }>;
    'wp:term'?: Array<Array<{ name: string; taxonomy: string }>>;
    'wp:featuredmedia'?: Array<{ source_url: string; media_details?: { sizes?: { medium?: { source_url: string }; thumbnail?: { source_url: string } } } }>;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return iso; }
}

function getCats(post: WpPost): string[] {
  return (post._embedded?.['wp:term']?.[0] ?? []).map(t => t.name).slice(0, 2);
}

function getThumb(post: WpPost): string | null {
  const m = post._embedded?.['wp:featuredmedia']?.[0];
  if (!m) return null;
  return m.media_details?.sizes?.medium?.source_url ?? m.media_details?.sizes?.thumbnail?.source_url ?? m.source_url ?? null;
}

const CAT_COLORS: Record<string, string> = {
  'İş Dünyası':  'bg-amber-100 text-amber-800',
  'Teknoloji':   'bg-blue-100 text-blue-800',
  'Yaşam':       'bg-emerald-100 text-emerald-800',
  'Dünyadan':    'bg-violet-100 text-violet-800',
  'Köşe Yazıları': 'bg-rose-100 text-rose-800',
  'Kamu Alımları': 'bg-teal-100 text-teal-800',
  'Analiz':      'bg-indigo-100 text-indigo-800',
};
const CAT_DEFAULT = 'bg-gray-100 text-gray-700';

const ELIGIBLE_TIERS = new Set([
  'individual_member', 'new_graduate_member', 'haritailesi_genc',
  'corporate_member', // korporat üyeler de başvurabilmeli
]);

// ─── Application Modal ────────────────────────────────────────────────────────

type AppRole = 'haberita_editor' | 'haberita_columnist';

const ROLE_LABELS: Record<AppRole, string> = {
  haberita_editor: 'Editör',
  haberita_columnist: 'Köşe Yazarı',
};

function ApplicationModal({
  role,
  userEmail,
  token,
  onClose,
  onSuccess,
}: {
  role: AppRole;
  userEmail: string;
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    motivation: '',
    expertise: '',
    sampleWork: '',
    previousLinks: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: role,
          applicantEmail: userEmail,
          formData: {
            rol: ROLE_LABELS[role],
            motivasyon: form.motivation,
            uzmanlık: form.expertise,
            ornekCalisma: form.sampleWork,
            oncekiLink: form.previousLinks,
          },
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Başvuru gönderilemedi.');
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp = 'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] transition resize-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{ROLE_LABELS[role]} Başvurusu</h2>
            <p className="text-xs text-gray-400 mt-0.5">Haberita ekibine katılmak için başvurunu gönder.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={e => void handleSubmit(e)} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {role === 'haberita_editor' && (
            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800 leading-relaxed">
              <strong>Editör olarak</strong> içerik planlaması, yazı yönetimi ve yayın sürecinde aktif rol alırsın. Başvurun admin onayından sonra atama yapılır.
            </div>
          )}
          {role === 'haberita_columnist' && (
            <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-800 leading-relaxed">
              <strong>Köşe yazarı olarak</strong> düzenli analiz ve yorum yazıları yayınlarsın. Başvurun onaylandıktan sonra köşeni oluşturabilirsin.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Motivasyon <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={form.motivation}
              onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
              placeholder={role === 'haberita_editor'
                ? "Neden editör olmak istiyorsun? Haberita'ya nasıl katkı sağlamak istersin?"
                : "Neden köşe yazarı olmak istiyorsun? Hangi konularda yazı yazmak istersin?"}
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Uzmanlık / Deneyim <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              maxLength={600}
              value={form.expertise}
              onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))}
              placeholder="Harita, kadastro, CBS, fotogrametri, maden mühendisliği gibi ilgili alanlar…"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Örnek çalışma <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <textarea
              rows={3}
              maxLength={800}
              value={form.sampleWork}
              onChange={e => setForm(f => ({ ...f, sampleWork: e.target.value }))}
              placeholder={role === 'haberita_columnist'
                ? 'Kısa bir yazı örneği veya mevcut yazılarından bir alıntı…'
                : 'Daha önce düzenlediğin içerikler, yönettiğin yayınlar…'}
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Önceki çalışma linkleri <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <textarea
              rows={2}
              maxLength={400}
              value={form.previousLinks}
              onChange={e => setForm(f => ({ ...f, previousLinks: e.target.value }))}
              placeholder="LinkedIn yazıları, blog, makale, medya linkleri…"
              className={inp}
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-gray-400 leading-snug">
              Admin incelemesinden sonra haberdar edilirsin.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting || !form.motivation || !form.expertise}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── İçerik Gönder Modal ─────────────────────────────────────────────────────

const ICERIK_TYPES = [
  { value: 'etkinlik', label: 'Etkinlik' },
  { value: 'egitim', label: 'Eğitim' },
  { value: 'analiz', label: 'Analiz' },
  { value: 'proje', label: 'Proje' },
  { value: 'sirket_haberi', label: 'Şirket Haberi' },
] as const;

type IcerikType = (typeof ICERIK_TYPES)[number]['value'];

const MAX_IMG = 3;

function IcerikGonderModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    type: '' as IcerikType | '',
    title: '',
    url: '',
    desc: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, MAX_IMG - files.length);
    const next = [...files, ...selected].slice(0, MAX_IMG);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  }

  function removeFile(i: number) {
    setFiles((fs) => fs.filter((_, idx) => idx !== i));
    setPreviews((ps) => ps.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const typeLabel = ICERIK_TYPES.find((t) => t.value === form.type)?.label ?? form.type;
    const fileNote = files.length > 0
      ? `\n\nGörseller (${files.length} dosya): Bu formu gönderdikten sonra görselleri iletisim@haberita.com adresine ayrıca ekleyiniz.`
      : '';
    const subject = encodeURIComponent(`[${typeLabel}] ${form.title}`);
    const body = encodeURIComponent(
      `İçerik Türü: ${typeLabel}\nAd Soyad: ${form.name}\nBaşlık: ${form.title}\nLink: ${form.url || '—'}\n\nAçıklama:\n${form.desc}${fileNote}`,
    );
    window.location.href = `mailto:iletisim@haberita.com?subject=${subject}&body=${body}`;
    onClose();
  }

  const inp =
    'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition';

  const canSubmit = !!form.type && !!form.name && !!form.title && !!form.desc;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Haberita&apos;ya İçerik Gönder</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Etkinlik, eğitim, analiz, proje veya şirket haberini editoryal ekibe ilet.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              İçerik Türü <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ICERIK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                    form.type === t.value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input type="text" required readOnly className="sr-only" tabIndex={-1} value={form.type} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Ad Soyad <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Adınız ve soyadınız"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Başlık <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="İçeriğin başlığı veya adı"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Link <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Açıklama <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={1500}
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
              placeholder="İçerik hakkında kısa bir açıklama…"
              className={`${inp} resize-none`}
            />
          </div>

          {/* Görsel ekleme */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Görseller
              <span className="text-gray-400 font-normal ml-1">(en fazla {MAX_IMG} fotoğraf)</span>
            </label>

            {files.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {files.map((file, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                    <img src={previews[i]} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5">
                      <p className="text-[9px] text-white truncate">{file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {files.length < MAX_IMG && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Görsel ekle ({files.length}/{MAX_IMG})
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
              </>
            )}

            {files.length > 0 && (
              <p className="text-[11px] text-amber-600 mt-1.5 leading-snug">
                Görseller e-posta ile iletilemez. Formu gönderdikten sonra{' '}
                <span className="font-semibold">iletisim@haberita.com</span> adresine ayrıca gönderin.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-gray-400 leading-snug">
              Haberita editoryal ekibi inceleyip geri döner.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Gönder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: WpPost }) {
  const cats = getCats(post);
  const img  = getThumb(post);
  const author = post._embedded?.author?.[0]?.name ?? null;
  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150"
    >
      {img && (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {cats.length > 0 && (
          <div className="flex gap-1 mb-1 flex-wrap">
            {cats.map(c => (
              <span key={c} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CAT_COLORS[c] ?? CAT_DEFAULT}`}>{c}</span>
            ))}
          </div>
        )}
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#26496b] transition-colors">
          {stripHtml(post.title.rendered)}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
          {author && <span className="truncate max-w-[90px]">{author}</span>}
          {author && <span>·</span>}
          <span>{fmtDate(post.date)}</span>
        </div>
      </div>
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HaberitaPage() {
  const { user } = useAuth();
  const token = useToken();

  const [posts, setPosts] = useState<WpPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [openRole, setOpenRole] = useState<AppRole | null>(null);
  const [successRole, setSuccessRole] = useState<AppRole | null>(null);
  const [openIcerik, setOpenIcerik] = useState(false);

  const isEligible = !!user && ELIGIBLE_TIERS.has(user.membershipTier);

  useEffect(() => {
    void fetch(`${WP_API}/posts?per_page=12&_embed=author,wp:term,wp:featuredmedia`)
      .then(r => r.ok ? r.json() as Promise<WpPost[]> : [])
      .then(data => setPosts(data))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">Haberita</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Haber Merkezi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Harita, kadastro ve geomatik sektöründen haberler, analizler ve köşe yazıları.
          </p>
        </div>
        <a
          href={HABERITA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors"
        >
          haberita.com
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Editorial Application Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {/* Editör */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Editör Ol</div>
              <div className="text-xs text-gray-500 mt-0.5">İçerik planla, yazıları yönet ve yayına hazırla.</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            Haberita editoryal ekibine katıl. Sektörel haberleri takip et, içerik stratejisi üret ve topluluğun bilgi akışını yönet.
          </p>
          {successRole === 'haberita_editor' ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Başvurun gönderildi!
            </div>
          ) : isEligible ? (
            <button
              onClick={() => setOpenRole('haberita_editor')}
              className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Editör Olarak Başvur
            </button>
          ) : (
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Bireysel veya öğrenci üyeleri başvurabilir.
            </p>
          )}
        </div>

        {/* Köşe Yazarı */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Köşe Yazarı Ol</div>
              <div className="text-xs text-gray-500 mt-0.5">Sektörel analiz ve yorum yazıları yayınla.</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            Harita ve geomatik alanındaki görüşlerini, analizlerini ve deneyimlerini Haberita okuyucularıyla paylaş. Kendi köşeni oluştur.
          </p>
          {successRole === 'haberita_columnist' ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Başvurun gönderildi!
            </div>
          ) : isEligible ? (
            <button
              onClick={() => setOpenRole('haberita_columnist')}
              className="w-full py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
            >
              Köşe Yazarı Olarak Başvur
            </button>
          ) : (
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Bireysel veya öğrenci üyeleri başvurabilir.
            </p>
          )}
        </div>
      </div>

      {/* İçerik Gönder */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 mb-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-sm">İçerik Gönder</div>
            <div className="text-xs text-gray-500 mt-0.5 mb-3">
              Etkinlik, eğitim, analiz, proje veya şirket haberini Haberita editoryal ekibine ilet.
            </div>
            <button
              onClick={() => setOpenIcerik(true)}
              className="py-2 px-4 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors"
            >
              İçerik Gönder
            </button>
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-base font-bold text-gray-900">Son Haberler</h2>
        <a href={HABERITA_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-amber-600 hover:underline">
          Tümünü gör →
        </a>
      </div>

      {loadingPosts && (
        <div className="py-16 flex justify-center">
          <div className="w-7 h-7 border-2 border-[#26496b] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loadingPosts && posts.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          Haberler yüklenemedi.{' '}
          <a href={HABERITA_URL} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
            haberita.com&apos;u ziyaret et
          </a>
        </div>
      )}

      {!loadingPosts && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {!loadingPosts && posts.length > 0 && (
        <div className="mt-6 text-center">
          <a
            href={HABERITA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors"
          >
            Tüm haberler için haberita.com&apos;u ziyaret et →
          </a>
        </div>
      )}

      {/* Application Modal */}
      {openRole && user && (
        <ApplicationModal
          role={openRole}
          userEmail={user.email}
          token={token}
          onClose={() => setOpenRole(null)}
          onSuccess={() => {
            setSuccessRole(openRole);
            setOpenRole(null);
          }}
        />
      )}

      {/* İçerik Gönder Modal */}
      {openIcerik && <IcerikGonderModal onClose={() => setOpenIcerik(false)} />}
    </div>
  );
}
