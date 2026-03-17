import { NextResponse } from 'next/server';
import { getHomeSummary } from '@/lib/server-storage';

export async function GET() {
  const payload = await getHomeSummary();
  return NextResponse.json(payload);
}