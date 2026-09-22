import type { ReactNode } from 'react';

/**
 * Lightweight markdown for the assistant rail. Covers the marks the model
 * actually uses (bold, italic, code, links, lists, headings) without pulling
 * a full MDX pipeline into the chat.
 */
export function ChatMarkdown({ text }: { text: string }) {
  if (!text.trim()) return null;
  const blocks = splitBlocks(text);
  return (
    <div className="space-y-2 font-sans text-[12.5px] leading-[1.65] text-[color:var(--color-nis-ink)]">
      {blocks.map((block, i) => (
        <Block key={i} text={block} />
      ))}
    </div>
  );
}

function splitBlocks(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let buf: string[] = [];
  let inList = false;

  const flush = () => {
    if (buf.length) {
      blocks.push(buf.join('\n'));
      buf = [];
    }
    inList = false;
  };

  for (const line of lines) {
    const list = isListLine(line);
    if (line.trim() === '') {
      flush();
      continue;
    }
    if (list) {
      if (!inList) flush();
      inList = true;
      buf.push(line);
      continue;
    }
    if (inList) flush();
    buf.push(line);
  }
  flush();
  return blocks;
}

function isListLine(line: string): boolean {
  return /^\s*(?:[-*+]|\d+\.)\s+/.test(line);
}

function Block({ text }: { text: string }) {
  const lines = text.split('\n');
  if (lines.every(isListLine)) {
    const ordered = /^\s*\d+\./.test(lines[0]);
    const Tag = ordered ? 'ol' : 'ul';
    return (
      <Tag className={ordered ? 'list-decimal pl-5 space-y-1' : 'list-disc pl-5 space-y-1'}>
        {lines.map((line, i) => (
          <li key={i}>
            <Inline text={line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')} />
          </li>
        ))}
      </Tag>
    );
  }

  const heading = text.match(/^(#{1,4})\s+(.*)$/);
  if (heading && !text.includes('\n')) {
    const level = heading[1].length;
    const cls =
      level <= 2
        ? 'font-sans text-[13px] font-bold'
        : 'font-sans text-[12px] font-bold';
    return (
      <p className={cls}>
        <Inline text={heading[2]} />
      </p>
    );
  }

  return (
    <p>
      <Inline text={text} />
    </p>
  );
}

function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re =
    /(\*\*[^*]+?\*\*|\*[^*]+?\*|-?\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[11px] bg-[color:var(--color-nis-paper)] px-1"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (link) {
        parts.push(
          <a
            key={key++}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {link[1]}
          </a>,
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
