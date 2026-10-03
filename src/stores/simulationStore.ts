import { create } from 'zustand';
import { ModelManifest, EngineeringChallenge } from '../types/model';
import { soundEngine } from '../engine/audio/SoundEngine';
import { getModelHistory, ModelHistoryItem } from '../services/modelStorage';

export type AppView = 'home' | 'library' | 'simulator' | 'importer' | 'authoring' | 'challenges' | 'docs' | 'settings';
export type XRayMode = 'normal' | 'shell' | 'engineering';
export type GraphicsProfile = 'performance' | 'balanced' | 'cinematic';
export type CameraPreset = 'hero' | 'front' | 'side' | 'rear' | 'top' | 'powertrain' | 'cockpit' | 'bottom';

export interface PrerequisiteAlert {
  componentName: string;
  missingPrerequisiteName: string;
}

export interface AerodynamicState {
  downforceN: number;
  dragN: number;
  liftN: number;
  pitchDeg: number;
  airflowSpeedKmh: number;
}

export interface ComponentOffset {
  x: number;
  y: number;
  z: number;
}

export interface HistorySnapshot {
  removedComponentIds: string[];
  hiddenComponentIds: string[];
  isolatedComponentId: string | null;
  explodedPercent: number;
  componentOffsets: Record<string, ComponentOffset>;
  detachedComponentIds: string[];
}

export interface SimulationState {
  activeView: AppView;
  activeModel: ModelManifest | null;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  removedComponentIds: string[];
  hiddenComponentIds: string[];
  isolatedComponentId: string | null;
  explodedPercent: number; // 0 to 100
  xrayMode: XRayMode;
  inspectionDetailMode: 'parts' | 'details';
  isRightPanelOpen: boolean;
  isLeftPanelOpen: boolean;

  // 3D Part Relocation & Detachment (Feature 1)
  componentOffsets: Record<string, ComponentOffset>;
  detachedComponentIds: string[];
  isMoveModeActive: boolean;
  isGizmoDragging: boolean;

  // Environment & Canvas
  customBackgroundColor: string; // Hex color string, default #090910
  showGridHelper: boolean;

  // Measurement
  measurement: {
    active: boolean;
    pointA: [number, number, number] | null;
    pointB: [number, number, number] | null;
  };

  // Airflow & Physical Aerodynamics
  airflowActive: boolean;
  aerodynamics: AerodynamicState;
  animationPlaying: boolean;
  animationSpeed: number; // 0.1 to 2.0
  handTrackingActive: boolean;

  // Camera & Inspection Sequence
  cameraPreset: CameraPreset;
  cinematicMode: boolean;
  isFrameAllSequenceRunning: boolean;
  frameAllSequenceStep: number;
  frameAllSequenceName: string;

  // Viewport Media Recording
  isRecording: boolean;
  isRecordingPaused: boolean;
  recordingBlobUrl: string | null;

  // Graphics & Notification
  graphicsProfile: GraphicsProfile;
  prerequisiteAlert: PrerequisiteAlert | null;
  notification: string | null;

  // History of Uploaded Models
  modelHistory: ModelHistoryItem[];

  // Challenges
  activeChallenge: EngineeringChallenge | null;
  currentChallengeStepIndex: number;
  challengeCompleted: boolean;

  // History stack for Undo / Redo
  history: {
    past: HistorySnapshot[];
    future: HistorySnapshot[];
  };

  // Actions
  setActiveView: (view: AppView) => void;
  setActiveModel: (model: ModelManifest | null) => void;
  selectComponent: (id: string | null, silent?: boolean) => void;
  setHoveredComponent: (id: string | null) => void;
  removeComponent: (id: string) => boolean;
  hideComponent: (id: string) => void;
  unhideComponent: (id: string) => void;
  restoreComponent: (id: string) => void;
  restoreAllComponents: () => void;
  isolateComponent: (id: string | null) => void;
  setExplodedPercent: (percent: number) => void;
  setXrayMode: (mode: XRayMode) => void;
  setInspectionDetailMode: (mode: 'parts' | 'details') => void;
  // 3D Part Movement Actions (Feature 1)
  setComponentOffset: (id: string, offset: ComponentOffset) => void;
  moveComponentBy: (id: string, delta: Partial<ComponentOffset>) => void;
  detachComponent: (id: string, customOffset?: ComponentOffset, silent?: boolean) => void;
  placeComponentOnGround: (id: string) => void;
  returnComponentToAssembly: (id: string) => void;
  returnAllComponentsToAssembly: () => void;
  setMoveModeActive: (active: boolean) => void;
  toggleMoveMode: () => void;
  setGizmoDragging: (dragging: boolean) => void;

  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleLeftPanel: () => void;
  setLeftPanelOpen: (open: boolean) => void;

  // Environment
  setCustomBackgroundColor: (color: string) => void;
  resetCustomBackgroundColor: () => void;
  toggleGridHelper: () => void;

  // Measurement
  toggleMeasurement: () => void;
  setMeasurementPoint: (pt: [number, number, number]) => void;
  clearMeasurement: () => void;

  // Aerodynamics
  toggleAirflow: () => void;
  setAirflowSpeed: (speedKmh: number) => void;
  flowDirectionOverride: '+z' | '-z' | '+x' | '-x' | null;
  setFlowDirectionOverride: (dir: '+z' | '-z' | '+x' | '-x' | null) => void;
  toggleAnimation: () => void;
  setAnimationSpeed: (speed: number) => void;
  setHandTrackingActive: (active: boolean) => void;

  // Camera & Animated Sequence
  setCameraPreset: (preset: CameraPreset) => void;
  frameAll: () => void;
  startFrameAllSequence: () => void;
  stopFrameAllSequence: () => void;
  setFrameAllSequenceStep: (step: number, name: string) => void;
  setCinematicMode: (enabled: boolean) => void;

  // Recording
  setRecordingState: (state: { isRecording: boolean; isPaused?: boolean; blobUrl?: string | null }) => void;

  // History & Storage
  refreshModelHistory: () => void;
  setGraphicsProfile: (profile: GraphicsProfile) => void;
  clearPrerequisiteAlert: () => void;
  setNotification: (msg: string | null) => void;

  // Challenges
  startChallenge: (challenge: EngineeringChallenge) => void;
  advanceChallengeStep: () => void;
  exitChallenge: () => void;

  // Undo / Redo
  pushHistorySnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

const DEFAULT_BACKGROUND_COLOR = '#090910';

export const useSimulationStore = create<SimulationState>((set, get) => ({
  activeView: 'home',
  activeModel: null, // Start with NO predefined vehicle selected (Requirement 5)
  selectedComponentId: null,
  hoveredComponentId: null,
  removedComponentIds: [],
  hiddenComponentIds: [],
  isolatedComponentId: null,
  explodedPercent: 0,
  xrayMode: 'normal',
  inspectionDetailMode: 'parts',
  isRightPanelOpen: true,
  isLeftPanelOpen: true,
  flowDirectionOverride: null,

  // 3D Part Movement Initial State
  componentOffsets: {},
  detachedComponentIds: [],
  isMoveModeActive: true,
  isGizmoDragging: false,

  // Custom environment color
  customBackgroundColor: DEFAULT_BACKGROUND_COLOR,
  showGridHelper: false,

  measurement: {
    active: false,
    pointA: null,
    pointB: null
  },

  // Aerodynamics simulation defaults
  airflowActive: false,
  aerodynamics: {
    downforceN: 4200,
    dragN: 1450,
    liftN: 120,
    pitchDeg: -1.2,
    airflowSpeedKmh: 240
  },

  animationPlaying: false,
  animationSpeed: 1.0,
  handTrackingActive: false,

  cameraPreset: 'hero',
  cinematicMode: false,
  isFrameAllSequenceRunning: false,
  frameAllSequenceStep: 0,
  frameAllSequenceName: 'Front',

  isRecording: false,
  isRecordingPaused: false,
  recordingBlobUrl: null,

  graphicsProfile: 'balanced',
  prerequisiteAlert: null,
  notification: null,

  modelHistory: getModelHistory(),

  activeChallenge: null,
  currentChallengeStepIndex: 0,
  challengeCompleted: false,

  history: {
    past: [],
    future: []
  },

  setActiveView: (view) => {
    soundEngine.playUiClick();
    set({ activeView: view });
  },

  setActiveModel: (model) => {
    soundEngine.playUiClick();
    set({
      activeModel: model,
      selectedComponentId: null,
      hoveredComponentId: null,
      removedComponentIds: [],
      hiddenComponentIds: [],
      isolatedComponentId: null,
      explodedPercent: 0,
      xrayMode: 'normal',
      inspectionDetailMode: 'parts',
      cameraPreset: 'hero',
      isFrameAllSequenceRunning: false,
      activeChallenge: null,
      currentChallengeStepIndex: 0,
      history: { past: [], future: [] },
      componentOffsets: {},
      detachedComponentIds: [],
      isGizmoDragging: false,
      isLeftPanelOpen: true,
      isRightPanelOpen: true,
      flowDirectionOverride: null
    });
  },

  selectComponent: (id, silent = false) => {
    if (id && !silent && !get().handTrackingActive) {
      soundEngine.playSelect();
    }
    set({ selectedComponentId: id });
  },

  setHoveredComponent: (id) => set({ hoveredComponentId: id }),

  pushHistorySnapshot: () => {
    const {
      history,
      removedComponentIds,
      hiddenComponentIds,
      isolatedComponentId,
      explodedPercent,
      componentOffsets,
      detachedComponentIds
    } = get();

    const snapshot: HistorySnapshot = {
      removedComponentIds: [...removedComponentIds],
      hiddenComponentIds: [...hiddenComponentIds],
      isolatedComponentId,
      explodedPercent,
      componentOffsets: { ...componentOffsets },
      detachedComponentIds: [...detachedComponentIds]
    };

    set({
      history: {
        past: [...history.past.slice(-49), snapshot],
        future: []
      }
    });
  },

  hideComponent: (id) => {
    const { hiddenComponentIds, pushHistorySnapshot } = get();
    if (hiddenComponentIds.includes(id)) return;
    pushHistorySnapshot();
    soundEngine.playUiClick();
    set({
      hiddenComponentIds: [...hiddenComponentIds, id]
    });
  },

  unhideComponent: (id) => {
    const { hiddenComponentIds, pushHistorySnapshot } = get();
    pushHistorySnapshot();
    soundEngine.playSnap();
    set({
      hiddenComponentIds: hiddenComponentIds.filter(item => item !== id)
    });
  },

  setComponentOffset: (id, offset) => {
    const { componentOffsets, detachedComponentIds } = get();
    const isDetached = Math.hypot(offset.x, offset.y, offset.z) > 0.04;
    set({
      componentOffsets: { ...componentOffsets, [id]: offset },
      detachedComponentIds: isDetached
        ? Array.from(new Set([...detachedComponentIds, id]))
        : detachedComponentIds.filter(item => item !== id)
    });
  },

  moveComponentBy: (id, delta) => {
    const { componentOffsets, setComponentOffset } = get();
    const curr = componentOffsets[id] || { x: 0, y: 0, z: 0 };
    setComponentOffset(id, {
      x: curr.x + (delta.x || 0),
      y: curr.y + (delta.y || 0),
      z: curr.z + (delta.z || 0)
    });
  },

  detachComponent: (id, customOffset, silent = false) => {
    const { activeModel, setComponentOffset, setNotification, pushHistorySnapshot } = get();
    pushHistorySnapshot();
    const comp = activeModel?.components.find(c => c.id === id || c.nodeName === id);
    let offset: ComponentOffset = customOffset || { x: 0, y: 0, z: 0 };

    if (!customOffset) {
      const orig = comp?.originalPosition || [0, 0, 0];
      const name = (comp?.name || '').toLowerCase();
      const cat = (comp?.category || '').toLowerCase();

      if (name.includes('wheel') || name.includes('tire') || name.includes('tyre') || cat.includes('wheel') || cat.includes('chassis')) {
        const side = orig[0] >= 0 ? 1 : -1;
        offset = { x: side * 1.85, y: 0.1, z: 0 };
      } else if (name.includes('seat') || name.includes('cockpit') || name.includes('cabin') || name.includes('interior') || name.includes('pilot')) {
        offset = { x: 0, y: 1.75, z: 0.4 };
      } else if (name.includes('wing') || name.includes('rudder') || name.includes('tail') || name.includes('elevator') || name.includes('aileron')) {
        if (name.includes('rear') || name.includes('tail') || name.includes('rudder')) {
          offset = { x: 0, y: 0.8, z: -2.3 };
        } else if (name.includes('front') || name.includes('nose') || name.includes('propeller')) {
          offset = { x: 0, y: 0.4, z: 2.3 };
        } else {
          const side = orig[0] >= 0 ? 1 : -1;
          offset = { x: side * 2.2, y: 0.6, z: 0 };
        }
      } else if (name.includes('engine') || name.includes('motor') || name.includes('exhaust')) {
        offset = { x: 0, y: 1.6, z: -0.5 };
      } else {
        const dist = Math.hypot(orig[0], orig[1], orig[2]);
        if (dist > 0.05) {
          offset = {
            x: (orig[0] / dist) * 1.6,
            y: Math.max(0.2, (orig[1] / dist) * 1.6),
            z: (orig[2] / dist) * 1.6
          };
        } else {
          offset = { x: 1.6, y: 0.6, z: 0 };
        }
      }
    }

    setComponentOffset(id, offset);
    if (!silent && !get().handTrackingActive) {
      soundEngine.playRemove();
      setNotification(`${comp?.name || 'Part'} detached. Drag 3D Gizmo to move anywhere.`);
    }
  },

  placeComponentOnGround: (id) => {
    const { activeModel, setComponentOffset, setNotification, pushHistorySnapshot } = get();
    pushHistorySnapshot();
    const comp = activeModel?.components.find(c => c.id === id || c.nodeName === id);
    const orig = comp?.originalPosition || [0, 0, 0];
    const side = orig[0] >= 0 ? 1 : -1;
    // Ground level offset so world Y drops down to platform
    const groundOffset: ComponentOffset = {
      x: side * 2.4,
      y: -orig[1] + 0.1,
      z: orig[2] * 0.4
    };
    setComponentOffset(id, groundOffset);
    if (!get().handTrackingActive) {
      soundEngine.playSnap();
    }
    setNotification(`${comp?.name || 'Part'} placed on ground workspace.`);
  },

  returnComponentToAssembly: (id) => {
    const { componentOffsets, detachedComponentIds, activeModel, setNotification, pushHistorySnapshot } = get();
    pushHistorySnapshot();
    const nextOffsets = { ...componentOffsets };
    delete nextOffsets[id];
    const nextDetached = detachedComponentIds.filter(item => item !== id);
    if (!get().handTrackingActive) {
      soundEngine.playSnap();
    }
    set({
      componentOffsets: nextOffsets,
      detachedComponentIds: nextDetached
    });
    const comp = activeModel?.components.find(c => c.id === id || c.nodeName === id);
    setNotification(`${comp?.name || 'Part'} returned to joined assembly.`);
  },

  returnAllComponentsToAssembly: () => {
    const { pushHistorySnapshot } = get();
    pushHistorySnapshot();
    soundEngine.playSnap();
    set({
      componentOffsets: {},
      detachedComponentIds: []
    });
    set({ notification: 'All parts returned to vehicle assembly.' });
  },

  setMoveModeActive: (active) => set({ isMoveModeActive: active }),
  toggleMoveMode: () => set(state => ({ isMoveModeActive: !state.isMoveModeActive })),
  setGizmoDragging: (dragging) => set({ isGizmoDragging: dragging }),

  removeComponent: (id) => {
    const { activeModel, detachComponent } = get();
    if (!activeModel || !id) return false;
    detachComponent(id);
    return true;
  },

  restoreComponent: (id) => {
    const { returnComponentToAssembly } = get();
    returnComponentToAssembly(id);
  },

  restoreAllComponents: () => {
    const { pushHistorySnapshot } = get();
    pushHistorySnapshot();
    soundEngine.playSnap();
    set({
      componentOffsets: {},
      detachedComponentIds: [],
      removedComponentIds: [],
      hiddenComponentIds: [],
      isolatedComponentId: null,
      explodedPercent: 0
    });
  },

  isolateComponent: (id) => {
    const { pushHistorySnapshot } = get();
    pushHistorySnapshot();
    soundEngine.playUiClick();
    set({ isolatedComponentId: id });
  },

  setExplodedPercent: (percent) => {
    set({ explodedPercent: Math.max(0, Math.min(100, percent)) });
  },

  setXrayMode: (mode) => {
    soundEngine.playUiClick();
    set({ xrayMode: mode });
  },

  setInspectionDetailMode: (mode) => {
    soundEngine.playUiClick();
    set({ inspectionDetailMode: mode });
  },

  toggleRightPanel: () => {
    soundEngine.playUiClick();
    set(state => ({ isRightPanelOpen: !state.isRightPanelOpen }));
  },

  setRightPanelOpen: (open) => {
    soundEngine.playUiClick();
    set({ isRightPanelOpen: open });
  },

  toggleLeftPanel: () => {
    soundEngine.playUiClick();
    set(state => ({ isLeftPanelOpen: !state.isLeftPanelOpen }));
  },

  setLeftPanelOpen: (open) => {
    soundEngine.playUiClick();
    set({ isLeftPanelOpen: open });
  },

  setCustomBackgroundColor: (color) => {
    set({ customBackgroundColor: color });
  },

  resetCustomBackgroundColor: () => {
    soundEngine.playUiClick();
    set({ customBackgroundColor: DEFAULT_BACKGROUND_COLOR });
  },

  toggleGridHelper: () => {
    soundEngine.playUiClick();
    set((state) => ({ showGridHelper: !state.showGridHelper }));
  },

  toggleMeasurement: () => {
    soundEngine.playUiClick();
    set((state) => ({
      measurement: {
        active: !state.measurement.active,
        pointA: null,
        pointB: null
      }
    }));
  },

  setMeasurementPoint: (pt) => {
    soundEngine.playSelect();
    set((state) => {
      if (!state.measurement.pointA) {
        return { measurement: { ...state.measurement, pointA: pt, pointB: null } };
      } else if (!state.measurement.pointB) {
        return { measurement: { ...state.measurement, pointB: pt } };
      } else {
        return { measurement: { ...state.measurement, pointA: pt, pointB: null } };
      }
    });
  },

  clearMeasurement: () => {
    soundEngine.playUiClick();
    set((state) => ({
      measurement: { ...state.measurement, pointA: null, pointB: null }
    }));
  },

  toggleAirflow: () => {
    soundEngine.playUiClick();
    set((state) => ({ airflowActive: !state.airflowActive }));
  },

  setAirflowSpeed: (speedKmh) => {
    // Dynamically scale aerodynamic forces based on v^2 (fluid dynamics formula F = 0.5 * rho * v^2 * Cd * A)
    const ratio = Math.pow(speedKmh / 240, 2);
    set({
      aerodynamics: {
        airflowSpeedKmh: speedKmh,
        downforceN: Math.round(4200 * ratio),
        dragN: Math.round(1450 * ratio),
        liftN: Math.round(120 * ratio),
        pitchDeg: -Number((1.2 * Math.min(2.5, ratio)).toFixed(2))
      }
    });
  },

  setFlowDirectionOverride: (dir) => {
    soundEngine.playUiClick();
    set({ flowDirectionOverride: dir });
  },

  toggleAnimation: () => {
    soundEngine.playUiClick();
    set((state) => ({ animationPlaying: !state.animationPlaying }));
  },

  setAnimationSpeed: (speed) => {
    soundEngine.playUiClick();
    set({ animationSpeed: speed });
  },

  setHandTrackingActive: (active) => {
    soundEngine.playUiClick();
    if (active) {
      set({
        handTrackingActive: true,
        isRightPanelOpen: false,
        isLeftPanelOpen: false,
        selectedComponentId: null,
        hoveredComponentId: null
      });
    } else {
      set({
        handTrackingActive: false,
        isRightPanelOpen: true,
        isLeftPanelOpen: true
      });
    }
  },

  setCameraPreset: (preset) => {
    soundEngine.playUiClick();
    set({ cameraPreset: preset, isFrameAllSequenceRunning: false });
  },

  frameAll: () => {
    const { isFrameAllSequenceRunning } = get();
    soundEngine.playSnap();
    if (isFrameAllSequenceRunning) {
      set({
        isFrameAllSequenceRunning: false,
        cameraPreset: 'hero',
        notification: 'Framed Model (Hero View)'
      });
    } else {
      set({
        isFrameAllSequenceRunning: true,
        frameAllSequenceStep: 0,
        frameAllSequenceName: 'Front View',
        isLeftPanelOpen: false,  // Smoothly move items list aside for clear view
        isRightPanelOpen: false, // Smoothly move CAD inspection aside for clear view
        selectedComponentId: null,
        hoveredComponentId: null,
        notification: 'Frame All: Starting Animated Inspection Sequence'
      });
    }
    setTimeout(() => {
      const notif = get().notification;
      if (notif?.startsWith('Frame All') || notif?.startsWith('Framed Model')) {
        set({ notification: null });
      }
    }, 3000);
  },

  startFrameAllSequence: () => {
    soundEngine.playUiClick();
    set({
      isFrameAllSequenceRunning: true,
      frameAllSequenceStep: 0,
      frameAllSequenceName: 'Front View',
      isLeftPanelOpen: false,  // Smoothly move items list aside for clear inspection
      isRightPanelOpen: false // Smoothly move CAD inspection aside for clear inspection
    });
  },

  stopFrameAllSequence: () => {
    set({ isFrameAllSequenceRunning: false });
  },

  setFrameAllSequenceStep: (step, name) => {
    set({ frameAllSequenceStep: step, frameAllSequenceName: name });
  },

  setCinematicMode: (enabled) => {
    soundEngine.playUiClick();
    set({ cinematicMode: enabled });
  },

  setRecordingState: ({ isRecording, isPaused, blobUrl }) => {
    set((state) => ({
      isRecording,
      isRecordingPaused: isPaused !== undefined ? isPaused : state.isRecordingPaused,
      recordingBlobUrl: blobUrl !== undefined ? blobUrl : state.recordingBlobUrl
    }));
  },

  refreshModelHistory: () => {
    set({ modelHistory: getModelHistory() });
  },

  setGraphicsProfile: (profile) => {
    soundEngine.playUiClick();
    set({ graphicsProfile: profile });
  },

  clearPrerequisiteAlert: () => set({ prerequisiteAlert: null }),

  setNotification: (msg) => set({ notification: msg }),

  startChallenge: (challenge) => {
    soundEngine.playUiClick();
    set({
      activeChallenge: challenge,
      currentChallengeStepIndex: 0,
      challengeCompleted: false,
      activeView: 'simulator'
    });
  },

  advanceChallengeStep: () => {
    const { activeChallenge, currentChallengeStepIndex } = get();
    if (!activeChallenge) return;
    const nextIdx = currentChallengeStepIndex + 1;
    if (nextIdx >= activeChallenge.steps.length) {
      soundEngine.playSnap();
      set({ challengeCompleted: true });
    } else {
      soundEngine.playSelect();
      set({ currentChallengeStepIndex: nextIdx });
    }
  },

  exitChallenge: () => {
    soundEngine.playUiClick();
    set({
      activeChallenge: null,
      currentChallengeStepIndex: 0,
      challengeCompleted: false
    });
  },

  undo: () => {
    const {
      history,
      removedComponentIds,
      hiddenComponentIds,
      isolatedComponentId,
      explodedPercent,
      componentOffsets,
      detachedComponentIds
    } = get();

    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    const currentSnapshot: HistorySnapshot = {
      removedComponentIds: [...removedComponentIds],
      hiddenComponentIds: [...hiddenComponentIds],
      isolatedComponentId,
      explodedPercent,
      componentOffsets: { ...componentOffsets },
      detachedComponentIds: [...detachedComponentIds]
    };
    const newFuture = [currentSnapshot, ...history.future.slice(0, 49)];

    soundEngine.playUiClick();
    set({
      removedComponentIds: [...previous.removedComponentIds],
      hiddenComponentIds: [...previous.hiddenComponentIds],
      isolatedComponentId: previous.isolatedComponentId,
      explodedPercent: previous.explodedPercent,
      componentOffsets: { ...previous.componentOffsets },
      detachedComponentIds: [...previous.detachedComponentIds],
      history: { past: newPast, future: newFuture },
      notification: 'Undo: Action reverted'
    });
    setTimeout(() => {
      if (get().notification === 'Undo: Action reverted') {
        set({ notification: null });
      }
    }, 2000);
  },

  redo: () => {
    const {
      history,
      removedComponentIds,
      hiddenComponentIds,
      isolatedComponentId,
      explodedPercent,
      componentOffsets,
      detachedComponentIds
    } = get();

    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    const currentSnapshot: HistorySnapshot = {
      removedComponentIds: [...removedComponentIds],
      hiddenComponentIds: [...hiddenComponentIds],
      isolatedComponentId,
      explodedPercent,
      componentOffsets: { ...componentOffsets },
      detachedComponentIds: [...detachedComponentIds]
    };
    const newPast = [...history.past.slice(-49), currentSnapshot];

    soundEngine.playUiClick();
    set({
      removedComponentIds: [...next.removedComponentIds],
      hiddenComponentIds: [...next.hiddenComponentIds],
      isolatedComponentId: next.isolatedComponentId,
      explodedPercent: next.explodedPercent,
      componentOffsets: { ...next.componentOffsets },
      detachedComponentIds: [...next.detachedComponentIds],
      history: { past: newPast, future: newFuture },
      notification: 'Redo: Action restored'
    });
    setTimeout(() => {
      if (get().notification === 'Redo: Action restored') {
        set({ notification: null });
      }
    }, 2000);
  }
}));
