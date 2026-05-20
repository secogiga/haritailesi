'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

function ApplyModal({ competition, token, onClose }: { competition: Competition; token: string; onClose: () => void }) {
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, source: 'mutfak' }),
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

export default function MutfakYarismalarPage() {
  const { token } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Competition | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/competitions`)
      .then(r => r.json() as Promise<Competition[]>)
      .then(setCompetitions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {selected && token && <ApplyModal competition={selected} token={token} onClose={() => setSelected(null)} />}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Yarışmalar</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Haritailesi topluluğunun düzenlediği fotoğraf, proje ve makale yarışmaları.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 animate-pulse">
                <div className="h-40 bg-gray-100 dark:bg-slate-800 rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-slate-100 font-bold">Aktif yarışma yok</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Yeni yarışmalar için takipte kalın.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {competitions.map((comp) => (
              <article key={comp.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                {comp.posterUrl ? (
                  <img src={comp.posterUrl} alt={comp.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-[#26496b] to-[#1d3a57] flex items-center justify-center">
                    <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  {comp.category && (
                    <span className="text-xs font-semibold text-[#26496b] uppercase tracking-wide mb-1.5">{comp.category}</span>
                  )}
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1.5">{comp.title}</h3>
                  {comp.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1">{comp.description}</p>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-800 space-y-1.5">
                    {comp.deadline && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Son başvuru</span>
                        <DeadlineBadge deadline={comp.deadline} />
                      </div>
                    )}
                    {comp.prizes && (
                      <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>{comp.prizes}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-xs text-gray-400">{comp.applicationCount} başvuru</span>
                      <button
                        onClick={() => setSelected(comp)}
                        className="px-3 py-1 bg-[#26496b] text-white text-xs font-semibold rounded-lg hover:bg-[#1e3a56] transition-colors"
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
    </>
  );
}
