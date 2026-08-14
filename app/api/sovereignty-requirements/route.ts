import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const requirements = await prisma.requirement.findMany({
      include: {
        group: true
      }
    });
    
    const formatted = requirements.map(r => ({
      uid: r.uid,
      name: r.name,
      description: r.description,
      category: r.group?.categoryName || 'Unkategorisiert',
      groupId: r.groupId,
      groupName: r.group?.name || 'Ohne Gruppe',
      flagged: r.flagged,
      flagComment: r.flagComment
    }));
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('API Error in GET /api/sovereignty-requirements:', error);
    // Return empty array instead of error object to prevent .map crashes
    return NextResponse.json([]);
  }
}
