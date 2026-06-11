'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface PublicSurvey {
  surveyId: string;
  slug: string | null;
  title: string;
  type: string;
  score: number | null;
  maxScore: number | null;
  passingScore: number | null;
  percent: number | null;
  passed: boolean | null;
  completedAt: string;
}

interface PublicProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  profession: string | null;
  skillTags: string[];
  bio: string | null;
  surveys: PublicSurvey[];
}

export default function UyeProfilPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/api/v1/users/public/${id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json() as Promise<PublicProfile>;
      })
      .then(data => { if (data) setProfile(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Yükleniyor…</div>
        </main>
      </>
    );
  }

  if (notFound || !profile) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Üye bulunamadı.</p>
            <Link href="/" className="text-[#26496b] text-sm font-semibold hover:underline">Ana sayfaya dön</Link>
          </div>
        </main>
      </>
    );
  }

  const initials = profile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const tests = profile.surveys.filter(s => s.type === 'test');
  const anketler = profile.surveys.filter(s => s.type === 'anket');

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
          {/* Profile card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#26496b]/10 flex items-center justify-center shrink-0 overflow-hidden">
                {profile.avatarUrl
                  ? <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                  : <span className="text-[#26496b] text-xl font-bold">{initials}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900">{profile.displayName}</h1>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {profile.profession && (
                    <span className="text-sm text-gray-500">{profile.profession}</span>
                  )}
                  {profile.city && (
                    <span className="text-sm text-gray-400">{profile.city}</span>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">{profile.bio}</p>
                )}
                {profile.skillTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.skillTags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-[#26496b]">{profile.surveys.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Katılım</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{tests.filter(t => t.passed).length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Test Geçti</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-sky-600">{anketler.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Anket</div>
            </div>
          </div>

          {/* Completed tests */}
          {tests.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-900">Tamamlanan Testler</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {tests.map(t => (
                  <div key={t.surveyId} className="flex items-center gap-3 px-6 py-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      t.passed === true ? 'bg-green-100 text-green-700' :
                      t.passed === false ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t.percent !== null ? `${t.percent}%` : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/sen-ne-dersin/${t.slug ?? t.surveyId}`}
                        className="text-sm font-medium text-gray-800 hover:text-[#26496b] transition-colors truncate block"
                      >
                        {t.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(t.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {t.passed !== null && (
                      <span className={`text-xs font-semibold shrink-0 ${t.passed ? 'text-green-600' : 'text-red-500'}`}>
                        {t.passed ? 'GEÇTİ' : 'KALDI'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed surveys */}
          {anketler.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-900">Katıldığı Anketler</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {anketler.map(a => (
                  <div key={a.surveyId} className="flex items-center gap-3 px-6 py-4">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/sen-ne-dersin/${a.slug ?? a.surveyId}`}
                        className="text-sm font-medium text-gray-800 hover:text-[#26496b] transition-colors truncate block"
                      >
                        {a.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(a.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
