<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Graphify Integration

This project has the `graphify` skill installed to map the codebase into a queryable knowledge graph.
- **graphify** - turns code/docs/papers/images into a structured knowledge graph. Trigger: `/graphify`

## Guidelines for future Agents:
1. **Analyze the Project:** When starting a complex architectural task, you should run `/graphify` to map the workspace or update the existing graph. Check the output directory `graphify-out/` and read the plain-text `graphify-out/GRAPH_REPORT.md` to identify dependencies and god nodes.
2. **Querying the Graph:** Use the CLI `graphify query "<your question>"` to query the persistent knowledge graph (`graphify-out/graph.json`) rather than parsing files from scratch, which saves context tokens and time across sessions.
3. **Execution:** You can run `graphify update` to quickly re-extract modified AST structures after refactoring code.

# Data Architecture (Prisma & SQLite)

The project has migrated from pure JSON files to a relational database using **Prisma** and **SQLite**.

### Key Guidelines for Agents:
1.  **Source of Truth**: The SQLite database (`prisma/dev.db`) is the primary source of truth.
2.  **File Synchronization**: JSON files in `data/` are automatically kept in sync with the database. You can still read them, but **do not edit them manually** if you have access to the MCP server or the API.
3.  **MCP Server**: Use the included MCP server (`scripts/mcp-server.ts`) to interact with the data. It provides validated tools for CRUD operations.
4.  **Manual Edits**: If you must edit JSON files directly, run `npx tsx scripts/sync-import.ts` to update the database.
5.  **Testing**: Always run `npm test` after making changes to the database schema, sync logic, or MCP server to ensure data integrity.
6.  **Dual-Theme Support**: Any design or UI changes MUST be compatible with both **Light Mode** and **Dark Mode**. Avoid hardcoded colors (e.g., `stroke-white`); use theme-aware Tailwind classes or CSS variables (e.g., `stroke-muted/30`).
7.  **Documentation**: When changing workflows or data structures, always check if the `README.md` needs an update to stay consistent for human operators.
8.  **Wiki Documentation**: For all relevant changes (functional, technical, architectural, or design changes), you MUST ensure that the corresponding documentation files in the `wiki/` directory and `README.md` are updated immediately to reflect the changes. Agents should NEVER skip this step. This ensures architectural integrity and knowledge retention.
9.  **Dual-Mode Architecture (Static vs Production)**: The app can run as a Next.js Static Export for GitHub pages or a Fullstack app with SQLite. Always use `apiFetch` from `@/lib/api-client` instead of native `fetch` when communicating with `/api/...` endpoints. This ensures requests are properly routed to static JSON files when `NEXT_PUBLIC_STATIC_EXPORT=true` is set.
10. **Conflict Status Normalization**: The evaluation prompts emit uppercase statuses (`RED`, `ORANGE`, ...), but the matrix components compare case-sensitively against lowercase. Every write path must run the value through `normalizeStatus()` from `@/lib/conflict-status`.
11. **Generated Artifacts**: `prisma/dev.db` and `public/data/` are generated and not tracked in Git. Rebuild them with `npx prisma db push && npm run db:seed` and `npm run build:static` respectively — never commit them.

### Next.js API Routes:
All data-fetching routes in `app/api/` now use Prisma. They automatically trigger a JSON export on every write operation.

### Naming:
The project is called **Sovereignty Trade-off Navigator** (package name `sovereignty-trade-off-navigator`, MCP server name `sovereignty-navigator-server`). Earlier working titles such as "Master Matrix" or "Decision Navigator" must not be reintroduced.
