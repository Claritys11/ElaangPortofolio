import { NextResponse } from 'next/server';
import { listAchievements } from '@/lib/server-storage';
import type { AchievementRecord } from '@/lib/portfolio-types';

export async function GET() {
  const rows = await listAchievements();
  return NextResponse.json(rows satisfies AchievementRecord[]);
}