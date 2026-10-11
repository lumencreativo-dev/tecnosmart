const fs = require('fs');
const path = require('path');

const targetDir = 'c:/Users/saehk/Documents/Lumen Creativo Dev/TecnoSmart VZL/tecnosmart-app/src';

const urlReplacements = [
  { search: /\/cotizador\/dashboard/g, replace: "/dashboard" },
  { search: /\/cotizador\/nueva/g, replace: "/nueva" },
  { search: /\/cotizador\/facturacion/g, replace: "/facturacion" },
  { search: /\/cotizador\/historial-facturas/g, replace: "/historial-facturas" },
  { search: /\/cotizador\/crm/g, replace: "/crm" },
  { search: /\/cotizador\/clientes/g, replace: "/clientes" },
  { search: /\/cotizador\/inventario/g, replace: "/inventario" },
  { search: /\/cotizador\/importar/g, replace: "/importar" },
  { search: /\/cotizador\/suscripciones/g, replace: "/suscripciones" },
  { search: /\/cotizador\/menu/g, replace: "/menu" },
  { search: /\/cotizador\/novedades/g, replace: "/novedades" },
  { search: /\/cotizador\/login/g, replace: "/login" },
  { search: /"\/cotizador"/g, replace: '"/dashboard"' },
  { search: /'\/cotizador'/g, replace: "'/dashboard'" },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (fullPath.includes('middleware.ts')) continue; // Skip middleware
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { search, replace } of urlReplacements) {
        content = content.replace(search, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated URLs in: ' + fullPath);
      }
    }
  }
}

processDirectory(targetDir);
console.log('Done cleaning URLs!');
