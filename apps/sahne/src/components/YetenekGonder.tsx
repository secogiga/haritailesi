'use client';

import { useState, useRef } from 'react';

const MAX_PHOTOS = 3;
const ACCEPT = 'image/*';

const CATEGORIES = [
  { value: 'enstruman_calmak', label: 'Enstrüman çalmak',  emoji: '🎸' },
  { value: 'sarki_soylemek',   label: 'Şarkı söylemek',    emoji: '🎤' },
  { value: 'resim_yapmak',     label: 'Resim yapmak',      emoji: '🎨' },
  { value: 'dijital_cizim',    label: 'Dijital çizim',     emoji: '💻' },
  { value: 'fotografcilik',    label: 'Fotoğrafçılık',     emoji: '📷' },
  { value: 'oyunculuk',        label: 'Oyunculuk',          emoji: '🎭' },
  { value: 'dans_etmek',       label: 'Dans etmek',         emoji: '💃' },
  { value: 'yazarlik',         label: 'Yazarlık',            emoji: '✍️' },
  { value: 'moda_tasarimi',    label: 'Moda tasarımı',      emoji: '👗' },
  { value: 'ahsap_iscilik',    label: 'Ahşap işçiliği',     emoji: '🪵' },
  { value: 'seramik_yapmak',   label: 'Seramik yapmak',     emoji: '🏺' },
];

const inp = 'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] dark:focus:border-blue-500 transition';

export function YetenekGonderButton({
  label = 'Yeteneğini Paylaş',
  variant = 'link',
}: {
  label?: string;
  variant?: 'link' | 'solid' | 'outline';
}) {
  const [open, setOpen] = useState(false);

  const cls =
    variant === 'solid'
      ? 'inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors'
      : variant === 'outline'
        ? 'inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#26496b] border-2 border-[#26496b]/30 hover:border-[#26496b] rounded-xl transition-colors'
        : 'text-sm font-medium text-[#26496b] dark:text-blue-400 hover:underline';

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        {label}
        {variant === 'link' && ' →'}
      </button>
      {open && <YetenekGonderModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function YetenekGonderModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    title: '',
    description: '',
    mediaUrl: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photos.length);
    const merged = [...photos, ...selected].slice(0, MAX_PHOTOS);
    setPhotos(merged);
    setPreviews(merged.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const catLabel = CATEGORIES.find((c) => c.value === form.category)?.label ?? form.category;
    const photoNote = photos.length > 0
      ? `\n\nFotoğraflar (${photos.length} dosya): Bu formu gönderdikten sonra fotoğrafları iletisim@haritailesi.org adresine ayrıca ekleyiniz.`
      : '';
    const subject = encodeURIComponent(`Yetenek Paylaşımı — ${form.name}`);
    const body = encodeURIComponent(
      [
        `Ad Soyad: ${form.name}`,
        `Yetenek Kategorisi: ${catLabel}`,
        `Başlık / Tanım: ${form.title}`,
        form.description ? `\nAçıklama:\n${form.description}` : '',
        form.mediaUrl ? `\nVideo / Örnek Çalışma: ${form.mediaUrl}` : '',
      ]
        .filter(Boolean)
        .join('\n') + photoNote,
    );
    window.location.href = `mailto:iletisim@haritailesi.org?subject=${subject}&body=${body}`;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Yeteneğini Paylaş</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Biz sadece teknik beceri sahibi değil, önce insanız. Yeteneğin topluluğu zenginleştirir.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Ad Soyad</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Adınız ve soyadınız"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Kategori</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    form.category === cat.value
                      ? 'border-[#26496b] bg-[#26496b]/5 text-[#26496b]'
                      : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-600'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
            {/* hidden required input for category */}
            <input type="text" required value={form.category} readOnly className="sr-only" tabIndex={-1} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Yeteneğini tanımla <span className="text-gray-400 font-normal">(kısa başlık)</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder='"Klasik Gitar", "Sokak Fotoğrafçılığı"…'
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Daha fazla anlat <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <textarea
              rows={3}
              maxLength={600}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Kaç yıldır, hangi tarzda, neyi seviyorsun…"
              className={`${inp} resize-none`}
            />
          </div>

          {/* Fotoğraf ekleme */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Fotoğraf ekle <span className="text-gray-400 font-normal">(en fazla {MAX_PHOTOS} adet, isteğe bağlı)</span>
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 shrink-0">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < MAX_PHOTOS && (
              <>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:border-[#66aca9] hover:text-[#26496b] dark:hover:border-[#66aca9] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Fotoğraf ekle ({photos.length}/{MAX_PHOTOS})
                </button>
                <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={onFileChange} />
              </>
            )}
            {photos.length > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 leading-snug">
                Fotoğraflar e-posta ile iletilemez. Formu gönderdikten sonra{' '}
                <span className="font-semibold">iletisim@haritailesi.org</span> adresine ayrıca gönderin.
              </p>
            )}
          </div>

          {/* Video / medya linki */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Video veya örnek çalışma linki <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <input
              type="url"
              value={form.mediaUrl}
              onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
              placeholder="YouTube, SoundCloud, Instagram, Behance…"
              className={inp}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Video için önce YouTube veya Instagram&apos;a yükle, sonra linkini buraya yapıştır.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
              Admin onayından sonra Sahne&apos;de yayınlanır.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!form.name || !form.category || !form.title}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors disabled:opacity-50"
              >
                Gönder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
