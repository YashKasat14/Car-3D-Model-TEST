export type ModelCategory = 'formula1' | 'aircraft' | 'automotive' | 'robotics' | 'industrial' | 'custom';

export type AccuracyLevel = 'VERIFIED_PUBLIC' | 'INFERRED' | 'ILLUSTRATIVE' | 'NOT_PUBLICLY_DISCLOSED';

export interface ProvenanceInfo {
  source: string;
  author: string;
  license: string;
  url?: string;
  isApproximation: boolean;
  notes?: string;
}

export interface AttachmentPoint {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  connectedComponentId?: string;
  type: 'bolt' | 'pin' | 'spline' | 'magnetic' | 'hinge' | 'clamp';
}

export interface ExtractionPath {
  axis: [number, number, number]; // Normalized direction vector
  distance: number; // Extraction distance in meters
  rotationAxis?: [number, number, number];
  rotationAngle?: number;
}

export interface SnapTarget {
  position: [number, number, number];
  rotation: [number, number, number];
  tolerance: number; // Max distance in meters to snap (e.g. 0.15m)
}

export interface ComponentMetadata {
  description: string;
  functionCategory: string;
  material: string;
  massKg?: number;
  specifications: Record<string, string | number>;
  accuracy: AccuracyLevel;
  sourceReference?: string;
}

export interface ModelComponent {
  id: string;
  name: string;
  nodeName: string; // Three.js Object3D name
  category: string;
  parentAssemblyId?: string;
  childComponentIds?: string[];
  prerequisites?: string[]; // IDs of components that must be removed before this can be removed
  removable: boolean;
  movable: boolean;
  selectable: boolean;
  rotatable: boolean;
  extractionPath: ExtractionPath;
  snapTarget: SnapTarget;
  originalPosition: [number, number, number];
  originalRotation: [number, number, number];
  explodedOffset: [number, number, number];
  metadata: ComponentMetadata;
  isRemoved?: boolean;
  isIsolated?: boolean;
}

export interface AssemblyDefinition {
  id: string;
  name: string;
  category: string;
  colorHex?: string;
  componentIds: string[];
  subAssemblyIds?: string[];
  description?: string;
}

export interface ChallengeStep {
  id: string;
  instruction: string;
  targetComponentId: string;
  action: 'select' | 'remove' | 'inspect' | 'snap' | 'animate';
  hint: string;
  explanation: string;
}

export interface EngineeringChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  steps: ChallengeStep[];
}

export interface ModelManifest {
  id: string;
  name: string;
  shortName: string;
  category: ModelCategory;
  version: string;
  assetUrl: string;
  thumbnailUrl?: string;
  description: string;
  year?: string;
  provenance: ProvenanceInfo;
  units: 'meters' | 'millimeters';
  scale: number;
  initialCamera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  forwardAxis?: '+z' | '-z' | '+x' | '-x';
  vehicleType?: string;
  estimatedTriangles?: number;
  components: ModelComponent[];
  assemblies: AssemblyDefinition[];
  capabilities: {
    assembly: boolean;
    disassembly: boolean;
    xray: boolean;
    explodedView: boolean;
    sectionPlanes: boolean;
    measurement: boolean;
    aerodynamicsFlow: boolean;
    mechanicalAnimation: boolean;
    handTracking: boolean;
    challenges: boolean;
    soundSynthesis: boolean;
  };
  challenges: EngineeringChallenge[];
}
