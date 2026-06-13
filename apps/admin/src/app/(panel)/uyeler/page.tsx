'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, type AdminUser, type MemberSub } from '@/lib/api';
import { getAvatarColor, getInitials, normCity } from '@/lib/ui';
import { RowMenu } from '@/components/RowMenu';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  visitor:             { label: 'Ziyaretçi',              color: 'text-gray-500',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  registered_user:     { label: 'Kayıtlı',                 color: 'text-slate-600',  bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  haritailesi_genc:    { label: 'Haritailesi Genç',       color: 'text-teal-700',   bg: 'bg-teal-50',    dot: 'bg-teal-500' },
  new_graduate_member: { label: 'Mesleğin Geleceği',      color: 'text-orange-700', bg: 'bg-orange-50',  dot: 'bg-orange-500' },
  individual_member:   { label: 'Mesleğin Değer Ortağı',  color: 'text-blue-700',   bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  corporate_member:    { label: 'Kurumsal Üye',           color: 'text-purple-700', bg: 'bg-purple-50',  dot: 'bg-purple-500' },
};

const TIER_DOT_FULL: Record<string, string> = {
  visitor: 'bg-gray-400', registered_user: 'bg-slate-400',
  haritailesi_genc: 'bg-teal-500', new_graduate_member: 'bg-orange-500',
  individual_member: 'bg-blue-500', corporate_member: 'bg-purple-500',
};

const TURKEY_CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Ankara','Antalya','Artvin','Aydın',
  'Balıkesir','Batman','Bilecik','Bolu','Bursa','Çanakkale','Çorum','Denizli',
  'Diyarbakır','Düzce','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir',
  'Gaziantep','Giresun','Hatay','Isparta','İstanbul','İzmir','Kahramanmaraş',
  'Karabük','Kars','Kastamonu','Kayseri','Kırıkkale','Kocaeli','Konya','Kütahya',
  'Malatya','Manisa','Mardin','Mersin','Muğla','Nevşehir','Ordu','Rize','Sakarya',
  'Samsun','Sinop','Sivas','Şanlıurfa','Tekirdağ','Tokat','Trabzon','Uşak','Van',
  'Yalova','Zonguldak',
];

const FEE_TIERS = [
  { key: 'haritailesi_genc',    label: 'Haritailesi Genç',      free: true },
  { key: 'new_graduate_member', label: 'Mesleğin Geleceği',     free: true },
  { key: 'individual_member',   label: 'Mesleğin Değer Ortağı', free: false },
  { key: 'corporate_member',    label: 'Kurumsal Üye',          free: false },
];

// ─── Direct Message Modal ────────────────────────────────────────────────────

function DirectMessageModal({
  target,
  onClose,
  onSuccess,
}: {
  target: { type: 'single'; userId: string; displayName: string } | { type: 'bulk'; ids: string[] };
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true); setError('');
    try {
      if (target.type === 'single') {
        await adminApi.sendAdminInboxMessage(target.userId, body.trim());
        onSuccess('Mesaj gönderildi');
      } else {
        const results = await Promise.allSettled(
          target.ids.map(id => adminApi.sendAdminInboxMessage(id, body.trim())),
        );
        const ok = results.filter(r => r.status === 'fulfilled').length;
        onSuccess(`${ok}/${target.ids.length} üyeye mesaj gönderildi`);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const recipientLabel = target.type === 'single' ? target.displayName : `${target.ids.length} üye`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Mesaj Gönder</h2>
            <p className="text-xs text-gray-400 mt-0.5">Alıcı: {recipientLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={e => void handleSend(e)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Mesaj</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              placeholder="Mesajınızı yazın…"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              İptal
            </button>
            <button type="submit" disabled={!body.trim() || sending}
              className="flex-1 py-2.5 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] transition-colors disabled:opacity-50">
              {sending ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Fee Config Modal ─────────────────────────────────────────────────────────

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
    const fee = fees[tierKey] ?? { label: tier.label, amountKurus: 0, description: '' };
    setSaving(tierKey); setError('');
    try {
      await adminApi.upsertMembershipFee({
        year, tier: tierKey,
        amountKurus: fee.amountKurus,
        label: fee.label || tier.label,
        ...(fee.description.trim() ? { description: fee.description.trim() } : {}),
      });
      setSaved(tierKey);
      setTimeout(() => setSaved(null), 2500);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(null); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{year} Üyelik Ücretleri</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tier başına yıllık abonelik tutarları</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            FEE_TIERS.map(tier => {
              const fee = fees[tier.key] ?? { label: tier.label, amountKurus: 0, description: '' };
              const cfg = TIER_CONFIG[tier.key]!;
              return (
                <div key={tier.key} className={`p-4 rounded-xl ${cfg.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className={`text-sm font-medium ${cfg.color}`}>{tier.label}</span>
                      {tier.free && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-700 uppercase">Ücretsiz</span>}
                    </div>
                    <button onClick={() => void saveTier(tier.key)} disabled={saving === tier.key}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${saved === tier.key ? 'bg-emerald-100 text-emerald-700' : 'bg-[#26496b] text-white hover:bg-[#1d3a57] disabled:opacity-50'}`}>
                      {saving === tier.key ? '…' : saved === tier.key ? '✓ Kaydedildi' : 'Kaydet'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Etiket</label>
                      <input type="text" value={fee.label}
                        onChange={e => setFees(prev => ({ ...prev, [tier.key]: { ...fee, label: e.target.value } }))}
                        className="w-full border border-black/10 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#26496b]/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Tutar (TL)</label>
                      <input type="number" min={0} step="0.01" value={fee.amountKurus / 100}
                        disabled={tier.free}
                        onChange={e => setFees(prev => ({ ...prev, [tier.key]: { ...fee, amountKurus: Math.round(parseFloat(e.target.value || '0') * 100) } }))}
                        className="w-full border border-black/10 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 disabled:opacity-40 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Kademe Badge ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  izleyici:     { label: '1. Keşif',       color: 'text-slate-500',   bg: 'bg-slate-50',   dot: 'bg-slate-400'   },
  katilimci:    { label: '2. Katılımcı',   color: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-500'    },
  katki_sunan:  { label: '3. Katkı Sunan', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  etki_yaratan: { label: '4. Etki Yaratan',color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-500'   },
};

function KademeBadge({ level }: { level: string | undefined }) {
  const cfg = level ? (LEVEL_CONFIG[level] ?? LEVEL_CONFIG['izleyici']!) : null;
  if (!cfg) return <span className="text-xs text-gray-300">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-bold leading-snug ${cfg.color} ${cfg.bg}`} style={{ fontSize: '12px', padding: '5px 9px' }}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span>{cfg.label}</span>
    </span>
  );
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG['registered_user']!;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-bold leading-snug ${cfg.color} ${cfg.bg}`} style={{ fontSize: '12px', padding: '5px 9px' }}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span>{cfg.label}</span>
    </span>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({ u, sub, onClick, isOnline }: {
  u: AdminUser; sub?: MemberSub; onClick: () => void; isOnline?: boolean;
}) {
  const initials = getInitials(u.displayName, u.email);
  const avatarColor = getAvatarColor(u.email);
  const dotColor = TIER_DOT_FULL[u.membershipTier] ?? 'bg-gray-300';

  return (
    <div onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-150 cursor-pointer overflow-hidden">
      <div className={`h-0.5 w-full ${dotColor} opacity-70`} />
      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-semibold text-sm`}>
              {initials}
            </div>
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{u.displayName ?? '—'}</p>
            <p className="text-xs text-gray-400 truncate">{u.email}</p>
          </div>
        </div>

        {/* Secondary info — 1 line */}
        <p className="text-xs text-gray-500 truncate mb-4 min-h-[1rem]">
          {[u.profession, u.corporateName ?? u.city].filter(Boolean).join(' · ') || ' '}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-50">
          <div className="min-w-0 flex items-center gap-1.5">
            {(() => {
              const cfg = TIER_CONFIG[u.membershipTier] ?? TIER_CONFIG['registered_user']!;
              return <>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                <span className={`text-xs font-semibold leading-snug ${cfg.color}`}>{cfg.label}</span>
              </>;
            })()}
          </div>
          <span className="shrink-0">
            {sub?.memberNumber
              ? <span className="font-mono text-white text-[10px] font-semibold tracking-wide whitespace-nowrap" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 7px', color: '#475569' }}>{sub.memberNumber}</span>
              : <span className="text-[11px] text-gray-400 tabular-nums whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({ u, sub, onClick, isOnline, selected, onSelect, onEdit, onDelete, onMessage }: {
  u: AdminUser; sub?: MemberSub; onClick: () => void; isOnline?: boolean;
  selected?: boolean; onSelect?: (id: string) => void;
  onEdit?: () => void; onDelete?: () => void; onMessage?: () => void;
}) {
  const initials = getInitials(u.displayName, u.email);
  const avatarColor = getAvatarColor(u.email);

  return (
    <tr onClick={onClick}
      style={{ borderBottom: '1px solid #eef2f7' }}
      className={`group hover:bg-slate-50/60 cursor-pointer transition-colors ${selected ? 'bg-blue-50/30' : ''}`}
    >

      {onSelect && (
        <td className="pl-6 pr-3 py-3 align-middle" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={selected ?? false} onChange={() => onSelect(u.id)}
            className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]" />
        </td>
      )}

      {/* Üye No */}
      <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap align-middle">
        {sub?.memberNumber
          ? <span className="font-mono text-white text-[10px] font-semibold tracking-wide" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 7px', color: '#475569' }}>{sub.memberNumber}</span>
          : <span className="text-xs text-gray-300">—</span>}
      </td>

      {/* Üye */}
      <td className="px-4 py-3 align-middle w-56">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
              {initials}
            </div>
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0f172a] truncate">{u.displayName ?? '—'}</p>
            <p className="text-xs text-[#94a3b8] truncate mt-0.5">{u.email}</p>
          </div>
        </div>
      </td>

      {/* Üyelik Tipi */}
      <td className="px-4 py-3 align-middle w-40">
        <div className="flex"><TierBadge tier={u.membershipTier} /></div>
      </td>

      {/* Şehir / Kurum */}
      <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-500 w-28 align-middle">
        <span className="truncate block">{u.corporateName ?? normCity(u.city)}</span>
      </td>

      {/* Katılım */}
      <td className="hidden lg:table-cell px-4 py-3 text-xs text-gray-400 whitespace-nowrap w-32 align-middle">
        {new Date(u.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>

      {/* Actions */}
      <td className="pl-1 pr-3 py-3 align-middle w-16" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-0.5 justify-end">
          {onMessage && (
            <button
              onClick={onMessage}
              title="Mesaj Gönder"
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/8 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          )}
          <RowMenu items={[
            { label: 'Düzenle', onClick: () => onEdit?.() },
            { label: 'Sil', onClick: () => onDelete?.(), danger: true },
          ]} />
        </div>
      </td>
    </tr>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50/60 transition-colors">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <svg className={`w-3 h-3 text-gray-300 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function FilterOption({ active, label, count, onClick }: {
  active: boolean; label: string; count?: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2 py-1.5 text-left group">
      <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
        active ? 'bg-[#26496b] border-[#26496b]' : 'border-gray-300 group-hover:border-gray-400'
      }`}>
        {active && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className={`text-sm flex-1 truncate ${active ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs tabular-nums text-gray-400 font-medium">{count}</span>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

function getDateParams(preset: string): { joinedAfter?: string; joinedBefore?: string } {
  if (!preset) return {};
  const now = new Date();
  if (preset === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); return { joinedAfter: d.toISOString().slice(0, 10) }; }
  if (preset === 'month') return { joinedAfter: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01` };
  if (preset === '3months') { const d = new Date(now); d.setMonth(d.getMonth() - 3); return { joinedAfter: d.toISOString().slice(0, 10) }; }
  if (preset === 'year') return { joinedAfter: `${now.getFullYear()}-01-01` };
  return {};
}

function getAgeParams(preset: string): { minAge?: string; maxAge?: string } {
  if (preset === '18-25') return { minAge: '18', maxAge: '25' };
  if (preset === '26-35') return { minAge: '26', maxAge: '35' };
  if (preset === '36-45') return { minAge: '36', maxAge: '45' };
  if (preset === '46+')   return { minAge: '46' };
  return {};
}

export default function UyelerPage() {
  const router = useRouter();
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode]   = useState<'card' | 'list'>('list');

  // Filters
  const [search, setSearch]         = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy]         = useState('newest');
  const [workStatusFilter, setWorkStatusFilter] = useState('');
  const [datePreset, setDatePreset]             = useState('');
  const [agePreset, setAgePreset]               = useState('');
  const [professionSearch, setProfessionSearch] = useState('');
  const [educationFilter, setEducationFilter]   = useState('');
  const [departmanSearch, setDepartmanSearch]   = useState('');
  const [universiteSearch, setUniversiteSearch] = useState('');

  const [stats, setStats]         = useState<{ total: number; active: number; expired: number; expiringSoon: number } | null>(null);
  const [subMap, setSubMap]       = useState<Record<string, MemberSub>>({});
  const [showFeeModal, setShowFeeModal]   = useState(false);
  const [showOverflow, setShowOverflow]   = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy]   = useState(false);
  const [toast, setToast]         = useState('');
  const [messageTarget, setMessageTarget] = useState<
    { type: 'single'; userId: string; displayName: string } | { type: 'bulk'; ids: string[] } | null
  >(null);

  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.all([
      adminApi.getMembershipStats().catch(() => null),
      adminApi.listMembershipSubscriptions({ limit: 500 }).catch(() => null),
      adminApi.getOnlineUsers().catch(() => null),
    ]).then(([s, subs, online]) => {
      if (s) setStats(s);
      if (subs) {
        const map: Record<string, MemberSub> = {};
        for (const sub of subs) {
          const uid = sub.user?.id;
          if (!uid) continue;
          const ex = map[uid];
          if (!ex || new Date(sub.createdAt) > new Date(ex.createdAt)) map[uid] = sub;
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

  // Close overflow on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) setShowOverflow(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true); setError('');
    adminApi.listUsers({
      memberOnly: 'true' as const,
      limit: '500',
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(tierFilter ? { tier: tierFilter } : {}),
      ...(cityFilter ? { city: cityFilter } : {}),
      ...(sortBy !== 'newest' ? { sortBy } : {}),
      ...(workStatusFilter ? { workStatus: workStatusFilter } : {}),
      ...getDateParams(datePreset),
      ...getAgeParams(agePreset),
    })
      .then(r => setUsers(r.data))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, tierFilter, cityFilter, sortBy, workStatusFilter, datePreset, agePreset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived stats
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const buAyKatilan = users.filter(u => new Date(u.createdAt) >= firstOfMonth).length;
  const sehirSayisi = new Set(users.map(u => u.city).filter(Boolean)).size;

  const tierCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of users) { c[u.membershipTier] = (c[u.membershipTier] ?? 0) + 1; }
    return c;
  }, [users]);

  const filteredUsers = useMemo(() => {
    let r = users;
    if (professionSearch) {
      const lc = professionSearch.toLowerCase();
      r = r.filter(u => u.profession?.toLowerCase().includes(lc));
    }
    if (educationFilter) {
      r = r.filter(u => u.skillTags.some(t => t.toLowerCase().includes(educationFilter)));
    }
    if (departmanSearch) {
      const lc = departmanSearch.toLowerCase();
      r = r.filter(u => u.skillTags.some(t => t.toLowerCase().includes(lc)));
    }
    if (universiteSearch) {
      const lc = universiteSearch.toLowerCase();
      r = r.filter(u => u.skillTags.some(t => t.toLowerCase().includes(lc)));
    }
    return r;
  }, [users, professionSearch, educationFilter, departmanSearch, universiteSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pages.push(p);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  function clearFilters() {
    setTierFilter(''); setCityFilter(''); setSortBy('newest');
    setWorkStatusFilter(''); setDatePreset(''); setAgePreset('');
    setProfessionSearch(''); setEducationFilter(''); setDepartmanSearch(''); setUniversiteSearch('');
    setLevelFilter('');
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function toggleSelectAll() {
    const ids = pagedUsers.map(u => u.id);
    const allSel = ids.every(id => selectedIds.has(id));
    setSelectedIds(allSel ? new Set() : new Set(ids));
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function exportCsv(rows: AdminUser[]) {
    const header = ['Üye No','Ad Soyad','E-posta','Tier','Şehir / Kurum','Katılım'];
    const data = rows.map(u => [
      subMap[u.id]?.memberNumber ?? '', u.displayName ?? '', u.email,
      TIER_CONFIG[u.membershipTier]?.label ?? u.membershipTier,
      u.corporateName ?? u.city ?? '',
      new Date(u.createdAt).toLocaleDateString('tr-TR'),
    ]);
    const csv = '﻿' + [header, ...data].map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `uyeler-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  async function handleBulkStatus(status: string) {
    if (selectedIds.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    const results = await Promise.allSettled([...selectedIds].map(id => adminApi.updateUserStatus(id, status)));
    const ok = results.filter(r => r.status === 'fulfilled').length;
    setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, status } : u));
    setSelectedIds(new Set()); setBulkBusy(false);
    showToast(`${ok} üye güncellendi`);
  }

  const hasFilter = !!(tierFilter || cityFilter || sortBy !== 'newest' || workStatusFilter || datePreset || agePreset || professionSearch || educationFilter || departmanSearch || universiteSearch);

  const allSelected = pagedUsers.length > 0 && pagedUsers.every(u => selectedIds.has(u.id));
  const someSelected = pagedUsers.some(u => selectedIds.has(u.id));

  return (
    <div className="flex flex-col h-full min-h-0 relative overflow-hidden" style={{
      maxWidth: '1500px', margin: '0 auto', borderRadius: '20px', overflow: 'hidden',
      backgroundColor: '#ffffff',
      backgroundImage: 'linear-gradient(180deg, #deeaf8 0%, #eaf1fb 20%, #f5f7fd 60%, #ffffff 100%)',
      backgroundSize: '100% 260px',
      backgroundRepeat: 'no-repeat',
    }}>


      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-5 pb-5 md:px-8 md:pt-9 md:pb-8" style={{ position: 'relative', zIndex: 2 }}>

        {/* Title + Actions row */}
        <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center md:justify-between md:mb-8">

          {/* Title group */}
          <div className="flex items-center gap-3">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.88)', boxShadow: '0 8px 18px rgba(15,23,42,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900" style={{ margin: 0, letterSpacing: '-0.02em' }}>Üye Paneli</h1>
              <p className="text-xs md:text-[13px] text-slate-500 mt-1">Üyelerinizi yönetin ve takip edin</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex-1 md:flex-none md:w-[280px]" style={{ height: '40px', borderRadius: '12px', border: '1px solid rgba(203,213,225,0.78)', background: 'rgba(255,255,255,0.90)', boxShadow: '0 6px 16px rgba(15,23,42,0.09)', padding: '0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="search" placeholder="İsim veya e-posta ara..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ border: 0, outline: 0, background: 'transparent', width: '100%', fontSize: '13px', color: '#334155' }} />
            </div>
            {/* Filter toggle — mobile only */}
            <button onClick={() => setShowMobileFilter(v => !v)} className="md:hidden" style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, border: '1px solid rgba(203,213,225,0.72)', background: showMobileFilter ? 'linear-gradient(135deg,#19456f,#183b63)' : 'rgba(255,255,255,0.88)', color: showMobileFilter ? '#fff' : '#64748b', boxShadow: '0 6px 14px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18l-7 8.5V19l-4-2v-4.5L3 4z" /></svg>
            </button>
            <button onClick={() => setViewMode('list')} title="Liste görünümü" style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, border: '1px solid rgba(203,213,225,0.72)', background: viewMode === 'list' ? 'linear-gradient(135deg,#19456f,#183b63)' : 'rgba(255,255,255,0.88)', color: viewMode === 'list' ? '#fff' : '#64748b', boxShadow: '0 6px 14px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button onClick={() => setViewMode('card')} title="Kart görünümü" style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, border: '1px solid rgba(203,213,225,0.72)', background: viewMode === 'card' ? 'linear-gradient(135deg,#19456f,#183b63)' : 'rgba(255,255,255,0.88)', color: viewMode === 'card' ? '#fff' : '#64748b', boxShadow: '0 6px 14px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
            <div className="relative" ref={overflowRef}>
              <button onClick={() => setShowOverflow(v => !v)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(203,213,225,0.72)', background: 'rgba(255,255,255,0.88)', color: '#64748b', boxShadow: '0 6px 14px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>
              </button>
              {showOverflow && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl ring-1 ring-gray-100 py-1.5 text-sm" style={{ zIndex: 50 }}>
                  <button onClick={() => { exportCsv(users); setShowOverflow(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">CSV İndir</button>
                  <Link href="/istatistikler" className="block px-4 py-2 hover:bg-gray-50 text-gray-700">İstatistikler</Link>
                  <button onClick={() => { setShowFeeModal(true); setShowOverflow(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">Ücret Ayarları</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div style={{ height: '88px', borderRadius: '14px', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(226,232,240,0.72)', boxShadow: '0 6px 16px rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', overflow: 'hidden' }}>
            <div style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '50%', background: '#eaf3ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px', whiteSpace: 'nowrap' }}>Toplam Üye</p><p style={{ fontSize: '24px', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.03em', color: '#2563eb' }}>{stats?.total ?? users.length}</p><p style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>Kayıtlı üyeler</p></div>
          </div>
          <div style={{ height: '88px', borderRadius: '14px', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(226,232,240,0.72)', boxShadow: '0 6px 16px rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', overflow: 'hidden' }}>
            <div style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '50%', background: '#e9fbf3', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px', whiteSpace: 'nowrap' }}>Bu Ay Katılan</p><p style={{ fontSize: '24px', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.03em', color: '#10b981' }}>{buAyKatilan}</p><p style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>Yeni üyeler</p></div>
          </div>
          <div style={{ height: '88px', borderRadius: '14px', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(226,232,240,0.72)', boxShadow: '0 6px 16px rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', overflow: 'hidden' }}>
            <div style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '50%', background: '#fff3e8', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px', whiteSpace: 'nowrap' }}>Aktif Üyelik</p><p style={{ fontSize: '24px', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.03em', color: '#f97316' }}>{stats?.active ?? 0}</p><p style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>Aktif üyeler</p></div>
          </div>
          <div style={{ height: '88px', borderRadius: '14px', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(226,232,240,0.72)', boxShadow: '0 6px 16px rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', overflow: 'hidden' }}>
            <div style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '50%', background: '#f4eafe', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px', whiteSpace: 'nowrap' }}>Şehir Sayısı</p><p style={{ fontSize: '24px', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.03em', color: '#9333ea' }}>{sehirSayisi}</p><p style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>Farklı şehirlerden</p></div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: '0 16px 40px' }}>
        <div className="flex flex-col md:grid gap-4" style={{ gridTemplateColumns: '220px minmax(0,1fr)', alignItems: 'start' }}>

        {/* ── Filtre kartı ─────────────────────────────────────────────────── */}
        <div className={`flex-col ${showMobileFilter ? 'flex' : 'hidden'} md:flex`} style={{ background: 'rgba(255,255,255,0.96)', borderRadius: '22px', overflow: 'hidden', border: '1px solid rgba(226,232,240,0.92)', boxShadow: '0 14px 34px rgba(15,23,42,0.08)' }}>

          {/* Header */}
          <div className="px-4 pt-4 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18l-7 8.5V19l-4-2v-4.5L3 4z" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-700">Filtreler</h2>
            </div>
            <button onClick={clearFilters} className="text-xs text-blue-500 font-semibold hover:text-blue-600 transition-colors">
              Temizle
            </button>
          </div>

          {/* Filter body */}
          <div>

          {/* Sort */}
          <FilterGroup title="Sıralama">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-gray-200 text-sm px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 bg-white text-gray-700">
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="name">İsme Göre</option>
              <option value="lastLogin">Son Giriş</option>
            </select>
          </FilterGroup>

          <FilterGroup title="Üyelik Tipi">
            {[
              { value: '', label: 'Tümü' },
              { value: 'haritailesi_genc',    label: 'Haritailesi Genç' },
              { value: 'new_graduate_member', label: 'Mesleğin Geleceği' },
              { value: 'individual_member',   label: 'Değer Ortağı' },
              { value: 'corporate_member',    label: 'Kurumsal' },
            ].map(opt => (
              <FilterOption key={opt.value} active={tierFilter === opt.value}
                label={opt.label}
                count={opt.value === '' ? users.length : (tierCounts[opt.value] ?? 0)}
                onClick={() => setTierFilter(opt.value === tierFilter ? '' : opt.value)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Şehir">
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 text-sm px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 bg-white text-gray-700">
              <option value="">Tüm Şehirler</option>
              {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FilterGroup>

          <FilterGroup title="Katılım Tarihi" defaultOpen={true}>
            {[
              { value: '',        label: 'Tümü' },
              { value: 'week',    label: 'Son 7 Gün' },
              { value: 'month',   label: 'Bu Ay' },
              { value: '3months', label: 'Son 3 Ay' },
              { value: 'year',    label: 'Bu Yıl' },
            ].map(opt => (
              <FilterOption key={opt.value} active={datePreset === opt.value}
                label={opt.label}
                onClick={() => setDatePreset(opt.value === datePreset ? '' : opt.value)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Çalışma Durumu" defaultOpen={false}>
            {[
              { value: '',              label: 'Tümü' },
              { value: 'employed',      label: 'Çalışıyor' },
              { value: 'self_employed', label: 'Serbest Meslek' },
              { value: 'student',       label: 'Öğrenci' },
              { value: 'unemployed',    label: 'İş Arıyor' },
              { value: 'retired',       label: 'Emekli' },
            ].map(opt => (
              <FilterOption key={opt.value} active={workStatusFilter === opt.value}
                label={opt.label}
                onClick={() => setWorkStatusFilter(opt.value === workStatusFilter ? '' : opt.value)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Yaş" defaultOpen={false}>
            {[
              { value: '',      label: 'Tümü' },
              { value: '18-25', label: '18–25 yaş' },
              { value: '26-35', label: '26–35 yaş' },
              { value: '36-45', label: '36–45 yaş' },
              { value: '46+',   label: '46+ yaş' },
            ].map(opt => (
              <FilterOption key={opt.value} active={agePreset === opt.value}
                label={opt.label}
                onClick={() => setAgePreset(opt.value === agePreset ? '' : opt.value)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Meslek" defaultOpen={true}>
            <input
              type="text"
              value={professionSearch}
              onChange={e => setProfessionSearch(e.target.value)}
              placeholder="Meslek ara…"
              className="w-full rounded-lg border border-gray-200 text-sm px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 bg-white text-gray-700 placeholder-gray-400"
            />
          </FilterGroup>

          <FilterGroup title="Eğitim" defaultOpen={false}>
            {[
              { value: '',              label: 'Tümü' },
              { value: 'onlisans',      label: 'Önlisans' },
              { value: 'lisans',        label: 'Lisans' },
              { value: 'yuksek_lisans', label: 'Yüksek Lisans' },
              { value: 'doktora',       label: 'Doktora' },
            ].map(opt => (
              <FilterOption key={opt.value} active={educationFilter === opt.value}
                label={opt.label}
                onClick={() => setEducationFilter(opt.value === educationFilter ? '' : opt.value)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Bölüm" defaultOpen={false}>
            <input
              type="text"
              value={departmanSearch}
              onChange={e => setDepartmanSearch(e.target.value)}
              placeholder="Bölüm ara…"
              className="w-full rounded-lg border border-gray-200 text-sm px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 bg-white text-gray-700 placeholder-gray-400"
            />
          </FilterGroup>

          <FilterGroup title="Üniversite" defaultOpen={true}>
            <input
              type="text"
              value={universiteSearch}
              onChange={e => setUniversiteSearch(e.target.value)}
              placeholder="Üniversite ara…"
              className="w-full rounded-lg border border-gray-200 text-sm px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 bg-white text-gray-700 placeholder-gray-400"
            />
          </FilterGroup>

          </div>{/* end scrollable */}
        </div>

        {/* ── Tablo kartı ──────────────────────────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: '22px', overflow: 'hidden', border: '1px solid rgba(226,232,240,0.92)', boxShadow: '0 14px 34px rgba(15,23,42,0.08)' }}>
          {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

          {/* ── List view ─────────────────────────────────────────────────── */}
          {viewMode === 'list' && (
            <div>
              <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '36px' }} />
                  <col className="hidden sm:table-column" style={{ width: '112px' }} />
                  <col />
                  <col style={{ width: '128px' }} />
                  <col className="hidden md:table-column" style={{ width: '100px' }} />
                  <col className="hidden lg:table-column" style={{ width: '108px' }} />
                  <col style={{ width: '48px' }} />
                </colgroup>
                <thead style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <tr style={{ height: '56px' }}>
                    <th className="pl-4 pr-2 md:pl-6 md:pr-3 text-left w-8 md:w-10">
                      <input type="checkbox" checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]" />
                    </th>
                    <th className="hidden sm:table-cell px-4 text-[13px] font-bold text-[#64748b] text-left tracking-wide">Üye No</th>
                    <th className="px-4 text-[13px] font-bold text-[#64748b] text-left tracking-wide w-56">Adı Soyadı</th>
                    <th className="px-4 text-[13px] font-bold text-[#64748b] text-left tracking-wide w-40">Üyelik Tipi</th>
                    <th className="hidden md:table-cell px-4 text-[13px] font-bold text-[#64748b] text-left tracking-wide w-28">Şehir</th>
                    <th className="hidden lg:table-cell px-4 text-xs font-bold text-[#64748b] text-left tracking-wide whitespace-nowrap w-32">
                      <span className="flex items-center gap-1">Katılım
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </th>
                    <th className="px-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eef2f7' }} className="animate-pulse">
                          <td className="pl-6 pr-3 py-3" />
                          <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-14" /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
                              <div className="space-y-1.5"><div className="h-3 bg-gray-200 rounded w-28" /><div className="h-2.5 bg-gray-100 rounded w-36" /></div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3"><div className="h-3 bg-gray-100 rounded w-20" /></td>
                          <td className="hidden md:table-cell px-4 py-3"><div className="h-3 bg-gray-100 rounded w-16" /></td>
                          <td className="hidden lg:table-cell px-4 py-3"><div className="h-3 bg-gray-100 rounded w-16" /></td>
                          <td />
                        </tr>
                      ))
                    : pagedUsers.map(u => (
                        <MemberRow key={u.id} u={u}
                          onClick={() => router.push(`/uyeler/${u.id}`)}
                          isOnline={onlineIds.has(u.id)}
                          selected={selectedIds.has(u.id)}
                          onSelect={toggleSelect}
                          onEdit={() => router.push(`/uyeler/${u.id}/duzenle`)}
                          onDelete={() => { if (confirm(`${u.displayName ?? u.email} silinsin mi?`)) void adminApi.deleteUser(u.id).then(() => setUsers(p => p.filter(x => x.id !== u.id))); }}
                          onMessage={() => setMessageTarget({ type: 'single', userId: u.id, displayName: u.displayName ?? u.email })}
                          {...(subMap[u.id] ? { sub: subMap[u.id] } : {})}
                        />
                      ))
                  }
                </tbody>
              </table>

              {!loading && users.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-sm font-medium text-gray-500">Kullanıcı bulunamadı</p>
                  <p className="text-xs mt-1">Filtreleri değiştirmeyi deneyin</p>
                </div>
              )}

              {/* Pagination */}
              {!loading && users.length > 0 && (
                <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: '#eef2f7' }}>
                  <p className="text-sm text-gray-400 font-medium">Toplam <span className="font-semibold text-gray-600">{filteredUsers.length}</span> üye</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {getPageNumbers().map((p, i) =>
                      p === '...'
                        ? <span key={`e${i}`} className="px-1 text-xs text-gray-300">…</span>
                        : <button key={p} onClick={() => setCurrentPage(p)}
                            className={`min-w-[2rem] h-8 rounded-lg text-xs font-medium transition-colors ${currentPage === p ? 'bg-[#26496b] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                            {p}
                          </button>
                    )}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Card view ─────────────────────────────────────────────────── */}
          {viewMode === 'card' && (
            <div className="p-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2.5 bg-gray-100 rounded w-full" /></div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-4" />
                      <div className="pt-3 border-t border-gray-50 flex justify-between"><div className="h-5 bg-gray-100 rounded-md w-24" /><div className="h-3 bg-gray-100 rounded w-16" /></div>
                    </div>
                  ))}
                </div>
              ) : pagedUsers.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-sm font-medium text-gray-500">Kullanıcı bulunamadı</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pagedUsers.map(u => (
                    <MemberCard key={u.id} u={u}
                      onClick={() => router.push(`/uyeler/${u.id}`)}
                      isOnline={onlineIds.has(u.id)}
                      {...(subMap[u.id] ? { sub: subMap[u.id] } : {})}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── Bulk bar ─────────────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl">
          <span className="text-sm font-medium">{selectedIds.size} üye</span>
          <div className="w-px h-4 bg-white/20" />
          <button onClick={() => {
            const emails = users.filter(u => selectedIds.has(u.id)).map(u => u.email).join(', ');
            void navigator.clipboard.writeText(emails);
            showToast(`${selectedIds.size} e-posta kopyalandı`);
          }} className="text-xs font-medium px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            E-postaları kopyala
          </button>
          <button onClick={() => exportCsv(users.filter(u => selectedIds.has(u.id)))}
            className="text-xs font-medium px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            CSV İndir
          </button>
          <button onClick={() => setMessageTarget({ type: 'bulk', ids: [...selectedIds] })}
            className="text-xs font-medium px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            Mesaj Gönder
          </button>
          <div className="w-px h-4 bg-white/20" />
          <button disabled={bulkBusy} onClick={() => void handleBulkStatus('active')}
            className="text-xs font-medium px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-40">
            {bulkBusy ? '…' : 'Aktif Yap'}
          </button>
          <button disabled={bulkBusy} onClick={() => void handleBulkStatus('passive')}
            className="text-xs font-medium px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-40">
            {bulkBusy ? '…' : 'Pasif Yap'}
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="text-white/40 hover:text-white text-lg leading-none ml-1 transition-colors">×</button>
        </div>
      )}

      {showFeeModal && <FeeConfigModal onClose={() => setShowFeeModal(false)} />}

      {messageTarget && (
        <DirectMessageModal
          target={messageTarget}
          onClose={() => setMessageTarget(null)}
          onSuccess={(msg) => { setMessageTarget(null); showToast(msg); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
