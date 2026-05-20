'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, type BoardMember } from '@/lib/api';

export default function YonetimKuruluPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.listBoardMembers()
      .then(setMembers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" üyesini silmek istediğinize emin misiniz?`)) return;
    try {
      await adminApi.deleteBoardMember(id);
      setMembers((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yönetim Kurulu</h1>
          <p className="text-sm text-gray-500 mt-1">Vakıf yönetim kurulu üyeleri</p>
        </div>
        <Link href="/yonetim-kurulu/yeni"
          className="px-4 py-2 bg-[var(--color-mavi)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-mavi-acik)] transition-colors">
          + Yeni Üye
        </Link>
      </div>

      {loading && <p className="text-gray-500">Yükleniyor…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sıra</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ad Soyad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unvan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aktif</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Henüz üye yok.</td></tr>
              )}
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{m.sortOrder}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      m.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {m.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link href={`/yonetim-kurulu/${m.id}`} className="text-[var(--color-mavi)] hover:underline text-xs font-medium">Düzenle</Link>
                    <button onClick={() => handleDelete(m.id, m.name)} className="text-red-500 hover:underline text-xs font-medium">Sil</button>
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
