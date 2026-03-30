import { createReadStream, createWriteStream } from 'fs';
import { mkdir, stat, unlink } from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const UPLOADS_DIRECTORY = path.resolve(process.cwd(), 'public', 'uploads');

function isValidAssetName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  if (name.includes('/') || name.includes('\\') || /[\u0000-\u001f\u007f]/.test(name)) {
    return false;
  }

  return true;
}

function getUploadFilePath(name: string): string {
  return path.join(UPLOADS_DIRECTORY, name);
}

function getMimeType(name: string): string {
  const extension = path.extname(name).toLowerCase();

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.mp4':
      return 'video/mp4';
    case '.mp3':
      return 'audio/mpeg';
    case '.pdf':
      return 'application/pdf';
    case '.txt':
      return 'text/plain';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

export function getPublicUploadUrl(name: string): string {
  return `/api/public/uploads/${encodeURIComponent(name)}`;
}

export async function uploadFileToUploadsFolder(
  name: string,
  body: ReadableStream<Uint8Array>,
  contentType: string,
  size?: number
): Promise<{
  ok: true;
  publicUrl: string;
  name: string;
  contentType: string;
} | {
  ok: false;
  error: string;
  status?: number;
}> {
  if (!isValidAssetName(name)) {
    return { ok: false, error: 'Invalid file name.', status: 400 };
  }

  const filePath = getUploadFilePath(name);
  await mkdir(path.dirname(filePath), { recursive: true });

  const writable = createWriteStream(filePath, { flags: 'w' });
  const readable = Readable.fromWeb(body as any);

  try {
    await pipeline(readable, writable);
  } catch (error) {
    return {
      ok: false,
      error: 'Failed to write upload file.',
      status: 500,
    };
  }

  return {
    ok: true,
    publicUrl: getPublicUploadUrl(name),
    name,
    contentType: contentType || getMimeType(name),
  };
}

export async function deleteFileFromUploadsFolder(
  name: string
): Promise<{
  ok: true;
  name: string;
  message: string;
} | {
  ok: false;
  error: string;
  status?: number;
}> {
  if (!isValidAssetName(name)) {
    return { ok: false, error: 'Invalid asset name.', status: 400 };
  }

  const filePath = getUploadFilePath(name);

  try {
    await unlink(filePath);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { ok: false, error: 'File not found.', status: 404 };
    }

    return { ok: false, error: 'Failed to remove file.', status: 500 };
  }

  return {
    ok: true,
    name,
    message: 'File removed successfully.',
  };
}

export async function downloadFileFromUploadsFolder(
  name: string
): Promise<{
  ok: true;
  response: Response;
  contentType: string;
} | {
  ok: false;
  error: string;
  status?: number;
}> {
  if (!isValidAssetName(name)) {
    return { ok: false, error: 'Invalid asset name.', status: 400 };
  }

  const filePath = getUploadFilePath(name);

  try {
    const stats = await stat(filePath);
    const contentType = getMimeType(name);
    const stream = createReadStream(filePath);
    const response = new Response(Readable.toWeb(stream), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stats.size),
      },
    });

    return { ok: true, response, contentType };
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { ok: false, error: 'File not found.', status: 404 };
    }

    return { ok: false, error: 'Failed to read file.', status: 500 };
  }
}
