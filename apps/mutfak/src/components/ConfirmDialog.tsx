'use client';

import { useEffect } from 'react';

interface Props {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Evet',
  cancelLabel = 'İptal',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-[scale-in_0.15s_ease-out]"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-500 mb-5">{message}</p>}
        {!message && <div className="mb-5" />}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#26496b] hover:bg-[#1e3a56] text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
