'use client';

import { useEffect, useRef, useState } from 'react';
import { FocusTrap } from '@/components/FocusTrap';

interface Props {
  onClose: () => void;
}

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Haritailesi Mutfak nedir?',
    a: 'Haritailesi Mutfak, harita ve geomatik sektörü profesyonellerinin bir araya geldiği özel topluluk platformudur. Bilgi paylaşımı, mentorluk ve mesleki gelişim için tasarlanmıştır.',
  },
  {
    q: 'Üyelik tipleri nasıl çalışır?',
    a: 'Haritailesi Genç, Mesleğin Değer Ortağı ve Kurumsal Üye olmak üzere üç üyelik tipi bulunur. Her tip farklı erişim haklarına sahiptir.',
  },
  {
    q: 'Mentorluk nasıl talep edilir?',
    a: '"Mentorluk" menüsünden uygun bir mentor seçin. Konu, hedef ve format bilgilerini girerek talepte bulunun. Mentor onayladıktan sonra seans oluşturulur.',
  },
  {
    q: 'Gönderimi neden paylaşamıyorum?',
    a: 'Bazı içerik tipleri ve kategoriler belirli üyelik tiplerine özeldir. Erişim sorunu yaşıyorsanız yönetici ile iletişime geçin.',
  },
  {
    q: 'Destek almak için ne yapmalıyım?',
    a: 'destek@haritailesi.org adresine e-posta gönderin veya platform içi bildirim sistemi aracılığıyla ulaşın.',
  },
];

export function HelpModal({ onClose }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <FocusTrap onClose={onClose}>
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 id="help-title" className="text-base font-semibold text-gray-900">Yardım & SSS</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Kapat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
            {FAQ.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Daha fazla yardım için:{' '}
              <a href="mailto:destek@haritailesi.org" className="text-[#26496b] font-medium hover:underline">
                destek@haritailesi.org
              </a>
            </p>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
