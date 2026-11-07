"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { LineaDetalle, ServicioManoObra } from "@/lib/types";
import { tempId } from "@/lib/utils";
import { cargarServicios, getLocalServicios } from "@/lib/supabase/servicios";

interface Props {
  onAdd: (linea: LineaDetalle) => void;
  clienteTipo?: "cliente_normal" | "tecnico";
  descuentoTecnico?: number;
}

export default function ServiciosPicker({ onAdd, clienteTipo, descuentoTecnico = 15 }: Props) {
  const [servicios, setServicios] = useState<ServicioManoObra[]>(() => {
    const list = getLocalServicios();
    return list.filter(s => s.activo !== false);
  });
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [preciosCustom, setPreciosCustom] = useState<Record<string, number>>({});

  useEffect(() => {
    cargarServicios(true).then((data) => {
      if (data && data.length > 0) setServicios(data);
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
