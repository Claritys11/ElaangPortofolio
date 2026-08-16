import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { deleteSecureMessage } from '@/lib/server-storage';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  await deleteSecureMessage(id);
  return NextResponse.json({ ok: true });
}
