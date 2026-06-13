'use client';

import { useState, useId, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MonthlyContent } from '@/lib/api';

// ─── Tipler ──────────────────────────────────────────────────────────────────

export type ContentKind =
  | 'event' | 'training' | 'job' | 'competition'
  | 'qa' | 'project' | 'talent' | 'survey' | 'product' | 'idol';

export type SectionKey =
  | 'events' | 'trainings' | 'jobs' | 'competitions'
  | 'qa' | 'projects' | 'talents' | 'surveys' | 'products' | 'idols';

export interface CanvasItem {
  uid: string; kind: ContentKind; id: string; title: string; sub: string;
}

export interface SectionBlock {
  uid: string; kind: SectionKey; items: CanvasItem[]; hidden?: boolean;
  variant?: 'liste' | 'kart' | 'one-cikan';
}

export interface SpotlightBlock {
  uid: string; kind: 'spotlight';
  heading: string; body: string; imageUrl: string;
  ctaText: string; ctaUrl: string; accentColor: string;
  hidden?: boolean;
}

export interface TextBlock {
  uid: string; kind: 'text'; heading: string; body: string;
  rich?: boolean; // body HTML içeriyor (Tiptap çıktısı)
  hidden?: boolean;
}

export type CellContent =
  | { type: 'empty' }
  | { type: 'item'; item: CanvasItem; customTitle?: string; customSub?: string; customLabel?: string }
  | { type: 'text'; heading: string; body: string };

export interface GridCell { uid: string; content: CellContent; }

export interface GridBlock {
  uid: string; kind: 'grid'; columns: 2 | 3; cells: GridCell[];
  heading?: string; subheading?: string; hidden?: boolean;
}

export interface DividerBlock {
  uid: string; kind: 'divider';
  style: 'line' | 'dots' | 'thick' | 'dashed';
  color?: string;
}

export interface QuoteBlock {
  uid: string; kind: 'quote';
  text: string; author?: string; accentColor?: string;
  hidden?: boolean;
}

export interface IconRowItem { uid: string; icon: string; heading: string; body: string; }
export interface IconRowBlock {
  uid: string; kind: 'iconrow';
  items: IconRowItem[];
  hidden?: boolean;
}

export interface SocialLink { platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'web'; url: string; }
export interface SocialBlock {
  uid: string; kind: 'social';
  links: SocialLink[];
  hidden?: boolean;
}

export interface TwoColumnCell {
  uid: string;
  type: 'text' | 'image';
  heading: string;
  body: string;
  imageUrl: string;
}

export interface TwoColumnBlock {
  uid: string; kind: 'twocol';
  left: TwoColumnCell;
  right: TwoColumnCell;
  layout: '50-50' | '60-40' | '40-60';
  hidden?: boolean;
}

export type CanvasBlock = SectionBlock | TextBlock | GridBlock | SpotlightBlock | DividerBlock | QuoteBlock | IconRowBlock | SocialBlock | TwoColumnBlock;

export interface CanvasState {
  blocks: CanvasBlock[];
  heroImage: string; ctaText: string; ctaUrl: string;
  themeColor?: string;
  fontFamily?: string;
  footerText?: string;
}

export const ALL_SECTION_KEYS: SectionKey[] = [
  'events','trainings','competitions','jobs','qa','projects','talents','surveys','products','idols',
];

export function emptyCanvas(): CanvasState {
  return { blocks: [], heroImage: '', ctaText: '', ctaUrl: '' };
}

export function isSection(b: CanvasBlock): b is SectionBlock {
  return (ALL_SECTION_KEYS as string[]).includes(b.kind);
}
export function isGrid(b: CanvasBlock): b is GridBlock { return b.kind === 'grid'; }
export function isText(b: CanvasBlock): b is TextBlock { return b.kind === 'text'; }
export function isSpotlight(b: CanvasBlock): b is SpotlightBlock { return b.kind === 'spotlight'; }
export function isDivider(b: CanvasBlock): b is DividerBlock { return b.kind === 'divider'; }
export function isQuote(b: CanvasBlock): b is QuoteBlock { return b.kind === 'quote'; }
export function isIconRow(b: CanvasBlock): b is IconRowBlock { return b.kind === 'iconrow'; }
export function isSocial(b: CanvasBlock): b is SocialBlock { return b.kind === 'social'; }
export function isTwoColumn(b: CanvasBlock): b is TwoColumnBlock { return b.kind === 'twocol'; }

const SECTION_META: Record<SectionKey, { label: string; icon: string; accent: string; bg: string }> = {
  events:       { label: 'Etkinlikler',           icon: '📅', accent: '#2563eb', bg: '#eff6ff' },
  trainings:    { label: 'Eğitimler',              icon: '🎓', accent: '#0d9488', bg: '#f0fdf9' },
  competitions: { label: 'Yarışmalar',             icon: '🏆', accent: '#7c3aed', bg: '#f5f3ff' },
  jobs:         { label: 'İlan Panosu',            icon: '💼', accent: '#d97706', bg: '#fffbeb' },
  qa:           { label: 'Soru & Cevap',           icon: '💬', accent: '#db2777', bg: '#fdf2f8' },
  projects:     { label: 'Projeler',               icon: '🗺️', accent: '#059669', bg: '#f0fdf4' },
  talents:      { label: 'Yetenekler',             icon: '⭐', accent: '#ea580c', bg: '#fff7ed' },
  surveys:      { label: 'Anketler',               icon: '📊', accent: '#4f46e5', bg: '#eef2ff' },
  products:     { label: 'Mağaza',                 icon: '🛍️', accent: '#dc2626', bg: '#fef2f2' },
  idols:        { label: 'Meslekte Yeni İdoller',  icon: '🌟', accent: '#0891b2', bg: '#ecfeff' },
};

function newGrid(columns: 2 | 3): GridBlock {
  const uid = `grid-${Math.random().toString(36).slice(2,8)}`;
  return { uid, kind: 'grid', columns, cells: Array.from({length: columns}, () => ({ uid: `cell-${Math.random().toString(36).slice(2,8)}`, content: { type: 'empty' } })) };
}

function kindToSection(k: ContentKind): SectionKey {
  const map: Record<ContentKind, SectionKey> = {
    event:'events', training:'trainings', job:'jobs', competition:'competitions',
    qa:'qa', project:'projects', talent:'talents', survey:'surveys', product:'products', idol:'idols',
  };
  return map[k];
}

const KIND_TO_KEY: Record<ContentKind, string> = {
  event:'events', training:'trainings', job:'jobs', competition:'competitions',
  qa:'qa', project:'projects', talent:'talents', survey:'surveys', product:'products', idol:'idols',
};

const CONTENT_KINDS: ContentKind[] = [
  'event','training','competition','job','qa','project','talent','survey','product','idol',
];

export function toCanvasItem(kind: ContentKind, src: Record<string, unknown>, id: string): CanvasItem {
  const uid = `${kind}-${id}-${Math.random().toString(36).slice(2,6)}`;
  const t = (src.title ?? src.questionText ?? src.name ?? '') as string;
  if (kind === 'event') {
    const d = src.dateStart ? new Date(src.dateStart as string).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', weekday:'short' }) : '';
    return { uid, kind, id, title: t, sub: [d, src.location as string].filter(Boolean).join(' · ') };
  }
  if (kind === 'training') return { uid, kind, id, title: t, sub: [src.instructor, src.level, src.format].filter(Boolean).join(' · ') as string };
  if (kind === 'job') return { uid, kind, id, title: t, sub: [src.company, src.location].filter(Boolean).join(' · ') as string };
  if (kind === 'competition') { const dl = src.deadline ? new Date(src.deadline as string).toLocaleDateString('tr-TR', { day:'2-digit', month:'long' }) : ''; return { uid, kind, id, title: t, sub: dl ? `Son: ${dl}` : '' }; }
  if (kind === 'qa') return { uid, kind, id, title: src.questionText as string, sub: src.category as string };
  if (kind === 'project') return { uid, kind, id, title: t, sub: [src.authorName, src.authorTag].filter(Boolean).join(' · ') as string };
  if (kind === 'talent') return { uid, kind, id, title: t, sub: [src.category, src.displayName].filter(Boolean).join(' · ') as string };
  if (kind === 'survey') return { uid, kind, id, title: t, sub: `${src.responseCount ?? 0} yanıt` };
  if (kind === 'product') { const p = src.price ? `₺${((src.price as number)/100).toFixed(0)}` : ''; return { uid, kind, id, title: t, sub: [src.type, p].filter(Boolean).join(' · ') as string }; }
  return { uid, kind, id, title: src.name as string, sub: [src.title, src.organization].filter(Boolean).join(' · ') as string };
}

// ─── Tema Renkleri ────────────────────────────────────────────────────────────

export const THEME_COLORS = [
  { label: 'Haritailesi', value: '#26496b' },
  { label: 'Lacivert',    value: '#1e3a5f' },
  { label: 'Gece Mavisi', value: '#0f2044' },
  { label: 'Koyu Yeşil',  value: '#065f46' },
  { label: 'Mor',         value: '#5b21b6' },
  { label: 'Bordo',       value: '#7f1d1d' },
  { label: 'Çikolata',    value: '#451a03' },
  { label: 'Petrol',      value: '#0c4a6e' },
];

// ─── Blok Şablonları ──────────────────────────────────────────────────────────

type BlockPreset = { label: string; desc: string; icon: string; kinds: Array<SectionKey | 'text' | 'spotlight'> };

export const BLOCK_PRESETS: BlockPreset[] = [
  {
    label: 'Etkinlik Odaklı',
    desc: 'Etkinlik + Eğitim + Yarışma',
    icon: '📅',
    kinds: ['events', 'trainings', 'competitions'],
  },
  {
    label: 'Kariyer Merkezi',
    desc: 'İlan + Yetenek + Proje',
    icon: '💼',
    kinds: ['jobs', 'talents', 'projects'],
  },
  {
    label: 'Topluluk',
    desc: 'Soru-Cevap + Anket + Mağaza',
    icon: '💬',
    kinds: ['qa', 'surveys', 'products'],
  },
  {
    label: 'Tam Bülten',
    desc: 'Tüm bölümler + Spotlight',
    icon: '⭐',
    kinds: ['spotlight', 'events', 'trainings', 'competitions', 'jobs', 'qa', 'projects'],
  },
];

// ─── Merge Tags ──────────────────────────────────────────────────────────────

export const MERGE_TAGS = [
  { label: 'İsim',           value: '{FIRSTNAME}',    desc: 'Abonenin adı' },
  { label: 'Soyisim',        value: '{LASTNAME}',     desc: 'Abonenin soyadı' },
  { label: 'E-posta',        value: '{EMAIL}',        desc: 'Abone e-posta adresi' },
  { label: 'Üyelik Tipi',    value: '{UYELIK_TIPI}',  desc: 'Üyelik seviyesi (örn: Aktif Üye)' },
  { label: 'Selamlama',      value: 'Merhaba {FIRSTNAME},', desc: 'Kişisel selamlama cümlesi' },
];

// ─── Tiptap Editörü ───────────────────────────────────────────────────────────

export function TiptapEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [showMerge, setShowMerge] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false, codeBlock: false, horizontalRule: false, strike: false,
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { style: 'color:#26496b;text-decoration:underline;', target: '_blank', rel: 'noopener' } }),
    ],
    content: value || '',
    onUpdate({ editor: ed }) { onChange(ed.getHTML()); },
    editorProps: {
      attributes: {
        class: 'min-h-[80px] px-3 py-2.5 text-sm text-gray-700 focus:outline-none leading-relaxed [&_strong]:font-bold [&_em]:italic [&_a]:text-[#26496b] [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1 [&_h3]:font-semibold [&_mark]:bg-yellow-200 [&_[style*="text-align:center"]]:text-center [&_[style*="text-align:right"]]:text-right',
      },
    },
  });

  const editorRef = useRef(editor);
  editorRef.current = editor;

  if (!editor) return <div className="h-20 bg-gray-50 rounded-lg animate-pulse" />;

  const btn = (active: boolean) =>
    `w-7 h-6 rounded text-[11px] font-bold transition-colors flex items-center justify-center ${active ? 'bg-[#26496b] text-white' : 'text-gray-500 hover:bg-gray-100'}`;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#26496b]/30">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex-wrap">
        <button type="button" onPointerDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive('bold'))} title="Kalın"><strong>B</strong></button>
        <button type="button" onPointerDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btn(editor.isActive('italic'))} italic`} title="İtalik"><em>I</em></button>
        <button type="button" onPointerDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive('heading', { level: 2 }))} title="Başlık">H2</button>
        <div className="w-px h-3.5 bg-gray-200 mx-1" />
        <button type="button" onPointerDown={e => e.preventDefault()}
          onClick={() => {
            if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return; }
            const url = window.prompt('Bağlantı URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={btn(editor.isActive('link'))} title="Bağlantı">🔗</button>
        <button type="button" onPointerDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive('bulletList'))} title="Madde listesi">•≡</button>
        <button type="button" onPointerDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive('orderedList'))} title="Numaralı liste">1≡</button>
        <div className="w-px h-3.5 bg-gray-200 mx-1" />
        {/* Merge tag dropdown */}
        <div className="relative">
          <button type="button" onPointerDown={e => e.preventDefault()}
            onClick={() => setShowMerge(v => !v)}
            className="h-6 px-1.5 rounded text-[10px] font-semibold text-purple-600 hover:bg-purple-50 border border-purple-200 transition-colors flex items-center gap-0.5"
            title="Kişiselleştirme değişkeni ekle">
            {'{}'} Değişken
          </button>
          {showMerge && (
            <div className="absolute top-7 left-0 z-20 bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[160px]">
              {MERGE_TAGS.map(mt => (
                <button key={mt.value} type="button"
                  onPointerDown={e => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().insertContent(mt.value).run();
                    setShowMerge(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-purple-50 transition-colors">
                  <span className="text-[10px] font-mono font-bold text-purple-600">{mt.value}</span>
                  <span className="text-[10px] text-gray-400">{mt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onPointerDown={e => e.preventDefault()}
          onClick={() => { editor.chain().focus().clearNodes().unsetAllMarks().run(); }}
          className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 hover:bg-gray-100 rounded transition-colors" title="Formatı temizle">
          ✕
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

// ─── Görsel Yükleme Butonu ────────────────────────────────────────────────────

function ImageUploadButton({ currentUrl, onUpload, label = 'Görsel Yükle' }: {
  currentUrl: string;
  onUpload: (file: File) => Promise<string>;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { alert('Sadece resim yükleyebilirsiniz'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    setUploading(true);
    try { await onUpload(file); }
    catch (e) { alert(e instanceof Error ? e.message : 'Yükleme hatası'); }
    finally { setUploading(false); }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }} />
      <button type="button" disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold text-[#26496b] border border-[#26496b]/25 rounded-lg hover:bg-[#26496b]/5 disabled:opacity-50 transition-colors shrink-0">
        {uploading ? '⏳' : '⬆'} {uploading ? 'Yükleniyor…' : label}
      </button>
      {currentUrl && (
        <span className="text-[9px] text-green-600 font-semibold">✓ Yüklendi</span>
      )}
    </div>
  );
}

// ─── Drag Handle ──────────────────────────────────────────────────────────────

function GripIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="7" r="1" fill="currentColor" stroke="none"/>
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>
      <circle cx="9" cy="17" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="17" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

// ─── Library Card ─────────────────────────────────────────────────────────────

function LibCard({ src, kind, onAdd }: {
  src: Record<string, unknown>; kind: ContentKind;
  onAdd: (item: CanvasItem) => void;
}) {
  const ci = toCanvasItem(kind, src, src.id as string);
  const dragId = `lib::${kind}::${src.id as string}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId, data: { dtype: 'library', kind, src },
  });
  const m = SECTION_META[kindToSection(kind)];

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border bg-white transition-all select-none cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'opacity-30 shadow-lg' : 'hover:border-gray-300 hover:shadow-sm'
      }`}>
      <span className="text-gray-200 shrink-0"><GripIcon /></span>
      <span className="text-sm shrink-0">{m.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate leading-snug">{ci.title}</p>
        {ci.sub && <p className="text-[10px] text-gray-400 truncate">{ci.sub}</p>}
      </div>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onAdd(ci); }}
        className="w-6 h-6 flex items-center justify-center rounded-md bg-[#26496b] text-white text-xs font-bold hover:bg-[#1e3a56] transition-all shrink-0"
        title="Ekle">+</button>
    </div>
  );
}

// ─── Section item (sortable) ─────────────────────────────────────────────────

function SortableItem({ item, blockUid, accent, onRemove }: {
  item: CanvasItem; blockUid: string; accent: string; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.uid, data: { dtype: 'item', item, blockUid },
  });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/ci flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white border transition-all ${isDragging ? 'opacity-30 shadow-lg border-gray-300' : 'border-gray-100 hover:border-gray-200'}`}>
      <span {...listeners} {...attributes}
        className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 shrink-0 touch-none">
        <GripIcon />
      </span>
      <div className="w-1.5 h-5 rounded-full shrink-0" style={{ background: accent }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
        {item.sub && <p className="text-[10px] text-gray-400 truncate">{item.sub}</p>}
      </div>
      <button onClick={onRemove}
        className="opacity-0 group-hover/ci:opacity-100 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 text-xs">✕</button>
    </div>
  );
}

// ─── Grid cell ────────────────────────────────────────────────────────────────

function GridCellCard({ cell, blockUid, onUpdate, activeLibItem }: {
  cell: GridCell; blockUid: string; onUpdate: (c: GridCell) => void; activeLibItem: CanvasItem | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell::${cell.uid}`, data: { dtype: 'celldrop', blockUid, cellUid: cell.uid } });
  const [textMode, setTextMode] = useState(cell.content.type === 'text');
  const inp = 'w-full border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';
  const c = cell.content;

  return (
    <div className={`flex-1 min-w-0 rounded-xl border-2 transition-all overflow-hidden ${
      isOver && !textMode ? 'border-[#26496b] bg-[#26496b]/5' : c.type !== 'empty' ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50/50'
    }`}>
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50/80 border-b border-gray-100">
        <button onClick={() => setTextMode(true)}
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${textMode ? 'bg-[#26496b] text-white' : 'text-gray-500 hover:bg-gray-200'}`}>Metin</button>
        <button onClick={() => setTextMode(false)}
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${!textMode ? 'bg-[#26496b] text-white' : 'text-gray-500 hover:bg-gray-200'}`}>İçerik</button>
        {c.type !== 'empty' && (
          <button onClick={() => { onUpdate({ ...cell, content: { type: 'empty' } }); setTextMode(false); }}
            className="ml-auto text-[10px] text-gray-300 hover:text-red-500">✕</button>
        )}
      </div>
      <div ref={setNodeRef} className="p-2 min-h-[68px]">
        {textMode ? (
          <div className="space-y-1">
            <input className={inp} placeholder="Başlık" value={c.type === 'text' ? c.heading : ''}
              onChange={e => onUpdate({ ...cell, content: { type: 'text', heading: e.target.value, body: c.type === 'text' ? c.body : '' } })} />
            <textarea rows={2} className={`${inp} resize-none`} placeholder="Metin…"
              value={c.type === 'text' ? c.body : ''}
              onChange={e => onUpdate({ ...cell, content: { type: 'text', heading: c.type === 'text' ? c.heading : '', body: e.target.value } })} />
          </div>
        ) : c.type === 'item' ? (
          <div className="space-y-1">
            <input
              value={c.customLabel ?? ''}
              onChange={e => onUpdate({ ...cell, content: { ...c, customLabel: e.target.value } })}
              className={`${inp} text-[10px] font-bold`}
              placeholder={`Etiket (varsayılan: ${c.item.kind === 'qa' ? 'Soru & Cevap' : c.item.kind === 'survey' ? 'Anket' : c.item.kind === 'competition' ? 'Yarışma' : c.item.kind})`}
            />
            <input
              value={c.customTitle ?? c.item.title}
              onChange={e => onUpdate({ ...cell, content: { ...c, customTitle: e.target.value } })}
              className={`${inp} font-semibold`}
              placeholder="Başlık"
            />
            <input
              value={c.customSub ?? c.item.sub}
              onChange={e => onUpdate({ ...cell, content: { ...c, customSub: e.target.value } })}
              className={`${inp} text-[10px] text-gray-400`}
              placeholder="Alt başlık (opsiyonel)"
            />
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center h-14 rounded-lg text-[10px] font-medium ${isOver ? 'text-[#26496b]' : 'text-gray-400'}`}>
            {isOver && activeLibItem ? <><span className="text-base mb-1">✦</span><span className="truncate max-w-full px-2 text-[#26496b]">{activeLibItem.title.slice(0,28)}</span></>
              : <><span className="text-base mb-1 opacity-30">⬇</span><span>Sürükle veya ekle</span></>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Block ────────────────────────────────────────────────────────────

const VARIANT_OPTS: Array<{ v: SectionBlock['variant']; icon: string; title: string }> = [
  { v: 'liste',     icon: '≡', title: 'Liste — standart satır görünümü' },
  { v: 'kart',      icon: '▦', title: 'Kart — renkli kart kutusu' },
  { v: 'one-cikan', icon: '★', title: 'Öne Çıkan — ilk item büyük' },
];

function SectionBlockCard({ block, onRemoveItem, onRemove, onToggleHide, onVariantChange, dl, da, onAddFromLib }: {
  block: SectionBlock; onRemoveItem: (uid: string) => void; onRemove: () => void;
  onToggleHide: () => void; onVariantChange: (v: SectionBlock['variant']) => void;
  dl?: object; da?: object;
  onAddFromLib?: (item: CanvasItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `drop::${block.uid}` });
  const [collapsed, setCollapsed] = useState(false);
  const m = SECTION_META[block.kind];
  const currentVariant = block.variant ?? 'liste';

  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all ${
      block.hidden ? 'border-gray-100 opacity-50' : isOver ? 'border-gray-300 shadow-md' : 'border-gray-100'
    }`} style={{ borderLeftColor: block.hidden ? undefined : m.accent, borderLeftWidth: 3 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 group/sh" style={{ background: `${m.accent}0d` }}>
        <span {...(dl ?? {})} {...(da ?? {})}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none">
          <GripIcon />
        </span>
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm" style={{ background: m.accent }}>
          <span>{m.icon}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: m.accent }}>{m.label}</span>
        {block.items.length > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: m.accent }}>
            {block.items.length}
          </span>
        )}
        {/* Variant toggle */}
        <div className="flex items-center gap-0 bg-white/70 rounded-md border border-white/50 p-0.5 ml-1" title="Görünüm stili">
          {VARIANT_OPTS.map(({ v, icon, title: t }) => (
            <button key={v} title={t}
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onVariantChange(v); }}
              className={`w-6 h-5 rounded text-[11px] font-bold transition-colors leading-none ${currentVariant === v ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              style={currentVariant === v ? { background: m.accent } : {}}>
              {icon}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/sh:opacity-100 transition-opacity">
          <button onClick={() => setCollapsed(c => !c)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-white/60 text-xs transition-colors" title={collapsed ? 'Genişlet' : 'Daralt'}>
            {collapsed ? '▾' : '▴'}
          </button>
          <button onClick={onToggleHide}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-white/60 text-xs transition-colors" title={block.hidden ? 'Göster' : 'Gizle'}>
            {block.hidden ? '👁' : '🙈'}
          </button>
          <button onClick={onRemove}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs transition-colors" title="Kaldır">✕</button>
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div ref={setNodeRef} className="p-2 space-y-1.5 bg-white min-h-[44px]">
          {block.items.length === 0 ? (
            <div className={`flex items-center justify-center h-10 rounded-lg text-[11px] transition-all ${isOver ? 'text-gray-700 bg-gray-50' : 'text-gray-300'}`}>
              {isOver ? '✦ Bırak' : '← Kütüphaneden sürükle veya + ile ekle'}
            </div>
          ) : (
            <SortableContext items={block.items.map(i => i.uid)} strategy={verticalListSortingStrategy}>
              {block.items.map(item => (
                <SortableItem key={item.uid} item={item} blockUid={block.uid} accent={m.accent}
                  onRemove={() => onRemoveItem(item.uid)} />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Text Block ───────────────────────────────────────────────────────────────

function TextBlockCard({ block, onUpdate, onRemove, onToggleHide, dl, da }: {
  block: TextBlock; onUpdate: (b: TextBlock) => void; onRemove: () => void;
  onToggleHide: () => void; dl?: object; da?: object;
}) {
  const inp = 'w-full border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all group/tb ${block.hidden ? 'border-gray-100 opacity-50' : 'border-[#26496b]/20'}`} style={{ borderLeftColor: '#26496b', borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2 px-3 py-2 bg-[#26496b]/5 group/th">
        <span {...(dl ?? {})} {...(da ?? {})} className="cursor-grab active:cursor-grabbing text-[#26496b]/30 hover:text-[#26496b]/60 shrink-0 touch-none"><GripIcon /></span>
        <span className="text-xs font-bold text-[#26496b] uppercase tracking-wide">✍ Metin Bloğu</span>
        {/* Düz/Zengin toggle */}
        <div className="flex items-center gap-0 bg-white/70 rounded-md border border-white/50 p-0.5 ml-1">
          <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onUpdate({ ...block, rich: false, body: block.rich ? '' : block.body }); }}
            className={`px-2 h-5 rounded text-[10px] font-semibold transition-colors ${!block.rich ? 'bg-[#26496b] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            title="Düz metin">Düz</button>
          <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onUpdate({ ...block, rich: true, body: block.rich ? block.body : '' }); }}
            className={`px-2 h-5 rounded text-[10px] font-semibold transition-colors ${block.rich ? 'bg-[#26496b] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            title="Zengin metin (Tiptap)">Zengin</button>
        </div>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/th:opacity-100 transition-opacity">
          <button onClick={onToggleHide} className="p-1 rounded text-gray-400 hover:text-gray-600 text-xs">{block.hidden ? '👁' : '🙈'}</button>
          <button onClick={onRemove} className="p-1 rounded text-gray-400 hover:text-red-500 text-xs">✕</button>
        </div>
      </div>
      {!block.hidden && (
        <div className="p-3 space-y-2 bg-white">
          <input className={inp} placeholder="Başlık (opsiyonel)" value={block.heading}
            onChange={e => onUpdate({ ...block, heading: e.target.value })} />
          {block.rich ? (
            <TiptapEditor value={block.body} onChange={v => onUpdate({ ...block, body: v })} />
          ) : (
            <textarea rows={3} className={`${inp} resize-none`} placeholder="Editöryal metin…"
              value={block.body} onChange={e => onUpdate({ ...block, body: e.target.value })} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spotlight Block ──────────────────────────────────────────────────────────

const SPOTLIGHT_ACCENTS = [
  '#26496b','#2563eb','#0d9488','#7c3aed','#d97706','#db2777','#059669','#ea580c','#dc2626','#0891b2',
];

function SpotlightBlockCard({ block, onUpdate, onRemove, onToggleHide, dl, da, onUploadImage }: {
  block: SpotlightBlock; onUpdate: (b: SpotlightBlock) => void; onRemove: () => void;
  onToggleHide: () => void; dl?: object; da?: object;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const inp = 'w-full border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';
  const ac = block.accentColor || '#26496b';
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all group/sp ${block.hidden ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}
      style={{ borderLeftColor: ac, borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2 px-3 py-2.5 group/sh" style={{ background: `${ac}10` }}>
        <span {...(dl ?? {})} {...(da ?? {})} className="cursor-grab active:cursor-grabbing shrink-0 touch-none" style={{ color: `${ac}60` }}><GripIcon /></span>
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold text-white" style={{ background: ac }}>✦</div>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ac }}>Spotlight</span>
        {/* Renk seçici */}
        <div className="flex items-center gap-0.5 ml-1">
          {SPOTLIGHT_ACCENTS.map(c => (
            <button key={c} onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onUpdate({ ...block, accentColor: c }); }}
              className="w-3.5 h-3.5 rounded-full border-2 transition-transform hover:scale-125"
              style={{ background: c, borderColor: block.accentColor === c ? '#fff' : c, boxShadow: block.accentColor === c ? `0 0 0 2px ${c}` : 'none' }} />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/sh:opacity-100 transition-opacity">
          <button onClick={onToggleHide} className="p-1 rounded text-gray-400 hover:text-gray-600 text-xs">{block.hidden ? '👁' : '🙈'}</button>
          <button onClick={onRemove} className="p-1 rounded text-gray-400 hover:text-red-500 text-xs">✕</button>
        </div>
      </div>
      {!block.hidden && (
        <div className="p-3 space-y-2 bg-white">
          {/* Görsel önizleme */}
          {block.imageUrl && (
            <img src={block.imageUrl} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-100"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div className="flex items-center gap-2">
            <input className={`${inp} flex-1`} placeholder="Görsel URL (opsiyonel)" value={block.imageUrl}
              onChange={e => onUpdate({ ...block, imageUrl: e.target.value })} />
            {onUploadImage && (
              <ImageUploadButton currentUrl={block.imageUrl}
                onUpload={async f => { const url = await onUploadImage(f); onUpdate({ ...block, imageUrl: url }); return url; }} />
            )}
          </div>
          <input className={inp} placeholder="Başlık" value={block.heading}
            onChange={e => onUpdate({ ...block, heading: e.target.value })} />
          <textarea rows={2} className={`${inp} resize-none`} placeholder="Açıklama metni…"
            value={block.body} onChange={e => onUpdate({ ...block, body: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Buton metni (opsiyonel)" value={block.ctaText}
              onChange={e => onUpdate({ ...block, ctaText: e.target.value })} />
            <input className={inp} placeholder="Buton URL" value={block.ctaUrl}
              onChange={e => onUpdate({ ...block, ctaUrl: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Grid Block ───────────────────────────────────────────────────────────────

function GridBlockCard({ block, onUpdate, onRemove, onToggleHide, dl, da, activeLibItem }: {
  block: GridBlock; onUpdate: (b: GridBlock) => void; onRemove: () => void;
  onToggleHide: () => void; dl?: object; da?: object; activeLibItem: CanvasItem | null;
}) {
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all group/gb ${block.hidden ? 'border-gray-100 opacity-50' : 'border-gray-200'}`} style={{ borderLeftColor: '#64748b', borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 group/gh">
        <span {...(dl ?? {})} {...(da ?? {})} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none"><GripIcon /></span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {block.columns === 2 ? '⬛ ⬛ İki Sütun' : '▪ ▪ ▪ Üç Sütun'}
        </span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/gh:opacity-100 transition-opacity">
          <button onClick={onToggleHide} className="p-1 rounded text-gray-400 hover:text-gray-600 text-xs">{block.hidden ? '👁' : '🙈'}</button>
          <button onClick={onRemove} className="p-1 rounded text-gray-400 hover:text-red-500 text-xs">✕</button>
        </div>
      </div>
      {!block.hidden && (
        <>
          {/* Opsiyonel başlık/alt başlık */}
          <div className="px-3 py-2 bg-white border-b border-gray-100 space-y-1.5">
            <input
              value={block.heading ?? ''}
              onChange={e => onUpdate({ ...block, heading: e.target.value })}
              placeholder="Bölüm başlığı (opsiyonel)"
              className="w-full text-xs border border-gray-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 placeholder-gray-300"
            />
            <input
              value={block.subheading ?? ''}
              onChange={e => onUpdate({ ...block, subheading: e.target.value })}
              placeholder="Alt başlık (opsiyonel)"
              className="w-full text-xs border border-gray-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 placeholder-gray-300 text-gray-400"
            />
          </div>
          <div className={`flex gap-2 p-2 bg-white ${block.columns === 3 ? 'gap-1.5' : ''}`}>
            {block.cells.map(cell => (
              <GridCellCard key={cell.uid} cell={cell} blockUid={block.uid} activeLibItem={activeLibItem}
                onUpdate={updated => onUpdate({ ...block, cells: block.cells.map(c => c.uid === cell.uid ? updated : c) })} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Divider Block ────────────────────────────────────────────────────────────

const DIVIDER_STYLES: Array<{ v: DividerBlock['style']; label: string; preview: string }> = [
  { v: 'line',   label: 'Çizgi',   preview: '─────────' },
  { v: 'thick',  label: 'Kalın',   preview: '━━━━━━━━━' },
  { v: 'dashed', label: 'Kesik',   preview: '- - - - -' },
  { v: 'dots',   label: 'Noktalar',preview: '· · · · ·' },
];

function DividerBlockCard({ block, onUpdate, onRemove, dl, da }: {
  block: DividerBlock; onUpdate: (b: DividerBlock) => void; onRemove: () => void;
  dl?: object; da?: object;
}) {
  return (
    <div className="rounded-xl overflow-hidden border-2 border-gray-100 group/div">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80">
        <span {...(dl ?? {})} {...(da ?? {})} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none"><GripIcon /></span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">— Ayırıcı</span>
        <div className="flex items-center gap-1 ml-2">
          {DIVIDER_STYLES.map(s => (
            <button key={s.v} onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ ...block, style: s.v }); }}
              title={s.label}
              className={`px-2 py-0.5 text-[9px] rounded border transition-colors ${block.style === s.v ? 'border-gray-400 bg-gray-200 text-gray-700 font-bold' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={onRemove} className="ml-auto p-1 text-gray-300 hover:text-red-500 text-xs">✕</button>
      </div>
      <div className="px-6 py-3 bg-white flex items-center justify-center">
        <span className="text-gray-200 text-sm tracking-[4px] select-none">{DIVIDER_STYLES.find(s => s.v === block.style)?.preview ?? '─────────'}</span>
      </div>
    </div>
  );
}

// ─── Quote Block ──────────────────────────────────────────────────────────────

function QuoteBlockCard({ block, onUpdate, onRemove, onToggleHide, dl, da }: {
  block: QuoteBlock; onUpdate: (b: QuoteBlock) => void; onRemove: () => void; onToggleHide: () => void;
  dl?: object; da?: object;
}) {
  const ac = block.accentColor || '#26496b';
  const inp = 'w-full border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all ${block.hidden ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}
      style={{ borderLeftColor: ac, borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: `${ac}10` }}>
        <span {...(dl ?? {})} {...(da ?? {})} className="cursor-grab active:cursor-grabbing shrink-0 touch-none" style={{ color: `${ac}50` }}><GripIcon /></span>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ac }}>" Alıntı</span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/qb:opacity-100 transition-opacity">
          <button onClick={onToggleHide} className="p-1 rounded text-gray-400 text-xs">{block.hidden ? '👁' : '🙈'}</button>
          <button onClick={onRemove} className="p-1 rounded text-gray-400 hover:text-red-500 text-xs">✕</button>
        </div>
      </div>
      {!block.hidden && (
        <div className="p-3 space-y-2 bg-white group/qb">
          <textarea rows={2} className={`${inp} resize-none text-base italic`} placeholder="Alıntı metni…"
            value={block.text} onChange={e => onUpdate({ ...block, text: e.target.value })} />
          <input className={inp} placeholder="— Kaynak / Yazar (opsiyonel)"
            value={block.author ?? ''} onChange={e => onUpdate({ ...block, author: e.target.value })} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">Renk:</span>
            {['#26496b','#2563eb','#0d9488','#7c3aed','#d97706','#db2777'].map(c => (
              <button key={c} onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onUpdate({ ...block, accentColor: c }); }}
                className="w-4 h-4 rounded-full border-2 hover:scale-125 transition-transform"
                style={{ background: c, borderColor: ac === c ? '#fff' : c, boxShadow: ac === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icon Row Block ───────────────────────────────────────────────────────────

const ICON_SUGGESTIONS = ['🎯','📌','✅','⭐','🔥','💡','🚀','🎓','📣','🌟','💬','🔗','📊','🗺️','🏆'];

function IconRowBlockCard({ block, onUpdate, onRemove, onToggleHide, dl, da }: {
  block: IconRowBlock; onUpdate: (b: IconRowBlock) => void; onRemove: () => void; onToggleHide: () => void;
  dl?: object; da?: object;
}) {
  const inp = 'w-full border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';
  function addItem() {
    onUpdate({ ...block, items: [...block.items, { uid: `ir-${Math.random().toString(36).slice(2,7)}`, icon: '✅', heading: '', body: '' }] });
  }
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all ${block.hidden ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}
      style={{ borderLeftColor: '#059669', borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50">
        <span {...(dl ?? {})} {...(da ?? {})} className="cursor-grab active:cursor-grabbing text-green-300 hover:text-green-500 shrink-0 touch-none"><GripIcon /></span>
        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">☰ İkon Listesi</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onToggleHide} className="p-1 text-gray-400 text-xs">{block.hidden ? '👁' : '🙈'}</button>
          <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 text-xs">✕</button>
        </div>
      </div>
      {!block.hidden && (
        <div className="p-3 space-y-2 bg-white">
          {block.items.map((item, idx) => (
            <div key={item.uid} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="relative">
                <input className="w-10 h-8 text-center text-xl bg-white border border-gray-100 rounded-lg focus:outline-none"
                  value={item.icon} onChange={e => {
                    const items = [...block.items]; items[idx] = { ...item, icon: e.target.value };
                    onUpdate({ ...block, items });
                  }} />
                <div className="absolute top-9 left-0 flex flex-wrap gap-0.5 bg-white border border-gray-200 rounded-lg p-1 z-10 w-36 hidden group-hover/ir:flex">
                  {ICON_SUGGESTIONS.map(ic => (
                    <button key={ic} type="button" onPointerDown={e => e.stopPropagation()}
                      onClick={() => { const its = [...block.items]; its[idx] = { ...item, icon: ic }; onUpdate({ ...block, items: its }); }}
                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-sm">{ic}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <input className={inp} placeholder="Başlık" value={item.heading}
                  onChange={e => { const its = [...block.items]; its[idx] = { ...item, heading: e.target.value }; onUpdate({ ...block, items: its }); }} />
                <input className={inp} placeholder="Açıklama (opsiyonel)" value={item.body}
                  onChange={e => { const its = [...block.items]; its[idx] = { ...item, body: e.target.value }; onUpdate({ ...block, items: its }); }} />
              </div>
              <button onClick={() => onUpdate({ ...block, items: block.items.filter(i => i.uid !== item.uid) })}
                className="p-1 text-gray-300 hover:text-red-500 text-xs shrink-0">✕</button>
            </div>
          ))}
          <button onClick={addItem}
            className="w-full py-2 text-xs text-green-600 border border-dashed border-green-200 rounded-lg hover:bg-green-50 transition-colors font-semibold">
            + Satır Ekle
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Social Block ─────────────────────────────────────────────────────────────

const SOCIAL_META: Record<SocialLink['platform'], { label: string; icon: string; placeholder: string }> = {
  twitter:   { label: 'X (Twitter)',  icon: '𝕏', placeholder: 'https://x.com/haritailesi' },
  instagram: { label: 'Instagram',   icon: '📷', placeholder: 'https://instagram.com/haritailesi' },
  linkedin:  { label: 'LinkedIn',    icon: 'in', placeholder: 'https://linkedin.com/company/haritailesi' },
  facebook:  { label: 'Facebook',    icon: 'f',  placeholder: 'https://facebook.com/haritailesi' },
  youtube:   { label: 'YouTube',     icon: '▶',  placeholder: 'https://youtube.com/@haritailesi' },
  web:       { label: 'Web Sitesi',  icon: '🌐', placeholder: 'https://haritailesi.org' },
};

function SocialBlockCard({ block, onUpdate, onRemove, onToggleHide, dl, da }: {
  block: SocialBlock; onUpdate: (b: SocialBlock) => void; onRemove: () => void; onToggleHide: () => void;
  dl?: object; da?: object;
}) {
  const inp = 'flex-1 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';
  const platforms = Object.keys(SOCIAL_META) as SocialLink['platform'][];
  const activePlatforms = new Set(block.links.map(l => l.platform));

  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all ${block.hidden ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}
      style={{ borderLeftColor: '#0891b2', borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-cyan-50">
        <span {...(dl ?? {})} {...(da ?? {})} className="cursor-grab active:cursor-grabbing text-cyan-300 hover:text-cyan-500 shrink-0 touch-none"><GripIcon /></span>
        <span className="text-xs font-bold text-cyan-700 uppercase tracking-wide">⬡ Sosyal Medya</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onToggleHide} className="p-1 text-gray-400 text-xs">{block.hidden ? '👁' : '🙈'}</button>
          <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 text-xs">✕</button>
        </div>
      </div>
      {!block.hidden && (
        <div className="p-3 bg-white space-y-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {platforms.map(p => {
              const m = SOCIAL_META[p];
              const active = activePlatforms.has(p);
              return (
                <button key={p} onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation();
                    if (active) onUpdate({ ...block, links: block.links.filter(l => l.platform !== p) });
                    else onUpdate({ ...block, links: [...block.links, { platform: p, url: '' }] });
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-colors ${active ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-200 text-gray-500 hover:border-cyan-300'}`}>
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
          {block.links.map(link => {
            const m = SOCIAL_META[link.platform];
            return (
              <div key={link.platform} className="flex items-center gap-2">
                <span className="text-sm font-bold w-6 text-center shrink-0">{m.icon}</span>
                <input className={inp} placeholder={m.placeholder} value={link.url}
                  onChange={e => onUpdate({ ...block, links: block.links.map(l => l.platform === link.platform ? { ...l, url: e.target.value } : l) })} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Two Column Block ─────────────────────────────────────────────────────────

const TWOCOL_LAYOUTS: Array<{ v: TwoColumnBlock['layout']; label: string }> = [
  { v: '50-50', label: '50 / 50' },
  { v: '60-40', label: '60 / 40' },
  { v: '40-60', label: '40 / 60' },
];

function TwoColumnCellEditor({ cell, label, onUpdate }: {
  cell: TwoColumnCell; label: string; onUpdate: (c: TwoColumnCell) => void;
}) {
  const inp = 'w-full border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white';
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50/80 border-b border-gray-100">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex-1">{label}</span>
        <div className="flex gap-0.5 bg-white/70 rounded-md border border-white/50 p-0.5">
          <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onUpdate({ ...cell, type: 'text' }); }}
            className={`px-1.5 h-5 rounded text-[9px] font-bold transition-colors ${cell.type === 'text' ? 'bg-[#26496b] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            Metin
          </button>
          <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onUpdate({ ...cell, type: 'image' }); }}
            className={`px-1.5 h-5 rounded text-[9px] font-bold transition-colors ${cell.type === 'image' ? 'bg-[#26496b] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            Görsel
          </button>
        </div>
      </div>
      <div className="p-2 space-y-1.5 bg-white">
        {cell.type === 'image' ? (
          <>
            {cell.imageUrl && (
              <img src={cell.imageUrl} alt="" className="w-full h-14 object-cover rounded-lg border border-gray-100"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <input className={inp} placeholder="Görsel URL" value={cell.imageUrl}
              onChange={e => onUpdate({ ...cell, imageUrl: e.target.value })} />
            <input className={inp} placeholder="Alt başlık (opsiyonel)" value={cell.heading}
              onChange={e => onUpdate({ ...cell, heading: e.target.value })} />
          </>
        ) : (
          <>
            <input className={inp} placeholder="Başlık" value={cell.heading}
              onChange={e => onUpdate({ ...cell, heading: e.target.value })} />
            <textarea rows={3} className={`${inp} resize-none`} placeholder="Metin…"
              value={cell.body} onChange={e => onUpdate({ ...cell, body: e.target.value })} />
          </>
        )}
      </div>
    </div>
  );
}

function TwoColumnBlockCard({ block, onUpdate, onRemove, onToggleHide, dl, da }: {
  block: TwoColumnBlock; onUpdate: (b: TwoColumnBlock) => void; onRemove: () => void;
  onToggleHide: () => void; dl?: object; da?: object;
}) {
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all ${block.hidden ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}
      style={{ borderLeftColor: '#7c3aed', borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2 px-3 py-2 bg-violet-50">
        <span {...(dl ?? {})} {...(da ?? {})} className="cursor-grab active:cursor-grabbing text-violet-300 hover:text-violet-500 shrink-0 touch-none"><GripIcon /></span>
        <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">⬛|⬛ İki Kolon</span>
        <div className="flex items-center gap-0.5 bg-white/70 rounded-md border border-white/50 p-0.5 ml-1">
          {TWOCOL_LAYOUTS.map(l => (
            <button key={l.v} onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ ...block, layout: l.v }); }}
              className={`px-2 h-5 rounded text-[9px] font-bold transition-colors ${block.layout === l.v ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onToggleHide} className="p-1 text-gray-400 text-xs">{block.hidden ? '👁' : '🙈'}</button>
          <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 text-xs">✕</button>
        </div>
      </div>
      {!block.hidden && (
        <div className="flex gap-2 p-2 bg-white">
          <TwoColumnCellEditor cell={block.left} label="Sol Kolon" onUpdate={c => onUpdate({ ...block, left: c })} />
          <TwoColumnCellEditor cell={block.right} label="Sağ Kolon" onUpdate={c => onUpdate({ ...block, right: c })} />
        </div>
      )}
    </div>
  );
}

// ─── Sortable Block Wrapper ───────────────────────────────────────────────────

function SortableBlock({ block, canvas, onChange, activeLibItem, onAddToSection, onUploadImage }: {
  block: CanvasBlock; canvas: CanvasState;
  onChange: (c: CanvasState) => void; activeLibItem: CanvasItem | null;
  onAddToSection: (blockUid: string, item: CanvasItem) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.uid, data: { dtype: 'block', block },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  function updateBlock(updated: CanvasBlock) {
    onChange({ ...canvas, blocks: canvas.blocks.map(b => b.uid === updated.uid ? updated : b) });
  }
  function removeBlock() { onChange({ ...canvas, blocks: canvas.blocks.filter(b => b.uid !== block.uid) }); }
  function toggleHide() {
    if (isSection(block)) updateBlock({ ...block, hidden: !block.hidden });
    else if (isText(block)) updateBlock({ ...block, hidden: !block.hidden });
    else if (isGrid(block)) updateBlock({ ...block, hidden: !block.hidden });
    else if (isSpotlight(block)) updateBlock({ ...block, hidden: !block.hidden });
    else if (isQuote(block)) updateBlock({ ...block, hidden: !block.hidden });
    else if (isIconRow(block)) updateBlock({ ...block, hidden: !block.hidden });
    else if (isSocial(block)) updateBlock({ ...block, hidden: !block.hidden });
    else if (isTwoColumn(block)) updateBlock({ ...block, hidden: !block.hidden });
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40 z-50' : ''}>
      {isSection(block) ? (
        <SectionBlockCard block={block}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onToggleHide={toggleHide}
          onRemoveItem={uid => updateBlock({ ...block, items: block.items.filter(i => i.uid !== uid) })}
          onAddFromLib={item => onAddToSection(block.uid, item)}
          onVariantChange={v => updateBlock({ ...block, variant: v ?? 'liste' })} />
      ) : isGrid(block) ? (
        <GridBlockCard block={block}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onToggleHide={toggleHide} activeLibItem={activeLibItem}
          onUpdate={updated => updateBlock(updated)} />
      ) : isSpotlight(block) ? (
        <SpotlightBlockCard block={block}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onToggleHide={toggleHide}
          onUpdate={updated => updateBlock(updated)}
          {...(onUploadImage ? { onUploadImage } : {})} />
      ) : isDivider(block) ? (
        <DividerBlockCard block={block}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onUpdate={updated => updateBlock(updated)} />
      ) : isQuote(block) ? (
        <QuoteBlockCard block={block}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onToggleHide={toggleHide} onUpdate={updated => updateBlock(updated)} />
      ) : isIconRow(block) ? (
        <IconRowBlockCard block={block}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onToggleHide={toggleHide} onUpdate={updated => updateBlock(updated)} />
      ) : isSocial(block) ? (
        <SocialBlockCard block={block}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onToggleHide={toggleHide} onUpdate={updated => updateBlock(updated)} />
      ) : isTwoColumn(block) ? (
        <TwoColumnBlockCard block={block}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onToggleHide={toggleHide} onUpdate={updated => updateBlock(updated)} />
      ) : (
        <TextBlockCard block={block as TextBlock}
          {...(listeners ? { dl: listeners } : {})} {...(attributes ? { da: attributes } : {})}
          onRemove={removeBlock} onToggleHide={toggleHide}
          onUpdate={updated => updateBlock(updated)} />
      )}
    </div>
  );
}

// ─── Category Accordion Section ──────────────────────────────────────────────

function CategoryAccordionSection({ kind, items, isInCanvas, onAddBlock, onItemAdd, isSearching }: {
  kind: ContentKind;
  items: Array<{ kind: ContentKind; src: Record<string, unknown> }>;
  isInCanvas: boolean;
  onAddBlock: () => void;
  onItemAdd: (item: CanvasItem) => void;
  isSearching: boolean;
}) {
  const [open, setOpen] = useState(false);
  const m = SECTION_META[kindToSection(kind)];
  const hasItems = items.length > 0;
  const showItems = isSearching ? hasItems : open && hasItems;

  return (
    <div className={`rounded-xl overflow-hidden border transition-colors ${
      hasItems ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'
    }`}>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 select-none transition-colors ${
          hasItems && !isSearching ? 'cursor-pointer hover:bg-gray-50/80' : ''
        }`}
        style={showItems ? { background: `${m.accent}0d` } : {}}
        onClick={() => hasItems && !isSearching && setOpen(o => !o)}
      >
        <span className="text-sm shrink-0">{m.icon}</span>
        <span className="text-xs font-semibold text-gray-700 flex-1 truncate">{m.label}</span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
          style={hasItems ? { background: m.accent, color: 'white' } : { background: '#f3f4f6', color: '#9ca3af' }}
        >
          {items.length}
        </span>
        {!isInCanvas && (
          <button
            onClick={e => { e.stopPropagation(); onAddBlock(); }}
            title="Canvas'a bölüm olarak ekle"
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-dashed border-gray-300 text-gray-500 hover:border-[#26496b]/50 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-all"
          >
            + Bölüm
          </button>
        )}
        {isInCanvas && <span className="text-[10px] text-gray-300 font-semibold">✓</span>}
        {hasItems && !isSearching && (
          <span className="text-[10px] text-gray-400 w-3 text-center">{open ? '▴' : '▾'}</span>
        )}
      </div>

      {showItems && (
        <div className="px-2 pb-2 pt-1 space-y-0.5 border-t border-gray-100"
          style={{ background: `${m.bg}` }}>
          {items.map(({ src }) => (
            <LibCard key={src.id as string} src={src} kind={kind} onAdd={onItemAdd} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Draggable Text Palette ───────────────────────────────────────────────────

function DraggableTextPalette({ onAdd }: { onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'palette::text', data: { dtype: 'palette', kind: 'text' },
  });
  return (
    <div ref={setNodeRef}
      className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-white hover:border-[#26496b]/40 hover:bg-[#26496b]/5 transition-all group ${isDragging ? 'opacity-50' : ''}`}>
      <span {...listeners} {...attributes}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none rounded-xl z-10" />
      <span className="text-lg pointer-events-none">✍</span>
      <span className="text-[9px] text-gray-500 group-hover:text-[#26496b] font-semibold pointer-events-none">Metin</span>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onAdd(); }}
        className="absolute inset-0 rounded-xl z-20 opacity-0"
        aria-label="Metin bloğu ekle" />
    </div>
  );
}

// ─── Drag Overlay ─────────────────────────────────────────────────────────────

function OverlayCard({ item }: { item: CanvasItem }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-2xl w-64 opacity-95">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
        {item.sub && <p className="text-[10px] text-gray-400 truncate">{item.sub}</p>}
      </div>
    </div>
  );
}

// ─── Ana Builder ─────────────────────────────────────────────────────────────

interface BuilderProps {
  content: MonthlyContent;
  canvas: CanvasState;
  onChange: (canvas: CanvasState) => void;
  intro: string;
  highlight: string;
  onIntroChange: (v: string) => void;
  onHighlightChange: (v: string) => void;
  htmlSizeKb?: number;
  liveHtml?: string;
  onUploadImage?: (file: File) => Promise<string>;
  pastNewsletters?: Array<{ id: string; title: string; month: string; selectedContent: unknown }>;
}

export function NewsletterBuilder({ content, canvas, onChange, intro, highlight, onIntroChange, onHighlightChange, htmlSizeKb, liveHtml, onUploadImage, pastNewsletters }: BuilderProps) {
  const [activeLibItem, setActiveLibItem] = useState<CanvasItem | null>(null);
  const [search, setSearch] = useState('');
  const [builderStep, setBuilderStep] = useState<1|2|3>(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<375 | 600>(600);
  const [showPresetPanel, setShowPresetPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const usedIds = new Set(
    canvas.blocks.flatMap(b =>
      isSection(b) ? b.items.map(i => i.id) :
      isGrid(b) ? b.cells.flatMap(c => c.content.type === 'item' ? [c.content.item.id] : []) : []
    )
  );

  const mc = (content as unknown) as Record<string, Array<Record<string,unknown>>>;
  function libItems(kind: ContentKind, key: string) {
    return (mc[key] ?? []).filter(r => !usedIds.has(r.id as string)).map(r => ({ kind, src: r }));
  }

  function addBlock(kind: 'text' | 'grid-2' | 'grid-3' | 'spotlight' | 'divider' | 'quote' | 'iconrow' | 'social' | 'twocol' | SectionKey) {
    const r = () => Math.random().toString(36).slice(2,8);
    let block: CanvasBlock;
    if (kind === 'text') block = { uid: `text-${r()}`, kind: 'text', heading: '', body: '' };
    else if (kind === 'grid-2') block = newGrid(2);
    else if (kind === 'grid-3') block = newGrid(3);
    else if (kind === 'spotlight') block = { uid: `sp-${r()}`, kind: 'spotlight', heading: '', body: '', imageUrl: '', ctaText: 'Daha Fazla', ctaUrl: '', accentColor: '#26496b' };
    else if (kind === 'divider') block = { uid: `div-${r()}`, kind: 'divider', style: 'line' };
    else if (kind === 'quote') block = { uid: `qt-${r()}`, kind: 'quote', text: '', author: '' };
    else if (kind === 'iconrow') block = { uid: `ir-${r()}`, kind: 'iconrow', items: [{ uid: `iri-${r()}`, icon: '✅', heading: 'Başlık', body: '' }] };
    else if (kind === 'social') block = { uid: `soc-${r()}`, kind: 'social', links: [{ platform: 'instagram', url: '' }] };
    else if (kind === 'twocol') block = {
      uid: `tc-${r()}`, kind: 'twocol', layout: '50-50',
      left: { uid: `tcl-${r()}`, type: 'text', heading: '', body: '', imageUrl: '' },
      right: { uid: `tcr-${r()}`, type: 'image', heading: '', body: '', imageUrl: '' },
    };
    else block = { uid: `sec-${kind}-${r()}`, kind: kind as SectionKey, items: [] };
    onChange({ ...canvas, blocks: [...canvas.blocks, block] });
  }

  function applyPreset(preset: BlockPreset) {
    const existingKinds = new Set(canvas.blocks.map(b => b.kind));
    const newBlocks: CanvasBlock[] = preset.kinds
      .filter(k => !existingKinds.has(k))
      .map(kind => {
        if (kind === 'text') return { uid: `text-${Math.random().toString(36).slice(2,8)}`, kind: 'text' as const, heading: '', body: '' };
        if (kind === 'spotlight') return { uid: `sp-${Math.random().toString(36).slice(2,8)}`, kind: 'spotlight' as const, heading: '', body: '', imageUrl: '', ctaText: 'Daha Fazla', ctaUrl: '', accentColor: '#26496b' };
        return { uid: `sec-${kind}-${Math.random().toString(36).slice(2,6)}`, kind: kind as SectionKey, items: [] };
      });
    if (newBlocks.length === 0) return;
    onChange({ ...canvas, blocks: [...canvas.blocks, ...newBlocks] });
    setShowPresetPanel(false);
  }

  function importFromHistory(nl: { selectedContent: unknown }) {
    const sc = nl.selectedContent as Record<string, unknown> | null;
    if (!sc?.blocks || !Array.isArray(sc.blocks)) { alert('Bu bültende içe aktarılabilir blok yok'); return; }
    const importBlocks = (sc.blocks as CanvasBlock[]).filter(b => !canvas.blocks.find(e => e.kind === b.kind));
    if (importBlocks.length === 0) { alert('Tüm bölümler zaten canvas\'ta mevcut'); return; }
    onChange({ ...canvas, blocks: [...canvas.blocks, ...importBlocks] });
    setShowHistoryPanel(false);
  }

  const addToSection = useCallback((blockUid: string, item: CanvasItem) => {
    onChange({
      ...canvas,
      blocks: canvas.blocks.map(b =>
        isSection(b) && b.uid === blockUid ? { ...b, items: [...b.items, item] } : b
      ),
    });
  }, [canvas, onChange]);

  // Click-to-add: en uygun bölüme ekle
  function handleClickAdd(ci: CanvasItem) {
    const targetSection = kindToSection(ci.kind);
    const targetBlock = canvas.blocks.find(b => isSection(b) && b.kind === targetSection) as SectionBlock | undefined;
    if (targetBlock) {
      addToSection(targetBlock.uid, ci);
    } else {
      // Bölüm yoksa oluştur
      const newBlock: SectionBlock = { uid: `sec-${targetSection}-${Math.random().toString(36).slice(2,6)}`, kind: targetSection, items: [ci] };
      onChange({ ...canvas, blocks: [...canvas.blocks, newBlock] });
    }
  }

  function handleDragStart(e: DragStartEvent) {
    const d = e.active.data.current;
    if (d?.dtype === 'library') {
      setActiveLibItem(toCanvasItem(d.kind as ContentKind, d.src as Record<string,unknown>, (d.src as Record<string,unknown>).id as string));
    } else if (d?.dtype === 'palette' && d?.kind === 'text') {
      setActiveLibItem({ uid: 'palette::text', kind: 'event', id: 'palette::text', title: 'Metin Bloğu', sub: 'Hücreye bırak' });
    }
  }

  function handleDragCancel() { setActiveLibItem(null); }

  function handleDragEnd(e: DragEndEvent) {
    setActiveLibItem(null);
    const { active, over } = e;
    if (!over) return;
    const ad = active.data.current;
    const overId = String(over.id);
    const od = over.data?.current as Record<string,unknown> | undefined;

    // Metin paleti → grid hücresi
    if (ad?.dtype === 'palette' && ad?.kind === 'text') {
      if (overId.startsWith('cell::') && od?.blockUid) {
        onChange({ ...canvas, blocks: canvas.blocks.map(b => {
          if (!isGrid(b) || b.uid !== od.blockUid) return b;
          return { ...b, cells: b.cells.map(c =>
            c.uid === od.cellUid ? { ...c, content: { type: 'text', heading: '', body: '' } } : c
          )};
        })});
      }
      return;
    }

    if (ad?.dtype === 'library') {
      const newItem = toCanvasItem(ad.kind as ContentKind, ad.src as Record<string,unknown>, (ad.src as Record<string,unknown>).id as string);
      if (overId.startsWith('cell::') && od?.blockUid) {
        onChange({ ...canvas, blocks: canvas.blocks.map(b => {
          if (!isGrid(b) || b.uid !== od.blockUid) return b;
          return { ...b, cells: b.cells.map(c => c.uid === od.cellUid ? { ...c, content: { type: 'item', item: newItem } } : c) };
        })});
        return;
      }
      let targetUid: string | null = null;
      if (overId.startsWith('drop::')) targetUid = overId.replace('drop::','');
      else for (const b of canvas.blocks) { if (isSection(b) && b.items.some(i => i.uid === overId)) { targetUid = b.uid; break; } }
      if (targetUid) onChange({ ...canvas, blocks: canvas.blocks.map(b => isSection(b) && b.uid === targetUid ? { ...b, items: [...b.items, newItem] } : b) });
      return;
    }

    if (ad?.dtype === 'block') {
      const oi = canvas.blocks.findIndex(b => b.uid === String(active.id));
      const ni = canvas.blocks.findIndex(b => b.uid === overId);
      if (oi !== -1 && ni !== -1 && oi !== ni) onChange({ ...canvas, blocks: arrayMove(canvas.blocks, oi, ni) });
      return;
    }

    if (ad?.dtype === 'item') {
      const activeUid = String(active.id);
      const fromBlock = canvas.blocks.find(b => isSection(b) && (b as SectionBlock).items.some(i => i.uid === activeUid)) as SectionBlock | undefined;
      if (!fromBlock) return;
      let toBlock: SectionBlock | undefined;
      for (const b of canvas.blocks) {
        if (!isSection(b)) continue;
        const sb = b as SectionBlock;
        if (sb.items.some(i => i.uid === overId) || `drop::${sb.uid}` === overId || sb.uid === overId) { toBlock = sb; break; }
      }
      if (!toBlock) return;
      if (fromBlock.uid === toBlock.uid) {
        const arr = fromBlock.items;
        const oi2 = arr.findIndex(i => i.uid === activeUid);
        const ni2 = arr.findIndex(i => i.uid === overId);
        if (oi2 !== -1 && ni2 !== -1 && oi2 !== ni2) onChange({ ...canvas, blocks: canvas.blocks.map(b => b.uid === fromBlock.uid && isSection(b) ? { ...b, items: arrayMove(arr, oi2, ni2) } : b) });
      } else {
        const mv = fromBlock.items.find(i => i.uid === activeUid)!;
        onChange({ ...canvas, blocks: canvas.blocks.map(b => {
          if (b.uid === fromBlock.uid && isSection(b)) return { ...b, items: b.items.filter(i => i.uid !== activeUid) };
          if (b.uid === toBlock!.uid && isSection(b)) return { ...b, items: [...b.items, mv] };
          return b;
        })});
      }
    }
  }

  const existingSectionKinds = new Set(canvas.blocks.filter(isSection).map(b => b.kind));
  const totalItems = canvas.blocks.reduce((s, b) => s + (isSection(b) && !b.hidden ? b.items.length : isText(b) && !b.hidden && b.body.trim() ? 1 : 0), 0);

  return (
    <DndContext id={dndId} sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>

      {/* ── Hazırlanma Adımları ── */}
      <div className="flex items-center gap-0 mb-5 pb-4 border-b border-gray-100">
        {([
          { n: 1, label: 'Şablon Kur',  hint: 'Bölümleri canvas\'a ekle, ⠿ ile sırala' },
          { n: 2, label: 'Metinler',    hint: 'Metin bloklarını canvas\'ta düzenle' },
          { n: 3, label: 'İçerik Ekle', hint: 'Kategorilerden içerikleri sürükle veya + ekle' },
        ] as { n: 1|2|3; label: string; hint: string }[]).map((s, i) => (
          <div key={s.n} className="flex items-center">
            <button
              onClick={() => setBuilderStep(s.n)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                builderStep === s.n  ? 'bg-[#26496b] text-white shadow-sm' :
                builderStep > s.n   ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                      'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                builderStep === s.n ? 'bg-white/20 text-white' :
                builderStep > s.n  ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{builderStep > s.n ? '✓' : s.n}</span>
              {s.label}
            </button>
            {i < 2 && <div className={`w-6 h-px mx-1 ${builderStep > s.n ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="ml-auto text-[10px] text-gray-400 italic">
          {builderStep === 1 ? "Bölümleri canvas'a ekle, ⠿ ile sırala" :
           builderStep === 2 ? "Metin bloklarını canvas'ta düzenle" :
           "Kategorilerden içerikleri sürükle veya + ile ekle"}
        </span>
      </div>

      <div className="flex gap-4 min-h-0">

        {/* ── Sol Panel — Adım 1: Şablon Kur ── */}
        {builderStep === 1 && (
          <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">

            {/* Hazır Şablonlar */}
            <div>
              <button onClick={() => setShowPresetPanel(p => !p)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 hover:text-gray-600 transition-colors">
                <span>⚡ Hazır Şablonlar</span>
                <span className="text-gray-300">{showPresetPanel ? '▴' : '▾'}</span>
              </button>
              {showPresetPanel && (
                <div className="space-y-1.5 mb-2">
                  {BLOCK_PRESETS.map(preset => (
                    <button key={preset.label} onClick={() => applyPreset(preset)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#26496b]/30 bg-[#26496b]/5 hover:bg-[#26496b]/10 transition-all text-left">
                      <span className="text-base shrink-0">{preset.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-[#26496b]">{preset.label}</p>
                        <p className="text-[10px] text-gray-400">{preset.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Özel Bloklar */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Özel Bloklar</p>
              <div className="grid grid-cols-4 gap-2">
                <DraggableTextPalette onAdd={() => addBlock('text')} />
                {([
                  { key: 'spotlight', label: '✦', desc: 'Spotlight' },
                  { key: 'grid-2',    label: '⬛⬛', desc: '2 Sütun' },
                  { key: 'grid-3',    label: '▪▪▪', desc: '3 Sütun' },
                  { key: 'divider',   label: '─', desc: 'Ayırıcı' },
                  { key: 'quote',     label: '"', desc: 'Alıntı' },
                  { key: 'iconrow',   label: '☰', desc: 'İkon Liste' },
                  { key: 'social',    label: '⬡', desc: 'Sosyal Medya' },
                  { key: 'twocol',    label: '⬛|⬛', desc: 'İki Kolon' },
                ] as { key: string; label: string; desc: string }[]).map(opt => (
                  <button key={opt.key} onClick={() => addBlock(opt.key as Parameters<typeof addBlock>[0])}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-white hover:border-[#26496b]/40 hover:bg-[#26496b]/5 transition-all group">
                    <span className="text-lg">{opt.label}</span>
                    <span className="text-[9px] text-gray-500 group-hover:text-[#26496b] font-semibold">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Bölüm Blokları</p>
              <div className="space-y-1.5">
                {CONTENT_KINDS.map(kind => {
                  const m = SECTION_META[kindToSection(kind)];
                  const itemCount = (mc[KIND_TO_KEY[kind]] ?? []).length;
                  const inCanvas = existingSectionKinds.has(kindToSection(kind));
                  return (
                    <button key={kind} onClick={() => addBlock(kindToSection(kind))}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all ${
                        inCanvas
                          ? 'border-green-200 bg-green-50 hover:bg-green-100'
                          : 'border-dashed border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base" style={{ background: m.accent }}>
                        {m.icon}
                      </div>
                      <span className="flex-1 text-xs font-semibold text-gray-700">{m.label}</span>
                      {itemCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: m.accent }}>
                          {itemCount}
                        </span>
                      )}
                      {inCanvas
                        ? <span className="text-xs font-bold text-green-600">✓</span>
                        : <span className="text-[10px] text-gray-400 font-medium">+ Ekle</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Geçmiş Bültenlerden Blok Al */}
            {pastNewsletters && pastNewsletters.length > 0 && (
              <div>
                <button onClick={() => setShowHistoryPanel(p => !p)}
                  className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors">
                  <span>📂 Geçmişten Al</span>
                  <span className="text-gray-300">{showHistoryPanel ? '▴' : '▾'}</span>
                </button>
                {showHistoryPanel && (
                  <div className="mt-2 space-y-1">
                    {pastNewsletters.slice(0, 8).map(nl => {
                      const [yr, mo] = nl.month.split('-');
                      const label = new Date(parseInt(yr!), parseInt(mo!) - 1, 1).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
                      return (
                        <button key={nl.id} onClick={() => importFromHistory(nl)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 text-left transition-colors">
                          <span className="text-[10px] font-bold text-gray-500 shrink-0 w-10">{label}</span>
                          <span className="text-xs text-gray-700 truncate flex-1">{nl.title}</span>
                          <span className="text-[10px] text-[#26496b] font-semibold shrink-0">+ Al</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setBuilderStep(2)}
              disabled={canvas.blocks.length === 0}
              className="mt-auto w-full px-4 py-2.5 text-sm font-semibold bg-[#26496b] text-white rounded-xl disabled:opacity-40 hover:bg-[#1e3a56] transition-colors"
            >
              Metinlere Geç →
            </button>
          </div>
        )}

        {/* ── Sol Panel — Adım 2: Metinler ── */}
        {builderStep === 2 && (
          <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">

            {/* Giriş metni */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Giriş Metni</p>
              <textarea rows={3} value={intro} onChange={e => onIntroChange(e.target.value)}
                placeholder="Merhaba, bu ay haritacılık dünyasından…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 resize-none leading-relaxed" />
            </div>

            {/* Öne Çıkan */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Öne Çıkan İçerik</p>
              <textarea rows={3} value={highlight} onChange={e => onHighlightChange(e.target.value)}
                placeholder="Bu ay özellikle dikkat çeken bir duyuru, başarı ya da içerik…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 resize-none leading-relaxed" />
            </div>

            {/* Canvas'taki metin blokları */}
            {canvas.blocks.filter(isText).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Canvas Metin Blokları</p>
                <div className="space-y-1.5">
                  {canvas.blocks.filter(isText).map(b => (
                    <div key={b.uid} className="px-3 py-2.5 rounded-xl border border-[#26496b]/20 bg-[#26496b]/5 text-xs space-y-0.5">
                      <p className="font-semibold text-[#26496b]">✍ {b.heading || 'Başlıksız'}</p>
                      <p className="text-gray-400 line-clamp-2">{b.body || 'Canvas\'ta tıklayarak düzenle…'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto flex gap-2 pt-1">
              <button onClick={() => setBuilderStep(1)}
                className="flex-1 px-3 py-2.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                ← Şablon
              </button>
              <button onClick={() => setBuilderStep(3)}
                className="flex-1 px-3 py-2.5 text-xs font-semibold bg-[#26496b] text-white rounded-xl hover:bg-[#1e3a56] transition-colors">
                İçerik Ekle →
              </button>
            </div>
          </div>
        )}

        {/* ── Sol Panel — Adım 3: İçerik Ekle ── */}
        {builderStep === 3 && (
          <div className="w-72 shrink-0 flex flex-col gap-3 min-h-0">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İçeriklerde ara…"
                className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 bg-white" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs w-4 h-4 flex items-center justify-center rounded">✕</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
              {CONTENT_KINDS.map(kind => {
                const allForKind = libItems(kind, KIND_TO_KEY[kind]);
                const filtered = search.trim()
                  ? allForKind.filter(({ src }) => {
                      const ci = toCanvasItem(kind, src, src.id as string);
                      const q = search.toLowerCase();
                      return ci.title.toLowerCase().includes(q) || ci.sub.toLowerCase().includes(q);
                    })
                  : allForKind;
                return (
                  <CategoryAccordionSection
                    key={kind} kind={kind} items={filtered}
                    isInCanvas={existingSectionKinds.has(kindToSection(kind))}
                    onAddBlock={() => addBlock(kindToSection(kind))}
                    onItemAdd={handleClickAdd}
                    isSearching={search.trim().length > 0}
                  />
                );
              })}
            </div>

            <button onClick={() => setBuilderStep(2)}
              className="px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              ← Metinler
            </button>
          </div>
        )}

        {/* ── Canvas + Canlı Önizleme ── */}
        <div className="flex gap-4 flex-1 min-w-0">

        {/* Canvas */}
        <div className={`flex flex-col gap-3 ${showPreview ? 'w-[360px] shrink-0' : 'flex-1 min-w-0'}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0">Canvas</p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Font seçici */}
              <select
                value={canvas.fontFamily ?? ''}
                onChange={e => { const { fontFamily: _ff, ...rest } = canvas; onChange(e.target.value ? { ...rest, fontFamily: e.target.value } : rest); }}
                className="h-6 px-1.5 text-[10px] border border-gray-200 rounded-md bg-white text-gray-600 focus:outline-none"
                title="Yazı tipi">
                <option value="">Sistem</option>
                <option value="Georgia,'Times New Roman',serif">Serif</option>
                <option value="'Arial Black',Arial,sans-serif">Sans Bold</option>
                <option value="'Trebuchet MS',Helvetica,sans-serif">Trebuchet</option>
              </select>
              {/* Tema rengi */}
              <div className="flex items-center gap-0.5" title="Tema rengi">
                {THEME_COLORS.map(tc => (
                  <button key={tc.value}
                    onClick={() => onChange({ ...canvas, themeColor: tc.value })}
                    className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 shrink-0"
                    style={{
                      background: tc.value,
                      borderColor: (canvas.themeColor || '#26496b') === tc.value ? '#fff' : tc.value,
                      boxShadow: (canvas.themeColor || '#26496b') === tc.value ? `0 0 0 2px ${tc.value}` : 'none',
                    }}
                    title={tc.label} />
                ))}
              </div>
              <span className="text-[10px] text-gray-400">
                {totalItems} öğe
                {htmlSizeKb !== undefined && (
                  <span className={`ml-1.5 font-semibold ${htmlSizeKb > 90 ? 'text-red-500' : htmlSizeKb > 60 ? 'text-amber-500' : 'text-green-600'}`}>
                    · {htmlSizeKb.toFixed(1)} KB {htmlSizeKb > 90 ? '⚠' : '✓'}
                  </span>
                )}
              </span>
              <button onClick={() => setShowPreview(v => !v)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${showPreview ? 'bg-[#26496b] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {showPreview ? '◨ Önizleme Açık' : '◨ Canlı Önizle'}
              </button>
            </div>
          </div>

          {/* Header önizleme */}
          <div className="rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gradient-to-r from-[#0e1c2f] to-[#26496b]">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="shrink-0 w-14">
                <img
                  src="https://raw.githubusercontent.com/secogiga/haritailesi/main/apps/sahne/public/logo-email.png"
                  alt="Haritailesi"
                  className="w-14 h-auto object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="border-l border-white/20 pl-3 flex-1 min-w-0">
                {canvas.heroImage && (
                  <img src={canvas.heroImage} alt="" className="w-full h-10 object-cover rounded mb-1.5 opacity-80"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <p className="text-[7px] font-bold uppercase tracking-widest text-[#66aca9]">E-Bülten</p>
                <p className="text-xs font-black text-white mt-0.5 leading-tight">Başlık / Ay</p>
                {canvas.ctaText && <span className="inline-block mt-1 bg-white/15 text-white text-[8px] font-bold px-2 py-0.5 rounded">{canvas.ctaText}</span>}
              </div>
            </div>
          </div>

          {/* Bloklar */}
          <div className="overflow-y-auto flex-1">
            <SortableContext items={canvas.blocks.map(b => b.uid)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {canvas.blocks.map(block => (
                  <SortableBlock key={block.uid} block={block} canvas={canvas}
                    onChange={onChange} activeLibItem={activeLibItem}
                    onAddToSection={addToSection}
                    {...(onUploadImage ? { onUploadImage } : {})} />
                ))}
              </div>
            </SortableContext>

            {canvas.blocks.length === 0 && (
              <div className="mt-2 py-14 px-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 space-y-3">
                {builderStep === 1 ? (
                  <>
                    <p className="text-2xl">🧱</p>
                    <p className="text-sm font-semibold text-gray-600">Bülten şablonunu oluşturmaya başla</p>
                    <p className="text-xs text-gray-400">Sol panelden istediğin bölümleri ekle.<br/>Eklenen blokları ⠿ tutarak sıralayabilirsin.</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl">⬅</p>
                    <p className="text-sm font-semibold text-gray-500">Adım 1'de bölüm ekleyin</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-center shrink-0">
            <p className="text-[10px] text-gray-400">Haritailesi Vakfı · haritailesi.org</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Abonelikten çık</p>
          </div>
        </div>

        {/* Canlı Önizleme Paneli */}
        {showPreview && (
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Canlı Önizleme</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPreviewWidth(600)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${previewWidth === 600 ? 'bg-[#26496b] text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                  title="Masaüstü (600px)">🖥 600</button>
                <button onClick={() => setPreviewWidth(375)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${previewWidth === 375 ? 'bg-[#26496b] text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                  title="Mobil (375px)">📱 375</button>
              </div>
            </div>
            <div className="flex-1 rounded-xl border border-gray-200 overflow-hidden bg-[#f5f7fa] relative" style={{ minHeight: 500 }}>
              {liveHtml ? (
                <div className="w-full h-full overflow-auto">
                  <iframe
                    srcDoc={liveHtml}
                    title="Canlı Önizleme"
                    className="border-0"
                    style={{
                      width: 600,
                      minHeight: 700,
                      display: 'block',
                      transformOrigin: 'top left',
                      transform: previewWidth === 375 ? `scale(${375/600})` : 'none',
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-xs">
                  İçerik oluşturmak için bölüm ekleyin
                </div>
              )}
            </div>
          </div>
        )}

        </div>{/* end flex canvas+preview */}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLibItem ? <OverlayCard item={activeLibItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
