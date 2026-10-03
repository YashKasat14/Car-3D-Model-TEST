import React from 'react';
import {
  Settings, ChevronLeft, Monitor, Volume2, Shield, Eye,
  Sparkles, Check, Trash2
} from 'lucide-react';
import { useSimulationStore, GraphicsProfile } from '../stores/simulationStore';
import { soundEngine } from '../engine/audio/SoundEngine';

export const SettingsView: React.FC = () => {
  const {
    setActiveView,
    graphicsProfile,
    setGraphicsProfile,
    setNotification
  } = useSimulationStore();

  const handleClearCache = () => {
    localStorage.removeItem('aura_3d_session_save');
    setNotification('Saved session vault cleared.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="relative min-h-screen px-6 py-8 sm:px-12 z-10 flex flex-col max-w-4xl mx-auto space-y-8 font-mono text-xs text-white">
      {/* Header */}
      <div className="border-b border-red-500/20 pb-4">
        <button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-1.5 text-xs font-medium text-dark-300 hover:text-white mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-red-500" />
          <span>BACK TO HOME</span>
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
          SIMULATOR SETTINGS & PREFERENCES
        </h2>
        <p className="text-xs sm:text-sm text-dark-400 font-sans mt-1">
          Graphics profiles, lighting environments, audio volumes, and local privacy controls.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Graphics Rendering Profile */}
        <div className="bg-dark-900/90 rounded-2xl border border-red-500/25 p-6 space-y-4 shadow-premium-dark">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider font-sans text-sm">
            <Monitor className="w-4 h-4 text-red-500" />
            <span>Graphics Quality Profile</span>
          </div>
          <p className="text-dark-300 font-sans text-xs">
            Adjust real-time WebGL shadow map resolution, antialiasing passes, and shader complexity. Switches seamlessly without reload.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'performance', label: 'PERFORMANCE', desc: 'Fastest frame rate. Minimal shadows.' },
              { id: 'balanced', label: 'BALANCED', desc: '60 FPS target with soft contact shadows.' },
              { id: 'cinematic', label: 'CINEMATIC', desc: 'Maximum fidelity 2K shadow maps & MSAA.' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setGraphicsProfile(p.id as GraphicsProfile)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  graphicsProfile === p.id
                    ? 'border-red-500 bg-red-950/60 shadow-glow-red text-white'
                    : 'border-dark-700 bg-dark-950/60 text-dark-400 hover:border-dark-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{p.label}</span>
                    {graphicsProfile === p.id && <Check className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-[11px] font-sans text-dark-400 mt-1">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Audio Engine Volumes */}
        <div className="bg-dark-900/90 rounded-2xl border border-red-500/25 p-6 space-y-4 shadow-premium-dark">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider font-sans text-sm">
            <Volume2 className="w-4 h-4 text-red-500" />
            <span>Synthetic Audio Acoustics</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-dark-400 w-24">MASTER VOL:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              defaultValue={soundEngine.getVolume()}
              onChange={(e) => soundEngine.setVolume(Number(e.target.value))}
              className="w-full max-w-xs accent-red-600 h-1.5 bg-dark-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* 3. Session Storage & Privacy */}
        <div className="bg-dark-900/90 rounded-2xl border border-red-500/25 p-6 space-y-4 shadow-premium-dark">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider font-sans text-sm">
            <Shield className="w-4 h-4 text-red-500" />
            <span>Local Privacy & Session Storage</span>
          </div>
          <p className="text-dark-300 font-sans text-xs">
            All imported 3D models, component metadata, and assembly modifications are strictly processed on client-side memory or local browser storage.
          </p>

          <div className="pt-2">
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-red-400 border border-dark-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>CLEAR LOCAL SESSION CACHE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
