import React, { useEffect, useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { resolvePartInfo } from '../../utils/partIdentifier';

export const ModelHoverHUD: React.FC = () => {
  const { hoveredComponentId, selectedComponentId, activeModel, isGizmoDragging, handTrackingActive } = useSimulationStore();
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Completely hide hover tooltip while dragging or when hand gesture tracking is active
  if (isGizmoDragging || handTrackingActive) return null;

  // Only display if user is actively hovering over a component
  if (!hoveredComponentId || !activeModel) return null;

  const partInfo = resolvePartInfo(hoveredComponentId, activeModel);
  if (!partInfo || mousePos.x <= 0 || mousePos.y <= 0) return null;

  const isSelected = selectedComponentId === hoveredComponentId || selectedComponentId === partInfo.id;

  // Ultra-compact dimensions so it never covers parts or distracts the user
  const tooltipWidth = 190;
  const padding = 16;

  let posX = mousePos.x + 14;
  let posY = mousePos.y + 14;

  if (typeof window !== 'undefined') {
    if (posX + tooltipWidth > window.innerWidth - padding) {
      posX = mousePos.x - tooltipWidth - 14;
    }
    if (posY + 44 > window.innerHeight - padding) {
      posY = mousePos.y - 44;
    }
  }

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-75 ease-out animate-in fade-in"
      style={{ left: posX, top: posY, width: `${tooltipWidth}px` }}
    >
      <div className="px-2.5 py-1.5 rounded-lg bg-dark-950/90 backdrop-blur-md border border-dark-700/80 shadow-lg text-white flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isSelected
              ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate leading-tight font-sans">
            {partInfo.name}
          </p>
          <p className="text-[9px] text-dark-400 font-mono truncate uppercase tracking-wider">
            {partInfo.category}
          </p>
        </div>
        {isSelected && (
          <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 shrink-0 font-bold">
            SEL
          </span>
        )}
      </div>
    </div>
  );
};
