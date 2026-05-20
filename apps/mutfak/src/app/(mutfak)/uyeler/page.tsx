'use client';

import { useEffect, useState, useRef } from 'react';
import { mutfakApi, type Member } from '@/lib/api';
import { MemberCardSkeleton } from '@/components/Skeleton';
import { useToken } from '@/hooks/useToken';
import { useAuth } from '@/contexts/AuthContext';
import { TIER_LABELS, TIER_LABELS_SHORT, TIER_COLORS } from '@/lib/constants';
import { Avatar } from '@/components/Avatar';
import { FocusTrap } from '@/components/FocusTrap';
import { EmptyState } from '@/components/EmptyState';


function isRecentlyActive(lastLoginAt: string | null): boolean {
  if (!lastLoginAt) return false;
  return Date.now() - new Date(lastLoginAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

// ── Member Modal ──────────────────────────────────────────────────────────────

function MemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const tierLabel = TIER_LABELS[member.membershipTier] ?? member.membershipTier;
  const tierColor = TIER_COLORS[member.membershipTier] ?? 'bg-gray-100 text-gray-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <FocusTrap
        onClose={onClose}
        aria-label={member.displayName}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar name={member.displayName} src={member.avatarUrl} id={member.id} size={56} />
              {isRecentlyActive(member.lastLoginAt) && (
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" title="Son 7 günde aktif" />
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{member.displayName}</p>
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${tierColor}`}>
                {tierLabel}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <dl className="space-y-2.5 text-sm">
          {member.profession && (
            <div className="flex gap-3">
              <dt className="text-gray-400 w-20 shrink-0">Meslek</dt>
              <dd className="text-gray-800">{member.profession}</dd>
            </div>
          )}
          {member.city && (
            <div className="flex gap-3">
              <dt className="text-gray-400 w-20 shrink-0">Şehir</dt>
              <dd className="text-gray-800">{member.city}</dd>
            </div>
          )}
          {member.bio && (
            <div className="flex gap-3">
              <dt className="text-gray-400 w-20 shrink-0">Hakkında</dt>
              <dd className="text-gray-700 leading-relaxed">{member.bio}</dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="text-gray-400 w-20 shrink-0">Üye</dt>
            <dd className="text-gray-500 text-xs">
              {new Date(member.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex gap-2">
          <a
            href={`/uyeler/${member.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] transition-colors"
          >
            Tam Profil →
          </a>
          <a
            href="/mentorluk"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#26496b] border border-[#26496b] rounded-xl hover:bg-[#26496b]/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Mentorluk
          </a>
        </div>
      </FocusTrap>
    </div>
  );
}

type SortKey = 'alpha' | 'newest' | 'active';
type ViewMode = 'list' | 'city';

export default function UyelerPage() {
  const token = useToken();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [professionFilter, setProfessionFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('active');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);

  function fetchMembers(q: string) {
    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    mutfakApi.listMembers(token, q || undefined)
      .then((data) => {
        if (gen !== genRef.current) return;
        setMembers(data);
      })
      .catch((e: unknown) => {
        if (gen !== genRef.current) return;
        setError(e instanceof Error ? e.message : 'Yüklenemedi.');
      })
      .finally(() => {
        if (gen === genRef.current) setLoading(false);
      });
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchMembers(search), search ? 350 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, token]);

  const myCity = user?.profile?.city ?? null;
  const cities = [...new Set(members.map((m) => m.city).filter(Boolean) as string[])].sort();

  // City grouping for map view — my city first, then by member count
  const cityGroups = cities.map((city) => ({
    city,
    count: members.filter((m) => m.city === city).length,
    isMyCity: city === myCity,
  })).sort((a, b) => {
    if (a.isMyCity) return -1;
    if (b.isMyCity) return 1;
    return b.count - a.count;
  });
  const professions = [...new Set(members.map((m) => m.profession).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'tr'));

  const sorted = [...members].sort((a, b) => {
    if (sortKey === 'alpha') return a.displayName.localeCompare(b.displayName, 'tr');
    if (sortKey === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    const aActive = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
    const bActive = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
    return bActive - aActive;
  });

  const filtered = sorted.filter((m) => {
    if (tierFilter && m.membershipTier !== tierFilter) return false;
    if (cityFilter && m.city !== cityFilter) return false;
    if (professionFilter && m.profession !== professionFilter) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">Üye Dizini</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Yükleniyor...' : `${filtered.length} üye`}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('city')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'city' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col gap-2 mb-6">
        <input
          type="search"
          placeholder="İsim, şehir veya meslek..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b]"
        />
        <div className="flex gap-2 flex-wrap">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] bg-white"
          >
            <option value="">Tüm Üyelik Tipleri</option>
            <option value="haritailesi_genc">Haritailesi Genç</option>
            <option value="new_graduate_member">Mesleğin Geleceği</option>
            <option value="individual_member">Mesleğin Değer Ortağı</option>
            <option value="corporate_member">Kurumsal</option>
          </select>
          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] bg-white"
            >
              <option value="">Tüm Şehirler</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {professions.length > 0 && (
            <select
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
              className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] bg-white"
            >
              <option value="">Tüm Meslekler</option>
              {professions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] bg-white"
          >
            <option value="active">Son Aktif</option>
            <option value="newest">En Yeni</option>
            <option value="alpha">A–Z</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* City view */}
      {viewMode === 'city' && !loading && cityGroups.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-3">Şehre tıklayarak üyeleri filtreleyin</p>
          <div className="flex flex-wrap gap-2">
            {cityGroups.map(({ city, count, isMyCity }) => (
              <button
                key={city}
                onClick={() => { setCityFilter(city === cityFilter ? '' : city); setViewMode('list'); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  isMyCity
                    ? 'bg-[#26496b] text-white border-[#26496b] shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#26496b]/40 hover:shadow-sm'
                }`}
              >
                <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {city}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isMyCity ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
                {isMyCity && <span className="text-xs opacity-75">· Şehriniz</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'list' && loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <MemberCardSkeleton key={i} />)}
        </div>
      ) : viewMode === 'list' && filtered.length === 0 ? (
        <EmptyState
          illustration={members.length === 0 ? 'compass' : 'search'}
          title={members.length === 0 ? 'Henüz üye yok' : 'Sonuç bulunamadı'}
          description={members.length === 0 ? 'İlk siz olun!' : 'Farklı bir arama veya filtre deneyin.'}
        />
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => {
            const tierLabel = TIER_LABELS_SHORT[member.membershipTier] ?? member.membershipTier;
            const tierColor = TIER_COLORS[member.membershipTier] ?? 'bg-gray-100 text-gray-600';
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMember(member)}
                className="text-left bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#26496b]/20 hover:-translate-y-0.5 transition-all cursor-pointer w-full"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative shrink-0">
                    <Avatar name={member.displayName} src={member.avatarUrl} id={member.id} size={40} />
                    {isRecentlyActive(member.lastLoginAt) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" title="Son 7 günde aktif" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{member.displayName}</p>
                    {member.city && (
                      <p className="text-xs text-gray-400 truncate">{member.city}</p>
                    )}
                  </div>
                </div>
                {member.profession && (
                  <p className="text-xs text-gray-500 mb-3 truncate">{member.profession}</p>
                )}
                <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${tierColor}`}>
                  {tierLabel}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
