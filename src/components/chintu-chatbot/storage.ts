import { ChatSession } from './types';

const STORAGE_KEY = 'chintu-chatbot-sessions';
const CURRENT_SESSION_KEY = 'chintu-chatbot-current';

export function getSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: ChatSession): void {
  if (typeof window === 'undefined') return;

  try {
    const sessions = getSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

export function deleteSession(sessionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const sessions = getSessions().filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
}

export function getCurrentSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch {
    return null;
  }
}

export function setCurrentSessionId(sessionId: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (sessionId) {
      localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  } catch (error) {
    console.error('Failed to set current session:', error);
  }
}

export function createNewSession(): ChatSession {
  const now = Date.now();
  return {
    id: `session-${now}`,
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
