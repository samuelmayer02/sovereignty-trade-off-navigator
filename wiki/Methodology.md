# Methodik & Theoretischer Hintergrund

Der Sovereignty Trade-off Navigator baut auf dem Prinzip auf, komplexe architektonische Probleme in greifbare, geschäftliche Fragestellungen zu zerlegen. Anstatt zu fragen "Welche Datenbank wollen Sie?", fragt das Tool nach den Prioritäten des Unternehmens. 

## Theoretische Architektur-Konflikte

Das System modelliert fundamentale Architektur-Dilemmata aus der Praxis und Literatur. Diese theoretischen Konflikte versucht das Tool aufzulösen, indem es sie dem Nutzer in verständlichen Szenarien und Matrizen präsentiert.

### 1. CAP-Theorem & PACELC

*   **CAP-Theorem:** Der Konflikt zwischen Datenkonsistenz (Consistency) und Verfügbarkeit (Availability) bei einer Netzwerkpartitionierung (Partition Tolerance). Das Tool macht sichtbar: Wer 100% Verfügbarkeit will, muss Abstriche bei der sofortigen Konsistenz machen.
*   **PACELC:** Eine Erweiterung des CAP-Theorems. Es besagt: Auch im Normalbetrieb (ohne Partitionierung - `E`lse) muss man sich zwischen Latenz (`L`atency) und Konsistenz (`C`onsistency) entscheiden. Das Tool operationalisiert dies durch Szenarien zur synchronen Replikation vs. asynchronen Event-Streams.

### 2. Shared Responsibility Model

In der Cloud liegt die Verantwortung für Sicherheit und Betrieb nie allein beim Provider. Je nach Service-Modell (IaaS, PaaS, SaaS) verschiebt sich die Grenze. 
*   **Der Konflikt:** Hoher Einsatz von Managed Services (SaaS/PaaS) verringert den Betriebsaufwand massiv, bedeutet aber auch einen Kontrollverlust über den Stack (Verlust von technischer Souveränität). Das Tool macht diesen Kontrollverlust als *Konflikt in der Trade-off Matrix* sichtbar, wenn der Nutzer gleichzeitig "Volle Datenhoheit" und "Serverless First" fordert.

### 3. Data Gravity & Egress-Kosten

Je größer die Datenmenge an einem Ort, desto schwieriger und teurer wird ein Umzug. Massendaten in der Public Cloud erzeugen durch Egress-Kosten (Ausgangstraffic) einen massiven Vendor Lock-in. Ein Architekturmuster, das auf "Multi-Cloud" pocht, wird durch Data Gravity oft theoretisch gemacht.

### 4. Resilienz vs. Isolierung

Globale Ausfallsicherheit erfordert oft die tiefe Integration in proprietäre Hardware-Netzwerke eines Hyperscalers (z.B. AWS Route 53, globale CDNs). Dies widerspricht diametral den Forderungen nach lokaler Datenresidenz und physischer Autarkie.

---

## Die Lösung: Bäume und Szenarien

Das System trennt strikt zwischen **Problemraum** (Was sind die regulatorischen/geschäftlichen Zwänge?) und **Lösungsraum** (Wie bauen wir es?).

### 1. Entscheidungsbäume (Das 3D-SEAL-Vektormodell)
Die Bäume dienen dazu, das grundlegende Souveränitätsziel des Projekts zu definieren. Im Gegensatz zu vereinfachenden Modellen, die Souveränität als eindimensionale Skala betrachten, implementiert der Sovereignty Trade-off Navigator ein **3D-SEAL-Vektormodell**.
Souveränität wird strikt in drei orthogonale Dimensionen (Vektoren) unterteilt, da rechtliche Unabhängigkeit (z.B. von US-Behörden) nicht zwangsläufig technologische Unabhängigkeit (z.B. von Hersteller-APIs) bedeutet:

*   **SEAL-J (Jurisdiktionelle & Daten-Souveränität):** Bewertet die rechtliche Bindung, physische Datenresidenz, kryptografische Autarkie (SSE-KMS / BYOK / HYOK) und die Provider-Nationalität.
*   **SEAL-T (Technologische Souveränität):** Bewertet die architektonische Portabilität, Schnittstellen-Offenheit und die Vermeidung von Vendor Lock-in (unabhängig vom Standort).
*   **SEAL-O (Operative Souveränität):** Bewertet die Autarkie im laufenden Betrieb, Support-Strukturen, lokales IAM und die Notfallfähigkeit (Air-Gapping).

Anhand von regulatorischen Anforderungen (z.B. BSI-Vorgaben) führen die drei Bäume den Nutzer zu einem dreidimensionalen Souveränitätsprofil (z.B. `J=4, T=1, O=2`). Antworten triggern hierbei im Hintergrund automatisch harte, dimensionen-spezifische Architektur-Anforderungen.

### 2. Szenarien
Szenarien überführen komplexe Architekturmuster in verständliche, geschäftliche Trade-offs.
*   **Warum Szenarien?** Anstatt Stakeholder nach spezifischen Technologien zu fragen, wird ein Szenario formuliert: "Wie wichtig ist Portabilität im Vergleich zur Wartungsfreiheit der Middleware?".
*   Die Optionen eines Szenarios sind an konkrete Lösungsraum-Anforderungen gekoppelt. Nicht-technische Stakeholder treffen fundierte Entscheidungen, und das System übersetzt diese in Architektur-Anforderungen.

---

## Operationalisierung des EU Cloud Sovereignty Frameworks

Der Sovereignty Trade-off Navigator und das 3D-SEAL-Vektormodell basieren direkt auf dem **Cloud Sovereignty Framework (Version 1.2.1 – Oct. 2025) der EU-Kommission**. 
Das Framework definiert 8 Souveränitäts-Ziele (Sovereignty Objectives, SOV-1 bis SOV-8). Der Sovereignty Trade-off Navigator mappt diese strukturiert auf seine drei Entscheidungsbäume:

1.  **Baum 1: Jurisdiktionelle & Daten-Souveränität (SEAL-J)**
    *   *SOV-1: Strategic Sovereignty* (z.B. Provider-Nationalität, Eigentümerschaft)
    *   *SOV-2: Legal & Jurisdictional Sovereignty* (z.B. EU-Gerichtsstand, Schutz vor CLOUD-Act)
    *   *SOV-3: Data & AI Sovereignty* (z.B. Datenresidenz, Verschlüsselungshoheit)
2.  **Baum 2: Technologische Souveränität (SEAL-T)**
    *   *SOV-6: Technology Sovereignty* (z.B. Open Source, Interoperabilität, Portabilität)
3.  **Baum 3: Operative Souveränität (SEAL-O)**
    *   *SOV-4: Operational Sovereignty* (z.B. Lokaler Support, Dokumentation, Skillset)
    *   *SOV-5: Supply Chain Sovereignty* (z.B. Hardware- und Software-Lieferkette)
    *   *SOV-7: Security & Compliance Sovereignty* (z.B. EU-Sicherheitszentrum, unabhängige Audits)
    *(SOV-8: Environmental Sustainability wird aktuell als eigenständiges Themensilo betrachtet und in künftigen Iterationen über Szenarien operationalisiert).*

**Trennung von Basis-Anforderungen und Szenarien:**
Während die SEAL-Bäume die unverhandelbare Basis auf Ebene der EU-Taxonomie abfragen, identifiziert das Tool zusätzlich spezifische architektonische Lösungsstrategien (z.B. "Multi-Cloud-Orchestrierung" zur Risikominderung oder "Sovereign Landing Zones"). Solche Strategien (Trade-offs) wurden bewusst aus den Basisbäumen extrahiert und in die **Szenarien** überführt, da sie Lösungsansätze und keine grundlegenden Souveränitätsziele darstellen. Dies verhindert physikalisch unmögliche "Wünsch-dir-was"-Architekturen von vornherein.

---

## Priorisierung: Business Value und Technical Risk

Um die Wichtigkeit der abgeleiteten Anforderungen zu gewichten, wendet das Tool eine Metrik zur Prioritätsberechnung an.

Das Tool nutzt einen **transparenten, Ratio-basierten Ansatz**:
Der Nutzer bewertet auf Slidern (Werte von 0 bis 10):
1.  **Business Value (BV):** Wie stark zahlt diese Entscheidung auf den Geschäftswert des Produkts ein?
2.  **Technical Risk (TR):** Welches Risiko (z.B. Implementierungsaufwand, Lock-in) birgt diese Entscheidung für das Produkt?

**Die Aggregations-Formel lautet:**
`Priority = (BV * 10) / (BV + TR)` *(auf eine Nachkommastelle gerundet, begrenzt zwischen 1 und 10)*

*   **Beispiel 1:** Hoher Business Value (10), niedriges Risiko (2) -> `(10 * 10) / 12 = 8.3` -> **Priorität 8.3** (Ein absolutes Must-Have).
*   **Beispiel 2:** Geringer Business Value (2), hohes Risiko (8) -> `(2 * 10) / 10 = 2` -> **Priorität 2** (Sollte vermutlich überdacht werden).

Durch diese Mechanik zwingt das Tool Stakeholder, jede Anforderung **spezifisch auf ihr Produkt** zu beziehen. Eine bloße "Alles ist wichtig"-Mentalität wird mathematisch aufgelöst.
