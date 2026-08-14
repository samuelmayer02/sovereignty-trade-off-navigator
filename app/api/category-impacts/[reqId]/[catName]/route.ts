import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportCategoryImpactsToJson } from '@/lib/sync';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reqId: string; catName: string }> }
) {
  try {
    const { reqId, catName } = await params;
    const decodedCatName = decodeURIComponent(catName);
    const body = await request.json();

    if (typeof body.is_ground_truth !== 'boolean' || !body.reasoning) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const impact = await prisma.categoryImpact.findUnique({
      where: {
        requirementId_categoryName: {
          requirementId: reqId,
          categoryName: decodedCatName
        }
      }
    });

    if (impact) {
      await prisma.categoryImpact.update({
        where: { id: impact.id },
        data: {
          isGroundTruth: body.is_ground_truth,
          reasoning: body.reasoning,
          status: body.status || impact.status
        }
      });
    } else {
      await prisma.categoryImpact.create({
        data: {
          requirementId: reqId,
          categoryName: decodedCatName,
          status: body.status || 'gray',
          reasoning: body.reasoning,
          isGroundTruth: body.is_ground_truth
        }
      });
    }

    await exportCategoryImpactsToJson();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category impact:', error);
    return NextResponse.json({ error: 'Failed to update category impact' }, { status: 500 });
  }
}
