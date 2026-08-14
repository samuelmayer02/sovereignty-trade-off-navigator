import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportCategoryImpactsToJson } from '@/lib/sync';

export async function GET() {
  try {
    const impacts = await prisma.categoryImpact.findMany();
    const formatted = impacts.map(i => ({
      requirement_id: i.requirementId,
      category_name: i.categoryName,
      status: i.status,
      reasoning: i.reasoning,
      is_ground_truth: i.isGroundTruth
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch category impacts:', error);
    return NextResponse.json({ error: 'Failed to fetch category impacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    await prisma.categoryImpact.deleteMany({});
    
    for (const impact of body) {
      await prisma.categoryImpact.create({
        data: {
          requirementId: impact.requirement_id || impact.requirementId,
          categoryName: impact.category_name || impact.categoryName,
          status: impact.status,
          reasoning: impact.reasoning,
          isGroundTruth: impact.is_ground_truth || false,
        },
      });
    }

    await exportCategoryImpactsToJson();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save category impacts:', error);
    return NextResponse.json({ error: 'Failed to save category impacts' }, { status: 500 });
  }
}
