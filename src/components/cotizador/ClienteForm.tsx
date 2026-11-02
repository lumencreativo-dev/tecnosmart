"use client";

import { useState } from "react";
import { User } from "lucide-react";
import type { Cliente } from "@/lib/types";

interface Props {
  cliente: Cliente;
  onChange: (c: Cliente) => void;
}

const field = (label: string, key: keyof Cliente, type = "text", placeholder = "") => ({
  label, key, type, placeholder,
});

const CAMPOS = [
  field("Empresa / Razón Social", "empresa",    "text",  "Ej: Construcciones Rápidas C.A."),
  field("RIF / Cédula",           "rif_cedula", "text",  "J-12345678-9"),
  field("Nombre de Contacto *",   "contacto",   "text",  "Ej: Carlos Pérez"),
  field("Email",                  "email",      "email", "cotizacion@empresa.com"),
  field("Teléfono",               "telefono",   "tel",   "+58 412-000-0000"),
  field("Dirección",              "direccion",  "text",  "Calle, Sector, Ciudad"),
];

export default function ClienteForm({ cliente, onChange }: Props) {
  return (
    <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--ts-surface-raised)] px-5 py-3 flex items-center gap-2">
        <User className="w-4 h-4 text-[var(--ts-red)]" />
        <span className="text-[var(--ts-text-primary)] text-sm font-bold uppercase tracking-wide">
          Datos del Cliente
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAMPOS.map(({ label, key, type, placeholder }) => (
          <div key={key} className={key === "direccion" ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
              {label}
            </label>
            <input
              type={type}
              placeholder={placeholder}
              value={(cliente[key] as string) ?? ""}
              onChange={(e) => onChange({ ...cliente, [key]: e.target.value })}
              className="w-full border border-[var(--ts-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--ts-text-primary)] placeholder-[#6e6e6e] focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40 focus:border-[var(--ts-red)] transition"
            />
          </div>
        ))}
        
        <div className="sm:col-span-2 border-t border-[var(--ts-border)] pt-3 mt-2 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="es_contribuyente_especial"
              checked={cliente.es_contribuyente_especial || false}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange({
                  ...cliente,
                  es_contribuyente_especial: checked,
                  retencion_iva_pct: checked ? (cliente.retencion_iva_pct ?? 75) : cliente.retencion_iva_pct,
                  retencion_islr_pct: checked ? (cliente.retencion_islr_pct ?? 2) : cliente.retencion_islr_pct,
                });
              }}
              className="w-4 h-4 text-[var(--ts-red)] focus:ring-[var(--ts-red)] border-[var(--ts-border)] rounded"
            />
            <label htmlFor="es_contribuyente_especial" className="text-sm font-semibold text-[var(--ts-text-primary)] cursor-pointer">
              Contribuyente Especial / Agente de Retención (SENIAT)
            </label>
          </div>

          {cliente.es_contribuyente_especial && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--ts-surface-2)] p-3.5 rounded-lg border border-[var(--ts-border)]">
              <div>
                <label className="block text-xs font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                  % Retención IVA (sugerido)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cliente.retencion_iva_pct ?? 75}
                    onChange={(e) => onChange({ ...cliente, retencion_iva_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[var(--ts-border)] rounded-lg px-3 py-2 text-sm text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)] bg-[var(--ts-surface)]"
                  />
                  <span className="text-xs text-[var(--ts-text-muted)]">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
                  % Retención ISLR (sugerido)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={cliente.retencion_islr_pct ?? 2}
                    onChange={(e) => onChange({ ...cliente, retencion_islr_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[var(--ts-border)] rounded-lg px-3 py-2 text-sm text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)] bg-[var(--ts-surface)]"
                  />
                  <span className="text-xs text-[var(--ts-text-muted)]">%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sm:col-span-2 flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="acepta_promociones"
            checked={(cliente as any).acepta_promociones || false}
            onChange={(e) => onChange({ ...cliente, acepta_promociones: e.target.checked } as any)}
            className="w-4 h-4 text-[var(--ts-red)] focus:ring-[var(--ts-red)] border-[var(--ts-border)] rounded"
          />
          <label htmlFor="acepta_promociones" className="text-sm text-[var(--ts-text-primary)] cursor-pointer">
            El cliente acepta recibir promociones e informaciones
          </label>
        </div>
      </div>
    </div>
  );
}
