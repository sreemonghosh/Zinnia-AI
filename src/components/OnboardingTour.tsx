import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, CheckCircle2 } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'model-selector-step',
    title: 'Choose AI Power',
    content: 'Switch between different Zinnia models. Flash is incredibly fast, while Pro is best for deep reasoning and high-fidelity generation.',
    position: 'bottom'
  },
  {
    targetId: 'input-tools-step',
    title: 'Rich Inputs',
    content: 'Attach images, use your camera, or dictate with your voice to make your prompts more expressive.',
    position: 'top'
  },
  {
    targetId: 'live-button-step',
    title: 'Real-time Voice',
    content: 'Experience Zinnia Live. Talk to the AI in real-time with ultra-low latency voice responses.',
    position: 'bottom'
  },
  {
    targetId: 'chat-history-tour-step',
    title: 'Chat History',
    content: 'All your past conversations are automatically saved here on the left side for you to access anytime.',
    position: 'right'
  }
];

interface OnboardingTourProps {
  onEnsureSidebarOpen?: () => void;
}

export function OnboardingTour({ onEnsureSidebarOpen }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('zinnia-onboarding-completed');
    if (!hasSeenTour) {
      // Start the tour after a short delay
      const timer = setTimeout(() => setCurrentStep(0), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual tour replay triggers
  useEffect(() => {
    const handleStartTour = () => {
      setCurrentStep(0);
    };
    window.addEventListener('start-onboarding-tour', handleStartTour);
    return () => window.removeEventListener('start-onboarding-tour', handleStartTour);
  }, []);

  // Ensure sidebar is open when tour reaches the Chat History step
  useEffect(() => {
    if (currentStep !== null && TOUR_STEPS[currentStep]?.targetId === 'chat-history-tour-step') {
      onEnsureSidebarOpen?.();
    }
  }, [currentStep, onEnsureSidebarOpen]);

  const updateRect = useCallback(() => {
    if (currentStep !== null) {
      const step = TOUR_STEPS[currentStep];
      let element = document.getElementById(step.targetId);

      // Robust fallback selector for sidebar chat history
      if (!element && step.targetId === 'chat-history-tour-step') {
        element = (document.querySelector('[data-tour="chat-history"]') as HTMLElement)
          || document.getElementById('sidebar-history-step')
          || document.getElementById('sidebar-step');
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          return;
        }
      }

      // If targeting left chat history but still opening/animating, supply graceful left-side coordinates
      if (step.targetId === 'chat-history-tour-step') {
        const fallbackRect = new DOMRect(16, 200, 290, 260);
        setTargetRect(fallbackRect);
      }
    }
  }, [currentStep]);

  useEffect(() => {
    updateRect();
    const t1 = setTimeout(updateRect, 50);
    const t2 = setTimeout(updateRect, 180);
    const t3 = setTimeout(updateRect, 400);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [currentStep, updateRect]);

  const handleFinish = () => {
    localStorage.setItem('zinnia-onboarding-completed', 'true');
    setCurrentStep(null);
  };

  const handleSkip = () => {
    handleFinish();
  };

  if (currentStep === null || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const cardWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 320;
  const gap = 16;

  const getPosition = () => {
    let top = 0;
    let left = 0;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    const targetCenterX = targetRect.left + targetRect.width / 2;
    
    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetCenterX - cardWidth / 2;
        break;
      case 'top':
        top = targetRect.top - gap - 190;
        left = targetCenterX - cardWidth / 2;
        break;
      case 'right':
        // When pointing to the left sidebar chat history:
        // If there is ample room to the right of the sidebar, anchor directly alongside it
        if (targetRect.right + cardWidth + gap + 16 <= viewportWidth) {
          top = Math.max(16, targetRect.top + Math.min(30, targetRect.height / 3));
          left = targetRect.right + gap;
        } else {
          // On mobile or narrow screens, position comfortably on the left side
          top = Math.max(16, Math.min(targetRect.top + 60, viewportHeight - 220));
          left = Math.max(16, targetRect.left + 16);
        }
        break;
      case 'left':
        top = targetRect.top;
        left = targetRect.left - cardWidth - gap;
        break;
      default:
        top = targetRect.top;
        left = targetRect.left;
    }

    // Boundary constraints: strictly prevent cards from overflowing screen
    left = Math.max(16, Math.min(left, viewportWidth - cardWidth - 16));
    top = Math.max(16, Math.min(top, viewportHeight - 220));
    
    return { top, left };
  };

  const pos = getPosition();
  const arrowLeft = targetRect.left + targetRect.width / 2 - pos.left;
  const arrowTop = targetRect.top + targetRect.height / 2 - pos.top;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Background Dim */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] pointer-events-auto"
      />

      {/* Spotlight Effect */}
      <div 
        className="absolute transition-all duration-500 ease-in-out bg-transparent ring-[2000px] ring-slate-900/40 dark:ring-black/60 rounded-xl"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.4)'
        }}
      />

      {/* Tooltip Card */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-5 pointer-events-auto border border-indigo-100 dark:border-indigo-500/20"
        style={{
          top: pos.top,
          left: pos.left,
          width: cardWidth,
        }}
      >
        <button 
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
          title="Close Tour"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {step.content}
          </p>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Skip Tour
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Previous Step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            
            {currentStep < TOUR_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-100 dark:shadow-none"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-100 dark:shadow-none"
              >
                <span>Get Started</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pointer Arrow */}
        {step.position === 'right' && (
          <div 
            className="absolute border-8 border-transparent border-r-white dark:border-r-[var(--color-dark-surface)] -left-4" 
            style={{
              top: Math.max(20, Math.min(arrowTop, 140)),
              transform: 'translateY(-50%)'
            }}
          />
        )}
        {step.position === 'bottom' && (
          <div 
            className="absolute border-8 border-transparent border-b-white dark:border-b-[var(--color-dark-surface)] -top-4" 
            style={{
              left: Math.max(20, Math.min(arrowLeft, cardWidth - 20)),
              transform: 'translateX(-50%)'
            }}
          />
        )}
        {step.position === 'top' && (
          <div 
            className="absolute border-8 border-transparent border-t-white dark:border-t-[var(--color-dark-surface)] -bottom-4" 
            style={{
              left: Math.max(20, Math.min(arrowLeft, cardWidth - 20)),
              transform: 'translateX(-50%)'
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
