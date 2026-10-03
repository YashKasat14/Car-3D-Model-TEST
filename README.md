# AURA 3D — Universal 3D Engineering Simulator Platform

> **Production-grade, browser-based 3D mechanical laboratory and digital-twin simulator built with Three.js, React, TypeScript, and WebGL.**
> Featuring a luxury warm white and brown aesthetic with an interactive dotted background that illuminates in a glowing bronze trail as your cursor moves.

---

## 🌟 Key Highlights

1. **Flagship Built-In Models**:
   - **2023 Formula 1 Ground-Effect Engineering Concept (RB19 Reference)**: Complete with 1.6L turbocharged V6 internal combustion engine, split turbocharger, MGU-K/MGU-H motor generators, Inconel exhaust headers, 8-speed seamless carbon gearbox, pushrod suspension, titanium Halo, and Venturi ground-effect underfloor tunnels.
   - **Aeronautical Twin-Turbofan Engineering Aircraft**: Airframe fuselage, supercritical airfoil wings, ailerons, elevators, rudder, double-slotted Fowler flaps, high-bypass turbofans with rotating titanium fan blades, and tricycle oleo-pneumatic landing gear.
   - **Scuderia Ferrari F60 Classic (From User-Uploaded Parts)**: Built directly from 24 individual OBJ components including front wing, rear wing, brake discs, suspension wishbones, and Bridgestone Potenza tyres.

2. **Universal Two-Layer Architecture**:
   - **Layer A (Universal Simulation Engine)**: Reusable 3D viewport, raycasting, component hierarchy, assembly/disassembly dependency graph, snapping, exploded view solver, X-Ray penetration, cross-section clipping, 3D point-to-point CAD measurement, illustrative aerodynamic flow, and Web Audio acoustic synthesizer.
   - **Layer B (Declarative Model Manifest)**: Clean JSON configuration describing component IDs, hierarchies, extraction vectors, snap targets, tolerances, and engineering specifications. Zero vehicle-specific logic is hard-coded into the core engine.

3. **User 3D Model Importer & Authoring Studio**:
   - Ingest any external `.GLB` or `.glTF` model directly in the browser.
   - Automated topological analysis (polygon count, vertices, draw calls, bounding boxes).
   - AI-assisted component name suggestions with human approval/edit/reject workflows.
   - Visual model authoring studio with real-time constraint validation.

4. **Premium White & Brown Visual System & Interactive Dotted Background**:
   - Refined luxury palette: warm ivory (`#FAF8F5`), rich espresso (`#1F1610`), and radiant bronze/amber (`#C2753C`, `#D97706`).
   - Interactive Canvas dot-matrix background that responds to mouse velocity, leaving a glowing bronze-amber trail along the cursor's path.

5. **Spatial Hand Tracking & Dual-Mode Controls**:
   - MediaPipe Hand Landmarker integration for contactless spatial cursor manipulation, pinch selection, and two-hand zoom.
   - Seamless, full-fidelity fallback to mouse and keyboard controls if camera is denied or unavailable.

---

## 🚀 Quick Start & Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v24)
- Modern WebGL2-compatible browser (Chrome, Edge, Firefox, Safari)

### Installation
```bash
# Navigate to project directory
cd C:\Users\yashs\.gemini\antigravity-ide\scratch\universal-3d-engineering-simulator

# Install dependencies
npm.cmd install
```

### Run Local Development Server
```bash
npm.cmd run dev
```
Open **[http://localhost:3000/](http://localhost:3000/)** in your browser.

### Run Automated Test Suite
```bash
npm.cmd run test
```

### Production Build
```bash
npm.cmd run build
```

---

## ⌨️ Control & Navigation Reference

### Mouse Controls
- **Left Click + Drag**: Orbit camera around target
- **Right Click + Drag**: Pan camera laterally
- **Scroll Wheel**: Zoom in / out
- **Left Click on Part**: Select component and reveal engineering telemetry panel

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `R` | **Reset & Reassemble**: Restores all removed components to factory position |
| `X` | **Cycle X-Ray Modes**: Normal PBR → Engineering X-Ray → Transparent Shell |
| `E` | **Toggle Exploded View**: Explodes assemblies hierarchically |
| `G` | **Toggle Vision Tracking**: Activates webcam hand tracking sensor |
| `C` | **Cycle Camera Angles**: Hero, Front, Side, Rear, Top, Powertrain |
| `Space` | **Toggle Mechanical Dynamics**: Play / Pause reciprocating motion |
| `ESC` | **Deselect**: Clears active component selection |

---

## 🛡️ Asset Provenance & Engineering Honesty

- **2023 Formula 1 RB19 Concept**: Ground effect aerodynamic surfaces and chassis dimensions are based on public FIA Technical Regulations (Article 3). Internal powertrain and hydraulic systems are illustrative educational representations.
- **Aeronautical Aircraft**: Structural geometries approximate standard transport category (FAR Part 25) aircraft configurations.
- **Audio Synthesis**: All vehicle acoustics are generated locally using the Web Audio API without pre-recorded copyrighted tracks.
