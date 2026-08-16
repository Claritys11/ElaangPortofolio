import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { createWriteup, getWriteupById, listWriteups } from '@/lib/server-storage';

export async function GET(req: NextRequest) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const rows = await listWriteups();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const data = await req.json();
  const id = await createWriteup(data);
  const row = await getWriteupById(id);
  return NextResponse.json({ id, slug: row?.slug }, { status: 201 });
}
