import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Activity, GitMerge, ChevronRight, ChevronLeft, X } from 'lucide-react';

interface ScenarioTutorialModalProps {
  onClose: () => void;
}

const slides = [
  {
    id: 'dilemma',
    icon: AlertTriangle,
    title: 'Das Architektur-Dilemma',
    description: 'Architekturziele wie Skalierbarkeit, Hochverfügbarkeit oder Performanz erscheinen isoliert betrachtet trivial, unterliegen in der technischen Realität jedoch massiven Zielkonflikten mit der digitalen Souveränität.',
    color: 'text-rose-600',
    bg: 'bg-rose-100 dark:bg-rose-900/30'
  },
  {
    id: 'methodology',
    icon: Activity,
    title: 'Die szenariobasierte Methodik',
    description: 'Um aus diesen Konflikten harte Architektur-Optionen abzuleiten, nutzen wir eine auf ATAM (Architecture Tradeoff Analysis Method) basierende Methodik. Anstatt nach abstrakten Vorgaben zu fragen, konfrontieren wir Sie mit konkreten Architekturszenarien (z. B. Vendor Exit, Skalierungslasten, Behördenzugriffe).',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  {
    id: 'evaluation',
    icon: GitMerge,
    title: 'Architektur-Optionen abwägen',
    description: 'Für jedes Szenario wählen Sie eine technische Lösungsoption aus. Jede Option triggert spezifische funktionale Architektur-Optionen im Hintergrund. Auch hier gilt: Bewerten Sie zwingend den geschätzten Geschäftswert und das technische Risiko, um Prioritäten für spätere Konflikte zu definieren!',
    color: 'text-violet-600',
    bg: 'bg-violet-100 dark:bg-violet-900/30'
  }
];

export function ScenarioTutorialModal({ onClose }: ScenarioTutorialModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/40 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-background/80 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5"
        >
          {/* Decorative Orbs */}
          <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-rose-500/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
          
          <div className="absolute right-4 top-4 z-10">
            <button 
              onClick={onClose} 
              className="p-2 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-0 p-6 sm:p-8">
            <div className="mb-6 flex justify-center">
              <div className="flex space-x-2">
                {slides.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${
                      idx === currentSlide ? 'bg-primary' : 'bg-primary/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 flex flex-col items-center text-center"
                >
                  <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${slides[currentSlide].bg}`}>
                    {(() => {
                      const Icon = slides[currentSlide].icon;
                      return <Icon className={`h-8 w-8 ${slides[currentSlide].color}`} strokeWidth={1.5} />;
                    })()}
                  </div>
                  
                  <h2 className="mb-3 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {slides[currentSlide].title}
                  </h2>
                  
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    {slides[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className={`flex items-center px-4 py-2 rounded-full font-medium transition-all ${
                  currentSlide === 0 
                    ? 'opacity-0 cursor-default' 
                    : 'opacity-100 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Zurück
              </button>

              <button
                onClick={handleNext}
                className="flex items-center bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40"
              >
                {currentSlide === slides.length - 1 ? 'Verstanden, los geht\'s!' : 'Weiter'}
                {currentSlide < slides.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
