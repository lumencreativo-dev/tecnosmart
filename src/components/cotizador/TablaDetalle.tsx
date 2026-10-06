"use client";

import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { LineaDetalle } from "@/lib/types";
import { formatUSD } from "@/lib/utils";

interface Props {
  lineas: LineaDetalle[];
  onUpdateCantidad: (id: string, cantidad: number) => void;
  onUpdatePrecio:   (id: string, precio: number) => void;
  onRemove:         (id: string) => void;
}

export default function TablaDetalle({
  lineas,
  onUpdateCantidad,
  onUpdatePrecio,
  onRemove,
}: Props) {
  if (lineas.length === 0) {
    return (
      <div className="border-2 border-dashed border-[#d9d9d9] rounded-xl py-12 text-center text-[#6e6e6e] text-sm">
        <p className="text-3xl mb-2">📋</p>
        <p>Sin ítems. Busca un producto o agrega un servicio desde el panel izquierdo.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#d9d9d9]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#111111] text-white">
            <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider w-8">#</th>
            <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Descripción</th>
            <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider w-24">Cant.</th>
            <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider w-28">P. Unit.</th>
            <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider w-28">Subtotal</th>
            <th className="px-3 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {lineas.map((l, idx) => (
            <tr
              key={l.id}
              className={`border-b border-[#d9d9d9] hover:bg-[#fafafa] transition-colors ${
                idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
              }`}
            >
              {/* N° */}
              <td className="px-4 py-3 text-[#6e6e6e] text-xs font-mono">{idx + 1}</td>

              {/* Descripción */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      l.tipo_item === "producto" ? "bg-[#05235b]" : "bg-[#c9242b]"
                    }`}
                  />
                  <span className="text-[#111111] font-medium">{l.descripcion}</span>
                </div>
                <span className="ml-3.5 text-[10px] text-[#6e6e6e] uppercase">
                  {l.tipo_item === "producto" ? "Producto" : "Servicio"}
                </span>
              </td>

              {/* Cantidad */}
              <td className="px-3 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onUpdateCantidad(l.id, Math.max(0.5, l.cantidad - (l.tipo_item === "servicio" && l.precio_unitario < 1 ? 10 : 1)))}
                    className="text-[#6e6e6e] hover:text-[#c9242b] transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0.5}
                    step={l.precio_unitario < 1 ? 10 : 1}
                    value={l.cantidad}
                    onChange={(e) => onUpdateCantidad(l.id, parseFloat(e.target.value) || 1)}
                    className="w-14 text-center border border-[#d9d9d9] rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                  />
                  <button
                    onClick={() => onUpdateCantidad(l.id, l.cantidad + (l.tipo_item === "servicio" && l.precio_unitario < 1 ? 10 : 1))}
                    className="text-[#6e6e6e] hover:text-[#c9242b] transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </td>

              {/* Precio unitario (editable) */}
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[#6e6e6e] text-xs">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={l.precio_unitario}
                    onChange={(e) => onUpdatePrecio(l.id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right border border-[#d9d9d9] rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                  />
                </div>
              </td>

              {/* Subtotal */}
              <td className="px-4 py-3 text-right font-bold text-[#111111]">
                {formatUSD(l.cantidad * l.precio_unitario)}
              </td>

              {/* Eliminar */}
              <td className="px-3 py-3 text-center">
                <button
                  onClick={() => onRemove(l.id)}
                  className="text-[#6e6e6e] hover:text-[#c9242b] transition-colors"
                  title="Eliminar ítem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
