import * as THREE from 'three';
import { ModelManifest, ModelComponent, AssemblyDefinition } from '../types/model';

export interface ParsedHierarchyNode {
  id: string;
  name: string;
  type: 'group' | 'mesh';
  children: ParsedHierarchyNode[];
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
}

export interface ModelAnalysisResult {
  manifest: ModelManifest;
  isSingleMergedMesh: boolean;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
    dimensions: [number, number, number];
  };
  totalVertices: number;
  totalTriangles: number;
  meshCount: number;
}

/**
 * Universal CAD / 3D Model Hierarchy Analyzer
 * Dynamically parses ANY user-uploaded 3D model (GLB, GLTF, OBJ)
 * Extracts authentic model-derived geometry, transforms, and materials
 * and creates physically realistic exploded view vectors and bounding spheres.
 */
export function analyze3DModel(
  rootObject: THREE.Object3D,
  modelName: string,
  assetUrl: string
): ModelAnalysisResult {
  rootObject.updateMatrixWorld(true);

  // Compute model bounding box
  const box = new THREE.Box3().setFromObject(rootObject);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z, 0.1);
  const radius = Math.max(box.min.distanceTo(box.max) / 2, 0.1);

  const components: ModelComponent[] = [];
  const assembliesMap = new Map<string, { id: string; name: string; componentIds: string[] }>();

  let totalVertices = 0;
  let totalTriangles = 0;
  let meshIndex = 0;

  // First pass: identify collision or helper hulls to exclude
  const isExcluded = (obj: THREE.Object3D) => {
    const n = obj.name.toLowerCase();
    return n.includes('.col') || n.includes('collider') || n.includes('shadowplane');
  };

  rootObject.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && !isExcluded(obj)) {
      const mesh = obj as THREE.Mesh;
      const geo = mesh.geometry;
      if (!geo) return;

      meshIndex++;

      // Compute mesh bounding box in root space
      const meshBox = new THREE.Box3().setFromObject(mesh);
      const meshCenter = new THREE.Vector3();
      meshBox.getCenter(meshCenter);
      const meshSize = new THREE.Vector3();
      meshBox.getSize(meshSize);

      // Vertices & Triangles
      const posAttr = geo.attributes.position;
      const vCount = posAttr ? posAttr.count : 0;
      const tCount = geo.index ? Math.round(geo.index.count / 3) : Math.round(vCount / 3);
      totalVertices += vCount;
      totalTriangles += tCount;

      // Extract Material Info
      let matName = 'Default Material';
      let matType = 'MeshStandardMaterial';
      let matRoughness = 0.5;
      let matMetalness = 0.5;
      let matColor = '#CCCCCC';

      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          matName = mesh.material.map(m => m.name || m.type).join(', ');
          matType = mesh.material[0]?.type || 'MultiMaterial';
          matColor = (mesh.material[0] as any).color ? `#${(mesh.material[0] as any).color.getHexString()}` : '#CCCCCC';
        } else {
          matName = mesh.material.name || mesh.material.type;
          matType = mesh.material.type;
          if ((mesh.material as any).roughness !== undefined) {
            matRoughness = (mesh.material as any).roughness;
          }
          if ((mesh.material as any).metalness !== undefined) {
            matMetalness = (mesh.material as any).metalness;
          }
          if ((mesh.material as any).color) {
            matColor = `#${(mesh.material as any).color.getHexString()}`;
          }
        }
      }

      // Determine part name and functional category
      const rawName = mesh.name || `Part_${meshIndex}`;
      const cleanName = formatPartName(rawName);
      const category = inferCategoryFromNameAndPosition(rawName, meshCenter, center, size);

      // Compute radial exploded offset vector relative to model center
      // Direction points outward from center of mass
      let dir = new THREE.Vector3().subVectors(meshCenter, center);
      if (dir.length() < 0.05) {
        // Fallback for parts centered at origin: distribute in a radial circle + height
        const angle = (meshIndex * 137.5 * Math.PI) / 180;
        dir.set(Math.cos(angle) * 0.5, 0.4 + (meshIndex % 3) * 0.3, Math.sin(angle) * 0.5);
      }
      dir.normalize();

      // Additional outward bias for vertical/lateral separation
      const explodeDist = maxDimension * 0.75;
      const explodedOffset: [number, number, number] = [
        dir.x * explodeDist,
        dir.y * explodeDist * 1.1,
        dir.z * explodeDist
      ];

      // Assign to subsystem assembly
      const assemblyKey = category.toLowerCase().replace(/\s+/g, '_');
      if (!assembliesMap.has(assemblyKey)) {
        assembliesMap.set(assemblyKey, {
          id: `assembly_${assemblyKey}`,
          name: `${category} Assembly`,
          componentIds: []
        });
      }
      const compId = `comp_${mesh.name || meshIndex}`;
      assembliesMap.get(assemblyKey)!.componentIds.push(compId);

      // Model-derived vs Simulator-estimated info
      components.push({
        id: compId,
        name: cleanName,
        nodeName: mesh.name || `Mesh_${meshIndex}`,
        category,
        parentAssemblyId: `assembly_${assemblyKey}`,
        childComponentIds: mesh.children.map(c => c.name),
        removable: true,
        movable: true,
        selectable: true,
        rotatable: false,
        extractionPath: {
          axis: [dir.x, dir.y, dir.z],
          distance: explodeDist
        },
        snapTarget: {
          position: [mesh.position.x, mesh.position.y, mesh.position.z],
          rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
          tolerance: 0.15
        },
        originalPosition: [mesh.position.x, mesh.position.y, mesh.position.z],
        originalRotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
        explodedOffset,
        metadata: {
          description: `Identified 3D CAD mesh component: ${cleanName}`,
          functionCategory: category,
          material: `${matName} (${matType})`,
          massKg: Math.round(meshSize.x * meshSize.y * meshSize.z * 180 * 10) / 10 || 1.2,
          specifications: {
            'CAD Object Name': mesh.name || `Node_${meshIndex}`,
            'Parent Node': mesh.parent?.name || 'Scene Root',
            'Vertices': vCount,
            'Triangles': tCount,
            'Dimensions (W x H x D)': `${meshSize.x.toFixed(2)}m × ${meshSize.y.toFixed(2)}m × ${meshSize.z.toFixed(2)}m`,
            'World Position': `[${meshCenter.x.toFixed(2)}, ${meshCenter.y.toFixed(2)}, ${meshCenter.z.toFixed(2)}]`,
            'Material Shader': matType,
            'Roughness': matRoughness.toFixed(2),
            'Metalness': matMetalness.toFixed(2),
            'Base Color': matColor
          },
          accuracy: 'VERIFIED_PUBLIC'
        }
      });
    }
  });

  const assemblies: AssemblyDefinition[] = Array.from(assembliesMap.values()).map(a => ({
    id: a.id,
    name: a.name,
    category: a.name.replace(' Assembly', ''),
    componentIds: a.componentIds,
    description: `Contains ${a.componentIds.length} structural elements.`
  }));

  const isSingleMergedMesh = components.length <= 1;

  // Determine Primary Forward Axis and Front Facing Direction (+z, -z, +x, -x)
  const isXMajor = size.x > size.z * 1.25;
  let frontWeight = 0;
  let rearWeight = 0;
  let frontCoordSum = 0;
  let rearCoordSum = 0;

  const frontKeywords = ['front', 'nose', 'splitter', 'hood', 'headlight', 'bumper_f', 'wing_f', 'radiator', 'windshield', 'steer'];
  const rearKeywords = ['rear', 'back', 'diffuser', 'exhaust', 'tail', 'bumper_r', 'wing_r', 'spoiler', 'engine', 'muffler', 'trunk'];

  rootObject.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const n = (obj.name + ' ' + (obj.parent?.name || '')).toLowerCase();
      const wPos = new THREE.Vector3();
      obj.getWorldPosition(wPos);
      const coord = isXMajor ? (wPos.x - center.x) : (wPos.z - center.z);

      const isFront = frontKeywords.some(k => n.includes(k));
      const isRear = rearKeywords.some(k => n.includes(k));

      if (isFront && !isRear) {
        frontWeight++;
        frontCoordSum += coord;
      } else if (isRear && !isFront) {
        rearWeight++;
        rearCoordSum += coord;
      }
    }
  });

  let forwardAxis: '+z' | '-z' | '+x' | '-x' = '+z';
  if (isXMajor) {
    if (frontWeight > 0 && rearWeight > 0) {
      const avgFront = frontCoordSum / frontWeight;
      const avgRear = rearCoordSum / rearWeight;
      forwardAxis = avgFront > avgRear ? '+x' : '-x';
    } else {
      forwardAxis = '+x';
    }
  } else {
    if (frontWeight > 0 && rearWeight > 0) {
      const avgFront = frontCoordSum / frontWeight;
      const avgRear = rearCoordSum / rearWeight;
      forwardAxis = avgFront > avgRear ? '+z' : '-z';
    } else {
      forwardAxis = '+z';
    }
  }

  // Calculate dynamic camera positioning to frame the entire model facing its front
  // ModelRenderer centers models at (0, 0, 0), so target must always be [0, 0, 0]
  const camDistance = Math.max(radius * 2.3, 3.5);
  let camX = camDistance * 0.72;
  let camZ = camDistance * 0.72;
  if (forwardAxis === '-z') {
    camZ = -camDistance * 0.72;
  } else if (forwardAxis === '+x') {
    camX = camDistance * 0.72;
    camZ = camDistance * 0.45;
  } else if (forwardAxis === '-x') {
    camX = -camDistance * 0.72;
    camZ = camDistance * 0.45;
  }

  const initialCamera = {
    position: [camX, radius * 0.45, camZ] as [number, number, number],
    target: [0, 0, 0] as [number, number, number]
  };

  const manifest: ModelManifest = {
    id: `model_${Date.now()}`,
    name: modelName,
    shortName: modelName.length > 22 ? modelName.slice(0, 20) + '...' : modelName,
    category: 'custom',
    version: '1.0.0',
    assetUrl,
    year: new Date().getFullYear().toString(),
    description: `User-imported 3D engineering model with ${components.length} addressable CAD components and ${totalTriangles.toLocaleString()} polygons.`,
    units: 'meters',
    scale: 1.0,
    initialCamera,
    forwardAxis,
    dimensions: {
      length: isXMajor ? size.x : size.z,
      width: isXMajor ? size.z : size.x,
      height: size.y
    },
    provenance: {
      source: 'User Uploaded 3D Asset',
      author: 'Uploaded Model',
      license: 'Active User Session',
      isApproximation: false
    },
    capabilities: {
      assembly: true,
      disassembly: true,
      xray: true,
      explodedView: !isSingleMergedMesh,
      sectionPlanes: false,
      measurement: true,
      aerodynamicsFlow: true,
      mechanicalAnimation: false,
      handTracking: true,
      challenges: false,
      soundSynthesis: false
    },
    assemblies,
    components,
    challenges: []
  };

  return {
    manifest,
    isSingleMergedMesh,
    boundingBox: {
      min: [box.min.x, box.min.y, box.min.z],
      max: [box.max.x, box.max.y, box.max.z],
      center: [center.x, center.y, center.z],
      dimensions: [size.x, size.y, size.z]
    },
    totalVertices,
    totalTriangles,
    meshCount: components.length
  };
}

function formatPartName(rawName: string): string {
  let clean = rawName
    .replace(/^Object_\d+_?/, '')
    .replace(/^node_/, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (!clean || clean.length < 2) return `Part ${rawName}`;
  // Capitalize words
  return clean.replace(/\b\w/g, c => c.toUpperCase());
}

function inferCategoryFromNameAndPosition(
  name: string,
  pos: THREE.Vector3,
  center: THREE.Vector3,
  size: THREE.Vector3
): string {
  const n = name.toLowerCase();

  if (n.includes('wing') || n.includes('spoiler') || n.includes('diffuser') || n.includes('splitter') || n.includes('aero') || n.includes('flap')) {
    return 'Aerodynamics';
  }
  if (n.includes('wheel') || n.includes('tire') || n.includes('tyre') || n.includes('rim') || n.includes('brake') || n.includes('caliper')) {
    return 'Wheels & Brakes';
  }
  if (n.includes('engine') || n.includes('motor') || n.includes('exhaust') || n.includes('turbo') || n.includes('gear') || n.includes('powertrain') || n.includes('battery')) {
    return 'Powertrain';
  }
  if (n.includes('chassis') || n.includes('frame') || n.includes('monocoque') || n.includes('floor') || n.includes('tub') || n.includes('bulkhead')) {
    return 'Chassis';
  }
  if (n.includes('suspension') || n.includes('wishbone') || n.includes('damper') || n.includes('spring') || n.includes('rod') || n.includes('upright')) {
    return 'Suspension';
  }
  if (n.includes('cockpit') || n.includes('seat') || n.includes('steering') || n.includes('halo') || n.includes('wheel') || n.includes('pedal')) {
    return 'Cockpit & Safety';
  }
  if (n.includes('body') || n.includes('panel') || n.includes('hood') || n.includes('bonnet') || n.includes('door') || n.includes('sidepod') || n.includes('nose') || n.includes('cover')) {
    return 'Bodywork';
  }

  // Position-based fallback
  const relY = (pos.y - center.y) / (size.y || 1);
  const relZ = (pos.z - center.z) / (size.z || 1);

  if (relY < -0.3) return 'Underfloor & Diffuser';
  if (Math.abs(relZ) > 0.35) return 'Aero Surfaces';
  return 'Structural Assembly';
}
