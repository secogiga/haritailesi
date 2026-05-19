'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  posterUrl: string | null;
  deadline: string | null;
  prizes: string | null;
  category: string | null;
  status: string;
  applicationCount: string;
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return <span className="text-xs text-gray-400">Süre doldu</span>;
  if (daysLeft <= 7) return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{daysLeft} gün kaldı</span>;
  return (
    <span className="text-xs text-gray-500 dark:text-slate-400">
      {d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
    </span>
  );
}

function ApplyModal({ competition, onClose }: { competition: Competition; onClose: () => void }) {
  const [form, setForm] = useState({ displayName: '', email: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/competitions/${competition.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'sahne' }),
      });
      if (!res.ok) throw new Error((await res.json() as { message?: string }).message ?? 'Hata');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Yarışmaya Başvur</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{competition.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 dark:text-slate-100">Başvurunuz Alındı!</p>
            <p className="text-sm text-gray-500 mt-1">Ekibimiz sizinle iletişime geçecek.</p>
            <button onClick={onClose} className="mt-4 text-sm text-[#26496b] hover:underline font-medium">Kapat</button>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
              <input required className={inp} value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Adınız Soyadınız" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta *</label>
              <input required type="email" className={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ornek@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notunuz</label>
              <textarea rows={3} className={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Varsa eklemek istediğiniz bilgiler…" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={busy} className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60 text-sm">
              {busy ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function YarismalarPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Competition | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/competitions`)
      .then(r => r.json() as Promise<Competition[]>)
      .then(data => setCompetitions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      {selected && <ApplyModal competition={selected} onClose={() => setSelected(null)} />}

      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-teal)] mb-3">Sahne Modülleri</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Yarışmalar</h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl text-sm sm:text-base">
              Haritailesi topluluğunun düzenlediği fotoğraf, proje ve makale yarışmaları.
              Başvur, kazanan olabilirsin.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 animate-pulse">
                  <div className="h-48 bg-gray-100 dark:bg-slate-800 rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : competitions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-900 dark:text-slate-100 font-bold text-lg">Aktif yarışma yok</p>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Yeni yarışmalar için takipte kalın.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {competitions.map((comp) => (
                <article key={comp.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                  {/* Poster */}
                  {comp.posterUrl ? (
                    <img
                      src={comp.posterUrl}
                      alt={comp.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-[var(--color-mavi)] to-[#1d3a57] flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    {comp.category && (
                      <span className="text-xs font-semibold text-[var(--color-mavi)] uppercase tracking-wide mb-2">{comp.category}</span>
                    )}
                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">{comp.title}</h3>
                    {comp.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">{comp.description}</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800 space-y-2">
                      {comp.deadline && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 text-xs">Son başvuru</span>
                          <DeadlineBadge deadline={comp.deadline} />
                        </div>
                      )}
                      {comp.prizes && (
                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400">
                          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{comp.prizes}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-400">{comp.applicationCount} başvuru</span>
                        <button
                          onClick={() => setSelected(comp)}
                          className="px-4 py-1.5 bg-[var(--color-mavi)] text-white text-xs font-semibold rounded-lg hover:bg-[#1e3a56] transition-colors"
                        >
                          Başvur
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
