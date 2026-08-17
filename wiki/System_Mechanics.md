# System-Mechaniken

Für Nutzung und Weiterentwicklung des Werkzeugs ist ein Verständnis der internen Mechaniken erforderlich. Das System operiert primär über State-Management und Querverweise zwischen Anforderungen.

## Konfliktauflösung & Konflikttypen

Konflikte existieren in der Datenbank (exportiert nach `conflict_matrix.json`) zwischen Paaren von Requirements (`pair`). Das System kennt vier Status – `red`, `orange`, `green` und `blue` –, von denen die ersten beiden Handlungsbedarf auslösen. Die Status werden auf allen Schreibpfaden über `lib/conflict-status.ts` kleingeschrieben normalisiert:
*   **Rot (Harter Konflikt):** Fundamental inkompatibel (z. B. "Managed Container EKS/AKS" vs "Volle Lieferkettentransparenz", "Managed Container EKS/AKS" vs "Autarker SRE-Eigenbetrieb", "Erweiterte Compliance BSI C5/SecNumCloud" vs "Managed Container EKS/AKS", "Air-Gapped Backups" vs "Site-to-Site VPN"). Eine technische oder rechtliche Umsetzung ist konzeptionell oder vertraglich ausgeschlossen.
*   **Orange (Weicher Trade-off):** Realisierbar, erzeugt aber Reibung oder erhebliche Markteinschränkungen (z. B. "Multi-Region Architektur" vs "Kausale/Sequentielle Konsistenz", "Sovereign Backup Landing Zone" vs "Cross-Provider Backup").
*   **Grün (Synergie):** Die Anforderungen begünstigen sich gegenseitig.
*   **Blau (Neutral / Kein Konflikt):** Kein architektonischer Widerspruch (z. B. "Offene Storage-APIs" vs "SSE-KMS / BYOK", da Server-Side Encryption mit Kunden-KMS In-Memory-Processing erlaubt).

Paare ohne Eintrag werden in der Matrix grau dargestellt. Im ausgelieferten Datenstand sind alle 4.465 Paare der 95 Anforderungen bewertet.

In der Trade-off Matrix (Step 7) können Nutzer auf diese Konflikte klicken und sie als **"Akzeptiertes Risiko"** markieren (`acceptRisk` im State). Dazu muss zwingend ein Rationale (Begründung) eingegeben werden. Dies ist essentiell für die Auditierbarkeit.

## Exklusiv-Gruppen & Der Konflikt-Interceptor

Während `conflict_matrix.json` *generelle* technische Reibungen aufzeigt, greifen die **Requirement-Gruppen** viel früher ein, nämlich schon bei der Auswahl (Problemraum).

1.  **Exklusiv (`exclusive`):** Anforderungen in einer solchen Gruppe schließen sich gegenseitig zu 100% aus (z.B. die Mandantenfähigkeit kann nicht gleichzeitig Single-Tenant und Multi-Tenant sein). 
2.  **Konflikt-Interceptor (Global Blocker):**
    Wenn ein Nutzer in Step 2 oder Step 4 Antworten wählt, die zwei oder mehr Anforderungen aus derselben Exklusiv-Gruppe in den State pushen, greift in Step 3 und Step 5 der Konflikt-Interceptor ein.
    Das System blockiert die Weiterleitung (Der "Weiter"-Button wird deaktiviert), bis der Nutzer eine aktive Entscheidung trifft, welche der sich widersprechenden Anforderungen behalten wird.
    *Dies verhindert paradoxe Zustände und inkonsistente Matrizen am Ende des Prozesses.*

## Bewertung und Priorisierung (Dynamische Metriken)

Die dynamische Prioritätsberechnung verhindert eine undifferenzierte Gleichgewichtung aller Anforderungen.

In den Szenarien und Entscheidungsbäumen müssen Schieberegler für **Business Value (BV)** (Geschäftsnutzen) und **Technical Risk (TR)** (Risiko) auf einer Skala von 1-10 gesetzt werden.

Das System errechnet daraus eine globale Priorität pro Anforderung:
`Priority = Clamp(Round(((BV * 10) / (BV + TR)) * 10) / 10, 1, 10)`

Diese Ratio balanciert den Business Value gegen das eingegangene technische Risiko. Hoher BV bei null Risiko ergibt eine hohe Priorität (10). Hohes Risiko bei marginalem BV straft die Priorität extrem ab (Priorität < 3).
Die abgeleitete Priorität fließt direkt ins Risk Register (Step 7) ein.

### Prioritäts-Speicherung und Segregation (Store Routing)

Um den Kontext der Anforderungen zu wahren, trennt das System die Prioritäten-Zustände streng in drei isolierte Stores (`Zustand`):
1. **`selectedSovereigntyReqs`**: Anforderungen, die aus den Entscheidungsbäumen (Step 1 & 2) stammen.
2. **`selectedScenarioReqs`**: Anforderungen, die aus den Architekturszenarien (Step 4 & 5) stammen.
3. **`selectedRequirements`**: Manuell hinzugefügte Anforderungen (Step 6).

**Warum diese Trennung wichtig ist:**
Wenn ein Nutzer ein Szenario deaktiviert, werden alle dazugehörigen Anforderungen sauber aus `selectedScenarioReqs` gelöscht. Hätte der Nutzer in der Matrix (Step 7) eine Priorität für diese Anforderung manuell überschrieben und diese Überschreibung fälschlicherweise in `selectedRequirements` gespeichert, bliebe die Anforderung als "manuelle" Anforderung aktiv.
Um diese globale "Verschmutzung" (State Pollution) zu vermeiden, iteriert das UI beim Ändern einer Priorität (z.B. per Slider in der Matrix) intelligent über diese drei Maps und updatet *nur* diejenige Map, aus der die Anforderung ursprünglich stammt (Sovereignty > Scenario > Manual).

## Die Matrizen und ihre Scopes

Das Tool verwendet primär zwei Darstellungsformen für Abhängigkeiten in Step 7:

1.  **Sovereignty Trade-off Matrix (Requirement-to-Requirement):**
    *   **Scope:** Vergleicht individuelle Anforderungen gegeneinander.
    *   **Mechanik:** Liest `conflict_matrix.json` aus. Trifft ein aktives Req A auf ein aktives Req B und es existiert ein Konflikt in der Datenbank, wird die Zelle eingefärbt.
    *   **Ziel:** Aufzeigen direkter technischer Reibungspunkte.

2.  **Risiko-Register Dashboard (Die Aggregierte Ansicht):**
    *   **Scope:** Listet alle aktiven Anforderungen (aus Bäumen, Szenarien, oder Manuell) gebündelt auf.
    *   **Mechanik:** Nutzt die `Provenance` (Herkunft) einer Anforderung, um zu tracen, *warum* sie im System ist (aus welchem spezifischen Szenario oder Baumast). Es liest die dynamische Priorität, den Business Value und das Risiko aus dem Zustand aus und macht sie sortierbar.
    *   **Ziel:** Ein High-Level-Dashboard für Management-Stakeholder zur Priorisierung.
