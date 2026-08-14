"use client"

import { useStore } from '@/store/useStore'
import { isStaticMode, apiFetch } from '@/lib/api-client'
import { Download, Upload, PlusCircle } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

export default function SessionManager() {
  const store = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Subscribe to store changes to live-sync to the workspace
    const unsubscribe = useStore.subscribe((state, prevState) => {
      // Only sync if we have a session ID and we actually moved past step 1 or are active
      if (state.sessionId && state !== prevState) {
        const stateToExport = {
          sessionId: state.sessionId,
          step: state.step,
          componentName: state.componentName,
          evaluationGoal: state.evaluationGoal,
          selectedRequirements: state.selectedRequirements,
          selectedSovereigntyReqs: state.selectedSovereigntyReqs,
          selectedScenarioReqs: state.selectedScenarioReqs,
          treeResults: state.treeResults,
          scenarioResults: state.scenarioResults,
          scenarioContexts: state.scenarioContexts,
          ignoredScenarios: state.ignoredScenarios,
          treeTraversalStates: state.treeTraversalStates,
          activeTreeIndex: state.activeTreeIndex,
          acceptedRisks: state.acceptedRisks,
          resolvedConflicts: state.resolvedConflicts,
          manualRequirementSources: state.manualRequirementSources,
          hasSeenOnboarding: state.hasSeenOnboarding,
          hasSeenTreeTutorial: state.hasSeenTreeTutorial,
          hasSeenScenarioTutorial: state.hasSeenScenarioTutorial,
          theme: state.theme,
          timestamp: new Date().toISOString()
        }

        if (!isStaticMode) {
          apiFetch('/api/save-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(stateToExport),
          }).catch(err => console.error("Failed to sync session to workspace", err))
        }
      }
    })

    return () => unsubscribe()
  }, [])

  if (!mounted) return null

  const handleExport = () => {
    // Only export the state we care about, not functions
    const stateToExport = {
      sessionId: store.sessionId,
      step: store.step,
      componentName: store.componentName,
      evaluationGoal: store.evaluationGoal,
      selectedRequirements: store.selectedRequirements,
      selectedSovereigntyReqs: store.selectedSovereigntyReqs,
      selectedScenarioReqs: store.selectedScenarioReqs,
      treeResults: store.treeResults,
      scenarioResults: store.scenarioResults,
      scenarioContexts: store.scenarioContexts,
      ignoredScenarios: store.ignoredScenarios,
      treeTraversalStates: store.treeTraversalStates,
      activeTreeIndex: store.activeTreeIndex,
      acceptedRisks: store.acceptedRisks,
      resolvedConflicts: store.resolvedConflicts,
      manualRequirementSources: store.manualRequirementSources,
      hasSeenOnboarding: store.hasSeenOnboarding,
      hasSeenTreeTutorial: store.hasSeenTreeTutorial,
      hasSeenScenarioTutorial: store.hasSeenScenarioTutorial,
      theme: store.theme
    }

    const blob = new Blob([JSON.stringify(stateToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sovereignty-session-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedState = JSON.parse(content)
        
        // Simple validation
        if (parsedState.step !== undefined) {
          // ensure the imported state has a sessionId, or generate one
          if (!parsedState.sessionId) {
            parsedState.sessionId = Math.random().toString(36).substring(2, 9);
          }
          store.importState(parsedState)
          alert("Session erfolgreich geladen!")
        } else {
          alert("Ungültige Session-Datei.")
        }
      } catch (error) {
        alert("Fehler beim Lesen der Datei.")
        console.error(error)
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    if (confirm("Möchtest du die aktuelle Session wirklich löschen und von vorne beginnen? Alle nicht exportierten Daten gehen verloren.")) {
      store.reset()
    }
  }

  return (
    <div className="flex items-center space-x-2 glass border border-card-border rounded-xl p-1 shadow-2xl">
      <button 
        onClick={handleExport}
        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-muted/10 rounded-lg transition-colors"
        title="Session als JSON speichern"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>
      
      <div className="w-px h-4 bg-card-border"></div>
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-muted/10 rounded-lg transition-colors"
        title="Session aus JSON laden"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Import</span>
      </button>
      <input 
        type="file" 
        accept=".json" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleImport}
      />

      <div className="w-px h-4 bg-card-border"></div>
      
      <button 
        onClick={handleReset}
        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-primary/80 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        title="Neue Session beginnen"
      >
        <PlusCircle className="w-3.5 h-3.5" />
        <span>Neue Session</span>
      </button>
    </div>
  )
}
