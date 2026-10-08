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
