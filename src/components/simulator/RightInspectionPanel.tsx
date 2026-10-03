import React, { useState } from 'react';
import {
  Eye, EyeOff, Wrench, RotateCcw, Maximize2, X,
  Layers, Search, ShieldCheck, Box, Sliders, Info, Cpu, Check,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Move, ArrowUp, ArrowDown, CornerDownLeft, Sparkles, Navigation
} from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';

export const RightInspectionPanel: React.FC = () => {
  const {
    activeModel,
    selectedComponentId,
    removedComponentIds,
    hiddenComponentIds,
    isolatedComponentId,
    explodedPercent,
    inspectionDetailMode,
    isRightPanelOpen,
    toggleRightPanel,
    setInspectionDetailMode,
    selectComponent,
    removeComponent,
    restoreComponent,
    hideComponent,
    unhideComponent,
    restoreAllComponents,
    isolateComponent,
    cinematicMode,
    componentOffsets,
    detachedComponentIds,
    isMoveModeActive,
    toggleMoveMode,
    setComponentOffset,
    moveComponentBy,
    detachComponent,
    placeComponentOnGround,
    returnComponentToAssembly,
    returnAllComponentsToAssembly,
    handTrackingActive
  } = useSimulationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [stepSize, setStepSize] = useState<number>(0.5);

  if (cinematicMode || !activeModel || handTrackingActive) return null;

  // Selected component lookup
  const selectedComp = selectedComponentId
    ? activeModel.components.find(c => c.id === selectedComponentId || c.nodeName === selectedComponentId)
    : null;

  const isSelectedHidden = selectedComponentId ? hiddenComponentIds.includes(selectedComponentId) : false;
  const isSelectedRemoved = selectedComponentId ? removedComponentIds.includes(selectedComponentId) : false;
  const isSelectedIsolated = selectedComponentId ? isolatedComponentId === selectedComponentId : false;
  const compOffset = selectedComponentId ? componentOffsets[selectedComponentId] || { x: 0, y: 0, z: 0 } : { x: 0, y: 0, z: 0 };
  const isSelectedDetached = selectedComponentId
    ? detachedComponentIds.includes(selectedComponentId) || Math.hypot(compOffset.x, compOffset.y, compOffset.z) > 0.04
    : false;

  // Filtered components for Parts View
  const filteredComponents = activeModel.components.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nodeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Floating Sidebar Trigger Button when Collapsed */}
      {!isRightPanelOpen && (
        <button
          onClick={toggleRightPanel}
          title="Open CAD Inspection Sidebar"
          className="absolute top-24 right-0 z-30 flex items-center gap-2 py-3 px-2 rounded-l-2xl bg-dark-950/95 backdrop-blur-xl border-y border-l border-red-500/40 shadow-premium-dark text-white font-mono text-xs hover:bg-dark-900 transition-all hover:pr-3 group pointer-events-auto"
        >
          <ChevronLeft className="w-4 h-4 text-red-500 group-hover:-translate-x-0.5 transition-transform" />
          <div className="[writing-mode:vertical-lr] rotate-180 uppercase tracking-wider font-bold text-[10px] text-dark-200 group-hover:text-white flex items-center gap-1.5">
            <span>CAD INSPECTION</span>
            <span className="px-1 py-0.5 rounded bg-red-950 text-red-400 text-[9px] font-mono">
              {activeModel.components.length}
            </span>
          </div>
        </button>
      )}

      {/* Main Collapsible CAD Inspection Aside */}
      <aside
        className={`absolute top-16 right-4 bottom-24 w-80 sm:w-96 z-20 flex flex-col transition-all duration-300 pointer-events-auto ${
          isRightPanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-[115%] opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full bg-dark-950/95 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-premium-dark overflow-hidden text-white font-mono text-xs">
          {/* Top Header & Tab Switcher (Mode A: Parts View vs Mode B: Full Details) */}
          <div className="p-3 border-b border-dark-800 bg-dark-900/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-red-500" />
                <span>CAD INSPECTION</span>
              </span>

              <div className="flex items-center gap-1">
                {selectedComponentId && (
                  <button
                    onClick={() => selectComponent(null)}
                    title="Deselect active component"
                    className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Collapse Sidebar Button */}
                <button
                  onClick={toggleRightPanel}
                  title="Collapse CAD Inspection to Sidebar"
                  className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4 text-dark-300 hover:text-white" />
                </button>
              </div>
            </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-xl border border-dark-800">
            <button
              onClick={() => setInspectionDetailMode('parts')}
              className={`flex-1 py-1.5 rounded-lg text-center font-bold text-xs transition-all ${
                inspectionDetailMode === 'parts'
                  ? 'bg-red-600 text-white shadow-glow-red'
                  : 'text-dark-300 hover:text-white hover:bg-dark-900'
              }`}
            >
              PARTS VIEW ({activeModel.components.length})
            </button>
            <button
              onClick={() => setInspectionDetailMode('details')}
              className={`flex-1 py-1.5 rounded-lg text-center font-bold text-xs transition-all ${
                inspectionDetailMode === 'details'
                  ? 'bg-red-600 text-white shadow-glow-red'
                  : 'text-dark-300 hover:text-white hover:bg-dark-900'
              }`}
            >
              FULL DETAILS
            </button>
          </div>
        </div>

        {/* Content Body: Mode A (Parts View) */}
        {inspectionDetailMode === 'parts' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Input */}
            <div className="p-2.5 border-b border-dark-800/80 bg-dark-900/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-dark-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search CAD components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 focus:border-red-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none font-sans"
                />
              </div>
            </div>

            {/* Components List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {filteredComponents.length === 0 ? (
                <div className="p-6 text-center text-dark-400 text-xs">
                  No components match "{searchQuery}"
                </div>
              ) : (
                filteredComponents.map((comp) => {
                  const isSelected = selectedComponentId === comp.id || selectedComponentId === comp.nodeName;
                  const isHidden = hiddenComponentIds.includes(comp.id) || hiddenComponentIds.includes(comp.nodeName);
                  const isRemoved = removedComponentIds.includes(comp.id) || removedComponentIds.includes(comp.nodeName);
                  const isIsolated = isolatedComponentId === comp.id || isolatedComponentId === comp.nodeName;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => {
                        selectComponent(comp.id);
                        setInspectionDetailMode('details');
                      }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-red-950/70 border-red-500 text-white shadow-glow-red'
                          : 'bg-dark-900/60 border-dark-800/80 hover:bg-dark-850 hover:border-dark-700 text-dark-200 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-semibold text-xs truncate">
                          {comp.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-dark-400">
                          <span className="uppercase text-red-400/90">{comp.category}</span>
                          <span>•</span>
                          <span className="truncate">{comp.nodeName}</span>
                        </div>
                      </div>

                      {/* Component Quick Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Hide / Unhide Toggle */}
                        <button
                          onClick={() => isHidden ? unhideComponent(comp.id) : hideComponent(comp.id)}
                          title={isHidden ? 'Unhide Component' : 'Hide Component (Temporary)'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isHidden
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'text-dark-400 hover:text-white hover:bg-dark-800'
                          }`}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Detach / Return Toggle */}
                        {(() => {
                          const isDet = detachedComponentIds.includes(comp.id) || Boolean(componentOffsets[comp.id]);
                          return (
                            <button
                              onClick={() => isDet ? returnComponentToAssembly(comp.id) : detachComponent(comp.id)}
                              title={isDet ? 'Snap back to assembly' : 'Detach and move part in 3D space'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDet
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'text-dark-400 hover:text-red-400 hover:bg-dark-800'
                              }`}
                            >
                              {isDet ? <CornerDownLeft className="w-3.5 h-3.5" /> : <Move className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })()}

                        {/* Isolate Toggle */}
                        <button
                          onClick={() => isolateComponent(isIsolated ? null : comp.id)}
                          title={isIsolated ? 'Exit Isolation' : 'Isolate Component'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isIsolated
                              ? 'bg-sky-950 text-sky-400 border border-sky-800'
                              : 'text-dark-400 hover:text-sky-400 hover:bg-dark-800'
                          }`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Content Body: Mode B (Full Details) */}
        {inspectionDetailMode === 'details' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {selectedComp ? (
              <>
                {/* Header Information */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-red-950/80 text-red-400 font-bold border border-red-700/60">
                      {selectedComp.category}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> MODEL DATA
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{selectedComp.name}</h3>
                  <span className="text-[10px] text-dark-400 block truncate">
                    NODE: {selectedComp.nodeName}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-md border ${
                    isSelectedHidden ? 'bg-amber-950/80 border-amber-700 text-amber-300' : 'bg-dark-900 border-dark-800 text-dark-300'
                  }`}>
                    {isSelectedHidden ? 'Status: Hidden' : 'Status: Visible'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md border ${
                    isSelectedRemoved ? 'bg-red-950/80 border-red-700 text-red-300' : 'bg-dark-900 border-dark-800 text-dark-300'
                  }`}>
                    {isSelectedRemoved ? 'Removed from View' : 'Assembled'}
                  </span>
                  {isSelectedIsolated && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-700 text-sky-300">
                      Isolated
                    </span>
                  )}
                  {explodedPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-700 text-purple-300">
                      Exploded: {explodedPercent}%
                    </span>
                  )}
                </div>

                {/* Section 1: Model-Derived Information */}
                <div className="space-y-2 bg-dark-900/80 p-3 rounded-xl border border-dark-800">
                  <span className="text-[11px] uppercase font-bold text-sky-400 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-sky-500" />
                    <span>Model-Derived Information</span>
                  </span>

                  <div className="divide-y divide-dark-800 text-[11px] space-y-1 pt-1">
                    <div className="flex justify-between py-1">
                      <span className="text-dark-400">Object / Mesh Name</span>
                      <span className="text-white truncate max-w-[170px] text-right font-mono">
                        {selectedComp.nodeName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-dark-400">Material Shader</span>
                      <span className="text-white truncate max-w-[170px] text-right font-mono">
                        {selectedComp.metadata.material}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-dark-400">Vertex Count</span>
                      <span className="text-white font-bold font-mono">
                        {typeof selectedComp.metadata.specifications['Vertices'] === 'number'
                          ? Number(selectedComp.metadata.specifications['Vertices']).toLocaleString()
                          : selectedComp.metadata.specifications['Vertices'] || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-dark-400">Triangle Count</span>
                      <span className="text-white font-bold font-mono">
                        {typeof selectedComp.metadata.specifications['Triangles'] === 'number'
                          ? Number(selectedComp.metadata.specifications['Triangles']).toLocaleString()
                          : selectedComp.metadata.specifications['Triangles'] || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-dark-400">Bounding Dimensions</span>
                      <span className="text-white font-mono text-[10px]">
                        {selectedComp.metadata.specifications['Dimensions (W x H x D)'] || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-dark-400">World Position</span>
                      <span className="text-white font-mono text-[10px]">
                        {selectedComp.metadata.specifications['World Position'] || 'Origin'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Simulator-Estimated Information */}
                <div className="space-y-2 bg-dark-900/80 p-3 rounded-xl border border-dark-800">
                  <span className="text-[11px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>Simulator-Estimated Information</span>
                  </span>

                  <div className="divide-y divide-dark-800 text-[11px] space-y-1 pt-1">
                    <div className="flex justify-between py-1">
                      <span className="text-dark-400">Estimated Component Mass</span>
                      <span className="text-white font-bold font-mono">
                        {selectedComp.metadata.massKg ? `${selectedComp.metadata.massKg} kg` : 'Calculated from Volume'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-dark-400">Functional Assembly Group</span>
                      <span className="text-white truncate max-w-[170px] text-right font-mono">
                        {selectedComp.category} Subsystem
                      </span>
                    </div>
                  </div>
                </div>
                {/* Section 3: 3D Part Spatial Relocation & Movement (Feature 1) */}
                <div className="space-y-3 bg-dark-900/90 p-3.5 rounded-xl border border-red-500/40 shadow-glow-red/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-red-400 flex items-center gap-1.5 font-mono">
                      <Move className="w-3.5 h-3.5 text-red-500" />
                      <span>3D Part Spatial Relocation</span>
                    </span>
                    <button
                      onClick={toggleMoveMode}
                      title="Toggle 3D Move Mode (Direct Mouse Drag & 3D Gizmo)"
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all border ${
                        isMoveModeActive
                          ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
                          : 'bg-dark-950 text-dark-400 border-dark-800 hover:text-white'
                      }`}
                    >
                      {isMoveModeActive ? '3D MOVE: ACTIVE' : '3D MOVE: OFF'}
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-[10px] text-red-200 font-sans leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Free Viewport Drag:</span> Click and drag this part anywhere in the 3D viewport to glide it freely across your screen. Hold <kbd className="px-1 py-0.5 rounded bg-dark-900 border border-dark-700 font-mono text-[9px]">Shift</kbd> to slide on the ground platform.
                    </div>
                  </div>

                  {/* 1-Click Extraction Presets */}
                  <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
                    <button
                      onClick={() => detachComponent(selectedComp.id, { x: -2.2, y: 0.2, z: 0 })}
                      title="Extract 2.2m to Left"
                      className="p-1.5 rounded bg-dark-950 hover:bg-dark-800 border border-dark-700 text-white hover:border-red-500 transition-all text-center font-bold"
                    >
                      ⟵ Ext Left
                    </button>
                    <button
                      onClick={() => detachComponent(selectedComp.id, { x: 2.2, y: 0.2, z: 0 })}
                      title="Extract 2.2m to Right"
                      className="p-1.5 rounded bg-dark-950 hover:bg-dark-800 border border-dark-700 text-white hover:border-red-500 transition-all text-center font-bold"
                    >
                      Ext Right ⟶
                    </button>
                    <button
                      onClick={() => placeComponentOnGround(selectedComp.id)}
                      title="Place detached part onto the ground turntable platform"
                      className="p-1.5 rounded bg-dark-950 hover:bg-dark-800 border border-dark-700 text-amber-300 hover:border-amber-500 transition-all text-center font-bold"
                    >
                      On Ground
                    </button>
                    <button
                      onClick={() => returnComponentToAssembly(selectedComp.id)}
                      title="Snap part back into original joined assembly"
                      className="p-1.5 rounded bg-dark-950 hover:bg-dark-800 border border-dark-700 text-emerald-300 hover:border-emerald-500 transition-all text-center font-bold"
                    >
                      Snap Back
                    </button>
                  </div>

                  {/* 3D Omni-Directional Nudge D-Pad */}
                  <div className="space-y-2 bg-dark-950 p-2.5 rounded-lg border border-dark-800">
                    <div className="flex items-center justify-between text-[10px] text-dark-400 font-mono">
                      <span className="font-bold uppercase tracking-wider text-dark-300">Omni Nudge D-Pad</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-dark-500 mr-1">Step:</span>
                        {[0.25, 0.5, 1.0, 2.0].map((step) => (
                          <button
                            key={step}
                            onClick={() => setStepSize(step)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${
                              stepSize === step
                                ? 'bg-red-600 text-white'
                                : 'bg-dark-900 text-dark-400 hover:text-white border border-dark-800'
                            }`}
                          >
                            {step}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                      {/* Row 1 */}
                      <button
                        onClick={() => moveComponentBy(selectedComp.id, { x: -stepSize, y: stepSize, z: 0 })}
                        title={`Move Up-Left by ${stepSize}m`}
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-red-500 text-dark-300 hover:text-white flex items-center justify-center font-bold transition-all"
                      >
                        ↖ Up-L
                      </button>
                      <button
                        onClick={() => moveComponentBy(selectedComp.id, { y: stepSize })}
                        title={`Move Up (+Y) by +${stepSize}m`}
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center gap-1 font-bold transition-all"
                      >
                        <ArrowUp className="w-3.5 h-3.5" /> Up (+Y)
                      </button>
                      <button
                        onClick={() => moveComponentBy(selectedComp.id, { x: stepSize, y: stepSize, z: 0 })}
                        title={`Move Up-Right by ${stepSize}m`}
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-red-500 text-dark-300 hover:text-white flex items-center justify-center font-bold transition-all"
                      >
                        ↗ Up-R
                      </button>

                      {/* Row 2 */}
                      <button
                        onClick={() => moveComponentBy(selectedComp.id, { x: -stepSize })}
                        title={`Move Left (-X) by -${stepSize}m`}
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-red-500 text-red-400 hover:text-white flex items-center justify-center gap-1 font-bold transition-all"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Left
                      </button>
                      <button
                        onClick={() => moveComponentBy(selectedComp.id, { z: stepSize })}
                        title={`Move Forward (+Z) by +${stepSize}m`}
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-sky-500 text-sky-400 hover:text-white flex items-center justify-center gap-1 font-bold transition-all"
                      >
                        <ChevronUp className="w-3.5 h-3.5" /> Fwd (+Z)
                      </button>
                      <button
                        onClick={() => moveComponentBy(selectedComp.id, { x: stepSize })}
                        title={`Move Right (+X) by +${stepSize}m`}
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-red-500 text-red-400 hover:text-white flex items-center justify-center gap-1 font-bold transition-all"
                      >
                        Right <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Row 3 */}
                      <button
                        onClick={() => moveComponentBy(selectedComp.id, { z: -stepSize })}
                        title={`Move Backward (-Z) by -${stepSize}m`}
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-sky-500 text-sky-400 hover:text-white flex items-center justify-center gap-1 font-bold transition-all"
                      >
                        <ChevronDown className="w-3.5 h-3.5" /> Back (-Z)
                      </button>
                      <button
                        onClick={() => moveComponentBy(selectedComp.id, { y: -stepSize })}
                        title={`Move Down (-Y) by -${stepSize}m`}
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center gap-1 font-bold transition-all"
                      >
                        <ArrowDown className="w-3.5 h-3.5" /> Down (-Y)
                      </button>
                      <button
                        onClick={() => returnComponentToAssembly(selectedComp.id)}
                        title="Reset this component's position"
                        className="p-2 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 hover:border-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center gap-1 font-bold transition-all text-[9px]"
                      >
                        <CornerDownLeft className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>

                  {/* Precision 3D Coordinate Sliders / Nudge */}
                  <div className="space-y-2 bg-dark-950/80 p-2.5 rounded-lg border border-dark-800 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-dark-400 font-bold uppercase pb-1 border-b border-dark-800">
                      <span>Precision Spatial Offset</span>
                      <span className={isSelectedDetached ? 'text-amber-400 font-bold' : 'text-dark-500'}>
                        {isSelectedDetached ? 'DETACHED' : 'ASSEMBLED'}
                      </span>
                    </div>

                    {/* X Axis */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-red-400 font-bold w-12">ΔX (Side)</span>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.05"
                        value={compOffset.x}
                        onChange={(e) => setComponentOffset(selectedComp.id, { ...compOffset, x: parseFloat(e.target.value) })}
                        className="flex-1 accent-red-500 h-1 bg-dark-800 rounded-lg cursor-pointer"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={Number(compOffset.x.toFixed(2))}
                        onChange={(e) => setComponentOffset(selectedComp.id, { ...compOffset, x: parseFloat(e.target.value) || 0 })}
                        className="w-16 px-1.5 py-0.5 rounded bg-dark-900 border border-dark-700 text-right font-bold text-white text-[10px]"
                      />
                    </div>

                    {/* Y Axis */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-emerald-400 font-bold w-12">ΔY (Vert)</span>
                      <input
                        type="range"
                        min="-6"
                        max="10"
                        step="0.05"
                        value={compOffset.y}
                        onChange={(e) => setComponentOffset(selectedComp.id, { ...compOffset, y: parseFloat(e.target.value) })}
                        className="flex-1 accent-emerald-500 h-1 bg-dark-800 rounded-lg cursor-pointer"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={Number(compOffset.y.toFixed(2))}
                        onChange={(e) => setComponentOffset(selectedComp.id, { ...compOffset, y: parseFloat(e.target.value) || 0 })}
                        className="w-16 px-1.5 py-0.5 rounded bg-dark-900 border border-dark-700 text-right font-bold text-white text-[10px]"
                      />
                    </div>

                    {/* Z Axis */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sky-400 font-bold w-12">ΔZ (Aft)</span>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.05"
                        value={compOffset.z}
                        onChange={(e) => setComponentOffset(selectedComp.id, { ...compOffset, z: parseFloat(e.target.value) })}
                        className="flex-1 accent-sky-500 h-1 bg-dark-800 rounded-lg cursor-pointer"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={Number(compOffset.z.toFixed(2))}
                        onChange={(e) => setComponentOffset(selectedComp.id, { ...compOffset, z: parseFloat(e.target.value) || 0 })}
                        className="w-16 px-1.5 py-0.5 rounded bg-dark-900 border border-dark-700 text-right font-bold text-white text-[10px]"
                      />
                    </div>

                    {isSelectedDetached && (
                      <button
                        onClick={() => returnComponentToAssembly(selectedComp.id)}
                        className="w-full mt-1 py-1 rounded bg-dark-900 hover:bg-dark-800 border border-dark-700 text-dark-300 hover:text-white text-center transition-colors font-bold"
                      >
                        Reset Offset to Zero (0, 0, 0)
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-dark-400 space-y-2">
                <Box className="w-8 h-8 text-dark-600 mx-auto" />
                <p className="text-xs">Click any part in the 3D viewport to inspect its complete CAD geometry and properties.</p>
              </div>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="p-3 border-t border-dark-800 bg-dark-900/95 space-y-2">
          {selectedComponentId && (
            <div className="grid grid-cols-2 gap-2">
              {/* Hide / Unhide Button */}
              <button
                onClick={() => isSelectedHidden ? unhideComponent(selectedComponentId) : hideComponent(selectedComponentId)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                  isSelectedHidden
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white'
                }`}
              >
                {isSelectedHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{isSelectedHidden ? 'Unhide Part' : 'Hide Part'}</span>
              </button>

              {/* Detach / Return Button with DEL shortcut */}
              <button
                onClick={() => isSelectedDetached ? returnComponentToAssembly(selectedComponentId) : detachComponent(selectedComponentId)}
                title="Detach/Extract part or return to assembly (Press Delete or Backspace key)"
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                  isSelectedDetached
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-glow-red'
                }`}
              >
                {isSelectedDetached ? <CornerDownLeft className="w-3.5 h-3.5" /> : <Move className="w-3.5 h-3.5" />}
                <span>{isSelectedDetached ? 'Snap to Vehicle' : 'Detach Part [DEL]'}</span>
              </button>
            </div>
          )}

          {/* Dedicated Detached / Relocated Parts Tray */}
          {detachedComponentIds.length > 0 && (
            <div className="bg-dark-950 p-2.5 rounded-xl border border-amber-900/40 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase font-mono">
                <span>Detached / Relocated Parts ({detachedComponentIds.length})</span>
                <span className="text-dark-400 lowercase font-normal">click to inspect</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-thin">
                {detachedComponentIds.map((id) => {
                  const comp = activeModel.components.find(c => c.id === id || c.nodeName === id);
                  const name = comp ? comp.name : id;
                  return (
                    <div
                      key={id}
                      onClick={() => selectComponent(id)}
                      className="flex items-center justify-between px-2 py-1 rounded bg-dark-900 hover:bg-dark-800 border border-dark-800 text-[11px] cursor-pointer"
                    >
                      <span className="truncate max-w-[150px] text-dark-200 font-sans">{name}</span>
                      <div className="flex items-center gap-1 font-mono">
                        <button
                          onClick={(e) => { e.stopPropagation(); placeComponentOnGround(id); }}
                          title="Place on ground workstation"
                          className="px-1.5 py-0.5 rounded bg-dark-800 hover:bg-amber-700 text-amber-300 hover:text-white transition-colors text-[9px] font-bold"
                        >
                          Ground
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); returnComponentToAssembly(id); }}
                          title="Snap back to vehicle assembly"
                          className="px-1.5 py-0.5 rounded bg-dark-800 hover:bg-emerald-700 text-emerald-400 hover:text-white transition-colors text-[9px] font-bold"
                        >
                          Snap
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Restore / Return All Button */}
          {(detachedComponentIds.length > 0 || removedComponentIds.length > 0 || hiddenComponentIds.length > 0 || isolatedComponentId) && (
            <button
              onClick={() => {
                returnAllComponentsToAssembly();
                restoreAllComponents();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-red-400 hover:text-red-300 font-bold border border-red-900/50 transition-all text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-500" />
              <span>Return All Parts to Assembly</span>
            </button>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};
