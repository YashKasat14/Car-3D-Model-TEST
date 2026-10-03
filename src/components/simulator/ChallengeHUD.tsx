import React from 'react';
import { Target, Award, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';

export const ChallengeHUD: React.FC = () => {
  const {
    activeChallenge,
    currentChallengeStepIndex,
    challengeCompleted,
    exitChallenge
  } = useSimulationStore();

  if (!activeChallenge) return null;

  const currentStep = activeChallenge.steps[currentChallengeStepIndex];

  return (
    <>
      {/* Top Banner HUD */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 pointer-events-none">
        <div className="bg-dark-950/95 backdrop-blur-xl rounded-2xl border-2 border-red-500/50 p-4 shadow-premium-dark pointer-events-auto flex flex-col gap-2 text-white">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                {activeChallenge.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-700/60">
                STEP {currentChallengeStepIndex + 1} OF {activeChallenge.steps.length}
              </span>
              <button
                onClick={exitChallenge}
                className="p-1 rounded-lg text-dark-400 hover:text-white transition-colors"
                title="Exit Challenge"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Step Instruction */}
          {currentStep && (
            <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-700 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <ChevronRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{currentStep.instruction}</span>
              </div>
              <p className="text-[11px] text-red-400 italic pl-5">
                💡 {currentStep.hint}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {challengeCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-dark-950 rounded-2xl border-2 border-red-500 shadow-glow-red p-6 text-center space-y-4 text-white">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500 text-red-500 flex items-center justify-center mx-auto shadow-glow-red">
              <Award className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-white font-mono uppercase tracking-wider">
                Challenge Complete!
              </h3>
              <p className="text-xs text-dark-300">
                You successfully mastered the {activeChallenge.title} engineering workflow.
              </p>
            </div>

            <div className="p-3 bg-dark-900/90 border border-red-900/50 rounded-xl text-left text-xs font-sans text-dark-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-400">
                <CheckCircle2 className="w-4 h-4 text-red-500" />
                <span>Certified FIA RB19 Engineering Standard</span>
              </div>
              <p className="text-[11px] text-dark-400 leading-relaxed">
                All assembly constraints, extraction paths, and inspection tolerances have been verified according to Red Bull Racing specifications.
              </p>
            </div>

            <button
              onClick={exitChallenge}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-semibold transition-all shadow-glow-red"
            >
              CONTINUE SIMULATING
            </button>
          </div>
        </div>
      )}
    </>
  );
};
