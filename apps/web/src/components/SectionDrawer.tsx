'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminMode } from '@/contexts/AdminMode';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('./InlineRichEditor').then((m) => m.InlineRichEditor),
  { ssr: false, loading: () => <div className="h-48 bg-gray-50 rounded-lg animate-pulse" /> },
);

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type Stat = { number: string; label: string };
type Feature = { title: string; description: string };

interface Props {
  sectionKey: string;
  label: string;
  initialData: unknown;
  onClose: () => void;
}

function Field({
  label,
  value,
  onChange,
  textarea,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  hint?: string;
}) {
  const cls =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-mavi)] focus:ring-1 focus:ring-[var(--color-mavi)]';
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {textarea ? (
        <textarea rows={3} className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function SectionDrawer({ sectionKey, label, initialData, onClose }: Props) {
  const { token } = useAdminMode();
  const router = useRouter();
  const [data, setData] = useState<unknown>(initialData ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [context, key] = sectionKey.split(':') as [string, string];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // navbar:menu için API'den fresh veri çek
  useEffect(() => {
    if (!token || context !== 'navbar' || key !== 'menu') return;
    fetch(`${API_URL}/api/v1/admin/cms/settings/navbar`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (Array.isArray(d) && d.length > 0) setData(d);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function authFetch(path: string, opts?: RequestInit) {
    return fetch(`${API_URL}/api/v1${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...opts?.headers,
      },
    });
  }

  async function save() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      if (context === 'homepage' || context === 'footer') {
        const settingsKey = context === 'footer' ? 'footer' : 'homepage';
        if (key === 'links') {
          // footer_links is a top-level settings key
          const put = await authFetch(`/admin/cms/settings/footer_links`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
          if (!put.ok) throw new Error(`HTTP ${put.status}`);
        } else {
          const res = await authFetch(`/admin/cms/settings/${settingsKey}`);
          const current: Record<string, unknown> = res.ok ? (await res.json() as Record<string, unknown>) : {};
          const merged = { ...current, [key]: data };
          const put = await authFetch(`/admin/cms/settings/${settingsKey}`, {
            method: 'PUT',
            body: JSON.stringify(merged),
          });
          if (!put.ok) throw new Error(`HTTP ${put.status}`);
        }
      } else if (context === 'navbar') {
        const put = await authFetch(`/admin/cms/settings/navbar`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        if (!put.ok) throw new Error(`HTTP ${put.status}`);
      } else if (context === 'page') {
        const res = await authFetch(`/admin/cms/pages/${key}`);
        const current = res.ok ? (await res.json() as Record<string, unknown>) : {};
        const merged = { ...current, ...(data as Record<string, unknown>) };
        const put = await authFetch(`/admin/cms/pages/${key}`, {
          method: 'PUT',
          body: JSON.stringify(merged),
        });
        if (!put.ok) throw new Error(`HTTP ${put.status}`);
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  function renderFields() {
    if (context === 'homepage') {
      if (key === 'hero') {
        const d = (data ?? {}) as { title?: string; highlight?: string; subtitle?: string; ctaPrimary?: string; ctaSecondary?: string };
        const set = (k: string, v: string) => setData({ ...d, [k]: v });
        return (
          <div className="space-y-4">
            <Field label="Ana Başlık" value={d.title ?? ''} onChange={(v) => set('title', v)} hint="Örn: Haritailesi'ne Katılan" />
            <Field label="Vurgulu Metin (altın)" value={d.highlight ?? ''} onChange={(v) => set('highlight', v)} hint="Örn: Kazanıyor!" />
            <Field label="Alt Metin" value={d.subtitle ?? ''} onChange={(v) => set('subtitle', v)} textarea />
            <Field label="Ana Buton Yazısı" value={d.ctaPrimary ?? ''} onChange={(v) => set('ctaPrimary', v)} />
            <Field label="İkincil Buton Yazısı" value={d.ctaSecondary ?? ''} onChange={(v) => set('ctaSecondary', v)} />
          </div>
        );
      }

      if (key === 'stats') {
        const arr = (Array.isArray(data) ? data : []) as Stat[];
        const update = (i: number, k: keyof Stat, v: string) => {
          const copy = arr.map((s, idx) => (idx === i ? { ...s, [k]: v } : s));
          setData(copy);
        };
        const add = () => setData([...arr, { number: '', label: '' }]);
        const remove = (i: number) => setData(arr.filter((_, idx) => idx !== i));
        return (
          <div className="space-y-3">
            {arr.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Field label="Rakam" value={s.number} onChange={(v) => update(i, 'number', v)} />
                  <Field label="Etiket" value={s.label} onChange={(v) => update(i, 'label', v)} />
                </div>
                <button
                  onClick={() => remove(i)}
                  className="mt-5 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Kaldır"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button onClick={add} className="text-xs font-medium text-[var(--color-mavi)] hover:underline">
              + Satır Ekle
            </button>
          </div>
        );
      }

      if (key === 'features') {
        const arr = (Array.isArray(data) ? data : []) as Feature[];
        const update = (i: number, k: keyof Feature, v: string) => {
          const copy = arr.map((f, idx) => (idx === i ? { ...f, [k]: v } : f));
          setData(copy);
        };
        const add = () => setData([...arr, { title: '', description: '' }]);
        const remove = (i: number) => setData(arr.filter((_, idx) => idx !== i));
        return (
          <div className="space-y-4">
            {arr.map((f, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 relative">
                <button
                  onClick={() => remove(i)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <Field label="Başlık" value={f.title} onChange={(v) => update(i, 'title', v)} />
                <Field label="Açıklama" value={f.description} onChange={(v) => update(i, 'description', v)} textarea />
              </div>
            ))}
            <button onClick={add} className="text-xs font-medium text-[var(--color-mavi)] hover:underline">
              + Özellik Ekle
            </button>
          </div>
        );
      }

      if (key === 'mgTeaser') {
        const d = (data ?? {}) as { title?: string; description?: string; items?: { label: string }[] };
        const set = (k: string, v: unknown) => setData({ ...d, [k]: v });
        const items = d.items ?? [{ label: 'Mentorluk' }, { label: 'Proje Geliştirme' }, { label: 'Network' }, { label: 'Eğitim' }];
        const updateItem = (i: number, v: string) => set('items', items.map((x, j) => j === i ? { label: v } : x));
        const addItem = () => set('items', [...items, { label: '' }]);
        const removeItem = (i: number) => set('items', items.filter((_, j) => j !== i));
        return (
          <div className="space-y-4">
            <Field label="Başlık" value={d.title ?? ''} onChange={(v) => set('title', v)} />
            <Field label="Açıklama" value={d.description ?? ''} onChange={(v) => set('description', v)} textarea />
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Özellik Kartları (sağ taraf)</p>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-mavi)]"
                      value={item.label}
                      onChange={e => updateItem(i, e.target.value)}
                      placeholder="Özellik adı"
                    />
                    <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <button onClick={addItem} className="text-xs font-medium text-[var(--color-mavi)] hover:underline">+ Kart Ekle</button>
              </div>
            </div>
          </div>
        );
      }

      if (key === 'newsletter') {
        const d = (data ?? {}) as { title?: string; subtitle?: string };
        const set = (k: string, v: string) => setData({ ...d, [k]: v });
        return (
          <div className="space-y-4">
            <Field label="Başlık" value={d.title ?? ''} onChange={(v) => set('title', v)} />
            <Field label="Alt Metin" value={d.subtitle ?? ''} onChange={(v) => set('subtitle', v)} />
          </div>
        );
      }

      if (key === 'uyelikBolumu') {
        const d = (data ?? {}) as { title?: string; subtitle?: string };
        const set = (k: string, v: string) => setData({ ...d, [k]: v });
        return (
          <div className="space-y-4">
            <Field label="Bölüm Başlığı" value={d.title ?? ''} onChange={(v) => set('title', v)} />
            <Field label="Bölüm Alt Yazısı" value={d.subtitle ?? ''} onChange={(v) => set('subtitle', v)} textarea />
          </div>
        );
      }

      if (key === 'bagis') {
        const d = (data ?? {}) as { badge?: string; title?: string; titleHighlight?: string; description?: string; ctaPrimary?: string; ctaSecondary?: string };
        const set = (k: string, v: string) => setData({ ...d, [k]: v });
        return (
          <div className="space-y-4">
            <Field label="Rozet Metni" value={d.badge ?? ''} onChange={(v) => set('badge', v)} hint="Örn: Yıllık Destek Programı" />
            <Field label="Başlık" value={d.title ?? ''} onChange={(v) => set('title', v)} />
            <Field label="Vurgulu Başlık (renkli)" value={d.titleHighlight ?? ''} onChange={(v) => set('titleHighlight', v)} />
            <Field label="Açıklama" value={d.description ?? ''} onChange={(v) => set('description', v)} textarea />
            <Field label="Ana Buton" value={d.ctaPrimary ?? ''} onChange={(v) => set('ctaPrimary', v)} />
            <Field label="İkincil Buton" value={d.ctaSecondary ?? ''} onChange={(v) => set('ctaSecondary', v)} />
          </div>
        );
      }
    }

    if (context === 'footer') {
      if (key === 'brand') {
        const d = (data ?? {}) as { tagline?: string; linkedinUrl?: string; instagramUrl?: string; youtubeUrl?: string };
        const set = (k: string, v: string) => setData({ ...d, [k]: v });
        return (
          <div className="space-y-4">
            <Field label="Slogan / Kısa Açıklama" value={d.tagline ?? ''} onChange={(v) => set('tagline', v)} textarea />
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sosyal Medya Bağlantıları</p>
              <div className="space-y-3">
                <Field label="LinkedIn URL" value={d.linkedinUrl ?? ''} onChange={(v) => set('linkedinUrl', v)} />
                <Field label="Instagram URL" value={d.instagramUrl ?? ''} onChange={(v) => set('instagramUrl', v)} />
                <Field label="YouTube URL" value={d.youtubeUrl ?? ''} onChange={(v) => set('youtubeUrl', v)} />
              </div>
            </div>
          </div>
        );
      }

    }

    if (context === 'navbar') {
      if (key === 'menu') {
        type NavItem = { label: string; href: string; sub: { label: string; href: string }[] | null };
        const arr = (Array.isArray(data) ? data : []) as NavItem[];
        const updateItem = (i: number, field: string, v: string) => setData(arr.map((it, j) => j === i ? { ...it, [field]: v } : it));
        const removeItem = (i: number) => setData(arr.filter((_, j) => j !== i));
        const addItem = () => setData([...arr, { label: 'Yeni', href: '/', sub: null }]);
        return (
          <div className="space-y-3">
            {arr.map((item, i) => (
              <div key={i} className="flex gap-2 items-start border border-gray-100 rounded-lg p-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Field label="Menü Adı" value={item.label} onChange={(v) => updateItem(i, 'label', v)} />
                  <Field label="URL" value={item.href} onChange={(v) => updateItem(i, 'href', v)} />
                </div>
                <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors mt-5 p-0.5 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button onClick={addItem} className="text-xs font-medium text-[var(--color-mavi)] hover:underline">+ Menü Öğesi Ekle</button>
          </div>
        );
      }
    }

    if (context === 'page') {
      const d = (data ?? {}) as { body?: string | null };
      return (
        <RichTextEditor
          value={d.body ?? ''}
          onChange={(v) => setData({ ...d, body: v })}
          minHeight={320}
        />
      );
    }

    return <p className="text-sm text-gray-400">Bu bölüm için düzenleyici bulunamadı.</p>;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[300] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 bottom-0 z-[301] w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">{label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Değişiklikler kaydedilince anlık yansır.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {renderFields()}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0 space-y-2">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving ? 'Kaydediliyor…' : saved ? '✓ Kaydedildi' : 'Kaydet'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
