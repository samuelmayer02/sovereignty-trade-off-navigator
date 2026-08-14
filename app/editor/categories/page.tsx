'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, ArrowLeft, Tag, AlertTriangle, X, Search } from 'lucide-react';
import Link from 'next/link';
import EditorNav from '@/components/EditorNav';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

interface Category {
  uid?: string;
  name: string;
  prefix: string;
  goal?: string;
}

export default function CategoriesEditor() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [initialData, setInitialData] = useState<string>('[]');
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    apiFetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setCategories(arr);
        setInitialData(JSON.stringify(arr));
        if (arr.length > 0) setActiveCategoryIndex(0);
      })
      .catch(() => {
        setCategories([]);
        setInitialData('[]');
      });
  }, []);

  const isDirty = initialData !== JSON.stringify(categories);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleNavigate = (e: React.MouseEvent, href: string) => {
    if (isDirty) {
      e.preventDefault();
      setPendingPath(href);
      setShowExitModal(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await apiFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categories),
      });
      if (res.ok) {
        setInitialData(JSON.stringify(categories));
        setSaveMessage('Gespeichert!');
        apiFetch('/api/categories')
          .then(r => r.ok ? r.json() : [])
          .then(data => setCategories(Array.isArray(data) ? data : []))
          .catch(() => {});
      } else {
        setSaveMessage('Fehler!');
      }
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('Fehler!');
    }
    setIsSaving(false);
  };

  const addCategory = () => {
    const newCat: Category = { name: 'Neue Kategorie', prefix: 'REQ-NEW', goal: '' };
    setCategories([newCat, ...categories]);
    setActiveCategoryIndex(0);
  };

  const updateCategory = (field: keyof Category, value: string) => {
    if (activeCategoryIndex === null) return;
    const newCats = [...categories];
    newCats[activeCategoryIndex] = { ...newCats[activeCategoryIndex], [field]: value };
    setCategories(newCats);
  };

  const deleteCategory = (index: number) => {
    if (!confirm('Wirklich löschen?')) return;
    const newCats = categories.filter((_, i) => i !== index);
    setCategories(newCats);
    if (activeCategoryIndex === index) {
      setActiveCategoryIndex(newCats.length > 0 ? 0 : null);
    } else if (activeCategoryIndex !== null && activeCategoryIndex > index) {
      setActiveCategoryIndex(activeCategoryIndex - 1);
    }
  };

  // Keep a map of original indices to correctly update when filtering
  const filteredCategoriesWithIndex = categories
    .map((cat, idx) => ({ cat, idx }))
    .filter(({ cat }) => 
      cat.name.toLowerCase().includes(search.toLowerCase()) || 
      cat.prefix.toLowerCase().includes(search.toLowerCase())
    );

  const activeCategory = activeCategoryIndex !== null ? categories[activeCategoryIndex] : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <EditorNav 
        activeTab="categories"
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={isDirty}
        saveMessage={saveMessage}
        onNavigate={handleNavigate}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/4 max-w-sm border-r border-card-border bg-card/50 flex flex-col">
          <div className="p-6 border-b border-card-border/50 bg-card">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Kategorien
              </h4>
              <button 
                onClick={addCategory} 
                className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Neu
              </button>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Kategorie suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-background border border-card-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
            {filteredCategoriesWithIndex.map(({ cat, idx }) => {
              const isActive = activeCategoryIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveCategoryIndex(idx)}
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
                        {cat.name || 'Ohne Name'}
                      </span>
                      <span className="text-[10px] font-mono text-muted/70 bg-background/50 px-1.5 py-0.5 rounded shadow-inner truncate mt-0.5 inline-block">
                        {cat.prefix}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            
            {filteredCategoriesWithIndex.length === 0 && (
              <div className="text-center py-12 text-muted text-xs italic">
                Keine Kategorien gefunden.
              </div>
            )}
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto bg-background custom-scrollbar">
          {activeCategory ? (
            <div className="p-8">
              <div className="max-w-4xl mx-auto space-y-8 pb-12">
                
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Tag className="w-5 h-5" />
                    </div>
                    Kategorie bearbeiten
                  </h2>
                  <button 
                    onClick={() => deleteCategory(activeCategoryIndex!)}
                    className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl transition-colors font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Kategorie löschen
                  </button>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={activeCategoryIndex}
                  className="glass border border-card-border rounded-2xl p-8 shadow-sm lift-effect space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Kategorie Name</label>
                      <input 
                        type="text" 
                        value={activeCategory.name}
                        onChange={e => updateCategory('name', e.target.value)}
                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                        placeholder="Name der Kategorie..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">ID-Präfix (Stamm)</label>
                      <input 
                        type="text" 
                        value={activeCategory.prefix}
                        onChange={e => updateCategory('prefix', e.target.value)}
                        className="w-full bg-background/50 border border-card-border rounded-xl px-4 py-3 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner"
                        placeholder="z.B. REQ-PERF"
                      />
                      <p className="text-[10px] text-muted/70 mt-2 font-medium">Dieses Präfix wird als Basis für generierte Requirement-IDs verwendet.</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Optimierungsziel / Beschreibung</label>
                    <textarea 
                      value={activeCategory.goal || ''}
                      onChange={e => updateCategory('goal', e.target.value)}
                      rows={4}
                      className="w-full bg-background border border-card-border rounded-xl p-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all shadow-inner custom-scrollbar"
                      placeholder="Beschreibe das Ziel dieser Kategorie (wichtig für die Bewertung)..."
                    />
                  </div>

                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <div className="w-16 h-16 bg-card-border/30 rounded-2xl flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium text-foreground">Keine Kategorie ausgewählt</p>
              <p className="text-sm">Wähle eine Kategorie aus der Liste links, um sie zu bearbeiten.</p>
            </div>
          )}
        </main>
      </div>

      {/* Exit Warning Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass border border-warning/20 w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl lift-effect"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Ungespeicherte Änderungen</h3>
                  <p className="text-sm text-muted">Deine Änderungen gehen verloren.</p>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button 
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-card border border-card-border hover:bg-background transition-colors text-sm font-medium"
                >
                  Hier bleiben
                </button>
                <button 
                  onClick={() => {
                    setShowExitModal(false);
                    if (pendingPath) router.push(pendingPath);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-danger text-white hover:bg-danger/90 transition-colors text-sm font-medium shadow-lg shadow-danger/20"
                >
                  Verwerfen & Verlassen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
