
export enum AppScreen {
  AUTH = 'AUTH',
  HOME = 'HOME',
  AUDIO = 'AUDIO',
  SETTINGS = 'SETTINGS',
  HISTORY = 'HISTORY'
}

export interface Attachment {
  mimeType: string;
  data: string; // base64
  fileName?: string;
  url?: string; // for display
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachment?: Attachment;
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string; // "DD MMM YYYY"
  timestamp: number;
  lastMessage?: string;
  messages: Message[];
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'custom';
  fontFamily: string;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  sidebarPosition: 'top' | 'right' | 'bottom' | 'left';
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontFamily: 'Outfit',
  fontSize: 'base',
  primaryColor: '#FF9800', // Brand Orange
  secondaryColor: '#0D9488', // Teal
  backgroundColor: '#FFFDF5', // Cream 50
  surfaceColor: '#FFF8E1', // Cream 100
  textColor: '#1F2937', // Gray 800
  sidebarPosition: 'top',
};

export const DARK_SETTINGS: AppSettings = {
  theme: 'dark',
  fontFamily: 'Outfit',
  fontSize: 'base',
  primaryColor: '#FF9800',
  secondaryColor: '#2DD4BF',
  backgroundColor: '#111827', // Gray 900
  surfaceColor: '#1F2937', // Gray 800
  textColor: '#F9FAFB', // Gray 50
  sidebarPosition: 'top',
};
