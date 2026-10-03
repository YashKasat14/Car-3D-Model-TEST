import React, { Suspense, useEffect } from 'react';
import { useSimulationStore } from './stores/simulationStore';
import { DottedBackground } from './components/ui/DottedBackground';
import { HomeHeroView } from './views/HomeHeroView';

// High-Performance Code-Splitting: Lazy load heavy 3D views and CAD modules
const ModelLibraryView = React.lazy(() => import('./views/ModelLibraryView').then(m => ({ default: m.ModelLibraryView })));
const SimulatorView = React.lazy(() => import('./views/SimulatorView').then(m => ({ default: m.SimulatorView })));
const ModelImporterView = React.lazy(() => import('./views/ModelImporterView').then(m => ({ default: m.ModelImporterView })));
const ModelAuthoringView = React.lazy(() => import('./views/ModelAuthoringView').then(m => ({ default: m.ModelAuthoringView })));
const ChallengesView = React.lazy(() => import('./views/ChallengesView').then(m => ({ default: m.ChallengesView })));
const DocumentationView = React.lazy(() => import('./views/DocumentationView').then(m => ({ default: m.DocumentationView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

// Sleek Engineering Tactical Loading HUD
const ViewLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050508]/85 backdrop-blur-md text-white font-mono pointer-events-none select-none">
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" />
      <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-red-500 border-r-red-500 animate-spin" />
      <div className="w-6 h-6 rounded-full border-2 border-transparent border-b-sky-400 border-l-sky-400 animate-spin-slow" />
    </div>
    <div className="mt-4 flex items-center gap-2 text-xs font-semibold tracking-widest text-dark-200">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span>INITIALIZING 3D ENGINE MODULES...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { activeView } = useSimulationStore();

  if (typeof window !== 'undefined') {
    (window as any).__AURA_STORE__ = useSimulationStore;
  }

  // Pre-fetch heavy simulator modules in idle background time for instant 0-delay transitions
  useEffect(() => {
    const prefetchModules = () => {
      import('./views/SimulatorView').catch(() => {});
      import('./views/ModelLibraryView').catch(() => {});
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(prefetchModules, { timeout: 1500 });
      return () => (window as any).cancelIdleCallback(idleId);
    } else {
      const timer = setTimeout(prefetchModules, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#050508] text-white font-sans overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Dynamic Dotted Background with Flowing Red Cursor Glow */}
      <DottedBackground />

      {/* View Switcher with Suspense Code Splitting */}
      {activeView === 'home' && <HomeHeroView />}

      <Suspense fallback={<ViewLoadingFallback />}>
        {activeView === 'library' && <ModelLibraryView />}
        {activeView === 'simulator' && <SimulatorView />}
        {activeView === 'importer' && <ModelImporterView />}
        {activeView === 'authoring' && <ModelAuthoringView />}
        {activeView === 'challenges' && <ChallengesView />}
        {activeView === 'docs' && <DocumentationView />}
        {activeView === 'settings' && <SettingsView />}
      </Suspense>
    </div>
  );
};

export default App;
