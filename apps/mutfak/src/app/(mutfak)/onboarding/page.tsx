'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { useTracker } from '@/lib/tracking';

const STEPS = ['Hedeflerim', 'Profilim', 'Uzmanlığım', 'Hazırım!'];

const GOAL_OPTIONS = [
  {
    value: 'goal:etkinlik',
    label: 'Etkinliklere Katıl',
    desc: 'Seminer, çalıştay ve buluşmalara git',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    value: 'goal:mentorluk',
    label: 'Mentor Bul / Ol',
    desc: 'Deneyim aktar veya rehberlik al',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'teal',
  },
  {
    value: 'goal:icerik',
    label: 'İçerik Üret & Paylaş',
    desc: 'Yazı, video veya analiz paylaş',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'amber',
  },
  {
    value: 'goal:proje',
    label: 'Proje Paylaş',
    desc: 'Çalışmanı topluluğa sun',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    color: 'green',
  },
  {
    value: 'goal:egitim',
    label: 'Araştır & Öğren',
    desc: 'Eğitim ve kaynakları keşfet',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'purple',
  },
  {
    value: 'goal:topluluk',
    label: 'Toplulukla Tanış',
    desc: 'Bağlan, sohbet et, büyü',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'rose',
  },
];

const EXPERTISE_OPTIONS = [
  { value: 'kadastro', label: 'Kadastro' },
  { value: 'fotogrametri', label: 'Fotogrametri' },
  { value: 'uzaktan_algilama', label: 'Uzaktan Algılama' },
  { value: 'cbs_gis', label: 'CBS / GIS' },
  { value: 'insaat_olcmesi', label: 'İnşaat Ölçmesi' },
  { value: 'gayrimenkul', label: 'Gayrimenkul' },
  { value: 'deniz_hidrografi', label: 'Deniz Hidrografi' },
  { value: 'yazilim_teknoloji', label: 'Yazılım & Teknoloji' },
  { value: 'kariyer_danismanligi', label: 'Kariyer Danışmanlığı' },
];

const GOAL_COLORS: Record<string, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400',
  teal: 'border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-400',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400',
  green: 'border-green-200 bg-green-50 text-green-700 hover:border-green-400',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-400',
  rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400',
};
const GOAL_COLORS_SELECTED: Record<string, string> = {
  blue: 'border-blue-500 bg-blue-500 text-white',
  teal: 'border-teal-500 bg-teal-500 text-white',
  amber: 'border-amber-500 bg-amber-500 text-white',
  green: 'border-green-500 bg-green-500 text-white',
  purple: 'border-purple-500 bg-purple-500 text-white',
  rose: 'border-rose-500 bg-rose-500 text-white',
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const token = useToken();
  const { T } = useTracker(token ?? '');
  const [step, setStep] = useState(0);

  // Step 0 — Goals
  const [goals, setGoals] = useState<string[]>([]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;
    T.onboarding.started();
  }, [token]); // eslint-disable-line

  // Step 1 — Profile
  const [displayName, setDisplayName] = useState(user?.profile?.displayName ?? '');
  const [city, setCity] = useState(user?.profile?.city ?? '');
  const [profession, setProfession] = useState(user?.profile?.profession ?? '');

  // Step 2 — Expertise
  const [expertise, setExpertise] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGoal(value: string) {
    setGoals((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  }

  function toggleExpertise(value: string) {
    setExpertise((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  }

  async function handleGoalSave() {
    if (goals.length === 0) {
      setError('En az bir hedef seçin.');
      return;
    }
    setError(null);
    // Save goals into localStorage so StartGuide can read them on Sahne too
    if (typeof window !== 'undefined') {
      localStorage.setItem('mutfak_goals', JSON.stringify(goals));
    }
    T.onboarding.completed('hedeflerim');
    setStep(1);
  }

  async function handleProfileSave() {
    if (!displayName.trim() || !profession.trim() || !city.trim()) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ displayName, city, profession });
      T.onboarding.completed('profilim');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExpertiseSave() {
    setSaving(true);
    try {
      const expertiseLabels = expertise.map(
        (v) => EXPERTISE_OPTIONS.find((o) => o.value === v)?.label ?? v,
      );
      // Merge goals (prefixed) + expertise labels into skillTags
      await updateProfile({ skillTags: [...goals, ...expertiseLabels] });
      T.onboarding.completed('uzmanligim');
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
      setStep(3);
    }
  }

  function finish() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mutfak_onboarding_done', '1');
    }
    T.onboarding.completed();
    router.replace('/baslangic');
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#26496b]/5 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-[#26496b]">harit</span><span className="text-[#66aca9]">a</span><span className="text-[#26496b]">ilesi</span>
          </span>
          <p className="text-sm text-gray-400 mt-1">Mutfak</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  i < step
                    ? 'bg-[#26496b] border-[#26496b] text-white'
                    : i === step
                      ? 'border-[#26496b] text-[#26496b] bg-white'
                      : 'border-gray-200 text-gray-300 bg-white'
                }`}>
                  {i < step
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    : i + 1
                  }
                </div>
                <span className={`text-[10px] text-center hidden sm:block ${i === step ? 'text-[#26496b] font-semibold' : i < step ? 'text-gray-400' : 'text-gray-300'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#26496b] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* ── Step 0: Goals ── */}
          {step === 0 && (
            <div className="p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Hoş geldin!</h1>
              <p className="text-sm text-gray-500 mb-6">
                Mutfak'ta ne yapmak istiyorsun? Birden fazla seçebilirsin — seni yönlendirelim.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {GOAL_OPTIONS.map((opt) => {
                  const selected = goals.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleGoal(opt.value)}
                      className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                        selected ? GOAL_COLORS_SELECTED[opt.color]! : `bg-white text-gray-700 border-gray-100 hover:border-gray-300 ${GOAL_COLORS[opt.color]!}`
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-2 right-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                          </svg>
                        </span>
                      )}
                      <span className={selected ? 'text-white' : ''}>{opt.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className={`text-xs mt-0.5 ${selected ? 'text-white/80' : 'text-gray-400'}`}>{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
              <button
                onClick={() => void handleGoalSave()}
                className="w-full bg-[#26496b] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors"
              >
                Devam Et →
              </button>
            </div>
          )}

          {/* ── Step 1: Profile ── */}
          {step === 1 && (
            <div className="p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Seni tanıyalım</h1>
              <p className="text-sm text-gray-500 mb-6">Topluluğun seni tanıması için birkaç bilgi paylaş.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
                    placeholder="Ada Yılmaz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meslek <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
                    placeholder="Harita Mühendisi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şehir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
                    placeholder="Ankara"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep(0)}
                    className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Geri
                  </button>
                  <button
                    onClick={() => void handleProfileSave()}
                    disabled={saving}
                    className="flex-1 bg-[#26496b] text-white font-semibold py-2.5 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Kaydediliyor...' : 'Devam Et →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Expertise ── */}
          {step === 2 && (
            <div className="p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Uzmanlığın ne?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Haritacılığın hangi alanlarında deneyimliysin? (isteğe bağlı)
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {EXPERTISE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleExpertise(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                      expertise.includes(opt.value)
                        ? 'bg-[#26496b] text-white border-[#26496b]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b]/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Geri
                </button>
                <button
                  onClick={() => void handleExpertiseSave()}
                  disabled={saving}
                  className="flex-1 bg-[#26496b] text-white font-semibold py-2.5 rounded-xl hover:bg-[#1e3a56] transition-colors disabled:opacity-60"
                >
                  {saving ? 'Kaydediliyor...' : expertise.length === 0 ? 'Atla →' : 'Devam Et →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Ready ── */}
          {step === 3 && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#26496b]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Harika, {user?.profile?.displayName ?? displayName}!
              </h1>
              <p className="text-gray-500 mb-2 leading-relaxed">
                Seçtiğin hedeflere göre seni yönlendirelim.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {goals.map((g) => {
                  const opt = GOAL_OPTIONS.find((o) => o.value === g);
                  return opt ? (
                    <span key={g} className={`px-3 py-1 rounded-full text-xs font-semibold bg-[#26496b]/10 text-[#26496b]`}>
                      {opt.label}
                    </span>
                  ) : null;
                })}
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Başlangıç sayfanda topluluğu tanıyan, seni yönlendiren ilk 3 adımını bulacaksın.
              </p>
              <button
                onClick={finish}
                className="w-full bg-[#26496b] text-white font-bold py-3 rounded-xl hover:bg-[#1e3a56] transition-colors text-base"
              >
                Başlangıç Sayfama Git →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          haritailesi vakfı · mutfak
        </p>
      </div>
    </div>
  );
}
