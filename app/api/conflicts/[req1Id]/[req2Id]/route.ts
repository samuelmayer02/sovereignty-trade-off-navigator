import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportConflictsToJson } from '@/lib/sync';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ req1Id: string; req2Id: string }> }
) {
  try {
    const { req1Id, req2Id } = await params;
    const body = await request.json();
    
    // Validate body payload
    if (typeof body.is_ground_truth !== 'boolean' || !body.conflict_text) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Since the order of req1Id and req2Id might be swapped in the DB, we need to check both ways or rely on the unique constraint if we can reliably find it.
    const conflict = await prisma.conflict.findFirst({
      where: {
        OR: [
          { req1Id: req1Id, req2Id: req2Id },
          { req1Id: req2Id, req2Id: req1Id }
        ]
      }
    });

    if (conflict) {
      await prisma.conflict.update({
        where: { id: conflict.id },
        data: {
          isGroundTruth: body.is_ground_truth,
          conflictText: body.conflict_text,
          bestPractice: body.best_practice || null,
        }
      });
    } else {
      await prisma.conflict.create({
        data: {
          req1Id: req1Id,
          req2Id: req2Id,
          status: body.status || 'gray',
          conflictText: body.conflict_text,
          bestPractice: body.best_practice || null,
          isGroundTruth: body.is_ground_truth
        }
      });
    }

    await exportConflictsToJson();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating conflict:', error);
    return NextResponse.json({ error: 'Failed to update conflict' }, { status: 500 });
  }
}
