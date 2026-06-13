'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi, type FeedbackItem, type FeedbackHistoryEntry, type SimilarResolvedTicket } from '@/lib/api';

type FeedbackStatus =
  | 'open' | 'reviewing' | 'awaiting_info' | 'in_progress' | 'mentoring'
  | 'expert_review' | 'partner_referred' | 'offer_pending' | 'education_suggested' | 'gpt_responded'
  | 'suggested' | 'resolved' | 'archived';

const STATUS_LABELS: Record<string, string> = {
  open: 'Yeni', reviewing: 'İncelemede', awaiting_info: 'Bilgi Bekleniyor',
  in_progress: 'Ekibimizde', mentoring: 'Mentöre Yönlendirildi', expert_review: 'Uzman İncelemesinde',
  partner_referred: 'Partnere Yönlendirildi', offer_pending: 'Teklif Bekleniyor',
  education_suggested: 'Eğitim/Etkinlik Önerildi', gpt_responded: 'GPT Ön Yanıt Verdi',
  suggested: 'Öneri Verildi', resolved: 'Çözüldü', archived: 'Arşivlendi',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-50 text-red-600 border-red-200', reviewing: 'bg-blue-50 text-blue-600 border-blue-200',
  awaiting_info: 'bg-orange-50 text-orange-700 border-orange-200', in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  mentoring: 'bg-purple-50 text-purple-700 border-purple-200', expert_review: 'bg-violet-50 text-violet-700 border-violet-200',
  partner_referred: 'bg-indigo-50 text-indigo-700 border-indigo-200', offer_pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  education_suggested: 'bg-cyan-50 text-cyan-700 border-cyan-200', gpt_responded: 'bg-sky-50 text-sky-700 border-sky-200',
  suggested: 'bg-teal-50 text-teal-700 border-teal-200', resolved: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_BAR: Record<string, string> = {
  open: 'bg-red-400', reviewing: 'bg-blue-400', awaiting_info: 'bg-orange-400',
  in_progress: 'bg-amber-400', mentoring: 'bg-purple-400', expert_review: 'bg-violet-400',
  partner_referred: 'bg-indigo-400', offer_pending: 'bg-yellow-400', education_suggested: 'bg-cyan-400',
  gpt_responded: 'bg-sky-400', suggested: 'bg-teal-400', resolved: 'bg-green-400', archived: 'bg-gray-300',
};

const URGENCY_LABEL: Record<string, string> = {
  kritik: '🔴 Kritik', yuksek: '🟠 Yüksek', normal: '🟡 Normal', dusuk: '🟢 Düşük',
};
const URGENCY_BADGE: Record<string, string> = {
  kritik: 'bg-red-50 text-red-700 border-red-200', yuksek: 'bg-orange-50 text-orange-700 border-orange-200',
  normal: 'bg-gray-50 text-gray-600 border-gray-200', dusuk: 'bg-green-50 text-green-700 border-green-200',
};
const USER_TYPE_LABELS: Record<string, string> = {
  ogrenci: 'Öğrenci', yeni_mezun: 'Yeni Mezun', calisan: 'Çalışan',
  yonetici: 'Yönetici', firma_sahibi: 'Firma Sahibi', kurumsal: 'Kurumsal Temsilci',
};

// ─── Ecosystem routing config ──────────────────────────────────────────────────

const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://sahne.haritailesi.org';

const ECOSYSTEM_SUGGESTIONS: Record<string, { label: string; href: string; color: string; icon: string; replyTemplate: string }> = {
  haritakademi: {
    label: 'Haritakademi',
    href: `${SAHNE_URL}/egitim`,
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: '📚',
    replyTemplate: 'Haritakademi eğitim platformumuzu incelemenizi öneririz: haritailesi.org/egitim — Kariyer gelişiminize katkı sunacak çeşitli eğitimler ve sertifika programları mevcuttur.',
  },
  haritakariyer: {
    label: 'Haritakariyer',
    href: `${SAHNE_URL}/ilanlar`,
    color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    icon: '💼',
    replyTemplate: 'Haritailesi İlan Panosu\'nda sektördeki güncel iş ve staj ilanlarını inceleyebilirsiniz. Mutfak platformumuzda üyelere özel fırsatlar düzenli olarak paylaşılmaktadır.',
  },
  vitrin_crm: {
    label: 'Vitrin (Kurumsal)',
    href: `${SAHNE_URL}/magaza`,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    icon: '🏢',
    replyTemplate: 'Haritailesi Vitrin\'de kurumsal iş birliği fırsatlarımızı inceleyebilirsiniz. Kurumsal partnerlik için destek@haritailesi.org adresine ulaşabilirsiniz.',
  },
  meslegin_gelecekleri: {
    label: "Mesleğin Gelecekleri",
    href: `${SAHNE_URL}/egitim`,
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    icon: '🎓',
    replyTemplate: "Haritailesi Mesleğin Gelecekleri programımız öğrenci ve yeni mezunlara yönelik özel destek, mentorluk ve burs imkânları sunmaktadır. Başvurular haritailesi.org adresinden yapılabilir.",
  },
  partner_referral: {
    label: 'Partner İşbirliği',
    href: `${SAHNE_URL}/isbirligi`,
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    icon: '🤝',
    replyTemplate: 'Haritailesi\'nin kurumsal indirim ve işbirliği programları için destek@haritailesi.org adresimizle iletişime geçebilirsiniz.',
  },
};

function SimilarResolved({ feedbackId, subject, subCategory }: {
  feedbackId: string; subject: string; subCategory?: string | null;
}) {
  const [items, setItems] = useState<SimilarResolvedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const catMatch = subject.match(/^\[([^\]]+)\]/);
    const keywords = subject.replace(/^\[([^\]]+)\]\s*/, '').split(/\s+/).slice(0, 4).join(' ');
    adminApi.findSimilarResolved({
      q: keywords,
      subCategory: subCategory ?? undefined,
      category: catMatch?.[1],
      limit: 4,
    })
      .then(rows => setItems(rows.filter(r => r.id !== feedbackId)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [feedbackId, subject, subCategory]);

  if (loading) return (
    <div className="bg-sky-50 border border-sky-100 rounded-lg p-3">
      <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide mb-2">🔍 Benzer Çözümler</p>
      <div className="space-y-1.5">
        {[1,2].map(i => <div key={i} className="h-8 bg-sky-100 rounded animate-pulse" />)}
      </div>
    </div>
  );
  if (items.length === 0) return null;

  return (
    <div className="bg-sky-50 border border-sky-100 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wide">🔍 Benzer Çözümler</p>
        <a href="/raporlar" className="text-[10px] text-sky-500 hover:underline">Arşive git →</a>
      </div>
      <div className="space-y-1.5">
        {items.map(item => {
          const subj = item.subject.replace(/^\[([^\]]+)\]\s*/, '');
          const isOpen = expandedId === item.id;
          return (
            <div key={item.id} className="bg-white border border-sky-100 rounded-lg overflow-hidden">
              <button type="button" onClick={() => setExpandedId(prev => prev === item.id ? null : item.id)}
                className="w-full text-left px-2.5 py-2 flex items-start gap-2 hover:bg-sky-50 transition-colors">
                <div className="w-1 rounded-full bg-green-400 flex-shrink-0 self-stretch mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-800 truncate">{subj}</p>
                  {!isOpen && item.adminReply && (
                    <p className="text-[10px] text-gray-400 truncate">Yanıt: {item.adminReply.slice(0, 60)}…</p>
                  )}
                </div>
                <svg className={`w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-2.5 pb-2.5 pt-1.5 border-t border-sky-50 space-y-1.5">
                  {item.adminNotes && (
                    <div className="bg-amber-50 rounded p-2">
                      <p className="text-[9px] font-semibold text-gray-400 uppercase mb-0.5">İç Not</p>
                      <p className="text-[10px] text-gray-700 whitespace-pre-wrap leading-relaxed">{item.adminNotes}</p>
                    </div>
                  )}
                  {item.adminReply && (
                    <div className="bg-green-50 rounded p-2 border border-green-100">
                      <p className="text-[9px] font-semibold text-gray-400 uppercase mb-0.5">Verilen Yanıt</p>
                      <p className="text-[10px] text-gray-700 whitespace-pre-wrap leading-relaxed">{item.adminReply}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EcosystemPanel({ routingActions, onFillReply }: { routingActions: string[]; onFillReply: (text: string) => void }) {
  const relevant = routingActions.filter(a => a in ECOSYSTEM_SUGGESTIONS);
  if (relevant.length === 0) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-2">🌐 Ekosistem Önerileri</p>
      <div className="flex flex-wrap gap-1.5">
        {relevant.map(action => {
          const cfg = ECOSYSTEM_SUGGESTIONS[action]!;
          return (
            <div key={action} className="flex items-center gap-1">
              <a
                href={cfg.href}
                target="_blank"
                rel="noreferrer"
                className={`text-[10px] font-semibold border px-2 py-1 rounded-full ${cfg.color} transition-colors`}
              >
                {cfg.icon} {cfg.label}
              </a>
              <button
                type="button"
                title="Yanıta ekle"
                onClick={() => onFillReply(cfg.replyTemplate)}
                className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
              >
                ↙
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-emerald-600 mt-1.5">↙ butonuna tıklayarak şablonu yanıt alanına ekleyin</p>
    </div>
  );
}

function HistoryTimeline({ feedbackId }: { feedbackId: string }) {
  const [history, setHistory] = useState<FeedbackHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.getFeedbackHistory(feedbackId)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [feedbackId]);

  if (loading) return <div className="h-12 bg-gray-50 rounded animate-pulse" />;
  if (history.length === 0) return <p className="text-xs text-gray-400 italic">Henüz geçmiş yok.</p>;

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-start gap-2 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-gray-500">
              {STATUS_LABELS[entry.fromStatus ?? ''] ?? entry.fromStatus ?? '—'} →{' '}
              <span className="font-semibold text-gray-700">{STATUS_LABELS[entry.toStatus] ?? entry.toStatus}</span>
            </span>
            {entry.changedBy && <span className="text-gray-400 ml-1">· {entry.changedBy}</span>}
            <p className="text-gray-400 text-[10px]">{new Date(entry.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTicketNo(ticketNo: number, createdAt: string) {
  return `HDM-${new Date(createdAt).getFullYear()}-${String(ticketNo).padStart(4, '0')}`;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= score ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{score}/5</span>
    </div>
  );
}

export default function GoruslerPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailStatus, setDetailStatus] = useState('');
  const [detailNotes, setDetailNotes] = useState('');
  const [detailReply, setDetailReply] = useState('');
  const [detailAssigned, setDetailAssigned] = useState('');
  const [closureReport, setClosureReport] = useState('');
  const [activeTab, setActiveTab] = useState<'detail' | 'history'>('detail');
  const [aiDraft, setAiDraft] = useState('');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  async function loadAiDraft() {
    if (!selected || aiDraftLoading) return;
    setAiDraftLoading(true);
    setAiDraft('');
    try {
      const { draft } = await adminApi.generateReplyDraft(selected.id);
      setAiDraft(draft);
    } catch {
      setAiDraft('');
    } finally {
      setAiDraftLoading(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params['status'] = statusFilter;
      if (urgencyFilter) params['urgency'] = urgencyFilter;
      if (userTypeFilter) params['userType'] = userTypeFilter;
      if (sourceFilter) params['source'] = sourceFilter;
      const res = await adminApi.listFeedback(params);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgencyFilter, userTypeFilter, sourceFilter]);

  useEffect(() => { void load(); }, [load]);

  function openDetail(item: FeedbackItem) {
    setSelected(item);
    setDetailStatus(item.status);
    setDetailNotes(item.adminNotes ?? '');
    setDetailReply(item.adminReply ?? '');
    setDetailAssigned(item.assignedTo ?? '');
    setClosureReport('');
    setAiDraft('');
    setActiveTab('detail');
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const notesWithReport = closureReport.trim()
        ? `[KAPANIŞ RAPORU]:\n${closureReport.trim()}\n\n${detailNotes}`.trim()
        : detailNotes;
      await adminApi.updateFeedbackStatus(selected.id, detailStatus, notesWithReport, detailReply, detailAssigned || undefined);
      const updated = { ...selected, status: detailStatus, adminNotes: detailNotes, adminReply: detailReply, assignedTo: detailAssigned };
      setItems(prev => prev.map(i => i.id === selected.id ? updated : i));
      setSelected(updated);
      // Refresh history after save
      setActiveTab('history');
      setTimeout(() => setActiveTab('detail'), 50);
    } finally {
      setSaving(false);
    }
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]';

  const filtered = search
    ? items.filter(i =>
        i.subject.toLowerCase().includes(search.toLowerCase()) ||
        (i.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (i.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        String(i.ticketNo).includes(search)
      )
    : items;

  const routingActions = selected?.routingActions?.split(',').filter(Boolean) ?? [];

  const statCounts = {
    total: items.length,
    open: items.filter(i => i.status === 'open').length,
    active: items.filter(i => ['reviewing', 'awaiting_info', 'in_progress', 'mentoring', 'expert_review', 'partner_referred', 'offer_pending'].includes(i.status)).length,
    resolved: items.filter(i => i.status === 'resolved').length,
    archived: items.filter(i => i.status === 'archived').length,
  };

  const STATUS_QUICK_FILTERS: { label: string; value: string; dot: string }[] = [
    { label: 'Tümü', value: '', dot: 'bg-gray-300' },
    { label: 'Yeni', value: 'open', dot: 'bg-red-400' },
    { label: 'İşlemde', value: 'in_progress', dot: 'bg-amber-400' },
    { label: 'Ekibimizde', value: 'reviewing', dot: 'bg-blue-400' },
    { label: 'Çözüldü', value: 'resolved', dot: 'bg-green-400' },
    { label: 'Arşiv', value: 'archived', dot: 'bg-gray-300' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Haritailesi Pusula</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tüm talep, görüş ve yönlendirmeler</p>
        </div>
        <a href="/raporlar" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#26496b] bg-[#26496b]/5 hover:bg-[#26496b]/10 px-3 py-2 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Raporlar
        </a>
      </div>

      {/* Stat chips */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="text-xl font-bold text-gray-900">{statCounts.total}</span>
          <span className="text-xs text-gray-400 font-medium">Toplam</span>
        </div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <span className="text-xl font-bold text-red-600">{statCounts.open}</span>
          <span className="text-xs text-red-500 font-medium">Yeni</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
          <span className="text-xl font-bold text-amber-600">{statCounts.active}</span>
          <span className="text-xs text-amber-500 font-medium">İşlemde</span>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
          <span className="text-xl font-bold text-green-600">{statCounts.resolved}</span>
          <span className="text-xs text-green-500 font-medium">Çözüldü</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
          <span className="text-xl font-bold text-gray-400">{statCounts.archived}</span>
          <span className="text-xs text-gray-400 font-medium">Arşiv</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Konu, email, ad, ticket no…"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b]/50"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* Quick status pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_QUICK_FILTERS.map(f => (
            <button key={f.value} type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f.value
                  ? 'bg-[#26496b] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* Secondary filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select className="border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 bg-white"
            value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)}>
            <option value="">Tüm Aciliyetler</option>
            {Object.entries(URGENCY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 bg-white"
            value={userTypeFilter} onChange={e => setUserTypeFilter(e.target.value)}>
            <option value="">Tüm Tipler</option>
            {Object.entries(USER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 bg-white"
            value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
            <option value="">Tüm Kaynaklar</option>
            <option value="sahne">Sahne</option>
            <option value="mutfak">Mutfak</option>
            <option value="web">Web</option>
          </select>
        </div>

        {/* Result count */}
        <span className="ml-auto text-xs text-gray-400 font-medium hidden sm:block">{filtered.length} sonuç</span>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 min-w-0 space-y-2">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-100 h-20 animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">Kayıt bulunamadı.</div>
          ) : (
            filtered.map(item => {
              const catMatch = item.subject.match(/^\[([^\]]+)\]/);
              const catLabel = catMatch?.[1] ?? '';
              const subj = item.subject.replace(/^\[([^\]]+)\]\s*/, '');
              const routing = item.routingActions?.split(',').filter(Boolean) ?? [];
              return (
                <button key={item.id} type="button" onClick={() => openDetail(item)}
                  className={`w-full text-left bg-white rounded-xl border p-4 hover:shadow-sm transition-all flex gap-3 ${selected?.id === item.id ? 'border-[#26496b]/40 shadow-sm' : 'border-gray-100'}`}>
                  <div className={`w-1 rounded-full flex-shrink-0 self-stretch ${STATUS_BAR[item.status] ?? 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-bold text-[#26496b] font-mono">{formatTicketNo(item.ticketNo, item.createdAt)}</span>
                      <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${STATUS_BADGE[item.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                      {item.urgency && item.urgency !== 'normal' && (
                        <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${URGENCY_BADGE[item.urgency] ?? ''}`}>
                          {URGENCY_LABEL[item.urgency] ?? item.urgency}
                        </span>
                      )}
                      {catLabel && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{catLabel}</span>}
                      {item.subCategory && <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded-full">{item.subCategory}</span>}
                      {routing.includes('haritakademi') && <span className="text-[10px]">📚</span>}
                      {routing.includes('haritakariyer') && <span className="text-[10px]">💼</span>}
                      {routing.includes('meslegin_gelecekleri') && <span className="text-[10px]">🎓</span>}
                      {routing.includes('vitrin_crm') && <span className="text-[10px]">🏢</span>}
                      {item.satisfactionScore ? <span className="text-[10px] text-yellow-500">{'★'.repeat(item.satisfactionScore)}</span> : null}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{subj}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <p className="text-xs text-gray-400 truncate">
                        {item.displayName ?? item.name ?? item.email ?? 'Misafir'}
                        {item.userType ? ` · ${USER_TYPE_LABELS[item.userType] ?? item.userType}` : ''}
                      </p>
                      <span className="text-gray-300 text-xs">·</span>
                      <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</p>
                      {item.assignedTo && <span className="text-xs text-[#26496b] font-medium">@{item.assignedTo}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide flex-shrink-0 self-center hidden sm:block">{item.source}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-[420px] flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm self-start sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#26496b] font-mono mb-1">{formatTicketNo(selected.ticketNo, selected.createdAt)}</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug break-words">{selected.subject.replace(/^\[([^\]]+)\]\s*/, '')}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selected.urgency && (
                    <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${URGENCY_BADGE[selected.urgency] ?? ''}`}>
                      {URGENCY_LABEL[selected.urgency] ?? selected.urgency}
                    </span>
                  )}
                  {selected.expectation && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full">{selected.expectation}</span>
                  )}
                  {selected.userType && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded-full">
                      {USER_TYPE_LABELS[selected.userType] ?? selected.userType}
                    </span>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('detail')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeTab === 'detail' ? 'text-[#26496b] border-b-2 border-[#26496b]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Talep Detayı
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeTab === 'history' ? 'text-[#26496b] border-b-2 border-[#26496b]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Geçmiş
              </button>
            </div>

            {activeTab === 'detail' ? (
              <div className="p-5 space-y-4">
                {/* Gönderen */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Gönderen</p>
                  <p className="text-sm text-gray-700 font-medium">{selected.displayName ?? selected.name ?? selected.email ?? 'Misafir'}</p>
                  {selected.email && (selected.displayName ?? selected.name) && <p className="text-xs text-gray-400">{selected.email}</p>}
                </div>

                {/* Talep */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Talep İçeriği</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">{selected.body}</div>
                </div>

                {/* Benzer çözümler */}
                <SimilarResolved
                  feedbackId={selected.id}
                  subject={selected.subject}
                  subCategory={selected.subCategory}
                />

                {/* Ekosistem önerileri */}
                {routingActions.length > 0 && (
                  <EcosystemPanel
                    routingActions={routingActions}
                    onFillReply={(text) => setDetailReply(prev => prev ? `${prev}\n\n${text}` : text)}
                  />
                )}

                {/* AI Özet */}
                {selected.aiSummary && (
                  <div className="bg-sky-50 border border-sky-100 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide mb-1.5">⚡ Akıllı Özet</p>
                    <p className="text-xs text-sky-900 leading-relaxed whitespace-pre-line">{selected.aiSummary}</p>
                  </div>
                )}

                {/* Dosyalar */}
                {selected.attachmentUrls && (() => {
                  try {
                    const urls = JSON.parse(selected.attachmentUrls) as string[];
                    return urls.length > 0 ? (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Ekler ({urls.length})</p>
                        {urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer"
                            className="block text-xs text-[#26496b] hover:underline truncate">{url}</a>
                        ))}
                      </div>
                    ) : null;
                  } catch { return null; }
                })()}

                {/* Memnuniyet */}
                {selected.satisfactionScore ? (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Memnuniyet</p>
                    <StarRating score={selected.satisfactionScore} />
                  </div>
                ) : null}

                <hr className="border-gray-100" />

                {/* Durum */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Durum</label>
                  <select className={inp} value={detailStatus} onChange={e => setDetailStatus(e.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>

                {/* Atama */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Atanan Kişi</label>
                  <input type="text" className={inp} placeholder="Mentör email veya isim…"
                    value={detailAssigned} onChange={e => setDetailAssigned(e.target.value)} />
                </div>

                {/* İç Not */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">İç Not</label>
                  <textarea rows={2} className={`${inp} resize-none`} placeholder="Ekip için not (kullanıcı görmez)…"
                    value={detailNotes} onChange={e => setDetailNotes(e.target.value)} />
                </div>

                {/* Yanıt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Kullanıcıya Yanıt</label>
                    <button
                      type="button"
                      onClick={() => void loadAiDraft()}
                      disabled={aiDraftLoading}
                      className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors"
                    >
                      {aiDraftLoading
                        ? <span className="animate-pulse">✨ Hazırlanıyor…</span>
                        : '✨ Yanıt Önerisi Al'}
                    </button>
                  </div>
                  {aiDraft && (
                    <div className="mb-2 bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-[9px] font-bold text-purple-500 uppercase tracking-widest mb-1.5">AI Yanıt Taslağı</p>
                      <p className="text-[11px] text-purple-900 leading-relaxed whitespace-pre-wrap">{aiDraft}</p>
                      <button
                        type="button"
                        onClick={() => { setDetailReply(aiDraft); setAiDraft(''); }}
                        className="mt-2 text-[10px] font-semibold text-purple-600 hover:text-purple-800 underline underline-offset-2 transition-colors"
                      >
                        Kullan →
                      </button>
                    </div>
                  )}
                  <textarea rows={4} className={`${inp} resize-none`} placeholder="Kullanıcıya gönderilecek yanıt…"
                    value={detailReply} onChange={e => setDetailReply(e.target.value)} />
                </div>

                {/* Kapanış Raporu — sadece çözüldü/arşivlendi durumunda */}
                {(detailStatus === 'resolved' || detailStatus === 'archived') && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3.5">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1.5">📋 Kapanış Raporu</p>
                    <p className="text-[11px] text-green-600 mb-2">Bu bilgi iç nota eklenir, kullanıcıya gönderilmez.</p>
                    <textarea
                      rows={3}
                      className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 bg-white resize-none placeholder-green-300"
                      placeholder="Nasıl çözüldü? Hangi kaynağa yönlendirildi? Öğrenilen ders?"
                      value={closureReport}
                      onChange={e => setClosureReport(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => void save()} disabled={saving}
                    className="flex-1 bg-[#26496b] text-white font-semibold py-2.5 rounded-lg hover:bg-[#1e3a56] transition-colors disabled:opacity-60 text-sm">
                    {saving ? 'Kaydediliyor…' : 'Kaydet & Gönder'}
                  </button>
                  <button type="button" onClick={() => { setDetailStatus('archived'); void save(); }}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors" title="Arşivle">
                    🗃
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Durum Geçmişi</p>
                <HistoryTimeline key={selected.id} feedbackId={selected.id} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
