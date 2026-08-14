import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStore, TreeEvaluation, getDisplayId } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, AlertTriangle, ChevronRight, ChevronDown, ChevronUp, Info, Maximize, Minimize, Leaf, X, Sparkles, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FlagButton from './FlagButton';
import { TreeTutorialModal } from './TreeTutorialModal';

const X_OFFSET = 600;
const Y_OFFSET = 850;

function generateLayout(tree: any) {
  const layout: Record<string, { x: number, y: number }> = {};

  function traverse(nodeId: string, x: number, y: number) {
    if (!nodeId || layout[nodeId]) return;
    layout[nodeId] = { x, y };

    const node = tree.nodes[nodeId];
    if (node && node.options) {
      node.options.forEach((opt: any, idx: number) => {
        // If 2 options, spread them. If 1, go straight down.
        const offset = node.options.length > 1 ? (idx === 0 ? -X_OFFSET : X_OFFSET) : 0;
        traverse(opt.target, x + offset, y + Y_OFFSET);
      });
    }
  }

  if (tree && tree.startNode) {
    traverse(tree.startNode, 0, 0);
  }
  return layout;
}

function getCleanPath(tree: any, history: string[], currentNodeId: string): { cleanHistory: string[], cleanCurrentNodeId: string } {
  if (!tree || !tree.startNode) {
    return { cleanHistory: [], cleanCurrentNodeId: currentNodeId };
  }

  const cleanHistory: string[] = [];
  let current = tree.startNode;

  // Follow the history chain
  for (let i = 0; i < history.length; i++) {
    const hId = history[i];
    if (hId !== current) break;

    const nextInHistory = i + 1 < history.length ? history[i + 1] : currentNodeId;
    const node = tree.nodes[current];
    if (node && node.options && node.options.some((o: any) => o.target === nextInHistory)) {
      cleanHistory.push(current);
      current = nextInHistory;
    } else {
      break;
    }
  }

  // Now validate currentNodeId against the last node in our clean path
  let cleanCurrentNodeId = currentNodeId;
  const lastActiveNode = cleanHistory.length > 0 ? cleanHistory[cleanHistory.length - 1] : null;

  if (lastActiveNode) {
    const lastNodeObj = tree.nodes[lastActiveNode];
    const isValid = lastNodeObj && lastNodeObj.options.some((o: any) => o.target === currentNodeId);
    if (!isValid) {
      // Fallback: use the first option of the last valid node
      cleanCurrentNodeId = lastNodeObj?.options[0]?.target || lastActiveNode;
    }
  } else {
    // If history is empty, check if currentNodeId is startNode or its child
    const startNodeObj = tree.nodes[tree.startNode];
    const isValid = currentNodeId === tree.startNode || (startNodeObj && startNodeObj.options.some((o: any) => o.target === currentNodeId));
    if (!isValid) {
      cleanCurrentNodeId = tree.startNode;
    }
  }

  return { cleanHistory, cleanCurrentNodeId };
}

const getBaseRequirementsForOption = (opt: any, tree: any) => {
  if (opt.target.startsWith('end-')) {
    return tree.results[opt.target]?.referenced_requirements || [];
  }

  let currentTarget = opt.target;
  while (currentTarget && tree.nodes[currentTarget]) {
    const node = tree.nodes[currentTarget];
    const baseOpt = node.options.find((o: any) => !o.requiresEvaluation);
    if (baseOpt) {
      currentTarget = baseOpt.target;
    } else {
      break;
    }
  }

  if (currentTarget && currentTarget.startsWith('end-')) {
    return tree.results[currentTarget]?.referenced_requirements || [];
  }
  return [];
};

const RequirementSidePanel = ({
  baseReqs,
  requirements,
  title,
  onClose,
  targetLevel,
  currentTree,
}: {
  baseReqs: string[];
  requirements: any[];
  title: string;
  onClose: () => void;
  targetLevel?: number;
  currentTree?: any;
}) => {
  const groups = useStore((state) => state.groups);

  const groupedReqs = useMemo(() => {
    const map = new Map<string, any[]>();
    baseReqs.forEach((reqUid) => {
      const req = requirements?.find((r: any) => r.uid === reqUid);
      if (req) {
        const groupId = req.groupId || 'uncategorized';
        if (!map.has(groupId)) map.set(groupId, []);
        map.get(groupId)!.push(req);
      }
    });
    return map;
  }, [baseReqs, requirements]);

  const getDeltaStatus = (req: any) => {
    if (targetLevel === undefined || targetLevel <= 0 || !currentTree) {
      return { status: 'same' as const };
    }
    const prevResultNode = `end-${targetLevel - 1}`;
    const prevReqUids: string[] = currentTree.results?.[prevResultNode]?.referenced_requirements || [];

    if (prevReqUids.includes(req.uid)) {
      return { status: 'same' as const };
    }

    const prevReqInGroup = requirements?.find((r: any) => prevReqUids.includes(r.uid) && r.groupId === req.groupId);
    if (prevReqInGroup) {
      return {
        status: 'upgraded' as const,
        badgeText: `Erhöht auf SEAL-${targetLevel}`,
        replacedText: `Ersetzt: ${prevReqInGroup.name}`
      };
    }

    return {
      status: 'new' as const,
      badgeText: `Neu in SEAL-${targetLevel}`
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -15, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -15, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute left-[calc(100%+24px)] top-0 w-[420px] max-h-[600px] h-full bg-card border-2 border-primary/40 rounded-3xl p-5 shadow-2xl z-50 flex flex-col text-left overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-card-border/60 shrink-0">
        <div>
          <span className="text-[9px] font-bold text-primary uppercase tracking-widest block">Hinterlegte Anforderungen</span>
          <h4 className="font-bold text-sm text-foreground truncate max-w-[320px]">{title}</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar">
        {Array.from(groupedReqs.entries()).map(([groupId, reqsInGroup]) => {
          const group = groups.find((g: any) => g.id === groupId);
          const groupName = group?.name || 'Keine Gruppe';
          return (
            <div key={groupId} className="flex flex-col gap-2 border-b border-card-border/30 pb-3 last:border-b-0 last:pb-0">
              <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider leading-snug flex-1">{groupName}</span>
                <span className="text-[9px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  {reqsInGroup.length} {reqsInGroup.length > 1 ? 'Anforderungen' : 'Anforderung'}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {reqsInGroup.map((req: any) => {
                  const delta = getDeltaStatus(req);
                  const isUpgraded = delta.status === 'upgraded';
                  const isNew = delta.status === 'new';

                  return (
                    <div
                      key={req.uid}
                      className={cn(
                        "flex flex-col gap-1 p-2.5 rounded-lg border shadow-sm transition-all relative overflow-hidden",
                        isUpgraded
                          ? "bg-primary/10 border-primary/40 shadow-primary/10"
                          : isNew
                          ? "bg-success/10 border-success/40 shadow-success/10"
                          : "bg-background border-card-border/80"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md shrink-0 mt-0.5">
                            {getDisplayId(req.uid)}
                          </span>
                          <span className="font-semibold text-[10px] text-foreground leading-snug">{req.name}</span>
                        </div>

                        {isUpgraded && (
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[8px] font-bold bg-primary text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <Sparkles className="w-2.5 h-2.5" />
                              {delta.badgeText}
                            </span>
                            {delta.replacedText && (
                              <span className="text-[7.5px] font-medium text-primary/80 mt-0.5 max-w-[140px] truncate" title={delta.replacedText}>
                                {delta.replacedText}
                              </span>
                            )}
                          </div>
                        )}

                        {isNew && (
                          <span className="text-[8px] font-bold bg-success/20 text-success border border-success/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <PlusCircle className="w-2.5 h-2.5 text-success" />
                            {delta.badgeText}
                          </span>
                        )}
                      </div>

                      {req.description && (
                        <p className="text-[10px] text-muted leading-relaxed mt-0.5 whitespace-pre-wrap pl-1">
                          {req.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

type SovDescription = { title: string; description: string; factors: string[] };

const SOV_DESCRIPTIONS: Record<string, SovDescription> = {
  'jurisdictional-data-sovereignty': {
    title: 'Jurisdiktionelle & Daten-Souveränität',
    description: 'Bewertet die rechtliche Absicherung, den Speicherort und den technischen Schutz Ihrer Daten vor unbefugten Fremdzugriffen (z.B. durch extraterritoriale Gesetze).',
    factors: [
      'Geltender Rechtsrahmen für Cloud-Verträge (EU-Recht)',
      'Physischer Speicher- und Verarbeitungsstandort (Datenresidenz)',
      'Kryptografischer Zugriffsschutz (z. B. Bring Your Own Key)',
      'Ausschluss von Restabhängigkeiten zu Nicht-EU-Technologien'
    ]
  },
  'technological-sovereignty': {
    title: 'Technologische Souveränität',
    description: 'Prüft die architektonische Unabhängigkeit Ihres Technologie-Stacks, um Vendor-Lock-in zu vermeiden und langfristige Portabilität zu gewährleisten.',
    factors: [
      'Vermeidung proprietärer "Blackbox"-Technologien',
      'Integration über offene, standardisierte Schnittstellen (APIs)',
      'Einsatz plattformagnostischer Architekturen (z.B. Kubernetes)',
      'Möglichkeit zur Auditierung durch Open-Source-Kernkomponenten'
    ]
  },
  'operational-sovereignty': {
    title: 'Operative Souveränität',
    description: 'Analysiert Ihre operative Handlungsfähigkeit im laufenden Betrieb, bei der Systemwartung und in Eskalations- oder Supportfällen.',
    factors: [
      'Standort und Jurisdiktion des operativen Provider-Supports',
      'Möglichkeiten zum aktiven Co-Management kritischer Querschnittsfunktionen',
      'Ihre internen Fähigkeiten zur völlig autarken Fehlerbehebung',
      'Abwägung zwischen globalem Experten-Support und exklusiver EU-Kontrolle'
    ]
  }
};

export default function Step2DecisionTrees() {
  const { decisionTrees, setStep, setTreeTraversalState, treeTraversalStates, setTreeResult, requirements, hasSeenTreeTutorial, setHasSeenTreeTutorial, isTourActive, currentTourStep, step: globalStep, activeTreeIndex, setActiveTreeIndex } = useStore();

  const currentTree = decisionTrees[activeTreeIndex];
  const layout = useMemo(() => currentTree ? generateLayout(currentTree) : {}, [currentTree]);

  const [pendingEvaluation, setPendingEvaluation] = useState<{ source: string, target: string, label: string, interimResult: string, questionText: string, selectedOptionText?: string } | null>(null);
  const [hoveredOpt, setHoveredOpt] = useState<any | null>(null);
  const [evalForm, setEvalForm] = useState<TreeEvaluation>({ businessValue: 0, techRisk: 0, comment: '' });
  const [touchedBv, setTouchedBv] = useState(false);
  const [touchedTr, setTouchedTr] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 0.3 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [startedTrees, setStartedTrees] = useState<Set<number>>(new Set());
  const [pendingJump, setPendingJump] = useState<{ id: string, idx: number, label: string } | null>(null);
  const [openReqPanelOption, setOpenReqPanelOption] = useState<{ nodeId: string; optLabel: string } | null>(null);

  const nodeHeightsRef = useRef<Record<string, number>>({});
  const [, forceRender] = useState(0);

  const onNodeRef = useCallback((el: HTMLDivElement | null, id: string) => {
    if (el && !el.dataset.observed) {
      el.dataset.observed = 'true';
      const observer = new ResizeObserver(() => {
        const h = el.offsetHeight;
        if (nodeHeightsRef.current[id] !== h) {
          nodeHeightsRef.current[id] = h;
          forceRender(n => n + 1);
        }
      });
      observer.observe(el);
    }
  }, []);

  const currentState = treeTraversalStates[activeTreeIndex] || { currentNodeId: currentTree?.startNode, history: [], evaluations: {} };
  const currentNodeId = currentState.currentNodeId;
  const history = currentState.history;
  const evaluations = currentState.evaluations;

  const isTreeStarted = startedTrees.has(activeTreeIndex) || (history && history.length > 0) || (isTourActive && globalStep === 2 && currentTourStep >= 2);

  const startCurrentTree = () => {
    setStartedTrees(prev => {
      const next = new Set(prev);
      next.add(activeTreeIndex);
      return next;
    });
  };

  const { cleanHistory, cleanCurrentNodeId } = useMemo(() => {
    return getCleanPath(currentTree, history, currentNodeId);
  }, [currentTree, history, currentNodeId]);

  const activeHistory = cleanHistory;
  const activeCurrentNodeId = cleanCurrentNodeId;

  const isTreeFinished = useMemo(() => {
    if (!currentTree) return false;
    return (currentTree.results as any)[activeCurrentNodeId] !== undefined || activeCurrentNodeId?.startsWith('end-');
  }, [currentTree, activeCurrentNodeId]);

  const effectiveNodeId = useMemo(() => {
    if (isTourActive && (isTreeFinished || activeCurrentNodeId?.startsWith('end-'))) {
      return currentTree?.startNode || activeCurrentNodeId;
    }
    return activeCurrentNodeId;
  }, [isTourActive, isTreeFinished, activeCurrentNodeId, currentTree]);

  useEffect(() => {
    if (JSON.stringify(cleanHistory) !== JSON.stringify(history) || cleanCurrentNodeId !== currentNodeId) {
      const current = treeTraversalStates[activeTreeIndex] || { currentNodeId: currentTree.startNode, history: [], evaluations: {} };
      const cleanEvals = { ...current.evaluations };
      Object.keys(cleanEvals).forEach(k => {
        if (!cleanHistory.includes(k) && k !== cleanCurrentNodeId) {
          delete cleanEvals[k];
        }
      });
      setTreeTraversalState(activeTreeIndex, {
        ...current,
        history: cleanHistory,
        currentNodeId: cleanCurrentNodeId,
        evaluations: cleanEvals
      });
    }
  }, [cleanHistory, cleanCurrentNodeId, history, currentNodeId, activeTreeIndex, currentTree, setTreeTraversalState, treeTraversalStates]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const tourOpenedEvalModalRef = useRef<boolean>(false);

  // Tour Mock Effect
  useEffect(() => {
    if (isTourActive && globalStep === 2) {
      if (currentTourStep === 4 && !pendingEvaluation) {
        tourOpenedEvalModalRef.current = true;
        const activeNodeObj = currentTree?.nodes?.[effectiveNodeId] || currentTree?.nodes?.[currentTree?.startNode];
        const firstOpt = activeNodeObj?.options?.[0];
        setPendingEvaluation({
          source: 'dummy-tour',
          target: 'dummy',
          label: 'Option bewerten (Tour-Beispiel)',
          questionText: activeNodeObj?.text || 'Soll der Cloud Service Provider vertraglich an EU-Recht gebunden sein?',
          interimResult: firstOpt?.interimResult || 'SEAL-1',
          selectedOptionText: firstOpt?.label || 'Ja, EU-Recht vertraglich (SEAL-1)'
        });
      } else if (currentTourStep !== 4 && (tourOpenedEvalModalRef.current || pendingEvaluation?.source === 'dummy-tour')) {
        tourOpenedEvalModalRef.current = false;
        setPendingEvaluation(null);
      }
    } else if (!isTourActive && (tourOpenedEvalModalRef.current || pendingEvaluation?.source === 'dummy-tour')) {
      tourOpenedEvalModalRef.current = false;
      setPendingEvaluation(null);
    }
  }, [isTourActive, globalStep, currentTourStep, pendingEvaluation, effectiveNodeId, currentTree]);

  // Helper to center camera on a node
  const centerOnNode = (nodeId: string) => {
    if (containerRef.current && layout) {
      const { clientWidth, clientHeight } = containerRef.current;
      const targetPos = layout[nodeId];
      if (targetPos) {
        setCamera({
          x: -targetPos.x + clientWidth / 2,
          y: -targetPos.y + clientHeight / 2 - 100,
          scale: 1
        });
      }
    }
  };

  // Update camera when effectiveNodeId changes
  useEffect(() => {
    if (effectiveNodeId) {
      centerOnNode(effectiveNodeId);
    }
  }, [effectiveNodeId, layout]);

  // Initial animation
  useEffect(() => {
    if (containerRef.current && currentTree && layout) {
      const { clientWidth, clientHeight } = containerRef.current;
      // Start zoomed out
      setCamera({
        x: clientWidth / 2,
        y: clientHeight / 2 + 100,
        scale: 0.4
      });
      // Then zoom in
      const targetPos = layout[currentTree.startNode];
      setTimeout(() => {
        if (targetPos) {
          setCamera({
            x: -targetPos.x + clientWidth / 2,
            y: -targetPos.y + clientHeight / 2 - 100,
            scale: 1
          });
        }
      }, 800);
    }
  }, [activeTreeIndex, currentTree?.startNode, layout]);

  if (decisionTrees.length === 0 || !currentTree) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Lade Entscheidungsbäume...</p>
        </div>
      </div>
    );
  }

  const updateTreeState = (updates: any) => {
    const current = treeTraversalStates[activeTreeIndex] || { currentNodeId: currentTree.startNode, history: [], evaluations: {} };
    setTreeTraversalState(activeTreeIndex, { ...current, ...updates });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOptionSelect = (option: any, nodeText: string, nodeId: string) => {
    let currentHistory = activeHistory;
    let currentEvals = evaluations;

    if (activeHistory.includes(nodeId)) {
      const index = activeHistory.indexOf(nodeId);
      currentHistory = activeHistory.slice(0, index);
      currentEvals = { ...evaluations };
      Object.keys(currentEvals).forEach(k => {
        if (!currentHistory.includes(k)) {
          delete currentEvals[k];
        }
      });
    }

    if (option.requiresEvaluation) {
      setPendingEvaluation({
        source: nodeId,
        target: option.target,
        label: option.evaluationLabel,
        interimResult: option.interimResult,
        questionText: nodeText,
        selectedOptionText: option.label || option.text
      });
      setEvalForm({ businessValue: 0, techRisk: 0, comment: '' });
      setTouchedBv(false);
      setTouchedTr(false);

      if (activeHistory.includes(nodeId)) {
        updateTreeState({ history: currentHistory, currentNodeId: nodeId, evaluations: currentEvals });
      }
    } else {
      updateTreeState({
        history: [...currentHistory, nodeId],
        currentNodeId: option.target,
        evaluations: currentEvals
      });
    }
  };

  const submitEvaluation = () => {
    if (!pendingEvaluation) return;

    updateTreeState({
      evaluations: { ...evaluations, [pendingEvaluation.source]: evalForm },
      history: [...activeHistory, activeCurrentNodeId],
      currentNodeId: pendingEvaluation.target
    });
    setPendingEvaluation(null);
  };

  const advanceToNode = (targetId: string) => {
    updateTreeState({ history: [...activeHistory, activeCurrentNodeId], currentNodeId: targetId });
  };

  const jumpToNode = (nodeId: string, index: number) => {
    const newHistory = activeHistory.slice(0, index);
    const newEvals = { ...evaluations };
    Object.keys(newEvals).forEach(k => {
      if (!newHistory.includes(k)) {
        delete newEvals[k];
      }
    });

    updateTreeState({ history: newHistory, currentNodeId: nodeId, evaluations: newEvals });
    setPendingEvaluation(null);
    setPendingJump(null);
  };

  const requestJumpToNode = (nodeId: string, index: number, label: string) => {
    setPendingJump({ id: nodeId, idx: index, label });
  };

  const finishTree = () => {
    setTreeResult(currentTree.id, {
      treeId: currentTree.id,
      resultNode: activeCurrentNodeId,
      evaluations: evaluations,
      referenced_requirements: (currentTree.results as any)[activeCurrentNodeId]?.referenced_requirements || []
    });

    if (activeTreeIndex < decisionTrees.length - 1) {
      const nextIdx = activeTreeIndex + 1;
      if (!treeTraversalStates[nextIdx]) {
        setTreeTraversalState(nextIdx, { currentNodeId: decisionTrees[nextIdx].startNode, history: [], evaluations: {} });
      }
      setActiveTreeIndex(nextIdx);
      setPendingEvaluation(null);
    } else {
      setStep(3);
    }
  };

  // Build SVG Paths
  const edges: any[] = [];
  for (const [id, node] of Object.entries(currentTree.nodes as any)) {
    const posA = layout[id];
    if (!posA) continue;
    (node as any).options.forEach((opt: any) => {
      const posB = layout[opt.target];
      if (posB) {
        // Is this edge part of the active path?
        const activePath = [...activeHistory, activeCurrentNodeId];
        const idIndex = activePath.indexOf(id);
        const isHistoryEdge = idIndex !== -1 && activePath[idIndex + 1] === opt.target;

        // SEAL card height calculation to avoid floating connection lines
        const isTargetResult = (currentTree.results as any)[opt.target] !== undefined;

        const heightA = nodeHeightsRef.current[id] || 560;
        const heightB = nodeHeightsRef.current[opt.target] || (isTargetResult ? 180 : 560);

        const startY = posA.y + heightA / 2;
        const endY = posB.y - heightB / 2;

        edges.push(
          <path
            key={`${id}-${opt.target}`}
            d={`M ${posA.x} ${startY} C ${posA.x} ${startY + 200}, ${posB.x} ${endY - 200}, ${posB.x} ${endY}`}
            fill="none"
            strokeDasharray={isHistoryEdge ? "none" : "8, 8"}
            className={cn("transition-all duration-500", isHistoryEdge ? "stroke-primary" : "stroke-muted/30")}
            strokeWidth={isHistoryEdge ? 8 : 4}
          />
        );
      }
    });
  }

  return (
    <div className="w-full max-w-7xl mx-auto h-[85vh] flex flex-col">
      {!hasSeenTreeTutorial && (
        <TreeTutorialModal onClose={() => setHasSeenTreeTutorial(true)} />
      )}

      <div className="mb-4 flex justify-between items-end shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-3xl font-bold text-foreground">Entscheidungsbäume</h2>
            <button
              onClick={() => setHasSeenTreeTutorial(false)}
              className="p-1.5 rounded-full hover:bg-card border border-card-border text-muted-foreground hover:text-primary transition-colors flex items-center justify-center"
              title="Tutorial anzeigen"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {decisionTrees.map((tree, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!treeTraversalStates[idx]) {
                    setTreeTraversalState(idx, { currentNodeId: tree.startNode, history: [], evaluations: {} });
                  }
                  setActiveTreeIndex(idx);
                }}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors border", activeTreeIndex === idx ? "bg-primary text-white border-primary" : "bg-card text-muted border-card-border hover:border-primary/50 hover:text-foreground")}
              >
                {idx + 1}. {tree.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-card border border-card-border p-2 px-4 rounded-xl mb-4 overflow-x-auto shrink-0 custom-scrollbar">
        <button
          onClick={() => requestJumpToNode(currentTree.startNode, 0, 'Start')}
          className={cn("text-sm whitespace-nowrap transition-colors hover:text-primary", activeHistory.length === 0 ? "text-primary font-bold" : "text-muted")}
        >
          Start
        </button>
        {activeHistory.map((id, idx) => {
          const node = currentTree.nodes[id];
          const label = node?.name || (node?.text?.includes(':') ? node?.text?.split(':')[0] : null) || id;
          return (
            <div key={idx} className="flex items-center shrink-0">
              <ChevronRight className="w-4 h-4 text-muted mx-1" />
              <button
                onClick={() => requestJumpToNode(id, idx, label)}
                className={cn(
                  "text-sm whitespace-nowrap max-w-[200px] truncate transition-colors hover:text-primary",
                  idx === activeHistory.length - 1 && !isTreeFinished ? "text-primary font-bold" : "text-muted"
                )}
                title={label}
              >
                {label}
              </button>
            </div>
          );
        })}
        {isTreeFinished && (
          <div className="flex items-center shrink-0">
            <ChevronRight className="w-4 h-4 text-muted mx-1" />
            <span className="text-sm text-success font-bold whitespace-nowrap">Ergebnis</span>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "flex-1 w-full bg-background rounded-3xl border border-card-border overflow-hidden relative select-none transition-all",
          isFullscreen ? "h-screen rounded-none border-none" : "h-[850px]",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        {/* Floating Header Overlay (Space-Saving Vertically, Generous Horizontally) */}
        {isTreeStarted && (
          <div className="absolute top-4 left-4 right-auto max-w-[calc(100%-2rem)] z-30 flex items-center gap-2.5 bg-card/90 backdrop-blur-md border border-card-border/80 shadow-lg rounded-xl px-3.5 py-2 pointer-events-auto transition-all flex-wrap sm:flex-nowrap">
            <div className="relative flex items-center shrink-0">
              <select
                value={activeTreeIndex}
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  if (!treeTraversalStates[idx]) {
                    setTreeTraversalState(idx, { currentNodeId: decisionTrees[idx].startNode, history: [], evaluations: {} });
                  }
                  setActiveTreeIndex(idx);
                }}
                className="appearance-none bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[11px] font-mono font-bold rounded-md px-2.5 py-1 pr-6 cursor-pointer focus:outline-none transition-colors"
                title="Entscheidungsbaum wechseln"
              >
                {decisionTrees.map((t, idx) => (
                  <option key={idx} value={idx} className="bg-card text-foreground font-sans text-xs">
                    Baum {idx + 1}: {t.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-primary absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <span className="text-xs font-bold text-foreground whitespace-normal sm:whitespace-nowrap" title={currentTree.title}>
              {currentTree.title}
            </span>

            {activeCurrentNodeId && (
              <>
                <div className="hidden sm:block h-4 w-px bg-card-border shrink-0" />
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold shrink-0">Aktuell:</span>
                  <span className="text-xs text-primary font-semibold whitespace-normal sm:whitespace-nowrap" title={(currentTree.nodes as any)[activeCurrentNodeId]?.name || (currentTree.results as any)[activeCurrentNodeId]?.title || activeCurrentNodeId}>
                    {(currentTree.nodes as any)[activeCurrentNodeId]?.name || (currentTree.results as any)[activeCurrentNodeId]?.title || (isTreeFinished ? 'Ergebnis' : activeCurrentNodeId)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <AnimatePresence>
          {((!isTourActive && !isTreeStarted) || (isTourActive && currentTourStep === 1)) && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-40 p-6 bg-background/60 overflow-y-auto custom-scrollbar flex"
            >
              <motion.div
                data-tour="tour-step2-intro-card"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden shrink-0 m-auto max-w-2xl w-full bg-card/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] flex flex-col items-center"
              >
                {/* Organic Tree / Leaf Watermark in Background */}
                <div className="absolute -top-32 -right-32 text-primary/10 rotate-12 pointer-events-none scale-125 z-0">
                  <Leaf strokeWidth={0.5} className="w-[400px] h-[400px]" />
                </div>
                {/* Soft Glowing Orbs */}
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none z-0"></div>
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

                <div className="relative z-10 w-full flex flex-col items-center text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-12 h-12 bg-primary/10 backdrop-blur-md rounded-2xl border border-primary/20 flex items-center justify-center mb-3 shadow-inner shadow-primary/20"
                  >
                    <Leaf className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-center"
                  >
                    <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-1.5">
                      Entscheidungsbaum {activeTreeIndex + 1}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2 tracking-tight">
                      {currentTree.title}
                    </h3>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4 text-center">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Betrachtungskontext: Anforderungsermittlung für den einzusetzenden Cloud Service Provider (CSP)</span>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5 max-w-xl mx-auto font-normal">
                      {SOV_DESCRIPTIONS[currentTree.id]?.description}
                    </p>
                  </motion.div>

                  {SOV_DESCRIPTIONS[currentTree.id]?.factors && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="w-full max-w-xl mb-6"
                    >
                      <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-3">Betrachtete Schlüsselfaktoren</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                        {SOV_DESCRIPTIONS[currentTree.id].factors.map((factor: string, i: number) => (
                          <div key={i} className="flex items-center gap-2.5 bg-background/70 backdrop-blur-md p-3 rounded-xl border border-card-border shadow-sm group hover:border-primary/30 transition-all">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-foreground text-xs sm:text-sm font-medium leading-snug">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <button
                      onClick={startCurrentTree}
                      className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-full text-sm sm:text-base transition-all duration-300 shadow-[0_6px_20px_rgb(59,130,246,0.3)] hover:shadow-[0_6px_25px_rgb(59,130,246,0.5)] hover:-translate-y-0.5 flex items-center gap-2.5 group"
                    >
                      Evaluierung starten
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ x: camera.x, y: camera.y, scale: camera.scale }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          className="absolute origin-top-left"
          style={{ width: 0, height: 0 }}
        >
          <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0 }}>
            {edges}
          </svg>

          {/* Render Nodes */}
          {Object.entries(currentTree.nodes as any).map(([id, node]: [string, any]) => {
            const pos = layout[id];
            if (!pos) return null;
            const isActive = id === effectiveNodeId;
            const isHistory = activeHistory.includes(id);

            return (
              <motion.div
                key={id}
                initial={false}
                animate={isActive ? {
                  x: pos.x,
                  y: pos.y,
                  scale: 1,
                  opacity: 1,
                  boxShadow: [
                    "0 0 0px rgba(59, 130, 246, 0)",
                    "0 0 60px rgba(59, 130, 246, 0.4)",
                    "0 0 0px rgba(59, 130, 246, 0)"
                  ]
                } : {
                  x: pos.x,
                  y: pos.y,
                  scale: isHistory ? 0.9 : 0.75,
                  opacity: isHistory ? 1 : 0.6
                }}
                transition={isActive ? {
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  },
                  x: { duration: 0.5 },
                  y: { duration: 0.5 }
                } : { duration: 0.5 }}
                className={cn(
                  "absolute flex flex-col items-center justify-center",
                  isActive ? "z-20" : isHistory ? "z-10" : "z-0 pointer-events-none"
                )}
                style={{
                  width: 500,
                  left: 0,
                  top: 0,
                  translateX: '-50%',
                  translateY: '-50%'
                }}
                data-tour={isActive ? 'tour-step2-trees' : undefined}
              >
                <div
                  ref={el => onNodeRef(el, id)}
                  onPointerDown={(e) => {
                    if (isHistory) e.stopPropagation();
                  }}
                  onPointerUp={(e) => {
                    if (isHistory) {
                      const idx = activeHistory.indexOf(id);
                      const label = node?.name || (node?.text?.includes(':') ? node?.text?.split(':')[0] : null) || id;
                      requestJumpToNode(id, idx, label);
                    }
                  }}
                  className={cn(
                    "border-4 p-8 rounded-3xl shadow-2xl w-full text-center min-h-[560px] flex flex-col transition-all duration-500 relative",
                    isActive ? "border-primary bg-background ring-8 ring-primary/5 shadow-primary/40 scale-[1.02]" : "border-card-border bg-card opacity-60",
                    isHistory && "hover:border-primary/30"
                  )}
                  style={{
                    cursor: isHistory ? 'pointer' : 'default'
                  }}
                >
                  {isActive && (
                    <div className="absolute top-4 right-4 z-50">
                      <FlagButton
                        type="tree-node"
                        id={`${currentTree.id}:${id}`}
                        initialFlagged={node.flagged}
                        initialComment={node.flagComment}
                      />
                    </div>
                  )}
                  <div className="flex flex-col h-full">
                    <div className="mb-6">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Entscheidungs-Thema</div>
                      <h3 className="text-2xl font-bold text-foreground leading-tight">
                        {node.name || id}
                      </h3>
                    </div>
                    <p className="text-foreground text-lg leading-relaxed mb-8 px-4 font-medium italic">
                      {node.text}
                    </p>

                    {/* Static Info Box for the continuation path */}
                    <div className="flex-1 min-h-[140px] px-2 mb-6 relative">
                      {node.options.find((o: any) => o.rationale) ? (
                        <div className="w-full bg-primary/5 border border-primary/30 rounded-2xl p-5 text-left h-full flex flex-col relative shadow-inner">
                          <div className="flex items-center space-x-2 mb-2">
                            <Info className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                              Souveränitäts-Konsequenz:
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground italic">
                            {node.options.find((o: any) => o.rationale).rationale}
                          </p>

                          {/* Visual Indicator pointing to the right button (which usually increases SOV) */}
                          <div className="absolute -bottom-3 right-[25%] translate-x-[50%] w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-primary/30"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-card-border rounded-2xl flex items-center justify-center p-5 relative">
                          <p className="text-xs text-muted italic">
                            Standard-Szenario ohne zusätzliche Anforderungen.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-auto" data-tour={isActive ? 'tour-step2-options' : undefined}>
                      {node.options.map((opt: any, idx: number) => {
                        const baseReqs = getBaseRequirementsForOption(opt, currentTree);
                        return (
                          <div key={idx} className="flex flex-col border border-card-border bg-background/40 hover:border-primary/50 rounded-2xl transition-all group relative overflow-hidden h-full">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isHistory) {
                                  const idx = activeHistory.indexOf(id);
                                  const label = node?.name || (node?.text?.includes(':') ? node?.text?.split(':')[0] : null) || id;
                                  requestJumpToNode(id, idx, label);
                                } else {
                                  handleOptionSelect(opt, node.text, id);
                                }
                              }}
                              className="flex items-center justify-between p-5 hover:bg-primary/10 transition-all w-full text-left flex-1"
                            >
                              <span className="font-bold text-sm text-foreground uppercase tracking-widest pr-4">{opt.label}</span>
                              <ArrowRight className="w-5 h-5 shrink-0 text-muted group-hover:text-primary transition-all group-hover:translate-x-1" />
                            </button>

                             {baseReqs.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenReqPanelOption(
                                    openReqPanelOption?.nodeId === id && openReqPanelOption?.optLabel === opt.label
                                      ? null
                                      : { nodeId: id, optLabel: opt.label }
                                  );
                                }}
                                className="w-full border-t border-card-border/50 bg-background/60 p-3 text-[10px] font-bold text-muted hover:text-primary uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>{baseReqs.length} Anforderungen hinterlegt</span>
                                <ChevronRight className={cn("w-4 h-4 transition-transform", openReqPanelOption?.nodeId === id && openReqPanelOption?.optLabel === opt.label ? "rotate-90 text-primary" : "")} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <AnimatePresence>
                    {openReqPanelOption?.nodeId === id && (() => {
                      const selectedOpt = node.options.find((o: any) => o.label === openReqPanelOption.optLabel);
                      if (!selectedOpt) return null;
                      const reqs = getBaseRequirementsForOption(selectedOpt, currentTree);
                      if (reqs.length === 0) return null;

                      let targetLevel: number | undefined = undefined;
                      if (selectedOpt.target?.startsWith('end-')) {
                        targetLevel = parseInt(selectedOpt.target.split('-')[1], 10);
                      } else if (selectedOpt.target?.startsWith('q')) {
                        const qNum = parseInt(selectedOpt.target.replace(/\D/g, ''), 10);
                        if (!isNaN(qNum)) {
                          targetLevel = qNum - 1;
                        }
                      }

                      return (
                        <RequirementSidePanel
                          baseReqs={reqs}
                          requirements={requirements}
                          title={selectedOpt.label}
                          onClose={() => setOpenReqPanelOption(null)}
                          targetLevel={targetLevel}
                          currentTree={currentTree}
                        />
                      );
                    })()}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Render Results */}
          {Object.entries(currentTree.results as any).map(([id, result]: [string, any]) => {
            const pos = layout[id];
            if (!pos) return null;
            const isActive = id === activeCurrentNodeId && !isTourActive;
            const isFaded = !isActive;

            return (
              <div
                key={id}
                className={cn(
                  "absolute flex flex-col items-center justify-center transition-all duration-500",
                  isActive ? "z-20 scale-100 opacity-100" : "z-0 scale-75 opacity-80 pointer-events-none"
                )}
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)', width: 350 }}
              >
                <div
                  ref={el => onNodeRef(el, id)}
                  className={cn("border-2 p-6 rounded-2xl shadow-xl w-full text-center", isActive ? "border-primary/50 bg-background" : "bg-card border-card-border")}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110"
                      : "bg-muted/40 text-muted-foreground/40 border border-card-border"
                  )}>
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-4">
                    {result.title}
                  </h4>
                  {isActive && (
                    <button
                      onClick={finishTree}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold transition-colors w-full shadow-lg shadow-primary/20"
                    >
                      {activeTreeIndex < decisionTrees.length - 1 ? 'Nächster Baum' : 'Weiter'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 flex items-center justify-center bg-card border border-card-border rounded-xl shadow-lg hover:bg-primary/20 hover:text-primary transition-colors mb-2"
            title={isFullscreen ? "Vollbild verlassen" : "Vollbildmodus"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <div className="h-px bg-card-border mx-2 mb-2" />
          <button
            onClick={() => setCamera(c => ({ ...c, scale: Math.min(c.scale + 0.2, 1.5) }))}
            className="w-10 h-10 flex items-center justify-center bg-card border border-card-border rounded-xl shadow-lg hover:bg-primary/20 hover:text-primary transition-colors font-bold text-lg"
            title="Hineinzoomen"
          >
            +
          </button>
          <button
            onClick={() => setCamera(c => ({ ...c, scale: Math.max(c.scale - 0.2, 0.2) }))}
            className="w-10 h-10 flex items-center justify-center bg-card border border-card-border rounded-xl shadow-lg hover:bg-primary/20 hover:text-primary transition-colors font-bold text-lg"
            title="Herauszoomen"
          >
            -
          </button>
          <button
            onClick={() => centerOnNode(activeCurrentNodeId)}
            className="w-10 h-10 flex items-center justify-center bg-card border border-card-border rounded-xl shadow-lg hover:bg-primary/20 hover:text-primary transition-colors text-xs font-bold"
            title="Auf aktuelle Frage zentrieren"
          >
            FIT
          </button>
        </div>

        {/* Floating Evaluation Modal */}
        <AnimatePresence>
          {pendingEvaluation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0 z-50 flex items-center justify-center p-4 transition-all",
                isTourActive ? "bg-background/40" : "bg-background/80 backdrop-blur-sm"
              )}
            >
              <motion.div
                initial={isTourActive ? undefined : { scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={isTourActive ? undefined : { scale: 0.9, y: 20 }}
                className="glass-panel border-2 border-warning/50 p-6 rounded-2xl shadow-2xl max-w-lg w-full"
                data-tour="tour-eval-sliders"
              >
                <div className="flex items-center gap-3 mb-4 text-warning">
                  <AlertTriangle className="w-6 h-6" />
                  <h4 className="font-bold text-lg">{pendingEvaluation.label}</h4>
                </div>
                <div className="text-sm font-medium mb-6 px-3 py-1.5 bg-warning/10 text-warning inline-block rounded-md">
                  Resultierendes Level: {pendingEvaluation.interimResult}
                </div>

                <div className="mb-6 p-4 bg-background rounded-xl border border-card-border space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Ausgangsfrage:</span>
                    <p className="text-sm text-foreground italic">"{pendingEvaluation.questionText}"</p>
                  </div>
                  {pendingEvaluation.selectedOptionText && (
                    <div className="pt-2.5 border-t border-card-border/60">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 block">Ausgewählte Antwort:</span>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-sm font-semibold text-foreground">{pendingEvaluation.selectedOptionText}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
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
                        <span className="text-sm font-bold text-danger whitespace-nowrap">{evalForm.techRisk} / 10</span>
                      </div>
                      <input
                        type="range" min="0" max="10"
                        value={evalForm.techRisk}
                        onChange={e => setEvalForm({ ...evalForm, techRisk: parseInt(e.target.value) })}
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
                      <label className="text-sm font-medium text-foreground">Kommentar / Begründung <span className="text-xs text-muted font-normal">(optional)</span></label>
                      <span className="text-[11px] text-muted">Kurze Stichpunkte genügen</span>
                    </div>
                    <textarea
                      value={evalForm.comment}
                      onChange={e => setEvalForm({ ...evalForm, comment: e.target.value })}
                      className="w-full bg-background border border-card-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      rows={2}
                      placeholder="Optional: Kurzer Hinweis, Stichpunkte oder Begründung..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-card-border">
                    <button
                      onClick={() => setPendingEvaluation(null)}
                      className="px-4 py-2 text-muted hover:text-foreground font-medium transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={submitEvaluation}
                      disabled={!touchedBv || !touchedTr}
                      className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg font-bold transition-colors shadow-md"
                    >
                      Speichern & Weiter
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warning Modal for Jumping Back */}
        <AnimatePresence>
          {pendingJump && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-card border border-card-border rounded-2xl shadow-2xl p-6 relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-warning/20 text-warning rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Wirklich zurückspringen?</h3>
                  <p className="text-sm text-muted mb-6">
                    Wenn du zur Frage <strong className="text-foreground">"{pendingJump.label}"</strong> zurückkehrst, werden <strong>alle folgenden Antworten und Bewertungen in diesem Baum unwiderruflich gelöscht</strong>.
                  </p>
                  
                  <div className="flex justify-center gap-3 w-full">
                    <button
                      onClick={() => setPendingJump(null)}
                      className="px-5 py-2.5 text-foreground hover:bg-card-border bg-background border border-card-border rounded-lg font-medium transition-colors flex-1"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => {
                        jumpToNode(pendingJump.id, pendingJump.idx);
                      }}
                      className="px-5 py-2.5 bg-warning hover:bg-warning/90 text-warning-foreground rounded-lg font-medium transition-colors flex-1"
                    >
                      Zurückspringen
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
