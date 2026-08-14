'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Plus, Trash2, GitMerge, AlertTriangle, Layers, Tag, CheckSquare, ListTree, Info, Search, X } from 'lucide-react';
import Link from 'next/link';
import EditorNav from '@/components/EditorNav';
import TreeCanvas from '@/components/TreeCanvas';
import { getDisplayId } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';

export default function TreeEditorPage() {
  const [trees, setTrees] = useState<any[]>([]);
  const [sovReqs, setSovReqs] = useState<any[]>([]);
  const [activeTreeIndex, setActiveTreeIndex] = useState(0);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [reqSearch, setReqSearch] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setReqSearch('');
  }, [activeNodeId]);

  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary font-bold rounded-sm px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  useEffect(() => {
    apiFetch('/api/trees')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTrees(Array.isArray(data) ? data : []))
      .catch(() => setTrees([]));
    apiFetch('/api/sovereignty-requirements')
      .then(r => r.ok ? r.json() : [])
      .then(data => setSovReqs(Array.isArray(data) ? data : []))
      .catch(() => setSovReqs([]));
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await apiFetch('/api/trees', {
        method: 'POST',
        body: JSON.stringify(trees),
      });
      setSaveMessage('Erfolgreich gespeichert!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('Fehler beim Speichern.');
    }
    setIsSaving(false);
  };

  if (!trees.length) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted">
      <div className="animate-pulse flex flex-col items-center">
        <ListTree className="w-12 h-12 mb-4 opacity-50" />
        <p>Lade Bäume...</p>
      </div>
    </div>
  );

  const activeTree = trees[activeTreeIndex];
  
  // Right panel form state
  const activeNode = activeTree?.nodes[activeNodeId || ''] || activeTree?.results[activeNodeId || ''];
  const isResultNode = activeNodeId?.startsWith('end-');

  const updateNode = (field: string, value: any) => {
    if (!activeNodeId) return;
    const newTrees = [...trees];
    const tree = newTrees[activeTreeIndex];
    if (isResultNode) {
      tree.results[activeNodeId] = { ...tree.results[activeNodeId], [field]: value };
    } else {
      tree.nodes[activeNodeId] = { ...tree.nodes[activeNodeId], [field]: value };
    }
    setTrees(newTrees);
  };

  const updateOption = (idx: number, field: string, value: any) => {
    if (!activeNodeId || isResultNode) return;
    const newTrees = [...trees];
    const tree = newTrees[activeTreeIndex];
    const options = [...tree.nodes[activeNodeId].options];
    options[idx] = { ...options[idx], [field]: value };
    tree.nodes[activeNodeId].options = options;
    setTrees(newTrees);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <EditorNav 
        activeTab="trees"
        onSave={handleSaveAll}
        isSaving={isSaving}
        saveMessage={saveMessage}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tree List */}
        <div className="w-1/4 max-w-xs border-r border-card-border bg-card/50 flex flex-col">
          <div className="p-6 border-b border-card-border/50 bg-card">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
              <ListTree className="w-4 h-4" />
              Entscheidungsbäume
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {trees.map((tree, idx) => {
              const hasFlaggedNodes = Object.values(tree.nodes || {}).some((n: any) => n.flagged);
              const isActive = activeTreeIndex === idx;
              return (
                <button 
                  key={tree.id}
                  onClick={() => { setActiveTreeIndex(idx); setActiveNodeId(null); }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all border relative overflow-hidden group",
                    isActive 
                      ? "bg-primary/10 border-primary/30 shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-card-border hover:border-card-border/50"
                  )}
                >
                  {hasFlaggedNodes && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-warning shadow-sm shadow-warning/50 animate-pulse" />
                    </div>
                  )}
                  <div className={cn("font-bold text-sm mb-1 transition-colors", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                    {tree.id}
                  </div>
                  <div className="text-xs text-muted/80 truncate">{tree.title}</div>
                </button>
              );
            })}
          </div>
          
          {/* Flagged Questions list inside active tree */}
          <div className="p-4 border-t border-card-border bg-card/30">
            <h2 className="font-bold text-[10px] text-muted mb-3 flex items-center gap-1.5 text-warning uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" />
              Review erforderlich
            </h2>
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {Object.entries(activeTree?.nodes || {}).filter(([_, n]: any) => n.flagged).map(([id, n]: any) => {
                const isActive = activeNodeId === id;
                return (
                  <button 
                    key={id}
                    onClick={() => setActiveNodeId(id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all border text-xs group",
                      isActive 
                        ? "bg-warning/10 border-warning/30 text-warning" 
                        : "bg-background border-card-border hover:border-warning/30 text-muted"
                    )}
                  >
                    <div className="font-mono text-[9px] opacity-70 mb-0.5">{id}</div>
                    <div className="truncate font-bold">{n.name || n.text}</div>
                  </button>
                );
              })}
              {Object.entries(activeTree?.nodes || {}).filter(([_, n]: any) => n.flagged).length === 0 && (
                <div className="text-xs text-muted/50 italic p-4 text-center border border-dashed border-card-border rounded-xl">
                  Keine markierten Fragen
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 bg-background relative flex flex-col">
          <div className="p-6 bg-card/80 backdrop-blur-md border-b border-card-border shrink-0 z-10 shadow-sm">
             <input 
               type="text" 
               value={activeTree?.title || ''}
               onChange={e => {
                 const newTrees = [...trees];
                 newTrees[activeTreeIndex].title = e.target.value;
                 setTrees(newTrees);
               }}
               className="text-2xl font-black bg-transparent border-none focus:outline-none focus:ring-0 text-foreground w-full placeholder-muted/30"
               placeholder="Titel des Baums..."
             />
             <textarea 
               value={activeTree?.description || ''}
               onChange={e => {
                 const newTrees = [...trees];
                 newTrees[activeTreeIndex].description = e.target.value;
                 setTrees(newTrees);
               }}
               className="text-sm text-muted bg-transparent border-none focus:outline-none focus:ring-0 w-full mt-2 resize-none placeholder-muted/30"
               rows={2}
               placeholder="Kurzbeschreibung..."
             />
          </div>
          <div className="flex-1 relative">
            <TreeCanvas 
              tree={activeTree} 
              activeNodeId={activeNodeId}
              onNodeSelect={setActiveNodeId}
            />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-[450px] shrink-0 border-l border-card-border bg-card/50 flex flex-col shadow-xl z-20">
          <div className="p-6 border-b border-card-border/50 bg-card flex justify-between items-center">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Eigenschaften
            </h4>
            <div className="text-[10px] font-mono bg-background/80 px-2 py-1 rounded shadow-inner text-muted font-bold border border-card-border">
              {activeNodeId || 'Kein Element gewählt'}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {!activeNode ? (
              <div className="flex flex-col items-center justify-center h-full text-muted opacity-50">
                <GitMerge className="w-12 h-12 mb-4" />
                <p className="text-sm font-medium">Klicke auf eine Box im Canvas, um sie zu bearbeiten.</p>
              </div>
            ) : isResultNode ? (
              <div className="flex flex-col h-full space-y-6">
                <div className="shrink-0">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Ergebnis Titel</label>
                  <input 
                    type="text" 
                    value={activeNode.title} 
                    onChange={e => updateNode('title', e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="shrink-0">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">SEAL Level (0-4)</label>
                  <input 
                    type="number" 
                    value={activeNode.level} 
                    onChange={e => updateNode('level', parseInt(e.target.value))}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-lg font-black font-mono text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="flex-1 flex flex-col pt-6 border-t border-card-border/50 min-h-0">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-wider mb-4 shrink-0 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Getriggerte Souveränitätsanforderungen
                  </label>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    {/* Selected Reqs */}
                    {activeNode.referenced_requirements && activeNode.referenced_requirements.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-primary/20 pb-2">Aktuell Ausgewählt</h4>
                        <div className="space-y-2">
                          {activeNode.referenced_requirements.map((uid: string) => {
                            const req = sovReqs.find(r => r.uid === uid);
                            if (!req) return null;
                            return (
                              <div 
                                key={`selected-${req.uid}`} 
                                className="cursor-pointer p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group/card glass-card border-primary/50 shadow-sm"
                                onClick={() => {
                                  const curr = [...(activeNode.referenced_requirements || [])];
                                  curr.splice(curr.indexOf(req.uid), 1);
                                  updateNode('referenced_requirements', curr);
                                }}
                              >
                                <div className="absolute top-0 right-0 w-10 h-10 bg-primary/10 rounded-bl-full" />
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                  <div className="font-mono text-[10px] text-muted flex items-center gap-2">
                                    {getDisplayId(req.uid)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                                  </div>
                                </div>
                                <div className="text-xs font-medium relative z-10 leading-tight text-primary">
                                  {req.name}
                                </div>
                                <div className="text-[10px] leading-relaxed text-muted-foreground block mt-2 pt-2 border-t border-card-border/50 relative z-10">
                                  {req.description}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Grouped All Reqs */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between gap-4 border-b border-card-border pb-2 shrink-0">
                        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Alle Architektur-Optionen</h4>
                        <div className="relative w-48">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input 
                            type="text"
                            placeholder="Architektur-Optionen filtern..."
                            value={reqSearch}
                            onChange={e => setReqSearch(e.target.value)}
                            className="w-full bg-background border border-card-border rounded-lg pl-8 pr-7 py-1 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                          />
                          {reqSearch && (
                            <button 
                              onClick={() => setReqSearch('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-[10px] p-0.5 rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      {(() => {
                        if (!Array.isArray(sovReqs)) return null;

                        const filteredReqs = sovReqs.filter((req: any) => {
                          if (!reqSearch) return true;
                          const term = reqSearch.toLowerCase();
                          return (
                            req.name?.toLowerCase().includes(term) ||
                            req.description?.toLowerCase().includes(term) ||
                            req.uid?.toLowerCase().includes(term) ||
                            req.category?.toLowerCase().includes(term) ||
                            req.groupName?.toLowerCase().includes(term)
                          );
                        });

                        if (filteredReqs.length === 0) {
                          return (
                            <div className="text-xs text-muted/50 italic p-6 text-center border border-dashed border-card-border rounded-xl">
                              Keine passenden Architektur-Optionen gefunden.
                            </div>
                          );
                        }

                        const groupedByCategory = filteredReqs.reduce((acc: any, req: any) => {
                          const cat = req.category || 'Unkategorisiert';
                          if (!acc[cat]) acc[cat] = {};
                          const grp = req.groupName || 'Ohne Dimension';
                          if (!acc[cat][grp]) acc[cat][grp] = [];
                          acc[cat][grp].push(req);
                          return acc;
                        }, {});

                        return Object.entries(groupedByCategory).map(([cat, groups]: [string, any]) => (
                          <div key={cat} className="space-y-4">
                            <h5 className="text-sm font-bold text-foreground border-b border-card-border/50 pb-1 flex items-center gap-2">
                              <Tag className="w-4 h-4 text-muted" /> {cat}
                            </h5>
                            {Object.entries(groups).map(([grp, reqs]: [string, any]) => (
                              <div key={grp} className="space-y-2 ml-2 border-l-2 border-card-border/50 pl-3">
                                <h6 className="text-[10px] font-bold text-muted uppercase tracking-wider">{grp}</h6>
                                <div className="space-y-2">
                                  {reqs.map((req: any) => {
                                    const isSelected = activeNode.referenced_requirements?.includes(req.uid);
                                    return (
                                      <div 
                                        key={req.uid} 
                                        className={cn(
                                          "cursor-pointer p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group/card",
                                          isSelected ? "glass-card border-primary/50 shadow-sm" : "bg-card border-card-border hover:border-primary/30"
                                        )}
                                        onClick={() => {
                                          const curr = [...(activeNode.referenced_requirements || [])];
                                          if (isSelected) curr.splice(curr.indexOf(req.uid), 1);
                                          else curr.push(req.uid);
                                          updateNode('referenced_requirements', curr);
                                        }}
                                      >
                                        {isSelected && (
                                          <div className="absolute top-0 right-0 w-10 h-10 bg-primary/10 rounded-bl-full" />
                                        )}
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                          <div className="font-mono text-[10px] text-muted flex items-center gap-2">
                                            {highlightText(getDisplayId(req.uid), reqSearch)}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {isSelected ? (
                                              <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                                            ) : (
                                              <div className="w-4 h-4 border border-card-border rounded-sm" />
                                            )}
                                          </div>
                                        </div>
                                        <div className={cn("text-xs font-medium relative z-10 leading-tight", isSelected ? "text-primary" : "text-foreground")}>
                                          {highlightText(req.name, reqSearch)}
                                        </div>
                                        <div className="text-[10px] leading-relaxed text-muted-foreground block mt-2 pt-2 border-t border-card-border/50 relative z-10">
                                          {highlightText(req.description, reqSearch)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Frage Name (Kurztitel)</label>
                  <input 
                    type="text" 
                    value={activeNode.name || ''} 
                    onChange={e => updateNode('name', e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                    placeholder="z.B. Confidential Computing"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Fragetext</label>
                  <textarea 
                    value={activeNode.text} 
                    onChange={e => updateNode('text', e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner custom-scrollbar"
                    rows={4}
                  />
                </div>

                {activeNode.flagged && (
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
                    <Tag className="w-5 h-5 fill-warning text-warning shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-warning text-[10px] uppercase tracking-widest mb-1">
                        Frage geflaggt
                      </div>
                      <p className="text-xs text-foreground/80 italic">
                        {activeNode.flagComment || 'Kein Kommentar.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-card-border/50">
                  <h3 className="text-[10px] font-bold text-muted mb-4 uppercase tracking-wider flex items-center gap-2">
                    <GitMerge className="w-4 h-4" />
                    Antwortmöglichkeiten / Verzweigungen
                  </h3>
                  {activeNode.options.map((opt: any, idx: number) => (
                    <div key={idx} className="bg-background border border-card-border rounded-xl p-4 mb-4 space-y-4 shadow-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] text-muted font-bold uppercase tracking-wider mb-1.5">Button Label</label>
                          <input 
                            type="text" 
                            value={opt.label} 
                            onChange={e => updateOption(idx, 'label', e.target.value)}
                            className="w-full bg-card/50 border border-card-border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-muted font-bold uppercase tracking-wider mb-1.5">Ziel Node ID</label>
                          <input 
                            type="text" 
                            value={opt.target} 
                            onChange={e => updateOption(idx, 'target', e.target.value)}
                            className="w-full bg-card/50 border border-card-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                            placeholder="q2, end-1"
                          />
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-card-border">
                        <label className="flex items-center space-x-3 text-xs cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={opt.requiresEvaluation}
                            onChange={e => updateOption(idx, 'requiresEvaluation', e.target.checked)}
                            className="accent-primary w-4 h-4 rounded border-card-border cursor-pointer"
                          />
                          <span className="font-medium group-hover:text-primary transition-colors">Evaluation erforderlich? (Risk/Value)</span>
                        </label>
                      </div>

                      {opt.requiresEvaluation && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3 mt-3 p-3 bg-warning/5 rounded-xl border border-warning/20"
                        >
                          <div>
                            <label className="block text-[9px] text-warning font-bold uppercase tracking-wider mb-1.5">Warn-Label im Popup</label>
                            <input 
                              type="text" 
                              value={opt.evaluationLabel || ''} 
                              onChange={e => updateOption(idx, 'evaluationLabel', e.target.value)}
                              className="w-full bg-background border border-warning/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-warning text-warning shadow-inner placeholder-warning/30"
                              placeholder="Wenn Ja (Sprung auf SEAL-2):"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-warning font-bold uppercase tracking-wider mb-1.5">Interim-Result Text</label>
                            <input 
                              type="text" 
                              value={opt.interimResult || ''} 
                              onChange={e => updateOption(idx, 'interimResult', e.target.value)}
                              className="w-full bg-background border border-warning/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-warning text-warning shadow-inner placeholder-warning/30"
                              placeholder="SEAL-2: Datensouveränität"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
