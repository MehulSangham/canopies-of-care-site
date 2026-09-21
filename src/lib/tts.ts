import 'server-only';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { head, put } from '@vercel/blob';
import { parseMdxBlocks } from '@/lib/mdx-blocks';

/**
 * Server-side text-to-speech for the page reader.
 *
 * - Derives readable text segments (title, headings, paragraphs, blockquotes)
 *   from a page's MDX.
 * - Synthesizes each segment with ElevenLabs, requesting character-level
 *   timestamps, and converts them to word timings for karaoke highlighting.
 * - Caches audio + timings keyed by a hash of (voice, model, text), so a
 *   segment is only ever synthesized (and paid for) once until its text
 *   changes. Two cache layers:
 *     1. Vercel Blob (when BLOB_READ_WRITE_TOKEN is set): persistent and
 *        shared across dev/prod; audio is served to the client as a CDN URL.
 *     2. Local disk (.tts-cache): dev fallback when no Blob store exists.
 */

const CONTENT_DIR = path.join(process.cwd(), 'content', 'archive');

/** Vercel serverless has a read-only filesystem except /tmp. */
const CACHE_DIR = process.env.VERCEL
  ? '/tmp/tts-cache'
  : path.join(process.cwd(), '.tts-cache');

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'; // "George" — British narrative voice
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

export interface WordTiming {
  /** The word as spoken */
  word: string;
  /** Character offset of the word within the segment text */
  charStart: number;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

export interface ReadableSegment {
  kind: 'title' | 'heading' | 'paragraph' | 'blockquote';
  text: string;
}

export interface SynthesizedSegment {
  /** CDN URL when the segment lives in the Blob store */
  audioUrl?: string;
  /** Base64 payload when serving from local disk (dev without Blob) */
  audioBase64?: string;
  words: WordTiming[];
}

/** Strip markdown/MDX syntax down to plain readable prose. */
function stripMarkdown(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+/gm, '') // heading markers
    .replace(/^>\s?/gm, '') // blockquote markers
    .replace(/\[\^[\w-]+\]/g, '') // footnote reference markers
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\s+/g, ' ')
    .trim();
}

/** Load the readable segments for a page. Returns null if the page doesn't exist. */
export function getReadableSegments(slug: string): ReadableSegment[] | null {
  // Only allow simple slugs (defence for the public endpoint)
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);

  const segments: ReadableSegment[] = [];
  const titleText = [data.title, data.subtitle].filter(Boolean).join('. ');
  if (titleText) segments.push({ kind: 'title', text: titleText });

  for (const block of parseMdxBlocks(content)) {
    if (
      block.type !== 'heading' &&
      block.type !== 'paragraph' &&
      block.type !== 'blockquote'
    ) {
      continue;
    }
    const text = stripMarkdown(block.raw);
    if (!text) continue;
    segments.push({
      kind: block.type === 'heading' ? 'heading' : block.type,
      text,
    });
  }
  return segments;
}

function cacheKey(text: string): string {
  return crypto
    .createHash('sha1')
    .update(`${VOICE_ID}|${MODEL_ID}|${text}`)
    .digest('hex');
}

/** Convert ElevenLabs character alignment into word timings. */
function charsToWords(
  characters: string[],
  starts: number[],
  ends: number[],
): WordTiming[] {
  const words: WordTiming[] = [];
  let current = '';
  let wordStartIdx = -1;
  for (let i = 0; i <= characters.length; i++) {
    const ch = i < characters.length ? characters[i] : ' ';
    if (/\s/.test(ch)) {
      if (current) {
        words.push({
          word: current,
          charStart: wordStartIdx,
          start: starts[wordStartIdx],
          end: ends[i - 1],
        });
        current = '';
        wordStartIdx = -1;
      }
    } else {
      if (!current) wordStartIdx = i;
      current += ch;
    }
  }
  return words;
}

/**
 * Blob is available with either a classic read-write token or Vercel OIDC
 * federation (automatic on Vercel; locally via `vercel env pull`'s
 * VERCEL_OIDC_TOKEN). Auth failures fall through to the disk cache.
 */
const hasBlob = () =>
  Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.VERCEL,
  );
const blobPath = (key: string, ext: 'mp3' | 'json') => `tts/${key}.${ext}`;

/** Look a segment up in the Blob store. Null on miss or any Blob error. */
async function blobLookup(key: string): Promise<SynthesizedSegment | null> {
  try {
    const [audio, timings] = await Promise.all([
      head(blobPath(key, 'mp3')),
      head(blobPath(key, 'json')),
    ]);
    const words: WordTiming[] = await fetch(timings.url).then((r) => r.json());
    return { audioUrl: audio.url, words };
  } catch {
    return null;
  }
}

/** Store a segment in the Blob store. Best effort; returns the audio URL. */
async function blobStore(
  key: string,
  audio: Buffer,
  words: WordTiming[],
): Promise<string | null> {
  try {
    const [audioBlob] = await Promise.all([
      put(blobPath(key, 'mp3'), audio, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        allowOverwrite: true,
      }),
      put(blobPath(key, 'json'), JSON.stringify(words), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      }),
    ]);
    return audioBlob.url;
  } catch {
    return null;
  }
}

/**
 * Synthesize one segment, cheapest source first:
 * Blob store → local disk → ElevenLabs (then write back to both caches).
 */
export async function synthesizeSegment(
  text: string,
): Promise<SynthesizedSegment> {
  const key = cacheKey(text);
  const audioPath = path.join(CACHE_DIR, `${key}.mp3`);
  const timingPath = path.join(CACHE_DIR, `${key}.json`);

  // 1. Blob store: persistent, shared, serves a CDN URL
  if (hasBlob()) {
    const hit = await blobLookup(key);
    if (hit) return hit;
  }

  // 2. Local disk: promote to Blob when a token is present so the shared
  //    cache fills up from work already paid for
  if (fs.existsSync(audioPath) && fs.existsSync(timingPath)) {
    const audio = fs.readFileSync(audioPath);
    const words: WordTiming[] = JSON.parse(fs.readFileSync(timingPath, 'utf8'));
    if (hasBlob()) {
      const url = await blobStore(key, audio, words);
      if (url) return { audioUrl: url, words };
    }
    return { audioBase64: audio.toString('base64'), words };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'No ELEVENLABS_API_KEY configured. Add it to .env.local to enable the page reader.',
    );
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text, model_id: MODEL_ID }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ElevenLabs request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const alignment = data.alignment ?? data.normalized_alignment;
  const words = alignment
    ? charsToWords(
        alignment.characters,
        alignment.character_start_times_seconds,
        alignment.character_end_times_seconds,
      )
    : [];

  const audio = Buffer.from(data.audio_base64, 'base64');

  // Write back to both caches (disk is best-effort: read-only on Vercel
  // outside /tmp, which is why CACHE_DIR points there in production)
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(audioPath, audio);
    fs.writeFileSync(timingPath, JSON.stringify(words));
  } catch {
    // non-fatal
  }
  if (hasBlob()) {
    const url = await blobStore(key, audio, words);
    if (url) return { audioUrl: url, words };
  }

  return { audioBase64: data.audio_base64, words };
}
