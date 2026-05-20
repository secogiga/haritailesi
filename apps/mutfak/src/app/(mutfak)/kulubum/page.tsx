'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { mutfakApi } from '@/lib/api';

type Club = {
  id: string; name: string; slug: string; university: string; city: string;
  contactName: string; contactEmail: string; contactPhone: string | null;
  website: string | null; memberCount: number; description: string | null;
  activities: string | null; status: string;
};

export default function KulubumPage() {
  const { user } = useAuth();
  const token = useToken();

  const [club, setClub] = useState<Club | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    description: '',
    activities: '',
    contactPhone: '',
    website: '',
    memberCount: '',
  });

  const [applyForm, setApplyForm] = useState({
    name: '', university: '', city: '', contactName: '', contactEmail: '', contactPhone: '', website: '', description: '', activities: '',
  });
  const [applying, setApplying] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    mutfakApi.getMyClub(token)
      .then(c => {
        setClub(c);
        if (c) {
          setForm({
            description: c.description ?? '',
            activities: c.activities ?? '',
            contactPhone: c.contactPhone ?? '',
            website: c.website ?? '',
            memberCount: c.memberCount ? String(c.memberCount) : '',
          });
        }
      })
      .catch(() => setClub(null))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true); setError(null);
    try {
      await mutfakApi.updateMyClub(token, {
        ...(form.description ? { description: form.description } : {}),
        ...(form.activities ? { activities: form.activities } : {}),
        ...(form.contactPhone ? { contactPhone: form.contactPhone } : {}),
        ...(form.website ? { website: form.website } : {}),
        ...(form.memberCount ? { memberCount: parseInt(form.memberCount, 10) } : {}),
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
      // Re-fetch to refresh displayed data
      const updated = await mutfakApi.getMyClub(token);
      setClub(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inp = 'w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b] transition-colors placeholder:text-[var(--text-tertiary)]';

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 bg-[var(--surface)] rounded-xl animate-pulse mb-4 w-48" />
        <div className="h-48 bg-[var(--surface)] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (user.membershipTier !== 'haritailesi_genc') {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Kulübüm</h1>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-[var(--text-secondary)] text-sm">
            Bu sayfa yalnızca Haritailesi Genç üyelerine açıktır.
          </p>
        </div>
      </div>
    );
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setApplying(true); setApplyError(null);
    try {
      const slug = applyForm.name.toLowerCase()
        .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
        .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      await mutfakApi.applyClub({ ...applyForm, slug });
      setApplyDone(true);
    } catch (err) { setApplyError((err as Error).message); }
    finally { setApplying(false); }
  }

  if (!club) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Kulübüm</h1>

        {applyDone ? (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="font-semibold text-[var(--text-primary)] mb-2">Başvurunuz alındı!</p>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Ekibimiz başvurunuzu inceleyecek ve sizi platform temsilcisi olarak atadıktan sonra<br />
              bu sayfadan kulübünüzü yönetebileceksiniz.
            </p>
          </div>
        ) : (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Kulübünüzü Ekleyin</p>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  Üniversitenizdeki harita veya geomatik kulübünü Haritailesi'ne ekleyin. Başvurunuz admin onayından sonra yayınlanır.
                </p>
              </div>
            </div>

            <form onSubmit={(e) => void handleApply(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Kulüp Adı *</label>
                <input required className={inp} value={applyForm.name} onChange={e => setApplyForm(f => ({ ...f, name: e.target.value }))} placeholder="Haritacılık ve Jeodezi Kulübü" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Üniversite *</label>
                  <input required className={inp} value={applyForm.university} onChange={e => setApplyForm(f => ({ ...f, university: e.target.value }))} placeholder="İstanbul Teknik Üniversitesi" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Şehir *</label>
                  <input required className={inp} value={applyForm.city} onChange={e => setApplyForm(f => ({ ...f, city: e.target.value }))} placeholder="İstanbul" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Yetkili Adı *</label>
                  <input required className={inp} value={applyForm.contactName} onChange={e => setApplyForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Ad Soyad" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">E-posta *</label>
                  <input required type="email" className={inp} value={applyForm.contactEmail} onChange={e => setApplyForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="kulubu@uni.edu.tr" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Telefon</label>
                  <input className={inp} value={applyForm.contactPhone} onChange={e => setApplyForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+90 5xx xxx xx xx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Website</label>
                  <input className={inp} value={applyForm.website} onChange={e => setApplyForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Kulüp Hakkında</label>
                <textarea rows={3} className={inp} value={applyForm.description} onChange={e => setApplyForm(f => ({ ...f, description: e.target.value }))} placeholder="Kulübünüzün misyonu ve hedefleri…" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Faaliyetler</label>
                <textarea rows={2} className={inp} value={applyForm.activities} onChange={e => setApplyForm(f => ({ ...f, activities: e.target.value }))} placeholder="Etkinlikler, eğitimler, projeler…" />
              </div>
              {applyError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{applyError}</p>}
              <button type="submit" disabled={applying}
                className="w-full py-3 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] disabled:opacity-50 transition-colors">
                {applying ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
              </button>
            </form>
          </div>
        )}

        <p className="text-xs text-[var(--text-tertiary)] mt-4 text-center">
          Zaten bir kulübün temsilcisiyseniz admin ataması bekleniyor, lütfen iletişime geçin.
        </p>
      </div>
    );
  }

  const STATUS_LABELS: Record<string, string> = { pending: 'Onay Bekliyor', active: 'Aktif', suspended: 'Askıya Alındı' };
  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kulübüm</h1>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">Kaydedildi ✓</span>
        )}
      </div>

      {/* Club header card */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#26496b]/10 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[club.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[club.status] ?? club.status}
              </span>
            </div>
            <h2 className="font-bold text-lg text-[var(--text-primary)] leading-tight">{club.name}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{club.university} · {club.city}</p>
            {club.memberCount > 0 && (
              <p className="text-sm text-[#66aca9] font-medium mt-1">{club.memberCount} üye</p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[var(--text-tertiary)] font-medium">Sorumlu</span>
            <p className="text-[var(--text-primary)] mt-0.5">{club.contactName}</p>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] font-medium">E-posta</span>
            <p className="text-[var(--text-primary)] mt-0.5 truncate">{club.contactEmail}</p>
          </div>
        </div>
      </div>

      {/* Editable section */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[var(--text-primary)]">Kulüp Bilgileri</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-[#26496b] hover:underline font-medium"
            >
              Düzenle
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                Kulüp Hakkında
              </label>
              <textarea
                rows={4}
                className={inp}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Kulübünüzün misyonu, hedefleri ve özellikleri…"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                Etkinlikler & Faaliyetler
              </label>
              <textarea
                rows={3}
                className={inp}
                value={form.activities}
                onChange={e => setForm(f => ({ ...f, activities: e.target.value }))}
                placeholder="Düzenlediğiniz etkinlikler, eğitimler, projeler…"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                  Telefon
                </label>
                <input
                  className={inp}
                  value={form.contactPhone}
                  onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="+90 5xx xxx xx xx"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                  Üye Sayısı
                </label>
                <input
                  type="number"
                  min="0"
                  className={inp}
                  value={form.memberCount}
                  onChange={e => setForm(f => ({ ...f, memberCount: e.target.value }))}
                  placeholder="50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                Website
              </label>
              <input
                className={inp}
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://kulubunuz.edu.tr"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setEditing(false); setError(null); }}
                className="flex-1 py-2.5 text-sm border border-[var(--border)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg)] transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Kulüp Hakkında</p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {club.description || <span className="text-[var(--text-tertiary)] italic">Henüz eklenmedi</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Etkinlikler & Faaliyetler</p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {club.activities || <span className="text-[var(--text-tertiary)] italic">Henüz eklenmedi</span>}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Telefon</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {club.contactPhone || <span className="text-[var(--text-tertiary)] italic">—</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Üye Sayısı</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {club.memberCount || <span className="text-[var(--text-tertiary)] italic">—</span>}
                </p>
              </div>
            </div>
            {club.website && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Website</p>
                <a href={club.website} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#26496b] hover:underline">
                  {club.website}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--text-tertiary)] mt-4 text-center">
        Kulüp adı, üniversite ve iletişim e-postasını değiştirmek için yöneticilerle iletişime geçin.
      </p>
    </div>
  );
}
