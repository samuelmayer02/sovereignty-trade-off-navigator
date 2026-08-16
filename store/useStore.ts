import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch } from '@/lib/api-client'

export function getDisplayId(uid: string, customReqs?: any[], customCategories?: any[]) {
  const reqs = customReqs || (typeof useStore !== 'undefined' && useStore ? useStore.getState()?.requirements : null) || [];
  const cats = customCategories || (typeof useStore !== 'undefined' && useStore ? useStore.getState()?.categories : null) || [];

  const req = reqs.find(r => r.uid === uid);
  if (!req) return uid;

  const getPrefix = (r: any) => {
    if (r.displayPrefix) return r.displayPrefix;
    const cat = cats.find((c: any) => c.name === r.category);
    if (cat) return cat.prefix;
    if (!r.category) return 'REQ';
    return `REQ-${r.category.substring(0, 3).toUpperCase()}`;
  };

  const prefix = getPrefix(req);
  const samePrefixReqs = reqs.filter(r => getPrefix(r) === prefix);
  const index = samePrefixReqs.indexOf(req) + 1;

  return `${prefix}-${index.toString().padStart(2, '0')}`;
}

export type Priority = number;

export function calculatePriority(bv: number, tr: number): number {
  if (bv === 0 && tr === 0) return 5;
  const raw = (bv * 10) / (bv + tr);
  const rounded = Math.round(raw * 10) / 10;
  return Math.max(1, Math.min(10, rounded));
}

export interface SelectedRequirement {
  uid: string;
  priority: Priority;
}

export interface TreeEvaluation {
  businessValue: number;
  techRisk: number;
  comment: string;
}

export interface TreeResult {
  treeId: string;
  resultNode: string;
  evaluations: Record<string, TreeEvaluation>;
  referenced_requirements?: string[];
}

export interface ScenarioEvaluation {
  optionIndex: number;
  businessValue: number;
  risk: number;
  notes: string;
  triggeredReqs: string[];
}

export interface ConflictResolutionDetails {
  groupId: string;
  groupName: string;
  keepId: string;
  rejectedIds: string[];
  comment: string;
  sr: number;
  ur: number;
  timestamp: string;
}

export interface Conflict {
  groupId: string;
  sovereigntyReqId: string;
  scenarioReqId: string;
}

export interface TreeTraversalState {
  currentNodeId: string;
  history: string[];
  evaluations: Record<string, TreeEvaluation>;
}

export interface AcceptedRisk {
  rationale: string;
  timestamp: string;
}

export interface SealProfile {
  J: number;
  T: number;
  O: number;
}

interface State {
  // Data from DB
  requirements: any[];
  groups: any[];
  categories: any[];
  decisionTrees: any[];
  scenarios: any[];
  conflicts: any[];
  fetchInitialData: () => Promise<void>;

  sessionId: string;
  setSessionId: (id: string) => void;
  step: number;
  maxStep: number;
  setStep: (step: number) => void;
  componentName: string;
  setComponentName: (name: string) => void;
  evaluationGoal: 'soll' | 'ist' | null;
  setEvaluationGoal: (goal: 'soll' | 'ist') => void;
  selectedSovereigntyReqs: Record<string, Priority>;
  selectedScenarioReqs: Record<string, Priority>;
  selectedRequirements: Record<string, Priority>;
  manualRequirementSources: Record<string, 'step6' | 'matrix'>;
  treeResults: Record<string, TreeResult>;
  scenarioResults: Record<string, ScenarioEvaluation>;
  scenarioContexts: Record<string, string>;
  treeTraversalStates: Record<number, TreeTraversalState>;
  setTreeTraversalState: (index: number, state: TreeTraversalState) => void;
  activeTreeIndex: number;
  setActiveTreeIndex: (index: number) => void;
  setSovereigntyPriority: (uid: string, priority: Priority) => void;
  removeSovereigntyReq: (uid: string) => void;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  isTourActive: boolean;
  currentTourStep: number;
  tourCompletedForSteps: Record<number, boolean>;
  startTour: () => void;
  stopTour: () => void;
  nextTourStep: () => void;
  setTourStep: (step: number) => void;
  setScenarioReqPriority: (uid: string, priority: Priority) => void;
  removeScenarioReq: (uid: string) => void;
  toggleRequirement: (uid: string, context?: 'step6' | 'matrix') => void;
  setPriority: (uid: string, priority: Priority) => void;
  updateRoutedPriority: (uid: string, priority: Priority) => void;
  setTreeResult: (treeId: string, result: TreeResult) => void;
  setScenarioResult: (scenarioId: string, result: ScenarioEvaluation | null, triggeredReqs: string[]) => void;
  setScenarioContext: (scenarioId: string, context: string) => void;
  ignoredScenarios: Record<string, boolean>;
  toggleScenarioIgnored: (scenarioId: string) => void;
  selectAllRequirements: (ids: string[]) => void;
  deselectAllRequirements: () => void;
  acceptedRisks: Record<string, AcceptedRisk>;
  acceptRisk: (req1Id: string, req2Id: string, rationale: string) => void;
  revokeRisk: (req1Id: string, req2Id: string) => void;
  resolvedConflicts: Record<string, string>;
  setResolvedConflict: (groupId: string, reqId: string) => void;
  conflictResolutions: Record<string, ConflictResolutionDetails>;
  setConflictResolutionDetails: (groupId: string, details: ConflictResolutionDetails) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  sealProfile: SealProfile;
  reset: () => void;
  importState: (newState: Partial<State>) => void;
  toggleFlag: (type: 'requirement' | 'scenario' | 'option' | 'tree-node', id: string, flagged: boolean, comment: string) => Promise<void>;
  forceSwapRequirement: (oldUid: string, newUid: string, context?: 'step6' | 'matrix') => void;
  forceToggleRequirement: (uid: string, context?: 'step6' | 'matrix') => void;
  updateConflict: (req1Id: string, req2Id: string, data: any) => Promise<void>;
  hasSeenTreeTutorial: boolean;
  setHasSeenTreeTutorial: (value: boolean) => void;
  hasSeenScenarioTutorial: boolean;
  setHasSeenScenarioTutorial: (value: boolean) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      requirements: [],
      groups: [],
      categories: [],
      decisionTrees: [],
      scenarios: [],
      conflicts: [],
      fetchInitialData: async () => {
        const load = async (url: string, field: keyof State) => {
          try {
            const res = await apiFetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) {
              set((state) => ({ ...state, [field]: data }));
            }
          } catch (e) {
            console.error(`Store: Failed to load ${field} from ${url}:`, e);
          }
        };

        // Load sequentially to be safe and see progress
        await load('/api/requirements', 'requirements');
        await load('/api/groups', 'groups');
        await load('/api/categories', 'categories');
        await load('/api/trees', 'decisionTrees');
        await load('/api/scenarios', 'scenarios');
        await load('/api/conflicts', 'conflicts');
      },
      updateConflict: async (req1Id: string, req2Id: string, data: any) => {
        try {
          const res = await apiFetch(`/api/conflicts/${req1Id}/${req2Id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (res.ok) {
            set((state) => ({
              conflicts: state.conflicts.map((c: any) => 
                (c.pair[0] === req1Id && c.pair[1] === req2Id) || (c.pair[0] === req2Id && c.pair[1] === req1Id)
                  ? { ...c, ...data, is_ground_truth: data.is_ground_truth } 
                  : c
              )
            }));
          }
        } catch (e) {
          console.error('Failed to update conflict', e);
        }
      },
      sessionId: '',
      setSessionId: (sessionId) => set({ sessionId }),
      sealProfile: { J: 0, T: 0, O: 0 },
      step: 1,
      maxStep: 1,
      setStep: (step) => set((state) => ({ step, maxStep: Math.max(state.maxStep, step) })),
      componentName: '',
      setComponentName: (componentName) => set({ componentName }),
      evaluationGoal: null,
      setEvaluationGoal: (evaluationGoal) => set({ evaluationGoal }),
      selectedSovereigntyReqs: {},
      selectedScenarioReqs: {},
      selectedRequirements: {},
      manualRequirementSources: {},
      treeResults: {},
      scenarioResults: {},
      scenarioContexts: {},
      ignoredScenarios: {},
      treeTraversalStates: {},
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      isTourActive: false,
      currentTourStep: 0,
      tourCompletedForSteps: {},
      startTour: () => set({ isTourActive: true, currentTourStep: 0 }),
      stopTour: () => set((state) => ({ 
        isTourActive: false, 
        tourCompletedForSteps: { ...state.tourCompletedForSteps, [state.step]: true } 
      })),
      nextTourStep: () => set((state) => ({ currentTourStep: state.currentTourStep + 1 })),
      setTourStep: (currentTourStep) => set({ currentTourStep }),
      hasSeenTreeTutorial: false,
      setHasSeenTreeTutorial: (value) => set({ hasSeenTreeTutorial: value }),
      hasSeenScenarioTutorial: false,
      setHasSeenScenarioTutorial: (value) => set({ hasSeenScenarioTutorial: value }),
      setTreeTraversalState: (index, traversalState) => set((state) => ({
        treeTraversalStates: {
          ...state.treeTraversalStates,
          [index]: traversalState
        }
      })),
      activeTreeIndex: 0,
      setActiveTreeIndex: (activeTreeIndex) => set({ activeTreeIndex }),
      acceptedRisks: {},
      acceptRisk: (req1Id, req2Id, rationale) => set((state) => {
        const key = req1Id < req2Id ? `${req1Id}-${req2Id}` : `${req2Id}-${req1Id}`;
        return {
          acceptedRisks: {
            ...state.acceptedRisks,
            [key]: { rationale, timestamp: new Date().toISOString() }
          }
        };
      }),
      revokeRisk: (req1Id, req2Id) => set((state) => {
        const key = req1Id < req2Id ? `${req1Id}-${req2Id}` : `${req2Id}-${req1Id}`;
        const newRisks = { ...state.acceptedRisks };
        delete newRisks[key];
        return { acceptedRisks: newRisks };
      }),
      resolvedConflicts: {},
      setResolvedConflict: (groupId, reqId) => set((state) => ({
        resolvedConflicts: {
          ...state.resolvedConflicts,
          [groupId]: reqId
        }
      })),
      conflictResolutions: {},
      setConflictResolutionDetails: (groupId, details) => set((state) => ({
        conflictResolutions: {
          ...state.conflictResolutions,
          [groupId]: details
        }
      })),
      toggleRequirement: (uid, context = 'step6') => set((state) => {
        const newSelected = { ...state.selectedRequirements };
        const newManualSources = { ...state.manualRequirementSources };
        if (newSelected[uid] !== undefined) {
          const req = state.requirements.find((r: any) => r.uid === uid);
          if (req && req.groupId) {
            const group = state.groups.find(g => g.id === req.groupId);
            if (group && group.type === 'exclusive') {
              const hasOtherActiveMate = state.requirements.some((r: any) => 
                r.groupId === req.groupId && 
                r.uid !== uid && 
                (state.selectedRequirements[r.uid] !== undefined || 
                 state.selectedSovereigntyReqs[r.uid] !== undefined || 
                 state.selectedScenarioReqs[r.uid] !== undefined)
              );
              if (!hasOtherActiveMate) {
                // In exclusive groups, one must always be active. Prevent direct deselection.
                return { selectedRequirements: state.selectedRequirements, manualRequirementSources: state.manualRequirementSources };
              }
            }
          }
          delete newSelected[uid];
          delete newManualSources[uid];
        } else {
          const req = state.requirements.find((r: any) => r.uid === uid);
          if (req && req.groupId) {
            const group = state.groups.find(g => g.id === req.groupId);
            if (group && group.type === 'exclusive') {
              const groupMates = state.requirements.filter((r: any) => r.groupId === req.groupId && r.uid !== uid);
              groupMates.forEach((mate: any) => {
                delete newSelected[mate.uid];
                delete newManualSources[mate.uid];
              });
            }
          }
          newSelected[uid] = 5;
          newManualSources[uid] = context;
        }
        return { selectedRequirements: newSelected, manualRequirementSources: newManualSources };
      }),
      forceToggleRequirement: (uid, context = 'step6') => set((state) => {
        const req = state.requirements.find((r: any) => r.uid === uid);
        const isSelected = state.selectedRequirements[uid] !== undefined || 
                           state.selectedSovereigntyReqs[uid] !== undefined || 
                           state.selectedScenarioReqs[uid] !== undefined;
      
        if (isSelected) {
          if (req && req.groupId) {
            const group = state.groups.find(g => g.id === req.groupId);
            if (group && group.type === 'exclusive') {
               const hasOtherActiveMate = state.requirements.some((r: any) => 
                 r.groupId === req.groupId && 
                 r.uid !== uid && 
                 (state.selectedRequirements[r.uid] !== undefined || 
                  state.selectedSovereigntyReqs[r.uid] !== undefined || 
                  state.selectedScenarioReqs[r.uid] !== undefined)
               );
               if (!hasOtherActiveMate) {
                 return {}; // Cannot directly deselect from an exclusive group
               }
            }
            if (group && group.type === 'at-least-one') {
              const groupMates = state.requirements.filter((r: any) => r.groupId === req.groupId && r.uid !== uid);
              const hasOtherActiveMate = groupMates.some((mate: any) => 
                state.selectedRequirements[mate.uid] !== undefined ||
                state.selectedSovereigntyReqs[mate.uid] !== undefined ||
                state.selectedScenarioReqs[mate.uid] !== undefined
              );
              if (!hasOtherActiveMate) {
                return {}; // Cannot deselect the last active member of an at-least-one group
              }
            }
          }
          const newReqs = { ...state.selectedRequirements };
          const newSovReqs = { ...state.selectedSovereigntyReqs };
          const newScenReqs = { ...state.selectedScenarioReqs };
          const newManualSources = { ...state.manualRequirementSources };
          delete newReqs[uid];
          delete newSovReqs[uid];
          delete newScenReqs[uid];
          delete newManualSources[uid];
          return { 
            selectedRequirements: newReqs, 
            selectedSovereigntyReqs: newSovReqs, 
            selectedScenarioReqs: newScenReqs,
            manualRequirementSources: newManualSources
          };
        } else {
          const newManualSources = { ...state.manualRequirementSources };
          if (req && req.groupId) {
             const group = state.groups.find(g => g.id === req.groupId);
             if (group && group.type === 'exclusive') {
                 const newReqs = { ...state.selectedRequirements };
                 const newSovReqs = { ...state.selectedSovereigntyReqs };
                 const newScenReqs = { ...state.selectedScenarioReqs };
                 const groupMates = state.requirements.filter((r: any) => r.groupId === req.groupId && r.uid !== uid);
                 groupMates.forEach((mate: any) => {
                   delete newReqs[mate.uid];
                   delete newSovReqs[mate.uid];
                   delete newScenReqs[mate.uid];
                   delete newManualSources[mate.uid];
                 });
                 newReqs[uid] = 5;
                 newManualSources[uid] = context;
                 return {
                   selectedRequirements: newReqs,
                   selectedSovereigntyReqs: newSovReqs,
                   selectedScenarioReqs: newScenReqs,
                   manualRequirementSources: newManualSources
                 };
             }
          }
          newManualSources[uid] = context;
          return {
            selectedRequirements: {
              ...state.selectedRequirements,
              [uid]: 5
            },
            manualRequirementSources: newManualSources
          };
        }
      }),
      forceSwapRequirement: (oldUid, newUid, context = 'step6') => set((state) => {
        const newReqs = { ...state.selectedRequirements };
        const newSovReqs = { ...state.selectedSovereigntyReqs };
        const newScenReqs = { ...state.selectedScenarioReqs };
        const newManualSources = { ...state.manualRequirementSources };
        
        const priority = newReqs[oldUid] ?? newSovReqs[oldUid] ?? newScenReqs[oldUid] ?? 5;
        
        delete newReqs[oldUid];
        delete newSovReqs[oldUid];
        delete newScenReqs[oldUid];
        delete newManualSources[oldUid];
        
        newReqs[newUid] = priority;
        newManualSources[newUid] = context;
        
        return { 
            selectedRequirements: newReqs, 
            selectedSovereigntyReqs: newSovReqs, 
            selectedScenarioReqs: newScenReqs,
            manualRequirementSources: newManualSources
        };
      }),
      setSovereigntyPriority: (uid, priority) => set((state) => ({
        selectedSovereigntyReqs: {
          ...state.selectedSovereigntyReqs,
          [uid]: priority,
        }
      })),
      removeSovereigntyReq: (uid) => set((state) => {
        const next = { ...state.selectedSovereigntyReqs };
        delete next[uid];
        return { selectedSovereigntyReqs: next };
      }),
      setScenarioReqPriority: (uid, priority) => set((state) => ({
        selectedScenarioReqs: {
          ...state.selectedScenarioReqs,
          [uid]: priority,
        }
      })),
      removeScenarioReq: (uid) => set((state) => {
        const next = { ...state.selectedScenarioReqs };
        delete next[uid];
        return { selectedScenarioReqs: next };
      }),
      setPriority: (uid, priority) => set((state) => ({
        selectedRequirements: {
          ...state.selectedRequirements,
          [uid]: priority,
        }
      })),
      updateRoutedPriority: (uid, priority) => {
        const state = get();
        if (state.selectedRequirements[uid] !== undefined) {
          state.setPriority(uid, priority);
        } else if (state.selectedScenarioReqs[uid] !== undefined) {
          state.setScenarioReqPriority(uid, priority);
        } else if (state.selectedSovereigntyReqs[uid] !== undefined) {
          state.setSovereigntyPriority(uid, priority);
        } else {
          state.setPriority(uid, priority);
        }
      },
      setTreeResult: (treeId, result) => set((state) => {
        const newSovReqs = { ...state.selectedSovereigntyReqs };
        
        // 1. Clean up orphaned requirements from the previous evaluation of this tree
        const oldResult = state.treeResults[treeId];
        if (oldResult?.referenced_requirements) {
          oldResult.referenced_requirements.forEach(reqUid => {
            // If it's no longer in the new result's requirements
            if (!result.referenced_requirements?.includes(reqUid)) {
              // Check if it's still triggered by ANY OTHER tree
              let isTriggeredByOther = false;
              Object.entries(state.treeResults).forEach(([otherId, otherResult]) => {
                if (otherId !== treeId && otherResult.referenced_requirements?.includes(reqUid)) {
                  isTriggeredByOther = true;
                }
              });
              // If not triggered by any other tree, remove it
              if (!isTriggeredByOther) {
                delete newSovReqs[reqUid];
              }
            }
          });
        }
        
        // 2. Calculate average BV and TR for the new tree path
        let totalBv = 0;
        let totalTr = 0;
        let count = 0;
        if (result.evaluations) {
          Object.values(result.evaluations).forEach((evalData) => {
            if (evalData.businessValue !== undefined && evalData.techRisk !== undefined) {
              totalBv += evalData.businessValue;
              totalTr += evalData.techRisk;
              count++;
            }
          });
        }
        const avgBv = count > 0 ? Math.round(totalBv / count) : 5;
        const avgTr = count > 0 ? Math.round(totalTr / count) : 5;
        const priority = calculatePriority(avgBv, avgTr);

        // 3. Add or update requirements triggered by the new result
        if (result.referenced_requirements) {
          result.referenced_requirements.forEach((reqUid: string) => {
            // Only increase priority or add if missing, to preserve manual user overrides (if higher)
            if (newSovReqs[reqUid] === undefined || newSovReqs[reqUid] < priority) {
              newSovReqs[reqUid] = priority;
            }
          });
        }
        
        // 4. Update sealProfile based on the treeId and result level
        // Extact the level from the resultNode (e.g. 'end-2' -> 2)
        const level = parseInt(result.resultNode.split('-')[1] || '0', 10);
        
        const newSealProfile = { ...state.sealProfile };
        if (treeId === 'jurisdictional-data-sovereignty') {
          newSealProfile.J = level;
        } else if (treeId === 'technological-sovereignty') {
          newSealProfile.T = level;
        } else if (treeId === 'operational-sovereignty') {
          newSealProfile.O = level;
        }

        return {
          treeResults: {
            ...state.treeResults,
            [treeId]: result,
          },
          selectedSovereigntyReqs: newSovReqs,
          sealProfile: newSealProfile
        };
      }),
      setScenarioResult: (scenarioId, result, triggeredReqs) => set((state) => {
        const newResults = { ...state.scenarioResults };
        const newScenReqs = { ...state.selectedScenarioReqs };
        
        // 1. Clean up orphaned requirements from the previous evaluation of this scenario
        const oldResult = state.scenarioResults[scenarioId];
        if (oldResult?.triggeredReqs) {
          oldResult.triggeredReqs.forEach(reqUid => {
            if (!triggeredReqs.includes(reqUid)) {
              // Check if it's still triggered by ANY OTHER scenario
              let isTriggeredByOther = false;
              Object.entries(state.scenarioResults).forEach(([otherId, otherResult]) => {
                if (otherId !== scenarioId && otherResult.triggeredReqs?.includes(reqUid)) {
                  isTriggeredByOther = true;
                }
              });
              if (!isTriggeredByOther) {
                delete newScenReqs[reqUid];
              }
            }
          });
        }

        // 2. Update the results and add new requirements
        if (result) {
          newResults[scenarioId] = { ...result, triggeredReqs };
          const priority = calculatePriority(result.businessValue || 5, result.risk || 5);
          triggeredReqs.forEach((reqUid: string) => {
            if (newScenReqs[reqUid] === undefined || newScenReqs[reqUid] < priority) {
              newScenReqs[reqUid] = priority;
            }
          });
        } else {
          delete newResults[scenarioId];
        }
        
        return {
          scenarioResults: newResults,
          selectedScenarioReqs: newScenReqs
        };
      }),
      setScenarioContext: (scenarioId, context) => set((state) => ({
        scenarioContexts: {
          ...state.scenarioContexts,
          [scenarioId]: context
        }
      })),
      toggleScenarioIgnored: (scenarioId) => set((state) => {
        const next = { ...state.ignoredScenarios };
        if (next[scenarioId]) delete next[scenarioId];
        else next[scenarioId] = true;
        return { ignoredScenarios: next };
      }),
      selectAllRequirements: (ids) => set((state) => {
        const newSelected: Record<string, Priority> = {};
        const newManualSources: Record<string, 'step6' | 'matrix'> = {};
        const seenGroups = new Set<string>();
        Object.keys(state.selectedSovereigntyReqs).forEach(lockedUid => {
          const lockedReq = state.requirements.find((r: any) => r.uid === lockedUid);
          if (lockedReq && lockedReq.groupId) {
            const group = state.groups.find(g => g.id === lockedReq.groupId);
            if (group && group.type === 'exclusive') {
              seenGroups.add(lockedReq.groupId);
            }
          }
        });
        Object.keys(state.selectedScenarioReqs).forEach(lockedUid => {
          const lockedReq = state.requirements.find((r: any) => r.uid === lockedUid);
          if (lockedReq && lockedReq.groupId) {
            const group = state.groups.find(g => g.id === lockedReq.groupId);
            if (group && group.type === 'exclusive') {
              seenGroups.add(lockedReq.groupId);
            }
          }
        });
        ids.forEach(uid => {
          const req = state.requirements.find((r: any) => r.uid === uid);
          if (req && req.groupId) {
            const group = state.groups.find(g => g.id === req.groupId);
            if (group && group.type === 'exclusive') {
              if (!seenGroups.has(req.groupId)) {
                seenGroups.add(req.groupId);
                newSelected[uid] = 5;
                newManualSources[uid] = 'step6';
              }
            } else {
              newSelected[uid] = 5;
              newManualSources[uid] = 'step6';
            }
          } else {
            newSelected[uid] = 5;
            newManualSources[uid] = 'step6';
          }
        });
        return { 
          selectedRequirements: newSelected,
          manualRequirementSources: newManualSources 
        };
      }),
      deselectAllRequirements: () => set({ selectedRequirements: {}, manualRequirementSources: {} }),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      reset: () => set((state) => ({ sessionId: '', step: 1, maxStep: 1, componentName: '', evaluationGoal: null, selectedRequirements: {}, manualRequirementSources: {}, selectedSovereigntyReqs: {}, selectedScenarioReqs: {}, resolvedConflicts: {}, conflictResolutions: {}, acceptedRisks: {}, treeResults: {}, scenarioResults: {}, scenarioContexts: {}, ignoredScenarios: {}, treeTraversalStates: {}, activeTreeIndex: 0, theme: state.theme, hasSeenTreeTutorial: state.hasSeenTreeTutorial, hasSeenScenarioTutorial: state.hasSeenScenarioTutorial, hasSeenOnboarding: state.hasSeenOnboarding, sealProfile: { J: 0, T: 0, O: 0 } })),
      importState: (newState) => set((state) => {
        // Safe import: Filter out orphaned references to deleted scenarios and requirements
        const validReqUids = new Set(state.requirements.map((r: any) => r.uid));
        const validScenIds = new Set(state.scenarios.map((s: any) => s.scenario_id));

        const cleanObj = (obj: any, validKeys: Set<string>) => {
          if (!obj) return obj;
          const cleaned: any = {};
          Object.keys(obj).forEach(key => {
            if (validKeys.has(key)) cleaned[key] = obj[key];
          });
          return cleaned;
        };

        const safeState = { ...newState };

        if (safeState.selectedRequirements) safeState.selectedRequirements = cleanObj(safeState.selectedRequirements, validReqUids);
        if (safeState.selectedSovereigntyReqs) safeState.selectedSovereigntyReqs = cleanObj(safeState.selectedSovereigntyReqs, validReqUids);
        if (safeState.selectedScenarioReqs) safeState.selectedScenarioReqs = cleanObj(safeState.selectedScenarioReqs, validReqUids);
        if (safeState.manualRequirementSources) safeState.manualRequirementSources = cleanObj(safeState.manualRequirementSources, validReqUids);
        if (safeState.scenarioContexts) safeState.scenarioContexts = cleanObj(safeState.scenarioContexts, validScenIds);
        if (safeState.scenarioResults) safeState.scenarioResults = cleanObj(safeState.scenarioResults, validScenIds);
        if (safeState.ignoredScenarios) safeState.ignoredScenarios = cleanObj(safeState.ignoredScenarios, validScenIds);

        // Also clean acceptedRisks (key format is req1Id-req2Id)
        if (safeState.acceptedRisks) {
          const cleanedRisks: any = {};
          Object.entries(safeState.acceptedRisks).forEach(([key, val]) => {
             const req1Id = key.substring(0, 36);
             const req2Id = key.substring(37);
             if (validReqUids.has(req1Id) && validReqUids.has(req2Id)) {
                cleanedRisks[key] = val;
             }
          });
          safeState.acceptedRisks = cleanedRisks;
        }

        return { 
          ...state, 
          ...safeState, 
          maxStep: Math.max(state.maxStep || 1, newState.step || 1) 
        };
      }),
      toggleFlag: async (type, id, flagged, comment) => {
        try {
          await apiFetch('/api/flag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, id, flagged, comment })
          });
        } catch (error) {
          console.error('Error toggling flag:', error);
        }
      }
    }),
    {
      name: 'sovereignty-navigator-storage',
      partialize: (state) => {
        const {
          requirements: _requirements,
          groups: _groups,
          categories: _categories,
          decisionTrees: _decisionTrees,
          scenarios: _scenarios,
          conflicts: _conflicts,
          ...rest
        } = state;
        return rest;
      }
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__store__ = useStore;
}

export function getConflicts(state: State): Conflict[] {
  const conflicts: Conflict[] = [];
  const sovGroups = new Map<string, string>();

  Object.keys(state.selectedSovereigntyReqs).forEach(reqId => {
    const req = state.requirements.find((r: any) => r.uid === reqId);
    if (req && req.groupId) {
      const group = state.groups.find(g => g.id === req.groupId);
      if (group && group.type === 'exclusive') {
        sovGroups.set(req.groupId, reqId);
      }
    }
  });

  Object.keys(state.selectedScenarioReqs).forEach(reqId => {
    const req = state.requirements.find((r: any) => r.uid === reqId);
    if (req && req.groupId) {
      const sovReqId = sovGroups.get(req.groupId);
      if (sovReqId && sovReqId !== reqId) {
        conflicts.push({
          groupId: req.groupId,
          sovereigntyReqId: sovReqId,
          scenarioReqId: reqId
        });
      }
    }
  });

  return conflicts;
}
