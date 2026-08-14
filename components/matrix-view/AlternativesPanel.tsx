import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useStore, getDisplayId } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { formatBoldText } from './formatBoldText';

export function AlternativesPanel({ primaryReqUid, targetId, getImpactOrConflict, title, onClose }: any) {
  const { requirements: allReqs, groups, forceToggleRequirement, forceSwapRequirement, selectedRequirements, selectedSovereigntyReqs, selectedScenarioReqs, decisionTrees, treeResults } = useStore();
  const [hoveredInfo, setHoveredInfo] = useState<{ 
    reqUid: string; 
    reqName: string; 
    reqDescription?: string; 
    status: string; 
    isEvaluated?: boolean; 
    text: string 
  } | null>(null);

  const req = allReqs.find((r: any) => r.uid === primaryReqUid);
  if (!req) return null;

  const group = req.groupId ? groups.find((g: any) => g.id === req.groupId) : null;
  const isExclusive = group?.type === 'exclusive';
  const isMultiple = group?.type === 'multi';
  const isAtLeastOne = group?.type === 'at-least-one';

  const groupMembers = group ? allReqs.filter((r: any) => r.groupId === req.groupId) : [req];

  const findTreeProv = (uid: string) => {
    for (const [treeId, result] of Object.entries(treeResults)) {
      if (!(result as any).referenced_requirements?.includes(uid)) continue
      const tree = decisionTrees.find(t => t.id === treeId)
      const resultNode = tree?.results?.[(result as any).resultNode]
      return { treeTitle: tree?.title ?? treeId, level: resultNode?.level }
    }
    return null;
  }

  const handleToggleMate = (mateUid: string, isExclusiveSwap: boolean, isCurrentlySelected: boolean) => {
    if (isExclusiveSwap) {
      // Warn if we are swapping away from a tree-provided requirement
      const isReqSov = selectedSovereigntyReqs[req.uid] !== undefined;
      const reqProv = isReqSov ? findTreeProv(req.uid) : null;
      if (isReqSov && reqProv) {
        if (!window.confirm(`Achtung: Die aktuelle Architektur-Option (${req.name}) ist maßgeblich für das Erreichen von SEAL-${reqProv.level} im Bereich "${reqProv.treeTitle}".\n\nEin Austausch bricht die Vorgabe des Entscheidungsbaums.\n\nMöchten Sie trotzdem fortfahren?`)) return;
      }
      forceSwapRequirement(req.uid, mateUid, 'matrix');
      if (onClose) onClose();
    } else {
      if (isCurrentlySelected) {
        // At-least-one check
        if (isAtLeastOne) {
          const activeCount = groupMembers.filter((m: any) =>
            selectedRequirements[m.uid] !== undefined ||
            selectedSovereigntyReqs[m.uid] !== undefined ||
            selectedScenarioReqs[m.uid] !== undefined
          ).length;
          if (activeCount <= 1) {
            alert("Diese Architektur-Option kann nicht deaktiviert werden, da mindestens eine Architektur-Option aus dieser Dimension aktiv bleiben muss.");
            return;
          }
        }
        // Warn if deactivating a tree-provided requirement
        const mateIsSov = selectedSovereigntyReqs[mateUid] !== undefined;
        const mateProv = mateIsSov ? findTreeProv(mateUid) : null;
        if (mateIsSov && mateProv) {
          if (!window.confirm(`Achtung: Diese Architektur-Option ist maßgeblich für das Erreichen von SEAL-${mateProv.level} im Bereich "${mateProv.treeTitle}".\n\nEin Deaktivieren bricht die Vorgabe des Entscheidungsbaums.\n\nMöchten Sie trotzdem fortfahren?`)) return;
        }
      }
      forceToggleRequirement(mateUid, 'matrix');
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="mb-4">
        {title && (
          <h4 className="text-sm font-bold text-foreground mb-2 leading-tight pr-4">
            {title}
          </h4>
        )}
        <div className="flex items-center gap-2 mb-1">
          <h5 className="text-xs font-bold text-muted uppercase tracking-wider">
            {isExclusive ? 'Exklusive Alternativen' : isMultiple ? 'Verwandte Optionen (Multi)' : 'Status der Architektur-Option'}
          </h5>
          {group && (
            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-primary/10 text-primary border border-primary/20 truncate max-w-[200px]" title={group.name}>
              {group.name}
            </span>
          )}
        </div>
        {isExclusive && (
          <p className="text-[10px] text-muted/80 leading-snug">
            Wechseln deaktiviert die Architektur-Option, die diesen Konflikt verursacht hat.
          </p>
        )}
        {isMultiple && (
          <p className="text-[10px] text-muted/80 leading-snug">
            Sie können mehrere Optionen dieser Dimension kombinieren oder einzeln abwählen.
          </p>
        )}
        {isAtLeastOne && (
          <p className="text-[10px] text-muted/80 leading-snug">
            Mindestens eine Option muss aktiv bleiben.
          </p>
        )}
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2 mb-3">
        {groupMembers.map((mate: any) => {
          const impact = getImpactOrConflict(mate.uid, targetId);
          const status = impact.status;
          const colorClass =
            status === 'red' ? 'bg-danger shadow-danger/20' :
              status === 'orange' ? 'bg-warning shadow-warning/20' :
                status === 'green' ? 'bg-success shadow-success/20' :
                  status === 'blue' ? 'bg-blue-500 shadow-blue-500/20' :
                    'bg-muted shadow-muted/20';

          const isSelected = selectedRequirements[mate.uid] !== undefined || selectedSovereigntyReqs[mate.uid] !== undefined || selectedScenarioReqs[mate.uid] !== undefined;
          const isPrimary = mate.uid === req.uid;

          const handleMouseEnter = () => {
            const isEvaluated =
              status !== 'gray' ||
              (impact.reasoning && impact.reasoning !== 'Noch nicht bewertet.') ||
              (impact.conflict_text && impact.conflict_text !== 'Dieses Paar wurde noch nicht bewertet.');
            setHoveredInfo({ 
              reqUid: mate.uid, 
              reqName: mate.name, 
              reqDescription: mate.description, 
              status, 
              isEvaluated, 
              text: impact.reasoning || impact.conflict_text 
            });
          };

          return (
            <div 
              key={mate.uid} 
              onMouseEnter={handleMouseEnter}
              onMouseLeave={() => setHoveredInfo(null)}
              className={cn("flex items-start justify-between space-x-3 p-2 rounded-lg border transition-colors group cursor-help",
                isPrimary ? "bg-primary/5 border-primary/30" : "bg-card/50 border-card-border/50 hover:border-primary/30"
              )}
            >
              <div className="flex items-start space-x-2 flex-1 min-w-0 pr-2">
                <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm", colorClass)} />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-primary/70">{getDisplayId(mate.uid)}</span>
                    {isPrimary && <span className="text-[9px] uppercase tracking-wider text-primary bg-primary/10 px-1 rounded">Matrix-Fokus</span>}
                  </div>
                  <span className="text-xs font-medium text-foreground line-clamp-2" title={mate.name}>{mate.name}</span>
                  {selectedSovereigntyReqs[mate.uid] !== undefined && (
                    <span className="text-[9px] text-warning/90 mt-0.5 leading-snug">SEAL Vorgabe</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <div className="cursor-help flex items-center justify-center p-1 text-muted group-hover:text-primary transition-colors">
                  <Info className="w-4 h-4" />
                </div>

                {isExclusive ? (
                  isSelected ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-success/10 text-success rounded font-bold">
                      Aktiv
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleMate(mate.uid, true, false)}
                      className="text-[10px] uppercase tracking-wider px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded font-bold transition-colors cursor-pointer"
                    >
                      Wechseln
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleToggleMate(mate.uid, false, isSelected)}
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold transition-colors cursor-pointer",
                      isSelected ? "bg-muted/20 hover:bg-danger/20 text-foreground hover:text-danger" : "bg-primary/10 hover:bg-primary/20 text-primary"
                    )}
                  >
                    {isSelected ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {hoveredInfo && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 w-full z-[150] pointer-events-none"
          >
            <div className="p-3.5 bg-background/95 backdrop-blur-md border border-card-border/80 rounded-2xl shadow-2xl ring-1 ring-primary/20 space-y-2.5">
              {/* Requirement Title & Description */}
              <div className="border-b border-card-border/40 pb-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                    {getDisplayId(hoveredInfo.reqUid)}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
                    Architektur-Option-Vorschau
                  </span>
                </div>
                <h5 className="text-xs font-bold text-foreground mb-1 leading-snug">
                  {hoveredInfo.reqName}
                </h5>
                {hoveredInfo.reqDescription ? (
                  <p className="text-[11px] text-foreground/90 leading-relaxed italic bg-card/60 p-2.5 rounded-xl border border-card-border/40 max-h-32 overflow-y-auto custom-scrollbar">
                    "{hoveredInfo.reqDescription}"
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Keine Detailbeschreibung vorhanden.
                  </p>
                )}
              </div>

              {/* Conflict Impact Foreshadowing */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Erwartete Auswirkung auf Konflikt:
                  </span>
                  <span className={cn(
                    "text-[9px] font-black uppercase px-1.5 py-0.2 rounded border shrink-0",
                    hoveredInfo.status === 'red' ? "bg-danger/20 text-danger border-danger/30" :
                    hoveredInfo.status === 'orange' ? "bg-warning/20 text-warning border-warning/30" :
                    hoveredInfo.status === 'green' ? "bg-success/20 text-success border-success/30" :
                    hoveredInfo.status === 'blue' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    "bg-muted/20 text-muted-foreground border-card-border"
                  )}>
                    {hoveredInfo.status === 'red' ? 'Harter Konflikt' :
                     hoveredInfo.status === 'orange' ? 'Dimensions-Konflikt' :
                     hoveredInfo.status === 'green' ? 'Synergie' :
                     hoveredInfo.status === 'blue' ? 'Abhängigkeit' :
                     'Neutral / Nicht bewertet'}
                  </span>
                </div>

                {hoveredInfo.text && (
                  <p className="text-[11px] text-foreground/80 leading-relaxed pt-0.5">
                    {formatBoldText(hoveredInfo.text)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
