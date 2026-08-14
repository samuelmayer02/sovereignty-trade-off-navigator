import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';

describe('Session State Export and Import', () => {
  beforeEach(() => {
    useStore.setState({
      sessionId: 'test-session-123',
      step: 4,
      maxStep: 5,
      componentName: 'Test Component',
      selectedRequirements: { '11111111-1111-1111-1111-111111111111': 5, '22222222-2222-2222-2222-222222222222': 8 },
      selectedSovereigntyReqs: { 'S-1': 10 },
      selectedScenarioReqs: { 'SC-1': 5 },
      manualRequirementSources: { '11111111-1111-1111-1111-111111111111': 'step6', '22222222-2222-2222-2222-222222222222': 'matrix' },
      treeResults: { 'tree-1': { treeId: 'tree-1', resultNode: 'node-2', evaluations: {} } },
      scenarioResults: { 'scen-1': { optionIndex: 0, businessValue: 5, risk: 5, notes: '', triggeredReqs: ['SC-1'] } },
      evaluationGoal: 'soll',
      scenarioContexts: { 'scen-1': 'Test context' },
      ignoredScenarios: { 'scen-2': true },
      hasSeenOnboarding: true,
      hasSeenTreeTutorial: true,
      hasSeenScenarioTutorial: false,
      treeTraversalStates: {},
      activeTreeIndex: 1,
      acceptedRisks: { '11111111-1111-1111-1111-111111111111-22222222-2222-2222-2222-222222222222': { rationale: 'Manually accepted for testing', timestamp: '2026-01-01T12:00:00.000Z' } },
      resolvedConflicts: { 'G-1': '11111111-1111-1111-1111-111111111111' },
      theme: 'dark',
      requirements: [{ uid: '11111111-1111-1111-1111-111111111111' }, { uid: '22222222-2222-2222-2222-222222222222' }, { uid: 'S-1' }, { uid: 'SC-1' }] as any,
      scenarios: [{ scenario_id: 'scen-1' }, { scenario_id: 'scen-2' }] as any
    });
  });

  it('should correctly import all fields into the store, including manual states', () => {
    // 1. Simulate the export object structure (as generated in SessionManager.tsx)
    const store = useStore.getState();
    const stateToExport = {
      sessionId: store.sessionId,
      step: store.step,
      componentName: store.componentName,
      selectedRequirements: store.selectedRequirements,
      selectedSovereigntyReqs: store.selectedSovereigntyReqs,
      selectedScenarioReqs: store.selectedScenarioReqs,
      evaluationGoal: store.evaluationGoal,
      scenarioContexts: store.scenarioContexts,
      ignoredScenarios: store.ignoredScenarios,
      hasSeenOnboarding: store.hasSeenOnboarding,
      hasSeenTreeTutorial: store.hasSeenTreeTutorial,
      hasSeenScenarioTutorial: store.hasSeenScenarioTutorial,
      treeResults: store.treeResults,
      scenarioResults: store.scenarioResults,
      treeTraversalStates: store.treeTraversalStates,
      activeTreeIndex: store.activeTreeIndex,
      acceptedRisks: store.acceptedRisks,
      resolvedConflicts: store.resolvedConflicts,
      manualRequirementSources: store.manualRequirementSources,
      theme: store.theme
    };

    // 2. Reset the store
    useStore.getState().reset();
    const resetState = useStore.getState();
    expect(resetState.sessionId).toBe('');
    expect(Object.keys(resetState.acceptedRisks).length).toBe(0);

    // 3. Import the state
    useStore.getState().importState({
      ...stateToExport,
      requirements: [{ uid: '11111111-1111-1111-1111-111111111111' }, { uid: '22222222-2222-2222-2222-222222222222' }, { uid: 'S-1' }, { uid: 'SC-1' }] as any,
      scenarios: [{ scenario_id: 'scen-1' }, { scenario_id: 'scen-2' }] as any
    });
    const importedState = useStore.getState();

    // 4. Verify all fields are restored correctly
    expect(importedState.sessionId).toBe('test-session-123');
    expect(importedState.step).toBe(4);
    expect(importedState.componentName).toBe('Test Component');
    expect(importedState.selectedRequirements).toEqual({ '11111111-1111-1111-1111-111111111111': 5, '22222222-2222-2222-2222-222222222222': 8 });
    expect(importedState.selectedSovereigntyReqs).toEqual({ 'S-1': 10 });
    expect(importedState.selectedScenarioReqs).toEqual({ 'SC-1': 5 });
    
    // Most importantly, verify the previously missing fields
    expect(importedState.acceptedRisks).toEqual({ '11111111-1111-1111-1111-111111111111-22222222-2222-2222-2222-222222222222': { rationale: 'Manually accepted for testing', timestamp: '2026-01-01T12:00:00.000Z' } });
    expect(importedState.resolvedConflicts).toEqual({ 'G-1': '11111111-1111-1111-1111-111111111111' });
    expect(importedState.manualRequirementSources).toEqual({ '11111111-1111-1111-1111-111111111111': 'step6', '22222222-2222-2222-2222-222222222222': 'matrix' });
    expect(importedState.evaluationGoal).toBe('soll');
    expect(importedState.scenarioContexts).toEqual({ 'scen-1': 'Test context' });
    expect(importedState.ignoredScenarios).toEqual({ 'scen-2': true });
    expect(importedState.hasSeenOnboarding).toBe(true);
    expect(importedState.hasSeenTreeTutorial).toBe(true);
    expect(importedState.hasSeenScenarioTutorial).toBe(false);
    expect(importedState.theme).toBe('dark');
  });
});
