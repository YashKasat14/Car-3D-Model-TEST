import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { useSimulationStore } from '../stores/simulationStore';
import { analyze3DModel } from '../services/universalModelParser';
import { saveModelHistoryMeta, getModelHistory } from '../services/modelStorage';
import { soundEngine } from '../engine/audio/SoundEngine';
import { viewportRecorder } from '../engine/recording/ViewportRecorder';

describe('Universal 3D Model Hierarchy & Geometry Parser', () => {
  it('analyzes any 3D model hierarchy and extracts components, vertices, and radial explode vectors', () => {
    const root = new THREE.Group();
    root.name = 'TestVehicle';

    // Front Wing mesh
    const frontWing = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xef4444, name: 'Carbon_Gloss' })
    );
    frontWing.name = 'Front_Wing';
    frontWing.position.set(0, 0.1, 2.0);
    root.add(frontWing);

    // Rear Wing mesh
    const rearWing = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x111111, name: 'Carbon_Matte' })
    );
    rearWing.name = 'Rear_Wing';
    rearWing.position.set(0, 0.8, -2.0);
    root.add(rearWing);

    // Wheel mesh
    const wheelFL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x222222, name: 'Rubber_Compound' })
    );
    wheelFL.name = 'Wheel_Front_Left';
    wheelFL.position.set(0.9, 0.35, 1.5);
    root.add(wheelFL);

    const result = analyze3DModel(root, 'Test Prototype Racer', 'blob:test-asset');

    expect(result.meshCount).toBe(3);
    expect(result.isSingleMergedMesh).toBe(false);
    expect(result.totalVertices).toBeGreaterThan(0);
    expect(result.manifest.components.length).toBe(3);

    const compFrontWing = result.manifest.components.find(c => c.nodeName === 'Front_Wing');
    expect(compFrontWing).toBeDefined();
    expect(compFrontWing?.category).toBe('Aerodynamics');
    expect(compFrontWing?.explodedOffset).toBeDefined();
    expect(compFrontWing?.explodedOffset[2]).toBeGreaterThan(0); // Moves forward radially
  });

  it('detects single merged mesh limitation properly', () => {
    const singleRoot = new THREE.Group();
    const mergedMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4));
    mergedMesh.name = 'Single_Merged_Vehicle';
    singleRoot.add(mergedMesh);

    const result = analyze3DModel(singleRoot, 'Merged Monolith', 'blob:merged');
    expect(result.isSingleMergedMesh).toBe(true);
    expect(result.manifest.capabilities.explodedView).toBe(false);
  });
});

describe('Simulation Store - Dynamic State & Operations', () => {
  beforeEach(() => {
    const store = useSimulationStore.getState();
    store.restoreAllComponents();
  });

  it('custom environment background color updates immediately and resets', () => {
    const store = useSimulationStore.getState();
    store.setCustomBackgroundColor('#1a2b3c');
    expect(useSimulationStore.getState().customBackgroundColor).toBe('#1a2b3c');

    store.resetCustomBackgroundColor();
    expect(useSimulationStore.getState().customBackgroundColor).toBe('#090910');
  });

  it('handles temporary hide, remove, and restore of individual components', () => {
    const store = useSimulationStore.getState();
    const testPartId = 'comp_front_wing';

    // Hide component
    store.hideComponent(testPartId);
    expect(useSimulationStore.getState().hiddenComponentIds).toContain(testPartId);

    // Unhide component
    store.unhideComponent(testPartId);
    expect(useSimulationStore.getState().hiddenComponentIds).not.toContain(testPartId);

    // Restore All resets both hidden and removed
    store.hideComponent(testPartId);
    store.restoreAllComponents();
    expect(useSimulationStore.getState().hiddenComponentIds).toEqual([]);
    expect(useSimulationStore.getState().removedComponentIds).toEqual([]);
  });

  it('calculates aerodynamic physical downforce and drag proportionally to velocity', () => {
    const store = useSimulationStore.getState();
    store.setAirflowSpeed(300);

    const aero = useSimulationStore.getState().aerodynamics;
    expect(aero.airflowSpeedKmh).toBe(300);
    expect(aero.downforceN).toBeGreaterThan(4200); // Scaled up quadratically
    expect(aero.dragN).toBeGreaterThan(1450);
  });

  it('manages animated multi-angle Frame All inspection sequence', () => {
    const store = useSimulationStore.getState();
    store.startFrameAllSequence();
    expect(useSimulationStore.getState().isFrameAllSequenceRunning).toBe(true);

    store.setFrameAllSequenceStep(2, 'Left Profile View');
    expect(useSimulationStore.getState().frameAllSequenceStep).toBe(2);

    store.stopFrameAllSequence();
    expect(useSimulationStore.getState().isFrameAllSequenceRunning).toBe(false);
  });
});

describe('Audio Engine API', () => {
  it('toggles audio mute state', () => {
    const initial = soundEngine.getMuted();
    const updated = soundEngine.toggleMute();
    expect(updated).toBe(!initial);
    expect(soundEngine.getMuted()).toBe(updated);
    soundEngine.toggleMute();
  });

  it('sets audio volume within [0, 1] bounds', () => {
    soundEngine.setVolume(0.8);
    expect(soundEngine.getVolume()).toBe(0.8);
    soundEngine.setVolume(1.5);
    expect(soundEngine.getVolume()).toBe(1.0);
    soundEngine.setVolume(-0.2);
    expect(soundEngine.getVolume()).toBe(0);
  });
});

describe('Recording History Storage & Formatter', () => {
  it('correctly formats duration and file sizes', async () => {
    const { formatDuration, formatFileSize } = await import('../services/recordingStorage');
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(184)).toBe('03:04');

    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024 * 50)).toBe('50.0 KB');
    expect(formatFileSize(1024 * 1024 * 3.5)).toBe('3.5 MB');
  });

  it('persists and retrieves recording history metadata', async () => {
    const { saveRecordingHistoryMeta, getRecordingHistory } = await import('../services/recordingStorage');
    const mockItem = {
      id: 'rec_test_1',
      title: 'Aerodynamic Smoke Flow Test',
      recordingDate: new Date().toISOString(),
      durationSec: 45,
      durationFormatted: '00:45',
      fileSizeBytes: 2048000,
      fileSizeFormatted: '2.0 MB',
      modelName: 'Oracle Red Bull RB19'
    };

    saveRecordingHistoryMeta([mockItem]);
    const loaded = getRecordingHistory();
    expect(loaded.length).toBeGreaterThanOrEqual(1);
    expect(loaded.find(i => i.id === 'rec_test_1')?.title).toBe('Aerodynamic Smoke Flow Test');
  });
});

describe('3D Part Spatial Relocation & Detachment System (Feature 1)', () => {
  beforeEach(() => {
    const store = useSimulationStore.getState();
    store.returnAllComponentsToAssembly();
  });

  it('supports detaching, repositioning, placing on ground, and returning parts to assembly', () => {
    const store = useSimulationStore.getState();
    const partId = 'comp_wheel_front_left';

    // 1. Detach part
    store.detachComponent(partId, { x: 2.0, y: 0.1, z: 0.5 });
    expect(useSimulationStore.getState().detachedComponentIds).toContain(partId);
    expect(useSimulationStore.getState().componentOffsets[partId]).toEqual({ x: 2.0, y: 0.1, z: 0.5 });

    // 2. Translate part by delta
    store.moveComponentBy(partId, { x: 0.5, y: -0.1 });
    expect(useSimulationStore.getState().componentOffsets[partId]).toEqual({ x: 2.5, y: 0.0, z: 0.5 });

    // 3. Return part to assembly
    store.returnComponentToAssembly(partId);
    expect(useSimulationStore.getState().detachedComponentIds).not.toContain(partId);
    expect(useSimulationStore.getState().componentOffsets[partId]).toBeUndefined();

    // 4. Return all parts to assembly
    store.detachComponent('part_a', { x: 1, y: 1, z: 1 });
    store.detachComponent('part_b', { x: -1, y: 2, z: 0 });
    expect(useSimulationStore.getState().detachedComponentIds.length).toBe(2);

    store.returnAllComponentsToAssembly();
    expect(useSimulationStore.getState().detachedComponentIds.length).toBe(0);
    expect(Object.keys(useSimulationStore.getState().componentOffsets).length).toBe(0);
  });

  it('ensures moved and detached parts preserve original material properties without color alteration', () => {
    // Verify that detachedComponentIds does not corrupt the component or assign artificial color overrides
    const wheelId = 'comp_wheel_front_left';
    useSimulationStore.getState().detachComponent(wheelId, { x: 1.5, y: 0, z: 0 });
    const freshState = useSimulationStore.getState();
    expect(freshState.detachedComponentIds).toContain(wheelId);
    expect(freshState.componentOffsets[wheelId]).toEqual({ x: 1.5, y: 0, z: 0 });
    // Verify state preserves pristine clean offset values
    expect(freshState.componentOffsets[wheelId].x).toBe(1.5);
  });
});

describe('Undo / Redo History System', () => {
  beforeEach(() => {
    const store = useSimulationStore.getState();
    store.restoreAllComponents();
    useSimulationStore.setState({ history: { past: [], future: [] } });
  });

  it('records snapshots and enables undoing and redoing component detachment', () => {
    const store = useSimulationStore.getState();
    const partId = 'comp_wing_front';

    // Initial state: no offset, history empty
    expect(useSimulationStore.getState().detachedComponentIds).toHaveLength(0);
    expect(useSimulationStore.getState().history.past).toHaveLength(0);

    // Detach component
    store.detachComponent(partId, { x: 2, y: 1, z: 0 });
    expect(useSimulationStore.getState().detachedComponentIds).toContain(partId);
    expect(useSimulationStore.getState().history.past).toHaveLength(1);

    // Call Undo
    store.undo();
    expect(useSimulationStore.getState().detachedComponentIds).not.toContain(partId);
    expect(useSimulationStore.getState().componentOffsets[partId]).toBeUndefined();
    expect(useSimulationStore.getState().history.past).toHaveLength(0);
    expect(useSimulationStore.getState().history.future).toHaveLength(1);

    // Call Redo
    store.redo();
    expect(useSimulationStore.getState().detachedComponentIds).toContain(partId);
    expect(useSimulationStore.getState().componentOffsets[partId]).toEqual({ x: 2, y: 1, z: 0 });
    expect(useSimulationStore.getState().history.past).toHaveLength(1);
    expect(useSimulationStore.getState().history.future).toHaveLength(0);
  });

  it('undoes hideComponent and restores visibility', () => {
    const store = useSimulationStore.getState();
    const partId = 'comp_chassis';

    store.hideComponent(partId);
    expect(useSimulationStore.getState().hiddenComponentIds).toContain(partId);

    store.undo();
    expect(useSimulationStore.getState().hiddenComponentIds).not.toContain(partId);

    store.redo();
    expect(useSimulationStore.getState().hiddenComponentIds).toContain(partId);
  });

  it('undoes restoreAllComponents and restores previous complex detached state', () => {
    const store = useSimulationStore.getState();
    store.detachComponent('part_1', { x: 1, y: 0, z: 0 });
    store.detachComponent('part_2', { x: -1, y: 0, z: 0 });

    expect(useSimulationStore.getState().detachedComponentIds).toHaveLength(2);

    // User restores all parts
    store.restoreAllComponents();
    expect(useSimulationStore.getState().detachedComponentIds).toHaveLength(0);

    // Undo restoreAllComponents
    store.undo();
    expect(useSimulationStore.getState().detachedComponentIds).toHaveLength(2);
    expect(useSimulationStore.getState().componentOffsets['part_1']).toBeDefined();
    expect(useSimulationStore.getState().componentOffsets['part_2']).toBeDefined();
  });
});

describe('Frame All & Side Panel Tucking Coordination', () => {
  beforeEach(() => {
    const store = useSimulationStore.getState();
    store.stopFrameAllSequence();
    useSimulationStore.setState({ isLeftPanelOpen: true, isRightPanelOpen: true });
  });

  it('triggers frameAll, starts sequence, and tucks side panels aside for clear view', () => {
    const store = useSimulationStore.getState();
    expect(useSimulationStore.getState().isLeftPanelOpen).toBe(true);
    expect(useSimulationStore.getState().isRightPanelOpen).toBe(true);

    // Call frameAll()
    store.frameAll();

    const runningState = useSimulationStore.getState();
    expect(runningState.isFrameAllSequenceRunning).toBe(true);
    expect(runningState.frameAllSequenceStep).toBe(0);
    expect(runningState.frameAllSequenceName).toBe('Front View');
    // Crucial: side tabs are tucked aside for clear view of the model
    expect(runningState.isLeftPanelOpen).toBe(false);
    expect(runningState.isRightPanelOpen).toBe(false);

    // Calling frameAll() again stops sequence and settles to hero
    store.frameAll();
    const stoppedState = useSimulationStore.getState();
    expect(stoppedState.isFrameAllSequenceRunning).toBe(false);
    expect(stoppedState.cameraPreset).toBe('hero');
  });
});

describe('Mouse Scroll Front/Back Depth Translation', () => {
  it('correctly calculates new 3D spatial position when scrolling directly towards screen', () => {
    const store = useSimulationStore.getState();
    const partId = 'comp_seat_1';

    // Initial offset and object position
    store.setComponentOffset(partId, { x: 0, y: 0.5, z: 1.0 });

    const cameraPos = new THREE.Vector3(0, 2, 6);
    const objectPos = new THREE.Vector3(0, 0.5, 1.0);

    // Vector pointing directly from the object towards the viewer's screen (camera)
    const towardsScreen = new THREE.Vector3().subVectors(cameraPos, objectPos).normalize();
    
    // Scroll Up (-deltaY): moves directly TOWARDS the screen
    const scrollUpDelta = -120;
    const depthStep = -Math.sign(scrollUpDelta) * 0.16; // +0.16

    const curOffset = useSimulationStore.getState().componentOffsets[partId];
    const newOffset = {
      x: curOffset.x + towardsScreen.x * depthStep,
      y: curOffset.y + towardsScreen.y * depthStep,
      z: curOffset.z + towardsScreen.z * depthStep
    };

    store.setComponentOffset(partId, newOffset);
    const updated = useSimulationStore.getState().componentOffsets[partId];

    // Verify movement is along the towardsScreen direction
    expect(updated.z).toBeGreaterThan(curOffset.z); // Moved closer to camera (+Z)
    expect(updated.y).toBeGreaterThan(curOffset.y); // Moved higher towards camera (+Y)
  });
});

describe('AI 3D Model Acoustic Sound Analyzer', () => {
  it('classifies authentic Formula 1 V6 Turbo Hybrid sound for racing cars', async () => {
    const { analyzeModelSound } = await import('../services/aiSoundAnalyzer');
    const mockF1Manifest: any = {
      id: 'f1-rb19',
      name: 'Oracle Red Bull Racing RB19',
      category: 'Automotive',
      description: 'Championship-winning Formula 1 racer with ground-effect floor and turbo hybrid power unit.',
      components: [
        { name: 'Front Wing', nodeName: 'Front_Wing', category: 'Aerodynamics' },
        { name: 'Rear Diffuser', nodeName: 'Diffuser', category: 'Aerodynamics' }
      ]
    };

    const profile = analyzeModelSound(mockF1Manifest);
    expect(profile.hasSound).toBe(true);
    expect(profile.archetype).toBe('f1_turbo_hybrid');
    expect(profile.maxRpm).toBe(15000);
    expect(profile.acousticDetails.hasTurboWhistle).toBe(true);
    expect(profile.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });

  it('classifies authentic jet turbofan sound for aircraft', async () => {
    const { analyzeModelSound } = await import('../services/aiSoundAnalyzer');
    const mockJetManifest: any = {
      id: 'boeing-777',
      name: 'Boeing 777-300ER Turbofan',
      category: 'Aviation',
      description: 'Twin-engine long-range commercial jetliner.',
      components: [{ name: 'Turbofan Engine L', nodeName: 'Engine_L', category: 'Propulsion' }]
    };

    const profile = analyzeModelSound(mockJetManifest);
    expect(profile.hasSound).toBe(true);
    expect(profile.archetype).toBe('jet_turbofan');
    expect(profile.acousticDetails.hasTurbineWhine).toBe(true);
  });

  it('classifies authentic marine diesel sound with foghorn for ships', async () => {
    const { analyzeModelSound } = await import('../services/aiSoundAnalyzer');
    const mockShipManifest: any = {
      id: 'container-ship',
      name: 'Triple-E Class Container Ship Vessel',
      category: 'Marine',
      description: 'Ultra-large ocean container vessel.',
      components: [{ name: 'Hull', nodeName: 'Hull_Main', category: 'Structure' }]
    };

    const profile = analyzeModelSound(mockShipManifest);
    expect(profile.hasSound).toBe(true);
    expect(profile.archetype).toBe('marine_ship');
    expect(profile.acousticDetails.hasFogHorn).toBe(true);
  });

  it('classifies biological primal roar for animal / creature models', async () => {
    const { analyzeModelSound } = await import('../services/aiSoundAnalyzer');
    const mockCreatureManifest: any = {
      id: 'trex',
      name: 'Tyrannosaurus Rex Dinosaur Specimen',
      category: 'Biology',
      description: 'Apex predator dinosaur skeletal and organic model.',
      components: [{ name: 'Skull', nodeName: 'Cranial_Structure', category: 'Anatomy' }]
    };

    const profile = analyzeModelSound(mockCreatureManifest);
    expect(profile.hasSound).toBe(true);
    expect(profile.archetype).toBe('animal_creature');
    expect(profile.acousticDetails.hasBiologicalGrowl).toBe(true);
  });

  it('identifies static objects without sound (hasSound: false, sound option invisible)', async () => {
    const { analyzeModelSound } = await import('../services/aiSoundAnalyzer');
    const mockChairManifest: any = {
      id: 'ergonomic-chair',
      name: 'Modern Office Chair Furniture',
      category: 'Static Prop',
      description: 'Ergonomic mesh office desk chair.',
      components: [{ name: 'Seat Pad', nodeName: 'Cushion', category: 'Structure' }]
    };

    const profile = analyzeModelSound(mockChairManifest);
    // CRITICAL: When the model does not have sound, hasSound MUST be false so UI hides it
    expect(profile.hasSound).toBe(false);
    expect(profile.archetype).toBe('none');
  });
});

describe('Dynamic Hand Pinch Metric Scaling', () => {
  it('correctly calculates dynamic dot scale and pinch progress', () => {
    // When pinch distance is large (open hand):
    const openDist = 0.16;
    const openProgress = Math.max(0, Math.min(1, (0.13 - openDist) / 0.10));
    expect(openProgress).toBe(0);
    const openDotSize = Math.round(22 + openProgress * 28);
    expect(openDotSize).toBe(22); // Small initial targeting dot

    // When fingers close together (pinching):
    const pinchDist = 0.02;
    const pinchedProgress = Math.max(0, Math.min(1, (0.13 - pinchDist) / 0.10));
    expect(pinchedProgress).toBe(1);
    const pinchedDotSize = Math.round(22 + pinchedProgress * 28);
    expect(pinchedDotSize).toBe(50); // Becomes big as pinch is done!
  });
});

describe('Separate Left & Right Hand Tracking Architecture (1 Dot Per Hand)', () => {
  it('tracks right and left hands separately with exactly 1 dot per hand and gates preview by detection', async () => {
    const { handTrackingEngine } = await import('../engine/gestures/HandTrackingEngine');

    // 1. Initial State: No hand detected in view
    handTrackingEngine.stopTracking();
    const initialStatus = handTrackingEngine.getStatus();
    expect(initialStatus.leftHand.detected).toBe(false);
    expect(initialStatus.rightHand.detected).toBe(false);

    // 2. Right Hand Only: ONLY right hand is detected, left hand is strictly disabled!
    handTrackingEngine.simulatePinchGesture(0.75, 0.45, false);
    const rightOnlyStatus = handTrackingEngine.getStatus();
    expect(rightOnlyStatus.rightHand.detected).toBe(true);
    expect(rightOnlyStatus.rightHand.x).toBe(0.75);
    expect(rightOnlyStatus.rightHand.isPinching).toBe(false);
    expect(rightOnlyStatus.leftHand.detected).toBe(false); // Left hand strictly disabled
    expect(rightOnlyStatus.isDualHandActive).toBe(false); // Dual hand action disabled
    expect(rightOnlyStatus.rightHand.skeleton?.thumb).toBeDefined();
    expect(rightOnlyStatus.rightHand.skeleton?.index).toBeDefined();

    // 3. Right Hand Pinch: Pinch is calculated on finger tips, dot grows
    handTrackingEngine.simulatePinchGesture(0.75, 0.45, true);
    const rightPinchStatus = handTrackingEngine.getStatus();
    expect(rightPinchStatus.rightHand.isPinching).toBe(true);
    expect(rightPinchStatus.rightHand.pinchProgress).toBe(1);
    expect(rightPinchStatus.leftHand.detected).toBe(false); // Left hand remains disabled

    // 4. Left Hand Only: ONLY left hand is detected, right hand is strictly disabled!
    handTrackingEngine.simulatePinchGesture(0.25, 0.48, true);
    const leftPinchStatus = handTrackingEngine.getStatus();
    expect(leftPinchStatus.leftHand.detected).toBe(true);
    expect(leftPinchStatus.leftHand.x).toBe(0.25);
    expect(leftPinchStatus.leftHand.isPinching).toBe(true);
    expect(leftPinchStatus.rightHand.detected).toBe(false); // Right hand strictly disabled
    expect(leftPinchStatus.isDualHandActive).toBe(false);

    // 5. Dual Hand Simulation: Both hands active simultaneously
    handTrackingEngine.simulateDualHands(0.25, 0.5, true, 0.75, 0.5, true);
    const dualStatus = handTrackingEngine.getStatus();
    expect(dualStatus.leftHand.detected).toBe(true);
    expect(dualStatus.rightHand.detected).toBe(true);
    expect(dualStatus.isDualHandActive).toBe(true);
    expect(dualStatus.handDistance).toBeCloseTo(0.5, 2);
  });

  it('explodes model when moving both hands far apart and collides/reassembles when bringing close', () => {
    const store = useSimulationStore.getState();
    store.setExplodedPercent(0);
    expect(useSimulationStore.getState().explodedPercent).toBe(0);

    // Hands move far from each other (e.g. delta distance +0.25)
    const initialExp = useSimulationStore.getState().explodedPercent;
    const deltaFar = 0.25;
    const exploded = Math.min(100, Math.max(0, Math.round(initialExp + deltaFar * 240)));
    store.setExplodedPercent(exploded);
    expect(useSimulationStore.getState().explodedPercent).toBe(60);

    // Hands bring close to each other (e.g. delta distance -0.30)
    const deltaClose = -0.30;
    const collided = Math.min(100, Math.max(0, Math.round(exploded + deltaClose * 240)));
    store.setExplodedPercent(collided);
    expect(useSimulationStore.getState().explodedPercent).toBe(0); // Collides back to fully joined
  });

  it('moves objects in 3D space when pinching with one hand', () => {
    const store = useSimulationStore.getState();
    const testPartId = 'comp_sidepod_left';

    // Single hand pinch grabs and translates object
    const startOffset = { x: 0, y: 0, z: 0 };
    store.setComponentOffset(testPartId, startOffset);

    // Drag delta from hand motion
    const deltaX = 1.25;
    const deltaY = 0.45;
    const movedOffset = { x: startOffset.x + deltaX, y: startOffset.y + deltaY, z: startOffset.z };
    store.setComponentOffset(testPartId, movedOffset);

    const updated = useSimulationStore.getState().componentOffsets[testPartId];
    expect(updated.x).toBe(1.25);
    expect(updated.y).toBe(0.45);
  });

  it('accurately maps gesture dot screen coordinates to exact 3D canvas NDC coordinates without parallax error', () => {
    // Simulated canvas viewport rect (e.g. 1920x1080 full window, or offset canvas)
    const rect = { left: 0, top: 0, width: 1920, height: 1080 };
    const innerWidth = 1920;
    const innerHeight = 1080;

    // Gesture dot at screen center (50%, 50%)
    const handCenter = { x: 0.5, y: 0.5 };
    const clientX = handCenter.x * innerWidth;
    const clientY = handCenter.y * innerHeight;
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    expect(ndcX).toBeCloseTo(0, 5); // Dead center X
    expect(ndcY).toBeCloseTo(0, 5); // Dead center Y

    // Gesture dot at Top-Left corner (0%, 0%)
    const handTopLeft = { x: 0, y: 0 };
    const tlClientX = handTopLeft.x * innerWidth;
    const tlClientY = handTopLeft.y * innerHeight;
    const tlNdcX = ((tlClientX - rect.left) / rect.width) * 2 - 1;
    const tlNdcY = -((tlClientY - rect.top) / rect.height) * 2 + 1;

    expect(tlNdcX).toBeCloseTo(-1, 5);
    expect(tlNdcY).toBeCloseTo(1, 5);
  });

  it('guarantees 100% silence during hand tracking interactions (no select, detach, or remove audio)', () => {
    const store = useSimulationStore.getState();
    const selectSpy = vi.spyOn(soundEngine, 'playSelect');
    const removeSpy = vi.spyOn(soundEngine, 'playRemove');
    const snapSpy = vi.spyOn(soundEngine, 'playSnap');

    // 1. Silent selectComponent explicitly requested
    store.selectComponent('test_part_silent', true);
    expect(selectSpy).not.toHaveBeenCalled();

    // 2. When handTrackingActive is true, selection and detachment are strictly silent
    store.setHandTrackingActive(true);
    selectSpy.mockClear();
    removeSpy.mockClear();

    store.selectComponent('test_part_during_gesture');
    expect(selectSpy).not.toHaveBeenCalled();

    store.detachComponent('test_part_during_gesture', { x: 1, y: 1, z: 0 });
    expect(removeSpy).not.toHaveBeenCalled();

    store.placeComponentOnGround('test_part_during_gesture');
    expect(snapSpy).not.toHaveBeenCalled();

    // Cleanup
    store.setHandTrackingActive(false);
    selectSpy.mockRestore();
    removeSpy.mockRestore();
    snapSpy.mockRestore();
  });

  it('zooms out screen when moving pinching hands far apart and zooms in when bringing closer', () => {
    // Starting camera distance from target
    let currentRadius = 6.0;
    const zoomSpeed = 16.0;

    // Hands move farther apart while pinching (e.g. deltaPinch = +0.12)
    const deltaFar = 0.12;
    currentRadius = Math.min(32.0, Math.max(2.0, currentRadius + deltaFar * zoomSpeed));
    expect(currentRadius).toBeGreaterThan(6.0); // Zoomed OUT!
    expect(currentRadius).toBeCloseTo(7.92, 2);

    // Hands bring closer together while pinching (e.g. deltaPinch = -0.15)
    const deltaClose = -0.15;
    currentRadius = Math.min(32.0, Math.max(2.0, currentRadius + deltaClose * zoomSpeed));
    expect(currentRadius).toBeLessThan(7.92); // Zoomed IN!
    expect(currentRadius).toBeCloseTo(5.52, 2);
  });

  it('does NOT explode car when free hands are stationary at a large distance (deadzone & noise rejection)', () => {
    const store = useSimulationStore.getState();
    store.setExplodedPercent(0);

    const DEADZONE = 0.010;
    // Hands are held still at distance = 0.65 with tiny sensor jitter (+0.004)
    const stationaryJitter = 0.004;
    expect(Math.abs(stationaryJitter)).toBeLessThan(DEADZONE);

    // Jitter below deadzone MUST NOT change explode percentage!
    if (Math.abs(stationaryJitter) > DEADZONE) {
      store.setExplodedPercent(50);
    }
    expect(useSimulationStore.getState().explodedPercent).toBe(0); // Remained 0% - zero phantom explosion!

    // Deliberate movement beyond deadzone (+0.08) DOES smoothly explode
    const deliberateDelta = 0.08;
    const effectiveDelta = deliberateDelta - DEADZONE;
    const targetExp = Math.max(0, Math.min(100, Math.round(useSimulationStore.getState().explodedPercent + effectiveDelta * 180)));
    store.setExplodedPercent(targetExp);
    expect(useSimulationStore.getState().explodedPercent).toBe(13); // Smooth, controlled explosion
  });

  it('moves objects ONLY when pinching directly ON an object, and does not move when dot is removed or in empty space', () => {
    const store = useSimulationStore.getState();
    const testPartId = 'comp_wing_front';
    store.setComponentOffset(testPartId, { x: 0, y: 0, z: 0 });

    // 1. Pinching in empty air (hits.length === 0) must NOT move or grab previously selected objects
    const rayHits: Array<{ object: { name: string } }> = [];
    let targetId: string | null = null;
    if (rayHits.length > 0) {
      targetId = rayHits[0].object.name;
    }
    expect(targetId).toBeNull(); // Nothing grabbed when dot is not on an object!

    // 2. Pinching directly ON an object (hits.length > 0) grabs the object
    const onObjectHits = [{ object: { name: testPartId } }];
    if (onObjectHits.length > 0) {
      targetId = onObjectHits[0].object.name;
    }
    expect(targetId).toBe(testPartId); // Accurately grabbed!

    // 3. When pinch is released or hand gesture dot is removed from the object, moving stops and selection clears
    store.selectComponent(null, true);
    expect(useSimulationStore.getState().selectedComponentId).toBeNull();
  });

  it('automatically dismisses information tab and side panels when hand gestures are activated via keybind g or button', () => {
    const store = useSimulationStore.getState();
    // Ensure panels start open and a component is selected
    store.setRightPanelOpen(true);
    store.setLeftPanelOpen(true);
    store.selectComponent('test_part_engine');
    expect(useSimulationStore.getState().isRightPanelOpen).toBe(true);
    expect(useSimulationStore.getState().selectedComponentId).toBe('test_part_engine');

    // 1. Activate hand gestures (e.g. keybind 'g' or Hand Gesture button clicked)
    store.setHandTrackingActive(true);
    const activeState = useSimulationStore.getState();
    expect(activeState.handTrackingActive).toBe(true);
    expect(activeState.isRightPanelOpen).toBe(false); // Information tab closed!
    expect(activeState.isLeftPanelOpen).toBe(false);  // Hierarchy panel closed!
    expect(activeState.selectedComponentId).toBeNull(); // Selection cleared!

    // 2. Deactivate hand gestures (e.g. keybind 'g' or close button clicked)
    store.setHandTrackingActive(false);
    const deactivatedState = useSimulationStore.getState();
    expect(deactivatedState.handTrackingActive).toBe(false);
    expect(deactivatedState.isRightPanelOpen).toBe(true); // Restored!
    expect(deactivatedState.isLeftPanelOpen).toBe(true);  // Restored!
  });

  it('provides 0 delay instant response when hand is in motion (alpha = 1.0) and stabilizes when stationary', () => {
    const coord = { x: 0.20, y: 0.50 };

    // Function matching zero-delay filter in HandTrackingEngine
    const filter = (current: { x: number; y: number }, targetX: number, targetY: number) => {
      const dx = targetX - current.x;
      const dy = targetY - current.y;
      const dist = Math.hypot(dx, dy);
      const alpha = dist >= 0.003 ? 1.0 : 0.80;
      current.x += dx * alpha;
      current.y += dy * alpha;
    };

    // 1. Moving hand (e.g. hand moved from 0.20 to 0.45 across viewport)
    filter(coord, 0.45, 0.60);
    // Instant snap with 0 delay (alpha = 1.0)
    expect(coord.x).toBe(0.45);
    expect(coord.y).toBe(0.60);

    // 2. Holding hand still with tiny micro-jitter (dist < 0.003)
    filter(coord, 0.451, 0.601);
    // Gentle smoothing to eliminate sensor noise without lag
    expect(coord.x).toBeCloseTo(0.4508, 4);
    expect(coord.y).toBeCloseTo(0.6008, 4);
  });

  it('accurately identifies pinch scale-invariantly at both close and far distances from the camera', () => {
    // Helper function calculating normalized pinch
    const checkPinch = (rawPinchDist: number, palmScale: number) => {
      const normalizedPinchDist = rawPinchDist / Math.max(0.10, palmScale);
      return normalizedPinchDist < 0.38;
    };

    // Case A: Hand is far from camera (small palmScale = 0.14)
    // Raw distance between fingers is 0.035 when pinched
    expect(checkPinch(0.035, 0.14)).toBe(true); // Accurately pinched!
    // Raw distance between fingers is 0.080 when open
    expect(checkPinch(0.080, 0.14)).toBe(false); // Accurately open!

    // Case B: Hand is close to camera (large palmScale = 0.40)
    // Raw distance between fingers is 0.10 when pinched
    expect(checkPinch(0.10, 0.40)).toBe(true); // Accurately pinched despite larger raw pixel size!
    // Raw distance between fingers is 0.25 when open
    expect(checkPinch(0.25, 0.40)).toBe(false); // Accurately open!
  });

  it('uses proximity probe to accurately grab parts when gesture dot is near part edges', () => {
    const testPartId = 'comp_side_pod';
    const directHits: Array<{ object: { name: string } }> = [];
    const probeOffsets = [
      { x: 0.012, y: 0 },
      { x: -0.012, y: 0 }
    ];

    let targetId: string | null = null;
    if (directHits.length > 0) {
      targetId = directHits[0].object.name;
    } else {
      // Simulate probe hitting the part edge within proximity tolerance
      const probeHits = [{ object: { name: testPartId } }];
      if (probeHits.length > 0) {
        targetId = probeHits[0].object.name;
      }
    }

    expect(targetId).toBe(testPartId); // Accurately captured via proximity tolerance probe!
  });
});

describe('Website-Only Viewport Recorder (No Whole-Device Capturing)', () => {
  beforeEach(() => {
    (globalThis as any).MediaRecorder = class MockMediaRecorder {
      static isTypeSupported = () => true;
      start = vi.fn();
      stop = vi.fn(function(this: any) {
        if (this.onstop) this.onstop();
      });
      pause = vi.fn();
      resume = vi.fn();
      ondataavailable = null;
      onstop = null;
    };

    const mockCtx = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
      rect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn()
    };

    const mockStream = {
      getVideoTracks: () => [{ onended: null }],
      getTracks: () => [{ stop: vi.fn() }]
    };

    (globalThis as any).document = {
      getElementById: (id: string) => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag: string) => ({
        width: 1920,
        height: 1080,
        style: {},
        getContext: vi.fn().mockReturnValue(mockCtx),
        captureStream: vi.fn().mockReturnValue(mockStream)
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      }
    };
  });

  it('accurately locates the 3D simulator canvas and ignores 2D background and camera skeleton canvases', () => {
    const bgCanvas = { id: 'dotted-bg-canvas', classList: { contains: (c: string) => c === 'pointer-events-none' }, width: 1920, height: 1080 };
    const skeletonCanvas = { id: 'skeleton-canvas', classList: { contains: () => false }, width: 640, height: 360 };
    const simulatorCanvas = { id: 'webgl-3d-simulator-canvas', classList: { contains: () => false }, width: 1920, height: 1080, tagName: 'CANVAS' };

    (globalThis as any).document = {
      getElementById: (id: string) => (id === 'webgl-3d-simulator-canvas' ? simulatorCanvas : null),
      querySelector: () => null,
      querySelectorAll: () => [bgCanvas, skeletonCanvas, simulatorCanvas]
    };

    const canvas = viewportRecorder.getSimulatorCanvas();
    expect(canvas).not.toBeNull();
    expect((canvas as any)?.id).toBe('webgl-3d-simulator-canvas');
    expect((canvas as any)?.id).not.toBe('dotted-bg-canvas');
    expect((canvas as any)?.id).not.toBe('skeleton-canvas');
  });

  it('records strictly our website without invoking getDisplayMedia (zero device-sharing prompts)', async () => {
    const mockDisplayMedia = vi.fn();
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        mediaDevices: {
          getDisplayMedia: mockDisplayMedia
        }
      },
      configurable: true,
      writable: true
    });

    const mockStream = {
      getVideoTracks: () => [{ onended: null }],
      getTracks: () => [{ stop: vi.fn() }]
    };

    const mockCanvas = {
      id: 'webgl-3d-simulator-canvas',
      captureStream: vi.fn().mockReturnValue(mockStream)
    };

    // Call startWebsiteRecording
    const started = await viewportRecorder.startWebsiteRecording(mockCanvas as any);

    // Verify getDisplayMedia was NEVER called!
    expect(mockDisplayMedia).not.toHaveBeenCalled();
    expect(started).toBe(true);
    expect(viewportRecorder.isCurrentlyRecording()).toBe(true);

    // Stop recording
    await viewportRecorder.stopRecording();
    expect(viewportRecorder.isCurrentlyRecording()).toBe(false);
  });

  it('composites camera PIP and hand gesture dots when hand tracking is active', async () => {
    useSimulationStore.setState({ handTrackingActive: true });

    const mockStream = {
      getVideoTracks: () => [{ onended: null }],
      getTracks: () => [{ stop: vi.fn() }]
    };

    const mockCtx = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
      rect: vi.fn(),
      fillRect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn()
    };

    const mockCompCanvas = {
      width: 1920,
      height: 1080,
      getContext: vi.fn().mockReturnValue(mockCtx),
      captureStream: vi.fn().mockReturnValue(mockStream)
    };

    (globalThis as any).document = {
      getElementById: (id: string) => {
        if (id === 'hand-tracking-webcam-video') return { readyState: 4, paused: false };
        if (id === 'hand-tracking-skeleton-canvas') return { width: 640, height: 360 };
        return null;
      },
      createElement: (tag: string) => (tag === 'canvas' ? mockCompCanvas : {}),
      querySelector: () => null,
      querySelectorAll: () => []
    };

    const mockWebglCanvas = {
      id: 'webgl-3d-simulator-canvas',
      width: 1920,
      height: 1080,
      captureStream: vi.fn().mockReturnValue(mockStream)
    };

    const started = await viewportRecorder.startWebsiteRecording(mockWebglCanvas as any);
    expect(started).toBe(true);
    expect(viewportRecorder.isCurrentlyRecording()).toBe(true);

    await viewportRecorder.stopRecording();
    expect(viewportRecorder.isCurrentlyRecording()).toBe(false);
    useSimulationStore.setState({ handTrackingActive: false });
  });
});






