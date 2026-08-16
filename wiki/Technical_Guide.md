# Technical Guide & Architecture

Dieses Dokument richtet sich an Entwickler, AI Agents und Maintainer, die den Sovereignty Trade-off Navigator erweitern oder modifizieren wollen.

## Tech Stack & State Management

Das Frontend ist eine React/Next.js-Anwendung (App Router). 
*   **Styling:** TailwindCSS
*   **State Management:** Zustand (`store/useStore.ts`)
*   **Persistenz:** Zustand ist mit der `persist` Middleware konfiguriert (LocalStorage), d.h. der Fortschritt eines Nutzers bleibt beim Neuladen der Seite erhalten.
*   **Datenbasis:** Zur Laufzeit lädt das Frontend alle Bäume, Szenarien und Konflikte über die API aus der SQLite-Datenbank (Fullstack-Modus) bzw. aus den statischen JSON-Exporten unter `/data` (Demo-Modus). Maßgeblich ist die Datenbank – siehe Abschnitt *MCP Server Integration*.

Zentraler Baustein der Anwendung ist `store/useStore.ts`. Hier werden `treeResults`, `scenarioResults` und `selectedRequirements` aggregiert. Helfer-Dateien wie `lib/provenance.ts` lesen diesen State aus, um in den Zusammenfassungen (Step 3, 5, 7) die Herkunft (Provenance) einer Anforderung zu berechnen.

## MCP Server Integration (Data Architecture)

Dieses Projekt hat die Historie von reinen JSON-Dateien zu einer **SQLite-Datenbank (Prisma)** durchlaufen. 

*   **Source of Truth:** Die SQLite-Datenbank (`prisma/dev.db`) ist die primäre Source of Truth für Architekturanforderungen, Konflikte und Kategorien.
*   **Sync Logic:** Die JSON-Dateien in `/data` werden automatisch mit der Datenbank synchron gehalten. **Editieren Sie JSON-Dateien nicht manuell**, wenn Sie Zugriff auf den MCP-Server haben!
*   **Model Context Protocol (MCP):** Das Projekt beinhaltet einen MCP-Server (`scripts/mcp-server.ts`). Er stellt validierte Tools für CRUD-Operationen bereit. Wenn Sie via LLM oder Agent neue Anforderungen hinzufügen wollen, *nutzen Sie die MCP-Tools*. Sie validieren Schemata und Exklusiv-Gruppen.

## Conflict Bewertung & Interceptor Logik

Die Konfliktauswertung ist ein zweistufiger Prozess:

1.  **Frontend-Prävention (Interceptor):** Bevor Anforderungen final in den State "gemerged" werden (in Step 3 und Step 5), wird über die ID der Requirement-Gruppe geprüft, ob Exklusiv-Anforderungen kollidieren. Eine dedizierte UI (`ConflictCard`) zwingt den Nutzer zur Auflösung, indem z.B. bei Klick auf "Behalten" die `removeSovereigntyReq` oder `removeScenarioReq` Funktion im Zustand aufgerufen wird.
2.  **Backend/Matrix-Auswertung (Visualisierung):** In Step 7 läuft eine `n*n` Iteration über alle aktiven Anforderungen. Jede Kombination wird gegen das `allConflicts` Array (aus `conflict_matrix.json` bzw. der DB) geprüft, um in der React-Matrix Rote oder Orange Schnittpunkte zu rendern.
3.  **Protokollierung & Audit-Trail (`conflictResolutions`):** Wenn ein Nutzer in Step 6 einen Konflikt über die `ConflictCard` auflöst, wird das Ergebnis im State `conflictResolutions` (inklusive Begründungskommentar, SR-/UR-Scores, gewählter Anforderung und verworfenen Anforderungen) gespeichert. Diese Daten fließen als "Konflikt gelöst"-Badge in die Herkunfts-Seitenleiste (Matrix/Step 7) und werden als eigenes Kapitel im PDF-Export dokumentiert.

## Spotlight Tour & UI Onboarding Layout Logic

Der Spotlight-Tour-Mechanismus (`components/SpotlightTour.tsx`) führt Nutzer interaktiv durch die einzelnen Phasen der Anwendung. Zur Platzierung der Tooltips wird ein robuster, kollisionssicherer Positionierungsalgorithmus eingesetzt:

1. **Positions-Priorisierung:** Abhängig von der bevorzugten Position (`position` in der Tour-Schritt-Konfiguration) werden alle 4 Richtungen (`top`, `bottom`, `left`, `right`) der Reihe nach evaluiert.
2. **Screen-Size-Awareness:** Auf schmalen Bildschirmen (Mobile/Tablet, Breite < 768px) werden seitliche Platzierungen (`left`/`right`) ignoriert und stattdessen vertikale Platzierungen (`bottom`/`top`) erzwungen, da seitliche Platzierungen dort unweigerlich zu Überlappungen mit dem zu erklärenden Element führen.
3. **Kollisionsprüfung (No-Overlap-Garantie):** Das Tooltip wird nur an einer Position gerendert, wenn es dort ohne Überschneidung mit dem Zielelement (inklusive eines Sicherheitsabstandes) und innerhalb des Viewports Platz findet.
4. **Sicherheitsabstand & No-Overlap-Garantie:** Bei der Platzierungs-Limitierung (Clamping) wird ein strikter Sicherheitsabstand von `12px` (zusätzlich zum Highlight-Padding von `8px`) von der blauen Umrandung in alle Richtungen erzwungen. Es ist somit mathematisch unmöglich, dass sich der Tooltip-Kasten und die blaue Highlight-Umrandung Pixel teilen.
5. **Höhenerhaltung (Kein Reset):** Beim Schrittwechsel wird die Tooltip-Höhe nicht mehr auf den Standardwert `220px` zurückgesetzt, sondern behält den vorherigen Wert als Schätzung bei, während der `ResizeObserver` asynchron die exakte neue Höhe des inneren Containers misst. Dies verhindert jegliche Koordinatensprünge und temporäre Überlappungen beim Laden.
6. **Priorisierte Konflikt-Synchronisation (Phase 5 / Step 7):** Bei Erreichen der Detail-Schritte des Conflict Resolvers in Step 7 wird automatisch der erste Eintrag aus der sortierten Konfliktliste (`conflictsList[0]`) geöffnet. Dadurch wird garantiert ein relevanter, harter Konflikt (Rot) statt einer beliebigen Warnung (Orange) für die Demonstration herangezogen.

## Matrix-Architektur & Komponenten-Modularisierung (`components/matrix-view/`)

Die ehemals monolithische Matrix-Komponente wurde in spezialisierte Subkomponenten refactored:

*   **`Matrix.tsx`:** Schlanker Einstiegspunkt und Orchestrator (~50 Zeilen).
*   **`components/matrix-view/ReqMatrix.tsx`:** Anforderung-zu-Anforderung Konfliktmatrix inklusive dynamischem Crosshair-Highlighting, Filterleiste und interaktiver Balkenwaage zur Prioritätengewichtung.
*   **`components/matrix-view/AlternativesPanel.tsx`:** Auswahldialog für kollidierende Alternativen innerhalb derselben Dimension/Gruppe.
*   **`components/matrix-view/TraceItem.tsx`:** Visuelle Provenance-Darstellung (Herleitung aus Entscheidungsbäumen, Szenarien oder manuellen Auflösungen).
*   **`components/matrix-view/MatrixCell.tsx`:** React-memoized Gitterzellen für optimierte Render-Performance.

## Tests

| Befehl | Umfang |
|---|---|
| `npm test` | Vitest-Integrationstests (`tests/*.test.ts`, `scripts/__tests__/*.test.ts`): MCP-Server, Daten-Sync, Store, `apiFetch`-Routing, Provenance, Session-Export/Import. Setzt eine geseedete `prisma/dev.db` voraus (`npx prisma db push && npm run db:seed`). |
| `npm run test:e2e` | Playwright-End-to-End-Tests (`tests/*.spec.ts`) gegen den automatisch gestarteten Dev-Server. Einmalig `npx playwright install chromium` ausführen. |

Die Vitest-Konfiguration schließt `*.spec.ts` bewusst aus, damit die Playwright-Specs nicht im Unit-Test-Lauf landen.

## Konflikt-Status-Normalisierung (`lib/conflict-status.ts`)

Die Evaluations-Prompts geben die Status in Großschreibung vor (`RED`, `ORANGE`, …), während die Matrix-Komponenten case-sensitiv gegen Kleinschreibung vergleichen. Sämtliche Schreibpfade – der Seed-Import (`scripts/sync-import.ts`) und der MCP-Server (`batch_update_conflicts`) – laufen deshalb über `normalizeStatus()`. Neue Schreibpfade müssen dies ebenfalls tun, andernfalls erscheinen die betroffenen Zellen in der Oberfläche fälschlich als unbewertet.

