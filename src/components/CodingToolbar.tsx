import React, { useState } from 'react';
import { 
  Code2, 
  Bug, 
  BookOpen, 
  Cpu, 
  ArrowRightLeft, 
  Zap, 
  FolderTree, 
  TestTube, 
  Database, 
  GraduationCap, 
  Sparkles,
  ChevronDown,
  X,
  FileCode,
  Terminal
} from 'lucide-react';
import { CodingTask, SupportedLanguage } from '../types';
import { cn } from '../lib/utils';
import { LANGUAGE_DISPLAY_NAMES } from '../services/codingIntentDetector';

interface CodingToolbarProps {
  activeTask: CodingTask;
  onSelectTask: (task: CodingTask) => void;
  selectedLanguage?: string;
  onSelectLanguage: (lang: string) => void;
  onInsertCodeTemplate?: (template: string) => void;
  onClose?: () => void;
}

const CODING_TASKS: { task: CodingTask; label: string; icon: any; color: string; desc: string }[] = [
  { task: 'auto', label: 'Auto Detect', icon: Sparkles, color: 'text-indigo-500', desc: 'Smart intent detection' },
  { task: 'generator', label: 'Generator', icon: Code2, color: 'text-emerald-500', desc: 'Complete runnable code' },
  { task: 'debugger', label: 'Debugger', icon: Bug, color: 'text-rose-500', desc: 'Diagnose & fix errors' },
  { task: 'explainer', label: 'Explainer', icon: BookOpen, color: 'text-amber-500', desc: 'Line-by-line breakdown' },
  { task: 'dsa', label: 'DSA & Algo', icon: Cpu, color: 'text-purple-500', desc: 'LeetCode, proofs & Big-O' },
  { task: 'converter', label: 'Converter', icon: ArrowRightLeft, color: 'text-blue-500', desc: 'Translate between languages' },
  { task: 'optimizer', label: 'Optimizer', icon: Zap, color: 'text-cyan-500', desc: 'Reduce time & space' },
  { task: 'project', label: 'Project Builder', icon: FolderTree, color: 'text-violet-500', desc: 'Scaffold full applications' },
  { task: 'tester', label: 'Test Suite', icon: TestTube, color: 'text-teal-500', desc: 'Unit tests & edge cases' },
  { task: 'sql', label: 'SQL Assistant', icon: Database, color: 'text-orange-500', desc: 'Queries, schemas & indexes' },
  { task: 'interview', label: 'Interview Prep', icon: GraduationCap, color: 'text-pink-500', desc: 'Mock problems & hints' }
];

const POPULAR_LANGUAGES: SupportedLanguage[] = [
  'python',
  'typescript',
  'javascript',
  'cpp',
  'java',
  'rust',
  'go',
  'sql',
  'csharp',
  'bash',
  'html',
  'css'
];

export function CodingToolbar({ 
  activeTask, 
  onSelectTask, 
  selectedLanguage, 
  onSelectLanguage,
  onInsertCodeTemplate,
  onClose 
}: CodingToolbarProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const activeTaskObj = CODING_TASKS.find(t => t.task === activeTask) || CODING_TASKS[0];

  return (
    <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm transition-all text-xs mb-3">
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            Zinnia Coding Assistant
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            ({activeTaskObj.desc})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors text-xs font-semibold shadow-xs"
            >
              <FileCode className="w-3 h-3 text-emerald-500" />
              <span>{selectedLanguage ? (LANGUAGE_DISPLAY_NAMES[selectedLanguage]?.name || selectedLanguage) : 'Any Language'}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => { onSelectLanguage(''); setShowLangMenu(false); }}
                  className="col-span-2 text-left px-2 py-1 text-[11px] rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                >
                  ⚡ Auto Detect
                </button>
                {POPULAR_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => { onSelectLanguage(lang); setShowLangMenu(false); }}
                    className={cn(
                      "text-left px-2 py-1 text-[11px] rounded transition-colors font-medium truncate",
                      selectedLanguage === lang 
                        ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {LANGUAGE_DISPLAY_NAMES[lang]?.name || lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="Close Coding Toolbar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Task Mode Pills (Scrollable horizontally on mobile) */}
      <div className="flex items-center gap-1.5 pt-2 overflow-x-auto scrollbar-none">
        {CODING_TASKS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTask === item.task;
          return (
            <button
              key={item.task}
              type="button"
              onClick={() => onSelectTask(item.task)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-xl whitespace-nowrap text-[11px] font-bold transition-all shrink-0",
                isActive 
                  ? "bg-emerald-600 text-white shadow-xs shadow-emerald-200 dark:shadow-none" 
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
              )}
              title={item.desc}
            >
              <Icon className={cn("w-3 h-3", isActive ? "text-white" : item.color)} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
