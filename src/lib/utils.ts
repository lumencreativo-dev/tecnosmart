// ─────────────────────────────────────────────────────────────
// lib/utils.ts — Utilidades globales
// ─────────────────────────────────────────────────────────────
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea número como USD: $1,234.56 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Formatea número como Bolívares: Bs. 1.234,56 */
export function formatBs(amount: number): string {
  return "Bs. " + new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Genera un ID temporal de cliente (para la sesión) */
export function tempId(): string {
  return crypto.randomUUID();
}

/** Fecha formateada para cotizaciones */
export function formatFecha(date?: Date | string | null): string {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Número de cotización correlativo básico (fallback si no hay BD) */
export function generarNumeroCot(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900) + 100;
  return `COT-${year}-${rand}`;
}

/**
 * Limpia texto proveniente de correos electrónicos en bruto (MIME multipart, headers, HTML wrappers)
 */
export function limpiarTextoMime(texto: string): string {
  if (!texto) return "";
  let clean = texto;

  // 1. Si contiene Content-Type: text/plain, extraer preferentemente ese bloque
  if (clean.includes("Content-Type: text/plain")) {
    const plainPart = clean.split(/Content-Type:\s*text\/plain[^\n]*\n/i)[1];
    if (plainPart) {
      // Tomar hasta el siguiente boundary o final
      const endBoundary = plainPart.search(/--[a-zA-Z0-9_-]+/);
      if (endBoundary !== -1) {
        clean = plainPart.substring(0, endBoundary);
      } else {
        clean = plainPart;
      }
    }
  }

  // 2. Eliminar boundaries multipart residuales
  clean = clean.replace(/--[a-zA-Z0-9_\-=]+--?/g, "");

  // 3. Eliminar headers MIME residuales
  clean = clean.replace(/Content-(?:Type|Transfer-Encoding|Disposition):[^\n]*\n?/gi, "");
  clean = clean.replace(/charset="?[^"\n]+"?;?/gi, "");

  // 4. Quitar tags HTML si existen en el texto
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<\/div>/gi, "\n");
  clean = clean.replace(/<br\s*\/?>/gi, "\n");
  clean = clean.replace(/<p[\s\S]*?>/gi, "");
  clean = clean.replace(/<\/p>/gi, "\n\n");
  clean = clean.replace(/<[^>]+>/g, "");

  // 5. Decodificar entidades comunes y quoted-printable
  clean = clean.replace(/=C2=A0/gi, " ");
  clean = clean.replace(/=3D/gi, "=");
  clean = clean.replace(/=\r?\n/g, "");
  clean = clean.replace(/&nbsp;/gi, " ");
  clean = clean.replace(/&amp;/gi, "&");
  clean = clean.replace(/&lt;/gi, "<");
  clean = clean.replace(/&gt;/gi, ">");
  clean = clean.replace(/&quot;/gi, '"');

  // 6. Normalizar saltos de línea y espacios en blanco excesivos
  clean = clean.replace(/\r\n/g, "\n");
  clean = clean.replace(/\n{3,}/g, "\n\n");
  return clean.trim();
}
