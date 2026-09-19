import 'server-only';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { parseMdxBlocks } from '@/lib/mdx-blocks';

/**
 * Server-side text-to-speech for the page reader.
 *
 * - Derives readable text segments (title, headings, paragraphs, blockquotes)
 *   from a page's MDX.
 * - Synthesizes each segment with ElevenLabs, requesting character-level
 *   timestamps, and converts them to word timings for karaoke highlighting.
 * - Caches audio + timings on disk keyed by a hash of (voice, model, text),
 *   so a segment is only ever synthesized once until its text changes.
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
  audioBase64: string;
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

/** Synthesize one segment, using the disk cache when possible. */
export async function synthesizeSegment(
  text: string,
): Promise<SynthesizedSegment> {
  const key = cacheKey(text);
  const audioPath = path.join(CACHE_DIR, `${key}.mp3`);
  const timingPath = path.join(CACHE_DIR, `${key}.json`);

  if (fs.existsSync(audioPath) && fs.existsSync(timingPath)) {
    return {
      audioBase64: fs.readFileSync(audioPath).toString('base64'),
      words: JSON.parse(fs.readFileSync(timingPath, 'utf8')),
    };
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

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(audioPath, Buffer.from(data.audio_base64, 'base64'));
  fs.writeFileSync(timingPath, JSON.stringify(words));

  return { audioBase64: data.audio_base64, words };
}
