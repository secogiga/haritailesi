import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Öğrenme Yolları | Meslek Kütüphanesi — Haritailesi',
  description: 'Haritacılık ve geomatik alanında kuratif öğrenme yolları. Adım adım ilerle, alanında uzmanlaş.',
};

interface LibraryPath {
  id: string; slug: string; title: string; description: string | null;
  field: string | null; difficulty: string; estimatedMinutes: number | null;
  coverEmoji: string | null; itemCount: number; createdAt: string;
}

async function fetchPaths(): Promise<LibraryPath[]> {
  try {
    const res = await fetch(`${API}/api/v1/library/paths`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json() as Promise<LibraryPath[]>;
  } catch { return []; }
}

const DIFF_LABELS: Record<string, string> = {
  beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri',
};
const DIFF_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};
const FIELD_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS / GIS', fotogrametri: 'Fotogrametri',
  kadastro: 'Kadastro', uzaktan_algilama: 'Uzaktan Algılama',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme', yazilim: 'Yazılım',
  kariyer: 'Kariyer', egitim: 'Eğitim', kamu: 'Kamu', genel: 'Genel',
};

export default async function YollarPage() {
  const paths = await fetchPaths();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#0c1a2e] via-[#26496b] to-[#1a3350] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-5">
              <Link href="/kutuphane" className="hover:text-white/80 transition-colors">Meslek Kütüphanesi</Link>
              <span>›</span>
              <span className="text-white/80">Öğrenme Yolları</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shrink-0">🗺️</div>
              <div>
                <h1 className="text-3xl font-black">Öğrenme Yolları</h1>
                <p className="text-white/60 mt-1 text-sm">Adım adım ilerle, her adımı tamamladıkça ilerlemeni takip et.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {paths.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="font-bold text-gray-700 mb-2">Henüz öğrenme yolu eklenmedi</p>
              <p className="text-sm text-gray-400">Ekibimiz yolları hazırlıyor, yakında burada olacak.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paths.map(p => (
                <Link
                  key={p.id}
                  href={`/kutuphane/yollar/${p.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-[#26496b]/30 hover:shadow-md p-6 flex flex-col gap-4 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-4xl">{p.coverEmoji ?? '📚'}</div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${DIFF_COLORS[p.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                        {DIFF_LABELS[p.difficulty] ?? p.difficulty}
                      </span>
                      {p.field && (
                        <span className="text-[10px] text-gray-400 font-medium">{FIELD_LABELS[p.field] ?? p.field}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#26496b] transition-colors mb-2">
                      {p.title}
                    </h2>
                    {p.description && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{p.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    <span>{p.itemCount} adım</span>
                    {p.estimatedMinutes && (
                      <span>~{p.estimatedMinutes} dk</span>
                    )}
                    <span className="text-[#26496b] font-semibold group-hover:translate-x-0.5 transition-transform">
                      Başla →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
