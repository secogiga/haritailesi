'use client';

import { useEffect, useRef, useState } from 'react';
import { adminApi, type CmsProject } from '@/lib/api';

interface LinkedInRow {
  date: string;
  title: string;
  link: string;
  views: number;
}

interface MatchedRow extends LinkedInRow {
  matchedProjectId: string | null;
  matchedProjectTitle: string | null;
  confidence: 'high' | 'low' | 'none';
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
}

function findMatch(title: string, projects: CmsProject[]): { id: string; projectTitle: string; confidence: 'high' | 'low' } | null {
  const normalTitle = normalize(title);
  // High confidence: authorName found verbatim in post
  for (const p of projects) {
    if (!p.authorName) continue;
    const name = normalize(p.authorName);
    if (name.length > 3 && normalTitle.includes(name)) {
      return { id: p.id, projectTitle: p.title, confidence: 'high' };
    }
  }
  // Low confidence: any word from title found in project title
  for (const p of projects) {
    const pTitle = normalize(p.title);
    const words = pTitle.split(/\s+/).filter(w => w.length > 5);
    if (words.some(w => normalTitle.includes(w))) {
      return { id: p.id, projectTitle: p.title, confidence: 'low' };
    }
  }
  return null;
}

async function parseXlsRows(buffer: ArrayBuffer): Promise<LinkedInRow[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]!]!;
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  if (raw.length === 0) return [];
  const keys = Object.keys(raw[0]!);
  const n = (k: string) => normalize(k);
  const dateKey = keys.find(k => n(k).includes('tarih')) ?? '';
  const titleKey = keys.find(k => n(k).includes('baslik') || n(k).includes('hikaye')) ?? '';
  const linkKey = keys.find(k => n(k).includes('link') || n(k).includes('url')) ?? '';
  const viewsKey = keys.find(k => n(k) === 'goruntulenme' || n(k).startsWith('goruntulenme')) ?? '';
  return raw.map((r) => ({
    date: String(r[dateKey] ?? ''),
    title: String(r[titleKey] ?? ''),
    link: String(r[linkKey] ?? ''),
    views: Number(r[viewsKey] ?? 0) || 0,
  })).filter(r => r.link);
}

export default function LinkedInImportPage() {
  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [rows, setRows] = useState<MatchedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi.listProjects().then(setProjects).catch(console.error);
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const buf = ev.target!.result as ArrayBuffer;
        const parsed = await parseXlsRows(buf);
        const matched: MatchedRow[] = parsed.map(row => {
          const m = findMatch(row.title, projects);
          return {
            ...row,
            matchedProjectId: m?.id ?? null,
            matchedProjectTitle: m?.projectTitle ?? null,
            confidence: m?.confidence ?? 'none',
          };
        });
        setRows(matched);
      } catch {
        setError('XLS dosyası okunamadı.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function setRowProject(idx: number, projectId: string) {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const p = projects.find(p => p.id === projectId);
      return { ...r, matchedProjectId: projectId, matchedProjectTitle: p?.title ?? null, confidence: 'high' };
    }));
  }

  function clearRowMatch(idx: number) {
    setRows(prev => prev.map((r, i) =>
      i !== idx ? r : { ...r, matchedProjectId: null, matchedProjectTitle: null, confidence: 'none' }
    ));
  }

  // Aggregate: sum views per project
  function buildUpdateItems() {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (!row.matchedProjectId) continue;
      map.set(row.matchedProjectId, Math.max(map.get(row.matchedProjectId) ?? 0, row.views));
    }
    return Array.from(map.entries()).map(([id, linkedinViewCount]) => ({ id, linkedinViewCount }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const items = buildUpdateItems();
      if (items.length === 0) { setError('Eşleştirilmiş proje yok.'); setSaving(false); return; }
      const res = await adminApi.bulkUpdateLinkedinViews(items);
      setSaved(true);
      setError(null);
      console.log('Updated:', res.updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const matchedCount = rows.filter(r => r.matchedProjectId).length;
  const items = buildUpdateItems();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">LinkedIn Görüntülenme Aktarımı</h1>
        <p className="text-sm text-gray-500 mt-1">
          LinkedIn analitik XLS dosyasını yükleyin. Gönderiler otomatik olarak projelerle eşleştirilir, siz onaylayın.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn XLS Dosyası</label>
        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#26496b] file:text-white hover:file:bg-[#1e3a56] cursor-pointer"
        />
        <p className="text-xs text-gray-400 mt-1">
          Beklenen sütunlar: Oluşturulma tarihi, Gönderi başlığı, Gönderi linki, Görüntülenme
        </p>
      </div>

      {loading && <p className="text-sm text-gray-500">Dosya işleniyor...</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          {items.length} proje güncellendi.
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{rows.length}</span> gönderi,{' '}
              <span className="font-semibold text-green-700">{matchedCount}</span> eşleşti,{' '}
              <span className="font-semibold text-amber-700">{rows.length - matchedCount}</span> eşleşmedi
            </p>
            <button
              onClick={handleSave}
              disabled={saving || matchedCount === 0}
              className="px-4 py-2 bg-[#26496b] text-white text-sm rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : `${items.length} Projeyi Güncelle`}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tarih</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Gönderi (kısaltılmış)</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Görüntülenme</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Eşleşen Proje</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Güven</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, idx) => (
                    <tr key={idx} className={row.matchedProjectId ? '' : 'bg-amber-50/40'}>
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-2 max-w-xs">
                        <p className="truncate text-gray-700" title={row.title}>{row.title}</p>
                        <a href={row.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block">
                          {row.link.replace('https://www.linkedin.com/feed/update/', 'urn:…')}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-900">{row.views.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-2">
                        <select
                          value={row.matchedProjectId ?? ''}
                          onChange={e => {
                            if (e.target.value === '') clearRowMatch(idx);
                            else setRowProject(idx, e.target.value);
                          }}
                          className="text-xs border border-gray-200 rounded px-2 py-1 w-full max-w-[260px] bg-white"
                        >
                          <option value="">— Eşleşme yok —</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.title} {p.authorName ? `(${p.authorName})` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        {row.confidence === 'high' && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Yüksek</span>
                        )}
                        {row.confidence === 'low' && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Düşük</span>
                        )}
                        {row.confidence === 'none' && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Yok</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Güncellenecek Projeler (görüntülenme toplamları):</p>
            <div className="flex flex-wrap gap-2">
              {items.map(item => {
                const p = projects.find(p => p.id === item.id);
                return (
                  <span key={item.id} className="text-xs bg-white border border-gray-200 rounded px-2 py-1">
                    {p?.title ?? item.id}: <strong>{item.linkedinViewCount.toLocaleString('tr-TR')}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
