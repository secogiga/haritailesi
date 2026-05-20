'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, type DashboardStats, type SahneStats, type OnboardingMetrics, type OnboardingInsights, type CommunityHealth } from '@/lib/api';
import UyeIstatistikleri from './_uyeler';
import SahneIstatistikleri from './_sahne';
import MutfakIstatistikleri from './_mutfak';
import OnboardingIstatistikleri from './_onboarding';
import InsightsPanel from './_insights';
import CommunityHealthPanel from './_community-health';

type Tab = 'uyeler' | 'sahne' | 'mutfak' | 'onboarding' | 'community';
type OnboardingSubTab = 'metrics' | 'insights';

const TABS = [
  {
    id: 'uyeler',
    label: 'Üye İstatistikleri',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'sahne',
    label: 'Sahne İstatistikleri',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    id: 'mutfak',
    label: 'Mutfak İstatistikleri',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'community',
    label: 'Topluluk Sağlığı',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
] satisfies { id: Tab; label: string; icon: React.ReactNode }[];

export default function IstatistiklerPage() {
  const [tab, setTab] = useState<Tab>('uyeler');
  const [onboardingSubTab, setOnboardingSubTab] = useState<OnboardingSubTab>('insights');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [uyeStats, setUyeStats] = useState<DashboardStats | null>(null);
  const [sahneStats, setSahneStats] = useState<SahneStats | null>(null);
  const [onboardingStats, setOnboardingStats] = useState<OnboardingMetrics | null>(null);
  const [insightsData, setInsightsData] = useState<OnboardingInsights | null>(null);
  const [communityHealth, setCommunityHealth] = useState<CommunityHealth | null>(null);

  function load() {
    setLoading(true);
    Promise.allSettled([
      adminApi.getDashboardStats(),
      adminApi.getSahneStats(),
      adminApi.getOnboardingMetrics(),
      adminApi.getOnboardingInsights(),
      adminApi.getCommunityHealth(),
    ]).then(([uyeResult, sahneResult, onboardingResult, insightsResult, healthResult]) => {
      if (uyeResult.status === 'fulfilled') setUyeStats(uyeResult.value);
      if (sahneResult.status === 'fulfilled') setSahneStats(sahneResult.value);
      if (onboardingResult.status === 'fulfilled') setOnboardingStats(onboardingResult.value);
      if (insightsResult.status === 'fulfilled') setInsightsData(insightsResult.value);
      if (healthResult.status === 'fulfilled') setCommunityHealth(healthResult.value);
      setLastUpdated(new Date());
    }).finally(() => {
      setLoading(false);
      setRefreshKey(k => k + 1);
    });
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const now = new Date();

  return (
    <div className="max-w-6xl space-y-5">

      {/* ── Başlık ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform İstatistikleri</h1>
          {lastUpdated && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {' · '}
              {now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Yenile
        </button>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tab === 'uyeler' && (
        <UyeIstatistikleri stats={uyeStats} loading={loading} />
      )}
      {tab === 'sahne' && (
        <SahneIstatistikleri stats={sahneStats} loading={loading} />
      )}
      {tab === 'mutfak' && (
        <MutfakIstatistikleri refreshKey={refreshKey} />
      )}
      {tab === 'onboarding' && (
        <div>
          {/* Sub-tab switcher */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
            {([
              { id: 'insights' as OnboardingSubTab, label: 'Ürün Zekası' },
              { id: 'metrics'  as OnboardingSubTab, label: 'Metrikler' },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setOnboardingSubTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  onboardingSubTab === t.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {onboardingSubTab === 'insights' && (
            <InsightsPanel data={insightsData} loading={loading} />
          )}
          {onboardingSubTab === 'metrics' && (
            <OnboardingIstatistikleri data={onboardingStats} loading={loading} />
          )}
        </div>
      )}
      {tab === 'community' && (
        <CommunityHealthPanel data={communityHealth} loading={loading} />
      )}

    </div>
  );
}
