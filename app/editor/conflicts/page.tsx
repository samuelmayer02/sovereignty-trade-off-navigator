'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ArrowLeft, Search, AlertCircle, AlertTriangle, X, Layers, CheckCircle2, Circle, Maximize2, Minimize2, Target } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import EditorNav from '@/components/EditorNav';
import { cn } from '@/lib/utils';
import { getDisplayId } from '@/store/useStore';
import { DonutChart, StackedConflictBar } from '@/components/editor/MatrixCharts';
import { RequirementConflictCard } from '@/components/editor/ConflictCards';
import { apiFetch } from '@/lib/api-client';

interface Requirement {
  uid: string;
  category: string;
  name: string;
  description: string;
  groupId?: string;
}

interface Conflict {
  pair: [string, string];
  status: 'green' | 'orange' | 'red' | 'blue' | 'gray';
  conflict_text?: string;
  best_practice?: string;
}

export default function ConflictEditorPage() {
  const router = useRouter();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReqUid, setActiveReqUid] = useState<string | null>(null);
  const [topDriversSize, setTopDriversSize] = useState(5);
  const [lowConflictSize, setLowConflictSize] = useState(5);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [allGroups, setAllGroups] = useState<{ id: string, name: string, type: string }[]>([]);
  const [categories, setCategories] = useState<{ name: string, prefix: string, goal?: string }[]>([]);
  const [initialConflicts, setInitialConflicts] = useState('[]');
  const [activeConflictCategory, setActiveConflictCategory] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [pendingReqUid, setPendingReqUid] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const allowExitRef = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 100);
  };

  useEffect(() => {
    apiFetch('/api/requirements')
      .then(r => r.ok ? r.json() : [])
      .then(data => setRequirements(Array.isArray(data) ? data : []))
      .catch(() => setRequirements([]));
    apiFetch('/api/conflicts')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setConflicts(arr);
        setInitialConflicts(JSON.stringify(arr));
      })
      .catch(() => {
        setConflicts([]);
        setInitialConflicts('[]');
      });
      
    // Set active requirement from URL if present
    const params = new URLSearchParams(window.location.search);
    const reqId = params.get('reqId');
    if (reqId) setActiveReqUid(reqId);

    apiFetch('/api/groups')
      .then(r => r.ok ? r.json() : [])
      .then(data => setAllGroups(Array.isArray(data) ? data : []))
      .catch(() => setAllGroups([]));
    apiFetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setCategories(arr);
        if (arr.length > 0) setActiveConflictCategory(arr[0].name);
      })
      .catch(() => setCategories([]));
  }, []);

  const isDirty = initialConflicts !== JSON.stringify(conflicts);

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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await apiFetch('/api/conflicts', {
        method: 'POST',
        body: JSON.stringify(conflicts),
      });
      setInitialConflicts(JSON.stringify(conflicts));
      setSaveMessage('Konflikte erfolgreich gespeichert!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('Fehler beim Speichern.');
    }
    setIsSaving(false);
  };

  const getConflict = (req1: string, req2: string): Conflict => {
    const found = conflicts.find(c =>
      (c.pair[0] === req1 && c.pair[1] === req2) ||
      (c.pair[0] === req2 && c.pair[1] === req1)
    );
    return found || { status: 'gray', pair: [req1, req2] };
  };

  const updateConflict = (otherUid: string, updates: Partial<Conflict>) => {
    if (!activeReqUid) return;

    const existingIndex = conflicts.findIndex(c =>
      (c.pair[0] === activeReqUid && c.pair[1] === otherUid) ||
      (c.pair[0] === otherUid && c.pair[1] === activeReqUid)
    );

    if (updates.status === 'gray' && !updates.conflict_text && !updates.best_practice) {
      if (existingIndex >= 0) {
        const newConflicts = [...conflicts];
        newConflicts.splice(existingIndex, 1);
        setConflicts(newConflicts);
      }
      return;
    }

    if (existingIndex >= 0) {
      const newConflicts = [...conflicts];
      newConflicts[existingIndex] = { ...newConflicts[existingIndex], ...updates };
      setConflicts(newConflicts);
    } else {
      setConflicts([...conflicts, {
        pair: [activeReqUid, otherUid],
        status: (updates.status || 'gray') as any,
        conflict_text: updates.conflict_text || '',
        best_practice: updates.best_practice || ''
      }]);
    }
  };

  const handleNavigate = (e: React.MouseEvent, href: string) => {
    if (isDirty) {
      e.preventDefault();
      setPendingPath(href);
      setShowExitModal(true);
    }
  };

  const activeReq = useMemo(() => requirements.find(r => r.uid === activeReqUid), [activeReqUid, requirements]);

  const uniqueCategories = useMemo(() => Array.from(new Set(requirements.map(r => r.category).filter(Boolean))), [requirements]);
  const uniqueGroups = useMemo(() => {
    let filtered = requirements;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    return Array.from(new Set(filtered.map(r => r.groupId).filter(Boolean)));
  }, [requirements, selectedCategory]);

  const filteredRequirements = useMemo(() => {
    const result = requirements.filter(r =>
      (r.name.toLowerCase().includes(search.toLowerCase()) || r.uid.toLowerCase().includes(search.toLowerCase())) &&
      (selectedCategory === 'all' || r.category === selectedCategory) &&
      (selectedGroup === 'all' || r.groupId === selectedGroup)
    );
    
    return result.sort((a, b) => {
      const catA = a.category || '';
      const catB = b.category || '';
      if (catA !== catB) return catA.localeCompare(catB);
      
      const grpA = a.groupId || '';
      const grpB = b.groupId || '';
      if (grpA !== grpB) return grpA.localeCompare(grpB);
      
      return a.uid.localeCompare(b.uid);
    });
  }, [requirements, search, selectedCategory, selectedGroup]);

  // Calculate progress for each requirement
  const requirementProgress = useMemo(() => {
    const progress: Record<string, { total: number, evaluated: number }> = {};
    requirements.forEach(req => {
      const others = requirements.filter(r => r.uid !== req.uid);
      const evaluated = others.filter(other => {
        const c = conflicts.find(c => 
          (c.pair[0] === req.uid && c.pair[1] === other.uid) || 
          (c.pair[0] === other.uid && c.pair[1] === req.uid)
        );
        return c && c.status !== 'gray';
      }).length;
      
      progress[req.uid] = { total: others.length, evaluated: evaluated };
    });
    return progress;
  }, [requirements, conflicts]);

  const totalPossiblePairs = (requirements.length * (requirements.length - 1)) / 2;
  const evaluatedConflicts = conflicts.filter(c => c.status !== 'gray');
  const totalEvaluatedPairs = evaluatedConflicts.length;
  
  const totalOverallPossible = totalPossiblePairs;
  const totalOverallEvaluated = totalEvaluatedPairs;
  
  const globalProgress = totalOverallPossible > 0 ? (totalOverallEvaluated / totalOverallPossible) * 100 : 0;

  const reqMetrics = useMemo(() => {
    return requirements.map(req => {
      let red = 0, orange = 0, blue = 0, green = 0, evaluated = 0;
      
      conflicts.forEach(c => {
        if (c.pair.includes(req.uid)) {
          if (c.status !== 'gray') evaluated++;
          if (c.status === 'red') red++;
          if (c.status === 'orange') orange++;
          if (c.status === 'blue') blue++;
          if (c.status === 'green') green++;
        }
      });

      const totalPossible = requirements.length - 1;
      
      const score = (red * 3) + (orange * 1);
      
      return { 
        req, 
        red, orange, blue, green, evaluated, totalPossible, score
      };
    }).sort((a, b) => b.score - a.score);
  }, [requirements, conflicts]);

  const topDrivers = reqMetrics.filter(m => m.score > 0).slice(0, topDriversSize);
  // Low conflict reqs: lowest red/orange, highest blue/green
  const lowConflictCandidates = reqMetrics
    .filter(m => m.evaluated > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return (b.blue + b.green) - (a.blue + a.green);
    })
    .slice(0, lowConflictSize);

  const donutData = [
    { label: 'Konflikte', value: evaluatedConflicts.filter(c => c.status === 'red').length, color: 'var(--color-danger, #ef4444)' },
    { label: 'Trade-offs', value: evaluatedConflicts.filter(c => c.status === 'orange').length, color: 'var(--color-warning, #f59e0b)' },
    { label: 'Neutral', value: evaluatedConflicts.filter(c => c.status === 'blue').length, color: '#3b82f6' },
    { label: 'Synergien', value: evaluatedConflicts.filter(c => c.status === 'green').length, color: 'var(--color-success, #22c55e)' }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <EditorNav 
        activeTab="conflicts"
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={isDirty}
        saveMessage={saveMessage}
        onNavigate={handleNavigate}
        extraContent={
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all",
                isSidebarCollapsed 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted hover:text-foreground hover:bg-card-border"
              )}
              title={isSidebarCollapsed ? "Liste einblenden" : "Fokus-Modus (Liste ausblenden)"}
            >
              {isSidebarCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              <span className="text-xs font-medium">{isSidebarCollapsed ? "Fokus beenden" : "Fokus-Modus"}</span>
            </button>

            <div className="hidden md:flex flex-col items-end mr-4 border-l border-card-border pl-6">
              <div className="text-[10px] uppercase font-bold text-muted mb-1">Gesamtfortschritt</div>
              <div className="w-40 h-1.5 bg-card-border rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${globalProgress}%` }}
                  className="h-full bg-primary"
                />
              </div>
              <div className="text-[10px] text-primary mt-1 font-mono">{totalOverallEvaluated} / {totalOverallPossible} Beziehungen bewertet</div>
            </div>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Requirement Selection */}
        <AnimatePresence initial={false}>
          {!isSidebarCollapsed && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "25%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="max-w-sm border-r border-card-border bg-card/50 flex flex-col overflow-hidden shrink-0"
            >
              <div className="p-6 border-b border-card-border/50 bg-card space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Anforderung suchen..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={selectedCategory} 
                    onChange={e => { setSelectedCategory(e.target.value); setSelectedGroup('all'); }}
                    className="w-full bg-background border border-card-border rounded-lg px-2 py-2 text-xs text-muted focus:outline-none focus:border-primary truncate shadow-inner"
                  >
                    <option value="all">Alle Kategorien</option>
                    {uniqueCategories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                  </select>
                  <select 
                    value={selectedGroup} 
                    onChange={e => setSelectedGroup(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-lg px-2 py-2 text-xs text-muted focus:outline-none focus:border-primary truncate shadow-inner"
                  >
                    <option value="all">Alle Gruppen</option>
                    {uniqueGroups.map(g => <option key={g as string} value={g as string}>{g as string}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                {filteredRequirements.map((req, i) => {
                  const prog = requirementProgress[req.uid];
                  const isComplete = prog.evaluated === prog.total;
                  const isActive = activeReqUid === req.uid;
                  
                  const prevReq = i > 0 ? filteredRequirements[i - 1] : null;
                  const showCategoryHeader = !prevReq || prevReq.category !== req.category;

                  return (
                    <Fragment key={req.uid}>
                      {showCategoryHeader && (
                        <div className="pt-4 pb-1 px-3 mt-2 first:mt-0 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            {req.category || 'Ohne Kategorie'}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (isDirty) {
                            setPendingReqUid(req.uid);
                            setShowExitModal(true);
                          } else {
                            setActiveReqUid(req.uid);
                          }
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-xl transition-all border group relative overflow-hidden",
                          isActive 
                            ? "bg-primary/10 border-primary/30 shadow-sm" 
                            : "hover:bg-background border-transparent"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className={cn("text-sm font-bold truncate pr-4", isActive ? "text-primary" : "text-foreground")}>
                            {req.name}
                          </div>
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          ) : (
                            <Circle className={cn("w-4 h-4 shrink-0 opacity-20", prog.evaluated > 0 ? "text-primary opacity-60" : "text-muted")} />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono opacity-60 bg-muted/20 px-1.5 py-0.5 rounded">
                            {getDisplayId(req.uid, requirements, categories)}
                          </span>
                          <div className="flex-1 h-1 bg-card-border rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary/40" 
                              style={{ width: `${(prog.evaluated / prog.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted font-mono">{prog.evaluated}/{prog.total}</span>
                        </div>
                      </button>
                    </Fragment>
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Assessment Workspace */}
        <main 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-background custom-scrollbar relative"
        >
          {activeReq ? (
            <motion.div 
              layout
              className={cn(
                "mx-auto p-12 transition-all duration-500",
                isSidebarCollapsed ? "max-w-7xl" : "max-w-6xl"
              )}
            >
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-mono font-bold">
                    {getDisplayId(activeReq.uid, requirements, categories)}
                  </span>
                  <h2 className="text-3xl font-bold text-foreground">Matrix-Bewertung</h2>
                </div>
                <p className="text-muted text-lg max-w-3xl">
                  Bewerte das Verhältnis von <span className="text-foreground font-bold">{activeReq.name}</span> zu allen anderen Anforderungen im System.
                </p>
              </div>

              {/* Mini Dashboard for selected requirement */}
              <div className="mb-12 p-6 glass-card border border-card-border/50 rounded-2xl flex flex-col xl:flex-row gap-8 items-center bg-background/50">
                <div className="flex-1 w-full">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center justify-between">
                    <span>Bewertungsstatus</span>
                    <span className="text-[10px] font-mono text-muted">
                      {reqMetrics.find(m => m.req.uid === activeReq.uid)?.evaluated || 0} / 
                      {reqMetrics.find(m => m.req.uid === activeReq.uid)?.totalPossible || 0}
                    </span>
                  </h3>
                  <StackedConflictBar 
                    red={reqMetrics.find(m => m.req.uid === activeReq.uid)?.red || 0}
                    orange={reqMetrics.find(m => m.req.uid === activeReq.uid)?.orange || 0}
                    blue={reqMetrics.find(m => m.req.uid === activeReq.uid)?.blue || 0}
                    green={reqMetrics.find(m => m.req.uid === activeReq.uid)?.green || 0}
                    total={reqMetrics.find(m => m.req.uid === activeReq.uid)?.evaluated || 0}
                  />
                  <div className="flex justify-between text-xs text-muted mt-2">
                    <span>{reqMetrics.find(m => m.req.uid === activeReq.uid)?.evaluated || 0} evaluiert</span>
                    <span className="text-warning font-bold">
                      {(reqMetrics.find(m => m.req.uid === activeReq.uid)?.totalPossible || 0) - 
                       (reqMetrics.find(m => m.req.uid === activeReq.uid)?.evaluated || 0)} ausstehend
                    </span>
                  </div>
                </div>
                <div className="flex gap-6 shrink-0 pt-4 xl:pt-0 border-t xl:border-t-0 xl:border-l border-card-border xl:pl-8 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0">
                   <div className="text-center min-w-[60px]">
                     <div className="text-2xl font-black text-danger leading-none">{reqMetrics.find(m => m.req.uid === activeReq.uid)?.red || 0}</div>
                     <div className="text-[9px] uppercase font-bold text-muted mt-1 tracking-wider whitespace-nowrap">Konflikt</div>
                   </div>
                   <div className="text-center min-w-[60px]">
                     <div className="text-2xl font-black text-warning leading-none">{reqMetrics.find(m => m.req.uid === activeReq.uid)?.orange || 0}</div>
                     <div className="text-[9px] uppercase font-bold text-muted mt-1 tracking-wider whitespace-nowrap">Trade-off</div>
                   </div>
                   <div className="text-center min-w-[60px]">
                     <div className="text-2xl font-black text-blue-500 leading-none">{reqMetrics.find(m => m.req.uid === activeReq.uid)?.blue || 0}</div>
                     <div className="text-[9px] uppercase font-bold text-muted mt-1 tracking-wider whitespace-nowrap">Neutral</div>
                   </div>
                   <div className="text-center min-w-[60px]">
                     <div className="text-2xl font-black text-success leading-none">{reqMetrics.find(m => m.req.uid === activeReq.uid)?.green || 0}</div>
                     <div className="text-[9px] uppercase font-bold text-muted mt-1 tracking-wider whitespace-nowrap">Synergie</div>
                   </div>
                </div>
              </div>

              {/* Focus Banner Wrapper (Sticky) */}
              <div className="sticky top-0 z-20 pt-4 pb-8 bg-background/95 backdrop-blur-md -mx-4 px-4 transition-all">
                <button 
                  onClick={() => setActiveReqUid(null)}
                  className="flex items-center space-x-2 text-xs font-bold text-muted hover:text-foreground mb-4 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Zurück zum Dashboard</span>
                </button>
                <motion.div 
                  layout
                  className={cn(
                    "glass border-primary/20 relative overflow-hidden transition-all duration-300 shadow-sm",
                    isScrolled ? "p-4 rounded-2xl shadow-lg shadow-primary/5" : "p-8 rounded-3xl"
                  )}
                >
                  <div className={cn(
                    "absolute right-0 top-0 h-full flex items-center opacity-5 transition-all duration-300 pointer-events-none",
                    isScrolled ? "pr-4" : "pr-8"
                  )}>
                    <Layers className={cn("transition-all duration-300", isScrolled ? "w-12 h-12" : "w-32 h-32")} />
                  </div>
                  <div className="relative z-10 flex flex-col justify-center">
                    {!isScrolled && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] uppercase font-bold text-primary mb-2 tracking-widest"
                      >
                        Aktueller Fokus
                      </motion.div>
                    )}
                    <div className="flex items-center space-x-4">
                      {isScrolled && (
                        <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-mono font-bold">
                          {getDisplayId(activeReq.uid, requirements, categories)}
                        </div>
                      )}
                      <h3 className={cn("font-bold transition-all duration-300", isScrolled ? "text-lg mb-0" : "text-2xl mb-3")}>
                        {activeReq.name}
                      </h3>
                    </div>
                    {!isScrolled ? (
                      <p className="text-muted leading-relaxed max-w-4xl">{activeReq.description}</p>
                    ) : (
                      <p className="text-xs text-muted truncate max-w-2xl opacity-70">{activeReq.description}</p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Assessment Grid with Category Nav */}
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
                <aside className="space-y-4">
                  <div className={cn(
                    "sticky transition-all duration-300",
                    isScrolled ? "top-[110px]" : "top-8"
                  )}>
                    <h4 className="text-[10px] uppercase font-bold text-muted mb-4 tracking-widest px-2">Kategorien</h4>
                    <nav className="space-y-1">


                      {categories.map(cat => {
                        const isActive = activeConflictCategory === cat.name;
                        const reqsInCat = requirements.filter(r => r.category === cat.name && r.uid !== activeReqUid);
                        const unevaluatedCount = reqsInCat.filter(r => getConflict(activeReq.uid, r.uid).status === 'gray').length;

                        if (reqsInCat.length === 0) return null;

                        return (
                          <button
                            key={cat.name}
                            onClick={() => {
                              setActiveConflictCategory(cat.name);
                              document.getElementById(`cat-${cat.name}`)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between",
                              isActive 
                                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                                : "text-muted hover:text-foreground hover:bg-card-border border border-transparent"
                            )}
                          >
                            <span className="truncate pr-2">{cat.name}</span>
                            {unevaluatedCount > 0 && (
                              <span className="text-[10px] bg-muted/20 text-muted px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                {unevaluatedCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </aside>

                <div className="space-y-16">
                  {categories.map(cat => {
                    const reqsInCategory = requirements.filter(r => r.category === cat.name && r.uid !== activeReq.uid);
                    if (reqsInCategory.length === 0) return null;

                    return (
                      <div key={cat.name} id={`cat-${cat.name}`} className="scroll-mt-8">
                        <div className="flex items-center space-x-6 mb-8">
                          <h5 className="text-sm font-bold text-muted uppercase tracking-widest shrink-0">Anforderungen in {cat.name}</h5>
                          <div className="h-px bg-card-border flex-1"></div>
                        </div>

                        <div className="space-y-10">
                          {(() => {
                            const groupedReqs = reqsInCategory.reduce((acc, req) => {
                              const gid = req.groupId || 'none';
                              if (!acc[gid]) acc[gid] = [];
                              acc[gid].push(req);
                              return acc;
                            }, {} as Record<string, typeof requirements[0][]>);

                            const sortedGroupIds = Object.keys(groupedReqs).sort((a, b) => {
                              if (a === 'none') return 1;
                              if (b === 'none') return -1;
                              const groupA = allGroups.find(g => g.id === a)?.name || a;
                              const groupB = allGroups.find(g => g.id === b)?.name || b;
                              return groupA.localeCompare(groupB);
                            });

                            return sortedGroupIds.map(gid => {
                              const group = gid !== 'none' ? allGroups.find(g => g.id === gid) : null;
                              const groupName = group ? group.name : 'Keiner Gruppe zugeordnet';
                              const isGroupExclusive = group?.type === 'exclusive';

                              return (
                                <div key={gid} className={cn(
                                  "space-y-6",
                                  gid !== 'none' && "bg-card/50 border border-card-border/80 rounded-[2rem] p-6 shadow-sm relative overflow-hidden"
                                )}>
                                  {gid !== 'none' && (
                                    <>
                                      <div className="absolute top-0 left-0 w-2 h-full bg-primary/20"></div>
                                      <div className="flex flex-col mb-6 ml-2">
                                        <div className="flex items-center space-x-3 mb-1">
                                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                            {isGroupExclusive ? 'Exklusive Gruppe' : 'Gruppe'}
                                          </span>
                                        </div>
                                        <h6 className="font-bold text-lg text-foreground">{groupName}</h6>
                                      </div>
                                    </>
                                  )}
                                  <div className="space-y-6">
                                    {groupedReqs[gid].map(otherReq => {
                                      const conflict = getConflict(activeReq.uid, otherReq.uid);
                                      const isExclusiveMatch = activeReq.groupId && activeReq.groupId === otherReq.groupId && allGroups.find(g => g.id === activeReq.groupId)?.type === 'exclusive';

                                      return (
                                        <div key={otherReq.uid}>
                                          <RequirementConflictCard
                                            otherReq={otherReq}
                                            activeReq={activeReq}
                                            requirements={requirements}
                                            categories={categories}
                                            conflict={conflict}
                                            updateConflict={updateConflict}
                                            isExclusiveMatch={!!isExclusiveMatch}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="p-8 md:p-12 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Konflikt-Editor Dashboard</h2>
                <p className="text-muted text-lg max-w-3xl">
                  Überblick über den Bewertungsfortschritt und Identifikation von Konflikttreibern sowie potenziellen Streichkandidaten.
                </p>
              </div>

              {/* Top Level Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-[2rem] border border-card-border/50 flex flex-col justify-between group hover:border-primary/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] uppercase font-bold text-muted tracking-widest">Gesamtfortschritt</div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-foreground tracking-tight">{Math.round(globalProgress)}%</div>
                    <div className="text-xs text-muted mt-2 font-medium bg-background/50 inline-block px-2 py-1 rounded-md">{totalOverallEvaluated} von {totalOverallPossible} Paaren bewertet</div>
                  </div>
                </div>

                <div className="glass p-8 rounded-[2rem] border border-card-border/50 flex flex-col justify-between group hover:border-danger/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] uppercase font-bold text-muted tracking-widest">Harte Konflikte</div>
                    <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-foreground tracking-tight">
                      {donutData[0].value}
                    </div>
                    <div className="text-xs text-danger/80 mt-2 font-medium bg-danger/5 inline-block px-2 py-1 rounded-md">Paare mit starken Spannungen</div>
                  </div>
                </div>

                <div className="glass p-8 rounded-[2rem] border border-card-border/50 flex flex-col justify-between group hover:border-success/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] uppercase font-bold text-muted tracking-widest">Reibungslos</div>
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-foreground tracking-tight">
                      {lowConflictCandidates.length > 0 ? (lowConflictCandidates[0].blue + lowConflictCandidates[0].green) : 0}
                    </div>
                    <div className="text-xs text-success/80 mt-2 font-medium bg-success/5 inline-block px-2 py-1 rounded-md">Gute Beziehungen (Top-Req)</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Donut Chart Panel */}
                <div className="glass p-8 rounded-[2rem] border border-card-border/50 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                  <h3 className="text-sm font-bold text-foreground mb-6 self-start flex items-center"><span className="w-2 h-2 rounded-full bg-primary/50 mr-2"></span>Verteilung der Bewertungen</h3>
                  <DonutChart data={donutData} />
                  <div className="w-full mt-8 space-y-3">
                    {donutData.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                          <span className="text-muted font-medium">{d.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground">{d.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Drivers Panel */}
                <div className="glass p-8 rounded-[2rem] border border-card-border/50 shadow-sm lg:col-span-2 flex flex-col">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">Top Konflikt-Treiber</h3>
                      <AlertCircle className="w-5 h-5 text-warning" />
                    </div>
                    <select 
                      value={topDriversSize}
                      onChange={(e) => setTopDriversSize(Number(e.target.value))}
                      className="bg-card border border-card-border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-primary text-foreground cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="space-y-5 max-h-[22rem] overflow-y-auto pr-3 overflow-x-hidden relative">
                    {topDrivers.length > 0 ? topDrivers.map((m, i) => {
                      return (
                        <div key={m.req.uid} className="group cursor-pointer" onClick={() => setActiveReqUid(m.req.uid)}>
                          <div className="flex justify-between items-end mb-1">
                            <div className="flex items-center space-x-2 truncate pr-4">
                              <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{getDisplayId(m.req.uid, requirements, categories)}</span>
                              <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{m.req.name}</span>
                            </div>
                            <div className="text-[10px] font-mono text-muted shrink-0">{m.evaluated} bewertet</div>
                          </div>
                          <StackedConflictBar red={m.red} orange={m.orange} blue={m.blue} green={m.green} total={m.evaluated} />
                        </div>
                      )
                    }) : (
                      <div className="text-center text-muted py-12">Keine Konflikt-Treiber identifiziert.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Geringstes Konfliktpotenzial Panel */}
              {lowConflictCandidates.length > 0 && (
                <div className="glass p-8 rounded-[2rem] border border-success/20 bg-success/5 shadow-sm mt-8 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                  <div className="flex justify-between items-start md:items-center mb-6 shrink-0 relative z-10">
                    <div>
                      <h3 className="text-sm font-bold text-success uppercase tracking-widest">Geringstes Konfliktpotenzial</h3>
                      <p className="text-xs text-muted mt-1">Diese Anforderungen weisen die wenigsten Konflikte und die meisten neutralen oder synergetischen Beziehungen auf.</p>
                    </div>
                    <select 
                      value={lowConflictSize}
                      onChange={(e) => setLowConflictSize(Number(e.target.value))}
                      className="bg-card border border-success/20 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-success text-foreground cursor-pointer ml-4 shrink-0"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="space-y-5 max-h-80 overflow-y-auto pr-3 overflow-x-hidden relative">
                    {lowConflictCandidates.map((m, i) => (
                      <div key={m.req.uid} className="group cursor-pointer" onClick={() => setActiveReqUid(m.req.uid)}>
                        <div className="flex justify-between items-end mb-1">
                          <div className="flex items-center space-x-2 truncate pr-4">
                            <span className="text-[10px] font-mono text-success bg-success/10 px-1.5 py-0.5 rounded">{getDisplayId(m.req.uid, requirements, categories)}</span>
                            <span className="text-sm font-bold text-foreground truncate group-hover:text-success transition-colors">{m.req.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-muted shrink-0">{m.evaluated} bewertet</div>
                        </div>
                        <StackedConflictBar red={m.red} orange={m.orange} blue={m.blue} green={m.green} total={m.evaluated} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Exit Warning Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl border border-warning/20">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-warning" /></div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Ungespeicherte Änderungen</h3>
                  <p className="text-sm text-muted">Deine Änderungen an der Matrix gehen verloren.</p>
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
                    setConflicts(JSON.parse(initialConflicts));
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
