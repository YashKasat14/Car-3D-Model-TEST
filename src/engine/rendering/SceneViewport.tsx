import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Palette, Grid, Upload, Sparkles } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { ModelRenderer } from '../model-loader/ModelRenderer';
import { EngineeringGroundLand } from './EngineeringGroundLand';
import { CameraController } from '../camera/CameraController';
import { FlowVisualization } from '../flow/FlowVisualization';
import { MeasurementTool } from '../measurement/MeasurementTool';
import { EnvironmentColorControl } from '../../components/simulator/EnvironmentColorControl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { analyze3DModel } from '../../services/universalModelParser';
import { addModelToHistory } from '../../services/modelStorage';

// Ensures the WebGL canvas can be uniquely located by the recorder and never confused with 2D background/skeleton canvases
const ViewportCanvasRegistrar: React.FC = () => {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    if (gl?.domElement) {
      gl.domElement.id = 'webgl-3d-simulator-canvas';
      gl.domElement.setAttribute('data-simulator-viewport', 'true');
    }
  }, [gl]);
  return null;
};

// ErrorBoundary to ensure Canvas never crashes or turns permanently black if a 3D model takes time or has a decode issue
class ModelErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('3D Model Scene error caught by boundary:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#EF4444" wireframe />
          </mesh>
        </group>
      );
    }
    return this.props.children;
  }
}

export const SceneViewport: React.FC = () => {
  const {
    activeModel,
    graphicsProfile,
    customBackgroundColor,
    showGridHelper,
    toggleGridHelper,
    setActiveModel,
    setNotification,
    setHoveredComponent,
    selectComponent,
    refreshModelHistory
  } = useSimulationStore();

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isColorControlOpen, setIsColorControlOpen] = useState(false);

  // Drag & drop upload handler for ANY 3D model
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    loadDroppedModelFile(file);
  };

  const loadDroppedModelFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf' && ext !== 'obj') {
      alert('Please upload a valid 3D model (.GLB, .GLTF, or .OBJ).');
      return;
    }

    setNotification(`Analyzing 3D hierarchy: ${file.name}...`);
    const fileUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const buffer = ev.target?.result;
      if (!buffer) return;

      if (ext === 'obj') {
        const text = new TextDecoder().decode(buffer as ArrayBuffer);
        const objLoader = new OBJLoader();
        try {
          const rootObj = objLoader.parse(text);
          const analysis = analyze3DModel(rootObj, cleanName, fileUrl);
          await addModelToHistory(file, file.name, analysis.manifest);
          refreshModelHistory();
          setActiveModel(analysis.manifest);
          setNotification(`Loaded ${cleanName} (${analysis.meshCount} CAD parts).`);
          setTimeout(() => setNotification(null), 3500);
        } catch (err) {
          console.error(err);
          alert('Failed to parse .OBJ file.');
        }
      } else {
        const gltfLoader = new GLTFLoader();
        gltfLoader.parse(
          buffer as ArrayBuffer,
          '',
          async (gltf) => {
            const analysis = analyze3DModel(gltf.scene, cleanName, fileUrl);
            await addModelToHistory(file, file.name, analysis.manifest);
            refreshModelHistory();
            setActiveModel(analysis.manifest);
            if (analysis.isSingleMergedMesh) {
              setNotification(`Loaded ${cleanName} (Single merged mesh detected).`);
            } else {
              setNotification(`Loaded ${cleanName} (${analysis.meshCount} CAD components).`);
            }
            setTimeout(() => setNotification(null), 3500);
          },
          (err) => {
            console.error(err);
            alert('Failed to parse GLTF/GLB file.');
          }
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerLeave={() => setHoveredComponent(null)}
      className="relative w-full h-full select-none overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: customBackgroundColor }}
    >
      {/* Drag & Drop Visual Indicator */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-red-950/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-red-500 text-white animate-in fade-in">
          <Upload className="w-16 h-16 text-red-500 animate-bounce mb-3" />
          <h2 className="text-2xl font-mono font-bold uppercase tracking-wider">
            Drop 3D Model File (.GLB / .glTF / .OBJ)
          </h2>
          <p className="text-sm font-sans text-dark-300 mt-1">
            Analyzing component hierarchy and physical aerodynamics...
          </p>
        </div>
      )}

      {/* Floating Environment Customization Controls (Top-Right) */}
      <div className="absolute top-16 right-5 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-dark-950/90 backdrop-blur-md border border-dark-700/80 shadow-premium-dark font-mono text-[11px] text-white">
        <button
          onClick={() => setIsColorControlOpen(!isColorControlOpen)}
          title="Customize Background / Environment Color"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-white transition-colors border border-transparent hover:border-dark-600 font-mono text-xs font-semibold"
        >
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
            style={{ backgroundColor: customBackgroundColor }}
          />
          <span className="uppercase">CUSTOM COLOR</span>
        </button>
      </div>

      {/* Environment Color Picker Popup */}
      <EnvironmentColorControl
        isOpen={isColorControlOpen}
        onClose={() => setIsColorControlOpen(false)}
      />

      {/* 3D Canvas */}
      <Canvas
        shadows={graphicsProfile !== 'performance'}
        onPointerMissed={() => {
          selectComponent(null);
          setHoveredComponent(null);
        }}
        gl={{
          alpha: false,
          antialias: graphicsProfile !== 'performance',
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true // Required for reliable canvas capture & screenshot recording
        }}
        camera={{
          position: [5.8, 3.0, 5.8],
          fov: 46,
          near: 0.05,
          far: 2000
        }}
        className="w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <ViewportCanvasRegistrar />
        {/* Synchronize Three.js background color with customBackgroundColor */}
        <color attach="background" args={[customBackgroundColor]} />

        {/* Dynamic Studio Lighting System - Model remains clearly visible against ANY background */}
        <ambientLight intensity={0.95} color={0xFFFFFF} />
        <directionalLight
          position={[8, 14, 10]}
          intensity={2.2}
          castShadow={graphicsProfile !== 'performance'}
          shadow-mapSize-width={graphicsProfile === 'cinematic' ? 2048 : 1024}
          shadow-mapSize-height={graphicsProfile === 'cinematic' ? 2048 : 1024}
          shadow-bias={-0.0001}
          color={0xFFFFFF}
        />
        {/* Soft fill and rim lights for pristine edge definition */}
        <directionalLight position={[-8, 6, -8]} intensity={1.3} color={0x94A3B8} />
        <directionalLight position={[0, -6, 0]} intensity={0.5} color={0x64748B} />
        <directionalLight position={[0, 10, -10]} intensity={0.8} color={0xE2E8F0} />

        <ModelErrorBoundary>
          <Suspense fallback={null}>
            {activeModel && (
              <group key={`model_scene_group_${activeModel.id}`}>
                <EngineeringGroundLand
                  key={`land_${activeModel.id}`}
                  modelRadius={activeModel.dimensions ? Math.max(activeModel.dimensions.length, activeModel.dimensions.width) / 2 : 2.6}
                  modelHeight={activeModel.dimensions?.height || 1.15}
                />
                <ModelRenderer key={`renderer_${activeModel.id}`} manifest={activeModel} />
                <FlowVisualization key={`flow_${activeModel.id}`} />
                <MeasurementTool key={`measure_${activeModel.id}`} />
              </group>
            )}
          </Suspense>
        </ModelErrorBoundary>

        <CameraController />
      </Canvas>
    </div>
  );
};
