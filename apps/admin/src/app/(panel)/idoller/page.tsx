'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

interface Idol {
  id: string;
  name: string;
  title: string;
  organization: string;
  mediaUrl: string;
  description: string;
}

const EMPTY_IDOL: Omit<Idol, 'id'> = {
  name: '',
  title: '',
  organization: '',
  mediaUrl: '',
  description: '',
};

const inp =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] placeholder-gray-400 transition';

function youtubeThumb(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#\s]+)/);
  const id = m?.[1];
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function IdolModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Idol | null;
  onSave: (idol: Idol) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Idol, 'id'>>(
    initial ? { name: initial.name, title: initial.title, organization: initial.organization, mediaUrl: initial.mediaUrl, description: initial.description }
    : EMPTY_IDOL
  );

  const thumb = youtubeThumb(form.mediaUrl);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      ...form,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">{initial ? 'İdol Düzenle' : 'Yeni İdol Ekle'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
              <input required type="text" className={inp} placeholder="Dr. Mete Ercan Pakdil"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Unvan *</label>
              <input required type="text" className={inp} placeholder="Dr. Harita Mühendisi"
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kurum / Yer</label>
            <input type="text" className={inp} placeholder="Mott MacDonald · İngiltere"
              value={form.organization} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">YouTube Linki *</label>
            <input required type="url" className={inp} placeholder="https://youtu.be/..."
              value={form.mediaUrl} onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))} />
            {thumb && (
              <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 aspect-video relative bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb} alt="Önizleme" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow">
                    <svg className="w-5 h-5 text-[#26496b] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Açıklama</label>
            <textarea rows={3} className={`${inp} resize-none`}
              placeholder="İdol hakkında kısa açıklama…"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
              İptal
            </button>
            <button type="submit" disabled={!form.name || !form.mediaUrl}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors disabled:opacity-50">
              {initial ? 'Kaydet' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IdollerPage() {
  const [idols, setIdols] = useState<Idol[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ idol: Idol | null } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    void (async () => {
      const data = await adminApi.getSetting('meslekte_yeni_idoller');
      if (data?.['idols']) {
        setIdols(data['idols'] as Idol[]);
      } else {
        // Seed ile başla
        setIdols([{
          id: '1',
          name: 'Dr. Mete Ercan Pakdil',
          title: 'Dr. Harita Mühendisi',
          organization: 'Mott MacDonald · İngiltere',
          mediaUrl: 'https://youtu.be/_c80uftW368?si=a75lZunVTTwxVo6D',
          description: 'İngiltere\'de Mott MacDonald\'da Coğrafi Bilgi Sistemleri üzerine çalışan Dr. Harita Mühendisi Mete Ercan Pakdil, "Meslekte Yeni İdoller"in ilk konuğu.',
        }]);
      }
      setLoading(false);
    })();
  }, []);

  async function save(list: Idol[]) {
    setSaving(true);
    try {
      await adminApi.upsertSetting('meslekte_yeni_idoller', { idols: list });
      showToast('Kaydedildi.');
    } catch {
      showToast('Kayıt başarısız.', false);
    } finally {
      setSaving(false);
    }
  }

  function handleSave(idol: Idol) {
    const exists = idols.find((i) => i.id === idol.id);
    const next = exists ? idols.map((i) => (i.id === idol.id ? idol : i)) : [...idols, idol];
    setIdols(next);
    void save(next);
  }

  function handleDelete(id: string) {
    if (!confirm('Bu idolü silmek istiyor musunuz?')) return;
    const next = idols.filter((i) => i.id !== id);
    setIdols(next);
    void save(next);
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...idols];
    [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
    setIdols(next);
    void save(next);
  }

  function moveDown(idx: number) {
    if (idx === idols.length - 1) return;
    const next = [...idols];
    [next[idx + 1], next[idx]] = [next[idx]!, next[idx + 1]!];
    setIdols(next);
    void save(next);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#26496b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meslekte Yeni İdoller</h1>
          <p className="text-sm text-gray-500 mt-1">Sahne ana sayfasındaki idol videolarını yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void save(idols)}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <button
            onClick={() => setModal({ idol: null })}
            className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni İdol Ekle
          </button>
        </div>
      </div>

      {idols.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Henüz idol eklenmemiş.</div>
      ) : (
        <div className="space-y-3">
          {idols.map((idol, idx) => {
            const thumb = youtubeThumb(idol.mediaUrl);
            return (
              <div key={idol.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 px-4 py-3">
                {/* Thumbnail */}
                <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {thumb
                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{idol.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{idol.title}{idol.organization ? ` · ${idol.organization}` : ''}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0}
                    className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors rounded-lg hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === idols.length - 1}
                    className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors rounded-lg hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button onClick={() => setModal({ idol })}
                    className="px-3 py-1.5 text-xs font-medium text-[#26496b] hover:bg-[#26496b]/5 rounded-lg transition-colors">
                    Düzenle
                  </button>
                  <button onClick={() => handleDelete(idol.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Değişiklikler kaydedilince Sahne sitesi ~5 dakika içinde güncellenir.
      </p>

      {modal && (
        <IdolModal
          initial={modal.idol}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
