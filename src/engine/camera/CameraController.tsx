import React, { useEffect, useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { handTrackingEngine } from '../gestures/HandTrackingEngine';

interface InspectionKeyframe {
  name: string;
  calcPosition: (fVec: THREE.Vector3, sVec: THREE.Vector3, d: number, r: number) => THREE.Vector3;
}

const INSPECTION_SEQUENCE: InspectionKeyframe[] = [
  {
    name: '1. Front View',
    calcPosition: (fVec, sVec, d, r) => fVec.clone().multiplyScalar(d).setY(r * 0.15)
  },
  {
    name: '2. Front-Left Quarter',
    calcPosition: (fVec, sVec, d, r) => fVec.clone().multiplyScalar(d * 0.72).addScaledVector(sVec, d * 0.72).setY(r * 0.25)
  },
  {
    name: '3. Left Profile View',
    calcPosition: (fVec, sVec, d, r) => sVec.clone().multiplyScalar(d).setY(r * 0.2)
  },
  {
    name: '4. Rear-Left Quarter',
    calcPosition: (fVec, sVec, d, r) => fVec.clone().multiplyScalar(-d * 0.72).addScaledVector(sVec, d * 0.72).setY(r * 0.25)
  },
  {
    name: '5. Rear View',
    calcPosition: (fVec, sVec, d, r) => fVec.clone().multiplyScalar(-d).setY(r * 0.25)
  },
  {
    name: '6. Rear-Right Quarter',
    calcPosition: (fVec, sVec, d, r) => fVec.clone().multiplyScalar(-d * 0.72).addScaledVector(sVec, -d * 0.72).setY(r * 0.25)
  },
  {
    name: '7. Right Profile View',
    calcPosition: (fVec, sVec, d, r) => sVec.clone().multiplyScalar(-d).setY(r * 0.2)
  },
  {
    name: '8. Front-Right Quarter',
    calcPosition: (fVec, sVec, d, r) => fVec.clone().multiplyScalar(d * 0.72).addScaledVector(sVec, -d * 0.72).setY(r * 0.25)
  },
  {
    name: '9. Top Aero Plan View',
    calcPosition: (fVec, sVec, d, r) => new THREE.Vector3(0, d * 1.35, 0.001)
  },
  {
    name: '10. Underside / Diffuser View',
    calcPosition: (fVec, sVec, d, r) => new THREE.Vector3(0, -d * 1.15, 0.001)
  }
];

export const CameraController: React.FC = () => {
  const {
    cameraPreset,
    activeModel,
    isFrameAllSequenceRunning,
    frameAllSequenceStep,
    stopFrameAllSequence,
    setFrameAllSequenceStep,
    isGizmoDragging,
    handTrackingActive,
    setExplodedPercent
  } = useSimulationStore();

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const isTransitioning = useRef<boolean>(false);
  const targetCamPos = useRef(new THREE.Vector3(5, 2.5, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Dynamic metrics computed from active model - model is centered at origin (0, 0, 0)
  const metrics = useMemo(() => {
    let radius = 2.5;
    if (activeModel?.dimensions) {
      radius = Math.max(activeModel.dimensions.length, activeModel.dimensions.width, activeModel.dimensions.height) / 2;
    }
    radius = Math.max(radius, 1.5);
    const distance = Math.max(radius * 2.3, 3.5);
    const center = new THREE.Vector3(0, 0, 0);

    return { center, radius, distance };
  }, [activeModel]);

  // Directional vectors based on model forwardAxis (+z, -z, +x, -x)
  const directionalVectors = useMemo(() => {
    const axis = activeModel?.forwardAxis || '+z';
    let frontVec = new THREE.Vector3(0, 0, 1);
    let sideVec = new THREE.Vector3(1, 0, 0);
    if (axis === '-z') {
      frontVec.set(0, 0, -1);
      sideVec.set(-1, 0, 0);
    } else if (axis === '+x') {
      frontVec.set(1, 0, 0);
      sideVec.set(0, 0, -1);
    } else if (axis === '-x') {
      frontVec.set(-1, 0, 0);
      sideVec.set(0, 0, 1);
    }
    return { frontVec, sideVec };
  }, [activeModel?.forwardAxis]);

  // Inspection sequence timing
  const sequenceTimer = useRef<number>(0);
  const currentStepRef = useRef<number>(0);

  // Instantly reset and frame model when activeModel ID changes (Fixes black screen when shifting models)
  useEffect(() => {
    if (!activeModel) return;
    isTransitioning.current = true;
    targetLookAt.current.set(0, 0, 0);
    const { frontVec, sideVec } = directionalVectors;
    const { radius, distance } = metrics;
    targetCamPos.current
      .copy(frontVec)
      .multiplyScalar(distance * 0.72)
      .addScaledVector(sideVec, distance * 0.72)
      .setY(radius * 0.45);

    camera.position.copy(targetCamPos.current);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [activeModel?.id, metrics, directionalVectors, camera]);

  // Handle Preset Transitions (Front, Side, Rear, Top, Hero, etc.)
  useEffect(() => {
    if (isFrameAllSequenceRunning) return;

    isTransitioning.current = true;
    const { distance, radius } = metrics;
    const { frontVec, sideVec } = directionalVectors;
    targetLookAt.current.set(0, 0, 0);

    switch (cameraPreset) {
      case 'hero':
        targetCamPos.current
          .copy(frontVec)
          .multiplyScalar(distance * 0.72)
          .addScaledVector(sideVec, distance * 0.72)
          .setY(radius * 0.45);
        break;
      case 'front':
        targetCamPos.current.copy(frontVec).multiplyScalar(distance).setY(radius * 0.15);
        break;
      case 'side':
        targetCamPos.current.copy(sideVec).multiplyScalar(distance).setY(radius * 0.2);
        break;
      case 'rear':
        targetCamPos.current.copy(frontVec).multiplyScalar(-distance).setY(radius * 0.25);
        break;
      case 'top':
        targetCamPos.current.set(0, distance * 1.35, 0.001);
        break;
      case 'bottom':
        targetCamPos.current.set(0, -distance * 1.15, 0.001);
        break;
      case 'powertrain':
      case 'cockpit':
        targetCamPos.current
          .copy(frontVec)
          .multiplyScalar(distance * 0.3)
          .addScaledVector(sideVec, distance * 0.45)
          .setY(radius * 0.5);
        break;
    }
  }, [cameraPreset, metrics, directionalVectors, isFrameAllSequenceRunning]);

  // Real-time Hand-Tracking Guided Camera Orbit & Tilt (similar to rb19-simulator pinch action)
  // Hand Tracking Gestures:
  // 1. Dual-Hand Pinch: moves the screen (camera orbit & pan)
  // 2. Dual-Hand Spread / Close: moving hands far apart explodes model, bringing hands close collides/reassembles model
  // (Single-hand pinch is handled by ModelRenderer to move 3D objects)
  useEffect(() => {
    if (!handTrackingActive) return;

    let prevMidPos: { x: number; y: number } | null = null;
    let prevPinchDist: number | null = null;
    let prevHandDist: number | null = null;
    let smoothedHandDist: number | null = null;

    const unsub = handTrackingEngine.subscribe((status) => {
      if (!status.active || !status.tracking) {
        prevMidPos = null;
        prevPinchDist = null;
        prevHandDist = null;
        smoothedHandDist = null;
        return;
      }

      const left = status.leftHand;
      const right = status.rightHand;
      const bothDetected = left.detected && right.detected;
      const bothPinching = bothDetected && left.isPinching && right.isPinching;

      // 1. DUAL-HAND PINCH:
      // "if i pinch with both hands it moves the screen"
      // "when i move the hand far when pinch then the screen must zoom out"
      if (bothPinching) {
        const midX = (left.x + right.x) / 2;
        const midY = (left.y + right.y) / 2;
        const currentPinchDist = status.handDistance;

        const px = camera.position.x;
        const py = camera.position.y;
        const pz = camera.position.z;
        let rad = Math.max(1.8, Math.hypot(px, py, pz));
        let theta = Math.atan2(px, pz);
        let phi = Math.acos(THREE.MathUtils.clamp(py / rad, -1, 1));

        // A. Orbit & tilt screen when moving both pinching hands
        if (prevMidPos) {
          const dx = midX - prevMidPos.x;
          const dy = midY - prevMidPos.y;
          if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            const orbitSpeed = 5.2;
            theta -= dx * orbitSpeed;
            phi = THREE.MathUtils.clamp(phi + dy * orbitSpeed, 0.08, Math.PI - 0.08);
          }
        }

        // B. Zoom out / in when moving pinching hands farther apart / closer
        if (prevPinchDist !== null) {
          const deltaPinch = currentPinchDist - prevPinchDist;
          if (Math.abs(deltaPinch) > 0.004 && Math.abs(deltaPinch) < 0.16) {
            // Moving hand far when pinch -> radius increases -> ZOOM OUT
            // Bringing hand close when pinch -> radius decreases -> ZOOM IN
            const zoomSpeed = 16.0;
            rad = THREE.MathUtils.clamp(rad + deltaPinch * zoomSpeed, 2.0, 32.0);
          }
        }

        camera.position.set(
          rad * Math.sin(phi) * Math.sin(theta),
          rad * Math.cos(phi),
          rad * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(0, 0, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        prevMidPos = { x: midX, y: midY };
        prevPinchDist = currentPinchDist;
        prevHandDist = null; // Do not trigger explode while pinching
        smoothedHandDist = null;
        return;
      }

      prevMidPos = null;
      prevPinchDist = null;

      // 2. DUAL-HAND SPREAD & CONTRACT (Free hands / open palms):
      // "and when free hands and i my hand is far not moved far is far then too the car gets explode"
      // Fix: If hands are stationary (even if far apart!), the car must NOT explode!
      if (bothDetected && !left.isPinching && !right.isPinching) {
        const rawDist = status.handDistance;

        // Apply Exponential Moving Average filter to eliminate sensor jitter
        if (smoothedHandDist === null) {
          smoothedHandDist = rawDist;
          prevHandDist = rawDist;
          return;
        }
        const moveMagnitude = Math.abs(rawDist - smoothedHandDist);
        const distAlpha = moveMagnitude > 0.015 ? 0.90 : 0.60;
        smoothedHandDist = smoothedHandDist * (1 - distAlpha) + rawDist * distAlpha;

        if (prevHandDist !== null) {
          const deltaDist = smoothedHandDist - prevHandDist;

          // Reject sudden tracking teleport jumps (e.g. hand entering frame)
          if (Math.abs(deltaDist) > 0.16) {
            prevHandDist = smoothedHandDist;
            return;
          }

          // Strict Deadzone: If hands are resting or holding steady (delta <= 0.010),
          // DO NOT CHANGE explode percent! This prevents phantom explosions when hands are far apart but stationary.
          const DEADZONE = 0.010;
          if (Math.abs(deltaDist) > DEADZONE) {
            const currentExp = useSimulationStore.getState().explodedPercent;
            const effectiveDelta = deltaDist > 0 ? deltaDist - DEADZONE : deltaDist + DEADZONE;
            const targetExp = Math.max(0, Math.min(100, Math.round(currentExp + effectiveDelta * 180)));
            if (targetExp !== currentExp) {
              setExplodedPercent(targetExp);
            }
          }
        }
        prevHandDist = smoothedHandDist;
        return;
      }

      prevHandDist = null;
      smoothedHandDist = null;
    });

    return () => unsub();
  }, [handTrackingActive, camera, metrics, setExplodedPercent]);

  // Handle Frame All Sequence Start
  useEffect(() => {
    if (isFrameAllSequenceRunning) {
      currentStepRef.current = 0;
      sequenceTimer.current = 0;
      const step = INSPECTION_SEQUENCE[0];
      const { distance, radius } = metrics;
      const { frontVec, sideVec } = directionalVectors;
      targetCamPos.current = step.calcPosition(frontVec, sideVec, distance, radius);
      targetLookAt.current.set(0, 0, 0);
      setFrameAllSequenceStep(0, step.name);
    } else if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [isFrameAllSequenceRunning, metrics, directionalVectors, setFrameAllSequenceStep]);

  // Frame Update for Camera Motion & Inspection Sequence Timing
  useFrame((_, delta) => {
    // 1. If inspection sequence is running, advance steps smoothly
    if (isFrameAllSequenceRunning) {
      sequenceTimer.current += delta;

      // Each viewpoint holds for ~2.6 seconds while the camera glides
      if (sequenceTimer.current >= 2.6) {
        sequenceTimer.current = 0;
        const nextStep = currentStepRef.current + 1;

        if (nextStep < INSPECTION_SEQUENCE.length) {
          currentStepRef.current = nextStep;
          const step = INSPECTION_SEQUENCE[nextStep];
          const { distance, radius } = metrics;
          const { frontVec, sideVec } = directionalVectors;
          targetCamPos.current = step.calcPosition(frontVec, sideVec, distance, radius);
          targetLookAt.current.set(0, 0, 0);
          setFrameAllSequenceStep(nextStep, step.name);
        } else {
          // Sequence completed
          stopFrameAllSequence();
        }
      }

      // Smooth camera interpolation during sequence
      camera.position.lerp(targetCamPos.current, 0.06);
      camera.lookAt(0, 0, 0);
    }
    // 2. Preset transition lerp
    else if (isTransitioning.current) {
      camera.position.lerp(targetCamPos.current, 0.08);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      }
      if (camera.position.distanceTo(targetCamPos.current) < 0.04) {
        isTransitioning.current = false;
      }
    }

    if (controlsRef.current && !isFrameAllSequenceRunning) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isGizmoDragging && !isFrameAllSequenceRunning}
      target={[0, 0, 0]}
      enableDamping={true}
      dampingFactor={0.06}
      rotateSpeed={0.8}
      panSpeed={0.8}
      zoomSpeed={0.9}
      minDistance={0.2}
      maxDistance={60}
      minPolarAngle={0.001}
      maxPolarAngle={Math.PI - 0.001}
      onStart={() => {
        // Stop inspection sequence and preset transitions the moment user interacts
        if (isFrameAllSequenceRunning) {
          stopFrameAllSequence();
        }
        isTransitioning.current = false;
      }}
    />
  );
};
