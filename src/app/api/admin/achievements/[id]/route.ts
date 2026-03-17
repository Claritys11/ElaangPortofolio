import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { deleteAchievement, updateAchievement } from '@/lib/server-storage';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const data = await req.json();
  await updateAchievement(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  await deleteAchievement(id);
  return NextResponse.json({ ok: true });
}
