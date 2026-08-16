# User Guide: Arbeiten mit dem Sovereignty Trade-off Navigator

Dieses Handbuch führt Sie Schritt für Schritt durch die Benutzung des Sovereignty Trade-off Navigators. Das Ziel des Tools ist es, aus Ihren fachlichen Eingaben einen bewerteten Katalog an Architektur-Anforderungen zu generieren, auf Konflikte hinzuweisen und diese zu managen.

## Der Prozess-Flow (Step 1 bis 7)

Der Navigator ist in sieben aufeinanderfolgende Phasen ("Steps") gegliedert. Ein globales Regelwerk stellt sicher, dass Sie kritische Schritte (wie Konfliktauflösung) nicht überspringen können.

### Step 1: Projekt Setup
Sie definieren den Namen Ihres Systems und wählen das Evaluationsziel (Soll-Architektur vs. Ist-Architektur/Audit). Wichtig ist zudem der **Status Quo & Kontext-Manager**:
*   **Plattform-Status Quo & Kontext-Manager:** Bevor Sie das Tool in einem Stakeholder-Interview nutzen, können Sie hier für die verschiedenen Szenarien den aktuellen Ist-Zustand (Status Quo) Ihrer Plattform dokumentieren (z. B. bestehende Datenbank-Setups, Redundanzen oder Randbedingungen). Das verknüpft die generischen Fragestellungen im späteren Interview direkt mit Ihrer realen IT-Landschaft und dient als optimale Bewertungsgrundlage.
*   **System-Scope:** Sie können unterscheiden, ob Sie ein umfassendes *Gesamtsystem* (Makro-Architektur) oder eine *spezifische Komponente* (Microservice) bewerten, um den Scope der Anforderungen passend zu halten.

### Step 2: Souveränitäts-Bäume (Die SEAL-Level)
Hier beantworten Sie Kaskaden an Entscheidungsfragen. Ein Baum fragt in der Regel hartes regulatorisches Umfeld oder Unternehmensrichtlinien ab (z.B. "Verarbeiten Sie KRITIS-Daten?").
*   Jede Antwort kann Sie entweder tiefer in den Baum leiten oder zu einem Ergebnis-Node führen.
*   **Wichtig:** Ein Ergebnis-Node aktiviert im Hintergrund automatisch "Requirements" (Anforderungen). 
*   Sie müssen die Slider für **Business Value (BV)** und **Technical Risk (TR)** verwenden, um dem System mitzuteilen, wie wichtig und riskant die Beantwortung dieses Baums für Ihr Produkt ist. Die Slider starten auf `0` und müssen zwingend bedient werden, bevor Sie speichern können.

### Step 3: Zusammenfassung der Souveränitäts-Anforderungen
Hier sehen Sie transparent, **welche** Anforderungen durch die Bäume aktiviert wurden.
*   **Konflikt-Interceptor (Orange Boxen):** Falls Ihre Antworten im Baum *widersprüchliche* Anforderungen aus einer Exklusiv-Gruppe (z.B. Sie fordern gleichzeitig Multi-Tenant und Single-Tenant) aktiviert haben, poppt eine Warnung auf. 
*   **Globaler Blocker:** Solange diese Konflikte nicht aufgelöst sind (indem Sie auf "Diese Option behalten" klicken), können Sie nicht zu Step 4 fortfahren.

### Step 4: Architektur-Szenarien
In dieser Phase werden Ihnen typische Architektur-Trade-offs (z.B. IaaS vs. PaaS vs. SaaS) präsentiert. 
*   Sie wählen die Option, die am ehesten auf Ihre Architektur zutrifft.
*   Auch hier müssen Sie Business Value und Technical Risk für Ihre Wahl zwingend über die Slider bewerten und können eine schriftliche Begründung (Rationale) eingeben. Diese Begründungen sind für die spätere Auditierbarkeit wesentlich.

### Step 5: Zusammenfassung der Szenario-Anforderungen
Äquivalent zu Step 3. Hier sehen Sie, welche konkreten technischen Anforderungen durch Ihre Szenario-Entscheidungen getriggert wurden. Und auch hier greift der Konflikt-Interceptor, wenn Sie sich widersprechende Optionen gewählt haben.

### Step 6: Requirement-Katalog & Manuelle Anpassung
Sie sehen eine lange Liste aller verfügbaren Anforderungen im System.
*   Die durch Step 2 und 4 aktivierten Anforderungen sind bereits mit Häkchen markiert und **gesperrt**. Sie können hier nicht einfach deaktiviert werden (Traceability!).
*   **Konfliktauflösungsmechanismus & Begründung:** Falls widersprüchliche Anforderungen aus Exklusiv-Gruppen vorliegen, erscheint oben der Konfliktlösungsbereich (`ConflictCard`). Pro Option können Sie über Slider die **Strategische Relevanz (SR)** und das **Umsetzungsrisiko (UR)** bewerten sowie ein **optionales Kommentarfeld** zur schriftlichen Begründung der Konfliktauflösung ausfüllen. Mit Klick auf "Diese Anforderung wählen" wird die Entscheidung inklusive Begründung und Scorings gespeichert und die verworfenen Alternativen deaktiviert.
*   Sie haben hier zusätzlich die Möglichkeit, *zusätzliche*, manuell gewählte Anforderungen zu aktivieren, falls der Fragebogen Ihren Spezialfall nicht abgedeckt hat.

### Step 7: Trade-off Analyse
Dieser Schritt bildet den Kern der Auswertung. Zwei Ansichten stehen zur Verfügung, umschaltbar über die Tabs am oberen Rand:

#### 1. Die Matrix-Ansicht (Sovereignty Trade-off Matrix)
Dieser Bereich stellt die Konflikte zwischen den aktivierten Anforderungen als interaktive Matrix dar.

*   **Req-vs-Req Matrix (Anforderung-zu-Anforderung Matrix):**
    *   **Ziel:** Visualisierung direkter Interaktionen und Widersprüche zwischen den aktivierten Anforderungen. Jede Anforderung wird mit jeder anderen in einer symmetrischen Matrix abgeglichen.
    *   **Zell-Status & Farben:**
        *   **Rot (`red`, Harter Konflikt):** Ein direkter, logischer oder technischer Widerspruch.
        *   **Orange (`orange`, Trade-off / Abhängigkeit):** Es besteht ein moderater Trade-off. Die Umsetzung einer Anforderung erschwert oder schränkt die Lösungswege der anderen ein.
        *   **Grün (`green`, Synergie/Kompatibel):** Die Anforderungen ergänzen sich.
        *   **Blau (`blue`, Neutral):** Kein architektonischer Widerspruch, die Anforderungen betreffen orthogonale Aspekte.
        *   **Grau:** Für dieses Paar liegt keine Bewertung in der Wissensdatenbank vor.
    *   **Symmetrische Redundanz-Reduzierung:** Da die Matrix symmetrisch ist (Konflikte sind auf X- und Y-Achse gespiegelt), werden alle Konfliktfelder unterhalb der Hauptdiagonale stark transparent dargestellt. Das fokussiert das Auge auf das obere Dreieck, während alle Felder bei Hover oder Klick interaktiv bleiben.
    *   **Dynamische Zentrierung & Skalierung:** Die Matrix ist zentriert ausgerichtet. Sie wächst bei zunehmend vielen Anforderungen dynamisch in die Breite und blendet bei Überschreiten der Bildschirmbreite automatisch einen horizontalen Slider (Scrollbalken) ein.
    *   **Linkes Konflikt-Menü (Konflikt-Navigation):**
        *   Am linken Rand der Matrix befindet sich ein einklappbares Menü, das alle ungelösten und akzeptierten Konflikte (**Rot** = Kritisch, **Orange** = Warnung) in einer sortierten Übersicht auflistet.
        *   **Filter & Suche:** Sie können nach Anforderungen suchen oder gezielt nach "Kritisch (Rot)", "Warnungen (Orange)" oder "Alle" filtern.
        *   **Direktsprung zum Conflict Resolver:** Ein Klick auf ein Konflikt-Kärtchen öffnet sofort das Conflict-Resolver-Panel für dieses Paar, wo Prioritäten angepasst, Alternativen gewählt oder Risiken akzeptiert werden können.
    *   **Interaktive Aktionen & Conflict Resolver:**
        *   **Konflikt-Details einsehen:** Klicken Sie auf ein orangefarbenes oder rotes Feld. Rechts (oder im Detail-Bereich) öffnet sich eine strukturierte Analyse mit einer Beschreibung des Konflikts, konkreten Reibungspunkten und einer **Best-Practice-Empfehlung** zur Entschärfung.
        *   **Prioritäten-Waage:** Über eine interaktive Waage lassen sich die Prioritäten der beiden gegenläufigen Anforderungen gegeneinander abwägen und anpassen.
        *   **Bewertung & Begründung (Herleitung unterhalb der Waage):** Direkt unterhalb der Waage werden die in den Entscheidungsbäumen (Step 2) und Szenarien (Step 4) vergebenen Scores für *Strategische Relevanz* (0–10) und *Umsetzungs-Risiko* (0–10) sowie die eingegebenen Freitext-Begründungen für beide Konfliktpartner übersichtlich angezeigt. Dadurch lässt sich sofort nachvollziehen, mit welchen Motiven und Risikoüberlegungen es zu dieser Konstellation kam.
        *   **Risiko-Akzeptanz (Accepted Risk Override):** Wenn Sie einen Trade-off oder harten Konflikt für Ihr System bewusst in Kauf nehmen (z.B. weil alternative Architekturen zu teuer sind), können Sie über ein Eingabefeld eine schriftliche **Begründung (Rationale)** hinterlegen und speichern. Der Konflikt wird dadurch als "Akzeptiertes Risiko" registriert. In der Matrix wird die Zelle daraufhin ausgegraut und mit einem Haken versehen, was das Gesamtbild visuell beruhigt.
        *   **Verifikation & Bearbeitung:** Direkt über das UI können Sie (falls autorisiert) Konflikttexte und Best-Practice-Empfehlungen anpassen und verifizieren.

#### 2. Risiko-Register Dashboard (Akzeptierte Risiken)
Ein dediziertes Audit- und Dokumentations-Dashboard für das Management und Sicherheitsarchitekten, das ausschließlich alle im Konflikt-Resolver explizit akzeptierten Risiken und Trade-Off-Entscheidungen aggregiert.
*   **KPI-Zusammenfassung:** Schneller Überblick über die Gesamtanzahl akzeptierter Risiken, Aufteilung nach kritischen Konflikten (Rot) vs. Warnungen (Orange) sowie den Zeitstempel der letzten Risikoakzeptanz.
*   **Filter- & Suchleiste:** Gezieltes Durchsuchen nach Anforderungs-IDs (`REQ-XX`, `SOV-XX`), Anforderungsgruppen, Anforderungsnamen, Beschreibungen oder Begründungen.
*   **Detaillierte Anforderungs- & Gruppen-Darstellung:** Nebeneinander-Darstellung der beiden Konfliktpartner inklusive Präfix-ID, Kategorie-Tag, Anforderungsgruppen-Badge (z.B. *Architektur-Paradigma: Entweder/Oder*), Volltext-Name und Beschreibung.
*   **Dokumentierte Begründungen:** Jedes akzeptierte Risiko stellt die schriftlich hinterlegte Akzeptanzbegründung (*Rationale*) in einer hervorgehobenen Box prominent dar.
*   **Audit- & Herleitung-Details:** Aufklappbare Detailansicht mit der vollständigen Konfliktanalyse, Best-Practice-Empfehlungen und dem Provenance-Trace (SEAL-Stufen, Baum- und Szenarioentscheidungen) beider Anforderungen.
*   **Widerrufs-Funktion:** Akzeptierte Risiken können direkt aus dem Risikoregister heraus widerrufen werden, wodurch der Konflikt in der Matrix wieder als aktiv markiert wird.

---

## Editor & Anpassung der Inhalte

Das Tool ist datengetrieben. Die JSON-Dateien im Ordner `/data` (`trees.json`, `scenarios.json`, `requirements.json`) können über den internen Editor (oder per Code) angepasst werden.

*   Neue Requirements müssen mit einer eindeutigen ID und einer Kategorie versehen werden.
*   Sollen sich Anforderungen ausschließen, weisen Sie ihnen in `requirements.json` die gleiche `groupId` zu und definieren die Gruppe als `type: "exclusive"`. Der Konflikt-Interceptor wird ab dann automatisch wachen!
*   Achten Sie darauf, dass referenzierte Requirements in Bäumen und Szenarien auch tatsächlich in der Anforderungsdatenbank existieren.
