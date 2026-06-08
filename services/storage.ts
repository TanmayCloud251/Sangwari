import { ChatSession, AppSettings, DEFAULT_SETTINGS } from '../types';
import { supabase } from './supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

export const loadSessions = async (): Promise<ChatSession[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error("Failed to load sessions from Supabase", error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    title: item.title,
    date: item.date,
    timestamp: item.timestamp,
    lastMessage: item.last_message,
    messages: item.messages
  }));
};

export const updateSession = async (session: ChatSession) => {
  const userId = await getUserId();
  if (!userId) return;

  // Ensure timestamp exists for grouping
  if (!session.timestamp) {
    session.timestamp = Date.now();
  }

  const { error } = await supabase
    .from('chat_sessions')
    .upsert({
      id: session.id,
      user_id: userId,
      title: session.title,
      date: session.date,
      timestamp: session.timestamp,
      last_message: session.lastMessage,
      messages: session.messages,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Failed to update session in Supabase", error);
  }
};

export const deleteSession = async (id: string) => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error("Failed to delete session in Supabase", error);
  }
};

export const saveSettings = async (settings: AppSettings) => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      settings: settings,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Failed to save settings to Supabase", error);
  }
};

export const loadSettings = async (): Promise<AppSettings> => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error("Failed to load settings from Supabase", error);
    }
    return DEFAULT_SETTINGS;
  }

  return data.settings as AppSettings;
};
