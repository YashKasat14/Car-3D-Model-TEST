import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

if (typeof FileReader === 'undefined') {
  global.FileReader = class {
    constructor() {
      this.onloadend = null;
      this.onload = null;
      this.result = null;
    }
    async readAsArrayBuffer(blob) {
      if (blob.arrayBuffer) {
        this.result = await blob.arrayBuffer();
      } else if (Buffer.isBuffer(blob)) {
        this.result = blob.buffer;
      } else {
        this.result = blob;
      }
      setTimeout(() => {
        if (this.onload) this.onload({ target: { result: this.result } });
        if (this.onloadend) this.onloadend();
      }, 0);
    }
  };
}

const inputPath = path.join(process.cwd(), 'public/models/f1-racer/model.glb');
const buf = fs.readFileSync(inputPath);
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuffer, '', (gltf) => {
  const rootScene = gltf.scene;

  // Engineering Materials
  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x332E2B, // Dark metallic cast aluminum/magnesium
    roughness: 0.35,
    metalness: 0.85,
    name: 'mat_f1_engine_block'
  });

  const goldHeatShieldMat = new THREE.MeshStandardMaterial({
    color: 0xD4A054, // Thermal gold reflective foil
    roughness: 0.2,
    metalness: 0.9,
    name: 'mat_gold_heatshield'
  });

  const bronzeInconelMat = new THREE.MeshStandardMaterial({
    color: 0xB5652B, // Heat-tempered Inconel exhaust bronze
    roughness: 0.4,
    metalness: 0.8,
    name: 'mat_inconel_exhaust'
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x1A1817, // Carbon composite weave
    roughness: 0.6,
    metalness: 0.2,
    name: 'mat_carbon_fiber'
  });

  const redBremboMat = new THREE.MeshStandardMaterial({
    color: 0x8C2A20, // Rich warm racing red / deep terracotta
    roughness: 0.3,
    metalness: 0.7,
    name: 'mat_brake_caliper'
  });

  const suspensionChromeMat = new THREE.MeshStandardMaterial({
    color: 0x4A4440, // Titanium suspension steel
    roughness: 0.25,
    metalness: 0.9,
    name: 'mat_titanium_suspension'
  });

  // Internal Assemblies Group
  const internalsGroup = new THREE.Group();
  internalsGroup.name = 'power_unit_assembly';
  internalsGroup.position.set(0, 0, 0);

  // 1. 1.6L 90° V6 ICE Engine Block (sitting behind cockpit at z ~ -0.4 to -1.1)
  const engineGeo = new THREE.BoxGeometry(0.55, 0.42, 0.7);
  const engineMesh = new THREE.Mesh(engineGeo, engineMat);
  engineMesh.name = 'power_unit_ice_v6';
  engineMesh.position.set(0, 0.45, -0.65);
  internalsGroup.add(engineMesh);

  // V6 Cylinder Heads (slanted left & right)
  const headGeo = new THREE.BoxGeometry(0.24, 0.16, 0.65);
  const headL = new THREE.Mesh(headGeo, bronzeInconelMat);
  headL.name = 'cylinder_head_left';
  headL.position.set(-0.22, 0.58, -0.65);
  headL.rotation.z = 0.35;
  internalsGroup.add(headL);

  const headR = new THREE.Mesh(headGeo, bronzeInconelMat);
  headR.name = 'cylinder_head_right';
  headR.position.set(0.22, 0.58, -0.65);
  headR.rotation.z = -0.35;
  internalsGroup.add(headR);

  // 2. Split Turbocharger & MGU-H
  const turboCompressorGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.16, 16);
  turboCompressorGeo.rotateZ(Math.PI / 2);
  const turboCompressor = new THREE.Mesh(turboCompressorGeo, goldHeatShieldMat);
  turboCompressor.name = 'turbo_compressor';
  turboCompressor.position.set(0, 0.62, -0.28);
  internalsGroup.add(turboCompressor);

  const turboShaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12);
  turboShaftGeo.rotateX(Math.PI / 2);
  const turboShaft = new THREE.Mesh(turboShaftGeo, suspensionChromeMat);
  turboShaft.name = 'mgu_h_motor_generator';
  turboShaft.position.set(0, 0.62, -0.58);
  internalsGroup.add(turboShaft);

  const turboTurbineGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.16, 16);
  turboTurbineGeo.rotateZ(Math.PI / 2);
  const turboTurbine = new THREE.Mesh(turboTurbineGeo, bronzeInconelMat);
  turboTurbine.name = 'turbo_turbine';
  turboTurbine.position.set(0, 0.62, -0.88);
  internalsGroup.add(turboTurbine);

  // 3. MGU-K (Kinetic Motor Generator attached to crank lower side)
  const mgukGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.38, 16);
  mgukGeo.rotateX(Math.PI / 2);
  const mgukMesh = new THREE.Mesh(mgukGeo, goldHeatShieldMat);
  mgukMesh.name = 'mgu_k_motor_generator';
  mgukMesh.position.set(-0.2, 0.28, -0.45);
  internalsGroup.add(mgukMesh);

  // 4. Inconel Exhaust Manifolds & Central Exhaust Pipe
  const exhaustLGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 10);
  exhaustLGeo.rotateZ(Math.PI / 3);
  const exhaustL = new THREE.Mesh(exhaustLGeo, bronzeInconelMat);
  exhaustL.name = 'exhaust_manifold_left';
  exhaustL.position.set(-0.32, 0.52, -0.72);
  internalsGroup.add(exhaustL);

  const exhaustRGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 10);
  exhaustRGeo.rotateZ(-Math.PI / 3);
  const exhaustR = new THREE.Mesh(exhaustRGeo, bronzeInconelMat);
  exhaustR.name = 'exhaust_manifold_right';
  exhaustR.position.set(0.32, 0.52, -0.72);
  internalsGroup.add(exhaustR);

  // Central exhaust tailpipe exiting beneath rear wing
  const tailpipeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.8, 16);
  tailpipeGeo.rotateX(Math.PI / 2);
  const tailpipe = new THREE.Mesh(tailpipeGeo, bronzeInconelMat);
  tailpipe.name = 'exhaust_central_tailpipe';
  tailpipe.position.set(0, 0.58, -1.35);
  internalsGroup.add(tailpipe);

  // 5. 8-Speed Longitudinal Carbon-Titanium Gearbox Casing
  const gearboxGeo = new THREE.BoxGeometry(0.36, 0.34, 0.75);
  const gearboxMesh = new THREE.Mesh(gearboxGeo, carbonMat);
  gearboxMesh.name = 'drivetrain_gearbox';
  gearboxMesh.position.set(0, 0.38, -1.28);
  internalsGroup.add(gearboxMesh);

  // 6. Sidepod Radiators & Intercoolers (Left & Right)
  const radGeo = new THREE.BoxGeometry(0.18, 0.32, 0.85);
  const radL = new THREE.Mesh(radGeo, suspensionChromeMat);
  radL.name = 'radiator_intercooler_left';
  radL.position.set(-0.55, 0.42, -0.2);
  radL.rotation.y = 0.25;
  radL.rotation.z = -0.2;
  internalsGroup.add(radL);

  const radR = new THREE.Mesh(radGeo, suspensionChromeMat);
  radR.name = 'radiator_intercooler_right';
  radR.position.set(0.55, 0.42, -0.2);
  radR.rotation.y = -0.25;
  radR.rotation.z = 0.2;
  internalsGroup.add(radR);

  // 7. Suspension Wishbones & Pushrods
  function createSuspensionWishbones(isFront, isLeft) {
    const group = new THREE.Group();
    const signX = isLeft ? 1 : -1;
    const signZ = isFront ? 1 : -1;
    group.name = `suspension_${isFront ? 'front' : 'rear'}_${isLeft ? 'left' : 'right'}`;

    const zBase = isFront ? 1.6 : -1.35;
    const xBase = signX * 0.45;
    const yBase = 0.38;

    // Upper wishbone
    const upperGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.48, 8);
    upperGeo.rotateZ(signX * 0.4);
    const upper = new THREE.Mesh(upperGeo, suspensionChromeMat);
    upper.name = `wishbone_upper_${isFront ? 'f' : 'r'}_${isLeft ? 'l' : 'r'}`;
    upper.position.set(xBase + signX * 0.18, yBase + 0.1, zBase);
    group.add(upper);

    // Lower wishbone
    const lowerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.52, 8);
    lowerGeo.rotateZ(signX * 0.2);
    const lower = new THREE.Mesh(lowerGeo, suspensionChromeMat);
    lower.name = `wishbone_lower_${isFront ? 'f' : 'r'}_${isLeft ? 'l' : 'r'}`;
    lower.position.set(xBase + signX * 0.2, yBase - 0.08, zBase);
    group.add(lower);

    // Pushrod / Pullrod
    const rodGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.56, 8);
    rodGeo.rotateZ(signX * -0.6);
    const rod = new THREE.Mesh(rodGeo, bronzeInconelMat);
    rod.name = `pushrod_${isFront ? 'f' : 'r'}_${isLeft ? 'l' : 'r'}`;
    rod.position.set(xBase + signX * 0.18, yBase + 0.04, zBase + signZ * 0.08);
    group.add(rod);

    // Brake caliper
    const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.14);
    const caliper = new THREE.Mesh(caliperGeo, redBremboMat);
    caliper.name = `brake_caliper_${isFront ? 'f' : 'r'}_${isLeft ? 'l' : 'r'}`;
    caliper.position.set(xBase + signX * 0.42, yBase, zBase);
    group.add(caliper);

    return group;
  }

  internalsGroup.add(createSuspensionWishbones(true, true));
  internalsGroup.add(createSuspensionWishbones(true, false));
  internalsGroup.add(createSuspensionWishbones(false, true));
  internalsGroup.add(createSuspensionWishbones(false, false));

  // 8. Halo Safety Structure / Survival Cell Monocoque interior
  const haloGeo = new THREE.TorusGeometry(0.35, 0.038, 12, 24, Math.PI);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMesh = new THREE.Mesh(haloGeo, carbonMat);
  haloMesh.name = 'safety_halo_titanium_core';
  haloMesh.position.set(0, 0.84, 0.45);
  internalsGroup.add(haloMesh);

  rootScene.add(internalsGroup);

  // Rename original components for crystal-clear engineering semantic identification
  rootScene.traverse(obj => {
    if (obj.name === 'ground-effect-racer_0') {
      obj.name = 'chassis_monocoque_bodywork';
    } else if (obj.name === 'ground-effect-racer_1') {
      obj.name = 'front_wing_assembly';
    } else if (obj.name === 'ground-effect-racer_2') {
      obj.name = 'rear_wing_drs_assembly';
    } else if (obj.name === 'ground-effect-racer_3') {
      obj.name = 'floor_underbody_diffuser';
    } else if (obj.name === 'ground-effect-racer_20') {
      obj.name = 'cockpit_halo_fairings';
    }
  });

  const exporter = new GLTFExporter();
  exporter.parse(
    rootScene,
    (enrichedGlb) => {
      fs.writeFileSync(inputPath, Buffer.from(enrichedGlb));
      console.log('Successfully saved enriched F1 GLB to:', inputPath, '(' + fs.statSync(inputPath).size + ' bytes)');
    },
    (err) => {
      console.error('Error exporting enriched F1 GLB:', err);
    },
    { binary: true }
  );
}, (err) => {
  console.error('Failed to parse F1 model for enrichment:', err);
});
