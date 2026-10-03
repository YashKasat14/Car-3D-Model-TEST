import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

/**
 * Universal Dynamic Aerodynamic Streamline System
 * Directly inspired by the reference engineering simulator (rb19-simulator.vercel.app):
 * 1. Geometry-Adaptive: Streamlines dynamically scale and curve according to ANY uploaded model's
 *    bounding box (length, width, height, aspect ratio) and vehicle classification.
 * 2. Multi-Zone Coverage:
 *    - Left & Right Flanks (Sides): Comprehensive streamlines along the vehicle sides, sidepods, and wheel arches.
 *    - Front Stagnation & Splitter: Upstream air splitting over and around the nose.
 *    - Underfloor & Venturi Diffuser: High-velocity throat with dramatic rear diffuser upwash.
 *    - Upper Body & Wings: Flow over hood, canopy, roof, and rear wing downwash.
 *    - Trailing Wake & Vortices: Swirling helical tip vortices behind trailing surfaces.
 * 3. Animated Streaklines & Velocity Pulses:
 *    - Additive blending line segments with head/tail fade and speed-sensitive coloration.
 */
export const FlowVisualization: React.FC = () => {
  const { airflowActive, aerodynamics, activeModel, flowDirectionOverride } = useSimulationStore();
  const lineMeshRef = useRef<THREE.LineSegments>(null);
  const particleMeshRef = useRef<THREE.Points>(null);

  // Compute model bounding proportions dynamically
  const dims = useMemo(() => {
    let length = 4.8;
    let width = 2.0;
    let height = 1.15;
    let isAircraft = false;

    if (activeModel) {
      if (activeModel.dimensions) {
        length = Math.max(1.0, activeModel.dimensions.length || 4.8);
        width = Math.max(1.0, activeModel.dimensions.width || 2.0);
        height = Math.max(0.5, activeModel.dimensions.height || 1.15);
      }
      const name = (activeModel.name + ' ' + (activeModel.vehicleType || '')).toLowerCase();
      if (name.includes('plane') || name.includes('cessna') || name.includes('aircraft') || name.includes('flight') || width > length * 0.95) {
        isAircraft = true;
      }
    }

    return { length, width, height, isAircraft };
  }, [activeModel]);

  const effectiveAxis = useMemo(() => {
    return flowDirectionOverride || activeModel?.forwardAxis || '+z';
  }, [flowDirectionOverride, activeModel]);

  const POINTS_PER_LINE = 28;

  // Generate streamlines dynamically across all zones with dynamic orientation
  const { lines, linePositions, lineColors, particleBasePositions } = useMemo(() => {
    const { length, width, height, isAircraft } = dims;
    const generatedLines: Array<THREE.Vector3[]> = [];
    const pPositions: number[] = [];

    const halfL = length / 2;
    const halfW = width / 2;
    const halfH = height / 2;

    const zStart = halfL * 1.35; // Upstream entrance
    const zEnd = -halfL * 1.5;   // Downstream wake exit

    // Transform points so air ALWAYS flows from the model's authentic FRONT (+z, -z, +x, -x)
    const orientPoint = (rawX: number, rawY: number, rawZ: number): THREE.Vector3 => {
      if (effectiveAxis === '-z') {
        return new THREE.Vector3(-rawX, rawY, -rawZ);
      } else if (effectiveAxis === '+x') {
        return new THREE.Vector3(rawZ, rawY, -rawX);
      } else if (effectiveAxis === '-x') {
        return new THREE.Vector3(-rawZ, rawY, rawX);
      }
      return new THREE.Vector3(rawX, rawY, rawZ);
    };

    // Compute continuous 3D contour profile from the active model's real component nodes
    const shapeProfile = (() => {
      if (!activeModel?.components || activeModel.components.length === 0) {
        return null;
      }

      // Convert component positions to canonical forward-aligned space
      const canonicalPoints: Array<{ x: number; y: number; z: number }> = [];
      for (const comp of activeModel.components) {
        const orig = comp.originalPosition || [0, 0, 0];
        let p = { x: orig[0], y: orig[1], z: orig[2] };
        if (effectiveAxis === '-z') {
          p = { x: -orig[0], y: orig[1], z: -orig[2] };
        } else if (effectiveAxis === '+x') {
          p = { x: orig[2], y: orig[1], z: -orig[0] };
        } else if (effectiveAxis === '-x') {
          p = { x: -orig[2], y: orig[1], z: orig[0] };
        }
        canonicalPoints.push(p);
      }

      // Slices along longitudinal axis (front to rear)
      const SLICE_COUNT = 14;
      const slices: Array<{ topY: number; floorY: number; halfW: number }> = [];
      const stepZ = (halfL * 2) / SLICE_COUNT;

      for (let i = 0; i < SLICE_COUNT; i++) {
        const sliceCenterZ = halfL - (i + 0.5) * stepZ;
        const ptsInSlice = canonicalPoints.filter(pt => Math.abs(pt.z - sliceCenterZ) <= stepZ * 1.1);

        let topY = halfH * 0.2;
        let floorY = -halfH * 0.65;
        let halfWidth = halfW * 0.65;

        if (ptsInSlice.length > 0) {
          topY = Math.max(...ptsInSlice.map(p => p.y));
          floorY = Math.min(...ptsInSlice.map(p => p.y));
          halfWidth = Math.max(...ptsInSlice.map(p => Math.abs(p.x)));
        }

        slices.push({
          topY: Math.max(-halfH * 0.2, topY),
          floorY: Math.min(halfH * 0.1, floorY),
          halfW: Math.max(halfW * 0.35, halfWidth)
        });
      }

      const getTop = (z: number) => {
        const t = THREE.MathUtils.clamp((halfL - z) / (2 * halfL), 0, 1);
        const idxFloat = t * (SLICE_COUNT - 1);
        const i0 = Math.floor(idxFloat);
        const i1 = Math.min(SLICE_COUNT - 1, i0 + 1);
        const frac = idxFloat - i0;
        return THREE.MathUtils.lerp(slices[i0].topY, slices[i1].topY, frac);
      };

      const getFloor = (z: number) => {
        const t = THREE.MathUtils.clamp((halfL - z) / (2 * halfL), 0, 1);
        const idxFloat = t * (SLICE_COUNT - 1);
        const i0 = Math.floor(idxFloat);
        const i1 = Math.min(SLICE_COUNT - 1, i0 + 1);
        const frac = idxFloat - i0;
        return THREE.MathUtils.lerp(slices[i0].floorY, slices[i1].floorY, frac);
      };

      const getWidth = (z: number) => {
        const t = THREE.MathUtils.clamp((halfL - z) / (2 * halfL), 0, 1);
        const idxFloat = t * (SLICE_COUNT - 1);
        const i0 = Math.floor(idxFloat);
        const i1 = Math.min(SLICE_COUNT - 1, i0 + 1);
        const frac = idxFloat - i0;
        return Math.max(halfW * 0.35, THREE.MathUtils.lerp(slices[i0].halfW, slices[i1].halfW, frac));
      };

      return { getTop, getFloor, getWidth };
    })();

    // ZONE 1: SIDES / FLANKS / SIDEPODS (Follows authentic vehicle waist and wheel tracks)
    const sideStreamlineCount = 24;
    for (let i = 0; i < sideStreamlineCount; i++) {
      const isRight = (i % 2 === 0);
      const sideSign = isRight ? 1 : -1;
      const layer = Math.floor(i / 2) / (sideStreamlineCount / 2 - 1); // 0 to 1 elevation
      const layerOffset = (i % 3) * 0.07 + 0.05;
      const elevation = -halfH * 0.45 + layer * (height * 0.85);

      const pts: THREE.Vector3[] = [];
      for (let s = 0; s < POINTS_PER_LINE; s++) {
        const t = s / (POINTS_PER_LINE - 1);
        const z = THREE.MathUtils.lerp(zStart, zEnd, t);
        const bodyW = shapeProfile ? shapeProfile.getWidth(z) : halfW * 0.75;
        let x = sideSign * (bodyW + layerOffset);
        let y = elevation;

        // Upstream convergence towards front track
        if (z > halfL) {
          const lead = (z - halfL) / (zStart - halfL || 1);
          x = sideSign * THREE.MathUtils.lerp(bodyW + layerOffset, halfW * 0.6, lead);
        } else if (z < -halfL * 0.7) {
          // Rear tire / side wake vortex
          const wakeDist = -z - halfL * 0.7;
          const swirl = wakeDist * 6;
          x += sideSign * (Math.sin(swirl) * 0.08 * wakeDist + wakeDist * 0.12);
          y += Math.cos(swirl) * 0.06 * wakeDist;
        }

        pts.push(orientPoint(x, y, z));
      }
      generatedLines.push(pts);
    }

    // ZONE 2: UPPER SURFACES (Hugs real 3D nose, hood, windshield, roof, and rear wing)
    const upperCount = isAircraft ? 16 : 20;
    for (let i = 0; i < upperCount; i++) {
      const u = ((i % 5) / 4 - 0.5) * (width * 0.72);
      const layerMargin = 0.06 + Math.floor(i / 5) * (height * 0.18);
      const pts: THREE.Vector3[] = [];

      for (let s = 0; s < POINTS_PER_LINE; s++) {
        const t = s / (POINTS_PER_LINE - 1);
        const z = THREE.MathUtils.lerp(zStart, zEnd, t);
        const carTopY = shapeProfile ? shapeProfile.getTop(z) : halfH * 0.45;
        let x = u;
        let y = carTopY + layerMargin;

        if (z > halfL) {
          // Upstream air entering over the nose
          const lead = (z - halfL) / (zStart - halfL || 1);
          y = THREE.MathUtils.lerp(carTopY + layerMargin, halfH * 0.2 + layerMargin * 0.5, lead);
        } else if (z < -halfL * 0.7) {
          // Rear downwash / wake upwash
          const rearDist = -z - halfL * 0.7;
          if (!isAircraft) {
            y += Math.sin(Math.min(Math.PI * 0.5, rearDist * 2)) * 0.25 + rearDist * 0.08;
          } else {
            y -= rearDist * 0.12;
          }
        }

        pts.push(orientPoint(x, y, z));
      }
      generatedLines.push(pts);
    }

    // ZONE 3: UNDERFLOOR & VENTURI GROUND EFFECT (Conforms to actual floor height)
    const underCount = isAircraft ? 8 : 16;
    for (let i = 0; i < underCount; i++) {
      const u = ((i % 4) / 3 - 0.5) * (width * 0.65);
      const pts: THREE.Vector3[] = [];

      for (let s = 0; s < POINTS_PER_LINE; s++) {
        const t = s / (POINTS_PER_LINE - 1);
        const z = THREE.MathUtils.lerp(zStart, zEnd, t);
        const carFloorY = shapeProfile ? shapeProfile.getFloor(z) : -halfH * 0.75;
        let x = u;
        let y = carFloorY - 0.035;

        if (z <= -halfL * 0.1 && z >= -halfL * 0.7) {
          // Diffuser kick-up expansion
          const diffT = (-z - halfL * 0.1) / (halfL * 0.6);
          y += Math.pow(diffT, 2.0) * (height * 0.35);
        } else if (z < -halfL * 0.7) {
          // Diffuser wake plume
          const exitDist = -z - halfL * 0.7;
          y += height * 0.35 + exitDist * 0.12;
        }

        pts.push(orientPoint(x, y, z));
      }
      generatedLines.push(pts);
    }

    // ZONE 4: AIRCRAFT WINGTIP OR CAR ENDPLATE VORTICES
    const vortexCount = 8;
    for (let v = 0; v < vortexCount; v++) {
      const isRight = (v % 2 === 0);
      const sideSign = isRight ? 1 : -1;
      const tipOffset = shapeProfile ? shapeProfile.getWidth(-halfL * 0.5) * 1.05 : halfW * 0.9;
      const tipElev = shapeProfile ? shapeProfile.getTop(-halfL * 0.5) * 0.9 : (isAircraft ? halfH * 0.2 : -halfH * 0.1);
      const pts: THREE.Vector3[] = [];

      for (let s = 0; s < POINTS_PER_LINE; s++) {
        const t = s / (POINTS_PER_LINE - 1);
        const z = THREE.MathUtils.lerp(zStart, zEnd, t);
        let x = sideSign * tipOffset;
        let y = tipElev;

        if (z < -halfL * 0.3) {
          const vDist = -z - halfL * 0.3;
          const theta = vDist * 12 * sideSign;
          const r = Math.min(0.45, 0.08 + vDist * 0.18);
          x += Math.cos(theta) * r;
          y += Math.sin(theta) * r;
        }

        pts.push(orientPoint(x, y, z));
      }
      generatedLines.push(pts);
    }

    // Compile line segments and color gradients
    const positions: number[] = [];
    const colors: number[] = [];

    const cFront = new THREE.Color(0x38BDF8);   // Ice blue (entrance)
    const cHighVel = new THREE.Color(0x00E5FF); // Electric cyan (high velocity)
    const cDiffuser = new THREE.Color(0xEF4444); // Thermal red (expansion & drag)
    const cWake = new THREE.Color(0xF59E0B);     // Amber turbulence

    generatedLines.forEach((pts) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        positions.push(p1.x, p1.y, p1.z);
        positions.push(p2.x, p2.y, p2.z);

        const prog = i / (pts.length - 1);
        let col = cFront.clone();
        if (prog < 0.35) {
          col.lerp(cHighVel, prog / 0.35);
        } else if (prog < 0.7) {
          col.copy(cHighVel).lerp(cWake, (prog - 0.35) / 0.35);
        } else {
          col.copy(cWake).lerp(cDiffuser, (prog - 0.7) / 0.3);
        }

        colors.push(col.r, col.g, col.b);
        colors.push(col.r, col.g, col.b);
      }

      // Initial particle position along line
      const midPt = pts[Math.floor(pts.length / 2)];
      pPositions.push(midPt.x, midPt.y, midPt.z);
    });

    return {
      lines: generatedLines,
      linePositions: new Float32Array(positions),
      lineColors: new Float32Array(colors),
      particleBasePositions: new Float32Array(pPositions)
    };
  }, [dims, effectiveAxis]);

  // Create Three.js geometries with Additive Blending
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    return geo;
  }, [linePositions, lineColors]);

  const lineMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, []);

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particleBasePositions.slice(), 3));
    return geo;
  }, [particleBasePositions]);

  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0x00FFFF,
      size: 0.08,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, []);

  // Animated streamline flow and velocity pulses
  useFrame(({ clock }) => {
    if (!airflowActive) return;

    const t = clock.getElapsedTime();
    const speedRatio = Math.max(0.2, aerodynamics.airflowSpeedKmh / 240);

    // Pulse particles along the streamline paths
    if (particleMeshRef.current) {
      const posAttr = particleMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      lines.forEach((pts, lIdx) => {
        // Offset each streamline particle phase
        const phase = (t * 1.8 * speedRatio + lIdx * 0.17) % 1.0;
        const ptFloat = phase * (pts.length - 1);
        const i0 = Math.floor(ptFloat);
        const i1 = Math.min(pts.length - 1, i0 + 1);
        const frac = ptFloat - i0;

        const p0 = pts[i0];
        const p1 = pts[i1];

        arr[lIdx * 3] = p0.x + (p1.x - p0.x) * frac;
        arr[lIdx * 3 + 1] = p0.y + (p1.y - p0.y) * frac;
        arr[lIdx * 3 + 2] = p0.z + (p1.z - p0.z) * frac;
      });

      posAttr.needsUpdate = true;
    }

    // Dynamic line opacity breathing
    if (lineMeshRef.current) {
      lineMaterial.opacity = 0.55 + Math.sin(t * 4 * speedRatio) * 0.12;
    }
  });

  if (!airflowActive) return null;

  return (
    <group name="AerodynamicsStreamlineSystem">
      {/* Streamline paths */}
      <lineSegments
        ref={lineMeshRef}
        geometry={lineGeometry}
        material={lineMaterial}
      />
      {/* High-speed glowing velocity pulse particles */}
      <points
        ref={particleMeshRef}
        geometry={particleGeometry}
        material={particleMaterial}
      />
    </group>
  );
};
