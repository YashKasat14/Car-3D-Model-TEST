import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

interface EngineeringGroundLandProps {
  modelRadius: number;
  modelHeight: number;
}

/**
 * Engineering Showcase Ground / Land
 * Inspired by the reference simulator (rb19-simulator.vercel.app):
 * - Circular engineering turntable pedestal ("Land") supporting the vehicle
 * - Subtle red accent halo ring
 * - Precision pit-box stage boundary alignment lines
 * - Dark metallic studio floor plane with soft contact shadow reception
 */
export const EngineeringGroundLand: React.FC<EngineeringGroundLandProps> = ({
  modelRadius,
  modelHeight
}) => {
  const { customBackgroundColor } = useSimulationStore();

  // Platform radius adapts gracefully to any uploaded model's scale
  const landRadius = Math.max(3.8, modelRadius * 1.35);
  const groundY = - (modelHeight / 2);

  // Derive floor color complementary to custom background
  const floorColor = useMemo(() => {
    const bg = new THREE.Color(customBackgroundColor);
    // Slightly darker or tuned studio floor tone
    return bg.clone().multiplyScalar(0.7).getStyle();
  }, [customBackgroundColor]);

  return (
    <group position={[0, groundY, 0]}>
      {/* 1. Large Studio Ground Floor Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.065, 0]}
        receiveShadow
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={0.42}
          metalness={0.65}
        />
      </mesh>

      {/* 2. Engineering Showcase Turntable Pedestal ("Land") */}
      <mesh
        position={[0, -0.03, 0]}
        receiveShadow
        castShadow
      >
        <cylinderGeometry args={[landRadius, landRadius * 1.025, 0.06, 96]} />
        <meshStandardMaterial
          color="#13161f"
          roughness={0.35}
          metalness={0.78}
        />
      </mesh>

      {/* 3. Glowing Accent Ring on Turntable */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[landRadius * 0.94, landRadius * 0.965, 128]} />
        <meshBasicMaterial color="#e11d48" toneMapped={false} />
      </mesh>

      {/* 4. Inner Concentric Detail Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[landRadius * 0.65, landRadius * 0.66, 96]} />
        <meshBasicMaterial color="#334155" opacity={0.6} transparent toneMapped={false} />
      </mesh>

      {/* 5. Technical Pit-Box Alignment Lines on Ground */}
      {[
        [0, -landRadius * 1.35, landRadius * 2.4, 0.05],
        [0, landRadius * 1.35, landRadius * 2.4, 0.05],
        [-landRadius * 1.25, 0, 0.05, landRadius * 2.2],
        [landRadius * 1.25, 0, 0.05, landRadius * 2.2]
      ].map(([x, z, w, h], idx) => (
        <mesh
          key={idx}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x as number, -0.062, z as number]}
        >
          <planeGeometry args={[w as number, h as number]} />
          <meshBasicMaterial color="#ef4444" opacity={0.35} transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};
