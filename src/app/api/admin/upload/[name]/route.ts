import { NextRequest, NextResponse } from 'next/server';
import { deleteFileFromGithubRelease } from '@/lib/github-release-storage';
import { getSessionFromRequest } from '@/lib/session';

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { name } = await params;
  const assetName = normalizeAssetName(name);

  if (!assetName) {
    return NextResponse.json({ error: 'Invalid asset name.' }, { status: 400 });
  }

  const result = await deleteFileFromGithubRelease(assetName);

  if (!result.ok) {
    const statusCode = result.status && result.status >= 400 && result.status <= 599 ? result.status : 500;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }

  return NextResponse.json({ ok: true, name: assetName, message: result.message });
}
