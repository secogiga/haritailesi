'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';

const API_URL   = process.env['NEXT_PUBLIC_API_URL']   ?? 'http://localhost:3000';
const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://sahne.haritailesi.org';

const CAT_LABELS: Record<string, string> = {
  isbirligi: 'İşbirliği', proje: 'Projeler', teknik_destek: 'Teknik Destek',
  freelancer: 'Freelancer', teknoloji_ekipman: 'Teknoloji & Ekipman',
  ikinci_el: 'İkinci El & Satış', mesleki_arac: 'Mesleki Araçlar',
  firsat: 'Fırsatlar', duyuru: 'Duyurular',
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  published: { label: 'Yayında',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  draft:     { label: 'Taslak',    cls: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400' },
  closed:    { label: 'Kapatıldı', cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

const IAN_TYPES = [
  { value: 'isbirligi',         label: 'İşbirliği' },
  { value: 'proje',             label: 'Projeler' },
  { value: 'teknik_destek',     label: 'Teknik Destek' },
  { value: 'freelancer',        label: 'Freelancer' },
  { value: 'teknoloji_ekipman', label: 'Teknoloji & Ekipman' },
  { value: 'ikinci_el',         label: 'İkinci El & Satış' },
  { value: 'mesleki_arac',      label: 'Mesleki Araçlar' },
  { value: 'firsat',            label: 'Fırsatlar' },
  { value: 'duyuru',            label: 'Duyurular' },
];

interface Listing {
  id: string; title: string; company: string; location: string | null;
  type: string; description: string; status: string;
  applyEmail: string | null; applyUrl: string | null; contactPhone: string | null;
  price: string | null; tags: string[]; publishedAt: string | null; expiresAt: string | null;
}

const inp = 'w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] transition';

function EditModal({ listing, token, onSave, onClose }: {
  listing: Listing;
  token: string | null;
  onSave: (updated: Listing) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title:        listing.title,
    description:  listing.description,
    location:     listing.location ?? '',
    price:        listing.price ?? '',
    applyEmail:   listing.applyEmail ?? '',
    applyUrl:     listing.applyUrl ?? '',
    contactPhone: listing.contactPhone ?? '',
    type:         listing.type,
    tags:         listing.tags.join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch(`${API_URL}/api/v1/marketplace/my-listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, tags, location: form.location || undefined, price: form.price || undefined }),
      });
      if (!res.ok) throw new Error('Güncelleme başarısız.');
      onSave({ ...listing, ...form, tags });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu.');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#0f1829] sm:rounded-2xl rounded-t-3xl shadow-2xl border-t sm:border border-gray-100 dark:border-slate-800 overflow-hidden max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">İlanı Düzenle</h2>
            <p className="text-xs text-gray-400 mt-0.5">Değişiklikler anında kaydedilir.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 ml-4 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={save} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Başlık *</label>
            <input required type="text" value={form.title} onChange={set('title')} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Kategori</label>
              <select value={form.type} onChange={set('type')} className={inp}>
                {IAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Konum</label>
              <input type="text" value={form.location} onChange={set('location')} placeholder="İstanbul, Uzaktan…" className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Açıklama *</label>
            <textarea required rows={4} value={form.description} onChange={set('description')} className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Fiyat / Bütçe</label>
              <input type="text" value={form.price} onChange={set('price')} placeholder="₺5.000" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">İletişim E-posta</label>
              <input type="email" value={form.applyEmail} onChange={set('applyEmail')} className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Etiketler (virgülle ayır)</label>
            <input type="text" value={form.tags} onChange={set('tags')} placeholder="RTK GPS, İzmir, teknik destek" className={inp} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 text-sm font-medium text-gray-500 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">İptal</button>
            <button type="submit" disabled={saving} className="flex-1 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1d3a57] py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IlanlarPage() {
  const { user } = useAuth();
  const token    = useToken();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [editing, setEditing]   = useState<Listing | null>(null);
  const [closing, setClosing]   = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/v1/marketplace/my-listings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => setListings(d as Listing[]))
      .catch(() => setListings([]));
  }, [token]);

  async function closeL(id: string) {
    if (!confirm('İlanı kapatmak istediğinize emin misiniz?')) return;
    setClosing(id);
    try {
      const res = await fetch(`${API_URL}/api/v1/marketplace/my-listings/${id}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setListings(prev => prev?.map(l => l.id === id ? { ...l, status: 'closed' } : l) ?? null);
    } finally { setClosing(null); }
  }

  const active  = listings?.filter(l => l.status === 'published') ?? [];
  const passive = listings?.filter(l => l.status !== 'published') ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">İlanlarım</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Yayınladığınız ilanları buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <a
            href={`${SAHNE_URL}/ilanlar`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            İlan Panosunu Gör
          </a>
          <Link
            href="/ilanlar/gonder"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#26496b] text-white hover:bg-[#1d3a57] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Yeni İlan
          </Link>
        </div>
      </div>

      {/* Loading */}
      {listings === null && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {listings !== null && listings.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Henüz ilan yayınlamadınız.</p>
          <Link href="/ilanlar/gonder" className="text-xs text-[#26496b] dark:text-blue-400 hover:underline">
            İlk ilanınızı yayınlayın →
          </Link>
        </div>
      )}

      {/* Active listings */}
      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Yayında ({active.length})</h2>
          <div className="space-y-3">
            {active.map(l => <ListingRow key={l.id} listing={l} onEdit={() => setEditing(l)} onClose={() => closeL(l.id)} closing={closing === l.id} />)}
          </div>
        </div>
      )}

      {/* Passive listings */}
      {passive.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Geçmiş / Taslak ({passive.length})</h2>
          <div className="space-y-3 opacity-70">
            {passive.map(l => <ListingRow key={l.id} listing={l} onEdit={() => setEditing(l)} onClose={null} closing={false} />)}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          listing={editing}
          token={token}
          onSave={updated => { setListings(prev => prev?.map(l => l.id === updated.id ? updated : l) ?? null); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ListingRow({ listing, onEdit, onClose, closing }: {
  listing: Listing;
  onEdit: () => void;
  onClose: (() => void) | null;
  closing: boolean;
}) {
  const s     = STATUS_LABEL[listing.status] ?? STATUS_LABEL.draft!;
  const cat   = CAT_LABELS[listing.type] ?? listing.type;
  const expiresDate = listing.expiresAt
    ? new Date(listing.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const daysLeft = listing.expiresAt
    ? Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000)
    : null;
  const sahneUrl = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://sahne.haritailesi.org';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{cat}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
            {daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && (
              <span className="text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                {daysLeft === 0 ? 'Bugün bitiyor' : `${daysLeft} gün kaldı`}
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-gray-900 dark:text-slate-100 mb-0.5 truncate">{listing.title}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mb-2">{listing.description}</p>
          {expiresDate && <p className="text-[11px] text-gray-400 dark:text-slate-500">Son tarih: {expiresDate}</p>}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            Düzenle
          </button>
          {listing.status === 'published' && (
            <a
              href={`${sahneUrl}/ilanlar/${listing.id}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-center text-[#26496b] dark:text-blue-400 bg-[#26496b]/8 dark:bg-blue-900/20 hover:bg-[#26496b]/15 dark:hover:bg-blue-900/30 transition-colors"
            >
              İlanı Gör
            </a>
          )}
          {onClose && (
            <button
              onClick={onClose}
              disabled={closing}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              {closing ? '…' : 'Kapat'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
