import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportConflictsToJson } from '@/lib/sync';

export async function GET() {
  try {
    const conflicts = await prisma.conflict.findMany();
    const formatted = conflicts.map(c => ({
      pair: [c.req1Id, c.req2Id],
      status: c.status,
      conflict_text: c.conflictText,
      best_practice: c.bestPractice || "",
      is_ground_truth: c.isGroundTruth
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch conflicts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    // Conflicts are usually updated in bulk
    await prisma.conflict.deleteMany({});
    
    for (const conflict of body) {
      await prisma.conflict.create({
        data: {
          req1Id: conflict.pair[0],
          req2Id: conflict.pair[1],
          status: conflict.status,
          conflictText: conflict.conflict_text,
          bestPractice: conflict.best_practice,
          isGroundTruth: conflict.is_ground_truth || false,
        },
      });
    }

    await exportConflictsToJson();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save conflicts' }, { status: 500 });
  }
}
