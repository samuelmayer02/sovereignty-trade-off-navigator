"use client"

import { useStore } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, HelpCircle } from 'lucide-react'

export default function TourButton() {
  const { step, isTourActive, startTour, tourCompletedForSteps } = useStore()

  // Hide the button if the tour is currently active
  if (isTourActive) return null

  const isCompleted = tourCompletedForSteps[step]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-6 right-6 z-[9999]"
      >
        <motion.button
          animate={!isCompleted ? { 
            scaleX: [1,  1.3, 0.8, 1.1, 0.95, 1],
            scaleY: [1,  0.7, 1.2, 0.8, 1.05, 1],
            y:      [0,    8, -45,   5,   -5, 0],
            rotate: [0,   -5,   15, -15,   0, 0]
          } : {
            scaleX: [1, 1.2, 0.9, 1.05, 0.98, 1],
            scaleY: [1, 0.8, 1.1, 0.95, 1.02, 1],
            y:      [0,   4, -15,    2,   -1, 0],
            rotate: [0,   0,   0,    0,    0, 0]
          }}
          transition={{ 
            duration: 1.4, 
            times: [0, 0.15, 0.45, 0.75, 0.9, 1],
            ease: "easeInOut", 
            repeat: Infinity, 
            repeatDelay: !isCompleted ? 8 : 20 
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={startTour}
          className="relative flex items-center justify-center p-3 rounded-full bg-primary text-white shadow-lg shadow-primary/25 cursor-pointer group"
        >
        {!isCompleted ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-white/30 border-t-transparent"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-white/20 blur-md"
            />
            <Sparkles className="w-6 h-6 relative z-10" />
            <span className="absolute right-full mr-4 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              Tour starten
            </span>
          </>
        ) : (
          <>
            <HelpCircle className="w-6 h-6" />
            <span className="absolute right-full mr-4 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              Tour wiederholen
            </span>
          </>
        )}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}
