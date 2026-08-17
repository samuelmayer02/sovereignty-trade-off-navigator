# Dual-Mode Architecture

The Sovereignty Trade-off Navigator is designed to run in two distinct environments:
1. **Production Mode (Fullstack)**: Uses Next.js API routes with a SQLite database via Prisma.
2. **Demo Mode (Static Export)**: A purely client-side static build for GitHub Pages, using JSON files as a read-only database and `localStorage` for state.

## How it works

Two environment variables are set together by `scripts/build-static.sh`:

- `STATIC_EXPORT=true` switches `next.config.ts` to `output: 'export'` (build time, server side).
- `NEXT_PUBLIC_STATIC_EXPORT=true` is inlined into the client bundle and makes `apiFetch` resolve to static JSON instead of `/api/...` (runtime, client side).

Both must be set for a working demo build; running `npm run build:static` handles this.

### 1. API Routing & Interception (`lib/api-client.ts`)
We use a central utility `apiFetch` which acts as a drop-in replacement for the native `fetch`. 

- **In Production Mode:** `apiFetch` forwards all requests 1:1 to the Next.js backend (`/api/...`).
- **In Demo Mode:** 
  - **Query-String & Slash Normalization:** URLs like `/api/conflicts?context=sovereignty` or `/api/requirements/` are cleaned so file mappings resolve correctly to `/data/conflict_matrix.json` and `/data/requirements.json`.
  - **Synthetic Joins:** Aggregate routes (such as `/api/sovereignty-requirements`) perform a client-side join between `requirements.json` and `groups.json` to maintain data parity with backend SQL joins.
  - **Base Path Support:** Prepends `NEXT_PUBLIC_BASE_PATH` (e.g. `/sovereignty-trade-off-navigator/data/...json`) for sub-path GitHub Pages deployments.
  - **Mutating Requests (`POST`, `PUT`, `DELETE`):** Intercepted, returning `{ success: true, demoMode: true, message: "..." }` with status 200 to allow in-memory optimistic updates without throwing runtime exceptions.

### 2. State Management & UI Feedback (`components/StaticModeBanner.tsx`, `components/EditorNav.tsx`)
The Zustand store handles the core state of the application. It utilizes `apiFetch` for data loading and saving. 
- In **Demo Mode (Static Export)**:
  - A top-level global banner (`StaticModeBanner`) informs users that the application runs in Read-Only mode on GitHub Pages.
  - Editor save buttons in `EditorNav` are disabled and marked as "Schreibgeschützt" to prevent misleading user expectations.
  - Detail editor modals (e.g. Ground Truth in `Matrix.tsx`, Flag notes in `FlagButton.tsx`) disable persistence buttons with appropriate guidance.
  - Local evaluation actions in the 7-step wizard (traversal, trade-offs, risk acceptance, PDF/JSON report generation) remain 100% interactive in browser memory/localStorage.

Users can use the `SessionManager` component to export their local state to a JSON file and import it later.

### 3. Build & Self-Healing Process (`scripts/build-static.sh`)
Next.js App Router does not permit dynamic server API routes (`app/api/**`) during `output: 'export'`. To support both fullstack and static exports seamlessly:
- `scripts/build-static.sh` prepares static data in `public/data/` from `data/*.json`. This directory is generated and therefore not tracked in Git.
- Temporarily moves `app/api` to `.app_api_tmp` during `next build`.
- **Fault-Tolerant Traps:** A multi-signal trap (`trap cleanup EXIT INT TERM HUP`) restores `app/api` automatically, even if the build is cancelled or fails.
- **Self-Healing Startup Check:** At the start of `build-static.sh` and via `npm run predev`, any stranded `.app_api_tmp` directory is automatically detected and restored to `app/api`.

### 4. Automated Testing (`tests/api-client.test.ts`)
The `apiFetch` utility is verified by a dedicated Vitest test suite testing:
- Production passthrough vs Static export URL rewrites
- Route alias mapping (`conflicts` -> `conflict_matrix.json`, etc.)
- Query parameter stripping and trailing slash handling
- Synthetic database joins on client side
- Interception of mutating methods (`POST`, `PUT`, `DELETE`)
- Base path routing for GitHub Pages

## Development Guidelines

When adding new features that interact with the backend:
1. **Always use `apiFetch`:** Never use native `fetch` for API calls to `/api/...`. Always import `apiFetch` from `@/lib/api-client`.
2. **Graceful Degradation:** Ensure that the UI still functions (even if it's just visually) when mutating requests are intercepted in Demo Mode.
3. **Data Parity:** Ensure that any new JSON files generated for the static export accurately reflect the structure expected by the API routes.
