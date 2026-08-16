import { NextResponse } from 'next/server';
import { listWriteupSummaries } from '@/lib/server-storage';
import type { WriteupRecord } from '@/lib/portfolio-types';

export async function GET() {
  const rows = await listWriteupSummaries();
  return NextResponse.json(rows satisfies WriteupRecord[]);
}
