import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../hooks/useTheme';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const options: { id: Theme; icon: typeof Sun; label: string }[] = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl gap-1" id="theme-switcher">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setTheme(opt.id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-all relative",
            theme === opt.id 
              ? "text-indigo-600 dark:text-indigo-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {theme === opt.id && (
            <motion.div
              layoutId="active-theme"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <opt.icon className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};
