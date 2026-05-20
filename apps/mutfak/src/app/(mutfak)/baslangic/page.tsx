'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { useTracker } from '@/lib/tracking';
import { TIER_LABELS } from '@/lib/constants';

const GOAL_LABELS: Record<string, string> = {
  'goal:etkinlik': 'Etkinliklere Katıl',
  'goal:mentorluk': 'Mentor Bul / Ol',
  'goal:icerik': 'İçerik Üret & Paylaş',
  'goal:proje': 'Proje Paylaş',
  'goal:egitim': 'Araştır & Öğren',
  'goal:topluluk': 'Toplulukla Tanış',
};

const GOAL_LINKS: Record<string, string> = {
  'goal:etkinlik': '/etkinlikler',
  'goal:mentorluk': '/mentorluk',
  'goal:icerik': '/akis',
  'goal:proje': '/akis',
  'goal:egitim': '/akis',
  'goal:topluluk': '/uyeler',
};

const COMMUNITY_VALUES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: 'Üret & Paylaş',
    desc: 'Her deneyim, her proje, her fikir topluluğu büyütür. Bilgini paylaşmak burada norm.',
    color: 'from-blue-50 to-white border-blue-100',
    iconColor: 'text-blue-500 bg-blue-50',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Öğret & Öğren',
    desc: 'Yeni mezun da uzman da öğrenir. Sektörün usta-çırak döngüsünü birlikte kuruyoruz.',
    color: 'from-teal-50 to-white border-teal-100',
    iconColor: 'text-teal-500 bg-teal-50',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Bağlan & Büyü',
    desc: 'Mentor, meslektaş, dost. Haritailesi\'nde kurulan bağlar kariyeri şekillendirir.',
    color: 'from-amber-50 to-white border-amber-100',
    iconColor: 'text-amber-500 bg-amber-50',
  },
];

const FIRST_STEPS = [
  {
    id: 'profile',
    key: 'mutfak_step_profile',
    title: 'Profilini Tamamla',
    desc: 'Bio, avatar ve sosyal linklerini ekle — topluluk seni tanısın.',
    href: '/hesabim',
    cta: 'Profile Git →',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'post',
    key: 'mutfak_step_post',
    title: 'Kendini Tanıt',
    desc: 'Akışa ilk gönderini paylaş — kim olduğunu ve ne yaptığını anlat.',
    href: '/akis',
    cta: 'Akışa Git →',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: 'connect',
    key: 'mutfak_step_connect',
    title: 'Bir Etkinliğe Katıl veya Mentor Bul',
    desc: 'Sahne\'deki etkinliklere göz at ya da bir mentorla bağlan.',
    href: '/mentorluk',
    cta: 'Keşfet →',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function BaslangicPage() {
  const router = useRouter();
  const { user } = useAuth();
  const token = useToken();
  const { T } = useTracker(token ?? '');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = new Set<string>();
    FIRST_STEPS.forEach((s) => {
      if (localStorage.getItem(s.key) === '1') done.add(s.id);
    });
    setCompletedSteps(done);

    try {
      const raw = localStorage.getItem('mutfak_goals');
      if (raw) setGoals(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
  }, []);

  // 7/30-day return detection
  useEffect(() => {
    if (!token || !user?.lastLoginAt) return;
    const lastLogin = new Date(user.lastLoginAt);
    const daysSince = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 30) T.retention.returned(30);
    else if (daysSince >= 7) T.retention.returned(7);
  }, [token, user?.lastLoginAt]); // eslint-disable-line

  function markStep(id: string, key: string) {
    const alreadyDone = typeof window !== 'undefined' && localStorage.getItem(key) === '1';
    if (typeof window !== 'undefined') localStorage.setItem(key, '1');
    setCompletedSteps((prev) => new Set([...prev, id]));
    if (!alreadyDone) {
      if (id === 'profile')  T.onboarding.completed('profilim');
      if (id === 'post')     T.content.created();
      if (id === 'connect')  T.events.joined();
    }
  }

  function dismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mutfak_baslangic_seen', '1');
    }
    router.replace('/akis');
  }

  const allDone = FIRST_STEPS.every((s) => completedSteps.has(s.id));
  const doneCount = FIRST_STEPS.filter((s) => completedSteps.has(s.id)).length;
  const firstName = user?.profile?.displayName?.split(' ')[0] ?? 'Merhaba';
  const tierLabel = user?.membershipTier ? (TIER_LABELS[user.membershipTier] ?? '') : '';

  // User's goal-based recommendations
  const goalRecs = goals
    .map((g) => ({ label: GOAL_LABELS[g], href: GOAL_LINKS[g] }))
    .filter((r) => r.label && r.href) as { label: string; href: string }[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        {/* ── Welcome Header ── */}
        <div className="bg-gradient-to-br from-[#26496b] to-[#1a3350] rounded-2xl p-8 mb-6 text-white relative overflow-hidden">
          {/* decorative */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#66aca9]/20 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                {firstName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white/60 text-sm">Hoş geldin!</p>
                <h1 className="text-2xl font-bold">{firstName} 👋</h1>
              </div>
              {tierLabel && (
                <span className="ml-auto bg-white/20 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                  {tierLabel}
                </span>
              )}
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Haritailesi Mutfak'a hoş geldin. Burada üretir, paylaşır, büyürsün.
              Seni yönlendirmek için buradayız.
            </p>

            {/* Goal tags */}
            {goalRecs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-white/50 text-xs self-center">Hedeflerin:</span>
                {goalRecs.map((r) => (
                  <a
                    key={r.href}
                    href={r.href}
                    onClick={() => localStorage.setItem('mutfak_baslangic_seen', '1')}
                    className="bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20"
                  >
                    {r.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Community Values ── */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">Neden Mutfak?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COMMUNITY_VALUES.map((v) => (
              <div
                key={v.title}
                className={`rounded-xl border bg-gradient-to-b ${v.color} p-4`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${v.iconColor}`}>
                  {v.icon}
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">{v.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── First 3 Steps ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h2 className="text-base font-bold text-gray-900">İlk 3 Adımın</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tamamladıklarını işaretle</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-[#26496b]">{doneCount} / {FIRST_STEPS.length}</div>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#26496b] rounded-full transition-all duration-500"
                  style={{ width: `${(doneCount / FIRST_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {FIRST_STEPS.map((s, idx) => {
              const done = completedSteps.has(s.id);
              return (
                <div
                  key={s.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${done ? 'bg-emerald-50/50' : 'hover:bg-gray-50/50'}`}
                >
                  {/* Step number / check */}
                  <button
                    onClick={() => markStep(s.id, s.key)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 text-gray-400 hover:border-[#26496b] hover:text-[#26496b]'
                    }`}
                    title={done ? 'Tamamlandı' : 'Tamamlandı olarak işaretle'}
                  >
                    {done
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      : <span className="text-xs font-bold">{idx + 1}</span>
                    }
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {s.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                      {!done && (
                        <a
                          href={s.href}
                          onClick={() => markStep(s.id, s.key)}
                          className="shrink-0 text-xs font-semibold text-[#26496b] hover:text-[#1e3a56] transition-colors whitespace-nowrap"
                        >
                          {s.cta}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {allDone && (
            <div className="px-5 py-4 bg-emerald-50 border-t border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700">Başlangıç rozetin hazır!</p>
                  <p className="text-xs text-emerald-600">İlk 3 adımını tamamladın. Mutfak seni bekliyor.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={dismiss}
            className="flex-1 bg-[#26496b] text-white font-bold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors text-sm"
          >
            Akışa Git →
          </button>
          <button
            onClick={dismiss}
            className="sm:w-auto px-5 py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sayfayı Kapat
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Bu sayfayı tekrar görmek istersen Hesabım menüsünden erişebilirsin.
        </p>
      </div>
    </div>
  );
}
