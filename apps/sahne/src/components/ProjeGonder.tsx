'use client';

import { useRef, useState } from 'react';

export function ProjeGonderButton({ label = 'Projeni Gönder', variant = 'outline' }: { label?: string; variant?: 'outline' | 'solid' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === 'solid'
            ? 'px-5 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors'
            : 'px-5 py-2.5 text-sm font-semibold text-white border-2 border-white/40 hover:border-white/70 hover:bg-white/5 rounded-xl transition-colors'
        }
      >
        {label}
      </button>

      {open && <ProjeGonderModal onClose={() => setOpen(false)} />}
    </>
  );
}

const MAX_FILES = 3;
const ACCEPT = 'image/*,video/mp4,video/quicktime,video/webm';

function ProjeGonderModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', title: '', linkedin: '', desc: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, MAX_FILES);
    setFiles(selected);
    setPreviews(selected.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : '')));
    e.target.value = '';
  }

  function removeFile(i: number) {
    setFiles((fs) => fs.filter((_, idx) => idx !== i));
    setPreviews((ps) => ps.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fileNote = files.length > 0
      ? `\n\nGörseller/Videolar (${files.length} dosya): Bu formu gönderdikten sonra dosyaları iletisim@haritailesi.org adresine ayrıca ekleyiniz.`
      : '';
    const subject = encodeURIComponent(`Proje Paylaşımı — ${form.title}`);
    const body = encodeURIComponent(
      `Ad Soyad: ${form.name}\n\nProje Başlığı: ${form.title}\n\nLinkedIn / Sahne Linki: ${form.linkedin || '—'}\n\nAçıklama:\n${form.desc}${fileNote}`
    );
    window.location.href = `mailto:iletisim@haritailesi.org?subject=${subject}&body=${body}`;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Proje Gönder</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Sahne veya Haritakademi&apos;de paylaştığın projeyi topluluğa duyur.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Ad Soyad</label>
            <input
              type="text" required value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Adınız ve soyadınız"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] dark:focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Proje Başlığı</label>
            <input
              type="text" required value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Projenin adı"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] dark:focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              LinkedIn veya Sahne Linki
              <span className="text-gray-400 font-normal ml-1">(isteğe bağlı)</span>
            </label>
            <input
              type="url" value={form.linkedin}
              onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/..."
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] dark:focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Açıklama</label>
            <textarea
              required rows={3} value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
              placeholder="Projen ne hakkında, hangi sorunu çözüyor?"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] dark:focus:border-blue-500 resize-none transition"
            />
          </div>

          {/* Görsel / Video yükleme */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Fotoğraf veya Kısa Video
              <span className="text-gray-400 font-normal ml-1">(en fazla {MAX_FILES} dosya)</span>
            </label>

            {/* Preview'lar */}
            {files.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {files.map((file, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 shrink-0">
                    {previews[i] ? (
                      <img src={previews[i]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:border-[#66aca9] hover:text-[#26496b] dark:hover:border-[#66aca9] dark:hover:text-[#66aca9] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Fotoğraf veya video ekle ({files.length}/{MAX_FILES})
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  multiple
                  className="hidden"
                  onChange={onFileChange}
                />
              </>
            )}

            {files.length > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 leading-snug">
                Görseller e-posta ile iletilemez. Formu gönderdikten sonra dosyaları{' '}
                <span className="font-semibold">iletisim@haritailesi.org</span> adresine ayrıca gönderin.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-snug">
              Editörler inceleyip sayfaya ekler.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                İptal
              </button>
              <button type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] rounded-xl transition-colors">
                Gönder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
