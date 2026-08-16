export const isStaticMode = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

/**
 * Universeller Fetcher als Drop-in Replacement für fetch().
 * - Im Static-Mode (GitHub Pages) leitet er GET Aufrufe von /api/... auf die lokalen /data/...json Dateien um.
 * - POST/PUT/DELETE Requests fängt er ab, loggt sie, und gibt einen simulierten 200er Response zurück.
 * - Im Normal-Mode leitet er alles 1:1 an fetch() weiter.
 */
export async function apiFetch(endpoint: string | URL | globalThis.Request, options?: RequestInit): Promise<Response> {
  const urlString = endpoint.toString();
  let finalEndpoint = urlString;
  
  if (isStaticMode && (urlString.startsWith('/api/') || urlString.includes('/api/'))) {
    const isGet = !options || !options.method || options.method === 'GET';
    const cleanPath = urlString.split('?')[0].replace(/\/$/, '');
    
    if (isGet) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      
      // Sonderbehandlung für den aggregierten View
      if (cleanPath === '/api/sovereignty-requirements' || cleanPath.endsWith('/api/sovereignty-requirements')) {
        return Promise.all([
          fetch(`${basePath}/data/requirements.json`).then(r => r.json()),
          fetch(`${basePath}/data/groups.json`).then(r => r.json())
        ]).then(([reqs, grps]) => {
          const groupMap = new Map();
          for (const g of grps) {
             groupMap.set(g.id, g);
          }
          const formatted = reqs.map((r: any) => ({
            uid: r.uid,
            name: r.name,
            description: r.description,
            category: groupMap.get(r.groupId)?.categoryName || 'Unkategorisiert',
            groupId: r.groupId,
            groupName: groupMap.get(r.groupId)?.name || 'Ohne Gruppe',
            flagged: r.flagged,
            flagComment: r.flagComment
          }));
          return new Response(JSON.stringify(formatted), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      }

      // Reguläres Datei-Mapping
      let filename = cleanPath.substring(cleanPath.indexOf('/api/') + 5);
      const fileMap: Record<string, string> = {
        'conflicts': 'conflict_matrix.json',
        'trees': 'decision_trees.json'
      };
      
      filename = fileMap[filename] || (filename + '.json');
      finalEndpoint = `${basePath}/data/${filename}`;
    } else {
      console.warn(`[Demo-Mode] Intercepted mutating request to ${urlString}`, options);
      return new Response(JSON.stringify({ 
        success: true, 
        demoMode: true,
        message: "Static Demo Mode: Changes are maintained in browser session only and not persisted to backend database."
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return options ? fetch(finalEndpoint, options) : fetch(finalEndpoint);
}
