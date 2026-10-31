import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  ChevronLeft,
  Search,
  History,
  Star,
  Archive,
  Pin,
  PinOff,
  Share2,
  Pencil,
  Check,
  X,
  Image as ImageIcon,
  Sparkles,
  Play
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { cn, formatDate } from '../lib/utils';

import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, title: string) => void;
  onDeleteSession: (id: string) => void;
  onClearHistory: () => void;
  onShareChat: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSave: (id: string) => void;
  onToggleArchive: (id: string) => void;
  user: UserProfile;
  onLogout: () => void;
  onLoginRequest: () => void;
  onEditProfile: () => void;
  desktopPersistent?: boolean;
  onReplayIntro?: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onClearHistory,
  onShareChat,
  onTogglePin,
  onToggleSave,
  onToggleArchive,
  user,
  onLogout,
  onLoginRequest,
  onEditProfile,
  desktopPersistent = false,
  onReplayIntro
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'all' | 'saved' | 'archived'>('all');
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");

  const getModelBadge = (model?: string) => {
    if (!model) return null;
    if (model === 'gemini-3.1-pro-preview') {
      return <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-tighter">Pro</span>;
    }
    if (model === 'gemini-3.1-flash-lite-preview') {
      return <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-tighter">Lite</span>;
    }
    if (model === 'gemini-3-flash-preview') {
      return <span className="px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-tighter">Flash</span>;
    }
    return null;
  };

  const filteredSessions = React.useMemo(() => {
    let filtered = sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === 'archived') {
      filtered = filtered.filter(s => s.isArchived);
    } else if (activeTab === 'saved') {
      filtered = filtered.filter(s => s.isSaved && !s.isArchived);
    } else {
      filtered = filtered.filter(s => !s.isArchived);
    }

    // Sort: Pinned first, then by date
    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [sessions, searchQuery, activeTab]);

  const sidebarContent = (
    <motion.div
      key="sidebar-drawer-panel"
      initial={desktopPersistent ? false : { x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        "bg-white dark:bg-dark-sidebar border-r border-slate-200 dark:border-dark-border flex flex-col h-full transition-all duration-300",
        desktopPersistent ? "relative w-full" : "fixed inset-y-0 left-0 w-80 z-50 shadow-2xl"
      )}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <div className="flex flex-col">
            <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white leading-none">Zinnia AI</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold tracking-widest uppercase mt-0.5 animate-pulse">Unlimited</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group active:scale-90 touch-manipulation"
            title="Close Sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
          </button>
        </div>
      </div>

      {/* History Menu/Search Bar */}
      <div className="px-4 space-y-4 mb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-dark-border">
          {[
            { id: 'all', icon: History, label: 'All' },
            { id: 'saved', icon: Star, label: 'Saved' },
            { id: 'archived', icon: Archive, label: 'Archive' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all touch-manipulation",
                activeTab === tab.id 
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => {
            onNewChat();
            if (!desktopPersistent) onClose();
          }}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 font-bold text-sm shadow-md shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          <span>Start New Chat</span>
        </button>
      </div>

      <div 
        id="chat-history-tour-step"
        data-tour="chat-history"
        className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar min-h-[160px]"
      >
        <div className="px-4 py-2 flex items-center justify-between group/history">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Recent History</p>
          <div className="flex items-center gap-1 opacity-0 group-hover/history:opacity-100 transition-opacity">
            <button 
              onClick={onClearHistory}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-slate-400 hover:text-red-500 transition-colors"
              title="Clear All History"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {filteredSessions.map((session, index) => (
          <div
            key={`sidebar-sess-${session.id || index}-${index}`}
            className={cn(
              "group relative flex items-start gap-3 px-3 py-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] border border-transparent touch-manipulation",
                activeSessionId === session.id 
                  ? "bg-gradient-to-r from-indigo-50/80 to-white dark:from-indigo-500/10 dark:to-transparent border-indigo-100/50 dark:border-indigo-500/20 shadow-sm" 
                  : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              )}
            onClick={() => {
              onSelectSession(session.id);
              if (!desktopPersistent) onClose();
            }}
          >
            <div className="relative mt-1 flex-shrink-0">
              <MessageSquare className={cn(
                "w-4 h-4",
                activeSessionId === session.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
              )} />
              {session.isPinned && (
                <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-[var(--color-dark-sidebar)] shadow-sm" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 pr-6">
              {editingSessionId === session.id ? (
                <div className="flex items-center gap-1 -ml-1">
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRenameSession(session.id, editingTitle);
                        setEditingSessionId(null);
                      } else if (e.key === 'Escape') {
                        setEditingSessionId(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/40 rounded px-1.5 py-0.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameSession(session.id, editingTitle);
                      setEditingSessionId(null);
                    }}
                    className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 rounded"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(null);
                    }}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn(
                      "text-xs truncate transition-colors",
                      activeSessionId === session.id ? "text-indigo-900 dark:text-indigo-50 font-bold" : "text-slate-700 dark:text-slate-300 font-medium"
                    )}>
                      {session.title}
                    </p>
                    {getModelBadge(session.model)}
                  </div>
                  {session.topic && (
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none mb-1">
                      • {session.topic}
                    </p>
                  )}
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">{formatDate(session.updatedAt)}</p>
                </>
              )}
            </div>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-inherit pl-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSessionId(session.id);
                  setEditingTitle(session.title);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Rename"
              >
                <Pencil className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(session.id);
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  session.isPinned ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" : "text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                )}
                title={session.isPinned ? "Unpin" : "Pin"}
              >
                {session.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(session.id);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    session.isSaved ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:bg-slate-200/50"
                  )}
                  title={session.isSaved ? "Unsave" : "Save"}
                >
                  <Star className={cn("w-3 h-3", session.isSaved && "fill-amber-500")} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArchive(session.id);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    session.isArchived ? "text-slate-600 bg-slate-100" : "text-slate-400 hover:bg-slate-200/50"
                  )}
                  title={session.isArchived ? "Unarchive" : "Archive"}
                >
                  <Archive className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
          </div>
        ))}
        {filteredSessions.length === 0 && (
          <div className="px-4 py-12 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-slate-200" />
            </div>
            <p className="text-xs text-slate-400 font-medium">No results found</p>
          </div>
        )}
      </div>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-100 dark:border-dark-border space-y-4">
        <div className="px-3 py-2 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Your Status</span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">UNLIMITED ACCESS</span>
          </div>
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
        </div>
        {/* App Intro Animation Action Button */}
        {onReplayIntro && (
          <button
            type="button"
            onClick={onReplayIntro}
            className="w-full flex items-center justify-between p-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 border border-indigo-200/80 dark:border-indigo-500/30 text-slate-800 dark:text-slate-100 transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
            title="Watch App Intro Animation"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform shrink-0">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">App Intro</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Play launch animation</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:rotate-12 transition-transform shrink-0" />
          </button>
        )}

        <ThemeToggle />
        
        {user.isLoggedIn ? (
          <div className="space-y-2">
            <div 
              role="button"
              onClick={onEditProfile}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border hover:border-indigo-600 dark:hover:border-indigo-400 group transition-all"
            >
              <div className="relative">
                <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 transition-transform group-hover:scale-105" />
                <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onLoginRequest}
            className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span>Sign In / Create Account</span>
          </button>
        )}
      </div>
    </motion.div>
  );

  if (desktopPersistent) {
    return sidebarContent;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment key="mobile-sidebar-fragment">
          {/* Overlay */}
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
          {sidebarContent}
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
