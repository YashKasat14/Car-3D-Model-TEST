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
  // Blender uses Z-up, Three.js uses Y-up
  // Convert: X -> X, Y -> -Z, Z -> Y
  positions.push(new THREE.Vector3(x, z, -y));
}
console.log(`Parsed ${positions.length} vertices`);

// 2. Read Loops (vertex indices)
const loopDataOffset = 3269692 + 24;
const numLoops = 84374;
const loopVertIndices = new Int32Array(numLoops);
for (let i = 0; i < numLoops; i++) {
  const o = loopDataOffset + i * 8;
  loopVertIndices[i] = buf.readInt32LE(o);
}
console.log(`Parsed ${numLoops} loop vertex indices`);

// 3. Read UVs
const uvDataOffset = 2257180 + 24;
const loopUVs = [];
for (let i = 0; i < numLoops; i++) {
  const o = uvDataOffset + i * 12;
  const u = buf.readFloatLE(o);
  const v = buf.readFloatLE(o + 4);
  loopUVs.push([u, v]);
}
console.log(`Parsed ${loopUVs.length} UV coordinates`);

// 4. Read Polygons and Triangulate
const polyDataOffset = 3944860 + 24;
const numPolys = 20944;

const finalPositions = [];
const finalUVs = [];

for (let i = 0; i < numPolys; i++) {
  const o = polyDataOffset + i * 12;
  const loopstart = buf.readInt32LE(o);
  const totloop = buf.readInt32LE(o + 4);

  if (totloop === 3) {
    const l0 = loopstart;
    const l1 = loopstart + 1;
    const l2 = loopstart + 2;

    const v0 = positions[loopVertIndices[l0]];
    const v1 = positions[loopVertIndices[l1]];
    const v2 = positions[loopVertIndices[l2]];

    finalPositions.push(v0.x, v0.y, v0.z);
    finalPositions.push(v1.x, v1.y, v1.z);
    finalPositions.push(v2.x, v2.y, v2.z);

    finalUVs.push(loopUVs[l0][0], loopUVs[l0][1]);
    finalUVs.push(loopUVs[l1][0], loopUVs[l1][1]);
    finalUVs.push(loopUVs[l2][0], loopUVs[l2][1]);
  } else if (totloop === 4) {
    // Quad -> 2 Triangles: (0, 1, 2) and (0, 2, 3)
    const l0 = loopstart;
    const l1 = loopstart + 1;
    const l2 = loopstart + 2;
    const l3 = loopstart + 3;

    const v0 = positions[loopVertIndices[l0]];
    const v1 = positions[loopVertIndices[l1]];
    const v2 = positions[loopVertIndices[l2]];
    const v3 = positions[loopVertIndices[l3]];

    // Tri 1
    finalPositions.push(v0.x, v0.y, v0.z);
    finalPositions.push(v1.x, v1.y, v1.z);
    finalPositions.push(v2.x, v2.y, v2.z);

    finalUVs.push(loopUVs[l0][0], loopUVs[l0][1]);
    finalUVs.push(loopUVs[l1][0], loopUVs[l1][1]);
    finalUVs.push(loopUVs[l2][0], loopUVs[l2][1]);

    // Tri 2
    finalPositions.push(v0.x, v0.y, v0.z);
    finalPositions.push(v2.x, v2.y, v2.z);
    finalPositions.push(v3.x, v3.y, v3.z);

    finalUVs.push(loopUVs[l0][0], loopUVs[l0][1]);
    finalUVs.push(loopUVs[l2][0], loopUVs[l2][1]);
    finalUVs.push(loopUVs[l3][0], loopUVs[l3][1]);
  } else if (totloop > 4) {
    // Fan triangulation for n-gon
    const l0 = loopstart;
    const v0 = positions[loopVertIndices[l0]];
    const uv0 = loopUVs[l0];

    for (let j = 1; j < totloop - 1; j++) {
      const l1 = loopstart + j;
      const l2 = loopstart + j + 1;

      const v1 = positions[loopVertIndices[l1]];
      const v2 = positions[loopVertIndices[l2]];

      finalPositions.push(v0.x, v0.y, v0.z);
      finalPositions.push(v1.x, v1.y, v1.z);
      finalPositions.push(v2.x, v2.y, v2.z);

      finalUVs.push(uv0[0], uv0[1]);
      finalUVs.push(loopUVs[l1][0], loopUVs[l1][1]);
      finalUVs.push(loopUVs[l2][0], loopUVs[l2][1]);
    }
  }
}

console.log(`Generated ${finalPositions.length / 3} triangle vertices`);

// Create Three.js geometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(finalPositions), 3));
geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(finalUVs), 2));
geometry.computeVertexNormals();

// Create PBR Material with Red Bull RB19 racing livery colors
const material = new THREE.MeshStandardMaterial({
  color: 0x061124, // Deep Oracle Red Bull navy blue
  roughness: 0.35,
  metalness: 0.75,
  name: 'mat_oracle_redbull_rb19'
});

const mesh = new THREE.Mesh(geometry, material);
mesh.name = 'chassis_monocoque_bodywork';

// Center and normalize geometry
geometry.computeBoundingBox();
const box = geometry.boundingBox;
const center = new THREE.Vector3();
box.getCenter(center);
const size = new THREE.Vector3();
box.getSize(size);
console.log('Original bounding box size:', size.toArray());
console.log('Original center:', center.toArray());

// Re-center mesh so bottom sits on floor y=0 and centered at x=0, z=0
mesh.position.set(-center.x, -box.min.y, -center.z);

const rootGroup = new THREE.Group();
rootGroup.name = 'oracle_redbull_rb19';
rootGroup.add(mesh);

// Export to GLB
const outDir = 'public/models/oracle-red-bull-rb19';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'model.glb');

const exporter = new GLTFExporter();
exporter.parse(
  rootGroup,
  (glb) => {
    fs.writeFileSync(outPath, Buffer.from(glb));
    console.log('Successfully exported Oracle Red Bull RB19 GLB to:', outPath, '(' + fs.statSync(outPath).size + ' bytes)');
  },
  (err) => {
    console.error('Error during GLTF export:', err);
  },
  { binary: true }
);
