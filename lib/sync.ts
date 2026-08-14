import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function exportRequirementsToJson() {
  const requirements = await prisma.requirement.findMany({
    select: {
      uid: true,
      name: true,
      description: true,
      groupId: true,
      group: {
        select: {
          categoryName: true
        }
      },
      flagged: true,
      flagComment: true
    },
    orderBy: { uid: 'asc' }
  });
  const data = requirements.map(r => ({
    uid: r.uid,
    category: r.group?.categoryName || 'Unkategorisiert',
    name: r.name,
    description: r.description,
    groupId: r.groupId,
    flagged: r.flagged,
    flagComment: r.flagComment
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'requirements.json'), JSON.stringify(data, null, 2), 'utf8');
}

export async function exportCategoriesToJson() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
  fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2), 'utf8');
}

export async function exportGroupsToJson() {
  const groups = await prisma.group.findMany({
    orderBy: { id: 'asc' }
  });
  fs.writeFileSync(path.join(DATA_DIR, 'groups.json'), JSON.stringify(groups, null, 2), 'utf8');
}

export async function exportScenariosToJson() {
  const scenarios = await prisma.scenario.findMany({
    include: {
      options: {
        include: {
          requirements: {
            select: {
              uid: true
            }
          }
        }
      }
    },
    orderBy: { id: 'asc' }
  });

  const data = scenarios.map(s => ({
    scenario_id: s.id,
    category: s.category,
    topic: s.topic,
    stimulus: s.stimulus,
    metric_question: s.metricQuestion,
    rationale: s.rationale,
    flagged: s.flagged,
    flagComment: s.flagComment,
    options: s.options.map(o => ({
      label: o.label,
      description: o.description,
      flagged: o.flagged,
      flagComment: o.flagComment,
      referenced_requirements: o.requirements.map(r => r.uid)
    }))
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'scenarios.json'), JSON.stringify(data, null, 2), 'utf8');
}

export async function exportConflictsToJson() {
  const conflicts = await prisma.conflict.findMany();
  const data = conflicts.map(c => ({
    pair: [c.req1Id, c.req2Id],
    status: c.status,
    conflict_text: c.conflictText,
    best_practice: c.bestPractice || "",
    is_ground_truth: c.isGroundTruth
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'conflict_matrix.json'), JSON.stringify(data, null, 2), 'utf8');
}

export async function exportTreesToJson() {
  const trees = await prisma.decisionTree.findMany();
  const data = trees.map(t => JSON.parse(t.data));
  fs.writeFileSync(path.join(DATA_DIR, 'decision_trees.json'), JSON.stringify(data, null, 2), 'utf8');
}

export async function exportCategoryImpactsToJson() {
  const impacts = await prisma.categoryImpact.findMany();
  const data = impacts.map(i => ({
    requirement_id: i.requirementId,
    category_name: i.categoryName,
    status: i.status,
    reasoning: i.reasoning,
    is_ground_truth: i.isGroundTruth
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'category_impacts.json'), JSON.stringify(data, null, 2), 'utf8');
}

export async function exportAllToJson() {
  await Promise.all([
    exportRequirementsToJson(),
    exportCategoriesToJson(),
    exportGroupsToJson(),
    exportScenariosToJson(),
    exportConflictsToJson(),
    exportCategoryImpactsToJson(),
    exportTreesToJson()
  ]);
}
