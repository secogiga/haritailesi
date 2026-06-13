'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { mutfakApi, POST_TYPE_LABELS, type MemberProfile, type FeedPost } from '@/lib/api';
import { useToken } from '@/hooks/useToken';
import { Avatar } from '@/components/Avatar';
import { BadgeRow } from '@/components/BadgeRow';
import { useAuth } from '@/contexts/AuthContext';

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}g`;
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isActive(lastLoginAt: string | null) {
  if (!lastLoginAt) return false;
  return Date.now() - new Date(lastLoginAt).getTime() < 3 * 24 * 60 * 60 * 1000;
}

const TIER_LABELS_LOCAL: Record<string, string> = {
  registered_user: 'Sahne Üyesi',
  haritailesi_genc: 'Haritailesi Genç',
  new_graduate_member: 'Mesleğin Geleceği',
  individual_member: 'Mesleğin Değer Ortağı',
  corporate_member: 'Kurumsal Üye',
};

export default function MemberProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const token = useToken();
  const { user: me } = useAuth();

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
  type XpInfo = { xp: number; pct: number; current: { label: string; emoji: string }; next: { label: string; emoji: string; minXp: number } | null; lessonXp?: number; quizXp?: number };
  type EnrollInfo = { trainingId: string; slug: string; title: string; level: string | null; progressPct: number; completedAt: string | null };
  const [xpInfo, setXpInfo] = useState<XpInfo | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollInfo[]>([]);
  const isMe = me?.id === userId;

  useEffect(() => {
    if (!token || !userId) return;
    Promise.all([
      mutfakApi.getMember(userId, token),
      mutfakApi.listPosts(token, { authorId: userId, limit: '12' } as never),
    ])
      .then(([m, feed]) => {
        setMember(m);
        setPosts(feed.data);
        setFollowing(m.isFollowing ?? false);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Profil yüklenemedi.'))
      .finally(() => setLoading(false));

    // XP ve kurs verileri
    const h = { Authorization: `Bearer ${token}` };
    if (isMe) {
      // Kendi profili: tam veri
      fetch(`${API_URL}/api/v1/cms/my-xp`, { headers: h })
        .then(r => r.ok ? r.json() : null).then(d => setXpInfo(d as XpInfo)).catch(() => {});
      fetch(`${API_URL}/api/v1/cms/trainings/enrollments/mine`, { headers: h })
        .then(r => r.ok ? r.json() : []).then(d => setEnrollments((d as EnrollInfo[]).slice(0, 6))).catch(() => {});
    } else {
      // Başkasının profili: public stats (XP + rank + sayılar)
      fetch(`${API_URL}/api/v1/cms/learner-stats/${userId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d) return;
          const stats = d as { xp: number; rank: { label: string; emoji: string; minXp: number }; nextRank: { label: string; emoji: string; minXp: number } | null; pct: number };
          setXpInfo({ xp: stats.xp, pct: stats.pct, current: stats.rank, next: stats.nextRank, lessonXp: 0, quizXp: 0 } as XpInfo);
        }).catch(() => {});
    }
  }, [userId, token, isMe, API_URL]);

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/uyeler');
  }

  async function handleFollow() {
    if (!token || !userId || followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await mutfakApi.unfollowUser(userId, token);
        setFollowing(false);
      } else {
        await mutfakApi.followUser(userId, token);
        setFollowing(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl mb-6" />
        <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error ?? 'Üye bulunamadı.'}
        </div>
      </div>
    );
  }

  const active = isActive(member.lastLoginAt);
  const tierLabel = TIER_LABELS_LOCAL[member.membershipTier] ?? member.membershipTier;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Geri
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-br from-[#26496b] via-[#1e3a56] to-[#66aca9] relative">
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <pattern id="mp-topo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <ellipse cx="40" cy="40" rx="36" ry="26" fill="none" stroke="white" strokeWidth="1" />
                <ellipse cx="40" cy="40" rx="24" ry="16" fill="none" stroke="white" strokeWidth="1" />
                <ellipse cx="40" cy="40" rx="12" ry="8" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mp-topo)" />
          </svg>
        </div>

        <div className="px-5 pb-5">
          {/* Avatar overlap */}
          <div className="flex items-end justify-between -mt-9 mb-3">
            <div className="relative ring-4 ring-white rounded-full inline-block">
              <Avatar name={member.displayName} src={member.avatarUrl} size={72} />
              {active && (
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" title="Son 3 günde aktif" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#26496b]/10 text-[#26496b]">
                {tierLabel}
              </span>
              {isMe ? (
                <Link
                  href="/hesabim"
                  className="text-xs font-medium text-[#26496b] border border-[#26496b]/30 px-2.5 py-0.5 rounded-full hover:bg-[#26496b]/5 transition-colors"
                >
                  Düzenle
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => void handleFollow()}
                    disabled={followLoading}
                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-60 ${
                      following
                        ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                        : 'bg-[#26496b] text-white hover:bg-[#1e3a56]'
                    }`}
                  >
                    {followLoading ? '...' : following ? 'Takip Ediliyor' : 'Takip Et'}
                  </button>
                  <Link
                    href={`/mesajlar?with=${member.id}`}
                    className="text-xs font-medium text-gray-600 border border-gray-300 px-2.5 py-0.5 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    Mesaj
                  </Link>
                </>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 font-display">{member.displayName}</h1>
          {member.profession && <p className="text-sm text-gray-500 mt-0.5">{member.profession}</p>}
          {member.corporateName && (
            <p className="text-xs font-medium text-[#26496b] mt-0.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {member.corporateRole ? `${member.corporateName} — ${member.corporateRole}` : member.corporateName}
            </p>
          )}
          {(member.followerCount !== undefined || member.followingCount !== undefined) && (
            <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
              <span><strong className="text-gray-800">{member.followerCount ?? 0}</strong> takipçi</span>
              <span><strong className="text-gray-800">{member.followingCount ?? 0}</strong> takip</span>
            </div>
          )}
          {member.badges && member.badges.length > 0 && (
            <div className="mt-2">
              <BadgeRow badges={member.badges} size="sm" />
            </div>
          )}
          {member.city && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {member.city}
            </p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <div className="text-base font-bold text-[#26496b] font-display">{member.postCount ?? posts.length}</div>
              <div className="text-xs text-gray-400">Gönderi</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <div className="text-base font-bold text-[#26496b] font-display">{member.followerCount ?? 0}</div>
              <div className="text-xs text-gray-400">Takipçi</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <div className="text-base font-bold text-[#26496b] font-display">{member.completedSessionCount ?? 0}</div>
              <div className="text-xs text-gray-400">Seans</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              {active ? (
                <>
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-medium text-emerald-600">Aktif</span>
                  </div>
                  <div className="text-xs text-gray-400">Son 3 gün</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-[#26496b] font-display">
                    {new Date(member.createdAt).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-400">Üye</div>
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {member.bio && (
            <p className="mt-4 text-sm text-gray-700 leading-relaxed">{member.bio}</p>
          )}

          {/* Social links */}
          {(member.linkedinUrl || member.websiteUrl) && (
            <div className="flex gap-2 mt-4">
              {member.linkedinUrl && (
                <a
                  href={member.linkedinUrl}
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
              {member.websiteUrl && (
                <a
                  href={member.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Web Sitesi
                </a>
              )}
              {member.portfolioUrl && (
                <a
                  href={member.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#66aca9]/10 text-[#26496b] text-xs font-medium rounded-lg hover:bg-[#66aca9]/20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Portfolio
                </a>
              )}
            </div>
          )}
          {(member.skillTags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {member.skillTags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-[#26496b]/8 text-[#26496b] text-xs rounded-full border border-[#26496b]/15">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* XP + Rank + Kurslar */}
      {(xpInfo || enrollments.length > 0) && (
        <div className="mb-6 space-y-3">
          {/* XP Rank kartı */}
          {xpInfo && (
            <div className="bg-gradient-to-br from-[#0d1b2a] to-[#26496b] rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex flex-col items-center justify-center shrink-0 border border-white/15">
                  <span className="text-2xl leading-none">{xpInfo.current.emoji}</span>
                  <span className="text-[9px] font-bold text-white/60 mt-0.5 uppercase tracking-wide">{xpInfo.current.label}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-2xl font-black text-[#66aca9]">{xpInfo.xp}</span>
                    <span className="text-xs text-white/50">XP</span>
                    {xpInfo.next && <span className="text-xs text-white/35 ml-auto">{xpInfo.next.emoji} {xpInfo.next.label}: {xpInfo.next.minXp} XP</span>}
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#66aca9] to-emerald-400 transition-all"
                      style={{ width: `${xpInfo.pct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Devam eden / tamamlanan kurslar */}
          {enrollments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-800">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Kurslar</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {enrollments.map(e => (
                  <Link key={e.trainingId} href={`/egitim/${e.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#26496b]/10 flex items-center justify-center shrink-0 text-sm">
                      {e.completedAt ? '✅' : '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {e.level && <span className="text-[10px] text-gray-400">{e.level}</span>}
                        <span className={`text-[10px] font-medium ${e.completedAt ? 'text-emerald-600' : 'text-[#26496b]'}`}>%{e.progressPct}</span>
                      </div>
                    </div>
                    <div className="w-12 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 shrink-0">
                      <div className={`h-1.5 rounded-full ${e.completedAt ? 'bg-emerald-500' : 'bg-[#26496b]'}`}
                        style={{ width: `${e.progressPct}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projeler Vitrini */}
      {posts.filter((p) => p.type === 'project_call').length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-base">🚀</span>
            Projeler & Çağrılar
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {posts.filter((p) => p.type === 'project_call').map((p) => (
              <Link
                key={p.id}
                href={`/akis/${p.id}`}
                className="block bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 hover:border-emerald-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                    🚀
                  </div>
                  <div className="flex-1 min-w-0">
                    {p.title && <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{p.title}</p>}
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{p.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{timeAgo(p.createdAt)}</span>
                      {Number(p.reactionCount) > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          👍 {p.reactionCount}
                        </span>
                      )}
                      {Number(p.commentCount) > 0 && (
                        <span className="text-xs text-gray-400">{p.commentCount} yorum</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          {isMe ? 'Gönderilerim' : `${member.displayName} adlı üyenin gönderileri`}
        </h2>
        {posts.filter((p) => p.type !== 'project_call').length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {posts.length === 0 ? 'Henüz gönderi yok.' : 'Diğer gönderi yok.'}
          </p>
        ) : (
          <div className="space-y-3">
            {posts.filter((p) => p.type !== 'project_call').map((p) => (
              <Link
                key={p.id}
                href={`/akis/${p.id}`}
                className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-[#26496b]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#26496b]/10 text-[#26496b]">
                    {POST_TYPE_LABELS[p.type] ?? p.type}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(p.createdAt)}</span>
                  {Number(p.reactionCount) > 0 && (
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      {p.reactionCount}
                    </span>
                  )}
                </div>
                {p.title && <p className="text-sm font-semibold text-gray-900 mb-1">{p.title}</p>}
                <p className="text-sm text-gray-600 line-clamp-2">{p.body}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
