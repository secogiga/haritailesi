'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/site-admin-api';

type Stat = { number: string; label: string };
type Feature = { title: string; description: string };

interface HomepageSettings {
  hero: { title: string; highlight: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  stats: Stat[];
  features: Feature[];
  mgTeaser: { title: string; description: string };
  bagis: { title: string; subtitle: string; ctaText: string };
  newsletter: { title: string; subtitle: string };
}

const DEFAULTS: HomepageSettings = {
  hero: {
    title: "Haritailesi'ne Katılan", highlight: 'Kazanıyor!',
    subtitle: 'Harita, geomatik, kadastro ve CBS sektörünün profesyonellerini, öğrencilerini ve kurumlarını bir araya getiren topluluk ekosistemi.',
    ctaPrimary: 'Üye Ol', ctaSecondary: 'Daha Fazla Bilgi',
  },
  stats: [
    { number: '500+', label: 'Aktif Üye' }, { number: '25', label: 'Mesleğin Gelecekleri Kontenjanı' },
    { number: '3', label: 'Üyelik Tipi' }, { number: '10+', label: 'Etkinlik / Yıl' },
  ],
  features: [
    { title: 'Topluluk', description: 'Sektörün tüm paydaşlarını bir araya getiren güçlü bir ağ.' },
    { title: 'Mentorluk', description: 'Deneyimli profesyonellerden birebir mentorluk ve kariyer desteği.' },
    { title: 'İçerik & Bilgi', description: 'Sektöre özgü içerikler, yayınlar ve etkinliklere erişim.' },
    { title: 'Kariyer', description: 'İş ilanları, network etkinlikleri ve kariyer gelişim fırsatları.' },
  ],
  mgTeaser: { title: 'Mesleğin Gelecekleri', description: 'Harita ve geomatik sektörünün geleceğini şekillendirecek öğrencilere özel gelişim programı.' },
  bagis: { title: 'Topluluğu Destekle', subtitle: 'Haritailesi vakfını ve etkinliklerini bağışınızla büyütün.', ctaText: 'Bağış Yap' },
  newsletter: { title: 'Haberdar Olun', subtitle: 'Etkinlikler, duyurular ve sektör haberleri için e-posta listemize katılın.' },
};

export default function AnaSayfaPage() {
  const [settings, setSettings] = useState<HomepageSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSetting('homepage')
      .then(d => { if (d) setSettings({ ...DEFAULTS, ...(d as Partial<HomepageSettings>) }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.upsertSetting('homepage', settings as unknown as Record<string, unknown>);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6b68]/30 focus:border-[#2d6b68]';
  const lbl = 'block text-xs font-medium text-gray-500 mb-1';
  const card = 'bg-white rounded-xl border border-gray-200 p-5';
  const cardTitle = 'text-sm font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2';

  if (loading) return <p className="text-gray-500">Yükleniyor…</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ana Sayfa Bölümleri</h1>
          <p className="text-sm text-gray-500 mt-1">Değişiklikler anında canlı siteye yansır.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">✓ Kaydedildi</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-5 py-2.5 bg-[#2d6b68] text-white text-sm font-semibold rounded-lg hover:bg-[#235552] disabled:opacity-60 transition-colors">
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className={card}>
          <h2 className={cardTitle}><span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">H</span>Hero Bölümü</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Başlık</label><input className={inp} value={settings.hero.title} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, title: e.target.value } }))} /></div>
              <div><label className={lbl}>Vurgulanan kelime</label><input className={inp} value={settings.hero.highlight} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, highlight: e.target.value } }))} /></div>
            </div>
            <div><label className={lbl}>Alt yazı</label><textarea className={inp} rows={2} value={settings.hero.subtitle} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, subtitle: e.target.value } }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Birincil buton</label><input className={inp} value={settings.hero.ctaPrimary} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, ctaPrimary: e.target.value } }))} /></div>
              <div><label className={lbl}>İkincil buton</label><input className={inp} value={settings.hero.ctaSecondary} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, ctaSecondary: e.target.value } }))} /></div>
            </div>
          </div>
        </div>

        <div className={card}>
          <h2 className={cardTitle}><span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">#</span>İstatistikler</h2>
          <div className="grid grid-cols-2 gap-3">
            {settings.stats.map((stat, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="w-24 shrink-0"><label className={lbl}>Sayı</label><input className={`${inp} text-center font-bold`} value={stat.number} onChange={e => { const s = settings.stats.map((x, j) => j === i ? { ...x, number: e.target.value } : x); setSettings(p => ({ ...p, stats: s })); }} /></div>
                <div className="flex-1"><label className={lbl}>Açıklama</label><input className={inp} value={stat.label} onChange={e => { const s = settings.stats.map((x, j) => j === i ? { ...x, label: e.target.value } : x); setSettings(p => ({ ...p, stats: s })); }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className={card}>
          <h2 className={cardTitle}><span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">★</span>Platform Özellikleri</h2>
          <div className="space-y-3">
            {settings.features.map((f, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1/3"><label className={lbl}>Başlık</label><input className={inp} value={f.title} onChange={e => { const fs = settings.features.map((x, j) => j === i ? { ...x, title: e.target.value } : x); setSettings(p => ({ ...p, features: fs })); }} /></div>
                <div className="flex-1"><label className={lbl}>Açıklama</label><input className={inp} value={f.description} onChange={e => { const fs = settings.features.map((x, j) => j === i ? { ...x, description: e.target.value } : x); setSettings(p => ({ ...p, features: fs })); }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className={card}>
          <h2 className={cardTitle}><span className="w-6 h-6 rounded bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-bold">MG</span>Mesleğin Gelecekleri Tanıtımı</h2>
          <div className="space-y-3">
            <div><label className={lbl}>Başlık</label><input className={inp} value={settings.mgTeaser.title} onChange={e => setSettings(s => ({ ...s, mgTeaser: { ...s.mgTeaser, title: e.target.value } }))} /></div>
            <div><label className={lbl}>Açıklama</label><textarea className={inp} rows={3} value={settings.mgTeaser.description} onChange={e => setSettings(s => ({ ...s, mgTeaser: { ...s.mgTeaser, description: e.target.value } }))} /></div>
          </div>
        </div>

        <div className={card}>
          <h2 className={cardTitle}><span className="w-6 h-6 rounded bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">♥</span>Bağış Bölümü</h2>
          <div className="space-y-3">
            <div><label className={lbl}>Başlık</label><input className={inp} value={settings.bagis.title} onChange={e => setSettings(s => ({ ...s, bagis: { ...s.bagis, title: e.target.value } }))} /></div>
            <div><label className={lbl}>Alt yazı</label><textarea className={inp} rows={2} value={settings.bagis.subtitle} onChange={e => setSettings(s => ({ ...s, bagis: { ...s.bagis, subtitle: e.target.value } }))} /></div>
            <div><label className={lbl}>Buton metni</label><input className={inp} value={settings.bagis.ctaText} onChange={e => setSettings(s => ({ ...s, bagis: { ...s.bagis, ctaText: e.target.value } }))} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
