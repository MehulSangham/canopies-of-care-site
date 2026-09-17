'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { createPage } from '@/app/actions/create-page';
import { SECTION_TITLES } from '@/lib/sections';

const SECTIONS = SECTION_TITLES;

export function NewPageButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="nis-btn nis-btn-primary text-sm"
      >
        <Plus className="h-4 w-4" />
        New Page
      </button>

      {open && <NewPageDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function NewPageDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [section, setSection] = useState('A');
  const [order, setOrder] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await createPage({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        section,
        order,
      });
      router.push(`/archive/${result.slug}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[color:var(--color-nis-ink)]/30 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[6px_6px_0_0_var(--color-nis-accent)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--color-nis-soft)] px-5 py-3">
          <h2 className="font-sans text-sm font-bold text-[color:var(--color-nis-ink)]">
            New Page
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-4">
          <Field label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mutual Aid Is a Founding-Era Practice"
              autoFocus
              className="field-input"
            />
          </Field>

          <Field label="Subtitle">
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. The Free African Society, 1787"
              className="field-input"
            />
          </Field>

          <div className="flex gap-4">
            <Field label="Section" className="flex-1">
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="field-input"
              >
                {Object.entries(SECTIONS).map(([key, name]) => (
                  <option key={key} value={key}>
                    {key} — {name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Order" className="w-20">
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                min={1}
                className="field-input"
              />
            </Field>
          </div>

          {error && (
            <p className="text-sm font-medium text-[color:var(--color-nis-earth)]">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--color-nis-soft)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="nis-btn nis-btn-primary text-sm disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Page
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
        {label}
        {required && <span className="text-[color:var(--color-nis-earth)]"> *</span>}
      </span>
      {children}
    </label>
  );
}
