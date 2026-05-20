'use client';

import { useState, type ReactNode } from 'react';
import { useAdminMode } from '@/contexts/AdminMode';
import { SectionDrawer } from './SectionDrawer';

interface Props {
  sectionKey: string;
  label: string;
  initialData?: unknown;
  children: ReactNode;
  className?: string;
}

export function EditableSection({ sectionKey, label, initialData, children, className }: Props) {
  const { isAdmin } = useAdminMode();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return <>{children}</>;

  return (
    <>
      <div className={`relative group/editable${className ? ` ${className}` : ''}`}>
        {children}
        <button
          onClick={() => setOpen(true)}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover/editable:opacity-100 transition-all duration-150 bg-white text-[var(--color-mavi)] border border-[var(--color-mavi-acik)] rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg flex items-center gap-1.5 hover:bg-blue-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {label} Düzenle
        </button>
        {/* Subtle admin outline on hover */}
        <div className="absolute inset-0 ring-2 ring-[var(--color-mavi-acik)] ring-opacity-0 group-hover/editable:ring-opacity-30 rounded pointer-events-none transition-all duration-150" />
      </div>

      {open && (
        <SectionDrawer
          sectionKey={sectionKey}
          label={label}
          initialData={initialData}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
