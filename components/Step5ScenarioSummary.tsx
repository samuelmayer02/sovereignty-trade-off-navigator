'use client'
import { useStore, getDisplayId } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ListChecks, ChevronRight, AlertTriangle, Check, GitBranch, Target, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo, useState, useEffect } from 'react'

// -----------------------------------------------------------------------
// Types & Helpers (mirrored from Step3 for independence)
// -----------------------------------------------------------------------
import { getProvenance, type Provenance } from '@/lib/provenance'

// -----------------------------------------------------------------------
// ProvenanceBadge
// -----------------------------------------------------------------------
function ProvenanceBadge({ prov }: { prov: Provenance }) {
  const scenarioContexts = useStore(state => state.scenarioContexts);
  if (prov.source === 'manual') {
    const { title, optionLabel } = prov.data
    return (
      <div className="mt-3 flex items-start gap-2 text-xs bg-muted/5 border border-muted/20 rounded-lg p-3">
        <div className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5">✋</div>
        <div>
          <span className="text-foreground font-bold">{title}</span>
          <span className="text-muted"> → </span>
          <span className="text-foreground font-medium">{optionLabel}</span>
        </div>
      </div>
    )
  }
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
              <div className="text-[10px] text-muted font-mono bg-background/50 inline-block px-2 py-1 rounded border border-card-border">
                Prio = ({businessValue} × 10) / ({businessValue} + {techRisk || 1}) ≈ {Math.max(1, Math.min(10, Math.round(((businessValue * 10) / (businessValue + (techRisk || 0))) * 10) / 10))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
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
          <div className="text-[10px] text-muted font-mono bg-background/50 inline-block px-2 py-1 rounded border border-card-border">
            Prio = ({businessValue} × 10) / ({businessValue} + {risk || 1}) ≈ {Math.max(1, Math.min(10, Math.round(((businessValue * 10) / (businessValue + (risk || 0))) * 10) / 10))}
          </div>
        </div>
        {scenarioContexts[scenarioId] && (
          <div className="mt-3 text-xs bg-card border border-card-border p-2.5 rounded-lg text-foreground/90 flex items-start gap-2 shadow-sm">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted" />
            <span className="italic whitespace-pre-wrap">{scenarioContexts[scenarioId]}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface ConflictMember { id: string; provenance: Provenance }
export interface ConflictGroup { groupName: string; members: ConflictMember[] }

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------
export default function Step5ScenarioSummary() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    requirements: allReqs,
    decisionTrees: allTrees,
    scenarios: allScenarios,
    groups: allGroups,
    setStep,
    selectedScenarioReqs,
    selectedSovereigntyReqs,
    selectedRequirements,
    setScenarioReqPriority,
    removeSovereigntyReq,
    removeScenarioReq,
    forceToggleRequirement,
    scenarioResults,
    treeResults,
  } = useStore()

  const activeReqs = useMemo(() => {
    return allReqs.filter((r: any) => selectedScenarioReqs[r.uid] !== undefined)
  }, [allReqs, selectedScenarioReqs])

  const allLockedIds = useMemo(() => (
    [...new Set([...Object.keys(selectedScenarioReqs), ...Object.keys(selectedSovereigntyReqs), ...Object.keys(selectedRequirements || {})])]
  ), [selectedScenarioReqs, selectedSovereigntyReqs, selectedRequirements])

  // Detect exclusive conflicts across BOTH sources
  const conflicts: ConflictGroup[] = useMemo(() => {
    const groupMap: Record<string, ConflictMember[]> = {}

    allLockedIds.forEach(uid => {
      const req = allReqs.find((r: any) => r.uid === uid) as any
      if (!req?.groupId) return
      if (!groupMap[req.groupId]) groupMap[req.groupId] = []
      
      const prov = getProvenance(uid, treeResults, scenarioResults, allTrees, allScenarios, selectedRequirements && selectedRequirements[uid] !== undefined)
      if (prov) {
        groupMap[req.groupId].push({ id: uid, provenance: prov })
      } else {
        // Fallback provenance if search fails
        const isSov = selectedSovereigntyReqs[uid] !== undefined
        const isManual = selectedRequirements && selectedRequirements[uid] !== undefined
        
        groupMap[req.groupId].push({ 
          id: uid, 
          provenance: isSov 
            ? { source: 'tree', data: { treeId: 'unknown', treeTitle: 'Entscheidungsbaum', resultTitle: 'Aktivierte Anforderung' } }
            : isManual
              ? { source: 'manual', data: { title: 'Manuelle Auswahl', optionLabel: 'Manuell in der Seitenleiste oder Matrix aktiviert' } }
              : { source: 'scenario', data: { scenarioId: 'unknown', scenarioTopic: 'Szenario', optionLabel: 'Aktivierte Option', businessValue: 5, risk: 5, notes: '' } }
        })
      }
    })

    return Object.entries(groupMap)
      .filter(([groupId, members]) => {
        if (members.length <= 1) return false;
        const group = allGroups.find((g: any) => g.uid === groupId);
        return group?.type === 'exclusive';
      })
      .map(([groupName, members]) => ({ groupName, members }))
  }, [allLockedIds, selectedSovereigntyReqs, treeResults, scenarioResults, allReqs, allTrees, allScenarios, allGroups])

  const hasUnresolvedConflicts = conflicts.length > 0

  if (allReqs.length === 0 || allTrees.length === 0 || allScenarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Lade Zusammenfassung...</p>
        </div>
      </div>
    );
  }

  const resolveConflict = (keepId: string, members: ConflictMember[]) => {
    members.forEach(m => {
      if (m.id === keepId) return
      if (selectedSovereigntyReqs[m.id]) removeSovereigntyReq(m.id)
      if (selectedScenarioReqs[m.id]) removeScenarioReq(m.id)
      if (selectedRequirements && selectedRequirements[m.id]) forceToggleRequirement(m.id)
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <ListChecks className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Szenario-Ergebnis</h2>
        <p className="text-muted text-lg">
          Aus deinen Bewertungen der Architekturszenarien haben sich folgende harte Anforderungen ergeben.
        </p>
      </div>

      {/* CONFLICT SECTION */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-4">
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
                key={conflict.groupName}
                conflict={conflict}
                allReqs={allReqs}
                onResolve={(keepId) => resolveConflict(keepId, conflict.members)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS LIST */}
      <div className="space-y-4 mb-8">
        {activeReqs.length === 0 && conflicts.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted border border-card-border rounded-2xl">
            Du hast in den Szenarien keine Optionen gewählt, die spezifische Anforderungen triggern.
          </div>
        ) : (
          activeReqs.map((req: any) => {
            const priority = selectedScenarioReqs[req.uid] || 5
            const prov = getProvenance(req.uid, treeResults, scenarioResults, allTrees, allScenarios)
            return (
              <motion.div key={req.uid} layout className="glass-card border border-primary/30 bg-primary/5 p-6 rounded-2xl lift-effect" >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6" >
                  <div className="flex-1" >
                    <div className="flex items-center space-x-3 mb-2" >
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded" >{getDisplayId(req.uid)}</span>
                      <h3 className="text-lg font-bold text-foreground" >{req.name}</h3>
                    </div>
                    <p className="text-muted text-sm" >{req.description}</p>
                    {prov && <ProvenanceBadge prov={prov} />}
                  </div>
                  <div className="shrink-0 w-full md:w-48" >
                    <div className="flex justify-between items-center mb-2" >
                      <span className="text-xs font-medium text-muted uppercase tracking-wider" >Priorität</span>
                      <span className="text-sm font-bold text-primary">
                        {typeof priority === 'number' ? priority.toFixed(1) : priority} / 10
                      </span>
                    </div>
                    <input type="range" min="1" max="10" step="0.1" value={priority}
                      onChange={(e) => setScenarioReqPriority(req.uid, parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted mt-1 px-1" >
                      <span>Kann</span><span>Muss</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-card-border">
        <button onClick={() => setStep(4)} className="text-muted hover:text-foreground transition-colors px-4 py-2 text-sm font-medium whitespace-nowrap">
          Zurück zu den Szenarien
        </button>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
          {hasUnresolvedConflicts && (
            <span className="text-warning text-sm flex items-center gap-1.5 whitespace-nowrap">
              <AlertTriangle className="w-4 h-4" />Bitte Konflikte auflösen
            </span>
          )}
          <button onClick={() => setStep(6)} disabled={hasUnresolvedConflicts}
            className="bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold transition-all flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-sm">
            <span>Weiter zur Gesamtauswahl</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// -----------------------------------------------------------------------
// Conflict Card
// -----------------------------------------------------------------------
function ConflictCard({ conflict, allReqs, onResolve }: { conflict: ConflictGroup; allReqs: any[]; onResolve: (keepId: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-2 border-warning/40 bg-warning/5 rounded-2xl overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-warning/10 hover:bg-warning/20 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <span className="text-sm font-bold text-warning uppercase tracking-wider text-left">
            Widersprüchliche Anforderungen: „{conflict.groupName}“
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-warning/80 font-medium">
            {isOpen ? 'Details ausblenden' : 'Details & Auflösung anzeigen'}
          </span>
          <ChevronRight className={cn("w-4 h-4 text-warning transition-transform", isOpen ? "rotate-90" : "")} />
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
            <div className="p-5 border-t border-warning/20 space-y-4">
              <p className="text-sm text-muted mb-4">
                Diese Anforderungen stehen in einem direkten Widerspruch. Bitte wähle, welche Anforderung priorisiert (behalten) werden soll.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {conflict.members.map(member => {
                  const req = allReqs.find((r: any) => r.uid === member.id) as any
                  return (
                    <div key={member.id} className="glass border border-warning/30 bg-background/50 rounded-xl p-5 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{getDisplayId(member.id)}</span>
                            <span className={cn(
                              "text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5",
                              member.provenance.source === 'tree' ? "bg-primary/10 text-primary border border-primary/20" : 
                              member.provenance.source === 'manual' ? "bg-muted/10 text-foreground border border-muted/20" : 
                              "bg-success/10 text-success border border-success/20"
                            )}>
                              {member.provenance.source === 'tree' ? (
                                <>
                                  <GitBranch className="w-3.5 h-3.5" />
                                  <span>Aus Entscheidungsbaum</span>
                                </>
                              ) : member.provenance.source === 'manual' ? (
                                <>
                                  <ListChecks className="w-3.5 h-3.5" />
                                  <span>Manuelle Auswahl</span>
                                </>
                              ) : (
                                <>
                                  <Target className="w-3.5 h-3.5" />
                                  <span>Aus Szenario</span>
                                </>
                              )}
                            </span>
                          </div>
                          <h4 className="font-bold text-foreground text-base mb-1">{req?.name}</h4>
                          <p className="text-sm text-muted mb-4 leading-relaxed">{req?.description}</p>
                          
                          <div className="bg-background/80 border border-card-border rounded-xl p-3.5 space-y-1">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted border-b border-card-border pb-1.5 mb-2">
                              <GitBranch className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>Herkunft & Auslöser dieser Anforderung</span>
                            </div>
                            <ProvenanceBadge prov={member.provenance} />
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center justify-end">
                          <button onClick={() => onResolve(member.id)}
                            className="flex items-center gap-2 bg-warning hover:bg-warning/90 text-warning-foreground font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-warning/20 hover:shadow-warning/40 hover:-translate-y-0.5">
                            <Check className="w-5 h-5" />
                            Diese Option behalten
                          </button>
                        </div>
                      </div>
                    </div>
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
