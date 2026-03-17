import { NextRequest, NextResponse } from 'next/server';
import { createContactMessage } from '@/lib/server-storage';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    await createContactMessage({
      name: String(name),
      email: String(email),
      subject: String(subject),
      message: String(message),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}