'use client';

import { Pencil } from 'lucide-react';
import { useEditMode } from './EditModeProvider';
import type { ReactNode } from 'react';

interface EditableRegionProps {
  label: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function EditableRegion({
  label,
  children,
  className = '',
  onClick,
}: EditableRegionProps) {
  const { isEditMode } = useEditMode();

  if (!isEditMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`group/editable relative cursor-pointer ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${label}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      {/* Hover outline */}
      <div className="pointer-events-none absolute -inset-3 rounded-sm border-2 border-dashed border-transparent transition-colors duration-150 group-hover/editable:border-[color:var(--color-nis-accent)] group-focus-within/editable:border-[color:var(--color-nis-accent)]" />

      {/* Label badge */}
      <div className="pointer-events-none absolute -top-3 -left-3 z-10 flex items-center gap-1.5 rounded-sm bg-[color:var(--color-nis-accent)] px-2 py-0.5 opacity-0 transition-opacity duration-150 group-hover/editable:opacity-100 group-focus-within/editable:opacity-100">
        <Pencil className="h-3 w-3 text-[color:var(--color-nis-ink)]" />
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--color-nis-ink)]">
          {label}
        </span>
      </div>

      {children}
    </div>
  );
}
