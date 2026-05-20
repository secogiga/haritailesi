import React from 'react';

export function Card({
  title, icon, accent = 'bg-gray-50 text-gray-500', children, className = '',
}: {
  title: string; icon: React.ReactNode; accent?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>{icon}</span>
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function BarRow({
  label, count, max, color = 'bg-[#26496b]', extra,
}: {
  label: string; count: number; max: number; color?: string; extra?: React.ReactNode;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-28 shrink-0 text-xs text-gray-600 truncate">{label}</div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 text-right text-xs font-semibold text-gray-500">{count.toLocaleString('tr-TR')}</div>
      {extra && <div className="shrink-0">{extra}</div>}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

export function SectionHeader({ label }: { label: string }) {
  return (
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 mt-2">{label}</h2>
  );
}
