const SOURCE_URL_SUFFIX = /\s(https?:\/\/\S+)\s*$/;
const COPYRIGHT_SUFFIX = /\s(©.+)$/;

export interface ParsedMdxImageCaption {
  description?: string;
  credit?: string;
  creditHref?: string;
}

export function parseMdxImageCaption(title?: string): ParsedMdxImageCaption {
  if (!title?.trim()) return {};

  const urlMatch = title.trim().match(SOURCE_URL_SUFFIX);
  if (!urlMatch) return { description: title };

  const working = title.trim().slice(0, urlMatch.index).trim();
  const creditHref = urlMatch[1];
  const copyrightMatch = working.match(COPYRIGHT_SUFFIX);

  if (!copyrightMatch) {
    return { description: working, creditHref };
  }

  return {
    description: working.slice(0, copyrightMatch.index).trim(),
    credit: copyrightMatch[1].trim(),
    creditHref,
  };
}
