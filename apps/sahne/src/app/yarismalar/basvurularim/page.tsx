'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useSahneAuth } from '@/contexts/SahneAuthContext';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface MyApplication {
  applicationId: string;
  competitionId: string;
  title: string;
  slug: string | null;
  deadline: string | null;
  status: string;
  juryScore: number | null;
  appliedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'İncelemede', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700' },
  winner:   { label: 'Kazanan', color: 'bg-violet-100 text-violet-700' },
};

export default function BasvurularimPage() {
  const { user, isLoading: authLoading } = useSahneAuth();
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetch(`${API}/api/v1/competitions/me/applications`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<MyApplication[]> : [])
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <Link href="/sen-ne-dersin/yarismalar" className="hover:text-gray-600">Yarışmalar</Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-gray-600 font-medium">Başvurularım</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Başvurularım</h1>

          {!authLoading && !user && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-gray-500 mb-4">Başvurularını görmek için giriş yapman gerekiyor.</p>
              <Link href="/giris" className="inline-block px-6 py-3 bg-[#26496b] text-white rounded-xl text-sm font-semibold hover:bg-[#1e3a56] transition-colors">
                Giriş Yap
              </Link>
            </div>
          )}

          {user && loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {user && !loading && apps.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-gray-400 text-sm mb-4">Henüz yarışmaya başvurmamışsın.</p>
              <Link href="/sen-ne-dersin/yarismalar" className="inline-block px-6 py-3 bg-[#26496b] text-white rounded-xl text-sm font-semibold hover:bg-[#1e3a56] transition-colors">
                Yarışmalara Bak
              </Link>
            </div>
          )}

          {user && !loading && apps.length > 0 && (
            <div className="space-y-3">
              {apps.map(app => {
                const statusInfo = STATUS_LABELS[app.status] ?? { label: app.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={app.applicationId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/yarismalar/${app.slug ?? app.competitionId}`}
                          className="text-sm font-semibold text-gray-900 hover:text-[#26496b] transition-colors"
                        >
                          {app.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-400">
                            {new Date(app.appliedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          {app.deadline && (
                            <span className="text-xs text-gray-400">
                              Son: {new Date(app.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        {app.juryScore !== null && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 rounded-lg">
                            <span className="text-xs text-violet-600 font-medium">Jüri Puanı: <strong>{app.juryScore}/10</strong></span>
                          </div>
                        )}
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
