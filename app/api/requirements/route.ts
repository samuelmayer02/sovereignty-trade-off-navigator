import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportRequirementsToJson } from '@/lib/sync';
import nodeCrypto from 'crypto';

export async function GET() {
  try {

    // Dynamically migrate SQLite database schema if columns are missing
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Requirement ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT 0;`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Requirement ADD COLUMN flagComment TEXT;`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Category ADD COLUMN uid TEXT;`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Category_uid_key" ON "Category"("uid");`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Group" ADD COLUMN uid TEXT;`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Group_uid_key" ON "Group"("uid");`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Scenario ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT 0;`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Scenario ADD COLUMN flagComment TEXT;`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ScenarioOption ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT 0;`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ScenarioOption ADD COLUMN flagComment TEXT;`);
    } catch (e) {}

    const requirements = await prisma.requirement.findMany({
      select: {
        uid: true,
        name: true,
        description: true,
        groupId: true,
        group: { select: { categoryName: true } },
        flagged: true,
        flagComment: true
      },
      orderBy: { uid: 'asc' }
    });

    // Map database field names to frontend expectations
    const formatted = requirements.map(r => ({
      uid: r.uid,
      name: r.name,
      description: r.description,
      category: r.group?.categoryName || 'Unkategorisiert', // Frontend expects 'category'
      groupId: r.groupId,
      flagged: r.flagged,
      flagComment: r.flagComment
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('API Error in GET /api/requirements:', error);
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Upsert all requirements from the list
    // Note: In a real production app with many requirements, we might want to be more surgical
    // but here we just process the whole batch sent from the editor.
    for (const req of body) {
      const uid = req.uid || nodeCrypto.randomUUID();
      // Ensure group exists if provided
      if (req.groupId) {
        // Find group to check if it exists, or upsert. But wait, groups are synced.
        // We might need to ensure group's category exists if we wanted to be perfectly safe,
        // but for requirements upsert we don't handle category anymore.
      }

      // Ensure group exists if provided
      if (req.groupId) {
        await prisma.group.upsert({
          where: { id: req.groupId },
          update: {},
          create: { id: req.groupId, name: req.groupId, type: 'at-least-one', categoryName: 'Unkategorisiert' }
        });
      }

      await prisma.requirement.upsert({
        where: { uid },
        update: {
          name: req.name,
          description: req.description,
          groupId: req.groupId || null,
          flagged: req.flagged || false,
          flagComment: req.flagComment || null,
        },
        create: {
          uid,
          name: req.name,
          description: req.description,
          groupId: req.groupId || null,
          flagged: req.flagged || false,
          flagComment: req.flagComment || null,
        },
      });
    }

    // Remove requirements not in the list if necessary? 
    // The editor usually sends the whole list. 
    const currentUids = body.map(r => r.uid).filter(Boolean);
    await prisma.requirement.deleteMany({
      where: {
        uid: { notIn: currentUids }
      }
    });

    // Auto-export back to JSON for LLM visibility
    await exportRequirementsToJson();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving requirements:', error);
    return NextResponse.json({
      error: 'Failed to save requirements',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
