'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type SubItem = { label: string; href: string };
type NavItem = { label: string; href: string; sub: SubItem[] | null };

const DEFAULTS: NavItem[] = [
  {
    label: 'Hakkımızda',
    href: '/hakkimizda',
    sub: [
      { label: 'Biz Kimiz?', href: '/hakkimizda' },
      { label: 'Yönetim Kurulu', href: '/hakkimizda/yonetim' },
      { label: 'Tüzük & Belgeler', href: '/hakkimizda/tuzuk' },
      { label: 'Kurumsal Kimlik', href: '/hakkimizda/kimlik' },
    ],
  },
  {
    label: 'Üyelik',
    href: '/uye-ol',
    sub: [
      { label: 'Neden Üye Olmalıyım?', href: '/uye-ol' },
      { label: 'Bireysel Üyelik', href: '/uye-ol/bireysel' },
      { label: 'Kurumsal Üyelik', href: '/uye-ol/kurumsal' },
    ],
  },
  {
    label: 'Mesleğin Gelecekleri',
    href: '/meslegin-gelecekleri',
    sub: [
      { label: 'Program Hakkında', href: '/meslegin-gelecekleri/program' },
      { label: 'Katılma Şartları', href: '/meslegin-gelecekleri/sartlar' },
      { label: 'Başvur', href: '/meslegin-gelecekleri/basvuru' },
    ],
  },
  { label: 'Projeler', href: '/projeler', sub: null },
  {
    label: 'Etkinlikler',
    href: '/etkinlikler',
    sub: [
      { label: 'Tüm Etkinlikler', href: '/etkinlikler' },
      { label: 'Kongreler', href: '/etkinlikler/kongreler' },
      { label: 'Networking', href: '/etkinlikler/networking' },
      { label: 'Ödül Törenleri', href: '/etkinlikler/oduller' },
    ],
  },
  { label: 'İletişim', href: '/iletisim', sub: null },
];

export default function MenuPage() {
  const [items, setItems] = useState<NavItem[]>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    adminApi.getSetting('navbar')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setItems(data as unknown as NavItem[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await adminApi.upsertSetting('navbar', items as unknown as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function moveItem(i: number, dir: -1 | 1) {
    const copy = [...items];
    const j = i + dir;
    if (j < 0 || j >= copy.length) return;
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    setItems(copy);
  }

  function updateItem(i: number, field: 'label' | 'href', value: string) {
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
    if (expanded === i) setExpanded(null);
  }

  function addItem() {
    setItems([...items, { label: 'Yeni Öğe', href: '/', sub: null }]);
  }

  function toggleSub(i: number) {
    const item = items[i]!;
    if (item.sub) {
      setItems(items.map((it, idx) => (idx === i ? { ...it, sub: null } : it)));
    } else {
      setItems(items.map((it, idx) => (idx === i ? { ...it, sub: [] } : it)));
      setExpanded(i);
    }
  }

  function updateSub(i: number, j: number, field: 'label' | 'href', value: string) {
    const item = items[i]!;
    const sub = (item.sub ?? []).map((s, idx) => (idx === j ? { ...s, [field]: value } : s));
    setItems(items.map((it, idx) => (idx === i ? { ...it, sub } : it)));
  }

  function addSub(i: number) {
    const item = items[i]!;
    const sub = [...(item.sub ?? []), { label: 'Alt Öğe', href: '/' }];
    setItems(items.map((it, idx) => (idx === i ? { ...it, sub } : it)));
  }

  function removeSub(i: number, j: number) {
    const item = items[i]!;
    const sub = (item.sub ?? []).filter((_, idx) => idx !== j);
    setItems(items.map((it, idx) => (idx === i ? { ...it, sub: sub.length > 0 ? sub : null } : it)));
  }

  function moveSub(i: number, j: number, dir: -1 | 1) {
    const item = items[i]!;
    const sub = [...(item.sub ?? [])];
    const k = j + dir;
    if (k < 0 || k >= sub.length) return;
    [sub[j], sub[k]] = [sub[k]!, sub[j]!];
    setItems(items.map((it, idx) => (idx === i ? { ...it, sub } : it)));
  }

  if (loading) return <p className="text-gray-500">Yükleniyor…</p>;

  const inp =
    'border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]';

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Navigasyon Menüsü</h1>
          <p className="text-sm text-gray-500 mt-1">
            Web sitesinin üst menüsünü düzenleyin. Kaydet&apos;e basınca anlık yansır.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">✓ Kaydedildi</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-mavi-acik)] disabled:opacity-60 transition-colors"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Ana öğe satırı */}
            <div className="flex items-center gap-2 px-4 py-3">
              {/* Sıralama */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                  title="Yukarı taşı"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === items.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                  title="Aşağı taşı"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Label + Href */}
              <div className="flex gap-2 flex-1">
                <input
                  className={`${inp} w-36 font-medium`}
                  value={item.label}
                  onChange={(e) => updateItem(i, 'label', e.target.value)}
                  placeholder="Menü Adı"
                />
                <input
                  className={`${inp} flex-1 font-mono text-xs`}
                  value={item.href}
                  onChange={(e) => updateItem(i, 'href', e.target.value)}
                  placeholder="/yol"
                />
              </div>

              {/* Alt menü + sil */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    if (item.sub) {
                      if (!confirm('Alt menü öğeleri kaldırılacak. Devam?')) return;
                    }
                    toggleSub(i);
                  }}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                    item.sub
                      ? 'bg-blue-50 text-[var(--color-mavi)] hover:bg-blue-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {item.sub ? `↳ ${item.sub.length} alt` : '+ Alt Menü'}
                </button>
                {item.sub && (
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="p-1.5 text-gray-400 hover:text-gray-700"
                    title="Alt menüleri düzenle"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${expanded === i ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => removeItem(i)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  title="Kaldır"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Alt öğeler */}
            {item.sub && expanded === i && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                {item.sub.map((sub, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveSub(i, j, -1)}
                        disabled={j === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveSub(i, j, 1)}
                        disabled={j === item.sub!.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <input
                      className={`${inp} w-40`}
                      value={sub.label}
                      onChange={(e) => updateSub(i, j, 'label', e.target.value)}
                      placeholder="Alt Öğe Adı"
                    />
                    <input
                      className={`${inp} flex-1 font-mono text-xs`}
                      value={sub.href}
                      onChange={(e) => updateSub(i, j, 'href', e.target.value)}
                      placeholder="/yol"
                    />
                    <button
                      onClick={() => removeSub(i, j)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSub(i)}
                  className="text-xs font-medium text-[var(--color-mavi)] hover:underline"
                >
                  + Alt Öğe Ekle
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[var(--color-mavi)] hover:text-[var(--color-mavi)] transition-colors"
        >
          + Menü Öğesi Ekle
        </button>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-mavi-acik)] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
