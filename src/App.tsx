import React from 'react';
import { useSimulationStore } from './stores/simulationStore';
import { DottedBackground } from './components/ui/DottedBackground';
import { HomeHeroView } from './views/HomeHeroView';
import { ModelLibraryView } from './views/ModelLibraryView';
import { SimulatorView } from './views/SimulatorView';
import { ModelImporterView } from './views/ModelImporterView';
import { ModelAuthoringView } from './views/ModelAuthoringView';
import { ChallengesView } from './views/ChallengesView';
import { DocumentationView } from './views/DocumentationView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const { activeView } = useSimulationStore();
  if (typeof window !== 'undefined') {
    (window as any).__AURA_STORE__ = useSimulationStore;
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-[#050508] text-white font-sans overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Dynamic Dotted Background with Flowing Red Cursor Glow */}
      <DottedBackground />

      {/* View Switcher */}
      {activeView === 'home' && <HomeHeroView />}
      {activeView === 'library' && <ModelLibraryView />}
      {activeView === 'simulator' && <SimulatorView />}
      {activeView === 'importer' && <ModelImporterView />}
      {activeView === 'authoring' && <ModelAuthoringView />}
      {activeView === 'challenges' && <ChallengesView />}
      {activeView === 'docs' && <DocumentationView />}
      {activeView === 'settings' && <SettingsView />}
    </div>
  );
};

export default App;
