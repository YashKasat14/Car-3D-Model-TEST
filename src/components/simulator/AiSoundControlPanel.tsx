import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Play, Square, Sparkles, Flame, Activity, Disc3 } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { analyzeModelSound, AiSoundProfile } from '../../services/aiSoundAnalyzer';
import { soundEngine } from '../../engine/audio/SoundEngine';

export const AiSoundControlPanel: React.FC = () => {
  const { activeModel } = useSimulationStore();
  const [profile, setProfile] = useState<AiSoundProfile>(() => analyzeModelSound(activeModel));
  const [isPlaying, setIsPlaying] = useState<boolean>(soundEngine.getIsEngineRunning());
  const [throttle, setThrottle] = useState<number>(soundEngine.getCurrentThrottle());
  const [volume, setVolume] = useState<number>(soundEngine.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());

  // Update profile whenever the active model changes
  useEffect(() => {
    const nextProfile = analyzeModelSound(activeModel);
    setProfile(nextProfile);
    // If current model has no sound, stop any active sound immediately
    if (!nextProfile.hasSound && soundEngine.getIsEngineRunning()) {
      soundEngine.stopAiSound();
    }
  }, [activeModel]);

  // Sync state with SoundEngine changes
  useEffect(() => {
    const unsub = soundEngine.subscribe(() => {
      setIsPlaying(soundEngine.getIsEngineRunning());
      setThrottle(soundEngine.getCurrentThrottle());
      setVolume(soundEngine.getVolume());
      setIsMuted(soundEngine.getMuted());
    });
    return () => unsub();
  }, []);

  // CRITICAL REQUIREMENT: If the model has NO sound, the sound option is completely invisible!
  if (!profile.hasSound) {
    return null;
  }

  const handleToggleSound = () => {
    if (isPlaying) {
      soundEngine.stopAiSound();
    } else {
      soundEngine.startAiSound(profile);
    }
  };

  const handleThrottleChange = (val: number) => {
    setThrottle(val);
    soundEngine.setAiThrottle(val);
  };

  const handleBurst = () => {
    soundEngine.triggerBurst();
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    soundEngine.setVolume(vol);
  };

  const handleMuteToggle = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const estimatedRpm = Math.round(profile.idleRpm + (profile.maxRpm - profile.idleRpm) * throttle);

  // Dynamic button label based on archetype
  const getBurstLabel = () => {
    if (profile.archetype === 'marine_ship') return 'SOUND FOGHORN';
    if (profile.archetype === 'animal_creature') return 'PRIMAL ROAR';
    if (profile.archetype === 'jet_turbofan') return 'AFTERBURNER';
    return 'REV THROTTLE';
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-dark-950/90 backdrop-blur-xl rounded-2xl border border-red-500/30 text-white font-mono shadow-premium-dark text-xs">
      {/* Header: AI Classification Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-[12px]">{profile.soundTitle}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-950 text-red-400 border border-red-700/60 font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI SYNTHESIS</span>
              </span>
            </div>
            <p className="text-[10px] text-dark-400 font-sans leading-tight">
              {profile.engineType} • {profile.soundDescription}
            </p>
          </div>
        </div>

        {/* Live Visualizer Bars (Animated when sound is playing) */}
        <div className="flex items-end gap-0.5 h-5 px-2 py-0.5 bg-dark-900 rounded border border-dark-800">
          {[12, 24, 16, 28, 20, 32, 18, 26, 14, 22].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${
                isPlaying
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-dark-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(4, (h * (0.4 + throttle * 0.6)))}px` : '4px'
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Interactive Audio Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Play / Stop Primary Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-glow-red animate-pulse'
                : 'bg-dark-900 hover:bg-dark-850 text-red-400 border border-red-500/40 hover:border-red-500'
            }`}
          >
            {isPlaying ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-red-400" />}
            <span>{isPlaying ? 'STOP ACOUSTICS' : 'START ACOUSTICS'}</span>
          </button>

          {/* Burst / Rev Blip Action Button */}
          <button
            onClick={handleBurst}
            title="Trigger dynamic acoustic rev blip or horn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900 hover:bg-dark-850 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 font-bold transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{getBurstLabel()}</span>
          </button>
        </div>

        {/* Real-Time Throttle / RPM Slider */}
        <div className="flex-1 min-w-[200px] max-w-md space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-dark-400">
              IDLE: {profile.idleRpm.toLocaleString()} RPM
            </span>
            <span className="text-red-400 font-bold">
              {estimatedRpm.toLocaleString()} RPM ({(throttle * 100).toFixed(0)}% THROTTLE)
            </span>
            <span className="text-dark-400">
              MAX: {profile.maxRpm.toLocaleString()} RPM
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={throttle}
            onChange={(e) => handleThrottleChange(parseFloat(e.target.value))}
            disabled={!isPlaying}
            className="w-full accent-red-600 h-1.5 bg-dark-800 rounded cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Volume & Mute Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMuteToggle}
            className={`p-1.5 rounded-lg border transition-all ${
              isMuted
                ? 'bg-red-950 border-red-500 text-red-400'
                : 'bg-dark-900 border-dark-700 text-dark-300 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 accent-red-600 h-1.5 bg-dark-800 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
