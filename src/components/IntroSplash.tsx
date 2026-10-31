import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Code2, 
  Calculator, 
  Volume2, 
  VolumeX, 
  Wifi, 
  Battery, 
  CheckCircle2 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { introAudio } from '../services/soundEffects';

export type PlatformType = 'windows' | 'android' | 'ios';

/**
 * Intelligent client OS detection helper.
 * Automatically identifies Windows, iOS, or Android without manual selection.
 */
export function detectClientPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'windows';

  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const platform = ((navigator as any).userAgentData?.platform || navigator.platform || '').toLowerCase();

  // 1. iOS detection: iPhone, iPad, iPod, or iPadOS desktop emulation (MacIntel + multi-touch)
  if (/iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }

  // 2. Android detection: 'android' in user-agent or platform
  if (/android/.test(ua) || platform.includes('android')) {
    return 'android';
  }

  // 3. Windows detection: 'windows', 'win32', 'win64' in user-agent or platform
  if (/windows|win32|win64/.test(ua) || platform.includes('win')) {
    return 'windows';
  }

  // 4. Default: Desktop screens (>= 900px) default to Windows, mobile screens default to Android
  if (window.innerWidth >= 900) {
    return 'windows';
  }
  return 'android';
}

/**
 * High-fidelity 16-petal blooming Zinnia AI flower logo component.
 * Uses pure SVG rotation so transforms are never overwritten by animation frameworks.
 */
function ZinniaLogoFlower({ size = 150, platform }: { size?: number; platform: PlatformType }) {
  const grad1Id = `zinnia-flower-grad1-${platform}`;
  const grad2Id = `zinnia-flower-grad2-${platform}`;
  const blurId = `zinnia-flower-blur-${platform}`;

  return (
    <div 
      className="relative flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Outer Multi-layered Radiant Glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600/40 via-purple-600/40 to-indigo-600/40 blur-2xl rounded-full pointer-events-none"
      />

      {/* Continuously Rotating 16-Petal Flower */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="w-full h-full relative z-10 flex items-center justify-center"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]"
        >
          <defs>
            <linearGradient id={grad1Id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="50%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id={grad2Id} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E879F9" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <filter id={blurId}>
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 8 Outer Petals (45 degree intervals) */}
          <g filter={`url(#${blurId})`}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <path
                key={`outer-${angle}`}
                d="M50 50 C50 50 66 18 50 7 C34 18 50 50 50 50"
                transform={`rotate(${angle} 50 50)`}
                fill={`url(#${grad1Id})`}
                opacity="0.8"
              />
            ))}
          </g>

          {/* 8 Inner Petals (offset by 22.5 degrees) */}
          <g>
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
              <path
                key={`inner-${angle}`}
                d="M50 50 C50 50 62 26 50 16 C38 26 50 50 50 50"
                transform={`rotate(${angle} 50 50)`}
                fill={`url(#${grad2Id})`}
                opacity="0.95"
              />
            ))}
          </g>

          {/* Luminous Center Core */}
          <circle cx="50" cy="50" r="7" fill="white" opacity="0.3" className="animate-pulse" />
          <circle cx="50" cy="50" r="4.5" fill="white" />
          <circle cx="50" cy="50" r="2.2" fill="#7C3AED" />
        </svg>
      </motion.div>
    </div>
  );
}

interface IntroSplashProps {
  onComplete: () => void;
  autoCloseDelayMs?: number;
}

export function IntroSplash({ onComplete, autoCloseDelayMs = 4500 }: IntroSplashProps) {
  // Automatically detect client OS: Windows, Android, or iOS
  const platform = useMemo(() => detectClientPlatform(), []);

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Zinnia Core...');
  const [isExiting, setIsExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(() => introAudio.isSoundMuted());

  useEffect(() => {
    // 1. Play futuristic launch sound
    introAudio.playIntroTheme();

    const handleFirstGesture = () => {
      introAudio.playIntroTheme();
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });

    // 2. Keyboard shortcut: Enter, Space, or Escape completes intro immediately
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 3. Progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 12) + 8;
        if (next > 100) return 100;

        if (next < 35) {
          setStatusText(
            platform === 'windows' 
              ? 'Initializing DirectX Compute & Windows Subsystem...' 
              : platform === 'ios'
              ? 'Initializing Apple Neural Engine & Metal Shaders...'
              : 'Initializing Android NPU & Material Pipeline...'
          );
        } else if (next < 75) {
          setStatusText('Loading STEM Solvers, Code Architect & Safety Guardrails...');
        } else {
          setStatusText('Zinnia AI Ready');
        }
        return next;
      });
    }, 120);

    // 4. Auto-advance timer
    const exitTimer = setTimeout(() => {
      handleComplete();
    }, autoCloseDelayMs);

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimer);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [autoCloseDelayMs, platform]);

  const handleComplete = () => {
    introAudio.playEnterChime();
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = introAudio.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      introAudio.playIntroTheme();
    }
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="intro-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(10px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#070709] text-white flex flex-col items-center justify-between p-3 sm:p-6 overflow-x-hidden overflow-y-auto select-none font-sans"
          style={{ minHeight: '100dvh' }}
        >
          {/* Ambient Lighting & Neon Aura */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.15, 0.28, 0.15],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[600px] max-h-[600px] bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent blur-[130px] rounded-full"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.12, 0.25, 0.12],
              }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-[15%] -right-[10%] w-[65vw] h-[65vw] max-w-[600px] max-h-[600px] bg-gradient-to-tl from-fuchsia-600/30 via-cyan-600/15 to-transparent blur-[130px] rounded-full"
            />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
          </div>

          {/* Top Universal Sound Control & Skip Indicator (No style bar, completely auto-detected) */}
          <div className="w-full max-w-5xl flex items-center justify-between relative z-30 mb-2 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                SYSTEM ONLINE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSound}
                className="px-3 py-1 rounded-full bg-white/[0.07] hover:bg-white/15 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer active:scale-95"
                title={isMuted ? "Unmute Intro Sound" : "Mute Intro Sound"}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>Sound On</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleComplete}
                className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                title="Skip intro and enter app"
              >
                Skip (Esc)
              </button>
            </div>
          </div>

          {/* Platform Specific Body Container */}
          <div className="flex-1 w-full max-w-5xl flex items-center justify-center relative z-20 my-auto py-2">
            {platform === 'windows' && (
              /* ==============================================================
                 1. WINDOWS 11 FLUENT DESIGN SYSTEM VIEW (No minimize/close buttons)
                 ============================================================== */
              <motion.div
                key="windows-fluent-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full bg-[#16161a]/95 border border-white/15 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden flex flex-col"
              >
                {/* Windows 11 Fluent Clean Header (No window minimize/maximize/close controls) */}
                <div className="h-11 bg-white/[0.03] border-b border-white/10 px-5 flex items-center justify-between select-none">
                  <div className="flex items-center gap-2.5">
                    {/* Windows 11 4-Squares Icon */}
                    <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                      <span className="bg-sky-400 rounded-[1px]" />
                      <span className="bg-sky-400 rounded-[1px]" />
                      <span className="bg-sky-400 rounded-[1px]" />
                      <span className="bg-sky-400 rounded-[1px]" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 tracking-tight font-sans">
                      Zinnia AI — Windows Workstation Edition
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      DirectX Compute • x64
                    </span>
                  </div>
                </div>

                {/* Windows 11 Desktop Interior: Landscape Dual-Column Grid */}
                <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Prominent 16-Petal Glowing Zinnia Flower Logo & Telemetry */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-white/[0.02] border border-white/5 rounded-xl backdrop-blur-md">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8 }}
                      className="relative my-4 flex items-center justify-center"
                    >
                      <ZinniaLogoFlower size={170} platform="windows" />
                    </motion.div>

                    <div className="mt-4 w-full bg-black/40 border border-white/5 rounded-lg p-3 text-left font-mono text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Architecture:</span>
                        <span className="text-sky-300 font-semibold">Windows 11 / WDDM 3.2</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Acceleration:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> DirectML Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Build:</span>
                        <span className="text-slate-300">22631.4317 (v3.8)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Windows Fluent Title, 2x2 Feature Grid, Progress & Action */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Windows 11 Fluent Workspace</span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-sans">
                        Zinnia <span className="text-sky-400">AI</span>
                      </h1>
                      <p className="text-sm md:text-base text-slate-300 mt-2 font-normal leading-relaxed">
                        Enterprise Problem-Solving, High-Precision STEM Solver, and Advanced Code Architecture platform.
                      </p>
                    </div>

                    {/* Fluent 2x2 Capability Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { icon: Calculator, title: 'Numerical & Symbolic Math', desc: 'Precision calculus & algebra' },
                        { icon: Code2, title: 'Code Architect Suite', desc: 'Full-stack engineering & AST' },
                        { icon: Cpu, title: '9-Step STEM Reasoning', desc: 'Chain-of-thought verification' },
                        { icon: ShieldCheck, title: 'AI Safety Grounding', desc: 'Real-time safety auditing' }
                      ].map((card, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all flex items-start gap-3 group"
                        >
                          <div className="p-2 rounded-md bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                            <card.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-white">{card.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{card.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Windows 11 Progress Bar & Launch Controls */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                          <span className="truncate">{statusText}</span>
                        </span>
                        <span className="text-sky-400 font-bold">{progress}%</span>
                      </div>

                      {/* Fluent Accent Progress Bar */}
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <motion.div
                          className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                          initial={{ width: '0%' }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>

                      {/* Fluent Action Button */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-slate-200 border border-white/10">Enter ↵</kbd> or click to open
                        </span>

                        <button
                          type="button"
                          onClick={handleComplete}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 transition-all border border-sky-400/30 group cursor-pointer"
                        >
                          <span>Launch Zinnia Workstation</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Windows 11 Taskbar Status Footer */}
                <div className="h-8 bg-black/60 border-t border-white/5 px-4 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                  <span>Windows 11 Fluent Engine • Ready</span>
                  <span>DirectX Accelerated UI</span>
                </div>
              </motion.div>
            )}

            {platform === 'ios' && (
              /* ==============================================================
                 2. APPLE iOS HIG & DYNAMIC ISLAND GLASSMORPHIC VIEW
                 ============================================================== */
              <motion.div
                key="ios-apple-view"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-md bg-neutral-900/75 border border-white/20 rounded-[44px] shadow-[0_30px_90px_rgba(0,0,0,0.9)] backdrop-blur-3xl overflow-hidden p-6 sm:p-7 flex flex-col justify-between relative"
                style={{ minHeight: '620px' }}
              >
                {/* iOS Top Status Bar + Dynamic Island */}
                <div className="w-full flex flex-col items-center gap-2 mb-4">
                  <div className="w-full flex items-center justify-between px-2 text-xs font-semibold tracking-tight text-white">
                    {/* Time */}
                    <span>9:41</span>

                    {/* Dynamic Island Pill */}
                    <div className="px-3.5 py-1.5 bg-black rounded-full flex items-center gap-2 border border-white/10 shadow-inner">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-[10px] font-medium text-slate-200">Zinnia AI</span>
                      <div className="flex items-center gap-0.5">
                        <span className="w-0.5 h-2 bg-purple-400 rounded-full animate-bounce" />
                        <span className="w-0.5 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <span className="w-0.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>

                    {/* Battery & Network */}
                    <div className="flex items-center gap-1.5 text-white">
                      <span className="text-[10px] font-bold">5G</span>
                      <Wifi className="w-3.5 h-3.5" />
                      <div className="flex items-center gap-0.5 px-1 py-0.5 border border-white/40 rounded-sm">
                        <div className="w-3.5 h-1.5 bg-white rounded-[1px]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* iOS Center Visual: Apple Squircle & Full 16-Petal Logo */}
                <div className="flex flex-col items-center text-center my-auto py-2">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 14 }}
                    className="p-5 rounded-[32px] bg-white/[0.06] border border-white/15 shadow-2xl backdrop-blur-2xl mb-5 flex items-center justify-center"
                  >
                    <ZinniaLogoFlower size={140} platform="ios" />
                  </motion.div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
                    Zinnia <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-300 font-normal mt-1 tracking-tight max-w-xs">
                    Human-grade intelligence tailored for iOS and iPadOS.
                  </p>

                  {/* iOS Frosted Glass Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5 max-w-xs">
                    {[
                      '9-Step STEM Solver',
                      'Code Architect',
                      'Deep Math Engine',
                      'Real-time Safety'
                    ].map((badge, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-medium text-white backdrop-blur-xl shadow-xs"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* iOS Bottom Loading & Cupertino Action */}
                <div className="w-full space-y-4 pt-4">
                  {/* Status & Progress */}
                  <div className="flex items-center justify-between text-xs text-neutral-300 font-medium px-1">
                    <span className="truncate text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
                      <span className="truncate">{statusText}</span>
                    </span>
                    <span className="text-purple-300 font-bold ml-2 shrink-0">{progress}%</span>
                  </div>

                  {/* iOS Continuous Glass Progress Bar */}
                  <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-md">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>

                  {/* Cupertino Capsule Action Button */}
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="w-full py-3.5 px-6 rounded-full bg-white text-neutral-900 font-bold text-sm shadow-xl hover:bg-neutral-100 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Open Zinnia AI</span>
                    <ArrowRight className="w-4 h-4 text-neutral-900 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* iOS Bottom Home Indicator Bar */}
                  <div className="pt-2">
                    <div className="w-36 h-1 bg-white/60 rounded-full mx-auto" />
                  </div>
                </div>
              </motion.div>
            )}

            {platform === 'android' && (
              /* ==============================================================
                 3. ANDROID MATERIAL 3 / MATERIAL YOU VIEW
                 ============================================================== */
              <motion.div
                key="android-material-view"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-md bg-[#1c1a24] border border-purple-500/20 rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden p-6 sm:p-7 flex flex-col justify-between relative"
                style={{ minHeight: '620px' }}
              >
                {/* Android Status Bar */}
                <div className="w-full flex items-center justify-between text-xs text-slate-300 font-sans mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">12:00</span>
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-[10px] font-mono">LTE</span>
                    <Wifi className="w-3.5 h-3.5" />
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <span>100%</span>
                      <Battery className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Android Material You Center: Tonal Surface & Full 16-Petal Logo */}
                <div className="flex flex-col items-center text-center my-auto py-2">
                  <motion.div
                    initial={{ scale: 0.6, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="relative mb-5 flex items-center justify-center"
                  >
                    <ZinniaLogoFlower size={150} platform="android" />
                  </motion.div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2e293a] text-purple-300 text-xs font-medium mb-2 border border-purple-400/20">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Material You • v3.8</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Zinnia <span className="text-emerald-400">AI</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs font-normal">
                    Adaptive Intelligence & Reasoning for Android.
                  </p>

                  {/* Material 3 Expressive Tonal Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-xs">
                    {[
                      { icon: Calculator, label: 'Deep Math' },
                      { icon: Code2, label: 'Code Architect' },
                      { icon: Cpu, label: 'STEM Reasoning' },
                      { icon: ShieldCheck, label: 'Safe Grounding' }
                    ].map((chip, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#2e293a] hover:bg-[#393447] text-slate-200 text-xs font-medium border border-purple-400/10 shadow-xs"
                      >
                        <chip.icon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{chip.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Android Material 3 Progress & Filled Tonal Button */}
                <div className="w-full space-y-4 pt-4">
                  {/* Status & Percent */}
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                    <span className="truncate text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="truncate">{statusText}</span>
                    </span>
                    <span className="text-emerald-400 font-bold shrink-0">{progress}%</span>
                  </div>

                  {/* M3 LinearProgressIndicator */}
                  <div className="w-full h-2 bg-[#2e293a] rounded-full overflow-hidden p-0.5 border border-purple-400/20">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-400 via-indigo-400 to-emerald-400 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>

                  {/* Material 3 Filled Tonal Button */}
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Android Bottom Gesture Navigation Pill */}
                  <div className="pt-2">
                    <div className="w-24 h-1 bg-white/40 rounded-full mx-auto" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Footer Details */}
          <div className="w-full max-w-5xl flex items-center justify-between text-[11px] text-slate-500 relative z-10 px-2 mt-2">
            <span>Zinnia AI Intelligence Platform</span>
            <span className="font-mono">Auto-Configured for {platform === 'windows' ? 'Windows' : platform === 'ios' ? 'Apple iOS' : 'Android'}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
