'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type SubItem = { label: string; href: string };
type NavItem = { label: string; href: string; sub: SubItem[] | null };
type FooterLink = { label: string; href: string; external?: boolean };
type FooterCol = { baslik: string; linkler: FooterLink[] };

const NAV_DEFAULTS: NavItem[] = [
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

const FOOTER_DEFAULTS: FooterCol[] = [
  {
    baslik: 'Haritailesi',
    linkler: [
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Yönetim Kurulu', href: '/hakkimizda/yonetim' },
      { label: 'Projeler', href: '/projeler' },
      { label: 'Etkinlikler', href: '/etkinlikler' },
      { label: 'İletişim', href: '/iletisim' },
    ],
  },
  {
    baslik: 'Üyelik',
    linkler: [
      { label: 'Neden Üye Olmalıyım?', href: '/uye-ol' },
      { label: 'Bireysel Üyelik', href: '/uye-ol/bireysel' },
      { label: 'Kurumsal Üyelik', href: '/uye-ol/kurumsal' },
      { label: 'Mesleğin Gelecekleri', href: '/meslegin-gelecekleri' },
    ],
  },
  {
    baslik: 'Platform',
    linkler: [
      { label: 'Sahne (İçerik)', href: 'https://sahne.haritailesi.org', external: true },
      { label: 'Mutfak (Üye Portalı)', href: 'https://mutfak.haritailesi.org', external: true },
    ],
  },
  {
    baslik: 'Bilgi',
    linkler: [
      { label: 'KVKK', href: '/kvkk' },
      { label: 'Çerez Politikası', href: '/cerez-politikasi' },
      { label: 'Sıkça Sorulan Sorular', href: '/sss' },
    ],
  },
];

export default function MenuPage() {
  const [tab, setTab] = useState<'navbar' | 'footer'>('navbar');

  // ── Navbar state ─────────────────────────────────────────────────────────────
  const [items, setItems] = useState<NavItem[]>(NAV_DEFAULTS);
  const [navLoading, setNavLoading] = useState(true);
  const [navSaving, setNavSaving] = useState(false);
  const [navSaved, setNavSaved] = useState(false);
  const [navError, setNavError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  // ── Footer state ──────────────────────────────────────────────────────────────
  const [footerCols, setFooterCols] = useState<FooterCol[]>(
    JSON.parse(JSON.stringify(FOOTER_DEFAULTS))
  );
  const [footLoading, setFootLoading] = useState(true);
  const [footSaving, setFootSaving] = useState(false);
  const [footSaved, setFootSaved] = useState(false);
  const [footError, setFootError] = useState('');

  useEffect(() => {
    adminApi.getSetting('navbar')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setItems(data as unknown as NavItem[]);
      })
      .catch(() => {})
      .finally(() => setNavLoading(false));

    adminApi.getSetting('footer_links')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const cols = data as unknown as FooterCol[];
          if (cols.every(c => c.baslik?.trim())) setFooterCols(cols);
        }
      })
      .catch(() => {})
      .finally(() => setFootLoading(false));
  }, []);

  // ── Navbar handlers ───────────────────────────────────────────────────────────
  async function handleNavSave() {
    setNavSaving(true); setNavError(''); setNavSaved(false);
    try {
      await adminApi.upsertSetting('navbar', items as unknown as Record<string, unknown>);
      setNavSaved(true);
      setTimeout(() => setNavSaved(false), 3000);
    } catch (e) { setNavError((e as Error).message); }
    finally { setNavSaving(false); }
  }

  function moveItem(i: number, dir: -1 | 1) {
    const copy = [...items];
    const j = i + dir;
    if (j < 0 || j >= copy.length) return;
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    setItems(copy);
  }
  function updateItem(i: number, field: 'label' | 'href', value: string) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
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
      setItems(items.map((it, idx) => idx === i ? { ...it, sub: null } : it));
    } else {
      setItems(items.map((it, idx) => idx === i ? { ...it, sub: [] } : it));
      setExpanded(i);
    }
  }
  function updateSub(i: number, j: number, field: 'label' | 'href', value: string) {
    const sub = (items[i]!.sub ?? []).map((s, idx) => idx === j ? { ...s, [field]: value } : s);
    setItems(items.map((it, idx) => idx === i ? { ...it, sub } : it));
  }
  function addSub(i: number) {
    const sub = [...(items[i]!.sub ?? []), { label: 'Alt Öğe', href: '/' }];
    setItems(items.map((it, idx) => idx === i ? { ...it, sub } : it));
  }
  function removeSub(i: number, j: number) {
    const sub = (items[i]!.sub ?? []).filter((_, idx) => idx !== j);
    setItems(items.map((it, idx) => idx === i ? { ...it, sub: sub.length > 0 ? sub : null } : it));
  }
  function moveSub(i: number, j: number, dir: -1 | 1) {
    const sub = [...(items[i]!.sub ?? [])];
    const k = j + dir;
    if (k < 0 || k >= sub.length) return;
    [sub[j], sub[k]] = [sub[k]!, sub[j]!];
    setItems(items.map((it, idx) => idx === i ? { ...it, sub } : it));
  }

  // ── Footer handlers ───────────────────────────────────────────────────────────
  async function handleFooterSave() {
    setFootSaving(true); setFootError(''); setFootSaved(false);
    try {
      await adminApi.upsertSetting('footer_links', footerCols as unknown as Record<string, unknown>);
      setFootSaved(true);
      setTimeout(() => setFootSaved(false), 3000);
    } catch (e) { setFootError((e as Error).message); }
    finally { setFootSaving(false); }
  }

  function updateFooterLink(ci: number, li: number, field: keyof FooterLink, v: string | boolean) {
    setFooterCols(footerCols.map((c, i) => i !== ci ? c : {
      ...c,
      linkler: c.linkler.map((l, j) => j !== li ? l : { ...l, [field]: v }),
    }));
  }
  function addFooterLink(ci: number) {
    setFooterCols(footerCols.map((c, i) => i !== ci ? c : {
      ...c, linkler: [...c.linkler, { label: '', href: '' }],
    }));
  }
  function removeFooterLink(ci: number, li: number) {
    setFooterCols(footerCols.map((c, i) => i !== ci ? c : {
      ...c, linkler: c.linkler.filter((_, j) => j !== li),
    }));
  }
  function moveFooterLink(ci: number, li: number, dir: -1 | 1) {
    const col = footerCols[ci]!;
    const linkler = [...col.linkler];
    const k = li + dir;
    if (k < 0 || k >= linkler.length) return;
    [linkler[li], linkler[k]] = [linkler[k]!, linkler[li]!];
    setFooterCols(footerCols.map((c, i) => i !== ci ? c : { ...c, linkler }));
  }

  const inp = 'border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]';

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menü Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Üst menü ve alt menü linklerini yönetin. Kaydet&apos;e basınca anlık yansır.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tab === 'navbar' && navSaved && <span className="text-sm text-green-600 font-medium">✓ Kaydedildi</span>}
          {tab === 'navbar' && navError && <span className="text-sm text-red-600">{navError}</span>}
          {tab === 'footer' && footSaved && <span className="text-sm text-green-600 font-medium">✓ Kaydedildi</span>}
          {tab === 'footer' && footError && <span className="text-sm text-red-600">{footError}</span>}
          <button
            onClick={tab === 'navbar' ? handleNavSave : handleFooterSave}
            disabled={tab === 'navbar' ? navSaving : footSaving}
            className="px-5 py-2.5 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-mavi-acik)] disabled:opacity-60 transition-colors"
          >
            {(tab === 'navbar' ? navSaving : footSaving) ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {(['navbar', 'footer'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'navbar' ? 'Üst Menü' : 'Alt Menü'}
          </button>
        ))}
      </div>

      {/* ── Üst Menü ── */}
      {tab === 'navbar' && (
        <>
          {navLoading ? <p className="text-gray-500">Yükleniyor…</p> : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                    <div className="flex gap-2 flex-1">
                      <input className={`${inp} w-36 font-medium`} value={item.label} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="Menü Adı" />
                      <input className={`${inp} flex-1 font-mono text-xs`} value={item.href} onChange={e => updateItem(i, 'href', e.target.value)} placeholder="/yol" />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { if (item.sub && !confirm('Alt menü kaldırılacak. Devam?')) return; toggleSub(i); }}
                        className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${item.sub ? 'bg-blue-50 text-[var(--color-mavi)] hover:bg-blue-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {item.sub ? `↳ ${item.sub.length} alt` : '+ Alt Menü'}
                      </button>
                      {item.sub && (
                        <button onClick={() => setExpanded(expanded === i ? null : i)} className="p-1.5 text-gray-400 hover:text-gray-700">
                          <svg className={`w-4 h-4 transition-transform ${expanded === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => removeItem(i)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  {item.sub && expanded === i && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                      {item.sub.map((sub, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button onClick={() => moveSub(i, j, -1)} disabled={j === 0} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <button onClick={() => moveSub(i, j, 1)} disabled={j === item.sub!.length - 1} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          </div>
                          <input className={`${inp} w-40`} value={sub.label} onChange={e => updateSub(i, j, 'label', e.target.value)} placeholder="Alt Öğe Adı" />
                          <input className={`${inp} flex-1 font-mono text-xs`} value={sub.href} onChange={e => updateSub(i, j, 'href', e.target.value)} placeholder="/yol" />
                          <button onClick={() => removeSub(i, j)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addSub(i)} className="text-xs font-medium text-[var(--color-mavi)] hover:underline">+ Alt Öğe Ekle</button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[var(--color-mavi)] hover:text-[var(--color-mavi)] transition-colors">
                + Menü Öğesi Ekle
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Footer Linkleri ── */}
      {tab === 'footer' && (
        <>
          {footLoading ? <p className="text-gray-500">Yükleniyor…</p> : (
            <div className="space-y-4">
              {footerCols.map((col, ci) => (
                <div key={ci} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <input
                      className={`${inp} font-semibold w-48`}
                      value={col.baslik}
                      onChange={e => setFooterCols(footerCols.map((c, i) => i !== ci ? c : { ...c, baslik: e.target.value }))}
                      placeholder="Sütun Başlığı"
                    />
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {col.linkler.map((link, li) => (
                      <div key={li} className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button onClick={() => moveFooterLink(ci, li, -1)} disabled={li === 0} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                          </button>
                          <button onClick={() => moveFooterLink(ci, li, 1)} disabled={li === col.linkler.length - 1} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                        <input className={`${inp} w-36`} value={link.label} onChange={e => updateFooterLink(ci, li, 'label', e.target.value)} placeholder="Link Adı" />
                        <input className={`${inp} flex-1 font-mono text-xs`} value={link.href} onChange={e => updateFooterLink(ci, li, 'href', e.target.value)} placeholder="/yol veya https://..." />
                        <button
                          onClick={() => updateFooterLink(ci, li, 'external', !link.external)}
                          className={`px-2 py-1 text-xs rounded-md font-medium transition-colors shrink-0 ${link.external ? 'bg-blue-50 text-[var(--color-mavi)]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          title="Dış link (yeni sekmede açılır)"
                        >
                          {link.external ? '↗ Dış' : 'İç'}
                        </button>
                        <button onClick={() => removeFooterLink(ci, li)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addFooterLink(ci)} className="text-xs font-medium text-[var(--color-mavi)] hover:underline">
                      + Link Ekle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={tab === 'navbar' ? handleNavSave : handleFooterSave}
          disabled={tab === 'navbar' ? navSaving : footSaving}
          className="px-6 py-2.5 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-mavi-acik)] disabled:opacity-60 transition-colors"
        >
          {(tab === 'navbar' ? navSaving : footSaving) ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
