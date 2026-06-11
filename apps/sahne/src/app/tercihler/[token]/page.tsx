'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const INTEREST_AREAS = [
  { id: 'haberler', label: 'Vakıf Haberleri' },
  { id: 'etkinlikler', label: 'Etkinlikler & Sempozyumlar' },
  { id: 'egitimler', label: 'Eğitimler & Kurslar' },
  { id: 'yayinlar', label: 'Yayınlar & Araştırmalar' },
  { id: 'yarismalar', label: 'Yarışmalar & Ödüller' },
  { id: 'is-ilanlari', label: 'İş & Staj İlanları' },
  { id: 'projeler', label: 'Topluluk Projeleri' },
  { id: 'mentorluk', label: 'Mentorluk Programları' },
];

const REGIONS = [
  'Adana', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakır', 'Erzurum',
  'Eskişehir', 'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Konya',
  'Mersin', 'Samsun', 'Trabzon', 'Yurt Dışı', 'Diğer',
];

interface Profile {
  email: string;
  interestAreas: string[];
  region: string | null;
  isUnsubscribed: boolean;
}

type Status = 'loading' | 'ready' | 'saving' | 'saved' | 'unsubscribed' | 'error' | 'not_found';

export default function TercihlerPage() {
  const params = useParams();
  const token = params['token'] as string;

  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState('');
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/v1/admin/newsletter/preferences/${token}`)
      .then(r => {
        if (r.status === 404) { setStatus('not_found'); return null; }
        if (!r.ok) throw new Error('Sunucu hatası');
        return r.json() as Promise<Profile>;
      })
      .then(data => {
        if (!data) return;
        setProfile(data);
        setInterests(new Set(data.interestAreas));
        setRegion(data.region ?? '');
        setUnsubscribed(data.isUnsubscribed);
        setStatus(data.isUnsubscribed ? 'unsubscribed' : 'ready');
      })
      .catch(e => { setErrorMsg((e as Error).message); setStatus('error'); });
  }, [token]);

  function toggleInterest(id: string) {
    setInterests(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    setStatus('saving');
    try {
      const r = await fetch(`${API}/api/v1/admin/newsletter/preferences/${token}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: profile?.email,
          interestAreas: Array.from(interests),
          region: region || null,
          isUnsubscribed: unsubscribed,
        }),
      });
      if (!r.ok) throw new Error('Kaydedilemedi');
      setStatus(unsubscribed ? 'unsubscribed' : 'saved');
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus('error');
    }
  }

  async function resubscribe() {
    setUnsubscribed(false);
    setStatus('saving');
    try {
      await fetch(`${API}/api/v1/admin/newsletter/preferences/${token}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, isUnsubscribed: false }),
      });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#26496b] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Tercihleriniz yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Bağlantı Geçersiz</h1>
          <p className="text-gray-500 text-sm">Bu tercih bağlantısı bulunamadı ya da süresi dolmuş olabilir. Lütfen e-postanızdaki en güncel bağlantıyı kullanın.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Bir Sorun Oluştu</h1>
          <p className="text-gray-500 text-sm">{errorMsg || 'Lütfen daha sonra tekrar deneyin.'}</p>
        </div>
      </div>
    );
  }

  if (status === 'unsubscribed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Aboneliğiniz İptal Edildi</h1>
          <p className="text-gray-500 text-sm mb-6">
            {profile?.email} adresine artık bülten göndermeyeceğiz. Tekrar abone olmak ister misiniz?
          </p>
          <button onClick={resubscribe}
            className="bg-[#26496b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1d374f] transition-colors">
            Yeniden Abone Ol
          </button>
        </div>
      </div>
    );
  }

  if (status === 'saved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Tercihleriniz Kaydedildi</h1>
          <p className="text-gray-500 text-sm">Bundan sonra size yalnızca ilgilendiğiniz içerikleri göndereceğiz.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src="/2.svg" alt="Haritailesi" className="h-8 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">E-posta Tercihleriniz</h1>
          <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {/* İlgi Alanları */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Hangi içerikler ilginizi çekiyor?</h2>
            <p className="text-xs text-gray-400 mb-4">Yalnızca seçtiğiniz konularda bülten alırsınız.</p>
            <div className="grid grid-cols-1 gap-2">
              {INTEREST_AREAS.map(area => (
                <label key={area.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={interests.has(area.id)}
                    onChange={() => toggleInterest(area.id)}
                    className="w-4 h-4 accent-[#26496b] rounded"
                  />
                  <span className="text-sm text-gray-700">{area.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Bölge */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Bölgeniz</h2>
            <p className="text-xs text-gray-400 mb-3">Bölgesel etkinlik bildirimleri için kullanılır.</p>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#26496b]/20"
            >
              <option value="">— Seçiniz —</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Abonelik */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Abonelik</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={unsubscribed}
                onChange={e => setUnsubscribed(e.target.checked)}
                className="w-4 h-4 accent-red-500 rounded"
              />
              <span className="text-sm text-gray-700">Tüm bültenlerden çıkmak istiyorum</span>
            </label>
            {unsubscribed && (
              <p className="text-xs text-red-500 mt-2">Kaydet'e tıkladıktan sonra aboneliğiniz iptal edilecek.</p>
            )}
          </div>
        </div>

        {/* Kaydet */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={save}
            disabled={status === 'saving'}
            className="w-full bg-[#26496b] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#1d374f] disabled:opacity-50 transition-colors"
          >
            {status === 'saving' ? 'Kaydediliyor…' : 'Tercihleri Kaydet'}
          </button>
          <p className="text-center text-xs text-gray-400">
            Tüm aboneler yalnızca Haritailesi Vakfı&apos;ndan e-posta alır.
          </p>
        </div>
      </div>
    </div>
  );
}
