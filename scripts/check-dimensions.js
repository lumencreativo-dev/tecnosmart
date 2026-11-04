const fs = require('fs');
const path = require('path');

// Simple PNG dimension reader
function getPngDimensions(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(24);
  fs.readSync(fd, buffer, 0, 24, 0);
  fs.closeSync(fd);
  // PNG signature is 8 bytes, IHDR chunk starts at byte 12
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

const testFiles = [
  'tecnosmart-app/public/brands/isotipo/isotipo-rojo.png',
  'tecnosmart-app/public/brands/isotipo/isotipo-rojo-negro.png',
  'tecnosmart-app/public/brands/isologo/isologo-rojo.png',
  'tecnosmart-app/public/brands/isologo-variante/isologo-variante-rojo.png',
  'tecnosmart-app/public/brands/logotipo/logotipo-rojo.png'
];

for (const f of testFiles) {
  const p = path.resolve(f);
  if (fs.existsSync(p)) {
    const dim = getPngDimensions(p);
    console.log(path.basename(f), '->', dim.width, 'x', dim.height);
  }
}
