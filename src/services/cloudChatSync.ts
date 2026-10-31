import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ChatSession, Message } from '../types';

/**
 * Real-time listener for all conversations belonging to the user.
 * Dispatches updated list of ChatSessions with their messages.
 */
export function subscribeToUserConversations(
  userId: string,
  onUpdate: (sessions: ChatSession[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) return () => {};

  const conversationsPath = `users/${userId}/conversations`;
  const convRef = collection(db, 'users', userId, 'conversations');

  // Maintain active message listeners for each conversation
  const messageUnsubscribers: Record<string, () => void> = {};
  const sessionsMap: Record<string, ChatSession> = {};

  const unsubscribeConversations = onSnapshot(convRef, (snapshot) => {
    const activeDocIds = new Set<string>();

    snapshot.docChanges().forEach((change) => {
      const convId = change.doc.id;
      activeDocIds.add(convId);

      if (change.type === 'removed') {
        if (messageUnsubscribers[convId]) {
          messageUnsubscribers[convId]();
          delete messageUnsubscribers[convId];
        }
        delete sessionsMap[convId];
      } else {
        const data = change.doc.data();
        const existing = sessionsMap[convId];

        sessionsMap[convId] = {
          id: convId,
          title: data.title || 'New Chat',
          model: data.model,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          isPinned: data.isPinned || false,
          isSaved: data.isSaved || false,
          isArchived: data.isArchived || false,
          messages: existing?.messages || []
        };

        // If not already listening to messages for this conversation, attach listener
        if (!messageUnsubscribers[convId]) {
          const messagesPath = `users/${userId}/conversations/${convId}/messages`;
          const msgRef = collection(db, 'users', userId, 'conversations', convId, 'messages');
          
          messageUnsubscribers[convId] = onSnapshot(msgRef, (msgSnapshot) => {
            const msgs: Message[] = [];
            msgSnapshot.forEach(mDoc => {
              const mData = mDoc.data();
              msgs.push({
                id: mDoc.id,
                role: mData.role,
                content: mData.content,
                timestamp: mData.timestamp || Date.now(),
                model: mData.model,
                type: mData.type || 'text',
                attachments: mData.attachments || [],
                metadata: mData.metadata || {}
              });
            });

            // Sort chronologically by timestamp
            msgs.sort((a, b) => a.timestamp - b.timestamp);

            if (sessionsMap[convId]) {
              sessionsMap[convId].messages = msgs;
              emitSortedSessions();
            }
          }, (err) => {
            console.warn(`Messages sync error for ${convId}:`, err);
          });
        }
      }
    });

    // Cleanup any removed conversations
    Object.keys(messageUnsubscribers).forEach(id => {
      if (!snapshot.docs.some(d => d.id === id)) {
        messageUnsubscribers[id]();
        delete messageUnsubscribers[id];
        delete sessionsMap[id];
      }
    });

    emitSortedSessions();
  }, (err) => {
    console.error("Conversations sync error:", err);
    if (onError) onError(err);
    handleFirestoreError(err, OperationType.LIST, conversationsPath);
  });

  function emitSortedSessions() {
    const list = Object.values(sessionsMap);
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    onUpdate(list);
  }

  return () => {
    unsubscribeConversations();
    Object.values(messageUnsubscribers).forEach(unsub => unsub());
  };
}

/**
 * Save / Create a new conversation and its messages to Cloud Firestore
 */
export async function syncConversationToCloud(userId: string, session: ChatSession): Promise<void> {
  if (!userId || !session || !session.id) return;
  const path = `users/${userId}/conversations/${session.id}`;

  try {
    const convRef = doc(db, 'users', userId, 'conversations', session.id);
    await setDoc(convRef, {
      id: session.id,
      userId,
      title: session.title || 'New Chat',
      model: session.model || 'gemini-3-flash-preview',
      createdAt: session.createdAt || Date.now(),
      updatedAt: session.updatedAt || Date.now(),
      isPinned: !!session.isPinned,
      isSaved: !!session.isSaved,
      isArchived: !!session.isArchived,
      messageCount: session.messages?.length || 0
    }, { merge: true });

    // Sync any messages present
    if (session.messages && session.messages.length > 0) {
      for (const msg of session.messages) {
        await addMessageToCloud(userId, session.id, msg);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Add an individual message to a conversation in Cloud Firestore
 */
export async function addMessageToCloud(userId: string, conversationId: string, message: Message): Promise<void> {
  if (!userId || !conversationId || !message || !message.id) return;
  const msgPath = `users/${userId}/conversations/${conversationId}/messages/${message.id}`;

  try {
    const msgRef = doc(db, 'users', userId, 'conversations', conversationId, 'messages', message.id);
    await setDoc(msgRef, {
      id: message.id,
      conversationId,
      userId,
      role: message.role,
      content: message.content || '',
      timestamp: message.timestamp || Date.now(),
      model: message.model || 'gemini-3-flash-preview',
      type: message.type || 'text',
      attachments: message.attachments || [],
      metadata: message.metadata || {}
    }, { merge: true });

    // Update conversation's updatedAt
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await setDoc(convRef, {
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, msgPath);
  }
}

/**
 * Edit a message in Cloud Firestore
 */
export async function editMessageInCloud(
  userId: string, 
  conversationId: string, 
  messageId: string, 
  content: string
): Promise<void> {
  if (!userId || !conversationId || !messageId) return;
  const path = `users/${userId}/conversations/${conversationId}/messages/${messageId}`;
  try {
    const msgRef = doc(db, 'users', userId, 'conversations', conversationId, 'messages', messageId);
    await setDoc(msgRef, {
      content,
      timestamp: Date.now()
    }, { merge: true });

    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await setDoc(convRef, { updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Delete a message from Cloud Firestore
 */
export async function deleteMessageFromCloud(userId: string, conversationId: string, messageId: string): Promise<void> {
  if (!userId || !conversationId || !messageId) return;
  const path = `users/${userId}/conversations/${conversationId}/messages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'conversations', conversationId, 'messages', messageId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Rename a conversation in Cloud Firestore
 */
export async function renameConversationInCloud(userId: string, conversationId: string, newTitle: string): Promise<void> {
  if (!userId || !conversationId) return;
  const path = `users/${userId}/conversations/${conversationId}`;
  try {
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await setDoc(convRef, {
      title: newTitle.trim(),
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Toggle Pin state in Cloud Firestore
 */
export async function togglePinInCloud(userId: string, conversationId: string, isPinned: boolean): Promise<void> {
  if (!userId || !conversationId) return;
  const path = `users/${userId}/conversations/${conversationId}`;
  try {
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await setDoc(convRef, { isPinned, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Toggle Save state in Cloud Firestore
 */
export async function toggleSaveInCloud(userId: string, conversationId: string, isSaved: boolean): Promise<void> {
  if (!userId || !conversationId) return;
  const path = `users/${userId}/conversations/${conversationId}`;
  try {
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await setDoc(convRef, { isSaved, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Toggle Archive state in Cloud Firestore
 */
export async function toggleArchiveInCloud(userId: string, conversationId: string, isArchived: boolean): Promise<void> {
  if (!userId || !conversationId) return;
  const path = `users/${userId}/conversations/${conversationId}`;
  try {
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await setDoc(convRef, { isArchived, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Delete a conversation and all its messages permanently from Cloud Firestore
 */
export async function deleteConversationFromCloud(userId: string, conversationId: string): Promise<void> {
  if (!userId || !conversationId) return;
  const path = `users/${userId}/conversations/${conversationId}`;

  try {
    // 1. Delete all messages inside subcollection
    const msgRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
    const msgSnap = await getDocs(msgRef);
    for (const mDoc of msgSnap.docs) {
      await deleteDoc(mDoc.ref);
    }
    // 2. Delete the conversation document
    await deleteDoc(doc(db, 'users', userId, 'conversations', conversationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Clear all conversations for the user in Cloud Firestore
 */
export async function clearAllConversationsFromCloud(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const convRef = collection(db, 'users', userId, 'conversations');
    const snap = await getDocs(convRef);
    for (const cDoc of snap.docs) {
      await deleteConversationFromCloud(userId, cDoc.id);
    }
  } catch (err) {
    console.warn("Error clearing all conversations from cloud:", err);
  }
}

/**
 * Safe migration of existing local conversations into Cloud Firestore.
 * Ensures existing chat history from localStorage is uploaded without duplicates.
 */
export async function migrateLocalHistoryToCloud(userId: string, localSessions: ChatSession[]): Promise<number> {
  if (!userId || !localSessions || localSessions.length === 0) return 0;

  let migratedCount = 0;
  try {
    for (const session of localSessions) {
      // Only migrate sessions that have messages
      if (!session.messages || session.messages.length === 0) continue;

      const convRef = doc(db, 'users', userId, 'conversations', session.id);
      const docSnap = await getDoc(convRef);

      if (!docSnap.exists()) {
        await syncConversationToCloud(userId, session);
        migratedCount++;
      }
    }
    console.log(`[Zinnia Cloud Sync] Migrated ${migratedCount} local conversation(s) to user cloud account.`);
  } catch (err) {
    console.warn("[Zinnia Cloud Sync] Migration check notice:", err);
  }
  return migratedCount;
}
