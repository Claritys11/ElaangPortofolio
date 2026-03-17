import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { createAchievement, listAchievements } from '@/lib/server-storage';

export async function GET(req: NextRequest) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const rows = await listAchievements();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const data = await req.json();
  const id = await createAchievement(data);
  return NextResponse.json({ id }, { status: 201 });
}
