# Sovereignty Architecture Decision Navigator

Der **Sovereignty Architecture Decision Navigator** ist ein interaktives Expertensystem, das IT-Entscheidern und Cloud-Architekten hilft, komplexe Architektur-Entscheidungen im Kontext von Cloud-Souveränität und Ausfallsicherheit zu treffen. 

---

## 🎯 Das Kernproblem: Das Souveränitäts-Hochverfügbarkeits-Paradoxon
IT-Entscheider, insbesondere in stark regulierten Branchen (wie KRITIS, Energie, Finanzen), stehen zunehmend unter Druck: Gesetzgeber (z. B. NIS-2, BSI) und Management fordern **maximale Unabhängigkeit (Souveränität)** UND **maximale Ausfallsicherheit (Resilienz)**. In der physikalischen Cloud-Realität (CAP/PACELC-Theorem) schließen sich diese Anforderungen jedoch gegenseitig aus oder führen zu enormer operativer Komplexität im Eigenbetrieb. Das Tool macht diesen "Wicked Problem"-Zielkonflikt objektivierbar, messbar und gegenüber Stakeholdern kommunizierbar.

## 👥 Zielgruppe & Use Cases
Das Tool liefert den entscheidenden Mehrwert auf zwei Ebenen:
1. **Strategische Ebene:** Für Enterprise Architekten und C-Level zur Validierung einer Cloud-Strategie. Es schafft ein "Shared Understanding" zwischen Management-Wünschen und technischer Realität.
2. **System Ebene:** Für IT-/Lösungsarchitekten in der Design-Phase *vor* der Cloud-Migration von "Mission-Critical" Systemen, um den perfekten, dokumentierbaren Kompromiss zu finden.

**Das Deliverable:** Ein exportierbares Architektur-Entscheidungsdokument (ADR), das die getroffenen Kompromisse, Konflikte und expliziten "Accepted Risks" als Audit- und Argumentationsgrundlage dokumentiert.

---

## 👤 Benutzer-Workflow

Das Tool führt den Nutzer durch einen strukturierten Prozess zur Architekturbewertung:

### 1. Setup & Session Management
Der Nutzer startet eine neue Analyse oder lädt eine bestehende Session. Jede Session wird in der Datenbank persistiert und kann jederzeit wieder aufgenommen werden.

### 2. Entscheidungsbäume (SEAL-Ermittlung)
Durch grafische Entscheidungsbäume wird ermittelt, welches Souveränitäts-Level (**SEAL - Sovereignty Evaluation & Assurance Level**) für das Projekt notwendig ist. 
*   **Mechanik**: Antworten in den Bäumen können direkt Souveränitäts-Anforderungen (z.B. "Datenverschlüsselung mit eigenem Schlüssel") aktivieren.

### 3. Funktionaler Anforderungskatalog
Zusätzlich zu den automatisch gesetzten Souveränitäts-Anforderungen wählt der Nutzer aus einem Katalog (Kategorien wie Security, Resilienz, Ökonomie) weitere Projekt-Anforderungen aus.
*   **Abhängigkeiten**: Das System erkennt exklusive Gruppen (z.B. "Entweder SaaS-API oder On-Premises Modell").

### 4. Conflict Matrix (Trade-off Analyse)
Dies ist das Herzstück des Tools. Das System vergleicht alle gewählten Anforderungen (Souveränität + Funktional) gegen eine hinterlegte Wissensdatenbank.
*   **Anzeige**: Konflikte werden farblich markiert (Rot = Harter Konflikt, Orange = Trade-off).
*   **Conflict Resolver**: Interaktive Abwägung der Anforderungen über eine Waage inklusive nachvollziehbarer Darstellung von Herkunft, Scores (*Strategische Relevanz*, *Umsetzungs-Risiko*) und Freitext-Begründungen aus Entscheidungsbäumen und Szenarien.
*   **Lösung**: Zu jedem Konflikt werden Erläuterungen, Alternativen und Best-Practices angezeigt, um architektonische Lösungen zu finden oder Risiken begründet zu akzeptieren.

---

## ⚙️ Experten-Workflow (Editor)

Für Administratoren und Fachexperten bietet das Tool einen integrierten **No-Code Editor**:
*   **Anforderungs-Management**: Hinzufügen, Bearbeiten und Löschen von Anforderungen, Kategorien und Gruppen.
*   **Szenario-Editor**: Erstellung von Bewertungsszenarien zur Evaluierung von Projektkontexten.
*   **Tree-Builder**: Visueller Editor für die Entscheidungsbäume.
*   **Matrix-Pflege**: Direktes Setzen von Trade-offs zwischen Anforderungspaaren.

Der Editor ist über den Button "Editor öffnen" in der Navigationsleiste erreichbar.

---

## 🏗️ Architektur & Datenkonzept

Das System verfolgt einen **AI-Native & Hybrid-Storage** Ansatz und wurde für **zwei Betriebsmodi** (Dual-Mode) entworfen:
- **Produktions-Modus (Fullstack)**: Nutzung von SQLite und Next.js API Routen.
- **Demo-Modus (Static Export)**: Reines Client-Side Hosting für GitHub Pages.
👉 *Siehe detaillierte Dokumentation:* [Dual-Mode Architecture](wiki/dual-mode-architecture.md)

### Das Bewertungsmodell: Von Konzept zu Technologie
Das Tool erzwingt in der Benutzerführung eine bewusste Trennung zwischen Problemraum (Szenarien) und Lösungsraum (Architektur):
* **Szenarien & Optionen (Problemraum):** Optionen werden auf reiner Konzeptebene (High-Level) formuliert, unter Verwendung etablierter Begriffe (z.B. *Multi-Region*, *Queues*, *Managed Services*), jedoch ohne stark anbieterspezifisches Buzzword-Bingo (z.B. AWS Lambda). Sie fokussieren sich auf den geschäftlichen oder operativen Trade-off der jeweiligen Situation.
* **Requirements (Lösungsraum):** Die Translation in harte Technologie und konkrete Architekturmuster erfolgt erst durch das Mapping. Die konzeptionelle Entscheidung in einem Szenario triggert spezifische, technische Requirements (z.B. *Requirement: "Cloud-native Serverless (PaaS/FaaS)"*). 
Dadurch bleiben Architekturentscheidungen fundiert am Geschäfts- und Souveränitätsziel ausgerichtet, während das System dem User komplexe Technologieentscheidungen verständlich übersetzt.

### Dual Source of Truth & Synchronisation
*   **SQLite-Datenbank (`prisma/dev.db`)**: Primäre Laufzeit-Datenquelle. Das Frontend und alle APIs lesen und schreiben direkt in diese Datenbank.
*   **JSON-Files (`/data/*.json`)**: Automatischer Export der DB bei jeder Änderung über die API. Dies ermöglicht die Versionierung der Fachdaten in Git und bietet KI-Agenten eine leicht lesbare Datenbasis.

> [!IMPORTANT]
> **Wichtig für manuelle Änderungen an JSON-Dateien:**
> Wenn Sie (oder ein KI-Agent) die JSON-Dateien im Ordner `data/` manuell verändern, werden diese Änderungen **nicht** automatisch in die SQLite-Datenbank übertragen. Da das Frontend ausschließlich die SQLite-Datenbank abfragt, kommen Änderungen in den JSON-Dateien erst nach einem manuellen Sync im Frontend an!
>
> **So synchronisieren Sie die Datenbank:**
> 1. **Standard-Befehl:**
>    ```bash
>    npm run db:import
>    ```
>    Dies führt das TypeScript-Skript `scripts/sync-import.ts` mittels `tsx` aus.
> 2. **Fallback bei Sandbox-/Rechte-Problemen:**
>    In manchen Terminal- oder Sandbox-Umgebungen kann `tsx` aufgrund von Socket-Berechtigungsfehlern (`EPERM: operation not permitted` beim Erstellen von IPC-Pipes) fehlschlagen. Nutzen Sie in diesem Fall das vorkompilierte JavaScript-Skript:
>    ```bash
>    node scripts/sync-import.js
>    ```
>
> **Nach dem Sync:**
> Next.js nutzt aggressive Caching-Mechanismen. Wenn Sie die DB gesynct haben, aber die Änderungen im Browser noch nicht sehen:
> * Machen Sie einen Hard-Refresh im Browser (`Cmd + Shift + R` bzw. `Strg + F5`).
> * Starten Sie den Next.js-Dev-Server neu (`npm run dev`), um den Daten-Cache vollständig zu leeren.

### Model Context Protocol (MCP) Server
KI-Agenten können über den integrierten **MCP-Server** (`scripts/mcp-server.ts`) direkt mit der Datenbank interagieren. Dies ermöglicht automatisierte Pflege der Anforderungskataloge und der Konflikt-Matrix.

---

## 🛠️ Betrieb für Administratoren

### Installation
```bash
npm install
npx prisma db push
npm run db:seed
```

### Wichtige Scripts
*   `npm run dev`: Startet die Anwendung auf `http://localhost:3000`.
*   `npm run test`: **WICHTIG!** Führt Integrationstests für den MCP-Server und den Daten-Sync aus. Muss nach jeder Änderung am Schema ausgeführt werden.
*   `npm run db:import`: Importiert manuelle Änderungen aus JSON-Dateien zurück in die Datenbank.
*   `npm run mcp:start`: Startet den MCP-Server (für Agenten-Interaktion).

### Datenbank-Wartung
Nutzen Sie `npx prisma studio`, um die Daten grafisch in der Datenbank zu bearbeiten oder die Relationen zu prüfen.

### Bootstrapping (Konflikt-Matrix & Heatmap)
Um die Trade-off-Matrix (Requirement vs. Requirement) und die Architektur-Heatmap (Requirement vs. Kategorie) initial oder nach Änderungen automatisiert und wissenschaftlich fundiert evaluieren zu lassen, stehen zwei Methoden zur Verfügung: 
1. Ein **lokaler Coding Agent (Antigravity)** via MCP (empfohlen)
2. Ein automatisiertes **TypeScript-Skript** via LLM API

Beide Methoden bewerten unbewertete Paare auf Basis von 8 definierten Trade-off-Konflikten (TCs) aus der zugrundeliegenden Thesis.

#### Variante 1: Lokaler Agent (Antigravity via MCP) - Empfohlen
Diese Methode nutzt die Ressourcen deines lokalen Coding-Agenten (z. B. Google Antigravity), ohne dass externe API-Kosten anfallen. Der Agent liest einen versionierten Prompt und schreibt die Ergebnisse über das Model Context Protocol (MCP) direkt in die Datenbank.

**Voraussetzungen:**
1. Füge den lokalen MCP-Server in deine Agenten-Konfiguration ein (z.B. in der `~/.gemini/config/mcp.json` oder der IDE):
   - **Name:** `master-matrix-server`
   - **Command:** `/absoluter/pfad/zu/master-matrix/scripts/start-mcp.sh`
   - **Args:** *(leer lassen oder leeres Array)*

   > [!TIP]
   > Wir nutzen bewusst das Wrapper-Skript `start-mcp.sh` anstelle des direkten Aufrufs. Es stellt sicher, dass beim Start aus dem Agenten-Kontext die korrekte Node.js-Umgebung (z.B. über `nvm`) geladen wird. Das verhindert zuverlässig Abstürze ("EOF") von Native-Addons (wie `better-sqlite3`), falls das System auf eine andere Node-Version zeigt.
2. Stelle sicher, dass das **Matrix Evaluator Plugin** aktiv ist (siehe `.gemini/config/plugins/matrix-evaluator-plugin`).

**Ausführen:**
Du kannst deinen Agenten anweisen, die Matrix oder die Heatmap zu evaluieren:
- **Für die Req-to-Req Matrix:** *"Nutze den `matrix-evaluator` Skill und bewerte die nächsten 10 Konflikte."* (Nutzt `prompts/evaluation_v1.md`)
- **Für die Req-to-Category Heatmap:** *"Starte den `heatmap-evaluator` und werte die nächsten Impacts aus."* (Nutzt `prompts/category_impact_v1.md`)

Beide Skills speichern die Ergebnisse automatisch über die zugehörigen MCP-Tools in die Datenbank.

> [!NOTE]
> **Skript-Fallback für Agenten**
> Sollte der MCP-Server in einer Sandbox-Umgebung blockiert werden, sind Agenten instruiert, stattdessen das Skript `npx tsx scripts/run-mcp-tool.ts <ToolName>` als sicheren Fallback zu verwenden.

#### Variante 2: TypeScript-Skript via LLM API
Sie benötigen einen API-Key für eine OpenAI-kompatible Schnittstelle. Das Skript unterstützt verschiedene Modelle und passt spezielle Parameter (wie "Thinking") dynamisch an den Modellnamen an.

Erstellen Sie dazu eine `.env` Datei im Hauptverzeichnis. Hier sind Konfigurationsbeispiele für verschiedene Anbieter:

**Option 1: DeepSeek (via NVIDIA API)**
```env
LLM_API_KEY="nvapi-IhrKey"
LLM_API_URL="https://integrate.api.nvidia.com/v1"
LLM_MODEL="deepseek-ai/deepseek-v4-pro"
BATCH_SIZE="20"
```

**Option 2: NVIDIA Nemotron**
```env
LLM_API_KEY="nvapi-IhrKey"
LLM_API_URL="https://integrate.api.nvidia.com/v1"
LLM_MODEL="nvidia/nemotron-3-ultra-550b-a55b"
BATCH_SIZE="5" # Empfohlen niedriger wegen hoher Denkzeit
```

**Option 3: OpenAI (GPT-4o)**
```env
LLM_API_KEY="sk-IhrOpenAiKey"
LLM_API_URL="https://api.openai.com/v1"
LLM_MODEL="gpt-4o"
BATCH_SIZE="20"
```

**Option 4: Google Gemini (via OpenAI Kompatibilitäts-Layer)**
```env
LLM_API_KEY="AIzaSy-IhrGeminiKey"
LLM_API_URL="https://generativelanguage.googleapis.com/v1beta/openai/"
LLM_MODEL="gemini-2.5-pro"
BATCH_SIZE="20"
```

**Skript ausführen:**
```bash
npx tsx scripts/bootstrap-impacts.ts
```

Das Skript ist idempotent und nutzt ein Batching-System. Wenn es abbricht (z. B. durch Rate-Limits), kann es einfach neu gestartet werden und macht an der letzten unbewerteten Stelle weiter. Anschließend werden die JSON-Dateien im Ordner `data/` automatisch synchronisiert.

---

## 🚀 Technologien
*   **Next.js 16** (App Router)
*   **Prisma ORM** & **SQLite**
*   **Vitest** (Integrationstests)
*   **MCP SDK** (Agentic AI Support)
## 💾 Sessions & Export
Das Tool speichert alle Benutzereingaben lokal.
Sobald Sie in Schritt 1 einen Analysenamen eingeben, generiert das System eine JSON-Datei im Ordner `/data/sessions/`. 
Sie können den aktuellen Stand jederzeit als Datei exportieren und später an einem anderen Computer (oder durch einen Kollegen) über den Button **"Session importieren"** wieder hochladen.

### 📝 Case Study Experten-Evaluation
Für die Durchführung der Case Study steht ein dediziertes Evaluationsformular zur Verfügung. Dieses ist als eigenständige statische HTML-Datei implementiert und unter `public/evaluation.html` abgelegt.
- **Aufruf:** Öffnen Sie `public/evaluation.html` direkt im Browser (z. B. per Doppelklick) oder über `http://localhost:3000/evaluation.html` bei laufendem Next.js-Dev-Server.
- **Hauptfunktionen:**
  - Umschaltbar zwischen **Phase 1 (Vorbereitungsphase - Fragebogen A)** und **Phase 2 (Abstimmungsphase - Fragebogen B)**.
  - Automatisches Speichern im LocalStorage zur Verhinderung von Datenverlust bei Tab-Wechseln.
  - Daten-Export als JSON oder CSV.
  - **LaTeX & Markdown Integration:** Generiert fertigen LaTeX-Tabellencode (mit ausgefüllten Spalten auf Basis der Antworten, passend für `10_case_study.tex`) sowie Markdown-Tabellen zum Kopieren.
  - **Daten-Import:** Ermöglicht das Wiederladen bereits ausgefüllter JSON-Antworten zur Ansicht oder Korrektur.

---

---

## 🐳 Starten mit Docker (Empfohlen)

Die Anwendung kann einfach und isoliert via Docker Compose betrieben werden.

1. Erstellen Sie eine `.env` Datei basierend auf der Vorlage:
   ```bash
   cp .env.example .env
   ```
   *Tragen Sie Ihre Konfiguration (z. B. `LLM_API_KEY`) in die `.env` Datei ein.*

2. Starten Sie den Container:
   ```bash
   docker-compose up -d --build
   ```

3. Öffnen Sie `http://localhost:3000` im Browser.

Die SQLite-Datenbank (`prisma/dev.db`) und die JSON-Daten (`data/`) werden über Docker-Volumes auf dem Host persistiert.

---

## 🚀 Lokale Entwicklung (Ohne Docker)

Stellen Sie sicher, dass Node.js (v18+) installiert ist.

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

3. Öffnen Sie `http://localhost:3000` im Browser.

---

## 🧠 Empfohlene Skills & Agenten-Werkzeuge

Dieses Projekt ist für die Zusammenarbeit mit modernen AI-Coding-Assistenten (wie Google Antigravity) optimiert. Es wird dringend empfohlen, den folgenden Skill zu installieren, um eine hochgradig kontextsensitive und token-schonende Entwicklungs-Erfahrung zu ermöglichen.

### 📊 Graphify (Wissensgraph & GraphRAG)

**Graphify** analysiert die gesamte Codebasis sowie alle vorliegenden Dokumente (wie das europäische *Cloud Sovereignty Framework* im Ordner `masterarbeit-context/`) und baut einen persistenten, interaktiven Wissensgraphen auf. Dies ermöglicht Agenten, Architekturmuster, Abhängigkeiten und Querverbindungen auf einen Blick zu verstehen, ohne den gesamten Code einlesen zu müssen.

#### 🔧 Installation
Führen Sie die folgenden Befehle in Ihrem Terminal aus, um den CLI-Dienst und den Google Antigravity-Skill zu registrieren:

```bash
# 1. CLI und Python-Bibliothek installieren (macOS / Linux)
pip install graphifyy --break-system-packages

# 2. Skill für Google Antigravity registrieren
graphify install --platform antigravity
```

#### 🚀 Verwendung

1. **Wissensgraphen erstellen oder aktualisieren:**
   Geben Sie in Ihrem AI-Assistenten einfach den Slash-Befehl ein:
   ```
   /graphify
   ```
   Dies scannt das Projekt und erstellt im Ordner `graphify-out/` folgende Ausgaben:
   * `graph.html`: Eine interaktive 3D-Visualisierung des Graphen im Browser.
   * `GRAPH_REPORT.md`: Ein verständlicher Bericht über die wichtigsten Komponenten (God Nodes) und überraschende Querverbindungen.
   * `graph.json`: Die persistente Wissensdatenbank für RAG-Abfragen.

2. **Inkrementelle Updates (nach Code-Änderungen):**
   Wenn Sie Code refaktoriert oder umgeschrieben haben, können Sie den Graphen blitzschnell und ohne LLM-Kosten (über AST-Analyse) aktualisieren:
   ```bash
   graphify update .
   ```

3. **Fragen an den Graphen stellen (Cross-Session RAG):**
   Sie oder AI-Agenten können direkte Fragen zur Systemarchitektur stellen:
   ```bash
   graphify query "Welche Komponenten greifen auf selectedRequirements zu und wie hängen sie zusammen?"
   ```

---

## 🌐 Dual-Mode Deployment (Static Demo vs. Fullstack)

Die Anwendung unterstützt zwei Betriebsmodi:
1. **Fullstack-Modus (Lokal / Docker):** Next.js mit dynamischen API-Routen, Prisma ORM und SQLite.
2. **Statischer Demo-Modus (GitHub Pages):** Rein clientseitiger Build ohne Node/DB-Backend. Daten werden über statische JSON-Dateien aus `/data/` geladen; der 7-Schritte-Navigator ist vollständig interaktiv nutzbar.

*   **Statischen Build lokal erzeugen:**
    ```bash
    npm run build:static
    ```
*   **Architektur-Tests ausführen:**
    ```bash
    npm test
    ```
*   Weitere Details finden sich in [wiki/dual-mode-architecture.md](wiki/dual-mode-architecture.md).


