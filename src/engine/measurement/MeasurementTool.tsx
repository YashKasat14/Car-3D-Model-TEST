import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

export const MeasurementTool: React.FC = () => {
  const { measurement } = useSimulationStore();
  const { active, pointA, pointB } = measurement;

  const distance = useMemo(() => {
    if (!pointA || !pointB) return null;
    const vA = new THREE.Vector3(...pointA);
    const vB = new THREE.Vector3(...pointB);
    return vA.distanceTo(vB);
  }, [pointA, pointB]);

  const midpoint = useMemo(() => {
    if (!pointA || !pointB) return null;
    return [
      (pointA[0] + pointB[0]) / 2,
      (pointA[1] + pointB[1]) / 2 + 0.1,
      (pointA[2] + pointB[2]) / 2
    ] as [number, number, number];
  }, [pointA, pointB]);

  const lineGeometry = useMemo(() => {
    if (!pointA || !pointB) return null;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...pointA),
      new THREE.Vector3(...pointB)
    ]);
    return geo;
  }, [pointA, pointB]);

  if (!active) return null;

  return (
    <group>
      {/* Point A Marker */}
      {pointA && (
        <mesh position={pointA}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color={0xEF4444} emissive={0xEF4444} emissiveIntensity={0.9} />
          <Html position={[0, 0.08, 0]} center distanceFactor={10}>
            <div className="bg-dark-950/95 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow border border-red-500/60 pointer-events-none whitespace-nowrap shadow-glow-red">
              POINT A [{(pointA[0]).toFixed(2)}, {(pointA[1]).toFixed(2)}, {(pointA[2]).toFixed(2)}]
            </div>
          </Html>
        </mesh>
      )}

      {/* Point B Marker */}
      {pointB && (
        <mesh position={pointB}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color={0x3B82F6} emissive={0x3B82F6} emissiveIntensity={0.9} />
          <Html position={[0, 0.08, 0]} center distanceFactor={10}>
            <div className="bg-dark-950/95 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow border border-blue-500/60 pointer-events-none whitespace-nowrap">
              POINT B [{(pointB[0]).toFixed(2)}, {(pointB[1]).toFixed(2)}, {(pointB[2]).toFixed(2)}]
            </div>
          </Html>
        </mesh>
      )}

      {/* Dimension Line & Measurement Badge */}
      {lineGeometry && distance !== null && midpoint && (
        <>
          {/* @ts-ignore line */}
          <line geometry={lineGeometry}>
            <lineBasicMaterial color={0xEF4444} linewidth={2} />
          </line>
          <Html position={midpoint} center distanceFactor={8}>
            <div className="bg-dark-950/95 backdrop-blur-md text-white font-mono text-xs px-3 py-1.5 rounded-lg shadow-premium-dark border border-red-500/60 flex flex-col items-center gap-0.5 pointer-events-none whitespace-nowrap">
              <span className="font-bold text-red-500">
                {(distance * 1000).toFixed(1)} mm <span className="text-[10px] text-dark-300">({distance.toFixed(3)} m)</span>
              </span>
              <span className="text-[9px] text-dark-400">ΔX: {Math.abs(pointB![0] - pointA![0]).toFixed(2)}m | ΔY: {Math.abs(pointB![1] - pointA![1]).toFixed(2)}m | ΔZ: {Math.abs(pointB![2] - pointA![2]).toFixed(2)}m</span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
};
