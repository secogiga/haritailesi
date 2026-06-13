'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { ProfileUpdateSchema } from '@/lib/schemas';
import { TIER_LABELS } from '@/lib/constants';
import { Avatar } from '@/components/Avatar';
import { BadgeRow } from '@/components/BadgeRow';
import { BookmarksTab } from './_components/BookmarksTab';
import { ProfileEditForm } from './_components/ProfileEditForm';
import { MembershipWidget } from '@/components/MembershipWidget';
import { EgitimlerTab } from './_components/EgitimlerTab';
import { KutuphaneTab } from './_components/KutuphaneTab';

type FormState = {
  displayName: string;
  city: string;
  profession: string;
  bio: string;
  linkedinUrl: string;
  websiteUrl: string;
  portfolioUrl: string;
  skillTagsInput: string;
};

export default function HesabimPage() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const token = useToken();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profil' | 'uyelik' | 'kaydedilenler' | 'egitimler' | 'kutuphane'>('profil');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    displayName: '',
    city: '',
    profession: '',
    bio: '',
    linkedinUrl: '',
    websiteUrl: '',
    portfolioUrl: '',
    skillTagsInput: '',
  });
  const [skillTags, setSkillTags] = useState<string[]>([]);

  useEffect(() => {
    if (user?.profile) {
      setForm({
        displayName: user.profile.displayName ?? '',
        city: user.profile.city ?? '',
        profession: user.profile.profession ?? '',
        bio: user.profile.bio ?? '',
        linkedinUrl: user.profile.linkedinUrl ?? '',
        websiteUrl: user.profile.websiteUrl ?? '',
        portfolioUrl: user.profile.portfolioUrl ?? '',
        skillTagsInput: '',
      });
      setSkillTags(user.profile.skillTags ?? []);
    }
  }, [user]);

  if (!user) return null;

  const profileFields = [
    user.profile?.displayName,
    user.profile?.city,
    user.profile?.profession,
    user.profile?.bio,
    user.profile?.avatarUrl,
    user.profile?.linkedinUrl,
  ];
  const filledCount = profileFields.filter(Boolean).length;
  const completionPct = Math.round((filledCount / profileFields.length) * 100);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { skillTagsInput: _, ...formRest } = form;
    const rawPayload = {
      ...Object.fromEntries(Object.entries(formRest).filter(([, v]) => v !== '')),
      skillTags,
    };

    const validation = ProfileUpdateSchema.safeParse(rawPayload);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      setError(firstError ? firstError.message : 'Geçersiz form verisi.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(validation.data as Parameters<typeof updateProfile>[0]);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Yükleme başarısız.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const displayName = user.profile?.displayName ?? user.email;
  const avatarUrl = user.profile?.avatarUrl ?? null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 font-display">Profilim</h1>
        {activeTab === 'profil' && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-sm font-medium text-[#26496b] border border-[#26496b] rounded-lg hover:bg-[#26496b]/5 transition-colors"
          >
            Düzenle
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {([
          { key: 'profil', label: 'Profilim' },
          { key: 'egitimler', label: 'Eğitimler' },
          { key: 'uyelik', label: 'Üyelik' },
          { key: 'kaydedilenler', label: 'Kaydedilenler' },
          { key: 'kutuphane', label: 'Kütüphanem' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[#26496b] text-[#26496b]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'kaydedilenler' && <BookmarksTab token={token} />}
      {activeTab === 'uyelik' && <MembershipWidget />}
      {activeTab === 'egitimler' && <EgitimlerTab token={token} />}
      {activeTab === 'kutuphane' && <KutuphaneTab token={token} />}

      {activeTab === 'profil' && (
        <>
          {completionPct < 100 && !editing && (
            <div className="mb-4 bg-[#26496b]/5 border border-[#26496b]/15 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#26496b]">Profiliniz {completionPct}% tamamlandı</p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-medium text-[#26496b] hover:underline"
                >
                  Tamamla →
                </button>
              </div>
              <div className="h-1.5 bg-[#26496b]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#66aca9] rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {[
                  !user.profile?.displayName && 'Ad Soyad',
                  !user.profile?.profession && 'Meslek',
                  !user.profile?.city && 'Şehir',
                  !user.profile?.bio && 'Hakkımda',
                  !user.profile?.avatarUrl && 'Fotoğraf',
                  !user.profile?.linkedinUrl && 'LinkedIn',
                ].filter(Boolean).join(', ')} eksik.
              </p>
            </div>
          )}

          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Profil güncellendi.
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* Profil kartı */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
            {/* Cover */}
            <div className="h-24 bg-gradient-to-br from-[#26496b] via-[#1e3a56] to-[#66aca9] relative">
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="cover-topo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                    <ellipse cx="40" cy="40" rx="36" ry="28" fill="none" stroke="white" strokeWidth="1" />
                    <ellipse cx="40" cy="40" rx="24" ry="18" fill="none" stroke="white" strokeWidth="1" />
                    <ellipse cx="40" cy="40" rx="12" ry="8" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cover-topo)" />
              </svg>
            </div>

            <div className="px-6 pb-6">
              {/* Avatar overlap */}
              <div className="flex items-end justify-between -mt-9 mb-4">
                <div className="relative group">
                  <div className="ring-4 ring-white rounded-full">
                    <Avatar name={displayName} src={avatarUrl} size={72} />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-wait"
                    title="Fotoğraf değiştir"
                  >
                    {avatarUploading ? (
                      <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => void handleAvatarChange(e)}
                  />
                </div>
                <span className="inline-flex items-center mb-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#26496b]/10 text-[#26496b]">
                  {TIER_LABELS[user.membershipTier] ?? user.membershipTier}
                </span>
              </div>

              {avatarError && <p className="text-xs text-red-600 mb-3">{avatarError}</p>}
              {avatarUploading && <p className="text-xs text-gray-400 mb-3">Fotoğraf yükleniyor…</p>}

              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 font-display">{displayName}</h2>
                {user.profile?.profession && (
                  <p className="text-sm text-gray-500 mt-0.5">{user.profile.profession}</p>
                )}
                {user.profile?.city && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {user.profile.city}
                  </p>
                )}
                {user.badges && user.badges.length > 0 && (
                  <div className="mt-2">
                    <BadgeRow badges={user.badges} size="sm" />
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="text-center flex-1">
                  <div className="text-lg font-bold text-[#26496b]">{completionPct}%</div>
                  <div className="text-xs text-gray-400">Profil</div>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="text-center flex-1">
                  <div className="text-lg font-bold text-[#26496b]">
                    {new Date(user.createdAt).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-400">Üye</div>
                </div>
              </div>

              {editing ? (
                <ProfileEditForm
                  form={form}
                  setForm={setForm}
                  skillTags={skillTags}
                  setSkillTags={setSkillTags}
                  saving={saving}
                  onSubmit={(e) => void handleSave(e)}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  {user.profile?.bio && (
                    <p className="text-sm text-gray-700 leading-relaxed">{user.profile.bio}</p>
                  )}
                  {(user.profile?.linkedinUrl || user.profile?.websiteUrl) && (
                    <div className="flex gap-2 pt-1">
                      {user.profile?.linkedinUrl && (
                        <a
                          href={user.profile.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </a>
                      )}
                      {user.profile?.websiteUrl && (
                        <a
                          href={user.profile.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Web Sitesi
                        </a>
                      )}
                    </div>
                  )}
                  {user.profile?.portfolioUrl && (
                    <div className="pt-1">
                      <a
                        href={user.profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#66aca9]/10 text-[#26496b] text-xs font-medium rounded-lg hover:bg-[#66aca9]/20 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Portfolio / CV
                      </a>
                    </div>
                  )}
                  {(user.profile?.skillTags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {user.profile!.skillTags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-[#26496b]/8 text-[#26496b] text-xs rounded-full border border-[#26496b]/15">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {!user.profile?.city && !user.profile?.profession && !user.profile?.bio && (
                    <p className="text-sm text-gray-400">Henüz profil bilgisi eklenmemiş. Düzenle butonuna tıklayın.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hesap bilgisi */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Hesap</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="text-gray-500 w-32 shrink-0">Üyelik</dt>
                <dd className="text-gray-800">{TIER_LABELS[user.membershipTier] ?? user.membershipTier}</dd>
              </div>
              {user.functionalRoles.length > 0 && (
                <div className="flex gap-3">
                  <dt className="text-gray-500 w-32 shrink-0">Roller</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {user.functionalRoles.map((r) => (
                      <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-[#26496b]/10 text-[#26496b] font-medium">
                        {r}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </>
      )}
    </div>
  );
}
