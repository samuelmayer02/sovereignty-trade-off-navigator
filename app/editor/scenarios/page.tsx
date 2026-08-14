'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, Search, List, MessageSquare, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import EditorNav from '@/components/EditorNav';
import { getDisplayId } from '@/store/useStore';
import { apiFetch } from '@/lib/api-client';

export default function ScenarioEditor() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reqSearch, setReqSearch] = useState('');

  useEffect(() => {
    apiFetch('/api/scenarios')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setScenarios(arr);
        if (arr.length > 0) setActiveScenarioId(arr[0].scenario_id);
      })
      .catch(() => {
        setScenarios([]);
      });

    apiFetch('/api/requirements')
      .then(res => res.ok ? res.json() : [])
      .then(data => setRequirements(Array.isArray(data) ? data : []))
      .catch(() => setRequirements([]));
  }, []);

  const categories = useMemo(() => {
    const cats: Record<string, any[]> = {};
    scenarios.forEach(s => {
      const c = s.category || 'Unkategorisiert';
      if (!cats[c]) cats[c] = [];
      cats[c].push(s);
    });
    return cats;
  }, [scenarios]);

  const activeScenario = scenarios.find(s => s.scenario_id === activeScenarioId);
  const activeIndex = scenarios.findIndex(s => s.scenario_id === activeScenarioId);

  const saveScenarios = async () => {
    setIsSaving(true);
    await apiFetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenarios)
    });
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleUpdate = (field: string, value: any) => {
    if (activeIndex === -1) return;
    const newScenarios = [...scenarios];
    newScenarios[activeIndex] = { ...newScenarios[activeIndex], [field]: value };
    setScenarios(newScenarios);
  };

  const handleUpdateOption = (optIndex: number, field: string, value: any) => {
    if (activeIndex === -1) return;
    const newScenarios = [...scenarios];
    const newOptions = [...newScenarios[activeIndex].options];
    newOptions[optIndex] = { ...newOptions[optIndex], [field]: value };
    newScenarios[activeIndex] = { ...newScenarios[activeIndex], options: newOptions };
    setScenarios(newScenarios);
  };

  const toggleRequirementInOption = (optIndex: number, reqId: string) => {
    if (activeIndex === -1) return;
    const newScenarios = [...scenarios];
    const newOptions = [...newScenarios[activeIndex].options];
    const reqs = newOptions[optIndex].referenced_requirements || [];
    
    if (reqs.includes(reqId)) {
      newOptions[optIndex].referenced_requirements = reqs.filter((id: string) => id !== reqId);
    } else {
      newOptions[optIndex].referenced_requirements = [...reqs, reqId];
    }
    
    newScenarios[activeIndex] = { ...newScenarios[activeIndex], options: newOptions };
    setScenarios(newScenarios);
  };

  const addOption = () => {
    if (activeIndex === -1) return;
    const newScenarios = [...scenarios];
    newScenarios[activeIndex].options.push({
      label: 'Neue Option',
      description: 'Beschreibung...',
      referenced_requirements: []
    });
    setScenarios(newScenarios);
  };

  const deleteOption = (optIndex: number) => {
    if (activeIndex === -1) return;
    if (!confirm('Option wirklich löschen?')) return;
    const newScenarios = [...scenarios];
    const newOptions = [...newScenarios[activeIndex].options];
    newOptions.splice(optIndex, 1);
    newScenarios[activeIndex] = { ...newScenarios[activeIndex], options: newOptions };
    setScenarios(newScenarios);
  };

  const addScenario = () => {
    const newId = `SCN-${Date.now().toString().slice(-4)}`;
    const newScenario = {
      scenario_id: newId,
      category: 'Neue Kategorie',
      topic: 'Neues Szenario',
      context: '',
      stimulus: '',
      metric_question: '',
      options: []
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newId);
  };

  const deleteScenario = () => {
    if (!activeScenarioId) return;
    if (confirm("Dieses Szenario wirklich löschen?")) {
      const newScenarios = scenarios.filter(s => s.scenario_id !== activeScenarioId);
      setScenarios(newScenarios);
      if (newScenarios.length > 0) setActiveScenarioId(newScenarios[0].scenario_id);
      else setActiveScenarioId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <EditorNav 
        activeTab="scenarios"
        onSave={saveScenarios}
        isSaving={isSaving}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Scenarios List */}
        <div className="w-1/4 max-w-sm border-r border-card-border bg-card/50 flex flex-col">
          <div className="p-6 border-b border-card-border/50 flex justify-between items-center bg-card">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
              <List className="w-4 h-4" />
              Szenarien
            </h4>
            <button 
              onClick={addScenario} 
              className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Neu
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {Object.entries(categories).map(([catName, catsScenarios]) => (
              <div key={catName} className="space-y-2">
                <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2">{catName}</h5>
                <div className="space-y-1">
                  {catsScenarios.map(scen => {
                    const isActive = activeScenarioId === scen.scenario_id;
                    return (
                      <button
                        key={scen.scenario_id}
                        onClick={() => setActiveScenarioId(scen.scenario_id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left",
                          isActive 
                            ? "bg-primary/10 border-primary/30 shadow-sm" 
                            : "bg-transparent border-transparent hover:bg-card-border hover:border-card-border/50"
                        )}
                      >
                        <div className="flex items-start gap-3 truncate">
                          <div className={cn("mt-1.5 shrink-0 w-2 h-2 rounded-full", isActive ? "bg-primary" : "bg-muted/30")} />
                          <div className="truncate">
                            <span className={cn(
                              "text-sm font-bold block truncate",
                              isActive ? "text-primary" : "text-foreground"
                            )}>
                              {scen.topic || 'Unbenannt'}
                            </span>
                            <span className="text-xs font-mono text-muted/70">
                              {scen.scenario_id}
                            </span>
                          </div>
                        </div>
                        {scen.flagged && (
                          <div className="w-2 h-2 rounded-full bg-warning shadow-sm shadow-warning/50 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {activeScenario ? (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-8">
                
                {activeScenario.flagged && (
                  <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-warning text-sm uppercase tracking-widest mb-1">
                        Geflaggt für Überarbeitung
                      </div>
                      <p className="text-sm text-foreground/80 italic">
                        {activeScenario.flagComment || 'Kein Kommentar hinterlegt.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    Szenario bearbeiten
                  </h2>
                  <button 
                    onClick={deleteScenario}
                    className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl transition-colors font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Löschen
                  </button>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={activeScenario.scenario_id} 
                  className="glass border border-card-border rounded-2xl p-8 shadow-sm lift-effect space-y-8"
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Szenario ID</label>
                      <input 
                        type="text" 
                        value={activeScenario.scenario_id}
                        onChange={e => handleUpdate('scenario_id', e.target.value)}
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Kategorie / Themenblock</label>
                      <input 
                        type="text" 
                        value={activeScenario.category}
                        onChange={e => handleUpdate('category', e.target.value)}
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Thema / Titel</label>
                    <input 
                      type="text" 
                      value={activeScenario.topic}
                      onChange={e => handleUpdate('topic', e.target.value)}
                      className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Kontext (Optionaler Standard-Text)
                      </label>
                      <textarea 
                        value={activeScenario.context || ''}
                        onChange={e => handleUpdate('context', e.target.value)}
                        className="w-full bg-background border border-card-border rounded-xl p-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none min-h-[120px] transition-all shadow-inner"
                        placeholder="Allgemeiner Kontext, falls in Step 1 nichts eingegeben wird..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Stimulus (Auslöser)
                      </label>
                      <textarea 
                        value={activeScenario.stimulus || ''}
                        onChange={e => handleUpdate('stimulus', e.target.value)}
                        className="w-full bg-background border border-card-border rounded-xl p-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none min-h-[120px] transition-all shadow-inner"
                        placeholder="Was passiert? Z.B. 'Ein neues Gesetz erfordert...'"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Architektonische Fragestellung
                    </label>
                    <input 
                      type="text" 
                      value={activeScenario.metric_question || ''}
                      onChange={e => handleUpdate('metric_question', e.target.value)}
                      className="w-full bg-primary/5 border border-primary/30 rounded-xl px-4 py-4 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-inner"
                      placeholder="Z.B. Welcher Architektonische Ansatz wird gewählt?"
                    />
                  </div>
                </motion.div>

                {/* Options Section */}
                <div className="mt-12">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Optionen</h3>
                      <p className="text-sm text-muted">Mögliche Systemverhalten und Architekturansätze.</p>
                    </div>
                    <button 
                      onClick={addOption} 
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary/20"
                    >
                      <Plus className="w-4 h-4" /> Option hinzufügen
                    </button>
                  </div>

                  <div className="space-y-6">
                    <AnimatePresence>
                      {activeScenario.options?.map((opt: any, idx: number) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="glass border border-card-border rounded-2xl p-6 shadow-sm lift-effect"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="font-bold text-muted flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-card-border flex items-center justify-center text-xs text-foreground">
                                {idx + 1}
                              </span>
                              Option bearbeiten
                            </h4>
                            <button 
                              onClick={() => deleteOption(idx)}
                              className="text-muted hover:text-danger p-2 hover:bg-danger/10 rounded-lg transition-colors"
                              title="Option löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-8">
                            
                            <div className="space-y-5">
                              <div>
                                <label className="text-[10px] uppercase font-bold text-muted block mb-1.5">Label (Kurzer Titel)</label>
                                <input 
                                  type="text" 
                                  value={opt.label || ''}
                                  onChange={e => handleUpdateOption(idx, 'label', e.target.value)}
                                  className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                                />
                                {opt.flagged && (
                                  <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-xl text-xs text-foreground flex gap-2 items-start">
                                    <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                                    <div>
                                      <span className="font-bold text-warning uppercase block mb-0.5 text-[10px]">Option Flag:</span>
                                      {opt.flagComment || 'Review nötig.'}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-bold text-muted block mb-1.5">Beschreibung</label>
                                <textarea 
                                  value={opt.description || ''}
                                  onChange={e => handleUpdateOption(idx, 'description', e.target.value)}
                                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none min-h-[100px] transition-all shadow-inner"
                                  placeholder="Was bedeutet diese Option architektonisch?"
                                />
                              </div>
                            </div>

                            <div className="bg-card/50 border border-card-border rounded-xl p-4 flex flex-col">
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] uppercase font-bold text-muted flex items-center gap-1.5">
                                  <CheckCircle2Icon className="w-3.5 h-3.5" /> Aktivierte Anforderungen
                                </label>
                                <div className="relative w-40">
                                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                                  <input 
                                    type="text"
                                    placeholder="Suchen..."
                                    value={reqSearch}
                                    onChange={e => setReqSearch(e.target.value)}
                                    className="w-full bg-background border border-card-border rounded-md pl-8 pr-2 py-1.5 text-[10px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                  />
                                </div>
                              </div>
                              <div className="flex-1 overflow-y-auto border border-card-border/50 rounded-lg p-2 bg-background custom-scrollbar space-y-1 max-h-48 min-h-[150px]">
                                {requirements.filter(r => 
                                  r.name.toLowerCase().includes(reqSearch.toLowerCase()) || 
                                  r.uid.toLowerCase().includes(reqSearch.toLowerCase()) ||
                                  (r.category && r.category.toLowerCase().includes(reqSearch.toLowerCase()))
                                ).map(req => {
                                  const isChecked = (opt.referenced_requirements || []).includes(req.uid);
                                  return (
                                    <div 
                                      key={req.uid}
                                      onClick={() => toggleRequirementInOption(idx, req.uid)}
                                      className={cn(
                                        "flex items-center space-x-2 p-1.5 rounded-md cursor-pointer transition-colors border",
                                        isChecked 
                                          ? "bg-primary/10 border-primary/30 text-primary" 
                                          : "bg-transparent border-transparent hover:bg-card-border hover:border-card-border/50 text-muted hover:text-foreground"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                                        isChecked ? "bg-primary border-primary text-white" : "border-card-border bg-card"
                                      )}>
                                        {isChecked && <CheckIcon className="w-2.5 h-2.5" />}
                                      </div>
                                      <span className={cn(
                                        "font-mono text-[9px] px-1.5 py-0.5 rounded-md shrink-0",
                                        isChecked ? "bg-primary/20" : "bg-card-border/50"
                                      )}>
                                        {getDisplayId(req.uid)}
                                      </span>
                                      <span className="truncate text-xs font-medium">{req.name}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted">
              <div className="w-16 h-16 bg-card-border/30 rounded-2xl flex items-center justify-center mb-4">
                <List className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium text-foreground">Kein Szenario ausgewählt</p>
              <p className="text-sm">Wählen Sie ein Szenario in der Sidebar oder erstellen Sie ein neues.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function CheckCircle2Icon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
