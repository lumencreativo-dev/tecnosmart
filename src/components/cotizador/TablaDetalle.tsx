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
      <div className="border-2 border-dashed border-[var(--ts-border)] rounded-xl py-12 text-center text-[var(--ts-text-muted)] text-sm">
        <p className="text-3xl mb-2">📋</p>
        <p>Sin ítems. Busca un producto o agrega un servicio desde el panel izquierdo.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--ts-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--ts-surface-raised)] text-white">
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
              className={`border-b border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] transition-colors ${
                idx % 2 === 0 ? "bg-[var(--ts-surface)]" : "bg-[var(--ts-surface-2)]"
              }`}
            >
              {/* N° */}
              <td className="px-4 py-3 text-[var(--ts-text-muted)] text-xs font-mono">{idx + 1}</td>

              {/* Descripción */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      l.tipo_item === "producto" ? "bg-[#05235b]" : "bg-[var(--ts-red)]"
                    }`}
                  />
                  <span className="text-[var(--ts-text-primary)] font-medium">{l.descripcion}</span>
                </div>
                <span className="ml-3.5 text-[10px] text-[var(--ts-text-muted)] uppercase">
                  {l.tipo_item === "producto" ? "Producto" : "Servicio"}
                </span>
              </td>

              {/* Cantidad */}
              <td className="px-3 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onUpdateCantidad(l.id, Math.max(0.5, l.cantidad - (l.tipo_item === "servicio" && l.precio_unitario < 1 ? 10 : 1)))}
                    className="text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0.5}
                    step={l.precio_unitario < 1 ? 10 : 1}
                    value={l.cantidad}
                    onChange={(e) => onUpdateCantidad(l.id, parseFloat(e.target.value) || 1)}
                    className="w-14 text-center border border-[var(--ts-border)] rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                  />
                  <button
                    onClick={() => onUpdateCantidad(l.id, l.cantidad + (l.tipo_item === "servicio" && l.precio_unitario < 1 ? 10 : 1))}
                    className="text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </td>

              {/* Precio unitario (editable) */}
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[var(--ts-text-muted)] text-xs">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={l.precio_unitario}
                    onChange={(e) => onUpdatePrecio(l.id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right border border-[var(--ts-border)] rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#c9242b]"
                  />
                </div>
              </td>

              {/* Subtotal */}
              <td className="px-4 py-3 text-right font-bold text-[var(--ts-text-primary)]">
                {formatUSD(l.cantidad * l.precio_unitario)}
              </td>

              {/* Eliminar */}
              <td className="px-3 py-3 text-center">
                <button
                  onClick={() => onRemove(l.id)}
                  className="text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] transition-colors"
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
