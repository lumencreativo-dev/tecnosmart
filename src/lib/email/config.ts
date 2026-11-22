// ─────────────────────────────────────────────────────────────
// src/lib/email/config.ts — Configuración y Remitentes Oficiales
// Dominio: somostecnosmart.com
// ─────────────────────────────────────────────────────────────

export const BRAND = {
  name: "TecnoSmart Vzl",
  legalName: "TecnoSmart Vzl C.A.",
  rif: "J-50701960-8",
  phone: "0412-2789273",
  whatsappNumber: "584122789273",
  whatsappUrl: "https://wa.me/584122789273",
  address: "Av. Bolívar C/C c. Páez, Edif. Sta. Eduviges II, local-02, Tinaquillo, Edo. Cojedes.",
  domain: "somostecnosmart.com",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://somostecnosmart.com",
  logoUrl: "https://somostecnosmart.com/logo-color.png",
  socials: {
    instagram: "https://www.instagram.com/tecnosmartvzla",
    facebook: "https://www.facebook.com/tecnosmartvzla",
  },
  colors: {
    red: "#c9242b",
    navy: "#05235b",
    black: "#111111",
    gray: "#6e6e6e",
    border: "#d9d9d9",
    background: "#f8fafc",
  },
} as const;

/**
 * Los 4 remitentes oficiales autorizados bajo somostecnosmart.com
 * Cada uno tiene asignada una función de negocio específica y
 * redirige sus respuestas entrantes a tecnosmartvzl@gmail.com vía Cloudflare.
 */
export const EMAIL_SENDERS = {
  // 1. Bienvenidas tras primera compra y confirmaciones generales
  HOLA: `TecnoSmart <hola@${BRAND.domain}>`,

  // 2. Comunicaciones especializadas de flota y servicio satelital Starlink
  STARLINK: `TecnoSmart Starlink <starlink@${BRAND.domain}>`,

  // 3. Invitaciones de empleados por rol y restablecimiento de claves
  SOPORTE: `TecnoSmart Soporte <soporte@${BRAND.domain}>`,

  // 4. Campañas comerciales, boletines, catálogo de cámaras y servicios
  CONTACTO: `TecnoSmart <contacto@${BRAND.domain}>`,
} as const;
