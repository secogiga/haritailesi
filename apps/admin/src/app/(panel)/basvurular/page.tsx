'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  PointerSensor, useSensors, useSensor,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { adminApi } from '@/lib/api';
import { fmtShortDate as formatDate } from '@/lib/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type Application = {
  id: string; type: string; state: string;
  applicantEmail: string; createdAt: string; updatedAt: string;
  formData?: Record<string, unknown>;
};

type AppDetail = {
  id: string; type: string; state: string; applicantEmail: string;
  formData: Record<string, unknown>; adminNotes: string | null;
  createdAt: string;
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
  rejected: 'Reddedildi', // Sadece görüntüleme için
};

const COLUMN_COLORS = [
  'bg-yellow-500','bg-blue-500','bg-orange-500','bg-green-500',
  'bg-red-500','bg-purple-500','bg-teal-500','bg-gray-400','bg-pink-500',
];

const DEFAULT_COLUMNS: PipelineColumn[] = [
  { id: 'yeni',       label: 'Yeni Başvuru', states: ['submitted'],        targetState: 'submitted',       color: 'bg-yellow-500' },
  { id: 'on-inceleme',label: 'Ön İnceleme',  states: ['under_review'],     targetState: 'under_review',    color: 'bg-blue-500'   },
  { id: 'gorusme',    label: 'Görüşme',      states: ['interview_needed'], targetState: 'interview_needed',color: 'bg-purple-500' },
  { id: 'kabul',      label: 'Kabul',        states: ['approved'],         targetState: 'approved',        color: 'bg-green-500'  },
  { id: 'odeme',      label: 'Ödeme',        states: ['waiting_payment'],  targetState: 'waiting_payment', color: 'bg-orange-500' },
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
  waiting_payment: 'bg-orange-100 text-orange-800', interview_needed: 'bg-purple-100 text-purple-800',
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
};

// Tekil değer çevirileri
const FORM_VALUES: Record<string, Record<string, string>> = {
  cinsiyet:         { kadin: 'Kadın', erkek: 'Erkek', diger: 'Diğer', belirtmek_istemiyorum: 'Belirtmek İstemiyorum' },
  zamanAyirma:      { ayda_birkac: 'Ayda birkaç kez', haftada_birkac: 'Haftada birkaç kez', her_gun: 'Her gün', haftada_bir: 'Haftada bir' },
  egitimDurumu:     { mezun: 'Mezun', ogrenci: 'Öğrenci', lisansustu: 'Lisansüstü', doktora: 'Doktora' },
  enYuksekEgitim:   { lise: 'Lise', onlisans: 'Ön Lisans', lisans: 'Lisans', lisansustu: 'Lisansüstü', doktora: 'Doktora' },
  calismaDurumu:    { calismiyor: 'Çalışmıyor', calisuyor: 'Çalışıyor', ogrenci: 'Öğrenci', serbest: 'Serbest Meslek' },
  meslekiDeneyim:   { '0': 'Yeni başlıyorum', '1-3': '1–3 yıl', '3-5': '3–5 yıl', '5+': '5+ yıl' },
  toplulukDeneyimi: { evet: 'Evet', hayir: 'Hayır' },
  arastirmaDeneyimi:{ evet: 'Evet', hayir: 'Hayır' },
};

// Virgülle ayrılmış alan değer çevirileri
const COMMA_LABELS: Record<string, Record<string, string>> = {
  ilgiAlanlari:  { egitim: 'Eğitim', proje: 'Proje', etkinlik: 'Etkinlik', arastirma: 'Araştırma', mentorlik: 'Mentörlük' },
  katkiAlanlari: { egitim: 'Eğitim', proje: 'Proje', etkinlik: 'Etkinlik', arastirma: 'Araştırma', mentorlik: 'Mentörlük', tanitim: 'Tanıtım' },
  meslekiYonelim:{ fotogrametri: 'Fotogrametri', cbs: 'CBS', klasik_haritacilik: 'Klasik Haritacılık', uzaktan_algilama: 'Uzaktan Algılama', hidrografi: 'Hidrografi', kadastro: 'Kadastro', ins_olcme: 'İnşaat Ölçme' },
  tanismaKanali: { youtube: 'YouTube', instagram: 'Instagram', twitter: 'Twitter/X', linkedin: 'LinkedIn', arkadas: 'Arkadaş tavsiyesi', universite: 'Üniversite', diger: 'Diğer' },
};

const HIDDEN_FORM_FIELDS = new Set(['kvkk', 'iletisimOnay', 'onay', 'Kvkk', 'IletisimOnay']);

// Bölümler
const FORM_SECTIONS: { title: string; keys: string[] }[] = [
  { title: 'Kişisel Bilgiler', keys: ['adSoyad','ad','soyad','dogumTarihi','cinsiyet'] },
  { title: 'Eğitim & Kariyer', keys: ['bolum','enYuksekEgitim','egitimDurumu','universite','calismaDurumu','meslek','meslekiDeneyim','meslekiYonelim','sirketAdi','vergiNo'] },
  { title: 'İletişim',         keys: ['sehir','il','ilce','eposta','telefon'] },
  { title: 'Profil & İlgi',   keys: ['zamanAyirma','ilgiAlanlari','katkiAlanlari','toplulukDeneyimi','arastirmaDeneyimi','tanismaKanali','kisaTanitim','referans'] },
];

function formatCommaList(key: string, str: string): string {
  const map = COMMA_LABELS[key] ?? {};
  return str.split(',')
    .map(s => s.trim()).filter(Boolean)
    .map(s => map[s] ?? (s.charAt(0).toUpperCase() + s.slice(1)))
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

const COLS_KEY = 'admin_pipeline_v3';

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

function CardBody({ app, dragHandleProps, onOpen }: {
  app: Application;
  dragHandleProps?: Record<string, unknown>;
  onOpen?: () => void;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
      onClick={(e) => { if (!(e.target as HTMLElement).closest('[data-drag-handle]')) onOpen?.(); }}
    >
      <div className="flex items-start gap-2 mb-2">
        {dragHandleProps && (
          <span
            data-drag-handle
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

function DraggableCard({ app, onOpen }: { app: Application; onOpen: () => void }) {
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
      />
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  col, cards, activeId, onOpen, onRemove,
}: {
  col: PipelineColumn; cards: Application[];
  activeId: string | null; onOpen: (id: string) => void; onRemove: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const showDropZone = isOver && activeId !== null;

  return (
    <div className="w-64 flex-shrink-0 flex flex-col">
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
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-xl p-2 min-h-[60px] space-y-2 transition-colors ${
          showDropZone ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : 'bg-gray-100'
        }`}
      >
        {cards.map(app => (
          <DraggableCard key={app.id} app={app} onOpen={() => onOpen(app.id)} />
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

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  appId, onClose, onStateChange,
}: {
  appId: string; onClose: () => void;
  onStateChange: (id: string, newState: string) => void;
}) {
  const [detail, setDetail]           = useState<AppDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notes, setNotes]             = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    adminApi.getApplication(appId)
      .then(d => { setDetail(d); setNotes(d.adminNotes ?? ''); })
      .finally(() => setLoading(false));
  }, [appId]);

  async function handleTransition(toState: string) {
    if (!detail) return;
    setTransitioning(toState);
    try {
      await adminApi.transitionState(detail.id, toState);
      const updated = await adminApi.getApplication(detail.id);
      setDetail(updated);
      onStateChange(detail.id, toState);
    } finally { setTransitioning(null); }
  }

  async function saveNotes() {
    if (!detail) return;
    setSavingNotes(true);
    try { await adminApi.updateNotes(detail.id, notes); }
    finally { setSavingNotes(false); }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[440px] max-w-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-900">Başvuru Detayı</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">×</button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-[var(--color-mavi)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && detail && (() => {
          const fd = detail.formData;
          const fullName = String(fd['adSoyad'] ?? fd['AdSoyad'] ?? '').trim();
          const basvuruNo = detail.id.replace(/-/g, '').slice(0, 8).toUpperCase();
          // Bölüm bazlı satır listesi; bilinmeyen alanlar "Diğer" olarak eklenir
          const usedKeys = new Set<string>();
          const sections = FORM_SECTIONS.map(sec => {
            const rows = sec.keys
              .filter(k => k in fd && !HIDDEN_FORM_FIELDS.has(k))
              .map(k => { usedKeys.add(k); return { key: k, label: FORM_LABELS[k] ?? k, value: formatFieldValue(k, fd[k]) }; })
              .filter(r => r.value !== '');
            return { title: sec.title, rows };
          }).filter(s => s.rows.length > 0);
          // Eşleşmeyen alanlar
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
                <span className="text-xs text-gray-400 ml-auto">{formatDate(detail.createdAt)}</span>
              </div>
            </div>

            {/* Sonraki aşama */}
            {detail.validNextStates.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Sonraki Aşama</p>
                <div className="flex flex-wrap gap-2">
                  {detail.validNextStates.map(s => (
                    <button key={s} onClick={() => void handleTransition(s)}
                      disabled={transitioning !== null}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[var(--color-mavi)] hover:text-[var(--color-mavi)] disabled:opacity-40 transition-colors">
                      {transitioning === s ? '…' : `→ ${STATE_LABEL[s] ?? s}`}
                    </button>
                  ))}
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
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Admin Notu</p>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} placeholder="Not ekle…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi-acik)] resize-none"
              />
              <button onClick={() => void saveNotes()} disabled={savingNotes}
                className="mt-2 px-4 py-1.5 text-xs font-semibold bg-[var(--color-mavi)] text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity">
                {savingNotes ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
          );
        })()}
      </div>
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
      return s ? (JSON.parse(s) as PipelineColumn[]) : DEFAULT_COLUMNS;
    } catch { return DEFAULT_COLUMNS; }
  });

  const [activeId, setActiveId]   = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddCol, setShowAddCol] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollPipeline(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
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

    let prevState: string | null = null;
    setApplications(prev => {
      const app = prev.find(a => a.id === appId);
      if (!app || app.state === target.targetState) return prev;
      prevState = app.state;
      return prev.map(a => a.id === appId ? { ...a, state: target.targetState } : a);
    });

    if (!prevState || prevState === target.targetState) return;

    try {
      await adminApi.transitionState(appId, target.targetState);
    } catch {
      const rolled = prevState;
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, state: rolled } : a));
      setError('Durum güncellenemedi, tekrar deneyin.');
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
          <div className="relative pr-12">
            <button
              onClick={() => scrollPipeline('left')}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-[#26496b] hover:border-[#26496b]/40 hover:shadow-lg transition-all"
              title="Sola kaydır"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scrollPipeline('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-[#26496b] hover:border-[#26496b]/40 hover:shadow-lg transition-all"
              title="Sağa kaydır"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          <div ref={scrollRef} className="overflow-x-hidden">
            <div className="flex gap-4 min-w-max items-start">
              {columns.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  cards={getColumnCards(col)}
                  activeId={activeId}
                  onOpen={setSelectedId}
                  onRemove={() => setColumns(prev => prev.filter(c => c.id !== col.id))}
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]"
                    />
                  </th>
                  {['Ad / E-Posta','Tip','Durum','Tarih'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(app => {
                  const isSelected = selectedIds.has(app.id);
                  const name = app.formData?.['adSoyad'] ? String(app.formData['adSoyad']) : null;
                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-[#26496b]/5' : ''}`}
                      onClick={() => setSelectedId(app.id)}
                    >
                      <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(app.id); }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(app.id)}
                          className="rounded border-gray-300 text-[#26496b] focus:ring-[#26496b]"
                        />
                      </td>
                      <td className="px-6 py-4">
                        {name && <p className="text-sm font-semibold text-gray-900">{name}</p>}
                        <p className={`text-sm ${name ? 'text-gray-400' : 'text-gray-900 font-semibold'}`}>{app.applicantEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{TIP_ETIKET[app.type] ?? app.type}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DURUM_RENK[app.state] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATE_LABEL[app.state] ?? app.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(app.createdAt)}</td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Başvuru bulunamadı.</td></tr>
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
