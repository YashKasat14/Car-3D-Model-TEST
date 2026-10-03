import fs from 'fs';

const buf = fs.readFileSync('public/models/source/uncompressed.blend');

// Let's check all DATA blocks sizes and check where integer indices < 22198 are found
let offset = 12;
while (offset < buf.length - 24) {
  const code = buf.toString('ascii', offset, offset + 4);
  const size = buf.readUInt32LE(offset + 4);
  const count = buf.readUInt32LE(offset + 20);

  if (code === 'DATA' && count === 84374) {
    const dataOffset = offset + 24;
    console.log('Block at offset:', offset, 'size:', size, 'count:', count, 'itemSize:', size / count);
    
    // Check if int32 values are between 0 and 22198
    let validIntCount = 0;
    let validFloatCount = 0;
    for (let i = 0; i < 20; i++) {
      const intVal = buf.readUInt32LE(dataOffset + i * 4);
      const floatVal = buf.readFloatLE(dataOffset + i * 4);
      if (intVal < 22198) validIntCount++;
      if (floatVal >= -10 && floatVal <= 10) validFloatCount++;
    }
    console.log('  validIntCount (< 22198):', validIntCount, 'validFloatCount ([-10, 10]):', validFloatCount);
  }
  offset += 24 + size;
}
