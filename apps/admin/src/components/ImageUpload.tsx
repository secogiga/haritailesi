'use client';

import { useRef, useState } from 'react';
import { adminApi } from '@/lib/api';

interface Props {
  value?: string | null;
  onChange: (key: string, previewUrl: string) => void;
  label?: string;
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif';

export function ImageUpload({ value, onChange, label = 'Kapak Görseli' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const { key, url } = await adminApi.uploadFile(file);
      setPreview(url);
      onChange(key, url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  const displayUrl = preview ?? value;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {displayUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-40">
          <img src={displayUrl} alt="Kapak görseli" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-sm font-medium text-gray-800 rounded-lg hover:bg-gray-100"
            >
              Değiştir
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--color-mavi)] hover:bg-gray-50 transition-colors"
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Yükleniyor…
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-400">
                Sürükle bırak veya <span className="text-[var(--color-mavi)] font-medium">seç</span>
              </p>
              <p className="text-xs text-gray-300">JPG, PNG, WebP · Maks 10 MB</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
