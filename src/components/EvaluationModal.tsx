import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X as CloseIcon, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  Terminal, 
  RotateCcw,
  Zap,
  Calculator,
  Binary,
  Layers,
  Sparkles
} from 'lucide-react';

interface BenchmarkTestResult {
  id: string;
  category: string;
  name: string;
  expected?: string;
  actual?: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

interface BenchmarkSuiteResponse {
  timestamp: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRatePercent: number;
  totalDurationMs: number;
  results: BenchmarkTestResult[];
}

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EvaluationModal({ isOpen, onClose }: EvaluationModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<BenchmarkSuiteResponse | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const runBenchmark = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/evaluation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Evaluation run error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data && !isRunning) {
      runBenchmark();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(data?.results.map(r => r.category) || []))];
  const filteredResults = data?.results.filter(r => activeCategory === 'all' || r.category === activeCategory) || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Zinnia Intelligence & Verification Benchmark
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 font-bold">
                    Section 14 Audit
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automated test suites measuring mathematical correctness, sandboxed code execution, and dimensional units.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="px-6 py-3.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/50 dark:border-dark-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pass Rate</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {data ? `${data.passRatePercent}%` : '--'}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tests</span>
              <p className="text-xl font-extrabold text-slate-800 dark:text-white">
                {data ? `${data.passedTests}/${data.totalTests}` : '--'}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Latency</span>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {data ? `${data.totalDurationMs}ms` : '--'}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution Sandbox</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                Isolated
              </p>
            </div>
          </div>

          {/* Filter Pills & Re-run Button */}
          <div className="px-6 py-2.5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all capitalize whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All Suites' : cat}
                </button>
              ))}
            </div>

            <button
              onClick={runBenchmark}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap shadow-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run Suite'}</span>
            </button>
          </div>

          {/* Test Results List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {isRunning && !data && (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-500">Executing verification tests in isolated environment...</p>
              </div>
            )}

            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {result.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {result.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {result.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.durationMs}ms
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        result.passed
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20'
                      }`}
                    >
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  {result.expected && (
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-sans">Expected:</span>
                      <p className="text-slate-700 dark:text-slate-300 font-bold">{result.expected}</p>
                    </div>
                  )}
                  {result.actual && (
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-sans">Actual:</span>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">{result.actual}</p>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {result.details}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Zinnia AI Verification Engine v2.0 • Deterministic Evaluation</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
