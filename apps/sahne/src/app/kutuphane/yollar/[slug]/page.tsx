'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { PathProgressButton } from '../../_library-client';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  term: 'Sözlük', guide: 'Rehber', regulation: 'Mevzuat', document: 'Doküman',
};
const CONTENT_TYPE_COLORS: Record<string, string> = {
  term: 'bg-violet-100 text-violet-700',
  guide: 'bg-emerald-100 text-emerald-700',
  regulation: 'bg-rose-100 text-rose-700',
  document: 'bg-amber-100 text-amber-700',
};
const CONTENT_TYPE_PATHS: Record<string, string> = {
  term: '/kutuphane/sozluk',
  guide: '/kutuphane/rehberler',
  regulation: '/kutuphane/mevzuat',
  document: '/kutuphane/dokumanlar',
};
const DIFF_LABELS: Record<string, string> = {
  beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri',
};
const DIFF_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

interface PathItem {
  contentType: 'term' | 'guide' | 'regulation' | 'document';
  contentId: string; slug: string; title: string; order: number;
}
interface LibraryPath {
  id: string; slug: string; title: string; description: string | null;
  field: string | null; difficulty: string; estimatedMinutes: number | null;
  coverEmoji: string | null; items: PathItem[]; createdAt: string;
}

export default function YolDetayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSahneAuth();
  const [path, setPath] = useState<LibraryPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    void fetch(`${API}/api/v1/library/paths/${slug}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() as Promise<LibraryPath> : null)
      .then(data => { setPath(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!user || !path) return;
    void fetch(`${API}/api/v1/library/me/path-progress/${path.slug}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<{ completed: number[] }> : null)
      .then(data => { if (data) setCompletedSteps(data.completed); })
      .catch(() => {});
  }, [user, path]);

  const handleToggle = (stepIndex: number, done: boolean) => {
    setCompletedSteps(prev =>
      done ? [...prev, stepIndex] : prev.filter(i => i !== stepIndex)
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#26496b] border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!path) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <p className="font-bold text-gray-700 mb-2">Öğrenme yolu bulunamadı</p>
            <Link href="/kutuphane/yollar" className="text-sm text-[#26496b] font-semibold hover:underline">
              ← Tüm yollar
            </Link>
          </div>
        </main>
      </>
    );
  }

  const items = [...(path.items ?? [])].sort((a, b) => a.order - b.order);
  const totalSteps = items.length;
  const doneCount = completedSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0c1a2e] via-[#26496b] to-[#1a3350] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-5">
              <Link href="/kutuphane" className="hover:text-white/80 transition-colors">Meslek Kütüphanesi</Link>
              <span>›</span>
              <Link href="/kutuphane/yollar" className="hover:text-white/80 transition-colors">Öğrenme Yolları</Link>
              <span>›</span>
              <span className="text-white/80 line-clamp-1">{path.title}</span>
            </div>

            <div className="flex items-start gap-5">
              <div className="text-5xl shrink-0">{path.coverEmoji ?? '📚'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${DIFF_COLORS[path.difficulty] ?? 'bg-white/20 text-white'}`}>
                    {DIFF_LABELS[path.difficulty] ?? path.difficulty}
                  </span>
                  <span className="text-xs text-white/50">{totalSteps} adım</span>
                  {path.estimatedMinutes && (
                    <span className="text-xs text-white/50">~{path.estimatedMinutes} dk</span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">{path.title}</h1>
                {path.description && (
                  <p className="text-white/60 text-sm leading-relaxed max-w-2xl">{path.description}</p>
                )}
              </div>
            </div>

            {/* Progress bar (only when logged in) */}
            {user && totalSteps > 0 && (
              <div className="mt-6 bg-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                  <span className="font-semibold">İlerleme</span>
                  <span>{doneCount}/{totalSteps} tamamlandı ({progressPct}%)</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {!user && (
            <div className="mb-6 bg-[#26496b]/5 border border-[#26496b]/15 rounded-2xl p-5 flex items-center justify-between gap-4">
              <p className="text-sm text-[#26496b]">
                <span className="font-bold">Üye ol</span> ve ilerlemeyi takip et.
              </p>
              <div className="flex gap-2 shrink-0">
                <Link href="/uye-ol" className="text-xs font-bold bg-[#26496b] text-white px-4 py-2 rounded-xl hover:bg-[#1a3350] transition-colors">
                  Üye Ol
                </Link>
                <Link href="/giris" className="text-xs font-semibold text-[#26496b] border border-[#26496b]/30 px-4 py-2 rounded-xl hover:bg-[#26496b]/5 transition-colors">
                  Giriş Yap
                </Link>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-4">📋</div>
              <p className="font-bold text-gray-700">Bu yola henüz adım eklenmedi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const isDone = completedSteps.includes(idx);
                const href = `${CONTENT_TYPE_PATHS[item.contentType] ?? '/kutuphane'}/${item.slug}`;
                return (
                  <div
                    key={`${item.contentType}-${item.contentId}`}
                    className={`bg-white rounded-2xl border transition-all ${
                      isDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4 p-5">
                      {/* Step number */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                        isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isDone
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          : idx + 1
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${CONTENT_TYPE_COLORS[item.contentType] ?? 'bg-gray-100 text-gray-600'}`}>
                            {CONTENT_TYPE_LABELS[item.contentType] ?? item.contentType}
                          </span>
                        </div>
                        <Link
                          href={href}
                          className={`text-sm font-semibold transition-colors hover:underline ${
                            isDone ? 'text-gray-500 line-through' : 'text-gray-900 hover:text-[#26496b]'
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.title}
                        </Link>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#26496b] font-semibold hover:underline"
                        >
                          Oku →
                        </Link>
                        <PathProgressButton
                          pathSlug={path.slug}
                          stepIndex={idx}
                          completedSteps={completedSteps}
                          onToggle={handleToggle}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completion banner */}
          {user && totalSteps > 0 && doneCount === totalSteps && (
            <div className="mt-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-lg font-black mb-1">Tebrikler!</h2>
              <p className="text-white/80 text-sm mb-4">Bu öğrenme yolunu tamamladın. Yeni bir yola başlamaya hazır mısın?</p>
              <Link
                href="/kutuphane/yollar"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
              >
                Diğer Yolları Gör →
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/kutuphane/yollar" className="text-sm text-[#26496b] font-semibold hover:underline">
              ← Tüm Öğrenme Yolları
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
