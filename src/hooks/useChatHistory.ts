import { useState, useEffect, useRef, useCallback } from 'react';
import LZString from 'lz-string';
import { ChatSession, Message } from '../types';
import { auth } from '../services/firebase';
import { 
  subscribeToUserConversations, 
  syncConversationToCloud, 
  addMessageToCloud, 
  editMessageInCloud, 
  deleteMessageFromCloud, 
  deleteConversationFromCloud, 
  renameConversationInCloud, 
  togglePinInCloud, 
  toggleSaveInCloud, 
  toggleArchiveInCloud, 
  clearAllConversationsFromCloud,
  migrateLocalHistoryToCloud
} from '../services/cloudChatSync';

const STORAGE_KEY = 'nova_chat_history';

function getInitialSessionsAndActiveId(): { initialSessions: ChatSession[]; initialActiveId: string } {
  // Check for shared session in URL first
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const sharedData = params?.get('share');
  let importedSession: ChatSession | null = null;

  if (sharedData) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(sharedData);
      if (decompressed) {
        importedSession = JSON.parse(decompressed);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    } catch (e) {
      console.error("Failed to import shared session:", e);
    }
  }

  const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  let localSessions: ChatSession[] = [];
  if (stored) {
    try {
      localSessions = JSON.parse(stored);
    } catch (e) {
      localSessions = [];
    }
  }

  const sanitizeSessions = (rawList: ChatSession[]): ChatSession[] => {
    const seenSessionIds = new Set<string>();
    const result: ChatSession[] = [];

    rawList.forEach((session, sIdx) => {
      if (!session) return;
      const sId = session.id && !seenSessionIds.has(session.id)
        ? session.id
        : `session-${Date.now()}-${sIdx}-${Math.random().toString(36).slice(2, 6)}`;
      seenSessionIds.add(sId);

      const seenMsgIds = new Set<string>();
      const sanitizedMessages = (session.messages || []).map((msg, mIdx) => {
        if (!msg) return null;
        const mId = msg.id && !seenMsgIds.has(msg.id)
          ? msg.id
          : `msg-${Date.now()}-${mIdx}-${Math.random().toString(36).slice(2, 6)}`;
        seenMsgIds.add(mId);
        return { ...msg, id: mId };
      }).filter(Boolean) as Message[];

      result.push({
        ...session,
        id: sId,
        messages: sanitizedMessages
      });
    });

    return result;
  };

  const sanitizedLocal = sanitizeSessions(localSessions);

  if (importedSession) {
    const exists = sanitizedLocal.some(s => s.id === importedSession?.id);
    const combined = exists ? sanitizedLocal : [importedSession, ...sanitizedLocal];
    return {
      initialSessions: combined,
      initialActiveId: importedSession.id
    };
  }

  // Preserve all previous conversations that have actual messages
  const pastConversationsWithMessages = sanitizedLocal.filter(s => s.messages && s.messages.length > 0);

  // Check if the very first session is already an unused fresh "New Chat" with 0 messages
  const topEmptySession = sanitizedLocal.length > 0 && (!sanitizedLocal[0].messages || sanitizedLocal[0].messages.length === 0)
    ? sanitizedLocal[0]
    : null;

  if (topEmptySession) {
    const otherSessions = sanitizedLocal.filter(s => s.id !== topEmptySession.id && s.messages && s.messages.length > 0);
    return {
      initialSessions: [topEmptySession, ...otherSessions],
      initialActiveId: topEmptySession.id
    };
  }

  const newChatId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const brandNewSession: ChatSession = {
    id: newChatId,
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  return {
    initialSessions: [brandNewSession, ...pastConversationsWithMessages],
    initialActiveId: newChatId
  };
}

export function useChatHistory(userId?: string) {
  const [initialData] = useState(() => getInitialSessionsAndActiveId());
  const [sessions, setSessions] = useState<ChatSession[]>(initialData.initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialData.initialActiveId);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const migrationAttemptedRef = useRef<boolean>(false);

  // Keep a ref to current sessions to avoid stale closures
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  // Real-time Cloud Synchronization Listener
  useEffect(() => {
    if (!userId) {
      setIsCloudSyncing(false);
      return;
    }

    setIsCloudSyncing(true);

    // 1. One-time safe migration of local history to user's cloud account upon login
    if (!migrationAttemptedRef.current) {
      migrationAttemptedRef.current = true;
      migrateLocalHistoryToCloud(userId, sessionsRef.current).catch(err => {
        console.warn("Migration notice:", err);
      });
    }

    // 2. Real-time multi-device Firestore subscription
    const unsubscribe = subscribeToUserConversations(userId, (cloudSessions) => {
      setIsCloudSyncing(false);
      if (cloudSessions.length > 0) {
        setSessions(cloudSessions);
        // Ensure active session remains valid
        setActiveSessionId(prev => {
          if (prev && cloudSessions.some(s => s.id === prev)) {
            return prev;
          }
          return cloudSessions[0].id;
        });
      }
    }, (error) => {
      setIsCloudSyncing(false);
      console.warn("Real-time cloud sync notice:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Sync to local storage as safety backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions]);

  const clearSessions = async () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const fresh: ChatSession = {
        id: newId,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setSessions([fresh]);
      setActiveSessionId(newId);

      if (userId) {
        try {
          await clearAllConversationsFromCloud(userId);
          await syncConversationToCloud(userId, fresh);
        } catch (e) {
          console.warn("Cloud clear notice:", e);
        }
      }
    }
  };

  const createNewSession = () => {
    // If current session is already empty, re-use it
    const currentActive = sessions.find(s => s.id === activeSessionId);
    if (currentActive && (!currentActive.messages || currentActive.messages.length === 0)) {
      return currentActive;
    }

    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const newSession: ChatSession = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(id);

    if (userId) {
      syncConversationToCloud(userId, newSession).catch(err => {
        console.warn("Cloud create conversation error:", err);
      });
    }

    return newSession;
  };

  const addMessage = (sessionId: string, message: Message) => {
    let messageToAdd: Message = message;

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        let msgId = message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        if (s.messages.some(m => m.id === msgId)) {
          msgId = `${msgId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        }
        messageToAdd = { ...message, id: msgId };
        const updatedMessages = [...s.messages, messageToAdd];
        let title = s.title;
        let topic = s.topic;
        let model = s.model || (message.model as any);

        if (s.messages.length === 0 && message.role === 'user') {
          title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
          const words = message.content.trim().split(/\s+/);
          topic = words.slice(0, 3).join(' ');
        }
        
        const updatedSession = { 
          ...s, 
          messages: updatedMessages, 
          title,
          topic,
          model,
          updatedAt: Date.now() 
        };

        // Cloud sync if authenticated
        if (userId) {
          syncConversationToCloud(userId, updatedSession).then(() => {
            addMessageToCloud(userId, sessionId, messageToAdd).catch(console.warn);
          }).catch(console.warn);
        }

        return updatedSession;
      }
      return s;
    }));
  };

  const renameSession = (sessionId: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    if (userId) {
      renameConversationInCloud(userId, sessionId, newTitle).catch(console.warn);
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (next.length > 0) {
          setActiveSessionId(next[0].id);
        } else {
          const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const fresh: ChatSession = {
            id: newId,
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          setActiveSessionId(newId);
          return [fresh];
        }
      }
      return next;
    });

    if (userId) {
      deleteConversationFromCloud(userId, sessionId).catch(console.warn);
    }
  };

  const togglePin = (sessionId: string) => {
    let nextState = false;
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        nextState = !s.isPinned;
        return { ...s, isPinned: nextState };
      }
      return s;
    }));
    if (userId) {
      togglePinInCloud(userId, sessionId, nextState).catch(console.warn);
    }
  };

  const toggleSave = (sessionId: string) => {
    let nextState = false;
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        nextState = !s.isSaved;
        return { ...s, isSaved: nextState };
      }
      return s;
    }));
    if (userId) {
      toggleSaveInCloud(userId, sessionId, nextState).catch(console.warn);
    }
  };

  const toggleArchive = (sessionId: string) => {
    let nextState = false;
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        nextState = !s.isArchived;
        return { ...s, isArchived: nextState };
      }
      return s;
    }));
    if (userId) {
      toggleArchiveInCloud(userId, sessionId, nextState).catch(console.warn);
    }
  };

  const deleteMessage = (sessionId: string, messageId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: s.messages.filter(m => m.id !== messageId) };
      }
      return s;
    }));
    if (userId) {
      deleteMessageFromCloud(userId, sessionId, messageId).catch(console.warn);
    }
  };

  const removeAttachment = (sessionId: string, messageId: string, attachmentUrl: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: s.messages.map(m => {
            if (m.id === messageId && m.attachments) {
              return { ...m, attachments: m.attachments.filter(a => a !== attachmentUrl) };
            }
            return m;
          }),
          updatedAt: Date.now()
        };
      }
      return s;
    }));
  };

  const editMessage = (sessionId: string, messageId: string, content: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: s.messages.map(m => m.id === messageId ? { ...m, content } : m),
          updatedAt: Date.now()
        };
      }
      return s;
    }));
    if (userId) {
      editMessageInCloud(userId, sessionId, messageId, content).catch(console.warn);
    }
  };

  const getShareLink = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return '';
    
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(session));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?share=${compressed}`;
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return {
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
  };
}
