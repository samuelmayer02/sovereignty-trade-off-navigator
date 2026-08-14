# Editor Guide: Der No-Code Editor

Das System beinhaltet einen integrierten No-Code Editor, der es Administratoren und Fachexperten erlaubt, das Wissen des Tools kontinuierlich zu pflegen und zu erweitern, ohne eine einzige Zeile Code zu schreiben.

Den Editor erreichen Sie über den Button **"Editor öffnen"** in der oberen Navigationsleiste der Anwendung.

## Die vier Hauptbereiche des Editors

### 1. Requirements (Anforderungen) verwalten
Hier verwalten Sie den grundlegenden Lösungsraum.
*   **Hinzufügen/Bearbeiten:** Definieren Sie neue technische Anforderungen, vergeben Sie einen Namen, eine kurze Beschreibung und ordnen Sie diese einer Kategorie zu.
*   **Gruppierung:** Sie können Anforderungen zu bestehenden Gruppen hinzufügen. Denken Sie an die *Exklusiv*-Logik: Wenn Sie hier eine Anforderung in eine exklusive Gruppe packen, kann in der App später nur noch eine Anforderung aus dieser Gruppe aktiv sein.

### 2. Scenarios (Szenarien) erstellen
Bauen Sie den Problemraum für die Nutzer auf.
*   **Neues Szenario:** Beschreiben Sie einen Business-Stimulus und formulieren Sie eine Fragestellung (die Metric Question).
*   **Optionen hinzufügen:** Geben Sie Antwortmöglichkeiten vor. Der wichtigste Teil hier ist das Mapping: Sie müssen definieren, welche *Requirements* durch diese Option ausgelöst (getriggert) werden. Dies ist die Übersetzungsleistung des Tools vom Problem- in den Lösungsraum.

### 3. Tree-Builder (Bäume pflegen)
Die Entscheidungsbäume zur SEAL-Ermittlung können visuell angepasst werden.
*   Knoten können Fragen, Informationen oder Endresultate (wie "SEAL-2") sein.
*   Sie können Kanten ziehen, um neue Fragepfade zu erschaffen.
*   Auch hier gilt: Bestimmte Antwort-Knoten können versteckte Souveränitäts-Anforderungen triggern.

### 4. Matrix & Conflicts (Trade-offs pflegen)
Hier definieren Sie die Beziehungen zwischen den Anforderungen.
*   Sie wählen zwei Requirements aus und definieren den Konflikt-Status (Rot oder Orange).
*   **Conflict Text:** Beschreiben Sie verständlich, *warum* dieser Konflikt existiert.
*   **Best Practice:** Geben Sie dem Architekten eine Hilfestellung, wie man dieses Dilemma auflösen kann (z.B. "Nutze KMS Encryption Proxy als Middleware").
*   **Hinweis:** Manuelle Änderungen an Konflikten überschreiben eventuelle KI-generierte Ratings.

## Synchronisation der Daten
Wenn Sie im Editor Änderungen vornehmen, werden diese sofort in der **SQLite-Laufzeitdatenbank** (`prisma/dev.db`) gespeichert. 
Gleichzeitig exportiert das System die Daten nach jedem Speichern in die lesbaren JSON-Dateien im Ordner `/data/`, damit Sie die Änderungen im Git-Repository versionieren können.
