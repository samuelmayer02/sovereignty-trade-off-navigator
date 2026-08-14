'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft, Search, Layers, CheckCircle2, Circle, Target, ExternalLink, Info } from 'lucide-react';
import Link from 'next/link';
import EditorNav from '@/components/EditorNav';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

interface Group {
  uid?: string;
  id: string;
  name: string;
  type: 'exclusive' | 'at-least-one';
  categoryName?: string;
  requirements?: { uid: string; name: string; description?: string }[];
}

export default function GroupsEditor() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [localGroup, setLocalGroup] = useState<Group | null>(null);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  
  useEffect(() => {
    apiFetch('/api/groups')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setGroups(arr);
        if (arr.length > 0) setActiveGroupId(arr[0].uid || arr[0].id);
      })
      .catch(() => setGroups([]));
    apiFetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (activeGroupId) {
      // Find by uid first if available, otherwise by id
      const g = groups.find(g => g.uid ? g.uid === activeGroupId : g.id === activeGroupId);
      if (g) setLocalGroup({ ...g });
    } else {
      setLocalGroup(null);
    }
  }, [activeGroupId, groups]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify(groups),
      });
      if (res.ok) {
        setSaveMessage('Erfolgreich gespeichert!');
        // Refresh to get UIDs
        apiFetch('/api/groups').then(r => r.json()).then(setGroups);
      } else {
        setSaveMessage('Fehler beim Speichern.');
      }
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('Fehler beim Speichern.');
    }
    setIsSaving(false);
  };

  const addGroup = () => {
    const newId = `GROUP_${Date.now()}`;
    const newGroup: Group = { id: newId, name: 'Neue Dimension', type: 'exclusive', categoryName: categories[0]?.name || 'Unkategorisiert' };
    setGroups([newGroup, ...groups]);
    setActiveGroupId(newId);
  };

  const deleteGroup = (id: string) => {
    if (!confirm('Wirklich löschen? Dies entfernt die Dimension auch aus allen verknüpften Architektur-Optionen.')) return;
    const newGroups = groups.filter(g => (g.uid || g.id) !== id);
    setGroups(newGroups);
    if (activeGroupId === id) {
      setActiveGroupId(newGroups.length > 0 ? (newGroups[0].uid || newGroups[0].id) : null);
    }
  };

  const handleLocalChange = (field: keyof Group, value: any) => {
    if (!localGroup) return;
    const updated = { ...localGroup, [field]: value };
    setLocalGroup(updated);
    
    // Immediate apply for specific fields to avoid closure issues
    if (field === 'type') {
      const activeId = localGroup.uid || localGroup.id;
      setGroups(groups.map(g => (g.uid || g.id) === activeId ? updated : g));
    }
  };

  const applyLocalChanges = () => {
    if (!localGroup || !activeGroupId) return;
    
    const activeId = localGroup.uid || localGroup.id;

    // Check for ID change
    if (localGroup.id !== activeGroupId && !localGroup.uid) { // Legacy check
       if (groups.some(g => g.id === localGroup.id && g.id !== activeGroupId)) {
        alert('Diese ID existiert bereits!');
        setLocalGroup({ ...localGroup, id: activeGroupId });
        return;
      }
    }

    setGroups(groups.map(g => (g.uid || g.id) === activeGroupId ? localGroup : g));
    setActiveGroupId(activeId);
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <EditorNav 
        activeTab="groups"
        onSave={handleSaveAll}
        isSaving={isSaving}
        saveMessage={saveMessage}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/4 max-w-sm border-r border-card-border bg-card/50 flex flex-col">
          <div className="p-6 border-b border-card-border/50 bg-card">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Entscheidungsdimensionen
              </h4>
              <button 
                onClick={addGroup} 
                className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Neu
              </button>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Dimension suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-background border border-card-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
            {filteredGroups.map(g => {
              const gId = g.uid || g.id;
              const isActive = activeGroupId === gId;
              return (
                <button
                  key={gId}
                  onClick={() => setActiveGroupId(gId)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left group",
                    isActive 
                      ? "bg-primary/10 border-primary/30 shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-card-border hover:border-card-border/50"
                  )}
                >
                  <div className="flex items-start gap-3 truncate">
                    <div className={cn("mt-1.5 shrink-0 w-2 h-2 rounded-full transition-colors", isActive ? "bg-primary" : "bg-muted/30 group-hover:bg-muted")} />
                    <div className="truncate">
                      <span className={cn(
                        "text-sm font-bold block truncate transition-colors",
                        isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}>
                        {g.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted/70 bg-background/50 px-1.5 py-0.5 rounded shadow-inner truncate">
                          {g.id}
                        </span>
                        {g.categoryName && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted/50 truncate">
                            {g.categoryName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            
            {filteredGroups.length === 0 && (
              <div className="text-center py-12 text-muted text-xs italic">
                Keine Dimensionen gefunden.
              </div>
            )}
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto bg-background custom-scrollbar">
          {localGroup ? (
            <div className="p-8">
              <div className="max-w-4xl mx-auto space-y-8 pb-12">
                
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Layers className="w-5 h-5" />
                    </div>
                    Dimension bearbeiten
                  </h2>
                  <button 
                    onClick={() => deleteGroup(localGroup.uid || localGroup.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl transition-colors font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Dimension löschen
                  </button>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={localGroup.uid || localGroup.id}
                  className="glass border border-card-border rounded-2xl p-8 shadow-sm lift-effect space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Anzeigename</label>
                      <input 
                        type="text" 
                        value={localGroup.name}
                        onChange={e => handleLocalChange('name', e.target.value)}
                        onBlur={applyLocalChanges}
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                        placeholder="Name der Dimension..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Kategorie (Zugehörigkeit)</label>
                      <select
                        value={localGroup.categoryName || ''}
                        onChange={e => handleLocalChange('categoryName', e.target.value)}
                        onBlur={applyLocalChanges}
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner cursor-pointer"
                      >
                        <option value="">-- Keine Kategorie zugewiesen --</option>
                        {categories.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Dimensions-ID (Technisch)</span>
                    </label>
                    <input 
                      type="text" 
                      value={localGroup.id}
                      onChange={e => handleLocalChange('id', e.target.value)}
                      onBlur={applyLocalChanges}
                      className="w-full bg-background/50 border border-card-border rounded-xl px-4 py-3 text-sm font-mono text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                      placeholder="GROUP_XYZ"
                    />
                    <p className="text-[10px] text-muted/70 mt-2 font-medium">Diese ID wird von den Architektur-Optionen intern referenziert.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-3 block">Logik-Typ der Dimension</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleLocalChange('type', 'exclusive')}
                        className={cn(
                          "p-5 rounded-xl border text-left transition-all relative overflow-hidden group",
                          localGroup.type === 'exclusive' 
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                            : "border-card-border hover:border-primary/30 bg-background"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={cn("font-bold", localGroup.type === 'exclusive' ? "text-primary" : "text-foreground")}>
                            Entweder / Oder
                          </div>
                          {localGroup.type === 'exclusive' ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted group-hover:text-primary/50 transition-colors" />
                          )}
                        </div>
                        <div className="text-xs text-muted leading-relaxed">
                          Maximal eine Architektur-Option dieser Dimension kann gleichzeitig gewählt werden (Exklusiv).
                        </div>
                      </button>

                      <button 
                        onClick={() => handleLocalChange('type', 'at-least-one')}
                        className={cn(
                          "p-5 rounded-xl border text-left transition-all relative overflow-hidden group",
                          localGroup.type === 'at-least-one' 
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                            : "border-card-border hover:border-primary/30 bg-background"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={cn("font-bold", localGroup.type === 'at-least-one' ? "text-primary" : "text-foreground")}>
                            Mindestens Eine
                          </div>
                          {localGroup.type === 'at-least-one' ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted group-hover:text-primary/50 transition-colors" />
                          )}
                        </div>
                        <div className="text-xs text-muted leading-relaxed">
                          Es können mehrere Architektur-Optionen gewählt werden, mindestens eine wird jedoch empfohlen.
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-3 block">Verknüpfte Architektur-Optionen</label>
                    {localGroup.requirements && localGroup.requirements.length > 0 ? (
                      <div className="space-y-2">
                        {localGroup.requirements.map(req => (
                          <div key={req.uid} className="w-full flex items-start justify-between p-3 rounded-xl transition-all border bg-transparent border-card-border hover:bg-card-border/30 hover:border-card-border/50 group/req">
                            <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                              <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full transition-colors bg-muted/30 group-hover/req:bg-primary/50" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold truncate transition-colors text-foreground group-hover/req:text-primary">
                                    {req.name}
                                  </span>
                                  {req.description && (
                                    <Info className="w-3.5 h-3.5 text-muted/40 group-hover/req:text-primary/50 shrink-0 transition-colors" />
                                  )}
                                </div>
                                <span className="text-xs font-mono text-muted/70 block mt-0.5 truncate">
                                  {req.uid}
                                </span>
                                {req.description && (
                                  <div className="max-h-0 opacity-0 group-hover/req:max-h-40 group-hover/req:opacity-100 group-hover/req:mt-2 transition-all duration-300 ease-in-out overflow-hidden">
                                    <p className="text-[11px] text-muted/80 leading-relaxed whitespace-pre-wrap border-l-2 border-primary/20 pl-2">
                                      {req.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Link 
                              href={`/editor?id=${req.uid}`} 
                              target="_blank" 
                              className="p-2 shrink-0 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1.5 opacity-0 group-hover/req:opacity-100 mt-1"
                              title="Im Editor öffnen"
                            >
                              <span className="text-xs font-bold uppercase tracking-wider">Bearbeiten</span>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-card-border/50 text-center flex flex-col items-center gap-2 text-muted">
                        <Target className="w-6 h-6 opacity-50" />
                        <span className="text-sm">Keine Architektur-Optionen in dieser Dimension vorhanden.</span>
                      </div>
                    )}
                  </div>

                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <div className="w-16 h-16 bg-card-border/30 rounded-2xl flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium text-foreground">Keine Dimension ausgewählt</p>
              <p className="text-sm">Wähle eine Dimension aus der Liste links, um sie zu bearbeiten.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
