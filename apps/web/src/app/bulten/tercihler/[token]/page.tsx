'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const INTEREST_OPTIONS = [
  { key: 'etkinlikler', label: 'Etkinlikler', icon: '📅' },
  { key: 'egitimler', label: 'Eğitimler', icon: '🎓' },
  { key: 'haberler', label: 'Haberler & Duyurular', icon: '📰' },
  { key: 'projeler', label: 'Projeler', icon: '🗺️' },
  { key: 'kariyer', label: 'Kariyer & İş İlanları', icon: '💼' },
  { key: 'teknoloji', label: 'Teknoloji & CBS', icon: '🖥️' },
  { key: 'yarismalar', label: 'Yarışmalar & Ödüller', icon: '🏆' },
  { key: 'magaza', label: 'Mağaza & Ürünler', icon: '🛒' },
];

type Prefs = {
  email: string;
  interestAreas: string[];
  tags: string[];
  isUnsubscribed: boolean;
  availableTags: Array<{ slug: string; label: string; color: string }>;
};

type Status = 'loading' | 'ready' | 'saving' | 'saved' | 'error' | 'invalid';

const UNSUB_REASONS = [
  { key: 'cok_sik', label: 'Çok sık geliyor' },
  { key: 'ilgisiz', label: 'İçerikler ilgimi çekmiyor' },
  { key: 'ihtiyac_yok', label: 'Artık ihtiyacım yok' },
  { key: 'spam', label: 'Spam gibi görünüyor' },
  { key: 'hic_abone_olmadim', label: 'Hiç abone olmadım' },
];

export default function TercihMerkeziPage() {
  const { token } = useParams<{ token: string }>();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [unsubReason, setUnsubReason] = useState('');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    void load();
  }, [token]); // eslint-disable-line

  async function load() {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/newsletter/preferences/${token}`);
      if (res.status === 400) { setStatus('invalid'); return; }
      if (!res.ok) { setStatus('error'); return; }
      const data = await res.json() as Prefs;
      setPrefs(data);
      setInterests((data.interestAreas as string[]) ?? []);
      setUnsubscribed(data.isUnsubscribed);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  async function save() {
    setStatus('saving');
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/newsletter/preferences/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestAreas: interests, isUnsubscribed: unsubscribed, ...(unsubscribed && unsubReason ? { unsubReason } : {}) }),
      });
      if (!res.ok) throw new Error();
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  function toggleInterest(key: string) {
    setInterests(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    if (status === 'saved') setStatus('ready');
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[var(--color-mavi)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (status === 'invalid') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">🔗</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Geçersiz Bağlantı</h1>
          <p className="text-gray-500 text-sm">Bu tercih merkezi bağlantısı artık geçerli değil. Lütfen en son bültendeki bağlantıyı kullanın.</p>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Bir hata oluştu</h1>
          <p className="text-gray-500 text-sm mb-4">Sayfayı yenilemeyi deneyin.</p>
          <button onClick={load} className="px-4 py-2 bg-[var(--color-mavi)] text-white rounded-lg text-sm font-medium">
            Tekrar Dene
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-mavi)] text-white text-2xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-gray-900">Bülten Tercihlerim</h1>
          <p className="text-gray-500 text-sm mt-1">{prefs?.email}</p>
        </div>

        {/* Abonelik Durumu */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-3">Abonelik Durumu</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">Haritailesi bülteninden çık</p>
              <p className="text-xs text-gray-400 mt-0.5">Artık e-posta almak istemiyorum</p>
            </div>
            <button
              onClick={() => { setUnsubscribed(v => !v); setUnsubReason(''); if (status === 'saved') setStatus('ready'); }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${unsubscribed ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${unsubscribed ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
          {unsubscribed && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-2">Neden ayrılıyorsunuz? (opsiyonel)</p>
              <div className="flex flex-wrap gap-2">
                {UNSUB_REASONS.map(r => (
                  <button key={r.key} onClick={() => setUnsubReason(v => v === r.key ? '' : r.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${unsubReason === r.key ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* İlgi Alanları */}
        {!unsubscribed && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <h2 className="font-semibold text-gray-800 mb-1">İlgi Alanları</h2>
            <p className="text-xs text-gray-400 mb-4">Hangi konularda içerik almak istediğini seç</p>
            <div className="grid grid-cols-2 gap-2">
              {INTEREST_OPTIONS.map(opt => {
                const active = interests.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleInterest(opt.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? 'bg-[var(--color-mavi)] text-white border-[var(--color-mavi)]'
                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Kaydet */}
        <button
          onClick={save}
          disabled={status === 'saving' || status === 'saved'}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            status === 'saved'
              ? 'bg-green-500 text-white'
              : status === 'saving'
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[var(--color-mavi)] text-white hover:opacity-90 active:scale-[0.98]'
          }`}
        >
          {status === 'saving' ? 'Kaydediliyor...' : status === 'saved' ? '✓ Kaydedildi' : 'Tercihlerimi Kaydet'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Bu bağlantı sadece sana özel. Başkasıyla paylaşma.
        </p>
      </div>
    </main>
  );
}
