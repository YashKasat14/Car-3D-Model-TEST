import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
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

const blendPath = 'public/models/source/uncompressed.blend';
const buf = fs.readFileSync(blendPath);

// 1. Read Vertices
const vertDataOffset = 950672 + 24;
const numVerts = 22198;
const positions = [];
for (let i = 0; i < numVerts; i++) {
  const o = vertDataOffset + i * 16;
  const x = buf.readFloatLE(o);
  const y = buf.readFloatLE(o + 4);
  const z = buf.readFloatLE(o + 8);
  // Three.js: X -> X, Z -> Y, -Y -> Z
  positions.push(new THREE.Vector3(x, z, -y));
}

// Global centering
const box = new THREE.Box3().setFromPoints(positions);
const center = new THREE.Vector3();
box.getCenter(center);

positions.forEach(p => {
  p.x -= center.x;
  p.z -= center.z;
  p.y -= box.min.y;
});

// 2. Read Loops (vertex indices) & UVs
const loopDataOffset = 3269692 + 24;
const loopVertIndices = new Int32Array(84374);
for (let i = 0; i < 84374; i++) {
  loopVertIndices[i] = buf.readInt32LE(loopDataOffset + i * 8);
}

const uvDataOffset = 2257180 + 24;
const loopUVs = [];
for (let i = 0; i < 84374; i++) {
  const o = uvDataOffset + i * 12;
  const u = buf.readFloatLE(o);
  const v = buf.readFloatLE(o + 4);
  loopUVs.push([u, v]);
}

// 3. Read Polys and partition into assemblies
const polyDataOffset = 3944860 + 24;
const numPolys = 20944;

const partBuckets = {
  front_wing_assembly: { positions: [], uvs: [] },
  rear_wing_drs_assembly: { positions: [], uvs: [] },
  wheel_front_left: { positions: [], uvs: [] },
  wheel_front_right: { positions: [], uvs: [] },
  wheel_rear_left: { positions: [], uvs: [] },
  wheel_rear_right: { positions: [], uvs: [] },
  floor_underbody_diffuser: { positions: [], uvs: [] },
  chassis_monocoque_bodywork: { positions: [], uvs: [] }
};

for (let i = 0; i < numPolys; i++) {
  const o = polyDataOffset + i * 12;
  const loopstart = buf.readInt32LE(o);
  const totloop = buf.readInt32LE(o + 4);

  let cx = 0, cy = 0, cz = 0;
  for (let j = 0; j < totloop; j++) {
    const v = positions[loopVertIndices[loopstart + j]];
    cx += v.x; cy += v.y; cz += v.z;
  }
  cx /= totloop; cy /= totloop; cz /= totloop;

  let targetBucket = partBuckets.chassis_monocoque_bodywork;
  if (cz > 1.35) {
    targetBucket = partBuckets.front_wing_assembly;
  } else if (cz < -1.35 && cy > 0.45) {
    targetBucket = partBuckets.rear_wing_drs_assembly;
  } else if (cx < -0.55 && cz > 0.6) {
    targetBucket = partBuckets.wheel_front_left;
  } else if (cx > 0.55 && cz > 0.6) {
    targetBucket = partBuckets.wheel_front_right;
  } else if (cx < -0.55 && cz < -0.5) {
    targetBucket = partBuckets.wheel_rear_left;
  } else if (cx > 0.55 && cz < -0.5) {
    targetBucket = partBuckets.wheel_rear_right;
  } else if (cy < 0.14) {
    targetBucket = partBuckets.floor_underbody_diffuser;
  }

  // Triangulate
  if (totloop === 3) {
    for (let j = 0; j < 3; j++) {
      const idx = loopstart + j;
      const v = positions[loopVertIndices[idx]];
      targetBucket.positions.push(v.x, v.y, v.z);
      targetBucket.uvs.push(loopUVs[idx][0], loopUVs[idx][1]);
    }
  } else if (totloop === 4) {
    const l0 = loopstart, l1 = loopstart + 1, l2 = loopstart + 2, l3 = loopstart + 3;
    const v0 = positions[loopVertIndices[l0]];
    const v1 = positions[loopVertIndices[l1]];
    const v2 = positions[loopVertIndices[l2]];
    const v3 = positions[loopVertIndices[l3]];

    // Tri 1
    targetBucket.positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    targetBucket.uvs.push(loopUVs[l0][0], loopUVs[l0][1], loopUVs[l1][0], loopUVs[l1][1], loopUVs[l2][0], loopUVs[l2][1]);
    // Tri 2
    targetBucket.positions.push(v0.x, v0.y, v0.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
    targetBucket.uvs.push(loopUVs[l0][0], loopUVs[l0][1], loopUVs[l2][0], loopUVs[l2][1], loopUVs[l3][0], loopUVs[l3][1]);
  } else if (totloop > 4) {
    const l0 = loopstart;
    const v0 = positions[loopVertIndices[l0]];
    const uv0 = loopUVs[l0];
    for (let j = 1; j < totloop - 1; j++) {
      const l1 = loopstart + j, l2 = loopstart + j + 1;
      const v1 = positions[loopVertIndices[l1]];
      const v2 = positions[loopVertIndices[l2]];
      targetBucket.positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      targetBucket.uvs.push(uv0[0], uv0[1], loopUVs[l1][0], loopUVs[l1][1], loopUVs[l2][0], loopUVs[l2][1]);
    }
  }
}

// Materials with high visibility and vibrancy
const rbNavyMat = new THREE.MeshStandardMaterial({
  color: 0xFFFFFF, // Pure white base so diffuse texture map displays at 100% authentic vibrancy!
  roughness: 0.35,
  metalness: 0.4,
  name: 'mat_oracle_navy'
});

const rbCarbonMat = new THREE.MeshStandardMaterial({
  color: 0xFFFFFF,
  roughness: 0.5,
  metalness: 0.2,
  name: 'mat_carbon_fiber'
});

const rbTireMat = new THREE.MeshStandardMaterial({
  color: 0xFFFFFF,
  roughness: 0.8,
  metalness: 0.1,
  name: 'mat_tire_rubber'
});

const engineMat = new THREE.MeshStandardMaterial({
  color: 0x4A4642,
  roughness: 0.3,
  metalness: 0.85,
  name: 'mat_engine_block'
});

const goldHeatMat = new THREE.MeshStandardMaterial({
  color: 0xF59E0B, // Vibrant gold heat shielding
  roughness: 0.2,
  metalness: 0.9,
  name: 'mat_gold_heatshield'
});

const titaniumMat = new THREE.MeshStandardMaterial({
  color: 0x94A3B8, // Crisp titanium
  roughness: 0.25,
  metalness: 0.9,
  name: 'mat_titanium'
});

const rootGroup = new THREE.Group();
rootGroup.name = 'oracle_redbull_rb19';

// Add the 8 exterior meshes
Object.entries(partBuckets).forEach(([partName, data]) => {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(data.positions), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(data.uvs), 2));
  geo.computeVertexNormals();

  let mat = rbNavyMat;
  if (partName.includes('wheel')) mat = rbTireMat;
  else if (partName.includes('floor')) mat = rbCarbonMat;
  else if (partName.includes('wing')) mat = rbNavyMat;

  const partMesh = new THREE.Mesh(geo, mat);
  partMesh.name = partName;

  // IMPORTANT: For wheels, center the geometry around (0,0,0) and place mesh at axle center!
  // This allows clean rotation around their own axle hubs without swinging through the car!
  if (partName.includes('wheel')) {
    geo.computeBoundingBox();
    const wheelCenter = new THREE.Vector3();
    geo.boundingBox.getCenter(wheelCenter);
    geo.center(); // Center geometry vertices at (0, 0, 0)
    partMesh.position.copy(wheelCenter); // Position mesh at the actual wheel hub!
    console.log(`Centered ${partName} at hub:`, wheelCenter);
  }

  rootGroup.add(partMesh);
});

// Add Internal Power Unit and Mechanical Assemblies
const internalsGroup = new THREE.Group();
internalsGroup.name = 'power_unit_hybrid_subsystem';

// 1. Honda RBPT 1.6L V6 Engine Block
const engineGeo = new THREE.BoxGeometry(0.42, 0.32, 0.55);
const engineMesh = new THREE.Mesh(engineGeo, engineMat);
engineMesh.name = 'power_unit_ice_v6';
engineMesh.position.set(0, 0.35, -0.45);
internalsGroup.add(engineMesh);

// 2. Turbocharger & MGU-H
const turboGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.14, 16);
turboGeo.rotateZ(Math.PI / 2);
const turboMesh = new THREE.Mesh(turboGeo, goldHeatMat);
turboMesh.name = 'turbo_compressor';
turboMesh.position.set(0, 0.48, -0.15);
internalsGroup.add(turboMesh);

// 3. MGU-K
const mgukGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
mgukGeo.rotateX(Math.PI / 2);
const mgukMesh = new THREE.Mesh(mgukGeo, goldHeatMat);
mgukMesh.name = 'mgu_k_motor_generator';
mgukMesh.position.set(-0.16, 0.22, -0.3);
internalsGroup.add(mgukMesh);

// 4. Inconel Exhaust System
const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 16);
exhaustGeo.rotateX(Math.PI / 2);
const exhaustMesh = new THREE.Mesh(exhaustGeo, titaniumMat);
exhaustMesh.name = 'exhaust_central_tailpipe';
exhaustMesh.position.set(0, 0.42, -0.85);
internalsGroup.add(exhaustMesh);

// 5. 8-Speed Seamless Carbon Gearbox
const gearboxGeo = new THREE.BoxGeometry(0.28, 0.26, 0.45);
const gearboxMesh = new THREE.Mesh(gearboxGeo, engineMat);
gearboxMesh.name = 'drivetrain_gearbox';
gearboxMesh.position.set(0, 0.28, -1.05);
internalsGroup.add(gearboxMesh);

// 6. Grade-5 Titanium Survival Halo Ring
const haloCurve = new THREE.TorusGeometry(0.31, 0.03, 12, 24, Math.PI);
haloCurve.rotateX(Math.PI / 2);
const haloMesh = new THREE.Mesh(haloCurve, titaniumMat);
haloMesh.name = 'safety_halo_titanium_core';
haloMesh.position.set(0, 0.68, 0.15);
internalsGroup.add(haloMesh);

rootGroup.add(internalsGroup);

console.log('Exporting modular GLB with centered wheel hubs...');

const exporter = new GLTFExporter();
exporter.parse(
  rootGroup,
  (gltf) => {
    const outPath = 'public/models/oracle-red-bull-rb19/model.glb';
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(gltf));
    console.log('Successfully generated RB19 GLB:', outPath);
  },
  (err) => {
    console.error('Export error:', err);
  },
  { binary: true }
);
