'use client';

import React, { useEffect, useRef, useState } from 'react';
import { adminApi, type MutfakBehaviorStats, type MutfakTierActions, type MutfakUserRow, type MutfakUserStatsPage } from '@/lib/api';
import { TIER_CFG, TIER_ORDER, ACTION_CFG, GROUP_COLORS, TIER_CAPABILITIES, type ActionCfgItem } from '@/lib/mutfak-data';

// ─── Keyframe styles ──────────────────────────────────────────────────────────

const STYLES = `
@keyframes m-slide-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes m-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes m-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes m-ping-slow {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%       { transform: scale(1.6); opacity: 0; }
}
@keyframes m-count-pop {
  0%   { transform: scale(0.85); opacity: 0; }
  60%  { transform: scale(1.08); }
  100% { transform: scale(1);   opacity: 1; }
}
.m-slide-up   { animation: m-slide-up  0.48s cubic-bezier(.22,1,.36,1) both; }
.m-fade-in    { animation: m-fade-in   0.4s ease both; }
.m-count-pop  { animation: m-count-pop 0.5s cubic-bezier(.22,1,.36,1) both; }
.m-shimmer-bg {
  background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%);
  background-size: 800px 100%;
  animation: m-shimmer 1.4s infinite linear;
}
`;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900, enabled = true) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    if (target === 0) { setValue(0); return; }
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, enabled]);
  return value;
}

function useMounted(delay = 80) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, []);
  return mounted;
}

// ─── Helper: heatmap cell color ───────────────────────────────────────────────

function heatColor(val: number, max: number): string {
  if (max === 0 || val === 0) return 'bg-gray-50 text-gray-300';
  const ratio = val / max;
  if (ratio >= 0.8) return 'bg-blue-600 text-white';
  if (ratio >= 0.6) return 'bg-blue-400 text-white';
  if (ratio >= 0.4) return 'bg-blue-200 text-blue-800';
  if (ratio >= 0.2) return 'bg-blue-100 text-blue-700';
  return 'bg-blue-50 text-blue-500';
}

// ─── Trend mini chart ─────────────────────────────────────────────────────────

const CHART_H = 80;

function TrendChart({ data, tiers }: {
  data: MutfakBehaviorStats['monthlyTrend'];
  tiers: string[];
}) {
  const mounted = useMounted(120);
  if (!data.length) return (
    <div className="flex items-center justify-center h-24 text-xs text-gray-400">
      Trend verisi bekleniyor…
    </div>
  );
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: CHART_H }}>
      {data.map((d, i) => {
        const [yr, mon] = d.month.split('-');
        const label = new Date(Number(yr), Number(mon) - 1, 1).toLocaleDateString('tr-TR', { month: 'short' });
        const barPx = mounted ? Math.max((d.total / maxTotal) * CHART_H, 4) : 4;
        const tierTotal = Object.values(d.byTier).reduce((s, v) => s + v, 0) || 1;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center justify-end gap-0.5 min-w-0">
            <div className="w-full rounded-t-sm overflow-hidden"
              style={{ height: barPx, transition: 'height 0.6s cubic-bezier(.22,1,.36,1)', transitionDelay: `${i * 35}ms` }}>
              {tiers.map((tier) => {
                const count = d.byTier[tier] ?? 0;
                const cfg = TIER_CFG[tier];
                if (!cfg || count === 0) return null;
                return (
                  <div key={tier}
                    style={{ height: `${(count / tierTotal) * 100}%`, backgroundColor: cfg.color }} />
                );
              })}
            </div>
            <span className="text-[8px] text-gray-400 leading-none">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Animated KPI card ────────────────────────────────────────────────────────

function KpiCard({ value, label, icon, color, delay = 0 }: {
  value: number | string; label: string; icon: string; color: string; delay?: number;
}) {
  const isNum = typeof value === 'number';
  const counted = useCountUp(isNum ? value : 0, 900, isNum);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 m-slide-up"
      style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums m-count-pop"
        style={{ animationDelay: `${delay + 200}ms` }}>
        {isNum ? counted.toLocaleString('tr-TR') : value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─── Shimmer placeholder ─────────────────────────────────────────────────────

function Shimmer({ h = 'h-3', w = 'w-full', rounded = 'rounded' }: { h?: string; w?: string; rounded?: string }) {
  return <div className={`${h} ${w} ${rounded} m-shimmer-bg`} />;
}

function DataPending() {
  return (
    <div className="space-y-3 py-5">
      <Shimmer h="h-2.5" w="w-3/4" />
      <Shimmer h="h-2.5" w="w-full" />
      <Shimmer h="h-2.5" w="w-5/6" />
      <Shimmer h="h-2.5" w="w-2/3" />
      <div className="pt-3 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full m-shimmer-bg" />
        <Shimmer h="h-2" w="w-40" />
      </div>
    </div>
  );
}

// ─── Profile depth row (hook'u kendi scope'unda çağırır) ─────────────────────

function ProfileDepthRow({ row, cfg, i }: {
  row: { tier: string; total: number; avgCompletionPct: number; withBio: number; withProfession: number; withCity: number; withLinkedIn: number };
  cfg: { label: string; color: string };
  i: number;
}) {
  const mounted = useMounted(200 + i * 80);
  return (
    <div className="m-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: cfg.color }} />
          <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
        </div>
        <span className="text-xs font-bold text-[#26496b]">%{row.avgCompletionPct}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: mounted ? `${row.avgCompletionPct}%` : '0%', backgroundColor: cfg.color }} />
      </div>
      <div className="flex gap-3 text-[10px] text-gray-400">
        <span>Bio: {row.total > 0 ? Math.round((row.withBio / row.total) * 100) : 0}%</span>
        <span>Meslek: {row.total > 0 ? Math.round((row.withProfession / row.total) * 100) : 0}%</span>
        <span>Şehir: {row.total > 0 ? Math.round((row.withCity / row.total) * 100) : 0}%</span>
        <span>LinkedIn: {row.total > 0 ? Math.round((row.withLinkedIn / row.total) * 100) : 0}%</span>
      </div>
    </div>
  );
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const mounted = useMounted(120 + delay);
  return (
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`}
        style={{ width: mounted ? `${pct}%` : '0%', transition: 'width 0.7s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  );
}

// ─── Live badge ───────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75"
          style={{ animation: 'm-ping-slow 1.5s ease-in-out infinite' }} />
        <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
      </span>
      Canlı
    </span>
  );
}

// ─── Per-user table helpers ───────────────────────────────────────────────────

type ColKey = 'ziyaret' | 'feed' | 'forum' | 'mentorluk' | 'sc' | 'icerik' | 'form' | 'total';

const COL_DEFS: { key: ColKey; label: string; icon: string }[] = [
  { key: 'ziyaret',   label: 'Ziyaret',  icon: '👁️' },
  { key: 'feed',      label: 'Feed',     icon: '✍️' },
  { key: 'forum',     label: 'Forum',    icon: '🗨️' },
  { key: 'mentorluk', label: 'Mentör',   icon: '🎓' },
  { key: 'sc',        label: 'S&C',      icon: '❓' },
  { key: 'icerik',    label: 'İçerik',   icon: '📦' },
  { key: 'form',      label: 'Form',     icon: '📬' },
  { key: 'total',     label: 'Toplam',   icon: '🔢' },
];

function getColVal(row: MutfakUserRow, col: ColKey): number {
  const a = row.actions;
  switch (col) {
    case 'ziyaret': return (
      a.visitHaberita + a.visitHaritakariyer + a.visitHaritakademi + a.visitHaritailesiTV +
      a.visitReklam + a.visitForum + a.visitMentorluk + a.visitSoruCevap + a.visitAnketler +
      a.visitHaritailesiVakfi + a.visitMutfak + a.visitMagaza + a.visitEgitimler +
      a.visitEtkinlikler + a.visitTalepGorus + a.visitBagis + a.visitIlanPanosu +
      a.visitHaritailesiGenc + a.visitYarismalar + a.visitSinavlar
    );
    case 'feed':      return a.posts + a.comments + a.reactions;
    case 'forum':     return a.forumQuestions + a.forumAnswers;
    case 'mentorluk': return a.mentorlukMenteeApplied + a.mentorlukMentorApplied + a.mentorSessions + a.menteeSessions;
    case 'sc':        return a.qaQuestions + a.qaAnswers;
    case 'icerik':    return (
      a.eventsAttended + a.etkinlikCreated + a.trainingsAccessed + a.egitimCreated +
      a.magazaProductCreated + a.magazaPurchased + a.ilanCreated + a.surveyAnswers + a.competitionEntries
    );
    case 'form':  return a.reklamFormSubmitted + a.talepFormSubmitted + a.bagisFormSubmitted;
    case 'total': return row.totalActions;
  }
}

// ─── Mock data (gösterim için, backend hazır olunca kalkar) ──────────────────

function mockActions(v: Partial<MutfakTierActions>): MutfakTierActions {
  const d: MutfakTierActions = {
    visitHaberita:0,visitHaritakariyer:0,visitHaritakademi:0,visitHaritailesiTV:0,
    visitReklam:0,visitForum:0,visitMentorluk:0,visitSoruCevap:0,visitAnketler:0,
    visitHaritailesiVakfi:0,visitMutfak:0,visitMagaza:0,visitEgitimler:0,visitEtkinlikler:0,
    visitTalepGorus:0,visitBagis:0,visitIlanPanosu:0,visitHaritailesiGenc:0,visitYarismalar:0,visitSinavlar:0,
    posts:0,comments:0,reactions:0,forumQuestions:0,forumAnswers:0,
    mentorlukMenteeApplied:0,mentorlukMentorApplied:0,mentorSessions:0,menteeSessions:0,
    qaQuestions:0,qaAnswers:0,surveyAnswers:0,competitionEntries:0,
    eventsAttended:0,etkinlikCreated:0,trainingsAccessed:0,egitimCreated:0,
    magazaProductCreated:0,magazaPurchased:0,ilanCreated:0,
    reklamFormSubmitted:0,talepFormSubmitted:0,bagisFormSubmitted:0,
  };
  return { ...d, ...v };
}

const MOCK_STATS: MutfakBehaviorStats = {
  generatedAt: new Date().toISOString(),
  periodMonths: 12,
  overview: {
    totalMutfakMembers: 147, activeLastMonth: 89,
    totalActionsThisPeriod: 18420, avgActionsPerMember: 125.3,
    topTier: 'individual_member', topTierActionCount: 6840,
  },
  tierMatrix: [
    {
      tier: 'registered_user', memberCount: 48, totalActions: 3186, avgActionsPerMember: 66.4,
      topAction: 'visitEtkinlikler',
      actions: mockActions({
        visitHaberita:312,visitHaritakariyer:287,visitHaritakademi:198,visitHaritailesiTV:156,
        visitReklam:89,visitForum:0,visitMentorluk:201,visitSoruCevap:178,visitAnketler:143,
        visitHaritailesiVakfi:67,visitMutfak:0,visitMagaza:234,visitEgitimler:189,visitEtkinlikler:267,
        visitTalepGorus:45,visitBagis:32,visitIlanPanosu:156,visitHaritailesiGenc:87,visitYarismalar:123,visitSinavlar:98,
        qaQuestions:78,qaAnswers:123,surveyAnswers:67,competitionEntries:34,
        eventsAttended:89,trainingsAccessed:45,magazaPurchased:12,ilanCreated:23,
        reklamFormSubmitted:8,talepFormSubmitted:15,bagisFormSubmitted:6,
      }),
    },
    {
      tier: 'haritailesi_genc', memberCount: 31, totalActions: 4102, avgActionsPerMember: 132.3,
      topAction: 'visitMutfak',
      actions: mockActions({
        visitHaberita:198,visitHaritakariyer:245,visitHaritakademi:187,visitHaritailesiTV:134,
        visitReklam:23,visitForum:312,visitMentorluk:289,visitSoruCevap:234,visitAnketler:198,
        visitHaritailesiVakfi:45,visitMutfak:456,visitMagaza:178,visitEgitimler:267,visitEtkinlikler:312,
        visitTalepGorus:34,visitBagis:23,visitIlanPanosu:145,visitHaritailesiGenc:198,visitYarismalar:145,visitSinavlar:87,
        posts:87,comments:134,reactions:223,forumQuestions:67,forumAnswers:89,
        mentorlukMenteeApplied:23,menteeSessions:19,
        qaQuestions:45,qaAnswers:78,surveyAnswers:56,competitionEntries:28,
        eventsAttended:67,etkinlikCreated:12,trainingsAccessed:89,egitimCreated:8,
        magazaProductCreated:7,magazaPurchased:34,ilanCreated:18,
        talepFormSubmitted:23,bagisFormSubmitted:12,
      }),
    },
    {
      tier: 'new_graduate_member', memberCount: 29, totalActions: 3987, avgActionsPerMember: 137.5,
      topAction: 'visitMutfak',
      actions: mockActions({
        visitHaberita:189,visitHaritakariyer:267,visitHaritakademi:198,visitHaritailesiTV:145,
        visitReklam:28,visitForum:298,visitMentorluk:312,visitSoruCevap:245,visitAnketler:189,
        visitHaritailesiVakfi:56,visitMutfak:434,visitMagaza:189,visitEgitimler:289,visitEtkinlikler:298,
        visitTalepGorus:38,visitBagis:28,visitIlanPanosu:167,visitHaritailesiGenc:123,visitYarismalar:134,visitSinavlar:78,
        posts:92,comments:145,reactions:234,forumQuestions:72,forumAnswers:98,
        mentorlukMenteeApplied:26,menteeSessions:22,
        qaQuestions:52,qaAnswers:89,surveyAnswers:61,competitionEntries:31,
        eventsAttended:72,etkinlikCreated:14,trainingsAccessed:95,egitimCreated:9,
        magazaProductCreated:9,magazaPurchased:38,ilanCreated:21,
        talepFormSubmitted:26,bagisFormSubmitted:14,
      }),
    },
    {
      tier: 'individual_member', memberCount: 26, totalActions: 6840, avgActionsPerMember: 263.1,
      topAction: 'visitMutfak',
      actions: mockActions({
        visitHaberita:245,visitHaritakariyer:312,visitHaritakademi:234,visitHaritailesiTV:178,
        visitReklam:67,visitForum:356,visitMentorluk:389,visitSoruCevap:312,visitAnketler:234,
        visitHaritailesiVakfi:89,visitMutfak:534,visitMagaza:245,visitEgitimler:312,visitEtkinlikler:356,
        visitTalepGorus:56,visitBagis:45,visitIlanPanosu:212,visitHaritailesiGenc:89,visitYarismalar:156,visitSinavlar:67,
        posts:134,comments:198,reactions:312,forumQuestions:89,forumAnswers:145,
        mentorlukMenteeApplied:18,mentorlukMentorApplied:15,mentorSessions:87,menteeSessions:23,
        qaQuestions:67,qaAnswers:123,surveyAnswers:78,competitionEntries:34,
        eventsAttended:89,etkinlikCreated:23,trainingsAccessed:112,egitimCreated:18,
        magazaProductCreated:15,magazaPurchased:45,ilanCreated:34,
        reklamFormSubmitted:12,talepFormSubmitted:34,bagisFormSubmitted:23,
      }),
    },
    {
      tier: 'corporate_member', memberCount: 13, totalActions: 2305, avgActionsPerMember: 177.3,
      topAction: 'mentorSessions',
      actions: mockActions({
        visitHaberita:123,visitHaritakariyer:156,visitHaritakademi:112,visitHaritailesiTV:89,
        visitReklam:78,visitForum:178,visitMentorluk:198,visitSoruCevap:156,visitAnketler:112,
        visitHaritailesiVakfi:67,visitMutfak:267,visitMagaza:134,visitEgitimler:156,visitEtkinlikler:178,
        visitTalepGorus:45,visitBagis:23,visitIlanPanosu:123,visitHaritailesiGenc:56,visitYarismalar:89,visitSinavlar:34,
        posts:67,comments:89,reactions:134,forumQuestions:34,forumAnswers:56,
        mentorlukMentorApplied:12,mentorSessions:67,
        qaQuestions:34,qaAnswers:56,surveyAnswers:34,competitionEntries:12,
        eventsAttended:45,etkinlikCreated:12,trainingsAccessed:56,egitimCreated:10,
        magazaProductCreated:12,magazaPurchased:23,ilanCreated:18,
        reklamFormSubmitted:23,talepFormSubmitted:15,bagisFormSubmitted:8,
      }),
    },
  ],
  monthlyTrend: [
    { month:'2025-06', total:820,  byTier:{ registered_user:180, haritailesi_genc:190, new_graduate_member:185, individual_member:195, corporate_member:70 } },
    { month:'2025-07', total:910,  byTier:{ registered_user:195, haritailesi_genc:210, new_graduate_member:205, individual_member:225, corporate_member:75 } },
    { month:'2025-08', total:870,  byTier:{ registered_user:185, haritailesi_genc:200, new_graduate_member:195, individual_member:215, corporate_member:75 } },
    { month:'2025-09', total:1120, byTier:{ registered_user:230, haritailesi_genc:265, new_graduate_member:258, individual_member:290, corporate_member:77 } },
    { month:'2025-10', total:1340, byTier:{ registered_user:265, haritailesi_genc:320, new_graduate_member:308, individual_member:365, corporate_member:82 } },
    { month:'2025-11', total:1480, byTier:{ registered_user:285, haritailesi_genc:355, new_graduate_member:342, individual_member:412, corporate_member:86 } },
    { month:'2025-12', total:1390, byTier:{ registered_user:270, haritailesi_genc:335, new_graduate_member:322, individual_member:378, corporate_member:85 } },
    { month:'2026-01', total:1580, byTier:{ registered_user:298, haritailesi_genc:380, new_graduate_member:367, individual_member:445, corporate_member:90 } },
    { month:'2026-02', total:1720, byTier:{ registered_user:318, haritailesi_genc:415, new_graduate_member:400, individual_member:492, corporate_member:95 } },
    { month:'2026-03', total:1890, byTier:{ registered_user:345, haritailesi_genc:458, new_graduate_member:442, individual_member:545, corporate_member:100 } },
    { month:'2026-04', total:2050, byTier:{ registered_user:372, haritailesi_genc:498, new_graduate_member:481, individual_member:594, corporate_member:105 } },
    { month:'2026-05', total:2250, byTier:{ registered_user:403, haritailesi_genc:548, new_graduate_member:529, individual_member:660, corporate_member:110 } },
  ],
  actionDistribution: [
    { key:'visitMutfak',        label:'Mutfak Ziyaret',     totalCount:1691, byTier:{ registered_user:0,    haritailesi_genc:456, new_graduate_member:434, individual_member:534, corporate_member:267 } },
    { key:'visitEtkinlikler',   label:'Etkinlik Ziyaret',   totalCount:1411, byTier:{ registered_user:267,  haritailesi_genc:312, new_graduate_member:298, individual_member:356, corporate_member:178 } },
    { key:'reactions',          label:'Reaksiyon',          totalCount:1003, byTier:{ registered_user:0,    haritailesi_genc:223, new_graduate_member:234, individual_member:312, corporate_member:134 } },
    { key:'visitMentorluk',     label:'Mentorluk Ziyaret',  totalCount:1389, byTier:{ registered_user:201,  haritailesi_genc:289, new_graduate_member:312, individual_member:389, corporate_member:198 } },
    { key:'comments',           label:'Yorum',              totalCount:566,  byTier:{ registered_user:0,    haritailesi_genc:134, new_graduate_member:145, individual_member:198, corporate_member:89  } },
    { key:'visitForum',         label:'Forum Ziyaret',      totalCount:1144, byTier:{ registered_user:0,    haritailesi_genc:312, new_graduate_member:298, individual_member:356, corporate_member:178 } },
    { key:'mentorSessions',     label:'Mentor Seans',       totalCount:154,  byTier:{ registered_user:0,    haritailesi_genc:0,   new_graduate_member:0,   individual_member:87,  corporate_member:67  } },
    { key:'posts',              label:'Gönderi',            totalCount:380,  byTier:{ registered_user:0,    haritailesi_genc:87,  new_graduate_member:92,  individual_member:134, corporate_member:67  } },
    { key:'trainingsAccessed',  label:'Eğitim Erişim',      totalCount:297,  byTier:{ registered_user:45,   haritailesi_genc:89,  new_graduate_member:95,  individual_member:112, corporate_member:56  } },
    { key:'eventsAttended',     label:'Etkinlik Katılım',   totalCount:362,  byTier:{ registered_user:89,   haritailesi_genc:67,  new_graduate_member:72,  individual_member:89,  corporate_member:45  } },
  ],
  topContributors: [
    { tier:'individual_member', userId:'u1', displayName:'Ahmet Yılmaz',  totalActions:412, topAction:'visitMutfak',    breakdown:{ visitMutfak:89,posts:34,comments:56,mentorSessions:18,reactions:67 } },
    { tier:'individual_member', userId:'u2', displayName:'Fatma Demir',   totalActions:389, topAction:'reactions',      breakdown:{ visitMutfak:76,posts:28,comments:45,reactions:89,forumAnswers:34 } },
    { tier:'haritailesi_genc',  userId:'u3', displayName:'Mehmet Kaya',   totalActions:356, topAction:'visitMutfak',    breakdown:{ visitMutfak:78,posts:45,comments:67,reactions:56,forumQuestions:23 } },
    { tier:'new_graduate_member',userId:'u4',displayName:'Ayşe Çelik',    totalActions:334, topAction:'comments',       breakdown:{ visitMutfak:72,posts:38,comments:78,reactions:48,trainingsAccessed:34 } },
    { tier:'corporate_member',  userId:'u5', displayName:'Harita A.Ş.',   totalActions:312, topAction:'mentorSessions', breakdown:{ visitMutfak:56,mentorSessions:34,reklamFormSubmitted:12,eventsAttended:23 } },
    { tier:'individual_member', userId:'u6', displayName:'Ali Şahin',     totalActions:298, topAction:'forumAnswers',   breakdown:{ visitMutfak:67,forumAnswers:56,forumQuestions:34,posts:23,reactions:45 } },
    { tier:'new_graduate_member',userId:'u7',displayName:'Zeynep Arslan',  totalActions:278, topAction:'visitMutfak',    breakdown:{ visitMutfak:68,posts:32,comments:54,reactions:43,eventsAttended:28 } },
    { tier:'haritailesi_genc',  userId:'u8', displayName:'Burak Yıldız',  totalActions:256, topAction:'reactions',      breakdown:{ visitMutfak:62,posts:28,comments:41,reactions:67,surveyAnswers:18 } },
  ],
  profileDepth: [
    { tier:'registered_user',    total:48, avgCompletionPct:34, withBio:16, withProfession:31, withCity:28, withLinkedIn:12 },
    { tier:'haritailesi_genc',   total:31, avgCompletionPct:61, withBio:21, withProfession:28, withCity:26, withLinkedIn:17 },
    { tier:'new_graduate_member',total:29, avgCompletionPct:67, withBio:22, withProfession:27, withCity:25, withLinkedIn:19 },
    { tier:'individual_member',  total:26, avgCompletionPct:78, withBio:23, withProfession:25, withCity:24, withLinkedIn:21 },
    { tier:'corporate_member',   total:13, avgCompletionPct:85, withBio:12, withProfession:13, withCity:11, withLinkedIn:10 },
  ],
  conversionByMonth: [
    { month:'2025-12', sahneSigned:34, mutfakConverted:12 },
    { month:'2026-01', sahneSigned:41, mutfakConverted:16 },
    { month:'2026-02', sahneSigned:38, mutfakConverted:17 },
    { month:'2026-03', sahneSigned:45, mutfakConverted:21 },
    { month:'2026-04', sahneSigned:52, mutfakConverted:26 },
    { month:'2026-05', sahneSigned:49, mutfakConverted:27 },
  ],
  cohortRetention: [
    { cohortMonth:'2025-12', size:12, active30d:10, active60d:8,  active90d:7  },
    { cohortMonth:'2026-01', size:16, active30d:14, active60d:11, active90d:9  },
    { cohortMonth:'2026-02', size:17, active30d:15, active60d:12, active90d:10 },
    { cohortMonth:'2026-03', size:21, active30d:18, active60d:14, active90d:0  },
    { cohortMonth:'2026-04', size:26, active30d:23, active60d:0,  active90d:0  },
    { cohortMonth:'2026-05', size:27, active30d:24, active60d:0,  active90d:0  },
  ],
};

const MOCK_USER_STATS: MutfakUserStatsPage = {
  total: 99,
  cursor: null,
  users: [
    { userId:'u1', displayName:'Ahmet Yılmaz',  email:'ahmet@example.com',  tier:'individual_member',   city:'Ankara',   profession:'Harita Mühendisi',        joinedAt:'2025-09-12', lastActiveAt:'2026-05-18', totalActions:412, actions: mockActions({ visitMutfak:89,posts:34,comments:56,mentorSessions:18,reactions:67,forumAnswers:34,visitEtkinlikler:45,trainingsAccessed:23,ilanCreated:12 }) },
    { userId:'u2', displayName:'Fatma Demir',   email:'fatma@example.com',  tier:'individual_member',   city:'İstanbul', profession:'CBS Uzmanı',               joinedAt:'2025-10-05', lastActiveAt:'2026-05-17', totalActions:389, actions: mockActions({ visitMutfak:76,posts:28,comments:45,reactions:89,forumAnswers:34,visitForum:67,qaAnswers:45,eventsAttended:23 }) },
    { userId:'u3', displayName:'Mehmet Kaya',   email:'mehmet@example.com', tier:'haritailesi_genc',    city:'İzmir',    profession:'Geomatik Öğrencisi',       joinedAt:'2025-11-20', lastActiveAt:'2026-05-19', totalActions:356, actions: mockActions({ visitMutfak:78,posts:45,comments:67,reactions:56,forumQuestions:23,mentorlukMenteeApplied:3,surveyAnswers:18,competitionEntries:7 }) },
    { userId:'u4', displayName:'Ayşe Çelik',   email:'ayse@example.com',   tier:'new_graduate_member', city:'Konya',    profession:'Geomatik Mühendisi',       joinedAt:'2025-12-08', lastActiveAt:'2026-05-16', totalActions:334, actions: mockActions({ visitMutfak:72,posts:38,comments:78,reactions:48,trainingsAccessed:34,etkinlikCreated:5,magazaPurchased:12 }) },
    { userId:'u5', displayName:'Harita A.Ş.',  email:'info@haritaas.com',  tier:'corporate_member',    city:'Ankara',   profession:'Temsilci',                 joinedAt:'2025-10-15', lastActiveAt:'2026-05-15', totalActions:312, actions: mockActions({ visitMutfak:56,mentorSessions:34,reklamFormSubmitted:12,eventsAttended:23,visitEgitimler:45,forumAnswers:23 }) },
    { userId:'u6', displayName:'Ali Şahin',    email:'ali@example.com',    tier:'individual_member',   city:'Bursa',    profession:'Kadastro Uzmanı',          joinedAt:'2025-08-30', lastActiveAt:'2026-05-18', totalActions:298, actions: mockActions({ visitMutfak:67,forumAnswers:56,forumQuestions:34,posts:23,reactions:45,mentorlukMentorApplied:5,mentorSessions:23 }) },
    { userId:'u7', displayName:'Zeynep Arslan', email:'zeynep@example.com', tier:'new_graduate_member', city:'Trabzon',  profession:'Geomatik Mühendisi',       joinedAt:'2026-01-14', lastActiveAt:'2026-05-17', totalActions:278, actions: mockActions({ visitMutfak:68,posts:32,comments:54,reactions:43,eventsAttended:28,mentorlukMenteeApplied:2,trainingsAccessed:22 }) },
    { userId:'u8', displayName:'Burak Yıldız', email:'burak@example.com',  tier:'haritailesi_genc',    city:'Samsun',   profession:'Harita Öğrencisi',         joinedAt:'2026-02-03', lastActiveAt:'2026-05-19', totalActions:256, actions: mockActions({ visitMutfak:62,posts:28,comments:41,reactions:67,surveyAnswers:18,competitionEntries:9,visitForum:34 }) },
    { userId:'u9', displayName:'Merve Güneş',  email:'merve@example.com',  tier:'individual_member',   city:'Antalya',  profession:'Uzaktan Algılama Uzm.',    joinedAt:'2025-09-22', lastActiveAt:'2026-05-14', totalActions:245, actions: mockActions({ visitMutfak:54,posts:19,comments:34,reactions:38,mentorSessions:15,etkinlikCreated:8,talepFormSubmitted:6 }) },
    { userId:'u10',displayName:'Emre Taş',     email:'emre@example.com',   tier:'haritailesi_genc',    city:'Erzurum',  profession:'Geomatik Öğrencisi',       joinedAt:'2026-01-28', lastActiveAt:'2026-05-16', totalActions:234, actions: mockActions({ visitMutfak:58,posts:24,comments:38,reactions:45,forumQuestions:12,mentorlukMenteeApplied:2,visitEtkinlikler:34 }) },
    { userId:'u11',displayName:'Deniz Erdoğan',email:'deniz@example.com',  tier:'new_graduate_member', city:'İstanbul', profession:'Harita Mühendisi',         joinedAt:'2025-11-10', lastActiveAt:'2026-05-13', totalActions:223, actions: mockActions({ visitMutfak:51,posts:21,comments:32,reactions:41,visitForum:38,egitimCreated:3,magazaProductCreated:4 }) },
    { userId:'u12',displayName:'Kemal Çetin',  email:'kemal@example.com',  tier:'corporate_member',    city:'İzmir',    profession:'Şirket Temsilcisi',        joinedAt:'2025-10-01', lastActiveAt:'2026-05-12', totalActions:198, actions: mockActions({ visitMutfak:45,mentorSessions:23,reklamFormSubmitted:8,eventsAttended:18,forumAnswers:15,ilanCreated:11 }) },
    { userId:'u13',displayName:'Büşra Polat',  email:'busra@example.com',  tier:'haritailesi_genc',    city:'Ankara',   profession:'Geomatik Öğrencisi',       joinedAt:'2026-03-05', lastActiveAt:'2026-05-18', totalActions:187, actions: mockActions({ visitMutfak:48,posts:18,comments:29,reactions:34,surveyAnswers:14,competitionEntries:6,visitEgitimler:23 }) },
    { userId:'u14',displayName:'Cem Aydın',    email:'cem@example.com',    tier:'individual_member',   city:'Ankara',   profession:'Fotogrametri Uzmanı',      joinedAt:'2025-12-20', lastActiveAt:'2026-05-11', totalActions:176, actions: mockActions({ visitMutfak:42,posts:15,comments:27,reactions:31,forumAnswers:22,mentorlukMentorApplied:3,mentorSessions:12 }) },
    { userId:'u15',displayName:'Nur Kılıç',    email:'nur@example.com',    tier:'registered_user',     city:'Konya',    profession:'Harita Teknisyeni',        joinedAt:'2025-07-15', lastActiveAt:'2026-05-10', totalActions:143, actions: mockActions({ visitEtkinlikler:34,visitMagaza:28,visitHaritakariyer:22,qaQuestions:18,qaAnswers:23,magazaPurchased:5,ilanCreated:8 }) },
    { userId:'u16',displayName:'Oğuz Doğan',   email:'oguz@example.com',   tier:'new_graduate_member', city:'Bursa',    profession:'CBS Uzmanı',               joinedAt:'2026-02-18', lastActiveAt:'2026-05-09', totalActions:134, actions: mockActions({ visitMutfak:38,posts:12,comments:21,reactions:28,trainingsAccessed:19,etkinlikCreated:2 }) },
    { userId:'u17',displayName:'Hatice Şimşek',email:'hatice@example.com', tier:'registered_user',     city:'Adana',    profession:'Geomatik Mühendisi',       joinedAt:'2025-06-08', lastActiveAt:'2026-05-05', totalActions:128, actions: mockActions({ visitEtkinlikler:31,visitHaritakariyer:25,visitMentorluk:28,qaQuestions:14,eventsAttended:12,talepFormSubmitted:5 }) },
    { userId:'u18',displayName:'Selin Avcı',   email:'selin@example.com',  tier:'haritailesi_genc',    city:'İstanbul', profession:'Harita Öğrencisi',         joinedAt:'2026-04-02', lastActiveAt:'2026-05-17', totalActions:112, actions: mockActions({ visitMutfak:34,posts:9,comments:17,reactions:22,surveyAnswers:10,competitionEntries:4,forumQuestions:6 }) },
    { userId:'u19',displayName:'GeoSoft Ltd.',  email:'info@geosoft.com',   tier:'corporate_member',    city:'İstanbul', profession:'Temsilci',                 joinedAt:'2025-11-30', lastActiveAt:'2026-05-08', totalActions:98,  actions: mockActions({ visitMutfak:28,mentorSessions:12,reklamFormSubmitted:6,visitForum:18,eventsAttended:11 }) },
    { userId:'u20',displayName:'Tarık Boz',    email:'tarik@example.com',  tier:'registered_user',     city:'İzmir',    profession:'Kadastro Uzmanı',          joinedAt:'2025-08-20', lastActiveAt:'2026-04-28', totalActions:87,  actions: mockActions({ visitEtkinlikler:22,visitMagaza:18,visitIlanPanosu:16,qaAnswers:14,magazaPurchased:3,bagisFormSubmitted:2 }) },
  ],
};

// ─── Main Tab Component ───────────────────────────────────────────────────────

export default function MutfakIstatistikleri({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<MutfakBehaviorStats | null>(null);
  const [period, setPeriod] = useState<3 | 6 | 12>(12);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [matrixMode, setMatrixMode] = useState<'raw' | 'per_member'>('per_member');
  const [matrixVisible, setMatrixVisible] = useState(false);

  // ── Per-user table state ──
  const [userStats, setUserStats] = useState<MutfakUserStatsPage | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userTierFilter, setUserTierFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userSortCol, setUserSortCol] = useState<ColKey>('total');
  const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('desc');
  const [userExpanded, setUserExpanded] = useState<string | null>(null);
  const [userPeriod, setUserPeriod] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    setLoading(true);
    setMatrixVisible(false);
    adminApi.getMutfakBehaviorStats(period)
      .then(s => { setStats(s); setBackendReady(true); })
      .catch(() => { setStats(MOCK_STATS); setBackendReady(true); })
      .finally(() => {
        setLoading(false);
        setTimeout(() => setMatrixVisible(true), 150);
      });
  }, [period, refreshKey]);

  useEffect(() => {
    setUserLoading(true);
    setUserExpanded(null);
    const periodMonths = userPeriod === 7 ? 0.25 : userPeriod === 30 ? 1 : 3;
    adminApi.getMutfakUserStats({
      period: periodMonths,
      ...(userTierFilter !== 'all' ? { tier: userTierFilter } : {}),
      limit: 200,
    })
      .then(data => setUserStats(data))
      .catch(() => setUserStats(MOCK_USER_STATS))
      .finally(() => setUserLoading(false));
  }, [userTierFilter, userPeriod, refreshKey]);

  const filteredUsers = React.useMemo(() => {
    if (!userStats) return [];
    let list = userStats.users;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter(u =>
        (u.displayName ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = getColVal(a, userSortCol);
      const bv = getColVal(b, userSortCol);
      return userSortDir === 'desc' ? bv - av : av - bv;
    });
  }, [userStats, userSearch, userSortCol, userSortDir]);

  function toggleSort(col: ColKey) {
    if (userSortCol === col) setUserSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setUserSortCol(col); setUserSortDir('desc'); }
  }

  const activeTiers: string[] = backendReady && stats
    ? TIER_ORDER.filter(t => (stats.tierMatrix.find(r => r.tier === t)?.memberCount ?? 0) > 0)
    : [...TIER_ORDER];

  const colMax: Record<keyof MutfakTierActions, number> = {} as Record<keyof MutfakTierActions, number>;
  if (stats) {
    for (const ac of ACTION_CFG) {
      colMax[ac.key] = Math.max(...stats.tierMatrix.map(row => {
        const raw = row.actions[ac.key];
        return matrixMode === 'per_member' ? (row.memberCount > 0 ? raw / row.memberCount : 0) : raw;
      }), 0.01);
    }
  }

  return (
    <>
      {/* Inject keyframe styles once */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="space-y-6">

        {/* ── Header controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <p className="text-xs text-gray-400">
              Üye başına davranışsal eğilim analizi — oyunlaştırma öncesi taban ölçümü
            </p>
            <LiveBadge />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Dönem:</span>
            {([3, 6, 12] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  period === p
                    ? 'bg-[#26496b] text-white shadow-sm scale-105'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p} Ay
              </button>
            ))}
          </div>
        </div>

        {/* ── Overview KPIs ── */}
        {backendReady && stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Mutfak Üyesi',          value: stats.overview.totalMutfakMembers,         icon: '👥', color: 'bg-[#26496b] text-white' },
              { label: 'Son 30g Aktif',          value: stats.overview.activeLastMonth,             icon: '⚡', color: 'bg-teal-600 text-white'  },
              { label: `${period}A Toplam Aksiyon`, value: stats.overview.totalActionsThisPeriod,  icon: '🎯', color: 'bg-blue-600 text-white'   },
              { label: 'Ort. Aksiyon/Üye',       value: stats.overview.avgActionsPerMember,        icon: '📈', color: 'bg-violet-600 text-white' },
            ].map((item, i) => (
              <KpiCard key={item.label} {...item} delay={i * 60} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 m-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-10 h-10 rounded-xl m-shimmer-bg mb-3" />
                <Shimmer h="h-7" w="w-16" rounded="rounded-lg" />
                <div className="mt-2"><Shimmer h="h-3" w="w-24" /></div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tier Davranış Matrisi ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#26496b] text-white flex items-center justify-center text-xs font-bold">M</span>
              <span className="font-semibold text-gray-800 text-sm">Tier Davranış Matrisi</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['per_member', 'raw'] as const).map(mode => (
                <button key={mode} onClick={() => setMatrixMode(mode)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    matrixMode === mode ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {mode === 'per_member' ? 'Üye Başına' : 'Ham Sayı'}
                </button>
              ))}
            </div>
          </div>

          {backendReady && stats ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="pl-5 pr-3 py-3 text-left font-semibold text-gray-500 whitespace-nowrap w-44">Üye Tipi</th>
                    <th className="px-2 py-3 text-center font-semibold text-gray-500 whitespace-nowrap w-16">Üye</th>
                    {ACTION_CFG.map(ac => (
                      <th key={ac.key} className="px-2 py-3 text-center font-semibold text-gray-500 whitespace-nowrap">
                        <span title={ac.label}>{ac.icon}</span>
                        <div className="text-[9px] font-normal text-gray-400 mt-0.5 hidden sm:block">{ac.label}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-semibold text-gray-500 whitespace-nowrap w-20">Ort.Top</th>
                    <th className="pl-3 pr-5 py-3 text-left font-semibold text-gray-500 whitespace-nowrap">En Sık</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER_ORDER.map((tier, rowIdx) => {
                    const row = stats.tierMatrix.find(r => r.tier === tier);
                    const cfg = TIER_CFG[tier]!;
                    if (!row) return null;
                    const topActionCfg = row.topAction ? ACTION_CFG.find(a => a.key === row.topAction) : null;
                    return (
                      <tr key={tier}
                        className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors duration-150 m-fade-in"
                        style={{ animationDelay: `${rowIdx * 70}ms` }}>
                        <td className="pl-5 pr-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: cfg.color }} />
                            <span className="font-semibold text-gray-800 text-[11px]">{cfg.label}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className="font-bold text-gray-900">{row.memberCount.toLocaleString('tr-TR')}</span>
                        </td>
                        {ACTION_CFG.map((ac, colIdx) => {
                          const rawVal = row.actions[ac.key];
                          const displayVal = matrixMode === 'per_member'
                            ? (row.memberCount > 0 ? rawVal / row.memberCount : 0)
                            : rawVal;
                          const cellColor = heatColor(displayVal, colMax[ac.key] ?? 1);
                          return (
                            <td key={ac.key} className="px-1 py-2 text-center">
                              <div
                                className={`mx-auto w-12 h-8 rounded-md flex items-center justify-center font-semibold tabular-nums text-[11px] transition-all duration-300 ${cellColor} ${matrixVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                                style={{ transitionDelay: `${rowIdx * 60 + colIdx * 20}ms` }}>
                                {matrixMode === 'per_member'
                                  ? (displayVal > 0 ? displayVal.toFixed(1) : '—')
                                  : (rawVal > 0 ? rawVal.toLocaleString('tr-TR') : '—')
                                }
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-[#26496b]">
                            {matrixMode === 'per_member'
                              ? (row.memberCount > 0 ? row.avgActionsPerMember.toFixed(1) : '—')
                              : row.totalActions.toLocaleString('tr-TR')
                            }
                          </span>
                        </td>
                        <td className="pl-3 pr-5 py-3">
                          {topActionCfg ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600">
                              <span>{topActionCfg.icon}</span>
                              <span>{topActionCfg.label}</span>
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="px-5 py-3 border-t border-gray-50 flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Yoğunluk:</span>
                {[
                  { cls: 'bg-blue-50 text-blue-500', label: 'Düşük' },
                  { cls: 'bg-blue-100 text-blue-700', label: '' },
                  { cls: 'bg-blue-200 text-blue-800', label: 'Orta' },
                  { cls: 'bg-blue-400 text-white', label: '' },
                  { cls: 'bg-blue-600 text-white', label: 'Yüksek' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`w-5 h-4 rounded text-[9px] flex items-center justify-center ${item.cls}`}>{item.label && '■'}</div>
                    {item.label && <span className="text-[10px] text-gray-500">{item.label}</span>}
                  </div>
                ))}
                <span className="text-[10px] text-gray-400 ml-auto">
                  {matrixMode === 'per_member' ? '* Üye başına ortalama aksiyon sayısı' : '* Seçilen dönemdeki toplam sayı'}
                </span>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4"><DataPending /></div>
          )}
        </div>

        {/* ── İki kolon: Trend + Aksiyon Dağılımı ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs">📊</span>
              <span className="font-semibold text-gray-800 text-sm">Aylık Aksiyon Trendi</span>
            </div>
            {backendReady && stats?.monthlyTrend.length ? (
              <>
                <TrendChart data={stats.monthlyTrend} tiers={activeTiers} />
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {activeTiers.map((t, i) => {
                    const cfg = TIER_CFG[t]!;
                    return (
                      <div key={t} className="flex items-center gap-1.5 text-[10px] text-gray-500 m-fade-in"
                        style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cfg.color }} />
                        {cfg.short}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <DataPending />}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-xs">🎯</span>
              <span className="font-semibold text-gray-800 text-sm">Aksiyon Dağılımı</span>
            </div>
            {backendReady && stats?.actionDistribution.length ? (
              <div className="space-y-2.5">
                {stats.actionDistribution.slice(0, 10).map((item, i) => {
                  const maxCount = Math.max(...stats.actionDistribution.map(d => d.totalCount), 1);
                  const pct = Math.round((item.totalCount / maxCount) * 100);
                  const ac = ACTION_CFG.find(a => a.key === item.key);
                  return (
                    <div key={item.key} className="flex items-center gap-2.5 m-fade-in"
                      style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="text-base leading-none w-5 text-center shrink-0">{ac?.icon ?? '•'}</span>
                      <div className="w-20 shrink-0 text-xs text-gray-600 truncate">{item.label}</div>
                      <AnimatedBar pct={pct} color={ac?.color ?? 'bg-gray-400'} delay={i * 50} />
                      <div className="w-12 text-right text-xs font-semibold text-gray-500 tabular-nums">
                        {item.totalCount.toLocaleString('tr-TR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <DataPending />}
          </div>
        </div>

        {/* ── Profil Derinliği + Top Üyeler ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">🪪</span>
              <span className="font-semibold text-gray-800 text-sm">Profil Derinlik Analizi</span>
            </div>
            {backendReady && stats?.profileDepth.length ? (
              <div className="space-y-4">
                {stats.profileDepth.map((row, i) => {
                  const cfg = TIER_CFG[row.tier];
                  if (!cfg) return null;
                  return <ProfileDepthRow key={row.tier} row={row} cfg={cfg} i={i} />;
                })}
              </div>
            ) : <DataPending />}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">🏆</span>
              <span className="font-semibold text-gray-800 text-sm">En Aktif Üyeler</span>
            </div>
            {backendReady && stats?.topContributors.length ? (
              <div className="space-y-1">
                {stats.topContributors.slice(0, 8).map((user, i) => {
                  const cfg = TIER_CFG[user.tier];
                  const ac = ACTION_CFG.find(a => a.key === user.topAction);
                  const medal = i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400';
                  return (
                    <div key={user.userId}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 m-slide-up hover:bg-gray-50/50 rounded-lg px-1 -mx-1 transition-colors cursor-default"
                      style={{ animationDelay: `${i * 55}ms` }}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${medal}`}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{user.displayName ?? 'Anonim'}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {cfg && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />}
                          <span className="text-[10px] text-gray-400">{cfg?.short}</span>
                          {ac && <span className="text-[10px] text-gray-400">· en çok: {ac.icon} {ac.label}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-[#26496b] tabular-nums">{user.totalActions.toLocaleString('tr-TR')}</div>
                        <div className="text-[10px] text-gray-400">aksiyon</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <DataPending />}
          </div>
        </div>

        {/* ── Dönüşüm + Kohort ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">🔄</span>
              <span className="font-semibold text-gray-800 text-sm">Sahne → Mutfak Dönüşüm</span>
            </div>
            {backendReady && stats?.conversionByMonth.length ? (
              <div className="space-y-2.5">
                {stats.conversionByMonth.slice(-6).map((row, i) => {
                  const [yr, mon] = row.month.split('-');
                  const label = new Date(Number(yr), Number(mon) - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                  const rate = row.sahneSigned > 0 ? Math.round((row.mutfakConverted / row.sahneSigned) * 100) : 0;
                  return (
                    <div key={row.month} className="flex items-center gap-3 m-fade-in"
                      style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="w-24 text-[11px] text-gray-500 shrink-0 truncate">{label}</div>
                      <AnimatedBar pct={Math.max(rate, rate > 0 ? 5 : 0)} color="bg-emerald-400" delay={i * 60} />
                      <div className="w-20 text-right text-[11px] shrink-0">
                        <span className="font-semibold text-emerald-700">%{rate}</span>
                        <span className="text-gray-400 ml-1">({row.mutfakConverted}/{row.sahneSigned})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <DataPending />}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">📅</span>
              <span className="font-semibold text-gray-800 text-sm">Kohort Tutundurma</span>
            </div>
            {backendReady && stats?.cohortRetention.length ? (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pl-5 pr-3 py-2 text-left font-semibold text-gray-500">Kohort</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-500 w-14">Boyut</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-500 w-14">30g</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-500 w-14">60g</th>
                      <th className="pl-3 pr-5 py-2 text-center font-semibold text-gray-500 w-14">90g</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.cohortRetention.slice(-6).map((row, i) => {
                      const [yr, mon] = row.cohortMonth.split('-');
                      const label = new Date(Number(yr), Number(mon) - 1, 1).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
                      const r30 = row.size > 0 ? Math.round((row.active30d / row.size) * 100) : 0;
                      const r60 = row.size > 0 ? Math.round((row.active60d / row.size) * 100) : 0;
                      const r90 = row.size > 0 ? Math.round((row.active90d / row.size) * 100) : 0;
                      function retentionColor(r: number) {
                        return r >= 60 ? 'text-emerald-700 font-bold' : r >= 40 ? 'text-amber-700 font-semibold' : 'text-gray-400';
                      }
                      return (
                        <tr key={row.cohortMonth}
                          className="border-b border-gray-50 hover:bg-gray-50/40 m-fade-in"
                          style={{ animationDelay: `${i * 50}ms` }}>
                          <td className="pl-5 pr-3 py-2 font-semibold text-gray-700">{label}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.size}</td>
                          <td className={`px-3 py-2 text-center ${retentionColor(r30)}`}>%{r30}</td>
                          <td className={`px-3 py-2 text-center ${retentionColor(r60)}`}>%{r60}</td>
                          <td className={`pl-3 pr-5 py-2 text-center ${retentionColor(r90)}`}>%{r90}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <DataPending />}
          </div>
        </div>

        {/* ── Kullanıcı Bazlı Aksiyon Tablosu ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#26496b] text-white flex items-center justify-center text-sm font-bold">U</span>
                <span className="font-semibold text-gray-800 text-sm">Üye Bazlı Aksiyon Tablosu</span>
                {userStats && (
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
                    {userStats.total.toLocaleString('tr-TR')} üye
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  {([7, 30, 90] as const).map(d => (
                    <button key={d} onClick={() => setUserPeriod(d)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                        userPeriod === d ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                      {d === 7 ? 'Bu Hafta' : d === 30 ? 'Bu Ay' : 'Son 3 Ay'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Üye ara…"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#26496b] bg-white w-36"
                  />
                  <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button
                onClick={() => setUserTierFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all duration-150 ${
                  userTierFilter === 'all' ? 'bg-[#26496b] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >Tüm Üyeler</button>
              {TIER_ORDER.map(tier => {
                const cfg = TIER_CFG[tier]!;
                const isActive = userTierFilter === tier;
                return (
                  <button key={tier} onClick={() => setUserTierFilter(tier)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all duration-150 ${
                      isActive ? 'text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                    style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : { borderColor: '#e5e7eb' }}>
                    {cfg.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tier başına en aktif üye — 5 kart */}
          {!userLoading && userStats && userPeriod <= 30 && (
            <div className="px-5 pt-4 pb-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                {userPeriod === 7 ? 'Bu Haftanın En Aktifi — Tier Bazında' : 'Bu Ayın En Aktifi — Tier Bazında'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {TIER_ORDER.map((tier, i) => {
                  const cfg = TIER_CFG[tier]!;
                  const top = userStats.users
                    .filter(u => u.tier === tier)
                    .sort((a, b) => b.totalActions - a.totalActions)[0];
                  return (
                    <div key={tier}
                      className="rounded-xl border p-3 flex flex-col gap-2 m-slide-up"
                      style={{ backgroundColor: cfg.color + '08', borderColor: cfg.color + '30', animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] shrink-0"
                          style={{ backgroundColor: cfg.color + '20' }}>
                          {i === 0 ? '👤' : i === 1 ? '🌱' : i === 2 ? '🎓' : i === 3 ? '⭐' : '🏢'}
                        </div>
                        <span className="text-[10px] font-bold truncate" style={{ color: cfg.color }}>{cfg.short}</span>
                      </div>
                      {top ? (
                        <>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-800 truncate leading-tight">{top.displayName ?? 'Anonim'}</div>
                            <div className="text-[10px] text-gray-400 truncate mt-0.5">{top.profession ?? top.city ?? '—'}</div>
                          </div>
                          <div className="flex items-baseline gap-1 mt-auto">
                            <span className="text-base font-bold tabular-nums" style={{ color: cfg.color }}>
                              {top.totalActions.toLocaleString('tr-TR')}
                            </span>
                            <span className="text-[9px] text-gray-400">aksiyon</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-gray-300 italic">Veri yok</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table or states */}
          {userLoading ? (
            <div className="px-5 py-6"><DataPending /></div>
          ) : !filteredUsers.length ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <span className="text-3xl mb-3">🔍</span>
              <p className="text-sm font-medium">Eşleşen üye yok</p>
              <p className="text-xs mt-1">Filtreyi değiştirmeyi veya arama terimini temizlemeyi deneyin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="pl-5 pr-3 py-3 text-left font-semibold text-gray-500 whitespace-nowrap w-52">#  Üye</th>
                    {COL_DEFS.map(col => (
                      <th key={col.key}
                        className="px-2 py-3 text-center font-semibold text-gray-500 whitespace-nowrap cursor-pointer hover:text-gray-700 select-none"
                        onClick={() => toggleSort(col.key)}>
                        <span className="flex items-center justify-center gap-0.5">
                          <span>{col.icon} {col.label}</span>
                          {userSortCol === col.key && (
                            <span className="text-[#26496b] ml-0.5">{userSortDir === 'desc' ? '↓' : '↑'}</span>
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="pl-2 pr-5 py-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 50).map((user, rowIdx) => {
                    const cfg = TIER_CFG[user.tier];
                    const isExpanded = userExpanded === user.userId;
                    const isTop = rowIdx === 0 && userPeriod <= 30;
                    return (
                      <React.Fragment key={user.userId}>
                        <tr
                          className={`border-t border-gray-50 transition-colors duration-150 cursor-pointer ${
                            isTop ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-gray-50/60'
                          }`}
                          onClick={() => setUserExpanded(isExpanded ? null : user.userId)}>
                          <td className="pl-5 pr-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {rowIdx < 3 ? (
                                <span className="text-base shrink-0 leading-none">{['🥇','🥈','🥉'][rowIdx]}</span>
                              ) : (
                                <span className="w-5 text-center text-[10px] font-bold text-gray-300 shrink-0">{rowIdx + 1}</span>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-800 text-xs truncate max-w-[140px]">
                                  {user.displayName ?? 'Anonim'}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {cfg && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />}
                                  <span className="text-[10px] text-gray-400">{cfg?.short ?? user.tier}</span>
                                  {user.city && <span className="text-[10px] text-gray-300 truncate">· {user.city}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          {COL_DEFS.map(col => {
                            const v = getColVal(user, col.key);
                            const isSorted = userSortCol === col.key;
                            return (
                              <td key={col.key} className="px-2 py-2.5 text-center">
                                <span className={`tabular-nums ${
                                  v === 0 ? 'text-gray-200' : isSorted ? 'font-bold text-[#26496b]' : 'font-semibold text-gray-700'
                                }`}>
                                  {v === 0 ? '—' : v.toLocaleString('tr-TR')}
                                </span>
                              </td>
                            );
                          })}
                          <td className="pl-2 pr-5 py-2.5 text-center">
                            <span className={`text-gray-400 text-xs inline-block transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-t border-[#26496b]/10 bg-slate-50/70">
                            <td colSpan={COL_DEFS.length + 2} className="px-5 py-4">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Aksiyon Dökümü</div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                                {Object.entries(
                                  ACTION_CFG.reduce<Record<string, ActionCfgItem[]>>((acc, ac) => {
                                    (acc[ac.group] ??= []).push(ac);
                                    return acc;
                                  }, {})
                                ).map(([group, items]) => (
                                  <div key={group} className="bg-white rounded-xl border border-gray-100 p-3">
                                    <div className="text-[10px] font-bold mb-2 flex items-center gap-1.5"
                                      style={{ color: GROUP_COLORS[group] ?? '#6b7280' }}>
                                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[group] ?? '#6b7280' }} />
                                      {group}
                                    </div>
                                    <div className="space-y-1.5">
                                      {items.map(ac => {
                                        const v = user.actions[ac.key];
                                        return (
                                          <div key={ac.key} className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                                              <span className="shrink-0">{ac.icon}</span>
                                              <span className="truncate">{ac.label}</span>
                                            </span>
                                            <span className={`text-[11px] font-bold tabular-nums shrink-0 ${v === 0 ? 'text-gray-200' : 'text-gray-700'}`}>
                                              {v === 0 ? '—' : v.toLocaleString('tr-TR')}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-gray-400 border-t border-gray-100 pt-3">
                                <span>E-posta: <span className="font-mono text-gray-600">{user.email ?? '—'}</span></span>
                                <span>Meslek: <span className="text-gray-600">{user.profession ?? '—'}</span></span>
                                <span>Katılım: <span className="text-gray-600">{new Date(user.joinedAt).toLocaleDateString('tr-TR')}</span></span>
                                {user.lastActiveAt && (
                                  <span>Son aktif: <span className="text-gray-600">{new Date(user.lastActiveAt).toLocaleDateString('tr-TR')}</span></span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length > 50 && (
                <div className="px-5 py-3 border-t border-gray-50 text-center text-xs text-gray-400">
                  +{(filteredUsers.length - 50).toLocaleString('tr-TR')} üye daha gösterilmiyor — limit 50 (API pagination ile genişletilecek)
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
