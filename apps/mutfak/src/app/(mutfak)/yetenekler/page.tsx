'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { mutfakApi } from '@/lib/api';

const TALENT_CATEGORIES = [
  { value: 'enstruman_calmak', label: 'Enstrüman çalmak',  emoji: '🎸' },
  { value: 'sarki_soylemek',   label: 'Şarkı söylemek',     emoji: '🎤' },
  { value: 'resim_yapmak',     label: 'Resim yapmak',       emoji: '🎨' },
  { value: 'dijital_cizim',    label: 'Dijital çizim',      emoji: '💻' },
  { value: 'fotografcilik',    label: 'Fotoğrafçılık',      emoji: '📷' },
  { value: 'oyunculuk',        label: 'Oyunculuk',           emoji: '🎭' },
  { value: 'dans_etmek',       label: 'Dans etmek',          emoji: '💃' },
  { value: 'yazarlik',         label: 'Yazarlık',             emoji: '✍️' },
  { value: 'moda_tasarimi',    label: 'Moda tasarımı',       emoji: '👗' },
  { value: 'ahsap_iscilik',    label: 'Ahşap işçiliği',      emoji: '🪵' },
  { value: 'seramik_yapmak',   label: 'Seramik yapmak',      emoji: '🏺' },
];

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400';

export default function YeteneklerPage() {
  const { user } = useAuth();
  const token = useToken();

  const [form, setForm] = useState({
    displayName: user?.profile?.displayName ?? '',
    category: '',
    title: '',
    description: '',
    mediaUrl: '',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const isCorporate = user?.membershipTier === 'corporate_member';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      await mutfakApi.submitTalent(token, {
        displayName: form.displayName,
        category: form.category,
        title: form.title,
        ...(form.description ? { description: form.description } : {}),
        ...(form.mediaUrl ? { mediaUrl: form.mediaUrl } : {}),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  if (isCorporate) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-xl">
          <h1 className="text-xl font-bold text-gray-900 font-display mb-4">Yeteneğimi Paylaş</h1>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">🏢</div>
            <p className="text-sm text-amber-800">
              Kurumsal üyeler şu an yetenek paylaşımı yapamıyor. Bu özellik bireysel ve öğrenci üyelerimiz içindir.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-xl">
          <h1 className="text-xl font-bold text-gray-900 font-display mb-6">Yeteneğimi Paylaş</h1>
          <div className="bg-green-50 rounded-2xl border border-green-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 mb-2">Yeteneğin paylaşıldı!</h2>
            <p className="text-sm text-gray-500">
              Gönderim ekibimizin onayına gönderildi. Onaylandıktan sonra Sahne'de görünecek.
            </p>
            <button
              onClick={() => {
                setDone(false);
                setForm({
                  displayName: user?.profile?.displayName ?? '',
                  category: '',
                  title: '',
                  description: '',
                  mediaUrl: '',
                });
              }}
              className="mt-5 text-sm font-medium text-[#26496b] hover:underline"
            >
              Yeni yetenek paylaş
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="max-w-xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 font-display">Yeteneğimi Paylaş</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mesleğinin ötesindeki yeteneklerini topluluğunla paylaş. Admin onayından sonra Sahne'de yayınlanır.
          </p>
        </div>

        {/* Category cards */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Hangi alanda bir yeteneğin var?</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TALENT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-medium transition-all border-2 ${
                  form.category === cat.value
                    ? 'border-[#26496b] bg-[#26496b]/5 text-[#26496b]'
                    : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        {form.category && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <span className="text-2xl">
                {TALENT_CATEGORIES.find((c) => c.value === form.category)?.emoji}
              </span>
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {TALENT_CATEGORIES.find((c) => c.value === form.category)?.label}
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: '' }))}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  değiştir
                </button>
              </div>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Adın *</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  className={inp}
                  placeholder="Sahne'de görünecek adın"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Yeteneğini tanımla * <span className="text-gray-400 font-normal">(kısa başlık)</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  className={inp}
                  placeholder='Örn: "Klasik Gitar", "Sokak Fotoğrafçılığı"'
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Daha fazla anlat <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <textarea
                  maxLength={800}
                  rows={3}
                  className={inp}
                  placeholder="Kaç yıldır, hangi tarzda, neyi seviyorsun…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                {form.description && (
                  <p className="text-xs text-gray-400 mt-1">{form.description.length}/800</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Örnek çalışma linki <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                </label>
                <input
                  type="url"
                  maxLength={400}
                  className={inp}
                  placeholder="YouTube, SoundCloud, Instagram, Behance…"
                  value={form.mediaUrl}
                  onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy || !form.displayName || !form.title}
                  className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
                >
                  {busy ? 'Gönderiliyor…' : 'Paylaş'}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Yeteneğin admin onayından sonra Sahne&apos;de yayınlanır.
                </p>
              </div>
            </form>
          </div>
        )}

        {!form.category && (
          <p className="text-sm text-gray-400 text-center py-4">
            Yukarıdan bir kategori seç ve devam et.
          </p>
        )}
      </div>
    </div>
  );
}
