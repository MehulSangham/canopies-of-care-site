const EXTERNAL_WEB_LINK_PATTERN = /^(https?:)?\/\//i;

export function shouldOpenInNewTab(href?: string): boolean {
  const normalizedHref = href?.trim();
  if (!normalizedHref || normalizedHref.startsWith('#')) return false;
  return EXTERNAL_WEB_LINK_PATTERN.test(normalizedHref);
}

export function decorateOutboundLinksHtml(html: string): string {
  return html.replace(
    /<a\b([^>]*\bhref=(['"])(.*?)\2[^>]*)>/gi,
    (match, attrs: string, _quote: string, href: string) => {
      if (!shouldOpenInNewTab(href)) return match;

      let nextAttrs = attrs;
      if (!/\btarget\s*=/.test(nextAttrs)) nextAttrs += ' target="_blank"';
      if (!/\brel\s*=/.test(nextAttrs)) nextAttrs += ' rel="noreferrer"';

      return `<a${nextAttrs}>`;
    },
  );
}
