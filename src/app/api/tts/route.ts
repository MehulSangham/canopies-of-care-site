import { NextResponse } from 'next/server';
import { getReadableSegments, synthesizeSegment } from '@/lib/tts';

export const maxDuration = 60;

/**
 * Page reader endpoint.
 *
 * POST { slug }            → manifest: { total, segments: [{ index, kind, text }] }
 * POST { slug, index: n }  → audio:    { index, text, audioBase64, words }
 *
 * Public (reading is a visitor feature); inputs are bounded to existing
 * pages and segment indexes, and synthesis results are cached on disk.
 */
export async function POST(req: Request) {
  let body: { slug?: string; index?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { slug, index } = body;
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'Missing slug' }, { status: 400 });
  }

  const segments = getReadableSegments(slug);
  if (!segments) {
    return NextResponse.json({ ok: false, error: 'Page not found' }, { status: 404 });
  }

  // Manifest request
  if (index === undefined || index === null) {
    return NextResponse.json({
      ok: true,
      total: segments.length,
      segments: segments.map((s, i) => ({ index: i, kind: s.kind, text: s.text })),
    });
  }

  // Audio request
  if (!Number.isInteger(index) || index < 0 || index >= segments.length) {
    return NextResponse.json({ ok: false, error: 'Bad segment index' }, { status: 400 });
  }

  try {
    const { audioBase64, words } = await synthesizeSegment(segments[index].text);
    return NextResponse.json({
      ok: true,
      index,
      text: segments[index].text,
      audioBase64,
      words,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Synthesis failed';
    const status = message.includes('No ELEVENLABS_API_KEY') ? 503 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
