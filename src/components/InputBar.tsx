import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Camera, 
  Image as ImageIcon, 
  Send, 
  StopCircle,
  X,
  Sparkles,
  Loader2,
  Palette,
  ClipboardPaste,
  ClipboardCheck,
  Copy,
  Check,
  CloudSun,
  Cpu,
  Zap,
  Binary,
  Calculator,
  Sliders,
  ChevronDown,
  BookOpen,
  ShieldCheck,
  Code2,
  FileCode,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, copyTextToClipboard } from '../lib/utils';
import { AIModel, ReasoningStyle, CodingTask } from '../types';
import { CodingToolbar } from './CodingToolbar';

interface InputBarProps {
  onSendMessage: (text: string, attachments?: string[], type?: 'text' | 'vision') => void;
  isLoading: boolean;
  selectedModel: AIModel;
  onSwitchModel: (model: AIModel) => void;
  externalText?: string;
  onExternalTextUsed?: () => void;
  externalAttachment?: string | null;
  onExternalAttachmentUsed?: () => void;
  onOpenWeather?: () => void;
  isReasoningMode?: boolean;
  onToggleReasoningMode?: () => void;
  reasoningStyle?: ReasoningStyle;
  onChangeReasoningStyle?: (style: ReasoningStyle) => void;
  onOpenReasoningModal?: () => void;
  isCodingMode?: boolean;
  onToggleCodingMode?: () => void;
  codingTask?: CodingTask;
  onChangeCodingTask?: (task: CodingTask) => void;
  codingLanguage?: string;
  onChangeCodingLanguage?: (lang: string) => void;
}

export function InputBar({ 
  onSendMessage, 
  isLoading, 
  selectedModel, 
  onSwitchModel, 
  externalText, 
  onExternalTextUsed,
  externalAttachment,
  onExternalAttachmentUsed,
  onOpenWeather,
  isReasoningMode = false,
  onToggleReasoningMode,
  reasoningStyle = 'step-by-step',
  onChangeReasoningStyle,
  onOpenReasoningModal,
  isCodingMode = false,
  onToggleCodingMode,
  codingTask = 'auto',
  onChangeCodingTask,
  codingLanguage = '',
  onChangeCodingLanguage
}: InputBarProps) {
  const [text, setText] = useState('');
  
  useEffect(() => {
    if (externalText !== undefined && externalText !== '') {
      setText(externalText);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = externalText.length;
        textareaRef.current.selectionEnd = externalText.length;
      }
      onExternalTextUsed?.();
      adjustHeight();
    }
  }, [externalText, onExternalTextUsed]);

  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [pastedNotification, setPastedNotification] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  useEffect(() => {
    if (externalAttachment) {
      setAttachments([externalAttachment]);
      onExternalAttachmentUsed?.();
    }
  }, [externalAttachment, onExternalAttachmentUsed]);
  
  const [isFocused, setIsFocused] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    
    const type: 'text' | 'vision' = attachments.length > 0 ? 'vision' : 'text';

    onSendMessage(text, attachments, type);
    setText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
      } else {
        recognitionRef.current.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.warn('Speech recognition start/stop error:', err);
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  // Direct paste handler on the textarea (handles pasted images & writing)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) {
      setTimeout(adjustHeight, 10);
      return;
    }

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        hasImage = true;
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setAttachments(prev => [...prev, reader.result as string]);
              setPastedNotification("Image Attached! 📎");
              setTimeout(() => setPastedNotification(null), 2500);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }

    const pastedText = e.clipboardData.getData('text/plain');
    if (hasImage && !pastedText) {
      e.preventDefault();
    } else if (pastedText) {
      if (pastedText.startsWith('data:image/')) {
        e.preventDefault();
        setAttachments(prev => [...prev, pastedText]);
        setPastedNotification("Image Attached! 📎");
        setTimeout(() => setPastedNotification(null), 2500);
      } else {
        setTimeout(adjustHeight, 10);
        setPastedNotification("Writing Pasted! 📋");
        setTimeout(() => setPastedNotification(null), 2000);
      }
    }
  };

  // Button paste handler for mobile and toolbar 1-click paste
  const handlePasteFromClipboardButton = async () => {
    try {
      // 1. Check for image in clipboard
      if (navigator.clipboard && navigator.clipboard.read) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            const imageType = item.types.find(t => t.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  setAttachments(prev => [...prev, reader.result as string]);
                  setPastedNotification("Image Attached! 📎");
                  setTimeout(() => setPastedNotification(null), 2500);
                }
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        } catch (e) {
          // Fall through to text read if image read fails or lacks permission
        }
      }

      // 2. Fallback to text reading
      if (navigator.clipboard && navigator.clipboard.readText) {
        const textData = await navigator.clipboard.readText();
        if (textData) {
          if (textData.startsWith('data:image/')) {
            setAttachments(prev => [...prev, textData]);
            setPastedNotification("Image Attached! 📎");
          } else {
            setText(prev => (prev ? `${prev} ${textData}` : textData));
            setTimeout(adjustHeight, 10);
            textareaRef.current?.focus();
            setPastedNotification("Writing Pasted! 📋");
          }
          setTimeout(() => setPastedNotification(null), 2500);
          return;
        }
      }

      setPastedNotification("Clipboard empty or access denied");
      setTimeout(() => setPastedNotification(null), 2000);
    } catch (err) {
      console.warn("Clipboard paste error:", err);
      setPastedNotification("Press Ctrl+V to paste");
      setTimeout(() => setPastedNotification(null), 2500);
    }
  };

  const handleCopyPrompt = async () => {
    if (!text.trim()) return;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
      <div className="relative group flex items-center justify-center">
        <div 
          onMouseEnter={() => setIsVisible(true)} 
          onMouseLeave={() => setIsVisible(false)}
        >
          {children}
        </div>
        <AnimatePresence>
          {isVisible && (
            <motion.div
              key="input-tooltip-popup"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 dark:bg-slate-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap z-50 pointer-events-none shadow-xl"
            >
              {text}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-800 dark:border-t-slate-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setText(transcript);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-white dark:from-dark-bg via-white/95 dark:via-dark-bg/95 to-transparent pointer-events-none">
      <div className="max-w-3xl mx-auto w-full pointer-events-auto relative">
        {/* Floating Notification Toast */}
        <AnimatePresence>
          {pastedNotification && (
            <motion.div
              key="pasted-floating-badge"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-lg border border-slate-700 pointer-events-none flex items-center gap-1.5 z-50"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{pastedNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              key="input-attachments-preview-list"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="flex gap-2 mb-2 overflow-x-auto pb-1.5 scrollbar-none"
            >
              {attachments.map((src, i) => (
                <div key={`input-attachment-${i}`} className="relative group flex-shrink-0">
                  <img src={src} className="w-16 h-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-md" alt="Attachment" />
                  <button 
                     onClick={() => removeAttachment(i)}
                     className="absolute -top-1 -right-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-400 hover:text-red-500 transition-colors shadow-lg active:scale-90"
                     title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isCodingMode && (
          <CodingToolbar
            activeTask={codingTask}
            onSelectTask={onChangeCodingTask || (() => {})}
            selectedLanguage={codingLanguage}
            onSelectLanguage={onChangeCodingLanguage || (() => {})}
            onClose={onToggleCodingMode}
          />
        )}

        <div id="input-tools-step" className={cn(
          "relative rounded-[1.5rem] border transition-all duration-500 bg-white dark:bg-dark-surface shadow-xl flex flex-col gap-0 p-1 focus-within:ring-4 focus-within:ring-indigo-50/50 dark:focus-within:ring-indigo-500/10",
          isReasoningMode 
            ? "border-indigo-300 dark:border-indigo-500/50 ring-2 ring-indigo-50 dark:ring-indigo-500/10" 
            : isCodingMode
            ? "border-emerald-300 dark:border-emerald-500/50 ring-2 ring-emerald-50 dark:ring-emerald-500/10"
            : "border-slate-100 dark:border-dark-border",
          isRecording && "border-red-200 dark:border-red-500/50 ring-4 ring-red-50 dark:ring-red-500/10"
        )}>
          {/* Reasoning Mode Active Header Banner */}
          {isReasoningMode && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50/70 dark:bg-indigo-500/10 border-b border-indigo-100 dark:border-indigo-500/20 rounded-t-[1.3rem] text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                <Cpu className="w-3.5 h-3.5 animate-pulse text-indigo-600 dark:text-indigo-400" />
                <span>Reasoning Mode Active</span>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">• 9-Step STEM Solver & Verification</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Style Dropdown button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStyleMenu(!showStyleMenu)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-all"
                  >
                    {reasoningStyle === 'engineering' && <Zap className="w-3 h-3 text-amber-500" />}
                    {reasoningStyle === 'rigorous' && <Binary className="w-3 h-3 text-blue-500" />}
                    {reasoningStyle === 'step-by-step' && <Calculator className="w-3 h-3 text-indigo-500" />}
                    {reasoningStyle === 'exam' && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                    {reasoningStyle === 'conceptual' && <BookOpen className="w-3 h-3 text-purple-500" />}
                    {reasoningStyle === 'revision' && <Sparkles className="w-3 h-3 text-rose-500" />}
                    <span>
                      {reasoningStyle === 'engineering' ? 'Electrical Eng' :
                       reasoningStyle === 'rigorous' ? 'Rigorous Proof' :
                       reasoningStyle === 'step-by-step' ? 'Step-by-Step' :
                       reasoningStyle === 'exam' ? 'Exam Prep' :
                       reasoningStyle === 'conceptual' ? 'Concepts' : 'Revision Notes'}
                    </span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </button>

                  {showStyleMenu && (
                    <div className="absolute right-0 bottom-full mb-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 text-xs">
                      {[
                        { id: 'step-by-step', label: 'Step-by-Step Derivation' },
                        { id: 'engineering', label: 'Electrical Engineering' },
                        { id: 'rigorous', label: 'Rigorous Formal Proof' },
                        { id: 'exam', label: 'Competitive Exam Prep' },
                        { id: 'conceptual', label: 'Conceptual & Theory' },
                        { id: 'revision', label: 'High-Density Revision' }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onChangeReasoningStyle?.(item.id as any);
                            setShowStyleMenu(false);
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[11px] transition-all",
                            reasoningStyle === item.id ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold" : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          )}
                        >
                          <span>{item.label}</span>
                          {reasoningStyle === item.id && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {onOpenReasoningModal && (
                  <button
                    type="button"
                    onClick={onOpenReasoningModal}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Reasoning Engine Status & Sandbox"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                )}

                {onToggleReasoningMode && (
                  <button
                    type="button"
                    onClick={onToggleReasoningMode}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Switch back to Normal Chat Mode"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-0.5 px-1.5 pt-1">
            <Tooltip text="Take a photo of equation or diagram">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full transition-colors active:scale-95 touch-manipulation"
                title="Camera"
              >
                <Camera className="w-4.5 h-4.5" />
              </button>
            </Tooltip>
            <Tooltip text="Upload document, equation or diagram">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full transition-colors active:scale-95 touch-manipulation"
                title="Upload image or document"
              >
                <ImageIcon className="w-4.5 h-4.5" />
              </button>
            </Tooltip>
            <Tooltip text="Paste writing, equation or image">
              <button
                onClick={handlePasteFromClipboardButton}
                className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors active:scale-95 touch-manipulation"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-4.5 h-4.5" />
              </button>
            </Tooltip>
            <Tooltip text="Voice input">
              <button
                onClick={handleToggleMic}
                className={cn(
                  "p-1.5 rounded-full transition-all active:scale-95 touch-manipulation",
                  isRecording 
                    ? "bg-red-50 dark:bg-red-500/10 text-red-500 animate-pulse" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
                title="Dictate voice"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            </Tooltip>
            {onToggleReasoningMode && (
              <Tooltip text={isReasoningMode ? "Disable Advanced Reasoning" : "Enable Advanced Mathematical & Engineering Reasoning"}>
                <button
                  type="button"
                  onClick={onToggleReasoningMode}
                  className={cn(
                    "p-1.5 rounded-full transition-all active:scale-95 touch-manipulation",
                    isReasoningMode 
                      ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-800" 
                      : "hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  )}
                  title="Toggle Advanced Reasoning"
                >
                  <Cpu className="w-4.5 h-4.5" />
                </button>
              </Tooltip>
            )}
            {onToggleCodingMode && (
              <Tooltip text={isCodingMode ? "Disable Coding Assistant" : "Enable Zinnia Coding Assistant & Problem Solver"}>
                <button
                  type="button"
                  onClick={onToggleCodingMode}
                  className={cn(
                    "p-1.5 rounded-full transition-all active:scale-95 touch-manipulation",
                    isCodingMode 
                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-800" 
                      : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                  title="Toggle Coding Assistant"
                >
                  <Code2 className="w-4.5 h-4.5" />
                </button>
              </Tooltip>
            )}
            <Tooltip text="Insert code snippet template">
              <button
                type="button"
                onClick={() => {
                  const lang = codingLanguage || 'python';
                  const snippet = `\`\`\`${lang}\n# Paste or write your code here\n\n\`\`\`\n`;
                  setText(prev => prev ? `${prev}\n${snippet}` : snippet);
                  setTimeout(adjustHeight, 20);
                }}
                className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95 touch-manipulation"
                title="Insert Code Snippet"
              >
                <FileCode className="w-4.5 h-4.5" />
              </button>
            </Tooltip>
            {onOpenWeather && !isReasoningMode && !isCodingMode && (
              <Tooltip text="Weather forecast">
                <button
                  type="button"
                  onClick={onOpenWeather}
                  className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 transition-all active:scale-95 touch-manipulation"
                  title="Check live weather"
                >
                  <CloudSun className="w-4.5 h-4.5" />
                </button>
              </Tooltip>
            )}
            <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1" />
          </div>

          <div className="relative flex items-end gap-1 p-0.5">
            <textarea
              ref={textareaRef}
              value={text}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={handlePaste}
              onChange={(e) => {
                setText(e.target.value);
                adjustHeight();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                attachments.length > 0 
                  ? (isReasoningMode ? "Analyze mathematical document, circuit diagram, or handwritten problem..." : "Ask a question about this image...") 
                  : (isReasoningMode ? "Enter math, calculus, circuit, or engineering problem..." : isCodingMode ? "Ask any programming question, paste code to debug, or describe software to build..." : "Ask Zinnia anything or paste code/images...")
              }
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-dark-text-primary px-2.5 py-1.5 outline-none resize-none min-h-[36px] max-h-24 placeholder:text-slate-300 dark:placeholder:text-dark-text-placeholder text-xs sm:text-sm"
              rows={1}
            />

            <div className="flex items-center gap-1 p-0.5">
              {text.trim().length > 0 && (
                <button
                  onClick={handleCopyPrompt}
                  className={cn(
                    "p-1.5 rounded-full transition-all active:scale-90 touch-manipulation",
                    copiedPrompt 
                      ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                  title={copiedPrompt ? "Copied!" : "Copy prompt text"}
                >
                  {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={(!text.trim() && attachments.length === 0) || isLoading}
                className={cn(
                  "p-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-30 touch-manipulation",
                  "bg-indigo-600 text-white shadow-indigo-100 dark:shadow-none"
                )}
                title="Send message"
              >
                {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isFocused && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium transition-all"
            >
              Press <span className="text-indigo-500 dark:text-indigo-400">Shift+Enter</span> for a new line • <span className="text-indigo-500 dark:text-indigo-400">Enter</span> to send • <span className="text-indigo-500 dark:text-indigo-400">Ctrl+V</span> to paste text or images
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        accept="image/*,application/pdf" 
        className="hidden" 
        onChange={handleFileUpload} 
      />
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        onChange={handleFileUpload} 
      />
    </div>
  );
}
