import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  exportRequirementsToJson, 
  exportScenariosToJson, 
  exportTreesToJson 
} from '@/lib/sync';

export async function POST(request: Request) {
  try {
    // Ensure SQLite database has the flagged and flagComment columns
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Requirement ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT 0;`);
    } catch (e) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Requirement ADD COLUMN flagComment TEXT;`);
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

    const { type, id, flagged, comment } = await request.json();

    if (type === 'requirement') {
      await prisma.requirement.update({
        where: { uid: id },
        data: {
          flagged,
          flagComment: comment
        }
      });
      await exportRequirementsToJson();
      return NextResponse.json({ success: true });
    }
    
    if (type === 'scenario') {
      await prisma.scenario.update({
        where: { id },
        data: {
          flagged,
          flagComment: comment
        }
      });
      await exportScenariosToJson();
      return NextResponse.json({ success: true });
    }
    
    if (type === 'option') {
      const [scenarioId, optionIndexStr] = id.split(':');
      const optionIndex = parseInt(optionIndexStr);
      const options = await prisma.scenarioOption.findMany({
        where: { scenarioId },
        orderBy: { id: 'asc' }
      });
      const option = options[optionIndex];
      if (option) {
        await prisma.scenarioOption.update({
          where: { id: option.id },
          data: {
            flagged,
            flagComment: comment
          }
        });
        await exportScenariosToJson();
        return NextResponse.json({ success: true });
      }
    }
    
    if (type === 'tree-node') {
      const [treeId, nodeId] = id.split(':');
      const tree = await prisma.decisionTree.findUnique({
        where: { id: treeId }
      });
      if (tree) {
        const treeData = JSON.parse(tree.data);
        if (treeData.nodes && treeData.nodes[nodeId]) {
          treeData.nodes[nodeId].flagged = flagged;
          treeData.nodes[nodeId].flagComment = comment;
          await prisma.decisionTree.update({
            where: { id: treeId },
            data: {
              data: JSON.stringify(treeData)
            }
          });
          await exportTreesToJson();
          return NextResponse.json({ success: true });
        }
      }
    }

    return NextResponse.json({ error: 'Invalid type or element not found' }, { status: 400 });
  } catch (error: any) {
    console.error('Flag update error:', error);
    return NextResponse.json({ error: 'Failed to update flag', details: error.message }, { status: 500 });
  }
}
