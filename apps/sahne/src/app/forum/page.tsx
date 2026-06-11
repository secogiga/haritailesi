import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { PageActionTracker } from '@/components/PageActionTracker';

export const metadata: Metadata = {
  title: 'Mutfak Kütüphanesi | Haritailesi Sahne',
  description: 'Haritailesi Mutfak topluluğundan herkese açık tartışmalar, sorular ve paylaşımlar.',
};

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const CATEGORY_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık',
  cbs: 'CBS / GIS',
  fotogrametri_uzaktan_algilama: 'Fotogrametri & UA',
  insaat: 'İnşaat Ölçmesi',
  gayrimenkul_degerleme: 'Gayrimenkul',
  yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer: 'Kariyer',
  egitim: 'Eğitim',
  mentorluk: 'Mentorluk',
  gonullulik: 'Gönüllülük',
  proje_gelistirme: 'Proje Geliştirme',
  haritailesi_duyurulari: 'Duyurular',
};

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  question:              { label: 'Soru',               cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  idea:                  { label: 'Fikir',               cls: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
  general:               { label: 'Genel',               cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  announcement:          { label: 'Duyuru',              cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  project_call:          { label: 'Proje Çağrısı',       cls: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' },
  resource:              { label: 'Kaynak',               cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  mentorship_experience: { label: 'Mentorluk Deneyimi',  cls: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
  content_draft:         { label: 'İçerik Taslağı',      cls: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  team_search:           { label: 'Ekip Arıyor',         cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' },
};

const AVATAR_COLORS = [
  'bg-[#26496b] text-white',
  'bg-[#66aca9] text-white',
  'bg-purple-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-indigo-600 text-white',
  'bg-teal-600 text-white',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

interface PublicPost {
  id: string;
  type: string;
  category: string;
  title: string | null;
  body: string;
  isPinned: boolean;
  createdAt: string;
  authorId: string;
  displayName: string | null;
  profession: string | null;
  reactionCount: number;
  commentCount: number;
}

const EXAMPLE_POSTS: PublicPost[] = [
  {
    id: 'ex-1',
    type: 'question',
    category: 'cbs',
    title: 'QGIS\'te büyük raster dosyaları nasıl daha hızlı işlenir?',
    body: 'Birkaç GB boyutunda raster verilerle çalışırken QGIS ciddi yavaşlıyor. Piramit oluşturma dışında önerilen teknikler neler? Özellikle mekansal indeksleme ve tile bazlı işleme konusunda deneyimlerinizi merak ediyorum.',
    isPinned: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    authorId: 'ex-u1',
    displayName: 'Mert Kaya',
    profession: 'CBS Uzmanı',
    reactionCount: 14,
    commentCount: 7,
  },
  {
    id: 'ex-2',
    type: 'resource',
    category: 'fotogrametri_uzaktan_algilama',
    title: 'Ücretsiz Sentinel-2 verisiyle arazi örtüsü sınıflandırması — adım adım rehber',
    body: 'Google Earth Engine üzerinde Sentinel-2 L2A bantlarını kullanarak basit bir makine öğrenmesi sınıflandırması nasıl yapılır? Random Forest ile %91 doğruluk oranına ulaştım. Notebook\'u ve metodoloji notlarını paylaşıyorum.',
    isPinned: false,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    authorId: 'ex-u2',
    displayName: 'Elif Şahin',
    profession: 'Uzaktan Algılama Araştırmacısı',
    reactionCount: 31,
    commentCount: 12,
  },
  {
    id: 'ex-3',
    type: 'idea',
    category: 'kariyer',
    title: null,
    body: 'Kariyer planlaması konusunda çoğu haritacı "ne iş bulurum?" sorusuyla başlıyor. Oysa soru şu olmalı: "Mesleğimin hangi kolunda en çok değer üretebilirim?" CBS, fotogrametri, kadastro, BIM entegrasyonu — her birinin iş piyasasındaki ağırlığı farklı. Bu ayrımı erken fark etmek büyük fark yaratıyor.',
    isPinned: false,
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    authorId: 'ex-u3',
    displayName: 'Ahmet Demir',
    profession: 'Harita Mühendisi',
    reactionCount: 22,
    commentCount: 9,
  },
];

async function fetchPublicPosts(category?: string): Promise<PublicPost[]> {
  try {
    const url = new URL(`${API_URL}/api/v1/posts/public`);
    if (category) url.searchParams.set('category', category);
    url.searchParams.set('limit', '30');
    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json() as { items: PublicPost[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1} dakika önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const fetched = await fetchPublicPosts(category);
  const isEmpty = fetched.length === 0 && !category;
  const posts = isEmpty ? EXAMPLE_POSTS : fetched;

  const pinnedPosts = posts.filter(p => p.isPinned);
  const regularPosts = posts.filter(p => !p.isPinned);

  const categories = Object.entries(CATEGORY_LABELS);
  const activeCats = [...new Set(posts.map(p => p.category))];

  return (
    <>
      <PageActionTracker actionId="c-forum-cevap" />
      <Navbar />
      <main className="min-h-screen bg-[#f4f7fa] dark:bg-[#070c1a]">

        {/* ── Hero ── */}
        <section className="bg-gradient-to-br from-[#26496b] to-[#1a3351] py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📚</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#66aca9]">Topluluk İçerikleri</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  Mutfak Kütüphanesi
                </h1>
                <p className="text-[#a8d4d1] text-sm sm:text-base max-w-xl leading-relaxed">
                  Haritailesi topluluğunun herkese açık tartışmaları, sorular, fikirler ve
                  deneyimler. Yanıtlamak ve katılmak için Mutfak üyesi olun.
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-3">
                {posts.length > 0 && (
                  <div className="flex items-center gap-4 text-sm text-[#a8d4d1]">
                    <span><strong className="text-white font-bold">{posts.length}</strong> gönderi</span>
                    <span><strong className="text-white font-bold">{activeCats.length}</strong> konu</span>
                  </div>
                )}
                <a
                  href={MUTFAK_URL}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#66aca9] text-white text-sm font-semibold rounded-xl hover:bg-[#4d8f8c] transition-colors shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  Mutfak'ta Katıl
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Category strip ── */}
        <div className="bg-white dark:bg-[#0d1628] border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Link
              href="/forum"
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                !category
                  ? 'bg-[#26496b] text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              Tümü
            </Link>
            {categories.map(([key, label]) => (
              <Link
                key={key}
                href={`/forum?category=${key}`}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  category === key
                    ? 'bg-[#26496b] text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Post feed ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Pinned */}
              {pinnedPosts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">Sabitlenmiş</p>
                  <div className="space-y-3">
                    {pinnedPosts.map(post => <PostCard key={post.id} post={post} mutfakUrl={MUTFAK_URL} />)}
                  </div>
                </div>
              )}

              {/* Regular */}
              {regularPosts.length > 0 && (
                <div>
                  {pinnedPosts.length > 0 && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3 mt-5">Son Gönderiler</p>
                  )}
                  {isEmpty && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium mb-4">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Bunlar örnek gönderiler — Mutfak üyeleri paylaştıkça gerçek içerikler burada görünecek.
                    </div>
                  )}
                  {/* Category empty */}
                  {fetched.length === 0 && category && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
                      <p className="text-gray-500 dark:text-slate-400 font-medium">Bu kategoride gönderi yok</p>
                      <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-4">Üyeler gönderi paylaştıkça burada görünecek.</p>
                      <a href={MUTFAK_URL} className="inline-flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors">
                        Mutfak'ta Paylaş →
                      </a>
                    </div>
                  )}
                  <div className="space-y-3">
                    {regularPosts.map(post => <PostCard key={post.id} post={post} mutfakUrl={MUTFAK_URL} />)}
                  </div>
                </div>
              )}

              {/* Bottom CTA */}
              {posts.length > 0 && (
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#26496b] to-[#1a3351] p-6 text-white">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex-1">
                      <p className="font-bold text-base mb-1">Tartışmaya sen de katıl</p>
                      <p className="text-white/65 text-sm leading-relaxed">
                        Soru sor, fikir paylaş, deneyim aktar. Gönderini "Herkese Açık" yap, burada görünsün.
                      </p>
                    </div>
                    <a
                      href={MUTFAK_URL}
                      className="shrink-0 bg-white text-[#26496b] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Mutfak'a Gir
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <aside className="space-y-5">

              {/* Join card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 dark:bg-[#26496b]/20 flex items-center justify-center text-xl">🍳</div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-slate-100">Mutfak'a Katıl</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Üye platformu</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
                  Tam deneyim için Haritailesi Mutfak'ta tartışmalara katıl, yorum yap, kendi gönderini paylaş.
                </p>
                <a
                  href={MUTFAK_URL}
                  className="w-full block text-center py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors"
                >
                  Mutfak'a Git →
                </a>
              </div>

              {/* Stats */}
              {!isEmpty && posts.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                  <p className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9] uppercase tracking-wider mb-4">Bu Sayfada</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Gönderi</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">{posts.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Konu alanı</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">{activeCats.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Toplam tepki</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">
                        {posts.reduce((s, p) => s + p.reactionCount, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Toplam yorum</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">
                        {posts.reduce((s, p) => s + p.commentCount, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                <p className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9] uppercase tracking-wider mb-4">Nasıl Çalışır?</p>
                <ol className="space-y-3.5">
                  {[
                    { n: '1', t: 'Herkese açık gönderiler', d: 'Mutfak üyeleri gönderilerini herkese açık yaparak burada görünmesini sağlar.' },
                    { n: '2', t: 'Okuyun & keşfedin', d: 'Gönderilere göz atın, topluluğun nabzını tutun.' },
                    { n: '3', t: 'Mutfak\'ta katılın', d: 'Yorum yazmak ve kendi gönderinizi paylaşmak için üye olun.' },
                  ].map(s => (
                    <li key={s.n} className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#26496b]/10 dark:bg-[#26496b]/20 text-[#26496b] dark:text-[#66aca9] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {s.n}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">{s.t}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 leading-relaxed">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* S&C link */}
              <div className="bg-[#f0f7f7] dark:bg-[#0a1a2e] rounded-2xl border border-[#66aca9]/20 p-5">
                <p className="text-xs font-semibold text-[#66aca9] uppercase tracking-wider mb-2">Soru & Cevap</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
                  Uzman ekibimiz tarafından yanıtlanan resmi sorular için Soru&Cevap bölümüne bakın.
                </p>
                <Link href="/soru-cevap" className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9] hover:underline">
                  Soru & Cevap'a Git →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, mutfakUrl }: { post: PublicPost; mutfakUrl: string }) {
  const badge = TYPE_BADGE[post.type];
  const name = post.displayName ?? 'Üye';
  const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avColor = avatarColor(name);

  return (
    <article className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all duration-150 overflow-hidden">
      {/* Pin stripe */}
      {post.isPinned && (
        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-300" />
      )}

      <div className="p-5">
        {/* Type + category */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {badge && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
        </div>

        {/* Title + body */}
        {post.title && (
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1.5 leading-snug">
            {post.title}
          </h3>
        )}
        <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {post.body}
        </p>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5 border-t border-gray-50 dark:border-slate-800">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avColor}`}>
              {initials || '?'}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{name}</span>
              {post.profession && (
                <span className="text-xs text-gray-400 dark:text-slate-500"> · {post.profession}</span>
              )}
            </div>
            <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(post.createdAt)}</span>
          </div>

          {/* Stats + CTA */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.reactionCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.commentCount}
            </span>
            <a
              href={mutfakUrl}
              className="text-xs font-semibold text-[#26496b] dark:text-[#66aca9] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Yanıtla →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
