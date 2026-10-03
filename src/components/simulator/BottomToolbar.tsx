import React, { useState, useEffect } from 'react';
import {
  Sliders, Wind, Camera, Layers, Focus, Undo2, Redo2,
  RotateCcw, Gauge, Activity, Palette, Hand
} from 'lucide-react';
import { useSimulationStore, CameraPreset, XRayMode } from '../../stores/simulationStore';

export const BottomToolbar: React.FC = () => {
  const {
    activeModel,
    explodedPercent,
    setExplodedPercent,
    xrayMode,
    setXrayMode,
    airflowActive,
    toggleAirflow,
    aerodynamics,
    setAirflowSpeed,
    cameraPreset,
    setCameraPreset,
    frameAll,
    startFrameAllSequence,
    customBackgroundColor,
    setCustomBackgroundColor,
    resetCustomBackgroundColor,
    undo,
    redo,
    history,
    pushHistorySnapshot,
    restoreAllComponents,
    cinematicMode,
    handTrackingActive,
    setHandTrackingActive,
    flowDirectionOverride,
    setFlowDirectionOverride
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'explode' | 'xray' | 'aero' | 'camera' | 'color' | null>(null);

  // When hand gestures are activated, auto-dismiss any open bottom drawer tabs
  useEffect(() => {
    if (handTrackingActive) {
      setActiveTab(null);
    }
  }, [handTrackingActive]);

  if (cinematicMode || !activeModel) return null;

  return (
    <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-4 flex flex-col items-center gap-2 pointer-events-none">
      {/* Sub-panel Drawer */}
      {activeTab && (
        <div className="w-full bg-dark-950/95 backdrop-blur-xl px-5 py-3 rounded-2xl border border-red-500/30 shadow-premium-dark pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 text-white font-mono text-xs">
          {/* 1. Exploded View Controls */}
          {activeTab === 'explode' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-semibold text-white shrink-0">
                <Sliders className="w-4 h-4 text-red-500" />
                <span>EXPLODED CAD: {explodedPercent}%</span>
              </div>

              {/* Slider */}
              <div className="w-full max-w-md flex items-center gap-3">
                <span className="text-[11px] text-dark-400">0%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={explodedPercent}
                  onPointerDown={() => pushHistorySnapshot()}
                  onChange={(e) => setExplodedPercent(Number(e.target.value))}
                  className="w-full accent-red-600 h-1.5 bg-dark-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-dark-400">100%</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 shrink-0">
                {[0, 25, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      pushHistorySnapshot();
                      setExplodedPercent(val);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all border ${
                      explodedPercent === val
                        ? 'bg-red-600 text-white font-bold border-red-500 shadow-glow-red'
                        : 'bg-dark-900 hover:bg-dark-800 text-dark-300 hover:text-white border-dark-700'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. X-Ray Controls matching reference site */}
          {activeTab === 'xray' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Layers className="w-4 h-4 text-red-500" />
                <span>DYNAMIC X-RAY PENETRATION</span>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { id: 'normal', label: 'Solid Surface' },
                  { id: 'shell', label: 'Transparent Shell' },
                  { id: 'engineering', label: 'Engineering Holographic (Fresnel + Edges)' }
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setXrayMode(id as XRayMode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      xrayMode === id
                        ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
                        : 'bg-dark-900 hover:bg-dark-800 text-dark-300 hover:text-white border-dark-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Aerodynamics & Physical Airflow Controls */}
          {activeTab === 'aero' && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAirflow}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      airflowActive
                        ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
                        : 'bg-dark-900 hover:bg-dark-800 text-dark-300 hover:text-white border-dark-700'
                    }`}
                  >
                    {airflowActive ? 'AIRFLOW & FORCES: ACTIVE' : 'ENABLE AIRFLOW'}
                  </button>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-dark-400">VELOCITY:</span>
                    <span className="font-bold text-sky-400">{aerodynamics.airflowSpeedKmh} KM/H</span>
                  </div>

                  {/* Flow Direction Indicator & Toggle (User Requirement 2) */}
                  <button
                    onClick={() => {
                      const cur = flowDirectionOverride || activeModel?.forwardAxis || '+z';
                      const next = cur === '+z' ? '-z' : cur === '-z' ? '+x' : cur === '+x' ? '-x' : '+z';
                      setFlowDirectionOverride(next);
                    }}
                    title="Toggle aerodynamic flow direction (Front -> Rear)"
                    className="px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-dark-850 border border-sky-500/40 text-[11px] text-sky-300 font-mono font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>FLOW: {(flowDirectionOverride || activeModel?.forwardAxis || '+z').toUpperCase()} FRONT</span>
                    <span className="text-[9px] text-dark-400 font-normal underline">FLIP</span>
                  </button>
                </div>

                {/* Velocity Slider */}
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <span className="text-[10px] text-dark-400">80</span>
                  <input
                    type="range"
                    min="80"
                    max="360"
                    step="10"
                    value={aerodynamics.airflowSpeedKmh}
                    onChange={(e) => setAirflowSpeed(Number(e.target.value))}
                    disabled={!airflowActive}
                    className="w-full accent-red-600 h-1.5 bg-dark-800 rounded cursor-pointer disabled:opacity-40"
                  />
                  <span className="text-[10px] text-dark-400">360</span>
                </div>
              </div>

              {/* Active Multi-Zone Streamline Badges */}
              <div className="flex items-center gap-2 text-[10px] text-dark-400 pt-1 border-t border-dark-800/80 overflow-x-auto">
                <span className="text-sky-400 font-semibold shrink-0">ACTIVE FLOW ZONES:</span>
                <span className="px-2 py-0.5 rounded bg-dark-900 border border-dark-800 text-emerald-400">Lateral Flanks / Sides (L & R)</span>
                <span className="px-2 py-0.5 rounded bg-dark-900 border border-dark-800 text-sky-400">Front Nose & Splitter</span>
                <span className="px-2 py-0.5 rounded bg-dark-900 border border-dark-800 text-purple-400">Underfloor Venturi Diffuser</span>
                <span className="px-2 py-0.5 rounded bg-dark-900 border border-dark-800 text-amber-400">Trailing Wake Vortices</span>
              </div>

              {/* Physical Aero Force Readouts */}
              {airflowActive && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-dark-800/80 text-[11px]">
                  <div className="bg-dark-900/80 px-2.5 py-1.5 rounded-lg border border-dark-800">
                    <span className="text-dark-400 block text-[10px]">DOWNFORCE (SUSPENSION)</span>
                    <span className="text-red-400 font-bold">-{aerodynamics.downforceN.toLocaleString()} N</span>
                  </div>
                  <div className="bg-dark-900/80 px-2.5 py-1.5 rounded-lg border border-dark-800">
                    <span className="text-dark-400 block text-[10px]">DRAG DISPLACEMENT</span>
                    <span className="text-amber-400 font-bold">{aerodynamics.dragN.toLocaleString()} N</span>
                  </div>
                  <div className="bg-dark-900/80 px-2.5 py-1.5 rounded-lg border border-dark-800">
                    <span className="text-dark-400 block text-[10px]">AERO PITCH ANGLE</span>
                    <span className="text-sky-400 font-bold">{aerodynamics.pitchDeg}° NOSE-DOWN</span>
                  </div>
                  <div className="bg-dark-900/80 px-2.5 py-1.5 rounded-lg border border-dark-800">
                    <span className="text-dark-400 block text-[10px]">L / D EFFICIENCY</span>
                    <span className="text-emerald-400 font-bold">
                      {(aerodynamics.downforceN / aerodynamics.dragN).toFixed(2)}:1
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Precision CAD Camera Views */}
          {activeTab === 'camera' && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Camera className="w-4 h-4 text-red-500" />
                <span>DYNAMIC CAMERA PROJECTIONS</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(['hero', 'front', 'side', 'rear', 'top', 'bottom'] as CameraPreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCameraPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] uppercase font-medium transition-all border ${
                      cameraPreset === preset
                        ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
                        : 'bg-dark-900 hover:bg-dark-800 text-dark-300 hover:text-white border-dark-700'
                    }`}
                  >
                    {preset === 'bottom' ? 'Underside' : preset}
                  </button>
                ))}

                {/* Frame All Sequence Trigger */}
                <button
                  onClick={startFrameAllSequence}
                  title="Animated 10-view Inspection Sequence"
                  className="px-3 py-1 rounded-lg text-[11px] uppercase font-bold text-red-400 bg-red-950/80 border border-red-600/60 hover:bg-red-900/60 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Focus className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span>FRAME ALL (ANIMATED)</span>
                </button>

                {/* Hand Tracking Vision Sensor Toggle in Camera Module */}
                <button
                  onClick={() => setHandTrackingActive(!handTrackingActive)}
                  title="Hand Tracking: Control 3D Camera & Grab Parts Using Webcam Gestures"
                  className={`px-3 py-1 rounded-lg text-[11px] uppercase font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                    handTrackingActive
                      ? 'bg-red-600 text-white border-red-500 shadow-glow-red animate-pulse'
                      : 'bg-dark-900 hover:bg-dark-800 text-red-400 hover:text-white border-red-600/50'
                  }`}
                >
                  <Hand className="w-3.5 h-3.5 text-red-500" />
                  <span>{handTrackingActive ? 'HAND TRACKING: ON' : 'HAND TRACKING: OFF'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Custom Environment Background Color */}
          {activeTab === 'color' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-white">CUSTOM BACKGROUND COLOR:</span>
                <span className="text-dark-300 font-bold">{customBackgroundColor}</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customBackgroundColor}
                  onChange={(e) => setCustomBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-dark-700 bg-transparent p-0"
                />
                {['#090910', '#040407', '#161922', '#1e293b', '#0a1120', '#f1f5f9'].map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setCustomBackgroundColor(hex)}
                    style={{ backgroundColor: hex }}
                    className="w-7 h-7 rounded-lg border border-dark-700 hover:scale-110 transition-transform"
                    title={hex}
                  />
                ))}
                <button
                  onClick={resetCustomBackgroundColor}
                  className="px-2.5 py-1 rounded-lg text-xs bg-dark-900 hover:bg-dark-800 text-dark-300 hover:text-white border border-dark-700 ml-1"
                >
                  Reset Default
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Bottom Control Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-dark-950/90 backdrop-blur-xl border border-red-500/30 shadow-premium-dark pointer-events-auto">
        {/* Frame All Button (User Requirement 2: Auto-moves items list & CAD inspection aside) */}
        <button
          onClick={frameAll}
          title="Frame entire 3D model and move items list & CAD inspection panels aside for clear view"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold text-red-400 bg-red-950/60 hover:bg-red-900/60 border border-red-600/40 transition-all shadow-sm"
        >
          <Focus className="w-3.5 h-3.5 text-red-500" />
          <span>FRAME ALL</span>
        </button>

        {/* Hand Gesture Tracking Button (User Requirement 3) */}
        <button
          onClick={() => setHandTrackingActive(!handTrackingActive)}
          title="Activate Hand Gesture Tracking (Webcam Camera Orbit & 2-Dot Pinch)"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
            handTrackingActive
              ? 'bg-red-600 text-white border-red-500 shadow-glow-red animate-pulse'
              : 'hover:bg-dark-800 text-dark-200 hover:text-white border-transparent'
          }`}
        >
          <Hand className="w-3.5 h-3.5 text-red-500" />
          <span>HAND GESTURE</span>
        </button>

        {/* Exploded View Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'explode' ? null : 'explode')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all border ${
            activeTab === 'explode'
              ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
              : 'hover:bg-dark-800 text-dark-200 hover:text-white border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-red-500" />
          <span>EXPLODE</span>
        </button>

        {/* X-Ray Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'xray' ? null : 'xray')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all border ${
            activeTab === 'xray'
              ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
              : 'hover:bg-dark-800 text-dark-200 hover:text-white border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-red-500" />
          <span>X-RAY</span>
        </button>

        {/* Aerodynamics & Airflow Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'aero' ? null : 'aero')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all border ${
            activeTab === 'aero' || airflowActive
              ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
              : 'hover:bg-dark-800 text-dark-200 hover:text-white border-transparent'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-red-500" />
          <span>AERODYNAMICS</span>
        </button>

        {/* Camera Views Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'camera' ? null : 'camera')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all border ${
            activeTab === 'camera'
              ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
              : 'hover:bg-dark-800 text-dark-200 hover:text-white border-transparent'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-red-500" />
          <span>CAMERA</span>
        </button>

        {/* Custom Environment Color Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'color' ? null : 'color')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all border ${
            activeTab === 'color'
              ? 'bg-red-600 text-white border-red-500 shadow-glow-red'
              : 'hover:bg-dark-800 text-dark-200 hover:text-white border-transparent'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-red-500" />
          <span>COLOR</span>
        </button>

        <div className="w-[1px] h-6 bg-dark-700 mx-1" />

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={history.past.length === 0}
          title={history.past.length > 0 ? "Undo component action (Ctrl+Z)" : "Nothing to undo"}
          className={`p-2 rounded-xl transition-all ${
            history.past.length > 0
              ? 'hover:bg-dark-800 text-dark-200 hover:text-white cursor-pointer hover:border-red-500/40 border border-transparent'
              : 'text-dark-600 opacity-40 cursor-not-allowed border border-transparent'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={redo}
          disabled={history.future.length === 0}
          title={history.future.length > 0 ? "Redo component action (Ctrl+Y)" : "Nothing to redo"}
          className={`p-2 rounded-xl transition-all ${
            history.future.length > 0
              ? 'hover:bg-dark-800 text-dark-200 hover:text-white cursor-pointer hover:border-red-500/40 border border-transparent'
              : 'text-dark-600 opacity-40 cursor-not-allowed border border-transparent'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        {/* Restore All Components */}
        <button
          onClick={restoreAllComponents}
          title="Restore and reassemble all components"
          className="p-2 rounded-xl hover:bg-dark-800 text-red-500 hover:text-red-400 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
