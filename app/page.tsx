'use client';

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import Stepper from '@/components/Stepper'
import Step1Setup from '@/components/Step1Setup'
import Step2DecisionTrees from '@/components/Step2DecisionTrees'
import Step3SovereigntySummary from '@/components/Step3SovereigntySummary'
import Step4Scenarios from '@/components/Step4Scenarios'
import Step5ScenarioSummary from '@/components/Step5ScenarioSummary'
import Step6Selection from '@/components/Step6Selection'
import Step7Analysis from '@/components/Step7Analysis'
import SessionManager from '@/components/SessionManager'
import SpotlightTour from '@/components/SpotlightTour'
import TourButton from '@/components/TourButton'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  const step = useStore((state) => state.step)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  return (
    <main className="min-h-screen bg-background py-8 px-6 font-sans">
      <SpotlightTour />
      <TourButton />
      
      <div className="flex justify-end items-center space-x-4 mb-4 max-w-7xl mx-auto">
        <SessionManager />
        <Link 
          href="/editor"
          className="flex items-center space-x-2 text-muted hover:text-primary bg-card border border-card-border hover:border-primary/50 px-4 py-2 rounded-lg transition-all"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Editor öffnen</span>
        </Link>
        <ThemeToggle />
      </div>
      <header className="text-center mb-12 max-w-7xl mx-auto relative">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Sovereignty <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Trade-off Navigator</span>
        </h1>
        <p className="text-muted max-w-2xl mx-auto text-lg">
          Navigiere die Konflikte zwischen digitaler Souveränität, Hochverfügbarkeit und operativer Komplexität.
        </p>
      </header>

      <div className="max-w-7xl mx-auto mb-8">
        <Stepper />
      </div>

      <div className="w-full">
        {step === 1 && <Step1Setup />}
        {step === 2 && <Step2DecisionTrees />}
        {step === 3 && <Step3SovereigntySummary />}
        {step === 4 && <Step4Scenarios />}
        {step === 5 && <Step5ScenarioSummary />}
        {step === 6 && <Step6Selection />}
        {step === 7 && <Step7Analysis />}
      </div>
    </main>
  )
}
