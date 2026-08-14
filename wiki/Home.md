# Willkommen beim Decision Navigator Wiki

Der **Decision Navigator** ist ein interaktives Architekturbewertungs-Tool, das komplexe, oft widersprüchliche Anforderungen im Kontext von Cloud-Souveränität, Architektur-Entscheidungen und geschäftlichen Zielen modelliert und transparent macht.

## Zielgruppe, Kernproblem und Mehrwert

### Das Kernproblem: Das Souveränitäts-Hochverfügbarkeits-Paradoxon
IT-Entscheider und Cloud-Architekten, insbesondere in stark regulierten Branchen (wie KRITIS, Energie, Finanzen), stehen zunehmend zwischen zwei Stühlen: Einerseits fordert das Management oder der Gesetzgeber (z. B. NIS-2, BSI C5) maximale Unabhängigkeit (Digitale Souveränität) und Schutz vor extraterritorialen Zugriffen. Andererseits verlangen dieselben Stakeholder eine maximale Ausfallsicherheit (Resilienz) mit Recovery Time Objectives (RTO) nahe Null. In der physikalischen Cloud-Realität (CAP/PACELC-Theorem) schließen sich diese Extreme jedoch gegenseitig aus oder führen zu einer explodierenden operativen Komplexität im Eigenbetrieb. Der Decision Navigator macht diesen "Wicked Problem"-Zielkonflikt objektivierbar, messbar und kommunizierbar.

### Zielgruppe und Einsatzszenarien
Das Tool liefert auf zwei Ebenen den entscheidenden Mehrwert:

1.  **Strategische Ebene (Management & C-Level, Enterprise Architekten):** Bei der Erarbeitung oder Validierung einer unternehmensweiten Cloud-Strategie. Das Tool fungiert als Kommunikationsbrücke, die dem Management schmerzhaft, aber transparent aufzeigt, was der Wunsch nach "100% Cloud-Agnostizität" für die Ausfallsicherheit und die Kosten bedeutet. Es schafft ein "Shared Understanding".
2.  **System Ebene (IT- & Lösungsarchitekten):** In der Architektur-Design- und Planungsphase *vor* der eigentlichen Cloud-Migration von spezifischen, hochkritischen ("Mission-Critical") Anwendungen. Es hilft, konkrete und technisch vertretbare Kompromisse zu finden.

### Das Deliverable
Das konkrete Endergebnis einer Session im Decision Navigator ist ein fundierter, exportierbarer Report (Architektur-Entscheidungsdokument / Architecture Decision Record - ADR). Dieser dokumentiert die getroffenen Kompromisse, die identifizierten Konflikte und vor allem die "Accepted Risks" (Akzeptierten Risiken) messbar. Er dient als belastbare Argumentationsgrundlage und Nachweis gegenüber Management, Security-Beauftragten und Auditoren.

## Inhaltsverzeichnis

Um das Tool vollständig zu verstehen, empfehlen wir, die Dokumentation in der folgenden Reihenfolge zu lesen:

1.  **[Methodik & Theoretischer Hintergrund](Methodology):** Warum das Tool existiert. Erklärt die Kernkonflikte (z.B. CAP, PACELC, Shared Responsibility), warum wir mit Bäumen und Szenarien arbeiten und wie das Cloud Sovereignty Framework operationalisiert wurde.
2.  **[User Guide & User Flow](User_Guide):** Eine Schritt-für-Schritt-Anleitung durch das Frontend. Wie werden Entscheidungen getroffen? Wie funktioniert die Konfliktauflösung in der UI? Wie liest man das Risiko-Register und die Trade-off-Matrix?
3.  **[System-Mechaniken (Interne Logik)](System_Mechanics):** Ein Blick unter die Haube. Wie berechnet sich die Priorität von Anforderungen dynamisch aus Business Value und Risk? Wie blockt das System ungelöste Konflikte? Wie funktionieren die Exklusiv-Gruppen?
4.  **[Technical Guide & Architektur](Technical_Guide):** Für Entwickler und Administratoren. Beschreibt das Tech-Stack, das Zustand-State-Management, die Integration des Model Context Protocols (MCP) und zukünftige "AI Best Guess"-Features.
5.  **[Editors Guide](Editors_Guide):** Anleitung zur Pflege der JSON-Datenbasis. Wie fügt man neue Anforderungen, Bäume oder Szenarien hinzu, ohne das System zu zerstören?

---

*Nutzen Sie die Seitenleiste, um durch das Wiki zu navigieren.*
