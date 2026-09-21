#!/usr/bin/env node
/**
 * One-time voice activation. Run after upgrading the ElevenLabs plan:
 *
 *   npm run voice:setup
 *
 * 1. Adds the configured voice-library voice to the account's My Voices
 *    (required before the API will synthesize with it).
 * 2. Runs a test synthesis and saves it to public/voice-samples/chosen.mp3
 *    so you can confirm the voice by ear.
 * 3. Prints the follow-up command to pre-generate the full archive audio.
 *
 * The voice is configured via ELEVENLABS_VOICE_ID in .env.local (and in
 * Vercel env for production). Default: "Hobbs", a deep, calm Black American
 * narration voice from the voice library.
 */
import fs from 'node:fs';
import path from 'node:path';

// Minimal .env.local loader (no dependency on Next)
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
if (!KEY || !VOICE_ID) {
  console.error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in .env.local');
  process.exit(1);
}

const api = (p, init = {}) =>
  fetch(`https://api.elevenlabs.io/v1${p}`, {
    ...init,
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json', ...init.headers },
  });

// 1. Is the voice already in My Voices?
const mine = await api('/voices').then((r) => r.json());
const already = (mine.voices ?? []).some((v) => v.voice_id === VOICE_ID);

if (already) {
  console.log('Voice is already added to the account.');
} else {
  // Find it in the shared library to get its owner id, then add it
  console.log('Locating voice in the library…');
  let owner = null;
  let name = VOICE_ID;
  for (const term of [
    'african american narration',
    'african american narrator',
    'african american deep',
  ]) {
    const d = await api(
      `/shared-voices?search=${encodeURIComponent(term)}&page_size=10&language=en`,
    ).then((r) => r.json());
    const hit = (d.voices ?? []).find((v) => v.voice_id === VOICE_ID);
    if (hit) {
      owner = hit.public_owner_id;
      name = hit.name;
      break;
    }
  }
  if (!owner) {
    console.error(
      `Could not find voice ${VOICE_ID} in the library. If you picked a different voice, update ELEVENLABS_VOICE_ID and the search terms in this script.`,
    );
    process.exit(1);
  }
  console.log(`Adding "${name}" to My Voices…`);
  const add = await api(`/voices/add/${owner}/${VOICE_ID}`, {
    method: 'POST',
    body: JSON.stringify({ new_name: name.split(' - ')[0] }),
  });
  if (!add.ok) {
    console.error(`Add failed (${add.status}): ${(await add.text()).slice(0, 300)}`);
    process.exit(1);
  }
  console.log('Added.');
}

// 2. Test synthesis
console.log('Running a test synthesis…');
const res = await api(`/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
  method: 'POST',
  body: JSON.stringify({
    text:
      'In 1787, two things happened in Philadelphia. From May to September, ' +
      'the Constitutional Convention drafted the rules for who would be ' +
      'recognised as American. In April of the same year, two free Black ' +
      'ministers named Richard Allen and Absalom Jones founded the Free ' +
      'African Society.',
    model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
  }),
});
if (!res.ok) {
  const body = (await res.text()).slice(0, 300);
  if (res.status === 402) {
    console.error(
      'Synthesis blocked: the account is still on the free plan. Upgrade at https://elevenlabs.io/app/subscription and re-run this script.',
    );
  } else {
    console.error(`Synthesis failed (${res.status}): ${body}`);
  }
  process.exit(1);
}
const audio = Buffer.from(await res.arrayBuffer());
fs.mkdirSync('public/voice-samples', { recursive: true });
fs.writeFileSync('public/voice-samples/chosen.mp3', audio);
console.log(`\nVoice is live. Listen: http://localhost:3000/voice-samples/chosen.mp3`);
console.log('\nNext: pre-generate the full archive audio (one-time cost, cached forever):');
console.log('  npm run audio:warm                                        # local dev server');
console.log('  npm run audio:warm -- https://canopies-of-care-site.vercel.app   # production');
