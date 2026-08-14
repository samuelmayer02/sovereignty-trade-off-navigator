'use client'
import { useStore, getDisplayId } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ChevronRight, AlertTriangle, Check, GitBranch, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
import { getProvenance, type Provenance } from '@/lib/provenance'

// -----------------------------------------------------------------------
// ProvenanceBadge
// -----------------------------------------------------------------------
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
              <div className="text-[10px] text-muted font-mono bg-background/50 inline-block px-2 py-1 rounded border border-card-border">
                Prio = ({businessValue} × 10) / ({businessValue} + {techRisk || 1}) ≈ {Math.max(1, Math.min(10, Math.round(((businessValue * 10) / (businessValue + (techRisk || 0))) * 10) / 10))}
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
          <div className="text-[10px] text-muted font-mono bg-background/50 inline-block px-2 py-1 rounded border border-card-border">
            Prio = ({businessValue} × 10) / ({businessValue} + {risk || 1}) ≈ {Math.max(1, Math.min(10, Math.round(((businessValue * 10) / (businessValue + (risk || 0))) * 10) / 10))}
          </div>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface ConflictMember {
  id: string
  provenance: Provenance
}

export interface ConflictGroup {
  groupName: string
  members: ConflictMember[]
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------
export default function Step3SovereigntySummary() {
  const { 
    requirements: allReqs,
    groups: allGroups,
    decisionTrees: allTrees,
    scenarios: allScenarios,
    setStep,
    selectedSovereigntyReqs,
    selectedScenarioReqs,
    setSovereigntyPriority,
    removeSovereigntyReq,
    removeScenarioReq,
    scenarioResults,
    treeResults,
    sealProfile,
  } = useStore()

  const activeSovReqs = useMemo(() => 
    allReqs.filter((r: any) => selectedSovereigntyReqs[r.uid] !== undefined),
  [allReqs, selectedSovereigntyReqs]);

  const allLockedIds = useMemo(() => (
    [...new Set([...Object.keys(selectedSovereigntyReqs), ...Object.keys(selectedScenarioReqs)])]
  ), [selectedSovereigntyReqs, selectedScenarioReqs])

  // Detect exclusive conflicts across BOTH sources
  const conflicts: ConflictGroup[] = useMemo(() => {
    const groupMap: Record<string, ConflictMember[]> = {}

    allLockedIds.forEach(uid => {
      const req = allReqs.find((r: any) => r.uid === uid) as any
      if (!req?.groupId) return
      
      const group = allGroups.find((g: any) => g.id === req.groupId)
      if (!group || group.type !== 'exclusive') return

      if (!groupMap[req.groupId]) groupMap[req.groupId] = []
      
      const prov = getProvenance(uid, treeResults, scenarioResults, allTrees, allScenarios)
      if (prov) {
        groupMap[req.groupId].push({ id: uid, provenance: prov })
      } else {
        // Fallback provenance if search fails
        const isSov = selectedSovereigntyReqs[uid] !== undefined
        groupMap[req.groupId].push({ 
          id: uid, 
          provenance: isSov 
            ? { source: 'tree', data: { treeId: 'unknown', treeTitle: 'Entscheidungsbaum', resultTitle: 'Aktivierte Anforderung' } }
            : { source: 'scenario', data: { scenarioId: 'unknown', scenarioTopic: 'Szenario', optionLabel: 'Aktivierte Option', businessValue: 5, risk: 5, notes: '' } }
        })
      }
    })

    return Object.entries(groupMap)
      .filter(([, members]) => members.length > 1)
      .map(([groupName, members]) => ({ groupName, members }))
  }, [allLockedIds, selectedSovereigntyReqs, treeResults, scenarioResults, allReqs, allTrees, allScenarios])

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

  const hasUnresolvedConflicts = conflicts.length > 0

  const resolveConflict = (keepId: string, members: ConflictMember[]) => {
    members.forEach(m => {
      if (m.id === keepId) return
      if (m.provenance.source === 'tree') removeSovereigntyReq(m.id)
      else removeScenarioReq(m.id)
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">3D-SEAL Profil & Anforderungen</h2>
        <p className="text-muted text-lg mb-8">
          Basierend auf deinen Entscheidungen in den Bäumen ergibt sich folgendes Souveränitäts-Profil.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card border border-primary/20 bg-background/50 p-6 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">SEAL-J (Jurisdiktion)</h3>
            <div className="text-4xl font-black text-primary mb-2">{sealProfile?.J ?? 0}</div>
            <p className="text-xs text-muted">Legal, Datenresidenz & Eigentum</p>
          </div>
          <div className="glass-card border border-primary/20 bg-background/50 p-6 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">SEAL-T (Technologie)</h3>
            <div className="text-4xl font-black text-primary mb-2">{sealProfile?.T ?? 0}</div>
            <p className="text-xs text-muted">Architektur, Standards & Lock-in</p>
          </div>
          <div className="glass-card border border-primary/20 bg-background/50 p-6 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">SEAL-O (Betrieb)</h3>
            <div className="text-4xl font-black text-primary mb-2">{sealProfile?.O ?? 0}</div>
            <p className="text-xs text-muted">Support, Autarkie & Kontrolle</p>
          </div>
        </div>
      </div>

      {/* CONFLICT SECTION */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <div>
                <p className="font-bold text-warning text-sm">Entweder/Oder-Konflikte erkannt</p>
                <p className="text-muted text-xs mt-0.5">
                  Verschiedene Entscheidungspfade haben widersprüchliche Anforderungen aus derselben Exklusiv-Gruppe aktiviert.
                  Entscheide pro Gruppe, welche du behalten möchtest.
                </p>
              </div>
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
        {activeSovReqs.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted border border-card-border rounded-2xl">
            Keine spezifischen Souveränitäts-Anforderungen abgeleitet (SEAL-0).
          </div>
        ) : (
          activeSovReqs.map((req: any) => {
            const priority = selectedSovereigntyReqs[req.uid]
            const prov = getProvenance(req.uid, treeResults, scenarioResults, allTrees, allScenarios)
            return (
              <motion.div
                key={req.uid} layout
                className="glass-card border border-primary/30 bg-primary/5 p-6 rounded-2xl lift-effect"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">{getDisplayId(req.uid)}</span>
                      <h3 className="text-lg font-bold text-foreground">{req.name}</h3>
                    </div>
                    <p className="text-muted text-sm">{req.description}</p>
                    {prov && <ProvenanceBadge prov={prov} />}
                  </div>
                  <div className="shrink-0 w-full md:w-48">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-muted uppercase tracking-wider">Priorität</span>
                      <span className="text-sm font-bold text-primary">
                        {typeof priority === 'number' ? priority.toFixed(1) : priority} / 10
                      </span>
                    </div>
                    <input type="range" min="1" max="10" step="0.1" value={priority}
                      onChange={(e) => setSovereigntyPriority(req.uid, parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted mt-1 px-1">
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
        <button onClick={() => setStep(2)} className="text-muted hover:text-foreground transition-colors px-4 py-2 text-sm font-medium whitespace-nowrap">
          Zurück zu den Bäumen
        </button>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
          {hasUnresolvedConflicts && (
            <span className="text-warning text-sm flex items-center gap-1.5 whitespace-nowrap">
              <AlertTriangle className="w-4 h-4" />Bitte Konflikte auflösen
            </span>
          )}
          <button onClick={() => setStep(4)} disabled={hasUnresolvedConflicts}
            className="bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold transition-all flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-sm">
            <span>Weiter zu den Szenarien</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// -----------------------------------------------------------------------
// Conflict Card (Accordion Version)
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
            Konflikt in Gruppe: „{conflict.groupName}"
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
                              member.provenance.source === 'tree' ? "bg-primary/10 text-primary border border-primary/20" : "bg-success/10 text-success border border-success/20"
                            )}>
                              {member.provenance.source === 'tree' ? (
                                <>
                                  <GitBranch className="w-3.5 h-3.5" />
                                  <span>Aus Entscheidungsbaum</span>
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
                          
                          <div className="bg-background border border-card-border rounded-lg p-4">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Bewertungs-Details</h5>
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
