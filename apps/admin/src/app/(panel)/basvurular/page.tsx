'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RowMenu } from '@/components/RowMenu';
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  PointerSensor, useSensors, useSensor,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { adminApi, getCurrentUserRoles } from '@/lib/api';
import { hasPermission, PERMISSION_LABEL, type AdminPermission } from '@/lib/permissions';
import { fmtShortDate as formatDate } from '@/lib/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type Application = {
  id: string; type: string; state: string;
  applicantEmail: string; createdAt: string; updatedAt: string;
  formData?: Record<string, unknown>;
};

type AppDetail = {
  id: string; type: string; state: string; applicantEmail: string;
  applicantPhone?: string | null;
  formData: Record<string, unknown>; adminNotes: string | null;
  createdAt: string; paymentDueAt?: string | null;
  paymentStatus?: 'pending' | 'reminded' | 'expired' | 'verified' | 'failed' | 'waived' | null;
  stateLogs: Array<{ fromState: string | null; toState: string; createdAt: string; reason: string | null }>;
  validNextStates: string[];
};

type PipelineColumn = {
  id: string; label: string;
  states: string[];    // hangi state'ler bu sütunda görünür
  targetState: string; // bu sütuna bırakılınca atanacak state
  color: string;       // tailwind bg class
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATES = [
  { value: 'submitted',        label: 'Yeni Başvuru' },
  { value: 'under_review',     label: 'Ön İnceleme'  },
  { value: 'interview_needed', label: 'Görüşme'      },
  { value: 'approved',         label: 'Kabul'        },
  { value: 'waiting_payment',  label: 'Ödeme'        },
  { value: 'active',           label: 'Aktif'        },
];
const STATE_LABEL: Record<string, string> = {
  ...Object.fromEntries(ALL_STATES.map(s => [s.value, s.label])),
  rejected:                   'Reddedildi',
  interview_scheduled:        'Görüşme Planlandı',
  interview_completed:        'Görüşme Tamamlandı',
  shortlisted:                'Ön Eleme Geçildi',
  waitlisted:                 'Yedek Liste',
  accepted:                   'Kabul Edildi',
  passive:                    'Pasif',
  waiting_verification:       'Ödeme Doğrulanıyor',
  active_program_member:      'Program Üyesi',
  program_completed:          'Program Tamamlandı',
  waiting_student_verification: 'Öğrenci Belgesi Bekleniyor',
};

const COLUMN_COLORS = [
  'bg-yellow-500','bg-blue-500','bg-orange-500','bg-green-500',
  'bg-red-500','bg-purple-500','bg-teal-500','bg-gray-400','bg-pink-500',
];

const DEFAULT_COLUMNS: PipelineColumn[] = [
  { id: 'yeni',       label: 'Yeni Başvuru', states: ['submitted'],        targetState: 'submitted',       color: 'bg-yellow-500' },
  { id: 'on-inceleme',label: 'Ön İnceleme',  states: ['under_review'],     targetState: 'under_review',    color: 'bg-blue-500'   },
  { id: 'gorusme',    label: 'Görüşme',      states: ['interview_needed', 'interview_scheduled'], targetState: 'interview_needed',color: 'bg-purple-500' },
  { id: 'kabul',      label: 'Kabul',        states: ['approved'],         targetState: 'approved',        color: 'bg-green-500'  },
  { id: 'odeme',      label: 'Ödeme',        states: ['waiting_payment', 'waiting_verification', 'verified'],  targetState: 'waiting_payment', color: 'bg-orange-500' },
  { id: 'aktif',      label: 'Aktif',        states: ['active'],           targetState: 'active',          color: 'bg-teal-500'   },
];

const TIP_ETIKET: Record<string, string> = {
  individual: 'Bireysel', corporate: 'Kurumsal',
  meslegin_gelecekleri: 'Mesleğin Geleceği', haritailesi_genc: 'Haritailesi Genç',
  haberita_editor: 'Haberita Editör', haberita_columnist: 'Haberita Köşe Yazarı',
};
const TIP_RENK: Record<string, string> = {
  individual: 'bg-blue-100 text-blue-700', corporate: 'bg-purple-100 text-purple-700',
  meslegin_gelecekleri: 'bg-orange-100 text-orange-700', haritailesi_genc: 'bg-teal-100 text-teal-700',
  haberita_editor: 'bg-amber-100 text-amber-800', haberita_columnist: 'bg-rose-100 text-rose-800',
};
const DURUM_RENK: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800', under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
  waiting_payment: 'bg-orange-100 text-orange-800', interview_needed: 'bg-purple-100 text-purple-800', interview_scheduled: 'bg-indigo-100 text-indigo-800',
  waiting_verification: 'bg-amber-100 text-amber-800',
  verified: 'bg-lime-100 text-lime-800',
  active: 'bg-teal-100 text-teal-800',
};

const TIMELINE_DOT: Record<string, string> = {
  state_change: 'bg-[var(--color-mavi)]',
  interview:    'bg-purple-500',
  payment:      'bg-green-500',
  notes:        'bg-yellow-400',
  audit:        'bg-gray-400',
};

// Form alanı etiket eşlemeleri
const FORM_LABELS: Record<string, string> = {
  adSoyad: 'Adı Soyadı', ad: 'Ad', soyad: 'Soyad',
  dogumTarihi: 'Doğum Tarihi', cinsiyet: 'Cinsiyet',
  bolum: 'Bölüm', egitimDurumu: 'Eğitim Durumu', enYuksekEgitim: 'En Yüksek Eğitim',
  universite: 'Üniversite', meslek: 'Meslek', calismaDurumu: 'Çalışma Durumu',
  meslekiDeneyim: 'Mesleki Deneyim', meslekiYonelim: 'Mesleki Yönelim',
  sirketAdi: 'Şirket Adı', vergiNo: 'Vergi No',
  sehir: 'Şehir', il: 'İl', ilce: 'İlçe',
  eposta: 'E-Posta', telefon: 'Telefon',
  zamanAyirma: 'Zaman Ayırma', ilgiAlanlari: 'İlgi Alanları',
  katkiAlanlari: 'Katkı Alanları', tanismaKanali: 'Nasıl Duydunuz?',
  toplulukDeneyimi: 'Topluluk Deneyimi', arastirmaDeneyimi: 'Araştırma Deneyimi',
  kisaTanitim: 'Kısa Tanıtım', referans: 'Referans',
  rol: 'Başvurulan Rol',
  motivasyon: 'Motivasyon',
  'uzmanlık': 'Uzmanlık / Deneyim',
  ornekCalisma: 'Örnek Çalışma',
  oncekiLink: 'Önceki Çalışma Linkleri',
  // Haritailesi Genç
  sinif: 'Sınıf',
  ogrencilikDurumu: 'Öğrencilik Durumu',
  lise: 'Lise',
  okul: 'Okul',
  // Eğitim detayları
  lisansUniversite: 'Lisans Üniversitesi',
  lisansBolum: 'Lisans Bölümü',
  lisansMezuniyetYili: 'Lisans Mezuniyet Yılı',
  yuksekLisansUniversite: 'Yüksek Lisans Üniversitesi',
  yuksekLisansBolum: 'Yüksek Lisans Bölümü',
  yuksekLisansMezuniyetYili: 'Yüksek Lisans Mezuniyet Yılı',
  doktoraUniversite: 'Doktora Üniversitesi',
  doktoraBolum: 'Doktora Bölümü',
  doktoraMezuniyetYili: 'Doktora Mezuniyet Yılı',
  // Kariyer detayları
  unvan: 'Ünvan',
  katilimMotivasyonu: 'Katılım Motivasyonu',
  // Kurumsal
  kurumAdi: 'Kurum Adı',
  pozisyon: 'Pozisyon',
  webSitesi: 'Web Sitesi',
};

// Tekil değer çevirileri
const FORM_VALUES: Record<string, Record<string, string>> = {
  cinsiyet: {
    kadin: 'Kadın', erkek: 'Erkek', diger: 'Diğer',
    belirtmek_istemiyorum: 'Belirtmek İstemiyorum',
  },
  zamanAyirma: {
    ayda_bir: 'Ayda bir saat', ayda_birkac: 'Ayda birkaç saat',
    haftada_bir: 'Haftada bir', haftada_birkac: 'Haftada birkaç kez',
    haftada_1_2: 'Haftada 1–2 saat', haftada_3_5: 'Haftada 3–5 saat',
    her_gun: 'Her gün',
    destek: 'Destek olmak isterim', duzenli: 'Düzenli katkı', sorumluluk: 'Sorumluluk almaya hazırım',
  },
  egitimDurumu: {
    mezun: 'Mezun', ogrenci: 'Öğrenci', yeni_mezun: 'Yeni Mezun',
    lisans: 'Lisans', yuksek_lisans: 'Yüksek Lisans',
    lisansustu: 'Lisansüstü', doktora: 'Doktora',
  },
  enYuksekEgitim: {
    lise: 'Lise', onlisans: 'Ön Lisans', lisans: 'Lisans',
    yuksek_lisans: 'Yüksek Lisans', lisansustu: 'Lisansüstü', doktora: 'Doktora',
  },
  ogrencilikDurumu: {
    lise: 'Lise', onlisans: 'Ön Lisans', lisans: 'Lisans',
    yuksek_lisans: 'Yüksek Lisans', lisansustu: 'Lisansüstü', doktora: 'Doktora',
  },
  calismaDurumu: {
    'calismıyor': 'Çalışmıyor', calismiyor: 'Çalışmıyor',
    calisiyor: 'Çalışıyor', calisuyor: 'Çalışıyor',
    kamu: 'Kamu', ozel: 'Özel Sektör',
    serbest: 'Serbest Meslek', kendi_ofis: 'Kendi Ofisi / Şirketi',
    ogrenci: 'Öğrenci', stk: "STK'da Çalışıyor",
  },
  meslekiDeneyim: {
    '0': 'Yeni başlıyorum', '0-1': '0–1 yıl',
    '1-3': '1–3 yıl', '3-5': '3–5 yıl',
    '5-10': '5–10 yıl', '5+': '5+ yıl', '10+': '10+ yıl',
  },
  toplulukDeneyimi:  { evet: 'Evet', hayir: 'Hayır' },
  arastirmaDeneyimi: { evet: 'Evet', hayir: 'Hayır' },
};

// Virgülle ayrılmış alan değer çevirileri
const COMMA_LABELS: Record<string, Record<string, string>> = {
  ilgiAlanlari: {
    topluluk: 'Topluluk', egitimler: 'Eğitimler', egitim: 'Eğitim',
    mentorluk: 'Mentörlük', mentorlik: 'Mentörlük',
    proje: 'Proje', kariyer: 'Kariyer',
    icerik: 'İçerik Üretimi', gorunurluk: 'Görünürlük',
    gonullu: 'Gönüllü', girisimcilik: 'Girişimcilik',
    etkinlik: 'Etkinlik', arastirma: 'Araştırma',
  },
  katkiAlanlari: {
    icerik: 'İçerik Üretimi', egitim: 'Eğitim',
    mentorluk: 'Mentörlük', mentorlik: 'Mentörlük',
    proje: 'Proje', etkinlik: 'Etkinlik',
    atolye: 'Atölye', moderatorluk: 'Moderatörlük',
    arastirma: 'Araştırma', tanitim: 'Tanıtım',
    sosyal_medya: 'Sosyal Medya', video: 'Video İçerik',
    topluluk: 'Topluluk', tasarim: 'Tasarım',
    yazilim: 'Yazılım', mentorluk_destek: 'Mentörlük Desteği',
  },
  meslekiYonelim: {
    fotogrametri: 'Fotogrametri', cbs: 'CBS',
    klasik_haritacilik: 'Klasik Haritacılık',
    uzaktan_algilama: 'Uzaktan Algılama',
    hidrografi: 'Hidrografi', kadastro: 'Kadastro',
    ins_olcme: 'İnşaat Ölçme', insaat: 'İnşaat',
    gayrimenkul: 'Gayrimenkul', yazilim: 'Yazılım',
    icerik_uretimi: 'İçerik Üretimi', girisimcilik: 'Girişimcilik',
    bilmiyorum: 'Bilmiyorum', diger: 'Diğer',
  },
  tanismaKanali: {
    youtube: 'YouTube', instagram: 'Instagram',
    twitter: 'Twitter/X', linkedin: 'LinkedIn',
    arkadas: 'Arkadaş tavsiyesi', universite: 'Üniversite',
    haberita: 'Haberita', etkinlik: 'Etkinlik',
    referans: 'Referans', google: 'Google',
    diger: 'Diğer',
  },
};

const HIDDEN_FORM_FIELDS = new Set(['kvkk', 'iletisimOnay', 'onay', 'Kvkk', 'IletisimOnay']);

// Bölümler
const FORM_SECTIONS: { title: string; keys: string[] }[] = [
  { title: 'Kişisel Bilgiler', keys: ['adSoyad','ad','soyad','dogumTarihi','cinsiyet'] },
  { title: 'Eğitim & Kariyer', keys: [
    'bolum','enYuksekEgitim','egitimDurumu','universite',
    'lisansUniversite','lisansBolum','lisansMezuniyetYili',
    'yuksekLisansUniversite','yuksekLisansBolum','yuksekLisansMezuniyetYili',
    'doktoraUniversite','doktoraBolum','doktoraMezuniyetYili',
    'calismaDurumu','meslek','meslekiDeneyim','meslekiYonelim',
    'sirketAdi','kurumAdi','unvan','vergiNo',
  ] },
  { title: 'İletişim',         keys: ['sehir','il','ilce','eposta','telefon'] },
  { title: 'Profil & İlgi',   keys: ['zamanAyirma','ilgiAlanlari','katkiAlanlari','toplulukDeneyimi','arastirmaDeneyimi','tanismaKanali','kisaTanitim','referans','katilimMotivasyonu'] },
];

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatCommaList(key: string, str: string): string {
  const map = COMMA_LABELS[key] ?? {};
  return str.split(',')
    .map(s => s.trim()).filter(Boolean)
    .map(s => map[s] ?? humanize(s))
    .join(', ');
}

function formatFieldValue(key: string, value: unknown): string {
  const str = String(value ?? '').trim();
  if (!str || str === 'null' || str === 'undefined') return '';
  if (key === 'dogumTarihi') {
    const d = new Date(str);
    return isNaN(d.getTime()) ? str : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (str === 'true')  return 'Evet';
  if (str === 'false') return 'Hayır';
  if (str.includes(',') || key in COMMA_LABELS) return formatCommaList(key, str);
  return FORM_VALUES[key]?.[str] ?? str;
}

const COLS_KEY = 'admin_pipeline_v6';

// ─── Card (shared between draggable + overlay) ────────────────────────────────

const STATE_REASON_TR: Record<string, string> = {
  'Initial submission': 'İlk başvuru',
  'Approved': 'Kabul edildi',
  'Rejected': 'Reddedildi',
};

// SLA eşikleri (gün): warn = sarı, critical = kırmızı
const SLA_DAYS: Record<string, { warn: number; critical: number }> = {
  submitted:        { warn: 1, critical: 2 },
  under_review:     { warn: 3, critical: 5 },
  interview_needed: { warn: 3, critical: 5 },
  waiting_payment:  { warn: 2, critical: 3 },
  approved:         { warn: 1, critical: 2 },
};

function slaBadge(state: string, updatedAt: string): React.ReactNode | null {
  const sla = SLA_DAYS[state];
  if (!sla) return null;
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000);
  if (days < sla.warn) return null;
  const isCritical = days >= sla.critical;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
      isCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
    }`}>
      ⏱ {days}g
    </span>
  );
}

function CardBody({ app, dragHandleProps, onOpen, onDelete }: {
  app: Application;
  dragHandleProps?: Record<string, unknown>;
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-no-open]')) return;
        onOpen?.();
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        {dragHandleProps && (
          <span
            data-drag-handle
            data-no-open
            {...dragHandleProps}
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing mt-0.5 shrink-0 select-none"
            style={{ touchAction: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="7" cy="5"  r="1.5"/><circle cx="13" cy="5"  r="1.5"/>
              <circle cx="7" cy="10" r="1.5"/><circle cx="13" cy="10" r="1.5"/>
              <circle cx="7" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/>
            </svg>
          </span>
        )}
        <div className="flex-1 min-w-0">
          {app.formData?.['adSoyad'] != null && (
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {String(app.formData['adSoyad'])}
            </p>
          )}
          <p className={`truncate leading-tight ${app.formData?.['adSoyad'] ? 'text-xs text-gray-400' : 'text-sm font-semibold text-gray-900'}`}>
            {app.applicantEmail}
          </p>
        </div>
        {onDelete && (
          <div data-no-open className="shrink-0" onClick={e => e.stopPropagation()}>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onDelete}
                  className="text-[10px] font-semibold px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >Sil</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors"
                >İptal</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Başvuruyu sil"
                className="text-gray-200 hover:text-red-400 transition-colors p-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${TIP_RENK[app.type] ?? 'bg-gray-100 text-gray-600'}`}>
          {TIP_ETIKET[app.type] ?? app.type}
        </span>
        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${DURUM_RENK[app.state] ?? 'bg-gray-100 text-gray-700'}`}>
          {STATE_LABEL[app.state] ?? app.state}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">{formatDate(app.createdAt)}</p>
        {slaBadge(app.state, app.updatedAt)}
      </div>
    </div>
  );
}

// ─── Draggable Card ────────────────────────────────────────────────────────────

function DraggableCard({ app, onOpen, onDelete }: { app: Application; onOpen: () => void; onDelete?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), touchAction: 'none' }}
      className={isDragging ? 'opacity-0' : ''}
    >
      <CardBody
        app={app}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dragHandleProps={{ ...attributes, ...listeners } as any}
        onOpen={onOpen}
        onDelete={onDelete}
      />
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  col, cards, activeId, onOpen, onRemove, onDeleteApp, hideHeader,
}: {
  col: PipelineColumn; cards: Application[];
  activeId: string | null; onOpen: (id: string) => void; onRemove: () => void;
  onDeleteApp: (id: string) => void;
  hideHeader?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const showDropZone = isOver && activeId !== null;

  return (
    <div className="w-64 flex-shrink-0 flex flex-col">
      {!hideHeader && (
        <div className={`${col.color} text-white rounded-t-xl px-4 py-2.5 flex items-center justify-between`}>
          <span className="text-sm font-semibold">{col.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/25 rounded-full px-2 py-0.5">{cards.length}</span>
            <button
              onClick={onRemove}
              title="Aşamayı kaldır"
              className="text-white/50 hover:text-white text-base leading-none transition-colors"
            >×</button>
          </div>
        </div>
      )}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-xl p-2 min-h-[60px] space-y-2 transition-colors ${
          showDropZone ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : 'bg-gray-100'
        }`}
      >
        {cards.map(app => (
          <DraggableCard
            key={app.id} app={app}
            onOpen={() => onOpen(app.id)}
            onDelete={() => onDeleteApp(app.id)}
          />
        ))}
        {cards.length === 0 && !showDropZone && (
          <p className="text-xs text-gray-400 text-center py-3">Boş</p>
        )}
        {showDropZone && (
          <div className="border-2 border-dashed border-blue-300 rounded-xl h-16 flex items-center justify-center">
            <span className="text-xs text-blue-400 font-medium">Buraya bırak</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────

function PaymentModal({
  onConfirm, onClose, busy,
}: {
  onConfirm: (amountTl: number, description: string) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl shadow-2xl z-[70] p-6">
        <h3 className="font-bold text-gray-900 mb-1">Ödeme Onayı</h3>
        <p className="text-xs text-gray-400 mb-4">Ödeme bilgilerini girerek bağış kaydı oluşturulacak.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Ödeme Tutarı (₺)</label>
            <input
              type="number" min="1" step="1" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="örn. 500"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi-acik)]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Açıklama (isteğe bağlı)</label>
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Üyelik ödemesi 2025"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi-acik)]"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            İptal
          </button>
          <button
            type="button"
            disabled={!amount || parseFloat(amount) <= 0 || busy}
            onClick={() => onConfirm(parseFloat(amount), desc)}
            className="flex-1 py-2 text-sm font-semibold bg-[var(--color-mavi)] text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
            {busy ? 'Kaydediliyor…' : 'Onayla'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Waive Modal ──────────────────────────────────────────────────────────────

function WaiveModal({ onConfirm, onClose, busy }: { onConfirm: (reason: string) => void; onClose: () => void; busy: boolean }) {
  const [reason, setReason] = useState('');
  const canConfirm = reason.trim().length >= 5;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl shadow-2xl z-[70] p-6">
        <h3 className="font-bold text-gray-900 mb-1">Ödemeyi Muaf Tut</h3>
        <p className="text-xs text-gray-400 mb-4">Başvuru ödeme adımı atlanarak doğrulama aşamasına geçer. Bu işlem audit log'a kaydedilir.</p>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            Muafiyet Gerekçesi <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Burs kararı, kurucu muafiyeti, protokol gereği…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
          />
          {reason.trim().length > 0 && !canConfirm && (
            <p className="text-[11px] text-red-500 mt-1">En az 5 karakter gerekli.</p>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            İptal
          </button>
          <button type="button" onClick={() => onConfirm(reason.trim())} disabled={!canConfirm || busy}
            className="flex-1 py-2 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
            {busy ? 'İşleniyor…' : 'Onayla'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  appId, onClose, onStateChange, onDelete, userRoles,
}: {
  appId: string; onClose: () => void;
  onStateChange: (id: string, newState: string) => void;
  onDelete: (id: string) => void;
  userRoles: string[];
}) {
  const can = (p: AdminPermission) => hasPermission(userRoles, p);
  const noPermTitle = (p: AdminPermission) =>
    !can(p) ? `Yetkiniz yok: ${PERMISSION_LABEL[p]}` : undefined;
  const [detail, setDetail]           = useState<AppDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notes, setNotes]             = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [noteSyncMsg, setNoteSyncMsg] = useState('');
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [actionBusy, setActionBusy]   = useState<string | null>(null);
  const [actionMsg, setActionMsg]     = useState('');
  const [waModal, setWaModal]         = useState(false);
  const [waMsg, setWaMsg]             = useState('');
  const [waSending, setWaSending]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Ödeme modali
  const [paymentModalFor, setPaymentModalFor] = useState<string | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);

  // Görüşme planlama
  const [slots, setSlots]             = useState<import('@/lib/api').AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'calendly' | 'specific'>('calendly');
  const [wantsVideo, setWantsVideo]   = useState(true);
  const [wantsPhone, setWantsPhone]   = useState(false);
  const [meetUrl, setMeetUrl]         = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendingInterview, setSendingInterview] = useState(false);

  // Ödeme muafiyet
  const [waiveBusy, setWaiveBusy] = useState(false);
  const [waiveModalOpen, setWaiveModalOpen] = useState(false);

  // Zaman çizelgesi
  const [drawerTab, setDrawerTab] = useState<'detay' | 'gecmis'>('detay');
  const [timeline, setTimeline] = useState<import('@/lib/api').TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const [interviewFormOpen, setInterviewFormOpen] = useState(false);
  const [interviewRequest, setInterviewRequest] = useState<{ id: string; state: string; slot: import('@/lib/api').AvailabilitySlot | null; meetUrl: string | null } | null>(null);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    setInterviewFormOpen(false);
    setInterviewRequest(null);
    adminApi.getApplication(appId)
      .then(d => { setDetail(d); setNotes(d.adminNotes ?? ''); })
      .finally(() => setLoading(false));
  }, [appId]);

  useEffect(() => {
    if (!detail) return;
    if (['interview_needed', 'interview_scheduled'].includes(detail.state)) {
      adminApi.getInterviewRequest(detail.id)
        .then(r => setInterviewRequest(r ?? null))
        .catch(() => {});
    }
  }, [detail?.state, detail?.id]);

  // Aday zaman seçimini tamamlayana kadar her 10 sn'de kontrol et
  useEffect(() => {
    if (!detail || interviewRequest?.state !== 'pending') return;
    const timer = setInterval(async () => {
      try {
        const r = await adminApi.getInterviewRequest(detail.id);
        if (r) {
          setInterviewRequest(r);
          if (r.state === 'confirmed') {
            const updated = await adminApi.getApplication(detail.id);
            setDetail(updated);
            setNotes(updated.adminNotes ?? '');
            onStateChange(detail.id, updated.state);
          }
        }
      } catch { /* sessizce devam */ }
    }, 10_000);
    return () => clearInterval(timer);
  }, [detail?.id, interviewRequest?.state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!interviewFormOpen) return;
    setLoadingSlots(true);
    adminApi.listSlots({ slotType: 'membership', onlyAvailable: true, from: new Date().toISOString() })
      .then(s => setSlots(s))
      .finally(() => setLoadingSlots(false));
  }, [interviewFormOpen]);

  useEffect(() => {
    if (drawerTab !== 'gecmis') return;
    setLoadingTimeline(true);
    adminApi.getTimeline(appId)
      .then(setTimeline)
      .finally(() => setLoadingTimeline(false));
  }, [drawerTab, appId]);

  async function handleTransition(toState: string) {
    if (!detail) return;
    if (toState === 'waiting_verification') { setPaymentModalFor(toState); return; }
    if (toState === 'interview_needed') { setInterviewFormOpen(true); return; }
    setTransitioning(toState);
    try {
      await adminApi.transitionState(detail.id, toState);
      const updated = await adminApi.getApplication(detail.id);
      setDetail(updated);
      onStateChange(detail.id, toState);
    } catch (err) {
      setActionMsg(`⚠ ${err instanceof Error ? err.message : 'Durum güncellenemedi.'}`);
      setTimeout(() => setActionMsg(''), 6000);
    } finally { setTransitioning(null); }
  }

  async function handleInterviewTransition() {
    if (!detail) return;
    setSendingInterview(true);
    try {
      // Zaten interview_needed'daysa geçiş yapma, sadece davet gönder
      if (detail.state !== 'interview_needed') {
        await adminApi.transitionState(detail.id, 'interview_needed');
      }
      const parts: string[] = [];
      if (wantsVideo && meetUrl) parts.push(meetUrl);
      if (wantsPhone && phoneNumber) parts.push(`tel:${phoneNumber}`);
      const resolvedMeetUrl = parts.length ? parts.join('|') : undefined;
      // Calendly modu: slotId yok → aday kendi zamanını seçer
      // Belirli zaman modu: seçilen slotId ile gönder
      await adminApi.createInterviewRequest(detail.id, {
        slotId: scheduleMode === 'specific' && selectedSlot ? selectedSlot : undefined,
        meetUrl: resolvedMeetUrl,
      });
      const updated = await adminApi.getApplication(detail.id);
      setDetail(updated);
      onStateChange(detail.id, 'interview_needed');
      setInterviewFormOpen(false);
      setActionMsg('✓ Görüşme daveti gönderildi');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Hata oluştu, tekrar deneyin.');
    } finally { setSendingInterview(false); }
  }

  async function handlePaymentConfirm(amountTl: number, description: string) {
    if (!detail || !paymentModalFor) return;
    setPaymentBusy(true);
    try {
      await adminApi.transitionState(detail.id, paymentModalFor, {
        paymentAmountKurus: Math.round(amountTl * 100),
        paymentDescription: description || undefined,
      });
      const updated = await adminApi.getApplication(detail.id);
      setDetail(updated);
      onStateChange(detail.id, paymentModalFor);
      setPaymentModalFor(null);
    } finally { setPaymentBusy(false); }
  }

  async function saveNotes() {
    if (!detail) return;
    setSavingNotes(true);
    setNoteSyncMsg('');
    try {
      const res = await adminApi.updateNotes(detail.id, notes);
      setNoteSyncMsg(res.syncedToProfile ? '✓ Profil güncellendi' : '✓ Kaydedildi');
      setTimeout(() => setNoteSyncMsg(''), 3000);
    } finally { setSavingNotes(false); }
  }

  async function resendStateEmail() {
    if (!detail) return;
    setActionBusy('state_email');
    try {
      await adminApi.resendStateEmail(detail.id);
      setActionMsg('✓ Bildirim maili tekrar gönderildi');
      setTimeout(() => setActionMsg(''), 3000);
    } finally { setActionBusy(null); }
  }

  async function resendSetup() {
    if (!detail) return;
    setActionBusy('setup');
    try {
      await adminApi.resendSetup(detail.id);
      setActionMsg('✓ Hesap kurulum maili gönderildi');
      setTimeout(() => setActionMsg(''), 3000);
    } finally { setActionBusy(null); }
  }

  async function resendPayment() {
    if (!detail) return;
    setActionBusy('payment');
    try {
      await adminApi.resendPaymentReminder(detail.id);
      setActionMsg('✓ Ödeme hatırlatması gönderildi');
      setTimeout(() => setActionMsg(''), 3000);
    } finally { setActionBusy(null); }
  }

  async function sendWhatsapp() {
    if (!detail || !waMsg.trim()) return;
    setWaSending(true);
    try {
      await adminApi.sendWhatsapp(detail.id, waMsg.trim());
      setActionMsg('✓ WhatsApp mesajı gönderildi');
      setTimeout(() => setActionMsg(''), 3000);
      setWaModal(false);
      setWaMsg('');
    } catch {
      setActionMsg('✗ WhatsApp gönderilemedi');
      setTimeout(() => setActionMsg(''), 3000);
    } finally { setWaSending(false); }
  }

  async function handleWaivePayment(reason: string) {
    if (!detail) return;
    setWaiveBusy(true);
    try {
      await adminApi.waivePayment(detail.id, reason);
      const updated = await adminApi.getApplication(detail.id);
      setDetail(updated);
      onStateChange(detail.id, updated.state);
      setWaiveModalOpen(false);
      setActionMsg('✓ Ödeme muaf tutuldu');
      setTimeout(() => setActionMsg(''), 3000);
    } finally { setWaiveBusy(false); }
  }

  async function handleDelete() {
    if (!detail) return;
    setDeleting(true);
    try {
      await adminApi.deleteApplication(detail.id);
      onDelete(detail.id);
      onClose();
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  function fmtSlot(slot: import('@/lib/api').AvailabilitySlot): string {
    const d = new Date(slot.startAt);
    return d.toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[440px] max-w-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-900">Başvuru Detayı</h2>
          <div className="flex items-center gap-1">
            {can('application.delete') && detail && (
              deleteConfirm ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-600 font-medium">Silinsin mi?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >{deleting ? '…' : 'Evet, Sil'}</button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >İptal</button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  title="Başvuruyu sil"
                  className="text-gray-300 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 px-5">
          {(['detay', 'gecmis'] as const).map(tab => (
            <button key={tab} onClick={() => setDrawerTab(tab)}
              className={`py-2.5 text-sm font-medium mr-5 border-b-2 -mb-px transition-colors ${drawerTab === tab ? 'border-[var(--color-mavi)] text-[var(--color-mavi)]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
              {tab === 'detay' ? 'Detay' : 'Geçmiş'}
            </button>
          ))}
        </div>

        {actionMsg && (
          <div className="mx-5 mt-3 shrink-0 px-3 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
            {actionMsg}
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-[var(--color-mavi)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && detail && drawerTab === 'detay' && (() => {
          const fd = detail.formData;
          const fullName = String(fd['adSoyad'] ?? fd['AdSoyad'] ?? '').trim();
          const basvuruNo = detail.id.replace(/-/g, '').slice(0, 8).toUpperCase();
          const usedKeys = new Set<string>();
          const sections = FORM_SECTIONS.map(sec => {
            const rows = sec.keys
              .filter(k => k in fd && !HIDDEN_FORM_FIELDS.has(k))
              .map(k => { usedKeys.add(k); return { key: k, label: FORM_LABELS[k] ?? k, value: formatFieldValue(k, fd[k]) }; })
              .filter(r => r.value !== '');
            return { title: sec.title, rows };
          }).filter(s => s.rows.length > 0);
          const extras = Object.keys(fd)
            .filter(k => !usedKeys.has(k) && !HIDDEN_FORM_FIELDS.has(k))
            .map(k => ({ key: k, label: FORM_LABELS[k] ?? k, value: formatFieldValue(k, fd[k]) }))
            .filter(r => r.value !== '');
          if (extras.length) sections.push({ title: 'Diğer', rows: extras });

          return (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Kimlik */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Başvuru No: <span className="font-mono">{basvuruNo}</span>
              </p>
              {fullName && <p className="text-xl font-bold text-gray-900">{fullName}</p>}
              <p className={`${fullName ? 'text-sm text-gray-400' : 'text-base font-bold text-gray-900'} break-all`}>
                {detail.applicantEmail}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TIP_RENK[detail.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {TIP_ETIKET[detail.type] ?? detail.type}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DURUM_RENK[detail.state] ?? 'bg-gray-100 text-gray-700'}`}>
                  {STATE_LABEL[detail.state] ?? detail.state}
                </span>
                {detail.paymentDueAt && detail.state === 'waiting_payment' && (() => {
                  const due = new Date(detail.paymentDueAt);
                  const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
                  const expired = daysLeft < 0;
                  const urgent  = daysLeft >= 0 && daysLeft <= 2;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${expired ? 'bg-red-100 text-red-700' : urgent ? 'bg-orange-100 text-orange-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {expired ? '⚠ Süre Doldu' : `₺ Son: ${due.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} (${daysLeft}g)`}
                    </span>
                  );
                })()}
                {detail.paymentStatus && (() => {
                  const MAP: Record<string, { label: string; cls: string }> = {
                    pending:  { label: 'Ödeme Bekleniyor', cls: 'bg-yellow-50 text-yellow-700' },
                    reminded: { label: 'Hatırlatma Gönderildi', cls: 'bg-orange-50 text-orange-700' },
                    expired:  { label: 'Ödeme Süresi Doldu', cls: 'bg-red-100 text-red-700' },
                    verified: { label: 'Ödeme Doğrulandı', cls: 'bg-green-100 text-green-700' },
                    failed:   { label: 'Ödeme Başarısız', cls: 'bg-red-100 text-red-700' },
                    waived:   { label: 'Ödeme Muaf', cls: 'bg-purple-100 text-purple-700' },
                  };
                  const m = MAP[detail.paymentStatus];
                  if (!m) return null;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.cls}`}>
                      {m.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-gray-400 ml-auto">{formatDate(detail.createdAt)}</span>
              </div>
            </div>

            {/* Sonraki aşama */}
            {detail.validNextStates.length > 0 && !interviewFormOpen && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Sonraki Aşama</p>
                <div className="flex flex-wrap gap-2">
                  {detail.validNextStates.map(s => (
                    <button key={s} onClick={() => void handleTransition(s)}
                      disabled={transitioning !== null || paymentBusy}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[var(--color-mavi)] hover:text-[var(--color-mavi)] disabled:opacity-40 transition-colors">
                      {transitioning === s ? '…' : `→ ${STATE_LABEL[s] ?? s}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Görüşme Ayarla — interview_needed geçişi tıklandığında açılır */}
            {interviewFormOpen && (
              <div className="border border-purple-200 bg-purple-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-widest">Görüşme Ayarla</p>
                  <button onClick={() => setInterviewFormOpen(false)}
                    className="text-xs text-gray-400 hover:text-gray-600">İptal</button>
                </div>

                {/* Mod seçimi */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'calendly', icon: '📅', title: 'Aday zaman seçsin', desc: 'Takvimden uygun saati seçer' },
                    { id: 'specific', icon: '📌', title: 'Sen zaman belirle', desc: 'Belirli bir slot gönder' },
                  ] as const).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setScheduleMode(m.id)}
                      className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                        scheduleMode === m.id
                          ? 'border-purple-400 bg-white ring-1 ring-purple-400'
                          : 'border-gray-200 bg-white/60 hover:bg-white'
                      }`}
                    >
                      <span className="text-lg mb-1">{m.icon}</span>
                      <span className="text-xs font-semibold text-gray-800 leading-tight">{m.title}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{m.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Belirli zaman modunda slot dropdown */}
                {scheduleMode === 'specific' && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Takvim Slotu</label>
                    {loadingSlots ? (
                      <p className="text-xs text-gray-400">Slotlar yükleniyor…</p>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-orange-500">Müsait slot yok. <a href="/takvim" className="underline">Takvimden ekle →</a></p>
                    ) : (
                      <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white">
                        <option value="">— Slot seçin</option>
                        {slots.map(s => (
                          <option key={s.id} value={s.id}>
                            {fmtSlot(s)} ({s.capacity - s.bookedCount} müsait)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-2">Görüşme Yöntemi</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={wantsVideo} onChange={e => setWantsVideo(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">🎥 Video (Meet/Zoom)</span>
                    </label>
                    {wantsVideo && (
                      <input value={meetUrl} onChange={e => setMeetUrl(e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ml-6 bg-white" />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={wantsPhone} onChange={e => setWantsPhone(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">📞 Sesli Arama</span>
                    </label>
                    {wantsPhone && (
                      <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+90 555 000 00 00" type="tel"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ml-6 bg-white" />
                    )}
                  </div>
                </div>
                {(() => {
                  const videoMissing = wantsVideo && !meetUrl.trim();
                  const phoneMissing = wantsPhone && !phoneNumber.trim();
                  const noneSelected = !wantsVideo && !wantsPhone;
                  const slotMissing = scheduleMode === 'specific' && !selectedSlot;
                  const hasError = noneSelected || videoMissing || phoneMissing || slotMissing;
                  const errorHint = noneSelected
                    ? 'En az bir görüşme yöntemi seçin.'
                    : videoMissing && phoneMissing
                    ? 'Video bağlantısı ve telefon numarası girin.'
                    : videoMissing
                    ? 'Video bağlantısını girin.'
                    : phoneMissing
                    ? 'Telefon numarasını girin.'
                    : slotMissing
                    ? 'Bir slot seçin veya "Aday zaman seçsin" moduna geçin.'
                    : '';
                  return (
                    <>
                      {errorHint && (
                        <p className="text-xs text-red-500">{errorHint}</p>
                      )}
                      <button
                        onClick={() => void handleInterviewTransition()}
                        disabled={sendingInterview || hasError}
                        className="w-full py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity">
                        {sendingInterview
                          ? 'Gönderiliyor…'
                          : scheduleMode === 'calendly'
                          ? 'Görüşmeye Al & Zaman Seçim Linki Gönder →'
                          : 'Görüşmeye Al & Davet Gönder →'}
                      </button>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Görüşme Detayı — interview_scheduled veya interview_needed olduğunda */}
            {(['interview_needed', 'interview_scheduled'].includes(detail.state)) && interviewRequest && (
              <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">Görüşme Bilgisi</p>
                <div className="space-y-1.5">
                  {interviewRequest.slot ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-400 w-16 shrink-0">Tarih</span>
                        <span className="text-xs font-semibold text-blue-900">
                          {new Date(interviewRequest.slot.startAt).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-400 w-16 shrink-0">Saat</span>
                        <span className="text-xs font-semibold text-blue-900">
                          {new Date(interviewRequest.slot.startAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(interviewRequest.slot.endAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-400 w-16 shrink-0">Zaman</span>
                      <span className="text-xs text-blue-600 italic">Aday henüz seçmedi</span>
                    </div>
                  )}
                  {interviewRequest.meetUrl && (
                    <div className="flex items-start gap-2 pt-1 border-t border-blue-100">
                      <span className="text-xs text-blue-400 w-16 shrink-0 mt-0.5">Yöntem</span>
                      <div className="flex flex-col gap-0.5">
                        {interviewRequest.meetUrl.split('|').filter(Boolean).map((part, i) => (
                          <span key={i} className="text-xs font-medium text-blue-900">
                            {part.startsWith('tel:') ? `📞 ${part.slice(4)}` : `🎥 Video bağlantısı`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t border-blue-100">
                    <span className="text-xs text-blue-400 w-16 shrink-0">Durum</span>
                    <span className={`text-xs font-semibold ${interviewRequest.state === 'confirmed' ? 'text-green-600' : 'text-orange-500'}`}>
                      {interviewRequest.state === 'confirmed' ? '✓ Onaylandı' : '⏳ Bekleniyor'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hızlı Aksiyonlar */}
            {(['active','waiting_payment','approved','interview_needed','interview_scheduled'].includes(detail.state)) && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Hızlı Aksiyonlar</p>
                <div className="flex flex-wrap gap-2">
                  {['under_review','approved','rejected','waiting_payment'].includes(detail.state) && (
                    <button
                      onClick={() => can('application.review') && void resendStateEmail()}
                      disabled={actionBusy === 'state_email' || !can('application.review')}
                      title={noPermTitle('application.review')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {actionBusy === 'state_email' ? '…' : '✉ Bildirim Mailini Tekrar Gönder'}
                    </button>
                  )}
                  {(['interview_needed', 'interview_scheduled'].includes(detail.state)) && (
                    <button
                      onClick={() => setInterviewFormOpen(true)}
                      disabled={interviewFormOpen}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 transition-colors">
                      ✉ Görüşme Davetini Tekrar Gönder
                    </button>
                  )}
                  {detail.state === 'active' && (
                    <button
                      onClick={() => can('member.activate') && void resendSetup()}
                      disabled={actionBusy === 'setup' || !can('member.activate')}
                      title={noPermTitle('member.activate')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {actionBusy === 'setup' ? '…' : '✉ Kurulum Maili Tekrar Gönder'}
                    </button>
                  )}
                  {(detail.state === 'waiting_payment' || detail.state === 'approved') && (
                    <button
                      onClick={() => can('payment.request') && void resendPayment()}
                      disabled={actionBusy === 'payment' || !can('payment.request')}
                      title={noPermTitle('payment.request')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {actionBusy === 'payment' ? '…' : '₺ Ödeme Hatırlatması Gönder'}
                    </button>
                  )}
                  {detail.state === 'waiting_payment' && detail.paymentStatus !== 'waived' && (
                    <button
                      onClick={() => can('payment.waive') && setWaiveModalOpen(true)}
                      disabled={waiveBusy || !can('payment.waive')}
                      title={noPermTitle('payment.waive')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Ödemeden Geç (Muaf Tut)
                    </button>
                  )}
                  {(detail.formData?.['telefon'] || detail.formData?.['temsilciTelefon']) && (
                    <button
                      onClick={() => can('application.review') && setWaModal(true)}
                      disabled={!can('application.review')}
                      title={noPermTitle('application.review')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      💬 WhatsApp Mesajı Gönder
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp modal */}
            {waModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">WhatsApp Mesajı Gönder</h3>
                  <p className="text-xs text-gray-500">
                    Şablon: <em>"Merhaba {'{'}{'{'}ad{'}'}{'}'}, Haritailesi Vakfı başvurunuzun durumu güncellendi: <strong>{'{'}{'{'}mesajınız{'}'}{'}'}.</strong> İyi günler dileriz."</em>
                  </p>
                  <textarea
                    value={waMsg}
                    onChange={e => setWaMsg(e.target.value)}
                    placeholder="Durum mesajını yazın…"
                    rows={3}
                    maxLength={200}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 resize-none"
                  />
                  <p className="text-right text-[10px] text-gray-400">{waMsg.length}/200</p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setWaModal(false); setWaMsg(''); }}
                      className="px-4 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      İptal
                    </button>
                    <button
                      onClick={() => void sendWhatsapp()}
                      disabled={waSending || !waMsg.trim()}
                      className="px-4 py-2 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors">
                      {waSending ? 'Gönderiliyor…' : 'Gönder'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bölümlü form bilgileri */}
            {sections.map(sec => (
              <div key={sec.title}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{sec.title}</p>
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  {sec.rows.map(({ key, label, value }) => (
                    <div key={key} className="grid grid-cols-[120px_1fr] gap-3 px-4 py-2.5 text-sm">
                      <span className="text-gray-400 shrink-0">{label}</span>
                      <span className="text-gray-900 font-medium break-words">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Durum geçmişi */}
            {detail.stateLogs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Durum Geçmişi</p>
                <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-gray-200">
                  {[...detail.stateLogs].reverse().map((log, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-[var(--color-mavi)] border-2 border-white" />
                      <p className="text-xs text-gray-800 font-medium">
                        <span className="text-gray-400">{STATE_LABEL[log.fromState ?? ''] ?? (log.fromState ?? '—')} → </span>
                        {STATE_LABEL[log.toState] ?? log.toState}
                      </p>
                      {log.reason && <p className="text-xs text-gray-400 italic">{STATE_REASON_TR[log.reason] ?? log.reason}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin notu */}
            {can('application.notes.view') && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Admin Notu</p>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} placeholder="Not ekle…"
                disabled={!can('application.notes.edit')}
                title={noPermTitle('application.notes.edit')}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi-acik)] resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => can('application.notes.edit') && void saveNotes()}
                  disabled={savingNotes || !can('application.notes.edit')}
                  title={noPermTitle('application.notes.edit')}
                  className="px-4 py-1.5 text-xs font-semibold bg-[var(--color-mavi)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                  {savingNotes ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
                {noteSyncMsg && <span className="text-xs text-green-600 font-medium">{noteSyncMsg}</span>}
              </div>
            </div>
            )}
          </div>
          );
        })()}

        {/* ─── Geçmiş Sekmesi ──────────────────────────────────────────────── */}
        {!loading && drawerTab === 'gecmis' && (
          <div className="flex-1 overflow-y-auto p-5">
            {loadingTimeline ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[var(--color-mavi)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">Henüz kayıt yok.</p>
            ) : (
              <div className="relative pl-5 space-y-5 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-gray-200">
                {timeline.map(ev => (
                  <div key={ev.id} className="relative">
                    <div className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-white ${TIMELINE_DOT[ev.type]}`} />
                    <p className="text-xs font-semibold text-gray-800 leading-snug">{ev.title}</p>
                    {ev.description && <p className="text-xs text-gray-500 mt-0.5 italic">{ev.description}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-gray-400">{new Date(ev.at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      {ev.actor && <p className="text-[10px] text-gray-400">· {ev.actor}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ödeme Modali */}
      {paymentModalFor && (
        <PaymentModal
          busy={paymentBusy}
          onConfirm={(amountTl, desc) => void handlePaymentConfirm(amountTl, desc)}
          onClose={() => setPaymentModalFor(null)}
        />
      )}

      {/* Ödeme Muafiyet Modali */}
      {waiveModalOpen && (
        <WaiveModal
          busy={waiveBusy}
          onConfirm={(reason) => void handleWaivePayment(reason)}
          onClose={() => setWaiveModalOpen(false)}
        />
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.22s ease-out; }
      `}</style>
    </>
  );
}

// ─── Add Column Modal ──────────────────────────────────────────────────────────

function AddColumnModal({
  columns, onAdd, onClose,
}: {
  columns: PipelineColumn[];
  onAdd: (col: PipelineColumn, afterId: string | null) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState('');
  const [afterId, setAfterId] = useState<string>('__end__');
  const [color, setColor] = useState('bg-blue-500');

  // Yeni kolonun targetState'ini: seçilen pozisyondan sonraki kolonun state'i, yoksa son state
  function resolveTargetState(): string {
    if (afterId === '__end__' || columns.length === 0) {
      return columns[columns.length - 1]?.targetState ?? 'submitted';
    }
    const idx = columns.findIndex(c => c.id === afterId);
    const next = columns[idx + 1];
    return next?.targetState ?? columns[idx]?.targetState ?? 'submitted';
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const ts = resolveTargetState();
    onAdd(
      { id: `col-${Date.now()}`, label: label.trim(), states: [ts], targetState: ts, color },
      afterId === '__end__' ? null : afterId,
    );
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl shadow-2xl z-50 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Yeni Aşama Ekle</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Aşama Adı</label>
            <input required value={label} onChange={e => setLabel(e.target.value)}
              placeholder="örn. Ön Görüşme"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi-acik)]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Hangi aşamadan sonra?</label>
            <select value={afterId} onChange={e => setAfterId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi-acik)]">
              <option value="__start__">— En başa ekle</option>
              {columns.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
              <option value="__end__">— En sona ekle</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Renk</label>
            <div className="flex gap-2 flex-wrap">
              {COLUMN_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : ''} transition-transform`} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">İptal</button>
            <button type="submit"
              className="flex-1 py-2.5 text-sm font-semibold bg-[var(--color-mavi)] text-white rounded-xl hover:opacity-90 transition-opacity">Ekle</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BasvurularPage() {
  const userRoles = useMemo(() => getCurrentUserRoles(), []);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [view, setView]           = useState<'pipeline' | 'liste'>('pipeline');
  const [cursor, setCursor]       = useState<string | null>(null);
  const [hasMore, setHasMore]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy]   = useState(false);
  const [bulkToast, setBulkToast] = useState('');

  const [columns, setColumns] = useState<PipelineColumn[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLUMNS;
    try {
      const s = localStorage.getItem(COLS_KEY);
      if (!s) return DEFAULT_COLUMNS;
      const parsed = JSON.parse(s) as PipelineColumn[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COLUMNS;
    } catch { return DEFAULT_COLUMNS; }
  });

  const [activeId, setActiveId]   = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddCol, setShowAddCol] = useState(false);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  function scrollPipeline(dir: 'left' | 'right') {
    const amount = dir === 'left' ? -320 : 320;
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
    headerScrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    localStorage.setItem(COLS_KEY, JSON.stringify(columns));
  }, [columns]);

  async function load(reset = false) {
    if (!reset) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const params: { type?: string; cursor?: string } = {};
      if (typeFilter) params.type = typeFilter;
      if (!reset && cursor) params.cursor = cursor;
      const result = await adminApi.listApplications(params);
      setApplications(prev => reset ? result.data : [...prev, ...result.data]);
      setCursor(result.next_cursor);
      setHasMore(result.has_more);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi.');
    } finally { setLoading(false); setLoadingMore(false); }
  }

  useEffect(() => {
    void load(true);
    setSelectedIds(new Set());
  }, [typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = typeFilter ? applications.filter(a => a.type === typeFilter) : applications;

  async function handleBulkTransition(toState: string) {
    if (selectedIds.size === 0 || bulkBusy) return;
    const ids = [...selectedIds];
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map(id => adminApi.transitionState(id, toState)));
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    setApplications(prev => prev.map(a => {
      const idx = ids.indexOf(a.id);
      return idx !== -1 && results[idx]?.status === 'fulfilled' ? { ...a, state: toState } : a;
    }));
    setSelectedIds(new Set());
    setBulkBusy(false);
    setBulkToast(`✓ ${successCount} başvuru güncellendi`);
    setTimeout(() => setBulkToast(''), 3000);
  }

  const allListIds = filtered.map(a => a.id);
  const allSelected = allListIds.length > 0 && allListIds.every(id => selectedIds.has(id));
  const someSelected = allListIds.some(id => selectedIds.has(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allListIds));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function getColumnCards(col: PipelineColumn) {
    return filtered.filter(a => col.states.includes(a.state));
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const appId  = String(active.id);
    const target = columns.find(c => c.id === over.id);
    if (!target) return;

    const currentApp = applications.find(a => a.id === appId);
    if (!currentApp || currentApp.state === target.targetState) return;
    const prevState = currentApp.state;

    setApplications(prev => prev.map(a => a.id === appId ? { ...a, state: target.targetState } : a));

    try {
      await adminApi.transitionState(appId, target.targetState);
    } catch (err) {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, state: prevState } : a));
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi, tekrar deneyin.');
    }
  }

  const activeApp = activeId ? applications.find(a => a.id === activeId) ?? null : null;

  return (
    <div>
      {bulkToast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl">
          {bulkToast}
        </div>
      )}

      {/* Başlık */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Başvurular</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button onClick={() => setView('pipeline')}
              className={`px-4 py-1.5 font-medium transition-colors ${view === 'pipeline' ? 'bg-[var(--color-mavi)] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Pipeline
            </button>
            <button onClick={() => setView('liste')}
              className={`px-4 py-1.5 font-medium transition-colors ${view === 'liste' ? 'bg-[var(--color-mavi)] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-md border-gray-300 text-sm shadow-sm focus:border-[var(--color-mavi-acik)] focus:ring-[var(--color-mavi-acik)]">
          <option value="">Tüm Tipler</option>
          <option value="individual">Bireysel</option>
          <option value="corporate">Kurumsal</option>
          <option value="meslegin_gelecekleri">Mesleğin Geleceği</option>
          <option value="haritailesi_genc">Haritailesi Genç</option>
          <option value="haberita_editor">Haberita Editör</option>
          <option value="haberita_columnist">Haberita Köşe Yazarı</option>
        </select>
        {loading && <span className="text-sm text-gray-400 self-center">Yükleniyor…</span>}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-3">×</button>
        </div>
      )}

      {/* ─── Pipeline ─── */}
      {view === 'pipeline' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={e => void handleDragEnd(e)}
        >
          {/* Pipeline container: kendi yüksekliği var, dikey scroll burada yaşar */}
          <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
            {/* Oklar — her zaman üstte, sabit */}
            <div className="flex items-center justify-end gap-2 pb-2 shrink-0">
              <button
                onClick={() => scrollPipeline('left')}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-[#26496b] hover:border-[#26496b]/40 hover:shadow-md transition-all"
                title="Sola kaydır"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollPipeline('right')}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-[#26496b] hover:border-[#26496b]/40 hover:shadow-md transition-all"
                title="Sağa kaydır"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          {/* Donmuş sütun başlıkları — yatay scroll ile senkron, dikey scroll'da sabit kalır */}
          <div ref={headerScrollRef} className="shrink-0 overflow-x-hidden">
            <div className="flex gap-4 min-w-max">
              {columns.map(col => (
                <div key={col.id} className="w-64 flex-shrink-0">
                  <div className={`${col.color} text-white rounded-t-xl px-4 py-2.5 flex items-center justify-between`}>
                    <span className="text-sm font-semibold">{col.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-white/25 rounded-full px-2 py-0.5">{getColumnCards(col).length}</span>
                      <button
                        onClick={() => setColumns(prev => prev.filter(c => c.id !== col.id))}
                        title="Aşamayı kaldır"
                        className="text-white/50 hover:text-white text-base leading-none transition-colors"
                      >×</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="w-20 flex-shrink-0" />
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]" style={{ scrollbarWidth: 'none' }}>
            <div className="flex gap-4 min-w-max items-start">
              {columns.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  cards={getColumnCards(col)}
                  activeId={activeId}
                  onOpen={setSelectedId}
                  onRemove={() => setColumns(prev => prev.filter(c => c.id !== col.id))}
                  onDeleteApp={async (id) => {
                    await adminApi.deleteApplication(id);
                    setApplications(prev => prev.filter(a => a.id !== id));
                  }}
                  hideHeader
                />
              ))}
              {/* Aşama ekle */}
              <button
                onClick={() => setShowAddCol(true)}
                className="w-20 flex-shrink-0 flex flex-col items-center justify-center gap-1.5 py-8 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-[var(--color-mavi)] hover:text-[var(--color-mavi)] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] font-semibold leading-tight text-center">Aşama<br/>Ekle</span>
              </button>
            </div>
          </div>
          </div>

          {/* Sürükleme önizlemesi */}
          <DragOverlay dropAnimation={null}>
            {activeApp && (
              <div className="w-64 rotate-1 shadow-2xl opacity-95 scale-105">
                <CardBody app={activeApp} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* ─── Liste ─── */}
      {view === 'liste' && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Başvuran</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tip</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tarih</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const isSelected = selectedIds.has(app.id);
                  const name = app.formData?.['adSoyad'] ? String(app.formData['adSoyad']) : null;
                  return (
                    <tr key={app.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/70 cursor-pointer transition-colors group ${isSelected ? 'bg-[#26496b]/5' : ''}`}
                      onClick={() => setSelectedId(app.id)}>
                      <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(app.id); }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(app.id)}
                          className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]" />
                      </td>
                      <td className="px-4 py-3.5">
                        {name && <p className="font-medium text-gray-900">{name}</p>}
                        <p className={`text-xs ${name ? 'text-gray-400 mt-0.5' : 'font-medium text-gray-900'}`}>{app.applicantEmail}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{TIP_ETIKET[app.type] ?? app.type}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${DURUM_RENK[app.state] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATE_LABEL[app.state] ?? app.state}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(app.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <RowMenu items={[{ label: 'Detayı Aç', onClick: () => setSelectedId(app.id) }]} />
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Başvuru bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <button onClick={() => void load(false)} disabled={loadingMore}
              className="mt-4 px-4 py-2 text-sm text-[var(--color-mavi)] border border-[var(--color-mavi)] rounded-lg hover:bg-blue-50 disabled:opacity-50">
              {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Göster'}
            </button>
          )}
        </>
      )}

      {/* ─── Bulk Action Bar ─── */}
      {view === 'liste' && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl">
          <span className="text-sm font-semibold whitespace-nowrap">
            {selectedIds.size} başvuru seçildi
          </span>
          <div className="w-px h-5 bg-white/20" />
          <span className="text-xs text-white/60 whitespace-nowrap">Aşamaya taşı:</span>
          {[
            { state: 'under_review',     label: 'Ön İnceleme', cls: 'bg-blue-500 hover:bg-blue-400' },
            { state: 'interview_needed', label: 'Görüşme',     cls: 'bg-purple-500 hover:bg-purple-400' },
            { state: 'approved',         label: 'Kabul',       cls: 'bg-emerald-500 hover:bg-emerald-400' },
            { state: 'waiting_payment',  label: 'Ödeme',       cls: 'bg-orange-500 hover:bg-orange-400' },
            { state: 'rejected',         label: 'Reddet',      cls: 'bg-red-500 hover:bg-red-400' },
          ].map(({ state, label, cls }) => (
            <button
              key={state}
              disabled={bulkBusy}
              onClick={() => void handleBulkTransition(state)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${cls}`}
            >
              {bulkBusy ? '…' : label}
            </button>
          ))}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-1 text-white/50 hover:text-white transition-colors text-lg leading-none"
            title="Seçimi temizle"
          >×</button>
        </div>
      )}

      {/* Detail drawer */}
      {selectedId && (
        <DetailDrawer
          appId={selectedId}
          onClose={() => setSelectedId(null)}
          onStateChange={(id, newState) =>
            setApplications(prev => prev.map(a => a.id === id ? { ...a, state: newState } : a))
          }
          onDelete={(id) => {
            setApplications(prev => prev.filter(a => a.id !== id));
            setSelectedId(null);
          }}
          userRoles={userRoles}
        />
      )}

      {/* Aşama ekle modal */}
      {showAddCol && (
        <AddColumnModal
          columns={columns}
          onAdd={(col, afterId) => setColumns(prev => {
            if (afterId === null) return [...prev, col];
            if (afterId === '__start__') return [col, ...prev];
            const idx = prev.findIndex(c => c.id === afterId);
            if (idx === -1) return [...prev, col];
            return [...prev.slice(0, idx + 1), col, ...prev.slice(idx + 1)];
          })}
          onClose={() => setShowAddCol(false)}
        />
      )}
    </div>
  );
}
