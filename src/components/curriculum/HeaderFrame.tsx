import Link from 'next/link';
import { useId } from 'react';

interface HeaderFrameChevronProps {
  direction?: 'left' | 'right';
  className?: string;
}

export function HeaderFrameChevron({
  direction = 'right',
  className = '',
}: HeaderFrameChevronProps) {
  const filterId = useId();

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 53"
      fill="none"
      className={className}
      style={direction === 'left' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <filter id={filterId} x="-25%" y="-10%" width="150%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.55" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <path
        d="M1 1L15 26.5L1 52"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}

interface HeaderFrameProps {
  kicker: string;
  title: string;
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  titleAs?: 'h1' | 'h2';
  className?: string;
}

export function HeaderFrame({
  kicker,
  title,
  prev,
  next,
  titleAs = 'h1',
  className = '',
}: HeaderFrameProps) {
  const TitleTag = titleAs;
  return (
    <div className={`nis-header-frame ${className}`.trim()}>
      <div className="nis-header-frame__inner">
        {prev ? (
          <Link
            href={prev.href}
            title={`Previous page: ${prev.title}`}
            aria-label={`Previous page: ${prev.title}`}
            className="nis-header-frame__nav nis-header-frame__nav--prev"
          >
            <HeaderFrameChevron direction="left" className="nis-header-frame__nav-chevron" />
          </Link>
        ) : null}

        <div className="nis-header-frame__content">
        <p className="nis-header-frame__kicker">{kicker}</p>
        <TitleTag className="nis-header-frame__title">{title}</TitleTag>
        </div>

        {next ? (
          <Link
            href={next.href}
            title={`Next page: ${next.title}`}
            aria-label={`Next page: ${next.title}`}
            className="nis-header-frame__nav nis-header-frame__nav--next"
          >
            <HeaderFrameChevron className="nis-header-frame__nav-chevron" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
