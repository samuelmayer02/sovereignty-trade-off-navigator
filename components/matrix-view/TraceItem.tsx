import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ListTree, Scale, User, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TraceItem({ source }: { source: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const isTree = source.type === 'tree';
  const isScenario = source.type === 'scenario';
  const isConflict = source.type === 'conflict_resolution';

  return (
    <li
      className="relative flex flex-col p-3 rounded-xl bg-card/60 border border-card-border hover:border-primary/40 transition-colors group shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3 shadow-sm transition-colors mt-0.5",
          isTree ? "bg-primary/10 text-primary group-hover:bg-primary/20" :
            isScenario ? "bg-success/10 text-success group-hover:bg-success/20" :
              isConflict ? "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20" :
                "bg-warning/10 text-warning group-hover:bg-warning/20"
        )}>
          {isTree ? <GitBranch className="w-4 h-4" /> :
            isScenario ? <ListTree className="w-4 h-4" /> :
              isConflict ? <Scale className="w-4 h-4" /> :
                <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {isTree ? 'Entscheidungsbaum' : isScenario ? 'Szenario' : isConflict ? 'Konflikt gelöst' : 'Manuell'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              {isTree && typeof source.level === 'number' && (
                <div 
                  className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/25 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm shrink-0"
                  title="Dieses SEAL-Level wurde im Entscheidungsbaum als Ziel definiert"
                >
                  <span className="opacity-75 font-normal text-[8px]">Gewählt:</span>
                  <span>SEAL-{source.level}</span>
                </div>
              )}
              {source.businessValue !== undefined && source.businessValue !== null && (
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20" title="Strategische Relevanz">
                  Rel: {source.businessValue}/10
                </span>
              )}
              {(source.techRisk !== undefined || source.risk !== undefined) && (
                <span className="px-1.5 py-0.5 rounded bg-danger/10 text-danger font-bold border border-danger/20" title="Umsetzungs-Risiko">
                  Risiko: {source.techRisk ?? source.risk}/10
                </span>
              )}
            </div>
          </div>
          <div className="text-sm font-bold text-foreground truncate" title={source.name}>
            {source.name}
          </div>
          {source.optionTitle && (
            <div className="text-xs text-muted-foreground truncate mt-0.5" title={source.optionTitle}>
              <span className="font-semibold text-primary/75 mr-1">Gewählt:</span>
              <span className="italic">{source.optionTitle}</span>
            </div>
          )}
        </div>
      </div>

      {/* Begründung DIRECTLY UNDERNEATH EACH ORIGIN */}
      {source.notes ? (
        <div className="mt-2.5 pt-2 border-t border-card-border/40 bg-muted/10 rounded-lg p-2.5 text-xs text-foreground/90 leading-relaxed italic">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block not-italic mb-0.5">
            Begründung der {isConflict ? 'Konfliktauflösung' : 'Bewertung'}:
          </span>
          "{source.notes}"
        </div>
      ) : (
        <div className="mt-2 pt-1 border-t border-card-border/20 text-[11px] text-muted italic pl-1">
          Keine schriftliche Begründung hinterlegt.
        </div>
      )}

      {/* Popover */}
      <AnimatePresence>
        {isHovered && (source.detailText || source.optionTitle || source.optionDescription || source.context) && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-[340px] z-[200] pointer-events-none"
          >
            <div className="bg-background border border-card-border rounded-xl p-4 shadow-2xl ring-1 ring-primary/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                {isTree ? 'Auslöser Frage' : isScenario ? 'Szenario Details' : 'Details'}
              </div>
              
              {isTree && (
                <div className="space-y-3">
                  {source.detailText && (
                    <div>
                      <div className="text-[9px] font-bold uppercase text-muted mb-1">Fragestellung</div>
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed italic">
                        "{source.detailText}"
                      </p>
                    </div>
                  )}
                  {source.optionTitle && (
                    <div>
                      <div className="text-[9px] font-bold uppercase text-muted mb-1">Gewählte Option</div>
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed p-2 bg-muted/10 rounded-md border border-card-border/50 font-medium">
                        {source.optionTitle}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isScenario && (
                <div className="space-y-3">
                  {source.detailText && (
                    <div>
                      <div className="text-[9px] font-bold uppercase text-muted mb-1">Fragestellung</div>
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {source.detailText}
                      </p>
                    </div>
                  )}
                  {source.context && (
                    <div className="pl-2.5 pr-2 py-1.5 bg-primary/5 border-l-2 border-primary/50 rounded-r-md">
                      <div className="text-[9px] font-bold uppercase text-primary mb-0.5">Kontext / Ausgangslage</div>
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed italic">
                        {source.context}
                      </p>
                    </div>
                  )}
                  {source.optionTitle && (
                    <div>
                      <div className="text-[9px] font-bold uppercase text-muted mb-1">Gewählte Option</div>
                      <div className="p-2 bg-muted/10 rounded-md border border-card-border/50">
                        <div className="font-bold text-xs text-foreground mb-1">{source.optionTitle}</div>
                        {source.optionDescription && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-1">
                            {source.optionDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!isTree && !isScenario && source.detailText && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {source.detailText}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
