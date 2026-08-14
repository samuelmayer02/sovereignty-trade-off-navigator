import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useStore Dual-Mode Baseline', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    useStore.setState({
      requirements: [],
      groups: [],
      categories: [],
      decisionTrees: [],
      scenarios: [],
      conflicts: [],
      categoryImpacts: [],
    });
  });

  it('fetchInitialData calls correct /api/ endpoints', async () => {
    // Mock the responses for each load call
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'mocked' }],
    });

    const store = useStore.getState();
    await store.fetchInitialData();

    // Verify fetch was called 7 times with /api/ endpoints
    expect(mockFetch).toHaveBeenCalledTimes(7);
    expect(mockFetch).toHaveBeenCalledWith('/api/requirements');
    expect(mockFetch).toHaveBeenCalledWith('/api/groups');
    expect(mockFetch).toHaveBeenCalledWith('/api/categories');
    expect(mockFetch).toHaveBeenCalledWith('/api/trees');
    expect(mockFetch).toHaveBeenCalledWith('/api/scenarios');
    expect(mockFetch).toHaveBeenCalledWith('/api/conflicts');
    expect(mockFetch).toHaveBeenCalledWith('/api/category-impacts');

    const state = useStore.getState();
    expect(state.requirements.length).toBe(1);
    expect(state.groups.length).toBe(1);
  });

  it('updateConflict triggers PUT request and updates local state', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
    });

    // Seed state
    useStore.setState({
      conflicts: [
        { pair: ['req1', 'req2'], is_ground_truth: false }
      ]
    });

    const store = useStore.getState();
    await store.updateConflict('req1', 'req2', { is_ground_truth: true });

    expect(mockFetch).toHaveBeenCalledWith('/api/conflicts/req1/req2', expect.objectContaining({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_ground_truth: true })
    }));

    const state = useStore.getState();
    expect(state.conflicts[0].is_ground_truth).toBe(true);
  });
});
