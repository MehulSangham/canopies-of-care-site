export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'callout'
  | 'image'
  | 'video'
  | 'footnote'
  | 'blockquote'
  | 'list'
  | 'hr'
  | 'empty';

export interface MdxBlock {
  id: string;
  type: BlockType;
  raw: string;
  meta?: {
    level?: number;
    calloutType?: string;
    footnoteId?: string;
    alt?: string;
    src?: string;
    caption?: string;
    videoUrl?: string;
    videoProvider?: 'youtube' | 'vimeo' | 'other';
  };
}

export function parseMdxBlocks(source: string): MdxBlock[] {
  const blocks: MdxBlock[] = [];
  const lines = source.split('\n');
  let i = 0;
  let blockIndex = 0;

  function pushBlock(type: BlockType, raw: string, meta?: MdxBlock['meta']) {
    blocks.push({ id: `block-${blockIndex++}`, type, raw, meta });
  }

  while (i < lines.length) {
    const line = lines[i];

    // Empty lines — skip, they're separators
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---\s*$/.test(line.trim())) {
      pushBlock('hr', line);
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      pushBlock('heading', line, { level: headingMatch[1].length });
      i++;
      continue;
    }

    // Video block: <Video url="..." />
    const videoMatch = line.match(/^<Video\s+url="([^"]+)"\s*(?:caption="([^"]*)")?\s*\/>/);
    if (videoMatch) {
      const url = videoMatch[1];
      const caption = videoMatch[2] || undefined;
      let provider: 'youtube' | 'vimeo' | 'other' = 'other';
      if (/youtube\.com|youtu\.be/.test(url)) provider = 'youtube';
      else if (/vimeo\.com/.test(url)) provider = 'vimeo';
      pushBlock('video', line, { videoUrl: url, videoProvider: provider, caption });
      i++;
      continue;
    }

    // Callout block: <Callout type="..."> ... </Callout>
    const calloutOpenMatch = line.match(/^<Callout\s+type="(\w+)">/);
    if (calloutOpenMatch) {
      const calloutLines = [line];
      i++;
      while (i < lines.length && !lines[i].includes('</Callout>')) {
        calloutLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        calloutLines.push(lines[i]);
        i++;
      }
      pushBlock('callout', calloutLines.join('\n'), {
        calloutType: calloutOpenMatch[1],
      });
      continue;
    }

    // Image with optional title/caption: ![alt](src "caption")
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)/);
    if (imageMatch) {
      pushBlock('image', line, {
        alt: imageMatch[1],
        src: imageMatch[2].trim(),
        caption: imageMatch[3] || undefined,
      });
      i++;
      continue;
    }

    // Footnote definition
    const footnoteMatch = line.match(/^\[\^(\w+)\]:\s/);
    if (footnoteMatch) {
      const fnLines = [line];
      i++;
      // Continuation: indented lines, and blank lines that are followed by
      // more indented content (multi-paragraph footnotes, e.g. note + Sources).
      while (i < lines.length) {
        if (lines[i].match(/^\s+\S/)) {
          fnLines.push(lines[i]);
          i++;
          continue;
        }
        if (lines[i].trim() === '') {
          let j = i;
          while (j < lines.length && lines[j].trim() === '') j++;
          if (j < lines.length && lines[j].match(/^\s+\S/)) {
            for (let k = i; k < j; k++) fnLines.push(lines[k]);
            i = j;
            continue;
          }
        }
        break;
      }
      pushBlock('footnote', fnLines.join('\n'), {
        footnoteId: footnoteMatch[1],
      });
      continue;
    }

    // Blockquote (not inside a callout)
    if (line.startsWith('> ')) {
      const bqLines = [line];
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
        bqLines.push(lines[i]);
        i++;
      }
      pushBlock('blockquote', bqLines.join('\n'));
      continue;
    }

    // List (unordered or ordered)
    if (/^(\s*[-*+]|\s*\d+\.)\s/.test(line)) {
      const listLines = [line];
      i++;
      while (
        i < lines.length &&
        (/^(\s*[-*+]|\s*\d+\.)\s/.test(lines[i]) || /^\s+\S/.test(lines[i]))
      ) {
        listLines.push(lines[i]);
        i++;
      }
      pushBlock('list', listLines.join('\n'));
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].match(/^<Callout/) &&
      !lines[i].match(/^<Video/) &&
      !lines[i].match(/^!\[/) &&
      !lines[i].match(/^\[\^\w+\]:/) &&
      !lines[i].startsWith('> ') &&
      !lines[i].match(/^---\s*$/) &&
      !lines[i].match(/^(\s*[-*+]|\s*\d+\.)\s/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    pushBlock('paragraph', paraLines.join('\n'));
  }

  return blocks;
}

export function blocksToMarkdown(blocks: MdxBlock[]): string {
  return blocks.map((b) => b.raw).join('\n\n');
}
