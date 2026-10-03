import React, { useEffect } from 'react';
import { SceneViewport } from '../engine/rendering/SceneViewport';
import { TopNavBar } from '../components/simulator/TopNavBar';
import { LeftHierarchyPanel } from '../components/simulator/LeftHierarchyPanel';
import { RightInspectionPanel } from '../components/simulator/RightInspectionPanel';
import { BottomToolbar } from '../components/simulator/BottomToolbar';
import { PrerequisiteAlertModal } from '../components/simulator/PrerequisiteAlertModal';
import { ChallengeHUD } from '../components/simulator/ChallengeHUD';
import { HandTrackingOverlay } from '../components/simulator/HandTrackingOverlay';
import { ModelHoverHUD } from '../components/simulator/ModelHoverHUD';
import { useSimulationStore } from '../stores/simulationStore';

export const SimulatorView: React.FC = () => {
  const {
    restoreAllComponents,
    xrayMode,
    setXrayMode,
    explodedPercent,
    setExplodedPercent,
    selectedComponentId,
    selectComponent,
    handTrackingActive,
    setHandTrackingActive,
    toggleAnimation,
    cameraPreset,
    setCameraPreset,
    undo,
    redo
  } = useSimulationStore();

  // Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      // Undo / Redo Shortcuts (Ctrl+Z, Cmd+Z, Ctrl+Y, Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          restoreAllComponents();
          break;
        case 'x':
          setXrayMode(xrayMode === 'normal' ? 'engineering' : xrayMode === 'engineering' ? 'shell' : 'normal');
          break;
        case 'e':
          setExplodedPercent(explodedPercent > 0 ? 0 : 75);
          break;
        case 'g':
          setHandTrackingActive(!handTrackingActive);
          break;
        case ' ':
          e.preventDefault();
          toggleAnimation();
          break;
        case 'escape':
          selectComponent(null);
          break;
        case 'f':
          setCameraPreset('hero');
          break;
        case 'c':
          const presets: Array<typeof cameraPreset> = ['hero', 'front', 'side', 'rear', 'top', 'powertrain'];
          const nextIdx = (presets.indexOf(cameraPreset) + 1) % presets.length;
          setCameraPreset(presets[nextIdx]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [xrayMode, explodedPercent, handTrackingActive, cameraPreset, restoreAllComponents, setXrayMode, setExplodedPercent, setHandTrackingActive, toggleAnimation, selectComponent, setCameraPreset, undo, redo]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent select-none">
      {/* 3D WebGL Canvas with transparent background over the red flowing dotted canvas */}
      <SceneViewport />

      {/* Floating Tactical Mouse Hover HUD for Part Identification */}
      <ModelHoverHUD />

      {/* Top Application Header */}
      <TopNavBar />

      {/* Left Assembly Hierarchy Panel */}
      <LeftHierarchyPanel />

      {/* Right Engineering Inspection Panel */}
      <RightInspectionPanel />

      {/* Bottom CAD Controls Toolbar */}
      <BottomToolbar />

      {/* Prerequisite Lock Feedback Modal */}
      <PrerequisiteAlertModal />

      {/* Guided Challenge Step HUD */}
      <ChallengeHUD />

      {/* Spatial Hand Tracking Vision Overlay */}
      <HandTrackingOverlay />
    </div>
  );
};
