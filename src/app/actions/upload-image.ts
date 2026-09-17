'use server';

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { checkIsAdmin } from '@/lib/auth';
import { isGitHubMode, writeBinaryFile } from '@/lib/github';

export async function uploadImage(formData: FormData) {
  if (!(await checkIsAdmin())) {
    throw new Error('Unauthorized: admin access required');
  }

  const file = formData.get('file') as File | null;
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('No valid image file provided');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${randomUUID().slice(0, 8)}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isGitHubMode()) {
    const filePath = `public/images/uploads/${filename}`;
    await writeBinaryFile(filePath, buffer, `media: upload ${filename}`);
  } else {
    const uploadDir = path.join(process.cwd(), 'public/images/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
  }

  return { url: `/images/uploads/${filename}` };
}
