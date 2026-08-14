import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

export default function Stepper() {
  const { 
    step, 
    maxStep, 
    setStep,
    selectedSovereigntyReqs,
    selectedScenarioReqs,
    selectedRequirements,
    requirements = [],
    groups = []
  } = useStore()

  const steps = [
    { id: 1, label: 'Setup' },
    { id: 2, label: 'Souveränität' },
    { id: 3, label: 'SOV-Ergebnis' },
    { id: 4, label: 'Szenarien' },
    { id: 5, label: 'Szenario-Erg.' },
    { id: 6, label: 'Auswahl' },
    { id: 7, label: 'Analyse' }
  ]

  // Step 3 conflicts: conflicts within selectedSovereigntyReqs
  const hasStep3Conflicts = useMemo(() => {
    const groupCounts: Record<string, number> = {}
    const sovIds = Object.keys(selectedSovereigntyReqs || {})
    for (const uid of sovIds) {
      const req = requirements.find((r: any) => r.uid === uid)
      if (req && req.groupId) {
        const group = groups.find((g: any) => (g.id === req.groupId || g.uid === req.groupId))
        if (group && group.type === 'exclusive') {
          groupCounts[req.groupId] = (groupCounts[req.groupId] || 0) + 1
          if (groupCounts[req.groupId] > 1) return true
        }
      }
    }
    return false
  }, [selectedSovereigntyReqs, requirements, groups])

  // Step 5 conflicts: conflicts within selectedSovereigntyReqs + selectedScenarioReqs
  const hasStep5Conflicts = useMemo(() => {
    const groupCounts: Record<string, number> = {}
    const allLockedIds = [...new Set([
      ...Object.keys(selectedSovereigntyReqs || {}), 
      ...Object.keys(selectedScenarioReqs || {})
    ])]
    for (const uid of allLockedIds) {
      const req = requirements.find((r: any) => r.uid === uid)
      if (req && req.groupId) {
        const group = groups.find((g: any) => (g.id === req.groupId || g.uid === req.groupId))
        if (group && group.type === 'exclusive') {
          groupCounts[req.groupId] = (groupCounts[req.groupId] || 0) + 1
          if (groupCounts[req.groupId] > 1) return true
        }
      }
    }
    return false
  }, [selectedSovereigntyReqs, selectedScenarioReqs, requirements, groups])

  // Check if at least one requirement has been selected (either sovereignty, scenario, or manual)
  const hasSelectedRequirements = useMemo(() => {
    return (
      Object.keys(selectedRequirements || {}).length > 0 ||
      Object.keys(selectedSovereigntyReqs || {}).length > 0 ||
      Object.keys(selectedScenarioReqs || {}).length > 0
    )
  }, [selectedRequirements, selectedSovereigntyReqs, selectedScenarioReqs])

  const isClickable = (targetStepId: number) => {
    // 1. Cannot go to a step higher than maxStep
    if (targetStepId > maxStep) return false

    // 2. Cannot go beyond Step 3 if there are Step 3 conflicts
    if (hasStep3Conflicts && targetStepId > 3) return false

    // 3. Cannot go beyond Step 6 if there are conflicts
    if (hasStep5Conflicts && targetStepId > 6) return false

    // 4. Step 7 (Analyse) has extra validation: must have at least one selection
    if (targetStepId === 7) {
      if (!hasSelectedRequirements) return false
    }

    return true
  }

  return (
    <div className="relative mb-12 max-w-5xl mx-auto px-6 lg:px-12 py-4 lg:py-6 glass-stepper rounded-3xl lg:rounded-full">
      {/* Horizontal Line Connector (centered vertically to circles) */}
      <div className="absolute top-8 lg:top-[44px] left-12 lg:left-[88px] right-12 lg:right-[88px] h-[2px] -translate-y-1/2 z-0">
        <div className="absolute inset-0 bg-card-border rounded-full" />
        <div 
          className="absolute left-0 top-0 bottom-0 bg-primary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
          style={{ width: `${((Math.min(step, 7) - 1) / 6) * 100}%` }}
        />
      </div>

      {/* Steps Flex Container */}
      <div className="flex justify-between items-start relative z-10">
        {steps.map((s) => {
          const clickable = isClickable(s.id);
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          
          return (
            <div 
              key={s.id} 
              data-tour={`tour-nav-step-${s.id}`}
              className={cn(
                "flex flex-col items-center transition-all duration-300 group w-12 lg:w-20",
                clickable ? "cursor-pointer" : "opacity-40 cursor-not-allowed pointer-events-none"
              )}
              onClick={() => clickable && setStep(s.id)}
            >
              {/* Circle */}
              <div className={cn(
                "flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full border-2 transition-all duration-300 text-xs lg:text-sm font-bold bg-background shadow-md",
                isActive && "border-primary bg-primary/20 text-primary scale-110 ring-4 ring-primary/10 shadow-lg shadow-primary/5",
                isCompleted && "border-primary bg-primary text-white",
                !isActive && !isCompleted && "border-card-border text-muted",
                clickable && !isActive && "hover:border-primary/50 hover:bg-primary/5 hover:scale-105"
              )}>
                {s.id}
              </div>
              
              {/* Label */}
              <span className={cn(
                "mt-3 text-[10px] lg:text-xs font-semibold text-center transition-colors duration-300 max-w-[80px] block leading-tight hidden sm:block",
                isActive && "text-primary font-bold",
                isCompleted && "text-foreground",
                !isActive && !isCompleted && "text-muted",
                clickable && "group-hover:text-foreground"
              )}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
