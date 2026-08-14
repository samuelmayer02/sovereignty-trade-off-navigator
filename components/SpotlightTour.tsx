"use client"

import { useState, useEffect, useMemo, useCallback, CSSProperties, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Definieren der Tour-Steps pro Anwendungs-Step
const TOUR_CONFIG: Record<number, { id?: string, title: string, content: React.ReactNode, position?: 'top' | 'bottom' | 'left' | 'right', optional?: boolean }[]> = {
  1: [
    {
      title: 'Willkommen beim Navigator!',
      content: (
        <div className="space-y-2">
          <p>Dieses Tool hilft dir, komplexe Abhängigkeiten zwischen digitaler Souveränität, Resilienz und Komplexität in der Cloud zu navigieren.</p>
          <p>Lass uns zunächst einen kurzen Blick auf den Ablauf werfen, der dich oben in der Leiste erwartet!</p>
        </div>
      )
    },
    { id: 'tour-nav-step-1', title: 'Step 1: Projekt Setup', content: 'Hier definierst du den Namen deines Systems und nimmst die Workshop-Vorbereitung vor.', position: 'bottom' },
    { id: 'tour-nav-step-2', title: 'Step 2: Souveränitäts-Entscheidungsbäume', content: 'Du beantwortest Kaskaden an Entscheidungsfragen zu regulatorischen Vorgaben und Richtlinien. Dadurch werden automatisch die ersten Souveränitäts-Anforderungen und geforderten Souveränitäts-Level abgeleitet.', position: 'bottom' },
    { id: 'tour-nav-step-3', title: 'Step 3: SOV-Zusammenfassung', content: 'Transparente Übersicht, welche Architektur-Optionen durch die Bäume aktiviert wurden.', position: 'bottom' },
    { id: 'tour-nav-step-4', title: 'Step 4: Architektur-Szenarien', content: 'Hier bewertest du spezifische Architektur-Szenarien und deren Trade-offs. Deine Entscheidungen fügen weitere technische Architektur-Optionen hinzu.', position: 'bottom' },
    { id: 'tour-nav-step-5', title: 'Step 5: Szenario-Ergebnis', content: 'Das zweite Zwischenergebnis. Hier fließen die technischen Architektur-Optionen aus Bäumen und Szenarien zusammen.', position: 'bottom' },
    { id: 'tour-nav-step-6', title: 'Step 6: Architektur-Optionen-Übersicht', content: 'Hier siehst du alle abgeleiteten Architektur-Optionen! Ändere bei Bedarf manuell Architektur-Optionen ab.', position: 'bottom' },
    { id: 'tour-nav-step-7', title: 'Step 7: Matrix Trade-off Analyse', content: 'Das Herzstück! In der Konflikt-Matrix werden dir alle Trade-Offs dargestellt. Hier kannst du Konflikte lösen oder bewusst Risiken akzeptieren und eingehen.', position: 'bottom' },
    { id: 'tour-step1-input', title: 'Los gehts: System benennen', content: 'Geben Sie nun den Namen Ihres Systems ein, um zu starten.', position: 'bottom' },
    { id: 'tour-step1-goal', title: 'Ziel der Evaluation', content: 'Wähle das passende Szenario: Soll-Architektur für geplante Systeme (Transformationen, z.B. Cloud-Migration) oder Ist-Architektur für ein bestehendes System (Audit zur Identifikation von Design-Schulden).', position: 'top' },
    { id: 'tour-context-manager-btn', title: 'Der Kontext-Manager', content: 'Um den späteren Workshop effizient zu gestalten, kannst du hier als Architekt im Vorfeld den technischen Kontext für die Architekturszenarien (Phase 3) dokumentieren.', position: 'top' },
    {
      id: 'tour-context-manager-sidebar',
      title: 'Struktur: Themenblöcke',
      content: 'Das Modul ist nach Themenblöcken strukturiert (z.B. Datenresidenz, Verschlüsselung). Hier in der Seitenleiste siehst du die Liste der Blöcke und deinen Dokumentationsfortschritt.',
      position: 'right'
    },
    {
      id: 'tour-context-manager-scenario',
      title: 'Die Architekturszenarien',
      content: 'Jedes Szenario beschreibt eine kritische Situation. Sie dienen dazu, die Resilienz und Souveränität deines Systems auf die Probe zu stellen. Im folgenden Workshop bewertest du gemeinsam mit Stakeholdern (PO/PL, Security), wie die Architektur darauf reagieren soll.',
      position: 'bottom'
    },
    {
      id: 'tour-context-manager-scenario',
      title: 'Was entsteht aus den Szenarien?',
      content: 'Aus euren gemeinsamen Entscheidungen im Workshop leitet das System später automatisch konkrete technische Architektur-Optionen sowie potenzielle architektonische Zielkonflikte (Trade-offs) ab.',
      position: 'bottom'
    },
    {
      id: 'tour-context-manager-input',
      title: 'Deine Aufgabe als Architekt',
      content: (
        <div className="space-y-2">
          <p>Damit der Workshop reibungslos abläuft, lieferst du hier als Vorbereitung die Fakten (z.B. den Status Quo oder fachlichen Kontext).</p>
          <p>Lass dich nicht einschränken: Der Kontext ist zwar abhängig vom Evaluationsziel, kann aber völlig frei formuliert werden. Du darfst dich sehr knapp halten – theoretisch reichen sogar zwei prägnante Wörter!</p>
        </div>
      ),
      position: 'top'
    },
    {
      id: 'tour-context-manager-ignore',
      title: 'Szenarien überspringen',
      content: 'Falls ein Szenario für dein System absolut irrelevant ist (z.B. weil du keine personenbezogenen Daten verarbeitest), kannst du es hier einfach überspringen. Das hält den Fragebogen schlank.',
      position: 'bottom'
    },
    { id: 'tour-step1-next', title: 'Und weiter!', content: 'Wenn alles bereit ist (denk daran, den Kontext-Manager wieder zu schließen), geht es hier zum nächsten Schritt.', position: 'top' }
  ],
  2: [
    { title: 'Phase 2: Entscheidungsbäume', content: 'Hier beginnt die Befragung. Im Hintergrund werden je nach deinen Antworten automatisch Souveränitätsanforderungen abgeleitet.' },
    { id: 'tour-step2-intro-card', title: 'Die Einführung', content: 'Jeder Entscheidungsbaum startet mit einer kurzen Info-Karte. Sie fasst zusammen, welche Faktoren (wie "Rechtsrahmen" oder "Datenresidenz") jetzt abgefragt werden.', position: 'top', optional: true },
    { id: 'tour-step2-trees', title: 'Interaktive Befragung', content: 'Klicken Sie sich durch diese Knoten. Deine Antworten bestimmen die Ausprägung deiner digitalen Souveränität.', position: 'bottom' },
    { id: 'tour-step2-options', title: 'Entscheidung treffen', content: 'Hier wählst du eine der angebotenen Optionen aus. Deine Auswahl legt das Souveränitäts-Niveau fest und öffnet die Bewertungsmaske.', position: 'top', optional: true },
    { id: 'tour-eval-sliders', title: 'Bewertung & Priorisierung', content: 'Nach jeder Entscheidung musst du diese bewerten. Die "Strategische Relevanz" gibt an, wie wichtig das Kriterium für euch ist. "Umsetzungs-Risiko" beziffert Aufwand oder organisatorischen Schmerz. Das System nutzt dies später zur Priorisierung!', position: 'bottom' }
  ],
  3: [
    { title: 'Zusammenfassung (Souveränität)', content: 'Hier siehst du einen kurzen Zwischenstand der Architektur-Optionen, die aus den Entscheidungsbäumen generiert wurden.' }
  ],
  4: [
    { title: 'Phase 3: Architekturszenarien', content: 'Während Entscheidungsbäume primär harte Richtlinien abfragen, triffst du hier Entscheidungen über typische architektonische Zielkonflikte (Trade-offs) in konkreten Business- und Tech-Szenarien.' },
    { id: 'tour-step4-intro-card', title: 'Themenblöcke', content: 'Die Szenarien sind thematisch gruppiert. Jeder Block beginnt mit einer solchen Übersichtskarte. Klicke später einfach auf "Block starten".', position: 'top' },
    { id: 'tour-step4-scenario-options', title: 'Entscheidungen treffen', content: 'Hier ist das eigentliche Szenario. Lies dir die Ausgangslage durch und wähle die Option, die am besten zu eurer Strategie passt.', position: 'top' },
    { id: 'tour-eval-sliders', title: 'Szenarien bewerten', content: 'Auch hier gilt: Die Bewertung mit Strategischer Relevanz und Umsetzungs-Risiko ist essentiell, damit das Tool später die richtigen Kompromisse für dich berechnen kann. Klicke auf eine Option, um die Slider zu sehen.', position: 'top' }
  ],
  5: [
    { title: 'Zusammenfassung (Szenarien)', content: 'Das ist der zweite Zwischenstand. Jetzt fließen die Architektur-Optionen aus Bäumen und Szenarien zusammen.' }
  ],
  6: [
    { title: 'Phase 4: Der Katalog', content: 'Hier siehst du alle ermittelten Vorgaben als Katalog-Ansicht.' },
    { id: 'tour-step6-conflicts', title: 'Widersprüchliche Architektur-Optionen', content: 'Falls durch unterschiedliche Auswahlen in den Bäumen und Szenarien konkurrierende Optionen aktiv sind, werden diese Konflikte hier gelistet. Klappe die Boxen aus und wähle die finale Architektur-Option.', position: 'bottom', optional: true },
    { id: 'tour-step6-matrix', title: 'Architektur-Optionen-Grid', content: 'Alle aktiven Architektur-Optionen auf einen Blick. Du kannst manuell Architektur-Optionen zu- oder abschalten, falls etwas fehlt.', position: 'bottom' },
  ],
  7: [
    { title: 'Phase 5: Trade-off Analyse', content: 'Willkommen in der Architektur-Matrix! Hier prallen deine gewählten Architektur-Optionen aufeinander.' },
    { id: 'tour-step7-tabs', title: 'Die Ansichten', content: 'Du kannst jederzeit zwischen der Konflikt-Matrix und dem Risikoregister wechseln.', position: 'bottom' },
    { id: 'tour-step7-sidebar', title: 'Konflikt-Übersicht (Links)', content: 'Auf der linken Seite findest du die Konflikt-Navigationsleiste! Alle kritischen (Rot) und Warnungs-Konflikte (Orange) werden hier geordnet gelistet. Ein Klick führt dich direkt zum Conflict Resolver.', position: 'right', optional: true },
    { id: 'tour-step7-req-matrix-overview', title: 'Die Konflikt-Matrix', content: 'Hier prallen alle deine Architektur-Optionen aufeinander. Rote Felder bedeuten einen harten Widerspruch, orange Dimensions-Konflikte und grüne Synergien. Die horizontalen Kategorie-Header gliedern die Matrix übersichtlich.', position: 'top', optional: true },
    { id: 'tour-step7-matrix-cell', title: 'Detail-Auswertung', content: 'Jedes Feld in der Matrix repräsentiert eine Auswirkung. Klicke auf ein Feld, um Details zu öffnen.', position: 'right', optional: true },
    { id: 'tour-step7-conflict-resolver', title: 'Der Conflict Resolver', content: 'Hier öffnet sich die Detailansicht! Du siehst Erklärungen der KI zu den Auswirkungen. Bei roten Feldern (Konflikten) MUSST du dich entscheiden, welche Option wichtiger ist.', position: 'top' },
    { id: 'tour-step7-smart-recommendation', title: 'Priorisierung & Empfehlung', content: 'Das System vergleicht die Prioritäten beider Architektur-Optionen. Diese berechnen sich direkt aus deiner Bewertung von Strategischer Relevanz und Umsetzungs-Risiko! Bei klaren Differenzen erhältst du eine smarte Entscheidungsempfehlung.', position: 'top' },
    { id: 'tour-step7-alternatives', title: 'Option A & B: Alternativen wählen', content: 'Wenn ein harter Konflikt vorliegt, kannst du entweder Architektur-Option A oder B abändern. Das System bietet dir Alternativen aus derselben Dimension an.', position: 'left' },
    { id: 'tour-step7-risk-accept', title: 'Option C: Risk Acceptance', content: 'Alternativ kannst du einen Konflikt als "Akzeptiertes Risiko" deklarieren. Trage eine schriftliche Begründung ein, um das Risiko im Risikoregister zu dokumentieren.', position: 'left' },
    { id: 'tour-step7-ground-truth-toggle', title: 'AI Best Guess vs. Ground Truth', content: 'Standardmäßig zeigt das System Einschätzungen der KI ("AI Best Guess"). Wenn du oder dein Team entscheidet, dass diese Einschätzung formalisiert werden soll, kannst du in den "Ground Truth" Modus wechseln!', position: 'bottom' },
    { id: 'tour-step7-ground-truth-editor', title: 'Ground Truth bearbeiten', content: 'Im Ground Truth Modus kannst du die Analyse überschreiben und eigene Best Practices hinterlegen. Diese Daten wandern direkt in das Master-Modell!', position: 'left' },
    { id: 'tour-step7-ground-truth-filter', title: 'Ground Truth Filter', content: 'Mit diesem Filter oben in der Leiste kannst du die Matrix so einschränken, dass nur noch manuell verifizierte Konflikte ("Ground Truth") angezeigt werden.', position: 'bottom' },
    { id: 'tour-step7-risk-register-tab', title: 'Das Risiko-Register', content: 'Alle manuell akzeptierten Risiken werden hier revisionssicher mit Begründung, Herleitung und Widerrufs-Option gesammelt. Perfekt für Audit und Management.', position: 'bottom' },
    { id: 'tour-step7-export', title: 'Report Exportieren', content: 'Fertig! Exportiere das finale Ergebnis inklusive Matrix und Risikoregister als PDF für deine Stakeholder und Entwickler-Teams.', position: 'top' }
  ]
}

export default function SpotlightTour() {
  const { step, isTourActive, currentTourStep, stopTour, setTourStep } = useStore()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [tooltipHeight, setTooltipHeight] = useState(280)

  // Reset tooltip height when step changes to avoid layout jumps (done during render to follow React guidelines)
  const [prevTourStep, setPrevTourStep] = useState(currentTourStep)
  const [prevStep, setPrevStep] = useState(step)
  if (prevTourStep !== currentTourStep || prevStep !== step) {
    setPrevTourStep(currentTourStep)
    setPrevStep(step)
    setTooltipHeight(280) // Safe large height to prevent overlap on first frame
  }

  const tooltipRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement
          const height = target.offsetHeight
          if (height > 0) {
            // Add padding (20px top + 20px bottom) and border (1px top + 1px bottom)
            setTooltipHeight(height + 42)
          }
        }
      })
      observer.observe(node)
      observerRef.current = observer
    }
  }, [])

  const tourSteps = TOUR_CONFIG[step] || []
  const currentConfig = tourSteps[currentTourStep]

  // Filter steps to only include those that are actually present (not missing optional ones)
  const visibleSteps = useMemo(() => {
    return tourSteps
      .map((config, index) => {
        const isPresent = typeof document === 'undefined'
          ? !config.optional
          : !(config.id && config.optional && !document.querySelector(`[data-tour="${config.id}"]`));
        return { config, index, isPresent };
      })
      .filter(item => item.isPresent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourSteps, step, currentTourStep, targetRect]);

  const handleBack = () => {
    let prevIndex = currentTourStep - 1;
    while (prevIndex >= 0) {
      const config = tourSteps[prevIndex];
      if (!config.id) break;
      const el = document.querySelector(`[data-tour="${config.id}"]`);
      if (el) break;
      if (config.optional) {
        prevIndex--;
      } else {
        break;
      }
    }
    if (prevIndex >= 0) {
      setTourStep(prevIndex);
    }
  };

  // Update target rect on resize/scroll or step change
  useEffect(() => {
    if (!isTourActive || !currentConfig) {
      const timer = setTimeout(() => {
        setTargetRect(null)
      }, 0)
      return () => clearTimeout(timer)
    }

    const updateRect = (shouldScroll = false) => {
      if (!currentConfig.id) {
        setTargetRect(null)
        return true
      }
      const el = document.querySelector(`[data-tour="${currentConfig.id}"]`)
      if (el) {
        if (shouldScroll) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' })
        }
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
        return true
      } else {
        setTargetRect(null)
        return false
      }
    }

    // Scroll first and set initial rect
    updateRect(true)

    // Setup layout polling to keep coordinates in sync during animations/modal transitions
    const pollInterval = setInterval(() => {
      updateRect(false)
    }, 150)

    const handleResizeOrScroll = () => updateRect(false)

    window.addEventListener('resize', handleResizeOrScroll)
    window.addEventListener('scroll', handleResizeOrScroll, true)

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      window.removeEventListener('resize', handleResizeOrScroll)
      window.removeEventListener('scroll', handleResizeOrScroll, true)
    }
  }, [isTourActive, currentConfig])

  if (!isTourActive || tourSteps.length === 0) return null

  const isLastStep = currentTourStep === tourSteps.length - 1
  const padding = 8 // padding around the target element

  const renderTooltip = () => {
    if (!currentConfig) return null;

    let tooltipStyle: CSSProperties = {}

    if (targetRect) {
      let top = 0;
      let left = 0;
      const tooltipWidth = 320;
      const safeTooltipHeight = tooltipHeight || 220;
      const margin = 16; // Minimum margin from viewport edges

      // 1. Determine candidate positions based on screen width
      const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;

      let preferredPosition = currentConfig.position || 'bottom';
      if (isSmallScreen && (preferredPosition === 'left' || preferredPosition === 'right')) {
        preferredPosition = 'bottom';
      }

      // 2. Order of preference to search for a fitting position
      const candidates: ('top' | 'bottom' | 'left' | 'right')[] = [];
      if (preferredPosition === 'top') {
        candidates.push('top', 'bottom');
        if (!isSmallScreen) candidates.push('right', 'left');
      } else if (preferredPosition === 'bottom') {
        candidates.push('bottom', 'top');
        if (!isSmallScreen) candidates.push('right', 'left');
      } else if (preferredPosition === 'left') {
        candidates.push('left', 'right', 'bottom', 'top');
      } else { // right
        candidates.push('right', 'left', 'bottom', 'top');
      }

      // 3. Find the first candidate that fits perfectly within the viewport bounds
      let chosenPosition = candidates[0];
      let foundPerfectFit = false;

      for (const pos of candidates) {
        let fits = false;
        if (pos === 'top') {
          fits = (targetRect.top - padding - margin - safeTooltipHeight) >= margin;
        } else if (pos === 'bottom') {
          fits = (targetRect.bottom + padding + margin + safeTooltipHeight) <= window.innerHeight - margin;
        } else if (pos === 'left') {
          fits = (targetRect.left - padding - margin - tooltipWidth) >= margin;
        } else if (pos === 'right') {
          fits = (targetRect.right + padding + margin + tooltipWidth) <= window.innerWidth - margin;
        }

        if (fits) {
          chosenPosition = pos;
          foundPerfectFit = true;
          break;
        }
      }

      // 4. If no perfect fit is found, fallback to the position with the most available space
      if (!foundPerfectFit) {
        let maxSpace = -1;
        for (const pos of candidates) {
          let space = 0;
          if (pos === 'top') {
            space = targetRect.top;
          } else if (pos === 'bottom') {
            space = window.innerHeight - targetRect.bottom;
          } else if (pos === 'left') {
            space = targetRect.left;
          } else if (pos === 'right') {
            space = window.innerWidth - targetRect.right;
          }

          if (space > maxSpace) {
            maxSpace = space;
            chosenPosition = pos;
          }
        }
      }

      // 5. Calculate coordinates for the chosen position
      if (chosenPosition === 'right') {
        left = targetRect.right + padding + 12;
        top = targetRect.top + targetRect.height / 2 - safeTooltipHeight / 2;
      } else if (chosenPosition === 'left') {
        left = targetRect.left - padding - 12 - tooltipWidth;
        top = targetRect.top + targetRect.height / 2 - safeTooltipHeight / 2;
      } else if (chosenPosition === 'top') {
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        top = targetRect.top - padding - 12 - safeTooltipHeight;
      } else { // bottom
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        top = targetRect.bottom + padding + 12;
      }

      // 6. Clamp coordinates to keep the tooltip fully within the viewport
      top = Math.max(margin, Math.min(top, window.innerHeight - safeTooltipHeight - margin));
      left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

      // 7. Force strict NO OVERLAP with the target element (keep a strict 12px gap from the highlight glow area)
      if (chosenPosition === 'top') {
        top = Math.min(top, targetRect.top - padding - 12 - safeTooltipHeight);
      } else if (chosenPosition === 'bottom') {
        top = Math.max(top, targetRect.bottom + padding + 12);
      } else if (chosenPosition === 'left') {
        left = Math.min(left, targetRect.left - padding - 12 - tooltipWidth);
      } else if (chosenPosition === 'right') {
        left = Math.max(left, targetRect.right + padding + 12);
      }

      tooltipStyle = { top, left };
    } else {
      // Center fallback when there is no target element
      tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    return (
      <motion.div
        layoutId="tour-tooltip"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={tooltipStyle}
        className="fixed z-[200000] w-[320px] glass border border-primary/30 p-5 rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
      >
        <div ref={tooltipRef} className="flex flex-col w-full">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {currentConfig.title}
            </h4>
            <button onClick={stopTour} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {currentConfig.content}
          </div>

          <div className="flex justify-between items-center mt-auto gap-2">
            <div className="flex flex-wrap gap-1 items-center max-w-[130px]">
              {visibleSteps.map((item) => {
                const isActive = item.index === currentTourStep;
                return (
                  <button
                    key={item.index}
                    onClick={() => setTourStep(item.index)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-200 hover:scale-125 cursor-pointer",
                      isActive ? "bg-primary w-3" : "bg-muted hover:bg-muted-foreground/50"
                    )}
                    title={item.config.title}
                  />
                );
              })}
            </div>

            <div className="flex gap-1.5 items-center">
              {visibleSteps.findIndex(item => item.index === currentTourStep) > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 bg-transparent hover:bg-muted/10 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full text-xs font-semibold transition-all border border-muted/50 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Zurück
                </button>
              )}

              <button
                onClick={() => {
                  if (isLastStep) {
                    stopTour()
                    return
                  }
                  let nextIndex = currentTourStep + 1;
                  while (nextIndex < tourSteps.length) {
                    const config = tourSteps[nextIndex];
                    if (!config.id) break;
                    const el = document.querySelector(`[data-tour="${config.id}"]`);
                    if (el) break;
                    if (config.optional) {
                      nextIndex++;
                    } else {
                      break;
                    }
                  }
                  if (nextIndex < tourSteps.length) {
                    setTourStep(nextIndex)
                  } else {
                    stopTour()
                  }
                }}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-md shadow-primary/20"
              >
                {isLastStep ? 'Fertig' : 'Weiter'}
                {isLastStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {targetRect && (
          <motion.div
            layoutId="tour-highlight-glow"
            className="fixed border-2 border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.3)] rounded-lg pointer-events-none z-[199999]"
            initial={false}
            animate={{
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </AnimatePresence>

      {/* 4 Overlay divs to cover everything EXCEPT the target area. 
          They have pointer-events: auto to block clicks outside the target. */}
      <motion.div
        className="fixed z-[99998] bg-background/30 backdrop-blur-[2px] pointer-events-auto"
        animate={{ top: 0, left: 0, right: 0, height: targetRect ? targetRect.top - padding : '50vh' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      <motion.div
        className="fixed z-[99998] bg-background/30 backdrop-blur-[2px] pointer-events-auto"
        animate={{ top: targetRect ? targetRect.bottom + padding : '50vh', left: 0, right: 0, bottom: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      <motion.div
        className="fixed z-[99998] bg-background/30 backdrop-blur-[2px] pointer-events-auto"
        animate={{ top: targetRect ? targetRect.top - padding : '50vh', bottom: targetRect ? window.innerHeight - (targetRect.bottom + padding) : '50vh', left: 0, width: targetRect ? targetRect.left - padding : '50vw' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      <motion.div
        className="fixed z-[99998] bg-background/30 backdrop-blur-[2px] pointer-events-auto"
        animate={{ top: targetRect ? targetRect.top - padding : '50vh', bottom: targetRect ? window.innerHeight - (targetRect.bottom + padding) : '50vh', left: targetRect ? targetRect.right + padding : '50vw', right: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />

      <AnimatePresence>
        {renderTooltip()}
      </AnimatePresence>
    </>
  )
}
