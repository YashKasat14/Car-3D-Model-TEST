import React, { useState } from 'react';
import {
  BookOpen, ChevronLeft, Keyboard, Hand, FileCode, ShieldCheck,
  Cpu, Layers, Wrench, AlertCircle
} from 'lucide-react';
import { useSimulationStore } from '../stores/simulationStore';

export const DocumentationView: React.FC = () => {
  const { setActiveView } = useSimulationStore();
  const [activeDocTab, setActiveDocTab] = useState<'architecture' | 'shortcuts' | 'gestures' | 'schema' | 'provenance'>('shortcuts');

  return (
    <div className="relative min-h-screen px-6 py-8 sm:px-12 z-10 flex flex-col max-w-5xl mx-auto space-y-8 text-white">
      {/* Header */}
      <div className="border-b border-red-500/20 pb-4">
        <button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-1.5 text-xs font-mono font-medium text-dark-300 hover:text-white mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-red-500" />
          <span>BACK TO HOME</span>
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
          DOCUMENTATION & TECHNICAL MANUAL
        </h2>
        <p className="text-xs sm:text-sm text-dark-400 font-sans mt-1">
          Engineering manuals, control schemes, universal schema specifications, and asset provenance.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-red-500/20 pb-2 font-mono text-xs">
        {[
          { id: 'shortcuts', label: 'KEYBOARD CONTROLS', icon: Keyboard },
          { id: 'gestures', label: 'SPATIAL GESTURES', icon: Hand },
          { id: 'architecture', label: 'SYSTEM ARCHITECTURE', icon: Cpu },
          { id: 'schema', label: 'MODEL FORMAT SPEC', icon: FileCode },
          { id: 'provenance', label: 'ASSET PROVENANCE', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDocTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all border ${
                activeDocTab === tab.id
                  ? 'bg-red-600 text-white font-bold border-red-500 shadow-glow-red'
                  : 'bg-dark-900 hover:bg-dark-800 text-dark-300 hover:text-white border-dark-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-red-500" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Keyboard Controls */}
      {activeDocTab === 'shortcuts' && (
        <div className="bg-dark-900/90 rounded-2xl border border-red-500/25 p-6 space-y-6 shadow-premium-dark font-mono text-xs">
          <h3 className="font-bold text-sm text-white uppercase flex items-center gap-2 border-b border-dark-800 pb-3">
            <Keyboard className="w-4 h-4 text-red-500" />
            Simulator Keyboard Hotkeys
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'F', desc: 'Frame / Center Entire Car Model' },
              { key: 'R', desc: 'Restore and Reassemble all Disassembled Components' },
              { key: 'X', desc: 'Cycle X-Ray Modes (Solid -> Ghost Skin -> Internal Core)' },
              { key: 'E', desc: 'Toggle Exploded CAD View (0% <-> 75%)' },
              { key: 'C', desc: 'Cycle Camera Presets (Hero, Front, Side, Rear, Top, Powertrain)' },
              { key: 'Space', desc: 'Toggle Mechanical Engine Dynamics & DRS Motion' },
              { key: 'G', desc: 'Toggle Webcam Spatial Vision Hand Tracking' },
              { key: 'Esc', desc: 'Deselect Active Component / Dismiss Modal' },
              { key: 'Left Click', desc: 'Select Component / Place 3D CAD Measurement Point' },
              { key: 'Right Drag', desc: 'Pan Camera Orbit Target in 3D Space' }
            ].map((sc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-950 border border-dark-800">
                <span className="text-dark-300 font-sans">{sc.desc}</span>
                <kbd className="px-2.5 py-1 rounded bg-dark-800 text-red-400 font-bold border border-red-900/60 shadow-sm shrink-0 ml-3">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Gestures */}
      {activeDocTab === 'gestures' && (
        <div className="bg-dark-900/90 rounded-2xl border border-red-500/25 p-6 space-y-4 shadow-premium-dark font-sans text-xs">
          <h3 className="font-bold text-sm text-white font-mono uppercase flex items-center gap-2 border-b border-dark-800 pb-3">
            <Hand className="w-4 h-4 text-red-500" />
            Spatial Computer Vision Hand Tracking
          </h3>
          <p className="text-dark-300 leading-relaxed">
            The simulator features browser-native spatial computer vision powered by high-performance color segmentation and kinematic fingertip tracking. No external software or driver plugins are required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono">
            <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-1">
              <span className="font-bold text-red-400 block">POINT / HOVER GESTURE</span>
              <p className="text-dark-400 font-sans text-[11px]">Move hand across webcam view to control spatial cursor on 3D canvas.</p>
            </div>
            <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-1">
              <span className="font-bold text-red-400 block">PINCH / CLICK GESTURE</span>
              <p className="text-dark-400 font-sans text-[11px]">Bring thumb and index fingertips together within 45px to trigger raycast selection.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Architecture */}
      {activeDocTab === 'architecture' && (
        <div className="bg-dark-900/90 rounded-2xl border border-red-500/25 p-6 space-y-4 shadow-premium-dark font-sans text-xs">
          <h3 className="font-bold text-sm text-white font-mono uppercase flex items-center gap-2 border-b border-dark-800 pb-3">
            <Cpu className="w-4 h-4 text-red-500" />
            System Architecture
          </h3>
          <div className="space-y-3 text-dark-300 leading-relaxed">
            <p>
              Built using a modern reactive graphics pipeline: Three.js WebGL 2.0 with React Three Fiber, Zustand state management, and Tailwind CSS.
            </p>
            <ul className="list-disc list-inside space-y-1 text-dark-300 font-mono text-[11px]">
              <li>High-DPI 2D Canvas Dotted Grid with dynamic red radiant cursor glow</li>
              <li>PBR Physical Shaders with real-time anisotropic highlights and contact shadows</li>
              <li>Hierarchical topological graph for mechanical disassembly constraint resolution</li>
              <li>Synthetic Web Audio oscillator mimicking Honda RBPT 15,000 RPM V6 acoustics</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: Schema */}
      {activeDocTab === 'schema' && (
        <div className="bg-dark-900/90 rounded-2xl border border-red-500/25 p-6 space-y-4 shadow-premium-dark font-mono text-xs">
          <h3 className="font-bold text-sm text-white uppercase flex items-center gap-2 border-b border-dark-800 pb-3">
            <FileCode className="w-4 h-4 text-red-500" />
            Model Manifest JSON Schema
          </h3>
          <pre className="p-4 rounded-xl bg-dark-950 border border-dark-800 text-[11px] text-red-400 overflow-x-auto leading-relaxed">
{`{
  "id": "oracle-red-bull-rb19-2023",
  "name": "Oracle Red Bull Racing RB19",
  "category": "formula1",
  "units": "meters",
  "scale": 1.0,
  "assemblies": [
    { "id": "aerodynamics_exterior", "name": "Aerodynamics & Bodywork" },
    { "id": "running_gear_wheels", "name": "Wheels & Running Gear" },
    { "id": "power_unit_hybrid", "name": "Honda RBPT 1.6L Turbo Hybrid" }
  ],
  "components": [
    {
      "id": "front_wing_assembly",
      "name": "RB19 Front Wing Cascade",
      "nodeName": "front_wing_assembly",
      "removable": true,
      "explodedOffset": [0, 0, 1.4]
    }
  ]
}`}
          </pre>
        </div>
      )}

      {/* Tab 5: Provenance */}
      {activeDocTab === 'provenance' && (
        <div className="bg-dark-900/90 rounded-2xl border border-red-500/25 p-6 space-y-4 shadow-premium-dark font-sans text-xs">
          <h3 className="font-bold text-sm text-white font-mono uppercase flex items-center gap-2 border-b border-dark-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            Asset Provenance & Verification
          </h3>
          <p className="text-dark-300 leading-relaxed">
            The Oracle Red Bull RB19 geometry and textures are parsed directly from the official user package. Dimensions adhere to 2023 FIA Formula 1 Technical Regulations (5.6m wheelbase, 2.0m maximum track width, Venturi floor vent channels, pushrod front suspension, titanium Halo safety cockpit structure).
          </p>
        </div>
      )}
    </div>
  );
};
