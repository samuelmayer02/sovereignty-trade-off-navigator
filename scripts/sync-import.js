/* eslint-disable */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
require("dotenv/config");
const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Starting seed...');
    // Clear existing database tables first to sync deletions from JSON
    console.log('Clearing existing tables...');
    await prisma.categoryImpact.deleteMany({});
    await prisma.conflict.deleteMany({});
    await prisma.scenarioOption.deleteMany({});
    await prisma.scenario.deleteMany({});
    await prisma.requirement.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.decisionTree.deleteMany({});
    console.log('Database cleared.');
    // 1. Categories
    const categoriesData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'data/categories.json'), 'utf8'));
    for (const cat of categoriesData) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: { prefix: cat.prefix, uid: cat.uid, goal: cat.goal },
            create: { name: cat.name, prefix: cat.prefix, uid: cat.uid, goal: cat.goal },
        });
    }
    console.log('Categories seeded.');
    // 2. Groups
    const groupsData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'data/groups.json'), 'utf8'));
    for (const group of groupsData) {
        if (group.categoryName) {
            await prisma.category.upsert({
                where: { name: group.categoryName },
                update: {},
                create: { name: group.categoryName, prefix: 'REQ', goal: null },
            });
        }
        await prisma.group.upsert({
            where: { id: group.id },
            update: { name: group.name, type: group.type, uid: group.uid, categoryName: group.categoryName || 'Unkategorisiert' },
            create: { id: group.id, name: group.name, type: group.type, uid: group.uid, categoryName: group.categoryName || 'Unkategorisiert' },
        });
    }
    console.log('Groups seeded.');
    // 3. Requirements
    const requirementsData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'data/requirements.json'), 'utf8'));
    for (const req of requirementsData) {
        const groupId = req.groupId || req.group_id || null;
        // Ensure group exists if present
        if (groupId) {
            await prisma.group.upsert({
                where: { id: groupId },
                update: {},
                create: { id: groupId, name: groupId, type: 'multi', categoryName: 'Unkategorisiert' },
            });
        }
        await prisma.requirement.upsert({
            where: { uid: req.uid },
            update: {
                name: req.name,
                description: req.description,
                groupId: groupId,
                flagged: req.flagged || false,
                flagComment: req.flagComment || null,
            },
            create: {
                uid: req.uid,
                name: req.name,
                description: req.description,
                groupId: groupId,
                flagged: req.flagged || false,
                flagComment: req.flagComment || null,
            },
        });
    }
    console.log('Requirements seeded.');
    // 4. Scenarios
    const scenariosData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'data/scenarios.json'), 'utf8'));
    await prisma.scenario.deleteMany({});
    for (const scenario of scenariosData) {
        await prisma.scenario.upsert({
            where: { id: scenario.scenario_id },
            update: {
                category: scenario.category,
                topic: scenario.topic,
                stimulus: scenario.stimulus,
                metricQuestion: scenario.metric_question,
                relevance: scenario.relevance || null,
                flagged: scenario.flagged || false,
                flagComment: scenario.flagComment || null,
            },
            create: {
                id: scenario.scenario_id,
                category: scenario.category,
                topic: scenario.topic,
                stimulus: scenario.stimulus,
                metricQuestion: scenario.metric_question,
                relevance: scenario.relevance || null,
                flagged: scenario.flagged || false,
                flagComment: scenario.flagComment || null,
            },
        });
        // Options
        await prisma.scenarioOption.deleteMany({ where: { scenarioId: scenario.scenario_id } });
        for (const option of scenario.options) {
            await prisma.scenarioOption.create({
                data: {
                    scenarioId: scenario.scenario_id,
                    label: option.label,
                    description: option.description,
                    flagged: option.flagged || false,
                    flagComment: option.flagComment || null,
                    requirements: {
                        connect: option.referenced_requirements.map((uid) => ({ uid })),
                    },
                },
            });
        }
    }
    console.log('Scenarios seeded.');
    // 5. Conflicts
    const conflictsData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'data/conflict_matrix.json'), 'utf8'));
    await prisma.conflict.deleteMany({});
    for (const conflict of conflictsData) {
        const [id1, id2] = [conflict.pair[0], conflict.pair[1]].sort();
        await prisma.conflict.upsert({
            where: {
                req1Id_req2Id: { req1Id: id1, req2Id: id2 }
            },
            update: {
                status: conflict.status,
                conflictText: conflict.conflict_text,
                bestPractice: conflict.best_practice,
                isGroundTruth: conflict.is_ground_truth || false,
            },
            create: {
                req1Id: id1,
                req2Id: id2,
                status: conflict.status,
                conflictText: conflict.conflict_text,
                bestPractice: conflict.best_practice,
                isGroundTruth: conflict.is_ground_truth || false,
            },
        });
    }
    console.log('Conflicts seeded.');
    // 5.5 Category Impacts
    const categoryImpactsPath = path_1.default.join(process.cwd(), 'data/category_impacts.json');
    if (fs_1.default.existsSync(categoryImpactsPath)) {
        const impactsData = JSON.parse(fs_1.default.readFileSync(categoryImpactsPath, 'utf8'));
        await prisma.categoryImpact.deleteMany({});
        for (const impact of impactsData) {
            await prisma.categoryImpact.create({
                data: {
                    requirementId: impact.requirement_id,
                    categoryName: impact.category_name,
                    status: impact.status,
                    reasoning: impact.reasoning,
                    isGroundTruth: impact.is_ground_truth || false,
                },
            });
        }
        console.log('Category Impacts seeded.');
    }
    // 6. Decision Trees
    const treesData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'data/decision_trees.json'), 'utf8'));
    await prisma.decisionTree.deleteMany({});
    for (const tree of treesData) {
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
    console.log('Decision Trees seeded.');
    // 7. Sessions
    const sessionDir = path_1.default.join(process.cwd(), 'data/sessions');
    if (fs_1.default.existsSync(sessionDir)) {
        const sessionFiles = fs_1.default.readdirSync(sessionDir);
        for (const file of sessionFiles) {
            if (file.endsWith('.json')) {
                const sessionId = file.replace('.json', '');
                const sessionData = fs_1.default.readFileSync(path_1.default.join(sessionDir, file), 'utf8');
                await prisma.session.upsert({
                    where: { id: sessionId },
                    update: { data: sessionData },
                    create: { id: sessionId, data: sessionData },
                });
            }
        }
        console.log('Sessions seeded.');
    }
    console.log('Seed completed successfully.');
}
main()
    .catch((e) => {
    console.error('Seed Error:', e.message);
    if (e.cause)
        console.error('Cause:', e.cause);
    if (e.request)
        console.error('Request:', e.request);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
