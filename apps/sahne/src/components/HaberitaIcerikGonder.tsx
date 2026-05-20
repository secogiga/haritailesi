'use client';

import { useRef, useState } from 'react';

// ─── Editör / Köşe Yazarı başvuru ────────────────────────────────────────────

type BasvuruRole = 'editor' | 'columnist';

const ROLE_META: Record<BasvuruRole, { label: string; color: string; desc: string; placeholder: string }> = {
  editor: {
    label: 'Editör',
    color: 'blue',
    desc: 'İçerik planlaması, yazı yönetimi ve yayın sürecinde aktif rol alırsın.',
    placeholder: "Neden editör olmak istiyorsun? Haberita'ya nasıl katkı sağlamak istersin?",
  },
  columnist: {
    label: 'Köşe Yazarı',
    color: 'rose',
    desc: 'Sektörel analiz ve yorum yazıları yayınlarsın, kendi köşeni oluşturursun.',
    placeholder: 'Hangi konularda yazı yazmak istiyorsun? Okuyucuya ne katmak istersin?',
  },
};

export function HaberitaBasvuruButton({ role, label }: { role: BasvuruRole; label?: string }) {
  const [open, setOpen] = useState(false);
  const meta = ROLE_META[role];

  const cls =
    role === 'editor'
      ? 'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors'
      : 'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors';

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        {label ?? `${meta.label} Ol`}
      </button>
      {open && <BasvuruModal role={role} onClose={() => setOpen(false)} />}
    </>
  );
}

function BasvuruModal({ role, onClose }: { role: BasvuruRole; onClose: () => void }) {
  const meta = ROLE_META[role];
  const [form, setForm] = useState({ name: '', email: '', motivation: '', expertise: '', sample: '' });

  const isBlue = role === 'editor';
  const ring = isBlue ? 'focus:ring-blue-500/30 focus:border-blue-500' : 'focus:ring-rose-500/30 focus:border-rose-500';
  const btn  = isBlue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700';

  const inp = `w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 ${ring} transition`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`[${meta.label} Başvurusu] ${form.name}`);
    const body = encodeURIComponent(
      `Rol: ${meta.label}\nAd Soyad: ${form.name}\nE-posta: ${form.email}\n\nMotivasyon:\n${form.motivation}\n\nUzmanlık / Deneyim:\n${form.expertise}${form.sample ? `\n\nÖrnek Çalışma:\n${form.sample}` : ''}`,
    );
    window.location.href = `mailto:iletisim@haberita.com?subject=${subject}&body=${body}`;
    onClose();
  }

  const canSubmit = !!form.name && !!form.email && !!form.motivation && !!form.expertise;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{meta.label} Başvurusu</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{meta.desc}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Ad Soyad <span className="text-red-400">*</span>
              </label>
              <input type="text" required value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Adınız soyadınız" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                E-posta <span className="text-red-400">*</span>
              </label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="ornek@mail.com" className={inp} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Motivasyon <span className="text-red-400">*</span>
            </label>
            <textarea required rows={4} maxLength={1000} value={form.motivation}
              onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
              placeholder={meta.placeholder}
              className={`${inp} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Uzmanlık / Deneyim <span className="text-red-400">*</span>
            </label>
            <textarea required rows={3} maxLength={600} value={form.expertise}
              onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
              placeholder="Harita, kadastro, CBS, fotogrametri, ilgili alanlar…"
              className={`${inp} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Örnek çalışma <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <textarea rows={2} maxLength={600} value={form.sample}
              onChange={(e) => setForm((f) => ({ ...f, sample: e.target.value }))}
              placeholder="Link, alıntı veya kısa açıklama…"
              className={`${inp} resize-none`} />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
              Haberita ekibi inceleyip geri döner.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                İptal
              </button>
              <button type="submit" disabled={!canSubmit}
                className={`px-5 py-2 text-sm font-semibold text-white ${btn} rounded-xl transition-colors disabled:opacity-50`}>
                Gönder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const ICERIK_TYPES = [
  { value: 'etkinlik', label: 'Etkinlik' },
  { value: 'egitim', label: 'Eğitim' },
  { value: 'analiz', label: 'Analiz' },
  { value: 'proje', label: 'Proje' },
  { value: 'sirket_haberi', label: 'Şirket Haberi' },
] as const;

type IcerikType = (typeof ICERIK_TYPES)[number]['value'];

export function HaberitaIcerikGonderButton({
  label = 'İçerik Gönder',
  variant = 'amber',
}: {
  label?: string;
  variant?: 'outline' | 'solid' | 'amber' | 'link';
}) {
  const [open, setOpen] = useState(false);

  const cls =
    variant === 'solid'
      ? 'px-5 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors'
      : variant === 'amber'
      ? 'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors'
      : variant === 'link'
      ? 'text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline'
      : 'text-sm font-medium text-[#26496b] dark:text-blue-400 hover:underline';

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        {label}
      </button>
      {open && <IcerikModal onClose={() => setOpen(false)} />}
    </>
  );
}

const MAX_FILES = 3;
const ACCEPT = 'image/*';

function IcerikModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    type: '' as IcerikType | '',
    title: '',
    url: '',
    desc: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, MAX_FILES - files.length);
    const next = [...files, ...selected].slice(0, MAX_FILES);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  }

  function removeFile(i: number) {
    setFiles((fs) => fs.filter((_, idx) => idx !== i));
    setPreviews((ps) => ps.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const typeLabel = ICERIK_TYPES.find((t) => t.value === form.type)?.label ?? form.type;
    const fileNote = files.length > 0
      ? `\n\nGörseller (${files.length} dosya): Bu formu gönderdikten sonra görselleri iletisim@haberita.com adresine ayrıca ekleyiniz.`
      : '';
    const subject = encodeURIComponent(`[${typeLabel}] ${form.title}`);
    const body = encodeURIComponent(
      `İçerik Türü: ${typeLabel}\nAd Soyad: ${form.name}\nBaşlık: ${form.title}\nLink: ${form.url || '—'}\n\nAçıklama:\n${form.desc}${fileNote}`,
    );
    window.location.href = `mailto:iletisim@haberita.com?subject=${subject}&body=${body}`;
    onClose();
  }

  const inp =
    'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition';

  const canSubmit = !!form.type && !!form.name && !!form.title && !!form.desc;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
              Haberita&apos;ya İçerik Gönder
            </h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Etkinlik, eğitim, analiz, proje veya şirket haberini editoryal ekibe ilet.
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
              İçerik Türü <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ICERIK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                    form.type === t.value
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input type="text" required readOnly className="sr-only" tabIndex={-1} value={form.type} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Ad Soyad <span className="text-red-400">*</span>
            </label>
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
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Başlık <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="İçeriğin başlığı veya adı"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Link <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Açıklama <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={1500}
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
              placeholder="İçerik hakkında kısa bir açıklama…"
              className={`${inp} resize-none`}
            />
          </div>

          {/* Görsel ekleme */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Görseller
              <span className="text-gray-400 dark:text-slate-500 font-normal ml-1">(en fazla {MAX_FILES} fotoğraf)</span>
            </label>

            {files.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {files.map((file, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 shrink-0">
                    <img src={previews[i]} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5">
                      <p className="text-[9px] text-white truncate">{file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {files.length < MAX_FILES && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:border-amber-400 hover:text-amber-600 dark:hover:border-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Görsel ekle ({files.length}/{MAX_FILES})
                </button>
                <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={onFileChange} />
              </>
            )}

            {files.length > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 leading-snug">
                Görseller e-posta ile iletilemez. Formu gönderdikten sonra{' '}
                <span className="font-semibold">iletisim@haberita.com</span> adresine ayrıca gönderin.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
              Haberita editoryal ekibi inceleyip geri döner.
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
                disabled={!canSubmit}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50"
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
