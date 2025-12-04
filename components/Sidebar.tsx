import React from 'react';
import { AppScreen } from '../types';
import { Home, History, Settings, LogOut, MessageSquare, Plus } from 'lucide-react';

interface SidebarProps {
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, setScreen, onLogout }) => {
  return (
    <div className="w-64 h-full bg-cream-100 flex flex-col border-r border-orange-100 hidden md:flex">
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
             <span className="text-brand-orange font-bold text-xs">SG</span>
        </div>
        <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight">Sangwari</h1>
            <p className="text-gray-500 text-xs">Your Chhattisgarhi Friend</p>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 px-4 py-4 space-y-2">
         
         <div className="mb-6">
            <button 
                onClick={() => setScreen(AppScreen.HOME)}
                className="w-full bg-brand-orange hover:bg-orange-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium shadow-md transition-colors"
            >
                <Plus size={18} />
                <span>New Chat</span>
            </button>
         </div>

         <button 
            onClick={() => setScreen(AppScreen.HOME)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === AppScreen.HOME ? 'bg-orange-200/50 text-orange-800 font-medium' : 'text-gray-600 hover:bg-orange-100/50'}`}
         >
            <Home size={20} />
            <span>Home</span>
         </button>

         <button 
            onClick={() => setScreen(AppScreen.HISTORY)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === AppScreen.HISTORY ? 'bg-orange-200/50 text-orange-800 font-medium' : 'text-gray-600 hover:bg-orange-100/50'}`}
         >
            <History size={20} />
            <span>Chat History</span>
         </button>

         <button 
            onClick={() => setScreen(AppScreen.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentScreen === AppScreen.SETTINGS ? 'bg-orange-200/50 text-orange-800 font-medium' : 'text-gray-600 hover:bg-orange-100/50'}`}
         >
            <Settings size={20} />
            <span>Settings</span>
         </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-orange-100">
        <button onClick={onLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-500 transition-colors px-4 py-2 w-full">
            <LogOut size={20} />
            <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;