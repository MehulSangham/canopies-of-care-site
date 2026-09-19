/**
 * Two-part footnotes: a substantive note plus a structured source list.
 *
 * Authoring convention (markdown, inside a GFM footnote definition):
 *
 *   [^3]: Beito's conservative estimate — adult men, not all adults.
 *
 *       Sources:
 *       - Beito, *From Mutual Aid to the Welfare State* (UNC Press, 2000). https://uncpress.org/...
 *       - "Fraternal Sickness Insurance," *EH.net Encyclopedia*. https://eh.net/...
 *
 * A footnote may be citation-only, in which case it starts directly with the
 * marker: `[^5]: Sources:` followed by the indented list.
 *
 * Footnotes without a `Sources:` marker render exactly as before.
 */

const SOURCES_MARKER = /^sources:$/i;

/** Split raw footnote body text (markdown, without the `[^id]: ` prefix) */
export function splitFootnoteMarkdown(text: string): { note: string; sources: string[] } {
  const lines = text.split('\n');
  const noteLines: string[] = [];
  const sources: string[] = [];
  let inSources = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inSources && SOURCES_MARKER.test(trimmed)) {
      inSources = true;
      continue;
    }
    if (inSources) {
      if (!trimmed) continue;
      sources.push(trimmed.replace(/^-\s+/, ''));
    } else {
      noteLines.push(line);
    }
  }

  return { note: noteLines.join('\n').trim(), sources };
}

/** Compose a full footnote definition block from note text and source lines. */
export function composeFootnoteMarkdown(id: string, note: string, sources: string[]): string {
  const cleanSources = sources.map((s) => s.trim()).filter(Boolean);
  const noteText = note.trim();

  if (cleanSources.length === 0) {
    return `[^${id}]: ${noteText}`;
  }

  const sourceBlock = ['Sources:', ...cleanSources.map((s) => `- ${s}`)]
    .map((l) => `    ${l}`)
    .join('\n');

  if (!noteText) {
    // Citation-only footnote: marker sits on the definition line.
    return `[^${id}]: Sources:\n${cleanSources.map((s) => `    - ${s}`).join('\n')}`;
  }

  return `[^${id}]: ${noteText}\n\n${sourceBlock}`;
}

/** Compact display label for a bare URL: hostname without www. */
export function compactUrlLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Convert bare URLs inside a source line into compact markdown links,
 * e.g. `Beito (2000). https://uncpress.org/x` → `Beito (2000). [uncpress.org ↗](https://uncpress.org/x)`
 */
export function compactSourceLine(source: string): string {
  return source.replace(/(?<!\]\()https?:\/\/[^\s)]+/g, (url) => `[${compactUrlLabel(url)} ↗](${url})`);
}

/**
 * DOM-level split of a rendered footnote (the innerHTML of the footnote <li>).
 * Finds the element whose text is exactly "Sources:" and splits around it.
 * Compacts bare-URL anchor labels in the sources half.
 * Must run in the browser.
 */
export function splitFootnoteHtml(html: string): { noteHtml: string; sourcesHtml: string | null } {
  if (typeof document === 'undefined') return { noteHtml: html, sourcesHtml: null };

  const root = document.createElement('div');
  root.innerHTML = html;

  const children = Array.from(root.children);
  const markerIndex = children.findIndex((el) => SOURCES_MARKER.test((el.textContent || '').trim()));

  if (markerIndex === -1) {
    return { noteHtml: html, sourcesHtml: null };
  }

  const noteWrap = document.createElement('div');
  children.slice(0, markerIndex).forEach((el) => noteWrap.appendChild(el.cloneNode(true)));

  const sourcesWrap = document.createElement('div');
  children.slice(markerIndex + 1).forEach((el) => sourcesWrap.appendChild(el.cloneNode(true)));

  // Compact anchors whose visible text is a bare URL.
  sourcesWrap.querySelectorAll('a').forEach((a) => {
    const text = (a.textContent || '').trim();
    if (/^https?:\/\//i.test(text)) {
      a.textContent = `${compactUrlLabel(text)} ↗`;
    }
  });

  return { noteHtml: noteWrap.innerHTML.trim(), sourcesHtml: sourcesWrap.innerHTML.trim() || null };
}
