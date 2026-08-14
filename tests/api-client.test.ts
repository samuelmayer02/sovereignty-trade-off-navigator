import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('lib/api-client - apiFetch', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('Production Mode: forwards GET and mutating calls 1:1 to global fetch', async () => {
    process.env.NEXT_PUBLIC_STATIC_EXPORT = 'false';
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    global.fetch = mockFetch;

    const { apiFetch, isStaticMode } = await import('../lib/api-client');
    expect(isStaticMode).toBe(false);

    // GET
    await apiFetch('/api/requirements');
    expect(mockFetch).toHaveBeenCalledWith('/api/requirements');

    // POST
    await apiFetch('/api/requirements', { method: 'POST', body: JSON.stringify([]) });
    expect(mockFetch).toHaveBeenCalledWith('/api/requirements', expect.objectContaining({ method: 'POST' }));
  });

  it('Static Mode: rewrites standard GET /api routes to /data/*.json', async () => {
    process.env.NEXT_PUBLIC_STATIC_EXPORT = 'true';
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ uid: 'REQ-1' }]), { status: 200 }));
    global.fetch = mockFetch;

    const { apiFetch } = await import('../lib/api-client');

    await apiFetch('/api/requirements');
    expect(mockFetch).toHaveBeenCalledWith('/data/requirements.json');

    await apiFetch('/api/groups');
    expect(mockFetch).toHaveBeenCalledWith('/data/groups.json');

    await apiFetch('/api/categories');
    expect(mockFetch).toHaveBeenCalledWith('/data/categories.json');

    await apiFetch('/api/scenarios');
    expect(mockFetch).toHaveBeenCalledWith('/data/scenarios.json');
  });

  it('Static Mode: maps route aliases to correct JSON filenames', async () => {
    process.env.NEXT_PUBLIC_STATIC_EXPORT = 'true';
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    global.fetch = mockFetch;

    const { apiFetch } = await import('../lib/api-client');

    await apiFetch('/api/conflicts');
    expect(mockFetch).toHaveBeenCalledWith('/data/conflict_matrix.json');

    await apiFetch('/api/trees');
    expect(mockFetch).toHaveBeenCalledWith('/data/decision_trees.json');

    await apiFetch('/api/category-impacts');
    expect(mockFetch).toHaveBeenCalledWith('/data/category_impacts.json');
  });

  it('Static Mode: strips query parameters and trailing slashes from URLs', async () => {
    process.env.NEXT_PUBLIC_STATIC_EXPORT = 'true';
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    global.fetch = mockFetch;

    const { apiFetch } = await import('../lib/api-client');

    await apiFetch('/api/conflicts?context=sovereignty&active=true');
    expect(mockFetch).toHaveBeenCalledWith('/data/conflict_matrix.json');

    await apiFetch('/api/requirements/?category=Architektur');
    expect(mockFetch).toHaveBeenCalledWith('/data/requirements.json');
  });

  it('Static Mode: respects NEXT_PUBLIC_BASE_PATH for GitHub Pages hosting', async () => {
    process.env.NEXT_PUBLIC_STATIC_EXPORT = 'true';
    process.env.NEXT_PUBLIC_BASE_PATH = '/master-matrix';
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    global.fetch = mockFetch;

    const { apiFetch } = await import('../lib/api-client');

    await apiFetch('/api/requirements');
    expect(mockFetch).toHaveBeenCalledWith('/master-matrix/data/requirements.json');

    await apiFetch('/api/conflicts');
    expect(mockFetch).toHaveBeenCalledWith('/master-matrix/data/conflict_matrix.json');
  });

  it('Static Mode: performs synthetic client-side join on /api/sovereignty-requirements', async () => {
    process.env.NEXT_PUBLIC_STATIC_EXPORT = 'true';
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    const mockRequirements = [
      { uid: 'REQ-01', name: 'Req 1', description: 'Desc 1', groupId: 'GRP-1', flagged: false }
    ];
    const mockGroups = [
      { id: 'GRP-1', name: 'Group 1', categoryName: 'Souveränität' }
    ];

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/data/requirements.json') {
        return Promise.resolve(new Response(JSON.stringify(mockRequirements), { status: 200 }));
      }
      if (url === '/data/groups.json') {
        return Promise.resolve(new Response(JSON.stringify(mockGroups), { status: 200 }));
      }
      return Promise.reject(new Error(`Unhandled URL ${url}`));
    });
    global.fetch = mockFetch;

    const { apiFetch } = await import('../lib/api-client');

    const res = await apiFetch('/api/sovereignty-requirements');
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      uid: 'REQ-01',
      name: 'Req 1',
      groupId: 'GRP-1',
      groupName: 'Group 1',
      category: 'Souveränität'
    });
  });

  it('Static Mode: intercepts mutating requests and returns simulated success with demoMode flag', async () => {
    process.env.NEXT_PUBLIC_STATIC_EXPORT = 'true';
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const { apiFetch } = await import('../lib/api-client');

    // POST
    const postRes = await apiFetch('/api/requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ uid: 'REQ-NEW' }])
    });
    expect(postRes.status).toBe(200);
    const postJson = await postRes.json();
    expect(postJson.success).toBe(true);
    expect(postJson.demoMode).toBe(true);
    expect(postJson.message).toBeDefined();

    // PUT
    const putRes = await apiFetch('/api/conflicts/REQ-1/REQ-2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_ground_truth: true })
    });
    expect(putRes.status).toBe(200);
    const putJson = await putRes.json();
    expect(putJson.demoMode).toBe(true);

    // Ensure native fetch was NOT called for mutating requests
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
