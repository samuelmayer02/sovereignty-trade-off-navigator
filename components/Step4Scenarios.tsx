import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore, ScenarioEvaluation, getDisplayId } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ChevronRight, AlertCircle, AlertTriangle, SkipForward, Maximize2, Minimize2, Info, Pencil, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import FlagButton from './FlagButton';
import { ScenarioTutorialModal } from './ScenarioTutorialModal';

export default function Step4Scenarios() {
  const { evaluationGoal, scenarios, setStep, scenarioResults, setScenarioResult, requirements, scenarioContexts, setScenarioContext, ignoredScenarios, hasSeenScenarioTutorial, setHasSeenScenarioTutorial, isTourActive, currentTourStep, step: globalStep } = useStore();

  const activeScenarios = useMemo(() => {
    const filtered = scenarios.filter(s => !ignoredScenarios[s.scenario_id]);
    const grouped: Record<string, any[]> = {};
    const categoryOrder: string[] = [];
    
    filtered.forEach(s => {
      const cat = s.category || 'Unkategorisiert';
      if (!grouped[cat]) {
        grouped[cat] = [];
        categoryOrder.push(cat);
      }
      grouped[cat].push(s);
    });
    
    const sorted: any[] = [];
    categoryOrder.forEach(cat => {
      sorted.push(...grouped[cat]);
    });
    
    return sorted;
  }, [scenarios, ignoredScenarios]);

  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [earlyExitWarning, setEarlyExitWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChapterIntro, setShowChapterIntro] = useState(true);
  const [showRationale, setShowRationale] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [localContext, setLocalContext] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const evalFormRef = useRef<HTMLDivElement>(null);

  const chapters = useMemo(() => {
    const list: { name: string, startIndex: number, count: number, scenarios: any[] }[] = [];
    if (activeScenarios.length === 0) return list;

    let currentCategory = activeScenarios[0].category || 'Unkategorisiert';
    let startIndex = 0;

    for (let i = 1; i <= activeScenarios.length; i++) {
      const iterCategory = i < activeScenarios.length ? (activeScenarios[i].category || 'Unkategorisiert') : null;
      if (i === activeScenarios.length || iterCategory !== currentCategory) {
        list.push({
          name: currentCategory,
          startIndex: startIndex,
          count: i - startIndex,
          scenarios: activeScenarios.slice(startIndex, i)
        });
        if (i < activeScenarios.length) {
          currentCategory = iterCategory!;
          startIndex = i;
        }
      }
    }
    return list;
  }, [activeScenarios]);

  const activeChapterIndex = useMemo(() => {
    return chapters.findIndex(c => activeScenarioIndex >= c.startIndex && activeScenarioIndex < c.startIndex + c.count);
  }, [activeScenarioIndex, chapters]);

  const activeChapter = chapters[activeChapterIndex];

  const prevChapterRef = useRef<number>(-1);
  useEffect(() => {
    if (activeChapterIndex !== -1 && activeChapterIndex !== prevChapterRef.current) {
      if (activeChapter && activeScenarioIndex === activeChapter.startIndex) {
        setShowChapterIntro(true);
      }
      prevChapterRef.current = activeChapterIndex;
    }
  }, [activeChapterIndex, activeScenarioIndex, activeChapter]);

  const currentScenario = activeScenarios[activeScenarioIndex];

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
  }, [activeScenarioIndex, activeChapterIndex, showChapterIntro]);

  // Local form state for the currently active scenario
  const existingResult = currentScenario ? scenarioResults[currentScenario.scenario_id] : undefined;
  const [evalForm, setEvalForm] = useState<ScenarioEvaluation>(
    existingResult || { optionIndex: -1, businessValue: 0, risk: 0, notes: '', triggeredReqs: [] }
  );
  const [touchedBv, setTouchedBv] = useState(false);
  const [touchedTr, setTouchedTr] = useState(false);

  useEffect(() => {
    if (!currentScenario) return;
    const existing = scenarioResults[currentScenario.scenario_id];
    setEvalForm(existing || { optionIndex: -1, businessValue: 0, risk: 0, notes: '', triggeredReqs: [] });
    setShowRationale(false);
    setTouchedBv(!!existing);
    setTouchedTr(!!existing);
    setLocalContext(useStore.getState().scenarioContexts[currentScenario.scenario_id] || '');
    setIsEditingContext(false);
  }, [activeScenarioIndex, currentScenario?.scenario_id, scenarioResults]);

  const tourSelectedOptionRef = useRef<boolean>(false);

  // Tour Mock Effect
  useEffect(() => {
    if (isTourActive && globalStep === 4) {
      if (!hasSeenScenarioTutorial) setHasSeenScenarioTutorial(true);
      
      if (currentTourStep >= 2 && showChapterIntro) {
        setShowChapterIntro(false);
      }
      
      if (currentTourStep >= 3) {
        if (evalForm.optionIndex === -1) {
          tourSelectedOptionRef.current = true;
          setEvalForm(prev => ({ ...prev, optionIndex: 0 }));
        }
        // Smooth scroll to the evaluation sliders section for tour step 3
        setTimeout(() => {
          evalFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      } else if (currentTourStep < 3 && tourSelectedOptionRef.current) {
        const existing = currentScenario ? scenarioResults[currentScenario.scenario_id] : null;
        if (!existing) {
          tourSelectedOptionRef.current = false;
          setEvalForm(prev => ({ ...prev, optionIndex: -1 }));
        }
      }
    } else if (!isTourActive && tourSelectedOptionRef.current) {
      const existing = currentScenario ? scenarioResults[currentScenario.scenario_id] : null;
      if (!existing) {
        tourSelectedOptionRef.current = false;
        setEvalForm(prev => ({ ...prev, optionIndex: -1 }));
      }
    }
  }, [isTourActive, globalStep, currentTourStep, showChapterIntro, hasSeenScenarioTutorial, currentScenario, scenarioResults, evalForm.optionIndex]);

  if (activeScenarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Lade Szenarien...</p>
        </div>
      </div>
    );
  }

  const handleOptionSelect = (index: number) => {
    if (evalForm.optionIndex === index) {
      // Toggle off / deselect option
      setEvalForm({ optionIndex: -1, businessValue: 0, risk: 0, notes: '', triggeredReqs: [] });
      setTouchedBv(false);
      setTouchedTr(false);
      if (currentScenario && scenarioResults[currentScenario.scenario_id]) {
        setScenarioResult(currentScenario.scenario_id, null, []);
      }
    } else {
      setEvalForm({ ...evalForm, optionIndex: index });
      setTouchedBv(false);
      setTouchedTr(false);
      
      // Smooth scroll to the evaluation sliders section
      setTimeout(() => {
        evalFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const saveAndNext = () => {
    if (evalForm.optionIndex === -1) {
      alert('Bitte wähle eine Option aus.');
      return;
    }

    const selectedOption = currentScenario.options[evalForm.optionIndex];
    const triggeredReqs = selectedOption.referenced_requirements || [];

    setScenarioResult(currentScenario.scenario_id, evalForm, triggeredReqs);

    if (activeScenarioIndex < activeScenarios.length - 1) {
      setActiveScenarioIndex(prev => prev + 1);
    } else {
      setStep(5); // Go to Scenario Summary
    }
  };

  const jumpToScenario = (index: number) => {
    setActiveScenarioIndex(index);
  };

  const completedCount = Object.keys(scenarioResults).length;
  const totalCount = activeScenarios.length;
  const allDone = completedCount >= totalCount;

  return (
    <div ref={mainContainerRef} className={cn(
      "w-full flex flex-col transition-all duration-300",
      isFullscreen
        ? "fixed inset-0 z-[110] bg-background p-10 h-screen overflow-y-auto"
        : "max-w-5xl mx-auto h-[85vh]"
    )}>
      {/* Tutorial Modal */}
      {!hasSeenScenarioTutorial && (
        <ScenarioTutorialModal onClose={() => setHasSeenScenarioTutorial(true)} />
      )}

      {/* Early Exit Warning Modal */}
      <AnimatePresence>
        {earlyExitWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-warning/30 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 text-warning mb-4">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Szenarien vorzeitig beenden?</h3>
                </div>
                <p className="text-muted leading-relaxed mb-2">
                  Du hast erst <span className="font-bold text-foreground">{completedCount} von {totalCount}</span> Szenarien bewertet.
                </p>
                <p className="text-muted leading-relaxed text-sm">
                  Nicht bewertete Szenarien tragen keine Anforderungen bei. Du kannst jederzeit über Schritt 6 (Anforderungen) zurückkehren und fehlende Szenarien nachträglich bearbeiten.
                </p>
              </div>
              <div className="bg-muted/10 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setEarlyExitWarning(false)}
                  className="bg-background hover:bg-card border border-card-border px-5 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Weiter bearbeiten
                </button>
                <button
                  onClick={() => { setEarlyExitWarning(false); setStep(5); }}
                  className="bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning px-5 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Trotzdem fortfahren
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Architekturszenarien</h2>
            <button
              onClick={() => setHasSeenScenarioTutorial(false)}
              className="p-1.5 rounded-full hover:bg-card border border-card-border text-muted-foreground hover:text-primary transition-colors flex items-center justify-center shrink-0"
              title="Tutorial anzeigen"
            >
              <Info className="w-5 h-5" />
            </button>
            {evaluationGoal && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg shrink-0">
                 <span className="text-xs font-medium text-muted">Fokus:</span>
                 <span className="text-xs font-bold text-primary">
                   {evaluationGoal === 'soll' ? 'Soll-Zustand (Transformation)' : 'Status Quo (Audit)'}
                 </span>
              </div>
            )}
          </div>
          <p className="text-muted text-sm sm:text-base">Bewerten Sie typische System-Szenarien, um daraus funktionale Anforderungen abzuleiten.</p>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-card-border bg-card text-muted hover:text-foreground transition-all whitespace-nowrap shrink-0"
            title={isFullscreen ? "Vollbild beenden" : "Vollbildmodus"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Verkleinern' : 'Vollbild'}</span>
          </button>

          <button
            onClick={() => allDone ? setStep(5) : setEarlyExitWarning(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all whitespace-nowrap shrink-0 shadow-sm",
              allDone
                ? "bg-primary text-white border-primary hover:bg-primary/90"
                : "text-muted border-card-border bg-card hover:border-warning/50 hover:text-warning"
            )}
          >
            <SkipForward className="w-4 h-4" />
            <span>{allDone ? 'Alle bewertet – Weiter' : 'Vorzeitig abschließen'}</span>
          </button>
        </div>
      </div>

      {/* Segmented Progress bar */}
      <div className="mb-4 shrink-0">
        <div className="flex justify-between text-xs text-muted mb-1.5">
          <span>{completedCount} von {totalCount} Szenarien bewertet</span>
          <span className="font-mono">{Math.round((completedCount / totalCount) * 100)}%</span>
        </div>
        <div className="flex h-1.5 gap-1">
          {chapters.map((chapter, idx) => {
            const completedInChapter = chapter.scenarios.filter(s => scenarioResults[s.scenario_id] !== undefined).length;
            const progress = completedInChapter / chapter.count;
            const flexBasis = `${(chapter.count / totalCount) * 100}%`;

            return (
              <div key={idx} style={{ flexBasis }} className="bg-card-border rounded-full overflow-hidden h-full">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Chapter Stepper */}
      <div className="flex items-center space-x-1 glass border border-card-border p-2 px-3 rounded-xl mb-4 shrink-0 overflow-x-auto custom-scrollbar pb-3">
        {chapters.map((chapter, idx) => {
          const completedInChapter = chapter.scenarios.filter(s => scenarioResults[s.scenario_id] !== undefined).length;
          const isCompleted = completedInChapter === chapter.count;
          const isActive = idx === activeChapterIndex;

          return (
            <div key={idx} className="flex items-center shrink-0">
              {idx > 0 && <ChevronRight className="w-4 h-4 text-muted/50 mx-1 shrink-0" />}
              <button
                onClick={() => {
                  jumpToScenario(chapter.startIndex);
                  setShowChapterIntro(true);
                }}
                className={cn(
                  "text-xs whitespace-nowrap px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-2",
                  isActive ? "bg-primary text-white shadow-md shadow-primary/20" :
                    isCompleted ? "text-success bg-success/10 hover:bg-success/20" :
                      "text-muted hover:text-foreground hover:bg-card-border"
                )}
              >
                <span>{idx + 1}. {chapter.name}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px]",
                  isActive ? "bg-white/20" : "bg-background/50"
                )}>
                  {completedInChapter}/{chapter.count}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Intra-Chapter Navigation */}
      {!showChapterIntro && activeChapter && activeChapter.count > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center shrink-0 mb-6 overflow-x-auto pb-2 custom-scrollbar bg-card/50 border border-card-border rounded-2xl p-2 px-4 shadow-sm"
        >
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider mr-4 shrink-0">Szenarien in dieser Kategorie:</span>
          <div className="flex items-center space-x-2">
            {Array.from({ length: activeChapter.count }).map((_, i) => {
              const globalIndex = activeChapter.startIndex + i;
              const isCurrent = globalIndex === activeScenarioIndex;
              const isCompleted = scenarioResults[activeScenarios[globalIndex].scenario_id] !== undefined;
              return (
                <button
                  key={globalIndex}
                  onClick={() => jumpToScenario(globalIndex)}
                  className={cn(
                    "w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-xs font-bold transition-all",
                    isCurrent ? "bg-primary text-white shadow-md shadow-primary/30 scale-110" :
                      isCompleted ? "bg-success/10 text-success hover:bg-success/20 border border-success/20" :
                        "bg-background border border-card-border text-muted hover:text-foreground hover:border-primary/50"
                  )}
                  title={`Szenario ${globalIndex + 1}: ${activeScenarios[globalIndex].topic}`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 pr-8 custom-scrollbar space-y-8 py-4">
        <AnimatePresence mode="wait">
          {showChapterIntro && activeChapter ? (
            <motion.div
              key={`intro-${activeChapterIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 bg-card border border-card-border rounded-3xl p-12 shadow-sm lift-effect"
            >
              <div data-tour="tour-step4-intro-card" className="flex flex-col items-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold">{activeChapterIndex + 1}</span>
                </div>
                <h2 className="text-3xl font-bold text-foreground">Block {activeChapterIndex + 1}: {activeChapter.name}</h2>
                <p className="text-lg text-muted max-w-lg mx-auto">
                  In diesem Themenblock erwarten dich {activeChapter.count} Szenarien zu <span className="font-bold text-foreground">{activeChapter.name}</span>.
                </p>
              </div>

              <div className="flex gap-4 items-center justify-center pt-8 w-full max-w-sm mx-auto">
                <div className="flex-1 bg-background border border-card-border rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{completedCount}</div>
                  <div className="text-xs text-muted uppercase">Insgesamt gelöst</div>
                </div>
                <div className="flex-1 bg-background border border-card-border rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{activeChapter.count}</div>
                  <div className="text-xs text-muted uppercase">In diesem Block</div>
                </div>
              </div>

              <button
                onClick={() => setShowChapterIntro(false)}
                className="mt-8 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto"
              >
                Block starten <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={currentScenario.scenario_id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
              data-tour="tour-step4-scenario-options"
            >
              {/* Context Card */}
              <div className="bg-card border border-card-border p-6 rounded-3xl shadow-sm lift-effect relative">
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <FlagButton
                    type="scenario"
                    id={currentScenario.scenario_id}
                    initialFlagged={(currentScenario as any).flagged}
                    initialComment={(currentScenario as any).flagComment}
                  />
                </div>
                <div className="flex items-start justify-between mb-4 pr-12">
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-md">
                    {currentScenario.category}
                  </div>
                  <span className="text-sm text-muted font-mono">
                    Szenario {activeScenarioIndex + 1} / {totalCount}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-6">{currentScenario.topic}</h3>

                <div className="space-y-6">
                  {/* Stimulus / Auslöser */}
                  <div className="border-l-2 border-primary/30 pl-4 py-0.5">
                    <p className="text-sm italic text-muted-foreground leading-relaxed">
                      {currentScenario.stimulus}
                    </p>
                  </div>
                  
                  {/* System Context Overlay */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary/80 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Plattform-Status Quo & Kontext
                      </span>
                      {!isEditingContext && (
                        <button 
                          onClick={() => setIsEditingContext(true)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-muted hover:text-foreground hover:bg-muted/10 transition-colors font-semibold cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          {scenarioContexts[currentScenario.scenario_id] ? 'Bearbeiten' : 'Hinzufügen'}
                        </button>
                      )}
                    </div>
                    
                    {isEditingContext ? (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col gap-3">
                        <textarea 
                          value={localContext}
                          onChange={(e) => setLocalContext(e.target.value)}
                          placeholder="Beschreiben Sie das aktuelle Verhalten (Status Quo) oder Besonderheiten Ihrer Plattform für dieses Szenario..."
                          className="w-full bg-background border border-primary/30 rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary focus:outline-none min-h-[80px]"
                        />
                        <div className="flex flex-wrap gap-2 -mt-1">
                          <span className="text-[9px] text-muted font-medium">💡 Vorlagen:</span>
                          <button 
                            type="button"
                            onClick={() => {
                              const prefix = localContext ? '\n' : '';
                              setLocalContext(localContext + prefix + '- **Aktueller Status Quo**: ');
                            }}
                            className="text-[9px] bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + Ist-Zustand
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              const prefix = localContext ? '\n' : '';
                              setLocalContext(localContext + prefix + '- **Randbedingungen**: ');
                            }}
                            className="text-[9px] bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + Randbedingungen
                          </button>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setLocalContext(scenarioContexts[currentScenario.scenario_id] || '');
                              setIsEditingContext(false);
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
                          >
                            Abbrechen
                          </button>
                          <button 
                            onClick={() => {
                              setScenarioContext(currentScenario.scenario_id, localContext);
                              setIsEditingContext(false);
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                          >
                            Speichern
                          </button>
                        </div>
                      </div>
                    ) : scenarioContexts[currentScenario.scenario_id] ? (
                      <div className="bg-primary/[0.02] border-l-2 border-primary/20 px-4 py-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {scenarioContexts[currentScenario.scenario_id]}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="pt-4 border-t border-card-border/50 mt-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-primary" />
                        Fragestellung
                      </span>
                      {evaluationGoal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          Bewertungs-Fokus: {evaluationGoal === 'soll' ? 'Soll-Zustand (Transformation)' : 'Status Quo (Audit)'}
                        </span>
                      )}
                    </div>
                    {currentScenario.rationale && (
                      <button
                        onClick={() => setShowRationale(!showRationale)}
                        className="text-xs flex items-center gap-1 px-2 py-0.5 rounded text-muted hover:text-primary hover:bg-primary/10 transition-colors font-semibold"
                        title="Architektonische Einordnung anzeigen"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Erklärung
                      </button>
                    )}
                  </div>
                  <p className="text-lg font-bold text-foreground leading-snug">
                    {currentScenario.metric_question}
                  </p>
                  <AnimatePresence>
                    {showRationale && currentScenario.rationale && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                          <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Rationale</div>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            {currentScenario.rationale}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Options Selection */}
              <div className="space-y-3">
                <h4 className="font-bold text-foreground mb-4">Mögliche Systemverhalten:</h4>
                <div className="grid grid-cols-1 gap-3">
                  {currentScenario.options.map((opt: any, idx: number) => {
                    const isSelected = evalForm.optionIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        className={cn(
                          "p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-4 lift-effect group relative",
                          isSelected ? "border-primary bg-primary/5 shadow-lg scale-[1.01]" : "border-card-border bg-card hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                          isSelected ? "border-primary bg-primary" : "border-muted"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h5 className={cn("font-bold", isSelected ? "text-primary" : "text-foreground")}>
                                  {opt.label}
                                </h5>
                                {isSelected && (
                                  <span className="text-[9.5px] font-bold bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-md">
                                    Ausgewählt (Erneut klicken zum Abwählen)
                                  </span>
                                )}
                              </div>
                              <FlagButton
                                type="option"
                                id={`${currentScenario.scenario_id}:${idx}`}
                                initialFlagged={(opt as any).flagged}
                                initialComment={(opt as any).flagComment}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                          <p className="text-sm text-muted">
                            {opt.description}
                          </p>
                          {isSelected && opt.referenced_requirements && opt.referenced_requirements.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-card-border">
                              <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3 block">Aktiviert folgende Anforderungen:</span>
                              <div className="grid grid-cols-1 gap-2">
                                {opt.referenced_requirements.map((reqUid: string) => {
                                  const req = requirements.find((r: any) => r.uid === reqUid);
                                  return (
                                    <div key={reqUid} className="bg-background border border-card-border p-3 rounded-xl flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                          {getDisplayId(reqUid)}
                                        </span>
                                        <h5 className="font-bold text-xs text-foreground">{req?.name || 'Unbekannt'}</h5>
                                      </div>
                                      <p className="text-[11px] text-muted leading-relaxed mt-1 whitespace-pre-wrap">
                                        {req?.description || 'Keine Beschreibung verfügbar.'}
                                      </p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Evaluation Form */}
              <AnimatePresence>
                {evalForm.optionIndex !== -1 && (
                  <motion.div
                    ref={evalFormRef}
                    initial={isTourActive ? undefined : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={isTourActive ? undefined : { opacity: 0, height: 0 }}
                    className="bg-card border border-card-border p-6 rounded-3xl space-y-6 overflow-hidden"
                    data-tour="tour-eval-sliders"
                  >
                    <div className="flex items-center justify-between w-full border-b border-card-border pb-4">
                      <h4 className="font-bold text-foreground">Bewertung des Trade-offs</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEvalForm({ optionIndex: -1, businessValue: 0, risk: 0, notes: '', triggeredReqs: [] });
                          setTouchedBv(false);
                          setTouchedTr(false);
                          if (currentScenario && scenarioResults[currentScenario.scenario_id]) {
                            setScenarioResult(currentScenario.scenario_id, null, []);
                          }
                        }}
                        className="text-xs font-semibold text-muted hover:text-danger flex items-center gap-1.5 px-3 py-1 rounded-lg border border-card-border/60 hover:bg-danger/10 hover:border-danger/30 transition-colors cursor-pointer"
                        title="Szenario-Auswahl aufheben"
                      >
                        <X className="w-3.5 h-3.5" />
                        Auswahl aufheben
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium text-foreground">Strategische Relevanz</label>
                          <span className="text-sm font-bold text-primary whitespace-nowrap">{evalForm.businessValue} / 10</span>
                        </div>
                        <input
                          type="range" min="0" max="10"
                          value={evalForm.businessValue}
                          onChange={e => setEvalForm({ ...evalForm, businessValue: parseInt(e.target.value) })}
                          onPointerDown={() => setTouchedBv(true)}
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1 px-0.5 font-medium">
                          <span>Nice to Have</span>
                          <span>Muss</span>
                        </div>
                        <p className="text-xs text-muted mt-2">Geschäftlicher Nutzen oder regulatorische Notwendigkeit für das Produkt.</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium text-foreground">Umsetzungs-Risiko</label>
                          <span className="text-sm font-bold text-danger whitespace-nowrap">{evalForm.risk} / 10</span>
                        </div>
                        <input
                          type="range" min="0" max="10"
                          value={evalForm.risk}
                          onChange={e => setEvalForm({ ...evalForm, risk: parseInt(e.target.value) })}
                          onPointerDown={() => setTouchedTr(true)}
                          className="w-full accent-danger"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1 px-0.5 font-medium">
                          <span>Gering</span>
                          <span>Sehr hoch</span>
                        </div>
                        <p className="text-xs text-muted mt-2">Implementierungsaufwand, Betriebskomplexität oder Lock-in-Risiken.</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-foreground">Notizen / Begründung <span className="text-xs text-muted font-normal">(optional)</span></label>
                        <span className="text-[11px] text-muted">Kurze Stichpunkte genügen</span>
                      </div>
                      <textarea
                        value={evalForm.notes}
                        onChange={e => setEvalForm({ ...evalForm, notes: e.target.value })}
                        className="w-full bg-background border border-card-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        rows={2}
                        placeholder="Optional: Kurzer Hinweis, Stichpunkte oder Begründung..."
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-card-border">
                      <span className="text-xs text-muted">
                        {activeScenarioIndex + 1} / {totalCount} — {totalCount - activeScenarioIndex - 1} verbleibend
                      </span>
                      <button
                        onClick={saveAndNext}
                        disabled={evalForm.optionIndex === -1 || !touchedBv || !touchedTr}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <span>{activeScenarioIndex < activeScenarios.length - 1 ? 'Speichern & Nächstes Szenario' : 'Szenarien abschließen'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
