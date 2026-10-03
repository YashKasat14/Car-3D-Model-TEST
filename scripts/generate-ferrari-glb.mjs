import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
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

const objDir = path.join(process.cwd(), 'public/models/ferrari-f60/OBJ');
const loader = new OBJLoader();

// Materials
const scuderiaRed = new THREE.MeshStandardMaterial({
  color: 0xBA251B, // Rosso Corsa racing red
  roughness: 0.22,
  metalness: 0.2,
  name: 'mat_scuderia_red'
});

const darkCarbon = new THREE.MeshStandardMaterial({
  color: 0x1E1B18,
  roughness: 0.65,
  metalness: 0.3,
  name: 'mat_ferrari_carbon'
});

const silverTitanium = new THREE.MeshStandardMaterial({
  color: 0x7B7670,
  roughness: 0.3,
  metalness: 0.85,
  name: 'mat_ferrari_titanium'
});

const tyreRubber = new THREE.MeshStandardMaterial({
  color: 0x1C1A18,
  roughness: 0.88,
  metalness: 0.05,
  name: 'mat_ferrari_rubber'
});

const goldBrake = new THREE.MeshStandardMaterial({
  color: 0xD4A054,
  roughness: 0.35,
  metalness: 0.8,
  name: 'mat_ferrari_gold'
});

const rootGroup = new THREE.Group();
rootGroup.name = 'ferrari_f60_assembly';

const files = fs.readdirSync(objDir).filter(f => f.endsWith('.obj'));
console.log('Found OBJ files:', files.length);

for (const file of files) {
  try {
    const text = fs.readFileSync(path.join(objDir, file), 'utf8');
    const obj = loader.parse(text);
    const cleanName = path.basename(file, '.obj').replace(/\s+/g, '_').toLowerCase();
    obj.name = cleanName;

    // Assign appropriate material based on part type
    obj.traverse(child => {
      if (child.isMesh) {
        child.name = cleanName;
        if (cleanName.includes('tire')) {
          child.material = tyreRubber;
        } else if (cleanName.includes('brake')) {
          child.material = goldBrake;
        } else if (cleanName.includes('suspa') || cleanName.includes('shaft')) {
          child.material = silverTitanium;
        } else if (cleanName.includes('wing') || cleanName.includes('cov') || cleanName.includes('body')) {
          child.material = scuderiaRed;
        } else {
          child.material = darkCarbon;
        }
      }
    });

    rootGroup.add(obj);
  } catch (err) {
    console.error('Failed to parse:', file, err);
  }
}

// Compute bounding box and normalize scale if needed
// Scale from mm to meters
rootGroup.scale.set(0.001, 0.001, 0.001);
rootGroup.updateMatrixWorld(true);

const box = new THREE.Box3().setFromObject(rootGroup);
const size = new THREE.Vector3();
box.getSize(size);
console.log('Ferrari bounding size in meters:', size.toArray());

const exporter = new GLTFExporter();
exporter.parse(
  rootGroup,
  (glb) => {
    const outPath = path.join(process.cwd(), 'public/models/ferrari-f60/model.glb');
    fs.writeFileSync(outPath, Buffer.from(glb));
    console.log('Successfully saved Ferrari F60 GLB to:', outPath, '(' + fs.statSync(outPath).size + ' bytes)');
  },
  (err) => {
    console.error('Error exporting Ferrari GLB:', err);
  },
  { binary: true }
);
