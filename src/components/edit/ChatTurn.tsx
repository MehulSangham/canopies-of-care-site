import type { ReactNode } from 'react';

/**
 * One turn in the assistant rail. User sits on the right as a compact
 * bubble; the model stays on the left as open prose — the usual modern
 * chat split, without boxed cards for either side.
 */
export function ChatTurn({
  role,
  children,
}: {
  role: 'user' | 'assistant';
  children: ReactNode;
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[color:var(--color-nis-ink)] px-3 py-2 font-sans text-[12.5px] leading-relaxed text-[color:var(--color-nis-bg)]">
          {children}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[95%] space-y-2">
      <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-nis-muted">
        Assistant
      </span>
      {children}
    </div>
  );
}
