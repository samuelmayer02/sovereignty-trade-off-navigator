import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportCategoriesToJson } from '@/lib/sync';

export const dynamic = 'force-dynamic';

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
      await prisma.$executeRawUnsafe(`ALTER TABLE Category ADD COLUMN goal TEXT;`);
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

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    for (const cat of body) {
      await prisma.category.upsert({
        where: { name: cat.name },
        update: { prefix: cat.prefix, uid: cat.uid, goal: cat.goal },
        create: { name: cat.name, prefix: cat.prefix, uid: cat.uid, goal: cat.goal },
      });
    }

    const currentNames = body.map(c => c.name);
    await prisma.category.deleteMany({
      where: { name: { notIn: currentNames } }
    });

    await exportCategoriesToJson();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save categories' }, { status: 500 });
  }
}
