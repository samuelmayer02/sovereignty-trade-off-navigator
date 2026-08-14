import { prisma } from '../lib/prisma';
import { exportAllToJson } from '../lib/sync';

async function main() {
  console.log('Cleaning up all test data from database...');

  // 1. Delete test conflicts
  const deletedConflicts = await prisma.conflict.deleteMany({
    where: {
      OR: [
        { conflictText: { contains: 'Test conflict' } },
        { req1Id: { contains: 'test' } },
        { req2Id: { contains: 'test' } }
      ]
    }
  });
  console.log(`Deleted ${deletedConflicts.count} test conflicts.`);

  // 2. Delete test requirements
  const deletedReqs = await prisma.requirement.deleteMany({
    where: {
      OR: [
        { uid: { contains: 'test' } },
        { name: { contains: 'Test Requirement' } },
        { name: { contains: 'Conflict Test' } },
        { description: { contains: 'requirement for testing' } },
        { description: { contains: 'testing conflicts' } }
      ]
    }
  });
  console.log(`Deleted ${deletedReqs.count} test requirements.`);

  // 3. Delete test groups
  const deletedGroups = await prisma.group.deleteMany({
    where: {
      OR: [
        { id: { contains: 'TEST-' } },
        { id: { startsWith: 'GROUP_TEST' } },
        { categoryName: { contains: 'TEST-' } }
      ]
    }
  });
  console.log(`Deleted ${deletedGroups.count} test groups.`);

  // 4. Delete test categories
  const deletedCategories = await prisma.category.deleteMany({
    where: {
      name: { contains: 'TEST-' }
    }
  });
  console.log(`Deleted ${deletedCategories.count} test categories.`);

  // 5. Sync to JSON files
  console.log('Syncing database back to JSON files...');
  await exportAllToJson();
  console.log('Done.');
}

main().catch(console.error);
