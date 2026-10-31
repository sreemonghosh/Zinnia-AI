import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import { ChatSession } from '../types';
import { motion } from 'motion/react';
import { Sparkles, Loader2, Cpu, Code2, BookOpen, BarChart3, CloudSun, Calculator, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

interface ChatViewProps {
  session: ChatSession | null;
  onSendMessage: (text: string, type?: 'text' | 'vision') => void;
  onDeleteMessage: (id: string) => void;
  onEditMessage: (id: string, content: string) => void;
  onRegenerate: () => void;
  loadingState: 'thinking' | 'researching' | null;
  selectedModel: string;
}

export function ChatView({ session, onSendMessage, onDeleteMessage, onEditMessage, onRegenerate, loadingState, selectedModel }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length, loadingState]);

  const getLoadingMessage = () => {
    if (selectedModel === 'zinnia-code-architect') {
      return "💻 Zinnia Code Architect is writing, analyzing & debugging code...";
    }
    if (selectedModel === 'zinnia-numeric-solver') {
      return "🔢 Zinnia Numerical Solver is computing exact values...";
    }
    if (selectedModel === 'zinnia-deep-math') {
      return "📐 Zinnia Deep Math is deriving step-by-step equations...";
    }
    if (loadingState === 'researching' || selectedModel === 'gemini-3.1-pro-preview') {
      return "🔍 Zinnia Pro is researching & analyzing...";
    }
    return "Zinnia is thinking...";
  };

  if (!session || session.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start pt-[8dvh] p-4 text-center overflow-y-auto custom-scrollbar">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Logo size="xl" className="mx-auto mb-6 scale-125" />
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter font-display italic">Zinnia</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-[260px] mx-auto leading-tight font-medium">
              "What problem can we solve today?"
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-[600px] mx-auto mt-4 px-4 text-left">
            {[
              { 
                title: "💻 Code Architect", 
                desc: "Generate complete, runnable programs", 
                fullPrompt: "Create a complete, runnable Python script that implements an event-driven task scheduler with priority queue and graceful shutdown handling.",
                icon: Code2,
                color: "text-emerald-500",
                bg: "bg-emerald-50"
              },
              { 
                title: "⚡ DSA & Big-O", 
                desc: "Algorithms, complexity & tests", 
                fullPrompt: "Implement an LRU Cache in TypeScript with O(1) get and put time complexity. Provide thorough unit test cases and space-time complexity analysis.",
                icon: Cpu,
                color: "text-indigo-500",
                bg: "bg-indigo-50"
              },
              { 
                title: "🔢 Numerical Solver", 
                desc: "Exact calculations & physics formulas", 
                fullPrompt: "A 1500 kg vehicle accelerates uniformly from rest to 100 km/h in 4.2 seconds. Calculate the acceleration in m/s², the net average force in Newtons, and the total kinetic energy transferred in Joules.",
                icon: Calculator,
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              { 
                title: "📐 Deep Math & STEM", 
                desc: "Calculus, equations & derivations", 
                fullPrompt: "Find all roots and derive the step-by-step analytical solution for the polynomial: 2x³ - 5x² - 14x + 8 = 0.",
                icon: Cpu,
                color: "text-purple-500",
                bg: "bg-purple-50"
              },
              { 
                title: "🗄️ SQL & DB Architecture", 
                desc: "Indexes, migrations & query tuning", 
                fullPrompt: "Design an optimized PostgreSQL schema for an e-commerce order management system with composite indexes, foreign keys, and refund audit history.",
                icon: BarChart3,
                color: "text-cyan-500",
                bg: "bg-cyan-50"
              },
              { 
                title: "🌤️ Live Weather", 
                desc: "Real-time meteorological forecast", 
                fullPrompt: "What is the current weather forecast and temperature today?",
                icon: CloudSun,
                color: "text-amber-500",
                bg: "bg-amber-50"
              }
            ].map((card, i) => (
              <motion.button
                key={`starter-card-${card.title}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.05) }}
                onClick={() => onSendMessage(card.fullPrompt)}
                className="p-3 text-left bg-white dark:bg-dark-surface border border-slate-100 dark:border-dark-border rounded-2xl transition-all active:scale-[0.98] flex flex-col gap-2 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50/50 dark:hover:shadow-indigo-950/20 group"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 transition-colors leading-tight">{card.title}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight sm:leading-snug mt-1">{card.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-12 py-6 space-y-6 custom-scrollbar pb-32">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {session.messages.map((message, index) => (
          <MessageItem 
            key={`${session.id || 'sess'}-${message.id || index}-${index}`} 
            message={message} 
            onDelete={() => onDeleteMessage(message.id)} 
            onEdit={(content) => onEditMessage(message.id, content)}
            onRegenerate={!message.role.startsWith('user') && index === session.messages.length - 1 ? onRegenerate : undefined}
            onSendMessage={(text) => onSendMessage(text)}
          />
        ))}

        {loadingState && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 w-full"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[85%] lg:max-w-[70%]">
              <div className="px-5 py-3 rounded-2xl bg-white dark:bg-dark-surface border border-slate-100 dark:border-dark-border shadow-sm rounded-tl-none">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-200">{getLoadingMessage()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
