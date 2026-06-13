'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as api from '@/lib/site-admin-api';
import type { CmsPage } from '@/lib/site-admin-api';

type FilterKey = 'tumü' | 'hakkimizda' | 'uye-ol' | 'meslegin-gelecekleri' | 'diger';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'tumü', label: 'Tümü' },
  { key: 'hakkimizda', label: 'Hakkımızda' },
  { key: 'uye-ol', label: 'Üyelik' },
  { key: 'meslegin-gelecekleri', label: 'Mesleğin Gelecekleri' },
  { key: 'diger', label: 'Diğer' },
];

function filterPages(pages: CmsPage[], key: FilterKey): CmsPage[] {
  if (key === 'tumü') return pages;
  if (key === 'diger') return pages.filter(p => !p.slug.startsWith('hakkimizda') && !p.slug.startsWith('uye-ol') && !p.slug.startsWith('meslegin-gelecekleri'));
  return pages.filter(p => p.slug.startsWith(key));
}

export default function SayfalarPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterKey>('tumü');

  useEffect(() => {
    api.listPages().then(setPages).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleDelete(slug: string) {
    if (!confirm(`"${slug}" sayfasını silmek istediğinize emin misiniz?`)) return;
    try { await api.deletePage(slug); setPages(p => p.filter(x => x.slug !== slug)); }
    catch (e) { alert((e as Error).message); }
  }

  const visible = filterPages(pages, filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sayfalar</h1>
          <p className="text-sm text-gray-500 mt-1">Hakkımızda, İletişim, Mesleğin Gelecekleri vb. içerik sayfaları</p>
        </div>
        <Link href="/admin/sayfalar/yeni"
          className="px-4 py-2 bg-[#2d6b68] text-white text-sm font-medium rounded-lg hover:bg-[#235552] transition-colors">
          + Yeni Sayfa
        </Link>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key ? 'bg-[#2d6b68] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2d6b68] hover:text-[#2d6b68]'
            }`}>
            {f.label}
            {f.key !== 'tumü' && <span className="ml-1 opacity-70">({filterPages(pages, f.key).length})</span>}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Yükleniyor…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Başlık</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Durum</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Güncellenme</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Bu kategoride sayfa yok.</td></tr>}
              {visible.map(page => (
                <tr key={page.slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{page.slug}</td>
                  <td className="px-4 py-3 text-gray-900">{page.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${page.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {page.isPublished ? 'Yayında' : 'Taslak'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(page.updatedAt).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link href={`/admin/sayfalar/${page.slug}`} className="text-[#2d6b68] hover:underline text-xs font-medium">Düzenle</Link>
                    <button onClick={() => void handleDelete(page.slug)} className="text-red-500 hover:underline text-xs font-medium">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
