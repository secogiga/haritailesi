'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { fmtTL, fmtDate, fmtDateTime, getInitials } from '@/lib/ui';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Donation = {
  id: string;
  userId: string | null;
  email: string;
  fullName: string;
  amount: number;
  currency: string;
  type: string;
  method: string;
  paymentAccount: string | null;
  status: string;
  referenceCode: string;
  donationCategory: string | null;
  companyName: string | null;
  packageTier: string | null;
  notes: string | null;
  iyzicoPaymentId: string | null;
  proofKey: string | null;
  proofUploadedAt: string | null;
  createdAt: string;
  completedAt: string | null;
};

type Stats = {
  totalCompleted: number;
  totalAmount: number;
  pendingCount: number;
  thisMonthAmount: number;
};

// ─── Config ─────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; color: string; dot: string; tier?: string }> = {
  bireysel: { label: 'Bireysel Üyelik',  color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500',   tier: 'Mesleğin Değer Ortağı' },
  kurumsal: { label: 'Kurumsal Üyelik',  color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500', tier: 'Kurumsal Üye' },
  genc:     { label: 'Haritailesi Genç', color: 'bg-teal-100 text-teal-800',     dot: 'bg-teal-500',   tier: 'Haritailesi Genç' },
  mezun:    { label: 'Mesleğin Geleceği', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500', tier: 'Mesleğin Geleceği' },
  genel:    { label: 'Genel Bağış',      color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: 'Bekliyor',    color: 'text-amber-700 bg-amber-50 border border-amber-200',        dot: 'bg-amber-500' },
  completed: { label: 'Tamamlandı',  color: 'text-emerald-700 bg-emerald-50 border border-emerald-200',  dot: 'bg-emerald-500' },
  failed:    { label: 'Başarısız',   color: 'text-red-700 bg-red-50 border border-red-200',              dot: 'bg-red-500' },
  refunded:  { label: 'İade Edildi', color: 'text-gray-600 bg-gray-50 border border-gray-200',           dot: 'bg-gray-400' },
};

// ─── StatCard ────────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-2xl font-bold ${accent ?? 'text-gray-900'}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0">{icon}</div>
      </div>
    </div>
  );
}

// ─── ProofCell ───────────────────────────────────────────────────────────────────

function ProofCell({ donation, onProofUploaded }: { donation: Donation; onProofUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadErr('');
    try {
      await adminApi.uploadDonationProof(donation.id, file);
      onProofUploaded();
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function openProof() {
    try {
      const { url } = await adminApi.getDonationProofUrl(donation.id);
      window.open(url, '_blank');
    } catch { /* ignore */ }
  }

  if (donation.method === 'iyzico') {
    return (
      <div className="flex flex-col gap-1">
        {donation.iyzicoPaymentId ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-mono rounded-lg" title="iyzico Ödeme ID">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            {donation.iyzicoPaymentId.slice(0, 12)}…
          </span>
        ) : (
          <span className="text-[10px] text-gray-400 italic">ID bekleniyor</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {donation.proofKey ? (
        <button onClick={() => void openProof()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Belgeyi Gör
        </button>
      ) : null}
      <button onClick={() => fileRef.current?.click()} disabled={uploading}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
          donation.proofKey ? 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
        }`}
      >
        {uploading ? (
          <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Yükleniyor…</>
        ) : (
          <><svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          {donation.proofKey ? 'Güncelle' : 'Dekont Yükle'}</>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => void handleFile(e)} />
      {uploadErr && <p className="text-[10px] text-red-600">{uploadErr}</p>}
    </div>
  );
}

// ─── Confirm Modal ───────────────────────────────────────────────────────────────

function ConfirmModal({ donation, onConfirm, onCancel, processing }: {
  donation: Donation;
  onConfirm: () => void;
  onCancel: () => void;
  processing: boolean;
}) {
  const catCfg = CATEGORY_CONFIG[donation.donationCategory ?? 'genel'] ?? CATEGORY_CONFIG['genel']!;
  const isUyelik = ['bireysel', 'kurumsal', 'genc', 'mezun'].includes(donation.donationCategory ?? '');
  const hasProof = !!donation.proofKey;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#26496b] to-[#3a6a9b] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl">🏦</div>
            <div>
              <p className="text-white font-bold text-base">Ödeme Onayı</p>
              <p className="text-white/70 text-xs font-mono">{donation.referenceCode}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Kişi & Tutar */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="font-semibold text-gray-900">{donation.companyName ?? donation.fullName}</p>
              {donation.companyName && <p className="text-xs text-gray-500">{donation.fullName}</p>}
              <p className="text-xs text-gray-400">{donation.email}</p>
            </div>
            <p className="text-2xl font-bold text-[#26496b] tabular-nums">{fmtTL(donation.amount)}</p>
          </div>

          {/* Kategori */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${catCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dot}`} />
              {catCfg.label}
            </span>
            <span className="text-xs text-gray-400">{donation.paymentAccount === 'sirket' ? 'Şirket Hesabı' : 'Vakıf Hesabı'}</span>
          </div>

          {/* Üyelik aktivasyonu bildirimi */}
          {isUyelik && catCfg.tier && (
            <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-emerald-800">Üyelik otomatik aktive edilecek</p>
                <p className="text-xs text-emerald-700 mt-0.5">Onay sonrası <strong>{catCfg.tier}</strong> aboneliği (1 yıl) oluşturulacak</p>
              </div>
            </div>
          )}

          {/* Dekont uyarısı */}
          {!hasProof && donation.method === 'bank_transfer' && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-amber-800">Dekont yüklenmemiş</p>
                <p className="text-xs text-amber-700 mt-0.5">Ödeme kanıtı olmadan onaylıyorsunuz. Devam edilebilir ama önerilmez.</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} disabled={processing} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
            İptal
          </button>
          <button onClick={onConfirm} disabled={processing}
            className="flex-1 bg-emerald-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Onaylanıyor…</>
            ) : '✓ Evet, Onayla'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────────

function DetailDrawer({ donation, onClose, onProofUploaded }: {
  donation: Donation;
  onClose: () => void;
  onProofUploaded: () => void;
}) {
  const catCfg = CATEGORY_CONFIG[donation.donationCategory ?? 'genel'] ?? CATEGORY_CONFIG['genel']!;
  const statusCfg = STATUS_CONFIG[donation.status] ?? STATUS_CONFIG['pending']!;

  async function openProof() {
    try {
      const { url } = await adminApi.getDonationProofUrl(donation.id);
      window.open(url, '_blank');
    } catch { /* ignore */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Bağış Detayı</h2>
            <p className="text-[10px] font-mono text-gray-400 mt-0.5 select-all">{donation.referenceCode}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Person */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#26496b] to-[#3a6a9b] flex items-center justify-center text-white font-bold text-base shrink-0">
              {getInitials(donation.companyName ?? donation.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{donation.companyName ?? donation.fullName}</p>
              {donation.companyName && <p className="text-sm text-gray-500">{donation.fullName}</p>}
              <p className="text-sm text-gray-400">{donation.email}</p>
              {donation.userId && (
                <Link href={`/uyeler/${donation.userId}`}
                  className="inline-flex items-center gap-1 text-xs text-[#26496b] font-semibold mt-1 hover:underline"
                  target="_blank"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Üye profiline git →
                </Link>
              )}
            </div>
          </div>

          {/* Tutar + Kategori */}
          <div className="bg-[#26496b]/5 rounded-xl p-4 border border-[#26496b]/10">
            <p className="text-3xl font-bold text-[#26496b] tabular-nums mb-2">{fmtTL(donation.amount)}</p>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${catCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dot}`} />
                {catCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Bilgiler */}
          <div className="space-y-0 divide-y divide-gray-50 bg-white rounded-xl border border-gray-100 overflow-hidden">
            {[
              { label: 'Ödeme Yöntemi', value: donation.method === 'iyzico' ? '💳 iyzico' : '🏦 Banka Havalesi' },
              { label: 'Hesap', value: donation.paymentAccount === 'sirket' ? 'Şirket Hesabı' : 'Vakıf Hesabı' },
              { label: 'İşlem Türü', value: donation.type === 'recurring' ? '🔄 Tekrarlayan' : '1× Tek Seferlik' },
              ...(donation.packageTier ? [{ label: 'Paket', value: `${donation.packageTier.charAt(0).toUpperCase()}${donation.packageTier.slice(1)} Paket` }] : []),
              { label: 'Oluşturulma', value: fmtDateTime(donation.createdAt) },
              ...(donation.completedAt ? [{ label: 'Tamamlanma', value: fmtDateTime(donation.completedAt) }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <span className="text-xs font-semibold text-gray-900">{value}</span>
              </div>
            ))}
            {donation.iyzicoPaymentId && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-gray-500 font-medium">iyzico Ödeme ID</span>
                <span className="text-[10px] font-mono font-semibold text-blue-700 break-all text-right max-w-[180px]">{donation.iyzicoPaymentId}</span>
              </div>
            )}
          </div>

          {/* Notlar */}
          {donation.notes && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Not</p>
              <p className="text-sm text-yellow-800">{donation.notes}</p>
            </div>
          )}

          {/* Ödeme Kanıtı */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Ödeme Kanıtı</p>
            {donation.method === 'iyzico' ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                iyzico ödemelerinde kanıt otomatik kayıt edilir.
                {donation.proofUploadedAt && <p className="text-xs mt-1">{fmtDate(donation.proofUploadedAt)}</p>}
              </div>
            ) : donation.proofKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-800">Dekont yüklendi</p>
                    {donation.proofUploadedAt && <p className="text-[10px] text-emerald-600">{fmtDate(donation.proofUploadedAt)}</p>}
                  </div>
                  <button onClick={() => void openProof()} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline">Görüntüle</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-800">Dekont henüz yüklenmedi</p>
                </div>
                <ProofCell donation={donation} onProofUploaded={onProofUploaded} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function BagislarPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [confirmingDonation, setConfirmingDonation] = useState<Donation | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  async function loadStats() {
    try { setStats(await adminApi.getDonationStats()); } catch { /* non-critical */ }
  }

  async function load(reset = false) {
    setLoading(true); setError(null);
    try {
      const params: { status?: string; method?: string; cursor?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      if (!reset && cursor) params.cursor = cursor;
      const result = await adminApi.listDonations(params);
      setDonations(prev => reset ? (result.data as Donation[]) : [...prev, ...(result.data as Donation[])]);
      setCursor(result.next_cursor);
      setHasMore(result.has_more);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadStats(); }, []);
  useEffect(() => { void load(true); }, [statusFilter, methodFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConfirm() {
    if (!confirmingDonation) return;
    setProcessingId(confirmingDonation.id); setConfirmingDonation(null); setActionError(null);
    try {
      await adminApi.confirmDonation(confirmingDonation.id);
      const catCfg = CATEGORY_CONFIG[confirmingDonation.donationCategory ?? 'genel'];
      const isUyelik = catCfg?.tier;
      setConfirmSuccess(isUyelik
        ? `✓ Ödeme onaylandı ve ${catCfg!.tier!} üyeliği aktive edildi`
        : '✓ Ödeme onaylandı'
      );
      setTimeout(() => setConfirmSuccess(null), 4000);
      await Promise.all([load(true), loadStats()]);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Onaylanamadı.');
    } finally { setProcessingId(null); }
  }

  const filtered = useMemo(() => {
    let list = donations;
    if (categoryFilter) list = list.filter(d => (d.donationCategory ?? 'genel') === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.fullName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.referenceCode.toLowerCase().includes(q) ||
        (d.companyName ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [donations, search, categoryFilter]);

  const pendingBankTransfers = donations.filter(d => d.status === 'pending' && d.method === 'bank_transfer');
  const pendingBankTotal = pendingBankTransfers.reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      {/* Success toast */}
      {confirmSuccess && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          {confirmSuccess}
        </div>
      )}

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bağışlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tüm bağış kayıtları, ödeme durumları ve dekontlar</p>
        </div>
        <button
          onClick={() => {
            const header = ['Referans', 'Ad Soyad', 'Kurum', 'E-posta', 'Kategori', 'Tutar (TL)', 'Yöntem', 'Hesap', 'Durum', 'Oluşturulma', 'Tamamlanma'];
            const rows = filtered.map(d => [
              d.referenceCode,
              d.fullName,
              d.companyName ?? '',
              d.email,
              CATEGORY_CONFIG[d.donationCategory ?? 'genel']?.label ?? d.donationCategory ?? '',
              String((d.amount / 100).toFixed(2)),
              d.method === 'bank_transfer' ? 'Banka Havalesi' : 'iyzico',
              d.paymentAccount === 'sirket' ? 'Şirket' : 'Vakıf',
              STATUS_CONFIG[d.status]?.label ?? d.status,
              fmtDateTime(d.createdAt),
              d.completedAt ? fmtDateTime(d.completedAt) : '',
            ]);
            const BOM = '﻿';
            const csv = BOM + [header, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
            a.download = `bagislar-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV İndir
        </button>
      </div>

      {/* ─── Pending Bank Transfer Alert ──────────────────────────────────────── */}
      {pendingBankTransfers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">🏦</div>
            <div>
              <p className="text-sm font-bold text-amber-900">{pendingBankTransfers.length} havale onay bekliyor</p>
              <p className="text-xs text-amber-700">Toplam {fmtTL(pendingBankTotal)} · Dekontları kontrol etmeyi unutmayın</p>
            </div>
          </div>
          <button
            onClick={() => { setStatusFilter('pending'); setMethodFilter('bank_transfer'); }}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shrink-0"
          >
            Filtrele →
          </button>
        </div>
      )}

      {/* ─── Stats ──────────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon="💰" label="Toplam Tahsilat" value={fmtTL(stats.totalAmount)} sub={`${stats.totalCompleted} adet`} />
          <StatCard icon="📅" label="Bu Ay" value={fmtTL(stats.thisMonthAmount)} accent="text-[#26496b]" />
          {stats.pendingCount > 0
            ? <StatCard icon="⏳" label="Onay Bekleyen" value={stats.pendingCount.toString()} accent="text-amber-600" />
            : <StatCard icon="⏳" label="Onay Bekleyen" value={stats.pendingCount.toString()} />}
          <StatCard icon="✅" label="Tamamlanan" value={stats.totalCompleted.toString()} accent="text-emerald-600" />
        </div>
      )}

      {/* ─── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Ad, e-posta veya referans…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26496b]/30" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none">×</button>}
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white">
            <option value="">Tüm Kategoriler</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white">
            <option value="">Tüm Durumlar</option>
            <option value="pending">Bekleyen</option>
            <option value="completed">Tamamlanan</option>
            <option value="failed">Başarısız</option>
          </select>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white">
            <option value="">Tüm Yöntemler</option>
            <option value="bank_transfer">🏦 Banka Havalesi</option>
            <option value="iyzico">💳 iyzico</option>
          </select>
          {(statusFilter || methodFilter || categoryFilter || search) && (
            <button onClick={() => { setStatusFilter(''); setMethodFilter(''); setCategoryFilter(''); setSearch(''); }}
              className="text-xs font-medium px-3 py-2 text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
              Temizle ×
            </button>
          )}
        </div>
      </div>

      {/* ─── Errors ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          {error}
          <button onClick={() => void load(true)} className="ml-auto text-xs font-semibold underline">Tekrar dene</button>
        </div>
      )}
      {actionError && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm mb-4">{actionError}</div>}

      {/* ─── List ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-x-4 border-b border-gray-100 px-5 py-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Kişi / Kurum</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Kategori & Tutar</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Durum & Tarih</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Kanıt & Aksiyon</p>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map((d) => {
            const catCfg = CATEGORY_CONFIG[d.donationCategory ?? 'genel'] ?? CATEGORY_CONFIG['genel']!;
            const statusCfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG['pending']!;
            const isPendingBank = d.status === 'pending' && d.method === 'bank_transfer';
            const isProcessing = processingId === d.id;
            const accountLabel = d.paymentAccount === 'sirket' ? 'Şirket' : 'Vakıf';

            return (
              <div
                key={d.id}
                className={`grid grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-x-4 px-5 py-4 items-start hover:bg-gray-50/60 transition-colors cursor-pointer ${isPendingBank ? 'bg-amber-50/40' : ''}`}
                onClick={() => setSelectedDonation(d)}
              >
                {/* Kişi */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#26496b] to-[#3a6a9b] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {getInitials(d.companyName ?? d.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.companyName ?? d.fullName}</p>
                    {d.companyName && <p className="text-xs text-gray-500 truncate">{d.fullName}</p>}
                    <p className="text-xs text-gray-400 truncate">{d.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {d.referenceCode && <p className="text-[10px] font-mono text-gray-300 select-all">{d.referenceCode}</p>}
                      {d.userId && (
                        <Link
                          href={`/uyeler/${d.userId}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#26496b]/70 hover:text-[#26496b] transition-colors"
                          title="Üye profiline git"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Üye
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Kategori & Tutar */}
                <div className="flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold w-fit ${catCfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catCfg.dot}`} />
                    {catCfg.label}
                  </span>
                  <p className="text-base font-bold text-gray-900 tabular-nums">{fmtTL(d.amount)}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${d.paymentAccount === 'sirket' ? 'text-indigo-700 bg-indigo-50' : 'text-[#26496b] bg-[#26496b]/8'}`}>{accountLabel}</span>
                    <span className="text-[10px] text-gray-400">{d.method === 'iyzico' ? '💳 iyzico' : '🏦 Havale'}</span>
                  </div>
                  {d.packageTier && <span className="text-[10px] font-medium text-gray-400 uppercase">{d.packageTier} paket</span>}
                </div>

                {/* Durum & Tarih */}
                <div className="flex flex-col gap-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold w-fit ${statusCfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                  <p className="text-xs text-gray-500">{fmtDateTime(d.createdAt)}</p>
                  {d.completedAt && <p className="text-[10px] text-emerald-600">✓ {fmtDateTime(d.completedAt)}</p>}
                  {d.notes && <p className="text-[10px] text-gray-400 truncate" title={d.notes}>{d.notes}</p>}
                </div>

                {/* Kanıt & Aksiyon */}
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <ProofCell donation={d} onProofUploaded={() => void load(true)} />
                  {isPendingBank && (
                    isProcessing ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        İşleniyor…
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingDonation(d)}
                        className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        ✓ Onayla
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-medium text-gray-500">Bağış bulunamadı</p>
              <p className="text-xs text-gray-400 mt-1">Filtre veya arama kriterlerini değiştirin</p>
            </div>
          )}
          {loading && (
            <div className="px-5 py-8 flex items-center justify-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-[#26496b] border-t-transparent rounded-full animate-spin" />
              Yükleniyor…
            </div>
          )}
        </div>

        {hasMore && !loading && (
          <div className="px-5 py-4 border-t border-gray-100">
            <button onClick={() => void load(false)} className="w-full text-sm font-medium text-[#26496b] py-2 rounded-xl border border-[#26496b]/20 hover:bg-[#26496b]/5 transition-colors">
              Daha Fazla Yükle
            </button>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">{filtered.length} kayıt{hasMore ? ' (daha fazlası var)' : ''}</p>
      )}

      {/* ─── Modals ─────────────────────────────────────────────────────────────── */}
      {confirmingDonation && (
        <ConfirmModal
          donation={confirmingDonation}
          onConfirm={() => void handleConfirm()}
          onCancel={() => setConfirmingDonation(null)}
          processing={processingId === confirmingDonation.id}
        />
      )}
      {selectedDonation && (
        <DetailDrawer
          donation={selectedDonation}
          onClose={() => setSelectedDonation(null)}
          onProofUploaded={() => { void load(true); }}
        />
      )}
    </div>
  );
}
