import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleToolCall } from '../mcp-server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { exportAllToJson } from '@/lib/sync';

const REQUIREMENTS_PATH = path.join(process.cwd(), 'data/requirements.json');
const CONFLICTS_PATH = path.join(process.cwd(), 'data/conflict_matrix.json');

describe('MCP Server & Sync Integration', () => {
  const testCategory = 'TEST-CAT-' + Date.now();
  const testReqName = 'Test Requirement ' + Date.now();
  let createdReqUid: string | null = null;
  let originalConflict: any = null;
  let conflictPair: [string, string] | null = null;
  let createdTestGroupId: string | null = null;

  let originalRequirementsContent: string | null = null;
  let originalConflictsContent: string | null = null;

  beforeAll(async () => {
    // Backup the live JSON files before starting tests
    if (fs.existsSync(REQUIREMENTS_PATH)) {
      originalRequirementsContent = fs.readFileSync(REQUIREMENTS_PATH, 'utf8');
    }
    if (fs.existsSync(CONFLICTS_PATH)) {
      originalConflictsContent = fs.readFileSync(CONFLICTS_PATH, 'utf8');
    }
  });

  afterAll(async () => {
    console.log('Cleaning up test data...');
    const createdGroupForAdd = 'GROUP_' + testCategory.replace(/\s+/g, '_').toUpperCase();

    // 1. Delete test conflicts created for conflict test (or any pointing to test UIDs)
    try {
      const testReqUids = [
        createdReqUid,
        conflictPair ? conflictPair[0] : null,
        conflictPair ? conflictPair[1] : null
      ].filter(Boolean) as string[];

      if (testReqUids.length > 0) {
        await prisma.conflict.deleteMany({
          where: {
            OR: [
              { req1Id: { in: testReqUids } },
              { req2Id: { in: testReqUids } }
            ]
          }
        });
      }
    } catch (e) {
      console.error("FAILED TO DELETE CONFLICTS IN TEST CLEANUP:", e);
    }

    // 2. Delete test requirements (using name, group ID, or exact UIDs)
    try {
      const deleteConditions = [
        createdReqUid ? { uid: createdReqUid } : null,
        { name: testReqName },
        { groupId: createdGroupForAdd },
        conflictPair ? { uid: conflictPair[0] } : null,
        conflictPair ? { uid: conflictPair[1] } : null,
        createdTestGroupId ? { groupId: createdTestGroupId } : null
      ].filter(x => x !== null) as any;

      await prisma.requirement.deleteMany({
        where: {
          OR: deleteConditions
        }
      });
    } catch (e) {
      console.error("FAILED TO DELETE REQS IN TEST CLEANUP:", e);
    }

    // 3. Restore original conflict if it existed and was overwritten
    if (conflictPair && originalConflict) {
      try {
        await prisma.conflict.upsert({
          where: { req1Id_req2Id: { req1Id: conflictPair[0], req2Id: conflictPair[1] } },
          update: {
            status: originalConflict.status,
            conflictText: originalConflict.conflict_text,
            bestPractice: originalConflict.best_practice
          },
          create: {
            req1Id: conflictPair[0],
            req2Id: conflictPair[1],
            status: originalConflict.status,
            conflictText: originalConflict.conflict_text,
            bestPractice: originalConflict.best_practice
          }
        });
      } catch (e) {
        console.error("FAILED TO RESTORE CONFLICT IN TEST CLEANUP:", e);
      }
    }

    // 4. Clean up test groups
    try {
      await prisma.group.deleteMany({
        where: {
          id: {
            in: [
              createdTestGroupId || '',
              createdGroupForAdd
            ].filter(Boolean)
          }
        }
      });
    } catch (e) {
      console.error("FAILED TO DELETE GROUPS IN TEST CLEANUP:", e);
    }

    // 5. Delete test category
    try {
      await prisma.category.deleteMany({ where: { name: testCategory } });
    } catch (e) {
      console.error("FAILED TO DELETE CATEGORIES IN TEST CLEANUP:", e);
    }

    // 6. Sync everything back to JSON to restore DB changes state
    try {
      await exportAllToJson();
    } catch (e) {
      console.warn('Failed to export DB back to JSON, relying on direct file restore', e);
    }

    // 7. ALWAYS restore original JSON contents from backup to guarantee untouched files
    console.log('Restoring original JSON files from backup...');
    if (originalRequirementsContent !== null) {
      fs.writeFileSync(REQUIREMENTS_PATH, originalRequirementsContent, 'utf8');
    }
    if (originalConflictsContent !== null) {
      fs.writeFileSync(CONFLICTS_PATH, originalConflictsContent, 'utf8');
    }
  });

  it('should add a requirement and sync it to requirements.json', async () => {
    const result = await handleToolCall('add_requirement', {
      name: testReqName,
      description: 'A requirement for testing',
      category: testCategory
    });

    if (result.isError) {
      throw new Error(`Add Req Error: ${result.content[0].text}`);
    }
    expect(result.isError).toBeUndefined();

    // Extract UID for cleanup
    const match = result.content[0].text.match(/Requirement added: (.*)/);
    if (match) createdReqUid = match[1];

    // 1. Verify in JSON
    const data = JSON.parse(fs.readFileSync(REQUIREMENTS_PATH, 'utf8'));
    const found = data.find((r: any) => r.name === testReqName);
    expect(found).toBeDefined();
    expect(found.category).toBe(testCategory);
  });

  it('should batch update conflicts and sync to conflict_matrix.json', async () => {
    // Dynamically create two distinct requirements in the database to ensure 100% self-contained tests
    const id1 = 'test-conflict-req-1-' + Date.now();
    const id2 = 'test-conflict-req-2-' + Date.now();

    await prisma.category.upsert({
      where: { name: testCategory },
      update: {},
      create: { name: testCategory, prefix: 'REQ' }
    });

    createdTestGroupId = 'TEST-GROUP-' + Date.now();
    await prisma.group.create({
      data: {
        id: createdTestGroupId,
        name: 'Test Group for Conflicts',
        type: 'multi',
        categoryName: testCategory
      }
    });

    await prisma.requirement.create({
      data: {
        uid: id1,
        name: 'Conflict Test Req 1',
        description: 'First requirement for testing conflicts',
        groupId: createdTestGroupId
      }
    });

    await prisma.requirement.create({
      data: {
        uid: id2,
        name: 'Conflict Test Req 2',
        description: 'Second requirement for testing conflicts',
        groupId: createdTestGroupId
      }
    });

    const [sortedId1, sortedId2] = [id1, id2].sort();
    conflictPair = [sortedId1, sortedId2];

    originalConflict = null;

    const conflictText = 'Test conflict text ' + Date.now();

    const result = await handleToolCall('batch_update_conflicts', {
      conflicts: [
        {
          req1Id: id1,
          req2Id: id2,
          status: 'red',
          conflictText: conflictText
        }
      ]
    });

    if (result.isError) {
      throw new Error(`Batch Update Error: ${result.content[0].text}`);
    }
    expect(result.isError).toBeUndefined();

    // Verify in JSON
    const conflicts = JSON.parse(fs.readFileSync(CONFLICTS_PATH, 'utf8'));
    const found = conflicts.find((c: any) =>
      c.pair[0] === id1 && c.pair[1] === id2
    );

    expect(found).toBeDefined();
    expect(found.status).toBe('red');
    expect(found.conflict_text).toBe(conflictText);
  });

  it('should return error for unknown tool', async () => {
    const result = await handleToolCall('unknown_tool', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Tool not found');
  });
});
