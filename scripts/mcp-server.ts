import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { exportAllToJson, exportConflictsToJson, exportCategoryImpactsToJson } from "../lib/sync";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Robust __dirname equivalent for both CJS and ESM contexts
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..");

const originalWrite = process.stdout.write;
process.stdout.write = (() => {}) as any;
try {
  dotenv.config({ path: path.resolve(projectRoot, ".env") });
} finally {
  process.stdout.write = originalWrite;
}

const defaultDbPath = path.resolve(projectRoot, "prisma/dev.db");
let url = process.env.DATABASE_URL || `file:${defaultDbPath}`;
if (url.startsWith("file:")) {
  const dbPath = url.replace("file:", "");
  if (!path.isAbsolute(dbPath)) {
    url = `file:${path.resolve(projectRoot, dbPath)}`;
  }
}
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const server = new Server(
  {
    name: "master-matrix-server",
    version: "0.2.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_requirements",
        description: "Get all requirements",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_unrated_conflicts",
        description: "Find pairs of requirements that haven't been evaluated in the conflict matrix yet. Returns requirement details for each pair to save tokens.",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Filter by category name" },
            limit: { type: "number", default: 20, description: "Max number of pairs to return" },
          },
        },
      },
      {
        name: "batch_update_conflicts",
        description: "Update multiple conflicts at once. req1Id and req2Id will be automatically sorted to ensure consistency.",
        inputSchema: {
          type: "object",
          properties: {
            conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  req1Id: { type: "string" },
                  req2Id: { type: "string" },
                  status: { type: "string", enum: ["red", "orange", "green", "blue"] },
                  conflictText: { type: "string" },
                  bestPractice: { type: "string" },
                },
                required: ["req1Id", "req2Id", "status", "conflictText"],
              },
            },
          },
          required: ["conflicts"],
        },
      },
      {
        name: "get_unrated_category_impacts",
        description: "Find pairs of requirement and category that haven't been evaluated for impact yet.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", default: 20, description: "Max number of pairs to return" },
          },
        },
      },
      {
        name: "batch_update_category_impacts",
        description: "Update multiple category impacts at once.",
        inputSchema: {
          type: "object",
          properties: {
            impacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  requirementId: { type: "string" },
                  categoryName: { type: "string" },
                  status: { type: "string", enum: ["red", "orange", "green", "gray"] },
                  reasoning: { type: "string" },
                },
                required: ["requirementId", "categoryName", "status", "reasoning"],
              },
            },
          },
          required: ["impacts"],
        },
      },
      {
        name: "get_conflicts_by_context",
        description: "Get existing conflicts filtered by requirement IDs or categories",
        inputSchema: {
          type: "object",
          properties: {
            uids: { type: "array", items: { type: "string" } },
            category: { type: "string" },
          },
        },
      },
      {
        name: "get_groups",
        description: "Get all requirement groups",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_categories",
        description: "Get all categories",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_scenarios",
        description: "Get all scenarios and their options",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "add_requirement",
        description: "Add a new requirement",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            groupId: { type: "string" },
          },
          required: ["name", "description", "category"],
        },
      },
      {
        name: "update_requirement",
        description: "Update an existing requirement",
        inputSchema: {
          type: "object",
          properties: {
            uid: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            groupId: { type: "string" },
          },
          required: ["uid"],
        },
      },
    ],
  };
});

export async function handleToolCall(name: string, args: any) {
  try {
    switch (name) {
      case "get_requirements": {
        const data = await prisma.requirement.findMany({
          include: {
            group: {
              include: {
                category: true
              }
            }
          }
        });
        const formatted = data.map(r => ({
          uid: r.uid,
          name: r.name,
          description: r.description,
          groupId: r.groupId,
          group: r.group,
          category: r.group?.categoryName || 'Unkategorisiert',
          flagged: r.flagged,
          flagComment: r.flagComment
        }));
        return { content: [{ type: "text", text: JSON.stringify(formatted, null, 2) }] };
      }

      case "get_unrated_conflicts": {
        const { category, limit = 20 } = args as any;
        
        const reqs = await prisma.requirement.findMany({
          where: category ? { group: { categoryName: category } } : {},
          select: {
            uid: true,
            name: true,
            description: true,
            groupId: true,
            group: {
              select: {
                categoryName: true
              }
            }
          }
        });

        const mappedReqs = reqs.map(r => ({
          uid: r.uid,
          name: r.name,
          description: r.description,
          categoryName: r.group?.categoryName || 'Unkategorisiert',
          groupId: r.groupId
        }));

        const existing = await prisma.conflict.findMany({
          where: {
            conflictText: { not: '' }
          },
          select: { req1Id: true, req2Id: true }
        });
        const existingSet = new Set(existing.map(c => `${c.req1Id}:${c.req2Id}`));

        const unratedPairs = [];
        for (let i = 0; i < mappedReqs.length; i++) {
          for (let j = i + 1; j < mappedReqs.length; j++) {
            const r1 = mappedReqs[i];
            const r2 = mappedReqs[j];
            const [id1, id2] = [r1.uid, r2.uid].sort();
            
            if (!existingSet.has(`${id1}:${id2}`)) {
              unratedPairs.push({
                pair: [id1, id2],
                req1: id1 === r1.uid ? r1 : r2,
                req2: id1 === r1.uid ? r2 : r1
              });
              if (unratedPairs.length >= limit) break;
            }
          }
          if (unratedPairs.length >= limit) break;
        }

        return {
          content: [{ 
            type: "text", 
            text: `Found ${unratedPairs.length} unrated pairs. Please evaluate them.\n\n` + JSON.stringify(unratedPairs, null, 2) 
          }]
        };
      }

      case "batch_update_conflicts": {
        const { conflicts } = args as any;
        
        for (const conflict of conflicts) {
          const [id1, id2] = [conflict.req1Id, conflict.req2Id].sort();
          
          await prisma.conflict.upsert({
            where: {
              req1Id_req2Id: { req1Id: id1, req2Id: id2 }
            },
            update: {
              status: conflict.status,
              conflictText: conflict.conflictText,
              bestPractice: conflict.bestPractice
            },
            create: {
              req1Id: id1,
              req2Id: id2,
              status: conflict.status,
              conflictText: conflict.conflictText,
              bestPractice: conflict.bestPractice
            }
          });
        }
        
        await exportConflictsToJson();
        return { content: [{ type: "text", text: `Successfully updated ${conflicts.length} conflicts.` }] };
      }

      case "get_unrated_category_impacts": {
        const { limit = 20 } = args as any;
        
        const reqs = await prisma.requirement.findMany({
          select: {
            uid: true,
            name: true,
            description: true,
          }
        });

        const categories = await prisma.category.findMany({
          select: { name: true }
        });

        const existing = await prisma.categoryImpact.findMany({
          select: { requirementId: true, categoryName: true }
        });
        const existingSet = new Set(existing.map(i => `${i.requirementId}:${i.categoryName}`));

        const unratedPairs = [];
        for (const req of reqs) {
          for (const cat of categories) {
            if (!existingSet.has(`${req.uid}:${cat.name}`)) {
              unratedPairs.push({
                requirement: req,
                category: cat
              });
              if (unratedPairs.length >= limit) break;
            }
          }
          if (unratedPairs.length >= limit) break;
        }

        return {
          content: [{ 
            type: "text", 
            text: `Found ${unratedPairs.length} unrated requirement-category pairs. Please evaluate them.\n\n` + JSON.stringify(unratedPairs, null, 2) 
          }]
        };
      }

      case "batch_update_category_impacts": {
        const { impacts } = args as any;
        
        for (const impact of impacts) {
          await prisma.categoryImpact.upsert({
            where: {
              requirementId_categoryName: { 
                requirementId: impact.requirementId, 
                categoryName: impact.categoryName 
              }
            },
            update: {
              status: impact.status,
              reasoning: impact.reasoning
            },
            create: {
              requirementId: impact.requirementId,
              categoryName: impact.categoryName,
              status: impact.status,
              reasoning: impact.reasoning
            }
          });
        }
        
        await exportCategoryImpactsToJson();
        return { content: [{ type: "text", text: `Successfully updated ${impacts.length} category impacts.` }] };
      }

      case "get_conflicts_by_context": {
        const { uids, category } = args as any;
        const conflicts = await prisma.conflict.findMany({
          where: {
            OR: [
              uids ? { req1Id: { in: uids } } : {},
              uids ? { req2Id: { in: uids } } : {},
              category ? {
                OR: [
                  { req1: { group: { categoryName: category } } },
                  { req2: { group: { categoryName: category } } }
                ]
              } : {}
            ]
          }
        });
        return { content: [{ type: "text", text: JSON.stringify(conflicts, null, 2) }] };
      }

      case "get_groups": {
        const data = await prisma.group.findMany();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "get_categories": {
        const data = await prisma.category.findMany();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "get_scenarios": {
        const data = await prisma.scenario.findMany({ include: { options: { include: { requirements: true } } } });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "add_requirement": {
        const { name: reqName, description, category, groupId } = args as any;
        const crypto = await import('node:crypto');
        const uid = crypto.randomUUID();
        
        await prisma.category.upsert({
          where: { name: category },
          update: {},
          create: { name: category, prefix: 'REQ' }
        });

        let targetGroupId = groupId;
        if (!targetGroupId) {
          targetGroupId = `GROUP_${category.replace(/\s+/g, '_').toUpperCase()}`;
        }

        await prisma.group.upsert({
          where: { id: targetGroupId },
          update: { categoryName: category },
          create: { id: targetGroupId, name: targetGroupId.replace('GROUP_', '').replace(/_/g, ' '), type: 'multi', categoryName: category }
        });

        const req = await prisma.requirement.create({
          data: {
            uid,
            name: reqName,
            description,
            groupId: targetGroupId,
          },
        });
        await exportAllToJson();
        return { content: [{ type: "text", text: `Requirement added: ${req.uid}` }] };
      }

      case "update_requirement": {
        const { uid, name: reqName, description, category, groupId } = args as any;
        
        let targetGroupId = groupId;
        if (category) {
          await prisma.category.upsert({
            where: { name: category },
            update: {},
            create: { name: category, prefix: 'REQ' }
          });
          
          if (!targetGroupId) {
            targetGroupId = `GROUP_${category.replace(/\s+/g, '_').toUpperCase()}`;
          }

          await prisma.group.upsert({
            where: { id: targetGroupId },
            update: { categoryName: category },
            create: { id: targetGroupId, name: targetGroupId.replace('GROUP_', '').replace(/_/g, ' '), type: 'multi', categoryName: category }
          });
        }

        const req = await prisma.requirement.update({
          where: { uid },
          data: {
            name: reqName,
            description,
            groupId: targetGroupId || undefined,
          },
        });
        await exportAllToJson();
        return { content: [{ type: "text", text: `Requirement updated: ${req.uid}` }] };
      }
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleToolCall(name, args);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Master Matrix MCP Server running");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
