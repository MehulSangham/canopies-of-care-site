import React from "react";

interface CalloutProps {
  type: "claim" | "warrant" | "qualifier" | "rebuttal" | "note";
  children?: React.ReactNode;
  content?: unknown;
}

const labels: Record<string, string> = {
  claim: "Claim",
  warrant: "Warrant",
  qualifier: "Qualifier",
  rebuttal: "Rebuttal Addressed",
  note: "Note",
};

const accents: Record<string, string> = {
  claim: "border-[var(--accent)]",
  warrant: "border-[var(--cream-muted)]",
  qualifier: "border-[var(--cream-subtle)]",
  rebuttal: "border-[var(--cream-subtle)]",
  note: "border-[var(--card-border)]",
};

export default function Callout({ type, children, content }: CalloutProps) {
  let inner: React.ReactNode = children;

  if (!inner && content) {
    const loadTinaMarkdown = async () => {
      const { TinaMarkdown } = await import("tinacms/dist/rich-text");
      return TinaMarkdown;
    };
    void loadTinaMarkdown();
  }

  return (
    <div
      className={`card my-6 border-l-[3px] ${accents[type] || accents.note}`}
    >
      <p className="text-xs font-['Redaction_20'] uppercase tracking-widest text-[var(--cream-muted)] mb-3">
        {labels[type] || type}
      </p>
      <div className="text-[1.1rem] leading-relaxed text-[var(--cream-muted)]">
        {inner}
      </div>
    </div>
  );
}
