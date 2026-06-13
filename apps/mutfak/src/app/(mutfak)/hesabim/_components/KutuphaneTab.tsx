'use client';

import { useState, useEffect } from 'react';
import { mutfakApi } from '@/lib/api';

const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

type Bookmark = { id: string; title: string; slug: string };
type Bookmarks = {
  terms: Bookmark[];
  guides: Bookmark[];
  regulations: Bookmark[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'İnceleniyor',
  approved: 'Kabul Edildi',
  rejected: 'Reddedildi',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};
const TYPE_LABELS: Record<string, string> = {
  term: 'Terim', guide: 'Rehber', regulation: 'Mevzuat', exam_question: 'Sınav Sorusu',
};

interface Submission {
  id: string;
  content_type: string;
  content_id: string | null;
  body: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export function KutuphaneTab({ token }: { token: string | null }) {
  const [bookmarks, setBookmarks] = useState<Bookmarks>({ terms: [], guides: [], regulations: [] });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'bookmarks' | 'submissions'>('bookmarks');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    void Promise.all([
      mutfakApi.getLibraryPrefs(token).catch(() => null),
      mutfakApi.getMyLibrarySubmissions(token).catch(() => []),
    ]).then(([prefs, subs]) => {
      if (prefs?.bookmarks) setBookmarks(prefs.bookmarks);
      if (Array.isArray(subs)) setSubmissions(subs);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  const totalBookmarks = bookmarks.terms.length + bookmarks.guides.length + bookmarks.regulations.length;

  return (
    <div>
      {/* Sekme header */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-100">
        {([
          { key: 'bookmarks' as const, label: `Kaydedilenler (${totalBookmarks})` },
          { key: 'submissions' as const, label: `Katkılarım (${submissions.length})` },
        ]).map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeSection === s.key
                ? 'border-[#26496b] text-[#26496b]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
        <a
          href={`${SAHNE_URL}/kutuphane`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs text-[#26496b] font-medium hover:underline flex items-center gap-1 pb-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Kütüphaneye Git
        </a>
      </div>

      {/* Bookmarks */}
      {activeSection === 'bookmarks' && (
        <>
          {totalBookmarks === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Henüz kaydettiğin içerik yok</p>
              <p className="text-xs text-gray-400">Kütüphane&apos;den terim, rehber veya mevzuat kaydet.</p>
              <a
                href={`${SAHNE_URL}/kutuphane`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-[#26496b] hover:underline"
              >
                Kütüphaneye Git →
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              {bookmarks.terms.length > 0 && (
                <BookmarkGroup
                  label="Terimler"
                  color="violet"
                  items={bookmarks.terms}
                  hrefFn={s => `${SAHNE_URL}/kutuphane/sozluk/${s}`}
                />
              )}
              {bookmarks.guides.length > 0 && (
                <BookmarkGroup
                  label="Rehberler"
                  color="emerald"
                  items={bookmarks.guides}
                  hrefFn={s => `${SAHNE_URL}/kutuphane/rehberler/${s}`}
                />
              )}
              {bookmarks.regulations.length > 0 && (
                <BookmarkGroup
                  label="Mevzuat"
                  color="rose"
                  items={bookmarks.regulations}
                  hrefFn={s => `${SAHNE_URL}/kutuphane/mevzuat/${s}`}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Submissions */}
      {activeSection === 'submissions' && (
        <>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Henüz katkı göndermediniz</p>
              <p className="text-xs text-gray-400">Yeni terim, rehber veya mevzuat önerisi gönderin.</p>
              <a
                href="/kutuphane"
                className="mt-4 inline-block text-sm font-semibold text-[#26496b] hover:underline"
              >
                Kütüphaneye Katkı Yap →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map(s => {
                let preview = s.body;
                try {
                  const parsed = JSON.parse(s.body) as Record<string, unknown>;
                  preview = String(parsed.term ?? parsed.title ?? parsed.questionText ?? s.body).slice(0, 100);
                } catch { /* raw text */ }
                return (
                  <div key={s.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#26496b]/10 text-[#26496b] px-2 py-0.5 rounded-md">
                          {TYPE_LABELS[s.content_type] ?? s.content_type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(s.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{preview}</p>
                    {s.admin_note && (
                      <p className="text-xs text-gray-500 mt-2 italic border-t border-gray-200 pt-2">
                        Not: {s.admin_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookmarkGroup({
  label, color, items, hrefFn,
}: {
  label: string;
  color: 'violet' | 'emerald' | 'rose';
  items: Bookmark[];
  hrefFn: (slug: string) => string;
}) {
  const colorMap = {
    violet: { bg: 'bg-violet-100', text: 'text-violet-700', hover: 'hover:bg-violet-50', initial: 'T' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', hover: 'hover:bg-emerald-50', initial: 'R' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-700', hover: 'hover:bg-rose-50', initial: 'M' },
  }[color];

  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1.5">
        {items.map(item => (
          <a
            key={item.id}
            href={hrefFn(item.slug)}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2.5 group p-2.5 rounded-xl ${colorMap.hover} transition-colors`}
          >
            <div className={`w-6 h-6 rounded ${colorMap.bg} flex items-center justify-center shrink-0`}>
              <span className={`text-[9px] font-black ${colorMap.text}`}>{colorMap.initial}</span>
            </div>
            <p className={`text-sm font-medium text-gray-800 group-hover:${colorMap.text} transition-colors line-clamp-1`}>
              {item.title}
            </p>
            <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
