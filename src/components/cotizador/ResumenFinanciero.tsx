"use client";

import { AlertCircle, TrendingUp, Building2, CreditCard, RefreshCw, DollarSign, Coins } from "lucide-react";
import type { ResumenCotizacion } from "@/lib/types";
import { formatUSD, formatBs } from "@/lib/utils";

interface Props {
  resumen: ResumenCotizacion;
  descuento: number;
  onDescuentoChange: (val: number) => void;
  // Moneda y tasa
  moneda?: "USD" | "VES";
  onMonedaChange?: (val: "USD" | "VES") => void;
  tasaBcv?: number;
  onTasaBcvChange?: (val: number) => void;
  onRefreshTasa?: () => void;
  cargandoTasa?: boolean;
  // IVA
  aplicaIva?: boolean;
  onAplicaIvaChange?: (val: boolean) => void;
  ivaPct?: number;
  onIvaPctChange?: (val: number) => void;
  // Retenciones
  aplicaRetenciones?: boolean;
  onAplicaRetencionesChange?: (val: boolean) => void;
  aplicaRetencionIva?: boolean;
  onAplicaRetencionIvaChange?: (val: boolean) => void;
  retencionIvaPct?: number;
  onRetencionIvaPctChange?: (val: number) => void;
  aplicaRetencionIslr?: boolean;
  onAplicaRetencionIslrChange?: (val: boolean) => void;
  retencionIslrPct?: number;
  onRetencionIslrPctChange?: (val: number) => void;
  // Esquema 70/30
  incluirEsquemaPago?: boolean;
  onIncluirEsquemaPagoChange?: (val: boolean) => void;
}

export default function ResumenFinanciero({
  resumen,
  descuento,
  onDescuentoChange,
  moneda = "USD",
  onMonedaChange,
  tasaBcv = 0,
  onTasaBcvChange,
  onRefreshTasa,
  cargandoTasa = false,
  aplicaIva = true,
  onAplicaIvaChange,
  ivaPct = 16,
  onIvaPctChange,
  aplicaRetenciones = false,
  onAplicaRetencionesChange,
  aplicaRetencionIva = true,
  onAplicaRetencionIvaChange,
  retencionIvaPct = 75,
  onRetencionIvaPctChange,
  aplicaRetencionIslr = false,
  onAplicaRetencionIslrChange,
  retencionIslrPct = 2,
  onRetencionIslrPctChange,
  incluirEsquemaPago = true,
  onIncluirEsquemaPagoChange,
}: Props) {
  const isVES = moneda === "VES";
  const factor = isVES && tasaBcv > 0 ? tasaBcv : 1;

  const fmt = (usdAmount: number) => {
    if (isVES) {
      return formatBs(usdAmount * factor);
    }
    return formatUSD(usdAmount);
  };

  return (
    <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--ts-surface-raised)] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--ts-red)]" />
          <span className="text-[var(--ts-text-primary)] text-sm font-bold uppercase tracking-wide">
            Resumen Financiero
          </span>
        </div>
        {onAplicaRetencionesChange && (
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={aplicaRetenciones}
              onChange={(e) => onAplicaRetencionesChange(e.target.checked)}
              className="w-3.5 h-3.5 text-[var(--ts-red)] rounded border-[var(--ts-border)] focus:ring-[var(--ts-red)]"
            />
            <span className="text-[var(--ts-text-muted)] font-medium">¿Contribuyente Especial?</span>
          </label>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Selector de Moneda (USD vs Bolívares) */}
        {onMonedaChange && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ts-text-muted)]">Moneda de Emisión:</span>
              <div className="flex gap-1 bg-[var(--ts-surface-2)] p-1 rounded-lg border border-[var(--ts-border)]">
                <button
                  type="button"
                  onClick={() => onMonedaChange("USD")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                    moneda === "USD"
                      ? "bg-[var(--ts-surface)] text-[var(--ts-red)] shadow-sm"
                      : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Dólares (USD)
                </button>
                <button
                  type="button"
                  onClick={() => onMonedaChange("VES")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                    moneda === "VES"
                      ? "bg-[var(--ts-red)] text-white shadow-sm"
                      : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  Bolívares (Bs.)
                </button>
              </div>
            </div>

            {/* Tasa BCV si está en Bolívares */}
            {isVES && onTasaBcvChange && (
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--ts-text-primary)]">Tasa BCV:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[var(--ts-text-muted)]">Bs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tasaBcv || ""}
                      onChange={(e) => onTasaBcvChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-24 border border-[var(--ts-border)] rounded px-2 py-0.5 text-xs font-bold bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>
                </div>
                {onRefreshTasa && (
                  <button
                    type="button"
                    onClick={onRefreshTasa}
                    disabled={cargandoTasa}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--ts-red)] hover:underline disabled:opacity-50"
                    title="Actualizar tasa oficial BCV"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cargandoTasa ? "animate-spin" : ""}`} />
                    Actualizar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Subtotal / Base Imponible */}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--ts-text-muted)]">Subtotal (Base Imponible)</span>
          <span className="font-medium text-[var(--ts-text-primary)]">{fmt(resumen.subtotal)}</span>
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
              className="w-20 text-right border border-[var(--ts-border)] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40 bg-[var(--ts-surface)]"
            />
          </div>
        </div>

        {/* Control de IVA */}
        {onAplicaIvaChange && (
          <div className="pt-2 border-t border-[var(--ts-border)] space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aplicaIva}
                  onChange={(e) => onAplicaIvaChange(e.target.checked)}
                  className="w-3.5 h-3.5 text-[var(--ts-red)] rounded border-[var(--ts-border)]"
                />
                <span className="font-medium text-[var(--ts-text-primary)]">
                  Incluir IVA ({ivaPct}%)
                </span>
              </label>
              <span className="font-medium text-[var(--ts-text-primary)]">
                {aplicaIva ? `+ ${fmt(resumen.ivaMonto || 0)}` : "Exento"}
              </span>
            </div>

            {aplicaIva && onIvaPctChange && (
              <div className="flex items-center justify-between pl-5">
                <span className="text-[11px] text-[var(--ts-text-muted)]">Alícuota IVA:</span>
                <div className="flex items-center gap-1">
                  {[16, 8].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onIvaPctChange(pct)}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors ${
                        ivaPct === pct
                          ? "bg-[var(--ts-red)] text-white"
                          : "bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ivaPct}
                      onChange={(e) => onIvaPctChange(parseFloat(e.target.value) || 0)}
                      className="w-14 text-center border border-[var(--ts-border)] rounded px-1.5 py-0.5 text-xs bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
                    />
                    <span className="text-[10px] text-[var(--ts-text-muted)]">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Divisor */}
        <div className="border-t border-[var(--ts-border)] my-2" />

        {/* Total Presupuesto */}
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold text-[var(--ts-text-primary)] text-sm">TOTAL PRESUPUESTO</span>
            {isVES && tasaBcv > 0 && (
              <p className="text-[10px] text-[var(--ts-text-muted)]">
                Ref: {formatUSD(resumen.total)} (Tasa: {tasaBcv.toFixed(2)})
              </p>
            )}
          </div>
          <span className="text-2xl font-extrabold text-[var(--ts-red)]">
            {fmt(resumen.total)}
          </span>
        </div>

        {/* Panel Retenciones Fiscales */}
        {aplicaRetenciones && (
          <div className="mt-4 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--ts-text-primary)] uppercase tracking-wide">
              <Building2 className="w-4 h-4 text-[var(--ts-red)]" />
              Retenciones Fiscales (Contribuyente Especial)
            </div>

            {/* Retención IVA */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!aplicaIva}
                    checked={aplicaRetencionIva && aplicaIva}
                    onChange={(e) => onAplicaRetencionIvaChange?.(e.target.checked)}
                    className="w-3.5 h-3.5 text-[var(--ts-red)] rounded border-[var(--ts-border)]"
                  />
                  <span className="font-semibold text-[var(--ts-text-primary)]">
                    Retención IVA ({retencionIvaPct}%)
                  </span>
                </label>
                {aplicaRetencionIva && aplicaIva && (
                  <span className="font-bold text-[var(--ts-red)]">
                    - {fmt(resumen.retencionIvaMonto ?? 0)}
                  </span>
                )}
              </div>

              {aplicaRetencionIva && aplicaIva && (
                <div className="flex items-center justify-between pl-5">
                  <span className="text-[11px] text-[var(--ts-text-muted)]">Alícuota Retención:</span>
                  <div className="flex items-center gap-1">
                    {[75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => onRetencionIvaPctChange?.(pct)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors ${
                          retencionIvaPct === pct
                            ? "bg-[var(--ts-red)] text-white"
                            : "bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={retencionIvaPct}
                        onChange={(e) => onRetencionIvaPctChange?.(parseFloat(e.target.value) || 0)}
                        className="w-14 text-center border border-[var(--ts-border)] rounded px-1.5 py-0.5 text-xs bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                      <span className="text-[10px] text-[var(--ts-text-muted)]">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Retención ISLR */}
            <div className="space-y-1.5 border-t border-[var(--ts-border)] pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicaRetencionIslr}
                    onChange={(e) => onAplicaRetencionIslrChange?.(e.target.checked)}
                    className="w-3.5 h-3.5 text-[var(--ts-red)] rounded border-[var(--ts-border)]"
                  />
                  <span className="font-semibold text-[var(--ts-text-primary)]">
                    Retención ISLR ({retencionIslrPct}%)
                  </span>
                </label>
                {aplicaRetencionIslr && (
                  <span className="font-bold text-[var(--ts-red)]">
                    - {fmt(resumen.retencionIslrMonto ?? 0)}
                  </span>
                )}
              </div>

              {aplicaRetencionIslr && (
                <div className="flex items-center justify-between pl-5">
                  <span className="text-[11px] text-[var(--ts-text-muted)]">Alícuota Retención:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 5].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => onRetencionIslrPctChange?.(pct)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors ${
                          retencionIslrPct === pct
                            ? "bg-[var(--ts-red)] text-white"
                            : "bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={retencionIslrPct}
                        onChange={(e) => onRetencionIslrPctChange?.(parseFloat(e.target.value) || 0)}
                        className="w-14 text-center border border-[var(--ts-border)] rounded px-1.5 py-0.5 text-xs bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                      <span className="text-[10px] text-[var(--ts-text-muted)]">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Neto a Percibir */}
            {(aplicaRetencionIva || aplicaRetencionIslr) && (
              <div className="border-t border-[var(--ts-border)] pt-2.5 flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">NETO ESTIMADO A COBRAR</span>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Monto final a transferir por el cliente</p>
                </div>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {fmt(resumen.totalNeto ?? resumen.total)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Esquema de Pago 70/30 (Cuotas) */}
        {resumen.total > 0 && (
          <div className="mt-4 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--ts-red)]" />
                <div>
                  <span className="text-xs font-bold text-[var(--ts-text-primary)] uppercase tracking-wide">
                    Esquema de Pago 70/30
                  </span>
                  <p className="text-[10px] text-[var(--ts-text-muted)]">
                    Anticipo 70% + Saldo 30% en 4 cuotas
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={incluirEsquemaPago}
                    onChange={(e) => onIncluirEsquemaPagoChange?.(e.target.checked)}
                  />
                  <div className={`block w-9 h-5 rounded-full transition-colors ${
                    incluirEsquemaPago ? "bg-[var(--ts-red)]" : "bg-[var(--ts-border)]"
                  }`}></div>
                  <div className={`absolute left-0.5 top-0.5 bg-[var(--ts-surface)] w-4 h-4 rounded-full transition-transform ${
                    incluirEsquemaPago ? "translate-x-4" : ""
                  }`}></div>
                </div>
                <span className="text-xs font-bold text-[var(--ts-text-primary)] min-w-[50px] text-right">
                  {incluirEsquemaPago ? "Activo" : "Apagado"}
                </span>
              </label>
            </div>

            {incluirEsquemaPago ? (
              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-[var(--ts-border)]">
                <div className="bg-[var(--ts-surface)] p-2 rounded border border-[var(--ts-border)]">
                  <span className="text-[var(--ts-text-muted)] block text-[10px] uppercase font-semibold">Anticipo (70%)</span>
                  <span className="font-bold text-sm text-[var(--ts-text-primary)]">
                    {fmt(resumen.anticipo)}
                  </span>
                </div>
                <div className="bg-[var(--ts-surface)] p-2 rounded border border-[var(--ts-border)]">
                  <span className="text-[var(--ts-text-muted)] block text-[10px] uppercase font-semibold">Saldo (30% en 4 cuotas)</span>
                  <span className="font-bold text-sm text-[var(--ts-text-primary)]">
                    {fmt(resumen.saldo)}
                  </span>
                  <span className="block text-[10px] text-[var(--ts-text-muted)] mt-0.5">
                    4 cuotas de {fmt(resumen.saldo / 4)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--ts-text-muted)] italic pt-1 border-t border-[var(--ts-border)]">
                Desactivado para esta cotización (pago de contado o según acuerdo específico).
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
