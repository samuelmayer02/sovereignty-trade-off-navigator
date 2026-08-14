import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Lock } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useStore, getDisplayId } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { isStaticMode } from '@/lib/api-client';
import { HeatmapCell } from './HeatmapCell';
import { AlternativesPanel } from './AlternativesPanel';

export function CategoryHeatmap({ activeReqs, effectiveCombined, handleSetPriority, isFullscreen, showOnlyGT }: any) {
  const { categories, categoryImpacts, updateCategoryImpact, isTourActive, currentTourStep, step: globalStep } = useStore()

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

  const impactMap = useMemo(() => {
    const map: Record<string, any> = {};
    categoryImpacts.forEach((i: any) => {
      map[`${i.requirement_id}_${i.category_name}`] = i;
    });
    return map;
  }, [categoryImpacts]);

  const getImpact = useCallback((reqUid: string, catName: string) => {
    const found = impactMap[`${reqUid}_${catName}`];
    return found || { status: 'gray', reasoning: 'Noch nicht bewertet.' }
  }, [impactMap]);

  const [hoveredCell, setHoveredCell] = useState<{ reqUid: string, reqName: string, catName: string, impact: any } | null>(null)
  const [activeCell, setActiveCell] = useState<{ reqUid: string, catName: string, reqName: string, impact: any, conflict?: any } | null>(null)
  const [hoveredReq, setHoveredReq] = useState<any | null>(null)
  const [hoveredRowUid, setHoveredRowUid] = useState<string | null>(null)
  const [hoveredColName, setHoveredColName] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [editedReasoning, setEditedReasoning] = useState('')
  const [isGT, setIsGT] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleCellMouseEnter = useCallback((rowReq: any, cat: any, impact: any) => {
    setHoveredCell({ reqUid: rowReq.uid, reqName: rowReq.name, catName: cat.name, impact });
    setHoveredRowUid(rowReq.uid);
    setHoveredColName(cat.name);
  }, []);

  const handleCellMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setHoveredRowUid(null);
    setHoveredColName(null);
  }, []);

  const handleCellClick = useCallback((rowReq: any, cat: any, impact: any) => {
    setActiveCell(prev => {
      if (prev?.reqUid === rowReq.uid && prev?.catName === cat.name) return null;
      return { reqUid: rowReq.uid, reqName: rowReq.name, catName: cat.name, impact };
    });
  }, []);

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

  useEffect(() => {
    if (activeCell) {
      setEditedReasoning(activeCell.impact.reasoning || '')
      setIsGT(activeCell.impact.is_ground_truth || false)
    }
  }, [activeCell])

  const handleSaveGT = async () => {
    if (!activeCell) return
    setIsSaving(true)
    await updateCategoryImpact(activeCell.reqUid, activeCell.catName, {
      ...activeCell.impact,
      reasoning: editedReasoning,
      is_ground_truth: isGT
    })
    setIsSaving(false)
    setActiveCell(prev => prev ? {
      ...prev,
      impact: {
        ...prev.impact,
        reasoning: editedReasoning,
        is_ground_truth: isGT
      }
    } : null)
  }

  // Tour Sync Effect
  useEffect(() => {
    if (isTourActive && globalStep === 7) {
      if (currentTourStep === 2 && !activeCell && activeReqs.length > 0 && categories.length > 0) {
        let targetReq = activeReqs[0];
        let targetCat = categories[0];
        let targetImpact = getImpact(targetReq.uid, targetCat.name);

        let found = false;
        for (const req of activeReqs) {
          for (const cat of categories) {
            const imp = getImpact(req.uid, cat.name);
            if (imp.status === 'red') {
              targetReq = req;
              targetCat = cat;
              targetImpact = imp;
              found = true;
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          for (const req of activeReqs) {
            for (const cat of categories) {
              const imp = getImpact(req.uid, cat.name);
              if (imp.status === 'orange') {
                targetReq = req;
                targetCat = cat;
                targetImpact = imp;
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }

        setActiveCell({
          reqUid: targetReq.uid,
          catName: targetCat.name,
          reqName: targetReq.name,
          impact: targetImpact,
        });
      } else if (currentTourStep !== 2 && activeCell) {
        setActiveCell(null);
      }
    }
  }, [isTourActive, globalStep, currentTourStep, activeReqs, categories, activeCell, getImpact]);

  if (activeReqs.length === 0 || categories.length === 0) return null;

  const tooltip = (
    <AnimatePresence>
      {activeCell && (
        <motion.div
          key="active-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel p-6 rounded-2xl w-full max-w-[900px] z-[100000] pointer-events-auto shadow-2xl ring-2 ring-primary/20 max-h-[85vh] overflow-y-auto custom-scrollbar"
        >
          <button
            onClick={() => setActiveCell(null)}
            className="absolute top-4 right-4 text-muted hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start space-x-3">
            <Info className={`w-6 h-6 mt-1 shrink-0 ${activeCell.impact.status === 'red' ? 'text-danger' :
              activeCell.impact.status === 'orange' ? 'text-warning' :
                activeCell.impact.status === 'green' ? 'text-success' :
                  'text-muted'
              }`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 pr-10">
                {(() => {
                  const isEvaluated = activeCell.impact.status !== 'gray' || (activeCell.impact.reasoning && activeCell.impact.reasoning !== 'Noch nicht bewertet.');
                  return (
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      !isEvaluated ? "bg-muted/20 text-muted border border-muted/30" : "bg-primary/20 text-primary border border-primary/30"
                    )}>
                      {!isEvaluated ? 'Nicht Bewertet' : 'Bewertet'}
                    </span>
                  );
                })()}

                {/* GT Toggle inside Tooltip */}
                {activeCell.impact.status !== 'gray' && (
                  <div className="flex items-center space-x-3 ml-auto bg-card px-3 py-1.5 rounded-lg border border-card-border/50">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", !isGT ? "text-primary" : "text-muted")}>AI Best Guess</span>
                    <button
                      type="button"
                      onClick={() => setIsGT(!isGT)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        isGT ? "bg-success" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          isGT ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", isGT ? "text-success" : "text-muted")}>Ground Truth</span>
                  </div>
                )}
              </div>
              <h4 className="text-foreground font-bold mb-2 pr-6">
                Auswirkung: {activeCell.reqName} vs. {activeCell.catName}
              </h4>

              {isGT ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">Begründung</label>
                    <textarea
                      value={editedReasoning}
                      onChange={e => setEditedReasoning(e.target.value)}
                      disabled={isStaticMode}
                      className="w-full min-h-[160px] bg-background border border-card-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y disabled:opacity-75"
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
                        "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5",
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
                <p className="text-sm text-muted mb-4 leading-relaxed whitespace-pre-wrap">
                  {activeCell.impact.reasoning}
                </p>
              )}

              <div className="mt-2 pt-4 border-t border-card-border mb-4">
                <h5 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Priorität anpassen</h5>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate pr-2 max-w-[200px]">{activeCell.reqName}</span>
                    <span className="font-bold text-primary">
                      {typeof (effectiveCombined[activeCell.reqUid] || 5) === 'number'
                        ? (effectiveCombined[activeCell.reqUid] || 5).toFixed(1)
                        : (effectiveCombined[activeCell.reqUid] || 5)} / 10
                    </span>
                  </div>
                  <input
                    type="range" min="1" max="10" step="0.1"
                    value={effectiveCombined[activeCell.reqUid] || 5}
                    onChange={(e) => handleSetPriority(activeCell.reqUid, parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-muted/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1 px-0.5 font-medium">
                    <span>Kann</span>
                    <span>Muss</span>
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-2xl border border-card-border shadow-sm hover:shadow-md transition-shadow">
                <AlternativesPanel
                  primaryReqUid={activeCell.reqUid}
                  targetId={activeCell.catName}
                  getImpactOrConflict={getImpact}
                  onClose={() => setActiveCell(null)}
                />
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
          <div className={`w-2 h-2 rounded-full ${hoveredCell.impact.status === 'red' ? 'bg-danger' :
            hoveredCell.impact.status === 'orange' ? 'bg-warning' :
              hoveredCell.impact.status === 'green' ? 'bg-success' :
                'bg-muted'
            }`} />
          <span className="text-[11px] font-bold text-foreground">
            {hoveredCell.reqName} vs. {hoveredCell.catName}
          </span>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className="heatmap-grid relative w-full h-full max-h-full overflow-auto pb-64 pr-3 custom-scrollbar"
      data-hover-row={hoveredRowUid || ''}
      data-hover-col={hoveredColName || ''}
    >
      {hoveredRowUid && (
        <style>{`
          [data-row-uid="${hoveredRowUid}"]:not(.cell-active):not(.cell-hovered) {
            filter: brightness(1.15);
            border-color: rgba(255, 255, 255, 0.25);
          }
        `}</style>
      )}
      {hoveredColName && (
        <style>{`
          [data-col-name="${CSS.escape ? CSS.escape(hoveredColName) : hoveredColName}"]:not(.cell-active):not(.cell-hovered) {
            filter: brightness(1.15);
            border-color: rgba(255, 255, 255, 0.25);
          }
        `}</style>
      )}

      <div className="w-max mx-auto flex flex-col">
        {/* X Axis Labels (Categories) */}
        <div className="flex w-full sticky top-0 z-30 pt-3 pb-2 items-end">
          {/* Fading Background */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-md -z-10 [mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]" />

          <div
            className="shrink-0 sticky left-0 z-40 bg-transparent flex justify-end items-end"
            style={{ width: matrixLeftGutter }}
          >
            {/* Empty space above row headers */}
          </div>

          <div className="flex flex-col" style={{ width: (categories.length * matrixCellSize) + ((categories.length - 1) * matrixInnerGap) }}>
            <div
              data-tour="tour-step7-heatmap"
              className="mb-1.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-b-2 border-primary/25 pb-1 text-[9px] font-black uppercase tracking-wider text-primary/80"
            >
              Architektur-Kategorien
            </div>
            <div className="flex" style={{ gap: matrixInnerGap }}>
              {categories.map((cat: any) => {
                const isHovered = hoveredColName === cat.name;
                return (
                  <div
                    key={`x-${cat.name}`}
                    className={cn(
                      "flex shrink-0 cursor-help flex-col overflow-hidden rounded-lg border border-card-border/60 bg-card p-2 shadow-sm transition-all duration-200",
                      isHovered ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                    )}
                    style={{ width: matrixCellSize, height: matrixAxisCardHeight }}
                  >
                    <div className={cn("mb-1 text-[8px] font-mono transition-colors", isHovered ? "text-primary font-bold" : "text-primary/55")}>
                      {cat.prefix || 'CAT'}
                    </div>
                    <div className={cn(
                      "overflow-hidden break-words text-[9px] font-medium leading-[1.15] transition-colors",
                      isHovered ? "text-primary" : "text-foreground/80"
                    )}>
                      {cat.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid Rows */}
        <div className="flex w-full flex-col pt-1 relative" style={{ gap: matrixGroupGap }}>
          {/* Y Axis Fading Background */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div
              className="sticky left-0 h-full bg-background/95 backdrop-blur-md"
              style={{
                width: matrixLeftGutter + 24,
                maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
              }}
            />
          </div>
          {reqsByCategory.map((rowGroup, rowGrpIdx) => (
            <div key={`row-group-${rowGroup.category}`} className="relative flex w-full flex-col mb-1">
              {/* Readable Horizontal Category Section Bar */}
              <div className="sticky left-0 z-20 w-max min-w-full flex items-center gap-1.5 py-0.5 px-2 bg-primary/10 border-l-3 border-primary rounded-md text-[9px] font-black uppercase tracking-wider text-primary mb-1">
                <span>{rowGroup.category}</span>
                <span className="text-[8px] font-mono text-muted/70">({rowGroup.reqs.length})</span>
              </div>

              <div className="flex w-full flex-col" style={{ gap: matrixInnerGap }}>
                {rowGroup.reqs.map((rowReq: any, rIdx: number) => {
                  const isRowHovered = hoveredRowUid === rowReq.uid;
                  return (
                    <div
                      key={`row-${rowReq.uid}`}
                      className="group/row flex w-full items-start"
                      style={{ gap: matrixGroupGap, height: matrixCellSize, contentVisibility: 'auto', containIntrinsicSize: `${matrixCellSize}px` }}
                    >
                      <div
                        className={cn(
                          "sticky left-0 z-20 flex shrink-0 cursor-help flex-col justify-between overflow-hidden rounded-lg border border-card-border/60 bg-card p-1.5 shadow-xs transition-all duration-150",
                          isRowHovered ? "ring-2 ring-primary border-primary bg-primary/5" : "group-hover/row:bg-primary/5"
                        )}
                        style={{ width: matrixRowLabelWidth, height: matrixCellSize }}
                        onMouseEnter={() => setHoveredReq(rowReq)}
                        onMouseLeave={() => setHoveredReq(null)}
                      >
                        <div className={cn("text-[8px] font-mono transition-colors", isRowHovered ? "text-primary font-bold" : "text-primary/55")}>
                          {getDisplayId(rowReq.uid)}
                        </div>
                        <div className={cn("overflow-hidden break-words text-[8px] font-medium leading-[1.1] transition-colors line-clamp-2", isRowHovered ? "text-primary" : "text-foreground/80")}>
                          {rowReq.name}
                        </div>
                      </div>

                      <div className="flex" style={{ gap: matrixInnerGap }}>
                        {categories.map((cat: any, cIdx: number) => {
                          const impact = getImpact(rowReq.uid, cat.name)

                          const isActive = activeCell?.reqUid === rowReq.uid && activeCell?.catName === cat.name
                          const isExactlyHovered = hoveredCell?.reqUid === rowReq.uid && hoveredCell?.catName === cat.name

                          return (
                            <HeatmapCell
                              key={`cell-${rowReq.uid}-${cat.name}`}
                              rowReq={rowReq}
                              cat={cat}
                              impact={impact}
                              isActive={isActive}
                              isExactlyHovered={isExactlyHovered}
                              showOnlyGT={showOnlyGT}
                              matrixCellSize={matrixCellSize}
                              onMouseEnter={handleCellMouseEnter}
                              onMouseLeave={handleCellMouseLeave}
                              onClick={handleCellClick}
                              dataTour={rowGrpIdx === 0 && rIdx === 0 && cIdx === 0 ? 'tour-step7-matrix-cell' : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {mounted && createPortal(tooltip, isFullscreen ? (document.fullscreenElement || document.body) : document.body)}
    </div>
  );
}
