import fs from 'fs';
import * as THREE from 'three';

const blendPath = 'public/models/source/uncompressed.blend';
const buf = fs.readFileSync(blendPath);

// Vertices
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

// Compute global center to center the car
const box = new THREE.Box3().setFromPoints(positions);
const center = new THREE.Vector3();
box.getCenter(center);
console.log('Global bounds:', box.min.toArray(), box.max.toArray());
console.log('Center:', center.toArray());

// Re-center so x=0, z=0, and min.y = 0
positions.forEach(p => {
  p.x -= center.x;
  p.z -= center.z;
  p.y -= box.min.y;
});

const newBox = new THREE.Box3().setFromPoints(positions);
console.log('Centered bounds:', newBox.min.toArray(), newBox.max.toArray());

// Polys & Loops
const loopDataOffset = 3269692 + 24;
const loopVertIndices = new Int32Array(84374);
for (let i = 0; i < 84374; i++) {
  loopVertIndices[i] = buf.readInt32LE(loopDataOffset + i * 8);
}

const polyDataOffset = 3944860 + 24;
const numPolys = 20944;

const partCounts = {
  front_wing: 0,
  rear_wing: 0,
  wheel_fl: 0,
  wheel_fr: 0,
  wheel_rl: 0,
  wheel_rr: 0,
  floor_diffuser: 0,
  chassis: 0
};

for (let i = 0; i < numPolys; i++) {
  const o = polyDataOffset + i * 12;
  const loopstart = buf.readInt32LE(o);
  const totloop = buf.readInt32LE(o + 4);

  // Compute poly centroid
  let cx = 0, cy = 0, cz = 0;
  for (let j = 0; j < totloop; j++) {
    const v = positions[loopVertIndices[loopstart + j]];
    cx += v.x;
    cy += v.y;
    cz += v.z;
  }
  cx /= totloop;
  cy /= totloop;
  cz /= totloop;

  // Classify by aerodynamic zone
  if (cz > 1.35) {
    partCounts.front_wing++;
  } else if (cz < -1.35 && cy > 0.45) {
    partCounts.rear_wing++;
  } else if (cx < -0.55 && cz > 0.6) {
    partCounts.wheel_fl++;
  } else if (cx > 0.55 && cz > 0.6) {
    partCounts.wheel_fr++;
  } else if (cx < -0.55 && cz < -0.5) {
    partCounts.wheel_rl++;
  } else if (cx > 0.55 && cz < -0.5) {
    partCounts.wheel_rr++;
  } else if (cy < 0.14) {
    partCounts.floor_diffuser++;
  } else {
    partCounts.chassis++;
  }
}

console.log('Partitioned poly counts:', partCounts);
