'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft, Search, AlertCircle, AlertTriangle, X, Tag, Layers, Target, CheckCircle2, List } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import EditorNav from '@/components/EditorNav';
import { cn } from '@/lib/utils';

import { getDisplayId } from '@/store/useStore';
import { apiFetch } from '@/lib/api-client';

interface Requirement {
  uid: string;
  category: string;
  name: string;
  description: string;
  groupId?: string;
}

function EditorContent() {
  const router = useRouter();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [activeReqUid, setActiveReqUid] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  const searchParams = useSearchParams();
  const preselectedId = searchParams?.get('id');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [allGroups, setAllGroups] = useState<{ id: string, name: string, type: string }[]>([]);
  const [categories, setCategories] = useState<{ name: string, prefix: string }[]>([]);
  const allowExitRef = useRef(false);

  // Local state for the active requirement form
  const [localReq, setLocalReq] = useState<Requirement | null>(null);
  const [initialReqs, setInitialReqs] = useState('[]');
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [pendingReqUid, setPendingReqUid] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    apiFetch('/api/requirements')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setRequirements(arr);
        setInitialReqs(JSON.stringify(arr));
        if (preselectedId && arr.some(r => r.uid === preselectedId)) {
          setActiveReqUid(preselectedId);
        } else if (arr.length > 0) {
          setActiveReqUid(arr[0].uid);
        }
      })
      .catch(() => {
        setRequirements([]);
        setInitialReqs('[]');
      });
    apiFetch('/api/groups')
      .then(r => r.ok ? r.json() : [])
      .then(data => setAllGroups(Array.isArray(data) ? data : []))
      .catch(() => setAllGroups([]));
    apiFetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const isDirty = initialReqs !== JSON.stringify(requirements);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !allowExitRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (activeReqUid) {
      const req = requirements.find(r => r.uid === activeReqUid);
      if (req) setLocalReq({ ...req });
    } else {
      setLocalReq(null);
    }
  }, [activeReqUid, requirements]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await apiFetch('/api/requirements', {
        method: 'POST',
        body: JSON.stringify(requirements),
      });
      setInitialReqs(JSON.stringify(requirements));
      setSaveMessage('Erfolgreich gespeichert!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('Fehler beim Speichern.');
    }
    setIsSaving(false);
  };

  const addRequirement = () => {
    const newUid = crypto.randomUUID();
    const newReq: Requirement = { 
      uid: newUid, 
      category: categories[0]?.name || 'Neu', 
      name: 'Neue Architektur-Option', 
      description: '' 
    };
    
    if (isDirty) {
      setPendingReqUid(newUid);
      setShowExitModal(true);
    } else {
      setRequirements(prev => [newReq, ...prev]);
      setActiveReqUid(newUid);
    }
  };

  const deleteRequirement = (uid: string) => {
    if (confirm('Architektur-Option wirklich löschen?')) {
      const newReqs = requirements.filter(r => r.uid !== uid);
      setRequirements(newReqs);
      if (activeReqUid === uid) {
        setActiveReqUid(newReqs.length > 0 ? newReqs[0].uid : null);
      }
    }
  };

  const handleLocalReqChange = (field: keyof Requirement, value: string) => {
    if (!localReq) return;
    const updated = { ...localReq, [field]: value };
    setLocalReq(updated);
    
    // Auto update the main requirements array as we type
    setRequirements(prev => prev.map(r => r.uid === updated.uid ? updated : r));
  };

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    if (isDirty) {
      e.preventDefault();
      setPendingPath(path);
      setShowExitModal(true);
    }
  };

  const handleSelectReq = (uid: string) => {
    if (activeReqUid === uid) return;
    if (isDirty) {
      setPendingReqUid(uid);
      setShowExitModal(true);
    } else {
      setActiveReqUid(uid);
    }
  };

  const uniqueCategories = Array.from(new Set(requirements.map(r => r.category || 'Ohne Kategorie'))).sort();
  const uniqueGroups = Array.from(new Set(requirements.map(r => r.groupId || 'Ohne Dimension'))).sort();
  
  const filteredRequirements = requirements.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.uid.toLowerCase().includes(search.toLowerCase())) return false;
    const cat = r.category || 'Ohne Kategorie';
    const grp = r.groupId || 'Ohne Dimension';
    if (selectedCategory !== 'all' && cat !== selectedCategory) return false;
    if (selectedGroup !== 'all' && grp !== selectedGroup) return false;
    return true;
  });

  const groupedRequirements = useMemo(() => {
    const cats: Record<string, Record<string, Requirement[]>> = {};
    filteredRequirements.forEach(req => {
      const cat = req.category || 'Ohne Kategorie';
      const grp = req.groupId || 'Ohne Dimension';
      if (!cats[cat]) cats[cat] = {};
      if (!cats[cat][grp]) cats[cat][grp] = [];
      cats[cat][grp].push(req);
    });
    return cats;
  }, [filteredRequirements]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <EditorNav 
        activeTab="requirements"
        onSave={handleSaveAll}
        isSaving={isSaving}
        isDirty={isDirty}
        saveMessage={saveMessage}
        onNavigate={handleNavigate}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/4 max-w-sm border-r border-card-border bg-card/50 flex flex-col">
          <div className="p-6 border-b border-card-border/50 bg-card">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <List className="w-4 h-4" />
                Architektur-Optionen
              </h4>
              <button 
                onClick={addRequirement} 
                className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Neu
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={selectedCategory} 
                  onChange={e => { setSelectedCategory(e.target.value); setSelectedGroup('all'); }}
                  className="w-full bg-background border border-card-border rounded-lg px-2 py-2 text-xs text-muted focus:outline-none focus:border-primary truncate cursor-pointer shadow-inner"
                >
                  <option value="all">Alle Kategorien</option>
                  {uniqueCategories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                </select>
                <select 
                  value={selectedGroup} 
                  onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-2 py-2 text-xs text-muted focus:outline-none focus:border-primary truncate cursor-pointer shadow-inner"
                >
                  <option value="all">Alle Entscheidungsdimensionen</option>
                  {uniqueGroups.map(g => {
                    const groupName = allGroups.find(ag => ag.id === g)?.name || g;
                    return <option key={g as string} value={g as string}>{groupName}</option>
                  })}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {Object.keys(groupedRequirements).sort().map(catName => (
              <div key={catName} className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest px-2">{catName}</h3>
                
                <div className="space-y-4">
                  {Object.keys(groupedRequirements[catName]).sort().map(grpName => {
                    const reqs = groupedRequirements[catName][grpName];
                    const displayGroupName = allGroups.find(ag => ag.id === grpName)?.name || grpName;
                    
                    return (
                      <div key={grpName} className="space-y-1.5 pl-2 border-l-2 border-card-border/50">
                        <div className="flex items-center gap-1.5 mb-2 ml-1">
                          <Layers className="w-3 h-3 text-muted" />
                          <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">{displayGroupName}</h4>
                        </div>
                        
                        <div className="space-y-1">
                          {reqs.map(req => {
                            const isActive = activeReqUid === req.uid;
                            return (
                              <button
                                key={req.uid}
                                onClick={() => handleSelectReq(req.uid)}
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
                                      {req.name}
                                    </span>
                                    <span className="text-xs font-mono text-muted/70 block mt-0.5">
                                      {getDisplayId(req.uid, requirements, categories)}
                                    </span>
                                  </div>
                                </div>
                                
                                {(req as any).flagged && (
                                  <Tag className="w-3.5 h-3.5 text-warning fill-warning shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredRequirements.length === 0 && (
              <div className="text-center py-12 text-muted text-xs italic">
                Keine Architektur-Optionen gefunden.
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
          {localReq ? (
            <div className="p-8">
              <div className="max-w-4xl mx-auto space-y-8 pb-12">
                
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Target className="w-5 h-5" />
                    </div>
                    Architektur-Option bearbeiten
                  </h2>
                  <div className="flex items-center gap-3">
                    {localReq.uid !== activeReqUid && (
                      <span className="text-xs bg-warning/20 text-warning px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Ungespeicherte Änderungen
                      </span>
                    )}
                    <button 
                      onClick={() => deleteRequirement(localReq.uid)}
                      className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl transition-colors font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Löschen
                    </button>
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={localReq.uid}
                  className="glass border border-card-border rounded-2xl p-8 shadow-sm lift-effect space-y-8"
                >
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center p-4 bg-card/50 rounded-xl border border-card-border/50">
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Anzeige-ID</label>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 text-sm font-mono text-primary font-bold inline-block shadow-inner">
                          {getDisplayId(localReq.uid, requirements, categories)}
                        </div>
                      </div>
                      <div className="w-px h-10 bg-card-border/50 mx-2 hidden md:block"></div>
                      <div>
                        <label className="block text-[10px] text-muted uppercase font-bold tracking-wider mb-1">UID (Stabil)</label>
                        <div className="text-xs font-mono text-muted/70 bg-background rounded-lg px-2 py-1 border border-card-border shadow-inner">
                          {localReq.uid}
                        </div>
                      </div>
                    </div>
                    <Link 
                      href={`/editor/conflicts?reqId=${localReq.uid}`}
                      onClick={e => handleNavigate(e, `/editor/conflicts?reqId=${localReq.uid}`)}
                      className="text-sm bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 font-medium shadow-lg shadow-primary/20 whitespace-nowrap"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Matrix bewerten</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Kategorie (Automatisch aus Dimension geerbt)</label>
                      <div className="w-full bg-background/50 border border-card-border/50 rounded-xl px-4 py-3 text-sm text-muted cursor-not-allowed">
                        {localReq.category || 'Keine'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Entscheidungsdimension (Gruppe)</label>
                      <select
                        value={localReq.groupId || ''}
                        onChange={e => handleLocalReqChange('groupId', e.target.value)}
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner cursor-pointer"
                      >
                        <option value="">Keine Dimension zugewiesen</option>
                        {allGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Name der Architektur-Option</label>
                    <input
                      type="text"
                      value={localReq.name}
                      onChange={e => handleLocalReqChange('name', e.target.value)}
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                      placeholder="Bezeichner der Architektur-Option..."
                    />
                  </div>

                  {(localReq as any).flagged && (
                    <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
                      <Tag className="w-5 h-5 fill-warning text-warning shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-warning text-sm uppercase tracking-widest mb-1">
                          Geflaggt für Überarbeitung
                        </div>
                        <p className="text-sm text-foreground/80 italic">
                          {(localReq as any).flagComment || 'Kein Kommentar hinterlegt.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Beschreibung</label>
                    <textarea
                      value={localReq.description || ''}
                      onChange={e => handleLocalReqChange('description', e.target.value)}
                      rows={5}
                      className="w-full bg-background border border-card-border rounded-xl p-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner custom-scrollbar"
                      placeholder="Detaillierte Beschreibung der Architektur-Option..."
                    />
                  </div>

                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <div className="w-16 h-16 bg-card-border/30 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium text-foreground">Keine Architektur-Option ausgewählt</p>
              <p className="text-sm">Wähle eine Architektur-Option aus der Liste links, um sie zu bearbeiten.</p>
            </div>
          )}
        </div>
      </div>

      {/* Exit Warning Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass border border-warning/20 w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl lift-effect">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-warning" /></div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Ungespeicherte Änderungen</h3>
                  <p className="text-sm text-muted">Deine Änderungen gehen verloren.</p>
                </div>
              </div>
              <div className="flex space-x-3 mt-8">
                <button onClick={() => setShowExitModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-card border border-card-border hover:bg-background transition-colors text-sm font-medium">Hier bleiben</button>
                <button onClick={() => {
                  setShowExitModal(false);
                  if (pendingPath) {
                    allowExitRef.current = true;
                    router.push(pendingPath);
                  }
                  else if (pendingReqUid) {
                    setRequirements(JSON.parse(initialReqs));
                    setActiveReqUid(pendingReqUid);
                  }
                }} className="flex-1 px-4 py-3 rounded-xl bg-danger text-white hover:bg-danger/90 transition-colors text-sm font-medium shadow-lg shadow-danger/20">Verwerfen & Fortfahren</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <EditorContent />
    </Suspense>
  );
}
