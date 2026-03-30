import { NextResponse } from 'next/server';
import { downloadFileFromUploadsFolder } from '@/lib/upload-storage';

function normalizeAssetName(rawName: string): string | null {
  const candidate = rawName.trim();

  if (!candidate) {
    return null;
  }

  if (candidate.includes('/') || candidate.includes('\\') || /[\u0000-\u001f\u007f]/.test(candidate)) {
    return null;
  }

  return candidate;
}

function toSafeInlineFileName(fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  return sanitized || 'asset.bin';
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const assetName = normalizeAssetName(name);

  if (!assetName) {
    return NextResponse.json({ error: 'Invalid asset name.' }, { status: 400 });
  }

  const result = await downloadFileFromUploadsFolder(assetName);

  if (!result.ok) {
    const statusCode = result.status && result.status >= 400 && result.status <= 599 ? result.status : 500;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }

  const headers = new Headers();
  headers.set('Content-Type', result.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=3600');
  headers.set('Content-Disposition', `inline; filename="${toSafeInlineFileName(assetName)}"`);

  const contentLength = result.response.headers.get('content-length');
  const eTag = result.response.headers.get('etag');
  const lastModified = result.response.headers.get('last-modified');

  if (contentLength) {
    headers.set('Content-Length', contentLength);
  }

  if (eTag) {
    headers.set('ETag', eTag);
  }

  if (lastModified) {
    headers.set('Last-Modified', lastModified);
  }

  return new Response(result.response.body, {
    status: 200,
    headers,
  });
}
