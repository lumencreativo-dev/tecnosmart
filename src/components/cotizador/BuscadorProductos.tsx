"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import type { LineaDetalle, Producto } from "@/lib/types";
import { tempId } from "@/lib/utils";
import { buscarProductos } from "@/lib/supabase/servicios";

interface Props {
  onAdd: (linea: LineaDetalle) => void;
  clienteTipo?: "cliente_normal" | "tecnico";
  descuentoTecnico?: number; // porcentaje de descuento, ej: 15
}

export default function BuscadorProductos({ onAdd, clienteTipo, descuentoTecnico = 15 }: Props) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 2) {
      setResultados([]);
      setShowList(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const data = await buscarProductos(query);
      setResultados(data);
      setShowList(true);
      setLoading(false);
    }, 350);
  }, [query]);

  const handleSelect = (p: Producto) => {
    // Si es técnico: usar precio_tecnico si existe, si no calcular el descuento sobre precio_venta
    let precio = p.precio_venta;
    if (clienteTipo === "tecnico") {
      if (p.precio_tecnico != null && p.precio_tecnico > 0) {
        precio = p.precio_tecnico;
      } else {
        precio = p.precio_venta * (1 - descuentoTecnico / 100);
      }
    }
    onAdd({
      id: tempId(),
      tipo_item: "producto",
      item_id: p.id,
      descripcion: `${p.codigo_sku} — ${p.nombre}`,
      cantidad: 1,
      precio_unitario: parseFloat(precio.toFixed(2)),
      subtotal: parseFloat(precio.toFixed(2)),
    });
    setQuery("");
    setResultados([]);
    setShowList(false);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
        Buscar Producto / Cámara / Equipo
      </label>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[var(--ts-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: DS-2CD2143G2 o Cámara Bullet..."
          className="w-full pl-9 pr-4 py-2.5 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40 focus:border-[var(--ts-red)] bg-[var(--ts-surface)]"
        />
        {loading && (
          <div className="absolute right-3 w-4 h-4 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin" />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(""); setShowList(false); }}
            className="absolute right-3 text-[var(--ts-text-muted)] hover:text-[var(--ts-red)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {showList && resultados.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {resultados.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => handleSelect(p)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--ts-surface-2)] text-left transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ts-text-primary)]">{p.nombre}</p>
                  <p className="text-xs text-[var(--ts-text-muted)]">
                    SKU: {p.codigo_sku} · {p.marca}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--ts-red)]">
                    ${p.precio_venta.toFixed(2)}
                  </span>
                  <Plus className="w-4 h-4 text-[var(--ts-text-muted)] group-hover:text-[var(--ts-red)] transition-colors" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showList && resultados.length === 0 && !loading && (
        <div className="absolute z-20 w-full mt-1 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-4 py-3 text-sm text-[var(--ts-text-muted)] shadow">
          No se encontraron productos. Verifique el SKU o nombre.
        </div>
      )}
    </div>
  );
}
