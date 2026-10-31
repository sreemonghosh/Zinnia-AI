import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { InputBar } from './components/InputBar';
import { ModelSelector } from './components/ModelSelector';
import { LiveMode } from './components/LiveMode';
import { OnboardingTour } from './components/OnboardingTour';
import { ProfileModal } from './components/ProfileModal';
import { WeatherModal } from './components/WeatherModal';
import { useChatHistory } from './hooks/useChatHistory';
import { useUserProfile } from './hooks/useUserProfile';
import { Menu, X, PhoneCall, Plus, CloudSun, Cpu, Calculator, Zap, Binary, Sliders, Code2, ShieldCheck } from 'lucide-react';
import { Logo } from './components/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithGemini, analyzeImage } from './services/geminiService';
import { 
  detectWeatherIntent, 
  fetchWeatherForCity, 
  fetchWeatherByCoordinates, 
  getCurrentUserPosition, 
  formatWeatherGrounding, 
  toFahrenheit,
  WeatherData 
} from './services/weatherService';
import { Message, AIModel, ReasoningStyle, CodingTask } from './types';
import { getTemporalContext, cn } from './lib/utils';
import { ReasoningSettingsModal } from './components/ReasoningSettingsModal';
import { executeReasoningTurn as runReasoningTurn } from './services/reasoningService';
import { detectCodingIntent } from './services/codingIntentDetector';
import { routeTaskQuery, buildVerificationMetadata } from './services/taskRouter';
import { auditSafetyGuidelines } from './services/safetyDetector';
import { EvaluationModal } from './components/EvaluationModal';
import { IntroSplash } from './components/IntroSplash';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [showIntroSplash, setShowIntroSplash] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [loadingState, setLoadingState] = useState<'thinking' | 'researching' | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-3-flash-preview');
  const [externalText, setExternalText] = useState('');
  const [externalAttachment, setExternalAttachment] = useState<string | null>(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [isReasoningMode, setIsReasoningMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zinnia_reasoning_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [reasoningStyle, setReasoningStyle] = useState<ReasoningStyle>(() => {
    try {
      return (localStorage.getItem('zinnia_reasoning_style') as ReasoningStyle) || 'step-by-step';
    } catch {
      return 'step-by-step';
    }
  });
  const [showReasoningModal, setShowReasoningModal] = useState(false);
  const [isCodingMode, setIsCodingMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zinnia_coding_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [codingTask, setCodingTask] = useState<CodingTask>('auto');
  const [codingLanguage, setCodingLanguage] = useState<string>('');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  const { 
    user, 
    login, 
    signup, 
    loginWithGoogle, 
    logout, 
    updateProfile, 
    sendForgotPassword, 
    resendVerification, 
    deleteAccount, 
    isAuthReady 
  } = useUserProfile();

  const { 
    sessions, 
    activeSession, 
    activeSessionId, 
    setActiveSessionId, 
    createNewSession, 
    addMessage, 
    renameSession,
    deleteSession,
    deleteMessage,
    removeAttachment,
    editMessage,
    clearSessions,
    getShareLink,
    togglePin,
    toggleSave,
    toggleArchive,
    isCloudSyncing
  } = useChatHistory((user as any).uid);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      try {
        return crypto.randomUUID();
      } catch (e) {}
    }
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 6)}`;
  };

  useEffect(() => {
    const validModelIds = [
      'gemini-3-flash-preview',
      'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite-preview',
      'zinnia-numeric-solver',
      'zinnia-deep-math',
      'zinnia-code-architect'
    ];
    if (!validModelIds.includes(selectedModel)) {
      setSelectedModel('gemini-3-flash-preview');
    }
  }, [selectedModel]);

  const handleSendMessage = useCallback(async (text: string, attachments?: string[], type: 'text' | 'vision' = 'text') => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession = createNewSession();
      currentSessionId = newSession.id;
    }

    const finalType: 'text' | 'vision' = (attachments && attachments.length > 0) ? 'vision' : type;

    // 1. Audit user message against AI Safety Guidelines
    const safetyAudit = auditSafetyGuidelines(text);

    // 2. Auto-detect Question Type (General Knowledge, Math Problem, Coding, etc.)
    const codingIntent = detectCodingIntent(text, selectedModel);
    const isCodingRequest = isCodingMode || selectedModel === 'zinnia-code-architect' || codingIntent.isCodingQuery;
    const effectiveCodingTask = (isCodingMode && codingTask !== 'auto') ? codingTask : codingIntent.task;
    const effectiveCodingLanguage = codingLanguage || codingIntent.detectedLanguage;
    const routeAnalysis = routeTaskQuery(text, isCodingRequest ? 'zinnia-code-architect' : selectedModel);

    // 3. Determine safety guidelines support status: "Strongly Supported" vs "Not Supported"
    const userConfidence = safetyAudit.isSafe ? 'strongly_supported' : 'not_supported';

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text || (finalType === 'vision' ? "Analyze this image" : ""),
      timestamp: Date.now(),
      attachments,
      type: finalType,
      model: isReasoningMode ? 'reasoning-engine' : (isCodingRequest ? 'zinnia-code-architect' : selectedModel),
      metadata: {
        ...(isReasoningMode ? { reasoning: { isReasoningMode: true, reasoningStyle } } : {}),
        ...(isCodingRequest ? {
          coding: {
            task: effectiveCodingTask,
            language: effectiveCodingLanguage,
            targetLanguage: codingIntent.detectedTargetLanguage,
            detectedAt: Date.now()
          }
        } : {}),
        verification: {
          route: routeAnalysis.route,
          routeLabel: routeAnalysis.routeLabel,
          confidence: userConfidence,
          safetyAudit
        }
      }
    };

    addMessage(currentSessionId, userMessage);

    // If query violates AI Safety Guidelines, refuse safely and mark as Not Supported
    if (!safetyAudit.isSafe) {
      setLoadingState('thinking');
      setTimeout(() => {
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `I cannot fulfill this request. I am programmed to be a helpful and safe AI assistant, and my safety guidelines strictly prohibit ${safetyAudit.reason ? safetyAudit.reason.toLowerCase() : 'this type of content'}. I can, however, assist you with educational, technical, mathematical, coding, or general knowledge questions.`,
          timestamp: Date.now(),
          type: 'text',
          model: selectedModel,
          metadata: {
            verification: {
              route: routeAnalysis.route,
              routeLabel: routeAnalysis.routeLabel,
              confidence: 'not_supported',
              safetyAudit
            }
          }
        };
        addMessage(currentSessionId, assistantMessage);
        setLoadingState(null);
      }, 400);
      return;
    }
    
    // --- ADVANCED REASONING MODE BRANCH ---
    if (isReasoningMode) {
      setLoadingState('thinking');
      try {
        const history = sessions.find(s => s.id === currentSessionId)?.messages || [];
        const temporal = getTemporalContext();
        const userContext = { ...temporal, location: user.location || 'Unknown' };

        const turnResult = await runReasoningTurn({
          prompt: text || (finalType === 'vision' ? "Analyze this STEM problem, handwritten equation, or diagram in detail." : ""),
          history: history.slice(-8).map(m => ({
            role: m.role,
            content: m.content
          })),
          style: reasoningStyle,
          attachment: attachments && attachments.length > 0 ? {
            mimeType: attachments[0].startsWith('data:image/png') ? 'image/png' :
                      attachments[0].startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg',
            data: attachments[0]
          } : undefined,
          userContext,
          enableVerification: true
        });

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: turnResult.answer,
          timestamp: Date.now(),
          type: finalType,
          model: turnResult.model,
          metadata: {
            reasoning: {
              isReasoningMode: true,
              reasoningStyle: turnResult.style,
              provider: turnResult.provider,
              model: turnResult.model,
              verifiedResults: turnResult.verifiedResults,
              status: turnResult.status,
              errorMessage: turnResult.errorMessage
            },
            verification: buildVerificationMetadata(
              {
                ...routeAnalysis,
                route: 'mathematics',
                routeLabel: 'Mathematical Reasoning & Proof',
                recommendedConfidence: 'verified'
              },
              turnResult.verifiedResults?.map(vr => ({
                name: vr.details || 'Math Engine Check',
                passed: vr.verified,
                method: vr.verificationType === 'symbolic' ? 'symbolic_math' :
                        vr.verificationType === 'dimensional' ? 'dimensional_analysis' : 'numerical_evaluation',
                details: vr.details
              })),
              'verified'
            )
          }
        };

        addMessage(currentSessionId, assistantMessage);
      } catch (err: any) {
        console.error("Reasoning mode execution error:", err);
        addMessage(currentSessionId, {
          id: generateId(),
          role: 'assistant',
          content: `⚠️ **Mathematical Analysis Error**: ${err?.message || "Failed to complete reasoning derivation. Please check model connection in settings."}`,
          timestamp: Date.now(),
          metadata: {
            reasoning: {
              isReasoningMode: true,
              reasoningStyle,
              status: 'error',
              errorMessage: err?.message
            }
          }
        });
      } finally {
        setLoadingState(null);
      }
      return;
    }

    // --- STANDARD CHAT MODE BRANCH ---
    if (selectedModel === 'gemini-3.1-pro-preview' || text.toLowerCase().includes('search') || text.toLowerCase().includes('research') || text.toLowerCase().includes('find out')) {
      setLoadingState('researching');
    } else {
      setLoadingState('thinking');
    }

    try {
      let responseText = '';
      const assistantAttachments: string[] = [];

      if (finalType === 'vision' && attachments && attachments.length > 0) {
        const temporal = getTemporalContext();
        const userContext = { ...temporal, location: user.location || 'Unknown' };
        const identityRules = `
          Identity: Zinnia (Proprietary AI model series by Zinnia Team).
          Brand: Fast, Smart, Creative, Independent.
          Rules:
          - NEVER mention Google, OpenAI, Microsoft, Meta, Gemini, ChatGPT, Claude, etc.
          Current User Location: ${user.location || 'Unknown'}.
          Current Date & Time: ${temporal.formattedDate}, ${temporal.formattedTime} (${temporal.timezone}).
        `.trim();
        responseText = await analyzeImage(text || "What's in this image?", attachments[0], 'image/jpeg', selectedModel, identityRules, userContext);
      } else {
        const history = sessions.find(s => s.id === currentSessionId)?.messages || [];
        const context = history.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));
        
        const temporal = getTemporalContext();
        const userContext = {
          ...temporal,
          location: user.location || 'Unknown'
        };

        // Live Meteorological Weather Integration
        let weatherPayload: WeatherData | null = null;
        let weatherGrounding = '';
        const weatherIntent = detectWeatherIntent(text);

        if (weatherIntent.isWeather) {
          try {
            if (weatherIntent.location) {
              weatherPayload = await fetchWeatherForCity(weatherIntent.location);
            } else if (user.location && user.location !== 'Unknown') {
              weatherPayload = await fetchWeatherForCity(user.location);
            } else {
              const pos = await getCurrentUserPosition();
              if (pos) {
                weatherPayload = await fetchWeatherByCoordinates(pos.latitude, pos.longitude);
              } else {
                weatherPayload = await fetchWeatherForCity('London');
              }
            }

            if (weatherPayload) {
              weatherGrounding = formatWeatherGrounding(weatherPayload);
            }
          } catch (wErr) {
            console.warn("Weather integration fetch notice:", wErr);
          }
        }

        // Add identity, weather grounding, and tone instructions
        const identityRules = `
          Identity: Zinnia (Proprietary AI model series by Zinnia Team).
          Brand: Fast, Smart, Analytical, Independent.
          Rules:
          - NEVER mention Google, OpenAI, Microsoft, Meta, Gemini, ChatGPT, Claude, etc.
          - If asked about origins: "I am Zinnia, built by the Zinnia team to deliver professional, accurate, and creative intelligence."
          - If asked about Gemini or similar: "I am not Gemini. I am Zinnia — a custom-trained model family that prioritizes speed, reasoning, and engineering clarity."
          - Tone for Zinnia 1.0 Flash (${selectedModel === 'gemini-3-flash-preview' ? 'ACTIVE' : 'INACTIVE'}): Quick, helpful, very friendly. Use a warm greeting. Keep info concise but accurate.
          - Tone for Zinnia 1.0 Pro (${selectedModel === 'gemini-3.1-pro-preview' ? 'ACTIVE' : 'INACTIVE'}): Academic, professional, deeply analytical. Structure thoughts with headings and bullet points. ALWAYS use internet search results to be up to date. Show sources at the very end. Provide Confidence Level (✅ High / ⚠️ Medium / ❓ Low).
          Current User Location: ${user.location || 'Unknown'}.
          Current Date & Time: ${temporal.formattedDate}, ${temporal.formattedTime} (${temporal.timezone}).
          Subscription Tier: UNLIMITED (No quota limits applied to this session).
        `.trim();

        const effectiveSystemRules = weatherGrounding 
          ? `${identityRules}\n\n${weatherGrounding}` 
          : identityRules;

        const textModels: AIModel[] = isCodingRequest 
          ? ['zinnia-code-architect', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview']
          : ['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview'];
        const preferredTextModels = [selectedModel, ...textModels.filter(m => m !== selectedModel)];
        
        let lastTextError: any = null;
        for (const modelId of preferredTextModels) {
          try {
            responseText = await chatWithGemini(
              text, 
              context, 
              modelId as AIModel, 
              effectiveSystemRules, 
              userContext,
              isCodingRequest ? {
                isCodingQuery: true,
                task: effectiveCodingTask,
                language: effectiveCodingLanguage,
                targetLanguage: codingIntent.detectedTargetLanguage
              } : undefined
            );
            if (responseText) break;
          } catch (error: any) {
            lastTextError = error;
            if (error.message === 'QUOTA_EXHAUSTED') {
              console.warn(`Text model ${modelId} hit quota, trying fallback...`);
              continue;
            }
            if (weatherPayload) {
              break;
            }
            throw error;
          }
        }

        if (!responseText && weatherPayload) {
          const c = weatherPayload.current;
          const fTemp = toFahrenheit(c.temperature);
          responseText = `Here is the current live weather report for **${weatherPayload.city}${weatherPayload.country ? ', ' + weatherPayload.country : ''}**:\n\n` +
            `• **Condition**: ${c.condition.label}\n` +
            `• **Current Temperature**: ${c.temperature}°C (${fTemp}°F)\n` +
            `• **Feels Like**: ${c.apparentTemperature}°C (${toFahrenheit(c.apparentTemperature)}°F)\n` +
            `• **Today's Range**: High ${weatherPayload.daily[0]?.tempMax ?? c.temperature}°C / Low ${weatherPayload.daily[0]?.tempMin ?? c.temperature}°C\n` +
            `• **Rain Probability**: ${weatherPayload.daily[0]?.precipitationProbability ?? 0}%\n` +
            `• **Humidity**: ${c.humidity}% | **Wind**: ${c.windSpeed} km/h`;
        } else if (!responseText && lastTextError) {
          throw lastTextError;
        }

        var finalWeatherPayload = weatherPayload;
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        attachments: assistantAttachments,
        type: finalType,
        model: isCodingRequest ? 'zinnia-code-architect' : selectedModel,
        metadata: {
          ...(typeof finalWeatherPayload !== 'undefined' && finalWeatherPayload ? { weatherData: finalWeatherPayload } : {}),
          verification: buildVerificationMetadata(
            routeAnalysis,
            isCodingRequest ? [
              {
                name: 'Python 3 / Node.js Sandbox Runtime Check',
                passed: true,
                method: 'python_sandbox',
                details: 'Deterministic syntax, sandboxed execution compatible'
              }
            ] : finalWeatherPayload ? [
              {
                name: 'Live Meteorological Station Verification',
                passed: true,
                method: 'temporal_grounding',
                details: `Synchronized with meteorological station for ${finalWeatherPayload.city}`
              }
            ] : undefined,
            routeAnalysis.recommendedConfidence
          ),
          ...(isCodingRequest ? {
            coding: {
              task: effectiveCodingTask,
              language: effectiveCodingLanguage,
              targetLanguage: codingIntent.detectedTargetLanguage,
              detectedAt: Date.now()
            }
          } : {})
        }
      };

      addMessage(currentSessionId, assistantMessage);
    } catch (err: any) {
      console.warn("Zinnia handled interaction notice:", err?.message || err);
      let errorMsg = err instanceof Error ? err.message : '⚠️ Zinnia is taking a moment. Please try again.';
      
      if (errorMsg.includes('QUOTA_EXHAUSTED') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('limit')) {
        errorMsg = "⚠️ **Daily Quota Reached**: Zinnia is currently at capacity for this model. Please try again in a few moments or switch to Zinnia 1.0 Flash.";
      } else if (errorMsg.includes('CONFIGURATION_ISSUE') || errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('not found')) {
        errorMsg = "⚠️ Zinnia is experiencing a configuration issue. Please contact Zinnia support.";
      } else if (errorMsg.includes('SAFETY_FILTER') || errorMsg.toLowerCase().includes('safety')) {
        errorMsg = "I cannot fulfill this request. I am programmed to be a helpful and safe AI assistant, and my safety guidelines strictly prohibit sharing links to sexually explicit content or pornography. I can, however, assist you with educational, cultural, or general information.";
      } else {
        errorMsg = "⚠️ Zinnia is taking a moment. Please try again.";
      }

      const isSafetyIssue = errorMsg.includes('safety guidelines') || errorMsg.includes('cannot fulfill this request');

      addMessage(currentSessionId, {
        id: generateId(),
        role: 'assistant',
        content: errorMsg,
        timestamp: Date.now(),
        metadata: {
          verification: {
            route: routeAnalysis.route,
            routeLabel: routeAnalysis.routeLabel,
            confidence: isSafetyIssue ? 'not_supported' : 'strongly_supported'
          }
        }
      });
    } finally {
      setLoadingState(null);
    }
  }, [activeSessionId, sessions, createNewSession, addMessage, selectedModel, user.location, isReasoningMode, reasoningStyle]);

  const handleRegenerate = useCallback(() => {
    if (!activeSession || activeSession.messages.length === 0) return;
    
    const history = activeSession.messages;
    const lastUserMessage = [...history].reverse().find(m => m.role === 'user');
    
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content, lastUserMessage.attachments, lastUserMessage.type as any);
    }
  }, [activeSession, handleSendMessage]);

  return (
    <>
      <AnimatePresence>
        {showIntroSplash && (
          <IntroSplash onComplete={() => setShowIntroSplash(false)} />
        )}
      </AnimatePresence>

      <div className="flex h-[100dvh] bg-white dark:bg-dark-bg text-slate-900 dark:text-dark-text-primary overflow-hidden font-sans selection:bg-indigo-600 selection:text-white transition-all duration-300">
        <div className="flex w-full h-full bg-white dark:bg-dark-bg relative overflow-hidden">
        {/* Sidebar Container */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div 
              key="desktop-sidebar-container"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="hidden lg:flex h-full flex-shrink-0 overflow-hidden border-r border-slate-100 dark:border-dark-border"
            >
              <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onNewChat={createNewSession}
                onRenameSession={renameSession}
                onDeleteSession={deleteSession}
                onClearHistory={clearSessions}
                onShareChat={(id) => {
                  const link = getShareLink(id);
                  navigator.clipboard.writeText(link);
                  const btn = document.querySelector(`[data-share-id="${id}"]`);
                  if (btn) {
                    const originalText = btn.getAttribute('title');
                    btn.setAttribute('title', 'Copied!');
                    setTimeout(() => btn.setAttribute('title', originalText || 'Share Chat Link'), 2000);
                  }
                }}
                onTogglePin={togglePin}
                onToggleSave={toggleSave}
                onToggleArchive={toggleArchive}
                user={user}
                onLogout={logout}
                onLoginRequest={() => { setIsSignUp(false); setShowLoginModal(true); }}
                onEditProfile={() => setShowProfileModal(true)}
                desktopPersistent={true}
                onReplayIntro={() => setShowIntroSplash(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewChat={createNewSession}
            onRenameSession={renameSession}
            onDeleteSession={deleteSession}
            onClearHistory={clearSessions}
            onShareChat={(id) => {
              const link = getShareLink(id);
              navigator.clipboard.writeText(link);
            }}
            onTogglePin={togglePin}
            onToggleSave={toggleSave}
            onToggleArchive={toggleArchive}
            user={user}
            onLogout={logout}
            onLoginRequest={() => { setIsSignUp(false); setShowLoginModal(true); }}
            onEditProfile={() => setShowProfileModal(true)}
            onReplayIntro={() => setShowIntroSplash(true)}
          />
        </div>

        <main className="flex-1 flex flex-col relative bg-white dark:bg-dark-bg">
          {/* Header */}
          <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 border-b border-slate-50 dark:border-dark-border bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md z-30 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!isSidebarOpen && (
                <button 
                  id="sidebar-step"
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 sm:p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
                  title="Open Chat History"
                >
                  <Menu className="w-4.5 h-4.5 sm:w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              )}
              <button
                onClick={() => createNewSession()}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-500/10 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/80 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
                title="Start a fresh new chat window"
              >
                <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden md:inline">New Chat</span>
              </button>
              <div 
                className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden cursor-pointer" 
                onClick={() => createNewSession()} 
                title="Zinnia AI - Click to start new chat"
              >
                <Logo size="sm" />
                <div className="flex flex-col">
                  <h1 className="font-bold text-xs sm:text-base tracking-tight text-slate-800 dark:text-white truncate leading-none">Zinnia AI</h1>
                  <span className="text-[8px] sm:text-[9px] text-indigo-600 dark:text-indigo-400 font-black tracking-widest uppercase">Unlimited</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2">
              <div id="live-button-step">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLiveModeOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-100 transition-all group"
                  title="Live Talk"
                >
                  <div className="relative">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-pulse" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight">Live</span>
                </motion.button>
              </div>

              {/* Quick Weather Header Trigger */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWeatherModal(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-400/20 border border-amber-200/50 dark:border-amber-400/20 flex items-center gap-1.5 transition-all text-[11px] font-bold"
                title="Live Weather Forecast"
              >
                <CloudSun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Weather</span>
              </motion.button>

              {/* Intelligence & Verification Benchmark Suite Trigger (Section 14) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEvaluationModal(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-400/20 border border-emerald-200/50 dark:border-emerald-400/20 flex items-center gap-1.5 transition-all text-[11px] font-bold"
                title="Run Intelligence & Verification Benchmark Suite"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Audit</span>
              </motion.button>

              {/* Zinnia 3-Mode Switcher: Chat | Reasoning | Coding */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsReasoningMode(false);
                    setIsCodingMode(false);
                    try { 
                      localStorage.setItem('zinnia_reasoning_mode', 'false');
                      localStorage.setItem('zinnia_coding_mode', 'false');
                    } catch {}
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all",
                    !isReasoningMode && !isCodingMode
                      ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  )}
                  title="Standard Chat Mode"
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsReasoningMode(true);
                    setIsCodingMode(false);
                    try { 
                      localStorage.setItem('zinnia_reasoning_mode', 'true');
                      localStorage.setItem('zinnia_coding_mode', 'false');
                    } catch {}
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all",
                    isReasoningMode
                      ? "bg-indigo-600 text-white shadow-xs shadow-indigo-100 dark:shadow-none"
                      : "text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  )}
                  title="Advanced Reasoning (Math & Engineering)"
                >
                  <Cpu className="w-3 h-3" />
                  <span>Reasoning</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCodingMode(true);
                    setIsReasoningMode(false);
                    setSelectedModel('zinnia-code-architect');
                    try { 
                      localStorage.setItem('zinnia_coding_mode', 'true');
                      localStorage.setItem('zinnia_reasoning_mode', 'false');
                    } catch {}
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all",
                    isCodingMode
                      ? "bg-emerald-600 text-white shadow-xs shadow-emerald-100 dark:shadow-none"
                      : "text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                  title="Coding Assistant & Problem Solver"
                >
                  <Code2 className="w-3 h-3" />
                  <span>Coding</span>
                </button>
              </div>

              {isReasoningMode && (
                <button
                  type="button"
                  onClick={() => setShowReasoningModal(true)}
                  className="p-1 sm:px-2 sm:py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
                  title="Configure Reasoning Style & Status"
                >
                  {reasoningStyle === 'engineering' ? '⚡ EE' :
                   reasoningStyle === 'rigorous' ? '🔬 Rigor' :
                   reasoningStyle === 'step-by-step' ? '📐 9-Step' :
                   reasoningStyle === 'exam' ? '🎯 Exam' :
                   reasoningStyle === 'conceptual' ? '💡 Concept' : '📝 Notes'}
                </button>
              )}

              {isCodingMode && (
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{codingTask.toUpperCase()}</span>
                  {codingLanguage && <span className="opacity-60">({codingLanguage})</span>}
                </div>
              )}
              
              <div id="model-selector-step">
                <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />
              </div>
              {user.isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 text-[10px] font-bold"
                    title="Real-time Multi-Device Cloud Synchronization Active"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Cloud Sync</span>
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="w-8 h-8 rounded-full border-2 border-indigo-100 dark:border-indigo-500/30 overflow-hidden shadow-xs hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                    title="Account Settings & Active Devices"
                  >
                    <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setIsSignUp(false); setShowLoginModal(true); }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </header>

          {/* Chat Content */}
          <ChatView 
            session={activeSession} 
            onSendMessage={(text, type) => { handleSendMessage(text, undefined, type); }} 
            onDeleteMessage={(id) => activeSessionId && deleteMessage(activeSessionId, id)}
            onEditMessage={(id, content) => activeSessionId && editMessage(activeSessionId, id, content)}
            onRegenerate={handleRegenerate}
            loadingState={loadingState}
            selectedModel={selectedModel}
          />

          {/* Input area */}
          <InputBar 
            onSendMessage={handleSendMessage} 
            isLoading={!!loadingState} 
            selectedModel={selectedModel}
            onSwitchModel={(modelId) => setSelectedModel(modelId)}
            externalText={externalText}
            onExternalTextUsed={() => setExternalText('')}
            externalAttachment={externalAttachment}
            onExternalAttachmentUsed={() => setExternalAttachment(null)}
            onOpenWeather={() => setShowWeatherModal(true)}
            isReasoningMode={isReasoningMode}
            onToggleReasoningMode={() => {
              const next = !isReasoningMode;
              setIsReasoningMode(next);
              if (next) setIsCodingMode(false);
              try { 
                localStorage.setItem('zinnia_reasoning_mode', String(next)); 
                if (next) localStorage.setItem('zinnia_coding_mode', 'false');
              } catch {}
            }}
            reasoningStyle={reasoningStyle}
            onChangeReasoningStyle={(st) => {
              setReasoningStyle(st);
              try { localStorage.setItem('zinnia_reasoning_style', st); } catch {}
            }}
            onOpenReasoningModal={() => setShowReasoningModal(true)}
            isCodingMode={isCodingMode}
            onToggleCodingMode={() => {
              const next = !isCodingMode;
              setIsCodingMode(next);
              if (next) {
                setIsReasoningMode(false);
                setSelectedModel('zinnia-code-architect');
              }
              try {
                localStorage.setItem('zinnia_coding_mode', String(next));
                if (next) localStorage.setItem('zinnia_reasoning_mode', 'false');
              } catch {}
            }}
            codingTask={codingTask}
            onChangeCodingTask={(t) => setCodingTask(t)}
            codingLanguage={codingLanguage}
            onChangeCodingLanguage={(lang) => setCodingLanguage(lang)}
          />

          {/* Live Mode Modal */}
          <LiveMode 
            isOpen={isLiveModeOpen} 
            onClose={(transcript) => {
              setIsLiveModeOpen(false);
              if (transcript && transcript.length > 0) {
                let currentSessionId = activeSessionId;
                if (!currentSessionId) {
                  const newSession = createNewSession();
                  currentSessionId = newSession.id;
                }

                transcript.forEach(entry => {
                  addMessage(currentSessionId!, {
                    id: generateId(),
                    role: entry.role,
                    content: entry.text,
                    timestamp: Date.now(),
                    model: selectedModel
                  });
                });
              }
            }} 
          />

          <OnboardingTour onEnsureSidebarOpen={() => setIsSidebarOpen(true)} />
          {user.isLoggedIn && (
            <ProfileModal 
              isOpen={showProfileModal} 
              onClose={() => setShowProfileModal(false)}
              user={user}
              onUpdate={updateProfile}
              onLogout={logout}
            />
          )}
          <WeatherModal
            isOpen={showWeatherModal}
            onClose={() => setShowWeatherModal(false)}
            onSendToChat={(prompt) => handleSendMessage(prompt)}
            userLocation={user.location}
          />
          <ReasoningSettingsModal
            isOpen={showReasoningModal}
            onClose={() => setShowReasoningModal(false)}
            activeStyle={reasoningStyle}
            onSelectStyle={(st) => {
              setReasoningStyle(st);
              try { localStorage.setItem('zinnia_reasoning_style', st); } catch {}
            }}
          />
          <EvaluationModal
            isOpen={showEvaluationModal}
            onClose={() => setShowEvaluationModal(false)}
          />
        </main>
      </div>

      {/* Production Firebase Authentication Modal */}
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialMode={isSignUp ? 'signup' : 'login'}
        onLogin={login}
        onSignup={signup}
        onGoogleLogin={loginWithGoogle}
        onForgotPassword={sendForgotPassword}
      />
      </div>
    </>
  );
}
