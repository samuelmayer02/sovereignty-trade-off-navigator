import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportTreesToJson } from '@/lib/sync';

export async function GET() {
  try {
    console.log('API: GET /api/trees triggered');
    const trees = await prisma.decisionTree.findMany();
    console.log(`API: Found ${trees.length} trees in DB`);
    const formatted = trees.map(t => JSON.parse(t.data));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('API Error in GET /api/trees:', error);
    return NextResponse.json({ error: 'Failed to fetch trees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    for (const tree of body) {
      await prisma.decisionTree.upsert({
        where: { id: tree.id },
        update: {
          name: tree.title,
          data: JSON.stringify(tree),
        },
        create: {
          id: tree.id,
          name: tree.title,
          data: JSON.stringify(tree),
        },
      });
    }

    const currentIds = body.map(t => t.id);
    await prisma.decisionTree.deleteMany({
      where: { id: { notIn: currentIds } }
    });

    await exportTreesToJson();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving trees:', error);
    return NextResponse.json({
      error: 'Failed to save trees',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
