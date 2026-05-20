import type { ReactNode } from 'react';

// ── Topo Lines SVG — haritacılık kimliği ─────────────────────────────────────

function TopoLines({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="65" rx="52" ry="36" stroke="#e5e7eb" strokeWidth="1.5" />
      <ellipse cx="60" cy="65" rx="38" ry="25" stroke="#e5e7eb" strokeWidth="1.5" />
      <ellipse cx="60" cy="65" rx="24" ry="16" stroke="#d1d5db" strokeWidth="1.5" />
      <ellipse cx="60" cy="65" rx="12" ry="8" stroke="#d1d5db" strokeWidth="1.5" />
      <ellipse cx="60" cy="65" rx="4" ry="3" stroke="#9ca3af" strokeWidth="1.5" />
    </svg>
  );
}

function CompassLines({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="50" stroke="#e5e7eb" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="35" stroke="#e5e7eb" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="20" stroke="#d1d5db" strokeWidth="1.5" />
      <line x1="60" y1="10" x2="60" y2="110" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="10" y1="60" x2="110" y2="60" stroke="#e5e7eb" strokeWidth="1" />
      <polygon points="60,25 55,45 60,40 65,45" fill="#d1d5db" />
      <circle cx="60" cy="60" r="4" fill="#9ca3af" />
    </svg>
  );
}

function PinLines({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="72" rx="48" ry="30" stroke="#e5e7eb" strokeWidth="1.5" />
      <ellipse cx="60" cy="72" rx="32" ry="20" stroke="#e5e7eb" strokeWidth="1.5" />
      <ellipse cx="60" cy="72" rx="16" ry="10" stroke="#d1d5db" strokeWidth="1.5" />
      <circle cx="60" cy="45" r="16" stroke="#d1d5db" strokeWidth="1.5" />
      <circle cx="60" cy="45" r="6" fill="#e5e7eb" />
      <line x1="60" y1="61" x2="60" y2="72" stroke="#d1d5db" strokeWidth="1.5" />
    </svg>
  );
}

function SearchLines({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="50" cy="54" rx="34" ry="24" stroke="#e5e7eb" strokeWidth="1.5" />
      <ellipse cx="50" cy="54" rx="22" ry="15" stroke="#e5e7eb" strokeWidth="1.5" />
      <ellipse cx="50" cy="54" rx="10" ry="7" stroke="#d1d5db" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="28" stroke="#d1d5db" strokeWidth="2" />
      <line x1="70" y1="72" x2="92" y2="94" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function BellLines({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="46" ry="20" stroke="#e5e7eb" strokeWidth="1.5" />
      <ellipse cx="60" cy="80" rx="30" ry="13" stroke="#e5e7eb" strokeWidth="1.5" />
      <path d="M40 75 Q38 58 45 46 Q52 34 60 32 Q68 34 75 46 Q82 58 80 75 Z" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
      <path d="M52 75 Q52 82 60 82 Q68 82 68 75" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="28" r="4" stroke="#9ca3af" strokeWidth="1.5" />
    </svg>
  );
}

function InboxLines({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="88" rx="46" ry="16" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="22" y="35" width="76" height="54" rx="6" stroke="#d1d5db" strokeWidth="1.5" />
      <path d="M22 55 L48 68 Q60 74 72 68 L98 55" stroke="#d1d5db" strokeWidth="1.5" />
      <path d="M48 55 L60 62 L72 55" stroke="#e5e7eb" strokeWidth="1.5" />
    </svg>
  );
}

function BookmarkLines({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="90" rx="44" ry="18" stroke="#e5e7eb" strokeWidth="1.5" />
      <ellipse cx="60" cy="90" rx="28" ry="11" stroke="#e5e7eb" strokeWidth="1.5" />
      <path d="M36 28 L36 88 L60 74 L84 88 L84 28 Q84 22 78 22 L42 22 Q36 22 36 28 Z" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
      <line x1="46" y1="35" x2="74" y2="35" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="46" y1="43" x2="68" y2="43" stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  topo: TopoLines,
  compass: CompassLines,
  pin: PinLines,
  search: SearchLines,
  bell: BellLines,
  inbox: InboxLines,
  bookmark: BookmarkLines,
};

interface EmptyStateProps {
  illustration?: keyof typeof ILLUSTRATIONS;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ illustration = 'topo', title, description, action }: EmptyStateProps) {
  const Ill = ILLUSTRATIONS[illustration];
  return (
    <div className="text-center py-16 px-4 flex flex-col items-center">
      <Ill className="w-20 h-20 mb-4 opacity-80" />
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      {description && <p className="text-xs text-gray-400 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
