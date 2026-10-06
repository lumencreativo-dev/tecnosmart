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
    <div className="bg-white rounded-xl border border-[#d9d9d9] overflow-hidden">
      {/* Header */}
      <div className="bg-[#111111] px-5 py-3 flex items-center gap-2">
        <User className="w-4 h-4 text-[#c9242b]" />
        <span className="text-white text-sm font-bold uppercase tracking-wide">
          Datos del Cliente
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAMPOS.map(({ label, key, type, placeholder }) => (
          <div key={key} className={key === "direccion" ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
              {label}
            </label>
            <input
              type={type}
              placeholder={placeholder}
              value={(cliente[key] as string) ?? ""}
              onChange={(e) => onChange({ ...cliente, [key]: e.target.value })}
              className="w-full border border-[#d9d9d9] rounded-lg px-3 py-2.5 text-sm text-[#111111] placeholder-[#6e6e6e] focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40 focus:border-[#c9242b] transition"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
