import fs from 'fs';

const buf = fs.readFileSync('public/models/source/uncompressed.blend');

// 1. Vertices: offset 950672 + 24 (block header is 24 bytes)
const vertDataOffset = 950672 + 24;
const numVerts = 22198;
const verts = [];
for (let i = 0; i < 10; i++) {
  const o = vertDataOffset + i * 16;
  const x = buf.readFloatLE(o);
  const y = buf.readFloatLE(o + 4);
  const z = buf.readFloatLE(o + 8);
  verts.push([x, y, z]);
}
console.log('Sample vertices:', verts);

// 2. Polygons: offset 3944860 + 24
const polyDataOffset = 3944860 + 24;
const numPolys = 20944;
const polys = [];
for (let i = 0; i < 5; i++) {
  const o = polyDataOffset + i * 12;
  const loopstart = buf.readInt32LE(o);
  const totloop = buf.readInt32LE(o + 4);
  polys.push({ loopstart, totloop });
}
console.log('Sample polys:', polys);

// 3. Loops (vertex indices): offset 2257180 + 24
const loopDataOffset = 2257180 + 24;
const numLoops = 84374;
const loops = [];
for (let i = 0; i < 12; i++) {
  const o = loopDataOffset + i * 12;
  const v = buf.readInt32LE(o);
  loops.push(v);
}
console.log('Sample loop vert indices:', loops);

// 4. UVs: offset 3269692 + 24
const uvDataOffset = 3269692 + 24;
const uvs = [];
for (let i = 0; i < 5; i++) {
  const o = uvDataOffset + i * 8;
  const u = buf.readFloatLE(o);
  const v = buf.readFloatLE(o + 4);
  uvs.push([u, v]);
}
console.log('Sample UVs:', uvs);
