import React from 'react';
import {
  Target, Award, Clock, ChevronLeft, ArrowRight, CheckCircle2,
  Sliders, Wrench, ShieldCheck
} from 'lucide-react';
import { useSimulationStore } from '../stores/simulationStore';
import { getAllModels } from '../data/modelsRegistry';
import { EngineeringChallenge } from '../types/model';

export const ChallengesView: React.FC = () => {
  const { setActiveView, setActiveModel, startChallenge } = useSimulationStore();
  const models = getAllModels();

  const allChallenges: Array<{ challenge: EngineeringChallenge; model: typeof models[0] }> = [];
  models.forEach(m => {
    if (m.challenges && m.challenges.length > 0) {
      m.challenges.forEach(ch => {
        allChallenges.push({ challenge: ch, model: m });
      });
    }
  });

  const handleStart = (challenge: EngineeringChallenge, model: typeof models[0]) => {
    setActiveModel(model);
    startChallenge(challenge);
  };

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
          RB19 ENGINEERING WORKFLOW CHALLENGES
        </h2>
        <p className="text-xs sm:text-sm text-dark-400 font-sans mt-1">
          Interactive step-by-step mechanical disassembly, inspection, and assembly procedures with automated constraint checking.
        </p>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allChallenges.map(({ challenge, model }) => (
          <div
            key={challenge.id}
            className="group bg-dark-900/90 backdrop-blur-xl rounded-2xl border border-red-500/25 hover:border-red-500 p-6 flex flex-col justify-between space-y-4 shadow-premium-dark hover:shadow-glow-red transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-red-950/80 text-red-400 font-bold border border-red-700/60 uppercase">
                  {model.shortName}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  challenge.difficulty === 'Beginner'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : 'bg-red-950/80 text-red-400 border border-red-800'
                }`}>
                  {challenge.difficulty}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-white group-hover:text-red-400 transition-colors font-mono">
                  {challenge.title}
                </h3>
                <p className="text-xs text-dark-300 mt-1 leading-relaxed">
                  {challenge.description}
                </p>
              </div>

              {/* Step Sequence Overview */}
              <div className="space-y-1.5 pt-2 border-t border-dark-800">
                <span className="text-[10px] font-mono font-bold text-dark-400 uppercase block">
                  Procedure Sequence ({challenge.steps.length} Steps)
                </span>
                <div className="space-y-1">
                  {challenge.steps.map((st, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-dark-300">
                      <span className="w-4 h-4 rounded bg-dark-950 text-red-500 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-dark-800">
                        {i + 1}
                      </span>
                      <span className="truncate">{st.instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleStart(challenge, model)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-glow-red transition-all mt-4"
            >
              <span>START CHALLENGE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
