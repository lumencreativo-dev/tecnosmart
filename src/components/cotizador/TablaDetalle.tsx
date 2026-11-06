"use client";

import { useState } from "react";
import { Trash2, ChevronUp, ChevronDown, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import type { LineaDetalle } from "@/lib/types";
import { formatUSD } from "@/lib/utils";

interface Props {
  lineas: LineaDetalle[];
  onUpdateCantidad: (id: string, cantidad: number) => void;
  onUpdatePrecio:   (id: string, precio: number) => void;
  onRemove:         (id: string) => void;
  onReorder?:       (fromIndex: number, toIndex: number) => void;
}

export default function TablaDetalle({
  lineas,
  onUpdateCantidad,
  onUpdatePrecio,
  onRemove,
  onReorder,
}: Props) {
  const [activeDragIdx, setActiveDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx]     = useState<number | null>(null);

  if (lineas.length === 0) {
    return (
      <div className="border-2 border-dashed border-[var(--ts-border)] rounded-xl py-12 text-center text-[var(--ts-text-muted)] text-sm">
        <p className="text-3xl mb-2">📋</p>
        <p>Sin ítems. Busca un producto o agrega un servicio desde el panel izquierdo.</p>
      </div>
    );
  }

  // ── Motor de Arrastre Ultra-Compatible (Pointer Events) ────
  const startDrag = (index: number, e: React.PointerEvent) => {
    // Solo botón principal del mouse (izquierdo) o toque
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    setActiveDragIdx(index);
    setDragOverIdx(index);

    let currentOver = index;

    const onPointerMove = (evt: PointerEvent) => {
      evt.preventDefault();
      const el = document.elementFromPoint(evt.clientX, evt.clientY);
      const row = el?.closest("[data-row-index]");
      if (row) {
        const idxAttr = row.getAttribute("data-row-index");
        if (idxAttr !== null) {
          const tIdx = parseInt(idxAttr, 10);
          if (!isNaN(tIdx) && tIdx !== currentOver) {
            currentOver = tIdx;
            setDragOverIdx(tIdx);
          }
        }
      }
    };

    const onPointerUp = (evt: PointerEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");

      const el = document.elementFromPoint(evt.clientX, evt.clientY);
      const row = el?.closest("[data-row-index]");
      let finalTarget = currentOver;
      if (row) {
        const idxAttr = row.getAttribute("data-row-index");
        if (idxAttr !== null) {
          const tIdx = parseInt(idxAttr, 10);
          if (!isNaN(tIdx)) finalTarget = tIdx;
        }
      }

      if (finalTarget !== null && finalTarget !== index && finalTarget >= 0 && finalTarget < lineas.length) {
        onReorder?.(index, finalTarget);
      }

      setActiveDragIdx(null);
      setDragOverIdx(null);
    };

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
  };

  const moverFila = (index: number, direccion: -1 | 1) => {
    const target = index + direccion;
    if (target >= 0 && target < lineas.length) {
      onReorder?.(index, target);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--ts-border)] select-none">
      <div className="bg-[var(--ts-surface-2)]/90 px-4 py-2.5 border-b border-[var(--ts-border)] flex items-center justify-between text-xs text-[var(--ts-text-muted)]">
        <span className="flex items-center gap-2 font-medium">
          <GripVertical className="w-4 h-4 text-[var(--ts-red)] shrink-0" />
          {activeDragIdx !== null ? (
            <span className="text-emerald-400 font-bold animate-pulse">
              Moviendo ítem #{activeDragIdx + 1} → suelta sobre la fila destino #{dragOverIdx !== null ? dragOverIdx + 1 : ""}
            </span>
          ) : (
            <span>Haz clic sostenido en <strong>⋮⋮</strong> y arrastra para reordenar los productos a tu gusto</span>
          )}
        </span>
        <span className="font-mono text-[11px] font-bold text-[var(--ts-text-primary)]">
          {lineas.length} {lineas.length === 1 ? "ítem" : "ítems"}
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--ts-surface-raised)] text-white">
            <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider w-24">Posición</th>
            <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Descripción</th>
            <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider w-24">Cant.</th>
            <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider w-28">P. Unit.</th>
            <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider w-28">Subtotal</th>
            <th className="px-3 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {lineas.map((l, idx) => {
            const isDragging = activeDragIdx === idx;
            const isOver = dragOverIdx === idx && activeDragIdx !== null && activeDragIdx !== idx;
            const isOverAbove = isOver && activeDragIdx !== null && idx < activeDragIdx;
            const isOverBelow = isOver && activeDragIdx !== null && idx > activeDragIdx;

            return (
              <tr
                key={l.id}
                data-row-index={idx}
                className={`border-b border-[var(--ts-border)] transition-all group ${
                  isDragging
                    ? "opacity-30 bg-red-950/40 border-2 border-dashed border-[var(--ts-red)]"
                    : isOverAbove
                    ? "bg-red-500/15 border-t-4 border-t-[var(--ts-red)] shadow-inner"
                    : isOverBelow
                    ? "bg-red-500/15 border-b-4 border-b-[var(--ts-red)] shadow-inner"
                    : idx % 2 === 0
                    ? "bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)]"
                    : "bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface-3)]"
                }`}
              >
                {/* Control de Orden: Asa Drag & Drop + Posición + Flechas */}
                <td className="px-2 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Asa de arrastre */}
                    <div
                      onPointerDown={(e) => startDrag(idx, e)}
                      className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-[var(--ts-surface-2)] hover:bg-red-500/10 border border-[var(--ts-border)] hover:border-[var(--ts-red)]/40 text-[var(--ts-text-muted)] hover:text-white transition-all touch-none select-none"
                      title="Haz clic sostenido y arrastra para reordenar"
                    >
                      <GripVertical className="w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Número de posición */}
                    <span className="font-mono text-xs font-bold text-[var(--ts-text-primary)] w-4 text-center">
                      #{idx + 1}
                    </span>

                    {/* Flechas para mover con un clic */}
                    <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moverFila(idx, -1)}
                        disabled={idx === 0}
                        className="hover:text-[var(--ts-red)] disabled:opacity-20 transition-colors p-0.5"
                        title="Subir una posición"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverFila(idx, 1)}
                        disabled={idx === lineas.length - 1}
                        className="hover:text-[var(--ts-red)] disabled:opacity-20 transition-colors p-0.5"
                        title="Bajar una posición"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </td>

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
                  <span className="ml-3.5 text-[10px] text-[var(--ts-text-muted)] uppercase font-semibold">
                    {l.tipo_item === "producto" ? "Producto" : "Servicio"}
                  </span>
                </td>

                {/* Cantidad */}
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
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
                      type="button"
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
                    type="button"
                    onClick={() => onRemove(l.id)}
                    className="text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] transition-colors p-1"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
