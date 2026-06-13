'use client';

import { useState } from 'react';
import type { CanvasItem, CanvasState, CanvasBlock, SectionBlock, TextBlock, GridBlock, GridCell, SectionKey, SpotlightBlock, DividerBlock, QuoteBlock, IconRowBlock, SocialBlock, TwoColumnBlock, TwoColumnCell } from './_builder';
import { ALL_SECTION_KEYS } from './_builder';

function isSection(b: CanvasBlock): b is SectionBlock { return (ALL_SECTION_KEYS as string[]).includes(b.kind); }
function isGrid(b: CanvasBlock): b is GridBlock { return b.kind === 'grid'; }
function isText(b: CanvasBlock): b is TextBlock { return b.kind === 'text'; }
function isSpotlight(b: CanvasBlock): b is SpotlightBlock { return b.kind === 'spotlight'; }
function isDivider(b: CanvasBlock): b is DividerBlock { return b.kind === 'divider'; }
function isQuote(b: CanvasBlock): b is QuoteBlock { return b.kind === 'quote'; }
function isIconRow(b: CanvasBlock): b is IconRowBlock { return b.kind === 'iconrow'; }
function isSocial(b: CanvasBlock): b is SocialBlock { return b.kind === 'social'; }
function isTwoColumn(b: CanvasBlock): b is TwoColumnBlock { return b.kind === 'twocol'; }

export type TemplateId = 'klasik' | 'dergi' | 'modern' | 'kompakt' | 'duyuru' | 'minimal' | 'fotograf' | 'kariyer' | 'sezonluk' | 'istatistik';

export interface Template { id: TemplateId; name: string; desc: string; preview: React.ReactNode; }

const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://sahne.haritailesi.org';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Önizleme kartları ────────────────────────────────────────────────────────

function PreviewKlasik() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 text-[8px]">
      <div className="bg-gradient-to-r from-[#0e1c2f] to-[#26496b] px-3 py-3 text-center">
        <div className="text-[#66aca9] font-bold uppercase tracking-widest mb-0.5" style={{fontSize:6}}>E-BÜLTEN</div>
        <div className="text-white font-black text-sm">Haziran 2026</div>
      </div>
      <div className="bg-white px-3 py-2 space-y-1.5">
        <div className="h-1 bg-gray-100 rounded-full w-full" />
        <div className="border-l-2 border-[#26496b] pl-2 py-1 bg-blue-50 rounded-r">
          <div className="h-1.5 bg-blue-200 rounded-full w-full mb-1" />
          <div className="h-1 bg-blue-100 rounded-full w-2/3" />
        </div>
        <div className="space-y-0.5">{[1,2].map(i=><div key={i} className="h-1 bg-gray-100 rounded-full" />)}</div>
      </div>
      <div className="bg-gray-50 px-3 py-1.5 text-center border-t border-gray-100">
        <div className="h-1 bg-gray-200 rounded-full w-1/2 mx-auto" />
      </div>
    </div>
  );
}

function PreviewDergi() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200">
        <div className="text-[6px] font-black text-[#26496b] uppercase tracking-widest">HAR­İ­TAİ­LE­Sİ</div>
        <div className="text-[6px] text-gray-400">HAZİRAN 2026</div>
      </div>
      <div className="h-10 bg-gradient-to-br from-[#0e1c2f] to-[#66aca9] relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div>
            <div className="text-white font-black text-xs text-center leading-tight">Haziran</div>
            <div className="text-[#66aca9] text-[6px] text-center font-bold tracking-widest">2026 BÜLTENI</div>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="h-1.5 bg-gray-800 rounded-full w-3/4" />
        <div className="h-1 bg-gray-200 rounded-full w-full" />
        <div className="h-1 bg-gray-200 rounded-full w-4/5" />
        <div className="flex gap-1 mt-1.5">
          {['📅','🎓','💼'].map((i,n)=>(
            <div key={n} className="flex-1 bg-gray-50 rounded p-1 border border-gray-100">
              <div className="text-[8px] mb-0.5">{i}</div>
              <div className="h-1 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewModern() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="h-12 relative bg-[#f8fafc]" style={{background:'linear-gradient(135deg,#e8f0f7 0%,#f0f9f8 100%)'}}>
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#26496b]" />
          <div className="text-[6px] font-black text-[#26496b]">HAR­İTA­İLESİ</div>
        </div>
        <div className="absolute bottom-2 left-2">
          <div className="text-xs font-black text-gray-800 leading-none">Haziran</div>
          <div className="text-[6px] text-[#66aca9] font-bold tracking-wide">2026</div>
        </div>
        <div className="absolute top-2 right-2">
          <div className="text-[6px] bg-[#26496b] text-white px-1.5 py-0.5 rounded-full">Bülteni Oku →</div>
        </div>
      </div>
      <div className="px-3 py-2 space-y-1.5 border-t border-gray-100">
        <div className="h-1 bg-gray-200 rounded-full w-full" />
        <div className="h-1 bg-gray-100 rounded-full w-3/4" />
        <div className="grid grid-cols-2 gap-1 mt-1.5">
          {[1,2,3,4].map(i=><div key={i} className="h-5 bg-gray-50 rounded border border-gray-100 flex items-center px-1"><div className="h-1 bg-gray-200 rounded-full w-full" /></div>)}
        </div>
      </div>
    </div>
  );
}

function PreviewKompakt() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="bg-[#0e1c2f] px-3 py-2 flex items-center gap-2">
        <div className="text-[6px] font-bold text-[#66aca9] uppercase tracking-widest">Haritailesi</div>
        <div className="ml-auto text-[6px] text-white/50">HAZ 2026</div>
      </div>
      <div className="divide-y divide-gray-100">
        {['📅','🎓','💼','🏆'].map((icon,i) => (
          <div key={i} className="px-3 py-1.5 flex items-center gap-1.5">
            <span style={{fontSize:8}}>{icon}</span>
            <div className="flex-1 space-y-0.5">
              <div className="h-1.5 bg-gray-200 rounded-full w-3/4" />
              <div className="h-1 bg-gray-100 rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewDuyuru() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="bg-[#7c3aed] px-3 py-3 text-center">
        <div className="text-white/60 text-[5px] font-bold uppercase tracking-widest mb-1">DUYURU</div>
        <div className="text-white font-black text-xs leading-tight">Önemli Gelişme</div>
        <div className="text-white/70 text-[6px] mt-1">Haritailesi Vakfı</div>
      </div>
      <div className="px-3 py-2 space-y-1.5 text-center">
        <div className="h-1 bg-gray-200 rounded-full w-4/5 mx-auto" />
        <div className="h-1 bg-gray-100 rounded-full w-3/5 mx-auto" />
        <div className="mt-2 inline-block bg-[#7c3aed] rounded px-2 py-0.5">
          <div className="h-1 bg-white/80 rounded-full w-10" />
        </div>
      </div>
    </div>
  );
}

function PreviewMinimal() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="px-3 pt-3 pb-2 border-b border-gray-900">
        <div className="flex items-baseline justify-between">
          <span className="text-[6px] font-black text-gray-900 uppercase tracking-widest">Haritailesi</span>
          <span className="text-[5px] text-gray-400">HAZİRAN 2026</span>
        </div>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <div className="h-2 bg-gray-900 rounded-full w-2/3" />
        <div className="h-1 bg-gray-200 rounded-full w-full" />
        <div className="h-1 bg-gray-200 rounded-full w-4/5" />
        <div className="h-1 bg-gray-100 rounded-full w-3/5" />
      </div>
    </div>
  );
}

function PreviewFotograf() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="h-14 bg-gradient-to-br from-gray-700 to-gray-900 relative flex items-end">
        <div className="absolute inset-0 opacity-30 bg-gradient-to-t from-black" />
        <div className="relative px-3 pb-2">
          <div className="text-white font-black text-xs leading-tight">Haziran 2026</div>
          <div className="text-white/60 text-[5px]">Haritailesi Vakfı</div>
        </div>
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="h-1 bg-gray-200 rounded-full" />
        <div className="h-1 bg-gray-100 rounded-full w-3/4" />
      </div>
    </div>
  );
}

function PreviewKariyer() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="flex">
        <div className="w-8 bg-[#0e1c2f] flex flex-col items-center py-3 gap-1">
          {['💼','📊','⭐'].map((i,n) => <span key={n} style={{fontSize:8}}>{i}</span>)}
        </div>
        <div className="flex-1 px-2 py-2 space-y-1">
          <div className="text-[5px] font-bold text-[#26496b] uppercase tracking-widest">Kariyer Bülteni</div>
          <div className="h-1.5 bg-gray-800 rounded-full w-3/4" />
          <div className="h-1 bg-gray-200 rounded-full" />
          <div className="h-1 bg-gray-100 rounded-full w-2/3" />
        </div>
      </div>
    </div>
  );
}

function PreviewSezonluk() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="px-3 py-3 text-center" style={{background:'linear-gradient(135deg,#f59e0b,#ef4444)'}}>
        <div className="text-white/80 text-[5px] font-bold uppercase tracking-widest">YAZ 2026</div>
        <div className="text-white font-black text-xs mt-0.5">☀ Haritailesi</div>
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="h-1 bg-amber-200 rounded-full w-full" />
        <div className="h-1 bg-gray-100 rounded-full w-3/4" />
        <div className="flex gap-1 mt-1">
          {[1,2,3].map(i=><div key={i} className="flex-1 h-4 bg-amber-50 rounded border border-amber-100" />)}
        </div>
      </div>
    </div>
  );
}

function PreviewIstatistik() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white text-[8px]">
      <div className="bg-[#0e1c2f] px-3 py-2">
        <div className="text-[5px] text-white/50 uppercase tracking-widest">AYLIK RAPOR</div>
        <div className="flex gap-2 mt-1">
          {[{n:'247',l:'Üye'},{n:'18',l:'Etkinlik'},{n:'93%',l:'Katılım'}].map(s=>(
            <div key={s.l} className="flex-1 text-center">
              <div className="text-white font-black text-[9px]">{s.n}</div>
              <div className="text-white/40 text-[5px]">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="h-1 bg-gray-200 rounded-full" />
        <div className="h-1 bg-gray-100 rounded-full w-3/4" />
      </div>
    </div>
  );
}

export const TEMPLATES: Template[] = [
  { id: 'dergi',     name: 'Dergi',     desc: 'Editorial, hikaye odaklı',    preview: <PreviewDergi /> },
  { id: 'modern',    name: 'Modern',    desc: 'Kart tabanlı, iki sütun',     preview: <PreviewModern /> },
  { id: 'klasik',    name: 'Klasik',    desc: 'Koyu başlık, bölümlü',       preview: <PreviewKlasik /> },
  { id: 'kompakt',   name: 'Kompakt',   desc: 'Yoğun liste, hızlı tarama',  preview: <PreviewKompakt /> },
  { id: 'duyuru',    name: 'Duyuru',    desc: 'Tek mesaj, güçlü vurgu',     preview: <PreviewDuyuru /> },
  { id: 'minimal',   name: 'Minimal',   desc: 'Saf tipografi, sade tasarım', preview: <PreviewMinimal /> },
  { id: 'fotograf',  name: 'Fotoğraf',  desc: 'Tam görsel kahraman blok',   preview: <PreviewFotograf /> },
  { id: 'kariyer',   name: 'Kariyer',   desc: 'Profesyonel, sol panel',     preview: <PreviewKariyer /> },
  { id: 'sezonluk',  name: 'Sezonluk',  desc: 'Sıcak gradient, tematik',    preview: <PreviewSezonluk /> },
  { id: 'istatistik',name: 'İstatistik',desc: 'Sayısal, rapor tarzı',       preview: <PreviewIstatistik /> },
];

// ─── Örnek canvas (buildSampleHtml için) ─────────────────────────────────────

function buildSampleCanvas(): CanvasState {
  return {
    blocks: [
      {
        uid: 's-sp', kind: 'spotlight',
        heading: 'Haritailesi CBS Zirvesi 2026',
        body: 'Bu yıl 15 konuşmacı ve 200\'den fazla katılımcıyla gerçekleşen zirve büyük ilgi gördü. Kayıt ol, fotoğrafları incele!',
        imageUrl: '',
        ctaText: 'Detayları Gör',
        ctaUrl: '#',
        accentColor: '#26496b',
      } satisfies SpotlightBlock,
      {
        uid: 's-ev', kind: 'events', variant: 'liste',
        items: [
          { uid: 'e1', kind: 'event', id: '1', title: 'CBS ve Uzaktan Algılama Zirvesi', sub: 'Salı, 10 Haz · İstanbul' },
          { uid: 'e2', kind: 'event', id: '2', title: 'Harita Okuma Atölyesi', sub: 'Perş, 12 Haz · Online' },
        ],
      } satisfies SectionBlock,
      {
        uid: 's-tr', kind: 'trainings', variant: 'kart',
        items: [
          { uid: 't1', kind: 'training', id: '1', title: 'QGIS ile Mekânsal Analiz', sub: 'Başlangıç · Dr. Ahmet Yılmaz · Online' },
          { uid: 't2', kind: 'training', id: '2', title: 'Python ile Raster İşleme', sub: 'Orta · Uzaktan' },
        ],
      } satisfies SectionBlock,
      {
        uid: 's-tx', kind: 'text', heading: 'Editörden',
        body: 'Merhaba! Bu ay haritacılık dünyasından önemli gelişmeler sizi bekliyor. Topluluğumuza katkılarınız için teşekkürler.',
      } satisfies TextBlock,
    ],
    heroImage: '',
    ctaText: 'Sahne\'yi Keşfet',
    ctaUrl: '#',
    themeColor: '#26496b',
  };
}

export function buildSampleHtml(id: TemplateId): string {
  return buildHtml({
    title: 'Haziran 2026 Bülteni',
    month: '2026-06',
    intro: 'Merhaba, bu ay haritacılık dünyasından önemli gelişmeleri sizinle paylaşıyoruz.',
    highlight: 'CBS Zirvesi 2026 büyük bir başarıyla tamamlandı. 200+ katılımcı, 15 konuşmacı.',
    canvas: buildSampleCanvas(),
    template: id,
    preview: true,
  });
}

export function TemplateSelector({ selected, onChange }: { selected: TemplateId; onChange: (id: TemplateId) => void }) {
  const [previewId, setPreviewId] = useState<TemplateId | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');

  function openPreview(e: React.MouseEvent, id: TemplateId) {
    e.preventDefault();
    e.stopPropagation();
    setPreviewHtml(buildSampleHtml(id));
    setPreviewId(id);
  }

  return (
    <>
      {previewId && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreviewId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <div>
                <p className="font-bold text-gray-900 text-sm">{TEMPLATES.find(t => t.id === previewId)?.name} Şablonu</p>
                <p className="text-[10px] text-gray-400">Örnek içerikle gerçek e-posta önizlemesi</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { onChange(previewId); setPreviewId(null); }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] transition-colors">
                  Bu Şablonu Seç ✓
                </button>
                <button onClick={() => setPreviewId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <iframe srcDoc={previewHtml} className="w-full min-h-[500px] border-0" title="Şablon Önizleme" />
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-5 gap-3">
        {TEMPLATES.map(t => (
          <div key={t.id} className="relative">
            <div
              role="button"
              tabIndex={0}
              onClick={() => onChange(t.id)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange(t.id)}
              className={`w-full text-left rounded-xl p-2.5 border-2 transition-all cursor-pointer ${selected === t.id ? 'border-[#26496b] shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="mb-2">{t.preview}</div>
              <p className={`text-xs font-bold ${selected === t.id ? 'text-[#26496b]' : 'text-gray-700'}`}>{t.name}</p>
              <p className="text-[10px] text-gray-400 leading-snug">{t.desc}</p>
              <button
                type="button"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => openPreview(e, t.id)}
                className="mt-1.5 w-full py-0.5 text-[9px] font-semibold text-[#26496b]/60 border border-[#26496b]/15 rounded-md hover:bg-[#26496b]/5 hover:text-[#26496b] transition-colors">
                👁 Önizle
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── HTML üretici ─────────────────────────────────────────────────────────────

export interface HtmlOpts {
  title: string; month: string; intro: string; highlight: string;
  canvas: CanvasState; template: TemplateId;
  preview?: boolean;
  themeColor?: string;
}

function sanitizeRichHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
}

function ml(month: string) {
  const [yr, mo] = month.split('-');
  return new Date(parseInt(yr!), parseInt(mo!) - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function mlShort(month: string) {
  const [yr, mo] = month.split('-');
  return {
    month: new Date(parseInt(yr!), parseInt(mo!) - 1, 1).toLocaleDateString('tr-TR', { month: 'long' }),
    year: yr!,
  };
}

function textBlocksHtml(blocks: TextBlock[]): string {
  return blocks.filter(b => b.body.trim()).map(b => {
    const bodyHtml = b.rich
      ? sanitizeRichHtml(b.body)
      : esc(b.body).replace(/\n/g, '<br>');
    return `
    <tr><td style="padding:24px 40px 0;">
      ${b.heading ? `<h2 style="margin:0 0 12px;font-size:20px;font-weight:900;color:#111827;line-height:1.2;">${esc(b.heading)}</h2>` : ''}
      <div style="margin:0;font-size:15px;line-height:1.8;color:#374151;">${bodyHtml}</div>
    </td></tr>`;
  }).join('');
}

function ctaHtml(ctaText: string, ctaUrl: string, color = '#26496b'): string {
  if (!ctaText) return '';
  const url = ctaUrl || SAHNE_URL;
  return `<tr><td style="padding:24px 40px 0;text-align:center;">
    <a href="${esc(url)}" style="display:inline-block;background:${color};color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">${esc(ctaText)}</a>
  </td></tr>`;
}

function itemRow(item: CanvasItem, template: TemplateId, accent: string): string {
  const link = item.kind === 'event' ? `${SAHNE_URL}/etkinlikler`
    : item.kind === 'training' ? `${SAHNE_URL}/egitim`
    : item.kind === 'job' ? `${SAHNE_URL}/ilanlar`
    : `${SAHNE_URL}/yarismalar`;

  if (template === 'kompakt') {
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
      <a href="${link}" style="color:#111827;font-weight:600;font-size:13px;text-decoration:none;">${esc(item.title)}</a>
      ${item.sub ? `<div style="color:#9ca3af;font-size:11px;margin-top:2px;">${esc(item.sub)}</div>` : ''}
    </td></tr>`;
  }
  if (template === 'dergi') {
    return `<tr><td style="padding:16px 0;border-bottom:1px solid #f0f2f5;">
      <table cellpadding="0" cellspacing="0" width="100%"><tr>
        <td width="4" style="background:${accent};border-radius:2px;"></td>
        <td style="padding-left:16px;">
          <a href="${link}" style="color:#111827;font-weight:700;font-size:15px;text-decoration:none;line-height:1.3;">${esc(item.title)}</a>
          ${item.sub ? `<div style="color:#6b7280;font-size:12px;margin-top:4px;">${esc(item.sub)}</div>` : ''}
        </td>
      </tr></table>
    </td></tr>`;
  }
  if (template === 'modern') {
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
      <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e5e7eb;">
        <a href="${link}" style="color:#1f2937;font-weight:700;font-size:13px;text-decoration:none;">${esc(item.title)}</a>
        ${item.sub ? `<div style="color:#9ca3af;font-size:11px;margin-top:4px;">${esc(item.sub)}</div>` : ''}
      </div>
    </td></tr>`;
  }
  // klasik
  return `<tr><td style="padding:14px 0;border-bottom:1px solid #f0f2f5;">
    <a href="${link}" style="color:#26496b;font-weight:600;font-size:14px;text-decoration:none;">${esc(item.title)}</a>
    ${item.sub ? `<div style="color:#9ca3af;font-size:12px;margin-top:4px;">${esc(item.sub)}</div>` : ''}
  </td></tr>`;
}

function sectionHtml(icon: string, label: string, items: CanvasItem[], ctaLabel: string, ctaUrl: string, accent: string, template: TemplateId, cfg?: SectionConfig, variant?: SectionBlock['variant']): string {
  if (items.length === 0) return '';

  // Variant: kart
  if (variant === 'kart' && template !== 'kompakt') {
    const kartRows = items.map(i => kartItemRow(i, accent)).join('');
    const headerHtml = `
      <tr><td style="border-top:3px solid ${accent};background:linear-gradient(135deg,${accent}12,${accent}06);padding:12px 18px;border-radius:10px 10px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-flex;align-items:center;gap:8px;"><div style="width:24px;height:24px;background:${accent};border-radius:6px;text-align:center;line-height:24px;font-size:13px;">${icon}</div><span style="font-size:11px;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:1.5px;">${label}</span></div></td>
          <td style="text-align:right;"><a href="${ctaUrl}" style="font-size:11px;color:${accent};font-weight:600;text-decoration:none;">${ctaLabel} →</a></td>
        </tr></table>
      </td></tr>
      <tr><td style="border:1px solid ${accent}20;border-top:0;border-radius:0 0 10px 10px;padding:6px 12px 10px;">
        <table width="100%" cellpadding="0" cellspacing="0">${kartRows}</table>
      </td></tr>`;
    return `<tr><td style="padding:24px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0">${headerHtml}</table></td></tr>`;
  }

  // Variant: öne-çıkan
  if (variant === 'one-cikan' && template !== 'kompakt') {
    const rows2 = oneCikanRows(items, accent, ctaUrl);
    const headerHtml = `
      <tr><td style="border-top:3px solid ${accent};background:linear-gradient(135deg,${accent}12,${accent}06);padding:12px 18px;border-radius:10px 10px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-flex;align-items:center;gap:8px;"><div style="width:24px;height:24px;background:${accent};border-radius:6px;text-align:center;line-height:24px;font-size:13px;">${icon}</div><span style="font-size:11px;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:1.5px;">${label}</span></div></td>
          <td style="text-align:right;"><a href="${ctaUrl}" style="font-size:11px;color:${accent};font-weight:600;text-decoration:none;">${ctaLabel} →</a></td>
        </tr></table>
      </td></tr>
      <tr><td style="border:1px solid ${accent}22;border-top:0;border-radius:0 0 10px 10px;padding:8px 20px 12px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rows2}</table>
      </td></tr>`;
    return `<tr><td style="padding:24px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0">${headerHtml}</table></td></tr>`;
  }

  // Variant: liste (varsayılan)
  const rows = cfg
    ? items.map(i => cfg.renderItem(i, template)).join('')
    : items.map(i => itemRow(i, template, accent)).join('');

  if (template === 'kompakt') {
    return `<tr><td style="padding:16px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="border-left:3px solid ${accent};padding-left:10px;margin-bottom:8px;">
          <span style="font-size:10px;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:2px;">${icon} ${label}</span>
        </td></tr>
        <tr><td style="padding-top:6px;">
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
      </table>
    </td></tr>`;
  }

  // Section container ortak header
  const headerHtml = `
    <tr><td style="border-top:3px solid ${accent};background:linear-gradient(135deg,${accent}12,${accent}06);padding:14px 20px;border-radius:10px 10px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <table cellpadding="0" cellspacing="0" style="display:inline-table;">
            <tr>
              <td style="vertical-align:middle;padding-right:8px;">
                <div style="width:26px;height:26px;background:${accent};border-radius:7px;text-align:center;line-height:26px;font-size:14px;">${icon}</div>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:12px;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:1.5px;">${label}</span>
              </td>
            </tr>
          </table>
        </td>
        <td style="text-align:right;">
          <a href="${ctaUrl}" style="font-size:11px;color:${accent};font-weight:600;text-decoration:none;">${ctaLabel} →</a>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="border:1px solid ${accent}22;border-top:0;border-radius:0 0 10px 10px;padding:4px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </td></tr>`;

  if (template === 'dergi' || template === 'modern' || template === 'klasik') {
    return `<tr><td style="padding:24px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0">${headerHtml}</table></td></tr>`;
  }
  return `<tr><td style="padding:24px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0">${headerHtml}</table></td></tr>`;
}

// ─── Two Column HTML ──────────────────────────────────────────────────────────

function twoColumnCellHtml(cell: TwoColumnCell): string {
  if (cell.type === 'image') {
    return `
      ${cell.imageUrl ? `<img src="${esc(cell.imageUrl)}" alt="" width="100%" style="display:block;border-radius:8px;object-fit:cover;max-height:200px;" />` : ''}
      ${cell.heading ? `<p style="font-size:13px;font-weight:700;color:#1f2937;margin:8px 0 0;">${esc(cell.heading)}</p>` : ''}
    `;
  }
  return `
    ${cell.heading ? `<h3 style="font-size:15px;font-weight:800;color:#111827;margin:0 0 8px;line-height:1.3;">${esc(cell.heading)}</h3>` : ''}
    ${cell.body ? `<p style="font-size:13px;color:#4b5563;margin:0;line-height:1.7;">${esc(cell.body).replace(/\n/g,'<br>')}</p>` : ''}
  `;
}

function twoColumnHtml(block: TwoColumnBlock): string {
  if (block.hidden) return '';
  const leftPct = block.layout === '60-40' ? 60 : block.layout === '40-60' ? 40 : 50;
  const rightPct = 100 - leftPct;
  const leftContent = twoColumnCellHtml(block.left);
  const rightContent = twoColumnCellHtml(block.right);
  if (!leftContent.trim() && !rightContent.trim()) return '';
  return `<tr><td style="padding:24px 40px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td width="${leftPct}%" valign="top" style="padding-right:14px;">${leftContent}</td>
        <td width="${rightPct}%" valign="top">${rightContent}</td>
      </tr>
    </table>
  </td></tr>`;
}

// ─── Blok sırası ile HTML üretim ─────────────────────────────────────────────

interface SectionConfig {
  icon: string; label: string; accent: string; cta: string; ctaUrl: string;
  renderItem: (item: CanvasItem, template: TemplateId) => string;
}

const SECTION_ACCENTS: Record<SectionKey, SectionConfig> = {
  events: {
    icon: '📅', label: 'Etkinlikler', accent: '#2563eb',
    cta: 'Tüm Etkinlikler', ctaUrl: `${SAHNE_URL}/etkinlikler`,
    renderItem: (item, template) => {
      const [dateStr, ...rest] = item.sub.split(' · ');
      return sectionItemWrap(template, '#2563eb', `
        ${dateStr ? `<div style="display:inline-block;background:#eff6ff;color:#2563eb;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:6px;">${esc(dateStr)}</div>` : ''}
        <a href="${SAHNE_URL}/etkinlikler" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;line-height:1.3;">${esc(item.title)}</a>
        ${rest.length ? `<div style="color:#6b7280;font-size:11px;margin-top:4px;">📍 ${esc(rest.join(' · '))}</div>` : ''}
      `);
    },
  },
  trainings: {
    icon: '🎓', label: 'Eğitimler', accent: '#0d9488',
    cta: 'Tüm Eğitimler', ctaUrl: `${SAHNE_URL}/egitim`,
    renderItem: (item, template) => {
      const parts = item.sub.split(' · ');
      const level = parts[0] ?? '';
      const inst = parts.slice(1).join(' · ');
      const levelColor = level === 'Başlangıç' ? '#059669' : level === 'Orta' ? '#2563eb' : level.includes('İleri') ? '#7c3aed' : '#0d9488';
      return sectionItemWrap(template, '#0d9488', `
        ${level ? `<div style="display:inline-block;background:${levelColor}15;color:${levelColor};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:6px;">${esc(level)}</div>` : ''}
        <a href="${SAHNE_URL}/egitim" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;line-height:1.3;">${esc(item.title)}</a>
        ${inst ? `<div style="color:#6b7280;font-size:11px;margin-top:4px;">👤 ${esc(inst)}</div>` : ''}
      `);
    },
  },
  competitions: {
    icon: '🏆', label: 'Yarışmalar', accent: '#7c3aed',
    cta: 'Tüm Yarışmalar', ctaUrl: `${SAHNE_URL}/yarismalar`,
    renderItem: (item, template) => sectionItemWrap(template, '#7c3aed', `
      <a href="${SAHNE_URL}/yarismalar" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;line-height:1.3;">${esc(item.title)}</a>
      ${item.sub ? `<div style="color:#7c3aed;font-size:11px;margin-top:4px;font-weight:600;">⏰ ${esc(item.sub)}</div>` : ''}
    `),
  },
  jobs: {
    icon: '💼', label: 'İlan Panosu', accent: '#d97706',
    cta: 'Tüm İlanlar', ctaUrl: `${SAHNE_URL}/ilanlar`,
    renderItem: (item, template) => {
      const [company, ...rest] = item.sub.split(' · ');
      return sectionItemWrap(template, '#d97706', `
        <a href="${SAHNE_URL}/ilanlar" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;line-height:1.3;">${esc(item.title)}</a>
        <div style="margin-top:5px;display:flex;gap:8px;flex-wrap:wrap;">
          ${company ? `<span style="background:#fffbeb;color:#d97706;font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;">${esc(company)}</span>` : ''}
          ${rest.map(r => `<span style="color:#9ca3af;font-size:11px;">${esc(r)}</span>`).join('')}
        </div>
      `);
    },
  },
  qa: {
    icon: '💬', label: 'Soru & Cevap', accent: '#db2777',
    cta: 'Tüm Sorular', ctaUrl: `${SAHNE_URL}/soru-cevap`,
    renderItem: (item, template) => sectionItemWrap(template, '#db2777', `
      <div style="background:#fdf2f8;border-radius:8px;padding:12px 14px;">
        <a href="${SAHNE_URL}/soru-cevap" style="color:#1f2937;font-weight:600;font-size:13px;text-decoration:none;line-height:1.4;display:block;">${esc(item.title)}</a>
        ${item.sub ? `<div style="color:#db2777;font-size:10px;font-weight:700;margin-top:5px;text-transform:uppercase;letter-spacing:1px;">${esc(item.sub)}</div>` : ''}
      </div>
    `),
  },
  projects: {
    icon: '🗺️', label: 'Projeler', accent: '#059669',
    cta: 'Tüm Projeler', ctaUrl: `${SAHNE_URL}/projeler`,
    renderItem: (item, template) => {
      const [author, tag] = item.sub.split(' · ');
      return sectionItemWrap(template, '#059669', `
        <a href="${SAHNE_URL}/projeler" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;line-height:1.3;">${esc(item.title)}</a>
        <div style="margin-top:5px;display:flex;align-items:center;gap:8px;">
          ${author ? `<div style="width:22px;height:22px;border-radius:50%;background:#059669;display:inline-flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700;">${esc((author[0]??'').toUpperCase())}</div>` : ''}
          <span style="color:#6b7280;font-size:11px;">${esc(author ?? '')}${tag ? ` · <span style="color:#059669;">${esc(tag)}</span>` : ''}</span>
        </div>
      `);
    },
  },
  talents: {
    icon: '⭐', label: 'Yetenekler', accent: '#ea580c',
    cta: 'Tüm Yetenekler', ctaUrl: `${SAHNE_URL}/yetenekler`,
    renderItem: (item, template) => {
      const [cat, creator] = item.sub.split(' · ');
      return sectionItemWrap(template, '#ea580c', `
        ${cat ? `<div style="display:inline-block;background:#fff7ed;color:#ea580c;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:6px;">${esc(cat)}</div>` : ''}
        <a href="${SAHNE_URL}/yetenekler" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;line-height:1.3;">${esc(item.title)}</a>
        ${creator ? `<div style="color:#9ca3af;font-size:11px;margin-top:4px;">👤 ${esc(creator)}</div>` : ''}
      `);
    },
  },
  surveys: {
    icon: '📊', label: 'Anketler', accent: '#4f46e5',
    cta: 'Tüm Anketler', ctaUrl: `${SAHNE_URL}/anketler`,
    renderItem: (item, template) => sectionItemWrap(template, '#4f46e5', `
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <a href="${SAHNE_URL}/anketler" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;line-height:1.3;">${esc(item.title)}</a>
          ${item.sub ? `<div style="color:#9ca3af;font-size:11px;margin-top:4px;">${esc(item.sub)}</div>` : ''}
        </td>
        <td style="text-align:right;white-space:nowrap;padding-left:12px;">
          <a href="${SAHNE_URL}/anketler" style="display:inline-block;background:#4f46e5;color:#fff;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;text-decoration:none;">Katıl →</a>
        </td>
      </tr></table>
    `),
  },
  products: {
    icon: '🛍️', label: 'Mağaza', accent: '#dc2626',
    cta: 'Mağazaya Git', ctaUrl: `${SAHNE_URL}/magaza`,
    renderItem: (item, template) => {
      const [type, price] = item.sub.split(' · ');
      const typeLabel = type === 'digital' ? '📄 Dijital' : type === 'physical' ? '📦 Fiziksel' : type === 'app' ? '📱 Uygulama' : type ?? '';
      return sectionItemWrap(template, '#dc2626', `
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            ${typeLabel ? `<div style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-bottom:6px;">${typeLabel}</div>` : ''}
            <a href="${SAHNE_URL}/magaza" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;line-height:1.3;">${esc(item.title)}</a>
          </td>
          ${price ? `<td style="text-align:right;white-space:nowrap;padding-left:12px;vertical-align:middle;"><span style="font-size:16px;font-weight:900;color:#dc2626;">${esc(price)}</span></td>` : ''}
        </tr></table>
      `);
    },
  },
  idols: {
    icon: '🌟', label: 'Meslekte Yeni İdoller', accent: '#0891b2',
    cta: 'Tüm İdoller', ctaUrl: `${SAHNE_URL}/meslekte-yeni-idoller`,
    renderItem: (item, template) => {
      const [title, org] = item.sub.split(' · ');
      const initials = item.title.split(' ').slice(0,2).map(w=>w[0]??'').join('').toUpperCase();
      return sectionItemWrap(template, '#0891b2', `
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td width="44" style="vertical-align:top;">
            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#0891b2,#0e7490);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;">${initials}</div>
          </td>
          <td style="padding-left:12px;vertical-align:top;">
            <a href="${SAHNE_URL}/meslekte-yeni-idoller" style="color:#111827;font-weight:700;font-size:14px;text-decoration:none;display:block;">${esc(item.title)}</a>
            ${title ? `<div style="color:#0891b2;font-size:11px;font-weight:600;margin-top:2px;">${esc(title)}</div>` : ''}
            ${org ? `<div style="color:#9ca3af;font-size:11px;margin-top:1px;">${esc(org)}</div>` : ''}
          </td>
        </tr></table>
      `);
    },
  },
};

const KIND_LINKS: Record<string, string> = {
  event:       `${SAHNE_URL}/etkinlikler`,
  training:    `${SAHNE_URL}/egitim`,
  job:         `${SAHNE_URL}/ilanlar`,
  competition: `${SAHNE_URL}/yarismalar`,
  qa:          `${SAHNE_URL}/soru-cevap`,
  project:     `${SAHNE_URL}/projeler`,
  talent:      `${SAHNE_URL}/yetenekler`,
  survey:      `${SAHNE_URL}/anketler`,
  product:     `${SAHNE_URL}/magaza`,
  idol:        `${SAHNE_URL}/meslekte-yeni-idoller`,
};
const KIND_ACCENTS: Record<string, string> = {
  event:'#2563eb', training:'#0d9488', job:'#d97706', competition:'#7c3aed',
  qa:'#db2777', project:'#059669', talent:'#ea580c', survey:'#4f46e5', product:'#dc2626', idol:'#0891b2',
};
const KIND_LABELS: Record<string, string> = {
  event:'Etkinlik', training:'Eğitim', job:'İlan', competition:'Yarışma',
  qa:'Soru & Cevap', project:'Proje', talent:'Yetenek', survey:'Anket', product:'Mağaza', idol:'İdol',
};

// Sütun genişliğine göre başlık kırpma
function truncateTitle(s: string, pct: string): string {
  const max = pct === '33%' ? 72 : 100;
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// DB snake_case → okunabilir (enstruman_calmak → enstruman calmak)
function fmtSub(s: string): string {
  return s.replace(/_/g, ' ');
}

// Tek hücrenin <td> içeriğini döner — dış kapsayıcı buildBlocksHtml'de
function gridCellTd(cell: GridCell, template: TemplateId, pct: string, isLast: boolean): string {
  const c = cell.content;
  const divider = isLast ? '' : 'border-right:1px solid #f0f2f5;';

  if (c.type === 'empty') {
    return `<td width="${pct}" style="${divider}padding:16px;vertical-align:top;"></td>`;
  }

  if (template === 'kompakt') {
    if (c.type === 'text') {
      return `<td width="${pct}" style="${divider}padding:10px 12px;vertical-align:top;">
        ${c.heading ? `<p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#111827;">${esc(c.heading)}</p>` : ''}
        ${c.body ? `<p style="margin:0;font-size:11px;line-height:1.55;color:#374151;">${esc(c.body).replace(/\n/g,'<br>')}</p>` : ''}
      </td>`;
    }
    const item = c.item;
    const link = KIND_LINKS[item.kind] ?? SAHNE_URL;
    return `<td width="${pct}" style="${divider}padding:10px 12px;vertical-align:top;">
      <a href="${link}" style="color:#1f2937;font-weight:600;font-size:12px;text-decoration:none;display:block;line-height:1.3;">${esc(truncateTitle(item.title, pct))}</a>
      ${item.sub ? `<p style="margin:3px 0 0;font-size:10px;color:#9ca3af;">${esc(fmtSub(item.sub))}</p>` : ''}
    </td>`;
  }

  // ── Metin hücresi ──
  if (c.type === 'text') {
    return `<td width="${pct}" style="${divider}padding:20px 18px;background:#f8fafc;vertical-align:top;border-top:3px solid #e2e8f0;">
      ${c.heading ? `<p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#111827;line-height:1.25;">${esc(c.heading)}</p>` : ''}
      ${c.body ? `<p style="margin:0;font-size:13px;line-height:1.72;color:#374151;">${esc(c.body).replace(/\n/g,'<br>')}</p>` : ''}
    </td>`;
  }

  // ── İçerik hücresi ──
  const item   = c.item;
  const link   = KIND_LINKS[item.kind]   ?? SAHNE_URL;
  const accent = KIND_ACCENTS[item.kind] ?? '#26496b';
  const label  = c.customLabel || KIND_LABELS[item.kind] || '';
  const title  = truncateTitle(c.customTitle ?? item.title, pct);
  const sub    = fmtSub(c.customSub ?? item.sub ?? '');

  // Tür bazlı CTA butonu
  const ctaText = item.kind === 'event'       ? 'Katıl →'
                : item.kind === 'training'    ? 'Kayıt Ol →'
                : item.kind === 'product'     ? 'Ürünü Al →'
                : item.kind === 'job'         ? 'Başvur →'
                : item.kind === 'survey'      ? 'Ankete Katıl →'
                : item.kind === 'competition' ? 'Başvur →'
                : item.kind === 'qa'          ? 'Yanıtla →'
                : '';

  return `<td width="${pct}" style="${divider}padding:18px 16px;background:#ffffff;vertical-align:top;border-top:3px solid ${accent};">
    <p style="margin:0 0 10px;">
      <span style="display:inline-block;background:${accent}18;color:${accent};font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;letter-spacing:0.3px;">${label}</span>
    </p>
    <a href="${link}" style="color:#111827;font-weight:700;font-size:13px;text-decoration:none;line-height:1.45;display:block;">${esc(title)}</a>
    ${sub ? `<p style="margin:6px 0 0;font-size:11px;color:#9ca3af;line-height:1.4;">${esc(sub)}</p>` : ''}
    ${ctaText ? `<p style="margin:12px 0 0;"><a href="${link}" style="display:inline-block;background:${accent};color:#ffffff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;text-decoration:none;">${ctaText}</a></p>` : ''}
  </td>`;
}

function sectionItemWrap(template: TemplateId, _accent: string, inner: string): string {
  if (template === 'kompakt') {
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">${inner}</td></tr>`;
  }
  return `<tr><td style="padding:14px 0;border-bottom:1px solid #f5f5f5;">${inner}</td></tr>`;
}

// ── Kart variant: her item renkli kart kutusunda ──────────────────────────────
function kartItemRow(item: CanvasItem, accent: string): string {
  const link = KIND_LINKS[item.kind] ?? SAHNE_URL;
  const label = KIND_LABELS[item.kind] ?? '';
  return `<tr><td style="padding:5px 0;">
    <div style="background:${accent}09;border-radius:10px;border-left:3px solid ${accent};padding:12px 16px;">
      <span style="font-size:9px;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:1.2px;display:block;margin-bottom:5px;">${label}</span>
      <a href="${link}" style="color:#111827;font-weight:700;font-size:13px;text-decoration:none;line-height:1.35;display:block;">${esc(item.title)}</a>
      ${item.sub ? `<div style="color:#6b7280;font-size:11px;margin-top:4px;">${esc(item.sub)}</div>` : ''}
    </div>
  </td></tr>`;
}

// ── Öne Çıkan variant: ilk item büyük hero, rest mini liste ──────────────────
function oneCikanRows(items: CanvasItem[], accent: string, ctaUrl: string): string {
  const [featured, ...rest] = items;
  if (!featured) return '';
  const featuredHtml = `
    <tr><td style="padding:0 0 10px;">
      <div style="background:linear-gradient(135deg,${accent}14,${accent}07);border-radius:12px;border:1px solid ${accent}25;padding:20px 22px;">
        <div style="display:inline-block;background:${accent};color:#fff;font-size:9px;font-weight:800;padding:3px 9px;border-radius:20px;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;">✦ Öne Çıkan</div>
        <a href="${ctaUrl}" style="color:#111827;font-weight:900;font-size:17px;text-decoration:none;line-height:1.3;display:block;">${esc(featured.title)}</a>
        ${featured.sub ? `<div style="color:#6b7280;font-size:12px;margin-top:6px;">${esc(featured.sub)}</div>` : ''}
        <a href="${ctaUrl}" style="display:inline-block;margin-top:12px;background:${accent};color:#fff;font-size:11px;font-weight:700;padding:7px 17px;border-radius:20px;text-decoration:none;">İncele →</a>
      </div>
    </td></tr>`;
  const restHtml = rest.map(i => `
    <tr><td style="padding:8px 0;border-bottom:1px solid #f5f5f5;">
      <a href="${ctaUrl}" style="color:#374151;font-weight:600;font-size:13px;text-decoration:none;display:block;line-height:1.3;">${esc(i.title)}</a>
      ${i.sub ? `<div style="color:#9ca3af;font-size:11px;margin-top:2px;">${esc(i.sub)}</div>` : ''}
    </td></tr>`).join('');
  return featuredHtml + restHtml;
}

// ── Spotlight block HTML ───────────────────────────────────────────────────────
function spotlightHtml(block: SpotlightBlock, _template: TemplateId): string {
  if (!block.heading && !block.body) return '';
  const ac = block.accentColor || '#26496b';
  const url = block.ctaUrl || SAHNE_URL;
  return `<tr><td style="padding:24px 40px 0;">
    <div style="border-radius:14px;border:1px solid ${ac}25;overflow:hidden;background:linear-gradient(135deg,${ac}10,${ac}06);">
      ${block.imageUrl ? `<img src="${esc(block.imageUrl)}" alt="" style="width:100%;height:180px;object-fit:cover;display:block;">` : ''}
      <div style="padding:24px 26px;">
        ${block.heading ? `<h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#111827;line-height:1.2;">${esc(block.heading)}</h2>` : ''}
        ${block.body ? `<p style="margin:0 ${block.ctaText ? '0 18px' : ''};font-size:14px;line-height:1.78;color:#374151;">${esc(block.body).replace(/\n/g,'<br>')}</p>` : ''}
        ${block.ctaText ? `<a href="${esc(url)}" style="display:inline-block;background:${ac};color:#fff;font-size:13px;font-weight:700;padding:11px 26px;border-radius:8px;text-decoration:none;margin-top:18px;">${esc(block.ctaText)} →</a>` : ''}
      </div>
    </div>
  </td></tr>`;
}

function buildBlocksHtml(canvas: CanvasState, template: TemplateId): string {
  return canvas.blocks.map(block => {
    // Metin bloğu
    if (isText(block)) {
      if (!block.body.trim() && !block.heading.trim()) return '';
      const bodyHtml = block.rich
        ? sanitizeRichHtml(block.body)
        : esc(block.body).replace(/\n/g, '<br>');
      if (template === 'kompakt') {
        return `<tr><td style="padding:12px 40px;border-bottom:1px solid #f3f4f6;">
          ${block.heading ? `<strong style="display:block;font-size:12px;color:#111827;margin-bottom:4px;">${esc(block.heading)}</strong>` : ''}
          <div style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">${bodyHtml}</div>
        </td></tr>`;
      }
      return `<tr><td style="padding:28px 40px 0;">
        ${block.heading ? `<h2 style="margin:0 0 12px;font-size:20px;font-weight:900;color:#111827;line-height:1.2;">${esc(block.heading)}</h2>` : ''}
        <div style="margin:0;font-size:15px;line-height:1.8;color:#374151;">${bodyHtml}</div>
      </td></tr>`;
    }

    // Grid bloğu (2 veya 3 sütun) — tek kapsayıcı, eşit yükseklik
    if (isGrid(block)) {
      const hasContent = block.cells.some(c => c.content.type !== 'empty');
      if (!hasContent) return '';
      const cols = block.columns;
      const pct  = cols === 2 ? '50%' : '33%';
      const cells = block.cells.map((cell, i) =>
        gridCellTd(cell, template, pct, i === cols - 1)
      ).join('');

      if (template === 'kompakt') {
        return `<tr><td style="padding:12px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;">
            <tr>${cells}</tr>
          </table>
        </td></tr>`;
      }

      const headRow = block.heading ? `
        <tr>
          <td colspan="${cols}" style="padding:16px 20px 14px;border-bottom:1px solid #f0f2f5;background:#fff;">
            <p style="margin:0 0 3px;font-size:17px;font-weight:800;color:#111827;line-height:1.2;">${esc(block.heading)}</p>
            ${block.subheading ? `<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${esc(block.subheading)}</p>` : ''}
          </td>
        </tr>` : '';

      return `<tr><td style="padding:24px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ecf0;border-radius:12px;overflow:hidden;background:#fff;">
          ${headRow}
          <tr style="vertical-align:top;">${cells}</tr>
        </table>
      </td></tr>`;
    }

    // Spotlight bloğu
    if (isSpotlight(block)) {
      if (block.hidden) return '';
      return spotlightHtml(block, template);
    }

    // Divider bloğu
    if (isDivider(block)) {
      const borderStyle = block.style === 'dashed' ? 'dashed' : block.style === 'thick' ? 'solid' : 'solid';
      const borderWidth = block.style === 'thick' ? 3 : 1;
      const borderColor = block.color || '#e5e7eb';
      if (block.style === 'dots') {
        return `<tr><td style="padding:16px 40px;text-align:center;"><span style="color:${borderColor};font-size:20px;letter-spacing:8px;">···</span></td></tr>`;
      }
      return `<tr><td style="padding:16px 40px;"><div style="border-top:${borderWidth}px ${borderStyle} ${borderColor};"></div></td></tr>`;
    }

    // Quote bloğu
    if (isQuote(block)) {
      if (block.hidden || !block.text.trim()) return '';
      const ac = block.accentColor || '#26496b';
      return `<tr><td style="padding:16px 40px;">
        <div style="border-left:4px solid ${ac};padding:16px 20px;background:${ac}08;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 ${block.author ? '10px' : '0'};font-size:16px;line-height:1.7;color:#1f2937;font-style:italic;">"${esc(block.text)}"</p>
          ${block.author ? `<p style="margin:0;font-size:12px;color:${ac};font-weight:700;">— ${esc(block.author)}</p>` : ''}
        </div>
      </td></tr>`;
    }

    // IconRow bloğu
    if (isIconRow(block)) {
      if (block.hidden || block.items.length === 0) return '';
      const rows = block.items.filter(i => i.heading.trim()).map(item => `
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:36px;">
            <span style="font-size:20px;display:block;text-align:center;">${esc(item.icon)}</span>
          </td>
          <td style="padding:8px 0 8px 12px;vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">${esc(item.heading)}</p>
            ${item.body ? `<p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">${esc(item.body)}</p>` : ''}
          </td>
        </tr>`).join('');
      return `<tr><td style="padding:16px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>`;
    }

    // TwoColumn bloğu
    if (isTwoColumn(block)) {
      return twoColumnHtml(block);
    }

    // Social bloğu
    if (isSocial(block)) {
      if (block.hidden || block.links.length === 0) return '';
      const SOCIAL_LABELS: Record<string, string> = {
        twitter:'X', instagram:'Instagram', linkedin:'LinkedIn', facebook:'Facebook', youtube:'YouTube', web:'Web'
      };
      const buttons = block.links.filter(l => l.url.trim()).map(l =>
        `<a href="${esc(l.url)}" style="display:inline-block;margin:0 4px;padding:8px 16px;background:#f3f4f6;color:#374151;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">${SOCIAL_LABELS[l.platform] ?? l.platform}</a>`
      ).join('');
      if (!buttons) return '';
      return `<tr><td style="padding:16px 40px;text-align:center;">${buttons}</td></tr>`;
    }

    // Bölüm bloğu
    if (isSection(block)) {
      if (block.hidden) return '';
      const m = SECTION_ACCENTS[block.kind as SectionKey];
      if (!m || block.items.length === 0) return '';
      return sectionHtml(m.icon, m.label, block.items, m.cta, m.ctaUrl, m.accent, template, m, block.variant);
    }

    return '';
  }).join('');
}

// ─── Template HTML builders ───────────────────────────────────────────────────

function buildKlasik(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#26496b';
  const logo = 'https://raw.githubusercontent.com/secogiga/haritailesi/main/apps/sahne/public/logo-email.png';
  return wrap(`
    <tr><td style="background:linear-gradient(135deg,#0e1c2f,${tc});padding:8px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;" width="195">
          <a href="https://haritailesi.org" style="display:inline-block;text-decoration:none;">
            <img src="${logo}" alt="Haritailesi" width="178" style="display:block;border:0;height:auto;" />
          </a>
        </td>
        <td style="vertical-align:middle;padding-left:20px;border-left:1px solid rgba(255,255,255,.15);">
          ${canvas.heroImage ? `<img src="${esc(canvas.heroImage)}" alt="" style="width:100%;max-height:140px;object-fit:cover;border-radius:10px;margin-bottom:16px;display:block;">` : ''}
          <h1 style="color:#fff;font-size:28px;font-weight:900;margin:0 0 6px;line-height:1.1;">${ml(month)}</h1>
          <div style="color:#66aca9;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Haritailesi Vakfı E-Bülten</div>
        </td>
      </tr></table>
    </td></tr>
    ${intro ? `<tr><td style="padding:32px 40px 0;"><p style="color:#374151;font-size:15px;line-height:1.8;margin:0;">${esc(intro).replace(/\n/g,'<br>')}</p></td></tr>` : ''}
    ${highlight ? `<tr><td style="padding:24px 40px 0;"><div style="background:${tc}0f;border-left:4px solid ${tc};border-radius:0 10px 10px 0;padding:18px 20px;"><div style="color:${tc};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Öne Çıkan</div><p style="color:#1f2937;font-size:14px;line-height:1.7;margin:0;">${esc(highlight).replace(/\n/g,'<br>')}</p></div></td></tr>` : ''}
    ${ctaHtml(canvas.ctaText, canvas.ctaUrl, tc)}
    ${buildBlocksHtml(canvas, 'klasik')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function buildDergi(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#26496b';
  const { month: mon, year } = mlShort(month);
  return wrap(`
    <tr><td style="padding:20px 40px;border-bottom:2px solid #111827;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:13px;font-weight:900;color:#111827;letter-spacing:3px;text-transform:uppercase;">HAR­İTA­İLESİ</span></td>
        <td style="text-align:right;"><span style="font-size:11px;color:#6b7280;font-weight:500;">${mon.toUpperCase()} ${year}</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0;overflow:hidden;">
      ${canvas.heroImage
        ? `<div style="position:relative;">
            <img src="${esc(canvas.heroImage)}" alt="" style="width:100%;height:280px;object-fit:cover;display:block;">
            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 60%);"></div>
            <div style="position:absolute;bottom:0;left:0;right:0;padding:32px 40px;">
              <h1 style="margin:0 0 6px;font-size:36px;font-weight:900;color:#fff;line-height:1.1;">${esc(title)}</h1>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,.7);">${ml(month)}</p>
            </div>
           </div>`
        : `<div style="background:linear-gradient(135deg,#0e1c2f 0%,${tc} 50%,#66aca9 100%);padding:56px 40px 48px;">
            <div style="max-width:440px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#66aca9;text-transform:uppercase;letter-spacing:3px;">${ml(month)}</p>
              <h1 style="margin:0 0 16px;font-size:38px;font-weight:900;color:#fff;line-height:1.1;">${esc(title)}</h1>
              ${intro ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(255,255,255,.75);">${esc(intro).replace(/\n/g,'<br>')}</p>` : ''}
              ${canvas.ctaText ? `<a href="${esc(canvas.ctaUrl||SAHNE_URL)}" style="display:inline-block;background:${tc};color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">${esc(canvas.ctaText)}</a>` : ''}
            </div>
           </div>`
      }
    </td></tr>
    ${canvas.heroImage && intro ? `<tr><td style="padding:32px 40px 0;"><p style="margin:0;font-size:16px;line-height:1.8;color:#374151;font-style:italic;">${esc(intro).replace(/\n/g,'<br>')}</p></td></tr>` : ''}
    ${highlight ? `<tr><td style="padding:28px 40px 0;"><div style="background:#fff9f0;border:1px solid #fde68a;border-radius:10px;padding:20px 24px;"><div style="font-size:10px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">✦ Öne Çıkan</div><p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;">${esc(highlight).replace(/\n/g,'<br>')}</p></div></td></tr>` : ''}
    ${canvas.heroImage ? ctaHtml(canvas.ctaText, canvas.ctaUrl) : ''}
    ${buildBlocksHtml(canvas, 'dergi')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function buildModern(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#26496b';
  const { month: mon, year } = mlShort(month);
  return wrap(`
    <tr><td style="background:#f8fafc;padding:20px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" style="display:inline-table;">
            <tr>
              <td style="vertical-align:middle;padding-right:8px;">
                <div style="width:28px;height:28px;background:${tc};border-radius:8px;"></div>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:12px;font-weight:900;color:${tc};letter-spacing:2px;text-transform:uppercase;">Haritailesi</span>
              </td>
            </tr>
          </table>
        </td>
        <td style="text-align:right;vertical-align:middle;"><span style="font-size:11px;color:#9ca3af;">${mon} ${year}</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:linear-gradient(135deg,#e8f0f7,#f0f9f8);padding:40px 40px 36px;">
      ${canvas.heroImage ? `<img src="${esc(canvas.heroImage)}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;margin-bottom:20px;display:block;">` : ''}
      <div style="font-size:11px;font-weight:700;color:${tc};text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">${ml(month)}</div>
      <h1 style="margin:0 0 14px;font-size:28px;font-weight:900;color:#111827;line-height:1.15;">${esc(title)}</h1>
      ${intro ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#6b7280;">${esc(intro).replace(/\n/g,'<br>')}</p>` : ''}
      ${canvas.ctaText ? `<a href="${esc(canvas.ctaUrl||SAHNE_URL)}" style="display:inline-block;background:${tc};color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:30px;text-decoration:none;">${esc(canvas.ctaText)} →</a>` : ''}
    </td></tr>
    ${highlight ? `<tr><td style="padding:24px 40px 0;"><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;"><div style="font-size:10px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">★ Öne Çıkan</div><p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;">${esc(highlight).replace(/\n/g,'<br>')}</p></div></td></tr>` : ''}
    ${buildBlocksHtml(canvas, 'modern')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function buildKompakt(opts: HtmlOpts): string {
  const { title, month, intro, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#26496b';
  return wrap(`
    <tr><td style="background:${tc};padding:16px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:10px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:2px;">Haritailesi</span></td>
        <td style="text-align:center;"><span style="font-size:16px;font-weight:900;color:#fff;">${ml(month)}</span></td>
        <td style="text-align:right;"><span style="font-size:10px;color:rgba(255,255,255,.5);">${esc(title)}</span></td>
      </tr></table>
    </td></tr>
    ${intro ? `<tr><td style="padding:16px 40px;border-bottom:1px solid #f3f4f6;"><p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${esc(intro).replace(/\n/g,'<br>')}</p></td></tr>` : ''}
    ${buildBlocksHtml(canvas, 'kompakt')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function wrap(inner: string, month: string, preview = false, opts?: { fontFamily?: string; footerText?: string }): string {
  const unsubLink = preview ? '#' : '{{unsubscribe}}';
  const unsubLabel = preview ? 'abonelikten çıkabilirsiniz (önizleme)' : 'abonelikten çıkabilirsiniz';
  const font = opts?.fontFamily || "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
  const footerLine = opts?.footerText
    ? `<p style="color:#9ca3af;font-size:12px;margin:0 0 6px;">${esc(opts.footerText)}</p>`
    : `<p style="color:#9ca3af;font-size:12px;margin:0 0 6px;">Haritailesi Vakfı · <a href="${SAHNE_URL}" style="color:#9ca3af;">haritailesi.org</a></p>`;
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ml(month)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:${font};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:24px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1);">
        ${inner}
        <tr><td style="padding:0 40px 32px;"></td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #f0f2f5;text-align:center;">
          ${footerLine}
          <p style="color:#d1d5db;font-size:11px;margin:0;">Bu bülteni almak istemiyorsanız <a href="${unsubLink}" style="color:#9ca3af;text-decoration:underline;">${unsubLabel}</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─── Yeni Şablonlar ──────────────────────────────────────────────────────────

function buildDuyuru(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#7c3aed';
  return wrap(`
    <tr><td style="background:${tc};padding:40px 40px 36px;text-align:center;">
      <div style="font-size:10px;font-weight:800;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;">📢 DUYURU · ${ml(month)}</div>
      ${canvas.heroImage ? `<img src="${esc(canvas.heroImage)}" alt="" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:24px;display:block;">` : ''}
      <h1 style="margin:0 0 16px;font-size:32px;font-weight:900;color:#fff;line-height:1.1;">${esc(title)}</h1>
      ${intro ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:rgba(255,255,255,.85);">${esc(intro).replace(/\n/g,'<br>')}</p>` : ''}
      ${canvas.ctaText ? `<a href="${esc(canvas.ctaUrl||SAHNE_URL)}" style="display:inline-block;background:#fff;color:${tc};font-size:14px;font-weight:800;padding:14px 36px;border-radius:100px;text-decoration:none;">${esc(canvas.ctaText)}</a>` : ''}
    </td></tr>
    ${highlight ? `<tr><td style="padding:24px 40px 0;"><div style="background:${tc}0f;border:1px solid ${tc}30;border-radius:12px;padding:20px 24px;text-align:center;"><p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;font-style:italic;">"${esc(highlight).replace(/\n/g,'<br>')}"</p></div></td></tr>` : ''}
    ${buildBlocksHtml(canvas, 'modern')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function buildMinimal(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#111827';
  return wrap(`
    <tr><td style="padding:40px 40px 32px;border-bottom:2px solid #111827;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:11px;font-weight:900;color:#111827;letter-spacing:4px;text-transform:uppercase;">Haritailesi</span></td>
        <td style="text-align:right;"><span style="font-size:11px;color:#9ca3af;font-weight:400;">${ml(month)}</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:40px 40px 0;">
      <h1 style="margin:0 0 20px;font-size:34px;font-weight:900;color:#111827;line-height:1.1;letter-spacing:-0.5px;">${esc(title)}</h1>
      ${intro ? `<p style="margin:0;font-size:16px;line-height:1.9;color:#374151;">${esc(intro).replace(/\n/g,'<br>')}</p>` : ''}
    </td></tr>
    ${highlight ? `<tr><td style="padding:32px 40px 0;"><p style="margin:0;font-size:14px;line-height:1.8;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:24px;">${esc(highlight).replace(/\n/g,'<br>')}</p></td></tr>` : ''}
    ${canvas.ctaText ? `<tr><td style="padding:24px 40px 0;"><a href="${esc(canvas.ctaUrl||SAHNE_URL)}" style="display:inline-block;color:${tc};font-size:14px;font-weight:700;text-decoration:none;border-bottom:2px solid ${tc};padding-bottom:2px;">${esc(canvas.ctaText)} →</a></td></tr>` : ''}
    ${buildBlocksHtml(canvas, 'klasik')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function buildFotograf(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#26496b';
  const heroImg = canvas.heroImage
    ? `<div style="position:relative;">
        <img src="${esc(canvas.heroImage)}" alt="" style="width:100%;height:320px;object-fit:cover;display:block;">
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,rgba(0,0,0,.2) 60%,transparent 100%);"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:40px;">
          <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:3px;margin-bottom:10px;">${ml(month)}</div>
          <h1 style="margin:0 0 14px;font-size:34px;font-weight:900;color:#fff;line-height:1.1;">${esc(title)}</h1>
          ${canvas.ctaText ? `<a href="${esc(canvas.ctaUrl||SAHNE_URL)}" style="display:inline-block;background:${tc};color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:100px;text-decoration:none;">${esc(canvas.ctaText)}</a>` : ''}
        </div>
       </div>`
    : `<div style="background:linear-gradient(135deg,#0e1c2f,${tc});padding:60px 40px;">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;">${ml(month)}</div>
        <h1 style="margin:0 0 20px;font-size:36px;font-weight:900;color:#fff;line-height:1.1;">${esc(title)}</h1>
        ${canvas.ctaText ? `<a href="${esc(canvas.ctaUrl||SAHNE_URL)}" style="display:inline-block;background:#fff;color:${tc};font-size:13px;font-weight:800;padding:12px 28px;border-radius:100px;text-decoration:none;">${esc(canvas.ctaText)}</a>` : ''}
       </div>`;
  return wrap(`
    <tr><td style="padding:0;overflow:hidden;">${heroImg}</td></tr>
    ${intro ? `<tr><td style="padding:32px 40px 0;"><p style="margin:0;font-size:15px;line-height:1.8;color:#374151;">${esc(intro).replace(/\n/g,'<br>')}</p></td></tr>` : ''}
    ${highlight ? `<tr><td style="padding:24px 40px 0;"><div style="background:${tc}0f;border-left:4px solid ${tc};border-radius:0 10px 10px 0;padding:18px 20px;"><p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;">${esc(highlight).replace(/\n/g,'<br>')}</p></div></td></tr>` : ''}
    ${buildBlocksHtml(canvas, 'modern')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function buildKariyer(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#0e1c2f';
  return wrap(`
    <tr><td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="64" style="background:${tc};padding:32px 12px;text-align:center;vertical-align:top;">
          <div style="font-size:22px;margin-bottom:20px;">💼</div>
          <div style="font-size:20px;margin-bottom:16px;">📊</div>
          <div style="font-size:20px;margin-bottom:16px;">⭐</div>
          <div style="font-size:20px;margin-bottom:16px;">🎓</div>
        </td>
        <td style="padding:32px 32px 32px 28px;vertical-align:top;border-top:4px solid ${tc};">
          <div style="font-size:10px;font-weight:800;color:${tc};text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;">Kariyer Bülteni · ${ml(month)}</div>
          ${canvas.heroImage ? `<img src="${esc(canvas.heroImage)}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px;margin-bottom:20px;display:block;">` : ''}
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#111827;line-height:1.2;">${esc(title)}</h1>
          ${intro ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#4b5563;">${esc(intro).replace(/\n/g,'<br>')}</p>` : ''}
          ${canvas.ctaText ? `<a href="${esc(canvas.ctaUrl||SAHNE_URL)}" style="display:inline-block;background:${tc};color:#fff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">${esc(canvas.ctaText)} →</a>` : ''}
        </td>
      </tr></table>
    </td></tr>
    ${highlight ? `<tr><td style="padding:24px 40px 0;"><div style="background:#f0f4f8;border-radius:10px;padding:16px 20px;"><div style="font-size:10px;font-weight:800;color:${tc};text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Kariyer İpucu</div><p style="margin:0;font-size:13px;line-height:1.7;color:#374151;">${esc(highlight).replace(/\n/g,'<br>')}</p></div></td></tr>` : ''}
    ${buildBlocksHtml(canvas, 'kompakt')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function buildSezonluk(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#f59e0b';
  const gradient = `linear-gradient(135deg,${tc},#ef4444)`;
  return wrap(`
    <tr><td style="background:${gradient};padding:40px 40px 36px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">☀</div>
      <div style="font-size:10px;font-weight:800;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:3px;margin-bottom:10px;">${ml(month)}</div>
      ${canvas.heroImage ? `<img src="${esc(canvas.heroImage)}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;margin-bottom:20px;display:block;">` : ''}
      <h1 style="margin:0 0 16px;font-size:30px;font-weight:900;color:#fff;line-height:1.1;">${esc(title)}</h1>
      ${intro ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:rgba(255,255,255,.9);">${esc(intro).replace(/\n/g,'<br>')}</p>` : ''}
      ${canvas.ctaText ? `<a href="${esc(canvas.ctaUrl||SAHNE_URL)}" style="display:inline-block;background:#fff;color:${tc};font-size:14px;font-weight:800;padding:14px 36px;border-radius:100px;text-decoration:none;">${esc(canvas.ctaText)}</a>` : ''}
    </td></tr>
    ${highlight ? `<tr><td style="padding:24px 40px 0;"><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:18px 20px;"><div style="font-size:10px;font-weight:800;color:#d97706;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">⭐ Mevsim Haberleri</div><p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;">${esc(highlight).replace(/\n/g,'<br>')}</p></div></td></tr>` : ''}
    ${buildBlocksHtml(canvas, 'modern')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function buildIstatistik(opts: HtmlOpts): string {
  const { title, month, intro, highlight, canvas, preview } = opts;
  const tc = opts.themeColor || canvas.themeColor || '#0e1c2f';
  return wrap(`
    <tr><td style="background:${tc};padding:32px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-size:10px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:3px;">Aylık Rapor</span>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:900;color:#fff;line-height:1.2;">${esc(title)}</h1>
          <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px;">${ml(month)}</div>
        </td>
      </tr></table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid rgba(255,255,255,.1);padding-top:20px;"><tr>
        <td style="text-align:center;padding:0 10px;border-right:1px solid rgba(255,255,255,.1);">
          <div style="font-size:28px;font-weight:900;color:#fff;">—</div>
          <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Etkinlik</div>
        </td>
        <td style="text-align:center;padding:0 10px;border-right:1px solid rgba(255,255,255,.1);">
          <div style="font-size:28px;font-weight:900;color:#fff;">—</div>
          <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Üye</div>
        </td>
        <td style="text-align:center;padding:0 10px;">
          <div style="font-size:28px;font-weight:900;color:#66aca9;">—</div>
          <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Proje</div>
        </td>
      </tr></table>
    </td></tr>
    ${intro ? `<tr><td style="padding:32px 40px 0;"><p style="margin:0;font-size:15px;line-height:1.8;color:#374151;">${esc(intro).replace(/\n/g,'<br>')}</p></td></tr>` : ''}
    ${highlight ? `<tr><td style="padding:24px 40px 0;"><div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;"><div style="font-size:10px;font-weight:800;color:${tc};text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">📊 Öne Çıkan Veri</div><p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;">${esc(highlight).replace(/\n/g,'<br>')}</p></div></td></tr>` : ''}
    ${canvas.ctaText ? ctaHtml(canvas.ctaText, canvas.ctaUrl, tc) : ''}
    ${buildBlocksHtml(canvas, 'klasik')}
  `, month, preview, { ...(canvas.fontFamily ? { fontFamily: canvas.fontFamily } : {}), ...(canvas.footerText ? { footerText: canvas.footerText } : {}) });
}

function injectUtm(html: string, month: string): string {
  const campaign = month.replace('-', '_');
  return html.replace(/href="(https?:\/\/[^"{}]*haritailesi[^"]*)"/g, (match, url: string) => {
    try {
      const u = new URL(url);
      if (u.searchParams.has('utm_source')) return match;
      u.searchParams.set('utm_source', 'bulten');
      u.searchParams.set('utm_medium', 'email');
      u.searchParams.set('utm_campaign', campaign);
      return `href="${u.toString()}"`;
    } catch { return match; }
  });
}

export function buildHtml(opts: HtmlOpts): string {
  let html: string;
  switch (opts.template) {
    case 'dergi':      html = buildDergi(opts); break;
    case 'modern':     html = buildModern(opts); break;
    case 'kompakt':    html = buildKompakt(opts); break;
    case 'duyuru':     html = buildDuyuru(opts); break;
    case 'minimal':    html = buildMinimal(opts); break;
    case 'fotograf':   html = buildFotograf(opts); break;
    case 'kariyer':    html = buildKariyer(opts); break;
    case 'sezonluk':   html = buildSezonluk(opts); break;
    case 'istatistik': html = buildIstatistik(opts); break;
    default:           html = buildKlasik(opts);
  }
  return opts.preview ? html : injectUtm(html, opts.month);
}
