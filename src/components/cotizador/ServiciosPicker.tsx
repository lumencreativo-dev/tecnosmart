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
];

interface Props {
  onAdd: (linea: LineaDetalle) => void;
}

export default function ServiciosPicker({ onAdd }: Props) {
  const [servicios, setServicios] = useState<ServicioManoObra[]>(SERVICIOS_FALLBACK);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [precios, setPrecios] = useState<Record<string, number>>({});

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

  const addServicio = (s: ServicioManoObra) => {
    const cant = cantidades[s.id] ?? 1;
    const precio = precios[s.id] ?? s.precio_base;
    onAdd({
      id: tempId(),
      tipo_item: "servicio",
      item_id: s.id,
      descripcion: `${s.concepto} (${s.unidad})`,
      cantidad: cant,
      precio_unitario: precio,
      subtotal: cant * precio,
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
      <h3 className="text-xs font-bold text-[#6e6e6e] uppercase tracking-widest">
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
              const precio = precios[s.id] ?? s.precio_base;
              const cant   = cantidades[s.id] ?? 1;
              const tieneRango = s.precio_max && s.precio_max !== s.precio_base;

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2 bg-white border border-[#d9d9d9] rounded-lg px-3 py-2 hover:border-[#c9242b]/40 transition-colors"
                >
                  {/* Descripción */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#111111] truncate">{s.concepto}</p>
                    <p className="text-[10px] text-[#6e6e6e]">
                      {s.codigo} · por {s.unidad}
                      {tieneRango ? ` · Rango $${s.precio_base}–$${s.precio_max}` : ""}
                    </p>
                  </div>

                  {/* Precio editable */}
                  <input
                    type="number"
                    min={s.precio_base}
                    max={s.precio_max ?? undefined}
                    step={0.5}
                    value={precio}
                    onChange={(e) =>
                      setPrecios((p) => ({ ...p, [s.id]: parseFloat(e.target.value) || s.precio_base }))
                    }
                    className="w-20 text-xs border border-[#d9d9d9] rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                    title="Precio unitario"
                  />
                  <span className="text-[10px] text-[#6e6e6e]">USD</span>

                  {/* Cantidad */}
                  <input
                    type="number"
                    min={1}
                    value={cant}
                    onChange={(e) =>
                      setCantidades((c) => ({ ...c, [s.id]: parseInt(e.target.value) || 1 }))
                    }
                    className="w-14 text-xs border border-[#d9d9d9] rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                    title="Cantidad"
                  />

                  {/* Botón agregar */}
                  <button
                    onClick={() => addServicio(s)}
                    title="Agregar a cotización"
                    className="flex-shrink-0 bg-[#c9242b] hover:bg-red-700 text-white rounded p-1.5 transition-colors"
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
