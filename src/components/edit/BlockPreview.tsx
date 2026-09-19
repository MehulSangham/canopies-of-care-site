'use client';

import type { MdxBlock } from '@/lib/mdx-blocks';
import { splitFootnoteMarkdown, compactSourceLine } from '@/lib/footnote-sources';

interface BlockPreviewProps {
  block: MdxBlock;
}

export function BlockPreview({ block }: BlockPreviewProps) {
  switch (block.type) {
    case 'heading':
      return <HeadingPreview block={block} />;
    case 'paragraph':
      return <ParagraphPreview block={block} />;
    case 'callout':
      return <CalloutPreview block={block} />;
    case 'footnote':
      return <FootnotePreview block={block} />;
    case 'blockquote':
      return <BlockquotePreview block={block} />;
    case 'image':
      return <ImagePreview block={block} />;
    case 'video':
      return <VideoPreview block={block} />;
    case 'list':
      return <ListPreview block={block} />;
    case 'hr':
      return <hr className="my-8 border-[color:var(--color-nis-soft)]" />;
    default:
      return <p className="text-nis-muted font-mono text-sm">{block.raw}</p>;
  }
}

function InlineMarkdown({ text }: { text: string }) {
  let html = text;
  html = html.replace(/`([^`]+)`/g, '<code class="font-mono text-[0.9em] bg-[color:var(--color-nis-paper)] px-1 py-0.5 border border-[color:var(--color-nis-soft)]">$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
  // External links get target="_blank" and an indicator
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-[color:var(--color-nis-ink)] hover:text-[color:var(--color-nis-hover)]">$1<span class="inline-block ml-0.5 text-[0.7em] opacity-60">↗</span></a>',
  );
  // Internal links (no protocol)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="underline text-[color:var(--color-nis-ink)] hover:text-[color:var(--color-nis-hover)]">$1</a>',
  );
  html = html.replace(/\[\^(\w+)\]/g, '<sup class="text-xs text-nis-muted">[$1]</sup>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function HeadingPreview({ block }: { block: MdxBlock }) {
  const level = block.meta?.level ?? 2;
  const text = block.raw.replace(/^#{1,6}\s+/, '');

  if (level === 2) {
    return (
      <h2 className="font-sans font-bold text-2xl tracking-tight text-[color:var(--color-nis-ink)] mt-12 mb-4">
        <InlineMarkdown text={text} />
      </h2>
    );
  }
  if (level === 3) {
    return (
      <h3 className="font-sans font-bold text-xl tracking-tight text-[color:var(--color-nis-ink)] mt-8 mb-3">
        <InlineMarkdown text={text} />
      </h3>
    );
  }
  return (
    <h4 className="font-sans font-bold text-lg tracking-tight text-[color:var(--color-nis-ink)] mt-6 mb-2">
      <InlineMarkdown text={text} />
    </h4>
  );
}

function ParagraphPreview({ block }: { block: MdxBlock }) {
  return (
    <p className="text-[1.25rem] leading-7 font-medium text-[color:var(--color-nis-ink)] my-4">
      <InlineMarkdown text={block.raw} />
    </p>
  );
}

function CalloutPreview({ block }: { block: MdxBlock }) {
  const type = block.meta?.calloutType || 'note';
  const bodyMatch = block.raw.match(/<Callout[^>]*>\n?([\s\S]*?)\n?<\/Callout>/);
  const bodyText = bodyMatch?.[1]?.trim() || block.raw;

  return (
    <div className={`callout-card callout-card--${type} my-4`}>
      <p className="callout-label">{type}</p>
      <div className="callout-body">
        <InlineMarkdown text={bodyText} />
      </div>
    </div>
  );
}

function FootnotePreview({ block }: { block: MdxBlock }) {
  const match = block.raw.match(/^\[\^(\w+)\]:\s([\s\S]*)$/);
  const id = match?.[1] || '?';
  const text = match?.[2] || block.raw;
  const { note, sources } = splitFootnoteMarkdown(text);

  return (
    <div className="flex gap-3 py-2 text-sm text-nis-muted border-t border-[color:var(--color-nis-soft2)]">
      <span className="font-mono text-xs font-bold shrink-0">[{id}]</span>
      <div className="min-w-0 flex-1">
        {note && (
          <div className="leading-relaxed"><InlineMarkdown text={note} /></div>
        )}
        {sources.length > 0 && (
          <div className={note ? 'mt-1.5 border-t border-dashed border-[color:var(--color-nis-soft2)] pt-1.5' : ''}>
            <div className="mb-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em]">Sources</div>
            <ul className="m-0 list-none p-0 text-[13px]">
              {sources.map((s, i) => (
                <li key={i} className="mb-0.5">
                  <InlineMarkdown text={compactSourceLine(s)} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockquotePreview({ block }: { block: MdxBlock }) {
  const text = block.raw.replace(/^>\s?/gm, '');
  return (
    <blockquote className="border-l-[3px] border-[color:var(--color-nis-ink)] pl-5 py-2 my-4 text-[1.1rem] leading-relaxed text-[color:var(--color-nis-ink)]">
      <InlineMarkdown text={text} />
    </blockquote>
  );
}

function ImagePreview({ block }: { block: MdxBlock }) {
  // Parse the caption convention: "Description © Credit https://url"
  const raw = block.meta?.caption || '';
  const urlMatch = raw.trim().match(/\s(https?:\/\/\S+)\s*$/);
  const working = urlMatch ? raw.trim().slice(0, urlMatch.index).trim() : raw.trim();
  const copyrightMatch = working.match(/\s(©.+)$/);
  const description = copyrightMatch
    ? working.slice(0, copyrightMatch.index).trim()
    : working;
  const credit = copyrightMatch ? copyrightMatch[1].trim() : '';

  return (
    <figure className="my-6">
      <div className="border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] p-4 text-center">
        {block.meta?.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.meta.src}
            alt={block.meta.alt || ''}
            className="max-h-64 mx-auto object-contain"
          />
        )}
      </div>
      {(description || credit) && (
        <figcaption className="mt-2 text-center font-serif text-sm text-nis-muted italic">
          {description}
          {credit && (
            <span className="not-italic text-xs block mt-0.5">{credit}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function VideoPreview({ block }: { block: MdxBlock }) {
  const url = block.meta?.videoUrl || '';
  const caption = block.meta?.caption;
  const embedUrl = getEmbedUrl(url);

  return (
    <figure className="my-6">
      <div className="relative border border-[color:var(--color-nis-soft)] bg-black overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={caption || 'Video'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
            <span>Video: {url}</span>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center font-serif text-sm text-nis-muted italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

function ListPreview({ block }: { block: MdxBlock }) {
  const items = block.raw.split('\n').filter((l) => l.trim());
  const isOrdered = /^\d+\./.test(items[0]);
  const Tag = isOrdered ? 'ol' : 'ul';

  return (
    <Tag className={`my-4 pl-6 text-[1.1rem] leading-relaxed text-[color:var(--color-nis-ink)] ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
      {items.map((item, i) => {
        const text = item.replace(/^\s*[-*+]\s+|^\s*\d+\.\s+/, '');
        return (
          <li key={i} className="my-1">
            <InlineMarkdown text={text} />
          </li>
        );
      })}
    </Tag>
  );
}
