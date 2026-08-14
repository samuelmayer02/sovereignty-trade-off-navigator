import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayId } from '@/store/useStore';

interface RequirementConflictCardProps {
  otherReq: any;
  activeReq: any;
  requirements: any[];
  categories: any[];
  conflict: any;
  updateConflict: (otherUid: string, updates: any) => void;
  isExclusiveMatch: boolean;
}

export function RequirementConflictCard({ otherReq, activeReq, requirements, categories, conflict, updateConflict, isExclusiveMatch }: RequirementConflictCardProps) {
  const status = conflict.status;
  
  return (
    <div 
      className={cn(
        "border rounded-3xl p-6 transition-all relative glass",
        isExclusiveMatch ? "opacity-60 bg-muted/5 border-card-border" :
        status === 'gray' ? "border-card-border bg-card/20 border-dashed" :
        status === 'green' ? "border-success/30 bg-success/5 shadow-sm" :
        status === 'blue' ? "border-blue-500/30 bg-blue-500/5 shadow-sm" :
        status === 'orange' ? "border-warning/30 bg-warning/5 shadow-sm" :
        "border-danger/30 bg-danger/5 shadow-sm"
      )}
    >
      {isExclusiveMatch && (
        <div className="absolute top-0 right-0 -mt-3 mr-4 bg-muted text-muted-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-card-border">
          Exklusive Alternativen (Keine Bewertung nötig)
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded font-bold">
              {getDisplayId(otherReq.uid, requirements, categories)}
            </span>
            <h6 className="font-bold text-foreground">{otherReq.name}</h6>
          </div>
          <p className="text-xs text-muted leading-relaxed line-clamp-3">{otherReq.description}</p>
        </div>

        <div className="flex bg-background/80 backdrop-blur-md border border-card-border rounded-2xl p-1 shadow-inner shrink-0">
          {[
            { id: 'gray', label: '?', color: 'bg-muted', text: 'Unbewertet' },
            { id: 'green', label: 'Synergie', color: 'bg-green-500', text: 'Synergie' },
            { id: 'blue', label: 'Neutral', color: 'bg-blue-500', text: 'Neutral' },
            { id: 'orange', label: 'Trade-off', color: 'bg-amber-500', text: 'Trade-off' },
            { id: 'red', label: 'Konflikt', color: 'bg-red-500', text: 'Konflikt' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => updateConflict(otherReq.uid, { status: opt.id as any })}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                status === opt.id 
                  ? `${opt.color} text-white shadow-md shadow-${opt.id}/20 scale-105` 
                  : "text-muted hover:text-foreground hover:bg-card-border/50"
              )}
            >
              {opt.id === 'gray' ? opt.label : opt.text}
            </button>
          ))}
        </div>
      </div>

      {status !== 'gray' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 pt-6 border-t border-card-border/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted mb-2">
                {status === 'green' ? 'Beschreibung der Synergie' : 
                 status === 'blue' ? 'Begründung der Neutralität' : 
                 'Beschreibung des Konflikts'}
              </label>
              <textarea 
                value={conflict.conflict_text || ''}
                placeholder={status === 'green' ? 'Warum unterstützen sich diese Anforderungen?' : 
                             status === 'blue' ? 'Warum sind diese Anforderungen neutral? (Optional)' :
                             'Warum gibt es hier eine Spannung?'}
                onChange={(e) => updateConflict(otherReq.uid, { conflict_text: e.target.value })}
                className="w-full bg-background/50 border border-card-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none min-h-[120px] resize-y shadow-inner"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted mb-2">
                {status === 'green' ? 'Best Practice / Realisierung' : 
                 status === 'blue' ? 'Zusätzliche Anmerkungen' :
                 'Best Practice / Lösung'}
              </label>
              <textarea 
                value={conflict.best_practice || ''}
                placeholder={status === 'green' ? 'Wie wird diese Synergie technisch optimal realisiert?' : 
                             status === 'blue' ? 'Optionale Ergänzungen...' :
                             'Wie gehen wir damit um?'}
                onChange={(e) => updateConflict(otherReq.uid, { best_practice: e.target.value })}
                className="w-full bg-background/50 border border-card-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none min-h-[120px] resize-y shadow-inner"
                rows={4}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
