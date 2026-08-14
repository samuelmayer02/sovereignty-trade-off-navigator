import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';

describe('useStore manualRequirementSources tracking', () => {
  beforeEach(() => {
    // Reset the store before each test
    useStore.setState({
      requirements: [
        { uid: 'R-1', name: 'Req 1', groupId: null },
        { uid: 'R-2', name: 'Req 2', groupId: 'G-1' },
        { uid: 'R-3', name: 'Req 3', groupId: 'G-1' }
      ],
      groups: [
        { id: 'G-1', name: 'Group 1', type: 'exclusive' }
      ],
      selectedRequirements: {},
      manualRequirementSources: {},
      selectedSovereigntyReqs: {},
      selectedScenarioReqs: {}
    });
  });

  it('should default context to step6 when toggling requirement', () => {
    const { toggleRequirement } = useStore.getState();
    toggleRequirement('R-1');
    const state = useStore.getState();
    expect(state.selectedRequirements['R-1']).toBeDefined();
    expect(state.manualRequirementSources['R-1']).toBe('step6');
  });

  it('should use provided context when toggling requirement', () => {
    const { toggleRequirement } = useStore.getState();
    toggleRequirement('R-1', 'matrix');
    const state = useStore.getState();
    expect(state.selectedRequirements['R-1']).toBeDefined();
    expect(state.manualRequirementSources['R-1']).toBe('matrix');
  });

  it('should clear manual source when toggling requirement off', () => {
    const { toggleRequirement } = useStore.getState();
    toggleRequirement('R-1', 'step6'); // turn on
    toggleRequirement('R-1'); // turn off
    const state = useStore.getState();
    expect(state.selectedRequirements['R-1']).toBeUndefined();
    expect(state.manualRequirementSources['R-1']).toBeUndefined();
  });

  it('should default context to step6 when force swapping requirement', () => {
    const { toggleRequirement, forceSwapRequirement } = useStore.getState();
    toggleRequirement('R-2'); // turn on R-2 in exclusive group G-1
    forceSwapRequirement('R-2', 'R-3'); // swap to R-3
    const state = useStore.getState();
    expect(state.selectedRequirements['R-2']).toBeUndefined();
    expect(state.manualRequirementSources['R-2']).toBeUndefined();
    expect(state.selectedRequirements['R-3']).toBeDefined();
    expect(state.manualRequirementSources['R-3']).toBe('step6');
  });

  it('should use provided context when force swapping requirement', () => {
    const { toggleRequirement, forceSwapRequirement } = useStore.getState();
    toggleRequirement('R-2'); // turn on R-2 in exclusive group G-1
    forceSwapRequirement('R-2', 'R-3', 'matrix'); // swap to R-3 in matrix
    const state = useStore.getState();
    expect(state.selectedRequirements['R-2']).toBeUndefined();
    expect(state.manualRequirementSources['R-2']).toBeUndefined();
    expect(state.selectedRequirements['R-3']).toBeDefined();
    expect(state.manualRequirementSources['R-3']).toBe('matrix');
  });

  it('should set context to step6 when selecting all requirements', () => {
    const { selectAllRequirements } = useStore.getState();
    selectAllRequirements(['R-1', 'R-2']);
    const state = useStore.getState();
    expect(state.selectedRequirements['R-1']).toBeDefined();
    expect(state.manualRequirementSources['R-1']).toBe('step6');
    expect(state.selectedRequirements['R-2']).toBeDefined();
    expect(state.manualRequirementSources['R-2']).toBe('step6');
  });

  it('should clear all manual sources when deselecting all requirements', () => {
    const { selectAllRequirements, deselectAllRequirements } = useStore.getState();
    selectAllRequirements(['R-1', 'R-2']);
    deselectAllRequirements();
    const state = useStore.getState();
    expect(state.selectedRequirements['R-1']).toBeUndefined();
    expect(state.manualRequirementSources['R-1']).toBeUndefined();
    expect(Object.keys(state.manualRequirementSources).length).toBe(0);
  });
});

describe('useStore updateRoutedPriority routing', () => {
  beforeEach(() => {
    useStore.setState({
      selectedRequirements: {},
      selectedScenarioReqs: {},
      selectedSovereigntyReqs: {}
    });
  });

  it('should route priority update to selectedRequirements if present', () => {
    useStore.setState({ selectedRequirements: { 'REQ-1': 5 } });
    const { updateRoutedPriority } = useStore.getState();
    updateRoutedPriority('REQ-1', 8);
    const state = useStore.getState();
    expect(state.selectedRequirements['REQ-1']).toBe(8);
  });

  it('should route priority update to selectedScenarioReqs if present', () => {
    useStore.setState({ selectedScenarioReqs: { 'REQ-2': 5 } });
    const { updateRoutedPriority } = useStore.getState();
    updateRoutedPriority('REQ-2', 9);
    const state = useStore.getState();
    expect(state.selectedScenarioReqs['REQ-2']).toBe(9);
    expect(state.selectedRequirements['REQ-2']).toBeUndefined();
  });

  it('should route priority update to selectedSovereigntyReqs if present', () => {
    useStore.setState({ selectedSovereigntyReqs: { 'REQ-3': 5 } });
    const { updateRoutedPriority } = useStore.getState();
    updateRoutedPriority('REQ-3', 10);
    const state = useStore.getState();
    expect(state.selectedSovereigntyReqs['REQ-3']).toBe(10);
    expect(state.selectedRequirements['REQ-3']).toBeUndefined();
  });

  it('should fallback to selectedRequirements if requirement is not in any list', () => {
    const { updateRoutedPriority } = useStore.getState();
    updateRoutedPriority('REQ-4', 7);
    const state = useStore.getState();
    expect(state.selectedRequirements['REQ-4']).toBe(7);
  });

  it('should prioritize routing in order: manual > scenario > sovereignty', () => {
    useStore.setState({ 
      selectedRequirements: { 'REQ-5': 5 },
      selectedScenarioReqs: { 'REQ-5': 5 },
      selectedSovereigntyReqs: { 'REQ-5': 5 }
    });
    const { updateRoutedPriority } = useStore.getState();
    updateRoutedPriority('REQ-5', 6);
    const state = useStore.getState();
    
    // Only the highest priority store should be updated
    expect(state.selectedRequirements['REQ-5']).toBe(6);
    expect(state.selectedScenarioReqs['REQ-5']).toBe(5);
    expect(state.selectedSovereigntyReqs['REQ-5']).toBe(5);
  });
});

describe('useStore calculatePriority rounding', () => {
  beforeEach(() => {
    useStore.setState({
      selectedScenarioReqs: {},
      scenarioResults: {},
    });
  });

  it('should calculate priority with one decimal place', () => {
    const { setScenarioResult } = useStore.getState();
    // businessValue = 5, risk = 3 => (5 * 10) / (5 + 3) = 6.25 => rounded to 6.3
    setScenarioResult('scen-1', { optionIndex: 1, businessValue: 5, risk: 3, notes: '', triggeredReqs: ['REQ-1'] }, ['REQ-1']);
    const state = useStore.getState();
    expect(state.selectedScenarioReqs['REQ-1']).toBe(6.3);
  });

  it('should calculate priority as integer if it rounds cleanly', () => {
    const { setScenarioResult } = useStore.getState();
    // businessValue = 5, risk = 5 => (5 * 10) / (5 + 5) = 5
    setScenarioResult('scen-1', { optionIndex: 1, businessValue: 5, risk: 5, notes: '', triggeredReqs: ['REQ-1'] }, ['REQ-1']);
    const state = useStore.getState();
    expect(state.selectedScenarioReqs['REQ-1']).toBe(5);
  });
});

