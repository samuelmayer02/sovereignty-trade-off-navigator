import { describe, it, expect } from 'vitest';
import { GET as getRequirements } from '../app/api/requirements/route';
import { GET as getGroups } from '../app/api/groups/route';
import { GET as getCategories } from '../app/api/categories/route';
import { GET as getTrees } from '../app/api/trees/route';
import { GET as getScenarios } from '../app/api/scenarios/route';
import { GET as getConflicts } from '../app/api/conflicts/route';
import { GET as getSovereigntyRequirements } from '../app/api/sovereignty-requirements/route';

describe('API Route GET Handlers', () => {

  it('should fetch requirements successfully (HTTP 200)', async () => {
    const res = await getRequirements();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    // Ensure category is dynamically joined and present on each requirement
    for (const req of data) {
      expect(req.uid).toBeDefined();
      expect(req.category).toBeDefined();
      expect(typeof req.category).toBe('string');
    }
  });

  it('should fetch groups successfully (HTTP 200)', async () => {
    const res = await getGroups();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should fetch categories successfully (HTTP 200)', async () => {
    const res = await getCategories();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should fetch decision trees successfully (HTTP 200)', async () => {
    const res = await getTrees();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should fetch scenarios successfully (HTTP 200)', async () => {
    const res = await getScenarios();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should fetch conflicts successfully (HTTP 200)', async () => {
    const res = await getConflicts();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should fetch sovereignty-requirements successfully (HTTP 200)', async () => {
    const res = await getSovereigntyRequirements();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    for (const req of data) {
      expect(req.uid).toBeDefined();
    }
  });

});
