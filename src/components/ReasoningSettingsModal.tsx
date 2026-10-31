import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Calculator, 
  Binary, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  BookOpen, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkReasoningServerStatus, verifyMathExpression, ReasoningServerStatus } from '../services/reasoningService';
import { ReasoningStyle, MathVerificationItem } from '../types';
import { cn } from '../lib/utils';

interface ReasoningSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStyle: ReasoningStyle;
  onSelectStyle: (style: ReasoningStyle) => void;
}

const STYLES: { id: ReasoningStyle; label: string; desc: string; icon: any; color: string }[] = [
  {
    id: 'step-by-step',
    label: 'Step-by-Step Derivation',
    desc: 'Structured 9-step STEM breakdown with assumptions, formulas, and checks',
    icon: Sparkles,
    color: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    id: 'rigorous',
    label: 'Rigorous Formal Proof',
    desc: 'Pure mathematical rigor, theorem statements, lemmas, and symbolic verification',
    icon: Binary,
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'engineering',
    label: 'Electrical Engineering',
    desc: 'Circuits, Laplace transforms, power systems, machines, SI units & limits',
    icon: Zap,
    color: 'text-amber-500'
  },
  {
    id: 'exam',
    label: 'Competitive Exam Mode',
    desc: 'Concise high-yield solutions, critical formulas, shortcuts, and pitfall warnings',
    icon: Calculator,
    color: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    id: 'conceptual',
    label: 'Conceptual & Theory',
    desc: 'Deep physical and intuitive interpretation, edge cases, and analogies',
    icon: BookOpen,
    color: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'revision',
    label: 'High-Density Revision',
    desc: 'Compact formula cheat-sheets, key definitions, and rapid review points',
    icon: ShieldCheck,
    color: 'text-rose-600 dark:text-rose-400'
  }
];

export function ReasoningSettingsModal({
  isOpen,
  onClose,
  activeStyle,
  onSelectStyle
}: ReasoningSettingsModalProps) {
  const [status, setStatus] = useState<ReasoningServerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Interactive Verification Sandbox State
  const [sandboxExpr, setSandboxExpr] = useState('x^3 * sin(x)');
  const [sandboxOp, setSandboxOp] = useState<'diff' | 'simplify' | 'evaluate' | 'units'>('diff');
  const [sandboxUnit, setSandboxUnit] = useState('V');
  const [sandboxResult, setSandboxResult] = useState<MathVerificationItem | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await checkReasoningServerStatus();
      setStatus(res);
    } catch (e) {
      console.warn("Failed to check status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleTestVerify = async () => {
    if (!sandboxExpr.trim()) return;
    setVerifying(true);
    setSandboxResult(null);
    try {
      const res = await verifyMathExpression({
        operation: sandboxOp,
        expression: sandboxExpr,
        targetUnit: sandboxOp === 'units' ? sandboxUnit : undefined
      });
      setSandboxResult(res);
    } catch (e: any) {
      setSandboxResult({
        success: false,
        operation: sandboxOp,
        expression: sandboxExpr,
        verified: false,
        verificationType: 'unverified',
        details: e.message || 'Verification failed'
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#1E1E24] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-tight">
                Zinnia Advanced Reasoning & Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mathematics, Electrical Engineering & Symbolic Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Server Status Card */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    status?.connected ? "bg-emerald-400" : "bg-amber-400"
                  )} />
                  <span className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5",
                    status?.connected ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Reasoning Model Server Status
                </span>
              </div>
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
              >
                <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Engine / Provider</p>
                <p className="font-bold text-slate-800 dark:text-white truncate">
                  {status?.provider || 'Initializing...'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Configured Model</p>
                <p className="font-bold text-slate-800 dark:text-white truncate">
                  {status?.model || 'gemini-3.1-pro-preview'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5 leading-relaxed">
              {status?.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <span>{status?.message || 'Inspecting environment configuration...'}</span>
            </p>

            <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800">
              💡 Supports local/self-hosted <span className="font-semibold text-slate-700 dark:text-slate-300">Ollama</span> (<code className="text-indigo-600 dark:text-indigo-400">DeepSeek-R1-Distill-Qwen-7B</code>), <span className="font-semibold text-slate-700 dark:text-slate-300">vLLM</span> (<code className="text-indigo-600 dark:text-indigo-400">Phi-4-reasoning</code>, <code className="text-indigo-600 dark:text-indigo-400">QwQ-32B</code>), and <span className="font-semibold text-slate-700 dark:text-slate-300">Gemini Pro STEM</span> with native multivariable derivation.
            </div>
          </div>

          {/* Reasoning Style Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Reasoning & Solution Style
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STYLES.map((s) => {
                const isSelected = activeStyle === s.id;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectStyle(s.id)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all active:scale-[0.98] flex items-start gap-3",
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0", isSelected && "bg-white dark:bg-slate-800 shadow-sm")}>
                      <Icon className={cn("w-4 h-4", s.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                        {s.label}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Independent Verification Sandbox */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Independent Verification Sandbox
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                mathjs + SymPy Validated
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Test symbolic equation solving, exact differentiation, Simpson's numerical integration, or electrical unit conversion (e.g. <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">5 A * 10 ohm</code>):
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={sandboxOp}
                onChange={(e) => setSandboxOp(e.target.value as any)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
              >
                <option value="diff">Derivative (d/dx)</option>
                <option value="simplify">Symbolic Simplification</option>
                <option value="evaluate">Numerical Evaluation</option>
                <option value="units">SI Unit Conversion</option>
              </select>

              <input
                type="text"
                value={sandboxExpr}
                onChange={(e) => setSandboxExpr(e.target.value)}
                placeholder="Enter math expression or circuit units..."
                className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-white outline-none focus:border-indigo-500 font-mono"
              />

              {sandboxOp === 'units' && (
                <input
                  type="text"
                  value={sandboxUnit}
                  onChange={(e) => setSandboxUnit(e.target.value)}
                  placeholder="Target unit (e.g. V, kW)"
                  className="w-20 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-slate-800 dark:text-white font-mono"
                />
              )}

              <button
                onClick={handleTestVerify}
                disabled={verifying}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
              >
                {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                Verify
              </button>
            </div>

            {/* Sandbox Verification Result Display */}
            {sandboxResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-3 rounded-xl border text-xs space-y-1 font-mono",
                  sandboxResult.verified
                    ? "bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                    : "bg-red-50/70 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-200"
                )}
              >
                <div className="flex items-center justify-between font-sans">
                  <span className="font-bold flex items-center gap-1.5">
                    {sandboxResult.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    {sandboxResult.verificationType.toUpperCase()} VERIFIED
                  </span>
                  <span className="text-[10px] opacity-75">Engine Response</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  Result: {sandboxResult.symbolicResult || sandboxResult.numericResult || 'N/A'}
                </p>
                <p className="text-[11px] opacity-80 font-sans">{sandboxResult.details}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Selected Style: <strong className="text-slate-700 dark:text-slate-200">{STYLES.find(s => s.id === activeStyle)?.label}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-indigo-100 dark:shadow-none"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
