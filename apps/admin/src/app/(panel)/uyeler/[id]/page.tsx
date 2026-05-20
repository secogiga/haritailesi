'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi, getCurrentUserRoles, type AdminUserDetail, type MemberSub } from '@/lib/api';
import { getInitials } from '@/lib/ui';

type MemberNote = {
  id: string; body: string; noteType: string;
  adminEmail: string; createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; gradient: string; dot: string }> = {
  visitor:             { label: 'Ziyaretçi',         color: 'text-gray-700',   bg: 'bg-gray-100',   border: 'border-gray-300', gradient: 'from-gray-400 to-gray-600', dot: 'bg-gray-400' },
  registered_user:     { label: 'Sahne Üyesi',    color: 'text-slate-700',  bg: 'bg-slate-100',  border: 'border-slate-300', gradient: 'from-slate-400 to-slate-600', dot: 'bg-slate-400' },
  haritailesi_genc:    { label: 'Haritailesi Genç',    color: 'text-teal-800',   bg: 'bg-teal-50',    border: 'border-teal-300', gradient: 'from-teal-500 to-teal-700', dot: 'bg-teal-500' },
  new_graduate_member: { label: 'Mesleğin Geleceği',   color: 'text-orange-800', bg: 'bg-orange-50',  border: 'border-orange-300', gradient: 'from-orange-500 to-orange-700', dot: 'bg-orange-500' },
  individual_member:   { label: 'Mesleğin Değer Ortağı', color: 'text-blue-800', bg: 'bg-blue-50',   border: 'border-blue-300', gradient: 'from-blue-500 to-blue-700', dot: 'bg-blue-500' },
  corporate_member:    { label: 'Kurumsal Üye',       color: 'text-purple-800', bg: 'bg-purple-50',  border: 'border-purple-300', gradient: 'from-purple-500 to-purple-700', dot: 'bg-purple-500' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:   { label: 'Beklemede',    color: 'text-yellow-800', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  active:    { label: 'Hesabı Aktif', color: 'text-green-800',  bg: 'bg-green-100',  dot: 'bg-green-500' },
  passive:   { label: 'Pasif',        color: 'text-gray-600',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  suspended: { label: 'Askıya Alındı',color: 'text-red-800',   bg: 'bg-red-100',    dot: 'bg-red-500' },
};

const SUB_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active:          { label: 'Aktif',       color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  expired:         { label: 'Sona Erdi',   color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200' },
  cancelled:       { label: 'İptal',       color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
  pending_payment: { label: 'Ödeme Bekl.', color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200' },
};

const WORK_STATUS_TR: Record<string, string> = {
  employed: 'Çalışıyor', self_employed: 'Serbest Meslek',
  unemployed: 'İş Arıyor', student: 'Öğrenci', retired: 'Emekli',
};

const APP_TYPE_LABELS: Record<string, string> = {
  individual: 'Bireysel', corporate: 'Kurumsal',
  meslegin_gelecekleri: 'Mesleğin Geleceği', haritailesi_genc: 'Haritailesi Genç',
};

const APP_STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted:        { label: 'Yeni Başvuru',  color: 'text-yellow-800', bg: 'bg-yellow-100' },
  under_review:     { label: 'Ön İnceleme',  color: 'text-blue-800',   bg: 'bg-blue-100' },
  interview_needed: { label: 'Görüşme',      color: 'text-purple-800', bg: 'bg-purple-100' },
  approved:         { label: 'Kabul',         color: 'text-green-800',  bg: 'bg-green-100' },
  waiting_payment:  { label: 'Ödeme Bekliyor',color: 'text-orange-800', bg: 'bg-orange-100' },
  active:           { label: 'Aktif',         color: 'text-teal-800',   bg: 'bg-teal-100' },
  rejected:         { label: 'Reddedildi',    color: 'text-red-800',    bg: 'bg-red-100' },
};

const NOTE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  note:       { label: 'Not',              color: 'text-gray-700',  bg: 'bg-gray-100',  icon: '📝' },
  email_sent: { label: 'E-posta Gönderildi',color: 'text-blue-700',bg: 'bg-blue-100',  icon: '✉️' },
  call:       { label: 'Telefon',          color: 'text-green-700', bg: 'bg-green-100', icon: '📞' },
};

const ROLE_LABELS: Record<string, string> = {
  mentor: 'Mentor', moderator: 'Moderatör', editor: 'Editör',
  meslegin_gelecekleri_participant: 'MG Katılımcısı', corporate_rep: 'Kurumsal Temsilci',
  admin: 'Admin', super_admin: 'Süper Admin',
};

const ALL_ROLES = ['mentor', 'moderator', 'editor', 'meslegin_gelecekleri_participant', 'corporate_rep', 'admin', 'super_admin'];
const ALL_TIERS = ['registered_user', 'haritailesi_genc', 'new_graduate_member', 'individual_member', 'corporate_member'];
const PAID_TIERS = ['haritailesi_genc', 'new_graduate_member', 'individual_member', 'corporate_member'];
const ALL_STATUSES = ['pending', 'active', 'passive', 'suspended'];

const FORM_LABELS: Record<string, string> = {
  adSoyad: 'Adı Soyadı', dogumTarihi: 'Doğum Tarihi', cinsiyet: 'Cinsiyet',
  bolum: 'Bölüm', enYuksekEgitim: 'Eğitim', universite: 'Üniversite',
  meslek: 'Meslek', calismaDurumu: 'Çalışma Durumu', meslekiDeneyim: 'Deneyim',
  meslekiYonelim: 'Mesleki Yönelim', sirketAdi: 'Şirket', vergiNo: 'Vergi No',
  sehir: 'Şehir', il: 'İl', ilce: 'İlçe', eposta: 'E-Posta', telefon: 'Telefon',
  zamanAyirma: 'Zaman Ayırma', ilgiAlanlari: 'İlgi Alanları', katkiAlanlari: 'Katkı Alanları',
  tanismaKanali: 'Nasıl Duydunuz?', kisaTanitim: 'Kısa Tanıtım', referans: 'Referans',
  toplulukDeneyimi: 'Topluluk Deneyimi', arastirmaDeneyimi: 'Araştırma Deneyimi',
  ogrencilikDurumu: 'Öğrencilik Durumu', sinif: 'Sınıf',
};

const COMMA_MAPS: Record<string, Record<string, string>> = {
  meslekiYonelim: { fotogrametri: 'Fotogrametri', cbs: 'CBS', klasik_haritacilik: 'Klasik Haritacılık', uzaktan_algilama: 'Uzaktan Algılama', hidrografi: 'Hidrografi', kadastro: 'Kadastro', ins_olcme: 'İnşaat Ölçme' },
  ilgiAlanlari:   { egitim: 'Eğitim', proje: 'Proje', etkinlik: 'Etkinlik', arastirma: 'Araştırma', mentorlik: 'Mentörlük' },
  katkiAlanlari:  { egitim: 'Eğitim', proje: 'Proje', etkinlik: 'Etkinlik', arastirma: 'Araştırma', mentorlik: 'Mentörlük', tanitim: 'Tanıtım' },
  tanismaKanali:  { youtube: 'YouTube', instagram: 'Instagram', twitter: 'Twitter/X', linkedin: 'LinkedIn', arkadas: 'Arkadaş', universite: 'Üniversite', diger: 'Diğer' },
};

const VALUE_MAPS: Record<string, Record<string, string>> = {
  cinsiyet:           { kadin: 'Kadın', erkek: 'Erkek', diger: 'Diğer', belirtmek_istemiyorum: 'Belirtmek İstemiyorum' },
  enYuksekEgitim:     { lise: 'Lise', onlisans: 'Ön Lisans', lisans: 'Lisans', lisansustu: 'Lisansüstü', doktora: 'Doktora' },
  egitimDurumu:       { mezun: 'Mezun', ogrenci: 'Öğrenci', lisansustu: 'Lisansüstü', doktora: 'Doktora' },
  ogrencilikDurumu:   { lisans: 'Lisans', yuksek_lisans: 'Yüksek Lisans', doktora: 'Doktora', onlisans: 'Ön Lisans' },
  calismaDurumu:  { calismiyor: 'Çalışmıyor', calisuyor: 'Çalışıyor', ogrenci: 'Öğrenci', serbest: 'Serbest Meslek' },
  meslekiDeneyim: { '0': 'Yeni başlıyorum', '1-3': '1–3 yıl', '3-5': '3–5 yıl', '5+': '5+ yıl' },
  zamanAyirma:    { ayda_birkac: 'Ayda birkaç kez', haftada_birkac: 'Haftada birkaç kez', her_gun: 'Her gün', haftada_bir: 'Haftada bir' },
  toplulukDeneyimi: { evet: 'Evet', hayir: 'Hayır' },
  arastirmaDeneyimi: { evet: 'Evet', hayir: 'Hayır' },
};

const HIDDEN_FIELDS = new Set(['kvkk', 'iletisimOnay', 'onay', 'Kvkk']);

function fmtFdValue(key: string, val: unknown): string {
  const str = String(val ?? '').trim();
  if (!str || str === 'null' || str === 'undefined' || str === 'false' || str === 'true' && !VALUE_MAPS[key]) return str === 'true' ? 'Evet' : str === 'false' ? 'Hayır' : str;
  if (key === 'dogumTarihi') {
    const d = new Date(str);
    return isNaN(d.getTime()) ? str : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (str.includes(',') && COMMA_MAPS[key]) {
    return str.split(',').map(s => COMMA_MAPS[key]?.[s.trim()] ?? s.trim()).filter(Boolean).join(' · ');
  }
  if (COMMA_MAPS[key]?.[str]) return COMMA_MAPS[key][str]!;
  return VALUE_MAPS[key]?.[str] ?? str;
}

function fmtFd(fd: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = fd[k];
    if (v !== null && v !== undefined && v !== '' && v !== false) {
      const s = fmtFdValue(k, v);
      if (s) return s;
    }
  }
  return null;
}

void fmtFd; // used in form sections

const FORM_SECTIONS: { title: string; icon: string; keys: string[] }[] = [
  { title: 'Kişisel Bilgiler',     icon: '👤', keys: ['adSoyad', 'dogumTarihi', 'cinsiyet', 'sehir', 'il', 'ilce'] },
  { title: 'Eğitim & Kariyer',     icon: '🎓', keys: ['universite', 'bolum', 'ogrencilikDurumu', 'sinif', 'egitimDurumu', 'enYuksekEgitim', 'meslek', 'sirketAdi', 'vergiNo', 'calismaDurumu', 'meslekiDeneyim', 'meslekiYonelim'] },
  { title: 'İletişim',             icon: '📞', keys: ['eposta', 'telefon'] },
  { title: 'Topluluk & Katkı',     icon: '🤝', keys: ['zamanAyirma', 'ilgiAlanlari', 'katkiAlanlari', 'toplulukDeneyimi', 'arastirmaDeneyimi', 'tanismaKanali', 'referans'] },
  { title: 'Hakkında',             icon: '✍️', keys: ['kisaTanitim'] },
];

interface RepForm {
  email: string; displayName: string;
  corporateName: string; corporateRole: string;
}

// ─── Subscription Card ────────────────────────────────────────────────────────

function SubCard({ sub }: { sub: MemberSub }) {
  const days = Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86400000);
  const isActive = sub.status === 'active' && days > 0;
  const pct = Math.min(100, Math.max(0, Math.round((days / 365) * 100)));

  const palette = isActive
    ? (days > 60 ? { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', wrap: 'bg-emerald-50 border-emerald-200' }
       : days > 14 ? { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', wrap: 'bg-yellow-50 border-yellow-200' }
       : { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', wrap: 'bg-orange-50 border-orange-200' })
    : { bar: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500', wrap: 'bg-gray-50 border-gray-200' };

  const tierCfg = TIER_CONFIG[sub.membershipTier] ?? TIER_CONFIG['registered_user']!;

  return (
    <div className={`p-4 rounded-xl border ${palette.wrap}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-mono text-base font-bold text-gray-900 tracking-wider">{sub.memberNumber}</p>
          <p className={`text-xs font-semibold mt-0.5 ${tierCfg.color}`}>{tierCfg.label}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${palette.badge}`}>
          {isActive ? `${days} gün kaldı` : 'Sona Erdi'}
        </span>
      </div>
      {isActive && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>{new Date(sub.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>{new Date(sub.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${palette.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {!isActive && (
        <p className="text-xs text-gray-400 mt-1">
          {new Date(sub.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(sub.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UyeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const [showRepModal, setShowRepModal] = useState(false);
  const [repForm, setRepForm] = useState<RepForm>({ email: '', displayName: '', corporateName: '', corporateRole: '' });
  const [repInviteSent, setRepInviteSent] = useState(false);
  const [repConfirming, setRepConfirming] = useState(false);
  const [sendingMainInvite, setSendingMainInvite] = useState(false);
  const [confirmingMainInvite, setConfirmingMainInvite] = useState(false);
  const repEmailRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'email_sent' | 'call'>('note');
  const [addingNote, setAddingNote] = useState(false);

  const [showAppDetail, setShowAppDetail] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const isSuperAdmin = getCurrentUserRoles().includes('super_admin');

  // Membership / subscription state
  const [subs, setSubs] = useState<MemberSub[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [showSubHistory, setShowSubHistory] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateTier, setActivateTier] = useState('individual_member');
  const [activateNotes, setActivateNotes] = useState('');
  const [activating, setActivating] = useState(false);

  // Donations state
  type UserDonation = { id: string; amount: number; donationCategory: string | null; status: string; method: string; referenceCode: string; createdAt: string; completedAt: string | null };
  const [userDonations, setUserDonations] = useState<UserDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);


  const [isOnline, setIsOnline] = useState(false);
  useEffect(() => {
    let cancelled = false;
    function check() {
      adminApi.getOnlineUsers().then(r => { if (!cancelled) setIsOnline(r.userIds.includes(id)); }).catch(() => {});
    }
    check();
    const interval = setInterval(check, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  }

  function reload() {
    return adminApi.getUser(id).then(setUser).catch((e: Error) => setError(e.message));
  }
  function loadNotes() {
    setNotesLoading(true);
    adminApi.getMemberNotes(id).then(setNotes).catch(() => setNotes([])).finally(() => setNotesLoading(false));
  }
  function loadSubs() {
    setSubLoading(true);
    adminApi.listMembershipSubscriptions({ userId: id, limit: 50 })
      .then(setSubs)
      .catch(() => setSubs([]))
      .finally(() => setSubLoading(false));
  }

  function loadDonations() {
    setDonationsLoading(true);
    adminApi.listDonations({ userId: id, limit: 20 } as Parameters<typeof adminApi.listDonations>[0])
      .then(r => setUserDonations(r.data as UserDonation[]))
      .catch(() => setUserDonations([]))
      .finally(() => setDonationsLoading(false));
  }

  useEffect(() => { reload().finally(() => setLoading(false)); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadNotes(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadSubs(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadDonations(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddNote() {
    if (!noteBody.trim()) return;
    setAddingNote(true);
    try { await adminApi.addMemberNote(id, noteBody.trim(), noteType); setNoteBody(''); loadNotes(); }
    finally { setAddingNote(false); }
  }

  async function toggleRole(role: string, isActive: boolean) {
    setActionError(''); setBusy('role-' + role);
    try {
      await adminApi.updateUserRole(id, role, isActive ? 'revoke' : 'assign');
      await reload();
      showSuccess(isActive ? `"${ROLE_LABELS[role] ?? role}" rolü kaldırıldı` : `"${ROLE_LABELS[role] ?? role}" rolü atandı`);
    }
    catch (e) { setActionError((e as Error).message); } finally { setBusy(''); }
  }

  async function changeTier(tier: string) {
    setActionError(''); setBusy('tier');
    try { await adminApi.updateUserTier(id, tier); await reload(); showSuccess('Üyelik tipi güncellendi'); }
    catch (e) { setActionError((e as Error).message); } finally { setBusy(''); }
  }

  async function changeStatus(status: string) {
    setActionError(''); setBusy('status');
    try { await adminApi.updateUserStatus(id, status); await reload(); showSuccess('Hesap durumu güncellendi'); }
    catch (e) { setActionError((e as Error).message); } finally { setBusy(''); }
  }

  async function sendMainInvite() {
    setConfirmingMainInvite(false);
    setSendingMainInvite(true); setActionError('');
    try {
      await adminApi.sendUserInvite(id);
      showSuccess(`Davet e-postası gönderildi → ${user?.email}`);
    } catch (e) { setActionError((e as Error).message); } finally { setSendingMainInvite(false); }
  }

  async function confirmAndCreateRep() {
    setRepConfirming(false);
    setBusy('rep'); setActionError('');
    try {
      await adminApi.createCorporateRep(repForm);
      setRepInviteSent(true);
    }
    catch (e) { setActionError((e as Error).message); } finally { setBusy(''); }
  }

  async function handleActivate() {
    setActivating(true); setActionError('');
    try {
      await adminApi.adminActivateMembership({
        userId: id,
        tier: activateTier,
        ...(activateNotes.trim() ? { notes: activateNotes.trim() } : {}),
      });
      setShowActivateModal(false);
      setActivateNotes('');
      loadSubs();
      await reload();
      showSuccess('Üyelik aktive edildi');
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setActivating(false);
    }
  }

  async function handleDeleteUser() {
    setDeleting(true);
    try { await adminApi.deleteUser(id); router.push('/uyeler'); }
    catch (e) { setActionError((e as Error).message); setDeleting(false); setShowDeleteModal(false); }
  }


  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#26496b] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>;
  if (!user) return null;

  const displayName = user.profile?.displayName ?? user.displayName ?? user.email;
  const activeRoles = new Set(user.functionalRoles);
  const tier = TIER_CONFIG[user.membershipTier] ?? TIER_CONFIG['registered_user']!;
  const formData = (user.applications[0]?.formData ?? {}) as Record<string, unknown>;
  const hasApp = user.applications.length > 0;
  const appState = user.applications[0]?.state ?? '';
  const appStateCfg = APP_STATE_CONFIG[appState];

  const activeSub = subs.find(s => s.status === 'active');
  const subHistory = subs.filter(s => s.status !== 'active');

  const DON_CAT_LABEL: Record<string, string> = {
    bireysel: 'Bireysel Üyelik', kurumsal: 'Kurumsal Üyelik',
    genc: 'Haritailesi Genç', mezun: 'Mesleğin Geleceği', genel: 'Genel Bağış',
  };
  const DON_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: 'Bekliyor',   color: 'text-amber-700',   bg: 'bg-amber-50' },
    completed: { label: 'Tamamlandı', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    failed:    { label: 'Başarısız',  color: 'text-red-700',     bg: 'bg-red-50' },
    refunded:  { label: 'İade',       color: 'text-gray-600',    bg: 'bg-gray-50' },
  };

  const builtSections = FORM_SECTIONS.map(sec => {
    const rows = sec.keys
      .filter(k => !HIDDEN_FIELDS.has(k) && k in formData)
      .map(k => ({ label: FORM_LABELS[k] ?? k, value: fmtFdValue(k, formData[k]) }))
      .filter(r => r.value);
    return { ...sec, rows };
  }).filter(s => s.rows.length > 0);

  return (
    <div className="max-w-5xl">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl animate-in slide-in-from-bottom-2 duration-200">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Back + Delete */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.push('/uyeler')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Üyeler
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Üyeyi Sil
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{actionError}</div>
      )}

      {/* ─── Hero Card ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
        <div className={`h-28 bg-gradient-to-r ${tier.gradient} opacity-90 relative rounded-t-2xl overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-14 mb-4 relative z-10">
            <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${tier.gradient} border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-bold shrink-0`}>
              {getInitials(displayName)}
            </div>
            <div className="flex items-center gap-2 mt-12">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${tier.color} ${tier.bg} ${tier.border}`}>
                {tier.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
              </span>
              {activeSub && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#26496b]/8 text-[#26496b] border border-[#26496b]/15">
                  🎫 {activeSub.memberNumber}
                </span>
              )}
            </div>
          </div>

          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{displayName}</h1>
            {user.profile?.profession && <p className="text-base text-gray-500 mt-0.5">{user.profile.profession}</p>}
            <p className="text-sm text-gray-400 mt-1">{user.email}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {user.profile?.city && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Şehir</p>
                <p className="text-sm font-semibold text-gray-900">{user.profile.city}</p>
              </div>
            )}
            {user.profile?.workStatus && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Durum</p>
                <p className="text-sm font-semibold text-gray-900">{WORK_STATUS_TR[user.profile.workStatus] ?? user.profile.workStatus}</p>
              </div>
            )}
            {user.profile?.professionalExperienceYears !== undefined && user.profile.professionalExperienceYears !== null && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Deneyim</p>
                <p className="text-sm font-semibold text-gray-900">{user.profile.professionalExperienceYears} yıl</p>
              </div>
            )}
            {user.profile?.graduationYear && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Mezuniyet</p>
                <p className="text-sm font-semibold text-gray-900">{user.profile.graduationYear}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Kayıt</p>
              <p className="text-sm font-semibold text-gray-900">{new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>

          </div>

          {user.profile?.bio && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed italic">"{user.profile.bio}"</p>
            </div>
          )}

          {(user.profile?.skillTags ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(user.profile?.skillTags ?? []).map(tag => (
                <span key={tag} className="inline-flex px-2.5 py-1 text-xs font-medium bg-[#26496b]/8 text-[#26496b] rounded-lg border border-[#26496b]/15">{tag}</span>
              ))}
            </div>
          )}

          {(user.profile?.linkedinUrl || user.profile?.websiteUrl) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {user.profile.linkedinUrl && (
                <a href={user.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                  LinkedIn
                </a>
              )}
              {user.profile.websiteUrl && (
                <a href={user.profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Web Sitesi
                </a>
              )}
            </div>
          )}

          {(user.profile?.corporateName || user.profile?.corporateRole) && (
            <div className="mt-4 flex items-center gap-3 bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-900">{user.profile.corporateName}</p>
                {user.profile.corporateRole && <p className="text-xs text-purple-600">{user.profile.corporateRole}</p>}
              </div>
            </div>
          )}

          {user.functionalRoles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {user.functionalRoles.map(role => (
                <span key={role} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#26496b] text-white rounded-lg">{ROLE_LABELS[role] ?? role}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Two-column layout ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left: Application data + Notes */}
        <div className="lg:col-span-3 space-y-5">

          {hasApp && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowAppDetail(v => !v)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#26496b]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Başvuru Formu</p>
                    <p className="text-xs text-gray-500">
                      {APP_TYPE_LABELS[user.applications[0]?.type ?? ''] ?? ''} · {new Date(user.applications[0]?.createdAt ?? '').toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {appStateCfg && (
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${appStateCfg.bg} ${appStateCfg.color}`}>{appStateCfg.label}</span>
                  )}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showAppDetail ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showAppDetail && builtSections.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                  {builtSections.map(sec => (
                    <div key={sec.title}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <span>{sec.icon}</span> {sec.title}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {sec.rows.map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[11px] text-gray-400 font-medium mb-0.5">{label}</p>
                            <p className="text-sm text-gray-900 font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAppDetail && builtSections.length === 0 && (
                <div className="border-t border-gray-100 px-5 py-6 text-center text-sm text-gray-400">Form verisi bulunamadı.</div>
              )}
            </div>
          )}

          {/* ─── Bağış Geçmişi ─────────────────────────────────────────────────── */}
          {(donationsLoading || userDonations.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-base">💰</span>
                Bağış Geçmişi
              </h3>
              {donationsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {userDonations.map(don => {
                    const statusCfg = DON_STATUS[don.status] ?? DON_STATUS['pending']!;
                    const catLabel = DON_CAT_LABEL[don.donationCategory ?? 'genel'] ?? don.donationCategory ?? '—';
                    const amountTL = (don.amount / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
                    return (
                      <div key={don.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusCfg.color} ${statusCfg.bg}`}>{statusCfg.label}</span>
                            <span className="text-[10px] text-gray-400 truncate">{catLabel}</span>
                          </div>
                          <p className="text-[10px] font-mono text-gray-300 truncate">{don.referenceCode}</p>
                        </div>
                        <div className="shrink-0 text-right ml-3">
                          <p className="text-sm font-bold text-gray-900 tabular-nums">{amountTL}</p>
                          <p className="text-[10px] text-gray-400">{new Date(don.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Admin Notları */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-base">📋</span>
              Admin Notları
            </h3>
            <div className="space-y-2 mb-4">
              <textarea
                rows={3} placeholder="Not ekle…" value={noteBody}
                onChange={e => setNoteBody(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
              />
              <div className="flex items-center gap-2">
                <select
                  value={noteType} onChange={e => setNoteType(e.target.value as 'note' | 'email_sent' | 'call')}
                  className="border border-gray-200 rounded-lg pl-2.5 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 flex-1"
                >
                  <option value="note">📝 Not</option>
                  <option value="email_sent">✉️ E-posta Gönderildi</option>
                  <option value="call">📞 Telefon Araması</option>
                </select>
                <button
                  onClick={() => void handleAddNote()} disabled={addingNote || !noteBody.trim()}
                  className="px-4 py-1.5 bg-[#26496b] text-white text-sm font-semibold rounded-lg hover:bg-[#1d3a57] disabled:opacity-50 transition-colors shrink-0"
                >
                  {addingNote ? 'Ekleniyor…' : 'Ekle'}
                </button>
              </div>
            </div>
            {notesLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">Yükleniyor…</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Henüz not yok.</p>
            ) : (
              <div className="space-y-2">
                {notes.map(note => {
                  const cfg = NOTE_TYPE_CONFIG[note.noteType] ?? NOTE_TYPE_CONFIG['note']!;
                  return (
                    <div key={note.id} className={`rounded-xl p-3.5 ${cfg.bg}`}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                        <div className="text-[11px] text-gray-400">
                          {note.adminEmail} · {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Management + Membership + Meta */}
        <div className="lg:col-span-2 space-y-5">

          {/* ─── Üyelik & Abonelik ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#26496b]/10 flex items-center justify-center">🎫</span>
                Üyelik Aboneliği
              </h3>
              <button
                onClick={() => { setShowActivateModal(true); setActionError(''); setActivateTier('individual_member'); setActivateNotes(''); }}
                className="text-xs font-semibold text-[#26496b] hover:text-[#1d3a57] px-2.5 py-1 rounded-lg hover:bg-[#26496b]/8 transition-colors"
              >
                + Aktive Et
              </button>
            </div>

            {subLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-20 bg-gray-100 rounded-xl" />
              </div>
            ) : activeSub ? (
              <div>
                <SubCard sub={activeSub} />
                {subs.length > 1 && (
                  <button
                    onClick={() => setShowSubHistory(v => !v)}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-600 font-medium w-full text-left flex items-center gap-1"
                  >
                    <svg className={`w-3 h-3 transition-transform ${showSubHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Tüm abonelikler ({subs.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-2xl mb-2">🎫</p>
                <p className="text-sm text-gray-500 font-medium">Aktif abonelik yok</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">Bu üye için henüz abonelik oluşturulmamış</p>
                <button
                  onClick={() => { setShowActivateModal(true); setActionError(''); setActivateTier('individual_member'); setActivateNotes(''); }}
                  className="px-4 py-1.5 bg-[#26496b] text-white text-xs font-semibold rounded-lg hover:bg-[#1d3a57] transition-colors"
                >
                  Manuel Aktive Et
                </button>
              </div>
            )}

            {/* Subscription history */}
            {showSubHistory && subHistory.length > 0 && (
              <div className="mt-3 space-y-2">
                {subHistory.map(s => {
                  const cfg = SUB_STATUS_CONFIG[s.status] ?? SUB_STATUS_CONFIG['expired']!;
                  const tierCfg = TIER_CONFIG[s.membershipTier] ?? TIER_CONFIG['registered_user']!;
                  return (
                    <div key={s.id} className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-gray-700">{s.memberNumber}</span>
                        <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className={`text-[11px] font-semibold ${tierCfg.color} mb-0.5`}>{tierCfg.label}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(s.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: '2-digit' })} → {new Date(s.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show all history even without active sub */}
            {!activeSub && subs.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Geçmiş</p>
                {subs.map(s => {
                  const cfg = SUB_STATUS_CONFIG[s.status] ?? SUB_STATUS_CONFIG['expired']!;
                  const tierCfg = TIER_CONFIG[s.membershipTier] ?? TIER_CONFIG['registered_user']!;
                  return (
                    <div key={s.id} className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-gray-700">{s.memberNumber}</span>
                        <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className={`text-[11px] font-semibold ${tierCfg.color} mb-0.5`}>{tierCfg.label}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(s.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: '2-digit' })} → {new Date(s.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Yönetim ───────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">⚙️</span>
              Yönetim
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Hesap Durumu</label>
                <select
                  value={user.status} disabled={busy === 'status'}
                  onChange={e => void changeStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 disabled:opacity-50"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Üyelik Tipi</label>
                <select
                  value={user.membershipTier} disabled={busy === 'tier'}
                  onChange={e => void changeTier(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 disabled:opacity-50"
                >
                  {ALL_TIERS.map(t => (
                    <option key={t} value={t}>{TIER_CONFIG[t]?.label ?? t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Fonksiyonel Roller</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map(role => {
                    const active = activeRoles.has(role);
                    const isBusy = busy === 'role-' + role;
                    return (
                      <button
                        key={role} disabled={isBusy}
                        onClick={() => void toggleRole(role, active)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                          active
                            ? 'bg-[#26496b] text-white border-[#26496b] hover:bg-red-600 hover:border-red-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b]/40 hover:text-[#26496b]'
                        }`}
                      >
                        {isBusy ? '…' : (active ? `✓ ${ROLE_LABELS[role]}` : ROLE_LABELS[role])}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Hesap Bilgileri ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">ℹ️</span>
              Hesap Bilgileri
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Kayıt</span>
                <span className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Son Giriş</span>
                <span className="font-medium text-gray-900">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              {user.applications.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Başvuru</span>
                  <button onClick={() => router.push('/basvurular')} className="text-[#26496b] font-medium hover:underline text-xs">
                    Pipeline'da gör →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Kurumsal Temsilci ──────────────────────────────────────────────── */}
          {user.membershipTier === 'corporate_member' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">🏢</span>
                Kurumsal Temsilci
              </h3>
              <div className="space-y-2">
                {sendingMainInvite ? (
                  <div className="w-full bg-[#26496b]/10 text-[#26496b] text-sm font-semibold py-2 rounded-xl flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#26496b] border-t-transparent rounded-full animate-spin" />
                    Gönderiliyor…
                  </div>
                ) : confirmingMainInvite ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">Davet gönderilecek</p>
                    <p className="text-xs text-amber-700 mb-3 font-mono break-all">{user?.email}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmingMainInvite(false)} className="flex-1 text-xs font-medium py-1.5 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">İptal</button>
                      <button onClick={() => void sendMainInvite()} className="flex-1 text-xs font-semibold py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">Evet, Gönder</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingMainInvite(true)}
                    className="w-full bg-[#26496b] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#1d3a57] transition-colors"
                  >
                    ✉️ Hesap Kurulum Daveti Gönder
                  </button>
                )}
                <p className="text-[11px] text-gray-400 text-center">Temsilci e-postasına şifre belirleme bağlantısı gönderilir</p>
                <div className="border-t border-gray-100 pt-2 mt-1">
                  <button
                    onClick={() => { setShowRepModal(true); setRepInviteSent(false); setRepForm({ email: '', displayName: '', corporateName: user.profile?.corporateName ?? '', corporateRole: '' }); setTimeout(() => repEmailRef.current?.focus(), 50); }}
                    className="w-full border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    + Ek Temsilci Davet Et
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-1">Farklı bir kişiyi bu kurumun temsilcisi olarak davet et</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Manuel Aktive Et Modal ─────────────────────────────────────────────── */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowActivateModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 flex items-center justify-center text-xl">🎫</div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Manuel Üyelik Aktivasyonu</h2>
                <p className="text-xs text-gray-500">1 yıllık abonelik oluşturulacak</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Üyelik Tipi</label>
                <select
                  value={activateTier}
                  onChange={e => setActivateTier(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
                >
                  {PAID_TIERS.map(t => (
                    <option key={t} value={t}>{TIER_CONFIG[t]?.label ?? t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Not (İsteğe Bağlı)</label>
                <textarea
                  rows={2} value={activateNotes} onChange={e => setActivateNotes(e.target.value)}
                  placeholder="Manuel aktivasyon nedeni, ödeme bilgisi…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
                />
              </div>
            </div>
            {actionError && <p className="text-xs text-red-600 mt-2">{actionError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowActivateModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-50">İptal</button>
              <button
                onClick={() => void handleActivate()} disabled={activating}
                className="flex-1 bg-[#26496b] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#1d3a57] disabled:opacity-50 transition-colors"
              >
                {activating ? 'Aktive ediliyor…' : 'Aktive Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Ek Temsilci Davet Modal ───────────────────────────────────────────── */}
      {showRepModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) { setShowRepModal(false); setRepInviteSent(false); setRepConfirming(false); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {repInviteSent ? (
              /* ─ Başarı ─ */
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">✉️</div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Davet Gönderildi</h2>
                <p className="text-sm text-gray-500 mb-1">
                  <span className="font-semibold text-gray-800">{repForm.email}</span> adresine şifre belirleme bağlantısı iletildi.
                </p>
                <p className="text-xs text-gray-400 mb-5">Temsilci bağlantıya tıklayarak hesabını aktive edebilir.</p>
                <button onClick={() => { setShowRepModal(false); setRepInviteSent(false); setRepConfirming(false); }} className="w-full bg-[#26496b] text-white text-sm font-semibold py-2 rounded-xl">Tamam</button>
              </div>
            ) : repConfirming ? (
              /* ─ Onay ─ */
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Daveti Onaylayın</h2>
                <div className="bg-[#26496b]/5 border border-[#26496b]/15 rounded-xl p-4 space-y-2 mb-4 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">E-posta</span><span className="font-semibold text-gray-900 font-mono text-xs">{repForm.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ad Soyad</span><span className="font-semibold text-gray-900">{repForm.displayName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Şirket</span><span className="font-semibold text-gray-900">{repForm.corporateName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Rol</span><span className="font-semibold text-gray-900">{repForm.corporateRole}</span></div>
                </div>
                <p className="text-xs text-gray-400 mb-4">Bu kişiye <strong className="text-gray-700">kurumsal temsilci</strong> rolü atanacak ve şifre belirleme e-postası gönderilecek.</p>
                {actionError && <p className="text-xs text-red-600 mb-2">{actionError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setRepConfirming(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-50">Geri Dön</button>
                  <button onClick={() => void confirmAndCreateRep()} disabled={busy === 'rep'} className="flex-1 bg-[#26496b] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#1d3a57] disabled:opacity-50">
                    {busy === 'rep' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Gönderiliyor…
                      </span>
                    ) : '✉️ Evet, Davet Gönder'}
                  </button>
                </div>
              </div>
            ) : (
              /* ─ Form ─ */
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Ek Temsilci Davet Et</h2>
                <p className="text-xs text-gray-400 mb-4">Temsilciye otomatik şifre belirleme e-postası gönderilir.</p>
                <div className="space-y-3">
                  {(['email', 'displayName', 'corporateName', 'corporateRole'] as const).map(field => (
                    <div key={field}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {field === 'email' ? 'E-posta' : field === 'displayName' ? 'Ad Soyad' : field === 'corporateName' ? 'Şirket Adı' : 'Şirketteki Rol'}
                      </label>
                      <input
                        ref={field === 'email' ? repEmailRef : undefined}
                        type={field === 'email' ? 'email' : 'text'}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
                        value={repForm[field]} onChange={e => setRepForm(f => ({ ...f, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                {actionError && <p className="text-xs text-red-600 mt-2">{actionError}</p>}
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowRepModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-50">İptal</button>
                  <button
                    onClick={() => setRepConfirming(true)}
                    disabled={!repForm.email || !repForm.displayName || !repForm.corporateName || !repForm.corporateRole}
                    className="flex-1 bg-[#26496b] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#1d3a57] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Devam →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Delete Modal ────────────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Üyeyi Sil</h3>
                <p className="text-sm text-gray-500">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{displayName}</span> adlı üyenin hesabı silinecek. Onaylamak için <span className="font-mono font-semibold text-red-600">SİL</span> yazın.
            </p>
            <input
              type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="SİL"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">İptal</button>
              <button
                onClick={() => void handleDeleteUser()}
                disabled={deleteConfirmText !== 'SİL' || deleting}
                className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Siliniyor…' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
