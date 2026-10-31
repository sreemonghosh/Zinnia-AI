import React, { useState, useEffect, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup'; // HTML/XML
import 'prismjs/components/prism-css';
import { 
  Check, 
  Copy, 
  Download, 
  Play, 
  RotateCcw, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  FileCode, 
  Sparkles, 
  Bug, 
  Zap, 
  TestTube, 
  ArrowRightLeft,
  Loader2,
  WrapText,
  Hash
} from 'lucide-react';
import { cn, copyTextToClipboard } from '../lib/utils';
import { CodeExecutionResult } from '../types';
import { LANGUAGE_DISPLAY_NAMES } from '../services/codingIntentDetector';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  onCodeAction?: (actionPrompt: string) => void;
}

export function CodeBlock({ inline, className, children, onCodeAction }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [showConvertMenu, setShowConvertMenu] = useState(false);

  const rawCode = String(children || '').replace(/\n$/, '');

  // Parse language from className (e.g. "language-python")
  const match = /language-(\w+)/.exec(className || '');
  const rawLang = (match ? match[1] : '').toLowerCase();

  // Normalize language for Prism
  const langKey = useMemo(() => {
    if (!rawLang) return 'text';
    if (['py', 'python3'].includes(rawLang)) return 'python';
    if (['js', 'jsx'].includes(rawLang)) return 'javascript';
    if (['ts', 'tsx'].includes(rawLang)) return 'typescript';
    if (['c++', 'cplusplus'].includes(rawLang)) return 'cpp';
    if (['cs', 'dotnet'].includes(rawLang)) return 'csharp';
    if (['sh', 'zsh', 'shell'].includes(rawLang)) return 'bash';
    if (['yml'].includes(rawLang)) return 'yaml';
    return rawLang;
  }, [rawLang]);

  // Syntax highlight with Prism
  const highlightedHtml = useMemo(() => {
    if (inline) return '';
    try {
      const grammar = Prism.languages[langKey];
      if (grammar) {
        return Prism.highlight(rawCode, grammar, langKey);
      }
    } catch (e) {
      // Fallback
    }
    // Safe HTML escape
    return rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }, [rawCode, langKey, inline]);

  const lines = useMemo(() => rawCode.split('\n'), [rawCode]);
  const isLargeCode = lines.length > 25;

  // Detect filename if present in first line comment (e.g. "# main.py" or "// App.tsx")
  const fileName = useMemo(() => {
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      const matchComment = firstLine.match(/^(?:\/{2}|#|\/\*)\s*(?:filename:\s*)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/i);
      if (matchComment) return matchComment[1];
    }
    return null;
  }, [lines]);

  // Can this code be executed in the sandbox?
  const isExecutable = useMemo(() => {
    return ['python', 'javascript', 'typescript', 'bash'].includes(langKey);
  }, [langKey]);

  const langInfo = LANGUAGE_DISPLAY_NAMES[langKey] || {
    name: langKey.toUpperCase() || 'CODE',
    ext: langKey || 'txt',
    iconColor: 'text-indigo-400'
  };

  // Inline code snippet
  const isInline = inline !== undefined ? inline : (!match && !rawCode.includes('\n'));
  if (isInline) {
    return (
      <code className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[13px] font-mono border border-slate-200/50 dark:border-slate-700/50">
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(rawCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const defaultName = fileName || `code_snippet.${langInfo.ext}`;
    const blob = new Blob([rawCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunCode = async () => {
    if (executing) return;
    setExecuting(true);
    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: rawCode,
          language: langKey
        })
      });
      const data: CodeExecutionResult = await res.json();
      setExecutionResult(data);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        output: '',
        error: err?.message || 'Failed to communicate with execution sandbox.',
        durationMs: 0,
        language: langKey,
        sandboxed: true
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="my-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-md overflow-hidden text-slate-100 font-mono text-[13px] leading-relaxed group/code">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800/80 select-none flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileCode className={cn("w-4 h-4", langInfo.iconColor)} />
          <span className="font-bold text-xs tracking-wide uppercase text-slate-300">
            {langInfo.name}
          </span>
          {fileName && (
            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md font-medium border border-slate-700/50">
              {fileName}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-sans">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 text-slate-400">
          {isExecutable && (
            <button
              type="button"
              onClick={handleRunCode}
              disabled={executing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              title="Execute code in sandboxed runtime"
            >
              {executing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={cn(
              "p-1.5 rounded-lg hover:bg-slate-800 transition-colors",
              showLineNumbers ? "text-indigo-400" : "text-slate-500"
            )}
            title="Toggle line numbers"
          >
            <Hash className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setWrapLines(!wrapLines)}
            className={cn(
              "p-1.5 rounded-lg hover:bg-slate-800 transition-colors",
              wrapLines ? "text-indigo-400" : "text-slate-500"
            )}
            title="Toggle word wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 p-1.5 px-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px] font-sans">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px] font-sans">Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={`Download ${langInfo.name} file`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {isLargeCode && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={isCollapsed ? "Expand code" : "Collapse code"}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Code Body */}
      <div className={cn(
        "relative overflow-x-auto p-4 custom-scrollbar",
        isCollapsed && "max-h-[160px] overflow-hidden"
      )}>
        {showLineNumbers ? (
          <div className="flex">
            {/* Line numbers gutter */}
            <div className="select-none pr-4 text-right text-slate-600 text-xs font-mono border-r border-slate-800/80 mr-4 shrink-0">
              {lines.map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
            </div>
            {/* Code content */}
            <pre className={cn(
              "flex-1 font-mono text-[13px] leading-6 outline-none bg-transparent m-0 p-0",
              wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre"
            )}>
              <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            </pre>
          </div>
        ) : (
          <pre className={cn(
            "font-mono text-[13px] leading-6 outline-none bg-transparent m-0 p-0",
            wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre"
          )}>
            <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          </pre>
        )}

        {isCollapsed && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900 to-transparent flex items-end justify-center pb-2">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="px-3 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs rounded-full border border-slate-700 shadow-md font-sans font-medium flex items-center gap-1"
            >
              <span>Expand {lines.length} lines</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Execution Terminal Output Drawer */}
      {executionResult && (
        <div className="border-t border-slate-800 bg-black/60 p-3 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold text-slate-200">Terminal Output</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                executionResult.success 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              )}>
                {executionResult.success ? "Success (0)" : "Error"}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                {executionResult.durationMs}ms
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExecutionResult(null)}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>

          {executionResult.output && (
            <pre className="text-emerald-300 bg-slate-950/60 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800/60 font-mono text-[12px]">
              {executionResult.output}
            </pre>
          )}

          {executionResult.error && (
            <pre className="text-rose-400 bg-rose-950/20 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed border border-rose-900/40 font-mono text-[12px]">
              {executionResult.error}
            </pre>
          )}

          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
            <span>⚡ Executed in isolated {langInfo.name} sandbox runtime.</span>
          </div>
        </div>
      )}

      {/* One-Click Action Pills (Explain, Debug, Optimize, Tests, Convert) */}
      {onCodeAction && (
        <div className="px-3 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap font-sans text-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Actions:</span>
          
          <button
            type="button"
            onClick={() => onCodeAction(`Please explain this ${langInfo.name} code line by line:\n\n\`\`\`${langKey}\n${rawCode}\n\`\`\``)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 transition-colors text-[11px]"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Explain</span>
          </button>

          <button
            type="button"
            onClick={() => onCodeAction(`Please analyze and debug this ${langInfo.name} code for potential errors, edge cases, and runtime issues:\n\n\`\`\`${langKey}\n${rawCode}\n\`\`\``)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 transition-colors text-[11px]"
          >
            <Bug className="w-3 h-3 text-rose-400" />
            <span>Debug & Fix</span>
          </button>

          <button
            type="button"
            onClick={() => onCodeAction(`Please optimize this ${langInfo.name} code for time complexity and space efficiency:\n\n\`\`\`${langKey}\n${rawCode}\n\`\`\``)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 transition-colors text-[11px]"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Optimize</span>
          </button>

          <button
            type="button"
            onClick={() => onCodeAction(`Please write comprehensive unit tests with edge cases for this ${langInfo.name} code:\n\n\`\`\`${langKey}\n${rawCode}\n\`\`\``)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 transition-colors text-[11px]"
          >
            <TestTube className="w-3 h-3 text-emerald-400" />
            <span>Write Tests</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowConvertMenu(!showConvertMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 transition-colors text-[11px]"
            >
              <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
              <span>Convert To</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {showConvertMenu && (
              <div className="absolute left-0 bottom-full mb-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 p-1 space-y-0.5">
                {['python', 'typescript', 'javascript', 'cpp', 'rust', 'go', 'java', 'csharp'].filter(l => l !== langKey).map(target => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => {
                      setShowConvertMenu(false);
                      onCodeAction(`Convert this ${langInfo.name} code into idiomatic ${target.toUpperCase()}:\n\n\`\`\`${langKey}\n${rawCode}\n\`\`\``);
                    }}
                    className="w-full text-left px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors capitalize font-sans"
                  >
                    {target}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
