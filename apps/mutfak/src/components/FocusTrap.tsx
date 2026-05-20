'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface FocusTrapProps {
  onClose: () => void;
  role?: string;
  'aria-labelledby'?: string;
  'aria-label'?: string;
  className?: string;
  onClick?: React.MouseEventHandler;
  children: React.ReactNode;
}

export function FocusTrap({
  onClose,
  role = 'dialog',
  'aria-labelledby': labelledby,
  'aria-label': label,
  className,
  onClick,
  children,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prev = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.closest('[inert]'),
      );

    const first = focusable()[0];
    first?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const els = focusable();
      if (els.length === 0) { e.preventDefault(); return; }

      const firstEl = els[0]!;
      const lastEl = els[els.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      prev?.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledby}
      aria-label={label}
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
