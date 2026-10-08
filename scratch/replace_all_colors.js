const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/saehk/Documents/Lumen Creativo Dev/TecnoSmart VZL/tecnosmart-app/src';

// Colores a reemplazar - ahora más exhaustivo
const replacements = [
  // Fondos de página (el que causaba el problema principal)
  { search: /bg-\[#f5f5f5\]/g, replace: "bg-[var(--ts-bg)]" },
  { search: /bg-\[#fff5f5\]/g, replace: "bg-[var(--ts-bg)]" },
  { search: /bg-\[#fafafa\]/g, replace: "bg-[var(--ts-surface-2)]" },
  { search: /bg-\[#f1f5f9\]/g, replace: "bg-[var(--ts-surface-2)]" },
  { search: /bg-\[#e5e5e5\]/g, replace: "bg-[var(--ts-border)]" },
  
  // Banners de página (los headers oscuros que deben adaptarse al tema)
  { search: /bg-\[#111111\] border-b border-\[#333\]/g, replace: "bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]" },
  { search: /bg-\[#111\] border-b border-\[#333\]/g, replace: "bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]" },
  { search: /bg-\[#111111\]/g, replace: "bg-[var(--ts-surface-raised)]" },
  
  // Textos en banners
  { search: /text-white(?= )/g, replace: "text-[var(--ts-text-primary)]" },
  
  // Hover states
  { search: /hover:bg-\[#fafafa\]/g, replace: "hover:bg-[var(--ts-surface-2)]" },
  { search: /hover:bg-\[#f5f5f5\]/g, replace: "hover:bg-[var(--ts-surface-2)]" },
  
  // Divide lines (tablas/listas)
  { search: /divide-\[#f5f5f5\]/g, replace: "divide-[var(--ts-border-2)]" },
  { search: /divide-\[#f0f0f0\]/g, replace: "divide-[var(--ts-border-2)]" },
  
  // Select/input backgrounds
  { search: /bg-\[var\(--ts-surface\)\] border border-\[var\(--ts-border\)\] rounded-xl text-sm focus:outline-none focus:border-\[var\(--ts-red\)\] bg-white/g, replace: "bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--ts-red)]" },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (fullPath.includes('FacturaFiscalPDF.tsx')) continue; // Skip PDF renderer
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const {search, replace} of replacements) {
        content = content.replace(search, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Done!');
