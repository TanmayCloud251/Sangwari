
import { ChatSession, AppSettings, DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'sangwari_sessions';
const SETTINGS_KEY = 'sangwari_settings';

export const saveSessions = (sessions: ChatSession[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const loadSessions = (): ChatSession[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse sessions", e);
    return [];
  }
};

export const updateSession = (session: ChatSession) => {
  const sessions = loadSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  // Ensure timestamp exists for grouping
  if (!session.timestamp) {
    session.timestamp = Date.now();
  }
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  saveSessions(sessions);
};

export const deleteSession = (id: string) => {
  const sessions = loadSessions();
  const filtered = sessions.filter(s => s.id !== id);
  saveSessions(filtered);
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};
