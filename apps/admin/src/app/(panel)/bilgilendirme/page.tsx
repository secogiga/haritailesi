'use client';

import { useState } from 'react';
import { TIER_CFG, TIER_ORDER, ACTION_CFG, GROUP_COLORS, TIER_CAPABILITIES } from '@/lib/mutfak-data';

const STYLES = `
@keyframes b-slide-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes b-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes b-ping-slow {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%       { transform: scale(1.6); opacity: 0; }
}
.b-slide-up { animation: b-slide-up 0.48s cubic-bezier(.22,1,.36,1) both; }
.b-fade-in  { animation: b-fade-in  0.4s ease both; }
`;

const GROUP_ORDER = ['Ziyaret', 'Feed', 'Forum', 'Mentorluk', 'S&C', 'Etkinlik', 'Eğitim', 'Mağaza', 'İlan', 'Form', 'Diğer'];

const GROUP_ICONS: Record<string, string> = {
  Ziyaret: '👁️', Feed: '✍️', Forum: '🗨️', Mentorluk: '🎓',
  'S&C': '❓', Etkinlik: '📅', Eğitim: '🎯', Mağaza: '🛍️',
  İlan: '🏷️', Form: '📬', Diğer: '📊',
};

const allTierKeys = TIER_CAPABILITIES.map(tc => tc.tier);
const allGroupKeys = GROUP_ORDER.filter(g => ACTION_CFG.some(a => a.group === g));

function SectionHeader({
  label,
  allKeys,
  collapsed,
  onToggleAll,
  extra,
}: {
  label: string;
  allKeys: string[];
  collapsed: Set<string>;
  onToggleAll: () => void;
  extra?: React.ReactNode;
}) {
  const allCollapsed = collapsed.size === allKeys.length;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-400">{label}</span>
          {extra}
        </div>
        <button
          onClick={onToggleAll}
          className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors shrink-0"
        >
          <svg className="w-3 h-3 transition-transform duration-200" style={{ transform: allCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {allCollapsed ? 'Tümünü Genişlet' : 'Tümünü Daralt'}
        </button>
      </div>
      <div className="h-px bg-gray-200" />
    </div>
  );
}

export default function BilgilendirmePage() {
  // Tier cards — default all collapsed
  const [tierCollapsed, setTierCollapsed] = useState<Set<string>>(new Set(allTierKeys));
  // Action groups — default all collapsed
  const [groupCollapsed, setGroupCollapsed] = useState<Set<string>>(new Set(allGroupKeys));

  function toggleTier(tier: string) {
    setTierCollapsed(prev => { const n = new Set(prev); n.has(tier) ? n.delete(tier) : n.add(tier); return n; });
  }
  function toggleAllTiers() {
    setTierCollapsed(tierCollapsed.size < allTierKeys.length ? new Set(allTierKeys) : new Set());
  }

  function toggleGroup(group: string) {
    setGroupCollapsed(prev => { const n = new Set(prev); n.has(group) ? n.delete(group) : n.add(group); return n; });
  }
  function toggleAllGroups() {
    setGroupCollapsed(groupCollapsed.size < allGroupKeys.length ? new Set(allGroupKeys) : new Set());
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bilgilendirme</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform üye tipleri, erişim kapsamları ve takip edilen aksiyon tipleri.
          </p>
        </div>

        {/* ══ ÜYE TİPİ AKSİYON REHBERİ ════════════════════════════════════════ */}
        <div>
          <SectionHeader
            label="Üye Tipi Aksiyon Rehberi"
            allKeys={allTierKeys}
            collapsed={tierCollapsed}
            onToggleAll={toggleAllTiers}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
            {TIER_CAPABILITIES.map((tc, i) => {
              const cfg = TIER_CFG[tc.tier]!;
              const isOpen = !tierCollapsed.has(tc.tier);
              const totalItems = tc.sections.reduce((s, sec) => s + sec.items.length, 0);

              return (
                <div key={tc.tier}
                  className="bg-white rounded-2xl border shadow-sm overflow-hidden ring-1 b-slide-up"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    ['--tw-ring-color' as string]: cfg.color + '40',
                  }}>
                  {/* Header — clickable */}
                  <button
                    onClick={() => toggleTier(tc.tier)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left relative overflow-hidden hover:brightness-95 transition-all"
                    style={{ backgroundColor: cfg.color + '12' }}
                  >
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full opacity-10 blur-xl"
                      style={{ backgroundColor: cfg.color }} />
                    <span className="text-xl relative z-10">{tc.emoji}</span>
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="font-bold text-sm leading-tight" style={{ color: cfg.color }}>{cfg.label}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{tc.tier}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full relative z-10"
                      style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>
                      {totalItems}
                    </span>
                    <svg
                      className="w-4 h-4 relative z-10 transition-transform duration-200 shrink-0"
                      style={{ color: cfg.color, opacity: 0.6, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Capabilities body */}
                  {isOpen && (
                    <div className="px-4 py-4 space-y-4 border-t border-gray-100 b-fade-in">
                      {tc.sections.map(section => (
                        <div key={section.title}>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{section.title}</div>
                          <ul className="space-y-1.5">
                            {section.items.map((item, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                  style={{ backgroundColor: cfg.color }} />
                                <span className="text-xs text-gray-700 leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ ÜYE AKSİYON TİPLERİ ════════════════════════════════════════════ */}
        <div>
          <SectionHeader
            label="Üye Aksiyon Tipleri"
            allKeys={allGroupKeys}
            collapsed={groupCollapsed}
            onToggleAll={toggleAllGroups}
            extra={
              <span className="text-[11px] text-gray-400">
                {ACTION_CFG.length} aksiyon · {allGroupKeys.length} kategori
              </span>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
            {allGroupKeys.map((group, gi) => {
              const color = GROUP_COLORS[group] ?? '#94a3b8';
              const icon = GROUP_ICONS[group] ?? '📌';
              const actions = ACTION_CFG.filter(a => a.group === group);
              const isOpen = !groupCollapsed.has(group);

              return (
                <div key={group}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden b-slide-up"
                  style={{ animationDelay: `${gi * 40}ms` }}>
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-base">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 leading-tight">{group}</div>
                      <div className="text-[10px] text-gray-400">{actions.length} aksiyon</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: color + '18', color }}>
                      {actions.length}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0"
                      style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-50 b-fade-in">
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {actions.map((ac, ai) => (
                          <div key={ac.key}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                            style={{
                              backgroundColor: color + '10',
                              border: `1px solid ${color}30`,
                            }}>
                            <span className="text-sm leading-none">{ac.icon}</span>
                            <span className="text-[11px] font-medium text-gray-700 leading-none">{ac.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-400 mt-4 leading-relaxed">
            20 modül üzerinde ziyaret + form/aksiyon verileri üye tipine göre ayrı ayrı izlenir.
            Mağaza, Eğitim ve Etkinlik oluşturma formlarında işbirliği modeli uygulanacak (komisyon).
            Kaynak: <span className="font-mono">docs/uye-tipleri-aksiyonlar.md</span>
          </p>
        </div>
      </div>
    </>
  );
}
