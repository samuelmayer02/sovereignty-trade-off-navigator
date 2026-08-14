import { useStore, getDisplayId, calculatePriority } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, CheckSquare, Square, Lock, AlertTriangle, ChevronRight, GitBranch, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState, useMemo } from 'react'
import FlagButton from './FlagButton'
import { getProvenance, type Provenance } from '@/lib/provenance'

export default function Step6Selection() {
  const { 
    requirements: allReqs, 
    groups: allGroups, 
    selectedRequirements, 
    selectedSovereigntyReqs, 
    selectedScenarioReqs, 
    toggleRequirement, 
    setPriority, 
    setSovereigntyPriority, 
    setScenarioReqPriority, 
    setStep, 
    selectAllRequirements, 
    deselectAllRequirements,
    removeSovereigntyReq,
    removeScenarioReq,
    decisionTrees: allTrees,
    scenarios: allScenarios,
    treeResults,
    scenarioResults,
  } = useStore()
  
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string} | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Group by category
  const categories = useMemo(() => {
    return Array.from(new Set(allReqs.map(r => r.category))).filter(Boolean) as string[];
  }, [allReqs])
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Set initial active category when data arrives
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].replace(/\s+/g, '-'));
    }
  }, [categories, activeCategory]);

  // Move hooks before early returns
  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace('category-', ''));
          }
        });
      },
      { 
        threshold: 0.1, 
        rootMargin: '-20% 0px -60% 0px' 
      }
    );

    categories.forEach((category) => {
      const id = `category-${category.replace(/\s+/g, '-')}`;
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  // Validation logic
  const atLeastOneGroups = useMemo(() => new Set(
    allGroups.filter((g: any) => g.type === 'at-least-one').map((g: any) => g.id)
  ), [allGroups]);

  const isAtLeastOneSatisfied = useMemo(() => Array.from(atLeastOneGroups).every(groupId => {
    const reqsInGroup = allReqs.filter((r: any) => r.groupId === groupId);
    return reqsInGroup.some((r: any) => selectedRequirements[r.uid] !== undefined);
  }), [atLeastOneGroups, allReqs, selectedRequirements]);

  const allLockedIds = useMemo(() => (
    [...new Set([...Object.keys(selectedSovereigntyReqs), ...Object.keys(selectedScenarioReqs)])]
  ), [selectedSovereigntyReqs, selectedScenarioReqs]);

  const conflicts = useMemo(() => {
    const groupMap: Record<string, any[]> = {};

    allLockedIds.forEach(uid => {
      const req = allReqs.find((r: any) => r.uid === uid);
      if (!req?.groupId) return;
      
      const group = allGroups.find((g: any) => g.id === req.groupId);
      if (!group || group.type !== 'exclusive') return;

      if (!groupMap[req.groupId]) groupMap[req.groupId] = [];
      
      const prov = getProvenance(uid, treeResults, scenarioResults, allTrees, allScenarios);
      if (prov) {
        groupMap[req.groupId].push({ id: uid, provenance: prov });
      } else {
        const isSov = selectedSovereigntyReqs[uid] !== undefined;
        groupMap[req.groupId].push({ 
          id: uid, 
          provenance: isSov 
            ? { source: 'tree', data: { treeId: 'unknown', treeTitle: 'Entscheidungsbaum', resultTitle: 'Aktivierte Anforderung' } }
            : { source: 'scenario', data: { scenarioId: 'unknown', scenarioTopic: 'Szenario', optionLabel: 'Aktivierte Option', businessValue: 5, risk: 5, notes: '' } }
        });
      }
    });

    return Object.entries(groupMap)
      .filter(([, members]) => members.length > 1)
      .map(([groupId, members]) => {
        const grp = allGroups.find((g: any) => g.id === groupId);
        return { groupName: grp?.name || groupId, groupId, members };
      });
  }, [allLockedIds, selectedSovereigntyReqs, selectedScenarioReqs, treeResults, scenarioResults, allReqs, allGroups, allTrees, allScenarios]);

  const hasUnresolvedConflicts = conflicts.length > 0;

  const resolveConflict = (groupId: string, groupName: string, keepId: string, members: any[], comment: string, sr: number, ur: number) => {
    const rejectedIds = members.map((m: any) => m.id).filter((id: string) => id !== keepId);
    
    useStore.getState().setConflictResolutionDetails(groupId, {
      groupId,
      groupName,
      keepId,
      rejectedIds,
      comment,
      sr,
      ur,
      timestamp: new Date().toISOString()
    });

    const priority = calculatePriority(sr, ur);
    useStore.getState().updateRoutedPriority(keepId, priority);

    members.forEach((m: any) => {
      if (m.id === keepId) return;
      if (m.provenance?.source === 'tree') removeSovereigntyReq(m.id);
      else if (m.provenance?.source === 'scenario') removeScenarioReq(m.id);
      else if (selectedRequirements[m.id] !== undefined) toggleRequirement(m.id);
    });
  };

  const hasInvalidExclusiveGroups = useMemo(() => {
    for (const group of allGroups) {
      if (group.type === 'exclusive') {
        const groupReqs = allReqs.filter((r: any) => r.groupId === group.id);
        const activeCount = groupReqs.filter((r: any) => 
          selectedRequirements[r.uid] !== undefined || 
          selectedSovereigntyReqs[r.uid] !== undefined || 
          selectedScenarioReqs[r.uid] !== undefined
        ).length;
        if (activeCount > 1) {
          return true;
        }
      }
    }
    return false;
  }, [selectedRequirements, selectedSovereigntyReqs, selectedScenarioReqs, allReqs, allGroups]);

  const isValid = (Object.keys(selectedRequirements).length >= 1 || Object.keys(selectedSovereigntyReqs).length > 0 || Object.keys(selectedScenarioReqs).length > 0) && !hasUnresolvedConflicts && !hasInvalidExclusiveGroups;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isValid) {
        setStep(7)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRequirements, setStep, isValid])

  if (allReqs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Lade Anforderungen aus der Datenbank...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center p-8 glass-card rounded-3xl max-w-md">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Keine Anforderungen geladen</h3>
          <p className="text-muted mb-6 text-sm">
            Die Datenbank scheint keine Anforderungen zu enthalten oder die Kategorisierung konnte nicht verarbeitet werden.
          </p>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary text-white px-6 py-2 rounded-xl font-medium"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scrollToCategory = (category: string) => {
    const id = `category-${category.replace(/\s+/g, '-')}`;
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -120; // Account for sticky header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderReqCard = (req: any) => {
    const isTreeSelected = selectedSovereigntyReqs[req.uid] !== undefined;
    const isScenarioSelected = selectedScenarioReqs[req.uid] !== undefined;
    const isLocked = isTreeSelected || isScenarioSelected;
    const isManuallySelected = selectedRequirements[req.uid] !== undefined;
    const isSelected = isLocked || isManuallySelected;
    
    let rawPriority = undefined;
    if (isTreeSelected) rawPriority = selectedSovereigntyReqs[req.uid];
    else if (isScenarioSelected) rawPriority = selectedScenarioReqs[req.uid];
    else if (isManuallySelected) rawPriority = selectedRequirements[req.uid];
    
    const priority = typeof rawPriority === 'number' ? rawPriority : 5;

    let isDisabled = false;
    if (req.groupId && !isSelected) {
      const group = allGroups.find((g: any) => g.id === req.groupId);
      if (group && group.type === 'exclusive') {
        const groupMates = allReqs.filter((r: any) => r.groupId === req.groupId && r.uid !== req.uid);
        isDisabled = groupMates.some((mate: any) => 
          selectedRequirements[mate.uid] !== undefined || 
          selectedSovereigntyReqs[mate.uid] !== undefined || 
          selectedScenarioReqs[mate.uid] !== undefined
        );
      }
    }

    return (
      <motion.div 
        key={req.uid}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "cursor-pointer p-5 rounded-xl border transition-all duration-300 flex flex-col h-full relative overflow-hidden lift-effect",
          isSelected ? (isLocked ? "glass-card border-primary/30 opacity-80" : "glass-card border-primary/50") : "bg-card border-card-border hover:border-primary/30", isDisabled && "opacity-50 grayscale pointer-events-none"
        )}
        onClick={() => {
          if (isTreeSelected) {
            setAlertMessage({
              title: "Aktion nicht möglich",
              message: "Diese Anforderung wurde automatisch durch die Entscheidungsbäume (Schritt 2) festgelegt. Gehe zurück, um deine Antworten im Baum anzupassen."
            });
            return;
          }
          if (isScenarioSelected) {
            setAlertMessage({
              title: "Aktion nicht möglich",
              message: "Diese Anforderung wurde durch deine Szenario-Bewertungen (Schritt 4) festgelegt. Gehe zurück, um das entsprechende Szenario anzupassen."
            });
            return;
          }

          if (req.groupId && !isSelected) {
            const group = allGroups.find(g => g.id === req.groupId);
            if (group && group.type === 'exclusive') {
              const groupMates = allReqs.filter(r => (r as any).groupId === req.groupId && r.uid !== req.uid);
              const lockedSovMate = groupMates.find(mate => selectedSovereigntyReqs[mate.uid] !== undefined);
              if (lockedSovMate) {
                setAlertMessage({
                  title: "Konflikt in Entweder/Oder-Gruppe",
                  message: `Du kannst diese Anforderung nicht auswählen, da die Entweder/Oder-Gruppe "${group.name}" bereits durch die Bäume (Anforderung: ${getDisplayId(lockedSovMate.uid)}) belegt ist.`
                });
                return;
              }
              const lockedScenMate = groupMates.find(mate => selectedScenarioReqs[mate.uid] !== undefined);
              if (lockedScenMate) {
                setAlertMessage({
                  title: "Konflikt in Entweder/Oder-Gruppe",
                  message: `Du kannst diese Anforderung nicht auswählen, da die Entweder/Oder-Gruppe "${group.name}" bereits durch ein Szenario (Anforderung: ${getDisplayId(lockedScenMate.uid)}) belegt ist.`
                });
                return;
              }
            }
          }

          toggleRequirement(req.uid);
        }}
      >
        {isSelected && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full" />
        )}
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="font-mono text-xs text-muted flex items-center gap-2">
            {getDisplayId(req.uid)}
            {isLocked && (
              <div title="Gesperrt (Durch Vorab-Bewertung gesetzt)">
                <Lock className="w-3 h-3 text-muted/50" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FlagButton 
              type="requirement" 
              id={req.uid} 
              initialFlagged={req.flagged}
              initialComment={req.flagComment}
            />
            {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
          </div>
        </div>
        <div className="font-medium text-foreground mb-2 relative z-10">{req.name}</div>
        <div className="text-sm text-muted flex-grow relative z-10">{req.description}</div>
        
        {/* Priority Slider (Only show when selected) */}
        {isSelected && (
          <div 
            className="mt-4 pt-4 border-t border-card-border flex flex-col relative z-10"
            onClick={(e) => e.stopPropagation()} // Prevent toggling card when interacting with slider
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted">Priorität</span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{typeof priority === 'number' ? priority.toFixed(1) : priority} / 10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.1" 
              value={priority}
              onChange={(e) => {
                if (isTreeSelected) setSovereigntyPriority(req.uid, parseFloat(e.target.value));
                else if (isScenarioSelected) setScenarioReqPriority(req.uid, parseFloat(e.target.value));
                else setPriority(req.uid, parseFloat(e.target.value));
              }}
              className="w-full accent-primary cursor-pointer h-1.5 bg-muted/30 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1.5 px-0.5">
              <span>Nice to have</span>
              <span>Business Critical</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <AnimatePresence>
        {alertMessage && (
          <div key="alert-dialog-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-warning/30 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 text-warning mb-4">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-lg font-bold">{alertMessage.title}</h3>
                </div>
                <p className="text-muted leading-relaxed">
                  {alertMessage.message}
                </p>
              </div>
              <div className="bg-muted/10 px-6 py-4 flex justify-end">
                <button 
                  onClick={() => setAlertMessage(null)}
                  className="bg-background hover:bg-card border border-card-border px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Verstanden
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasUnresolvedConflicts && (
          <motion.div key="unresolved-conflicts-alert" data-tour="tour-step6-conflicts" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-8 space-y-4">
            <div className="flex items-center gap-3.5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-sm">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                <span className="font-bold text-amber-500 mr-1.5">Widersprüchliche Anforderungen:</span>
                Durch unterschiedliche Auswahlen in den Bäumen & Szenarien sind konkurrierende Optionen aktiv. Wähle unten pro Gruppe die finale Anforderung.
              </p>
            </div>
            {conflicts.map(conflict => (
              <ConflictCard
                key={conflict.groupId}
                conflict={conflict}
                allReqs={allReqs}
                onResolve={(keepId, comment, sr, ur) => resolveConflict(conflict.groupId, conflict.groupName, keepId, conflict.members, comment, sr, ur)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-card-border pb-4 pt-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div data-tour="tour-step6-matrix">
          <h2 className="text-2xl font-bold text-foreground">Anforderungen Auswählen</h2>
          <p className="text-muted mt-1 text-sm">Wähle die relevanten Anforderungen für deine Bewertung aus. Drücke Enter, um zu starten.</p>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
          <button 
            onClick={() => setStep(5)}
            className="text-muted hover:text-foreground transition-colors px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0"
          >
            Zurück
          </button>
          <button 
            onClick={() => setStep(7)}
            disabled={!isValid}
            className="bg-primary hover:bg-primary/80 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 shadow-sm"
          >
            Analyse Starten
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 items-start">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block sticky top-32 self-start">
          <div className="glass-card p-6 rounded-3xl border border-card-border space-y-2">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 px-2">Kategorien</h3>
            <nav className="space-y-1">
              {categories.map(category => {
                const isActive = activeCategory === category.replace(/\s+/g, '-');
                return (
                  <button
                    key={category}
                    onClick={() => scrollToCategory(category)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-between group",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                        : "text-muted hover:text-foreground hover:bg-muted/5 border border-transparent"
                    )}
                  >
                    <span>{category}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        <div className="space-y-12">
        {categories.map(category => {
          const reqsInCategory = allReqs.filter(r => r.category === category);
          const grouped: Record<string, typeof reqsInCategory> = {};
          const nonGrouped: typeof reqsInCategory = [];

          (reqsInCategory as any[]).forEach((r: any) => {
            if (r.groupId) {
              if (!grouped[r.groupId]) grouped[r.groupId] = [];
              grouped[r.groupId].push(r);
            } else {
              nonGrouped.push(r);
            }
          });

          return (
            <div 
              key={category} 
              id={`category-${category.replace(/\s+/g, '-')}`}
              className={cn(
                "scroll-mt-32 transition-opacity duration-500",
                activeCategory && activeCategory !== category.replace(/\s+/g, '-') ? "opacity-90" : "opacity-100"
              )}
            >
              <h3 className="text-lg font-medium text-foreground mb-4 border-b border-card-border pb-2 flex items-center justify-between">
                <span>{category}</span>
                {category === 'Souveränität' && (
                  <span className="text-xs font-normal text-muted bg-card px-2 py-1 rounded border border-card-border">
                    Zusätzliche Optionen
                  </span>
                )}
              </h3>
              
              {category === 'Souveränität' && (
                <div className="mb-6 -mt-2 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-sm text-muted">
                    <span className="font-bold text-primary">Hinweis:</span> Mit 🔒 markierte Anforderungen wurden automatisch auf Basis deiner Angaben in den Entscheidungsbäumen oder Szenarien ausgewählt. Du kannst ihre Priorität anpassen, aber um sie zu deaktivieren, musst du deine Antworten zuvor ändern. Du kannst hier zusätzlich weitere Anforderungen manuell hinzufügen.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* Render Exclusive Groups */}
                {Object.entries(grouped).map(([groupId, groupReqs]) => {
                  const group = allGroups.find(g => g.id === groupId);
                  const isExclusive = group?.type === 'exclusive';
                  const borderColor = isExclusive ? 'border-warning/30' : 'border-blue-500/30';
                  const bgColor = isExclusive ? 'bg-warning/5' : 'bg-blue-500/5';
                  const textColor = isExclusive ? 'text-warning' : 'text-blue-500';
                  const label = isExclusive ? `Entweder / Oder: ${group?.name || groupId}` : `Mindestens 1 erforderlich: ${group?.name || groupId}`;

                  return (
                    <div key={groupId} className={`p-6 rounded-3xl border-2 ${borderColor} ${bgColor} relative`}>
                      <div className={`absolute -top-3 left-6 bg-background px-3 py-0.5 rounded-full border ${borderColor} text-xs font-bold uppercase ${textColor} tracking-widest shadow-sm`}>
                        {label}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        {groupReqs.map(req => renderReqCard(req))}
                      </div>
                    </div>
                  );
                })}

                {/* Render Non-Grouped Requirements */}
                {nonGrouped.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nonGrouped.map(req => renderReqCard(req))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </motion.div>
  )
}

function ProvenanceBadge({ prov }: { prov: Provenance }) {
  if (prov.source === 'tree') {
    const { treeTitle, resultTitle, level, questionName, questionText, optionLabel, businessValue, techRisk, notes } = prov.data
    return (
      <div className="mt-3 flex items-start gap-2 text-xs bg-primary/5 border border-primary/15 rounded-lg p-3">
        <GitBranch className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div>
            <span className="text-primary font-bold">{treeTitle}</span>
            <span className="text-muted"> → </span>
            <span className="text-foreground font-medium">{resultTitle}</span>
            {level !== undefined && (
              <span className="ml-1.5 text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px] font-mono">SEAL-{level}</span>
            )}
          </div>
          {questionText && (
            <div className="text-[11px] text-foreground/85 bg-background/70 p-2 rounded border border-primary/10 leading-relaxed">
              <span className="font-semibold text-primary/90">Frage{questionName ? ` (${questionName})` : ''}: </span>
              <span className="italic">„{questionText}“</span>
            </div>
          )}
          {optionLabel && (
            <div className="text-[11px] text-foreground/85 bg-background/70 p-2 rounded border border-primary/10 leading-relaxed">
              <span className="font-semibold text-primary/90">Gewählte Option: </span>
              <span className="font-medium text-foreground">„{optionLabel}“</span>
            </div>
          )}
          {(businessValue !== undefined && techRisk !== undefined) && (
            <div className="space-y-2 pt-0.5">
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">SR: {businessValue}/10</span>
                <span className="bg-danger/10 text-danger px-2 py-0.5 rounded">UR: {techRisk}/10</span>
                {notes && (
                  <span className="bg-muted/10 text-muted px-2 py-0.5 rounded italic max-w-xs truncate" title={notes}>
                    „{notes}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  if (prov.source === 'manual') {
    const { title, optionLabel } = prov.data;
    return (
      <div className="mt-3 flex items-start gap-2 text-xs bg-muted/5 border border-muted/20 rounded-lg p-3">
        <Target className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="text-muted font-bold">{title}</span>
          <span className="text-muted"> · </span>
          <span className="text-foreground font-medium">{optionLabel}</span>
        </div>
      </div>
    );
  }
  const { scenarioId, scenarioTopic, metricQuestion, optionLabel, optionDescription, businessValue, risk, notes } = prov.data
  return (
    <div className="mt-3 flex items-start gap-2 text-xs bg-success/5 border border-success/15 rounded-lg p-3">
      <Target className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div>
          <span className="text-success font-bold">{scenarioId}</span>
          <span className="text-muted"> · </span>
          <span className="text-muted">{scenarioTopic}</span>
          <span className="text-muted"> → Option: </span>
          <span className="text-foreground font-medium">{optionLabel}</span>
        </div>
        {metricQuestion && (
          <div className="text-[11px] text-foreground/85 bg-background/70 p-2 rounded border border-success/10 leading-relaxed">
            <span className="font-semibold text-success/90">Leitfrage: </span>
            <span className="italic">„{metricQuestion}“</span>
          </div>
        )}
        {optionDescription && (
          <div className="text-[11px] text-foreground/85 bg-background/70 p-2 rounded border border-success/10 leading-relaxed">
            <span className="font-semibold text-success/90">Beschreibung der Option: </span>
            <span className="italic text-foreground/80">„{optionDescription}“</span>
          </div>
        )}
        <div className="space-y-2 pt-0.5">
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">SR: {businessValue}/10</span>
            <span className="bg-danger/10 text-danger px-2 py-0.5 rounded">UR: {risk}/10</span>
            {notes && (
              <span className="bg-muted/10 text-muted px-2 py-0.5 rounded italic max-w-xs truncate" title={notes}>
                „{notes}"
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConflictMemberCard({ member, req, onResolve }: { member: any; req: any; onResolve: (keepId: string, comment: string, sr: number, ur: number) => void }) {
  const initialSr = member.provenance?.data?.businessValue ?? 5;
  const initialUr = member.provenance?.data?.techRisk ?? member.provenance?.data?.risk ?? 5;

  const [comment, setComment] = useState('');
  const [sr, setSr] = useState<number>(initialSr);
  const [ur, setUr] = useState<number>(initialUr);

  return (
    <div className="glass-card border border-card-border hover:border-primary/40 bg-card rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{getDisplayId(member.id)}</span>
          <span className={cn(
            "text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5",
            member.provenance.source === 'tree' 
              ? "bg-primary/10 text-primary border border-primary/20" 
              : "bg-success/10 text-success border border-success/20"
          )}>
            {member.provenance.source === 'tree' ? (
              <>
                <GitBranch className="w-3 h-3" />
                <span>Entscheidungsbaum</span>
              </>
            ) : (
              <>
                <Target className="w-3 h-3" />
                <span>Szenario</span>
              </>
            )}
          </span>
        </div>
        <h4 className="font-bold text-foreground text-base mb-1">{req?.name}</h4>
        <p className="text-xs text-muted mb-4 leading-relaxed line-clamp-3">{req?.description}</p>
        
        <div className="bg-background/80 border border-card-border rounded-xl p-3.5 space-y-1 mb-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted border-b border-card-border pb-1.5 mb-2">
            <GitBranch className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Herkunft & Auslöser dieser Anforderung</span>
          </div>
          <ProvenanceBadge prov={member.provenance} />
        </div>

        {/* SR & UR Sliders */}
        <div className="space-y-3 p-3 bg-muted/10 border border-card-border/60 rounded-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
            <span>Bewertung im Konfliktfall</span>
            <span className="text-[10px] text-primary font-semibold">Prio: {calculatePriority(sr, ur).toFixed(1)}/10</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Strategische Relevanz (SR)</span>
              <span className="font-bold text-primary">{sr}/10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={sr}
              onChange={(e) => setSr(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted/30 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Umsetzungsrisiko (UR)</span>
              <span className="font-bold text-danger">{ur}/10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={ur}
              onChange={(e) => setUr(Number(e.target.value))}
              className="w-full accent-danger h-1.5 bg-muted/30 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Optional Comment */}
        <div className="mt-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
            Begründung der Auswahl (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Warum wird diese Option bevorzugt und die andere verworfen?"
            rows={2}
            className="w-full text-xs p-2.5 rounded-lg bg-background border border-card-border focus:border-primary focus:outline-none resize-none text-foreground placeholder:text-muted/60"
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-card-border flex justify-end">
        <button 
          onClick={() => onResolve(member.id, comment, sr, ur)}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <Check className="w-4 h-4" />
          Diese Anforderung wählen
        </button>
      </div>
    </div>
  )
}

function ConflictCard({ conflict, allReqs, onResolve }: { conflict: { groupName: string; groupId: string; members: any[] }; allReqs: any[]; onResolve: (keepId: string, comment: string, sr: number, ur: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-danger/30 bg-danger/5 rounded-2xl overflow-hidden transition-all shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 bg-danger/10 hover:bg-danger/15 transition-colors flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-danger/20 rounded-lg shrink-0">
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <span className="text-sm font-bold text-danger uppercase tracking-wider text-left">
            Widersprüchliche Anforderungen: „{conflict.groupName}“
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-danger/80 font-medium">
            {isOpen ? 'Einklappen' : 'Lösen'}
          </span>
          <ChevronRight className={cn("w-4 h-4 text-danger transition-transform duration-200", isOpen ? "rotate-90" : "")} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 border-t border-danger/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conflict.members.map(member => {
                  const req = allReqs.find((r: any) => r.uid === member.id) as any
                  return (
                    <ConflictMemberCard
                      key={member.id}
                      member={member}
                      req={req}
                      onResolve={onResolve}
                    />
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
