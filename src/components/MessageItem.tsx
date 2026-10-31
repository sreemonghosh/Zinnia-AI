import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Bot, 
  Download, 
  Share2, 
  Trash2, 
  Edit2, 
  Check, 
  X as CloseIcon, 
  Copy, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Binary,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Zap,
  BookOpen,
  Layers,
  CloudSun,
  BarChart3,
  Code2,
  Terminal
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Message } from '../types';
import { cn, copyTextToClipboard, copyImageToClipboard } from '../lib/utils';
import { WeatherWidget } from './WeatherWidget';
import { CodeBlock } from './CodeBlock';

interface MessageItemProps {
  message: Message;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
  onRegenerate?: () => void;
  onSendMessage?: (text: string) => void;
}

export function MessageItem({ message, onDelete, onEdit, onRegenerate, onSendMessage }: MessageItemProps) {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [copiedImageIndex, setCopiedImageIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showVerifiedDetails, setShowVerifiedDetails] = useState(true);

  const getRouteIcon = (route?: string) => {
    switch (route) {
      case 'mathematics':
        return <Calculator className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />;
      case 'programming':
        return <Code2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />;
      case 'engineering':
        return <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />;
      case 'science':
        return <Cpu className="w-3 h-3 text-purple-500 dark:text-purple-400" />;
      case 'data_analysis':
        return <BarChart3 className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />;
      case 'writing_language':
        return <BookOpen className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />;
      case 'temporal':
        return <CloudSun className="w-3 h-3 text-amber-500 dark:text-amber-400" />;
      default:
        return <Layers className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />;
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const splitText = doc.splitTextToSize(message.content, pageWidth - margin * 2);
    
    doc.setFont("helvetica", "bold");
    doc.text(isUser ? "You" : "Assistant", margin, 20);
    doc.setFont("helvetica", "normal");
    doc.text(splitText, margin, 30);
    doc.save(`message-${message.id.slice(0, 8)}.pdf`);
  };

  const handleCopyText = async () => {
    const ok = await copyTextToClipboard(message.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyImage = async (url: string, index: number) => {
    const ok = await copyImageToClipboard(url);
    if (ok) {
      setCopiedImageIndex(index);
      setTimeout(() => setCopiedImageIndex(null), 2000);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        const extension = url.split(';')[0].split('/')[1] || 'png';
        link.download = `Zinnia-Image-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = blob.type.split('/')[1] || 'png';
      link.download = `Zinnia-Image-${Date.now()}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Failed to download image:", error);
      window.open(url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-4 w-full group/message",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border",
        isUser 
          ? "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700" 
          : "bg-indigo-600 text-white border-indigo-500"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn(
        "max-w-[85%] lg:max-w-[70%] space-y-2",
        isUser ? "flex flex-col items-end" : "flex flex-col items-start"
      )}>
        <div className="relative group/content">
          <div className={cn(
            "px-5 py-3 rounded-2xl shadow-sm border transition-all",
            isUser 
              ? "bg-white dark:bg-indigo-600 text-slate-700 dark:text-white border-indigo-100 dark:border-indigo-500 shadow-indigo-50/50 dark:shadow-none rounded-tr-none" 
              : "bg-white dark:bg-dark-surface text-slate-700 dark:text-dark-text-primary border-slate-100 dark:border-dark-border rounded-tl-none"
          )}>
            {isEditing ? (
              <div className="space-y-2 min-w-[200px]">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-400 transition-all min-h-[100px] text-slate-900 dark:text-white"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={handleCancelEdit}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 transition-all"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded text-indigo-600 dark:text-indigo-400 transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Auto-detected Question Type & AI Safety Guidelines Support Status */}
                {message.metadata?.verification && (
                  <div className={cn(
                    "flex flex-wrap items-center justify-between gap-2 pb-2 mb-1 text-[11px] border-b",
                    isUser ? "border-slate-100 dark:border-white/20" : "border-slate-100 dark:border-slate-800"
                  )}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 1. Question Type Badge (e.g. General Knowledge, Math Problem, Coding) */}
                      <span className={cn(
                        "font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border",
                        isUser 
                          ? "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-white/20 dark:text-white dark:border-white/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/60"
                      )}>
                        {getRouteIcon(message.metadata.verification.route)}
                        <span>{message.metadata.verification.routeLabel || 'General Knowledge'}</span>
                      </span>

                      {/* 2. AI Safety Guidelines / Support Status */}
                      {message.metadata.verification.confidence === 'not_supported' ? (
                        <span className={cn(
                          "font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border shadow-xs",
                          isUser
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/30 dark:text-rose-100 dark:border-rose-400/40"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20"
                        )}>
                          <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Not Supported</span>
                        </span>
                      ) : (
                        <span className={cn(
                          "font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border shadow-xs",
                          isUser
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-white/20 dark:text-white dark:border-white/30"
                            : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20"
                        )}>
                          <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Strongly Supported</span>
                        </span>
                      )}
                    </div>

                    {message.metadata.verification.checksPerformed && message.metadata.verification.checksPerformed.length > 0 && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {message.metadata.verification.checksPerformed[0].name}
                      </span>
                    )}
                  </div>
                )}
                {/* Reasoning Mode Banner & Metadata */}
                {message.metadata?.reasoning?.isReasoningMode && (
                  <div className="flex flex-wrap items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                      <Cpu className="w-3 h-3" />
                      Advanced Reasoning
                    </span>

                    {message.metadata.reasoning.reasoningStyle && (
                      <span className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
                        {message.metadata.reasoning.reasoningStyle === 'engineering' && <Zap className="w-3 h-3" />}
                        {message.metadata.reasoning.reasoningStyle === 'rigorous' && <Binary className="w-3 h-3" />}
                        {message.metadata.reasoning.reasoningStyle === 'step-by-step' && <Calculator className="w-3 h-3" />}
                        {message.metadata.reasoning.reasoningStyle === 'exam' && <ShieldCheck className="w-3 h-3" />}
                        {message.metadata.reasoning.reasoningStyle === 'conceptual' && <BookOpen className="w-3 h-3" />}
                        {message.metadata.reasoning.reasoningStyle === 'revision' && <Sparkles className="w-3 h-3" />}
                        {message.metadata.reasoning.reasoningStyle === 'engineering' ? 'Electrical Engineering' :
                         message.metadata.reasoning.reasoningStyle === 'rigorous' ? 'Rigorous Proof' :
                         message.metadata.reasoning.reasoningStyle === 'step-by-step' ? 'Step-by-Step' :
                         message.metadata.reasoning.reasoningStyle === 'exam' ? 'Competitive Exam' :
                         message.metadata.reasoning.reasoningStyle === 'conceptual' ? 'Theory & Concept' : 'Revision Notes'}
                      </span>
                    )}

                    {message.metadata.reasoning.model && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        [{message.metadata.reasoning.model}]
                      </span>
                    )}
                  </div>
                )}

                {/* Dedicated Numerical / Math Model Badge */}
                {!message.metadata?.reasoning?.isReasoningMode && (message.model === 'zinnia-numeric-solver' || message.model === 'zinnia-deep-math') && (
                  <div className="flex flex-wrap items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                    {message.model === 'zinnia-numeric-solver' ? (
                      <span className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20">
                        <Calculator className="w-3 h-3" />
                        Zinnia Numerical Solver
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-500/20">
                        <Binary className="w-3 h-3" />
                        Zinnia Deep Math & STEM
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {message.model === 'zinnia-numeric-solver' ? 'Exact Calculation' : 'Analytical Proof'}
                    </span>
                  </div>
                )}

                {/* Dedicated Coding Assistant Badge */}
                {!message.metadata?.reasoning?.isReasoningMode && (message.model === 'zinnia-code-architect' || message.metadata?.coding?.isCodingQuery) && (
                  <div className="flex flex-wrap items-center gap-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
                      <Code2 className="w-3 h-3" />
                      Zinnia Code Assistant
                    </span>
                    {message.metadata?.coding?.task && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {message.metadata.coding.task}
                      </span>
                    )}
                    {message.metadata?.coding?.language && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        [{message.metadata.coding.language}]
                      </span>
                    )}
                  </div>
                )}

                {/* KaTeX Markdown & Interactive Syntax-Highlighted Code Renderer */}
                <div className={cn("markdown-body", isUser ? "user-markdown" : "assistant-markdown")}>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      pre: ({ children }: any) => <>{children}</>,
                      code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children || '').replace(/\n$/, '');
                        const isInline = inline ?? (!match && !codeString.includes('\n'));

                        if (isInline) {
                          return (
                            <code 
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[13px] font-mono border",
                                isUser 
                                  ? "bg-slate-100 dark:bg-white/20 text-indigo-700 dark:text-white border-indigo-200/50 dark:border-white/30"
                                  : "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200/50 dark:border-slate-700/50"
                              )} 
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }

                        return (
                          <CodeBlock
                            inline={false}
                            className={className}
                            onCodeAction={onSendMessage}
                          >
                            {children}
                          </CodeBlock>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* Independent Mathematical Verification Section */}
                {message.metadata?.reasoning?.verifiedResults && message.metadata.reasoning.verifiedResults.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Independent Engine Verification</span>
                      </div>
                      <button
                        onClick={() => setShowVerifiedDetails(!showVerifiedDetails)}
                        className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5 transition-colors"
                      >
                        {showVerifiedDetails ? "Hide Details" : "Show Details"}
                        <ChevronDown className={cn("w-3 h-3 transition-transform", showVerifiedDetails && "rotate-180")} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showVerifiedDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {message.metadata.reasoning.verifiedResults.map((item, idx) => (
                            <div 
                              key={`verified-${message.id}-${idx}`}
                              className="p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-xs space-y-1 font-mono"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {item.verificationType === 'symbolic' ? 'Symbolically Verified' :
                                   item.verificationType === 'dimensional' ? 'Dimensional Consistency Checked' :
                                   item.verificationType === 'numerical' ? 'Numerically Checked' : 'Independent Check'}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                                  {item.operation}
                                </span>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 text-[11px]">
                                <span className="text-slate-400 dark:text-slate-400">Expression:</span> <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-800 dark:text-slate-100">{item.expression}</code>
                              </p>
                              {item.symbolicResult && (
                                <p className="text-slate-800 dark:text-slate-200 text-[11px]">
                                  <span className="text-slate-400 dark:text-slate-400">Symbolic Result:</span> <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-300 font-bold">{item.symbolicResult}</code>
                                </p>
                              )}
                              {item.numericResult && (
                                <p className="text-slate-800 dark:text-slate-200 text-[11px]">
                                  <span className="text-slate-400 dark:text-slate-400">Numerical Result:</span> <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-bold text-slate-800 dark:text-slate-100">{item.numericResult}</code>
                                </p>
                              )}
                              <p className="text-[10px] text-slate-500 dark:text-slate-300 font-sans mt-0.5">
                                {item.details}
                              </p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Weather widget if present */}
                {message.metadata?.weatherData && (
                  <div className="w-full mt-3">
                    <WeatherWidget initialData={message.metadata.weatherData} />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Quick Actions (Copy, PDF, Edit) */}
          <div className={cn(
            "lg:absolute lg:-right-12 lg:top-0 flex lg:flex-col gap-1 transition-all",
            "mt-1 lg:mt-0 lg:opacity-0 lg:group-hover/content:opacity-100"
          )}>
            {/* Copy Writing / Text Button (Available on both User and Assistant messages) */}
            <div className="relative">
              <button 
                onClick={handleCopyText}
                className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-all touch-manipulation"
                title="Copy writing"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {copied && (
                  <motion.div
                    key={`copied-tooltip-${message.id || 'msg'}`}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 bg-slate-800 dark:bg-slate-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap z-50 shadow-xl"
                  >
                    Copied!
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-800 dark:border-t-slate-900" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={downloadAsPDF}
              className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-all touch-manipulation"
              title="Download as PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            {isUser && onEdit && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-all touch-manipulation"
                title="Edit message"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {!isUser && (
              <div className="flex lg:flex-col gap-1">
                {onRegenerate && (
                  <button 
                    onClick={onRegenerate}
                    className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-all touch-manipulation"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  className={cn(
                    "p-2 shadow-sm border rounded-lg transition-all active:scale-90 touch-manipulation",
                    feedback === 'up' 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-50" 
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-emerald-500 dark:hover:text-emerald-400"
                  )}
                  title="Helpful"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  className={cn(
                    "p-2 shadow-sm border rounded-lg transition-all active:scale-90 touch-manipulation",
                    feedback === 'down' 
                      ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 shadow-red-50" 
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-red-500 dark:hover:text-red-400"
                  )}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className={cn(
            "grid gap-2 mt-2",
            message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"
          )}>
            {message.attachments.map((src, i) => (
              <div key={`${message.id || 'msg'}-attachment-${i}`} className="flex flex-col gap-2 w-full">
                <div className="relative group rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-md">
                  <img src={src} alt="Attachment" className="w-full h-auto rounded-2xl object-cover" />

                  <div className="absolute inset-0 bg-black/10 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleCopyImage(src, i)}
                      className="p-3 bg-white shadow-xl rounded-full hover:scale-110 active:scale-95 transition-all text-slate-700 border border-slate-100"
                      title="Copy image to clipboard"
                    >
                      {copiedImageIndex === i ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => downloadImage(src)}
                      className="p-3 bg-white shadow-xl rounded-full hover:scale-110 active:scale-95 transition-all text-slate-700 border border-slate-100"
                      title="Download Image"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 w-full mt-1">
                  <button
                    onClick={() => handleCopyImage(src, i)}
                    className={cn(
                      "py-1.5 px-3 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm",
                      copiedImageIndex === i
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    )}
                    title="Copy image to clipboard"
                  >
                    {copiedImageIndex === i ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedImageIndex === i ? "Copied!" : "Copy Image"}
                  </button>

                  <button
                    onClick={() => downloadImage(src)}
                    className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    title="Download Image"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2 px-1">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {onDelete && (
            <button 
              onClick={onDelete}
              className="lg:opacity-0 lg:group-hover/message:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-all cursor-pointer active:scale-90 touch-manipulation"
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
