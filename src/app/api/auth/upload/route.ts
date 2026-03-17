import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Upload endpoint disabled. Use in-app image handling flow.' },
    { status: 410 }
  );
}
