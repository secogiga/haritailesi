'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, type AdminUser, type MemberSub } from '@/lib/api';
import { AVATAR_COLORS, getAvatarColor, getInitials } from '@/lib/ui';

// "Aktif" = hesabı onaylanmış (online değil). "Çevrimiçi" = şu an bağlı.
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  visitor:            { label: 'Ziyaretçi',              color: 'text-gray-600',   bg: 'bg-gray-100',   border: 'border-gray-200', dot: 'bg-gray-400' },
  registered_user:    { label: 'Sahne Üyesi',     color: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200', dot: 'bg-slate-400' },
  haritailesi_genc:   { label: 'Haritailesi Genç',      color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200', dot: 'bg-teal-500' },
  new_graduate_member:{ label: 'Mesleğin Geleceği',     color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200', dot: 'bg-orange-500' },
  individual_member:  { label: 'Mesleğin Değer Ortağı', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200', dot: 'bg-blue-500' },
  corporate_member:   { label: 'Kurumsal Üye',          color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-200', dot: 'bg-purple-500' },
};

const TURKEY_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Batman', 'Bilecik', 'Bolu', 'Bursa', 'Çanakkale',
  'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Hatay', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin',
  'Muğla', 'Nevşehir', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Sinop', 'Sivas',
  'Şanlıurfa', 'Tekirdağ', 'Tokat', 'Trabzon', 'Uşak', 'Van', 'Yalova',
  'Zonguldak',
];

const WORK_STATUS_TR: Record<string, string> = {
  employed: 'Çalışıyor', self_employed: 'Serbest', unemployed: 'İş Arıyor',
  student: 'Öğrenci', retired: 'Emekli',
};

const FEE_TIERS = [
  { key: 'haritailesi_genc',    label: 'Haritailesi Genç',      defaultLabel: 'Haritailesi Genç',      free: true },
  { key: 'new_graduate_member', label: 'Haritailesi Genç',      defaultLabel: 'Haritailesi Genç',      free: true },
  { key: 'individual_member',   label: 'Mesleğin Değer Ortağı', defaultLabel: 'Mesleğin Değer Ortağı', free: false },
  { key: 'corporate_member',    label: 'Kurumsal Üye',          defaultLabel: 'Kurumsal Üye',          free: false },
];

function subDays(sub: MemberSub): number {
  return Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86400000);
}

// ─── Subscription Badge ────────────────────────────────────────────────────────

function SubBadge({ sub }: { sub?: MemberSub }) {
  if (!sub) return null;
  const days = subDays(sub);
  const isExpired = sub.status === 'expired' || sub.status === 'cancelled' || days <= 0;
  if (isExpired) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-gray-400 truncate">{sub.memberNumber}</span>
        <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-500 shrink-0">Doldu</span>
      </div>
    );
  }
  const colorClass = days > 60 ? 'bg-emerald-50 text-emerald-700' : days > 30 ? 'bg-yellow-50 text-yellow-700' : 'bg-orange-50 text-orange-700';
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-gray-500 truncate">{sub.memberNumber}</span>
      <span className={`px-1 py-0.5 rounded text-[9px] font-bold shrink-0 ${colorClass}`}>{days}g</span>
    </div>
  );
}

// ─── Fee Config Modal ──────────────────────────────────────────────────────────

function FeeConfigModal({ onClose }: { onClose: () => void }) {
  const year = new Date().getFullYear();
  type FeeRow = { label: string; amountKurus: number; description: string };
  const [fees, setFees] = useState<Record<string, FeeRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getMembershipFees(year)
      .then(data => {
        const map: Record<string, FeeRow> = {};
        for (const f of data) map[f.tier] = { label: f.label, amountKurus: f.amountKurus, description: f.description ?? '' };
        setFees(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  async function saveTier(tierKey: string) {
    const tier = FEE_TIERS.find(t => t.key === tierKey)!;
    const fee = fees[tierKey] ?? { label: tier.defaultLabel, amountKurus: 0, description: '' };
    setSaving(tierKey); setError('');
    try {
      await adminApi.upsertMembershipFee({
        year, tier: tierKey,
        amountKurus: fee.amountKurus,
        label: fee.label || tier.defaultLabel,
        ...(fee.description.trim() ? { description: fee.description.trim() } : {}),
      });
      setSaved(tierKey);
      setTimeout(() => setSaved(null), 2500);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(null); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">{year} Üyelik Ücretleri</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tier başına yıllık abonelik tutarları</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            FEE_TIERS.map(tier => {
              const fee = fees[tier.key] ?? { label: tier.defaultLabel, amountKurus: 0, description: '' };
              const isSaving = saving === tier.key;
              const isSaved = saved === tier.key;
              const cfg = TIER_CONFIG[tier.key]!;
              return (
                <div key={tier.key} className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className={`text-sm font-semibold ${cfg.color}`}>{tier.label}</span>
                      {tier.free && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-700">ÜCRETSİZ</span>}
                    </div>
                    <button onClick={() => void saveTier(tier.key)} disabled={isSaving}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isSaved ? 'bg-emerald-100 text-emerald-700' : 'bg-[#26496b] text-white hover:bg-[#1d3a57] disabled:opacity-50'}`}>
                      {isSaving ? '…' : isSaved ? '✓ Kaydedildi' : 'Kaydet'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Etiket</label>
                      <input type="text" value={fee.label}
                        onChange={e => setFees(prev => ({ ...prev, [tier.key]: { ...fee, label: e.target.value } }))}
                        className="w-full border border-white/80 rounded-lg px-2.5 py-1.5 text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Tutar (TL)</label>
                      <input type="number" min={0} step="0.01" value={fee.amountKurus / 100} disabled={tier.free}
                        onChange={e => setFees(prev => ({ ...prev, [tier.key]: { ...fee, amountKurus: Math.round(parseFloat(e.target.value || '0') * 100) } }))}
                        className="w-full border border-white/80 rounded-lg px-2.5 py-1.5 text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Online Dot ───────────────────────────────────────────────────────────────

function OnlineDot({ small }: { small?: boolean }) {
  if (small) return <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" title="Çevrimiçi" />;
  return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" title="Çevrimiçi" />;
}

// ─── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({ u, sub, onClick, isOnline }: { u: AdminUser; sub?: MemberSub; onClick: () => void; isOnline?: boolean }) {
  const tier = TIER_CONFIG[u.membershipTier] ?? TIER_CONFIG['registered_user']!;
  const initials = getInitials(u.displayName, u.email);
  const avatarColor = getAvatarColor(u.email);

  return (
    <div onClick={onClick} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-[#26496b]/[0.03] hover:border-[#26496b]/20 transition-all duration-150 cursor-pointer overflow-hidden flex flex-col">
      <div className={`h-1 w-full ${tier.dot} opacity-60`} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
              {initials}
            </div>
            {isOnline && <OnlineDot />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate leading-tight">{u.displayName ?? '—'}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
          </span>
        </div>
        <div className="space-y-1.5 mb-4 flex-1">
          {u.profession && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{u.profession}</span>
            </div>
          )}
          {(u.city || u.corporateName) && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{u.corporateName ?? u.city}</span>
            </div>
          )}
          {u.workStatus && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>{WORK_STATUS_TR[u.workStatus] ?? u.workStatus}</span>
              {u.experienceYears ? <span className="text-gray-400">· {u.experienceYears} yıl</span> : null}
            </div>
          )}
        </div>
        {u.skillTags && u.skillTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {u.skillTags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-md">{tag}</span>
            ))}
            {u.skillTags.length > 3 && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-medium rounded-md">+{u.skillTags.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${tier.color} ${tier.bg} ${tier.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
            {tier.label}
          </span>
          <div className="text-right">
            {sub?.memberNumber
              ? <p className="font-mono text-[11px] font-semibold text-[#26496b]/75 tracking-wide">{sub.memberNumber}</p>
              : <p className="text-[10px] text-orange-400 font-semibold">Üye değil</p>
            }
            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({ u, sub, onClick, isOnline, selected, onSelect }: {
  u: AdminUser; sub?: MemberSub; onClick: () => void; isOnline?: boolean;
  selected?: boolean; onSelect?: (id: string) => void;
}) {
  const tier = TIER_CONFIG[u.membershipTier] ?? TIER_CONFIG['registered_user']!;
  const initials = getInitials(u.displayName, u.email);
  const avatarColor = getAvatarColor(u.email);

  return (
    <tr
      onClick={onClick}
      className={`group border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer transition-colors ${selected ? 'bg-[#26496b]/5' : ''}`}
    >
      {onSelect && (
        <td className="pl-4 pr-2 py-3" onClick={e => { e.stopPropagation(); onSelect(u.id); }}>
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={() => onSelect(u.id)}
            className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]"
          />
        </td>
      )}
      <td className="px-4 py-3 whitespace-nowrap">
        {sub?.memberNumber
          ? <span className="font-mono text-[11px] text-gray-600">{sub.memberNumber}</span>
          : <span className="text-xs text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
              {initials}
            </div>
            {isOnline && <OnlineDot small />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{u.displayName ?? '—'}</p>
            <p className="text-xs text-gray-400 truncate">{u.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-[140px]"><span className="truncate block">{u.profession ?? '—'}</span></td>
      <td className="px-4 py-3 text-sm text-gray-500">{u.corporateName ?? u.city ?? '—'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${tier.color} ${tier.bg} ${tier.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
          {tier.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
      <td className="px-4 py-3 text-right">
        <svg className="w-4 h-4 text-gray-300 group-hover:text-[#26496b] transition-colors inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </td>
    </tr>
  );
}

// ─── Sidebar Radio Group ──────────────────────────────────────────────────────

function RadioGroup({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; dot?: string; count?: number }[];
}) {
  return (
    <div className="space-y-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value === value ? '' : opt.value)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left ${
            value === opt.value
              ? 'bg-[#26496b]/8 text-[#26496b] font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            value === opt.value ? 'border-[#26496b]' : 'border-gray-300'
          }`}>
            {value === opt.value && <span className="w-2 h-2 rounded-full bg-[#26496b]" />}
          </span>
          {opt.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />}
          <span className="truncate flex-1">{opt.label}</span>
          {opt.count !== undefined && (
            <span className={`text-xs font-medium shrink-0 tabular-nums ${value === opt.value ? 'text-[#26496b]' : 'text-gray-400'}`}>
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabKey = 'members' | 'registered';

export default function UyelerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('members');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [presenceFilter, setPresenceFilter] = useState(''); // '' | 'online' | 'offline'
  const [cityFilter, setCityFilter] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [workStatusFilter, setWorkStatusFilter] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [maxExperience, setMaxExperience] = useState('');
  const [joinedAfter, setJoinedAfter] = useState('');
  const [joinedBefore, setJoinedBefore] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [stats, setStats] = useState<{ total: number; active: number; expired: number; expiringSoon: number } | null>(null);
  const [subMap, setSubMap] = useState<Record<string, MemberSub>>({});
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkToast, setBulkToast] = useState('');

  // Tek seferde 3 paralel çağrı — sayfa açılışında waterfall yok
  useEffect(() => {
    void Promise.all([
      adminApi.getMembershipStats().catch(() => null),
      adminApi.listMembershipSubscriptions({ limit: 500 }).catch(() => null),
      adminApi.getOnlineUsers().catch(() => null),
    ]).then(([stats, subs, online]) => {
      if (stats) setStats(stats);
      if (subs) {
        const map: Record<string, MemberSub> = {};
        for (const s of subs) {
          const uid = s.user?.id;
          if (!uid) continue;
          const existing = map[uid];
          if (!existing || new Date(s.createdAt).getTime() > new Date(existing.createdAt).getTime()) map[uid] = s;
        }
        setSubMap(map);
      }
      if (online) setOnlineIds(new Set(online.userIds));
    });
    const id = setInterval(() => {
      void adminApi.getOnlineUsers().then(r => setOnlineIds(new Set(r.userIds))).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Sayısal filtreler için debounce — her tuşa API'ye gitmesin
  const [appliedNum, setAppliedNum] = useState({ minAge: '', maxAge: '', minExperience: '', maxExperience: '' });
  const numTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (numTimer.current) clearTimeout(numTimer.current);
    numTimer.current = setTimeout(() => setAppliedNum({ minAge, maxAge, minExperience, maxExperience }), 400);
    return () => { if (numTimer.current) clearTimeout(numTimer.current); };
  }, [minAge, maxAge, minExperience, maxExperience]);

  const buildParams = useCallback(() => ({
    ...(activeTab === 'members' ? { memberOnly: 'true' } : { registeredOnly: 'true' }),
    ...(search ? { search } : {}),
    ...(activeTab === 'members' && tierFilter ? { tier: tierFilter } : {}),
    ...(cityFilter ? { city: cityFilter } : {}),
    ...(workStatusFilter ? { workStatus: workStatusFilter } : {}),
    ...(joinedAfter ? { joinedAfter } : {}),
    ...(joinedBefore ? { joinedBefore } : {}),
    ...(appliedNum.minAge ? { minAge: appliedNum.minAge } : {}),
    ...(appliedNum.maxAge ? { maxAge: appliedNum.maxAge } : {}),
    ...(appliedNum.minExperience ? { minExperience: appliedNum.minExperience } : {}),
    ...(appliedNum.maxExperience ? { maxExperience: appliedNum.maxExperience } : {}),
    ...(sortBy && sortBy !== 'newest' ? { sortBy } : {}),
  }), [activeTab, search, tierFilter, cityFilter, workStatusFilter,
       joinedAfter, joinedBefore, appliedNum, sortBy]);

  const load = useCallback(async (reset = false) => {
    setLoading(true); setError('');
    try {
      const result = await adminApi.listUsers({ ...buildParams(), ...(!reset && cursor ? { cursor } : {}) });
      setUsers(reset ? result.data : prev => [...prev, ...result.data]);
      setCursor(result.next_cursor);
      setHasMore(result.has_more);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [buildParams, cursor]);

  useEffect(() => {
    setCursor(null);
    void (async () => {
      setLoading(true); setError('');
      try {
        const result = await adminApi.listUsers(buildParams());
        setUsers(result.data);
        setCursor(result.next_cursor);
        setHasMore(result.has_more);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab, search, tierFilter, cityFilter, workStatusFilter,
      joinedAfter, joinedBefore, appliedNum, sortBy]);

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    setSearch(''); setSearchInput('');
    setTierFilter(''); setPresenceFilter('');
    setCityFilter(''); setCityInput('');
    setWorkStatusFilter(''); setMinAge(''); setMaxAge('');
    setMinExperience(''); setMaxExperience('');
    setJoinedAfter(''); setJoinedBefore('');
    setSortBy('newest');
    setSelectedIds(new Set());
  }

  function clearAllFilters() {
    setSearch(''); setSearchInput('');
    setTierFilter(''); setPresenceFilter('');
    setCityFilter(''); setCityInput('');
    setWorkStatusFilter(''); setMinAge(''); setMaxAge('');
    setMinExperience(''); setMaxExperience('');
    setJoinedAfter(''); setJoinedBefore('');
    setSortBy('newest');
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const ids = filteredUsers.map(u => u.id);
    const allSel = ids.length > 0 && ids.every(id => selectedIds.has(id));
    if (allSel) setSelectedIds(new Set());
    else setSelectedIds(new Set(ids));
  }

  function handleCopyEmails() {
    const emails = filteredUsers
      .filter(u => selectedIds.has(u.id))
      .map(u => u.email)
      .join(', ');
    void navigator.clipboard.writeText(emails);
    setBulkToast(`✓ ${selectedIds.size} e-posta kopyalandı`);
    setTimeout(() => setBulkToast(''), 3000);
  }

  function handleBulkCsv() {
    const TIER_LABELS: Record<string, string> = {
      visitor: 'Ziyaretçi', registered_user: 'Sahne Üyesi',
      haritailesi_genc: 'Haritailesi Genç', new_graduate_member: 'Mesleğin Geleceği',
      individual_member: 'Mesleğin Değer Ortağı', corporate_member: 'Kurumsal Üye',
    };
    const selected = filteredUsers.filter(u => selectedIds.has(u.id));
    const header = ['Üye No', 'Ad Soyad', 'E-posta', 'Tier', 'Meslek', 'Şehir / Kurum', 'Çalışma Durumu', 'Deneyim (yıl)', 'Katılım Tarihi'];
    const rows = selected.map(u => [
      subMap[u.id]?.memberNumber ?? '',
      u.displayName ?? '',
      u.email,
      TIER_LABELS[u.membershipTier] ?? u.membershipTier,
      u.profession ?? '',
      u.corporateName ?? u.city ?? '',
      WORK_STATUS_TR[u.workStatus ?? ''] ?? u.workStatus ?? '',
      u.experienceYears != null ? String(u.experienceYears) : '',
      new Date(u.createdAt).toLocaleDateString('tr-TR'),
    ]);
    const BOM = '﻿';
    const csv = BOM + [header, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `uyeler-secili-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function handleBulkStatus(status: string) {
    if (selectedIds.size === 0 || bulkBusy) return;
    const ids = [...selectedIds];
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map(id => adminApi.updateUserStatus(id, status)));
    const ok = results.filter(r => r.status === 'fulfilled').length;
    setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, status } : u));
    setSelectedIds(new Set());
    setBulkBusy(false);
    setBulkToast(`✓ ${ok} üye güncellendi`);
    setTimeout(() => setBulkToast(''), 3000);
  }

  // Apply presence filter client-side (presence data is in Redis, not DB)
  const filteredUsers = users.filter(u => {
    if (presenceFilter === 'online') return onlineIds.has(u.id);
    if (presenceFilter === 'offline') return !onlineIds.has(u.id);
    return true;
  });

  const listIds = filteredUsers.map(u => u.id);
  const allSelected = listIds.length > 0 && listIds.every(id => selectedIds.has(id));
  const someSelected = listIds.some(id => selectedIds.has(id));

  // Counts for presence filter options
  const onlineCount = users.filter(u => onlineIds.has(u.id)).length;
  const offlineCount = users.length - onlineCount;

  const goToUser = (id: string) => router.push(`/uyeler/${id}`);

  const hasNonDefaultFilter = !!(tierFilter || presenceFilter || cityFilter || workStatusFilter ||
    minAge || maxAge || minExperience || maxExperience ||
    joinedAfter || joinedBefore || sortBy !== 'newest' || search);

  // Active filter chips
  type Chip = { label: string; onRemove: () => void };
  const activeChips: Chip[] = [];
  if (search) activeChips.push({ label: `"${search}"`, onRemove: () => { setSearch(''); setSearchInput(''); } });
  if (tierFilter && activeTab === 'members') activeChips.push({ label: TIER_CONFIG[tierFilter]?.label ?? tierFilter, onRemove: () => setTierFilter('') });
  if (presenceFilter) activeChips.push({ label: presenceFilter === 'online' ? 'Çevrimiçi' : 'Çevrimdışı', onRemove: () => setPresenceFilter('') });
  if (workStatusFilter) activeChips.push({ label: WORK_STATUS_TR[workStatusFilter] ?? workStatusFilter, onRemove: () => setWorkStatusFilter('') });
  if (cityFilter) activeChips.push({ label: `Şehir: ${cityFilter}`, onRemove: () => { setCityFilter(''); setCityInput(''); } });
  if (minAge || maxAge) activeChips.push({ label: `Yaş: ${minAge || '?'}–${maxAge || '?'}`, onRemove: () => { setMinAge(''); setMaxAge(''); } });
  if (minExperience || maxExperience) activeChips.push({ label: `Deneyim: ${minExperience || '?'}–${maxExperience || '?'} yıl`, onRemove: () => { setMinExperience(''); setMaxExperience(''); } });
  if (joinedAfter || joinedBefore) activeChips.push({ label: `Katılım: ${joinedAfter || '?'} – ${joinedBefore || '?'}`, onRemove: () => { setJoinedAfter(''); setJoinedBefore(''); } });
  if (sortBy !== 'newest') activeChips.push({ label: sortBy === 'oldest' ? 'En Eski' : sortBy === 'name' ? 'İsme Göre' : 'Son Giriş', onRemove: () => setSortBy('newest') });

  return (
    <div>
      {bulkToast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl">
          {bulkToast}
        </div>
      )}

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Üyeler</h1>
          {onlineIds.size > 0 && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {onlineIds.size} çevrimiçi
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const TIER_LABELS: Record<string, string> = {
                visitor: 'Ziyaretçi', registered_user: 'Sahne Üyesi',
                haritailesi_genc: 'Haritailesi Genç', new_graduate_member: 'Mesleğin Geleceği',
                individual_member: 'Mesleğin Değer Ortağı', corporate_member: 'Kurumsal Üye',
              };
              const header = ['Üye No', 'Ad Soyad', 'E-posta', 'Tier', 'Meslek', 'Şehir / Kurum', 'Çalışma Durumu', 'Deneyim (yıl)', 'Katılım Tarihi'];
              const rows = filteredUsers.map(u => [
                subMap[u.id]?.memberNumber ?? '',
                u.displayName ?? '',
                u.email,
                TIER_LABELS[u.membershipTier] ?? u.membershipTier,
                u.profession ?? '',
                u.corporateName ?? u.city ?? '',
                WORK_STATUS_TR[u.workStatus ?? ''] ?? u.workStatus ?? '',
                u.experienceYears != null ? String(u.experienceYears) : '',
                new Date(u.createdAt).toLocaleDateString('tr-TR'),
              ]);
              const BOM = '﻿';
              const csv = BOM + [header, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
              a.download = `uyeler-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            CSV İndir
          </button>
          <Link href="/istatistikler" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Üye İstatistikleri
          </Link>
          <button onClick={() => setShowFeeModal(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Ücret Ayarları
          </button>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('card')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'card' ? 'bg-[#26496b] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Kart
            </button>
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${viewMode === 'list' ? 'bg-[#26496b] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* ─── Membership Stats Bar ─────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Toplam Üye',       value: stats.total,       icon: '🎫', color: 'text-gray-900' },
            { label: 'Aktif Üye',        value: stats.active,      icon: '✅', color: 'text-emerald-700' },
            { label: 'Sona Ermiş',      value: stats.expired,     icon: '⏰', color: 'text-gray-500' },
            { label: 'Yakında Dolacak', value: stats.expiringSoon, icon: '⚠️', color: 'text-orange-600' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{m.icon}</span>
              <div>
                <p className={`text-lg font-bold leading-tight ${m.color}`}>{m.value}</p>
                <p className="text-[11px] text-gray-400 font-medium">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {([
          { key: 'members',    label: 'Üyeler',               description: 'Haritailesi Genç, Mesleğin Değer Ortağı, Kurumsal' },
          { key: 'registered', label: 'Kayıtlı Kullanıcılar', description: 'Haritailesi Sahne\'den kaydolan kullanıcılar' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            title={tab.description}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-[#26496b] text-[#26496b]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Two-column layout ───────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-60 shrink-0 sticky top-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                <span className="text-sm font-semibold text-gray-800">Filtreler</span>
                {hasNonDefaultFilter && <span className="w-2 h-2 rounded-full bg-[#26496b]" />}
              </div>
              {hasNonDefaultFilter && (
                <button onClick={clearAllFilters} className="text-xs text-[#26496b] hover:text-[#1d3a57] font-medium transition-colors">
                  Temizle
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100">

              {/* Sıralama */}
              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Sıralama</p>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 text-sm pl-2.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white text-gray-700">
                  <option value="newest">En Yeni</option>
                  <option value="oldest">En Eski</option>
                  <option value="name">İsme Göre</option>
                  <option value="lastLogin">Son Giriş</option>
                </select>
              </div>

              {/* Bağlantı (online/offline) */}
              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Bağlantı</p>
                <RadioGroup
                  value={presenceFilter}
                  onChange={setPresenceFilter}
                  options={[
                    { value: '', label: 'Tümü', count: users.length },
                    { value: 'online',  label: 'Çevrimiçi',  dot: 'bg-emerald-400', count: onlineCount },
                    { value: 'offline', label: 'Çevrimdışı', dot: 'bg-gray-300',    count: offlineCount },
                  ]}
                />
              </div>

              {/* Üyelik Tipi — sadece Üyeler tabında */}
              {activeTab === 'members' && (
                <div className="px-4 py-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Üyelik Tipi</p>
                  <RadioGroup
                    value={tierFilter}
                    onChange={setTierFilter}
                    options={[
                      { value: '', label: 'Tümü' },
                      { value: 'haritailesi_genc',    label: 'Haritailesi Genç',      dot: 'bg-teal-500' },
                      { value: 'new_graduate_member', label: 'Haritailesi Genç',      dot: 'bg-orange-500' },
                      { value: 'individual_member',   label: 'Mesleğin Değer Ortağı', dot: 'bg-blue-500' },
                      { value: 'corporate_member',    label: 'Kurumsal Üye',     dot: 'bg-purple-500' },
                    ]}
                  />
                </div>
              )}

              {/* Çalışma Durumu */}
              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Çalışma Durumu</p>
                <RadioGroup
                  value={workStatusFilter}
                  onChange={setWorkStatusFilter}
                  options={[
                    { value: '', label: 'Tümü' },
                    { value: 'employed',      label: 'Çalışıyor' },
                    { value: 'self_employed', label: 'Serbest Meslek' },
                    { value: 'unemployed',    label: 'İş Arıyor' },
                    { value: 'student',       label: 'Öğrenci' },
                    { value: 'retired',       label: 'Emekli' },
                  ]}
                />
              </div>

              {/* Şehir */}
              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Şehir</p>
                <select
                  value={cityFilter}
                  onChange={e => { setCityFilter(e.target.value); setCityInput(e.target.value); }}
                  className="w-full rounded-lg border border-gray-200 text-sm pl-2.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white text-gray-700"
                >
                  <option value="">Tüm Şehirler</option>
                  {TURKEY_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Yaş Aralığı */}
              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Yaş Aralığı</p>
                <div className="flex items-center gap-2">
                  <input type="number" min={18} max={80} placeholder="Min" value={minAge}
                    onChange={e => setMinAge(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white text-center text-gray-700" />
                  <span className="text-gray-400 text-xs shrink-0">—</span>
                  <input type="number" min={18} max={80} placeholder="Max" value={maxAge}
                    onChange={e => setMaxAge(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white text-center text-gray-700" />
                </div>
              </div>

              {/* Deneyim */}
              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Deneyim (yıl)</p>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={50} placeholder="Min" value={minExperience}
                    onChange={e => setMinExperience(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white text-center text-gray-700" />
                  <span className="text-gray-400 text-xs shrink-0">—</span>
                  <input type="number" min={0} max={50} placeholder="Max" value={maxExperience}
                    onChange={e => setMaxExperience(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white text-center text-gray-700" />
                </div>
              </div>

              {/* Katılım Tarihi */}
              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Katılım Tarihi</p>
                <div className="space-y-2">
                  <input type="date" value={joinedAfter} onChange={e => setJoinedAfter(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white text-gray-700" />
                  <input type="date" value={joinedBefore} onChange={e => setJoinedBefore(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white text-gray-700" />
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* ── Main Content ───────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Search bar */}
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2 mb-4">
            <div className="flex-1 relative min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="search" placeholder="İsim, e-posta veya meslek ara…" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]/50 bg-white shadow-sm" />
            </div>
            <button type="submit" className="px-5 py-2.5 text-sm bg-[#26496b] text-white rounded-xl hover:bg-[#1d3a57] transition-colors font-medium shadow-sm">
              Ara
            </button>
          </form>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map((chip, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#26496b]/8 text-[#26496b] text-xs font-medium border border-[#26496b]/15">
                  {chip.label}
                  <button onClick={chip.onRemove} className="hover:text-[#1d3a57] transition-colors leading-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {activeChips.length > 1 && (
                <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium px-1">
                  Tümünü temizle
                </button>
              )}
            </div>
          )}

          {/* Registered tab info banner */}
          {activeTab === 'registered' && (
            <div className="flex items-start gap-3 p-3 mb-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Haritailesi Sahne&apos;den kaydolan kullanıcılar. Üyelik başvurusu yapmamış hesaplar burada görünür.</span>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm mb-4">{error}</div>}

          {/* Card view */}
          {viewMode === 'card' && (
            <>
              {!loading && filteredUsers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredUsers.map(u => (
                    <MemberCard key={u.id} u={u} onClick={() => goToUser(u.id)} isOnline={onlineIds.has(u.id)} {...(subMap[u.id] !== undefined ? { sub: subMap[u.id] } : {})} />
                  ))}
                </div>
              )}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-full" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-medium text-gray-500">Kullanıcı bulunamadı</p>
                  <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                </div>
              )}
            </>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Üye No</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kullanıcı</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meslek</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Şehir</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tip</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hesap</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Katılım</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-100 animate-pulse">
                          <td className="pl-4 pr-2 py-3 w-10" />
                          <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-24" /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0" />
                              <div className="space-y-1.5">
                                <div className="h-3 bg-gray-200 rounded w-28" />
                                <div className="h-2.5 bg-gray-100 rounded w-36" />
                              </div>
                            </div>
                          </td>
                          {[1,2,3,4,5,6].map(j => (
                            <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-20" /></td>
                          ))}
                        </tr>
                      ))
                    : filteredUsers.map(u => (
                        <MemberRow
                          key={u.id}
                          u={u}
                          onClick={() => goToUser(u.id)}
                          isOnline={onlineIds.has(u.id)}
                          selected={selectedIds.has(u.id)}
                          onSelect={toggleSelect}
                          {...(subMap[u.id] !== undefined ? { sub: subMap[u.id] } : {})}
                        />
                      ))
                  }
                </tbody>
              </table>
              </div>
              {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <p className="font-medium text-gray-500">Kullanıcı bulunamadı</p>
                  <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                </div>
              )}
            </div>
          )}

          {hasMore && !loading && presenceFilter === '' && (
            <div className="mt-6 text-center">
              <button onClick={() => void load(false)}
                className="px-6 py-2.5 text-sm text-[#26496b] border border-[#26496b]/30 rounded-xl hover:bg-[#26496b]/5 font-medium transition-colors">
                Daha Fazla Göster
              </button>
            </div>
          )}
        </div>
      </div>

      {showFeeModal && <FeeConfigModal onClose={() => setShowFeeModal(false)} />}

      {/* ─── Bulk Action Bar ─── */}
      {viewMode === 'list' && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl">
          <span className="text-sm font-semibold whitespace-nowrap">
            {selectedIds.size} üye seçildi
          </span>
          <div className="w-px h-5 bg-white/20 shrink-0" />
          <button
            onClick={handleCopyEmails}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            E-postaları Kopyala
          </button>
          <button
            onClick={handleBulkCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV İndir
          </button>
          <div className="w-px h-5 bg-white/20 shrink-0" />
          <button
            disabled={bulkBusy}
            onClick={() => void handleBulkStatus('active')}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-40"
          >
            {bulkBusy ? '…' : 'Aktif Yap'}
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => void handleBulkStatus('inactive')}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-40"
          >
            {bulkBusy ? '…' : 'Pasif Yap'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-1 text-white/50 hover:text-white transition-colors text-lg leading-none"
            title="Seçimi temizle"
          >×</button>
        </div>
      )}
    </div>
  );
}
