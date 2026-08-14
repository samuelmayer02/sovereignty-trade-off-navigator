import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.sessionId) {
      return NextResponse.json({ error: 'No sessionId provided' }, { status: 400 });
    }

    // Save to DB
    await prisma.session.upsert({
      where: { id: data.sessionId },
      update: { data: JSON.stringify(data) },
      create: { id: data.sessionId, data: JSON.stringify(data) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
