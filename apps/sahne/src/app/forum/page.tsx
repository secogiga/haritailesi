import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Forum — Haritailesi',
  description: 'Harita, geomatik ve kadastro topluluğunun açık tartışma alanı.',
};

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

const CATEGORY_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık',
  cbs: 'CBS / GIS',
  fotogrametri_uzaktan_algilama: 'Fotogrametri & UA',
  insaat: 'İnşaat Ölçmesi',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme',
  yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer: 'Kariyer',
  egitim: 'Eğitim',
  mentorluk: 'Mentorluk',
  gonullulik: 'Gönüllülük',
  proje_gelistirme: 'Proje Geliştirme',
  haritailesi_duyurulari: 'Duyurular',
};

const TYPE_COLORS: Record<string, string> = {
  question: 'bg-amber-50 text-amber-700',
  idea: 'bg-purple-50 text-purple-700',
  general: 'bg-gray-100 text-gray-600',
  announcement: 'bg-blue-50 text-blue-700',
  project_call: 'bg-teal-50 text-teal-700',
  resource: 'bg-emerald-50 text-emerald-700',
  mentorship_experience: 'bg-rose-50 text-rose-600',
};
const TYPE_LABELS: Record<string, string> = {
  question: 'Soru',
  idea: 'Fikir',
  general: 'Genel',
  announcement: 'Duyuru',
  project_call: 'Proje Çağrısı',
  resource: 'Kaynak',
  mentorship_experience: 'Mentorluk Deneyimi',
};

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

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const posts = await fetchPublicPosts(category);

  const categories = Object.entries(CATEGORY_LABELS);

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">Sahne Modülleri</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Forum</h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl text-sm sm:text-base mb-6">
              Haritailesi topluluğundan herkese açık tartışmalar, sorular ve paylaşımlar.
              Katılmak ve yorum yapmak için üye olun.
            </p>
            <a
              href={`${MUTFAK_URL}/giris`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors"
            >
              Tartışmaya Katıl →
            </a>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar — categories */}
            <aside className="lg:w-56 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Kategoriler</p>
              <nav className="space-y-0.5">
                <Link
                  href="/forum"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    !category ? 'bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] font-semibold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Tümü
                </Link>
                {categories.map(([key, label]) => (
                  <Link
                    key={key}
                    href={`/forum?category=${key}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === key ? 'bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] font-semibold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </aside>

            {/* Posts */}
            <div className="flex-1 min-w-0">
              {posts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-slate-400 font-medium">Henüz herkese açık gönderi yok.</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Üyeler gönderilerini "Herkese Açık" yaparak burada paylaşabilir.</p>
                  <a
                    href={`${MUTFAK_URL}/giris`}
                    className="mt-4 inline-block text-sm font-semibold text-[var(--color-mavi)] hover:underline"
                  >
                    Mutfak'a Gir → Paylaş
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {post.isPinned && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                            Sabitlenmiş
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[post.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {TYPE_LABELS[post.type] ?? post.type}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {CATEGORY_LABELS[post.category] ?? post.category}
                        </span>
                      </div>

                      {post.title && (
                        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1.5">{post.title}</h3>
                      )}
                      <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {post.body}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-50 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                          <div className="w-5 h-5 rounded-full bg-[var(--color-mavi)]/20 flex items-center justify-center text-[var(--color-mavi)] text-[9px] font-bold">
                            {(post.displayName ?? '?')[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-600 dark:text-slate-400">{post.displayName ?? 'Üye'}</span>
                          {post.profession && <span>· {post.profession}</span>}
                          <span>·</span>
                          <span>{new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {post.reactionCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.commentCount}
                          </span>
                          <a
                            href={`${MUTFAK_URL}/giris`}
                            className="text-[var(--color-mavi)] hover:underline font-medium"
                          >
                            Yanıtla →
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* CTA banner */}
              <div className="mt-8 bg-gradient-to-br from-[var(--color-mavi)] to-[#1d3a57] rounded-2xl p-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="flex-1">
                    <h3 className="text-base font-bold mb-1">Tartışmaya sen de katıl</h3>
                    <p className="text-white/70 text-sm">Soru sor, fikir paylaş, deneyim aktar. Gönderini "Herkese Açık" yap, burada görünsün.</p>
                  </div>
                  <a
                    href={MUTFAK_URL}
                    className="shrink-0 bg-white text-[var(--color-mavi)] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Mutfak'a Gir
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
