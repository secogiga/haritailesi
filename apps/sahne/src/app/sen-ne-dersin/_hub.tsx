'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useSahneAuth } from '@/contexts/SahneAuthContext';
import type { Filter } from './_constants';
import { FILTER_ITEMS } from './_constants';

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

interface SurveyItem {
  kind: 'anket' | 'test';
  id: string; slug: string | null; title: string; description: string | null;
  status: string; responseCount: number; viewCount: number;
  endsAt: string | null; coverImageUrl: string | null;
  timeLimit?: number | null; passingScore?: number | null;
  createdAt?: string | null;
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
    border: 'border-l-sky-500',
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
    border: 'border-l-violet-500',
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
    border: 'border-l-amber-500',
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
  if (days === null) return null;
  if (!active || days < 0)
    return <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Sona erdi</span>;
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
      className={`group flex bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden border-l-4 ${cfg.border}`}
    >
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-0 sm:gap-6 p-5 sm:p-6">
        <div className="flex-1 min-w-0 space-y-2">
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
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-[#26496b] transition-colors duration-200 line-clamp-1">
            {item.title}
          </h3>
          <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-gray-700">{participantCount.toLocaleString('tr-TR')}</span>
              <span>{participantLabel}</span>
            </span>
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
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-end sm:justify-center sm:min-w-[140px] mt-3 sm:mt-0 gap-2">
          {completed && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              {completedLabel}
            </span>
          )}
          {isActive ? (
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm group-hover:shadow ${cfg.cta}`}>
              {completed ? 'Tekrar' : cfg.ctaText}
              <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all duration-200 ${cfg.ctaOutline}`}>
              {cfg.ctaEndedText}
              <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
          {item.kind !== 'yarışma' && (
            <span className="text-[10px] text-gray-400 hidden sm:block">{(item.viewCount ?? 0).toLocaleString('tr-TR')} görüntüleme</span>
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

  function handleFilterChange(f: Filter) {
    setFilter(f);
    router.push(getFilterUrl(f), { scroll: false });
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
          for (const s of (hub.anketler ?? [])) merged.push({ status: 'active', ...s, kind: 'anket' });
          for (const s of (hub.testler ?? [])) merged.push({ status: 'active', ...s, kind: 'test' });
        }
        if (Array.isArray(comps)) {
          for (const c of comps) {
            if (c.status === 'active' || c.status === 'ended') {
              merged.push({ ...c, kind: 'yarışma' });
            }
          }
        }
        if (merged.length >= 3) setItems(merged);
      } catch { /* keep example data */ }
    })();
  }, []);

  const activeItems = useMemo(() => {
    let list = items.filter(i => i.status === 'active');
    if (filter === 'anketler') list = list.filter(i => i.kind === 'anket');
    else if (filter === 'testler') list = list.filter(i => i.kind === 'test');
    else if (filter === 'yarismalar') list = list.filter(i => i.kind === 'yarışma');
    else if (filter === 'sonuclananlar') return [];
    else if (filter === 'populerler') return [...list].sort((a, b) => countNum(b) - countNum(a));
    else if (filter === 'en_yeni') return [...list].sort((a, b) => itemCreatedAt(b) - itemCreatedAt(a));
    return list;
  }, [items, filter]);

  const endedItems = useMemo(() => {
    if (filter === 'populerler') return [];
    let list = items.filter(i => i.status === 'ended');
    if (filter === 'anketler') list = list.filter(i => i.kind === 'anket');
    else if (filter === 'testler') list = list.filter(i => i.kind === 'test');
    else if (filter === 'yarismalar') list = list.filter(i => i.kind === 'yarışma');
    else if (filter === 'en_yeni') return [...list].sort((a, b) => itemCreatedAt(b) - itemCreatedAt(a));
    return list;
  }, [items, filter]);

  const stats = useMemo(() => {
    const anket = items.filter(i => i.kind === 'anket').length;
    const test = items.filter(i => i.kind === 'test').length;
    const yarısma = items.filter(i => i.kind === 'yarışma').length;
    const katilim = items.reduce((s, i) => s + countNum(i), 0);
    return { anket, test, yarısma, katilim };
  }, [items]);

  const showEndedSection = filter !== 'populerler' && endedItems.length > 0;

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

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14">
          <div className="flex justify-center mb-7">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Katılım & Etkileşim Merkezi
            </span>
          </div>
          <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-none">
            Sen Ne Dersin?
          </h1>
          <p className="text-center text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Anketlere katıl, testlerle kendini değerlendir,{' '}
            yarışmalarda yer al ve topluluğun sesine katkı sun.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { n: stats.anket, label: 'Toplam Anket', color: 'text-sky-400', bg: 'bg-sky-500/10' },
              { n: stats.test, label: 'Toplam Test', color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { n: stats.yarısma, label: 'Yarışma', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { n: stats.katilim, label: 'Toplam Katılım', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map(s => (
              <div key={s.label} className={`text-center ${s.bg} backdrop-blur-sm border border-white/[0.08] rounded-2xl py-5 px-3`}>
                <div className={`text-2xl sm:text-3xl font-black ${s.color} mb-1`}>
                  {s.n.toLocaleString('tr-TR')}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTER_ITEMS.filter(f => !f.authOnly || !!user).map(({ key, label, authOnly }) => (
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

      {/* ── Content ── */}
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

          {/* Subscribe banner */}
          {user && filter === 'tumu' && (
            <div className={`flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border transition-all ${subscribed ? 'bg-emerald-50 border-emerald-100' : 'bg-[#0c1a2e]/5 border-[#0c1a2e]/10'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${subscribed ? 'bg-emerald-100' : 'bg-[#26496b]/10'}`}>
                  <svg className={`w-4 h-4 ${subscribed ? 'text-emerald-600' : 'text-[#26496b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${subscribed ? 'text-emerald-800' : 'text-gray-800'}`}>
                    {subscribed ? 'Abone oldun' : 'Yeni içeriklerden haberdar ol'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {subscribed ? 'Yeni anket, test ve yarışmalardan e-posta alacaksın.' : 'Yeni anket ve testler çıktığında sana bildirim gönderelim.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => void toggleSubscribe()}
                disabled={subLoading}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                  subscribed
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-[#26496b] text-white hover:bg-[#1e3a56]'
                }`}
              >
                {subLoading ? '…' : subscribed ? 'Aboneliği İptal Et' : 'Abone Ol'}
              </button>
            </div>
          )}

          {/* Kişisel konu analizi — sadece giriş yapanlara */}
          {filter === 'tumu' && user && (
            <Link href="/sen-ne-dersin/analizim"
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-[#26496b]/30 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm group-hover:text-[#26496b] transition-colors">Konu Analizim</p>
                <p className="text-xs text-gray-400 mt-0.5">Güçlü ve zayıf konularını gör, gelişim planı oluştur</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-[#26496b] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Sektör raporu + şirket testi CTAs */}
          {filter === 'tumu' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Link href="/sen-ne-dersin/sektor-raporu"
                className="flex items-center gap-4 p-4 bg-[#0c1a2e] rounded-2xl hover:bg-[#162439] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">Sektör Raporu {new Date().getFullYear()}</p>
                  <p className="text-gray-400 text-xs mt-0.5">Tüm katılımların yıllık özeti →</p>
                </div>
              </Link>
              <Link href="/sirket-testi"
                className="flex items-center gap-4 p-4 bg-[#0c1a2e] rounded-2xl hover:bg-[#162439] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">Şirketler İçin</p>
                  <p className="text-gray-400 text-xs mt-0.5">Toplu değerlendirme ve aday takibi →</p>
                </div>
              </Link>
            </div>
          )}

          {activeItems.length > 0 && filter !== 'gecmisim' && (
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
              <div className="space-y-3">
                {activeItems.map(item => <ContentCard key={item.id} item={item} completed={completedIds.has(item.id)} />)}
              </div>
            </section>
          )}

          {showEndedSection && filter !== 'gecmisim' && (
            <section>
              <SectionHeader
                title="Sonuçlananlar"
                subtitle={`${endedItems.length} tamamlanmış içerik — sonuçları görüntüleyin`}
              />
              <div className="space-y-3">
                {endedItems.map(item => <ContentCard key={item.id} item={item} completed={completedIds.has(item.id)} />)}
              </div>
            </section>
          )}

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

          {filter === 'tumu' && (
            <section className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
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
            </section>
          )}
        </div>
      </main>
    </>
  );
}
