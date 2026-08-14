import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportGroupsToJson } from '@/lib/sync';

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        requirements: {
          select: {
            uid: true,
            name: true,
            description: true,
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    for (const group of body) {
      await prisma.group.upsert({
        where: { id: group.id },
        update: { name: group.name, type: group.type, uid: group.uid, categoryName: group.categoryName || 'Unkategorisiert' },
        create: { id: group.id, name: group.name, type: group.type, uid: group.uid, categoryName: group.categoryName || 'Unkategorisiert' },
      });
    }

    const currentIds = body.map(g => g.id);
    await prisma.group.deleteMany({
      where: { id: { notIn: currentIds } }
    });

    await exportGroupsToJson();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save groups' }, { status: 500 });
  }
}
