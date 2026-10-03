# Technical Architecture & System Design

## 1. Architectural Philosophy: The Two-Layer Principle

A fundamental requirement of the Universal 3D Engineering Simulator is that the core simulation engine must be completely decoupled from vehicle-specific data.

```
+-----------------------------------------------------------------------------------+
|                        LAYER A: UNIVERSAL SIMULATION ENGINE                       |
|                                                                                   |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  |  WebGL 3D Viewport  |   | Assembly Graph &    |   |  Exploded View Solver    | |
|  |  (Three.js / Fiber) |   | Snapping System     |   |  (Vector Translation)    | |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  |  X-Ray & Cross-     |   | 3D CAD Measurement  |   |  Aerodynamic Streamlines | |
|  |  Section Clipping   |   | (Point-to-Point)    |   |  (Particle Dynamics)     | |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  |  MediaPipe Vision   |   | Web Audio Real-time |   |  Viewport Video          | |
|  |  Spatial Tracking   |   | Synthesizer Engine  |   |  MediaRecorder           | |
|  +---------------------+   +---------------------+   +--------------------------+ |
+-----------------------------------------+-----------------------------------------+
                                          | Consumes via clean contracts
+-----------------------------------------v-----------------------------------------+
|                         LAYER B: DECLARATIVE MODEL DATA                           |
|                                                                                   |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  |  F1 RB19 Concept    |   | Aeronautical Jet    |   |  Ferrari F60 Classic     | |
|  |  Manifest + GLB     |   | Aircraft Manifest   |   |  (User Uploaded Parts)   | |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  |  User-Imported      |   | Guided Challenge    |   |  Provenance & Technical  | |
|  |  Custom Models      |   | Sequences           |   |  Metadata                | |
|  +---------------------+   +---------------------+   +--------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Structure

```
universal-3d-engineering-simulator/
├── public/
│   ├── models/
│   │   ├── f1-racer/model.glb
│   │   ├── airplane/model.glb
│   │   └── ferrari-f60/model.glb
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── DottedBackground.tsx       # Dynamic canvas with glowing brown trail
│   │   └── simulator/
│   │       ├── TopNavBar.tsx              # Telemetry, audio demo, recording, save/load
│   │       ├── LeftHierarchyPanel.tsx     # Searchable assembly node graph
│   │       ├── RightInspectionPanel.tsx   # Precision engineering metadata & specs
│   │       ├── BottomToolbar.tsx          # Explode, X-ray, section, airflow, camera
│   │       ├── PrerequisiteAlertModal.tsx # Mechanical constraint interlock feedback
│   │       ├── ChallengeHUD.tsx           # Step-by-step guided procedures
│   │       └── HandTrackingOverlay.tsx    # Spatial vision sensor & cursor
│   ├── engine/
│   │   ├── rendering/SceneViewport.tsx    # High-performance Three.js Canvas
│   │   ├── model-loader/ModelRenderer.tsx # PBR, X-Ray, and mechanical dynamics
│   │   ├── camera/CameraController.tsx    # Smooth animated camera angles
│   │   ├── flow/FlowVisualization.tsx     # Aerodynamic particle streamlines
│   │   ├── measurement/MeasurementTool.tsx# Point-to-point CAD dimensioning
│   │   ├── gestures/HandTrackingEngine.ts # MediaPipe vision processing & gestures
│   │   ├── audio/SoundEngine.ts           # Web Audio API engine & UI synthesizer
│   │   └── recording/ViewportRecorder.ts  # Canvas WebM video capture
│   ├── data/
│   │   ├── manifests/
│   │   │   ├── f1RacerManifest.ts
│   │   │   ├── airplaneManifest.ts
│   │   │   └── ferrariManifest.ts
│   │   └── modelsRegistry.ts              # Built-in and user model persistence
│   ├── stores/
│   │   └── simulationStore.ts             # Central reactive state & undo/redo
│   ├── types/
│   │   └── model.ts                       # Strict TypeScript model definitions
│   └── views/
│       ├── HomeHeroView.tsx               # Cinematic hero opening
│       ├── ModelLibraryView.tsx           # Interactive model card catalog
│       ├── SimulatorView.tsx              # Main engineering workstation
│       ├── ModelImporterView.tsx          # Model analysis & AI naming pipeline
│       ├── ModelAuthoringView.tsx         # In-browser CAD hierarchy & validation
│       ├── ChallengesView.tsx             # Guided assembly/inspection procedures
│       ├── DocumentationView.tsx          # Manuals, hotkeys, and schema specs
│       └── SettingsView.tsx               # Graphics profiles & lighting presets
```
