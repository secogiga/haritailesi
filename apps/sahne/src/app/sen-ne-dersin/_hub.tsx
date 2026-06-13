'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import type { Filter } from './_constants';
import { FILTER_ITEMS_VIEW, FILTER_ITEMS_TYPE } from './_constants';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface HistoryEntry {
  responseId: string;
  surveyId: string;
  slug: string | null;
  title: string;
  type: string;
  percent: number | null;
  passed: boolean | null;
  timeTaken: number | null;
  completedAt: string;
  showResults: boolean;
}

interface SurveyResultStats {
  avgPercent?: number; passRate?: number;
  topAnswer?: string; topAnswerPct?: number; topAnswerCount?: number;
  totalResponses?: number;
}

interface SurveyItem {
  kind: 'anket' | 'test';
  id: string; slug: string | null; title: string; description: string | null;
  status: string; responseCount: number; viewCount: number;
  endsAt: string | null; coverImageUrl: string | null;
  timeLimit?: number | null; passingScore?: number | null;
  createdAt?: string | null;
  resultStats?: SurveyResultStats | null;
}

interface CompetitionItem {
  kind: 'yarışma';
  id: string; slug: string; title: string; description: string | null;
  status: string; applicationCount: string | number; viewCount: number;
  deadline: string | null; prizes: string | null; category: string | null;
  createdAt?: string | null;
}

type Item = SurveyItem | CompetitionItem;

// ── Example data ───────────────────────────────────────────────────────────────

const EXAMPLE: Item[] = [
  {
    kind: 'anket', id: 'x1', slug: 'meslegin-gelecegi-2026',
    title: 'Mesleğin Geleceği Araştırması 2026',
    description: 'Harita ve kadastro mesleğinin önümüzdeki 10 yılına dair görüşlerini paylaş. Teknoloji dönüşümü, istihdam ve eğitim ekseninde 12 soru.',
    status: 'active', responseCount: 412, viewCount: 1820,
    endsAt: new Date(Date.now() + 3 * 86400000).toISOString(), coverImageUrl: null,
  },
  {
    kind: 'test', id: 'x2', slug: 'cbs-yeterlilik-testi-2026',
    title: 'CBS Yeterlilik Testi 2026',
    description: '20 soruluk CBS yeterlilik testi. Temel kavramlar, veri modelleri ve analiz yöntemleri dahil.',
    status: 'active', responseCount: 128, viewCount: 567,
    endsAt: null, coverImageUrl: null, timeLimit: 25, passingScore: 70,
  },
  {
    kind: 'yarışma', id: 'x3', slug: 'yilin-projesi-2026',
    title: 'Yılın Projesi 2026',
    description: 'En iyi CBS/geomatik projenle yarış. Jüri değerlendirmesi ve topluluk oylamasıyla kazananlar belirleniyor.',
    status: 'active', applicationCount: 37, viewCount: 2100,
    deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
    prizes: '1. Ödül: 10.000₺ · 2. Ödül: 5.000₺ · 3. Ödül: 2.500₺',
    category: 'proje',
  },
  {
    kind: 'anket', id: 'x4', slug: 'uzaktan-calisma-anketi',
    title: 'Sektörde Uzaktan Çalışma Anketi',
    description: 'Uzaktan ve hibrit çalışma modellerinin sektörünüze etkisini araştırıyoruz.',
    status: 'active', responseCount: 89, viewCount: 342,
    endsAt: new Date(Date.now() + 9 * 86400000).toISOString(), coverImageUrl: null,
  },
  {
    kind: 'test', id: 'x5', slug: 'drone-fotogrametri-testi',
    title: 'Drone ve Fotogrametri Testi',
    description: 'İHA tabanlı fotogrametri, nokta bulutu işleme ve ortofoto üretimi konularındaki bilgi seviyeni ölç.',
    status: 'active', responseCount: 67, viewCount: 289,
    endsAt: null, coverImageUrl: null, timeLimit: 20, passingScore: 65,
  },
  {
    kind: 'yarışma', id: 'x6', slug: 'genc-haritaci-makale-2026',
    title: 'Genç Haritacı CBS Makale Yarışması',
    description: 'CBS ve geomatik alanında özgün araştırma makalesiyle yarış. Lisans ve lisansüstü öğrencilere açık.',
    status: 'active', applicationCount: 24, viewCount: 890,
    deadline: new Date(Date.now() + 35 * 86400000).toISOString(),
    prizes: '1. Ödül: 5.000₺ + Yayın Desteği',
    category: 'makale',
  },
  {
    kind: 'anket', id: 'x7', slug: 'cbs-yazilim-kullanim-2025',
    title: 'CBS Yazılım Kullanım Anketi 2025',
    description: 'Sektörde hangi CBS yazılımlarının kullanıldığını ve kullanıcı memnuniyetini araştırdık. 1.240 kişi katıldı.',
    status: 'ended', responseCount: 1240, viewCount: 4500,
    endsAt: new Date(Date.now() - 5 * 86400000).toISOString(), coverImageUrl: null,
  },
  {
    kind: 'test', id: 'x8', slug: 'temel-gis-bilgi-testi-2025',
    title: 'Temel GIS Bilgi Testi 2025',
    description: 'Coğrafi Bilgi Sistemleri temel kavramları. 892 kişi tamamladı, topluluk ortalaması: 72/100.',
    status: 'ended', responseCount: 892, viewCount: 3100,
    endsAt: new Date(Date.now() - 12 * 86400000).toISOString(), coverImageUrl: null,
    timeLimit: 20, passingScore: 60,
  },
  {
    kind: 'yarışma', id: 'x9', slug: 'harita-gunu-fotograf-2025',
    title: 'Harita Günü Fotoğraf Yarışması 2025',
    description: 'Mesleğinizi en iyi anlatan fotoğraf yarışması. 156 başvuru arasından kazananlar belirlendi.',
    status: 'ended', applicationCount: 156, viewCount: 5600,
    deadline: new Date(Date.now() - 30 * 86400000).toISOString(),
    prizes: '1. Ödül: 3.000₺ · 2. Ödül: 1.500₺',
    category: 'foto',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysLeft(date: string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function countNum(item: Item): number {
  return item.kind === 'yarışma'
    ? Number(item.applicationCount)
    : item.responseCount;
}

function itemCreatedAt(item: Item): number {
  const d = item.kind === 'yarışma'
    ? (item as CompetitionItem).createdAt
    : (item as SurveyItem).createdAt;
  return d ? new Date(d).getTime() : 0;
}

function itemHref(item: Item): string {
  if (item.kind === 'yarışma') return `/yarismalar/${item.slug}`;
  const s = item as SurveyItem;
  return `/sen-ne-dersin/${s.slug ?? s.id}`;
}

function getFilterUrl(f: Filter): string {
  const cleanPaths: Partial<Record<Filter, string>> = {
    tumu: '/sen-ne-dersin',
    anketler: '/sen-ne-dersin/anketler',
    testler: '/sen-ne-dersin/testler',
    yarismalar: '/sen-ne-dersin/yarismalar',
  };
  return cleanPaths[f] ?? `/sen-ne-dersin?filter=${f}`;
}

// ── Type configuration ─────────────────────────────────────────────────────────

const KINDS = {
  anket: {
    label: 'ANKET',
    border: 'border-t-sky-500',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    dot: 'bg-sky-500',
    cta: 'bg-sky-600 hover:bg-sky-500 text-white',
    ctaOutline: 'border-sky-200 text-sky-700 hover:bg-sky-50',
    ctaText: 'Katıl',
    ctaEndedText: 'Sonuçları Gör',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
      </svg>
    ),
  },
  test: {
    label: 'TEST',
    border: 'border-t-violet-500',
    badge: 'bg-violet-50 text-violet-700 border border-violet-200',
    dot: 'bg-violet-500',
    cta: 'bg-violet-600 hover:bg-violet-500 text-white',
    ctaOutline: 'border-violet-200 text-violet-700 hover:bg-violet-50',
    ctaText: 'Teste Başla',
    ctaEndedText: 'Sonuçları Gör',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  yarışma: {
    label: 'YARIŞMA',
    border: 'border-t-amber-500',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    cta: 'bg-amber-500 hover:bg-amber-400 text-white',
    ctaOutline: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    ctaText: 'Başvur',
    ctaEndedText: 'Sonuçları Gör',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
} as const;

// ── Sub-components ─────────────────────────────────────────────────────────────

function DeadlinePill({ date, active }: { date: string | null; active: boolean }) {
  const days = daysLeft(date);
  if (days === null || !active || days < 0) return null;
  if (days === 0)
    return <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Bugün bitiyor!</span>;
  if (days <= 3)
    return <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{days} gün kaldı</span>;
  if (days <= 7)
    return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">{days} gün kaldı</span>;
  return <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{days} gün kaldı</span>;
}

function ContentCard({ item, completed }: { item: Item; completed?: boolean }) {
  const cfg = KINDS[item.kind];
  const isActive = item.status === 'active';
  const deadline = item.kind === 'yarışma'
    ? (item as CompetitionItem).deadline
    : (item as SurveyItem).endsAt;

  const participantCount = countNum(item);
  const participantLabel = item.kind === 'yarışma' ? 'başvuru' : 'katılım';
  const competition = item.kind === 'yarışma' ? item as CompetitionItem : null;
  const survey = item.kind !== 'yarışma' ? item as SurveyItem : null;
  const completedLabel = item.kind === 'yarışma' ? 'Başvurdum' : item.kind === 'test' ? 'Çözdüm' : 'Katıldım';

  return (
    <Link
      href={itemHref(item)}
      className={`group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden border-t-4 ${cfg.border}`}
    >
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.badge}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          {isActive ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} opacity-80 animate-pulse`} />
              Aktif
            </span>
          ) : (
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Sona Erdi</span>
          )}
          <DeadlinePill date={deadline} active={isActive} />
        </div>
        {/* Title + description */}
        <div className="flex-1 space-y-1.5">
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-[#26496b] transition-colors duration-200 line-clamp-2">
            {item.title}
          </h3>
          <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed h-[42px] overflow-hidden">
            {item.description}
          </p>
        </div>
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3">
          {participantCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-gray-700">{participantCount.toLocaleString('tr-TR')}</span>
              <span>{participantLabel}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              İlk katılan ol!
            </span>
          )}
          {survey?.timeLimit && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {survey.timeLimit} dk
            </span>
          )}
          {survey?.passingScore && (
            <span className="inline-flex items-center gap-1 text-xs text-violet-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              {survey.passingScore}% geçme notu
            </span>
          )}
          {competition?.prizes && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {competition.prizes.split('·')[0]?.trim()}
            </span>
          )}
        </div>
        {/* Result stats — sadece ended kartlarda */}
        {!isActive && survey && survey.resultStats && (
          <div className="flex flex-wrap gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            {survey.kind === 'test' && survey.resultStats.avgPercent != null && (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                  <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-gray-500">Ortalama</span>
                  <span className="font-bold text-gray-800">{survey.resultStats.avgPercent}/100</span>
                </span>
                {survey.resultStats.passRate != null && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span className="text-gray-500">Geçme oranı</span>
                    <span className="font-bold text-emerald-700">%{survey.resultStats.passRate}</span>
                  </span>
                )}
              </>
            )}
            {survey.kind === 'anket' && survey.resultStats.topAnswer && (
              <span className="inline-flex items-start gap-1.5 text-xs text-gray-700 min-w-0">
                <svg className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
                </svg>
                <span className="min-w-0">
                  <span className="text-gray-500">En çok: </span>
                  <span className="font-semibold text-gray-800 truncate">"{survey.resultStats.topAnswer}"</span>
                  {survey.resultStats.topAnswerPct != null && (
                    <span className="ml-1 text-sky-600 font-bold">%{survey.resultStats.topAnswerPct}</span>
                  )}
                </span>
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-2">
            {completed && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                {completedLabel}
              </span>
            )}
            {item.kind !== 'yarışma' && (
              <span className="text-[10px] text-gray-400">{(item.viewCount ?? 0).toLocaleString('tr-TR')} görüntüleme</span>
            )}
          </div>
          {isActive ? (
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-xl transition-all duration-200 shadow-sm group-hover:shadow ${cfg.cta}`}>
              {completed ? 'Tekrar' : cfg.ctaText}
              <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition-all duration-200 ${cfg.ctaOutline}`}>
              {cfg.ctaEndedText}
              <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-start sm:items-center justify-between mb-5 gap-3">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {badge}
    </div>
  );
}


// ── Hub component ──────────────────────────────────────────────────────────────

export default function SenNeDersinHub({ initialFilter = 'tumu' }: { initialFilter?: Filter }) {
  const router = useRouter();
  const { user } = useSahneAuth();
  const [items, setItems] = useState<Item[]>(EXAMPLE);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [typeTab, setTypeTab] = useState<'aktif' | 'bitmis'>('aktif');
  const [endedKind, setEndedKind] = useState<'tumu' | 'anket' | 'test' | 'yarışma'>('tumu');

  useEffect(() => {
    try {
      const ids = new Set<string>();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('snd_') || key?.startsWith('snd_comp_')) {
          ids.add(key.replace(/^snd_(comp_)?/, ''));
        }
      }
      setCompletedIds(ids);
    } catch {}
  }, []);

  useEffect(() => {
    if (filter === 'gecmisim' && user && history.length === 0 && !historyLoading) {
      setHistoryLoading(true);
      fetch(`${API}/api/v1/surveys/me/history`, { credentials: 'include' })
        .then(r => r.ok ? r.json() as Promise<HistoryEntry[]> : [])
        .then(setHistory)
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
  }, [filter, user]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/v1/users/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<{ profile?: { sndSubscribed?: boolean } }> : null)
      .then(data => { if (data?.profile?.sndSubscribed) setSubscribed(true); })
      .catch(() => {});
  }, [user]);

  async function toggleSubscribe() {
    if (!user || subLoading) return;
    setSubLoading(true);
    const next = !subscribed;
    try {
      const res = await fetch(`${API}/api/v1/users/me/snd-subscribe`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribed: next }),
      });
      if (res.ok) setSubscribed(next);
    } catch {} finally {
      setSubLoading(false);
    }
  }

  const TYPE_FILTERS = new Set<Filter>(['anketler', 'testler', 'yarismalar']);

  function handleFilterChange(f: Filter) {
    setFilter(f);
    setTypeTab('aktif');
    setEndedKind('tumu');
    router.push(getFilterUrl(f), { scroll: false });
  }

  function handleEndedKindChange(k: typeof endedKind) {
    setEndedKind(k);
    if (typeTab === 'aktif') setTypeTab('bitmis');
  }

  useEffect(() => {
    (async () => {
      try {
        const [hub, comps] = await Promise.all([
          fetch(`${API}/api/v1/surveys/hub`).then(r => r.ok ? r.json() : null),
          fetch(`${API}/api/v1/competitions`).then(r => r.ok ? r.json() : null),
        ]);
        const merged: Item[] = [];
        if (hub && !hub._error) {
          for (const s of (hub.anketler ?? [])) merged.push({ status: 'active', ...s, kind: 'anket', resultStats: s.resultStats ?? null });
          for (const s of (hub.testler ?? [])) merged.push({ status: 'active', ...s, kind: 'test', resultStats: s.resultStats ?? null });
        }
        if (Array.isArray(comps)) {
          for (const c of comps) {
            if (c.status === 'active' || c.status === 'ended') {
              merged.push({ ...c, kind: 'yarışma' });
            }
          }
        }
        if (merged.length > 0) setItems(merged);
      } catch { /* keep example data */ }
    })();
  }, []);

  const KIND_ORDER: Record<string, number> = { yarışma: 0, anket: 1, test: 2 };

  const activeItems = useMemo(() => {
    let list = items.filter(i => i.status === 'active');
    if (filter === 'anketler') list = list.filter(i => i.kind === 'anket');
    else if (filter === 'testler') list = list.filter(i => i.kind === 'test');
    else if (filter === 'yarismalar') list = list.filter(i => i.kind === 'yarışma');
    else if (filter === 'sonuclananlar') return [];
    else if (filter === 'populerler') return [...list].sort((a, b) => countNum(b) - countNum(a));
    else if (filter === 'en_yeni') return [...list].sort((a, b) => itemCreatedAt(b) - itemCreatedAt(a));
    else list = [...list].sort((a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9));
    return list;
  }, [items, filter]);

  const endedItems = useMemo(() => {
    let list = items.filter(i => i.status === 'ended');
    if (filter === 'anketler') list = list.filter(i => i.kind === 'anket');
    else if (filter === 'testler') list = list.filter(i => i.kind === 'test');
    else if (filter === 'yarismalar') list = list.filter(i => i.kind === 'yarışma');
    else if (filter === 'en_yeni') return [...list].sort((a, b) => itemCreatedAt(b) - itemCreatedAt(a));
    else if (filter === 'populerler') return [...list].sort((a, b) => countNum(b) - countNum(a));
    return list;
  }, [items, filter]);

  const stats = useMemo(() => {
    const anket = items.filter(i => i.kind === 'anket').length;
    const test = items.filter(i => i.kind === 'test').length;
    const yarısma = items.filter(i => i.kind === 'yarışma').length;
    const katilim = items.reduce((s, i) => s + countNum(i), 0);
    return { anket, test, yarısma, katilim };
  }, [items]);

  const isTypeFilter = TYPE_FILTERS.has(filter);
  const isTabFilter = isTypeFilter || filter === 'tumu' || filter === 'en_yeni' || filter === 'populerler';
  const showEndedSection = !isTabFilter && filter !== 'sonuclananlar' && endedItems.length > 0;

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0c1a2e]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-sky-500/[0.07] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/[0.07] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#1e3a5f]/40 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-[22px]">
          <div className="flex justify-center mb-7">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Söz Sende: Mesleğin Sesi
            </span>
          </div>
          <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-none">
            Sen Ne Dersin?
          </h1>
          <p className="text-center text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-[38px] leading-relaxed">
            Anketlere katıl, testlerle kendini değerlendir,{' '}
            yarışmalarda yer al ve mesleğin geleceğine yön ver.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { n: stats.anket, label: 'Toplam Anket', color: 'text-sky-400', bg: 'bg-sky-500/10', filter: 'anketler' as Filter },
              { n: stats.test, label: 'Toplam Test', color: 'text-violet-400', bg: 'bg-violet-500/10', filter: 'testler' as Filter },
              { n: stats.yarısma, label: 'Yarışma', color: 'text-amber-400', bg: 'bg-amber-500/10', filter: 'yarismalar' as Filter },
              { n: stats.katilim, label: 'Toplam Katılım', color: 'text-emerald-400', bg: 'bg-emerald-500/10', filter: null },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => s.filter && handleFilterChange(s.filter)}
                className={`text-center ${s.bg} backdrop-blur-sm border border-white/[0.08] rounded-2xl py-5 px-3 transition-transform duration-150 ${s.filter ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`text-2xl sm:text-3xl font-black ${s.color} mb-1`}>
                  {s.n.toLocaleString('tr-TR')}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sektör Raporu + Şirketler şeridi ── */}
      <div className="bg-[#0D1B31] py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/sen-ne-dersin/sektor-raporu"
              className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Sektör Raporu {new Date().getFullYear()}</p>
                <p className="text-gray-400 text-xs mt-0.5">Tüm katılımların yıllık özeti</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/sirket-testi"
              className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Şirketler İçin</p>
                <p className="text-gray-400 text-xs mt-0.5">Toplu değerlendirme ve aday takibi</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-xl px-1 py-1 flex-shrink-0 mr-2">
              {[
                { key: 'tumu' as Filter, label: 'Tümü' },
                { key: 'en_yeni' as Filter, label: 'En Yeni' },
                { key: 'populerler' as Filter, label: 'En Popüler' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange(key)}
                  className={`flex-shrink-0 text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-150 ${
                    filter === key ? 'bg-[#0c1a2e] text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {FILTER_ITEMS_TYPE.filter(f => !f.authOnly || !!user).map(({ key, label, authOnly }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 ${
                  filter === key
                    ? 'bg-[#0c1a2e] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${authOnly ? 'border border-dashed border-gray-200' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Subscribe strip (filter bar altında, ince) ── */}
      {user && filter === 'tumu' && !subscribed && (
        <div className="bg-[#0c1a2e]/[0.03] border-b border-[#0c1a2e]/[0.06]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2.5 gap-3">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Yeni anket ve testlerden haberdar olmak ister misin?
              </p>
              <button
                onClick={() => void toggleSubscribe()}
                disabled={subLoading}
                className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold bg-[#26496b] text-white hover:bg-[#1e3a56] transition-colors disabled:opacity-50"
              >
                {subLoading ? '…' : 'Abone Ol'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

          {/* Yarışmalar — Başvurularım */}
          {filter === 'yarismalar' && user && (
            <Link href="/yarismalar/basvurularim"
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-violet-100 shadow-sm hover:border-violet-300 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm group-hover:text-violet-700 transition-colors">Başvurularım</p>
                <p className="text-xs text-gray-400 mt-0.5">Katıldığın yarışmaların durumunu takip et</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* ── Tab bar (Tümü + Anketler / Testler / Yarışmalar) ── */}
          {isTabFilter && filter !== 'gecmisim' && (activeItems.length > 0 || endedItems.length > 0) && (
            <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 w-fit">
              <button
                onClick={() => { setTypeTab('aktif'); setEndedKind('tumu'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  typeTab === 'aktif'
                    ? 'bg-[#0c1a2e] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${typeTab === 'aktif' ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                {filter === 'tumu' ? 'Devam Edenler' : 'Aktif'}
                {activeItems.length > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${typeTab === 'aktif' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                    {activeItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTypeTab('bitmis')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  typeTab === 'bitmis'
                    ? 'bg-[#0c1a2e] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Sona Erenler
                {endedItems.length > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${typeTab === 'bitmis' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                    {endedItems.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ── Aktif içerikler ── */}
          {activeItems.length > 0 && filter !== 'gecmisim' && (!isTabFilter || typeTab === 'aktif') && (
            <section>
              <SectionHeader
                title={filter === 'populerler' ? 'Popüler Katılımlar' : filter === 'en_yeni' ? 'En Yeni İçerikler' : 'Aktif Katılımlar'}
                subtitle={`${activeItems.length} içerik • şu an katılıma açık`}
                badge={
                  filter === 'tumu' || filter === 'populerler' || filter === 'en_yeni' ? (
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Canlı
                    </span>
                  ) : null
                }
              />
              <div className="grid sm:grid-cols-2 gap-4">
                {activeItems.map(item => <ContentCard key={item.id} item={item} completed={completedIds.has(item.id)} />)}
              </div>
            </section>
          )}

          {/* ── Sonuçlananlar (tumu/en_yeni görünümü) ── */}
          {showEndedSection && filter !== 'gecmisim' && (
            <section>
              <SectionHeader
                title="Sonuçlananlar"
                subtitle={`${endedItems.length} tamamlanmış içerik — sonuçları görüntüleyin`}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                {endedItems.map(item => <ContentCard key={item.id} item={item} completed={completedIds.has(item.id)} />)}
              </div>
            </section>
          )}

          {/* ── Sona Erenler tab içeriği ── */}
          {isTabFilter && typeTab === 'bitmis' && filter !== 'gecmisim' && (() => {
            const showKindTabs = filter === 'tumu';
            const KINDS_DEF = [
              { key: 'tumu'    as const, label: 'Tümü',      count: endedItems.length },
              { key: 'yarışma' as const, label: 'Yarışmalar', count: endedItems.filter(i => i.kind === 'yarışma').length },
              { key: 'anket'   as const, label: 'Anketler',   count: endedItems.filter(i => i.kind === 'anket').length },
              { key: 'test'    as const, label: 'Testler',    count: endedItems.filter(i => i.kind === 'test').length },
            ].filter(t => t.key === 'tumu' || t.count > 0);
            const visible = !showKindTabs || endedKind === 'tumu'
              ? endedItems
              : endedItems.filter(i => i.kind === endedKind);
            return (
              <section className="space-y-5">
                {showKindTabs && KINDS_DEF.length > 1 && (
                  <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 w-fit">
                    {KINDS_DEF.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setEndedKind(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                          endedKind === t.key
                            ? 'bg-[#0c1a2e] text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${endedKind === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                          {t.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {visible.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {visible.map(item => <ContentCard key={item.id} item={item} completed={completedIds.has(item.id)} />)}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-gray-400 text-sm">Bu kategoride henüz sona eren içerik yok.</p>
                  </div>
                )}
              </section>
            );
          })()}

          {/* ── Geçmişim ── */}
          {filter === 'gecmisim' && (
            <section>
              <SectionHeader
                title="Geçmişim"
                subtitle="Katıldığın anketler ve tamamladığın testler"
              />
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
                </div>
              ) : history.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Henüz katılım geçmişin yok.</p>
                  <button onClick={() => handleFilterChange('tumu')} className="mt-2 text-sm text-[#26496b] font-semibold hover:underline">
                    İçeriklere göz at →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(h => (
                    <Link
                      key={h.responseId}
                      href={`/sen-ne-dersin/${h.slug ?? h.surveyId}`}
                      className="group flex bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden border-l-4 p-5 items-center gap-4"
                      style={{ borderLeftColor: h.type === 'test' ? '#8b5cf6' : '#0ea5e9' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${h.type === 'test' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                            {h.type === 'test' ? 'Test' : 'Anket'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#26496b] transition-colors line-clamp-1">{h.title}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(h.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {h.timeTaken != null && ` · ${Math.floor(h.timeTaken / 60)}:${String(h.timeTaken % 60).padStart(2, '0')}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {h.type === 'test' && h.percent != null ? (
                          <>
                            <p className={`text-lg font-bold ${h.passed === true ? 'text-emerald-600' : h.passed === false ? 'text-red-500' : 'text-gray-700'}`}>
                              {h.percent}%
                            </p>
                            {h.passed != null && (
                              <p className={`text-[10px] font-semibold ${h.passed ? 'text-emerald-500' : 'text-red-400'}`}>
                                {h.passed ? 'GEÇTİ' : 'KALDI'}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">Katıldın ✓</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Sonuçlananlar filtresi — tür tabları ── */}
          {filter === 'sonuclananlar' && (() => {
            const counts = {
              yarışma: endedItems.filter(i => i.kind === 'yarışma').length,
              anket:   endedItems.filter(i => i.kind === 'anket').length,
              test:    endedItems.filter(i => i.kind === 'test').length,
            };
            const KINDS_DEF = [
              { key: 'tumu'    as const, label: 'Tümü',      count: endedItems.length },
              { key: 'yarışma' as const, label: 'Yarışmalar', count: counts.yarışma },
              { key: 'anket'   as const, label: 'Anketler',   count: counts.anket },
              { key: 'test'    as const, label: 'Testler',    count: counts.test },
            ].filter(t => t.key === 'tumu' || t.count > 0);
            const visible = endedKind === 'tumu'
              ? endedItems
              : endedItems.filter(i => i.kind === endedKind);
            return (
              <section className="space-y-5">
                {/* Tab bar */}
                <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 w-fit">
                  {KINDS_DEF.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setEndedKind(t.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        endedKind === t.key
                          ? 'bg-[#0c1a2e] text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${endedKind === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>
                {visible.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {visible.map(item => <ContentCard key={item.id} item={item} completed={completedIds.has(item.id)} />)}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-gray-400 text-sm">Bu kategoride sona eren içerik yok.</p>
                  </div>
                )}
              </section>
            );
          })()}

          {/* ── Sektör Raporu + Şirketler footer ── */}
          {(isTypeFilter || filter === 'sonuclananlar') && (
            <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              {[
                { href: '/sen-ne-dersin/sektor-raporu', label: 'Sektör Raporu', desc: 'Haritacılık sektörü araştırma verileri', border: 'border-emerald-500/30 hover:border-emerald-500', bg: 'hover:bg-emerald-50/50' },
                { href: '/sirket-testi', label: 'Şirketler İçin', desc: 'Kurumunuz için özel test ve anket çözümleri', border: 'border-rose-500/30 hover:border-rose-500', bg: 'hover:bg-rose-50/50' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center justify-between p-4 bg-white rounded-2xl border ${link.border} ${link.bg} transition-all duration-200`}
                >
                  <div>
                    <p className="font-bold text-gray-900 text-sm group-hover:text-[#26496b] transition-colors">{link.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}

          {/* ── Boş durum ── */}
          {activeItems.length === 0 && !showEndedSection && filter !== 'gecmisim' && filter !== 'sonuclananlar' && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Bu kategoride şu an içerik bulunmuyor.</p>
              <button onClick={() => handleFilterChange('tumu')} className="mt-3 text-sm text-[#26496b] font-semibold hover:underline">
                Tüm içerikleri göster
              </button>
            </div>
          )}

          {/* ── Alt bölüm: Konu Analizi + Kategori linkleri ── */}
          {(filter === 'tumu' || filter === 'en_yeni' || filter === 'populerler') && typeTab === 'aktif' && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className={`grid gap-3 ${user ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {user && (
                  <Link href="/sen-ne-dersin/analizim"
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-[#26496b]/30 hover:shadow-md transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-[#26496b]/10 flex items-center justify-center shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-[#26496b]" style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm group-hover:text-[#26496b] transition-colors leading-tight">Konu Analizim</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">Güçlü ve zayıf konuları gör</p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#26496b] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { href: '/sen-ne-dersin/anketler', label: 'Tüm Anketler', desc: 'Katılıma açık tüm anketler', border: 'border-sky-500/30 hover:border-sky-500', bg: 'hover:bg-sky-50/50' },
                  { href: '/sen-ne-dersin/testler', label: 'Tüm Testler', desc: 'Bilgi testleri ve sınav arşivi', border: 'border-violet-500/30 hover:border-violet-500', bg: 'hover:bg-violet-50/50' },
                  { href: '/sen-ne-dersin/yarismalar', label: 'Tüm Yarışmalar', desc: 'Aktif ve geçmiş yarışmalar', border: 'border-amber-500/30 hover:border-amber-500', bg: 'hover:bg-amber-50/50' },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group flex items-center justify-between p-4 bg-white rounded-2xl border ${link.border} ${link.bg} transition-all duration-200`}
                  >
                    <div>
                      <p className="font-bold text-gray-900 text-sm group-hover:text-[#26496b] transition-colors">{link.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
