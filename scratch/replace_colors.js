const fs = require('fs');

let file = fs.readFileSync('c:/Users/saehk/Documents/Lumen Creativo Dev/TecnoSmart VZL/tecnosmart-app/src/components/cotizador/FacturadorWizard.tsx', 'utf8');

const replacements = [
  { search: /bg-white/g, replace: "bg-[var(--ts-surface)]" },
  { search: /bg-\[#111\]/g, replace: "bg-[var(--ts-text-primary)]" },
  { search: /text-\[#111111\]/g, replace: "text-[var(--ts-text-primary)]" },
  { search: /text-\[#111\]/g, replace: "text-[var(--ts-text-primary)]" },
  { search: /text-\[#6e6e6e\]/g, replace: "text-[var(--ts-text-muted)]" },
  { search: /border-\[#d9d9d9\]/g, replace: "border-[var(--ts-border)]" },
  { search: /border-\[#e5e5e5\]/g, replace: "border-[var(--ts-border)]" },
  { search: /bg-\[#f8fafc\]/g, replace: "bg-[var(--ts-surface-2)]" },
  { search: /bg-\[#f0f0f0\]/g, replace: "bg-[var(--ts-surface-2)]" },
  { search: /border-\[#f0f0f0\]/g, replace: "border-[var(--ts-border-2)]" },
  { search: /bg-\[#d9d9d9\]/g, replace: "bg-[var(--ts-border)]" },
  { search: /text-\[#c9242b\]/g, replace: "text-[var(--ts-red)]" },
  { search: /bg-\[#c9242b\]/g, replace: "bg-[var(--ts-red)]" },
  { search: /border-\[#c9242b\]/g, replace: "border-[var(--ts-red)]" }
];

for (const {search, replace} of replacements) {
  file = file.replace(search, replace);
}

fs.writeFileSync('c:/Users/saehk/Documents/Lumen Creativo Dev/TecnoSmart VZL/tecnosmart-app/src/components/cotizador/FacturadorWizard.tsx', file, 'utf8');
console.log('Replaced colors in FacturadorWizard');
