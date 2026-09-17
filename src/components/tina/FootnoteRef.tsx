interface FootnoteRefProps {
  number: number;
}

export default function FootnoteRef({ number }: FootnoteRefProps) {
  return (
    <sup>
      <a
        href={`#fn-${number}`}
        id={`fnref-${number}`}
        data-footnote-ref
        className="text-[var(--accent)] text-xs font-[800] no-underline px-[2px] hover:text-[var(--cream)]"
      >
        {number}
      </a>
    </sup>
  );
}
