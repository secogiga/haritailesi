'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { adminApi, getCurrentUserRoles, type PaymentRow, type PaymentSummary, type TimelineEvent } from '@/lib/api';
import { fmtDate, fmtDateTime, fmtTL } from '@/lib/ui';
import { hasPermission, Perm } from '@/lib/permissions';
import { RowMenu } from '@/components/RowMenu';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:              { label: 'Bekliyor',           cls: 'bg-yellow-100 text-yellow-800' },
  reminded:             { label: 'Hatırlatıldı',       cls: 'bg-orange-100 text-orange-800' },
  waiting_verification: { label: 'Dekont Bekleniyor',  cls: 'bg-blue-100 text-blue-800' },
  verified:             { label: 'Doğrulandı',         cls: 'bg-green-100 text-green-800' },
  failed:               { label: 'Başarısız',          cls: 'bg-red-100 text-red-800' },
  waived:               { label: 'Muaf',               cls: 'bg-purple-100 text-purple-800' },
  expired:              { label: 'Süresi Doldu',       cls: 'bg-gray-100 text-gray-500' },
};

const TIER_LABELS: Record<string, string> = {
  individual_member:    'Bireysel',
  new_graduate_member:  'Yeni Mezun',
  haritailesi_genc:     'HG',
  corporate_member:     'Kurumsal',
  visitor:              'Ziyaretçi',
  registered_user:      'Kayıtlı',
};

const TYPE_LABELS: Record<string, string> = {
  individual:  'Bireysel',
  corporate:   'Kurumsal',
  genc:        'Haritailesi Genç',
  new_graduate:'Yeni Mezun',
};

const STATE_LABELS: Record<string, string> = {
  submitted:           'Gönderildi',
  under_review:        'İncelemede',
  interview_needed:    'Mülakat Bekleniyor',
  approved:            'Onaylandı',
  rejected:            'Reddedildi',
  waiting_payment:     'Ödeme Bekleniyor',
  waiting_verification:'Doğrulama Bekleniyor',
  active:              'Aktif',
  cancelled:           'İptal Edildi',
};

// ─── KPI cards config ─────────────────────────────────────────────────────────

const PAYMENT_GRID = 'grid grid-cols-[minmax(220px,1.3fr)_120px_90px_120px_120px_110px_32px] items-center';

const KPI_CARDS: Array<{
  key: keyof PaymentSummary;
  label: string;
  accent: string;
  currency?: boolean;
  icon: React.ReactNode;
}> = [
  {
    key: 'pendingPayments', label: 'Bekleyen', accent: 'bg-amber-400',
    icon: <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" /></svg>,
  },
  {
    key: 'overduePayments', label: 'Gecikmiş', accent: 'bg-red-500',
    icon: <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>,
  },
  {
    key: 'waitingVerification', label: 'Dekont Bekleyen', accent: 'bg-blue-500',
    icon: <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    key: 'totalVerifiedAmountKurus', label: 'Bu Ay Tahsilat', accent: 'bg-emerald-500', currency: true,
    icon: <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    key: 'verifiedThisMonth', label: 'Bu Ay Doğrulanan', accent: 'bg-teal-500',
    icon: <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function translateTitle(title: string): string {
  return title
    .replace(/\s*\([a-z_]+\)\s*$/, '')
    .replace(
      /\b(submitted|under_review|interview_needed|approved|rejected|waiting_payment|waiting_verification|active|cancelled)\b/g,
      m => STATE_LABELS[m] ?? m,
    );
}

function isOverdue(row: PaymentRow): boolean {
  if (!row.paymentDueAt) return false;
  if (!['pending', 'reminded'].includes(row.paymentStatus)) return false;
  return new Date(row.paymentDueAt) <= new Date();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function ActionBtn({
  label, onClick, disabled, disabledReason, variant = 'default',
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  variant?: 'default' | 'danger' | 'warning';
}) {
  const base = 'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors';
  const variants = {
    default: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    danger:  'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100',
    warning: 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100',
  };
  if (disabled) {
    return (
      <button
        disabled
        title={disabledReason ?? 'Bu işlem için yetkiniz yok'}
        className={`${base} opacity-40 cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400`}
      >
        {label}
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OdemelerPage() {
  // ─── Auth ───────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const roles = useMemo(() => getCurrentUserRoles(), []);
  const canView       = useMemo(() => hasPermission(roles, Perm.PAYMENT_VIEW), [roles]);
  const canRemind     = useMemo(() => hasPermission(roles, Perm.PAYMENT_REMIND), [roles]);
  const canExtend     = useMemo(() => hasPermission(roles, Perm.PAYMENT_EXTEND_DUE_DATE), [roles]);
  const canFail       = useMemo(() => hasPermission(roles, Perm.PAYMENT_FAIL), [roles]);
  const canRevoke     = useMemo(() => hasPermission(roles, Perm.PAYMENT_REVOKE_WAIVER), [roles]);

  // ─── Data ───────────────────────────────────────────────────────────────────
  const [summary, setSummary]     = useState<PaymentSummary | null>(null);
  const [payments, setPayments]   = useState<PaymentRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [cursor, setCursor]       = useState<string | null>(null);
  const [hasMore, setHasMore]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ─── Filters ────────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter]       = useState('');
  const [tierFilter, setTierFilter]           = useState('');
  const [overdueOnly, setOverdueOnly]         = useState(false);
  const [waivedOnly, setWaivedOnly]           = useState(false);
  const [proofPending, setProofPending]       = useState(false);
  const [fromDate, setFromDate]               = useState('');
  const [toDate, setToDate]                   = useState('');

  // ─── Drawer ─────────────────────────────────────────────────────────────────
  const [selected, setSelected]       = useState<PaymentRow | null>(null);
  const [drawerTab, setDrawerTab]     = useState<'detay' | 'timeline'>('detay');
  const [timeline, setTimeline]       = useState<TimelineEvent[] | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // ─── Modals ─────────────────────────────────────────────────────────────────
  const [showExtend, setShowExtend]   = useState(false);
  const [extendDays, setExtendDays]   = useState(7);
  const [showFail, setShowFail]       = useState(false);
  const [failReason, setFailReason]   = useState('');
  const [showRevoke, setShowRevoke]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Build params ────────────────────────────────────────────────────────────
  const buildParams = useCallback(() => ({
    ...(statusFilter  ? { status: statusFilter }       : {}),
    ...(tierFilter    ? { tier: tierFilter }            : {}),
    ...(overdueOnly   ? { overdue: 'true' }             : {}),
    ...(waivedOnly    ? { waived: 'true' }              : {}),
    ...(proofPending  ? { proofPending: 'true' }        : {}),
    ...(fromDate      ? { from: fromDate }              : {}),
    ...(toDate        ? { to: toDate }                  : {}),
  }), [statusFilter, tierFilter, overdueOnly, waivedOnly, proofPending, fromDate, toDate]);

  // ─── Load data ───────────────────────────────────────────────────────────────
  const load = useCallback(async (reset = false) => {
    if (!canView) { setLoading(false); return; }
    try {
      if (reset) setLoading(true);
      const [summaryRes, listRes] = await Promise.all([
        reset ? adminApi.getPaymentSummary() : Promise.resolve(null),
        adminApi.listPayments(reset ? buildParams() : { ...buildParams(), ...(cursor ? { cursor } : {}) }),
      ]);
      if (summaryRes) setSummary(summaryRes);
      setPayments(prev => reset ? listRes.data : [...prev, ...listRes.data]);
      setCursor(listRes.next_cursor);
      setHasMore(listRes.has_more);
    } catch (e) {
      showToast((e as Error).message, false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [canView, buildParams, cursor, showToast]);

  // initial load
  useEffect(() => { void load(true); }, [statusFilter, tierFilter, overdueOnly, waivedOnly, proofPending, fromDate, toDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Timeline ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected || drawerTab !== 'timeline') return;
    setTimeline(null);
    setTimelineLoading(true);
    adminApi.getTimeline(selected.id)
      .then(data => setTimeline(data))
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoading(false));
  }, [selected, drawerTab]);

  // ─── Refresh selected row after action ───────────────────────────────────────
  const refreshPayments = useCallback(async () => {
    const [summaryRes, listRes] = await Promise.all([
      adminApi.getPaymentSummary(),
      adminApi.listPayments(buildParams()),
    ]);
    setSummary(summaryRes);
    setPayments(listRes.data);
    setCursor(listRes.next_cursor);
    setHasMore(listRes.has_more);
    if (selected) {
      const updated = listRes.data.find(p => p.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [buildParams, selected]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async function doAction(fn: () => Promise<unknown>, successMsg: string) {
    setActionLoading(true);
    try {
      await fn();
      showToast(successMsg);
      await refreshPayments();
    } catch (e) {
      showToast((e as Error).message, false);
    } finally {
      setActionLoading(false);
    }
  }

  const handleRemind = () => doAction(
    () => adminApi.resendPaymentReminder(selected!.id),
    'Hatırlatma e-postası gönderildi.',
  );

  const handleExtend = () => doAction(
    () => adminApi.extendPaymentDueDate(selected!.id, extendDays),
    `Vade ${extendDays} gün uzatıldı.`,
  ).then(() => { setShowExtend(false); setExtendDays(7); });

  const handleFail = () => {
    if (!failReason.trim()) return;
    doAction(
      () => adminApi.markPaymentFailed(selected!.id, failReason.trim()),
      'Ödeme başarısız olarak işaretlendi.',
    ).then(() => { setShowFail(false); setFailReason(''); });
  };

  const handleRevoke = () => doAction(
    () => adminApi.revokeWaiver(selected!.id),
    'Muafiyet geri alındı, ödeme yeniden bekleniyor.',
  ).then(() => setShowRevoke(false));

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (!mounted) return <div className="flex flex-col h-full min-h-0 min-w-0 w-full" />;

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Bu sayfayı görüntülemek için yetkiniz yok.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="px-8 pt-10 pb-0">
          <div className="flex items-center justify-between mb-5 mt-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Ödemeler</h1>
            </div>
          </div>

          {/* KPI cards */}
          {loading && !summary ? (
            <div className="grid grid-cols-5 gap-3 pb-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[72px] rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-5 gap-3 pb-5">
              {KPI_CARDS.map(card => (
                <div key={card.key} className="bg-white rounded-xl border border-gray-200 flex overflow-hidden">
                  <div className={`w-1 shrink-0 ${card.accent}`} />
                  <div className="px-4 py-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {card.icon}
                      <span className="text-xs text-slate-500 truncate">{card.label}</span>
                    </div>
                    <span className="text-xl font-bold tabular-nums text-slate-900 leading-none">
                      {card.currency
                        ? fmtTL(summary[card.key] as number)
                        : (summary[card.key] as number).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 min-w-0 bg-white">

        {/* ── Filter sidebar ─────────────────────────────────────────────── */}
        <div className="shrink-0 p-5 pr-0 self-start" style={{ width: '248px' }}>
        <aside className="rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col">

          {/* Header */}
          <div className="px-4 pt-4 pb-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18l-7 8.5V19l-4-2v-4.5L3 4z" />
              </svg>
              <h2 className="text-sm font-semibold text-gray-700">Filtreler</h2>
            </div>
            <button
              onClick={() => { setStatusFilter(''); setTierFilter(''); setOverdueOnly(false); setWaivedOnly(false); setProofPending(false); setFromDate(''); setToDate(''); }}
              className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              Temizle
            </button>
          </div>

          <div>
            <div className="px-4 py-4 space-y-5">

              {/* Status */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Ödeme Durumu</p>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 text-gray-700"
                >
                  <option value="">Tümü</option>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Tier */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Üyelik Tipi</p>
                <select
                  value={tierFilter}
                  onChange={e => setTierFilter(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 text-gray-700"
                >
                  <option value="">Tümü</option>
                  {Object.entries(TIER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Quick filters */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Hızlı Filtreler</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Yalnızca gecikmiş', value: overdueOnly, set: setOverdueOnly },
                    { label: 'Yalnızca muaf',     value: waivedOnly,  set: setWaivedOnly },
                    { label: 'Dekont bekleyen',   value: proofPending, set: setProofPending },
                  ].map(({ label, value, set }) => (
                    <label key={label} className="flex items-center gap-2.5 cursor-pointer group select-none">
                      <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                        value ? 'bg-[#26496b] border-[#26496b]' : 'border-gray-300 group-hover:border-gray-400'
                      }`}>
                        {value && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} className="sr-only" />
                      <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Tarih Aralığı</p>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 text-gray-700"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#26496b]/25 text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
          {loading ? (
            <div className="mx-8 my-5 rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              <div className={`${PAYMENT_GRID} px-6 py-4 border-b border-gray-100 bg-white text-xs font-semibold text-slate-400`}>
                <div>Üye</div><div>Durum</div><div>Tutar</div><div>Vade</div><div>Hatırlatma</div><div>Kayıt</div><div />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`${PAYMENT_GRID} px-6 py-4 border-b border-gray-50 animate-pulse`}>
                  <div className="space-y-2"><div className="h-3.5 bg-gray-200 rounded w-36" /><div className="h-3 bg-gray-100 rounded w-48" /></div>
                  <div className="h-5 bg-gray-100 rounded-full w-20" />
                  <div className="h-3.5 bg-gray-100 rounded w-14" />
                  <div className="h-3.5 bg-gray-100 rounded w-20" />
                  <div className="h-3.5 bg-gray-100 rounded w-8" />
                  <div className="h-3.5 bg-gray-100 rounded w-20" />
                  <div />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="mx-8 my-5 rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center text-slate-400 text-sm">Kayıt bulunamadı.</div>
          ) : (
            <div className="mx-8 my-5 rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm min-w-0 max-w-full">

              {/* Grid header */}
              <div className={`${PAYMENT_GRID} px-6 py-4 border-b border-gray-100 bg-white text-xs font-semibold text-slate-400`}>
                <div>Üye</div>
                <div>Durum</div>
                <div>Tutar</div>
                <div>Vade</div>
                <div>Hatırlatma</div>
                <div>Kayıt</div>
                <div />
              </div>

              {/* Grid rows */}
              {payments.map(row => {
                const overdue = isOverdue(row);
                return (
                  <div key={row.id}
                    onClick={() => { setSelected(row); setDrawerTab('detay'); }}
                    className={`${PAYMENT_GRID} px-6 py-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-slate-50/70 ${
                      selected?.id === row.id ? 'bg-[#26496b]/5' : ''
                    }`}>

                    {/* Üye */}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{row.displayName ?? '—'}</div>
                      <div className="text-sm text-slate-400 truncate mt-0.5">{row.applicantEmail}</div>
                      {row.membershipTier && (
                        <div className="text-xs text-slate-400 mt-0.5">{TIER_LABELS[row.membershipTier] ?? row.membershipTier}</div>
                      )}
                    </div>

                    {/* Durum */}
                    <div><StatusBadge status={row.paymentStatus} /></div>

                    {/* Tutar */}
                    <div className="font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                      {row.paymentAmountKurus ? fmtTL(row.paymentAmountKurus) : <span className="text-slate-300 font-normal">—</span>}
                    </div>

                    {/* Vade */}
                    <div className={`text-sm tabular-nums whitespace-nowrap ${overdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                      {row.paymentDueAt
                        ? <>{overdue && <span className="mr-1">⚠</span>}{fmtDate(row.paymentDueAt)}</>
                        : <span className="text-slate-300">—</span>}
                    </div>

                    {/* Hatırlatma */}
                    <div className="text-sm text-slate-500 tabular-nums whitespace-nowrap">
                      {row.reminderCount > 0
                        ? <span title={row.lastReminderAt ? `Son: ${fmtDateTime(row.lastReminderAt)}` : undefined}>
                            {row.reminderCount}× {row.lastReminderAt && <span className="text-slate-400">{fmtDate(row.lastReminderAt)}</span>}
                          </span>
                        : <span className="text-slate-300">—</span>}
                    </div>

                    {/* Kayıt */}
                    <div className="text-sm text-slate-500 tabular-nums whitespace-nowrap">{fmtDate(row.createdAt)}</div>

                    {/* Aksiyonlar */}
                    <div onClick={e => e.stopPropagation()}>
                      <RowMenu items={[
                        { label: 'Detay', onClick: () => { setSelected(row); setDrawerTab('detay'); } },
                        ...(['pending','reminded'].includes(row.paymentStatus) && canRemind
                          ? [{ label: 'Hatırlatma Gönder', onClick: () => { setSelected(row); void doAction(() => adminApi.resendPaymentReminder(row.id), 'Hatırlatma gönderildi.'); } }]
                          : []),
                        ...(['pending','reminded','waiting_verification'].includes(row.paymentStatus) && canExtend
                          ? [{ label: 'Vade Uzat', onClick: () => { setSelected(row); setShowExtend(true); } }]
                          : []),
                        ...(['pending','reminded','waiting_verification'].includes(row.paymentStatus) && canFail
                          ? [{ label: 'Başarısız İşaretle', onClick: () => { setSelected(row); setShowFail(true); }, danger: true }]
                          : []),
                      ]} />
                    </div>
                  </div>
                );
              })}

              {/* Load more */}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => { setLoadingMore(true); void load(false); }}
                    disabled={loadingMore}
                    className="px-6 py-2 text-sm text-slate-500 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white transition-colors"
                  >
                    {loadingMore ? 'Yükleniyor…' : 'Daha fazla göster'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelected(null)}
          />

          {/* Drawer */}
          <aside className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in-right">

            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {selected.displayName ?? selected.applicantEmail}
                </div>
                <div className="text-sm text-gray-400 truncate">{selected.applicantEmail}</div>
                {selected.membershipTier && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {TIER_LABELS[selected.membershipTier] ?? selected.membershipTier}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-5">
              {(['detay', 'timeline'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`py-3 mr-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                    drawerTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'detay' ? 'Detay' : 'Geçmiş'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Detay tab ─────────────────────────────────────────── */}
              {drawerTab === 'detay' && (
                <div className="p-5 space-y-5">

                  {/* Ödeme durumu */}
                  <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ödeme</span>
                      <StatusBadge status={selected.paymentStatus} />
                    </div>

                    {selected.paymentAmountKurus && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Tutar</span>
                        <span className="font-semibold text-gray-900">{fmtTL(selected.paymentAmountKurus)}</span>
                      </div>
                    )}

                    {selected.paymentDueAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Vade</span>
                        <span className={`font-medium ${isOverdue(selected) ? 'text-red-600' : 'text-gray-700'}`}>
                          {isOverdue(selected) && '⚠ '}{fmtDate(selected.paymentDueAt)}
                        </span>
                      </div>
                    )}

                    {selected.paymentDescription && (
                      <div className="text-sm">
                        <span className="text-gray-500 block mb-0.5">Açıklama</span>
                        <span className="text-gray-700">{selected.paymentDescription}</span>
                      </div>
                    )}

                    {selected.reminderCount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Hatırlatma</span>
                        <span className="text-gray-700">
                          {selected.reminderCount}× gönderildi
                          {selected.lastReminderAt && (
                            <span className="text-gray-400 text-xs ml-1">
                              (son: {fmtDate(selected.lastReminderAt)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Başvuru bilgileri */}
                  <div className="rounded-xl border border-gray-100 p-4 space-y-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Başvuru</span>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Tip</span>
                      <span className="text-gray-700">{TYPE_LABELS[selected.type] ?? selected.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Durum</span>
                      <span className="text-gray-700">{STATE_LABELS[selected.state] ?? selected.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Kayıt</span>
                      <span className="text-gray-700">{fmtDate(selected.createdAt)}</span>
                    </div>
                  </div>

                  {/* Aksiyonlar */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Aksiyonlar</span>
                    <div className="space-y-2">

                      {/* Hatırlat */}
                      {['pending', 'reminded'].includes(selected.paymentStatus) && (
                        <ActionBtn
                          label="📣 Hatırlatma Gönder"
                          onClick={handleRemind}
                          disabled={!canRemind || actionLoading}
                          disabledReason="payment.remind yetkisi gerekli"
                          variant="default"
                        />
                      )}

                      {/* Süre uzat */}
                      {['pending', 'reminded', 'waiting_verification'].includes(selected.paymentStatus) && (
                        <ActionBtn
                          label="📅 Vade Uzat"
                          onClick={() => setShowExtend(true)}
                          disabled={!canExtend || actionLoading}
                          disabledReason="payment.extend_due_date yetkisi gerekli"
                          variant="warning"
                        />
                      )}

                      {/* Başarısız işaretle */}
                      {['pending', 'reminded', 'waiting_verification'].includes(selected.paymentStatus) && (
                        <ActionBtn
                          label="❌ Başarısız İşaretle"
                          onClick={() => setShowFail(true)}
                          disabled={!canFail || actionLoading}
                          disabledReason="payment.fail yetkisi gerekli"
                          variant="danger"
                        />
                      )}

                      {/* Muafiyet geri al */}
                      {selected.paymentStatus === 'waived' && (
                        <ActionBtn
                          label="↩ Muafiyeti Geri Al"
                          onClick={() => setShowRevoke(true)}
                          disabled={!canRevoke || actionLoading}
                          disabledReason="payment.revoke_waiver yetkisi gerekli"
                          variant="danger"
                        />
                      )}
                    </div>
                  </div>

                  {/* Navigasyon linkleri */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Git</span>
                    <div className="space-y-2">
                      <Link
                        href={`/basvurular/${selected.id}`}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Başvuruya Git
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      {selected.applicantUserId && (
                        <Link
                          href={`/uyeler/${selected.applicantUserId}`}
                          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Üye Profiline Git
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}

                      <Link
                        href={`/bagislar?email=${encodeURIComponent(selected.applicantEmail)}`}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Bağış Kaydına Git
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Timeline tab ───────────────────────────────────────── */}
              {drawerTab === 'timeline' && (
                <div className="p-5">
                  {timelineLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                      ))}
                    </div>
                  ) : !timeline || timeline.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Geçmiş kaydı yok.</p>
                  ) : (
                    <ol className="relative border-l border-gray-200 space-y-4 pl-6">
                      {timeline.map(event => (
                        <li key={event.id} className="relative">
                          <span className="absolute -left-[25px] w-3 h-3 rounded-full border-2 border-white bg-blue-400 ring-1 ring-blue-200 top-1" />
                          <div className="text-xs text-gray-400 mb-0.5">{fmtDateTime(event.at)}</div>
                          <div className="text-sm font-medium text-gray-800">
                            {translateTitle(event.title)}
                          </div>
                          {event.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{event.description}</div>
                          )}
                          {event.actor && (
                            <div className="text-xs text-gray-400 mt-0.5">→ {event.actor}</div>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* ── Extend Due Date Modal ─────────────────────────────────────────── */}
      {showExtend && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vadeyi Uzat</h3>
            <label className="block text-sm text-gray-600 mb-2">Kaç gün uzatılsın?</label>
            <input
              type="number"
              min={1}
              max={90}
              value={extendDays}
              onChange={e => setExtendDays(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowExtend(false)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={() => void handleExtend()}
                disabled={actionLoading || extendDays < 1}
                className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'İşleniyor…' : `+${extendDays} Gün`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Failed Modal ─────────────────────────────────────────────── */}
      {showFail && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Başarısız İşaretle</h3>
            <p className="text-sm text-gray-500 mb-4">Bu işlem geri alınamaz.</p>
            <label className="block text-sm text-gray-600 mb-2">Sebep</label>
            <textarea
              rows={3}
              value={failReason}
              onChange={e => setFailReason(e.target.value)}
              placeholder="Ödeme başarısız sayılma sebebi…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowFail(false)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={() => void handleFail()}
                disabled={actionLoading || !failReason.trim()}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'İşleniyor…' : 'Başarısız İşaretle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Waiver Confirm ─────────────────────────────────────────── */}
      {showRevoke && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Muafiyeti Geri Al</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bu üyenin ödeme muafiyeti iptal edilecek ve ödeme yeniden beklenecek. Emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRevoke(false)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={() => void handleRevoke()}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'İşleniyor…' : 'Geri Al'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.ok ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}
    </div>
  );
}
