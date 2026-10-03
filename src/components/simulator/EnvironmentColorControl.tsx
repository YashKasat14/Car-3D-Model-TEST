import React, { useState, useEffect } from 'react';
import { Palette, RotateCcw, Check, Sparkles, X } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';

interface EnvironmentColorControlProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SWATCHES = [
  { name: 'Neutral Dark (Default)', hex: '#090910' },
  { name: 'Deep Space', hex: '#040407' },
  { name: 'Industrial Slate', hex: '#161922' },
  { name: 'Titanium Grey', hex: '#262933' },
  { name: 'Tech Navy', hex: '#0a1120' },
  { name: 'Studio White', hex: '#f1f5f9' },
  { name: 'Warm Cream', hex: '#e2d9cf' },
  { name: 'Racing Crimson', hex: '#1f090c' }
];

export const EnvironmentColorControl: React.FC<EnvironmentColorControlProps> = ({ isOpen, onClose }) => {
  const { customBackgroundColor, setCustomBackgroundColor, resetCustomBackgroundColor } = useSimulationStore();
  const [hexInput, setHexInput] = useState(customBackgroundColor);
  const [rgbInput, setRgbInput] = useState('');

  // Sync state with store
  useEffect(() => {
    setHexInput(customBackgroundColor);
    const rgb = hexToRgb(customBackgroundColor);
    if (rgb) {
      setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }, [customBackgroundColor]);

  if (!isOpen) return null;

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setCustomBackgroundColor(val);
      const rgb = hexToRgb(val);
      if (rgb) setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  };

  const handleRgbChange = (val: string) => {
    setRgbInput(val);
    const parts = val.split(',').map(s => parseInt(s.trim(), 10));
    if (parts.length === 3 && parts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
      const hex = rgbToHex(parts[0], parts[1], parts[2]);
      setHexInput(hex);
      setCustomBackgroundColor(hex);
    }
  };

  return (
    <div className="absolute top-16 right-4 z-40 w-80 bg-dark-950/95 backdrop-blur-2xl rounded-2xl border border-red-500/40 shadow-premium-dark p-4 space-y-4 text-white font-mono text-xs animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-red-500" />
          <span className="font-bold text-xs uppercase tracking-wider text-white">
            Custom Environment Color
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visual Color Picker & Live Hex Input */}
      <div className="space-y-2">
        <label className="text-[10px] text-dark-400 uppercase font-semibold block">
          COLOR PICKER & HEX VALUE
        </label>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-dark-700 shrink-0 shadow-inner">
            <input
              type="color"
              value={customBackgroundColor.startsWith('#') && customBackgroundColor.length === 7 ? customBackgroundColor : '#090910'}
              onChange={(e) => handleHexChange(e.target.value)}
              className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
            />
          </div>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2 text-dark-400 font-bold">#</span>
            <input
              type="text"
              value={hexInput.replace('#', '')}
              onChange={(e) => handleHexChange(`#${e.target.value.trim()}`)}
              placeholder="090910"
              maxLength={6}
              className="w-full bg-dark-900 border border-dark-700 focus:border-red-500 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white uppercase font-bold outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* RGB Input */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-dark-400 uppercase font-semibold block">
          RGB VALUES (R, G, B)
        </label>
        <input
          type="text"
          value={rgbInput}
          onChange={(e) => handleRgbChange(e.target.value)}
          placeholder="9, 9, 16"
          className="w-full bg-dark-900 border border-dark-700 focus:border-red-500 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none transition-colors"
        />
      </div>

      {/* Curated Swatches */}
      <div className="space-y-2">
        <span className="text-[10px] text-dark-400 uppercase font-semibold block">
          QUICK NEUTRAL BACKDROPS
        </span>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_SWATCHES.map((swatch) => (
            <button
              key={swatch.hex}
              onClick={() => handleHexChange(swatch.hex)}
              title={swatch.name}
              className="group relative flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-dark-900 transition-all border border-dark-800"
            >
              <div
                className="w-full h-7 rounded-lg border border-dark-700 flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ backgroundColor: swatch.hex }}
              >
                {customBackgroundColor.toLowerCase() === swatch.hex.toLowerCase() && (
                  <Check className={`w-3.5 h-3.5 ${swatch.hex === '#f1f5f9' || swatch.hex === '#e2d9cf' ? 'text-black' : 'text-white'}`} />
                )}
              </div>
              <span className="text-[9px] text-dark-400 truncate w-full text-center">
                {swatch.hex}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-2 border-t border-dark-800 flex items-center justify-between">
        <button
          onClick={resetCustomBackgroundColor}
          className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-500" />
          <span>Reset to Neutral Default</span>
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all text-xs"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
