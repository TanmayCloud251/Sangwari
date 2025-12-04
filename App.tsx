import React, { useState } from 'react';
import { AppScreen } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AuthPage from './components/AuthPage';
import AudioInterface from './components/AudioInterface';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.AUTH);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    setCurrentScreen(AppScreen.HOME);
  };

  const handleLogout = () => {
    setCurrentScreen(AppScreen.AUTH);
  };

  if (currentScreen === AppScreen.AUTH) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (currentScreen === AppScreen.AUDIO) {
    return <AudioInterface onEndCall={() => setCurrentScreen(AppScreen.HOME)} />;
  }

  return (
    <div className="flex h-screen w-full bg-cream-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar 
        currentScreen={currentScreen} 
        setScreen={setCurrentScreen} 
        onLogout={handleLogout} 
      />

      {/* Mobile Header & Sidebar Overlay */}
      <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} md:hidden`} onClick={() => setIsMobileMenuOpen(false)}>
         <div className={`absolute left-0 top-0 h-full bg-white w-64 transform transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
             <Sidebar currentScreen={currentScreen} setScreen={(s) => {setCurrentScreen(s); setIsMobileMenuOpen(false);}} onLogout={handleLogout} />
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-cream-100 border-b border-orange-100">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="text-gray-700" />
                </button>
                <span className="font-bold text-gray-800">Sangwari</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white text-xs">SG</div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
            {currentScreen === AppScreen.HOME && (
                <ChatInterface onStartAudio={() => setCurrentScreen(AppScreen.AUDIO)} />
            )}
            
            {currentScreen === AppScreen.HISTORY && (
                <div className="p-8 flex items-center justify-center h-full text-gray-400">
                    <p>History feature coming soon, Sangwari!</p>
                </div>
            )}

            {currentScreen === AppScreen.SETTINGS && (
                <div className="p-8 flex items-center justify-center h-full text-gray-400">
                    <p>Settings coming soon!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;