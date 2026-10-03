import React from 'react';
import { AlertTriangle, Wrench, X } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';

export const PrerequisiteAlertModal: React.FC = () => {
  const { prerequisiteAlert, clearPrerequisiteAlert } = useSimulationStore();

  if (!prerequisiteAlert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-dark-900/95 rounded-2xl border-2 border-red-500 shadow-glow-red p-6 space-y-4 text-white">
        <button
          onClick={clearPrerequisiteAlert}
          className="absolute top-4 right-4 p-1 rounded-lg text-dark-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-red-500">
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-700/60 shadow-glow-red">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white font-mono">
              Assembly Constraint Violation
            </h3>
            <span className="text-xs text-red-400 font-mono">Mechanical Extraction Locked</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-dark-200 leading-relaxed font-sans bg-dark-950/80 p-3.5 rounded-xl border border-red-900/40">
          <p>
            Cannot remove <strong className="text-white font-bold font-mono">{prerequisiteAlert.componentName}</strong>.
          </p>
          <p className="font-medium text-dark-300">
            Prerequisite dependency not satisfied: You must remove{' '}
            <span className="text-red-400 font-bold font-mono underline decoration-red-500">
              {prerequisiteAlert.missingPrerequisiteName}
            </span>{' '}
            first to clear the mechanical interlock.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={clearPrerequisiteAlert}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-semibold shadow-glow-red transition-all"
          >
            <Wrench className="w-4 h-4" />
            <span>ACKNOWLEDGE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
