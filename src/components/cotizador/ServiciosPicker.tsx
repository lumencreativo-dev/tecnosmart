"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { LineaDetalle, ServicioManoObra } from "@/lib/types";
import { tempId } from "@/lib/utils";
import { cargarServicios } from "@/lib/supabase/servicios";

// Servicios hardcoded como fallback (si no hay BD aún)
const SERVICIOS_FALLBACK: ServicioManoObra[] = [
  { id: "1", codigo: "INS-CAM-STD",  concepto: "Instalación Cámara – Estándar",           precio_base: 30,  precio_max: 35,  unidad: "punto",   categoria: "Instalación" },
  { id: "2", codigo: "INS-CAM-BAJO", concepto: "Instalación Cámara – Centro < 2.5m",      precio_base: 25,  precio_max: 25,  unidad: "punto",   categoria: "Instalación" },
  { id: "3", codigo: "CAB-UTP-M",    concepto: "Tendido UTP / Canaleta / Tubería",         precio_base: 0.5, precio_max: 0.5, unidad: "metro",   categoria: "Cableado" },
  { id: "4", codigo: "CAB-ELEC-M",   concepto: "Tendido Cable Eléctrico",                  precio_base: 0.25,precio_max: 0.25,unidad: "metro",   categoria: "Cableado" },
  { id: "5", codigo: "CFG-DVR-16",   concepto: "Configuración DVR/NVR ≤ 16ch",            precio_base: 50,  precio_max: 50,  unidad: "equipo",  categoria: "Configuración" },
  { id: "6", codigo: "CFG-DVR-32",   concepto: "Configuración DVR/NVR > 16ch",            precio_base: 80,  precio_max: 80,  unidad: "equipo",  categoria: "Configuración" },
  { id: "7", codigo: "CFG-RACK",     concepto: "Instalación y Peinado de Rack",            precio_base: 40,  precio_max: 40,  unidad: "global",  categoria: "Configuración" },
  { id: "8", codigo: "CFG-ACC-CTL",  concepto: "Mano de Obra Control de Acceso",          precio_base: 150, precio_max: 250, unidad: "punto",   categoria: "Configuración" },
  { id: "9", codigo: "MTO-CAM",      concepto: "Mantenimiento preventivo por cámara",      precio_base: 30,  precio_max: 30,  unidad: "punto",   categoria: "Mantenimiento" },
  { id: "10",codigo: "MTO-DVR",      concepto: "Mantenimiento DVR (batería/firmware)",     precio_base: 50,  precio_max: 50,  unidad: "equipo",  categoria: "Mantenimiento" },
  { id: "11",codigo: "LOG-LOCAL",    concepto: "Logística Local (Tinaquillo)",             precio_base: 5,   precio_max: 10,  unidad: "día",     categoria: "Logística" },
  { id: "12",codigo: "LOG-FORANEO",  concepto: "Transporte + Comida Foráneo / técnico",   precio_base: 30,  precio_max: 30,  unidad: "día",     categoria: "Logística" },
  // Starlink
  { id: "SL1", codigo: "SL-INS",      concepto: "Instalación de Antena Starlink",         precio_base: 80,  precio_max: 120, unidad: "global",  categoria: "Starlink" },
  { id: "SL2", codigo: "SL-CFG",      concepto: "Configuración de red Starlink",          precio_base: 50,  precio_max: 50,  unidad: "equipo",  categoria: "Starlink" },
  { id: "SL3", codigo: "SL-MENS",     concepto: "Gestión mensual Starlink (Comisión)",    precio_base: 10,  precio_max: 10,  unidad: "mes",     categoria: "Starlink" },
];

interface Props {
  onAdd: (linea: LineaDetalle) => void;
  clienteTipo?: "cliente_normal" | "tecnico";
  descuentoTecnico?: number;
}

export default function ServiciosPicker({ onAdd, clienteTipo, descuentoTecnico = 15 }: Props) {
  const [servicios, setServicios] = useState<ServicioManoObra[]>(SERVICIOS_FALLBACK);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [preciosCustom, setPreciosCustom] = useState<Record<string, number>>({});

  useEffect(() => {
    cargarServicios().then((data) => {
      if (data.length > 0) setServicios(data);
    });
  }, []);

  // Agrupar por categoría
  const grupos = servicios.reduce<Record<string, ServicioManoObra[]>>(
    (acc, s) => {
      const cat = s.categoria ?? "Otros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {}
  );

  const getPrecioCalculado = (s: ServicioManoObra) => {
    // 1. Si el usuario sobreescribió el precio manualmente en el input, usar ese
    if (preciosCustom[s.id] !== undefined) return preciosCustom[s.id];
    // 2. Si es técnico y hay precio_tecnico explícito, usarlo
    if (clienteTipo === "tecnico" && s.precio_tecnico != null && s.precio_tecnico > 0) return s.precio_tecnico;
    // 3. Si es técnico, calcular descuento dinámico
    if (clienteTipo === "tecnico") return parseFloat((s.precio_base * (1 - descuentoTecnico / 100)).toFixed(2));
    // 4. Fallback a precio base
    return s.precio_base;
  };

  const addServicio = (s: ServicioManoObra) => {
    const cant = cantidades[s.id] ?? 1;
    const finalPrecio = getPrecioCalculado(s);
    onAdd({
      id: tempId(),
      tipo_item: "servicio",
      item_id: s.id,
      descripcion: `${s.concepto} (${s.unidad})`,
      cantidad: cant,
      precio_unitario: finalPrecio,
      subtotal: cant * finalPrecio,
    });

  };

  const catColors: Record<string, string> = {
    Instalación:    "#c9242b",
    Cableado:       "#6e6e6e",
    Configuración:  "#05235b",
    Mantenimiento:  "#c9242b",
    Logística:      "#6e6e6e",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-widest">
        Servicios & Mano de Obra
      </h3>

      {Object.entries(grupos).map(([cat, items]) => (
        <div key={cat}>
          <div
            className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded mb-2"
            style={{
              color: catColors[cat] ?? "#111",
              backgroundColor: `${catColors[cat] ?? "#111"}15`,
            }}
          >
            {cat}
          </div>

          <div className="space-y-2">
            {items.map((s) => {
              const cant   = cantidades[s.id] ?? 1;
              const precioCalculado = getPrecioCalculado(s);
              const isTecnicoRate = clienteTipo === "tecnico" && s.precio_tecnico != null;
              const tieneRango = s.precio_max && s.precio_max !== s.precio_base;

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 hover:border-[var(--ts-red)]/40 transition-colors"
                >
                  {/* Descripción */}
                  <div className="flex-1 min-w-0" title={s.concepto}>
                    <p className="text-xs font-medium text-[var(--ts-text-primary)] leading-tight line-clamp-2">{s.concepto}</p>
                    <p className="text-[10px] text-[var(--ts-text-muted)] flex items-center gap-1 mt-0.5">
                      {s.codigo} · por {s.unidad}
                      {tieneRango ? ` · Rango $${s.precio_base}–$${s.precio_max}` : ""}
                      {isTecnicoRate && (
                        <span className="text-[var(--ts-red)] font-bold tracking-tight bg-[var(--ts-red-subtle)] px-1 rounded">Precio Técnico</span>
                      )}
                    </p>
                  </div>

                  {/* Precio editable */}
                  <input
                    type="number"
                    min={0}
                    max={s.precio_max ?? undefined}
                    step={0.5}
                    value={preciosCustom[s.id] ?? precioCalculado}
                    onChange={(e) =>
                      setPreciosCustom((p) => ({ ...p, [s.id]: parseFloat(e.target.value) || precioCalculado }))
                    }
                    className={`w-20 text-xs border rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#c9242b] ${
                      isTecnicoRate ? "border-[var(--ts-red)]/50 bg-[var(--ts-red)]/5 text-[var(--ts-red)] font-bold" : "border-[var(--ts-border)]"
                    }`}
                    title="Precio unitario"
                  />
                  <span className="text-[10px] text-[var(--ts-text-muted)]">USD</span>

                  {/* Cantidad */}
                  <input
                    type="number"
                    min={1}
                    value={cant}
                    onChange={(e) =>
                      setCantidades((c) => ({ ...c, [s.id]: parseInt(e.target.value) || 1 }))
                    }
                    className="w-14 text-xs border border-[var(--ts-border)] rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                    title="Cantidad"
                  />

                  {/* Botón agregar */}
                  <button
                    onClick={() => addServicio(s)}
                    title="Agregar a cotización"
                    className="flex-shrink-0 bg-[var(--ts-red)] hover:bg-red-700 text-[var(--ts-text-primary)] rounded p-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
