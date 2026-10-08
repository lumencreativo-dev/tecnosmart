"use client";

import { AlertCircle, TrendingUp } from "lucide-react";
import type { ResumenCotizacion } from "@/lib/types";
import { formatUSD } from "@/lib/utils";

interface Props {
  resumen: ResumenCotizacion;
  descuento: number;
  onDescuentoChange: (val: number) => void;
}

export default function ResumenFinanciero({ resumen, descuento, onDescuentoChange }: Props) {
  return (
    <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--ts-surface-raised)] px-5 py-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[var(--ts-red)]" />
        <span className="text-[var(--ts-text-primary)] text-sm font-bold uppercase tracking-wide">
          Resumen Financiero
        </span>
      </div>

      <div className="p-5 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--ts-text-muted)]">Subtotal</span>
          <span className="font-medium text-[var(--ts-text-primary)]">{formatUSD(resumen.subtotal)}</span>
        </div>

        {/* Descuento */}
        <div className="flex items-center justify-between text-sm">
          <label className="text-[var(--ts-text-muted)] flex-1">
            Descuento
            <span className="text-[10px] text-[var(--ts-text-muted)] ml-1">(USD)</span>
          </label>
          <div className="flex items-center gap-1">
            <span className="text-[var(--ts-text-muted)] text-xs">$</span>
            <input
              type="number"
              min={0}
              max={resumen.subtotal}
              step={5}
              value={descuento}
              onChange={(e) => onDescuentoChange(parseFloat(e.target.value) || 0)}
              className="w-20 text-right border border-[var(--ts-border)] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40"
            />
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-[var(--ts-border)] my-2" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-bold text-[var(--ts-text-primary)]">TOTAL</span>
          <span className="text-2xl font-extrabold text-[var(--ts-red)]">
            {formatUSD(resumen.total)}
          </span>
        </div>

        {/* Esquema de pago 70/30 */}
        {resumen.aplicaEsquemaPago && (
          <div className="mt-4 bg-[var(--ts-surface-2)] border border-[var(--ts-red)]/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-[var(--ts-red)] text-xs font-bold uppercase tracking-wide">
              <AlertCircle className="w-4 h-4" />
              Esquema de Pago (Total &gt; $500)
            </div>

            {/* Anticipo */}
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold text-[var(--ts-text-primary)]">
                  Anticipo — 70%
                </p>
                <p className="text-[10px] text-[var(--ts-text-muted)]">Para inicio de proyecto</p>
              </div>
              <span className="font-bold text-[var(--ts-text-primary)] text-base">
                {formatUSD(resumen.anticipo)}
              </span>
            </div>

            {/* Saldo */}
            <div className="flex justify-between items-center text-sm border-t border-[var(--ts-border)] pt-3">
              <div>
                <p className="font-semibold text-[var(--ts-text-primary)]">
                  Saldo Final — 30%
                </p>
                <p className="text-[10px] text-[var(--ts-text-muted)]">
                  Contra entrega o 4 cuotas semanales (1 mes)
                </p>
              </div>
              <span className="font-bold text-[var(--ts-text-primary)] text-base">
                {formatUSD(resumen.saldo)}
              </span>
            </div>
          </div>
        )}

        {!resumen.aplicaEsquemaPago && resumen.total > 0 && (
          <p className="text-[10px] text-[var(--ts-text-muted)] text-center">
            Esquema anticipo 70/30 aplica para presupuestos &gt; $500
          </p>
        )}
      </div>
    </div>
  );
}
