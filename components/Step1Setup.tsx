import { useStore } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, MessageSquare, X, Save, CheckCircle2, Circle, List, ChevronRight, AlertCircle, Ban, Plus } from 'lucide-react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export default function Step1Setup() {
  const {
    setStep,
    componentName,
    setComponentName,
    evaluationGoal,
    setEvaluationGoal,
    scenarios,
    scenarioContexts,
    setScenarioContext,
    ignoredScenarios,
    toggleScenarioIgnored,
    sessionId,
    setSessionId,
    isTourActive,
    currentTourStep
  } = useStore()
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false)
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resetScroll = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
    resetScroll()
    const timer = setTimeout(resetScroll, 100)
    return () => clearTimeout(timer)
  }, [activeChapterIndex, isContextManagerOpen])

  const chapters = useMemo(() => {
    const list: { name: string, scenarios: any[] }[] = [];
    if (!scenarios || scenarios.length === 0) return list;

    const grouped: Record<string, any[]> = {};
    const categoryOrder: string[] = [];

    scenarios.forEach(s => {
      const cat = s.category || 'Unkategorisiert';
      if (!grouped[cat]) {
        grouped[cat] = [];
        categoryOrder.push(cat);
      }
      grouped[cat].push(s);
    });

    categoryOrder.forEach(cat => {
      list.push({
        name: cat,
        scenarios: grouped[cat]
      });
    });

    return list;
  }, [scenarios])

  // Synchronize context manager modal with onboarding tour steps
  useEffect(() => {
    if (isTourActive) {
      if (currentTourStep >= 11 && currentTourStep <= 15) {
        setIsContextManagerOpen(true)
      } else {
        setIsContextManagerOpen(false)
      }
    }
  }, [isTourActive, currentTourStep])

  const handleNext = () => {
    if (!componentName.trim() || !evaluationGoal) return;
    if (!sessionId) {
      // Create a short unique id for the file
      setSessionId(Math.random().toString(36).substring(2, 9));
    }
    setStep(2);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-2xl mx-auto p-8 rounded-2xl lift-effect"
      >
        <h2 className="text-2xl font-bold mb-6 text-foreground">Kontext-Setup</h2>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Name des Systems
            </label>
            <input
              data-tour="tour-step1-input"
              type="text"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNext()
              }}
              placeholder='z.B. "Stammdaten-DB" oder "Redispatch-Service"'
              className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Ziel der Evaluation
            </label>
            <div data-tour="tour-step1-goal" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setEvaluationGoal('soll')}
                className={cn(
                  "flex flex-col items-start p-4 border rounded-xl transition-all text-left",
                  evaluationGoal === 'soll'
                    ? "border-primary bg-primary/10"
                    : "border-card-border bg-background hover:border-primary/50"
                )}
              >
                <span className={cn("font-bold text-sm mb-1", evaluationGoal === 'soll' ? "text-primary" : "text-foreground")}>
                  Soll-Architektur (Transformation)
                </span>
                <span className="text-xs text-muted">
                  Gestaltung und Abwägung zukünftiger Architektur-Entscheidungen (z.B. Cloud-Migration).
                </span>
              </button>
              <button
                onClick={() => setEvaluationGoal('ist')}
                className={cn(
                  "flex flex-col items-start p-4 border rounded-xl transition-all text-left",
                  evaluationGoal === 'ist'
                    ? "border-primary bg-primary/10"
                    : "border-card-border bg-background hover:border-primary/50"
                )}
              >
                <span className={cn("font-bold text-sm mb-1", evaluationGoal === 'ist' ? "text-primary" : "text-foreground")}>
                  Ist-Architektur (Audit)
                </span>
                <span className="text-xs text-muted">
                  Retrospektive Analyse eines bestehenden Systems zur Identifikation von Design-Schulden.
                </span>
              </button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3.5 shadow-sm">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted flex-1">
              <span className="font-semibold text-foreground block mb-1">Tipp: Status Quo & Szenarien vorbereiten</span>
              Dokumentieren Sie hier vorab den <strong>Status Quo (Ist-Zustand)</strong> oder den <strong>Fachkontext</strong> Ihrer Plattform für die einzelnen Szenarien. Dies bildet die perfekte Grundlage für das Stakeholder-Interview, da die generischen Fragestellungen direkt mit Ihrem realen System-Setup verknüpft werden.
              <button
                data-tour="tour-context-manager-btn"
                onClick={() => setIsContextManagerOpen(true)}
                className="mt-3 flex items-center gap-2 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Plattform-Status Quo & Kontext-Manager öffnen
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              data-tour="tour-step1-next"
              onClick={handleNext}
              disabled={!componentName.trim() || !evaluationGoal}
              className="bg-primary hover:bg-primary/80 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
            >
              Weiter zur Auswahl
            </button>
          </div>
        </div>
      </motion.div>

      {/* Context Manager Modal (Pro Max) */}
      <AnimatePresence>
        {isContextManagerOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-card-border shadow-2xl rounded-3xl w-[95vw] h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-card-border bg-card shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">System-Kontext</h3>
                    <p className="text-sm text-muted">Dokumentieren Sie das aktuelle Setup (Ist-Zustand) und Rahmenbedingungen der Plattform für das Interview.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsContextManagerOpen(false)}
                    className="text-muted hover:text-foreground p-2 bg-muted/10 hover:bg-muted/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 overflow-hidden bg-background">
                {/* Sidebar */}
                <div data-tour="tour-context-manager-sidebar" className="w-1/4 border-r border-card-border bg-card/50 flex flex-col">
                  <div className="p-4 border-b border-card-border/50">
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Themenblöcke
                    </h4>
                    <div className="w-full bg-background rounded-full h-2 mb-1.5 overflow-hidden border border-card-border">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${(Object.values(scenarioContexts).filter(v => v.trim() !== '').length / scenarios.length) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted font-medium flex justify-between">
                      <span>Fortschritt</span>
                      <span>{Object.values(scenarioContexts).filter(v => v.trim() !== '').length} / {scenarios.length} dokumentiert</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {chapters.map((chapter, idx) => {
                      const completedCount = chapter.scenarios.filter(s => scenarioContexts[s.scenario_id]?.trim() || ignoredScenarios[s.scenario_id]).length;
                      const isComplete = completedCount === chapter.scenarios.length;
                      const isActive = activeChapterIndex === idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveChapterIndex(idx)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left",
                            isActive
                              ? "bg-primary/10 border-primary/30 shadow-sm"
                              : "bg-transparent border-transparent hover:bg-card-border hover:border-card-border/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {isComplete ? (
                              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                            ) : (
                              <Circle className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-muted")} />
                            )}
                            <div>
                              <span className={cn(
                                "text-sm font-bold block",
                                isActive ? "text-primary" : "text-foreground"
                              )}>
                                {idx + 1}. {chapter.name}
                              </span>
                              <span className="text-xs text-muted">
                                {completedCount} / {chapter.scenarios.length} ausgefüllt
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={cn(
                            "w-4 h-4 transition-transform",
                            isActive ? "text-primary translate-x-1" : "text-muted/50"
                          )} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Content Area */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {chapters[activeChapterIndex] && (
                    <div className="w-full max-w-5xl mx-auto space-y-8">
                      <div className="mb-8">
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-md mb-3">
                          Block {activeChapterIndex + 1}
                        </span>
                        <h2 className="text-2xl font-bold text-foreground">
                          {chapters[activeChapterIndex].name}
                        </h2>
                        <p className="text-sm text-muted mt-2">
                          Geben Sie hier hilfreichen Kontext, der die Entscheidungsfindung der Stakeholder im Interview unterstützt. Das kann (abhängig vom Evaluationsziel) z.B. der <strong>Status Quo</strong> sein. Halten Sie sich gerne kurz – auch zwei prägnante Wörter können als Kontext bereits reichen!
                        </p>
                      </div>

                      {chapters[activeChapterIndex].scenarios.map((scenario: any, sIdx: number) => {
                        const isIgnored = ignoredScenarios[scenario.scenario_id];
                        return (
                          <motion.div
                            data-tour={sIdx === 0 ? "tour-context-manager-scenario" : undefined}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sIdx * 0.05 }}
                            key={scenario.scenario_id}
                            className={cn(
                              "glass border rounded-2xl p-6 shadow-sm lift-effect space-y-6 transition-all",
                              isIgnored ? "opacity-50 grayscale border-card-border/50 bg-card/20" : "border-card-border"
                            )}
                          >
                            <div>
                              <div className="flex items-start justify-between mb-4">
                                <h5 className={cn("font-bold text-lg", isIgnored ? "text-muted" : "text-foreground")}>{scenario.topic}</h5>
                                <button
                                  data-tour="tour-context-manager-ignore"
                                  onClick={() => toggleScenarioIgnored(scenario.scenario_id)}
                                  className={cn(
                                    "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2",
                                    isIgnored ? "bg-primary text-white border-primary" : "bg-card border-card-border text-muted hover:text-foreground"
                                  )}
                                >
                                  {isIgnored ? "Wird übersprungen" : "Nicht relevant für dieses System"}
                                </button>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Auslöser (Stimulus)</span>
                                  <div className="text-sm text-foreground bg-background p-4 rounded-xl border border-card-border">
                                    {scenario.stimulus}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                    <AlertCircle className="w-3.5 h-3.5" /> Architektonische Fragestellung
                                  </span>
                                  <div className="text-sm font-medium text-foreground bg-primary/5 p-4 rounded-xl border border-primary/20">
                                    {scenario.metric_question}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Options Preview */}
                            <div className="pt-4 border-t border-card-border/50 space-y-3">
                              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Mögliche Systemverhalten (Optionen):</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {scenario.options.map((opt: any, oIdx: number) => (
                                  <div
                                    key={oIdx}
                                    className="group text-xs bg-muted/5 hover:bg-primary/[0.02] border border-card-border/60 hover:border-primary/30 p-4 rounded-2xl text-foreground transition-all duration-200 flex flex-col gap-1.5 shadow-sm"
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary/70 transition-colors mt-1 shrink-0" />
                                      <span className="font-bold text-foreground leading-tight transition-colors group-hover:text-primary">
                                        {opt.label}
                                      </span>
                                    </div>
                                    {opt.description && (
                                      <p className="text-[11px] text-muted pl-[18px] leading-relaxed">
                                        {opt.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2">
                              <label className="text-xs font-bold text-foreground block mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                System-Kontext (z.B. Status Quo)
                              </label>
                              <textarea
                                data-tour="tour-context-manager-input"
                                value={scenarioContexts[scenario.scenario_id] || ''}
                                onChange={(e) => setScenarioContext(scenario.scenario_id, e.target.value)}
                                disabled={isIgnored}
                                placeholder={
                                  "Hilfreicher Kontext für das Interview, z.B.:\n- Status Quo: Primäre DB in Region A ohne Multi-AZ."
                                }
                                className="w-full bg-background border border-primary/30 rounded-xl p-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none min-h-[120px] transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              {!isIgnored && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-[10px] text-muted flex items-center gap-1 font-medium">💡 Vorlagen einfügen:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentVal = scenarioContexts[scenario.scenario_id] || '';
                                      const prefix = currentVal ? '\n' : '';
                                      setScenarioContext(scenario.scenario_id, currentVal + prefix + '- **Status Quo**: ');
                                    }}
                                    className="text-[10px] bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                  >
                                    + Status Quo
                                  </button>
                                  {evaluationGoal === 'soll' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentVal = scenarioContexts[scenario.scenario_id] || '';
                                        const prefix = currentVal ? '\n' : '';
                                        setScenarioContext(scenario.scenario_id, currentVal + prefix + '- **Zielzustand**: ');
                                      }}
                                      className="text-[10px] bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                    >
                                      + Zielzustand
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentVal = scenarioContexts[scenario.scenario_id] || '';
                                      const prefix = currentVal ? '\n' : '';
                                      setScenarioContext(scenario.scenario_id, currentVal + prefix + '- **Restriktionen**: ');
                                    }}
                                    className="text-[10px] bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                  >
                                    + Restriktionen
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-card-border bg-card shrink-0 flex justify-between items-center px-6">
                <div className="text-xs text-muted">
                  Ihre Eingaben werden automatisch gespeichert und im Interview (Step 4) angezeigt.
                </div>
                <button
                  onClick={() => setIsContextManagerOpen(false)}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Save className="w-5 h-5" />
                  Fertigstellen & Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
