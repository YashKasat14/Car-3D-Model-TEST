import React from 'react';
import { Download, X, Play, Video, CheckCircle2 } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';

interface RecordingPreviewModalProps {
  videoUrl: string | null;
  onClose: () => void;
}

export const RecordingPreviewModal: React.FC<RecordingPreviewModalProps> = ({ videoUrl, onClose }) => {
  if (!videoUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `3d-engineering-simulation-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-dark-950 rounded-2xl border border-red-500/40 shadow-premium-dark overflow-hidden flex flex-col text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-800 bg-dark-900/90">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-red-500" />
            <span className="font-mono text-sm font-bold tracking-wide uppercase">
              Viewport Simulation Recording
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-dark-800 bg-dark-900/60 font-mono text-xs">
          <div className="flex items-center gap-2 text-dark-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Recorded from active 3D WebGL Viewport (WebM VP9/VP8)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-glow-red transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
