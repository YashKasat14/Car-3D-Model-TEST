import React, { useState } from 'react';
import {
  Upload, ChevronLeft, CheckCircle2, AlertTriangle, FileCode,
  Layers, ArrowRight, Sparkles, Check, X, Edit2, Play
} from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useSimulationStore } from '../stores/simulationStore';
import { ModelManifest, ModelComponent } from '../types/model';
import { saveUserModel } from '../data/modelsRegistry';

interface AnalyzedMesh {
  id: string;
  name: string;
  originalName: string;
  suggestedName: string;
  approved: boolean;
  triangleCount: number;
  materialName: string;
  category: string;
  removable: boolean;
  extractionAxis: [number, number, number];
}

export const ModelImporterView: React.FC = () => {
  const { setActiveView, setActiveModel } = useSimulationStore();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Analyze & Edit Suggestions, 3: Review & Launch
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelName, setModelName] = useState('Custom Engineering Asset');
  const [modelCategory, setModelCategory] = useState<'automotive' | 'aircraft' | 'robotics' | 'industrial' | 'custom'>('custom');
  const [stats, setStats] = useState({ triangles: 0, vertices: 0, meshes: 0, materials: 0, sizeMB: 0 });
  const [analyzedMeshes, setAnalyzedMeshes] = useState<AnalyzedMesh[]>([]);
  const [fileUrl, setFileUrl] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setModelName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const loader = new GLTFLoader();

      loader.parse(
        buffer,
        '',
        (gltf) => {
          let totalTriangles = 0;
          let totalVertices = 0;
          const meshes: AnalyzedMesh[] = [];
          const matNames = new Set<string>();

          gltf.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              const geo = mesh.geometry;
              const triangles = geo.index ? geo.index.count / 3 : (geo.attributes.position ? geo.attributes.position.count / 3 : 0);
              const vertices = geo.attributes.position ? geo.attributes.position.count : 0;
              totalTriangles += Math.round(triangles);
              totalVertices += vertices;

              const matName = Array.isArray(mesh.material)
                ? mesh.material.map(m => m.name || 'default').join(', ')
                : (mesh.material?.name || 'default');
              matNames.add(matName);

              // Suggest humanized name
              const cleanName = mesh.name
                .replace(/^mesh[_-]/i, '')
                .replace(/[_-]/g, ' ')
                .trim();
              const suggested = cleanName
                ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
                : `Component ${meshes.length + 1}`;

              // Auto-infer extraction axis from position
              const pos = mesh.position;
              let axis: [number, number, number] = [0, 1, 0];
              if (Math.abs(pos.x) > Math.abs(pos.y) && Math.abs(pos.x) > Math.abs(pos.z)) {
                axis = [pos.x > 0 ? 1 : -1, 0, 0];
              } else if (Math.abs(pos.z) > Math.abs(pos.y)) {
                axis = [0, 0, pos.z > 0 ? 1 : -1];
              }

              meshes.push({
                id: `comp_${mesh.name || meshes.length}`,
                name: suggested,
                originalName: mesh.name || `Node_${meshes.length}`,
                suggestedName: suggested,
                approved: true,
                triangleCount: Math.round(triangles),
                materialName: matName,
                category: inferCategory(suggested),
                removable: true,
                extractionAxis: axis
              });
            }
          });

          setStats({
            triangles: totalTriangles,
            vertices: totalVertices,
            meshes: meshes.length,
            materials: matNames.size,
            sizeMB: Number((file.size / (1024 * 1024)).toFixed(2))
          });

          setAnalyzedMeshes(meshes);
          setIsProcessing(false);
          setStep(2);
        },
        (error) => {
          console.error('Failed to parse 3D model', error);
          alert('Could not parse GLB file. Please check that the file is a valid GLTF 2.0 binary.');
          setIsProcessing(false);
        }
      );
    };

    reader.readAsArrayBuffer(file);
  };

  const inferCategory = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('wing') || n.includes('aero') || n.includes('flap') || n.includes('spoiler')) return 'Aerodynamics';
    if (n.includes('engine') || n.includes('motor') || n.includes('turbine') || n.includes('gear')) return 'Powertrain';
    if (n.includes('wheel') || n.includes('tire') || n.includes('suspension') || n.includes('brake')) return 'Chassis';
    if (n.includes('halo') || n.includes('chassis') || n.includes('body') || n.includes('frame')) return 'Structure';
    return 'General Assembly';
  };

  const updateMeshField = (index: number, field: keyof AnalyzedMesh, value: any) => {
    setAnalyzedMeshes(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleFinalizeImport = () => {
    const generatedComponents: ModelComponent[] = analyzedMeshes.map(m => ({
      id: m.id,
      name: m.name,
      nodeName: m.originalName,
      category: m.category,
      parentAssemblyId: 'primary_assembly',
      removable: m.removable,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: {
        axis: m.extractionAxis,
        distance: 0.8
      },
      snapTarget: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        tolerance: 0.25
      },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      metadata: {
        description: `Imported CAD component (${m.triangleCount} polygons).`,
        functionCategory: m.category,
        material: m.materialName,
        specifications: {
          'Triangle Count': `${m.triangleCount.toLocaleString()} polys`,
          'Material': m.materialName,
          'Original Node': m.originalName
        },
        accuracy: 'INFERRED'
      },
      explodedOffset: [m.extractionAxis[0] * 0.8, m.extractionAxis[1] * 0.8, m.extractionAxis[2] * 0.8],
      prerequisites: []
    }));

    const newManifest: ModelManifest = {
      id: `user_model_${Date.now()}`,
      name: modelName,
      shortName: modelName.slice(0, 20),
      category: modelCategory as any,
      version: '1.0.0',
      assetUrl: fileUrl,
      year: new Date().getFullYear().toString(),
      description: `User-imported CAD digital-twin model (${stats.meshes} nodes, ${stats.triangles.toLocaleString()} polys).`,
      units: 'meters',
      scale: 1.0,
      initialCamera: {
        position: [4.8, 1.8, 4.6],
        target: [0, 0.35, 0]
      },
      provenance: {
        source: 'User Uploaded GLB Digital Twin',
        author: 'Laboratory Engineer',
        license: 'Custom Asset',
        isApproximation: false
      },
      capabilities: {
        assembly: true,
        disassembly: true,
        xray: true,
        explodedView: true,
        sectionPlanes: true,
        measurement: true,
        aerodynamicsFlow: true,
        mechanicalAnimation: false,
        handTracking: true,
        challenges: false,
        soundSynthesis: false
      },
      assemblies: [
        {
          id: 'primary_assembly',
          name: 'Primary Subsystem',
          category: 'Structure',
          colorHex: '#EF4444',
          componentIds: generatedComponents.map(c => c.id),
          description: 'Top-level imported structural assembly.'
        }
      ],
      components: generatedComponents,
      challenges: []
    };

    saveUserModel(newManifest);
    setActiveModel(newManifest);
    setActiveView('simulator');
  };

  return (
    <div className="relative min-h-screen px-6 py-8 sm:px-12 z-10 flex flex-col max-w-5xl mx-auto space-y-8 text-white">
      {/* Header */}
      <div className="border-b border-red-500/20 pb-4">
        <button
          onClick={() => setActiveView('library')}
          className="flex items-center gap-1.5 text-xs font-mono font-medium text-dark-300 hover:text-white mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-red-500" />
          <span>BACK TO ARCHIVE</span>
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
          3D MODEL INGESTION PIPELINE
        </h2>
        <p className="text-xs sm:text-sm text-dark-400 font-sans mt-1">
          Upload any GLB or glTF CAD model. Automatically parse nodes, verify topology, and map semantic assembly hierarchies.
        </p>
      </div>

      {/* STEP 1: Upload Dropzone */}
      {step === 1 && (
        <div className="bg-dark-900/90 rounded-2xl border-2 border-dashed border-red-500/40 p-12 text-center space-y-5 shadow-premium-dark">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-700 text-red-500 flex items-center justify-center mx-auto shadow-glow-red">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-white font-mono uppercase tracking-wider">
              Select or Drop 3D Model File
            </h3>
            <p className="text-xs text-dark-400 max-w-md mx-auto">
              Supported formats: <strong className="font-mono text-white">.GLB, .glTF</strong>. Models will be analyzed on client without remote upload for maximum security and privacy.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold cursor-pointer transition-all shadow-glow-red hover:scale-105">
            <FileCode className="w-4 h-4" />
            <span>BROWSE FILE FROM DISK</span>
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-red-400 animate-pulse pt-2">
              <Sparkles className="w-4 h-4" />
              <span>Analyzing geometric hierarchy and materials...</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Analysis & AI Suggestions Review */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Top Model Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-dark-900/90 p-4 rounded-2xl border border-red-500/25 shadow-sm font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-dark-400 block uppercase">ASSET NAME</span>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-dark-950 border border-dark-700 text-white font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-dark-400 block uppercase">ENGINEERING CATEGORY</span>
              <select
                value={modelCategory}
                onChange={(e) => setModelCategory(e.target.value as any)}
                className="w-full px-2.5 py-1 rounded-lg bg-dark-950 border border-dark-700 text-white font-bold focus:outline-none focus:border-red-500 uppercase"
              >
                <option value="automotive">Automotive</option>
                <option value="aircraft">Aerospace</option>
                <option value="robotics">Robotics</option>
                <option value="industrial">Industrial</option>
                <option value="custom">Custom Asset</option>
              </select>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
              <button
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-lg border border-dark-700 text-dark-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeImport}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-glow-red transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>FINALIZE & SIMULATE</span>
              </button>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs text-center">
            <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-800">
              <span className="text-[10px] text-dark-400 block">TOTAL NODES</span>
              <span className="font-bold text-base text-white">{stats.meshes}</span>
            </div>
            <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-800">
              <span className="text-[10px] text-dark-400 block">TRIANGLES</span>
              <span className="font-bold text-base text-white">{stats.triangles.toLocaleString()}</span>
            </div>
            <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-800">
              <span className="text-[10px] text-dark-400 block">VERTICES</span>
              <span className="font-bold text-base text-white">{stats.vertices.toLocaleString()}</span>
            </div>
            <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-800">
              <span className="text-[10px] text-dark-400 block">MATERIALS</span>
              <span className="font-bold text-base text-white">{stats.materials}</span>
            </div>
            <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-dark-400 block">ASSET SIZE</span>
              <span className="font-bold text-base text-white">{stats.sizeMB} MB</span>
            </div>
          </div>

          {/* Node Breakdown Table */}
          <div className="bg-dark-900/90 rounded-2xl border border-red-500/20 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-dark-950 border-b border-dark-800 flex items-center justify-between font-mono text-xs text-white">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span className="font-bold">CAD Hierarchy Mapping ({analyzedMeshes.length} Components)</span>
              </div>
              <span className="text-dark-400">Click name to customize</span>
            </div>

            <div className="divide-y divide-dark-800 max-h-96 overflow-y-auto font-mono text-xs">
              {analyzedMeshes.map((mesh, idx) => (
                <div key={mesh.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-dark-800/40 transition-colors">
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      value={mesh.name}
                      onChange={(e) => updateMeshField(idx, 'name', e.target.value)}
                      className="font-bold text-white bg-transparent border-b border-transparent hover:border-red-500/40 focus:border-red-500 focus:outline-none"
                    />
                    <div className="text-[10px] text-dark-400">
                      Original: <span className="font-sans italic">{mesh.originalName}</span> • {mesh.triangleCount.toLocaleString()} polys • Mat: {mesh.materialName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-dark-950 text-dark-300 border border-dark-800 uppercase">
                      {mesh.category}
                    </span>
                    <button
                      onClick={() => updateMeshField(idx, 'removable', !mesh.removable)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        mesh.removable
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : 'bg-dark-950 text-dark-400 border-dark-800'
                      }`}
                    >
                      {mesh.removable ? 'REMOVABLE' : 'LOCKED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
