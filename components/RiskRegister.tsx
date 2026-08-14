import { useStore, getDisplayId } from '@/store/useStore'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  X, 
  ChevronRight, 
  GitBranch, 
  RotateCcw, 
  FileText, 
  Filter, 
  Calendar,
  CheckCircle2,
  Layers,
  FolderGit2,
  Tag,
  Target,
  ArrowRightLeft,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProvenance, type Provenance } from '@/lib/provenance'

function formatBoldText(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function ConflictDetailsCards({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
      {formatBoldText(text)}
    </p>
  );
}

function ProvenanceBadge({ prov }: { prov: Provenance | null }) {
  if (!prov) {
    return (
      <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground bg-muted/10 border border-card-border/60 rounded-xl p-3">
        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
        <span>Manuell / direkt in der Auswahl oder Matrix aktiviert.</span>
      </div>
    );
  }

  if (prov.source === 'tree') {
    const { treeTitle, resultTitle, level, questionName, questionText, optionLabel, businessValue, techRisk, notes } = prov.data
    return (
      <div className="mt-2.5 flex items-start gap-3 text-xs bg-primary/5 border border-primary/20 rounded-xl p-3.5">
        <GitBranch className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-primary font-bold">{treeTitle}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground font-semibold">{resultTitle}</span>
            {level !== undefined && (
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px] font-mono uppercase border border-primary/20 font-bold">SEAL-{level}</span>
            )}
          </div>
          {questionText && (
            <div className="text-[11px] text-foreground/90 bg-background/80 p-2.5 rounded-lg border border-card-border/50 leading-relaxed">
              <span className="font-semibold text-primary">Frage{questionName ? ` (${questionName})` : ''}: </span>
              <span className="italic">„{questionText}“</span>
            </div>
          )}
          {optionLabel && (
            <div className="text-[11px] text-foreground/90 bg-background/80 p-2.5 rounded-lg border border-card-border/50 leading-relaxed">
              <span className="font-semibold text-primary">Gewählte Option: </span>
              <span className="font-medium text-foreground">„{optionLabel}“</span>
            </div>
          )}
          {(businessValue !== undefined && techRisk !== undefined) && (
            <div className="pt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">SR: {businessValue}/10</span>
              <span className="bg-danger/10 border border-danger/20 text-danger font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">UR: {techRisk}/10</span>
              {notes && (
                <span className="bg-card border border-card-border text-muted-foreground px-2 py-0.5 rounded-md italic text-[11px] max-w-sm truncate" title={notes}>
                  "{notes}"
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (prov.source === 'manual') {
    const { title, optionLabel } = prov.data;
    return (
      <div className="mt-2.5 flex items-start gap-3 text-xs bg-muted/10 border border-card-border rounded-xl p-3.5">
        <Target className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-bold">{title}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{optionLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  const { scenarioId, scenarioTopic, metricQuestion, optionLabel, optionDescription, businessValue, risk, notes } = prov.data
  return (
    <div className="mt-2.5 flex items-start gap-3 text-xs bg-secondary/10 border border-secondary/20 rounded-xl p-3.5">
      <Target className="w-4 h-4 text-secondary-foreground shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-foreground font-bold">{scenarioId}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{scenarioTopic}</span>
          <span className="text-muted-foreground">→ Option:</span>
          <span className="text-foreground font-semibold">„{optionLabel}“</span>
        </div>
        {metricQuestion && (
          <div className="text-[11px] text-foreground/90 bg-background/80 p-2.5 rounded-lg border border-card-border/50 leading-relaxed">
            <span className="font-semibold text-primary">Leitfrage: </span>
            <span className="italic">„{metricQuestion}“</span>
          </div>
        )}
        {optionDescription && (
          <div className="text-[11px] text-foreground/90 bg-background/80 p-2.5 rounded-lg border border-card-border/50 leading-relaxed">
            <span className="font-semibold text-primary">Beschreibung: </span>
            <span className="italic text-foreground/80">„{optionDescription}“</span>
          </div>
        )}
        {(businessValue !== undefined && risk !== undefined) && (
          <div className="pt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">SR: {businessValue}/10</span>
            <span className="bg-danger/10 border border-danger/20 text-danger font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">UR: {risk}/10</span>
            {notes && (
              <span className="bg-card border border-card-border text-muted-foreground px-2 py-0.5 rounded-md italic text-[11px] max-w-sm truncate" title={notes}>
                "{notes}"
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RequirementDetailCard({
  req,
  reqId,
  group,
  roleLabel,
  requirements,
  categories
}: {
  req: any;
  reqId: string;
  group: any;
  roleLabel: string;
  requirements: any[];
  categories: any[];
}) {
  const displayId = getDisplayId(reqId, requirements, categories);
  const title = req?.name || displayId;
  const description = req?.description || req?.text || 'Keine weitere Beschreibung vorhanden.';
  const category = req?.category || 'Allgemein';
  const groupName = group?.name || req?.groupId;
  const isExclusive = group?.type === 'exclusive';

  return (
    <div className="flex-1 flex flex-col justify-between bg-card/60 border border-card-border/60 rounded-xl p-4 space-y-3">
      <div className="space-y-2">
        {/* Requirement Badges Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
            {displayId}
          </span>
          {category && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/20 border border-card-border/60 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Tag className="w-3 h-3 text-muted-foreground" />
              {category}
            </span>
          )}
          {groupName && (
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1",
              isExclusive 
                ? "bg-warning/10 text-warning border-warning/20" 
                : "bg-primary/10 text-primary border border-primary/20"
            )}>
              <Layers className="w-3 h-3" />
              Dimension: {groupName} {isExclusive ? '(Entweder/Oder)' : '(Mindestens 1)'}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-foreground leading-snug">
          {title}
        </h4>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
          {description}
        </p>
      </div>
    </div>
  );
}

function AcceptedRiskCard({ 
  riskKey, 
  req1Id, 
  req2Id, 
  data, 
  req1, 
  req2, 
  group1,
  group2,
  conflictData, 
  prov1, 
  prov2,
  requirements,
  categories,
  onRevoke 
}: { 
  riskKey: string;
  req1Id: string; 
  req2Id: string; 
  data: { rationale: string; timestamp: string }; 
  req1: any; 
  req2: any; 
  group1: any;
  group2: any;
  conflictData: any; 
  prov1: any; 
  prov2: any;
  requirements: any[];
  categories: any[];
  onRevoke: (req1Id: string, req2Id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const status = conflictData?.status || 'orange';
  const isRed = status === 'red';

  const dateFormatted = data.timestamp 
    ? new Date(data.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Unbekanntes Datum';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "glass-card rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md",
        isRed 
          ? "border-l-4 border-l-danger border-card-border/60" 
          : "border-l-4 border-l-warning border-card-border/60"
      )}
    >
      {/* Top Banner: Status & Actions */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-card-border/40">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              isRed ? "bg-danger shadow-xs" : "bg-warning shadow-xs"
            )} />
            <span className={cn(
              "text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md tracking-wider border",
              isRed ? "bg-danger/10 text-danger border-danger/20" : "bg-warning/10 text-warning border-warning/20"
            )}>
              {isRed ? 'KRITISCHER KONFLIKT (ROT)' : 'WARNUNG / TRADE-OFF (ORANGE)'}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-success/10 text-success border border-success/20 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Risiko Akzeptiert
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 bg-background/60 px-2.5 py-1 rounded-lg border border-card-border/50">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {dateFormatted}
            </span>

            {showRevokeConfirm ? (
              <div className="flex items-center gap-1.5 bg-danger/10 border border-danger/30 p-1 rounded-lg">
                <span className="text-[11px] text-danger font-semibold px-1">Widerrufen?</span>
                <button
                  onClick={() => onRevoke(req1Id, req2Id)}
                  className="px-2 py-0.5 rounded bg-danger text-white text-[10px] font-bold hover:bg-danger/90 transition-colors cursor-pointer"
                >
                  Ja
                </button>
                <button
                  onClick={() => setShowRevokeConfirm(false)}
                  className="px-2 py-0.5 rounded bg-background text-foreground text-[10px] font-medium hover:bg-card transition-colors cursor-pointer border border-card-border"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRevokeConfirm(true)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-danger hover:bg-danger/10 px-2.5 py-1 rounded-lg border border-card-border/50 hover:border-danger/30 transition-all cursor-pointer"
                title="Risiko-Akzeptanz widerrufen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Widerrufen</span>
              </button>
            )}
          </div>
        </div>

        {/* Conflicting Pair Header & Side-by-side Requirement Cards */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
            Konfliktpaare & Architektur-Optionen:
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <RequirementDetailCard 
              req={req1} 
              reqId={req1Id} 
              group={group1} 
              roleLabel="Architektur-Option A" 
              requirements={requirements}
              categories={categories}
            />
            <RequirementDetailCard 
              req={req2} 
              reqId={req2Id} 
              group={group2} 
              roleLabel="Architektur-Option B" 
              requirements={requirements}
              categories={categories}
            />
          </div>
        </div>

        {/* Documented Rationale Box */}
        <div className="bg-card/40 border border-card-border/60 rounded-xl p-3.5 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-success" />
            Dokumentierte Begründung zur Akzeptanz:
          </div>
          <p className="text-xs text-foreground/90 italic leading-relaxed pl-1">
            "{data.rationale}"
          </p>
        </div>

        {/* Accordion Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-xs font-bold text-primary hover:text-primary/80 pt-1 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-primary" />
            {isExpanded ? "Details & Herleitung ausblenden" : "Details & Herleitung anzeigen"}
          </span>
          <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-90")} />
        </button>
      </div>

      {/* Expanded Accordion Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-card-border/40 bg-background/50 p-4 space-y-4"
          >
            {/* Conflict Analysis Text */}
            {conflictData?.conflict_text && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  Konflikt-Analyse & Spannungsfeld
                </h4>
                <div className="bg-card/60 border border-card-border/60 rounded-xl p-3.5 border-l-3 border-l-warning">
                  <ConflictDetailsCards text={conflictData.conflict_text} />
                </div>
              </div>
            )}

            {/* Best Practice Recommendation */}
            {conflictData?.best_practice && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Best Practice Empfehlung
                </h4>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5">
                  <p className="text-xs text-foreground/90 leading-relaxed italic">
                    {formatBoldText(conflictData.best_practice)}
                  </p>
                </div>
              </div>
            )}

            {/* Provenance / Herleitung Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-card-border/40">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-primary" />
                  Herleitung: {getDisplayId(req1Id, requirements, categories)} ({req1?.name || 'Architektur-Option A'})
                </div>
                <ProvenanceBadge prov={prov1} />
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-primary" />
                  Herleitung: {getDisplayId(req2Id, requirements, categories)} ({req2?.name || 'Architektur-Option B'})
                </div>
                <ProvenanceBadge prov={prov2} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RiskRegister({ activeRequirements, combinedReqs }: { activeRequirements: any[], combinedReqs: Record<string, number> }) {
  const { 
    acceptedRisks, 
    revokeRisk, 
    requirements, 
    groups,
    categories,
    conflicts, 
    treeResults, 
    scenarioResults, 
    decisionTrees, 
    scenarios, 
    selectedRequirements 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'red' | 'orange'>('all');

  const acceptedEntries = useMemo(() => {
    return Object.entries(acceptedRisks).map(([key, data]) => {
      // Robust UUID / ID parsing for key = `${req1Id}-${req2Id}`
      let req1 = requirements.find((r: any) => r.uid === key.slice(0, 36));
      let req2 = requirements.find((r: any) => r.uid === key.slice(37));

      if (!req1) {
        req1 = requirements.find((r: any) => key.startsWith(r.uid));
        if (req1) {
          const remainder = key.slice(req1.uid.length + 1);
          req2 = requirements.find((r: any) => r.uid === remainder);
        }
      }

      if (!req2) {
        req2 = requirements.find((r: any) => key.endsWith(r.uid));
      }

      const req1Id = req1?.uid || key.slice(0, 36);
      const req2Id = req2?.uid || key.slice(37);

      const group1 = req1?.groupId ? groups.find((g: any) => g.id === req1.groupId || g.uid === req1.groupId) : null;
      const group2 = req2?.groupId ? groups.find((g: any) => g.id === req2.groupId || g.uid === req2.groupId) : null;

      const conflictData = conflicts?.find((c: any) => 
        (c.pair[0] === req1Id && c.pair[1] === req2Id) || 
        (c.pair[0] === req2Id && c.pair[1] === req1Id)
      );

      const prov1 = getProvenance(req1Id, treeResults, scenarioResults, decisionTrees, scenarios, selectedRequirements[req1Id] !== undefined);
      const prov2 = getProvenance(req2Id, treeResults, scenarioResults, decisionTrees, scenarios, selectedRequirements[req2Id] !== undefined);

      return {
        key,
        req1Id,
        req2Id,
        data,
        req1,
        req2,
        group1,
        group2,
        conflictData,
        status: conflictData?.status || 'orange',
        prov1,
        prov2
      };
    });
  }, [acceptedRisks, requirements, groups, conflicts, treeResults, scenarioResults, decisionTrees, scenarios, selectedRequirements]);

  const redCount = acceptedEntries.filter(e => e.status === 'red').length;
  const orangeCount = acceptedEntries.filter(e => e.status === 'orange').length;

  const filteredEntries = useMemo(() => {
    return acceptedEntries.filter(e => {
      if (filter === 'red' && e.status !== 'red') return false;
      if (filter === 'orange' && e.status !== 'orange') return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name1 = (e.req1?.name || '').toLowerCase();
      const name2 = (e.req2?.name || '').toLowerCase();
      const desc1 = (e.req1?.description || '').toLowerCase();
      const desc2 = (e.req2?.description || '').toLowerCase();
      const group1Name = (e.group1?.name || '').toLowerCase();
      const group2Name = (e.group2?.name || '').toLowerCase();
      const id1 = (e.req1Id || '').toLowerCase();
      const id2 = (e.req2Id || '').toLowerCase();
      const disp1 = getDisplayId(e.req1Id, requirements, categories).toLowerCase();
      const disp2 = getDisplayId(e.req2Id, requirements, categories).toLowerCase();
      const rationale = (e.data.rationale || '').toLowerCase();

      return name1.includes(q) || name2.includes(q) || desc1.includes(q) || desc2.includes(q) || 
             group1Name.includes(q) || group2Name.includes(q) || id1.includes(q) || id2.includes(q) || 
             disp1.includes(q) || disp2.includes(q) || rationale.includes(q);
    });
  }, [acceptedEntries, filter, searchQuery, requirements, categories]);

  const latestTimestamp = useMemo(() => {
    if (acceptedEntries.length === 0) return null;
    const timestamps = acceptedEntries.map(e => new Date(e.data.timestamp).getTime()).filter(Boolean);
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps)).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, [acceptedEntries]);

  return (
    <div data-tour="tour-step7-risk-register-overview" className="flex flex-col h-full w-full max-w-6xl mx-auto bg-background px-4 py-2 space-y-6 overflow-y-auto custom-scrollbar">
      {/* Title & Description Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-success/10 text-success border border-success/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Risikoregister (Akzeptierte Konflikte)</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Zentrale Dokumentation aller im Konflikt-Resolver explizit akzeptierten Risiken und Trade-Off-Entscheidungen.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
          <FileText className="w-4 h-4" />
          <span>{acceptedEntries.length} Akzeptierte Risiken</span>
        </div>
      </div>

      {/* Summary KPI Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-4 border border-card-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success border border-success/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gesamt Akzeptiert</div>
            <div className="text-2xl font-black text-foreground">{acceptedEntries.length}</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-card-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kritische Risiken (Rot)</div>
            <div className="text-2xl font-black text-danger">{redCount}</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-card-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning border border-warning/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Warnungen (Orange)</div>
            <div className="text-2xl font-black text-warning">{orangeCount}</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-card-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Zuletzt Akzeptiert</div>
            <div className="text-xs font-bold text-foreground truncate max-w-[140px]">
              {latestTimestamp || 'Keine Einträge'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-3 border border-card-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Architektur-Option, Dimension, ID oder Begründung..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-background/80 border border-card-border/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-background/70 rounded-xl border border-card-border/50 text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-3 py-1 rounded-lg transition-all cursor-pointer text-center flex-1 sm:flex-initial",
              filter === 'all'
                ? "bg-card text-foreground font-black shadow-xs border border-card-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Alle ({acceptedEntries.length})
          </button>
          <button
            onClick={() => setFilter('red')}
            className={cn(
              "px-3 py-1 rounded-lg transition-all cursor-pointer text-center flex-1 sm:flex-initial",
              filter === 'red'
                ? "bg-danger text-white font-black shadow-xs"
                : "text-danger hover:bg-danger/10"
            )}
          >
            Rot ({redCount})
          </button>
          <button
            onClick={() => setFilter('orange')}
            className={cn(
              "px-3 py-1 rounded-lg transition-all cursor-pointer text-center flex-1 sm:flex-initial",
              filter === 'orange'
                ? "bg-warning text-black font-black shadow-xs"
                : "text-warning hover:bg-warning/10"
            )}
          >
            Orange ({orangeCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4 pb-8">
        {acceptedEntries.length === 0 ? (
          /* Empty State: No Accepted Risks */
          <div className="glass rounded-[2rem] p-12 border border-card-border/50 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-8 h-8 text-success" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-foreground">Keine akzeptierten Risiken dokumentiert</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sobald Sie im Konflikt-Resolver (Matrix-Ansicht) Trade-Off-Spannungen analysieren und ein Risiko explizit mit Begründung akzeptieren, wird es hier zentral erfasst.
              </p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          /* Empty State: Search/Filter No Match */
          <div className="glass rounded-2xl p-8 border border-card-border/50 text-center space-y-2">
            <Filter className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <h4 className="text-sm font-bold text-foreground">Keine Ergebnisse für diese Filterung</h4>
            <p className="text-xs text-muted-foreground">
              Passen Sie die Suchanfrage oder den Filter an.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilter('all'); }}
              className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          /* List of Accepted Risk Cards */
          filteredEntries.map((item) => (
            <AcceptedRiskCard
              key={item.key}
              riskKey={item.key}
              req1Id={item.req1Id}
              req2Id={item.req2Id}
              data={item.data}
              req1={item.req1}
              req2={item.req2}
              group1={item.group1}
              group2={item.group2}
              conflictData={item.conflictData}
              prov1={item.prov1}
              prov2={item.prov2}
              requirements={requirements}
              categories={categories}
              onRevoke={revokeRisk}
            />
          ))
        )}
      </div>
    </div>
  );
}

