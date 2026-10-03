import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video, Pause, Play, Square, Camera, Sparkles, FolderOpen,
  Maximize, Minimize, ChevronLeft, Plus, ChevronDown, Check,
  Activity, Hand, Undo2, Redo2, Upload, Focus
} from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { soundEngine } from '../../engine/audio/SoundEngine';
import { viewportRecorder } from '../../engine/recording/ViewportRecorder';
import { RecordingPreviewModal } from './RecordingPreviewModal';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { analyze3DModel } from '../../services/universalModelParser';
import { addModelToHistory, deleteModelFromHistory, getModelBlob } from '../../services/modelStorage';
import { saveRecordingToHistory, formatDuration } from '../../services/recordingStorage';

export const TopNavBar: React.FC = () => {
  const {
    activeModel,
    setActiveModel,
    setActiveView,
    cinematicMode,
    notification,
    setNotification,
    hoveredComponentId,
    selectedComponentId,
    isFrameAllSequenceRunning,
    frameAllSequenceStep,
    frameAllSequenceName,
    stopFrameAllSequence,
    modelHistory,
    refreshModelHistory,
    handTrackingActive,
    setHandTrackingActive,
    frameAll,
    undo,
    redo,
    history
  } = useSimulationStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingModalUrl, setRecordingModalUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fps, setFps] = useState(60);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const countFrames = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(countFrames);
    };
    animId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Fullscreen state synchronization with browser
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    soundEngine.playSelect();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const [recordedSeconds, setRecordedSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordedSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Recording action: Record strictly our website 3D simulator viewport (no whole-device or screen sharing)
  const handleStartWebsiteRecording = async () => {
    setRecordedSeconds(0);
    const started = await viewportRecorder.startWebsiteRecording();
    if (started) {
      setIsRecording(true);
      setIsPaused(false);
      soundEngine.playSelect();
      setNotification('Recording simulator viewport (WebM 60 FPS)');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handlePauseRecording = () => {
    const paused = viewportRecorder.pauseRecording();
    if (paused) setIsPaused(true);
  };

  const handleResumeRecording = () => {
    const resumed = viewportRecorder.resumeRecording();
    if (resumed) setIsPaused(false);
  };

  const handleStopRecording = async () => {
    soundEngine.playSnap();
    const result = await viewportRecorder.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
    if (result && result.url) {
      if (result.blob) {
        const modelName = activeModel?.name || 'Universal 3D Model';
        await saveRecordingToHistory(result.blob, recordedSeconds, modelName);
        setNotification(`Engineering recording saved to Homepage History (${formatDuration(recordedSeconds)})`);
      }
      setRecordingModalUrl(result.url);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf' && ext !== 'obj') {
      alert('Please upload a valid 3D file (.GLB, .GLTF, or .OBJ).');
      return;
    }

    setNotification(`Analyzing 3D geometry: ${file.name}...`);
    const fileUrl = URL.createObjectURL(file);
    const modelName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const buffer = ev.target?.result;
      if (!buffer) return;

      if (ext === 'obj') {
        const text = new TextDecoder().decode(buffer as ArrayBuffer);
        const objLoader = new OBJLoader();
        try {
          const rootObj = objLoader.parse(text);
          const analysis = analyze3DModel(rootObj, modelName, fileUrl);
          await addModelToHistory(file, file.name, analysis.manifest);
          refreshModelHistory();
          setActiveModel(analysis.manifest);
          setNotification(`Successfully loaded ${modelName}!`);
          setTimeout(() => setNotification(null), 3000);
        } catch (err) {
          console.error(err);
          alert('Failed to parse .OBJ file.');
        }
      } else {
        const gltfLoader = new GLTFLoader();
        gltfLoader.parse(
          buffer as ArrayBuffer,
          '',
          async (gltf) => {
            const analysis = analyze3DModel(gltf.scene, modelName, fileUrl);
            await addModelToHistory(file, file.name, analysis.manifest);
            refreshModelHistory();
            setActiveModel(analysis.manifest);
            setNotification(`Successfully loaded ${modelName} (${analysis.meshCount} CAD nodes)!`);
            setTimeout(() => setNotification(null), 3500);
          },
          (err) => {
            console.error(err);
            alert('Failed to parse 3D file.');
          }
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Resolve active part info
  const activePartId = hoveredComponentId || selectedComponentId;
  const activePart = activeModel && activePartId
    ? activeModel.components.find(c => c.id === activePartId || c.nodeName === activePartId)
    : null;

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3 pointer-events-none">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,.obj"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Left: Home Button, Model Switcher & Upload Button */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-950/90 hover:bg-dark-800 text-dark-200 hover:text-white font-medium text-xs border border-red-500/30 hover:border-red-500 shadow-sm transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-red-500" />
            <span>HOME</span>
          </button>

          {/* Model Switcher Dropdown */}
          <div className="relative">
            <div
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2.5 bg-dark-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-red-500/30 shadow-sm cursor-pointer hover:border-red-500 transition-colors"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs tracking-wider uppercase text-white font-mono">
                    {activeModel ? activeModel.shortName : 'NO MODEL LOADED'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 font-bold border border-red-700/60 uppercase">
                    {activeModel ? `${activeModel.components.length} CAD NODES` : 'UPLOAD MODEL'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-dark-400" />
            </div>

            {/* Model History Switcher Menu */}
            {isModelDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-dark-950/95 backdrop-blur-xl rounded-xl border border-red-500/30 shadow-premium-dark p-2 space-y-1 font-mono text-xs z-30">
                <div className="px-2 py-1 text-[10px] text-dark-400 font-bold uppercase border-b border-dark-800 flex justify-between items-center">
                  <span>MODEL HISTORY ({modelHistory.length})</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 py-1 scrollbar-thin">
                  {modelHistory.length === 0 ? (
                    <div className="px-3 py-3 text-center text-dark-400 text-xs">
                      No models in history yet. Upload one below.
                    </div>
                  ) : (
                    modelHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                          activeModel?.id === item.id
                            ? 'bg-red-600 text-white font-bold'
                            : 'text-dark-200 hover:bg-dark-800 hover:text-white'
                        }`}
                      >
                        <button
                          onClick={async () => {
                            setIsModelDropdownOpen(false);
                            let manifestToLoad = item.manifest;
                            try {
                              const blob = await getModelBlob(item.id);
                              if (blob) {
                                manifestToLoad = {
                                  ...item.manifest,
                                  assetUrl: URL.createObjectURL(blob)
                                };
                              }
                            } catch (e) {
                              console.warn('Failed to retrieve model blob from vault:', e);
                            }
                            setActiveModel(manifestToLoad);
                            setNotification(`Switched to ${item.name}`);
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="flex-1 text-left truncate mr-2"
                        >
                          <span className="truncate block">{item.name}</span>
                          <span className="text-[10px] opacity-70 block">{item.componentCount} parts • {item.fileSizeFormatted}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsModelDropdownOpen(false);
                    handleUploadClick();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-red-400 hover:bg-red-950/60 hover:text-red-300 transition-colors flex items-center gap-1.5 font-bold border-t border-dark-800 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Upload New 3D Model</span>
                </button>
              </div>
            )}
          </div>

          {/* Dedicated "UPLOAD MODEL" Button */}
          <button
            onClick={handleUploadClick}
            title="Upload new 3D model (.GLB, .GLTF, .OBJ)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-glow-red transition-all transform hover:scale-105 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>UPLOAD MODEL</span>
          </button>
        </div>

        {/* Center: Live Inspection Sequence HUD / Notification / Part Inspector */}
        <div className="flex-1 flex items-center justify-center px-4 pointer-events-auto">
          {isFrameAllSequenceRunning ? (
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-950/90 backdrop-blur-xl border border-red-500/70 shadow-glow-red text-white font-mono text-xs animate-pulse">
              <Camera className="w-3.5 h-3.5 text-red-400 animate-spin-slow" />
              <span className="font-bold tracking-wide">
                INSPECTION SEQUENCE: {frameAllSequenceName} ({frameAllSequenceStep + 1}/10)
              </span>
              <button
                onClick={stopFrameAllSequence}
                className="ml-2 px-2 py-0.5 rounded bg-dark-900 hover:bg-dark-800 text-[10px] text-red-300 font-bold border border-red-600/50"
              >
                STOP
              </button>
            </div>
          ) : notification ? (
            <div className="bg-red-950/90 text-white px-4 py-1.5 rounded-full border border-red-500/60 text-xs font-mono shadow-glow-red flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>{notification}</span>
            </div>
          ) : activePart ? (
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-dark-950/95 backdrop-blur-xl border border-sky-500/60 shadow-[0_0_20px_rgba(56,189,248,0.35)] text-white max-w-full">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
              </span>
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest font-bold shrink-0">
                {hoveredComponentId ? 'HOVERED:' : 'SELECTED:'}
              </span>
              <span className="text-xs font-sans font-bold text-white tracking-wide truncate max-w-[220px] md:max-w-md">
                {activePart.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border border-sky-500/40 bg-sky-950/80 text-sky-300 shrink-0">
                {activePart.category}
              </span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-dark-900/60 backdrop-blur-md border border-dark-700/60 text-dark-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500/60 animate-pulse" />
              <span>CLICK ANY COMPONENT IN 3D SPACE TO INSPECT DETAILED CAD GEOMETRY</span>
            </div>
          )}
        </div>

        {/* Right: Recording Controls, FPS & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Frame All Button (User Requirement 2) */}
          <button
            onClick={frameAll}
            title="Frame Entire 3D Model • Auto-moves Items List & CAD Inspection Panels Aside"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-950/90 hover:bg-dark-800 text-red-400 hover:text-red-300 font-mono text-xs font-bold border border-red-500/30 hover:border-red-500 shadow-sm transition-all"
          >
            <Focus className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden md:inline">FRAME ALL</span>
          </button>

          {/* Hand Tracking Vision Sensor Quick Toggle Button (User Requirement 3) */}
          <button
            onClick={() => setHandTrackingActive(!handTrackingActive)}
            title="Activate Hand Gesture Tracking (Webcam Camera Orbit & 2-Dot Pinch)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border shadow-sm ${
              handTrackingActive
                ? 'bg-red-600 text-white border-red-500 shadow-glow-red animate-pulse'
                : 'bg-dark-950/90 hover:bg-dark-800 text-dark-200 hover:text-white border-red-500/30'
            }`}
          >
            <Hand className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden md:inline">HAND GESTURE</span>
          </button>

          {/* Undo / Redo Quick Buttons */}
          <div className="flex items-center bg-dark-950/90 backdrop-blur-md rounded-xl border border-red-500/30 p-0.5">
            <button
              onClick={undo}
              disabled={history.past.length === 0}
              title={history.past.length > 0 ? "Undo component action (Ctrl+Z)" : "Nothing to undo"}
              className={`p-1.5 rounded-lg transition-all ${
                history.past.length > 0
                  ? 'hover:bg-dark-800 text-dark-200 hover:text-white cursor-pointer'
                  : 'text-dark-600 opacity-40 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={history.future.length === 0}
              title={history.future.length > 0 ? "Redo component action (Ctrl+Y)" : "Nothing to redo"}
              className={`p-1.5 rounded-lg transition-all ${
                history.future.length > 0
                  ? 'hover:bg-dark-800 text-dark-200 hover:text-white cursor-pointer'
                  : 'text-dark-600 opacity-40 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Performance Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-dark-900/80 backdrop-blur-md border border-dark-700 text-dark-200 text-[11px] font-mono shadow-sm">
            <Activity className="w-3 h-3 text-red-500 animate-pulse" />
            <span>{fps} FPS</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'}
            className="hidden sm:flex items-center gap-1.5 p-1.5 rounded-xl bg-dark-900/80 hover:bg-dark-800 text-dark-300 hover:text-white border border-dark-700 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Website Simulator Recording System Controls */}
          <div className="relative flex items-center">
            {!isRecording ? (
              <button
                onClick={handleStartWebsiteRecording}
                title="Record Website Simulator - 60 FPS pristine video of 3D CAD model and interactions (Captures only our website, zero device sharing)"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-white bg-red-600 hover:bg-red-500 shadow-glow-red transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <Video className="w-3.5 h-3.5" />
                <span>RECORD WEBSITE</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-dark-950/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/50 shadow-glow-red">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-mono text-xs font-bold text-white">
                    REC [{String(Math.floor(recordedSeconds / 60)).padStart(2, '0')}:{String(recordedSeconds % 60).padStart(2, '0')}]
                  </span>
                  <span className="text-[10px] font-mono uppercase text-red-400 font-semibold hidden md:inline">
                    LIVE
                  </span>
                </div>

                <div className="flex items-center gap-1 border-l border-dark-700 pl-2">
                  {/* Pause / Resume */}
                  {isPaused ? (
                    <button
                      onClick={handleResumeRecording}
                      title="Resume Recording"
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseRecording}
                      title="Pause Recording"
                      className="p-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <Pause className="w-3 h-3" />
                    </button>
                  )}

                  {/* Stop Recording */}
                  <button
                    onClick={handleStopRecording}
                    title="Stop Recording and Preview"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-glow-red"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>STOP</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-xl bg-dark-950/90 hover:bg-dark-800 text-dark-300 hover:text-white border border-dark-700/80 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Recording Preview Modal with Playback and Download */}
      <RecordingPreviewModal
        videoUrl={recordingModalUrl}
        onClose={() => setRecordingModalUrl(null)}
      />
    </>
  );
};
