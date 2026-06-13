'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface MyTicket {
  id: string;
  ticketNo: number;
  subject: string;
  type: string;
  status: string;
  urgency: string | null;
  subCategory: string | null;
  satisfactionScore: number | null;
  adminReply: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'Yeni', reviewing: 'İncelemede', awaiting_info: 'Bilgi Bekleniyor',
  in_progress: 'İşlemde', mentoring: 'Mentör', expert_review: 'Uzman',
  partner_referred: 'Partner', offer_pending: 'Teklif', education_suggested: 'Eğitim Önerildi',
  gpt_responded: 'Ön Yanıt', suggested: 'Öneri', resolved: 'Çözüldü', archived: 'Arşiv',
};

const TICKET_STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-50 text-red-600 border-red-200', reviewing: 'bg-blue-50 text-blue-600 border-blue-200',
  awaiting_info: 'bg-orange-50 text-orange-700 border-orange-200', in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  mentoring: 'bg-purple-50 text-purple-700 border-purple-200', resolved: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-gray-50 text-gray-500 border-gray-200',
};

const TIER_LABELS: Record<string, string> = {
  visitor: 'Ziyaretçi',
  registered_user: 'Sahne Üyesi',
  haritailesi_genc: 'Haritailesi Genç',
  new_graduate_member: 'Mesleğin Geleceği',
  individual_member: 'Mesleğin Değer Ortağı',
  corporate_member: 'Kurumsal Üye',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  active: 'Aktif',
  passive: 'Pasif',
  suspended: 'Askıya Alındı',
};

export default function HesabimPage() {
  const { user, isLoading, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    city: '',
    profession: '',
    bio: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/giris' as Route);
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.profile) {
      setForm({
        displayName: user.profile.displayName ?? '',
        city: user.profile.city ?? '',
        profession: user.profile.profession ?? '',
        bio: user.profile.bio ?? '',
        linkedinUrl: user.profile.linkedinUrl ?? '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('ha_access_token') : null;
    if (!token) return;
    setTicketsLoading(true);
    fetch(`${API_URL}/api/v1/community/my-tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() as Promise<MyTicket[]> : Promise.resolve([]))
      .then(setTickets)
      .catch(() => {})
      .finally(() => setTicketsLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Yükleniyor...</div>
      </main>
    );
  }

  if (!user) return null;

  const tierLabel = TIER_LABELS[user.membershipTier] ?? user.membershipTier;
  const statusLabel = STATUS_LABELS[user.status] ?? user.status;
  const MUTFAK_URL = process.env['NEXT_PUBLIC_MUTFAK_URL'] ?? 'http://localhost:3003';
  const MUTFAK_TIERS = new Set(['haritailesi_genc', 'new_graduate_member', 'individual_member', 'corporate_member']);
  const hasMutfakAccess = MUTFAK_TIERS.has(user.membershipTier) && user.status === 'active';

  async function handleLogout() {
    await logout();
    router.push('/' as Route);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ''),
      ) as Parameters<typeof updateProfile>[0];
      await updateProfile(payload);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  const f = (field: keyof typeof form) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value })),
    className:
      'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]',
  });

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Mutfak CTA */}
        {hasMutfakAccess && (
          <a
            href={MUTFAK_URL}
            className="flex items-center justify-between gap-4 bg-[#26496b] text-white rounded-2xl p-6 hover:bg-[#1e3a56] transition-colors group"
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">Üyelere Özel</div>
              <div className="text-lg font-bold">Mutfak&apos;a Gir</div>
              <div className="text-sm text-white/70 mt-1">Topluluk akışı, üye dizini ve daha fazlası</div>
            </div>
            <svg className="w-6 h-6 text-white/60 group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}

        {/* Profil Kartı */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#26496b]">
                {user.profile?.displayName ?? 'Üye'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#26496b]/10 text-[#26496b]">
                  {tierLabel}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
            <button
              onClick={() => void handleLogout()}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>

          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Profil güncellendi.
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#26496b]">Profil Bilgilerim</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-medium text-[#26496b] border border-[#26496b] rounded-lg px-4 py-1.5 hover:bg-[#26496b]/5 transition-colors"
              >
                Düzenle
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={(e) => void handleSave(e)} className="space-y-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad</label>
                  <input type="text" {...f('displayName')} maxLength={100} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Şehir</label>
                  <input type="text" {...f('city')} maxLength={80} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meslek / Unvan</label>
                <input type="text" {...f('profession')} maxLength={100} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hakkımda</label>
                <textarea {...f('bio')} rows={3} maxLength={300} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL</label>
                <input type="url" {...f('linkedinUrl')} maxLength={200} />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-lg disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          ) : (
            <dl className="space-y-3 border-t border-gray-100 pt-4">
              {[
                { label: 'Şehir', value: user.profile?.city },
                { label: 'Meslek', value: user.profile?.profession },
                { label: 'Hakkımda', value: user.profile?.bio },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex gap-3 text-sm">
                    <dt className="text-gray-500 w-28 shrink-0">{label}</dt>
                    <dd className="text-gray-800">{value}</dd>
                  </div>
                ) : null,
              )}
              {!user.profile?.city && !user.profile?.profession && !user.profile?.bio && (
                <p className="text-sm text-gray-400">Henüz profil bilgisi eklenmemiş.</p>
              )}
            </dl>
          )}
        </div>

        {/* Üyelik Bilgileri */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
          <h2 className="text-base font-semibold text-[#26496b] mb-4">Üyelik Bilgilerim</h2>
          <dl className="space-y-3">
            <div className="flex gap-3 text-sm">
              <dt className="text-gray-500 w-28 shrink-0">Üyelik Tipi</dt>
              <dd className="text-gray-800">{tierLabel}</dd>
            </div>
            <div className="flex gap-3 text-sm">
              <dt className="text-gray-500 w-28 shrink-0">Durum</dt>
              <dd className="text-gray-800">{statusLabel}</dd>
            </div>
            <div className="flex gap-3 text-sm">
              <dt className="text-gray-500 w-28 shrink-0">Üyelik Tarihi</dt>
              <dd className="text-gray-800">
                {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            {user.lastLoginAt && (
              <div className="flex gap-3 text-sm">
                <dt className="text-gray-500 w-28 shrink-0">Son Giriş</dt>
                <dd className="text-gray-800">
                  {new Date(user.lastLoginAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Taleplerim */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#26496b]">Destek Taleplerim</h2>
            <a href="/destek" className="text-xs font-semibold text-[#26496b] border border-[#26496b] rounded-lg px-3 py-1.5 hover:bg-[#26496b]/5 transition-colors">
              + Yeni Talep
            </a>
          </div>

          {ticketsLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!ticketsLoading && tickets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm text-gray-400">Henüz destek talebiniz bulunmuyor.</p>
              <a href="/destek" className="mt-3 inline-block text-xs font-semibold text-[#26496b] hover:underline">
                İlk talebinizi oluşturun →
              </a>
            </div>
          )}

          {!ticketsLoading && tickets.length > 0 && (
            <div className="space-y-2">
              {tickets.map(ticket => {
                const year = new Date(ticket.createdAt).getFullYear();
                const no = `HDM-${year}-${String(ticket.ticketNo).padStart(4, '0')}`;
                const badgeClass = TICKET_STATUS_BADGE[ticket.status] ?? 'bg-gray-50 text-gray-500 border-gray-200';
                return (
                  <a
                    key={ticket.id}
                    href={`/destek/takip?no=${ticket.ticketNo}`}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#26496b]/20 hover:bg-[#26496b]/2 transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-gray-400">{no}</span>
                        {ticket.satisfactionScore && (
                          <span className="text-[10px] text-yellow-500">{'★'.repeat(ticket.satisfactionScore)}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</p>
                      {ticket.subCategory && (
                        <p className="text-xs text-gray-400">{ticket.subCategory}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${badgeClass}`}>
                        {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
                      </span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-[#26496b] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
