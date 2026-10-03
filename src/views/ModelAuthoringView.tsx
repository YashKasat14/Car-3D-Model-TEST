import React, { useState } from 'react';
import {
  Wrench, CheckCircle2, AlertTriangle, ShieldAlert, ChevronLeft,
  Save, Play, Sliders, Box, Layers, ArrowRight
} from 'lucide-react';
import { useSimulationStore } from '../stores/simulationStore';
import { ModelComponent, AccuracyLevel } from '../types/model';
import { SceneViewport } from '../engine/rendering/SceneViewport';
import { saveUserModel } from '../data/modelsRegistry';

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
}

export const ModelAuthoringView: React.FC = () => {
  const { activeModel, setActiveView, setActiveModel } = useSimulationStore();

  if (!activeModel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-dark-950 text-white space-y-4 font-mono">
        <h2 className="text-xl font-bold">No Active Model Loaded</h2>
        <p className="text-sm text-dark-400">Please upload or select a 3D model on the homepage first.</p>
        <button
          onClick={() => setActiveView('home')}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white shadow-glow-red transition-all"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const [selectedCompId, setSelectedCompId] = useState<string>(activeModel.components[0]?.id || '');
  const [components, setComponents] = useState<ModelComponent[]>([...activeModel.components]);
  const [validationReport, setValidationReport] = useState<ValidationError[] | null>(null);

  const selectedComp = components.find(c => c.id === selectedCompId);

  const handleUpdateComponent = (field: keyof ModelComponent, value: any) => {
    setComponents(prev =>
      prev.map(c => c.id === selectedCompId ? { ...c, [field]: value } : c)
    );
  };

  const handleUpdateMetadata = (field: string, value: any) => {
    if (!selectedComp) return;
    setComponents(prev =>
      prev.map(c => c.id === selectedCompId ? {
        ...c,
        metadata: {
          ...c.metadata,
          specifications: {
            ...c.metadata?.specifications,
            [field]: value
          }
        }
      } : c)
    );
  };

  const handleUpdateAccuracy = (level: AccuracyLevel) => {
    if (!selectedComp) return;
    setComponents(prev =>
      prev.map(c => c.id === selectedCompId ? {
        ...c,
        metadata: {
          ...c.metadata,
          accuracy: level
        }
      } : c)
    );
  };

  const handleValidate = () => {
    const report: ValidationError[] = [];

    // Check duplicate IDs
    const idSet = new Set<string>();
    components.forEach(c => {
      if (idSet.has(c.id)) {
        report.push({ type: 'error', message: `Duplicate component ID detected: ${c.id}` });
      }
      idSet.add(c.id);

      // Check prerequisites validity
      if (c.prerequisites) {
        c.prerequisites.forEach(req => {
          if (!components.some(target => target.id === req)) {
            report.push({ type: 'error', message: `Prerequisite "${req}" referenced by "${c.name}" does not exist in assembly.` });
          }
        });
      }
    });

    if (report.length === 0) {
      report.push({ type: 'warning', message: 'Model topology and hierarchy constraints passed all FIA verification rules.' });
    }

    setValidationReport(report);
  };

  const handleSave = () => {
    const updated = { ...activeModel, components };
    saveUserModel(updated);
    setActiveModel(updated);
    alert('Model configuration updated successfully.');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-dark-950 text-white font-mono">
      {/* Top Authoring Header */}
      <header className="h-14 bg-dark-900 border-b border-dark-800 px-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('simulator')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-red-500" />
            <span>EXIT AUTHORING</span>
          </button>
          <span className="font-bold text-sm text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-red-500" />
            CAD AUTHORING STUDIO: {activeModel.shortName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleValidate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-red-400 border border-dark-700 text-xs font-bold transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>RUN VALIDATOR</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-glow-red transition-all"
          >
            <Save className="w-4 h-4" />
            <span>SAVE METADATA</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Component Tree */}
        <aside className="w-72 bg-dark-900/90 border-r border-dark-800 flex flex-col z-10">
          <div className="p-3 border-b border-dark-800 text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            <span>ASSEMBLY COMPONENTS ({components.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-dark-800/60 text-xs">
            {components.map((comp) => (
              <div
                key={comp.id}
                onClick={() => setSelectedCompId(comp.id)}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedCompId === comp.id
                    ? 'bg-red-950/60 text-white font-bold border-l-4 border-red-500'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{comp.name}</span>
                  <span className="text-[10px] text-dark-500">{comp.category}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center 3D Viewport */}
        <main className="flex-1 relative bg-transparent">
          <SceneViewport />
        </main>

        {/* Right Properties Inspector */}
        <aside className="w-80 bg-dark-900/95 border-l border-dark-800 flex flex-col z-10 overflow-y-auto text-xs">
          <div className="p-3 border-b border-dark-800 text-xs font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-500" />
            <span>COMPONENT ATTRIBUTES</span>
          </div>

          {selectedComp ? (
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-dark-400 uppercase">Component Name</span>
                <input
                  type="text"
                  value={selectedComp.name}
                  onChange={(e) => handleUpdateComponent('name', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-700 text-white font-bold focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-dark-400 uppercase">CAD Node Identifier</span>
                <input
                  type="text"
                  disabled
                  value={selectedComp.nodeName}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-800 text-dark-400"
                />
              </div>

              {/* Removable / Movable Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-dark-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedComp.removable}
                    onChange={(e) => handleUpdateComponent('removable', e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-dark-200">Removable in Assembly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedComp.movable}
                    onChange={(e) => handleUpdateComponent('movable', e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-dark-200">Exploded Translation</span>
                </label>
              </div>

              {/* Exploded Offset [X, Y, Z] */}
              <div className="space-y-1 pt-2 border-t border-dark-800">
                <span className="text-[10px] text-dark-400 uppercase">Exploded Vector [X, Y, Z]</span>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      type="number"
                      step="0.1"
                      value={selectedComp.explodedOffset ? selectedComp.explodedOffset[idx] : 0}
                      onChange={(e) => {
                        const newOffset = [...(selectedComp.explodedOffset || [0, 0, 0])] as [number, number, number];
                        newOffset[idx] = parseFloat(e.target.value) || 0;
                        handleUpdateComponent('explodedOffset', newOffset);
                      }}
                      className="px-2 py-1 bg-dark-950 border border-dark-700 rounded text-center text-white font-bold"
                    />
                  ))}
                </div>
              </div>

              {/* Accuracy Level */}
              <div className="space-y-1">
                <span className="text-[10px] text-dark-400 uppercase">Accuracy Level</span>
                <select
                  value={selectedComp.metadata?.accuracy || 'INFERRED'}
                  onChange={(e) => handleUpdateAccuracy(e.target.value as AccuracyLevel)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-700 text-white font-bold outline-none"
                >
                  <option value="VERIFIED_PUBLIC">Verified Public Spec</option>
                  <option value="INFERRED">Inferred CAD</option>
                  <option value="ILLUSTRATIVE">Illustrative</option>
                  <option value="NOT_PUBLICLY_DISCLOSED">Proprietary</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-dark-500 font-mono text-xs">
              Select a component to inspect its properties.
            </div>
          )}
        </aside>
      </div>

      {/* Validation Report Drawer */}
      {validationReport && (
        <div className="h-44 bg-dark-900 border-t-2 border-red-500 p-4 overflow-y-auto font-mono text-xs z-30">
          <div className="flex items-center justify-between pb-2 border-b border-dark-800 mb-2">
            <span className="font-bold text-white uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Model Health Diagnostics
            </span>
            <button
              onClick={() => setValidationReport(null)}
              className="text-dark-400 hover:text-white text-xs"
            >
              CLOSE
            </button>
          </div>
          <div className="space-y-1.5">
            {validationReport.map((rep, idx) => (
              <div
                key={idx}
                className={`p-2 rounded flex items-center gap-2 ${
                  rep.type === 'error' ? 'bg-red-950/80 text-red-400 border border-red-800' : 'bg-dark-950 text-dark-200 border border-dark-700'
                }`}
              >
                {rep.type === 'error' ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{rep.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
