import { HaberitaIcerikGonderButton, HaberitaBasvuruButton } from './HaberitaIcerikGonder';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const WP_API = 'https://haberita.com/wp-json/wp/v2';
const HABERITA_URL = 'https://haberita.com';

// ─── Admin widget types ───────────────────────────────────────────────────────

interface WidgetFeatured {
  title?: string;
  excerpt?: string;
  imageUrl?: string;
  url?: string;
  category?: string;
  excerptMaxChars?: number;
}

interface WidgetLink {
  title?: string;
  url?: string;
}

interface HaberitaWidget {
  featured?: WidgetFeatured;
  sideLinks?: WidgetLink[];
}

async function fetchWidget(): Promise<HaberitaWidget | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/settings/haberita_widget`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<HaberitaWidget>;
  } catch {
    return null;
  }
}

// ─── WordPress types ──────────────────────────────────────────────────────────

interface WpPost {
  id: number;
  date: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    author?: Array<{ name: string }>;
    'wp:term'?: Array<Array<{ name: string; taxonomy: string }>>;
    'wp:featuredmedia'?: Array<{
      source_url: string;
      media_details?: { sizes?: { medium?: { source_url: string }; thumbnail?: { source_url: string } } };
    }>;
  };
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, c: string) => String.fromCharCode(Number(c)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getCategories(post: WpPost): string[] {
  const terms = post._embedded?.['wp:term']?.[0] ?? [];
  return terms.filter((t) => t.taxonomy === 'category' || !t.taxonomy).map((t) => t.name).slice(0, 2);
}

function getThumbnail(post: WpPost): string | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return null;
  return (
    media.media_details?.sizes?.medium?.source_url ??
    media.media_details?.sizes?.thumbnail?.source_url ??
    media.source_url ??
    null
  );
}

async function fetchWpPosts(): Promise<WpPost[]> {
  try {
    const res = await fetch(
      `${WP_API}/posts?per_page=4&_embed=author,wp:term,wp:featuredmedia`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    return res.json() as Promise<WpPost[]>;
  } catch {
    return [];
  }
}

const CAT_COLORS: Record<string, string> = {
  'İş Dünyası': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Teknoloji: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Yaşam: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  Dünyadan: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  'Köşe Yazıları': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'Kamu Alımları': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  Analiz: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};
const CAT_DEFAULT = 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300';

function CatBadge({ name }: { name: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${CAT_COLORS[name] ?? CAT_DEFAULT}`}
    >
      {name}
    </span>
  );
}

// ─── CTA strip (server-renderable — links only, modal button is client) ───────

function CtaStrip() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <HaberitaBasvuruButton role="editor" />
      <HaberitaBasvuruButton role="columnist" />
      <HaberitaIcerikGonderButton label="İçerik Gönder" variant="amber" />
    </div>
  );
}

// ─── Admin widget layout ──────────────────────────────────────────────────────

function AdminFeaturedCard({ f }: { f: WidgetFeatured }) {
  const maxChars = f.excerptMaxChars ?? 220;
  const rawExcerpt = f.excerpt ? decodeEntities(f.excerpt) : null;
  const excerpt = rawExcerpt
    ? rawExcerpt.length > maxChars
      ? rawExcerpt.slice(0, maxChars).trimEnd() + '…'
      : rawExcerpt
    : null;
  const title = f.title ? decodeEntities(f.title) : '';

  return (
    <a
      href={f.url ?? HABERITA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="lg:col-span-3 group flex flex-col rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {f.imageUrl && (
        <div className="relative h-52 sm:h-64 lg:h-72 overflow-hidden bg-gray-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={f.imageUrl}
            alt={f.title ?? ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {f.category && (
            <div className="absolute bottom-3 left-4">
              <CatBadge name={f.category} />
            </div>
          )}
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        {!f.imageUrl && f.category && (
          <div className="mb-3">
            <CatBadge name={f.category} />
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-3">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 leading-relaxed flex-1">
            {excerpt}
          </p>
        )}
        <div className="mt-4 text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
          Devamı haberita&apos;da →
        </div>
      </div>
    </a>
  );
}

function AdminSideLinks({ links }: { links: WidgetLink[] }) {
  const filled = links.filter((l) => l.title && l.url);

  return (
    <div className="lg:col-span-2 flex flex-col gap-3">
      {filled.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-snug line-clamp-3 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              {link.title ? decodeEntities(link.title) : ''}
            </p>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500 truncate">{link.url}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── WP fallback layout ───────────────────────────────────────────────────────

function WpFeaturedCard({ post }: { post: WpPost }) {
  const cats = getCategories(post);
  const img = getThumbnail(post);
  const author = post._embedded?.author?.[0]?.name ?? null;

  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="lg:col-span-3 group flex flex-col rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {img && (
        <div className="relative h-52 sm:h-64 lg:h-72 overflow-hidden bg-gray-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={stripHtml(post.title.rendered)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {cats.length > 0 && (
            <div className="absolute bottom-3 left-4 flex gap-1.5">
              {cats.map((c) => <CatBadge key={c} name={c} />)}
            </div>
          )}
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        {!img && cats.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            {cats.map((c) => <CatBadge key={c} name={c} />)}
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-3">
          {stripHtml(post.title.rendered)}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">
          {stripHtml(post.excerpt.rendered)}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
          <span>{author ?? 'Haberita'}</span>
          <span>{formatDate(post.date)}</span>
        </div>
      </div>
    </a>
  );
}

function WpSideList({ posts }: { posts: WpPost[] }) {
  return (
    <div className="lg:col-span-2 flex flex-col gap-3">
      {posts.map((post) => {
        const cats = getCategories(post);
        const author = post._embedded?.author?.[0]?.name ?? null;
        const img = getThumbnail(post);
        return (
          <a
            key={post.id}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150"
          >
            {img && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {cats.length > 0 && (
                <div className="flex gap-1 mb-1">
                  {cats.map((c) => <CatBadge key={c} name={c} />)}
                </div>
              )}
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                {stripHtml(post.title.rendered)}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 dark:text-slate-500">
                {author && <span className="truncate max-w-[100px]">{author}</span>}
                {author && <span>·</span>}
                <span>{formatDate(post.date)}</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ─── Section header (shared) ──────────────────────────────────────────────────

function SectionHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Haberita
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
          16 yıldır sektörün ilk ve tek haber merkezi.
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Mesleğimizden analiz, kamu alımı, iş dünyası, teknoloji, yurt dışı haberleri ve köşe yazıları.
        </p>
      </div>
      <a
        href={HABERITA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
      >
        haberita.com&apos;a git →
      </a>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default async function HaberitaSection() {
  const widget = await fetchWidget();

  const hasAdminWidget =
    !!widget?.featured?.title && !!widget?.featured?.url;

  let grid: React.ReactNode;

  if (hasAdminWidget) {
    const f = widget!.featured!;
    const links = (widget!.sideLinks ?? []).slice(0, 3);
    grid = (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <AdminFeaturedCard f={f} />
        <AdminSideLinks links={links} />
      </div>
    );
  } else {
    const posts = await fetchWpPosts();
    if (posts.length === 0) return null;
    const [featured, ...rest] = posts;
    grid = (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <WpFeaturedCard post={featured!} />
        <WpSideList posts={rest.slice(0, 3)} />
      </div>
    );
  }

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-[#070c1a] border-y border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />
        {grid}
        <CtaStrip />
      </div>
    </section>
  );
}
