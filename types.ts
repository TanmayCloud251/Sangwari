export enum AppScreen {
  AUTH = 'AUTH',
  HOME = 'HOME',
  AUDIO = 'AUDIO',
  SETTINGS = 'SETTINGS',
  HISTORY = 'HISTORY'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
}