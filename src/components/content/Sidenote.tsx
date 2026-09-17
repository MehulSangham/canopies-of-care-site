"use client";

import { useState, useRef, useEffect } from "react";

interface SidenoteProps {
  id: number;
  children: React.ReactNode;
}

export function Sidenote({ id, children }: SidenoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const refEl = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1200);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || !isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (refEl.current && !refEl.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMobile, isExpanded]);

  const handleClick = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
    } else {
      const footnote = document.getElementById(`fn-${id}`);
      if (footnote) {
        footnote.scrollIntoView({ behavior: "smooth", block: "center" });
        footnote.classList.add("footnote-highlight");
        setTimeout(
          () => footnote.classList.remove("footnote-highlight"),
          2000
        );
      }
    }
  };

  return (
    <span className="sidenote-wrapper" ref={refEl}>
      <sup
        className="sidenote-ref"
        id={`fnref-${id}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-describedby={`sidenote-${id}`}
      >
        {id}
      </sup>

      {/* Desktop: sidenote in margin */}
      {!isMobile && (
        <span className="sidenote-content" id={`sidenote-${id}`}>
          <span className="sidenote-number">{id}</span>
          {children}
        </span>
      )}

      {/* Mobile: tooltip popup */}
      {isMobile && isExpanded && (
        <span className="sidenote-tooltip">
          <span className="sidenote-tooltip-content">{children}</span>
          <button
            className="sidenote-tooltip-link"
            onClick={(e) => {
              e.stopPropagation();
              const footnote = document.getElementById(`fn-${id}`);
              if (footnote) {
                setIsExpanded(false);
                footnote.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                footnote.classList.add("footnote-highlight");
                setTimeout(
                  () => footnote.classList.remove("footnote-highlight"),
                  2000
                );
              }
            }}
          >
            See full note ↓
          </button>
        </span>
      )}
    </span>
  );
}

export function FootnoteItem({
  id,
  children,
}: {
  id: number;
  children: React.ReactNode;
}) {
  return (
    <li id={`fn-${id}`} className="footnote-item">
      <span className="footnote-number">{id}.</span>
      <span className="footnote-text">
        {children}{" "}
        <a
          href={`#fnref-${id}`}
          className="footnote-backref"
          aria-label="Back to reference"
          onClick={(e) => {
            e.preventDefault();
            const ref = document.getElementById(`fnref-${id}`);
            if (ref) {
              ref.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
        >
          ↩
        </a>
      </span>
    </li>
  );
}

export function FootnoteList({ children }: { children: React.ReactNode }) {
  return (
    <section className="footnotes-section">
      <h2 className="footnotes-title">Notes</h2>
      <ol className="footnotes-list">{children}</ol>
    </section>
  );
}
