
import React, { useState, useEffect } from 'react';
import { AppScreen, ChatSession, Message, AppSettings, DEFAULT_SETTINGS } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AuthPage from './components/AuthPage';
import AudioInterface from './components/AudioInterface';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import { Menu } from 'lucide-react';
import { loadSessions, updateSession, loadSettings, saveSettings } from './services/storage';
import { supabase } from './services/supabase';

const DEFAULT_WELCOME_MSG: Message = {
  id: 'welcome-1',
  role: 'model',
  text: 'Jai Johar! Main Sangwari haan. Tumar ka sewa kar sakat ho?',
  timestamp: Date.now()
};

const createNewSession = (): ChatSession => ({
  id: Date.now().toString(),
  title: 'Naya Batchit',
  date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  timestamp: Date.now(),
  messages: [DEFAULT_WELCOME_MSG]
});

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.AUTH);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [session, setSession] = useState<any>(null);

  // Supabase session handling
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        handleLogin();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        handleLogin();
      } else {
        setCurrentScreen(AppScreen.AUTH);
        setActiveSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Apply settings to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--bg-color', settings.backgroundColor);
    root.style.setProperty('--surface-color', settings.surfaceColor);
    root.style.setProperty('--text-color', settings.textColor);
    root.style.setProperty('--font-main', settings.fontFamily);
    
    const sizeMap = { sm: '14px', base: '16px', lg: '18px', xl: '20px' };
    root.style.setProperty('--font-size-base', sizeMap[settings.fontSize]);

    document.body.style.fontFamily = `'${settings.fontFamily}', sans-serif`;
    document.body.style.fontSize = sizeMap[settings.fontSize];
    document.body.style.backgroundColor = settings.backgroundColor;
    document.body.style.color = settings.textColor;

    saveSettings(settings);
  }, [settings]);

  // Load history on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
  }, []);

  const handleLogin = () => {
    const loaded = loadSessions();
    if (loaded.length > 0) {
        setActiveSession(loaded[0]);
    } else {
        const newSess = createNewSession();
        setActiveSession(newSess);
        updateSession(newSess);
        setSessions([newSess]);
    }
    setCurrentScreen(AppScreen.HOME);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNewChat = () => {
    const newSess = createNewSession();
    setActiveSession(newSess);
    updateSession(newSess);
    setSessions(prev => [newSess, ...prev]);
    setCurrentScreen(AppScreen.HOME);
  };

  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
        setActiveSession(session);
        setCurrentScreen(AppScreen.HOME);
    }
  };

  const refreshSessions = () => {
    setSessions(loadSessions());
  };

  const handleUpdateSession = (updated: ChatSession) => {
    setActiveSession(updated);
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  if (currentScreen === AppScreen.AUTH) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (currentScreen === AppScreen.AUDIO) {
    return <AudioInterface onEndCall={() => setCurrentScreen(AppScreen.HOME)} />;
  }

  // Determine flex container direction and order for desktop
  const getFlexDirection = () => {
    if (settings.sidebarPosition === 'top') return 'flex-col';
    if (settings.sidebarPosition === 'bottom') return 'flex-col-reverse';
    if (settings.sidebarPosition === 'left') return 'flex-row';
    if (settings.sidebarPosition === 'right') return 'flex-row-reverse';
    return 'flex-col';
  };

  // Determine animation class based on sidebar position
  const getTransitionClass = () => {
    if (settings.sidebarPosition === 'left' || settings.sidebarPosition === 'right') {
      return 'animate-screen-up';
    }
    return 'animate-screen-left';
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-all duration-300 bg-[var(--bg-color)] ${getFlexDirection()}`}>
      {/* Desktop Sidebar */}
      <Sidebar 
        currentScreen={currentScreen} 
        position={settings.sidebarPosition}
        setScreen={(s) => {
            if (s === AppScreen.HOME && !activeSession) {
                handleNewChat();
            } else {
                setCurrentScreen(s);
            }
        }} 
        onLogout={handleLogout} 
        onNewChat={handleNewChat}
      />

      {/* Mobile Header (Always Top) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--surface-color)] border-b border-[var(--primary-color)]/10 z-30">
          <div className="flex items-center gap-2">
              <button onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="text-[var(--text-color)]" />
              </button>
              <span className="font-bold text-[var(--text-color)]">Sangwari</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white text-xs">SG</div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className={`fixed inset-0 bg-black/50 z-50 transition-opacity md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
         <div className={`absolute left-0 top-0 h-full bg-[var(--surface-color)] w-64 transform transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
             <Sidebar 
                currentScreen={currentScreen} 
                position="left" // Always left for mobile drawer
                setScreen={(s) => {setCurrentScreen(s); setIsMobileMenuOpen(false);}} 
                onLogout={handleLogout} 
                onNewChat={() => {handleNewChat(); setIsMobileMenuOpen(false);}}
             />
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Using a key on the wrapper ensures the div re-mounts/re-renders on screen change, triggering CSS animations */}
        <div key={currentScreen} className={`flex-1 relative overflow-hidden ${getTransitionClass()}`}>
            {currentScreen === AppScreen.HOME && activeSession && (
                <ChatInterface 
                    session={activeSession} 
                    onUpdateSession={handleUpdateSession}
                    onStartAudio={() => setCurrentScreen(AppScreen.AUDIO)} 
                />
            )}
            
            {currentScreen === AppScreen.HISTORY && (
                <HistoryView 
                    sessions={sessions} 
                    onSelectSession={handleSelectSession} 
                    onRefresh={refreshSessions}
                />
            )}

            {currentScreen === AppScreen.SETTINGS && (
                <SettingsView 
                  settings={settings} 
                  onUpdateSettings={setSettings} 
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
