# Willkommen beim Sovereignty Trade-off Navigator Wiki

Der **Sovereignty Trade-off Navigator** ist ein softwaregestütztes Werkzeug, das den systemischen Zielkonflikt zwischen digitaler Souveränität (Vermeidung von Vendor-Lock-in) und IT-Betriebsaspekten wie Ausfallsicherheit und operativer Komplexität adressiert. Er übersetzt abstrakte strategische Autonomieanforderungen in konkrete architektonische Design-Optionen und visualisiert die daraus resultierenden Konsequenzen für Systemstabilität und Betriebsaufwand. Dadurch werden implizite Annahmen und „Return on Lock-in“-Abwägungen bei der Konzeption verteilter Cloud-Infrastrukturen systematisch bewertbar und nachvollziehbar. Das Artefakt fungiert als kommunikative Brücke, die strategische Entscheidungen des Produktmanagements mit der technischen Umsetzung in der IT-Architektur in Einklang bringt.

## Problemstellung, Zielgruppe und Ergebnis

### Problemstellung
Regulatorik und Unternehmensstrategie fordern Unabhängigkeit von einzelnen Anbietern und Jurisdiktionen (etwa im Kontext von NIS-2 oder BSI C5), während Verfügbarkeits- und Betriebsziele für den Bezug integrierter, anbieterspezifischer Dienste sprechen. Verteilte Systeme unterliegen dabei physikalischen und theoretischen Grenzen (CAP/PACELC), sodass sich beide Zielrichtungen nicht gleichzeitig maximieren lassen. Häufig bleibt diese Abwägung implizit und wird erst im Betrieb sichtbar. Der Navigator führt sie in eine explizite, dokumentierte Form über.

### Zielgruppe und Einsatzszenarien
Das Werkzeug adressiert zwei Anwendungsebenen:

1.  **Strategische Ebene (Produktmanagement, Leitungsebene, Enterprise-Architektur):** Erarbeitung oder Validierung einer unternehmensweiten Cloud-Strategie. Der Navigator dient als Kommunikationsinstrument, das die Konsequenzen strategischer Autonomieziele für Ausfallsicherheit und Betriebsaufwand nachvollziehbar darstellt und ein gemeinsames Verständnis zwischen Fach- und Technikseite herstellt.
2.  **Systemebene (IT- und Lösungsarchitektur):** Architekturentwurf und Planung vor der Migration geschäftskritischer Anwendungen, mit dem Ziel eines technisch vertretbaren und begründeten Kompromisses.

### Ergebnis
Ergebnis einer Sitzung ist ein exportierbares Architekturentscheidungsdokument (Architecture Decision Record, ADR). Es dokumentiert die getroffenen Kompromisse, die identifizierten Konflikte sowie die explizit akzeptierten Risiken und dient als Argumentationsgrundlage und Nachweis gegenüber Leitungsebene, Sicherheitsverantwortlichen und Auditoren.

## Inhaltsverzeichnis

Zum vollständigen Verständnis empfiehlt sich die folgende Lesereihenfolge:

1.  **[Methodik und theoretischer Hintergrund](Methodology.md):** Theoretische Fundierung des Werkzeugs. Erläutert die zugrundeliegenden Architekturkonflikte (CAP, PACELC, Shared Responsibility), die Begründung für Entscheidungsbäume und Szenarien sowie die Operationalisierung des Cloud Sovereignty Framework.
2.  **[User Guide](User_Guide.md):** Schrittweise Anleitung durch die Oberfläche: Entscheidungsfindung, Konfliktauflösung, Interpretation von Risikoregister und Trade-off-Matrix.
3.  **[System-Mechaniken](System_Mechanics.md):** Interne Logik. Berechnung der Anforderungspriorität aus Business Value und Technical Risk, Blockierlogik bei ungelösten Konflikten sowie Funktionsweise der Exklusiv-Gruppen.
4.  **[Technical Guide](Technical_Guide.md):** Für Entwicklung und Administration. Technologiestack, State-Management, Anbindung des Model Context Protocol (MCP) und Teststrategie.
5.  **[Editors Guide](Editors_Guide.md):** Pflege der Datenbasis. Anlage neuer Anforderungen, Entscheidungsbäume und Szenarien unter Wahrung der Datenkonsistenz.
6.  **[Dual-Mode Architecture](dual-mode-architecture.md):** Betrieb als Fullstack-Anwendung mit SQLite sowie als rein statische GitHub-Pages-Demonstration.

Installation, Betrieb und Erweiterung der Konfliktmatrix sind im [README des Repositories](https://github.com/samuelmayer02/sovereignty-trade-off-navigator#readme) beschrieben.

---

*Die Navigation erfolgt über die Seitenleiste.*
