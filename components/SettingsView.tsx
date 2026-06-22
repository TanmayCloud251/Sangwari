
import React from 'react';
import { AppSettings, DEFAULT_SETTINGS, DARK_SETTINGS } from '../types';
import { Sun, Moon, Type, Palette, Layout, RotateCcw, Monitor, Volume2 } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const handlePreset = (type: 'light' | 'dark') => {
    onUpdateSettings({ 
      ...(type === 'light' ? DEFAULT_SETTINGS : DARK_SETTINGS),
      sidebarPosition: settings.sidebarPosition // Preserve current position
    });
  };

  const updateField = (field: keyof AppSettings, value: string) => {
    onUpdateSettings({ ...settings, [field]: value, theme: 'custom' });
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-[var(--bg-color)]">
      <div className="max-w-2xl mx-auto space-y-8 pb-10">
        <header>
          <h2 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-3">
            <Layout className="text-[var(--primary-color)]" />
            Settings (Sajaawat)
          </h2>
          <p className="opacity-60 text-[var(--text-color)] mt-1">Sangwari la apan hisaab se sajaao.</p>
        </header>

        {/* Sidebar Placement */}
        <section className="bg-[var(--surface-color)] p-6 rounded-3xl border border-[var(--primary-color)]/10 shadow-sm space-y-4">
          <h3 className="font-bold text-[var(--text-color)] flex items-center gap-2">
            <Monitor size={18} />
            Sidebar Placement
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['top', 'bottom', 'left', 'right'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => onUpdateSettings({ ...settings, sidebarPosition: pos })}
                className={`py-3 px-4 rounded-xl border-2 transition-all capitalize text-sm font-bold ${settings.sidebarPosition === pos ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)]' : 'border-transparent bg-[var(--bg-color)] text-[var(--text-color)] opacity-60'}`}
              >
                {pos}
              </button>
            ))}
          </div>
        </section>

        {/* Theme Presets */}
        <section className="bg-[var(--surface-color)] p-6 rounded-3xl border border-[var(--primary-color)]/10 shadow-sm space-y-4">
          <h3 className="font-bold text-[var(--text-color)] flex items-center gap-2">
            <Sun size={18} />
            Theme Mode
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handlePreset('light')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${settings.theme === 'light' ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5' : 'border-transparent bg-[var(--bg-color)]'}`}
            >
              <Sun className="text-orange-500" />
              <span className="text-sm font-medium text-[var(--text-color)]">Light Mode</span>
            </button>
            <button 
              onClick={() => handlePreset('dark')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${settings.theme === 'dark' ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5' : 'border-transparent bg-[#111827]'}`}
            >
              <Moon className="text-indigo-400" />
              <span className="text-sm font-medium text-[var(--text-color)]">Dark Mode</span>
            </button>
          </div>
        </section>

        {/* Gemini Voice Companion */}
        <section className="bg-[var(--surface-color)] p-6 rounded-3xl border border-[var(--primary-color)]/10 shadow-sm space-y-4">
          <h3 className="font-bold text-[var(--text-color)] flex items-center gap-2">
            <Volume2 size={18} />
            Sangwari Voice (Awaaz)
          </h3>
          <div>
            <label className="text-xs uppercase tracking-wider font-bold opacity-50 block mb-2 text-[var(--text-color)]">Select Voice Companion</label>
            <select 
              value={settings.voiceName || 'Aoede'}
              onChange={(e) => onUpdateSettings({ ...settings, voiceName: e.target.value })}
              className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-xl border border-[var(--primary-color)]/10 outline-none"
            >
              <option value="Aoede">Aoede (Female - Clear & Expressive)</option>
              <option value="Puck">Puck (Male - Playful & Energetic)</option>
              <option value="Charon">Charon (Male - Soft & Gentle)</option>
              <option value="Fenrir">Fenrir (Male - Deep & Warm)</option>
              <option value="Kore">Kore (Male - Standard & Calm)</option>
            </select>
          </div>
        </section>

        {/* Typography */}
        <section className="bg-[var(--surface-color)] p-6 rounded-3xl border border-[var(--primary-color)]/10 shadow-sm space-y-4">
          <h3 className="font-bold text-[var(--text-color)] flex items-center gap-2">
            <Type size={18} />
            Font Styles
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-bold opacity-50 block mb-2 text-[var(--text-color)]">Font Family</label>
              <select 
                value={settings.fontFamily}
                onChange={(e) => updateField('fontFamily', e.target.value)}
                className="w-full bg-[var(--bg-color)] text-[var(--text-color)] p-3 rounded-xl border border-[var(--primary-color)]/10 outline-none"
              >
                <option value="Outfit">Outfit (Standard)</option>
                <option value="Inter">Inter (Clean)</option>
                <option value="Georgia">Georgia (Classic Serif)</option>
                <option value="monospace">Courier (Code)</option>
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold opacity-50 block mb-2 text-[var(--text-color)]">Font Size</label>
              <div className="flex gap-2">
                {(['sm', 'base', 'lg', 'xl'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => onUpdateSettings({ ...settings, fontSize: size, theme: 'custom' })}
                    className={`flex-1 py-2 rounded-xl border transition-all uppercase text-xs font-bold ${settings.fontSize === size ? 'bg-[var(--primary-color)] text-white border-transparent' : 'bg-[var(--bg-color)] text-[var(--text-color)] border-[var(--primary-color)]/10'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="bg-[var(--surface-color)] p-6 rounded-3xl border border-[var(--primary-color)]/10 shadow-sm space-y-4">
          <h3 className="font-bold text-[var(--text-color)] flex items-center gap-2">
            <Palette size={18} />
            Custom Colors
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold opacity-50 block mb-2 text-[var(--text-color)]">Primary Accent</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={settings.primaryColor} 
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg overflow-hidden border-none cursor-pointer"
                />
                <input 
                  type="text" 
                  value={settings.primaryColor} 
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="flex-1 bg-[var(--bg-color)] text-[var(--text-color)] p-2 rounded-lg border border-[var(--primary-color)]/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold opacity-50 block mb-2 text-[var(--text-color)]">Background</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={settings.backgroundColor} 
                  onChange={(e) => updateField('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded-lg overflow-hidden border-none cursor-pointer"
                />
                <input 
                  type="text" 
                  value={settings.backgroundColor} 
                  onChange={(e) => updateField('backgroundColor', e.target.value)}
                  className="flex-1 bg-[var(--bg-color)] text-[var(--text-color)] p-2 rounded-lg border border-[var(--primary-color)]/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold opacity-50 block mb-2 text-[var(--text-color)]">Secondary Accent</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={settings.secondaryColor} 
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg overflow-hidden border-none cursor-pointer"
                />
                <input 
                  type="text" 
                  value={settings.secondaryColor} 
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                  className="flex-1 bg-[var(--bg-color)] text-[var(--text-color)] p-2 rounded-lg border border-[var(--primary-color)]/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold opacity-50 block mb-2 text-[var(--text-color)]">Text Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={settings.textColor} 
                  onChange={(e) => updateField('textColor', e.target.value)}
                  className="w-10 h-10 rounded-lg overflow-hidden border-none cursor-pointer"
                />
                <input 
                  type="text" 
                  value={settings.textColor} 
                  onChange={(e) => updateField('textColor', e.target.value)}
                  className="flex-1 bg-[var(--bg-color)] text-[var(--text-color)] p-2 rounded-lg border border-[var(--primary-color)]/10 text-xs"
                />
              </div>
            </div>
          </div>
        </section>

        <button 
          onClick={() => onUpdateSettings(DEFAULT_SETTINGS)}
          className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-[var(--primary-color)]/20 text-[var(--primary-color)] font-bold hover:bg-[var(--primary-color)]/5 transition-all"
        >
          <RotateCcw size={18} />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
