import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSessionFromRequest } from '@/lib/session';
import { uploadFileToUploadsFolder } from '@/lib/upload-storage';

const MAX_SIZE = 100 * 1024 * 1024;

function sanitizeFileName(fileName: string): string {
  const normalized = (fileName || 'file.bin')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-{2,}/g, '-');

  return normalized || 'file.bin';
}

export async function POST(req: NextRequest) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const contentLengthHeader = req.headers.get('content-length');
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
  if (contentLength && Number.isFinite(contentLength) && contentLength > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 100 MB.' }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 100 MB.' }, { status: 413 });
  }

  const storedName = `${randomUUID()}-${sanitizeFileName(file.name)}`;
  const result = await uploadFileToUploadsFolder(
    storedName,
    file.stream(),
    file.type || 'application/octet-stream',
    file.size
  );

  if (!result.ok) {
    const statusCode = result.status && result.status >= 400 && result.status <= 599 ? result.status : 500;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }

  return NextResponse.json(
    {
      url: result.publicUrl,
      assetName: result.name,
      contentType: result.contentType,
    },
    { status: 201 }
  );
}
