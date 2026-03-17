import { NextResponse } from 'next/server';
import { listWriteups } from '@/lib/server-storage';
import type { WriteupRecord } from '@/lib/portfolio-types';

export async function GET() {
  const rows = await listWriteups();
  return NextResponse.json(rows satisfies WriteupRecord[]);
}