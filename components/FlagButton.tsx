'use client';

import { useState } from 'react';
import { Flag, Lock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isStaticMode } from '@/lib/api-client';

interface FlagButtonProps {
  type: 'requirement' | 'scenario' | 'option' | 'tree-node';
  id: string;
  initialFlagged?: boolean;
  initialComment?: string;
  className?: string;
}

export default function FlagButton({ type, id, initialFlagged = false, initialComment = '', className }: FlagButtonProps) {
  const { toggleFlag } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flagged, setFlagged] = useState(initialFlagged);
  const [comment, setComment] = useState(initialComment ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (isStaticMode) return;
    setIsSaving(true);
    await toggleFlag(type, id, flagged, comment);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  return (
    <div className={cn("relative z-30", className)}>
      <button
        onClick={handleToggle}
        className={cn(
          "p-2 rounded-lg transition-all",
          flagged ? "bg-warning/20 text-warning" : "text-muted hover:bg-card-border hover:text-foreground"
        )}
        title="Markierung für Editor setzen"
      >
        <Flag className={cn("w-4 h-4", flagged && "fill-warning")} />
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card border border-card-border p-6 rounded-2xl shadow-2xl max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5 text-warning" />
                Element flaggen
              </h3>
              
              <div className="space-y-4 text-left">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={flagged}
                    onChange={e => setFlagged(e.target.checked)}
                    disabled={isStaticMode}
                    className="w-4 h-4 accent-warning disabled:opacity-50"
                  />
                  <span className="text-sm font-medium group-hover:text-warning transition-colors">Flag aktiv (im Editor sichtbar)</span>
                </label>
 
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block text-left">Kommentar / Hinweis für Anpassung</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    disabled={isStaticMode}
                    className="w-full bg-background border border-card-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-warning focus:outline-none text-foreground disabled:opacity-60"
                    rows={4}
                    placeholder="Was ist dir hier aufgefallen? Was soll angepasst werden?"
                  />
                </div>

                {isStaticMode && (
                  <p className="text-xs text-warning bg-warning/10 border border-warning/20 p-2.5 rounded-lg">
                    Hinweis: Im statischen Demo-Deployment (GitHub Pages) ist das Speichern von Flags deaktiviert.
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-muted hover:text-foreground transition-colors text-sm font-medium"
                  >
                    Schließen
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isStaticMode}
                    title={isStaticMode ? "Im Demo-Modus deaktiviert" : undefined}
                    className={cn(
                      "px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg",
                      isStaticMode
                        ? "bg-muted/20 text-muted border border-card-border cursor-not-allowed opacity-75 shadow-none"
                        : "bg-warning text-black hover:bg-warning/90 shadow-warning/20"
                    )}
                  >
                    {isStaticMode ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Schreibgeschützt</span>
                      </>
                    ) : (
                      <span>{isSaving ? 'Speichert...' : 'Speichern'}</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
