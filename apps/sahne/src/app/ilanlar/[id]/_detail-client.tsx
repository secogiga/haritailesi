'use client';

import { useState } from 'react';
import type { JobListing } from '@/lib/api';
import { ContactModal } from '../_contact-modal';
import { ShareMenu } from '@/components/ShareMenu';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export function DetailClient({ listing, catAccent }: { listing: JobListing; catAccent: string }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setReportStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/marketplace/content-requests/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Anonim',
          email: reportEmail,
          source: 'sahne',
          type: 'sponsorluk', // closest available; admin sees it as a report
          title: `[RAPOR] İlan ID: ${listing.id}`,
          description: `Raporlanan ilan: "${listing.title}"\n\nSebep: ${reportMsg}`,
        }),
      });
      setReportStatus(res.ok ? 'done' : 'error');
    } catch { setReportStatus('error'); }
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">İletişim</h2>

        {listing.applyEmail && (
          <button
            onClick={() => setContactOpen(true)}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: catAccent }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            İletişime Geç
          </button>
        )}

        {!listing.applyEmail && listing.applyUrl && (
          <a
            href={listing.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: catAccent }}
          >
            İletişim
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {listing.contactPhone && (
          <a
            href={`tel:${listing.contactPhone}`}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {listing.contactPhone}
          </a>
        )}

        {/* Paylaş */}
        <div className="pt-1">
          <ShareMenu title={listing.title} />
        </div>
      </div>

      {/* Rapor et */}
      <div className="text-center pt-1">
        <button
          onClick={() => setReportOpen(!reportOpen)}
          className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Bu ilanı raporla
        </button>
      </div>

      {reportOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
          {reportStatus === 'done' ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center py-2">
              Raporunuz alındı, teşekkürler.
            </p>
          ) : (
            <form onSubmit={submitReport} className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">İlanı Raporla</p>
              <input
                type="email" required value={reportEmail} onChange={e => setReportEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
              <textarea
                required rows={2} value={reportMsg} onChange={e => setReportMsg(e.target.value)}
                placeholder="Raporlama sebebini kısaca açıklayın…"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
              />
              {reportStatus === 'error' && <p className="text-xs text-red-500">Hata oluştu.</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setReportOpen(false)} className="flex-1 text-xs py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={reportStatus === 'loading'} className="flex-1 text-xs py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                  {reportStatus === 'loading' ? 'Gönderiliyor…' : 'Gönder'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {contactOpen && (
        <ContactModal listing={listing} onClose={() => setContactOpen(false)} />
      )}
    </>
  );
}
