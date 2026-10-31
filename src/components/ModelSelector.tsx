import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Cpu, Zap, Activity, Info, Check, Sparkles, Calculator, Binary, Code2 } from 'lucide-react';
import { AIModel } from '../types';
import { cn } from '../lib/utils';

const MODELS = [
  {
    id: 'gemini-3-flash-preview' as AIModel,
    name: 'Zinnia 1.0 Flash',
    desc: 'Fast everyday conversational intelligence & visual analysis',
    badge: 'GENERAL',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  },
  {
    id: 'zinnia-code-architect' as AIModel,
    name: 'Zinnia Code Architect',
    desc: 'Full-stack code generation, debugging, DSA algorithms, optimization & architecture',
    badge: 'CODING',
    icon: Code2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50'
  },
  {
    id: 'zinnia-numeric-solver' as AIModel,
    name: 'Zinnia Numerical Solver',
    desc: 'Precision arithmetic, physical equations, unit conversions & exact numerical answers',
    badge: 'NUMERICAL',
    icon: Calculator,
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  {
    id: 'zinnia-deep-math' as AIModel,
    name: 'Zinnia Deep Math & STEM',
    desc: 'Multi-step calculus, algebraic equations, physics proofs & step verification',
    badge: 'MATH / STEM',
    icon: Binary,
    color: 'text-purple-500',
    bg: 'bg-purple-50'
  },
  {
    id: 'gemini-3.1-pro-preview' as AIModel,
    name: 'Zinnia 1.0 Pro',
    desc: 'Deep reasoning, live web research & STEM analysis',
    badge: 'PRO',
    icon: Cpu,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    id: 'gemini-3.1-flash-lite-preview' as AIModel,
    name: 'Zinnia 1.0 Lite',
    desc: 'Ultra-lightweight, efficient & dependable assistant',
    badge: 'LITE',
    icon: Activity,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50'
  }
];

interface ModelSelectorProps {
  selectedModel: AIModel;
  onSelect: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
      >
        <selected.icon className={cn("w-3 h-3", selected.color)} />
        <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">{selected.name}</span>
        <ChevronDown className={cn("w-2.5 h-2.5 text-slate-400 dark:text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="model-selector-menu"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-1.5 right-0 w-[280px] bg-white dark:bg-[#2A2A2F] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden p-2"
          >
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id as AIModel);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 p-2.5 rounded-xl transition-all text-left group",
                    selectedModel === model.id 
                      ? "bg-indigo-50/50 dark:bg-indigo-500/10" 
                      : "hover:bg-slate-50 dark:hover:bg-white/5"
                  )}
                >
                  <div className={cn("w-8 h-8 shrink-0 rounded-lg flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform", 
                    model.bg,
                    "dark:bg-slate-800/50"
                  )}>
                    <model.icon className={cn("w-full h-full", model.color)} />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <p className={cn("text-xs font-bold leading-tight", 
                        selectedModel === model.id 
                          ? "text-indigo-900 dark:text-indigo-400" 
                          : "text-slate-900 dark:text-slate-200"
                      )}>
                        {model.name}
                      </p>
                      {model.badge && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/50">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-snug">
                      {model.desc}
                    </p>
                  </div>
                  <div className="shrink-0 pt-1">
                    {selectedModel === model.id ? (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors" />
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
