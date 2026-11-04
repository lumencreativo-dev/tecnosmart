const fs = require('fs');
const path = require('path');

const sourceIsotipo = path.resolve(__dirname, '../public/brands/isotipo/isotipo-rojo.png');
const appFavicon = path.resolve(__dirname, '../src/app/favicon.ico');
const publicFavicon = path.resolve(__dirname, '../public/favicon.ico');
const appIconPng = path.resolve(__dirname, '../src/app/icon.png');
const appAppleIconPng = path.resolve(__dirname, '../src/app/apple-icon.png');
const publicAppleTouchIcon = path.resolve(__dirname, '../public/apple-touch-icon.png');

console.log('Reading source image:', sourceIsotipo);
const pngBuffer = fs.readFileSync(sourceIsotipo);

// Create valid ICO buffer containing the PNG payload
function createIcoFromPng(pngBuf) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 Image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0); // Width: 0 means 256 or larger
  dirEntry.writeUInt8(0, 1); // Height: 0 means 256 or larger
  dirEntry.writeUInt8(0, 2); // Color count: 0 (no palette)
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuf.length, 8); // Size of image data
  dirEntry.writeUInt32LE(22, 12); // Offset (6 + 16 = 22)

  return Buffer.concat([icoHeader, dirEntry, pngBuf]);
}

const icoBuffer = createIcoFromPng(pngBuffer);

// Write to src/app/favicon.ico
fs.writeFileSync(appFavicon, icoBuffer);
console.log('Wrote:', appFavicon, `(${icoBuffer.length} bytes)`);

// Write to public/favicon.ico
fs.writeFileSync(publicFavicon, icoBuffer);
console.log('Wrote:', publicFavicon, `(${icoBuffer.length} bytes)`);

// Write to src/app/icon.png
fs.writeFileSync(appIconPng, pngBuffer);
console.log('Wrote:', appIconPng);

// Write to src/app/apple-icon.png and public/apple-touch-icon.png
fs.writeFileSync(appAppleIconPng, pngBuffer);
console.log('Wrote:', appAppleIconPng);

fs.writeFileSync(publicAppleTouchIcon, pngBuffer);
console.log('Wrote:', publicAppleTouchIcon);

console.log('All favicon and app icon assets successfully generated!');
