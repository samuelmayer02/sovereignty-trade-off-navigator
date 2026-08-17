# Sovereignty Trade-off Navigator

Der **Sovereignty Trade-off Navigator** ist ein softwaregestütztes Werkzeug, das den systemischen Zielkonflikt zwischen digitaler Souveränität (Vermeidung von Vendor-Lock-in) und IT-Betriebsaspekten wie Ausfallsicherheit und operativer Komplexität adressiert. Das Tool übersetzt abstrakte strategische Autonomieanforderungen in konkrete architektonische Design-Optionen und visualisiert die daraus resultierenden Konsequenzen für Systemstabilität und Betriebsaufwand. Dadurch werden implizite Annahmen und „Return on Lock-in“-Abwägungen bei der Konzeption verteilter Cloud-Infrastrukturen systematisch bewertbar und nachvollziehbar. Das Artefakt fungiert als kommunikative Brücke, die strategische Entscheidungen des Produktmanagements mit der technischen Umsetzung in der IT-Architektur in Einklang bringt.

Dieses Repository ist der Software-Anhang zur zugehörigen Masterarbeit.

- **Live-Demo (statischer Demo-Modus):** https://samuelmayer02.github.io/sovereignty-trade-off-navigator/
- **Repository:** https://github.com/samuelmayer02/sovereignty-trade-off-navigator
- **Dokumentation:** [Wiki-Übersicht](wiki/Home.md) · [User Guide](wiki/User_Guide.md) · [Methodik](wiki/Methodology.md) · [Technical Guide](wiki/Technical_Guide.md)

---

## Einordnung und Zielgruppe

Der Zielkonflikt entsteht aus gegenläufigen Anforderungen: Regulatorik und Unternehmensstrategie fordern Unabhängigkeit von einzelnen Anbietern und Jurisdiktionen, während Verfügbarkeits- und Betriebsziele für den Bezug integrierter, anbieterspezifischer Dienste sprechen. Verteilte Systeme unterliegen dabei physikalischen und theoretischen Grenzen (CAP/PACELC), sodass sich beide Zielrichtungen nicht gleichzeitig maximieren lassen. Das Tool macht die verbleibenden Abwägungen explizit, statt sie in impliziten Annahmen zu belassen.

Der Navigator adressiert zwei Anwendungsebenen:

1. **Strategische Ebene** (Enterprise-Architektur, Produktmanagement, Leitungsebene): Validierung einer Cloud-Strategie und Herstellung eines gemeinsamen Verständnisses zwischen strategischer Zielsetzung und technischer Realisierbarkeit.
2. **Systemebene** (IT- und Lösungsarchitektur): Architekturentwurf vor der Migration geschäftskritischer Systeme, mit dem Ziel eines begründeten und dokumentierten Kompromisses.

**Ergebnis einer Sitzung** ist ein exportierbares Architekturentscheidungsdokument (Architecture Decision Record, ADR), das getroffene Kompromisse, identifizierte Konflikte und explizit akzeptierte Risiken für Audit- und Argumentationszwecke festhält.

---

## Anwendungsablauf (sieben Schritte)

Der Navigator führt durch einen strukturierten Bewertungsprozess. Ein übergreifendes Regelwerk stellt sicher, dass die Konfliktauflösung nicht übersprungen wird. Eine ausführliche Anleitung enthält der [User Guide](wiki/User_Guide.md).

| Schritt | Phase | Inhalt |
|---|---|---|
| **1** | Setup | Systemname, Evaluationsziel (Soll-Architektur oder Ist-Architektur/Audit), Dokumentation des Status quo sowie Festlegung des System-Scopes. |
| **2** | Souveränität | Entscheidungsbäume ermitteln das erforderliche Souveränitätsniveau (**SEAL** – Sovereignty Evaluation and Assurance Level). Antworten aktivieren Souveränitätsanforderungen und werden über Business Value und Technical Risk gewichtet. |
| **3** | SOV-Ergebnis | Zusammenfassung der aktivierten Souveränitätsanforderungen. Der Konflikt-Interceptor blockiert den Fortschritt, solange Anforderungen einer Exklusiv-Gruppe einander widersprechen. |
| **4** | Szenarien | Architekturszenarien stellen typische Abwägungen auf konzeptioneller Ebene dar. Die Auswahl wird bewertet und schriftlich begründet. |
| **5** | Szenario-Ergebnis | Zusammenfassung der durch die Szenarien ausgelösten technischen Anforderungen, erneut mit Konflikt-Interceptor. |
| **6** | Auswahl | Anforderungskatalog: automatisch abgeleitete Anforderungen sind zur Wahrung der Nachvollziehbarkeit gesperrt, weitere können manuell ergänzt werden. Widersprüche werden über die `ConflictCard` einschließlich Begründung aufgelöst. |
| **7** | Analyse | Konfliktmatrix und Risikoregister: Alle aktiven Anforderungen werden paarweise gegen die Wissensbasis geprüft und farblich klassifiziert (rot = harter Konflikt, orange = Trade-off). Konflikte lassen sich im Conflict Resolver abwägen oder als akzeptiertes Risiko dokumentieren. Export als PDF oder JSON. |

---

## Redaktionsmodus (Editor)

Für Administratoren und Fachexperten steht ein integrierter Editor zur Verfügung, der die Pflege der Wissensbasis ohne Codeänderungen ermöglicht:

- **Anforderungsverwaltung:** Anlegen, Bearbeiten und Löschen von Anforderungen, Kategorien und Gruppen.
- **Szenario-Editor:** Erstellung von Bewertungsszenarien zur Abbildung von Projektkontexten.
- **Tree-Builder:** Visuelle Bearbeitung der Entscheidungsbäume.
- **Matrixpflege:** Direkte Festlegung von Trade-offs zwischen Anforderungspaaren.

Der Editor ist über die Schaltfläche „Editor öffnen“ in der Navigationsleiste erreichbar. Details enthält der [Editors Guide](wiki/Editors_Guide.md).

---

## Architektur und Datenkonzept

Die Anwendung ist für zwei Betriebsmodi ausgelegt:

- **Produktionsmodus (Fullstack):** SQLite-Datenbank und dynamische Next.js-API-Routen.
- **Demonstrationsmodus (Static Export):** Rein clientseitiges Hosting über GitHub Pages.

Eine detaillierte Beschreibung enthält [Dual-Mode Architecture](wiki/dual-mode-architecture.md).

### Trennung von Problem- und Lösungsraum

Die Benutzerführung trennt bewusst zwischen Problemraum und Lösungsraum:

- **Szenarien und Optionen (Problemraum):** Optionen werden auf konzeptioneller Ebene formuliert und nutzen etablierte, herstellerneutrale Begriffe (etwa Multi-Region, Queues, Managed Services). Anbieterspezifische Produktbezeichnungen werden vermieden, da im Problemraum der geschäftliche oder operative Trade-off im Vordergrund steht.
- **Anforderungen (Lösungsraum):** Die Überführung in konkrete Technologien und Architekturmuster erfolgt erst über das Mapping. Eine konzeptionelle Entscheidung im Szenario löst spezifische technische Anforderungen aus (beispielsweise „Cloud-native Serverless (PaaS/FaaS)“).

Damit bleiben Architekturentscheidungen an den Geschäfts- und Souveränitätszielen ausgerichtet, während das System die technischen Implikationen nachvollziehbar übersetzt.

### Datenhaltung und Synchronisation

- **SQLite-Datenbank (`prisma/dev.db`):** Primäre Laufzeitdatenquelle. Frontend und API-Routen lesen und schreiben ausschließlich hier. Die Datei wird nicht versioniert, sondern aus den JSON-Dateien erzeugt.
- **JSON-Dateien (`data/*.json`):** Export der Datenbank bei jeder schreibenden API-Operation. Dies ermöglicht die Versionierung der Fachdaten in Git und stellt KI-Agenten eine lesbare Datenbasis bereit.

> [!IMPORTANT]
> **Manuelle Änderungen an JSON-Dateien**
> Manuelle Änderungen an den Dateien in `data/` werden **nicht** automatisch in die SQLite-Datenbank übernommen. Da das Frontend ausschließlich die Datenbank abfragt, wirken sie sich erst nach einem Import aus:
> ```bash
> npm run db:import
> ```
> Dies führt `scripts/sync-import.ts` mittels `tsx` aus.
>
> Anschließend ist zu beachten, dass Next.js aggressiv zwischenspeichert. Falls Änderungen im Browser nicht erscheinen, empfiehlt sich ein Hard-Refresh (`Cmd + Shift + R` bzw. `Strg + F5`) oder ein Neustart des Entwicklungsservers.

### Model Context Protocol (MCP)

Über den integrierten MCP-Server (`scripts/mcp-server.ts`) können KI-Agenten direkt mit der Datenbank interagieren. Dies ermöglicht die werkzeuggestützte Pflege des Anforderungskatalogs und der Konfliktmatrix mit schemavalidierten Operationen.

---

## Betrieb

### Voraussetzungen

Node.js ab Version 20.9 (Anforderung von Next.js 16). Getestet mit Node 20 (CI und Docker) sowie Node 24 (lokal).

### Installation

```bash
npm install
npx prisma db push
npm run db:seed
```

### Verfügbare Skripte

- `npm run dev` – startet die Anwendung unter `http://localhost:3000`.
- `npm run test` – führt die Integrationstests für MCP-Server, Datensynchronisation, Store und API-Client aus (Vitest). Nach Änderungen am Schema zwingend erforderlich.
- `npm run test:e2e` – führt die Playwright-End-to-End-Tests (`tests/*.spec.ts`) aus. Der Entwicklungsserver wird automatisch gestartet; einmalig ist `npx playwright install chromium` erforderlich.
- `npm run db:import` – überträgt manuelle Änderungen aus den JSON-Dateien in die Datenbank.
- `npm run mcp:start` – startet den MCP-Server für die Agenteninteraktion.
- `npm run build:static` – erzeugt den statischen Demonstrations-Build.

### Datenbankwartung

`npx prisma studio` stellt eine grafische Oberfläche zur Bearbeitung der Daten und zur Prüfung der Relationen bereit.

### Erweiterung der Konfliktmatrix

Die Konfliktmatrix umfasst im ausgelieferten Datenstand alle 4.465 Paare der 95 Anforderungen. Wird der Anforderungskatalog erweitert, entstehen unbewertete Paare, die über einen lokalen Coding-Agenten und den MCP-Server ergänzt werden können.

Maßgeblich ist der versionierte Prompt [`prompts/evaluation_v3.md`](prompts/evaluation_v3.md); [`prompts/evaluation_v2.md`](prompts/evaluation_v2.md) ist als frühere Fassung zu Vergleichszwecken archiviert. Die Bewertung erfolgt anhand der acht Trade-off-Konflikte (TC-1 bis TC-8) aus der zugrundeliegenden Arbeit.

**Einrichtung:** Der MCP-Server wird in der Konfiguration des Agenten registriert (etwa `~/.claude.json`, `~/.gemini/config/mcp.json` oder in der IDE):

- **Name:** `sovereignty-navigator-server`
- **Command:** `<absoluter-pfad-zum-repository>/scripts/start-mcp.sh`
- **Args:** leer

> [!TIP]
> Das Wrapper-Skript `start-mcp.sh` wird dem direkten Aufruf vorgezogen, da es die korrekte Node.js-Umgebung (etwa über `nvm`) lädt. Andernfalls kann es bei abweichender Node-Version zu Abbrüchen nativer Erweiterungen wie `better-sqlite3` kommen.

**Durchführung:** Der Agent wird angewiesen, nach `prompts/evaluation_v3.md` zu verfahren, beispielsweise: „Arbeite nach `prompts/evaluation_v3.md` und bewerte die nächsten zehn unbewerteten Konflikte.“ Der Agent ruft dabei `get_unrated_conflicts` auf, bewertet die Paare und speichert das Ergebnis über `batch_update_conflicts`. Die JSON-Dateien in `data/` werden automatisch mitgeschrieben.

> [!NOTE]
> Wird der MCP-Server in einer eingeschränkten Umgebung blockiert, steht `npx tsx scripts/run-mcp-tool.ts <ToolName> '<JSON-Argumente>'` als Alternative zur Verfügung.
>
> Sämtliche Schreibpfade normalisieren den Konfliktstatus über `lib/conflict-status.ts` auf Kleinschreibung, da die Prompts Großschreibung vorgeben, die Oberfläche jedoch `red`, `orange`, `green` und `blue` erwartet.

---

## Sitzungen und Export

Der Arbeitsstand einer Analyse wird an zwei Stellen gehalten:

- **Browser (LocalStorage):** Der vollständige Zustand des Assistenten wird laufend im Browser persistiert (Zustand-`persist`), sodass ein Neuladen den Fortschritt erhält. Im Demonstrationsmodus ist dies der einzige Speicherort.
- **Datenbank (Produktionsmodus):** Zusätzlich wird die Sitzung über `POST /api/save-session` in der Tabelle `Session` abgelegt.

Über „Export“ in der Navigationsleiste lässt sich der aktuelle Stand als JSON-Datei sichern und über „Import“ an anderer Stelle wieder einspielen.

### Erhebungsinstrument der Fallstudie

Für die Durchführung der Fallstudie steht ein eigenständiges Evaluationsformular als statische HTML-Datei unter `public/evaluation.html` bereit.

- **Aufruf:** direkt im Browser oder über `http://localhost:3000/evaluation.html` bei laufendem Entwicklungsserver.
- **Funktionsumfang:**
  - Umschaltung zwischen Phase 1 (Vorbereitungsphase, Fragebogen A) und Phase 2 (Abstimmungsphase, Fragebogen B).
  - Automatische Zwischenspeicherung im LocalStorage zur Vermeidung von Datenverlust.
  - Datenexport als JSON oder CSV.
  - Erzeugung von LaTeX-Tabellencode sowie Markdown-Tabellen zur direkten Übernahme.
  - Import bereits ausgefüllter JSON-Antworten zur Ansicht oder Korrektur.

---

## Ausführung mit Docker

```bash
docker-compose up -d --build
```

Anschließend ist die Anwendung unter `http://localhost:3000` erreichbar. Die SQLite-Datenbank (`prisma/dev.db`) und die JSON-Daten (`data/`) werden über Docker-Volumes auf dem Host persistiert. Eine `.env`-Datei ist optional und dient lediglich der Überschreibung von `DATABASE_URL` (Vorlage: `.env.example`).

---

## Lokale Entwicklung ohne Docker

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:3000` erreichbar.

---

## Betriebsmodi und Deployment

1. **Produktionsmodus (lokal oder Docker):** Next.js mit dynamischen API-Routen, Prisma ORM und SQLite.
2. **Demonstrationsmodus (GitHub Pages):** Rein clientseitiger Build ohne Backend. Die Daten werden aus statischen JSON-Dateien geladen; der siebenstufige Ablauf ist vollständig nutzbar, schreibende Operationen des Editors sind deaktiviert.

Statischen Build lokal erzeugen:

```bash
npm run build:static
```

Das Skript kopiert `data/*.json` nach `public/data/` (nicht versioniert, wird bei jedem Build neu erzeugt), blendet `app/api` temporär aus und stellt das Verzeichnis anschließend automatisch wieder her. Weitere Details enthält [wiki/dual-mode-architecture.md](wiki/dual-mode-architecture.md).

Das Deployment auf GitHub Pages erfolgt automatisiert über `.github/workflows/deploy.yml` bei jedem Push auf `main`.

---

## Technologiestack

- **Next.js 16** (App Router) und **React 19**
- **Prisma ORM 7** mit **SQLite** (`better-sqlite3`-Adapter)
- **TailwindCSS 4**, **Zustand** (State Management), **React Flow** (Entscheidungsbäume)
- **Vitest** (Integrationstests) und **Playwright** (End-to-End-Tests)
- **MCP SDK** (Agentenanbindung)

---

## Optionales Werkzeug: Graphify

Optional kann **Graphify** eingesetzt werden. Das Werkzeug analysiert die Codebasis und erzeugt einen persistenten Wissensgraphen, über den Agenten Architekturmuster und Abhängigkeiten erfassen können, ohne den vollständigen Quelltext einzulesen.

```bash
pip install graphifyy --break-system-packages
graphify install --platform antigravity
```

Der Befehl `/graphify` erzeugt anschließend das nicht versionierte Verzeichnis `graphify-out/` mit einer interaktiven Visualisierung (`graph.html`), einem Bericht (`GRAPH_REPORT.md`) und der Wissensbasis (`graph.json`). Aktualisierung erfolgt über `graphify update .`, Abfragen über `graphify query "<Frage>"`.

Graphify ist für Betrieb und Bewertung der Anwendung nicht erforderlich.

---

## Lizenz und Datenquellen

Der Quellcode steht unter der MIT-Lizenz, siehe [LICENSE](LICENSE).

Die Datei `data/Cloud-Sovereignty-Framework.pdf` ist ein externes Referenzdokument der Europäischen Kommission und diente als methodische Quelle für die Herleitung der Anforderungskategorien. Sie unterliegt den Nutzungsbedingungen des Herausgebers und ist nicht Bestandteil der MIT-Lizenzierung.
