import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info, X, Shield, ShieldCheck, Lightbulb, TrendingUp, AlertCircle,
  Scale, CheckCircle2, ChevronLeft, ChevronRight, Search, ShieldAlert,
  ArrowUpRight, Eye, Lock
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useStore, getDisplayId } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { isStaticMode } from '@/lib/api-client';
import { formatBoldText } from './formatBoldText';
import { MatrixCell } from './MatrixCell';
import { AlternativesPanel } from './AlternativesPanel';
import { TraceItem } from './TraceItem';

export function ReqMatrix({ activeReqs, effectiveCombined, handleSetPriority, isFullscreen, showOnlyGT }: any) {
  const {
    conflicts: allConflicts, groups, updateConflict, acceptedRisks,
    acceptRisk, revokeRisk, manualRequirementSources, decisionTrees,
    scenarios, treeResults, scenarioResults, scenarioContexts,
    selectedRequirements, isTourActive, currentTourStep,
    step: globalStep, conflictResolutions
  } = useStore();

  const reqMap = useMemo(() => {
    const map: Record<string, any> = {};
    activeReqs.forEach((r: any) => map[r.uid] = r);
    return map;
  }, [activeReqs]);

  const groupMap = useMemo(() => {
    const map: Record<string, any> = {};
    groups.forEach((g: any) => map[g.id] = g);
    return map;
  }, [groups]);

  const conflictMap = useMemo(() => {
    const map: Record<string, any> = {};
    allConflicts.forEach((c: any) => {
      const key1 = `${c.pair[0]}_${c.pair[1]}`;
      const key2 = `${c.pair[1]}_${c.pair[0]}`;
      map[key1] = c;
      map[key2] = c;
    });
    return map;
  }, [allConflicts]);

  const getConflict = useCallback((uidA: string, uidB: string) => {
    if (uidA === uidB) return { status: 'green', text: 'N/A', best_practice: '' }

    const reqA = reqMap[uidA];
    const reqB = reqMap[uidB];

    if (reqA?.groupId && reqA.groupId === reqB?.groupId) {
      const group = groupMap[reqA.groupId];
      if (group?.type === 'exclusive') {
        return {
          status: 'orange',
          conflict_text: '**Unaufgelöster Dimensions-Konflikt:** Diese beiden Architektur-Optionen gehören zur selben exklusiven Dimension und schließen sich definitionsgemäß gegenseitig aus.\n\nSie wurden noch nicht aufgelöst und sind daher beide fälschlicherweise aktiv.',
          best_practice: 'Klicke auf "Wechseln" bei der gewünschten Alternative, um den Konflikt aufzulösen.'
        }
      }
      return {
        status: 'blue',
        conflict_text: '**Dimensionszugehörigkeit:** Diese Architektur-Optionen gehören zur selben Dimension und sind miteinander kombinierbar.',
        best_practice: ''
      }
    }

    const found = conflictMap[`${uidA}_${uidB}`];
    return found || { status: 'gray', conflict_text: 'Dieses Paar wurde noch nicht bewertet.', best_practice: '' }
  }, [reqMap, groupMap, conflictMap]);

  const [hoveredCell, setHoveredCell] = useState<{ rowUid: string, rowName: string, colUid: string, colName: string, conflict: any } | null>(null)
  const [activeCell, setActiveCell] = useState<{ rowUid: string, rowName: string, colUid: string, colName: string, conflict: any } | null>(null)
  const [hoveredReq, setHoveredReq] = useState<any | null>(null)
  const [hoveredRowUid, setHoveredRowUid] = useState<string | null>(null)
  const [hoveredColUid, setHoveredColUid] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [conflictFilter, setConflictFilter] = useState<'all' | 'red' | 'orange'>('all')

  const handleCellMouseEnter = useCallback((rowReq: any, colReq: any, conflict: any) => {
    setHoveredCell({ rowUid: rowReq.uid, rowName: rowReq.name, colUid: colReq.uid, colName: colReq.name, conflict });
    setHoveredRowUid(rowReq.uid);
    setHoveredColUid(colReq.uid);
  }, []);

  const handleCellMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setHoveredRowUid(null);
    setHoveredColUid(null);
  }, []);

  const handleCellClick = useCallback((rowReq: any, colReq: any, conflict: any) => {
    setActiveCell(prev => {
       if (prev?.rowUid === rowReq.uid && prev?.colUid === colReq.uid) return null;
       return { rowUid: rowReq.uid, rowName: rowReq.name, colUid: colReq.uid, colName: colReq.name, conflict };
    });
  }, []);
  const [conflictSearch, setConflictSearch] = useState('')

  const conflictsList = useMemo(() => {
    const list: {
      id: string
      reqA: any
      reqB: any
      status: 'red' | 'orange'
      conflictText: string
      conflict: any
      isAccepted: boolean
    }[] = []

    for (let i = 0; i < activeReqs.length; i++) {
      for (let j = i + 1; j < activeReqs.length; j++) {
        const reqA = activeReqs[i]
        const reqB = activeReqs[j]
        const conflict = getConflict(reqA.uid, reqB.uid)

        if (conflict && (conflict.status === 'red' || conflict.status === 'orange')) {
          const riskKey = reqA.uid < reqB.uid ? `${reqA.uid}-${reqB.uid}` : `${reqB.uid}-${reqA.uid}`
          const isAccepted = !!acceptedRisks[riskKey]
          list.push({
            id: riskKey,
            reqA,
            reqB,
            status: conflict.status as 'red' | 'orange',
            conflictText: conflict.conflict_text || conflict.reasoning || '',
            conflict,
            isAccepted
          })
        }
      }
    }

    return list.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'red' ? -1 : 1
      }
      const labelA = `${a.reqA.name} ${a.reqB.name}`
      const labelB = `${b.reqA.name} ${b.reqB.name}`
      return labelA.localeCompare(labelB)
    })
  }, [activeReqs, getConflict, acceptedRisks])

  const filteredConflicts = useMemo(() => {
    return conflictsList.filter(item => {
      if (conflictFilter === 'red' && item.status !== 'red') return false
      if (conflictFilter === 'orange' && item.status !== 'orange') return false
      if (conflictSearch.trim()) {
        const query = conflictSearch.toLowerCase()
        const textA = (item.reqA.name + ' ' + getDisplayId(item.reqA.uid)).toLowerCase()
        const textB = (item.reqB.name + ' ' + getDisplayId(item.reqB.uid)).toLowerCase()
        const desc = (item.conflictText || '').toLowerCase()
        return textA.includes(query) || textB.includes(query) || desc.includes(query)
      }
      return true
    })
  }, [conflictsList, conflictFilter, conflictSearch])

  const redCount = useMemo(() => conflictsList.filter(c => c.status === 'red').length, [conflictsList])
  const orangeCount = useMemo(() => conflictsList.filter(c => c.status === 'orange').length, [conflictsList])

  const [editedText, setEditedText] = useState('')
  const [editedBP, setEditedBP] = useState('')
  const [isGT, setIsGT] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [riskRationale, setRiskRationale] = useState('')
  const activeRiskKey = activeCell ? (activeCell.rowUid < activeCell.colUid ? `${activeCell.rowUid}-${activeCell.colUid}` : `${activeCell.colUid}-${activeCell.rowUid}`) : null;
  const activeAcceptedRisk = activeRiskKey ? acceptedRisks[activeRiskKey] : null;

  const floatingTooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!hoveredCell) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (floatingTooltipRef.current) {
        floatingTooltipRef.current.style.transform = `translate3d(${e.clientX + 15}px, ${e.clientY + 15}px, 0)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hoveredCell]);

  const [viewedConflicts, setViewedConflicts] = useState<Record<string, boolean>>({})

  const activeConflictIndex = useMemo(() => {
    if (!activeCell || filteredConflicts.length === 0) return -1;
    return filteredConflicts.findIndex(item =>
      (item.reqA.uid === activeCell.rowUid && item.reqB.uid === activeCell.colUid) ||
      (item.reqA.uid === activeCell.colUid && item.reqB.uid === activeCell.rowUid)
    );
  }, [activeCell, filteredConflicts]);

  const handleNavigateConflict = useCallback((direction: 'prev' | 'next') => {
    if (activeConflictIndex === -1 || filteredConflicts.length === 0) return;
    const newIndex = direction === 'prev' ? activeConflictIndex - 1 : activeConflictIndex + 1;
    if (newIndex >= 0 && newIndex < filteredConflicts.length) {
      const item = filteredConflicts[newIndex];
      setActiveCell({
        rowUid: item.reqA.uid,
        rowName: item.reqA.name,
        colUid: item.reqB.uid,
        colName: item.reqB.name,
        conflict: item.conflict
      });
    }
  }, [activeConflictIndex, filteredConflicts]);

  useEffect(() => {
    if (activeCell) {
      setEditedText(activeCell.conflict.conflict_text || '')
      setEditedBP(activeCell.conflict.best_practice || '')
      setIsGT(activeCell.conflict.is_ground_truth || false)
      if (!activeAcceptedRisk) setRiskRationale('')

      const riskKey = activeCell.rowUid < activeCell.colUid ? `${activeCell.rowUid}-${activeCell.colUid}` : `${activeCell.colUid}-${activeCell.rowUid}`;
      setViewedConflicts(prev => prev[riskKey] ? prev : { ...prev, [riskKey]: true });

      setTimeout(() => {
        const el = document.querySelector(`[data-conflict-id="${riskKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [activeCell, activeAcceptedRisk])

  const tourOpenedCellRef = useRef<boolean>(false);

  // Tour Sync Effect for ReqMatrix
  useEffect(() => {
    if (isTourActive && globalStep === 7) {
      if ((currentTourStep >= 5 && currentTourStep <= 10) && !activeCell && activeReqs.length > 0) {
        let targetRow = activeReqs[0];
        let targetCol = activeReqs[1] || activeReqs[0];
        let targetConflict = getConflict(targetRow.uid, targetCol.uid);

        if (conflictsList.length > 0) {
          const topConflict = conflictsList[0];
          targetRow = topConflict.reqA;
          targetCol = topConflict.reqB;
          targetConflict = topConflict.conflict;
        }

        tourOpenedCellRef.current = true;
        setActiveCell({
          rowUid: targetRow.uid,
          rowName: targetRow.name,
          colUid: targetCol.uid,
          colName: targetCol.name,
          conflict: targetConflict
        });
      } else if ((currentTourStep < 5 || currentTourStep > 10) && activeCell && tourOpenedCellRef.current) {
        tourOpenedCellRef.current = false;
        setActiveCell(null);
      }

      if (currentTourStep === 10 && !isGT) {
        setIsGT(true);
      } else if (currentTourStep < 10 && isGT) {
        setIsGT(false);
      }
    } else if (!isTourActive && activeCell && tourOpenedCellRef.current) {
      tourOpenedCellRef.current = false;
      setActiveCell(null);
    }
  }, [isTourActive, globalStep, currentTourStep, activeReqs, activeCell, isGT, getConflict, conflictsList]);

  const handleSaveGT = async () => {
    if (!activeCell) return
    setIsSaving(true)
    await updateConflict(activeCell.rowUid, activeCell.colUid, {
      ...activeCell.conflict,
      conflict_text: editedText,
      best_practice: editedBP,
      is_ground_truth: isGT
    })
    setIsSaving(false)
    setActiveCell(prev => prev ? {
      ...prev,
      conflict: {
        ...prev.conflict,
        conflict_text: editedText,
        best_practice: editedBP,
        is_ground_truth: isGT
      }
    } : null)
  }

  const matrixCellSize = 44;
  const matrixAxisCardHeight = 76;
  const matrixInnerGap = 3;
  const matrixGroupGap = 4;
  const matrixRowLabelWidth = 135;
  const matrixLeftGutter = matrixRowLabelWidth + matrixGroupGap;

  const sortedReqs = useMemo(() => [...activeReqs].sort((a: any, b: any) => {
    const catA = a.category || 'Z_Other';
    const catB = b.category || 'Z_Other';
    if (catA < catB) return -1;
    if (catA > catB) return 1;
    return a.uid.localeCompare(b.uid);
  }), [activeReqs]);

  const sourcesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    activeReqs.forEach((r: any) => {
      const uid = r.uid;
      const sources: any[] = [];

      for (const [treeId, result] of Object.entries(treeResults)) {
        if ((result as any).referenced_requirements?.includes(uid)) {
          const tree = decisionTrees.find(t => t.id === treeId);
          const resultNode = tree?.results?.[(result as any).resultNode];

          let detailText = '';
          let optionTitle = '';
          if (tree && tree.nodes) {
            Object.values(tree.nodes).forEach((node: any) => {
              const opt = node.options?.find((o: any) => o.target === (result as any).resultNode);
              if (opt) {
                detailText = node.text;
                optionTitle = opt.label;
              }
            });
          }

          let totalBv = 0;
          let totalTr = 0;
          let count = 0;
          let comments: string[] = [];
          if ((result as any).evaluations) {
            Object.values((result as any).evaluations).forEach((evalData: any) => {
              if (evalData.businessValue !== undefined || evalData.techRisk !== undefined) {
                totalBv += evalData.businessValue || 0;
                totalTr += evalData.techRisk || 0;
                count++;
              }
              if (evalData.comment && evalData.comment.trim()) {
                comments.push(evalData.comment.trim());
              }
            });
          }
          const businessValue = count > 0 ? Math.round(totalBv / count) : undefined;
          const techRisk = count > 0 ? Math.round(totalTr / count) : undefined;
          const notes = comments.join(' | ');

          sources.push({
            type: 'tree',
            name: tree?.title || treeId,
            level: resultNode?.level,
            detailText,
            optionTitle,
            businessValue,
            techRisk,
            notes
          });
        }
      }

      for (const [scenarioId, result] of Object.entries(scenarioResults)) {
        if ((result as any).triggeredReqs?.includes(uid)) {
          const scenario = scenarios.find(s => s.scenario_id === scenarioId || s.id === scenarioId);
          let detailText = scenario?.stimulus || '';
          let optionTitle = '';
          let optionDescription = '';
          if (scenario && result && typeof (result as any).optionIndex === 'number') {
            const opt = scenario.options[(result as any).optionIndex];
            if (opt) {
              optionTitle = opt.label;
              optionDescription = opt.description;
            }
          }
          const ctx = (scenarioContexts as any)?.[scenarioId] || '';
          const businessValue = (result as any).businessValue;
          const risk = (result as any).risk;
          const notes = (result as any).notes || '';
          sources.push({ 
            type: 'scenario', 
            name: scenario ? `${scenarioId}: ${scenario.topic}` : scenarioId, 
            detailText,
            optionTitle,
            optionDescription,
            context: ctx,
            businessValue,
            risk,
            notes
          });
        }
      }

      if (conflictResolutions) {
        Object.values(conflictResolutions).forEach((res: any) => {
          if (res.keepId === uid) {
            const rejectedNames = res.rejectedIds?.map((id: string) => getDisplayId(id)).join(', ');
            sources.push({
              type: 'conflict_resolution',
              name: `Konfliktauflösung: „${res.groupName}“`,
              detailText: `Entscheidung in Dimension „${res.groupName}“. Bevorzugt: ${getDisplayId(res.keepId)}` + (rejectedNames ? `, Verworfen: ${rejectedNames}` : ''),
              businessValue: res.sr,
              techRisk: res.ur,
              notes: res.comment || ''
            });
          }
        });
      }

      if (selectedRequirements[uid] !== undefined) {
        const manualSource = manualRequirementSources[uid];
        if (manualSource === 'matrix') {
          sources.push({ type: 'manual', name: 'Manuell aufgelöst (Matrix Konflikt)', detailText: 'Durch das Beheben eines Matrix-Konflikts aktiviert.' });
        } else if (sources.length === 0) {
          sources.push({ type: 'manual', name: 'Manuell ausgewählt (Step 6)', detailText: 'In der detaillierten Architektur-Optionen-Liste manuell vom Nutzer ausgewählt.' });
        }
      }
      map[uid] = sources;
    });
    return map;
  }, [activeReqs, treeResults, decisionTrees, scenarioResults, scenarios, selectedRequirements, manualRequirementSources, scenarioContexts, conflictResolutions]);

  const getSourcesForReq = useCallback((uid: string) => {
    return sourcesMap[uid] || [];
  }, [sourcesMap]);

  const tooltip = (
    <AnimatePresence>
      {activeCell && (
        <motion.div
          key="active-panel"
          data-tour="tour-step7-conflict-resolver"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel rounded-2xl w-full max-w-6xl pointer-events-auto shadow-2xl ring-2 ring-primary/20 max-h-[85vh] flex flex-col md:flex-row overflow-hidden",
            isTourActive ? "z-[99990]" : "z-[100000]"
          )}
        >
          {/* Mobile close button */}
          <button
            onClick={() => setActiveCell(null)}
            className="md:hidden absolute top-4 right-4 text-muted hover:text-foreground p-1 rounded-md transition-colors z-50 bg-background/50 backdrop-blur"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT COLUMN: Context & Information */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-md z-20 px-6 md:px-8 pt-6 md:pt-8 pb-5 border-b border-card-border/30">
              <div className="flex items-start space-x-4">
                <Info className={`w-8 h-8 shrink-0 ${activeCell.conflict.status === 'red' ? 'text-danger' :
                  activeCell.conflict.status === 'orange' ? 'text-warning' :
                    activeCell.conflict.status === 'green' ? 'text-success' :
                      activeCell.conflict.status === 'gray' ? 'text-muted' :
                        'text-blue-500'
                  }`} />
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      activeCell.conflict.status === 'gray' ? "bg-muted/20 text-muted" : "bg-primary/20 text-primary"
                    )}>
                      {activeCell.conflict.status === 'gray' ? 'Nicht Bewertet' : 'Bewertet'}
                    </span>

                    {/* GT Toggle inside Tooltip */}
                    {activeCell.conflict.status !== 'gray' && (
                      <div data-tour="tour-step7-ground-truth-toggle" className="flex items-center space-x-3 bg-card px-3 py-1 rounded-lg border border-card-border/50">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", !isGT ? "text-primary" : "text-muted")}>AI Best Guess</span>
                        <button
                          type="button"
                          onClick={() => setIsGT(!isGT)}
                          className={cn(
                            "relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            isGT ? "bg-success" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              isGT ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", isGT ? "text-success" : "text-muted")}>Ground Truth</span>
                      </div>
                    )}
                  </div>

                  <h4 className="text-xl md:text-2xl text-foreground font-bold leading-tight">
                    <span className="opacity-70 text-sm block mb-1 font-medium tracking-wide uppercase">
                      {activeCell.conflict.status === 'green' ? 'Synergie' :
                        activeCell.conflict.status === 'blue' ? 'Neutral' :
                          activeCell.conflict.status === 'gray' ? 'Konfliktpotenzial' : 'Konflikt'}
                    </span>
                    {activeCell.rowName} <span className="text-muted/50 mx-2">vs</span> {activeCell.colName}
                  </h4>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 md:p-8 pt-6">
              <div className="mb-8">
                {isGT ? (
                  <div data-tour="tour-step7-ground-truth-editor" className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">Beschreibung</label>
                      <textarea
                        value={editedText}
                        onChange={e => setEditedText(e.target.value)}
                        disabled={isStaticMode}
                        className="w-full min-h-[160px] bg-background border border-card-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y disabled:opacity-75"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">Best Practice / Lösung</label>
                      <textarea
                        value={editedBP}
                        onChange={e => setEditedBP(e.target.value)}
                        disabled={isStaticMode}
                        className="w-full min-h-[120px] bg-background border border-card-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y disabled:opacity-75"
                      />
                    </div>
                    {isStaticMode && (
                      <p className="text-xs text-warning bg-warning/10 border border-warning/20 p-2.5 rounded-lg">
                        Hinweis: Im statischen Demo-Deployment (GitHub Pages) ist das Speichern von Ground-Truth-Daten deaktiviert.
                      </p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveGT}
                        disabled={isSaving || isStaticMode}
                        title={isStaticMode ? "Im Demo-Modus deaktiviert" : undefined}
                        className={cn(
                          "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5",
                          isStaticMode
                            ? "bg-muted/20 text-muted border border-card-border cursor-not-allowed opacity-75"
                            : "bg-success text-white hover:bg-success/90"
                        )}
                      >
                        {isStaticMode ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Schreibgeschützt</span>
                          </>
                        ) : (
                          <span>{isSaving ? 'Speichert...' : 'Verifizieren & Speichern'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/5 rounded-xl p-5 border border-card-border">
                    <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {formatBoldText(activeCell.conflict.conflict_text)}
                    </p>
                    {activeCell.conflict.best_practice && (
                      <div className="mt-4 pt-4 border-t border-card-border/50">
                        <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/20 mb-2">
                          <span className="uppercase tracking-wider font-bold">
                            Best Practice:
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{activeCell.conflict.best_practice}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-card-border/50">
                <h5 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Herkunft / Traceability
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-background rounded-xl p-4 border border-card-border shadow-sm">
                    <h6 className="text-sm font-bold text-foreground mb-3 truncate" title={activeCell.rowName}>{activeCell.rowName}</h6>
                    <ul className="space-y-2">
                      {getSourcesForReq(activeCell.rowUid).map((source, i) => (
                        <TraceItem key={i} source={source} />
                      ))}
                      {getSourcesForReq(activeCell.rowUid).length === 0 && (
                        <li className="text-xs text-muted italic flex items-center gap-2 p-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                          Keine Quelle bekannt
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-card-border shadow-sm">
                    <h6 className="text-sm font-bold text-foreground mb-3 truncate" title={activeCell.colName}>{activeCell.colName}</h6>
                    <ul className="space-y-2">
                      {getSourcesForReq(activeCell.colUid).map((source, i) => (
                        <TraceItem key={i} source={source} />
                      ))}
                      {getSourcesForReq(activeCell.colUid).length === 0 && (
                        <li className="text-xs text-muted italic flex items-center gap-2 p-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                          Keine Quelle bekannt
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Actions & Resolution */}
          <div className="w-full md:w-[420px] lg:w-[480px] shrink-0 bg-card/80 border-t md:border-t-0 md:border-l border-card-border overflow-y-auto custom-scrollbar relative flex flex-col">

            {/* Navigation & Close Header (Sticky / Floating) */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-md z-30 px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-card-border/30 flex items-center justify-between gap-2 shadow-xs shrink-0">
              {filteredConflicts.length > 0 && activeConflictIndex !== -1 ? (
                <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur border border-card-border px-2.5 py-1 rounded-xl shadow-xs">
                  <button
                    type="button"
                    disabled={activeConflictIndex <= 0}
                    onClick={() => handleNavigateConflict('prev')}
                    className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-muted/20 disabled:opacity-20 disabled:pointer-events-none transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                    title="Vorheriger Konflikt"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Vorheriger</span>
                  </button>

                  <span className="text-[10px] font-bold text-foreground px-2 border-x border-card-border/60">
                    {activeConflictIndex + 1} / {filteredConflicts.length}
                  </span>

                  <button
                    type="button"
                    disabled={activeConflictIndex >= filteredConflicts.length - 1}
                    onClick={() => handleNavigateConflict('next')}
                    className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-muted/20 disabled:opacity-20 disabled:pointer-events-none transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                    title="Nächster Konflikt"
                  >
                    <span>Nächster</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : <div />}

              <button
                onClick={() => setActiveCell(null)}
                className="text-muted hover:text-foreground p-1.5 rounded-full transition-colors bg-background/50 border border-card-border hover:bg-background shadow-sm cursor-pointer shrink-0"
                title="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 md:p-8 pt-6 flex-1">
              <div className="mb-12">
              <h5 className="text-sm font-bold text-foreground text-center uppercase tracking-wider text-muted mb-8">Prioritäten ausbalancieren</h5>
              
              <div className="relative pt-12 pb-6 px-2">
                
                {/* Scale Stand (Fulcrum) */}
                <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[24px] border-r-[24px] border-b-[220px] border-l-transparent border-r-transparent border-b-muted/10 pointer-events-none -z-10"></div>
                <div className="absolute top-[260px] left-1/2 -translate-x-1/2 w-40 h-6 bg-muted/10 rounded-[100%] pointer-events-none -z-10 blur-[4px]"></div>

                {/* The Scale Beam */}
                <div 
                  className="absolute top-[48px] left-1/2 -translate-x-1/2 w-[85%] h-3 bg-gradient-to-r from-muted/40 via-primary/60 to-muted/40 rounded-full transition-transform duration-700 ease-out origin-center shadow-sm"
                  style={{ transform: `rotate(${((effectiveCombined[activeCell.colUid] || 5) - (effectiveCombined[activeCell.rowUid] || 5)) * 1.5}deg)` }}
                >
                   {/* Center Pin */}
                   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-card rounded-full border-4 border-primary shadow-md"></div>
                </div>
                
                <div className="relative flex justify-between items-start gap-4 z-10">
                  
                  {/* Left Pan (Row) */}
                  <div 
                    className="w-1/2 flex flex-col items-center transition-transform duration-700 ease-out"
                    style={{ transform: `translateY(${((effectiveCombined[activeCell.rowUid] || 5) - (effectiveCombined[activeCell.colUid] || 5)) * 4}px)` }}
                  >
                    {/* Hanger Strings */}
                    <div className="flex gap-10 mb-[-6px]">
                      <div className="w-[2px] h-10 bg-gradient-to-b from-primary/40 to-transparent"></div>
                      <div className="w-[2px] h-10 bg-gradient-to-b from-primary/40 to-transparent"></div>
                    </div>
                    
                    <div className="w-full bg-background rounded-2xl border-2 border-primary/20 shadow-xl p-4 relative overflow-hidden group hover:border-primary/40 transition-colors">
                      <div className="relative z-10 flex flex-col mb-4">
                        <span className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1 text-center w-full block">Option A</span>
                        <span className="font-bold text-foreground line-clamp-2 text-center" title={activeCell.rowName}>{activeCell.rowName}</span>
                      </div>
                      
                      <div className="relative z-10 flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted">Priorität</span>
                        <span className="font-black text-primary text-lg bg-primary/10 px-3 py-0.5 rounded-lg">
                          {typeof (effectiveCombined[activeCell.rowUid] || 5) === 'number'
                            ? (effectiveCombined[activeCell.rowUid] || 5).toFixed(1)
                            : (effectiveCombined[activeCell.rowUid] || 5)}
                        </span>
                      </div>
                      
                      <div className="relative z-10 pt-2">
                        <input
                          type="range" min="1" max="10" step="0.1"
                          value={effectiveCombined[activeCell.rowUid] || 5}
                          onChange={(e) => handleSetPriority(activeCell.rowUid, parseFloat(e.target.value))}
                          className="w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer transition-all bg-muted/10 shadow-inner"
                          style={{
                            background: `linear-gradient(to right, hsl(var(--primary)) ${((effectiveCombined[activeCell.rowUid] || 5) - 1) * 11.11}%, transparent ${((effectiveCombined[activeCell.rowUid] || 5) - 1) * 11.11}%)`
                          }}
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1.5 px-1 font-medium">
                          <span>Kann</span>
                          <span>Muss</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Pan (Col) */}
                  <div 
                    className="w-1/2 flex flex-col items-center transition-transform duration-700 ease-out"
                    style={{ transform: `translateY(${((effectiveCombined[activeCell.colUid] || 5) - (effectiveCombined[activeCell.rowUid] || 5)) * 4}px)` }}
                  >
                    {/* Hanger Strings */}
                    <div className="flex gap-10 mb-[-6px]">
                      <div className="w-[2px] h-10 bg-gradient-to-b from-primary/40 to-transparent"></div>
                      <div className="w-[2px] h-10 bg-gradient-to-b from-primary/40 to-transparent"></div>
                    </div>
                    
                    <div className="w-full bg-background rounded-2xl border-2 border-primary/20 shadow-xl p-4 relative overflow-hidden group hover:border-primary/40 transition-colors">
                      <div className="relative z-10 flex flex-col mb-4">
                        <span className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1 text-center w-full block">Option B</span>
                        <span className="font-bold text-foreground line-clamp-2 text-center" title={activeCell.colName}>{activeCell.colName}</span>
                      </div>
                      
                      <div className="relative z-10 flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted">Priorität</span>
                        <span className="font-black text-primary text-lg bg-primary/10 px-3 py-0.5 rounded-lg">
                          {typeof (effectiveCombined[activeCell.colUid] || 5) === 'number'
                            ? (effectiveCombined[activeCell.colUid] || 5).toFixed(1)
                            : (effectiveCombined[activeCell.colUid] || 5)}
                        </span>
                      </div>
                      
                      <div className="relative z-10 pt-2">
                        <input
                          type="range" min="1" max="10" step="0.1"
                          value={effectiveCombined[activeCell.colUid] || 5}
                          onChange={(e) => handleSetPriority(activeCell.colUid, parseFloat(e.target.value))}
                          className="w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer transition-all bg-muted/10 shadow-inner"
                          style={{
                            background: `linear-gradient(to right, hsl(var(--primary)) ${((effectiveCombined[activeCell.colUid] || 5) - 1) * 11.11}%, transparent ${((effectiveCombined[activeCell.colUid] || 5) - 1) * 11.11}%)`
                          }}
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1.5 px-1 font-medium">
                          <span>Kann</span>
                          <span>Muss</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-card-border/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner border border-primary/20">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-foreground tracking-tight">Konflikt-Resolver</h5>
                  <p className="text-xs text-muted">Aktionsbereich</p>
                </div>
              </div>

              {activeAcceptedRisk ? (
                <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/30 rounded-xl p-5 relative overflow-hidden shadow-sm">
                  <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none transform -rotate-12">
                    <ShieldCheck className="w-32 h-32 text-success" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0 border border-success/30">
                        <ShieldCheck className="w-4 h-4 text-success" />
                      </div>
                      <h6 className="text-sm font-bold text-success">Akzeptiertes Risiko</h6>
                    </div>

                    <div className="bg-background/80 rounded-lg p-3 border border-success/10 mb-4 text-sm text-foreground/90 leading-relaxed font-medium">
                      {activeAcceptedRisk.rationale}
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-muted font-mono uppercase tracking-wider text-right">Erfasst: {new Date(activeAcceptedRisk.timestamp).toLocaleString()}</span>
                      <button
                        onClick={() => revokeRisk(activeCell.rowUid, activeCell.colUid)}
                        className="w-full py-2 bg-background border border-card-border hover:border-danger/50 hover:bg-danger/5 hover:text-danger text-xs font-bold text-muted-foreground rounded-lg transition-all"
                      >
                        Akzeptanz widerrufen
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const prioA = effectiveCombined[activeCell.rowUid] || 5;
                    const prioB = effectiveCombined[activeCell.colUid] || 5;
                    const diff = Math.abs(prioA - prioB);
                    
                    let recTitle = "Smart Recommendation";
                    let recText = "";
                    let recIcon = <Lightbulb className="w-4 h-4 text-primary" />;
                    let containerClass = "bg-primary/5 border-primary/20 text-primary";
                    let textClass = "text-foreground/80";

                    if (diff >= 2) {
                      const higherReq = prioA > prioB ? activeCell.rowName : activeCell.colName;
                      const lowerReq = prioA > prioB ? activeCell.colName : activeCell.rowName;
                      const higherPrio = prioA > prioB ? prioA : prioB;
                      const lowerPrio = prioA > prioB ? prioB : prioA;
                      recTitle = "Klare Empfehlung";
                      recText = `Dein Profil priorisiert "${higherReq}" (Prio: ${typeof higherPrio === 'number' ? higherPrio.toFixed(1) : higherPrio}) deutlich höher als "${lowerReq}" (Prio: ${typeof lowerPrio === 'number' ? lowerPrio.toFixed(1) : lowerPrio}). Es wird daher dringend empfohlen, die Architektur-Option "${higherReq}" aktiv zu lassen und für "${lowerReq}" eine Alternative zu wählen.`;
                      recIcon = <TrendingUp className="w-5 h-5 text-success" />;
                      containerClass = "bg-success/10 border-success/30 text-success-foreground";
                      textClass = "text-foreground/90 font-medium";
                    } else if (diff > 0) {
                      const higherReq = prioA > prioB ? activeCell.rowName : activeCell.colName;
                      const lowerReq = prioA > prioB ? activeCell.colName : activeCell.rowName;
                      recTitle = "Leichte Tendenz";
                      recText = `Die Priorität von "${higherReq}" (${typeof prioA === 'number' ? prioA.toFixed(1) : prioA}) ist leicht höher als bei "${lowerReq}" (${typeof prioB === 'number' ? prioB.toFixed(1) : prioB}). Du könntest in Erwägung ziehen, "${higherReq}" beizubehalten, solltest aber die Reibungspunkte sorgfältig abwägen.`;
                      recIcon = <AlertCircle className="w-5 h-5 text-warning" />;
                      containerClass = "bg-warning/10 border-warning/30 text-warning-foreground";
                      textClass = "text-foreground/80";
                    } else {
                      recTitle = "Patt-Situation (Gleiche Priorität)";
                      recText = `Beide Architektur-Optionen haben dieselbe Priorität (${typeof prioA === 'number' ? prioA.toFixed(1) : prioA}). Es gibt keine datengetriebene Präferenz. Entscheide basierend auf den detaillierten Konflikt-Details links oder akzeptiere das Risiko.`;
                      recIcon = <Scale className="w-5 h-5 text-muted-foreground" />;
                      containerClass = "bg-muted/10 border-muted/30 text-muted-foreground";
                      textClass = "text-foreground/80";
                    }

                    return (
                      <div data-tour="tour-step7-smart-recommendation" className={`rounded-xl border p-4 mb-4 ${containerClass}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          {recIcon}
                          <h5 className="font-bold text-sm tracking-wide">{recTitle}</h5>
                        </div>
                        <p className={`text-sm leading-relaxed ${textClass}`}>
                          {recText}
                        </p>
                      </div>
                    );
                  })()}
                  <div className="bg-background p-4 rounded-xl border border-card-border shadow-sm hover:border-primary/30 transition-colors" data-tour="tour-step7-alternatives">
                    <AlternativesPanel
                      title={`Option A: ${activeCell.rowName} abändern`}
                      primaryReqUid={activeCell.rowUid}
                      targetId={activeCell.colUid}
                      getImpactOrConflict={getConflict}
                      onClose={() => setActiveCell(null)}
                    />
                  </div>
                  <div className="bg-background p-4 rounded-xl border border-card-border shadow-sm hover:border-primary/30 transition-colors">
                    <AlternativesPanel
                      title={`Option B: ${activeCell.colName} abändern`}
                      primaryReqUid={activeCell.colUid}
                      targetId={activeCell.rowUid}
                      getImpactOrConflict={getConflict}
                      onClose={() => setActiveCell(null)}
                    />
                  </div>

                  {(activeCell.conflict.status === 'red' || activeCell.conflict.status === 'orange' || activeCell.conflict.status === 'gray') && (
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 mt-6 transition-all hover:bg-warning/10" data-tour="tour-step7-risk-accept">
                      <h6 className="text-sm font-bold text-warning mb-2 flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Option C: Risiko akzeptieren</span>
                      </h6>
                      <p className="text-xs text-foreground/70 mb-3 leading-relaxed">
                        Deklarieren Sie diesen Konflikt manuell als "akzeptiertes Risiko".
                      </p>
                      <textarea
                        value={riskRationale}
                        onChange={e => setRiskRationale(e.target.value)}
                        placeholder="Begründung für die Akzeptanz..."
                        className="w-full min-h-[80px] bg-background border border-warning/20 rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-warning/50 resize-y mb-3"
                      />
                      <button
                        onClick={() => {
                          if (riskRationale.trim()) {
                            acceptRisk(activeCell.rowUid, activeCell.colUid, riskRationale.trim());
                          }
                        }}
                        disabled={!riskRationale.trim()}
                        className="w-full py-2 bg-warning text-warning-foreground text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-warning/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Risiko akzeptieren
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </motion.div>
      )}

      {hoveredReq && (
        <motion.div
          key="req-tooltip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel p-6 rounded-2xl w-full max-w-lg z-[100000] pointer-events-none"
        >
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 mt-1 shrink-0 text-primary" />
            <div>
              <h4 className="text-foreground font-bold mb-1">
                {hoveredReq.name}
              </h4>
              <div className="text-xs font-mono text-primary/80 mb-3">
                {getDisplayId(hoveredReq.uid)} {hoveredReq.groupId ? `| Dimension: ${hoveredReq.groupId}` : ''}
              </div>
              <p className="text-sm text-muted leading-relaxed">
                {hoveredReq.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {hoveredCell && (
        <div
          ref={floatingTooltipRef}
          className="fixed top-0 left-0 glass-panel px-4 py-2 rounded-full z-[110] pointer-events-none shadow-xl border border-primary/20 flex items-center space-x-2 whitespace-nowrap"
          style={{ transform: 'translate3d(-9999px, -9999px, 0)' }}
        >
          <div className={`w-2 h-2 rounded-full ${hoveredCell.conflict.status === 'red' ? 'bg-danger' :
            hoveredCell.conflict.status === 'orange' ? 'bg-warning' :
              hoveredCell.conflict.status === 'blue' ? 'bg-blue-500' :
                'bg-muted'
            }`} />
          <span className="text-[11px] font-bold text-foreground">
            {hoveredCell.rowName} vs. {hoveredCell.colName}
          </span>
        </div>
      )}
    </AnimatePresence>
  );

  const reqsByCategory = useMemo(() => {
    const grouped: { category: string, reqs: any[] }[] = [];
    let currentCat = '';
    let currentReqs: any[] = [];

    sortedReqs.forEach((req: any) => {
      const cat = req.category || 'Andere';
      if (cat !== currentCat) {
        if (currentReqs.length > 0) {
          grouped.push({ category: currentCat, reqs: currentReqs });
        }
        currentCat = cat;
        currentReqs = [];
      }
      currentReqs.push(req);
    });
    if (currentReqs.length > 0) {
      grouped.push({ category: currentCat, reqs: currentReqs });
    }
    return grouped;
  }, [sortedReqs]);

  const reqIndices = useMemo(() => {
    const map: Record<string, number> = {};
    sortedReqs.forEach((req: any, index: number) => {
      map[req.uid] = index;
    });
    return map;
  }, [sortedReqs]);

  return (
    <div
      data-tour="tour-step7-req-matrix-overview"
      className="relative w-full h-full max-h-full flex flex-row overflow-hidden"
    >
      {/* LEFT CONFLICT SIDEBAR MENU (Slim & Dense) */}
      <motion.aside
        data-tour="tour-step7-sidebar"
        initial={false}
        animate={{ width: isSidebarOpen ? 250 : 36 }}
        className="h-full shrink-0 border-r border-card-border/50 bg-card/80 backdrop-blur-md flex flex-col transition-all duration-300 z-30 relative shadow-md overflow-hidden"
      >
        {isSidebarOpen ? (
          <div className="flex flex-col h-full w-[250px] max-w-full">
            {/* Header */}
            <div className="p-2.5 border-b border-card-border/40 flex items-center justify-between bg-background/80">
              <div className="flex items-center space-x-1.5 min-w-0">
                <ShieldAlert className="w-3.5 h-3.5 text-warning shrink-0" />
                <h3 className="font-bold text-xs text-foreground truncate">Konflikte</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/30 shrink-0">
                  {conflictsList.length}
                </span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                {redCount > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-danger text-white shadow-xs" title={`${redCount} kritische Konflikte (Rot)`}>
                    {redCount} Rot
                  </span>
                )}
                {orangeCount > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-warning text-black shadow-xs" title={`${orangeCount} Warnungen (Orange)`}>
                    {orangeCount} Orange
                  </span>
                )}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 hover:bg-card rounded text-muted hover:text-foreground transition-colors ml-0.5 cursor-pointer"
                  title="Menü einklappen"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="p-2 border-b border-card-border/30 bg-background/50 space-y-1.5">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={conflictSearch}
                  onChange={(e) => setConflictSearch(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full pl-7 pr-6 py-1 text-[11px] bg-background/90 border border-card-border/60 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted/60"
                />
                {conflictSearch && (
                  <button
                    onClick={() => setConflictSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-[10px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Tabs (High Contrast) */}
              <div className="flex items-center gap-1 p-0.5 bg-background/80 rounded-md border border-card-border/40 text-[9px] font-semibold">
                <button
                  onClick={() => setConflictFilter('all')}
                  className={cn(
                    "flex-1 py-0.5 rounded transition-all text-center cursor-pointer",
                    conflictFilter === 'all'
                      ? "bg-card text-foreground shadow-xs font-black border border-card-border"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  Alle ({conflictsList.length})
                </button>
                <button
                  onClick={() => setConflictFilter('red')}
                  className={cn(
                    "flex-1 py-0.5 rounded transition-all text-center cursor-pointer",
                    conflictFilter === 'red'
                      ? "bg-danger text-white font-black shadow-xs border border-danger"
                      : "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30"
                  )}
                >
                  Rot ({redCount})
                </button>
                <button
                  onClick={() => setConflictFilter('orange')}
                  className={cn(
                    "flex-1 py-0.5 rounded transition-all text-center cursor-pointer",
                    conflictFilter === 'orange'
                      ? "bg-warning text-black font-black shadow-xs border border-warning"
                      : "bg-warning/10 text-warning hover:bg-warning/20 border border-warning/30"
                  )}
                >
                  Orange ({orangeCount})
                </button>
              </div>
            </div>

            {/* List of Conflict Cards (High-Contrast Red & Orange Cards) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {filteredConflicts.length === 0 ? (
                <div className="text-center py-6 px-2 text-muted space-y-1">
                  <ShieldCheck className="w-6 h-6 mx-auto text-success/60 opacity-80" />
                  <p className="text-[11px] font-medium text-foreground/80">
                    {conflictsList.length === 0
                      ? "Keine ungelösten Konflikte!"
                      : "Keine Treffer."}
                  </p>
                </div>
              ) : (
                filteredConflicts.map((item) => {
                  const isActive = activeCell && (
                    (activeCell.rowUid === item.reqA.uid && activeCell.colUid === item.reqB.uid) ||
                    (activeCell.rowUid === item.reqB.uid && activeCell.colUid === item.reqA.uid)
                  );

                  return (
                    <div
                      key={item.id}
                      data-conflict-id={item.id}
                      onClick={() => {
                        setActiveCell({
                          rowUid: item.reqA.uid,
                          rowName: item.reqA.name,
                          colUid: item.reqB.uid,
                          colName: item.reqB.name,
                          conflict: item.conflict
                        });
                      }}
                      className={cn(
                        "group relative rounded-lg p-2 border transition-all duration-150 cursor-pointer text-left flex flex-col justify-between shadow-xs",
                        isActive
                          ? "border-primary bg-primary/20 ring-2 ring-primary/60 shadow-md"
                          : item.status === 'red'
                          ? "border-l-4 border-l-danger border-danger/40 bg-danger/15 hover:bg-danger/25"
                          : "border-l-4 border-l-warning border-warning/40 bg-warning/15 hover:bg-warning/25"
                      )}
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={cn(
                            "w-2 h-2 rounded-full shrink-0 border border-white/30",
                            item.status === 'red'
                              ? "bg-danger shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                              : "bg-warning shadow-[0_0_6px_rgba(245,158,11,0.7)]"
                          )} />
                          <span className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 tracking-wider",
                            item.status === 'red'
                              ? "bg-danger text-white"
                              : "bg-warning text-black"
                          )}>
                            {item.status === 'red' ? 'ROT' : 'ORANGE'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {viewedConflicts[item.id] && (
                            <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 flex items-center gap-0.5 shrink-0" title="Dieser Konflikt wurde bereits geöffnet/geprüft">
                              <Eye className="w-2.5 h-2.5" />
                              Geprüft
                            </span>
                          )}
                          {item.isAccepted ? (
                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-success text-white shrink-0">
                              Akzeptiert
                            </span>
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* 2-Zeiliges Reqs Paar: Oben Anforderung 1, Unten Anforderung 2 */}
                      <div className="space-y-1 my-0.5">
                        {/* Zeile 1: Anforderung A */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={cn(
                            "font-mono text-[8px] font-bold shrink-0 px-1 py-0.2 rounded border",
                            item.status === 'red'
                              ? "bg-danger/25 text-danger border-danger/40"
                              : "bg-warning/25 text-warning border-warning/40"
                          )}>
                            {getDisplayId(item.reqA.uid)}
                          </span>
                          <span className="text-[10px] font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                            {item.reqA.name}
                          </span>
                        </div>

                        {/* Zeile 2: Anforderung B */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={cn(
                            "font-mono text-[8px] font-bold shrink-0 px-1 py-0.2 rounded border",
                            item.status === 'red'
                              ? "bg-danger/25 text-danger border-danger/40"
                              : "bg-warning/25 text-warning border-warning/40"
                          )}>
                            {getDisplayId(item.reqB.uid)}
                          </span>
                          <span className="text-[10px] font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                            {item.reqB.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Bar (Minimalist with Vibrant Red/Orange Circles) */
          <div className="flex flex-col items-center py-3 h-full w-[36px] justify-between bg-card/90">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded-lg hover:bg-card text-muted hover:text-foreground transition-all flex flex-col items-center gap-1.5 group cursor-pointer"
              title="Konflikt-Menü öffnen"
            >
              <div className="relative p-1.5 rounded-lg bg-warning/20 text-warning border border-warning/40 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
                {conflictsList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-danger text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {conflictsList.length}
                  </span>
                )}
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-foreground transition-colors" />
            </button>

            <div className="flex flex-col items-center gap-1.5 my-auto">
              {redCount > 0 && (
                <div
                  onClick={() => { setConflictFilter('red'); setIsSidebarOpen(true); }}
                  className="w-6 h-6 rounded-full bg-danger text-white border border-danger font-black text-[9px] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xs"
                  title={`${redCount} kritische Konflikte (Rot)`}
                >
                  {redCount}
                </div>
              )}
              {orangeCount > 0 && (
                <div
                  onClick={() => { setConflictFilter('orange'); setIsSidebarOpen(true); }}
                  className="w-6 h-6 rounded-full bg-warning text-black border border-warning font-black text-[9px] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xs"
                  title={`${orangeCount} Warnungen (Orange)`}
                >
                  {orangeCount}
                </div>
              )}
            </div>

            <div className="text-[8px] font-bold text-muted uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 opacity-60 select-none">
              Konflikte ({conflictsList.length})
            </div>
          </div>
        )}
      </motion.aside>

      {/* RIGHT MAIN MATRIX DISPLAY (Maximized Screen Area) */}
      <div
        className="flex-1 h-full max-h-full overflow-auto pb-64 pr-3 custom-scrollbar matrix-grid relative"
        data-hover-row={hoveredRowUid || ''}
        data-hover-col={hoveredColUid || ''}
      >
        {/* Pure CSS Dynamic Crosshair Highlight Injector */}
        {hoveredRowUid && (
          <style>{`
            [data-row-uid="${hoveredRowUid}"]:not(.cell-active):not(.cell-hovered) {
              filter: brightness(1.15);
              border-color: rgba(255, 255, 255, 0.25);
            }
            [data-row-uid="${hoveredRowUid}"][data-status="gray"]:not(.cell-active):not(.cell-hovered) {
              background-color: rgba(120, 120, 120, 0.25);
            }
            [data-row-uid="${hoveredRowUid}"][data-below="true"]:not(.cell-active):not(.cell-hovered) {
              opacity: 0.35 !important;
              filter: grayscale(20%) !important;
            }
          `}</style>
        )}
        {hoveredColUid && (
          <style>{`
            [data-col-uid="${hoveredColUid}"]:not(.cell-active):not(.cell-hovered) {
              filter: brightness(1.15);
              border-color: rgba(255, 255, 255, 0.25);
            }
            [data-col-uid="${hoveredColUid}"][data-status="gray"]:not(.cell-active):not(.cell-hovered) {
              background-color: rgba(120, 120, 120, 0.25);
            }
            [data-col-uid="${hoveredColUid}"][data-below="true"]:not(.cell-active):not(.cell-hovered) {
              opacity: 0.35 !important;
              filter: grayscale(20%) !important;
            }
          `}</style>
        )}

        <div className="w-max mx-auto flex flex-col">
          {/* X Axis Labels */}
          <div className="flex w-full sticky top-0 z-30 pt-3 pb-2 items-end">
            {/* Fading Background */}
            <div className="absolute inset-0 bg-background/95 backdrop-blur-md -z-10 [mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]" />

            <div
              className="shrink-0 sticky left-0 z-40 bg-transparent flex justify-end items-end"
              style={{ width: matrixLeftGutter }}
            >
              {/* Empty space above row headers */}
            </div>

            <div className="flex" style={{ gap: matrixGroupGap }}>
              {reqsByCategory.map((group) => (
                <div
                  key={`cat-group-${group.category}`}
                  className="flex min-w-0 flex-col"
                  style={{
                    width: (group.reqs.length * matrixCellSize) + ((group.reqs.length - 1) * matrixInnerGap)
                  }}
                >
                  <div
                    className="mb-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-b-2 border-primary/25 pb-0.5 text-[9px] font-black uppercase tracking-wider text-primary/80"
                    title={group.category}
                  >
                    {group.category}
                  </div>
                  <div className="flex" style={{ gap: matrixInnerGap }}>
                    {group.reqs.map((req) => {
                      const isHovered = hoveredColUid === req.uid;
                      return (
                        <div
                          key={`x-${req.uid}`}
                          className={cn(
                            "flex shrink-0 cursor-help flex-col overflow-hidden rounded-lg border border-card-border/60 bg-card p-1.5 shadow-xs transition-all duration-150",
                            isHovered ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                          )}
                          style={{ width: matrixCellSize, height: matrixAxisCardHeight }}
                          onMouseEnter={() => setHoveredReq(req)}
                          onMouseLeave={() => setHoveredReq(null)}
                        >
                          <div className={cn("mb-0.5 text-[8px] font-mono transition-colors", isHovered ? "text-primary font-bold" : "text-primary/55")}>
                            {getDisplayId(req.uid)}
                          </div>
                          <div className={cn(
                            "overflow-hidden break-words text-[8px] font-medium leading-[1.1] transition-colors line-clamp-3",
                            isHovered ? "text-primary" : "text-foreground/80"
                          )}>
                            {req.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows with Horizontal Category Section Headers */}
          <div className="flex w-full flex-col pt-1 relative" style={{ gap: matrixGroupGap * 2 }}>
            {/* Y Axis Fading Background */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div
                className="sticky left-0 h-full bg-background/95 backdrop-blur-md"
                style={{
                  width: matrixLeftGutter + 16,
                  maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
                }}
              />
            </div>
            {reqsByCategory.map((rowGroup, rowGrpIdx) => (
              <div key={`row-group-${rowGroup.category}`} className="relative flex w-full flex-col">
                {/* Readable Horizontal Category Section Bar */}
                <div className="sticky left-0 z-20 w-max min-w-full flex items-center gap-1.5 py-0.5 px-2 bg-primary/10 border-l-3 border-primary rounded-md text-[9px] font-black uppercase tracking-wider text-primary mb-1">
                  <span>{rowGroup.category}</span>
                  <span className="text-[8px] font-mono text-muted/70">({rowGroup.reqs.length})</span>
                </div>

                {/* Rows Content */}
                <div className="flex flex-col flex-1" style={{ gap: matrixInnerGap }}>
                  {rowGroup.reqs.map((rowReq, rIdx) => {
                    const isRowHovered = hoveredRowUid === rowReq.uid;
                    return (
                      <div key={`row-${rowReq.uid}`} className="flex items-center" style={{ gap: matrixGroupGap }}>
                        {/* Row Header Label */}
                        <div
                          className={cn(
                            "shrink-0 sticky left-0 z-20 flex flex-col justify-between overflow-hidden rounded-lg border border-card-border/60 bg-card p-1.5 shadow-xs transition-all duration-150 cursor-help",
                            isRowHovered ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                          )}
                          style={{ width: matrixRowLabelWidth, height: matrixCellSize }}
                          onMouseEnter={() => setHoveredReq(rowReq)}
                          onMouseLeave={() => setHoveredReq(null)}
                        >
                          <div className={cn("text-[8px] font-mono transition-colors", isRowHovered ? "text-primary font-bold" : "text-primary/55")}>
                            {getDisplayId(rowReq.uid)}
                          </div>
                          <div className={cn("overflow-hidden break-words text-[9px] font-medium leading-[1.1] transition-colors line-clamp-2", isRowHovered ? "text-primary" : "text-foreground/80")}>
                            {rowReq.name}
                          </div>
                        </div>

                        <div className="flex" style={{ gap: matrixGroupGap }}>
                          {reqsByCategory.map((colGroup) => (
                            <div key={`cell-group-${rowReq.uid}-${colGroup.category}`} className="flex" style={{ gap: matrixInnerGap }}>
                              {colGroup.reqs.map((colReq) => {
                                const isSelf = rowReq.uid === colReq.uid
                                const conflict = getConflict(rowReq.uid, colReq.uid)

                                const isActive = activeCell?.rowUid === rowReq.uid && activeCell?.colUid === colReq.uid
                                const isExactlyHovered = hoveredCell?.rowUid === rowReq.uid && hoveredCell?.colUid === colReq.uid

                                const cellRiskKey = rowReq.uid < colReq.uid ? `${rowReq.uid}-${colReq.uid}` : `${colReq.uid}-${rowReq.uid}`;
                                const isAccepted = !!acceptedRisks[cellRiskKey];

                                const rowIdx = reqIndices[rowReq.uid] ?? 0;
                                const colIdx = reqIndices[colReq.uid] ?? 0;
                                const isBelowDiagonal = rowIdx > colIdx;

                                return (
                                  <MatrixCell
                                    key={`cell-${rowReq.uid}-${colReq.uid}`}
                                    rowReq={rowReq}
                                    colReq={colReq}
                                    conflict={conflict}
                                    isSelf={isSelf}
                                    isBelowDiagonal={isBelowDiagonal}
                                    isActive={isActive}
                                    isExactlyHovered={isExactlyHovered}
                                    isAccepted={isAccepted}
                                    showOnlyGT={showOnlyGT}
                                    matrixCellSize={matrixCellSize}
                                    onMouseEnter={handleCellMouseEnter}
                                    onMouseLeave={handleCellMouseLeave}
                                    onClick={handleCellClick}
                                    dataTour={rowGrpIdx === 0 && rIdx === 0 ? 'tour-step7-matrix-cell' : undefined}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {mounted && createPortal(tooltip, isFullscreen ? (document.fullscreenElement || document.body) : document.body)}
    </div>
  );
}
