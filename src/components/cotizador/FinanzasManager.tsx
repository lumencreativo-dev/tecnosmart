"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle2, Plus, Search, Filter, Calendar, Building2,
  Users, CreditCard, RefreshCw, Download, FileText, ChevronRight,
  TrendingUp, TrendingDown, AlertCircle, Eye, X, Landmark, Smartphone,
  Banknote, ArrowLeftRight, Check, Pencil
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";

// ── Tipos ──────────────────────────────────────────────────────────
interface CuentaBancaria {
  id: string;
  nombre: string;
  tipo: "zelle" | "efectivo_usd" | "pago_movil" | "banco_bs" | "binance";
  moneda: "USD" | "VES";
  saldo: number;
  titular: string;
  identificador: string;
}

interface MovimientoFinanciero {
  id: string;
  fecha: string;
  tipo: "ingreso" | "egreso" | "transferencia";
  categoria: "facturacion" | "abono_cliente" | "proveedor" | "nomina_cuadrilla" | "viatico" | "servicios_operativos" | "otro";
  concepto: string;
  montoUSD: number;
  montoVES: number;
  cuentaId: string;
  referencia?: string;
  beneficiarioOCliente?: string;
  estado: "conciliado" | "pendiente" | "anulado";
}

interface CuentaPorPagar {
  id: string;
  beneficiario: string;
  tipoBeneficiario: "proveedor" | "tecnico_cuadrilla" | "servicio";
  concepto: string;
  montoUSD: number;
  fechaVencimiento: string;
  estado: "pendiente" | "pagado" | "parcial";
  montoAbonadoUSD: number;
  notas?: string;
}

// ── Cuentas Iniciales (Vacías por defecto para configuración real) ─
const CUENTAS_DEFAULT: CuentaBancaria[] = [];

export default function FinanzasManager() {
  const { usuario } = useUsuario();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"resumen" | "cuentas" | "cxc" | "cxp" | "movimientos">("resumen");

  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t && ["resumen", "cuentas", "cxc", "cxp", "movimientos"].includes(t)) {
      setTab(t as any);
    }
  }, [searchParams]);

  // Monitor de Tasas
  const [tasaBCV, setTasaBCV] = useState<number>(65.80);
  const [tasaParalelo, setTasaParalelo] = useState<number>(74.20);
  const [cargandoTasas, setCargandoTasas] = useState(false);

  // Normalización segura de tasas para evitar runtime errors si la API devuelve objetos
  const bcvNumero = typeof tasaBCV === "number" ? tasaBCV : (Number((tasaBCV as any)?.promedio) || 65.80);
  const paraleloNumero = typeof tasaParalelo === "number" ? tasaParalelo : (Number((tasaParalelo as any)?.promedio) || 74.20);

  // Estados de datos
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>(CUENTAS_DEFAULT);
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);
  const [cuentasPorPagar, setCuentasPorPagar] = useState<CuentaPorPagar[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculadora Bimoneda Rápida
  const [calcMonto, setCalcMonto] = useState<number>(100);
  const [calcDe, setCalcDe] = useState<"USD" | "VES">("USD");

  // Modal para Registrar Movimiento
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [movTipo, setMovTipo] = useState<"ingreso" | "egreso">("egreso");
  const [movConcepto, setMovConcepto] = useState("");
  const [movMontoUSD, setMovMontoUSD] = useState<number>(0);
  const [movCategoria, setMovCategoria] = useState<MovimientoFinanciero["categoria"]>("proveedor");
  const [movCuentaId, setMovCuentaId] = useState("c-1");
  const [movBeneficiario, setMovBeneficiario] = useState("");
  const [movReferencia, setMovReferencia] = useState("");

  // Modal para Registrar Cuenta por Pagar (CxP)
  const [modalCxP, setModalCxP] = useState(false);
  const [cxpBeneficiario, setCxpBeneficiario] = useState("");
  const [cxpTipo, setCxpTipo] = useState<CuentaPorPagar["tipoBeneficiario"]>("proveedor");
  const [cxpConcepto, setCxpConcepto] = useState("");
  const [cxpMontoUSD, setCxpMontoUSD] = useState<number>(0);
  const [cxpFecha, setCxpFecha] = useState("");

  // Modal para Agregar / Editar Cuenta Bancaria / Caja
  const [modalCuenta, setModalCuenta] = useState(false);
  const [idEditandoCuenta, setIdEditandoCuenta] = useState<string | null>(null);
  const [cuentaNombre, setCuentaNombre] = useState("");
  const [cuentaTipo, setCuentaTipo] = useState<CuentaBancaria["tipo"]>("zelle");
  const [cuentaMoneda, setCuentaMoneda] = useState<"USD" | "VES">("USD");
  const [cuentaSaldo, setCuentaSaldo] = useState<number>(0);
  const [cuentaTitular, setCuentaTitular] = useState("");
  const [cuentaIdentificador, setCuentaIdentificador] = useState("");

  // Cargar tasas reales de Supabase o API interna
  useEffect(() => {
    async function fetchTasas() {
      setCargandoTasas(true);
      try {
        const res = await fetch("/api/tasas");
        if (res.ok) {
          const data = await res.json();
          const bcvVal = typeof data?.bcv === "number" ? data.bcv : Number(data?.bcv?.promedio);
          const paraleloVal = typeof data?.paralelo === "number" ? data.paralelo : Number(data?.paralelo?.promedio);
          if (bcvVal && !isNaN(bcvVal) && bcvVal > 0) setTasaBCV(bcvVal);
          if (paraleloVal && !isNaN(paraleloVal) && paraleloVal > 0) setTasaParalelo(paraleloVal);
        }
      } catch (e) {
        // Fallback a tasa de respaldo
      } finally {
        setCargandoTasas(false);
      }
    }
    fetchTasas();
  }, []);

  // Cargar datos locales / Supabase
  useEffect(() => {
    try {
      const savedCuentas = localStorage.getItem("ts_cuentas_bancarias");
      if (savedCuentas) {
        setCuentas(JSON.parse(savedCuentas));
      } else {
        setCuentas([]);
      }

      const savedMovs = localStorage.getItem("ts_movimientos_financieros");
      if (savedMovs) {
        setMovimientos(JSON.parse(savedMovs));
      } else {
        setMovimientos([]);
      }

      const savedCxP = localStorage.getItem("ts_cuentas_por_pagar");
      if (savedCxP) {
        setCuentasPorPagar(JSON.parse(savedCxP));
      } else {
        setCuentasPorPagar([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [bcvNumero]);

  // Totales de Cajas / Liquidez
  const liquidezTotalUSD = useMemo(() => {
    return cuentas.reduce((acc, c) => {
      if (c.moneda === "USD") return acc + c.saldo;
      return acc + (c.saldo / (bcvNumero || 65.80));
    }, 0);
  }, [cuentas, bcvNumero]);

  const liquidezTotalVES = liquidezTotalUSD * (bcvNumero || 65.80);

  // Totales de CxP pendientes
  const totalCxPPendienteUSD = useMemo(() => {
    return cuentasPorPagar.reduce((acc, p) => {
      if (p.estado === "pagado") return acc;
      return acc + (p.montoUSD - p.montoAbonadoUSD);
    }, 0);
  }, [cuentasPorPagar]);

  // Ingresos y Egresos del mes
  const ingresosMesUSD = useMemo(() => {
    return movimientos
      .filter(m => m.tipo === "ingreso" && m.estado !== "anulado")
      .reduce((acc, m) => acc + m.montoUSD, 0);
  }, [movimientos]);

  const egresosMesUSD = useMemo(() => {
    return movimientos
      .filter(m => m.tipo === "egreso" && m.estado !== "anulado")
      .reduce((acc, m) => acc + m.montoUSD, 0);
  }, [movimientos]);

  // Guardar nuevo movimiento
  const handleGuardarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movConcepto || movMontoUSD <= 0) return;

    const nuevo: MovimientoFinanciero = {
      id: `mov-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      tipo: movTipo,
      categoria: movCategoria,
      concepto: movConcepto,
      montoUSD: movMontoUSD,
      montoVES: movMontoUSD * bcvNumero,
      cuentaId: movCuentaId,
      beneficiarioOCliente: movBeneficiario || undefined,
      referencia: movReferencia || undefined,
      estado: "conciliado"
    };

    // Actualizar saldo de la cuenta afectada
    const cuentasActualizadas = cuentas.map(c => {
      if (c.id === movCuentaId) {
        const delta = movTipo === "ingreso" ? movMontoUSD : -movMontoUSD;
        if (c.moneda === "USD") {
          return { ...c, saldo: Math.max(0, c.saldo + delta) };
        } else {
          return { ...c, saldo: Math.max(0, c.saldo + (delta * bcvNumero)) };
        }
      }
      return c;
    });

    const movsActualizados = [nuevo, ...movimientos];
    setMovimientos(movsActualizados);
    setCuentas(cuentasActualizadas);
    localStorage.setItem("ts_movimientos_financieros", JSON.stringify(movsActualizados));
    localStorage.setItem("ts_cuentas_bancarias", JSON.stringify(cuentasActualizadas));

    setModalMovimiento(false);
    setMovConcepto("");
    setMovMontoUSD(0);
    setMovBeneficiario("");
    setMovReferencia("");
  };

  // Guardar nueva cuenta por pagar
  const handleGuardarCxP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cxpBeneficiario || cxpMontoUSD <= 0) return;

    const nuevaCxP: CuentaPorPagar = {
      id: `cxp-${Date.now()}`,
      beneficiario: cxpBeneficiario,
      tipoBeneficiario: cxpTipo,
      concepto: cxpConcepto,
      montoUSD: cxpMontoUSD,
      montoAbonadoUSD: 0,
      fechaVencimiento: cxpFecha || new Date(Date.now() + 604800000).toISOString().split("T")[0],
      estado: "pendiente"
    };

    const actualizados = [nuevaCxP, ...cuentasPorPagar];
    setCuentasPorPagar(actualizados);
    localStorage.setItem("ts_cuentas_por_pagar", JSON.stringify(actualizados));

    setModalCxP(false);
    setCxpBeneficiario("");
    setCxpConcepto("");
    setCxpMontoUSD(0);
  };

  // Registrar pago total de CxP
  const handlePagarCxPTotal = (cxpId: string) => {
    const item = cuentasPorPagar.find(p => p.id === cxpId);
    if (!item) return;

    const pendiente = item.montoUSD - item.montoAbonadoUSD;

    // Crear egreso automático
    const nuevoEgreso: MovimientoFinanciero = {
      id: `mov-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      tipo: "egreso",
      categoria: item.tipoBeneficiario === "proveedor" ? "proveedor" : "nomina_cuadrilla",
      concepto: `Pago CxP: ${item.beneficiario} - ${item.concepto}`,
      montoUSD: pendiente,
      montoVES: pendiente * bcvNumero,
      cuentaId: "c-1", // Caja fuerte por defecto
      beneficiarioOCliente: item.beneficiario,
      estado: "conciliado"
    };

    const cxpActualizadas = cuentasPorPagar.map(p => {
      if (p.id === cxpId) {
        return { ...p, montoAbonadoUSD: p.montoUSD, estado: "pagado" as const };
      }
      return p;
    });

    const movsActualizados = [nuevoEgreso, ...movimientos];
    setCuentasPorPagar(cxpActualizadas);
    setMovimientos(movsActualizados);
    localStorage.setItem("ts_cuentas_por_pagar", JSON.stringify(cxpActualizadas));
    localStorage.setItem("ts_movimientos_financieros", JSON.stringify(movsActualizados));
  };

  // Abrir Modal para Crear Nueva Cuenta
  const handleAbrirCrearCuenta = () => {
    setIdEditandoCuenta(null);
    setCuentaNombre("");
    setCuentaTipo("zelle");
    setCuentaMoneda("USD");
    setCuentaSaldo(0);
    setCuentaTitular("");
    setCuentaIdentificador("");
    setModalCuenta(true);
  };

  // Abrir Modal para Editar Cuenta Existente
  const handleAbrirEditarCuenta = (c: CuentaBancaria) => {
    setIdEditandoCuenta(c.id);
    setCuentaNombre(c.nombre);
    setCuentaTipo(c.tipo);
    setCuentaMoneda(c.moneda);
    setCuentaSaldo(c.saldo);
    setCuentaTitular(c.titular);
    setCuentaIdentificador(c.identificador);
    setModalCuenta(true);
  };

  // Guardar (Crear o Editar) Cuenta Bancaria / Caja Real
  const handleGuardarCuenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaNombre.trim()) return;

    if (idEditandoCuenta) {
      // Modo Edición
      const actualizadas = cuentas.map(c => {
        if (c.id === idEditandoCuenta) {
          return {
            ...c,
            nombre: cuentaNombre.trim(),
            tipo: cuentaTipo,
            moneda: cuentaMoneda,
            saldo: Number(cuentaSaldo) || 0,
            titular: cuentaTitular.trim() || "TecnoSmart VZL C.A",
            identificador: cuentaIdentificador.trim() || "Cuenta Operativa",
          };
        }
        return c;
      });
      setCuentas(actualizadas);
      localStorage.setItem("ts_cuentas_bancarias", JSON.stringify(actualizadas));
    } else {
      // Modo Creación
      const nueva: CuentaBancaria = {
        id: `c-${Date.now()}`,
        nombre: cuentaNombre.trim(),
        tipo: cuentaTipo,
        moneda: cuentaMoneda,
        saldo: Number(cuentaSaldo) || 0,
        titular: cuentaTitular.trim() || "TecnoSmart VZL C.A",
        identificador: cuentaIdentificador.trim() || "Cuenta Operativa",
      };
      const actualizadas = [...cuentas, nueva];
      setCuentas(actualizadas);
      localStorage.setItem("ts_cuentas_bancarias", JSON.stringify(actualizadas));
    }

    setModalCuenta(false);
    setIdEditandoCuenta(null);
    setCuentaNombre("");
    setCuentaSaldo(0);
    setCuentaIdentificador("");
    setCuentaTitular("");
  };

  // Eliminar Cuenta Bancaria
  const handleEliminarCuenta = (cuentaId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta cuenta bancaria o caja?")) return;
    const actualizadas = cuentas.filter(c => c.id !== cuentaId);
    setCuentas(actualizadas);
    localStorage.setItem("ts_cuentas_bancarias", JSON.stringify(actualizadas));
  };

  return (
    <div className="space-y-6">

      {/* ── BANNER DE TASAS DE CAMBIO (BCV / PARALELO) ── */}
      <div className="bg-gradient-to-r from-[#171720] via-[#14141a] to-[#171720] border border-[#262633] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ts-red)]">Monitor Cambiario Oficial</span>
              <span className="text-[10px] bg-[#22222d] text-[#a5a5b2] px-2 py-0.5 rounded-full border border-[#333342]">En Vivo</span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">Venezuela Multidivisa · Tasa Oficial BCV</p>
          </div>
        </div>

        {/* Cajas de Tasas */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-[#101015] border border-[#282834] rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] text-[#8e8e9c] uppercase font-bold block">Tasa BCV USD</span>
            <span className="text-lg font-black text-white">{bcvNumero.toFixed(2)} <span className="text-xs font-normal text-[#8e8e9c]">Bs/$</span></span>
          </div>

          <div className="bg-[#101015] border border-[#282834] rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] text-[#8e8e9c] uppercase font-bold block">Ref. Paralelo</span>
            <span className="text-lg font-black text-amber-400">{paraleloNumero.toFixed(2)} <span className="text-xs font-normal text-[#8e8e9c]">Bs/$</span></span>
          </div>

          <div className="bg-[#101015] border border-[#282834] rounded-xl px-4 py-2 text-center hidden sm:block">
            <span className="text-[10px] text-[#8e8e9c] uppercase font-bold block">Binance USDT</span>
            <span className="text-lg font-black text-emerald-400">{(paraleloNumero * 0.99).toFixed(2)} <span className="text-xs font-normal text-[#8e8e9c]">Bs</span></span>
          </div>
        </div>
      </div>

      {/* ── SELECTOR DE TABS FINANCIERAS ── */}
      <div className="flex items-center gap-2 border-b border-[#22222c] pb-2 overflow-x-auto">
        <button
          onClick={() => setTab("resumen")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            tab === "resumen" ? "bg-[var(--ts-red)] text-white shadow-md" : "text-[#a5a5b2] hover:bg-[#1a1a22] hover:text-white"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Resumen & Cockpit</span>
        </button>

        <button
          onClick={() => setTab("cuentas")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            tab === "cuentas" ? "bg-[var(--ts-red)] text-white shadow-md" : "text-[#a5a5b2] hover:bg-[#1a1a22] hover:text-white"
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Cuentas & Cajas ({cuentas.length})</span>
        </button>

        <button
          onClick={() => setTab("cxp")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            tab === "cxp" ? "bg-[var(--ts-red)] text-white shadow-md" : "text-[#a5a5b2] hover:bg-[#1a1a22] hover:text-white"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Cuentas por Pagar ({cuentasPorPagar.filter(p => p.estado !== "pagado").length})</span>
        </button>

        <button
          onClick={() => setTab("movimientos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            tab === "movimientos" ? "bg-[var(--ts-red)] text-white shadow-md" : "text-[#a5a5b2] hover:bg-[#1a1a22] hover:text-white"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Libro de Movimientos</span>
        </button>
      </div>

      {/* ── TAB 1: RESUMEN FINANCIERO ── */}
      {tab === "resumen" && (
        <div className="space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-[#14141a] border border-[#23232c] rounded-2xl p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e9c] block mb-1">Liquidez Total Consolidada</span>
              <div className="text-2xl sm:text-3xl font-black text-white">
                ${liquidezTotalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-emerald-400 font-mono mt-1">
                ≈ Bs. {liquidezTotalVES.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-[#14141a] border border-[#23232c] rounded-2xl p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e9c] block mb-1">Ingresos del Mes</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-6 h-6" />
                <span>${ingresosMesUSD.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[#8e8e9c] mt-1">Cobros de cotizaciones y facturas</p>
            </div>

            <div className="bg-[#14141a] border border-[#23232c] rounded-2xl p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e9c] block mb-1">Egresos / Gastos Operativos</span>
              <div className="text-2xl sm:text-3xl font-black text-[var(--ts-red)] flex items-center gap-1">
                <ArrowDownRight className="w-6 h-6" />
                <span>${egresosMesUSD.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[#8e8e9c] mt-1">Compras mayoristas y viáticos</p>
            </div>

            <div className="bg-[#14141a] border border-[#23232c] rounded-2xl p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e9c] block mb-1">Por Pagar a Proveedores & Nómina</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                ${totalCxPPendienteUSD.toFixed(2)}
              </div>
              <p className="text-xs text-[#8e8e9c] mt-1">{cuentasPorPagar.filter(p => p.estado !== "pagado").length} cuentas pendientes</p>
            </div>

          </div>

          {/* Gráfico Visual y Conversor Bimoneda */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Gráfica de Rendimiento Financiero */}
            <div className="lg:col-span-8 bg-[#14141a] border border-[#23232c] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Flujo de Caja Semestral (Ingresos vs Egresos)</h3>
                  <p className="text-xs text-[#8e8e9c]">Métricas consolidadas en dólares americanos ($)</p>
                </div>
                <span className="text-xs text-[var(--ts-red)] font-semibold bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/40">
                  Balance Positivo
                </span>
              </div>

              {/* Barras de Rendimiento Visual */}
              <div className="space-y-4 pt-2">
                {movimientos.length === 0 ? (
                  <div className="py-12 text-center text-[#8e8e9c]">
                    <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-bold text-white">Sin movimientos registrados</p>
                    <p className="text-xs mt-1 max-w-sm mx-auto">
                      A medida que registres cobros de facturas y egresos operativos, esta gráfica reflejará automáticamente la comparativa mensual real.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#c8c8cf]">Mes Actual (En curso)</span>
                        <span className="text-white font-mono font-bold">
                          ${ingresosMesUSD.toFixed(2)}{" "}
                          <span className="text-xs text-[var(--ts-red)] font-normal">(-${egresosMesUSD.toFixed(2)})</span>
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#1e1e28] rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full rounded-l-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, (ingresosMesUSD / (ingresosMesUSD + egresosMesUSD || 1)) * 100))}%`,
                          }}
                        />
                        <div
                          className="bg-[var(--ts-red)] h-full opacity-80"
                          style={{
                            width: `${Math.min(100, Math.max(5, (egresosMesUSD / (ingresosMesUSD + egresosMesUSD || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Calculadora Bimoneda Rápida de Campo */}
            <div className="lg:col-span-4 bg-[#14141a] border border-[#23232c] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowLeftRight className="w-5 h-5 text-[var(--ts-red)]" />
                  <h3 className="text-base font-bold text-white">Conversor Multidivisa</h3>
                </div>
                <p className="text-xs text-[#8e8e9c] mb-4">
                  Convierte al segundo cualquier presupuesto entre USD y Bolívares a la tasa oficial de hoy ({bcvNumero.toFixed(2)} Bs).
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Monto a Convertir</label>
                    <input
                      type="number"
                      value={calcMonto}
                      onChange={(e) => setCalcMonto(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcDe("USD")}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        calcDe === "USD" ? "bg-[var(--ts-red)] border-[var(--ts-red)] text-white" : "bg-[#1b1b24] border-[#2e2e3e] text-[#8e8e9c]"
                      }`}
                    >
                      Dólares ($) ➔ Bs
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcDe("VES")}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        calcDe === "VES" ? "bg-[var(--ts-red)] border-[var(--ts-red)] text-white" : "bg-[#1b1b24] border-[#2e2e3e] text-[#8e8e9c]"
                      }`}
                    >
                      Bolívares (Bs) ➔ $
                    </button>
                  </div>

                  {/* Resultado de Conversión */}
                  <div className="bg-[#111116] border border-dashed border-[#2f2f3e] rounded-xl p-4 text-center mt-4">
                    <span className="text-[10px] uppercase font-bold text-[#8e8e9c] block mb-1">Resultado a Tasa BCV</span>
                    <div className="text-2xl font-black text-white">
                      {calcDe === "USD"
                        ? `Bs. ${(calcMonto * bcvNumero).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `$ ${(calcMonto / (bcvNumero || 1)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#20202a] flex items-center justify-between">
                <button
                  onClick={() => setModalMovimiento(true)}
                  className="w-full py-3 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Movimiento / Gasto</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 2: CUENTAS, CAJAS & BANCOS ── */}
      {tab === "cuentas" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">Cajas y Cuentas Bancarias</h3>
              <p className="text-xs text-[#8e8e9c]">Saldos disponibles en bóveda, transferencias electrónicas y billeteras</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAbrirCrearCuenta}
                className="inline-flex items-center gap-2 bg-[#20202c] hover:bg-[#282838] border border-[#333344] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Nueva Cuenta / Caja</span>
              </button>
              <button
                onClick={() => setModalMovimiento(true)}
                disabled={cuentas.length === 0}
                className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Movimiento</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cuentas.length === 0 ? (
              <div className="bg-[#14141a] border border-[#23232c] rounded-2xl p-10 text-center col-span-full">
                <Wallet className="w-12 h-12 mx-auto text-[#8e8e9c] mb-3 opacity-30" />
                <h4 className="text-base font-bold text-white mb-1">No hay cuentas bancarias ni cajas registradas</h4>
                <p className="text-xs text-[#8e8e9c] max-w-md mx-auto mb-4">
                  Registra tus cuentas reales de Zelle, Efectivo en custodia, Pago Móvil o Bancos para controlar los saldos y flujo de caja de la empresa.
                </p>
                <button
                  onClick={handleAbrirCrearCuenta}
                  className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Primera Cuenta o Caja</span>
                </button>
              </div>
            ) : (
              cuentas.map(c => (
                <div key={c.id} className="bg-[#14141a] border border-[#23232c] rounded-2xl p-5 hover:border-[#383848] transition-all relative group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)]">
                      {c.tipo === "zelle" ? <CreditCard className="w-5 h-5" /> :
                       c.tipo === "pago_movil" ? <Smartphone className="w-5 h-5" /> :
                       c.tipo === "efectivo_usd" ? <Banknote className="w-5 h-5" /> :
                       <Landmark className="w-5 h-5" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                        Activa
                      </span>
                      <button
                        onClick={() => handleAbrirEditarCuenta(c)}
                        className="p-1 rounded-md text-[#8e8e9c] hover:text-white hover:bg-[#22222e] transition-colors"
                        title="Editar cuenta"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEliminarCuenta(c.id)}
                        className="p-1 rounded-md text-[#8e8e9c] hover:text-[var(--ts-red)] hover:bg-[#22222e] transition-colors"
                        title="Eliminar cuenta"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white mb-0.5">{c.nombre}</h4>
                  <p className="text-xs text-[#8e8e9c] font-mono truncate mb-4">{c.identificador}</p>

                  <div className="pt-3 border-t border-[#20202a] flex items-baseline justify-between">
                    <span className="text-xs text-[#8e8e9c]">Saldo disponible:</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-white">
                        {c.moneda === "USD" ? `$ ${c.saldo.toFixed(2)}` : `Bs. ${c.saldo.toLocaleString("es-VE")}`}
                      </span>
                      {c.moneda === "VES" && (
                        <span className="block text-[11px] text-[#8e8e9c] font-mono">
                          ≈ ${(c.saldo / bcvNumero).toFixed(2)} USD
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: CUENTAS POR PAGAR (CxP) ── */}
      {tab === "cxp" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Cuentas por Pagar (Proveedores & Nómina Cuadrillas)</h3>
              <p className="text-xs text-[#8e8e9c]">Control de compromisos adquiridos para compra de equipos o liquidación de obras</p>
            </div>
            <button
              onClick={() => setModalCxP(true)}
              className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cuenta por Pagar</span>
            </button>
          </div>

          <div className="bg-[#14141a] border border-[#23232c] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#c8c8cf]">
                <thead className="bg-[#111116] text-[#8e8e9c] uppercase font-bold text-[10px] tracking-wider border-b border-[#23232c]">
                  <tr>
                    <th className="py-3 px-4">Beneficiario</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Concepto</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4 text-right">Monto Total</th>
                    <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20202a]">
                  {cuentasPorPagar.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#8e8e9c]">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-bold text-white text-sm">No hay cuentas por pagar registradas</p>
                        <p className="text-xs mt-1">Usa "+ Nueva Cuenta por Pagar" para registrar facturas de proveedores o pagos a cuadrillas.</p>
                      </td>
                    </tr>
                  ) : (
                    cuentasPorPagar.map(p => {
                    const pendiente = p.montoUSD - p.montoAbonadoUSD;
                    return (
                      <tr key={p.id} className="hover:bg-[#191922] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{p.beneficiario}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.tipoBeneficiario === "proveedor" ? "bg-purple-950/40 text-purple-400 border border-purple-900/40" :
                            "bg-amber-950/40 text-amber-400 border border-amber-900/40"
                          }`}>
                            {p.tipoBeneficiario === "proveedor" ? "Proveedor" : "Cuadrilla"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#a5a5b2] max-w-xs truncate">{p.concepto}</td>
                        <td className="py-3.5 px-4 font-mono text-[#8e8e9c]">{p.fechaVencimiento}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${p.montoUSD.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">${pendiente.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.estado === "pagado" ? "bg-emerald-950/40 text-emerald-400" :
                            p.estado === "parcial" ? "bg-amber-950/40 text-amber-400" :
                            "bg-red-950/40 text-[var(--ts-red)]"
                          }`}>
                            {p.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.estado !== "pagado" && (
                            <button
                              onClick={() => handlePagarCxPTotal(p.id)}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/40 rounded-lg text-xs font-bold transition-all active:scale-95"
                            >
                              Liquidar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: LIBRO DE MOVIMIENTOS ── */}
      {tab === "movimientos" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Libro de Ingresos y Egresos</h3>
              <p className="text-xs text-[#8e8e9c]">Historial auditable de transacciones y pagos registrados</p>
            </div>
            <button
              onClick={() => setModalMovimiento(true)}
              className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Movimiento</span>
            </button>
          </div>

          <div className="bg-[#14141a] border border-[#23232c] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#c8c8cf]">
                <thead className="bg-[#111116] text-[#8e8e9c] uppercase font-bold text-[10px] tracking-wider border-b border-[#23232c]">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Concepto / Detalle</th>
                    <th className="py-3 px-4">Beneficiario / Cliente</th>
                    <th className="py-3 px-4">Ref.</th>
                    <th className="py-3 px-4 text-right">Monto ($)</th>
                    <th className="py-3 px-4 text-right">Monto (Bs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20202a]">
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#8e8e9c]">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-bold text-white text-sm">No hay movimientos registrados</p>
                        <p className="text-xs mt-1">Usa "+ Registrar Movimiento" para ingresar cobros, egresos o transferencias reales.</p>
                      </td>
                    </tr>
                  ) : (
                    movimientos.map(m => (
                    <tr key={m.id} className="hover:bg-[#191922] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#8e8e9c]">{m.fecha}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.tipo === "ingreso" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" :
                          "bg-red-950/40 text-[var(--ts-red)] border border-red-900/40"
                        }`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white max-w-sm truncate">{m.concepto}</td>
                      <td className="py-3.5 px-4 text-[#a5a5b2]">{m.beneficiarioOCliente || "—"}</td>
                      <td className="py-3.5 px-4 font-mono text-[#8e8e9c]">{m.referencia || "—"}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                        m.tipo === "ingreso" ? "text-emerald-400" : "text-[var(--ts-red)]"
                      }`}>
                        {m.tipo === "ingreso" ? "+" : "-"}${m.montoUSD.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#8e8e9c]">
                        Bs. {m.montoVES.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR MOVIMIENTO ── */}
      {modalMovimiento && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14141a] border border-[#2d2d3a] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalMovimiento(false)}
              className="absolute top-4 right-4 text-[#8e8e9c] hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Registrar Movimiento Financiero</h3>

            <form onSubmit={handleGuardarMovimiento} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovTipo("ingreso")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    movTipo === "ingreso" ? "bg-emerald-600 text-white border-emerald-600" : "bg-[#1b1b24] border-[#2c2c3a] text-[#8e8e9c]"
                  }`}
                >
                  + Ingreso (Cobro)
                </button>
                <button
                  type="button"
                  onClick={() => setMovTipo("egreso")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    movTipo === "egreso" ? "bg-[var(--ts-red)] text-white border-[var(--ts-red)]" : "bg-[#1b1b24] border-[#2c2c3a] text-[#8e8e9c]"
                  }`}
                >
                  - Egreso (Pago / Gasto)
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Concepto o Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pago a mayorista por cable UTP o Cobro instalación"
                  value={movConcepto}
                  onChange={(e) => setMovConcepto(e.target.value)}
                  className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Monto en Dólares ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={movMontoUSD || ""}
                    onChange={(e) => setMovMontoUSD(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Cuenta / Caja</label>
                  <select
                    value={movCuentaId}
                    onChange={(e) => setMovCuentaId(e.target.value)}
                    className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                  >
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Beneficiario / Cliente</label>
                  <input
                    type="text"
                    placeholder="Ej. Distribuidor / Carlos M."
                    value={movBeneficiario}
                    onChange={(e) => setMovBeneficiario(e.target.value)}
                    className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Referencia / Comprobante</label>
                  <input
                    type="text"
                    placeholder="Ej. Zelle-9801 / Pago Móvil"
                    value={movReferencia}
                    onChange={(e) => setMovReferencia(e.target.value)}
                    className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-4"
              >
                Guardar Movimiento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NUEVA CUENTA POR PAGAR ── */}
      {modalCxP && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14141a] border border-[#2d2d3a] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalCxP(false)}
              className="absolute top-4 right-4 text-[#8e8e9c] hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Nueva Cuenta por Pagar (CxP)</h3>

            <form onSubmit={handleGuardarCxP} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Beneficiario / Proveedor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mayorista Hikvision / Técnico Juan Pérez"
                  value={cxpBeneficiario}
                  onChange={(e) => setCxpBeneficiario(e.target.value)}
                  className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Tipo de Compromiso</label>
                  <select
                    value={cxpTipo}
                    onChange={(e) => setCxpTipo(e.target.value as any)}
                    className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                  >
                    <option value="proveedor">Proveedor de Equipos</option>
                    <option value="tecnico_cuadrilla">Nómina / Honorarios Cuadrilla</option>
                    <option value="servicio">Servicios Generales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Monto Total USD ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cxpMontoUSD || ""}
                    onChange={(e) => setCxpMontoUSD(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Concepto / Detalle de la Deuda *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Liquidación por instalación de cámaras o Factura equipos"
                  value={cxpConcepto}
                  onChange={(e) => setCxpConcepto(e.target.value)}
                  className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={cxpFecha}
                  onChange={(e) => setCxpFecha(e.target.value)}
                  className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-4"
              >
                Registrar Compromiso de Pago
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NUEVA CUENTA BANCARIA O CAJA ── */}
      {modalCuenta && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14141a] border border-[#2d2d3a] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalCuenta(false)}
              className="absolute top-4 right-4 text-[#8e8e9c] hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {idEditandoCuenta ? "Editar Cuenta Bancaria o Caja" : "Agregar Cuenta Bancaria o Caja"}
            </h3>
            <p className="text-xs text-[#8e8e9c] mb-4">
              {idEditandoCuenta
                ? "Modifica el saldo, titular o datos de esta cuenta real."
                : "Configura las cuentas y cajas reales donde la empresa maneja fondos."}
            </p>

            <form onSubmit={handleGuardarCuenta} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Nombre Descriptivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Banesco Pago Móvil / Zelle Comercial / Caja Tinaquillo"
                  value={cuentaNombre}
                  onChange={(e) => setCuentaNombre(e.target.value)}
                  className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Tipo de Cuenta</label>
                  <select
                    value={cuentaTipo}
                    onChange={(e) => setCuentaTipo(e.target.value as any)}
                    className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                  >
                    <option value="zelle">Zelle</option>
                    <option value="efectivo_usd">Efectivo USD (Caja)</option>
                    <option value="pago_movil">Pago Móvil (Bs)</option>
                    <option value="banco_bs">Cuenta Bancaria (Bs)</option>
                    <option value="binance">Binance P2P / USDT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Moneda</label>
                  <select
                    value={cuentaMoneda}
                    onChange={(e) => setCuentaMoneda(e.target.value as any)}
                    className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)] font-bold"
                  >
                    <option value="USD">Dólares (USD)</option>
                    <option value="VES">Bolívares (VES)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Saldo Inicial Real</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cuentaSaldo || ""}
                  onChange={(e) => setCuentaSaldo(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Titular de la Cuenta</label>
                <input
                  type="text"
                  placeholder="Ej. TecnoSmart VZL C.A"
                  value={cuentaTitular}
                  onChange={(e) => setCuentaTitular(e.target.value)}
                  className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8e8e9c] uppercase mb-1">Identificador / Teléfono / Correo / Nº Cuenta</label>
                <input
                  type="text"
                  placeholder="Ej. 0412-2789273 o finanzas@somostecnosmart.com"
                  value={cuentaIdentificador}
                  onChange={(e) => setCuentaIdentificador(e.target.value)}
                  className="w-full bg-[#1b1b24] border border-[#2e2e3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)] font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#20202a] mt-4">
                <button
                  type="button"
                  onClick={() => setModalCuenta(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#8e8e9c] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {idEditandoCuenta ? "Actualizar Cuenta" : "Guardar Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
