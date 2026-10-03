import React, { useRef, useState, useEffect } from 'react';
import {
  Compass, Upload, Clock, Trash2, Play, Sparkles, Layers,
  ShieldCheck, ArrowRight, Box, Cpu, FileText, AlertCircle, HardDrive,
  Video, Download, X
} from 'lucide-react';
import { useSimulationStore } from '../stores/simulationStore';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { analyze3DModel } from '../services/universalModelParser';
import { addModelToHistory, deleteModelFromHistory, getModelBlob, ModelHistoryItem } from '../services/modelStorage';
import {
  getRecordingHistory,
  getRecordingBlob,
  deleteRecordingFromHistory,
  downloadRecordingFile,
  RecordingHistoryItem
} from '../services/recordingStorage';
import { soundEngine } from '../engine/audio/SoundEngine';

export const HomeHeroView: React.FC = () => {
  const {
    activeModel,
    setActiveView,
    setActiveModel,
    modelHistory,
    refreshModelHistory,
    setNotification
  } = useSimulationStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processUploadFile(file);
  };

  const processUploadFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf' && ext !== 'obj') {
      alert('Please upload a supported 3D file (.GLB, .GLTF, or .OBJ).');
      return;
    }

    setIsProcessing(true);
    setNotification(`Decomposing 3D CAD hierarchy: ${file.name}...`);
    const fileUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const buffer = ev.target?.result;
      if (!buffer) {
        setIsProcessing(false);
        return;
      }

      if (ext === 'obj') {
        const text = new TextDecoder().decode(buffer as ArrayBuffer);
        const objLoader = new OBJLoader();
        try {
          const rootObj = objLoader.parse(text);
          const analysis = analyze3DModel(rootObj, cleanName, fileUrl);
          await addModelToHistory(file, file.name, analysis.manifest);
          refreshModelHistory();
          setActiveModel(analysis.manifest);
          setIsProcessing(false);
          setActiveView('simulator');
        } catch (err) {
          console.error(err);
          alert('Failed to parse .OBJ file.');
          setIsProcessing(false);
        }
      } else {
        const gltfLoader = new GLTFLoader();
        gltfLoader.parse(
          buffer as ArrayBuffer,
          '',
          async (gltf) => {
            const analysis = analyze3DModel(gltf.scene, cleanName, fileUrl);
            await addModelToHistory(file, file.name, analysis.manifest);
            refreshModelHistory();
            setActiveModel(analysis.manifest);
            setIsProcessing(false);
            setActiveView('simulator');
          },
          (err) => {
            console.error(err);
            alert('Failed to parse 3D file.');
            setIsProcessing(false);
          }
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleReopenFromHistory = async (item: ModelHistoryItem) => {
    soundEngine.playSelect();
    setIsProcessing(true);
    setNotification(`Reopening ${item.name} from model vault...`);

    // Check if binary blob is available in IndexedDB
    const blob = await getModelBlob(item.id);
    if (blob) {
      const newUrl = URL.createObjectURL(blob);
      const updatedManifest = { ...item.manifest, assetUrl: newUrl };
      setActiveModel(updatedManifest);
    } else {
      setActiveModel(item.manifest);
    }

    setIsProcessing(false);
    setActiveView('simulator');
  };

  const handleDeleteFromHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this model from history?')) {
      await deleteModelFromHistory(id);
      refreshModelHistory();
      soundEngine.playRemove();
    }
  };

  // Recording History state and handlers
  const [recordings, setRecordings] = useState<RecordingHistoryItem[]>([]);
  const [activePlaybackUrl, setActivePlaybackUrl] = useState<string | null>(null);
  const [activePlaybackItem, setActivePlaybackItem] = useState<RecordingHistoryItem | null>(null);

  useEffect(() => {
    setRecordings(getRecordingHistory());
  }, []);

  const handlePlayRecording = async (item: RecordingHistoryItem) => {
    soundEngine.playSelect();
    const blob = await getRecordingBlob(item.id);
    if (!blob) {
      alert('Recording file could not be loaded from local storage.');
      return;
    }
    const url = URL.createObjectURL(blob);
    setActivePlaybackUrl(url);
    setActivePlaybackItem(item);
  };

  const handleClosePlayback = () => {
    if (activePlaybackUrl) {
      URL.revokeObjectURL(activePlaybackUrl);
    }
    setActivePlaybackUrl(null);
    setActivePlaybackItem(null);
  };

  const handleDeleteRecording = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this recording from history?')) {
      await deleteRecordingFromHistory(id);
      setRecordings(getRecordingHistory());
      soundEngine.playRemove();
    }
  };

  const handleDownloadRecording = async (e: React.MouseEvent, item: RecordingHistoryItem) => {
    e.stopPropagation();
    soundEngine.playSnap();
    await downloadRecordingFile(item.id, `${item.title.replace(/\s+/g, '_')}.webm`);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between px-6 py-8 sm:px-12 z-10 text-white font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.obj"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Top Brand Bar */}
      <header className="flex items-center justify-between border-b border-red-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-glow-red border border-red-500/40">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wider uppercase text-white font-mono flex items-center gap-2">
              AURA 3D <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/80 text-red-400 font-bold border border-red-700/60">SIMULATOR</span>
            </h1>
            <p className="text-[11px] font-mono text-dark-300 tracking-wide uppercase">
              Model-Agnostic 3D Engineering Platform
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
          {activeModel && (
            <button
              onClick={() => setActiveView('simulator')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-glow-red transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>RESUME SIMULATOR</span>
            </button>
          )}
          <button
            onClick={() => setActiveView('challenges')}
            className="px-3 py-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          >
            CHALLENGES
          </button>
          <button
            onClick={() => setActiveView('docs')}
            className="px-3 py-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          >
            DOCS
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className="px-3 py-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
          >
            SETTINGS
          </button>
        </nav>
      </header>

      {/* Main Hero & Upload Workflow */}
      <main className="max-w-5xl mx-auto my-auto w-full space-y-8 pt-8 pb-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/70 border border-red-500/40 text-red-400 text-xs font-mono shadow-glow-red">
            <Cpu className="w-3.5 h-3.5 text-red-500" />
            <span>INTERACTIVE 3D CAD ENGINEERING & PHYSICAL SIMULATION</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase font-sans">
            ENGINEERING <span className="text-red-500">SIMULATOR</span>
          </h2>

          <p className="text-sm sm:text-base font-medium text-dark-300 max-w-2xl mx-auto leading-relaxed">
            Upload any 3D vehicle, aircraft, or mechanical CAD model to dynamically analyze its component hierarchy, explore true radial exploded views, and simulate physical aerodynamic forces.
          </p>
        </div>

        {/* Primary Upload Dropzone Card */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full max-w-3xl mx-auto bg-dark-950/90 backdrop-blur-2xl rounded-3xl border-2 cursor-pointer transition-all p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 ${
            isDragging
              ? 'border-red-500 bg-red-950/40 shadow-glow-red scale-[1.01]'
              : 'border-dashed border-dark-700 hover:border-red-500/70 hover:bg-dark-900/90 shadow-premium-dark'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-dark-900 border border-red-500/40 flex items-center justify-center text-red-500 shadow-glow-red group-hover:scale-110 transition-transform">
            <Upload className={`w-8 h-8 ${isProcessing ? 'animate-spin' : isDragging ? 'animate-bounce' : ''}`} />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
              {isProcessing ? 'PROCESSING 3D MODEL HIERARCHY...' : 'UPLOAD 3D MODEL'}
            </h3>
            <p className="text-xs text-dark-300 font-sans">
              Drag and drop your 3D vehicle/model here, or click to browse
            </p>
          </div>

          {/* Supported Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {['GLB (Binary)', 'glTF (JSON)', 'OBJ (Wavefront)'].map((fmt) => (
              <span
                key={fmt}
                className="px-3 py-1 rounded-lg bg-dark-900 border border-dark-700/80 text-dark-300 font-mono text-xs font-semibold"
              >
                {fmt}
              </span>
            ))}
          </div>

          {/* Analysis Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-4 border-t border-dark-800 text-[11px] font-mono text-dark-300">
            <div className="flex items-center gap-1.5 justify-center">
              <Box className="w-3.5 h-3.5 text-red-500" />
              <span>Auto Hierarchy</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Layers className="w-3.5 h-3.5 text-red-500" />
              <span>Exploded View</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Dynamic X-Ray</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Cpu className="w-3.5 h-3.5 text-red-500" />
              <span>Aerodynamics</span>
            </div>
          </div>
        </div>

        {/* Model History Section */}
        <div className="w-full max-w-4xl mx-auto space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-dark-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                MODEL HISTORY ({modelHistory.length})
              </h3>
            </div>
            <span className="font-mono text-xs text-dark-400">
              Persistent Local Storage
            </span>
          </div>

          {modelHistory.length === 0 ? (
            <div className="bg-dark-950/60 rounded-2xl border border-dark-800 p-8 text-center text-dark-400 space-y-2">
              <Box className="w-8 h-8 text-dark-600 mx-auto" />
              <p className="text-xs font-mono">No previous models in history yet.</p>
              <p className="text-[11px] text-dark-400">Upload a 3D model above to inspect and simulate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modelHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleReopenFromHistory(item)}
                  className="group bg-dark-950/80 hover:bg-dark-900 border border-dark-800 hover:border-red-500/50 rounded-2xl p-4 transition-all flex items-center justify-between gap-4 cursor-pointer shadow-premium-dark"
                >
                  {/* Thumbnail / Icon */}
                  <div className="w-16 h-16 rounded-xl bg-dark-900 border border-dark-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Box className="w-7 h-7 text-red-500" />
                    )}
                  </div>

                  {/* Model Details */}
                  <div className="flex-1 min-w-0 font-mono text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate block">
                        {item.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-800/60 shrink-0">
                        {item.fileType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-dark-400">
                      <span>{item.componentCount} CAD nodes</span>
                      <span>•</span>
                      <span>{item.fileSizeFormatted}</span>
                      <span>•</span>
                      <span>{new Date(item.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleReopenFromHistory(item)}
                      title="Open in Simulator"
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-glow-red transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteFromHistory(e, item.id)}
                      title="Delete from History"
                      className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-dark-400 hover:text-red-400 border border-dark-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recording History Section */}
        <div className="w-full max-w-4xl mx-auto space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-dark-800 pb-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-red-500" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                RECORDING HISTORY ({recordings.length})
              </h3>
            </div>
            <span className="font-mono text-xs text-dark-400">
              Captured Sessions • In-Browser Playback
            </span>
          </div>

          {recordings.length === 0 ? (
            <div className="bg-dark-950/60 rounded-2xl border border-dark-800 p-8 text-center text-dark-400 space-y-2">
              <Video className="w-8 h-8 text-dark-600 mx-auto" />
              <p className="text-xs font-mono">No recorded engineering sessions yet.</p>
              <p className="text-[11px] text-dark-400">Click RECORD WEBSITE in the simulator top bar to capture full HD video sessions with CAD edits and audio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recordings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePlayRecording(item)}
                  className="group bg-dark-950/80 hover:bg-dark-900 border border-dark-800 hover:border-red-500/50 rounded-2xl p-4 transition-all flex items-center justify-between gap-4 cursor-pointer shadow-premium-dark"
                >
                  {/* Thumbnail / Video Play Icon */}
                  <div className="w-16 h-16 rounded-xl bg-dark-900 border border-red-500/30 overflow-hidden shrink-0 flex items-center justify-center relative group-hover:border-red-500 transition-colors">
                    <Video className="w-7 h-7 text-red-500" />
                    <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 fill-white text-white drop-shadow" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 font-mono text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate block">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 font-semibold border border-red-800/60 truncate max-w-[140px]">
                        {item.modelName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-dark-900 text-dark-200 border border-dark-700 font-bold">
                        {item.durationFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-dark-400 pt-0.5">
                      <span>{item.fileSizeFormatted}</span>
                      <span>•</span>
                      <span>{new Date(item.recordingDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePlayRecording(item)}
                      title="Play Recording"
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-glow-red transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                    <button
                      onClick={(e) => handleDownloadRecording(e, item)}
                      title="Download WebM"
                      className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-dark-300 hover:text-white border border-dark-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteRecording(e, item.id)}
                      title="Delete Recording"
                      className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-dark-400 hover:text-red-400 border border-dark-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Video Playback Modal */}
      {activePlaybackUrl && activePlaybackItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-dark-950 border border-red-500/40 rounded-3xl overflow-hidden shadow-premium-dark flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-800 bg-dark-900/80">
              <div className="flex items-center gap-2 font-mono">
                <Video className="w-4 h-4 text-red-500" />
                <span className="font-bold text-white text-sm">{activePlaybackItem.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 font-semibold">
                  {activePlaybackItem.modelName}
                </span>
                <span className="text-xs text-dark-400">({activePlaybackItem.durationFormatted})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDownloadRecording(e, activePlaybackItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900 hover:bg-dark-800 text-white font-mono text-xs border border-dark-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download WebM</span>
                </button>
                <button
                  onClick={handleClosePlayback}
                  className="p-1.5 rounded-xl bg-dark-900 hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="p-4 bg-black flex items-center justify-center">
              <video
                src={activePlaybackUrl}
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-dark-400 border-t border-red-500/20 pt-5">
        <div>
          AURA 3D • UNIVERSAL CAD ENGINEERING SIMULATOR
        </div>
        <div className="flex items-center gap-4">
          <span>Model-Agnostic Engine</span>
          <span>•</span>
          <span>Radial Exploded View</span>
          <span>•</span>
          <span>Physical Aerodynamics</span>
        </div>
      </footer>
    </div>
  );
};
