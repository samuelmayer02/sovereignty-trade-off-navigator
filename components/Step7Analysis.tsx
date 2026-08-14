import { useStore, getDisplayId } from '@/store/useStore'
import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Matrix from './Matrix'
import { Download, Check, Square, Search, Lock, Activity, ShieldAlert, List, Sparkles, Maximize, Minimize } from 'lucide-react'
import { cn } from '@/lib/utils'
import RiskRegister from './RiskRegister'
import { PdfReportTemplate } from './PdfReportTemplate'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export default function Step7Analysis() {
  const { requirements: allReqs, groups: allGroups, conflicts: allConflicts, setStep, componentName, selectedRequirements, selectedSovereigntyReqs, selectedScenarioReqs, toggleRequirement, treeResults, scenarioResults, acceptedRisks, isTourActive, currentTourStep, step: globalStep, decisionTrees, conflictResolutions } = useStore()

  const [view, setView] = useState<'detail' | 'risk-register'>('detail');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConflictFilter, setExportConflictFilter] = useState<'red' | 'all'>('red');
  const pdfRef = useRef<HTMLDivElement>(null);
  // Lifted from Matrix.tsx
  const [showOnlyGT, setShowOnlyGT] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!fullscreenRef.current) return;
    if (!document.fullscreenElement) {
      fullscreenRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Tour Sync Effect
  useEffect(() => {
    if (isTourActive && globalStep === 7) {
      if (currentTourStep >= 0 && currentTourStep <= 11) {
        setView('detail');
      } else if (currentTourStep >= 12) {
        setView('risk-register');
      }
    }
  }, [isTourActive, globalStep, currentTourStep]);

  const combinedReqs = { ...selectedSovereigntyReqs, ...selectedScenarioReqs, ...selectedRequirements };
  const activeReqs = allReqs.filter((r: any) => combinedReqs[r.uid] !== undefined);



  // Calculate conflicts for PDF render
  const conflicts_found = useMemo(() => {
    const activeReqsExport = allReqs.filter((r: any) => combinedReqs[r.uid] !== undefined);
    const found = [];
    for (let i = 0; i < activeReqsExport.length; i++) {
      for (let j = i + 1; j < activeReqsExport.length; j++) {
        const uidA = activeReqsExport[i].uid;
        const uidB = activeReqsExport[j].uid;
        const conflict = allConflicts.find(c => 
          (c.pair[0] === uidA && c.pair[1] === uidB) || 
          (c.pair[0] === uidB && c.pair[1] === uidA)
        );
        if (conflict && conflict.status !== 'green') {
          found.push(conflict);
        }
      }
    }
    return found;
  }, [allReqs, combinedReqs, allConflicts]);

  const conflicts_to_export = useMemo(() => {
    if (exportConflictFilter === 'red') return conflicts_found.filter(c => c.status === 'red');
    // 'all' here means red and orange conflicts (hard and soft trade-offs)
    return conflicts_found.filter(c => c.status === 'red' || c.status === 'orange');
  }, [conflicts_found, exportConflictFilter]);

  const redConflictsCount = conflicts_found.filter(c => c.status === 'red').length;
  const orangeConflictsCount = conflicts_found.filter(c => c.status === 'orange').length;
  const allConflictsCount = redConflictsCount + orangeConflictsCount;
  const currentExportCount = exportConflictFilter === 'red' ? redConflictsCount : allConflictsCount;

  if (allReqs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Lade Analyse...</p>
        </div>
      </div>
    );
  }



  const handleExport = () => {
    // Generate JSON for export
    const combinedReqs = { ...selectedSovereigntyReqs, ...selectedScenarioReqs, ...selectedRequirements };
    const activeReqsExport = allReqs.filter((r: any) => combinedReqs[r.uid] !== undefined);
    
    // Find all conflicts among selected
    const conflicts_found = []
    for (let i = 0; i < activeReqsExport.length; i++) {
      for (let j = i + 1; j < activeReqsExport.length; j++) {
        const uidA = activeReqsExport[i].uid
        const uidB = activeReqsExport[j].uid
        const conflict = allConflicts.find(c => 
          (c.pair[0] === uidA && c.pair[1] === uidB) || 
          (c.pair[0] === uidB && c.pair[1] === uidA)
        )
        if (conflict && conflict.status !== 'green') {
          conflicts_found.push(conflict)
        }
      }
    }

    const data = {
      metadata: {
        componentName,
        date: new Date().toISOString()
      },
      selected_requirements: activeReqsExport.map((r: any) => ({
        ...r,
        priority: combinedReqs[r.uid]
      })),
      tree_evaluations: treeResults,
      scenario_evaluations: scenarioResults,
      conflicts_found,
      accepted_risks: acceptedRisks
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tradeoff-analysis-${componentName.replace(/\s+/g, '-').toLowerCase() || 'export'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    setShowExportModal(true);
  }

  const executeExportPDF = async () => {
    if (!pdfRef.current) return;
    setIsExportingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4', true); // compress=true
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pages = pdfRef.current.querySelectorAll('.pdf-page');
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        if (i > 0) pdf.addPage();
        
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
      
      pdf.save(`ADR-${componentName.replace(/\s+/g, '-').toLowerCase() || 'report'}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF Generierung fehlgeschlagen.");
    } finally {
      setIsExportingPDF(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full mx-auto transition-colors duration-300 flex flex-col",
        isFullscreen ? "bg-background p-6 overflow-hidden h-screen" : "max-w-7xl"
      )}
      ref={fullscreenRef}
    >
      <div className="flex justify-between items-center mb-6 relative">
        <div className="flex bg-muted/10 p-1 rounded-lg border border-card-border" data-tour="tour-step7-tabs">
          <button 
            data-tour="tour-step7-req-matrix-tab"
            onClick={() => setView('detail')}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors", view === 'detail' ? 'bg-background text-foreground shadow-sm border border-card-border' : 'text-muted hover:text-foreground')}
          >
            <Activity className="w-4 h-4" />
            <div className="flex flex-col items-start text-left">
              <span>Konflikt-Matrix</span>
            </div>
          </button>
          <button 
            data-tour="tour-step7-risk-register-tab"
            onClick={() => setView('risk-register')}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors", view === 'risk-register' ? 'bg-background text-foreground shadow-sm border border-card-border' : 'text-muted hover:text-foreground')}
          >
            <List className="w-4 h-4" />
            <div className="flex flex-col items-start text-left">
              <span>Risiko-Register</span>
            </div>
          </button>
        </div>

        <div className="flex items-center space-x-2">
            {view !== 'risk-register' && (
              <label data-tour="tour-step7-ground-truth-filter" className="flex items-center space-x-2 cursor-pointer bg-card px-3 py-2 rounded-lg border border-card-border/50 text-sm hover:border-primary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={showOnlyGT}
                  onChange={(e) => setShowOnlyGT(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-muted font-medium whitespace-nowrap">Nur Ground Truth</span>
              </label>
            )}
            <button 
              onClick={handleExport}
              className="bg-card hover:bg-card-border border border-card-border text-foreground px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-sm"
              title="JSON Export"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xl:inline">JSON</span>
            </button>
            <button 
              data-tour="tour-step7-export"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-sm shadow-md"
              title="PDF Report"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPDF ? '...' : 'PDF'}</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-lg bg-card text-muted hover:text-primary transition-colors border border-card-border/50 hover:border-primary/50"
              title={isFullscreen ? "Vollbild beenden" : "Vollbildmodus"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="glass border border-primary/20 p-6 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4 text-foreground">PDF Export Einstellungen</h3>
            
            <div className="space-y-4 mb-6">
              <label className="flex items-start space-x-3 p-3 rounded-lg border border-card-border hover:bg-muted/5 cursor-pointer transition-colors">
                <input 
                  type="radio" 
                  name="exportFilter" 
                  checked={exportConflictFilter === 'red'}
                  onChange={() => setExportConflictFilter('red')}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="font-bold text-foreground">Nur harte (rote) Konflikte</div>
                  <div className="text-sm text-muted">Inkludiert {redConflictsCount} Konflikte</div>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-3 rounded-lg border border-card-border hover:bg-muted/5 cursor-pointer transition-colors">
                <input 
                  type="radio" 
                  name="exportFilter" 
                  checked={exportConflictFilter === 'all'}
                  onChange={() => setExportConflictFilter('all')}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="font-bold text-foreground">Harte und weiche (orange) Konflikte</div>
                  <div className="text-sm text-muted">Inkludiert {allConflictsCount} Konflikte</div>
                </div>
              </label>
            </div>

            {currentExportCount > 15 && (
              <div className="mb-6 p-3 bg-warning/10 border border-warning/30 rounded-lg flex gap-3 text-warning-foreground">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">
                  Achtung: Es werden {currentExportCount} Konflikte exportiert! Dies wird das PDF extrem groß machen und die Generierung kann sehr lange dauern (oder den Browser zum Absturz bringen).
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={() => {
                  setShowExportModal(false);
                  setTimeout(executeExportPDF, 300); 
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-colors"
              >
                Export Starten
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', zIndex: -1000 }}>
        <PdfReportTemplate
          ref={pdfRef}
          componentName={componentName}
          activeReqs={activeReqs}
          combinedReqs={combinedReqs}
          conflicts={conflicts_to_export}
          allSystemConflicts={conflicts_found}
          exportConflictFilter={exportConflictFilter}
          acceptedRisks={acceptedRisks}
          allGroups={allGroups}
          treeResults={treeResults}
          scenarioResults={scenarioResults}
          decisionTrees={decisionTrees}
          conflictResolutions={conflictResolutions}
        />
      </div>

      {view === 'risk-register' ? (
        <div className={cn("w-full", isFullscreen ? "flex-1 min-h-0" : "h-[calc(100vh-200px)]")}>
          <RiskRegister activeRequirements={activeReqs} combinedReqs={combinedReqs} />
        </div>
      ) : (
        <div className={cn("glass-card rounded-3xl overflow-hidden flex justify-center w-full", isFullscreen ? "p-0 flex-1 min-h-0" : "p-8 h-[calc(100vh-200px)]")}>
          <Matrix 
            activeRequirements={activeReqs} 
            combinedReqs={combinedReqs} 
            activeTab="matrix"
            showOnlyGT={showOnlyGT}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
          />
        </div>
      )}
    </motion.div>
  )
}
