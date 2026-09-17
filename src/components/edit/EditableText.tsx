'use client';

import { useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useEditMode } from './EditModeProvider';

interface EditableTextProps {
  field: 'title' | 'subtitle';
  value: string;
  className?: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
  placeholder?: string;
}

export function EditableText({
  field,
  value,
  className = '',
  as: Tag = 'span',
  placeholder = 'Click to edit...',
}: EditableTextProps) {
  const { isEditMode, pendingChanges, setField } = useEditMode();
  const ref = useRef<HTMLElement>(null);
  const displayValue = pendingChanges[field] ?? value;

  useEffect(() => {
    if (ref.current && isEditMode) {
      ref.current.textContent = displayValue;
    }
  }, [isEditMode]);

  const handleBlur = useCallback(() => {
    const text = ref.current?.textContent?.trim() || '';
    if (text !== value) {
      setField(field, text);
    }
  }, [field, value, setField]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (ref.current) ref.current.textContent = value;
      ref.current?.blur();
    }
  }, [value]);

  if (!isEditMode) {
    return <Tag className={className}>{displayValue}</Tag>;
  }

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} outline-none ring-0 cursor-text hover:ring-2 hover:ring-[color:var(--color-nis-accent)]/40 focus:ring-2 focus:ring-[color:var(--color-nis-accent)] transition-shadow rounded-sm`}
      data-placeholder={placeholder}
      style={{ minWidth: '4rem' }}
    >
      {displayValue}
    </Tag>
  );
}
