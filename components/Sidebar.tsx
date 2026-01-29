
import React from 'react';
import { AppScreen } from '../types';
import { Home, History, Settings, LogOut, MessageSquare, Plus, User } from 'lucide-react';

interface SidebarProps {
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  onLogout: () => void;
  onNewChat: () => void;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, setScreen, onLogout, onNewChat, position = 'left' }) => {
  const isHorizontal = position === 'top' || position === 'bottom';
  const isVertical = position === 'left' || position === 'right';

  // Base container styles
  let containerClasses = "flex bg-[var(--surface-color)] border-[var(--primary-color)]/10 shadow-sm transition-all duration-300 hidden md:flex z-50";
  
  if (isHorizontal) {
    containerClasses += ` w-[95%] mx-auto mt-2 mb-2 px-6 py-3 flex-row items-center justify-between border `;
    if (position === 'top') {
      containerClasses += " rounded-b-3xl rounded-t-xl";
    } else {
      containerClasses += " rounded-t-3xl rounded-b-xl";
    }
  } else {
    containerClasses += ` w-64 h-full flex-col border-r `;
  }

  const navGroupClasses = isHorizontal
    ? "flex flex-row items-center gap-1 bg-[var(--bg-color)]/50 p-1.5 rounded-2xl border border-[var(--primary-color)]/5"
    : "flex-1 px-4 py-4 space-y-2";

  const btnClasses = (screen: AppScreen) => {
    const isActive = currentScreen === screen;
    const base = "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm whitespace-nowrap";
    const activeStyles = isActive 
      ? 'bg-[var(--primary-color)] text-white shadow-md' 
      : 'text-[var(--text-color)] opacity-60 hover:opacity-100 hover:bg-[var(--primary-color)]/10';
    return `${base} ${activeStyles}`;
  };

  const standaloneBtnClasses = "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm bg-[var(--bg-color)] border border-[var(--primary-color)]/10 text-[var(--text-color)] shadow-sm hover:border-[var(--primary-color)]/30 active:scale-95";

  return (
    <div className={containerClasses}>
      {/* Profile Section (Standalone) */}
      <div className={`flex items-center gap-3 ${isHorizontal ? '' : 'p-6 mb-2 border-b border-[var(--primary-color)]/5'}`}>
        <button className={standaloneBtnClasses}>
          <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
               <span className="text-[var(--primary-color)] font-bold text-[8px]">SG</span>
          </div>
          {!isHorizontal && (
            <div className="text-left">
                <h1 className="text-xs leading-none">Sangwari</h1>
                <p className="opacity-50 text-[8px]">Profile</p>
            </div>
          )}
          {isHorizontal && <span className="hidden lg:inline text-xs">Sangwari</span>}
        </button>
      </div>

      {/* Middle Controller Group */}
      <div className={navGroupClasses}>
         {isVertical && (
           <div className="mb-4 px-2">
              <button 
                  onClick={onNewChat}
                  className="w-full bg-[var(--primary-color)] hover:opacity-90 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-black shadow-lg transition-all active:scale-95 mb-4"
              >
                  <Plus size={18} />
                  <span>NAYA BATCHIT</span>
              </button>
           </div>
         )}
         
         {isHorizontal && (
           <button 
              onClick={onNewChat}
              className="mr-2 bg-[var(--primary-color)] hover:opacity-90 text-white rounded-xl p-2.5 shadow-md transition-all active:rotate-90"
              title="Naya Batchit"
           >
              <Plus size={20} />
           </button>
         )}

         <button onClick={() => setScreen(AppScreen.HOME)} className={btnClasses(AppScreen.HOME)}>
            <Home size={18} />
            <span className={isHorizontal ? "hidden lg:inline" : ""}>Home</span>
         </button>

         <button onClick={() => setScreen(AppScreen.HISTORY)} className={btnClasses(AppScreen.HISTORY)}>
            <History size={18} />
            <span className={isHorizontal ? "hidden lg:inline" : ""}>History</span>
         </button>

         <button onClick={() => setScreen(AppScreen.SETTINGS)} className={btnClasses(AppScreen.SETTINGS)}>
            <Settings size={18} />
            <span className={isHorizontal ? "hidden lg:inline" : ""}>Settings</span>
         </button>
      </div>

      {/* Log Out (Standalone) */}
      <div className={isHorizontal ? "" : "p-4 border-t border-[var(--primary-color)]/10"}>
        <button 
          onClick={onLogout} 
          className={`${standaloneBtnClasses} border-red-500/10 text-red-500 hover:bg-red-50 hover:border-red-500/30`}
        >
            <LogOut size={16} />
            <span className={isHorizontal ? "hidden lg:inline" : ""}>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
