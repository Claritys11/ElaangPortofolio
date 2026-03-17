import { NextResponse } from 'next/server';
import { getWriteupById } from '@/lib/server-storage';
import type { WriteupRecord } from '@/lib/portfolio-types';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getWriteupById(id);

  if (!row) {
    return NextResponse.json({ error: 'Write-up not found.' }, { status: 404 });
  }

  return NextResponse.json(row satisfies WriteupRecord);
}