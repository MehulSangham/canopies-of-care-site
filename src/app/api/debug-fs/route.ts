import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/** Temporary diagnostic: what does the serverless filesystem look like? */
export async function GET() {
  const cwd = process.cwd();
  const contentDir = path.join(cwd, 'content', 'archive');
  return NextResponse.json({
    cwd,
    cwdEntries: fs.readdirSync(cwd).slice(0, 40),
    contentExists: fs.existsSync(path.join(cwd, 'content')),
    archiveExists: fs.existsSync(contentDir),
    archiveEntries: fs.existsSync(contentDir) ? fs.readdirSync(contentDir) : null,
  });
}
