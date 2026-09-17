'use client';

import { useEditMode } from './EditModeProvider';

interface EditableMetaProps {
  section: string;
  order: number;
  status: string;
  sectionTitles: Record<string, string>;
}

export function EditableMeta({ section, order, status, sectionTitles }: EditableMetaProps) {
  const { isEditMode, pendingChanges, setField } = useEditMode();

  const currentSection = (pendingChanges.section ?? section) as string;
  const currentOrder = pendingChanges.order ?? order;
  const currentStatus = (pendingChanges.status ?? status) as string;

  if (!isEditMode) return null;

  return (
    <div className="flex items-center gap-3 mt-3 mb-2 flex-wrap">
      <label className="flex items-center gap-2">
        <span className="font-serif text-xs uppercase tracking-[0.12em] text-nis-muted">Section</span>
        <select
          value={currentSection}
          onChange={(e) => setField('section', e.target.value)}
          className="border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] px-2 py-1 font-sans text-sm text-[color:var(--color-nis-ink)] outline-none focus:ring-2 focus:ring-[color:var(--color-nis-accent)]"
        >
          {Object.entries(sectionTitles).map(([key, title]) => (
            <option key={key} value={key}>
              {key} — {title}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="font-serif text-xs uppercase tracking-[0.12em] text-nis-muted">Order</span>
        <input
          type="number"
          value={currentOrder}
          onChange={(e) => setField('order', parseInt(e.target.value, 10) || 0)}
          min={1}
          className="w-16 border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] px-2 py-1 font-sans text-sm text-[color:var(--color-nis-ink)] outline-none focus:ring-2 focus:ring-[color:var(--color-nis-accent)]"
        />
      </label>

      <label className="flex items-center gap-2">
        <span className="font-serif text-xs uppercase tracking-[0.12em] text-nis-muted">Status</span>
        <button
          type="button"
          onClick={() =>
            setField('status', currentStatus === 'published' ? 'draft' : 'published')
          }
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]
            border transition-colors
            ${currentStatus === 'published'
              ? 'border-[color:var(--color-nis-deep-forest)] text-[color:var(--color-nis-deep-forest)] bg-[color:var(--color-nis-deep-forest)]/5'
              : 'border-[color:var(--color-nis-earth)] text-[color:var(--color-nis-earth)] bg-[color:var(--color-nis-earth)]/5'
            }
          `}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              currentStatus === 'published'
                ? 'bg-[color:var(--color-nis-deep-forest)]'
                : 'bg-[color:var(--color-nis-earth)]'
            }`}
          />
          {currentStatus === 'published' ? 'Published' : 'Draft'}
        </button>
      </label>
    </div>
  );
}
