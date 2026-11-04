const fs = require('fs');
const path = require('path');

const brandsDir = path.resolve(__dirname, '../public/brands');
console.log('Target brands dir:', brandsDir);

function sanitize(str) {
  return str
    .toLowerCase()
    .replace(/[()]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

if (!fs.existsSync(brandsDir)) {
  console.error('Directory does not exist:', brandsDir);
  process.exit(1);
}

const entries = fs.readdirSync(brandsDir, { withFileTypes: true });

for (const entry of entries) {
  const currentDirPath = path.join(brandsDir, entry.name);
  if (entry.isDirectory()) {
    const files = fs.readdirSync(currentDirPath);
    for (const file of files) {
      const oldFilePath = path.join(currentDirPath, file);
      const ext = path.extname(file);
      const base = path.basename(file, ext);
      const newFileName = `${sanitize(base)}${ext.toLowerCase()}`;
      const newFilePath = path.join(currentDirPath, newFileName);
      if (oldFilePath !== newFilePath) {
        fs.renameSync(oldFilePath, newFilePath);
        console.log(`Renamed: "${file}" -> "${newFileName}"`);
      }
    }
    const cleanDirName = sanitize(entry.name);
    const newDirPath = path.join(brandsDir, cleanDirName);
    if (currentDirPath !== newDirPath) {
      fs.renameSync(currentDirPath, newDirPath);
      console.log(`Renamed directory: "${entry.name}" -> "${cleanDirName}"`);
    }
  }
}

console.log('All brand assets successfully normalized.');
