'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  adminApi,
  type AdminMentorProfile,
  type AdminMenteeApplication,
  type AdminMentorshipRequest,
  type MentorshipSession,
} from '@/lib/api';
import { fmtDate } from '@/lib/ui';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const SESSION_DOT: Record<string, string> = {
  pending: 'bg-gray-300', scheduled: 'bg-blue-400',
  completed: 'bg-green-500', cancelled: 'bg-red-300',
};
const FORMAT_LABEL: Record<string, string> = {
  online: 'Online', in_person: 'Yüz Yüze', both: 'Her İkisi',
};
const MENTOR_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};
const MENTOR_STATUS_LABEL: Record<string, string> = {
  pending: 'İnceleme Bekliyor', approved: 'Onaylı', rejected: 'Reddedildi',
};
const EXPERTISE_TR: Record<string, string> = {
  kadastro: 'Kadastro', fotogrametri: 'Fotogrametri',
  uzaktan_algilama: 'Uzaktan Algılama', cbs_gis: 'CBS / GIS',
  insaat_olcmesi: 'İnşaat Ölçmesi', gayrimenkul: 'Gayrimenkul',
  deniz_hidrografi: 'Deniz Hidrografisi', yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer_danismanligi: 'Kariyer Danışmanlığı', akademik_arastirma: 'Akademik Araştırma',
  girisimcilik: 'Girişimcilik', hukuk_mevzuat: 'Hukuk & Mevzuat',
  lidar_nokta_bulutu: 'LiDAR / Nokta Bulutu',
};
function expertiseLabel(key: string): string {
  return EXPERTISE_TR[key] ?? key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
const EXPERTISE_KEYWORDS: Record<string, string[]> = {
  kadastro: ['kadastro', 'tapu', 'parsel', 'sınır'],
  fotogrametri: ['fotogrametri', 'drone', 'uav', 'insansız', 'hava fotoğ'],
  uzaktan_algilama: ['uzaktan algılama', 'uydu', 'görüntü', 'sentinel', 'landsat', 'radar'],
  cbs_gis: ['cbs', 'gis', 'coğrafi', 'harita', 'mekansal', 'arcgis', 'qgis', 'konumsal'],
  insaat_olcmesi: ['inşaat', 'yapı', 'bina', 'ölçme'],
  gayrimenkul: ['gayrimenkul', 'emlak', 'değerleme', 'arazi'],
  deniz_hidrografi: ['deniz', 'hidrografi', 'oşinografi'],
  yazilim_teknoloji: ['yazılım', 'kod', 'programlama', 'python', 'java', 'javascript', 'teknoloji', 'veri'],
  kariyer_danismanligi: ['kariyer', 'meslek', 'iş hayatı', 'yönlendirme'],
  akademik_arastirma: ['akademik', 'araştırma', 'tez', 'makale', 'lisans', 'yüksek lisans'],
  girisimcilik: ['girişim', 'startup', 'şirket kurma'],
};

// ─── Eşleştirme Motoru ────────────────────────────────────────────────────────

// skillTags → expertise area key
const SKILL_TO_EXPERTISE: Record<string, string> = {
  'CBS': 'cbs_gis', 'GIS': 'cbs_gis', 'QGIS': 'cbs_gis', 'ArcGIS': 'cbs_gis',
  'Uzaktan Algılama': 'uzaktan_algilama', 'Uydu': 'uzaktan_algilama',
  'Fotogrametri': 'fotogrametri', 'Drone': 'fotogrametri', 'UAV': 'fotogrametri',
  'Kadastro': 'kadastro', 'Tapu': 'kadastro',
  'Hidrografi': 'deniz_hidrografi', 'Deniz': 'deniz_hidrografi',
  'İnşaat Ölçme': 'insaat_olcmesi', 'İnşaat': 'insaat_olcmesi',
  'Kariyer': 'kariyer_danismanligi',
  'Araştırma': 'akademik_arastirma', 'Akademik': 'akademik_arastirma',
  'Yazılım': 'yazilim_teknoloji', 'Python': 'yazilim_teknoloji',
  'Programlama': 'yazilim_teknoloji', 'JavaScript': 'yazilim_teknoloji',
  'LiDAR': 'lidar_nokta_bulutu', 'Nokta Bulutu': 'lidar_nokta_bulutu',
  'Gayrimenkul': 'gayrimenkul', 'Emlak': 'gayrimenkul',
  'Girişimcilik': 'girisimcilik',
};

// formData meslekiYonelim key → expertise key
const YONELIM_TO_EXPERTISE: Record<string, string> = {
  cbs: 'cbs_gis', fotogrametri: 'fotogrametri',
  uzaktan_algilama: 'uzaktan_algilama', hidrografi: 'deniz_hidrografi',
  kadastro: 'kadastro', ins_olcme: 'insaat_olcmesi',
  klasik_haritacilik: 'kadastro',
};

function getMenteeExpertiseAreas(mentee: AdminMenteeApplication): string[] {
  const areas = new Set<string>();
  const tags = mentee.user?.profile?.skillTags ?? [];
  for (const tag of tags) {
    const key = SKILL_TO_EXPERTISE[tag];
    if (key) areas.add(key);
  }
  return Array.from(areas);
}

// Bileşen max puanları:
// Kapasite: 15 | Format: 25 | Mesleki yönelim: 35 | Metin eşleşme: 15 | Deneyim: 10
// Toplam max: 100
const MAX_SCORE = 100;

interface MatchReason { label: string; kind: 'format' | 'expertise' | 'experience' | 'capacity' | 'orientation' }
interface MatchScore { score: number; pct: number; level: 'high' | 'medium' | 'low'; reasons: MatchReason[] }

function scoreMentor(
  mentor: AdminMentorProfile,
  mentee: AdminMenteeApplication,
  engType: 'single_session' | 'periodic',
): MatchScore {
  let score = 0;
  const reasons: MatchReason[] = [];

  // Kapasite (15)
  const capOk = engType === 'periodic'
    ? mentor.capacityType === 'periodic' || mentor.capacityType === 'both'
    : mentor.capacityType === 'monthly' || mentor.capacityType === 'both';
  if (capOk) {
    score += 15;
    reasons.push({
      label: engType === 'periodic'
        ? `Dönemlik: ${mentor.periodicCapacity} kontenjan`
        : `1 Seans: ${mentor.monthlyCapacity} kişi/ay`,
      kind: 'capacity',
    });
  }

  // Format (25)
  if (mentor.sessionFormat === mentee.preferredFormat) {
    score += 25;
    reasons.push({ label: `${FORMAT_LABEL[mentee.preferredFormat] ?? mentee.preferredFormat} — tam uyum`, kind: 'format' });
  } else if (mentor.sessionFormat === 'both') {
    score += 12;
    reasons.push({ label: 'Her formatta çalışabilir', kind: 'format' });
  }

  // Mesleki Yönelim / skillTags eşleşmesi (35)
  const menteeAreas = getMenteeExpertiseAreas(mentee);
  if (menteeAreas.length > 0) {
    const overlapping = mentor.expertiseAreas.filter(a => menteeAreas.includes(a));
    if (overlapping.length > 0) {
      const ratio = overlapping.length / Math.max(menteeAreas.length, 1);
      const pts = Math.round(ratio * 35);
      score += pts;
      overlapping.slice(0, 2).forEach(a =>
        reasons.push({ label: `${EXPERTISE_TR[a] ?? a} — alan uyumu`, kind: 'orientation' }),
      );
    }
  }

  // Metin eşleşme (15)
  const text = `${mentee.topic} ${mentee.goal}`.toLowerCase();
  const matchedAreas = mentor.expertiseAreas.filter(area => {
    const kws = EXPERTISE_KEYWORDS[area] ?? [area.replace(/_/g, ' ')];
    return kws.some(kw => text.includes(kw));
  });
  if (matchedAreas.length > 0) {
    score += Math.min(matchedAreas.length * 15, 15);
    reasons.push({ label: `${EXPERTISE_TR[matchedAreas[0]!] ?? matchedAreas[0]} konusuyla örtüşüyor`, kind: 'expertise' });
  }

  // Deneyim (10)
  if (mentor.completedSessionCount >= 5) {
    score += 10;
    reasons.push({ label: `${mentor.completedSessionCount} tamamlanan seans`, kind: 'experience' });
  } else if (mentor.completedSessionCount > 0) {
    score += 5;
    reasons.push({ label: `${mentor.completedSessionCount} tamamlanan seans`, kind: 'experience' });
  }

  const pct = Math.min(Math.round((score / MAX_SCORE) * 100), 100);
  const level: MatchScore['level'] = pct >= 65 ? 'high' : pct >= 30 ? 'medium' : 'low';
  return { score, pct, level, reasons };
}

const REASON_CHIP: Record<MatchReason['kind'], string> = {
  format: 'bg-emerald-100 text-emerald-700',
  expertise: 'bg-blue-100 text-blue-700',
  experience: 'bg-amber-100 text-amber-700',
  capacity: 'bg-purple-100 text-purple-700',
  orientation: 'bg-teal-100 text-teal-700',
};
const REASON_ICON: Record<MatchReason['kind'], string> = {
  format: '✓', expertise: '★', experience: '◎', capacity: '⬡', orientation: '◈',
};
const LEVEL_CONFIG = {
  high:   { border: 'border-emerald-400', bg: 'bg-emerald-50/40', badge: 'bg-emerald-500 text-white',  label: 'Çok Uyumlu',     bar: 'bg-emerald-500' },
  medium: { border: 'border-yellow-400',  bg: 'bg-yellow-50/30',  badge: 'bg-yellow-500 text-white',   label: 'Kısmen Uyumlu', bar: 'bg-yellow-400' },
  low:    { border: 'border-gray-200',    bg: 'bg-white',         badge: 'bg-gray-200 text-gray-500',  label: 'Düşük Uyum',    bar: 'bg-gray-300' },
};

// suppress unused warning
void YONELIM_TO_EXPERTISE;

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}
function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}
function formatCapacity(m: AdminMentorProfile): string {
  const parts: string[] = [];
  if (m.capacityType === 'monthly' || m.capacityType === 'both') parts.push(`1 Seans: ${m.monthlyCapacity} kişi/ay`);
  if (m.capacityType === 'periodic' || m.capacityType === 'both') parts.push(`Dönemlik: ${m.periodicCapacity} kişi`);
  parts.push(`${m.sessionDurationMin}–${m.sessionDurationMax} dk`);
  return parts.join(' · ');
}
// suppress unused warning — used in MatchModal option labels
void formatCapacity;

// ─── Mini Avatar ──────────────────────────────────────────────────────────────

function Av({ name, size = 'sm' }: { name: string; size?: 'xs' | 'sm' | 'md' }) {
  const cls = size === 'xs' ? 'w-5 h-5 text-[9px]' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-xs';
  return (
    <div className={`${cls} rounded-full bg-[var(--color-mavi)] text-white flex items-center justify-center font-bold shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Oturum Noktaları ─────────────────────────────────────────────────────────

function SessionDots({ sessions }: { sessions: MentorshipSession[] }) {
  if (!sessions.length) return null;
  const done = sessions.filter(s => s.status === 'completed').length;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {sessions.map(s => (
        <span key={s.id} title={`${s.sessionNumber}. oturum · ${s.status}`}
          className={`w-2 h-2 rounded-full ${SESSION_DOT[s.status] ?? 'bg-gray-200'}`} />
      ))}
      <span className="text-[10px] text-gray-400 ml-0.5">{done}/{sessions.length}</span>
    </div>
  );
}

// ─── Pipeline Kolon ───────────────────────────────────────────────────────────

function PipelineCol({ title, count, dot, badge, children, collapsed }: {
  title: string; count: number; dot: string; badge: string; children: React.ReactNode;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className="w-9 flex-none flex flex-col items-center pt-1 gap-2 select-none">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
        <span className={`min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${badge}`}>
          {count}
        </span>
        <div className="flex-1 flex items-center justify-center overflow-hidden py-2">
          <span
            className="text-sm font-semibold text-gray-300 whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[268px] flex-none">
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
        <span className="text-sm font-semibold text-gray-700 flex-1">{title}</span>
        <span className={`min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold ${badge}`}>
          {count}
        </span>
      </div>
      <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
        {children}
      </div>
    </div>
  );
}

// ─── Grup Ayracı ──────────────────────────────────────────────────────────────

function GroupSeparator({ onLeft, onRight, leftTitle, rightTitle }: {
  onLeft: () => void; onRight: () => void;
  leftTitle: string; rightTitle: string;
}) {
  const Btn = ({ onClick, ttl, d }: { onClick: () => void; ttl: string; d: string }) => (
    <button
      onClick={onClick}
      title={ttl}
      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-[#26496b] hover:border-[#26496b]/35 hover:bg-[#26496b]/8 transition-all"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={d} />
      </svg>
    </button>
  );

  return (
    <div className="flex-none flex flex-col items-center self-stretch mx-2">
      <div className="w-px flex-1 bg-gray-200/60" />
      <div className="flex items-center gap-0.5 py-2">
        <Btn onClick={onLeft}  ttl={leftTitle}  d="M15 19l-7-7 7-7" />
        <Btn onClick={onRight} ttl={rightTitle} d="M9 5l7 7-7 7" />
      </div>
      <div className="w-px flex-1 bg-gray-200/60" />
    </div>
  );
}

function ColEmpty({ text }: { text: string }) {
  return (
    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}


// ─── Katılımcı Profil Modalı ──────────────────────────────────────────────────

function ParticipantProfileModal({ eng, type, mentorProfile, onClose }: {
  eng: AdminMentorshipRequest;
  type: 'mentee' | 'mentor';
  mentorProfile: AdminMentorProfile | undefined;
  onClose: () => void;
}) {
  const XBtn = () => (
    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-3 shrink-0">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  if (type === 'mentee') {
    const name = eng.mentee.profile?.displayName ?? eng.mentee.email;
    return (
      <>
        <div className="fixed inset-0 bg-black/30 z-[60]" onClick={onClose} />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] max-w-[95vw] bg-white rounded-2xl shadow-2xl z-[60] p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <Av name={name} size="md" />
              <div>
                <p className="font-bold text-gray-900 text-base">{name}</p>
                <p className="text-xs text-gray-400">{eng.mentee.email}</p>
              </div>
            </div>
            <XBtn />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
              eng.engagementType === 'periodic' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {eng.engagementType === 'periodic' ? 'Dönemlik · 4 ay' : '1 Seans'}
            </span>
            <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
              {FORMAT_LABEL[eng.preferredFormat] ?? eng.preferredFormat}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Mentorluk Konusu</p>
              <p className="text-sm font-medium text-gray-900">{eng.topic}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Hedef & Beklenti</p>
              <p className="text-sm text-gray-700 leading-relaxed">{eng.goal}</p>
            </div>
          </div>

          <button onClick={onClose}
            className="w-full mt-5 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            Kapat
          </button>
        </div>
      </>
    );
  }

  const name = eng.mentor.profile?.displayName ?? eng.mentor.email;
  const mp = mentorProfile;
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[60]" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[95vw] bg-white rounded-2xl shadow-2xl z-[60] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <Av name={name} size="md" />
            <div>
              <p className="font-bold text-gray-900 text-base">{name}</p>
              <p className="text-xs text-gray-400">{eng.mentor.email}</p>
              {mp?.user.profile?.profession && (
                <p className="text-xs text-gray-500 mt-0.5">{mp.user.profile.profession}</p>
              )}
            </div>
          </div>
          <XBtn />
        </div>

        {mp ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(mp.capacityType === 'monthly' || mp.capacityType === 'both') && (
                <div className="bg-blue-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-xl font-bold text-blue-700">{mp.monthlyCapacity}</p>
                  <p className="text-[10px] text-blue-500 mt-0.5">kişi/ay (1 seans)</p>
                </div>
              )}
              {(mp.capacityType === 'periodic' || mp.capacityType === 'both') && (
                <div className="bg-purple-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-xl font-bold text-purple-700">{mp.periodicCapacity}</p>
                  <p className="text-[10px] text-purple-500 mt-0.5">kişi (dönemlik)</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xl font-bold text-gray-700">{mp.sessionDurationMin}–{mp.sessionDurationMax}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">dk/seans</p>
              </div>
              <div className="bg-green-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-xl font-bold text-green-700">{mp.completedSessionCount}</p>
                <p className="text-[10px] text-green-500 mt-0.5">tamamlanan</p>
              </div>
            </div>

            {mp.bio && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Hakkında</p>
                <p className="text-sm text-gray-700 leading-relaxed">{mp.bio}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Uzmanlık</p>
              <div className="flex flex-wrap gap-1">
                {mp.expertiseAreas.map(a => (
                  <span key={a} className="px-2 py-1 bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] rounded-lg text-xs font-medium">
                    {expertiseLabel(a)}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400 mb-4">
            Mentor profili bulunamadı.
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
          Kapat
        </button>
      </div>
    </>
  );
}

// ─── Mentee Detay Modalı (Havuz kartı) ───────────────────────────────────────

function MenteeDetailModal({ app, onClose, onMatch }: {
  app: AdminMenteeApplication;
  onClose: () => void;
  onMatch: (app: AdminMenteeApplication) => void;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const name = app.user?.profile?.displayName ?? app.name;

  const statusLabel: Record<string, string> = {
    pending: 'Mentor Eşleştirme Bekliyor',
    matched: 'Eşleştirildi',
    accepted: 'Aktif Mentorluk',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
  };

  const InfoIcon = () => (
    <button
      onClick={() => setShowProfile(v => !v)}
      title={showProfile ? 'Özete dön' : 'Başvuru detayı'}
      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
        showProfile
          ? 'bg-[#26496b]/10 text-[#26496b]'
          : 'text-gray-300 hover:text-[#26496b] hover:bg-[#26496b]/8'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[95vw] bg-white rounded-2xl shadow-2xl z-50 p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Av name={name} />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-gray-900">{name}</p>
                <InfoIcon />
              </div>
              <p className="text-xs text-gray-400">{app.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showProfile ? (
          /* ── Başvuru Detayı + Kişisel Bilgiler ── */
          <div className="space-y-4">
            {/* Kişisel Bilgiler */}
            {app.user?.profile && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Kişisel Bilgiler</p>
                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  {[
                    { label: 'Adı Soyadı', value: app.user.profile.displayName },
                    { label: 'Şehir', value: app.user.profile.city },
                    { label: 'Doğum Tarihi', value: app.user.profile.birthDate },
                    { label: 'E-Posta', value: app.email },
                  ].filter(r => r.value).map((row, i, arr) => (
                    <div key={row.label} className={`flex ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <span className="w-28 shrink-0 px-3 py-2.5 text-xs text-gray-500">{row.label}</span>
                      <span className="flex-1 px-3 py-2.5 text-xs text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eğitim & Kariyer */}
            {app.user?.profile && (app.user.profile.profession || app.user.profile.workStatus || app.user.profile.graduationYear) && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Eğitim & Kariyer</p>
                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  {[
                    { label: 'Meslek', value: app.user.profile.profession },
                    { label: 'Çalışma', value: app.user.profile.workStatus ? (({ employed: 'Çalışıyor', self_employed: 'Serbest', unemployed: 'İş Arıyor', student: 'Öğrenci', retired: 'Emekli' } as Record<string,string>)[app.user.profile.workStatus] ?? app.user.profile.workStatus) : null },
                    { label: 'Mezuniyet', value: app.user.profile.graduationYear?.toString() ?? null },
                    { label: 'Deneyim', value: app.user.profile.professionalExperienceYears ? `${app.user.profile.professionalExperienceYears} yıl` : null },
                  ].filter(r => r.value).map((row, i, arr) => (
                    <div key={row.label} className={`flex ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <span className="w-28 shrink-0 px-3 py-2.5 text-xs text-gray-500">{row.label}</span>
                      <span className="flex-1 px-3 py-2.5 text-xs text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {app.user?.profile?.bio && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Hakkında</p>
                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5">{app.user.profile.bio}</p>
              </div>
            )}

            {/* Başvuru Detayı */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Mentorluk Talebi · #{app.id.slice(0, 8).toUpperCase()}
              </p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${app.engagementType === 'periodic' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                  {app.engagementType === 'periodic' ? 'Dönemlik · 4 ay' : '1 Seans'}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">{FORMAT_LABEL[app.preferredFormat] ?? app.preferredFormat}</span>
                <span className="text-xs text-gray-400 ml-auto">{fmtDate(app.createdAt)}</span>
              </div>
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 mb-3">
                <div className="flex border-b border-gray-100">
                  <span className="w-28 shrink-0 px-3 py-2.5 text-xs text-gray-500">Konu</span>
                  <span className="flex-1 px-3 py-2.5 text-xs text-gray-900 font-medium">{app.topic}</span>
                </div>
                <div className="flex">
                  <span className="w-28 shrink-0 px-3 py-2.5 text-xs text-gray-500">Durum</span>
                  <span className="flex-1 px-3 py-2.5 text-xs text-gray-900">→ {statusLabel[app.status] ?? app.status}</span>
                </div>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{app.goal}</p>
            </div>
          </div>
        ) : (
          /* ── Normal Özet ── */
          <>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${app.engagementType === 'periodic' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                {app.engagementType === 'periodic' ? 'Dönemlik · 4 ay' : '1 Seans'}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                {FORMAT_LABEL[app.preferredFormat] ?? app.preferredFormat}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 capitalize">{app.source}</span>
              <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-400">{fmtDate(app.createdAt)}</span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Konu</p>
                <p className="text-sm font-medium text-gray-900">{app.topic}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Hedef & Beklenti</p>
                <p className="text-sm text-gray-700 leading-relaxed">{app.goal}</p>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            Kapat
          </button>
          <button onClick={() => { onClose(); onMatch(app); }}
            className="flex-1 py-2.5 text-sm font-semibold bg-[var(--color-mavi)] text-white rounded-xl hover:opacity-90">
            Mentor Eşleştir →
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Mentee Havuzu Kartı ──────────────────────────────────────────────────────

function MenteePoolCard({ app, onMatch, onDetail }: {
  app: AdminMenteeApplication;
  onMatch: (app: AdminMenteeApplication) => void;
  onDetail: (app: AdminMenteeApplication) => void;
}) {
  const name = app.user?.profile?.displayName ?? app.name;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start gap-2 mb-2">
        <Av name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-[10px] text-gray-400 truncate">{app.email}</p>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{fmtDate(app.createdAt)}</span>
      </div>
      <p className="text-xs font-medium text-gray-800 line-clamp-1">{app.topic}</p>
      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{app.goal}</p>
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
          {FORMAT_LABEL[app.preferredFormat] ?? app.preferredFormat}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded capitalize">{app.source}</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        <button onClick={() => onDetail(app)}
          className="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Detay
        </button>
        <button onClick={() => onMatch(app)}
          className="flex-1 py-1.5 text-xs font-semibold text-white bg-[var(--color-mavi)] hover:opacity-90 rounded-lg transition-opacity">
          Eşleştir
        </button>
      </div>
    </div>
  );
}

// ─── Eşleşme Kartı ───────────────────────────────────────────────────────────

function EngagementCard({ eng, onMenteeClick, onMentorClick }: {
  eng: AdminMentorshipRequest;
  onMenteeClick: (eng: AdminMentorshipRequest) => void;
  onMentorClick: (eng: AdminMentorshipRequest) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const menteeName = eng.mentee.profile?.displayName ?? eng.mentee.email;
  const mentorName = eng.mentor.profile?.displayName ?? eng.mentor.email;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <Av name={menteeName} size="xs" />
        <button onClick={() => onMenteeClick(eng)}
          className="text-xs font-semibold text-[var(--color-mavi)] hover:underline truncate max-w-[80px] text-left">
          {menteeName}
        </button>
        <span className="text-gray-300 text-xs">→</span>
        <Av name={mentorName} size="xs" />
        <button onClick={() => onMentorClick(eng)}
          className="text-xs text-gray-700 hover:text-[var(--color-mavi)] hover:underline truncate max-w-[80px] text-left">
          {mentorName}
        </button>
      </div>

      <p className="text-[11px] text-gray-600 line-clamp-1">{eng.topic}</p>
      <SessionDots sessions={eng.sessions} />

      {eng.status === 'completed' && eng.menteeFinalRating !== null && (
        <p className="text-[10px] text-amber-500 mt-1">
          {'★'.repeat(eng.menteeFinalRating)}{'☆'.repeat(5 - eng.menteeFinalRating)}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400">{fmtDate(eng.createdAt)}</span>
        <button onClick={() => setExpanded(v => !v)} className="text-[10px] text-[var(--color-mavi)] hover:underline">
          {expanded ? 'Kapat ▲' : 'Detay ▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
            <span className="font-medium text-gray-700">Hedef: </span>{eng.goal}
          </p>
          {eng.mentorNote && (
            <p className="text-[11px] text-blue-700 bg-blue-50 rounded px-2 py-1.5 mb-3">
              <span className="font-medium">Kabul notu: </span>{eng.mentorNote}
            </p>
          )}

          <div className="relative">
            {eng.sessions.length > 1 && (
              <div className="absolute left-[5px] top-3 bottom-3 w-px bg-gray-200" />
            )}
            <div className="space-y-3">
              {eng.sessions.map((s, idx) => {
                const dotColor =
                  s.status === 'completed' ? 'bg-green-500 border-green-500' :
                  s.status === 'scheduled' ? 'bg-blue-400 border-blue-400' :
                  s.status === 'cancelled' ? 'bg-red-300 border-red-300' :
                  'bg-gray-300 border-gray-300';
                const labelColor =
                  s.status === 'completed' ? 'text-green-700 bg-green-50' :
                  s.status === 'scheduled' ? 'text-blue-700 bg-blue-50' :
                  'text-gray-500 bg-gray-100';
                const labelText =
                  s.status === 'completed' ? 'Tamamlandı' :
                  s.status === 'scheduled' ? 'Planlandı' :
                  s.status === 'cancelled' ? 'İptal' : 'Tarih bekleniyor';
                const isLast = idx === eng.sessions.length - 1;

                return (
                  <div key={s.id} className={`relative flex gap-3 ${!isLast ? 'pb-1' : ''}`}>
                    <div className={`relative z-10 mt-1 w-3 h-3 rounded-full border-2 shrink-0 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-gray-800">
                          {eng.engagementType === 'periodic' ? `${s.sessionNumber}. Oturum` : 'Seans'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${labelColor}`}>{labelText}</span>
                      </div>
                      {s.scheduledAt && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {s.status === 'completed' && s.completedAt ? fmtDate(s.completedAt) : fmtDateTime(s.scheduledAt)}
                        </p>
                      )}
                      {s.status === 'completed' && (
                        <div className="mt-1.5 space-y-1">
                          {s.menteeRating !== null && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-400 text-[11px]">
                                {'★'.repeat(s.menteeRating)}{'☆'.repeat(5 - s.menteeRating)}
                              </span>
                              {s.menteeNote && (
                                <span className="text-[10px] text-gray-500 italic truncate max-w-[140px]">
                                  &ldquo;{s.menteeNote}&rdquo;
                                </span>
                              )}
                            </div>
                          )}
                          {s.mentorNote && (
                            <p className="text-[10px] text-blue-700 bg-blue-50 rounded px-2 py-1">
                              <span className="font-medium">Mentor: </span>&ldquo;{s.mentorNote}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {eng.engagementType === 'periodic' && (
                <div className="relative flex gap-3">
                  <div className={`relative z-10 mt-1 w-3 h-3 rounded-full border-2 shrink-0 ${
                    eng.status === 'completed' ? 'bg-purple-500 border-purple-500' : 'bg-gray-100 border-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-700">Dönem Değerlendirmesi</p>
                    {eng.menteeFinalComment ? (
                      <div className="mt-1 space-y-1">
                        {eng.menteeFinalRating !== null && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-400 text-[11px]">
                              {'★'.repeat(eng.menteeFinalRating)}{'☆'.repeat(5 - eng.menteeFinalRating)}
                            </span>
                            <span className="text-[10px] text-gray-500 italic truncate max-w-[140px]">
                              &ldquo;{eng.menteeFinalComment}&rdquo;
                            </span>
                          </div>
                        )}
                        {eng.mentorFinalComment && (
                          <p className="text-[10px] text-blue-700 bg-blue-50 rounded px-2 py-1">
                            <span className="font-medium">Mentor: </span>&ldquo;{eng.mentorFinalComment}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {eng.status === 'completed' ? 'Tamamlandı' : 'Oturumlar bittikçe yapılacak'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Eşleştirme Modalı — Akıllı Motor ────────────────────────────────────────

function MatchModal({ mentors, mentees, onMatch, onClose, preselected }: {
  mentors: AdminMentorProfile[];
  mentees: AdminMenteeApplication[];
  onMatch: (mentorUserId: string, menteeAppId: string, engagementType: 'single_session' | 'periodic') => Promise<void>;
  onClose: () => void;
  preselected?: AdminMenteeApplication;
}) {
  const [mentorId, setMentorId] = useState('');
  const [menteeId, setMenteeId] = useState(preselected?.id ?? '');
  const [engType, setEngType] = useState<'single_session' | 'periodic'>(
    (preselected?.engagementType as 'single_session' | 'periodic') ?? 'single_session',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pendingMentees = mentees.filter(m => m.status === 'pending');
  const selectedMentee = preselected ?? pendingMentees.find(m => m.id === menteeId);

  const compatibleMentors = mentors.filter(m =>
    m.adminStatus === 'approved' && (
      engType === 'periodic'
        ? m.capacityType === 'periodic' || m.capacityType === 'both'
        : m.capacityType === 'monthly' || m.capacityType === 'both'
    ),
  );

  const scoredMentors = selectedMentee
    ? compatibleMentors
        .map(m => ({ m, ms: scoreMentor(m, selectedMentee, engType) }))
        .sort((a, b) => b.ms.score - a.ms.score)
    : compatibleMentors.map(m => ({ m, ms: { score: 0, pct: 0, level: 'low' as const, reasons: [] } }));

  function onMenteeChange(id: string) {
    setMenteeId(id); setMentorId('');
    const found = pendingMentees.find(x => x.id === id);
    if (found) setEngType(found.engagementType as 'single_session' | 'periodic');
  }

  async function submit() {
    const finalMenteeId = selectedMentee?.id ?? menteeId;
    if (!mentorId || !finalMenteeId) return;
    setLoading(true); setError('');
    try { await onMatch(mentorId, finalMenteeId, engType); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Eşleşme oluşturulamadı.'); }
    finally { setLoading(false); }
  }

  const highCount  = scoredMentors.filter(s => s.ms.level === 'high').length;
  const midCount   = scoredMentors.filter(s => s.ms.level === 'medium').length;
  const hasMentee  = Boolean(selectedMentee ?? (menteeId !== ''));
  const noGoodMatch = hasMentee && selectedMentee && scoredMentors.length > 0 && highCount === 0 && midCount === 0;
  const menteeAreas = selectedMentee ? getMenteeExpertiseAreas(selectedMentee) : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] max-w-[96vw] bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0 flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Eşleşme Oluştur</h3>
            <p className="text-xs text-gray-400 mt-0.5">Mentee seçin · Uyumlu mentörler otomatik sıralanır</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && <p className="text-sm text-red-600 p-2.5 bg-red-50 rounded-xl">{error}</p>}

          {/* Adım 1 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 bg-[var(--color-mavi)] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">1</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mentee Seç</span>
            </div>

            {preselected ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                <Av name={preselected.user?.profile?.displayName ?? preselected.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{preselected.user?.profile?.displayName ?? preselected.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{preselected.topic}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  preselected.engagementType === 'periodic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {preselected.engagementType === 'periodic' ? 'Dönemlik' : '1 Seans'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <select value={menteeId} onChange={e => onMenteeChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 bg-white">
                  <option value="">— Mentee seç</option>
                  {pendingMentees.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.user?.profile?.displayName ?? m.name} · {m.engagementType === 'periodic' ? 'Dönemlik' : '1 Seans'} · {m.topic}
                    </option>
                  ))}
                </select>
                {selectedMentee && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-semibold text-blue-800 mb-0.5">{selectedMentee.topic}</p>
                    <p className="text-[11px] text-blue-600 line-clamp-2 leading-relaxed">{selectedMentee.goal}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {FORMAT_LABEL[selectedMentee.preferredFormat] ?? selectedMentee.preferredFormat}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        selectedMentee.engagementType === 'periodic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {selectedMentee.engagementType === 'periodic' ? 'Dönemlik · 4 ay' : '1 Seans'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Adım 2 — Scored mentor cards */}
          {hasMentee && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 bg-[var(--color-mavi)] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">2</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mentor Seç</span>
                {selectedMentee && (
                  <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-1.5">
                    {highCount > 0 && <span className="text-emerald-600 font-semibold">{highCount} çok uyumlu</span>}
                    {highCount > 0 && midCount > 0 && <span className="text-gray-300">·</span>}
                    {midCount > 0 && <span className="text-yellow-600 font-semibold">{midCount} kısmen</span>}
                    {menteeAreas.length > 0 && (
                      <span className="text-gray-300 ml-1">
                        Yönelim: {menteeAreas.map(a => EXPERTISE_TR[a] ?? a).join(', ')}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Uyarı: hiç iyi eşleşme yok */}
              {noGoodMatch && (
                <div className="mb-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Uygun eşleşme bulunamadı</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Mevcut mentörlerin hiçbiri bu mentee için %30 üzeri uyum göstermiyor.
                      Aşağıdan manuel olarak bir mentor seçebilir ya da yeni mentor onaylayana kadar bekleyebilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {scoredMentors.length === 0 ? (
                <ColEmpty text="Bu program türü için onaylı, uyumlu mentor bulunamadı." />
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-0.5">
                  {scoredMentors.map(({ m, ms }) => {
                    const cfg = LEVEL_CONFIG[ms.level];
                    const isSelected = mentorId === m.userId;
                    return (
                      <button key={m.userId} type="button" onClick={() => setMentorId(m.userId)}
                        className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${
                          isSelected
                            ? 'border-[var(--color-mavi)] bg-[var(--color-mavi)]/5 ring-1 ring-[var(--color-mavi)]/20'
                            : `${cfg.border} ${cfg.bg} hover:border-gray-300`
                        }`}>

                        {/* % uyum bar */}
                        {selectedMentee && (
                          <div className="h-1 w-full bg-gray-100">
                            <div
                              className={`h-full transition-all duration-300 ${cfg.bar}`}
                              style={{ width: `${ms.pct}%` }}
                            />
                          </div>
                        )}

                        <div className="p-3.5">
                          <div className="flex items-start gap-2.5">
                            <div className="relative shrink-0">
                              <Av name={m.user.profile?.displayName ?? m.user.email} />
                              {isSelected && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[var(--color-mavi)] rounded-full flex items-center justify-center">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">
                                  {m.user.profile?.displayName ?? m.user.email}
                                </span>
                                {selectedMentee && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${cfg.badge}`}>
                                    {ms.pct}% · {cfg.label}
                                  </span>
                                )}
                                {m.user.profile?.profession && (
                                  <span className="text-[10px] text-gray-400">{m.user.profile.profession}</span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {(m.capacityType === 'monthly' || m.capacityType === 'both') && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">1 Seans: {m.monthlyCapacity}/ay</span>
                                )}
                                {(m.capacityType === 'periodic' || m.capacityType === 'both') && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">Dönemlik: {m.periodicCapacity}</span>
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{m.sessionDurationMin}–{m.sessionDurationMax} dk</span>
                                {m.city && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{m.city}</span>}
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {m.expertiseAreas.slice(0, 4).map(a => {
                                  const isMatch = menteeAreas.includes(a);
                                  return (
                                    <span key={a} className={`text-[10px] px-1.5 py-0.5 border rounded font-medium ${
                                      isMatch
                                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                                        : 'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                      {isMatch && '◈ '}{expertiseLabel(a)}
                                    </span>
                                  );
                                })}
                                {m.expertiseAreas.length > 4 && (
                                  <span className="text-[10px] text-gray-400">+{m.expertiseAreas.length - 4}</span>
                                )}
                              </div>

                              {ms.reasons.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
                                  {ms.reasons.map((r, i) => (
                                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${REASON_CHIP[r.kind]}`}>
                                      {REASON_ICON[r.kind]} {r.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {engType === 'periodic' && selectedMentee && (
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700">
              4 ay boyunca ayda 1 oturum (toplam 4 oturum). Tarihler mentor tarafından belirlenir.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 shrink-0 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            İptal
          </button>
          <button disabled={loading || !mentorId || !hasMentee} onClick={() => void submit()}
            className="flex-1 py-2.5 text-sm font-semibold bg-[var(--color-mavi)] text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
            {loading ? 'Gönderiliyor…' : 'Mentöre Gönder →'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Mentor Detay Modalı ──────────────────────────────────────────────────────

function MentorDetailModal({ mentor, onClose, onReview }: {
  mentor: AdminMentorProfile;
  onClose: () => void;
  onReview: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const name = mentor.user.profile?.displayName ?? mentor.user.email;

  async function doReview(status: 'approved' | 'rejected') {
    setBusy(true);
    try { await onReview(mentor.id, status); onClose(); } finally { setBusy(false); }
  }

  const InfoIcon = () => (
    <button
      onClick={() => setShowProfile(v => !v)}
      title={showProfile ? 'Özete dön' : 'Profil detayı'}
      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
        showProfile
          ? 'bg-[#26496b]/10 text-[#26496b]'
          : 'text-gray-300 hover:text-[#26496b] hover:bg-[#26496b]/8'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[95vw] bg-white rounded-2xl shadow-2xl z-50 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Av name={name} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-gray-900 text-base">{name}</p>
                <InfoIcon />
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${MENTOR_STATUS_COLOR[mentor.adminStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                  {MENTOR_STATUS_LABEL[mentor.adminStatus] ?? mentor.adminStatus}
                </span>
              </div>
              <p className="text-xs text-gray-400">{mentor.user.email}</p>
              {mentor.user.profile?.profession && (
                <p className="text-xs text-gray-500 mt-0.5">{mentor.user.profile.profession}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showProfile && (
          <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Mentor Kaydı: {mentor.id.slice(0, 8).toUpperCase()}
            </p>
            <div className="bg-white rounded-lg border border-gray-100 text-sm overflow-hidden">
              {[
                { label: 'Format', value: FORMAT_LABEL[mentor.sessionFormat] ?? mentor.sessionFormat },
                { label: 'Seans Süresi', value: `${mentor.sessionDurationMin}–${mentor.sessionDurationMax} dakika` },
                ...(mentor.city ? [{ label: 'Şehir', value: mentor.city }] : []),
                { label: 'Tamamlanan', value: `${mentor.completedSessionCount} seans` },
                { label: 'Durum', value: MENTOR_STATUS_LABEL[mentor.adminStatus] ?? mentor.adminStatus },
              ].map((row, i, arr) => (
                <div key={row.label} className={`flex ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <span className="w-32 shrink-0 px-3 py-2.5 text-xs text-gray-500">{row.label}</span>
                  <span className="flex-1 px-3 py-2.5 text-xs text-gray-900 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {(mentor.capacityType === 'monthly' || mentor.capacityType === 'both') && (
            <div className="bg-blue-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-blue-700">{mentor.monthlyCapacity}</p>
              <p className="text-[10px] text-blue-500 mt-0.5">kişi/ay (1 seans)</p>
            </div>
          )}
          {(mentor.capacityType === 'periodic' || mentor.capacityType === 'both') && (
            <div className="bg-purple-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-purple-700">{mentor.periodicCapacity}</p>
              <p className="text-[10px] text-purple-500 mt-0.5">kişi (dönemlik)</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-gray-700">{mentor.sessionDurationMin}–{mentor.sessionDurationMax}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">dakika/seans</p>
          </div>
          <div className="bg-green-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-green-700">{mentor.completedSessionCount}</p>
            <p className="text-[10px] text-green-500 mt-0.5">tamamlanan</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
            {FORMAT_LABEL[mentor.sessionFormat] ?? mentor.sessionFormat}
          </span>
          {mentor.city && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">{mentor.city}</span>}
        </div>

        {mentor.bio && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Hakkında</p>
            <p className="text-sm text-gray-700 leading-relaxed">{mentor.bio}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Uzmanlık Alanları</p>
          <div className="flex flex-wrap gap-1">
            {mentor.expertiseAreas.map(a => (
              <span key={a} className="px-2 py-1 bg-[var(--color-mavi)]/10 text-[var(--color-mavi)] rounded-lg text-xs font-medium">
                {expertiseLabel(a)}
              </span>
            ))}
          </div>
        </div>

        {mentor.adminNote && (
          <div className="mb-4 p-3 bg-orange-50 rounded-xl text-xs text-orange-700">
            <span className="font-semibold">Admin notu: </span>{mentor.adminNote}
          </div>
        )}

        {mentor.adminStatus === 'pending' ? (
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => void doReview('rejected')}
              className="flex-1 py-2.5 text-sm font-medium border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50">
              Reddet
            </button>
            <button disabled={busy} onClick={() => void doReview('approved')}
              className="flex-1 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50">
              {busy ? 'İşleniyor…' : 'Onayla'}
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="w-full py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            Kapat
          </button>
        )}
      </div>
    </>
  );
}

// ─── Mentor Havuzu Kartı ──────────────────────────────────────────────────────

function MentorPoolCard({ mentor, onDetail }: {
  mentor: AdminMentorProfile;
  onDetail: (mentor: AdminMentorProfile) => void;
}) {
  const name = mentor.user.profile?.displayName ?? mentor.user.email;
  const isPending = mentor.adminStatus === 'pending';

  return (
    <div className={`bg-white border rounded-xl p-3.5 hover:shadow-sm transition-all ${
      isPending ? 'border-yellow-200 hover:border-yellow-300' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start gap-2 mb-2">
        <Av name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-[10px] text-gray-400 truncate">{mentor.user.email}</p>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${MENTOR_STATUS_COLOR[mentor.adminStatus] ?? 'bg-gray-100 text-gray-600'}`}>
          {MENTOR_STATUS_LABEL[mentor.adminStatus] ?? mentor.adminStatus}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {(mentor.capacityType === 'monthly' || mentor.capacityType === 'both') && (
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">1 Seans: {mentor.monthlyCapacity}/ay</span>
        )}
        {(mentor.capacityType === 'periodic' || mentor.capacityType === 'both') && (
          <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded font-medium">Dönemlik: {mentor.periodicCapacity}</span>
        )}
        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{mentor.sessionDurationMin}–{mentor.sessionDurationMax} dk</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {mentor.expertiseAreas.slice(0, 3).map(a => (
          <span key={a} className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded border border-gray-100">
            {expertiseLabel(a)}
          </span>
        ))}
        {mentor.expertiseAreas.length > 3 && (
          <span className="text-[10px] text-gray-400">+{mentor.expertiseAreas.length - 3}</span>
        )}
      </div>

      <button onClick={() => onDetail(mentor)}
        className="w-full py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        {isPending ? 'İncele & Onayla' : 'Detay'}
      </button>
    </div>
  );
}

// ─── Mock Veri (backend hazır olunca kalkar) ──────────────────────────────────

const MOCK_MENTORS: AdminMentorProfile[] = [
  {
    id: 'mp-1', userId: 'u-m1', adminStatus: 'approved', adminNote: null,
    expertiseAreas: ['cbs_gis', 'uzaktan_algilama', 'yazilim_teknoloji'],
    bio: 'TKGM\'de 12 yıl CBS uzmanı olarak çalıştım. ArcGIS, QGIS ve Python konusunda deneyimliyim.',
    sessionFormat: 'online', sessionDurationMin: 45, sessionDurationMax: 60,
    capacityType: 'both', city: 'Ankara', monthlyCapacity: 3, periodicCapacity: 2,
    isAcceptingRequests: true, completedSessionCount: 9, createdAt: '2025-09-15T10:00:00Z',
    user: { id: 'u-m1', email: 'ahmet.kaya@example.com', profile: { displayName: 'Ahmet Kaya', profession: 'CBS Uzmanı' } },
  },
  {
    id: 'mp-2', userId: 'u-m2', adminStatus: 'approved', adminNote: null,
    expertiseAreas: ['fotogrametri', 'lidar_nokta_bulutu', 'uzaktan_algilama'],
    bio: 'İnsansız hava araçları ve fotogrametri üzerine doktora yapıyorum. Drone ile 3D modelleme projeleri yürütüyorum.',
    sessionFormat: 'both', sessionDurationMin: 30, sessionDurationMax: 60,
    capacityType: 'monthly', city: 'İstanbul', monthlyCapacity: 4, periodicCapacity: 0,
    isAcceptingRequests: true, completedSessionCount: 5, createdAt: '2025-10-20T10:00:00Z',
    user: { id: 'u-m2', email: 'selin.celik@example.com', profile: { displayName: 'Selin Çelik', profession: 'Fotogrametri Araştırmacısı' } },
  },
  {
    id: 'mp-3', userId: 'u-m3', adminStatus: 'approved', adminNote: null,
    expertiseAreas: ['kariyer_danismanligi', 'girisimcilik'],
    bio: 'Harita sektöründe 18 yıl, şu an kendi danışmanlık şirketini kurmuş durumdayım. Kariyer geçişlerinde rehberlik ediyorum.',
    sessionFormat: 'online', sessionDurationMin: 45, sessionDurationMax: 90,
    capacityType: 'periodic', city: 'Bursa', monthlyCapacity: 0, periodicCapacity: 3,
    isAcceptingRequests: true, completedSessionCount: 12, createdAt: '2025-08-01T10:00:00Z',
    user: { id: 'u-m3', email: 'fatih.arslan@example.com', profile: { displayName: 'Fatih Arslan', profession: 'Kariyer Danışmanı' } },
  },
  {
    id: 'mp-4', userId: 'u-m4', adminStatus: 'pending', adminNote: null,
    expertiseAreas: ['kadastro', 'hukuk_mevzuat', 'gayrimenkul'],
    bio: 'Tapu ve Kadastro Genel Müdürlüğü\'nde uzman kadastro mühendisi. 8 yıl deneyim.',
    sessionFormat: 'in_person', sessionDurationMin: 60, sessionDurationMax: 90,
    capacityType: 'monthly', city: 'Ankara', monthlyCapacity: 2, periodicCapacity: 0,
    isAcceptingRequests: true, completedSessionCount: 0, createdAt: '2026-05-10T10:00:00Z',
    user: { id: 'u-m4', email: 'merve.ozturk@example.com', profile: { displayName: 'Merve Öztürk', profession: 'Kadastro Mühendisi' } },
  },
];

const MOCK_MENTEES: AdminMenteeApplication[] = [
  {
    id: 'ma-1', userId: 'u-me1', name: 'Emre Taş', email: 'emre.tas@example.com',
    topic: 'CBS ve Python entegrasyonu için kariyer yönlendirmesi',
    goal: 'Geomatik mühendisliği lisans öğrencisiyim. Python ile mekansal veri analizi öğrenmek ve bu alanda kariyerimi şekillendirmek istiyorum.',
    preferredFormat: 'online', engagementType: 'single_session', source: 'mutfak',
    status: 'pending', adminNote: null, createdAt: '2026-05-14T09:00:00Z',
    user: { id: 'u-me1', email: 'emre.tas@example.com', profile: {
      displayName: 'Emre Taş', city: 'Erzurum', profession: 'Geomatik Öğrencisi',
      bio: null, birthDate: null, graduationYear: 2027, workStatus: 'student',
      professionalExperienceYears: 0, skillTags: ['CBS', 'GIS', 'Python', 'QGIS'], linkedinUrl: null,
    }},
  },
  {
    id: 'ma-2', userId: 'u-me2', name: 'Zeynep Arslan', email: 'zeynep.arslan@example.com',
    topic: 'Drone fotogrametri ve 3D modelleme',
    goal: 'Yeni mezun harita mühendisiyim. Drone ile fotogrametrik ölçme ve nokta bulutu işleme konusunda deneyimli bir mentörden pratik bilgi almak istiyorum.',
    preferredFormat: 'both', engagementType: 'periodic', source: 'sahne',
    status: 'pending', adminNote: null, createdAt: '2026-05-12T14:00:00Z',
    user: { id: 'u-me2', email: 'zeynep.arslan@example.com', profile: {
      displayName: 'Zeynep Arslan', city: 'Trabzon', profession: 'Harita Mühendisi',
      bio: null, birthDate: null, graduationYear: 2026, workStatus: 'job_seeking',
      professionalExperienceYears: 0, skillTags: ['Fotogrametri', 'Drone', 'UAV'], linkedinUrl: null,
    }},
  },
  {
    id: 'ma-3', userId: 'u-me3', name: 'Can Yılmaz', email: 'can.yilmaz@example.com',
    topic: 'Harita sektöründen yazılım geliştirmeye geçiş',
    goal: 'Geomatik mühendisliği bitirdim, yazılım alanına geçiş yapmak istiyorum. Bu geçişi başarıyla yapmış biriyle konuşmak istiyorum.',
    preferredFormat: 'online', engagementType: 'single_session', source: 'mutfak',
    status: 'pending', adminNote: null, createdAt: '2026-05-16T11:00:00Z',
    user: { id: 'u-me3', email: 'can.yilmaz@example.com', profile: {
      displayName: 'Can Yılmaz', city: 'İzmir', profession: 'Geomatik Mühendisi',
      bio: null, birthDate: null, graduationYear: 2024, workStatus: 'employed',
      professionalExperienceYears: 1, skillTags: ['CBS', 'Yazılım', 'Python', 'JavaScript'], linkedinUrl: null,
    }},
  },
];

const MOCK_ENGAGEMENTS: AdminMentorshipRequest[] = [
  // Pending — single_session
  {
    id: 'me-1', status: 'pending', engagementType: 'single_session', periodMonths: null,
    topic: 'QGIS ile taşınmaz değerleme analizleri',
    goal: 'Taşınmaz değerlemede CBS araçlarını nasıl kullanabileceğimi öğrenmek istiyorum.',
    preferredFormat: 'online', initiatedBy: 'admin', createdAt: '2026-05-17T08:00:00Z',
    completedAt: null, mentorNote: null, menteeFinalRating: null, menteeFinalComment: null, mentorFinalComment: null,
    sessions: [{ id: 'ses-1', engagementId: 'me-1', sessionNumber: 1, scheduledAt: null, status: 'pending', actualDurationMinutes: null, menteeNote: null, menteeRating: null, mentorNote: null, completedAt: null, createdAt: '2026-05-17T08:00:00Z' }],
    mentee: { id: 'u-e1', email: 'burak.aktas@example.com', profile: { displayName: 'Burak Aktaş' } },
    mentor: { id: 'u-m1', email: 'ahmet.kaya@example.com', profile: { displayName: 'Ahmet Kaya' } },
  },
  // Pending — periodic
  {
    id: 'me-2', status: 'pending', engagementType: 'periodic', periodMonths: 4,
    topic: 'Uzaktan algılama alanında dönemlik mentorluk',
    goal: 'Uydu görüntüsü işleme ve makine öğrenimi konularında sistematik rehberlik almak istiyorum.',
    preferredFormat: 'online', initiatedBy: 'admin', createdAt: '2026-05-15T10:00:00Z',
    completedAt: null, mentorNote: null, menteeFinalRating: null, menteeFinalComment: null, mentorFinalComment: null,
    sessions: [
      { id: 'ses-2a', engagementId: 'me-2', sessionNumber: 1, scheduledAt: null, status: 'pending', actualDurationMinutes: null, menteeNote: null, menteeRating: null, mentorNote: null, completedAt: null, createdAt: '2026-05-15T10:00:00Z' },
      { id: 'ses-2b', engagementId: 'me-2', sessionNumber: 2, scheduledAt: null, status: 'pending', actualDurationMinutes: null, menteeNote: null, menteeRating: null, mentorNote: null, completedAt: null, createdAt: '2026-05-15T10:00:00Z' },
      { id: 'ses-2c', engagementId: 'me-2', sessionNumber: 3, scheduledAt: null, status: 'pending', actualDurationMinutes: null, menteeNote: null, menteeRating: null, mentorNote: null, completedAt: null, createdAt: '2026-05-15T10:00:00Z' },
      { id: 'ses-2d', engagementId: 'me-2', sessionNumber: 4, scheduledAt: null, status: 'pending', actualDurationMinutes: null, menteeNote: null, menteeRating: null, mentorNote: null, completedAt: null, createdAt: '2026-05-15T10:00:00Z' },
    ],
    mentee: { id: 'u-e2', email: 'deniz.erdogan@example.com', profile: { displayName: 'Deniz Erdoğan' } },
    mentor: { id: 'u-m2', email: 'selin.celik@example.com', profile: { displayName: 'Selin Çelik' } },
  },
  // Active — single_session (scheduled)
  {
    id: 'me-3', status: 'accepted', engagementType: 'single_session', periodMonths: null,
    topic: 'Kariyer danışmanlığı: kamu mu özel mi?',
    goal: 'Mühendislik kariyerimde kamu ile özel sektör arasındaki farkları değerlendirmek istiyorum.',
    preferredFormat: 'online', initiatedBy: 'admin', createdAt: '2026-05-05T09:00:00Z',
    completedAt: null, mentorNote: 'Seans için uygun tarih belirledik, görüşmeyi sabırsızlıkla bekliyorum.',
    menteeFinalRating: null, menteeFinalComment: null, mentorFinalComment: null,
    sessions: [{ id: 'ses-3', engagementId: 'me-3', sessionNumber: 1, scheduledAt: '2026-05-22T14:00:00Z', status: 'scheduled', actualDurationMinutes: null, menteeNote: null, menteeRating: null, mentorNote: null, completedAt: null, createdAt: '2026-05-07T10:00:00Z' }],
    mentee: { id: 'u-e3', email: 'ali.sahin@example.com', profile: { displayName: 'Ali Şahin' } },
    mentor: { id: 'u-m3', email: 'fatih.arslan@example.com', profile: { displayName: 'Fatih Arslan' } },
  },
  // Active — periodic (2/4 tamamlandı)
  {
    id: 'me-4', status: 'accepted', engagementType: 'periodic', periodMonths: 4,
    topic: 'CBS ile mekansal analiz ve Python entegrasyonu',
    goal: '4 ay boyunca CBS ve Python entegrasyonu üzerine sistemli çalışmak istiyorum. Her ay bir konuyu derinlemesine öğrenmek hedefliyorum.',
    preferredFormat: 'online', initiatedBy: 'admin', createdAt: '2026-03-01T09:00:00Z',
    completedAt: null, mentorNote: 'İlk iki seans çok verimli geçti. GeoPandas ve Shapely üzerine çalışıyoruz.',
    menteeFinalRating: null, menteeFinalComment: null, mentorFinalComment: null,
    sessions: [
      { id: 'ses-4a', engagementId: 'me-4', sessionNumber: 1, scheduledAt: '2026-03-15T15:00:00Z', status: 'completed', actualDurationMinutes: 55, menteeNote: 'GeoPandas temellerini öğrendim, çok faydalıydı.', menteeRating: 5, mentorNote: 'Hızlı öğreniyor, sorular kaliteli.', completedAt: '2026-03-15T15:55:00Z', createdAt: '2026-03-10T09:00:00Z' },
      { id: 'ses-4b', engagementId: 'me-4', sessionNumber: 2, scheduledAt: '2026-04-12T15:00:00Z', status: 'completed', actualDurationMinutes: 50, menteeNote: 'Shapely ile alan analizi yaptık.', menteeRating: 4, mentorNote: 'Projeler üzerinde pratik yapıyor.', completedAt: '2026-04-12T15:50:00Z', createdAt: '2026-04-08T09:00:00Z' },
      { id: 'ses-4c', engagementId: 'me-4', sessionNumber: 3, scheduledAt: '2026-05-24T15:00:00Z', status: 'scheduled', actualDurationMinutes: null, menteeNote: null, menteeRating: null, mentorNote: null, completedAt: null, createdAt: '2026-05-10T09:00:00Z' },
      { id: 'ses-4d', engagementId: 'me-4', sessionNumber: 4, scheduledAt: null, status: 'pending', actualDurationMinutes: null, menteeNote: null, menteeRating: null, mentorNote: null, completedAt: null, createdAt: '2026-03-01T09:00:00Z' },
    ],
    mentee: { id: 'u-e4', email: 'merve.gunes@example.com', profile: { displayName: 'Merve Güneş' } },
    mentor: { id: 'u-m1', email: 'ahmet.kaya@example.com', profile: { displayName: 'Ahmet Kaya' } },
  },
  // Completed — single_session
  {
    id: 'me-5', status: 'completed', engagementType: 'single_session', periodMonths: null,
    topic: 'Drone operatörlüğü ve fotogrametri iş fırsatları',
    goal: 'Lisansüstü eğitim mi yapayım yoksa sektöre mi gireyim sorusunu bir uzmanla konuşmak istedim.',
    preferredFormat: 'online', initiatedBy: 'admin', createdAt: '2026-04-01T09:00:00Z',
    completedAt: '2026-04-20T16:00:00Z', mentorNote: 'Sektör trendlerini ve akademik yolun avantajlarını paylaştım.',
    menteeFinalRating: 5, menteeFinalComment: 'Çok değerliydi. Net bir yol haritası çıkardım.', mentorFinalComment: 'Başarılı bir görüşmeydi, motive mentee.',
    sessions: [{ id: 'ses-5', engagementId: 'me-5', sessionNumber: 1, scheduledAt: '2026-04-20T15:00:00Z', status: 'completed', actualDurationMinutes: 60, menteeNote: 'Harika bir seans, çok öğrendim!', menteeRating: 5, mentorNote: 'Vizyonu açık, doğru soruları soruyor.', completedAt: '2026-04-20T16:00:00Z', createdAt: '2026-04-10T09:00:00Z' }],
    mentee: { id: 'u-e5', email: 'omer.kurt@example.com', profile: { displayName: 'Ömer Kurt' } },
    mentor: { id: 'u-m2', email: 'selin.celik@example.com', profile: { displayName: 'Selin Çelik' } },
  },
  // Completed — periodic
  {
    id: 'me-6', status: 'completed', engagementType: 'periodic', periodMonths: 4,
    topic: 'Serbest çalışma ve girişimcilik danışmanlığı',
    goal: '4 ay boyunca kendi ofisimi kurma sürecinde rehberlik almak istedim. İş kurma, müşteri bulma ve fiyatlandırma konularında destek lazımdı.',
    preferredFormat: 'online', initiatedBy: 'admin', createdAt: '2025-12-01T09:00:00Z',
    completedAt: '2026-04-10T09:00:00Z', mentorNote: 'Başarılı bir dönem geçirdik. İlk müşterisini edindi.',
    menteeFinalRating: 5, menteeFinalComment: 'Mentörüm olmadan bu kadar hızlı ilerleyemezdim. Teşekkürler!', mentorFinalComment: 'Kararlı ve çalışkan bir mentee. Başarılarını takip edeceğim.',
    sessions: [
      { id: 'ses-6a', engagementId: 'me-6', sessionNumber: 1, scheduledAt: '2025-12-15T14:00:00Z', status: 'completed', actualDurationMinutes: 60, menteeNote: 'İş planı üzerine çalıştık.', menteeRating: 5, mentorNote: 'Hazırlıklı geldi.', completedAt: '2025-12-15T15:00:00Z', createdAt: '2025-12-10T09:00:00Z' },
      { id: 'ses-6b', engagementId: 'me-6', sessionNumber: 2, scheduledAt: '2026-01-18T14:00:00Z', status: 'completed', actualDurationMinutes: 55, menteeNote: 'Müşteri sunumu hazırladık.', menteeRating: 5, mentorNote: 'Hızlı ilerleme.', completedAt: '2026-01-18T14:55:00Z', createdAt: '2026-01-15T09:00:00Z' },
      { id: 'ses-6c', engagementId: 'me-6', sessionNumber: 3, scheduledAt: '2026-02-20T14:00:00Z', status: 'completed', actualDurationMinutes: 50, menteeNote: 'Fiyatlandırma stratejisi netleşti.', menteeRating: 4, mentorNote: 'İyi gelişme.', completedAt: '2026-02-20T14:50:00Z', createdAt: '2026-02-17T09:00:00Z' },
      { id: 'ses-6d', engagementId: 'me-6', sessionNumber: 4, scheduledAt: '2026-04-10T14:00:00Z', status: 'completed', actualDurationMinutes: 65, menteeNote: 'Dönem değerlendirmesi çok iyi geçti.', menteeRating: 5, mentorNote: 'Tüm hedefleri tamamladı.', completedAt: '2026-04-10T15:05:00Z', createdAt: '2026-04-08T09:00:00Z' },
    ],
    mentee: { id: 'u-e6', email: 'seda.yalcin@example.com', profile: { displayName: 'Seda Yalçın' } },
    mentor: { id: 'u-m3', email: 'fatih.arslan@example.com', profile: { displayName: 'Fatih Arslan' } },
  },
];

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

type ParticipantClick = { type: 'mentee' | 'mentor'; eng: AdminMentorshipRequest };

export default function MentorlukPage() {
  const [pipelineType, setPipelineType] = useState<'single_session' | 'periodic'>('single_session');
  const [mentors, setMentors] = useState<AdminMentorProfile[]>(MOCK_MENTORS);
  const [mentees, setMentees] = useState<AdminMenteeApplication[]>(MOCK_MENTEES);
  const [engagements, setEngagements] = useState<AdminMentorshipRequest[]>(MOCK_ENGAGEMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchTarget, setMatchTarget] = useState<AdminMenteeApplication | true | null>(null);
  const [detailMentee, setDetailMentee] = useState<AdminMenteeApplication | null>(null);
  const [detailMentor, setDetailMentor] = useState<AdminMentorProfile | null>(null);
  const [participantClick, setParticipantClick] = useState<ParticipantClick | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());

  function toggleGroupLeft() {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      const rightAllCollapsed = next.has('pending') && next.has('active') && next.has('completed');
      if (rightAllCollapsed) {
        next.delete('pending'); next.delete('active'); next.delete('completed');
      } else {
        next.add('mentee'); next.add('mentor');
      }
      return next;
    });
  }

  function toggleGroupRight() {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      const leftAllCollapsed = next.has('mentee') && next.has('mentor');
      if (leftAllCollapsed) {
        next.delete('mentee'); next.delete('mentor');
      } else {
        next.add('pending'); next.add('active'); next.add('completed');
      }
      return next;
    });
  }

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [m, me, eng] = await Promise.all([
        adminApi.listMentorPool(),
        adminApi.listMenteePool(),
        adminApi.listAdminMentorshipRequests(),
      ]);
      // Only switch to live data when the mentor pool has real entries; until
      // the backend is fully seeded we keep the demo dataset visible.
      if (m.length > 0) { setMentors(m); setMentees(me); setEngagements(eng); }
    } catch { /* mock data already set as initial state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    try {
      const updated = await adminApi.reviewMentor(id, status);
      setMentors(prev => prev.map(m => m.id === updated.id ? { ...m, adminStatus: updated.adminStatus } : m));
    } catch { setError('İşlem başarısız.'); }
  }

  async function handleMatch(mentorUserId: string, menteeAppId: string, engagementType: 'single_session' | 'periodic') {
    await adminApi.adminCreateMatch(mentorUserId, menteeAppId, engagementType);
    await loadAll();
  }

  // Pipeline verileri
  const pool       = mentees.filter(m => m.engagementType === pipelineType && m.status === 'pending');
  const pendingEng = engagements.filter(e => e.engagementType === pipelineType && e.status === 'pending');
  const activeEng  = engagements.filter(e => e.engagementType === pipelineType && e.status === 'accepted');
  const completedEng = engagements.filter(e => e.engagementType === pipelineType && e.status === 'completed');

  const totalPool      = mentees.filter(m => m.status === 'pending').length;
  const totalActive    = engagements.filter(e => e.status === 'accepted').length;
  const totalCompleted = engagements.filter(e => e.status === 'completed').length;
  const pendingMentors = mentors.filter(m => m.adminStatus === 'pending').length;

  const isPeriodic = pipelineType === 'periodic';

  const leftGroupCollapsed  = collapsedCols.has('mentee') && collapsedCols.has('mentor');
  const rightGroupCollapsed = collapsedCols.has('pending') && collapsedCols.has('active') && collapsedCols.has('completed');

  const participantMentorProfile = participantClick?.type === 'mentor'
    ? mentors.find(m => m.userId === participantClick.eng.mentor.id)
    : undefined;

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Haritailesi Mentörlük Sistemi</h1>
          <p className="text-sm text-gray-400 mt-0.5">1 Seans ve Dönemlik (4 ay) süreç takibi</p>
        </div>
        <button onClick={() => setMatchTarget(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-mavi)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Eşleşme Oluştur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Mentee Havuzunda', value: totalPool, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Mentor Onayı Bekleyen', value: pendingMentors, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Aktif Eşleşme', value: totalActive, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tamamlanan', value: totalCompleted, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">×</button>
        </div>
      )}

      {/* Tab Seçici */}
      <div className="flex gap-2 mb-5">
        {(['single_session', 'periodic'] as const).map(t => {
          const active = pipelineType === t;
          const poolCount = mentees.filter(m => m.engagementType === t && m.status === 'pending').length;
          return (
            <button key={t} onClick={() => setPipelineType(t)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                active
                  ? t === 'single_session'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-purple-600 border-purple-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                t === 'single_session'
                  ? active ? 'bg-blue-200' : 'bg-blue-400'
                  : active ? 'bg-purple-200' : 'bg-purple-400'
              }`} />
              {t === 'single_session' ? '1 Seans' : 'Dönemlik (4 ay)'}
              {poolCount > 0 && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {poolCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tam Kanban — havuzlar dahil 5 kolon */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[var(--color-mavi)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-hidden min-h-[calc(100vh-340px)]">
          <div className="flex gap-4 min-w-max">

            {/* 1 — Mentee Havuzu */}
            <PipelineCol
              title="Mentee Havuzu"
              count={pool.length}
              dot={isPeriodic ? 'bg-purple-400' : 'bg-blue-400'}
              badge={isPeriodic ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
              collapsed={collapsedCols.has('mentee')}
            >
              {pool.length === 0
                ? <ColEmpty text={`Bekleyen ${isPeriodic ? 'dönemlik' : '1 seans'} mentee yok`} />
                : pool.map(app => (
                    <MenteePoolCard key={app.id} app={app} onMatch={setMatchTarget} onDetail={setDetailMentee} />
                  ))
              }
            </PipelineCol>


            {/* 2 — Mentor Havuzu */}
            <PipelineCol
              title="Mentor Havuzu"
              count={mentors.length}
              dot="bg-teal-400"
              badge="bg-teal-100 text-teal-700"
              collapsed={collapsedCols.has('mentor')}
            >
              {mentors.length === 0
                ? <ColEmpty text="Kayıtlı mentor yok" />
                : mentors.map(m => (
                    <MentorPoolCard key={m.id} mentor={m} onDetail={setDetailMentor} />
                  ))
              }
            </PipelineCol>

            {/* ‹ › grup ayracı */}
            <GroupSeparator
              onLeft={toggleGroupLeft}
              onRight={toggleGroupRight}
              leftTitle={rightGroupCollapsed ? 'Sağ paneli genişlet' : 'Sol grubu daralt'}
              rightTitle={leftGroupCollapsed ? 'Sol paneli genişlet' : 'Sağ grubu daralt'}
            />

            {/* 3 — Mentor Onayı Bekleniyor */}
            <PipelineCol
              title="Mentor Onayı Bekleniyor"
              count={pendingEng.length}
              dot="bg-amber-400"
              badge="bg-amber-100 text-amber-700"
              collapsed={collapsedCols.has('pending')}
            >
              {pendingEng.length === 0
                ? <ColEmpty text="Onay bekleyen eşleşme yok" />
                : pendingEng.map(eng => (
                    <EngagementCard key={eng.id} eng={eng}
                      onMenteeClick={eng => setParticipantClick({ type: 'mentee', eng })}
                      onMentorClick={eng => setParticipantClick({ type: 'mentor', eng })} />
                  ))
              }
            </PipelineCol>


            {/* 4 — Aktif */}
            <PipelineCol
              title="Aktif"
              count={activeEng.length}
              dot="bg-blue-500"
              badge="bg-blue-100 text-blue-700"
              collapsed={collapsedCols.has('active')}
            >
              {activeEng.length === 0
                ? <ColEmpty text="Aktif eşleşme yok" />
                : activeEng.map(eng => (
                    <EngagementCard key={eng.id} eng={eng}
                      onMenteeClick={eng => setParticipantClick({ type: 'mentee', eng })}
                      onMentorClick={eng => setParticipantClick({ type: 'mentor', eng })} />
                  ))
              }
            </PipelineCol>


            {/* 5 — Tamamlandı */}
            <PipelineCol
              title="Tamamlandı"
              count={completedEng.length}
              dot="bg-green-500"
              badge="bg-green-100 text-green-700"
              collapsed={collapsedCols.has('completed')}
            >
              {completedEng.length === 0
                ? <ColEmpty text="Tamamlanan eşleşme yok" />
                : completedEng.slice(0, 15).map(eng => (
                    <EngagementCard key={eng.id} eng={eng}
                      onMenteeClick={eng => setParticipantClick({ type: 'mentee', eng })}
                      onMentorClick={eng => setParticipantClick({ type: 'mentor', eng })} />
                  ))
              }
            </PipelineCol>

          </div>
        </div>
      )}

      {/* Modaller */}
      {participantClick && (
        <ParticipantProfileModal
          eng={participantClick.eng}
          type={participantClick.type}
          mentorProfile={participantMentorProfile}
          onClose={() => setParticipantClick(null)}
        />
      )}
      {detailMentee && (
        <MenteeDetailModal
          app={detailMentee}
          onClose={() => setDetailMentee(null)}
          onMatch={app => { setDetailMentee(null); setMatchTarget(app); }}
        />
      )}
      {detailMentor && (
        <MentorDetailModal
          mentor={detailMentor}
          onClose={() => setDetailMentor(null)}
          onReview={async (id, status) => {
            await handleReview(id, status);
            setDetailMentor(prev => prev ? { ...prev, adminStatus: status } : null);
          }}
        />
      )}
      {matchTarget !== null && (
        <MatchModal
          mentors={mentors}
          mentees={mentees}
          onMatch={handleMatch}
          onClose={() => setMatchTarget(null)}
          {...(matchTarget !== true && { preselected: matchTarget })}
        />
      )}
    </div>
  );
}
