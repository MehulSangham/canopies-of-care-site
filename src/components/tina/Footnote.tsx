import React from "react";

interface FootnoteProps {
  number: number;
  children?: React.ReactNode;
  citation?: unknown;
}

export default function Footnote({ number, children }: FootnoteProps) {
  return (
    <li
      id={`fn-${number}`}
      className="mb-4 text-[0.95rem] leading-[1.7] text-[var(--cream-subtle)]"
    >
      <span className="font-[800] text-[var(--cream-muted)] mr-2">{number}.</span>
      {children}
      <a
        href={`#fnref-${number}`}
        data-footnote-backref
        className="text-[var(--accent)] no-underline text-[0.8rem] ml-1"
      >
        ↩
      </a>
    </li>
  );
}
