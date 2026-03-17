import { NextResponse } from 'next/server';
import { listProjects } from '@/lib/server-storage';
import type { ProjectRecord } from '@/lib/portfolio-types';

export async function GET() {
  const rows = await listProjects();
  return NextResponse.json(rows satisfies ProjectRecord[]);
}