"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, DollarSign, Users, Save, Calendar, CheckCircle,
  Clock, AlertTriangle, ArrowRight, Settings, Phone, Activity, Globe, Package,
  Wrench, HardHat, CheckSquare, Eye, Sliders, ShieldCheck, Sparkles,
  Plus, MapPin, ExternalLink, Calculator, Percent, FileText, ChevronRight,
  Check, X, RefreshCw, Briefcase, Award, Zap, Building2, CreditCard,
  Layers, FileCheck, HelpCircle, AlertCircle, ShoppingCart, Target,
  Compass, Radio, Flame
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD, formatFecha } from "@/lib/utils";
import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import Link from "next/link";

// ── Componente Reutilizable: Estado Vacío Estilo ERPNext ────────────────
function EmptyStateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon: any;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-[var(--ts-border)] bg-[var(--ts-surface)]">
      <div className="w-14 h-14 rounded-2xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] flex items-center justify-center text-[var(--ts-text-muted)] mb-3 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-bold text-[var(--ts-text-primary)]">{title}</h3>
      <p className="text-xs text-[var(--ts-text-muted)] max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && (
        actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ts-red)] text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionLabel}</span>
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ts-red)] text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionLabel}</span>
          </button>
        )
      )}
    </div>
  );
}

// ── Componente Reutilizable: Tarjeta de Pasos Onboarding Estilo Frappe/ERPNext ─
function OnboardingChecklistCard({
  storageKey,
  title,
  steps,
}: {
  storageKey: string;
  title: string;
  steps: { id: string; label: string; desc: string; actionLabel: string; actionHref: string }[];
}) {
  const [completados, setCompletados] = useState<Record<string, boolean>>({});
  const [descartado, setDescartado] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ts_onboarding_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.descartado) setDescartado(true);
        if (parsed.completados) setCompletados(parsed.completados);
      }
    } catch {}
  }, [storageKey]);

  const togglePaso = (id: string) => {
    const next = { ...completados, [id]: !completados[id] };
    setCompletados(next);
    try {
      localStorage.setItem(`ts_onboarding_${storageKey}`, JSON.stringify({ descartado, completados: next }));
    } catch {}
  };

  const handleDescartar = () => {
    setDescartado(true);
    try {
      localStorage.setItem(`ts_onboarding_${storageKey}`, JSON.stringify({ descartado: true, completados }));
    } catch {}
  };

  if (descartado) return null;

  const total = steps.length;
  const hechos = steps.filter((s) => completados[s.id]).length;

  return (
    <div className="p-5 rounded-2xl border border-[var(--ts-border)] bg-[var(--ts-surface)] shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--ts-border)] pb-3 mb-4">
        <div>
          <h2 className="text-sm font-black text-[var(--ts-text-primary)] tracking-tight">{title}</h2>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium mt-0.5">
            {hechos} de {total} pasos completados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-[var(--ts-surface-2)] rounded-full overflow-hidden border border-[var(--ts-border)]">
            <div
              className="h-full bg-[var(--ts-red)] transition-all duration-500"
              style={{ width: `${(hechos / total) * 100}%` }}
            />
          </div>
          <button
            onClick={handleDescartar}
            className="text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((paso) => {
          const isDone = !!completados[paso.id];
          return (
            <div
              key={paso.id}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? "bg-emerald-500/5 border-emerald-500/20 opacity-80"
                  : "bg-[var(--ts-surface-2)] border-[var(--ts-border)] hover:border-[var(--ts-red)]/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => togglePaso(paso.id)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-[var(--ts-border)] bg-[var(--ts-surface)] hover:border-[var(--ts-red)]"
                  }`}
                >
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${isDone ? "line-through text-[var(--ts-text-muted)]" : "text-[var(--ts-text-primary)]"}`}>
                    {paso.label}
                  </p>
                  <p className="text-[11px] text-[var(--ts-text-muted)] mt-1 line-clamp-2 leading-relaxed">
                    {paso.desc}
                  </p>
                  <div className="mt-3">
                    <Link
                      href={paso.actionHref}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ts-red)] hover:underline"
                    >
                      <span>{paso.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardManager() {
  const { usuario } = useUsuario();
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);

  const rolId = usuario?.rol_id || "admin";
  const esSuperAdmin = rolId === "admin" || (usuario?.roles?.permisos || []).includes("*");
  const esGerente = rolId === "gerente";
  const esVendedor = rolId === "vendedor";
  const esAdminFinanzas = rolId === "administrador";
  const esTecnicoAliado = rolId === "tecnico_aliado";
  const esTecnico = rolId === "tecnico" || rolId === "lider_tecnico";

  // Facultades de visualización específicas
  const puedeVerFinanzas = esSuperAdmin || esGerente || esAdminFinanzas || tienePermiso(permisosUsuario, "dashboard.finanzas") || tienePermiso(permisosUsuario, "finanzas.dashboard");
  const puedeVerMRR = esSuperAdmin || esGerente || esAdminFinanzas || tienePermiso(permisosUsuario, "dashboard.mrr") || tienePermiso(permisosUsuario, "finanzas.cajas");
  const puedeVerTasas = esSuperAdmin || esGerente || esVendedor || esAdminFinanzas || esTecnicoAliado || tienePermiso(permisosUsuario, "dashboard.tasas");
  const puedeConfigurar = esSuperAdmin || esGerente || tienePermiso(permisosUsuario, "administracion.configuracion");

  // Filtros o widgets activos personalizables (guardados en localStorage)
  const [widgetsVisibles, setWidgetsVisibles] = useState<Record<string, boolean>>({
    ingresoCerrado: true,
    proyectado: true,
    mrr: true,
    altasSuscripciones: true,
    tasas: true,
    ticketPromedio: true,
    productosTop: true,
    clientesFrecuentes: true,
    grafica: true,
    seguimiento: true,
    proximosPagos: true,
    misionesTecnicas: true,
    alertaStock: true,
    embudoVentas: true,
  });
  const [panelPersonalizarOpen, setPanelPersonalizarOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ts_dashboard_widgets");
      if (saved) {
        setWidgetsVisibles((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleWidget = (key: string) => {
    setWidgetsVisibles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("ts_dashboard_widgets", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [loading, setLoading] = useState(true);

  // Data state
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<any[]>([]);
  const [productosCriticos, setProductosCriticos] = useState<any[]>([]);
  const [productosTopVenta, setProductosTopVenta] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});
  const [tasas, setTasas] = useState<any>(null);

  // Estados financieros de cuentas y cajas
  const [cuentasBancarias, setCuentasBancarias] = useState<any[]>([]);
  const [cuentasPorPagar, setCuentasPorPagar] = useState<any[]>([]);

  // Form config state
  const [descTecnico, setDescTecnico] = useState("15");
  const [diasValidez, setDiasValidez] = useState("15");
  const [metaMensualUSD, setMetaMensualUSD] = useState("10000");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      // 1. Obtener config
      const { data: confData } = await supabase.from("configuracion").select("*");
      if (confData) {
        const confMap: Record<string, any> = {};
        confData.forEach(c => confMap[c.clave] = c.valor);
        setConfig(confMap);
        setDescTecnico(confMap.descuento_tecnico || "15");
        setDiasValidez(confMap.dias_validez_cotizacion || "15");
        if (confMap.meta_mensual_usd) setMetaMensualUSD(confMap.meta_mensual_usd);
      }

      // 2. Obtener cotizaciones excluyendo eliminadas
      const { data: cotData } = await supabase
        .from("cotizaciones")
        .select("*, clientes(empresa, contacto, telefono, direccion)")
        .or("eliminada.is.null,eliminada.eq.false")
        .order("created_at", { ascending: false });
      if (cotData) setCotizaciones(cotData);

      // 3. Obtener clientes
      const { data: cliData } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
      if (cliData) setClientes(cliData);

      // 4. Obtener facturas activas
      const { data: facData } = await supabase
        .from("facturas")
        .select("*, factura_detalles(*), cotizaciones(clientes(empresa, contacto))")
        .eq("estado", "activa");
      if (facData) setFacturas(facData);

      // 5. Obtener suscripciones activas (con fallback resiliente)
      try {
        const { data: susData, error: susErr } = await supabase
          .from("suscripciones")
          .select("*, clientes(empresa, contacto, telefono), servicios_recurrentes(nombre)")
          .eq("estado", "Activo");

        if (susErr) {
          const { data: fallbackData } = await supabase
            .from("suscripciones")
            .select("*")
            .eq("estado", "Activo");
          setSuscripciones(fallbackData || []);
        } else {
          setSuscripciones(susData || []);
        }
      } catch {
        setSuscripciones([]);
      }

      // 6. Obtener órdenes de trabajo (decoupled para máxima resiliencia)
      try {
        const [{ data: otData }, { data: listaPerfiles }] = await Promise.all([
          supabase.from("ordenes_trabajo").select("*").order("created_at", { ascending: false }).limit(40),
          supabase.from("perfiles").select("id, nombre").limit(100),
        ]);

        if (otData) {
          const mapaPerf: Record<string, string> = {};
          (listaPerfiles || []).forEach(p => { mapaPerf[p.id] = p.nombre; });

          const mapaCli: Record<string, any> = {};
          (cliData || []).forEach(c => { mapaCli[c.id] = c; });

          const otEnriquecidas = otData.map(ot => ({
            ...ot,
            tecnico_lider_nombre: ot.tecnico_lider_id ? mapaPerf[ot.tecnico_lider_id] || "No asignado" : "Sin asignar",
            cliente_obj: ot.cliente_id ? mapaCli[ot.cliente_id] : null,
          }));
          setOrdenesTrabajo(otEnriquecidas);
        }
      } catch (e) {
        console.error("Error al cargar ordenes_trabajo:", e);
      }

      // 7. Obtener productos con stock crítico (<= 3) y productos con mayor stock
      try {
        const { data: prodData } = await supabase
          .from("productos")
          .select("id, nombre, marca, categoria, stock, precio_venta, precio_tecnico, codigo_sku")
          .order("stock", { ascending: true })
          .limit(50);

        if (prodData) {
          const criticos = prodData.filter(p => Number(p.stock || 0) <= 3);
          const disponibles = [...prodData].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0)).slice(0, 5);
          setProductosCriticos(criticos);
          setProductosTopVenta(disponibles);
        }
      } catch (e) {
        console.error("Error al cargar productos:", e);
      }

      // 8. Cargar Cuentas y CxP desde localStorage (o Supabase si existe)
      try {
        const savedCuentas = localStorage.getItem("ts_cuentas_bancarias");
        if (savedCuentas) setCuentasBancarias(JSON.parse(savedCuentas));

        const savedCxP = localStorage.getItem("ts_cuentas_por_pagar");
        if (savedCxP) setCuentasPorPagar(JSON.parse(savedCxP));
      } catch {}

      // 9. Fetch Todas las Tasas desde API
      try {
        const res = await fetch("/api/tasas");
        if (res.ok) {
          const data = await res.json();
          setTasas(data);
        }
      } catch (error) {
        console.error("Tasas Fetch Error", error);
      }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setConfigSuccess(false);

    await supabase.from("configuracion").upsert([
      { clave: "descuento_tecnico", valor: descTecnico },
      { clave: "dias_validez_cotizacion", valor: diasValidez },
      { clave: "meta_mensual_usd", valor: metaMensualUSD },
    ]);

    setConfigSuccess(true);
    setTimeout(() => setConfigSuccess(false), 3000);
    setSavingConfig(false);
  };

  // ── CÁLCULO DE TASAS EN TIEMPO REAL ──
  const bcvValor = useMemo(() => {
    if (!tasas?.bcv?.promedio) return 65.80;
    return typeof tasas.bcv.promedio === "number" ? tasas.bcv.promedio : Number(tasas.bcv.promedio) || 65.80;
  }, [tasas]);

  // ── MÉTRICAS EJECUTIVAS & FINANCIERAS ──
  const stats = useMemo(() => {
    const validezMs = parseInt(diasValidez || "15") * 24 * 60 * 60 * 1000;
    const ahora = Date.now();
    const hoy = new Date();
    const mesActualNum = hoy.getMonth();
    const anioActualNum = hoy.getFullYear();

    let ingresoRealUsd = 0;
    let ingresoRealBs = 0;
    let facturadoMesUSD = 0;
    let facturadoMesBs = 0;
    let ingresoProyectado = 0;
    let aprobadasNoFacturadas = 0;

    // Facturas
    facturas.forEach(f => {
      const subUsd = Number(f.subtotal_usd || 0);
      const totBs = Number(f.total_bs || 0);
      ingresoRealUsd += subUsd;
      ingresoRealBs += totBs;

      const fDate = new Date(f.created_at);
      if (fDate.getMonth() === mesActualNum && fDate.getFullYear() === anioActualNum) {
        facturadoMesUSD += subUsd;
        facturadoMesBs += totBs;
      }
    });

    // Cotizaciones
    cotizaciones.forEach(c => {
      const d = new Date(c.created_at).getTime();
      const monto = Number(c.total || 0);
      const isVigente = (ahora - d) <= validezMs;

      if (c.estado === "aprobada") {
        aprobadasNoFacturadas += monto;
        if (isVigente) ingresoProyectado += monto;
      } else if (c.estado !== "rechazada" && c.estado !== "facturada" && isVigente) {
        ingresoProyectado += monto;
      }
    });

    return {
      ingresoRealUsd,
      ingresoRealBs,
      facturadoMesUSD,
      facturadoMesBs: facturadoMesBs || (facturadoMesUSD * bcvValor),
      ingresoProyectado,
      aprobadasNoFacturadas,
    };
  }, [facturas, cotizaciones, diasValidez, bcvValor]);

  // ── EMBUDO COMERCIAL (PIPELINE) ──
  const funnel = useMemo(() => {
    let borradores = 0, borradoresUSD = 0;
    let enviadas = 0, enviadasUSD = 0;
    let aprobadas = 0, aprobadasUSD = 0;
    let facturadas = 0, facturadasUSD = 0;
    let rechazadas = 0, rechazadasUSD = 0;

    cotizaciones.forEach(c => {
      const m = Number(c.total || 0);
      const est = c.estado || "borrador";
      if (est === "borrador") { borradores++; borradoresUSD += m; }
      else if (est === "enviada") { enviadas++; enviadasUSD += m; }
      else if (est === "aprobada") { aprobadas++; aprobadasUSD += m; }
      else if (est === "facturada") { facturadas++; facturadasUSD += m; }
      else if (est === "rechazada") { rechazadas++; rechazadasUSD += m; }
    });

    const totalActivas = borradores + enviadas + aprobadas + facturadas;
    const tasaAprobacion = totalActivas > 0 ? Math.round(((aprobadas + facturadas) / totalActivas) * 100) : 0;

    return {
      borradores, borradoresUSD,
      enviadas, enviadasUSD,
      aprobadas, aprobadasUSD,
      facturadas, facturadasUSD,
      rechazadas, rechazadasUSD,
      totalActivas,
      tasaAprobacion,
    };
  }, [cotizaciones]);

  // ── TICKET PROMEDIO ──
  const ticketPromedio = useMemo(() => {
    if (!facturas.length) return 0;
    const totalUsd = facturas.reduce((s, f) => s + Number(f.subtotal_usd || 0), 0);
    return totalUsd / facturas.length;
  }, [facturas]);

  // ── RECORDATORIOS DE SEGUIMIENTO (5 y 15 Días) ──
  const recordatorios = useMemo(() => {
    const ahora = Date.now();
    const diaMs = 24 * 60 * 60 * 1000;
    const seguimientos: any[] = [];

    cotizaciones.forEach(c => {
      if (c.estado === "enviada") {
        const diasTranscurridos = Math.floor((ahora - new Date(c.created_at).getTime()) / diaMs);
        if (diasTranscurridos === 5) {
          seguimientos.push({ ...c, tipo: "seguimiento_5d", mensaje: "Llamar para confirmar recepción" });
        } else if (diasTranscurridos >= 15) {
          seguimientos.push({ ...c, tipo: "seguimiento_15d", mensaje: "Cotización próxima a vencer" });
        }
      }
    });
    return seguimientos;
  }, [cotizaciones]);

  // ── SUSCRIPCIONES (MRR & Próximos Pagos) ──
  const { mrr, pagosProximos } = useMemo(() => {
    let mrrTotal = 0;
    const ahora = new Date();
    const prox7Dias = new Date();
    prox7Dias.setDate(ahora.getDate() + 7);

    const pendientes: any[] = [];

    suscripciones.forEach((s) => {
      const monto = Number(s.monto || 0);
      switch (s.ciclo_facturacion) {
        case "Mensual": mrrTotal += monto; break;
        case "Bimestral": mrrTotal += monto / 2; break;
        case "Trimestral": mrrTotal += monto / 3; break;
        case "Semestral": mrrTotal += monto / 6; break;
        case "Anual": mrrTotal += monto / 12; break;
        default: mrrTotal += monto;
      }

      if (monto > 0 && s.proximo_pago) {
        const fechaPago = new Date(s.proximo_pago);
        if (fechaPago <= prox7Dias) {
          pendientes.push({
            ...s,
            vencido: fechaPago < ahora,
            diasFaltantes: Math.ceil((fechaPago.getTime() - ahora.getTime()) / (1000 * 3600 * 24))
          });
        }
      }
    });

    pendientes.sort((a, b) => new Date(a.proximo_pago).getTime() - new Date(b.proximo_pago).getTime());

    return { mrr: mrrTotal, pagosProximos: pendientes };
  }, [suscripciones]);

  // ── TESORERÍA / CAJAS & CUENTAS ──
  const { liquidezTotalUSD, liquidezTotalVES, totalCxPUSD } = useMemo(() => {
    let totalUSD = 0;
    cuentasBancarias.forEach((c) => {
      const saldo = Number(c.saldo || 0);
      if (c.moneda === "USD") totalUSD += saldo;
      else totalUSD += (saldo / (bcvValor || 65.80));
    });

    let totalCxP = 0;
    cuentasPorPagar.forEach((p) => {
      if (p.estado !== "pagado") {
        totalCxP += (Number(p.montoUSD || 0) - Number(p.montoAbonadoUSD || 0));
      }
    });

    return {
      liquidezTotalUSD: totalUSD,
      liquidezTotalVES: totalUSD * (bcvValor || 65.80),
      totalCxPUSD: totalCxP,
    };
  }, [cuentasBancarias, cuentasPorPagar, bcvValor]);

  // ── GRÁFICA: Flujo de Cotizaciones vs Facturación ──
  const chartData = useMemo(() => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const hoy = new Date();
    const result: { mesKey: string; nombre: string; Aprobado: number; Pendiente: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      result.push({
        mesKey: `${d.getFullYear()}-${d.getMonth()}`,
        nombre: meses[d.getMonth()],
        Aprobado: 0,
        Pendiente: 0,
      });
    }

    cotizaciones.forEach((c) => {
      const d = new Date(c.created_at);
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      const slot = result.find((r) => r.mesKey === mKey);
      if (slot) {
        const monto = Number(c.total || 0);
        if (c.estado === "aprobada") slot.Aprobado += monto;
        else if (c.estado !== "rechazada" && c.estado !== "facturada") slot.Pendiente += monto;
      }
    });

    facturas.forEach((f) => {
      const d = new Date(f.created_at);
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      const slot = result.find((r) => r.mesKey === mKey);
      if (slot) slot.Aprobado += Number(f.subtotal_usd || 0);
    });

    return result;
  }, [cotizaciones, facturas]);

  // ── FILTRO DE ÓRDENES TÉCNICAS ASIGNADAS AL USUARIO ACTIVO ──
  const ordenesUsuarioTecnico = useMemo(() => {
    if (esSuperAdmin || esGerente) return ordenesTrabajo;
    if (!usuario?.id) return [];
    return ordenesTrabajo.filter(ot => 
      ot.tecnico_lider_id === usuario.id || 
      (Array.isArray(ot.ayudantes) && ot.ayudantes.includes(usuario.id)) ||
      ot.creado_por === usuario.id
    );
  }, [ordenesTrabajo, usuario, esSuperAdmin, esGerente]);

  // ── FILTRO DE PROYECTOS PROPIOS DEL TÉCNICO ALIADO ──
  const cotizacionesAliado = useMemo(() => {
    if (!esTecnicoAliado) return [];
    if (!usuario?.id) return [];
    return cotizaciones.filter(c => c.creado_por === usuario.id || c.usuario_id === usuario.id);
  }, [cotizaciones, usuario, esTecnicoAliado]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-9 h-9 border-3 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[var(--ts-text-muted)]">Cargando Centro de Mando...</p>
      </div>
    );
  }

  // ── RENDERIZADO DEL ENCABEZADO SUPERIOR COMÚN & PERSONALIZADOR ─────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">

      {/* ── HEADER PERSONALIZADO SEGÚN ROL ACTIVO ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 ts-surface ts-radius border ts-border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black shrink-0 shadow-sm"
            style={{ backgroundColor: usuario?.roles?.color || "var(--ts-red)" }}
          >
            {usuario?.avatar_url ? (
              <img src={usuario.avatar_url} alt={usuario.nombre} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : "TS"}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black ts-text tracking-tight">
                ¡Hola, {usuario?.nombre || "Colaborador"}!
              </h1>
              <span
                className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border"
                style={{
                  backgroundColor: `${usuario?.roles?.color || "var(--ts-red)"}20`,
                  color: usuario?.roles?.color || "var(--ts-red)",
                  borderColor: `${usuario?.roles?.color || "var(--ts-red)"}40`,
                }}
              >
                {usuario?.roles?.nombre || "Personal TecnoSmart"}
              </span>
            </div>
            <p className="text-xs ts-text-muted mt-0.5">
              {esTecnicoAliado
                ? "Portal Técnico Aliado VIP B2B: Catálogo mayorista (-15%), calculadoras CCTV y control de obras."
                : esTecnico
                ? "Centro de Operaciones de Campo: Misiones asignadas, Actas de Entrega y solicitud de materiales."
                : esVendedor
                ? "Panel Comercial de Ventas: Embudo de cotizaciones, seguimientos activos y catálogo para cotizar."
                : esAdminFinanzas
                ? "Tesorería & Finanzas: Cajas, conciliación de pagos, facturación fiscal y cobros MRR."
                : "Centro de Mando Ejecutivo: Visión 360° de ventas, cuadrillas en campo, stock y finanzas."}
            </p>
          </div>
        </div>

        {/* Botón Personalizar Dashboard */}
        <div className="relative">
          <button
            onClick={() => setPanelPersonalizarOpen(!panelPersonalizarOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border ts-border ts-surface hover:bg-[var(--ts-surface-2)] ts-text text-xs font-bold transition-all shadow-xs"
          >
            <Sliders className="w-4 h-4 text-[var(--ts-red)]" />
            <span>Personalizar Widgets</span>
          </button>

          {panelPersonalizarOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 ts-surface border ts-border rounded-2xl p-4 shadow-2xl z-40 space-y-3">
              <div className="flex items-center justify-between border-b ts-border pb-2">
                <span className="text-xs font-black uppercase tracking-wider ts-text">Configurar Vista</span>
                <span className="text-[10px] ts-text-muted">Widgets autorizados</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
                {[
                  { key: "ingresoCerrado", label: "Facturación Real ($/Bs)", permitido: puedeVerFinanzas },
                  { key: "proyectado", label: "Ingreso Proyectado", permitido: puedeVerFinanzas },
                  { key: "mrr", label: "MRR Recurrente", permitido: puedeVerMRR },
                  { key: "tasas", label: "Tasas de Referencia BCV/Paralelo", permitido: puedeVerTasas },
                  { key: "ticketPromedio", label: "Ticket Promedio", permitido: puedeVerFinanzas || esVendedor },
                  { key: "productosTop", label: "Productos / Stock disponible", permitido: true },
                  { key: "alertaStock", label: "Alerta de Stock Crítico", permitido: esSuperAdmin || esGerente || esAdminFinanzas },
                  { key: "embudoVentas", label: "Embudo de Ventas (Pipeline)", permitido: esSuperAdmin || esGerente || esVendedor },
                  { key: "misionesTecnicas", label: "Misiones Técnicas & Cuadrillas", permitido: true },
                  { key: "grafica", label: "Gráfica de Rendimiento", permitido: puedeVerFinanzas },
                  { key: "seguimiento", label: "Alertas de Seguimiento WhatsApp", permitido: esVendedor || esSuperAdmin || esGerente },
                  { key: "proximosPagos", label: "Próximos Pagos Suscripciones", permitido: puedeVerMRR },
                ]
                  .filter((w) => w.permitido)
                  .map((w) => (
                    <label
                      key={w.key}
                      className="flex items-center justify-between text-xs cursor-pointer p-1.5 hover:bg-[var(--ts-surface-2)] rounded-lg transition-colors"
                    >
                      <span className="ts-text font-medium">{w.label}</span>
                      <input
                        type="checkbox"
                        checked={widgetsVisibles[w.key] ?? true}
                        onChange={() => toggleWidget(w.key)}
                        className="accent-[var(--ts-red)] cursor-pointer"
                      />
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          VISTA 1: SUPER ADMIN & GERENCIA (VISIÓN 360° EJECUTIVA)
      ══════════════════════════════════════════════════════════════ */}
      {(esSuperAdmin || esGerente) && (
        <div className="space-y-6">

          {/* Onboarding Checklist Ejecutivo Estilo ERPNext */}
          <OnboardingChecklistCard
            storageKey="admin_executive"
            title="Puesta en Marcha & Control Ejecutivo"
            steps={[
              {
                id: "tasas_bcv",
                label: "Monitorear Tasas Oficiales",
                desc: "Verifica que la tasa BCV y Paralelo se actualicen en tiempo real para cotizaciones.",
                actionLabel: "Ver Tasas",
                actionHref: "#tasas-card",
              },
              {
                id: "cuadrillas_activas",
                label: "Supervisar Cuadrillas en Campo",
                desc: "Asigna líderes técnicos y ayudantes a las órdenes de instalación del día.",
                actionLabel: "Abrir Cuadrillas",
                actionHref: "/cuadrillas",
              },
              {
                id: "stock_critico",
                label: "Revisar Stock Crítico",
                desc: "Atiende los productos con menos de 3 unidades para evitar rupturas de stock.",
                actionLabel: "Ver Almacén",
                actionHref: "/inventario",
              },
            ]}
          />

          {/* KPI Cards Ejecutivos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Facturado Mes USD & Bs */}
            <div className="ts-surface ts-radius p-5 border ts-border flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <div>
                <div className="flex items-center gap-2 ts-text-muted mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Facturado Mes en Curso</span>
                </div>
                <p className="text-3xl font-black ts-text tracking-tight">
                  {formatUSD(stats.facturadoMesUSD)}
                </p>
                <p className="text-xs font-bold text-emerald-500 mt-1.5 flex items-center gap-1">
                  <span>Bs. {stats.facturadoMesBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-[10px] text-[var(--ts-text-muted)] font-normal">(@BCV)</span>
                </p>
              </div>
              <p className="text-[10px] ts-text-muted mt-3">
                Mes de {new Date().toLocaleString("es-ES", { month: "long" })}
              </p>
            </div>

            {/* Meta Mensual USD */}
            <div className="ts-surface ts-radius p-5 border ts-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between ts-text-muted mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Meta Mensual</span>
                  </div>
                  <span className="text-xs font-black text-amber-500">
                    {Math.min(100, Math.round((stats.facturadoMesUSD / (Number(metaMensualUSD) || 10000)) * 100))}%
                  </span>
                </div>
                <p className="text-3xl font-black ts-text tracking-tight">
                  {formatUSD(Number(metaMensualUSD) || 10000)}
                </p>
                <div className="w-full h-2 bg-[var(--ts-surface-2)] rounded-full overflow-hidden border border-[var(--ts-border)] mt-2">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (stats.facturadoMesUSD / (Number(metaMensualUSD) || 10000)) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] ts-text-muted mt-3">
                Faltan {formatUSD(Math.max(0, (Number(metaMensualUSD) || 10000) - stats.facturadoMesUSD))} para el objetivo
              </p>
            </div>

            {/* Proyectado en Cotizaciones Vigentes */}
            <div className="ts-surface ts-radius p-5 border ts-border flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 ts-text-muted mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Ingreso Proyectado</span>
                </div>
                <p className="text-3xl font-black ts-text tracking-tight">
                  {formatUSD(stats.ingresoProyectado)}
                </p>
                <p className="text-xs ts-text-muted mt-1.5">
                  Cotizaciones vigentes ({diasValidez} días)
                </p>
              </div>
              <p className="text-[10px] ts-text-muted mt-3">
                {cotizaciones.filter(c => c.estado === "enviada" || c.estado === "aprobada").length} cotizaciones activas
              </p>
            </div>

            {/* MRR Recurrente Mensual */}
            <div className="ts-surface ts-radius p-5 border ts-border flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 ts-text-muted mb-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">MRR Suscripciones</span>
                </div>
                <p className="text-3xl font-black text-purple-400 tracking-tight">
                  {formatUSD(mrr)}
                </p>
                <p className="text-xs ts-text-muted mt-1.5">
                  {suscripciones.length} contratos activos
                </p>
              </div>
              <Link href="/suscripciones" className="text-[10px] text-purple-400 hover:underline font-bold mt-3 block">
                Ver Bóveda de Suscripciones →
              </Link>
            </div>

          </div>

          {/* Grid Principal: Gráfica + Obras en Campo + Tasas & Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Columna Izquierda (2 cols): Gráfica & Obras Hoy */}
            <div className="lg:col-span-2 space-y-6">

              {/* Gráfica de Rendimiento Últimos 6 Meses */}
              {widgetsVisibles.grafica && (
                <div className="ts-surface ts-radius p-5 border ts-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-black uppercase tracking-wider ts-text">
                      Flujo de Cotizaciones vs Facturación (Últimos 6 Meses)
                    </h2>
                    <span className="text-[10px] ts-text-muted">En USD ($)</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ts-border)" />
                        <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--ts-text-secondary)' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--ts-text-secondary)' }} tickFormatter={(val) => `$${val/1000}k`} />
                        <Tooltip
                          cursor={{ fill: 'var(--ts-border)', opacity: 0.3 }}
                          contentStyle={{ backgroundColor: 'var(--ts-surface)', borderColor: 'var(--ts-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--ts-text-primary)' }}
                          formatter={(val: any) => [formatUSD(Number(val)), ""]}
                        />
                        <Bar dataKey="Aprobado" stackId="a" fill="var(--ts-red)" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Pendiente" stackId="a" fill="var(--ts-border)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 mt-3 justify-center">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--ts-red)]" /><span className="text-[11px] ts-text-muted">Aprobado / Facturado</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--ts-border)]" /><span className="text-[11px] ts-text-muted">Pendiente</span></div>
                  </div>
                </div>
              )}

              {/* Obras y Cuadrillas en Campo Hoy */}
              <div className="ts-surface ts-radius p-5 border ts-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-amber-500" />
                    <h2 className="text-xs font-black uppercase tracking-wider ts-text">Cuadrillas & Obras en Campo</h2>
                  </div>
                  <Link href="/cuadrillas" className="text-xs font-bold text-[var(--ts-red)] hover:underline flex items-center gap-1">
                    <span>Gestionar Cuadrillas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {ordenesTrabajo.length === 0 ? (
                  <EmptyStateCard
                    icon={HardHat}
                    title="Ninguna Orden de Trabajo en Campo Hoy"
                    description="No hay cuadrillas asignadas en este momento. Puedes crear una orden o asignar cuadrilla técnica."
                    actionLabel="+ Asignar Cuadrilla"
                    actionHref="/cuadrillas"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ordenesTrabajo.slice(0, 4).map((ot) => (
                      <div key={ot.id} className="p-3.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] flex flex-col justify-between gap-2 hover:border-[var(--ts-red)]/30 transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20">
                              {ot.numero_orden || "OT-CAMPO"}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--ts-text-muted)]">
                              {ot.estado || "Asignada"}
                            </span>
                          </div>
                          <p className="text-xs font-bold ts-text truncate">
                            {ot.titulo || "Instalación de Sistema CCTV & Fibra"}
                          </p>
                          <p className="text-[11px] text-[var(--ts-text-muted)] truncate mt-0.5">
                            Cliente: {ot.cliente_obj?.empresa || ot.cliente_obj?.contacto || "TecnoSmart Directo"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--ts-border)] text-[10px] ts-text-muted">
                          <span>Líder: <strong className="text-amber-500">{ot.tecnico_lider_nombre}</strong></span>
                          <Link href="/cuadrillas" className="text-[var(--ts-red)] font-bold hover:underline">
                            Ver detalles →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Embudo de Conversión Comercial (Pipeline) */}
              <div className="ts-surface ts-radius p-5 border ts-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <h2 className="text-xs font-black uppercase tracking-wider ts-text">Embudo de Conversión de Cotizaciones</h2>
                  </div>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    Tasa de Cierre: {funnel.tasaAprobacion}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-center">
                    <p className="text-[10px] font-bold ts-text-muted uppercase">Borradores</p>
                    <p className="text-xl font-black ts-text mt-1">{funnel.borradores}</p>
                    <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">{formatUSD(funnel.borradoresUSD)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Enviadas</p>
                    <p className="text-xl font-black text-blue-400 mt-1">{funnel.enviadas}</p>
                    <p className="text-[10px] text-blue-300 mt-0.5">{formatUSD(funnel.enviadasUSD)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-[10px] font-bold text-amber-400 uppercase">Aprobadas</p>
                    <p className="text-xl font-black text-amber-400 mt-1">{funnel.aprobadas}</p>
                    <p className="text-[10px] text-amber-300 mt-0.5">{formatUSD(funnel.aprobadasUSD)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Facturadas</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{funnel.facturadas}</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">{formatUSD(funnel.facturadasUSD)}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Columna Derecha (1 col): Tasas, Stock Crítico & Próximos Pagos */}
            <div className="space-y-6">

              {/* Tasas en Vivo */}
              <div id="tasas-card" className="bg-[#18181c] rounded-2xl border border-white/5 p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-gray-200">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider">Tasas en Vivo</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En línea
                  </span>
                </div>

                {tasas ? (
                  <div className="space-y-2.5">
                    <div className="bg-[#222228] rounded-xl p-3 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-6 rounded bg-[#2e2e36] flex items-center justify-center text-[9px] font-black text-amber-400">BCV</div>
                        <span className="text-xs font-bold text-gray-200">Dólar BCV</span>
                      </div>
                      <span className="text-sm font-black text-white">Bs. {tasas.bcv?.promedio?.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="bg-[#222228] rounded-xl p-3 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-6 rounded bg-[#2e2e36] flex items-center justify-center text-[9px] font-black text-blue-400">EUR</div>
                        <span className="text-xs font-bold text-gray-200">Euro Oficial</span>
                      </div>
                      <span className="text-sm font-black text-white">Bs. {tasas.euro?.promedio?.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="bg-[#222228] rounded-xl p-3 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-6 rounded bg-[#2e2e36] flex items-center justify-center text-[9px] font-black text-emerald-400">PAR</div>
                        <span className="text-xs font-bold text-gray-200">Paralelo</span>
                      </div>
                      <span className="text-sm font-black text-white">Bs. {tasas.paralelo?.promedio?.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 animate-pulse py-4 text-center">Consultando tasas oficiales...</p>
                )}
              </div>

              {/* Alerta de Stock Crítico */}
              <div className="ts-surface ts-radius p-5 border ts-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <h2 className="text-xs font-black uppercase tracking-wider ts-text">Stock Crítico (≤ 3 uds)</h2>
                  </div>
                  <Link href="/inventario" className="text-xs font-bold text-[var(--ts-red)] hover:underline">
                    Ver Almacén →
                  </Link>
                </div>

                {productosCriticos.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--ts-text-muted)] flex flex-col items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                    <span>Inventario saludable. Ningún producto en stock crítico.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productosCriticos.slice(0, 4).map((p) => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold ts-text truncate">{p.nombre}</p>
                          <p className="text-[10px] text-[var(--ts-text-muted)]">SKU: {p.codigo_sku || "N/A"}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-xs font-black shrink-0">
                          {p.stock} ud{p.stock === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Próximos Pagos Suscripciones */}
              {pagosProximos.length > 0 && (
                <div className="ts-surface ts-radius p-5 border ts-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <h2 className="text-xs font-black uppercase tracking-wider ts-text">Cobros Próximos (7 Días)</h2>
                    </div>
                    <Link href="/suscripciones" className="text-xs font-bold text-[var(--ts-red)] hover:underline">
                      Bóveda →
                    </Link>
                  </div>
                  <div className="space-y-2.5">
                    {pagosProximos.slice(0, 3).map((p) => (
                      <div key={p.id} className="p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold ts-text truncate">{p.clientes?.empresa || p.clientes?.contacto || "Cliente"}</p>
                          <p className="text-[10px] text-[var(--ts-text-muted)]">{p.servicios_recurrentes?.nombre || "Servicio"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-400">${Number(p.monto || 0).toFixed(2)}</span>
                          <p className="text-[9px] text-[var(--ts-text-muted)]">{p.diasFaltantes <= 0 ? "Vence hoy" : `en ${p.diasFaltantes}d`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Configuración Global (Días Validez, Descuento Técnico, Meta) */}
          {puedeConfigurar && (
            <div className="ts-surface ts-radius p-5 border ts-border">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-[var(--ts-red)]" />
                <h2 className="text-xs font-black uppercase tracking-wider ts-text">Parámetros Globales del Sistema</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold ts-text-muted mb-1">Descuento Técnico Mayorista (%)</label>
                  <input
                    type="number"
                    value={descTecnico}
                    onChange={e => setDescTecnico(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border ts-border rounded-xl text-xs font-bold ts-text focus:outline-none focus:border-[var(--ts-red)]"
                  />
                  <p className="text-[10px] ts-text-muted mt-1">Aplica automático a clientes catalogados como técnicos.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold ts-text-muted mb-1">Validez de Cotización (Días)</label>
                  <input
                    type="number"
                    value={diasValidez}
                    onChange={e => setDiasValidez(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border ts-border rounded-xl text-xs font-bold ts-text focus:outline-none focus:border-[var(--ts-red)]"
                  />
                  <p className="text-[10px] ts-text-muted mt-1">Días antes de que el presupuesto expire.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold ts-text-muted mb-1">Meta Mensual de Facturación ($ USD)</label>
                  <input
                    type="number"
                    value={metaMensualUSD}
                    onChange={e => setMetaMensualUSD(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--ts-surface-2)] border ts-border rounded-xl text-xs font-bold ts-text focus:outline-none focus:border-[var(--ts-red)]"
                  />
                  <p className="text-[10px] ts-text-muted mt-1">Objetivo comercial proyectado para el mes.</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="flex items-center gap-2 bg-[var(--ts-text-primary)] hover:opacity-85 text-[var(--ts-bg)] text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingConfig ? "Guardando..." : "Guardar Parámetros"}</span>
                </button>
                {configSuccess && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ¡Parámetros guardados con éxito!
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VISTA 2: ASESOR COMERCIAL & VENTAS (PIPELINE & SEGUIMIENTO)
      ══════════════════════════════════════════════════════════════ */}
      {esVendedor && (
        <div className="space-y-6">

          {/* Onboarding Comercial Estilo ERPNext */}
          <OnboardingChecklistCard
            storageKey="vendedor_pipeline"
            title="Plan de Acción Comercial & Cierre de Ventas"
            steps={[
              {
                id: "nueva_cotizacion",
                label: "Crear Nueva Cotización Multidivisa",
                desc: "Emite un presupuesto formal con desglose en USD y Bolívares al BCV oficial.",
                actionLabel: "+ Nueva Cotización",
                actionHref: "/nueva",
              },
              {
                id: "seguimiento_5d",
                label: "Llamar a Cotizaciones de 5 Días",
                desc: "Realiza seguimiento directo vía WhatsApp a los clientes con propuestas enviadas.",
                actionLabel: "Ver Seguimientos",
                actionHref: "#seguimientos-comerciales",
              },
              {
                id: "cartera_clientes",
                label: "Gestionar Directorio de Clientes",
                desc: "Revisa contactos, números de WhatsApp y RIF de tus clientes frecuentes.",
                actionLabel: "Abrir Clientes",
                actionHref: "/clientes",
              },
            ]}
          />

          {/* KPIs del Asesor Comercial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Total Cotizado Activo</p>
              <p className="text-2xl font-black ts-text mt-1">{formatUSD(stats.ingresoProyectado)}</p>
              <p className="text-xs text-blue-400 font-bold mt-1.5">{funnel.enviadas + funnel.aprobadas} propuestas vigentes</p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Pendientes de Aprobación</p>
              <p className="text-2xl font-black text-amber-500 mt-1">{formatUSD(funnel.enviadasUSD)}</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1.5">{funnel.enviadas} cotizaciones enviadas</p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Ventas Cerradas / Facturadas</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{formatUSD(funnel.facturadasUSD)}</p>
              <p className="text-xs text-emerald-500 font-bold mt-1.5">{funnel.facturadas} presupuestos facturados</p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Ticket Promedio</p>
              <p className="text-2xl font-black ts-text mt-1">{formatUSD(ticketPromedio)}</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1.5">Promedio por venta cerrada</p>
            </div>

          </div>

          {/* Embudo de Cotizaciones */}
          <div className="ts-surface ts-radius p-5 border ts-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-wider ts-text">Mi Embudo Comercial</h2>
              <Link href="/nueva" className="inline-flex items-center gap-1.5 text-xs font-bold bg-[var(--ts-red)] text-white px-3.5 py-1.5 rounded-xl hover:brightness-110 shadow-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Cotización</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-center">
                <span className="text-[10px] font-bold ts-text-muted uppercase">Borradores</span>
                <p className="text-xl font-black ts-text mt-1">{funnel.borradores}</p>
                <p className="text-[10px] ts-text-muted mt-0.5">{formatUSD(funnel.borradoresUSD)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase">Enviadas al Cliente</span>
                <p className="text-xl font-black text-blue-400 mt-1">{funnel.enviadas}</p>
                <p className="text-[10px] text-blue-300 mt-0.5">{formatUSD(funnel.enviadasUSD)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Aprobadas</span>
                <p className="text-xl font-black text-amber-400 mt-1">{funnel.aprobadas}</p>
                <p className="text-[10px] text-amber-300 mt-0.5">{formatUSD(funnel.aprobadasUSD)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Facturadas</span>
                <p className="text-xl font-black text-emerald-400 mt-1">{funnel.facturadas}</p>
                <p className="text-[10px] text-emerald-300 mt-0.5">{formatUSD(funnel.facturadasUSD)}</p>
              </div>
            </div>
          </div>

          {/* Grid: Seguimientos con WhatsApp & Productos con Mayor Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Panel de Seguimiento Hoy */}
            <div id="seguimientos-comerciales" className="lg:col-span-2 ts-surface ts-radius p-5 border ts-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider ts-text">
                    Seguimientos de Cotización Hoy (5 y 15 Días)
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-[var(--ts-text-muted)]">
                  {recordatorios.length} pendientes
                </span>
              </div>

              {recordatorios.length === 0 ? (
                <EmptyStateCard
                  icon={CheckCircle}
                  title="Todo al Día en Seguimientos Comerciales"
                  description="No tienes cotizaciones enviadas pendientes de seguimiento a los 5 o 15 días. Excelente ritmo."
                  actionLabel="+ Nueva Cotización"
                  actionHref="/nueva"
                />
              ) : (
                <div className="space-y-3">
                  {recordatorios.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] border-l-4 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-amber-500 uppercase">{r.mensaje}</span>
                          <span className="text-[10px] font-bold ts-text-muted">({r.numero_cotizacion})</span>
                        </div>
                        <p className="text-xs font-bold ts-text">
                          {r.clientes?.empresa || r.clientes?.contacto || "Cliente Comercial"}
                        </p>
                        <p className="text-[11px] text-[var(--ts-text-muted)] mt-0.5">
                          Total: <strong className="text-emerald-500 font-black">{formatUSD(r.total)}</strong> — Emitida el {formatFecha(r.created_at)}
                        </p>
                      </div>

                      {r.clientes?.telefono ? (
                        <a
                          href={`https://wa.me/${r.clientes.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hola ${r.clientes.contacto || r.clientes.empresa}, te escribimos de TecnoSmart referente a la cotización ${r.numero_cotizacion}. ¿Pudiste revisarla? Quedamos a tu orden para coordinar la instalación.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] dark:text-[#25D366] text-xs font-bold transition-all border border-[#25D366]/30 self-start sm:self-center shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Contactar vía WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-[var(--ts-text-muted)] italic">Sin teléfono registrado</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Columna Derecha: Tasas BCV & Productos con Mayor Stock para Ofrecer */}
            <div className="space-y-6">

              {/* Tasas BCV para Cotizar en Vivo */}
              <div className="bg-[#18181c] rounded-2xl border border-white/5 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-200">Tasa Oficial de Cotización</span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">Oficial BCV</span>
                </div>
                <p className="text-2xl font-black text-white">
                  Bs. {bcvValor.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Multiplica tus precios en USD por esta tasa para facturación formal.</p>
              </div>

              {/* Productos en Almacén Disponibles para Vender */}
              <div className="ts-surface ts-radius p-5 border ts-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-xs font-black uppercase tracking-wider ts-text">Disponibles para Venta</h2>
                  </div>
                  <Link href="/inventario" className="text-xs font-bold text-[var(--ts-red)] hover:underline">
                    Catálogo →
                  </Link>
                </div>

                <div className="space-y-2">
                  {productosTopVenta.slice(0, 4).map((p) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold ts-text truncate">{p.nombre}</p>
                        <p className="text-[10px] text-[var(--ts-text-muted)]">PVP: {formatUSD(p.precio_venta)}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-400 shrink-0">
                        {p.stock} en stock
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VISTA 3: ADMINISTRACIÓN & FINANZAS (TESORERÍA, BANCOS & CXC)
      ══════════════════════════════════════════════════════════════ */}
      {esAdminFinanzas && (
        <div className="space-y-6">

          {/* Onboarding Tesorería Estilo ERPNext */}
          <OnboardingChecklistCard
            storageKey="finanzas_contabilidad"
            title="Prepara tu Tesorería, Cajas & Conciliación"
            steps={[
              {
                id: "cajas_bancos",
                label: "Revisar Saldos de Cajas y Cuentas",
                desc: "Verifica los fondos en Zelle, Pago Móvil Banesco/Mercantil, Efectivo USD y Binance.",
                actionLabel: "Abrir Cuentas",
                actionHref: "/finanzas?tab=cuentas",
              },
              {
                id: "facturar_pendientes",
                label: "Emitir Facturación Fiscal",
                desc: "Convierte cotizaciones aprobadas por clientes en facturas formales o notas de entrega.",
                actionLabel: "Facturar",
                actionHref: "/facturacion",
              },
              {
                id: "suscripciones_cobradas",
                label: "Cobranzas Recurrentes Starlink & CCTV",
                desc: "Revisa las suscripciones con pagos programados en los próximos 7 días.",
                actionLabel: "Ver Bóveda",
                actionHref: "/suscripciones",
              },
            ]}
          />

          {/* KPIs Financieros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Liquidez Consolidada en Cajas</p>
              <p className="text-2xl font-black ts-text mt-1">{formatUSD(liquidezTotalUSD)}</p>
              <p className="text-xs font-bold text-emerald-500 mt-1.5">
                Bs. {liquidezTotalVES.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Facturado Mes Activo</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{formatUSD(stats.facturadoMesUSD)}</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1.5">{facturas.length} facturas registradas</p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Cuentas por Pagar (CxP)</p>
              <p className="text-2xl font-black text-rose-400 mt-1">{formatUSD(totalCxPUSD)}</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1.5">Proveedores y obligaciones</p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">MRR Recurrente Mensual</p>
              <p className="text-2xl font-black text-purple-400 mt-1">{formatUSD(mrr)}</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1.5">{suscripciones.length} suscripciones</p>
            </div>

          </div>

          {/* Grid de Cuentas Bancarias & Próximos Cobros de Suscripciones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Cuentas Bancarias & Cajas */}
            <div className="lg:col-span-2 ts-surface ts-radius p-5 border ts-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider ts-text">Cajas & Cuentas de Tesorería</h2>
                </div>
                <Link href="/finanzas?tab=cuentas" className="text-xs font-bold text-[var(--ts-red)] hover:underline">
                  Administrar Cajas →
                </Link>
              </div>

              {cuentasBancarias.length === 0 ? (
                <EmptyStateCard
                  icon={CreditCard}
                  title="Sin Cuentas Bancarias Configuradas"
                  description="Añade tus cuentas en Zelle, Pago Móvil Banesco/Mercantil, Efectivo y Binance para registrar saldos y conciliar."
                  actionLabel="+ Añadir Cuenta Bancaria"
                  actionHref="/finanzas?tab=cuentas"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cuentasBancarias.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[var(--ts-surface)] border border-[var(--ts-border)] ts-text-muted">
                          {c.tipo}
                        </span>
                        <p className="text-xs font-bold ts-text mt-1">{c.nombre}</p>
                        <p className="text-[10px] text-[var(--ts-text-muted)]">{c.titular || "TecnoSmart"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black ts-text">
                          {c.moneda === "USD" ? formatUSD(c.saldo) : `Bs. ${Number(c.saldo || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasas & Próximas Cobranzas con WhatsApp */}
            <div className="space-y-6">

              {/* Tasas Oficiales */}
              <div className="bg-[#18181c] rounded-2xl border border-white/5 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-200">Tasas de Conciliación</span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">En Vivo</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-300">
                    <span>BCV Oficial:</span>
                    <strong className="text-white">Bs. {bcvValor.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-300">
                    <span>Paralelo:</span>
                    <strong className="text-white">Bs. {tasas?.paralelo?.promedio ? Number(tasas.paralelo.promedio).toFixed(2) : "N/D"}</strong>
                  </div>
                </div>
              </div>

              {/* Cobros Próximos de Suscripciones */}
              <div className="ts-surface ts-radius p-5 border ts-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-xs font-black uppercase tracking-wider ts-text">Cobros Próximos (7 Días)</h2>
                  </div>
                  <Link href="/suscripciones" className="text-xs font-bold text-[var(--ts-red)] hover:underline">
                    Ver Bóveda →
                  </Link>
                </div>

                {pagosProximos.length === 0 ? (
                  <p className="text-xs text-[var(--ts-text-muted)] text-center py-4">No hay pagos pendientes en los próximos 7 días.</p>
                ) : (
                  <div className="space-y-2.5">
                    {pagosProximos.slice(0, 3).map((p) => (
                      <div key={p.id} className="p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] flex flex-col gap-1.5">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold ts-text truncate">{p.clientes?.empresa || p.clientes?.contacto}</p>
                          <span className="text-xs font-black text-emerald-400">${Number(p.monto || 0).toFixed(2)}</span>
                        </div>
                        {p.clientes?.telefono && (
                          <a
                            href={`https://wa.me/${p.clientes.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hola ${p.clientes.contacto || p.clientes.empresa}, te escribimos de TecnoSmart para coordinar el cobro de tu servicio ${p.servicios_recurrentes?.nombre || ''} por $${p.monto}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Cobrar vía WhatsApp</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VISTA 4: TÉCNICOS & CUADRILLAS (100% OPERACIONES EN CAMPO)
      ══════════════════════════════════════════════════════════════ */}
      {esTecnico && (
        <div className="space-y-6">

          {/* Onboarding Técnico Estilo ERPNext */}
          <OnboardingChecklistCard
            storageKey="tecnico_operaciones"
            title="Protocolo Operativo de Instalación & Cuadrilla"
            steps={[
              {
                id: "kit_herramientas",
                label: "Chequeo de Herramientas & Kit de Campo",
                desc: "Verifica fusionadora de fibra, medidor de potencia óptica, ponchadora y taladros.",
                actionLabel: "Mis Herramientas",
                actionHref: "/herramientas",
              },
              {
                id: "solicitar_materiales",
                label: "Solicitud de Materiales a Bodega",
                desc: "Pide bobinas de cable UTP, conectores RJ45, patch cords y herrajes antes de salir a la obra.",
                actionLabel: "Pedir Materiales",
                actionHref: "/materiales",
              },
              {
                id: "acta_entrega",
                label: "Levantar Acta de Entrega con Firma Digital",
                desc: "Haz firmar al cliente en tu teléfono o tablet al finalizar la instalación para dar cierre formal.",
                actionLabel: "+ Nueva Acta",
                actionHref: "/actas",
              },
            ]}
          />

          {/* KPIs Operativos del Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="ts-surface ts-radius p-5 border ts-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Misiones Asignadas</p>
                <p className="text-2xl font-black ts-text">{ordenesUsuarioTecnico.length}</p>
                <p className="text-xs text-amber-500 font-bold mt-0.5">Órdenes de Trabajo</p>
              </div>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Cuadrilla en Servicio</p>
                <p className="text-2xl font-black ts-text">Activa</p>
                <p className="text-xs text-blue-400 font-bold mt-0.5">Equipo de Instalación</p>
              </div>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Actas de Entrega</p>
                <Link href="/actas" className="text-2xl font-black ts-text hover:text-[var(--ts-red)] transition-colors">
                  Cerrar Obra
                </Link>
                <p className="text-xs text-emerald-500 font-bold mt-0.5">Con Firma de Cliente</p>
              </div>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Materiales de Bodega</p>
                <Link href="/materiales" className="text-2xl font-black ts-text hover:text-[var(--ts-red)] transition-colors">
                  Solicitar
                </Link>
                <p className="text-xs text-purple-400 font-bold mt-0.5">Requisición técnica</p>
              </div>
            </div>

          </div>

          {/* Grid Principal: Misiones en Campo & Atajos Tácticos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Misiones de Campo Asignadas */}
            <div className="lg:col-span-2 ts-surface ts-radius p-5 border ts-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider ts-text">
                    Mis Misiones & Obras Asignadas
                  </h2>
                </div>
                <Link href="/cuadrillas" className="text-xs font-bold text-[var(--ts-red)] hover:underline">
                  Ver Todas →
                </Link>
              </div>

              {ordenesUsuarioTecnico.length === 0 ? (
                <EmptyStateCard
                  icon={Wrench}
                  title="Ninguna Misión Asignada por el Momento"
                  description="Tu cuadrilla está al día. Cuando la coordinación técnica te asigne una instalación de CCTV, fibra o redes, aparecerá aquí con los datos del cliente y la ruta."
                  actionLabel="Consultar Disponibilidad de Equipos"
                  actionHref="/inventario"
                />
              ) : (
                <div className="space-y-3">
                  {ordenesUsuarioTecnico.map((ot) => {
                    const direccion = ot.cliente_obj?.direccion || ot.direccion || "";
                    const telefono = ot.cliente_obj?.telefono || ot.telefono;
                    return (
                      <div
                        key={ot.id}
                        className="p-4 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] flex flex-col gap-3 hover:border-[var(--ts-red)]/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                {ot.numero_orden || "OT-CAMPO"}
                              </span>
                              <span className="text-xs font-bold text-[var(--ts-text-muted)]">
                                {ot.estado || "En Progreso"}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold ts-text">
                              {ot.titulo || "Instalación de Sistema de Seguridad"}
                            </h3>
                            <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                              Cliente: <strong className="ts-text">{ot.cliente_obj?.empresa || ot.cliente_obj?.contacto || "Cliente"}</strong>
                            </p>
                            {direccion && (
                              <p className="text-[11px] text-[var(--ts-text-muted)] mt-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">{direccion}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botones de Acción de Campo */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--ts-border)]">
                          {direccion && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all border border-blue-500/20"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Abrir Ruta Google Maps</span>
                            </a>
                          )}

                          {telefono && (
                            <a
                              href={`tel:${telefono.replace(/\D/g, '')}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all border border-emerald-500/20"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Llamar al Cliente</span>
                            </a>
                          )}

                          <Link
                            href={`/actas?ot=${ot.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ts-red)] text-white hover:brightness-110 text-xs font-bold transition-all ml-auto shadow-xs"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Generar Acta con Firma</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Columna Derecha: Atajos Tácticos & Seguridad */}
            <div className="space-y-6">

              {/* Atajos Rápidos de Campo */}
              <div className="ts-surface ts-radius p-5 border ts-border space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider ts-text mb-2">Atajos de Campo Rápidos</h2>

                <Link
                  href="/actas"
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] hover:border-[var(--ts-red)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold ts-text group-hover:text-[var(--ts-red)] transition-colors">Acta de Entrega Digital</p>
                      <p className="text-[10px] ts-text-muted">Firma en pantalla</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--ts-text-muted)]" />
                </Link>

                <Link
                  href="/materiales"
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] hover:border-[var(--ts-red)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold ts-text group-hover:text-[var(--ts-red)] transition-colors">Solicitar Materiales</p>
                      <p className="text-[10px] ts-text-muted">Requisición a almacén</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--ts-text-muted)]" />
                </Link>

                <Link
                  href="/herramientas"
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] hover:border-[var(--ts-red)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold ts-text group-hover:text-[var(--ts-red)] transition-colors">Mis Herramientas</p>
                      <p className="text-[10px] ts-text-muted">Equipos bajo custodia</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--ts-text-muted)]" />
                </Link>

                <Link
                  href="/inventario"
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] hover:border-[var(--ts-red)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold ts-text group-hover:text-[var(--ts-red)] transition-colors">Consultar Stock de Almacén</p>
                      <p className="text-[10px] ts-text-muted">Equipos y cámaras</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--ts-text-muted)]" />
                </Link>
              </div>

              {/* Protocolo de Seguridad EPP */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Seguridad en Alturas & EPP</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Recuerda portar tu casco reglamentario, arnés con doble línea de vida en postes/torres y guantes de protección. Tu integridad es lo más importante para TecnoSmart.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VISTA 5: TÉCNICOS ALIADOS B2B (PORTAL ALIADO VIP)
      ══════════════════════════════════════════════════════════════ */}
      {esTecnicoAliado && (
        <div className="space-y-6">

          {/* Banner VIP Aliado Certificado TecnoSmart */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/60 via-[var(--ts-surface)] to-[var(--ts-surface)] border border-[var(--ts-red)]/30 relative overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Técnico Aliado Certificado TecnoSmart
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">Descuento Mayorista del 15% Activado</h2>
                <p className="text-xs text-[var(--ts-text-muted)] max-w-xl">
                  Tienes acceso exclusivo a nuestro catálogo mayorista de cámaras CCTV, fibra óptica y telecomunicaciones. Además, cuentas con calculadoras de ingeniería para tus propios proyectos.
                </p>
              </div>
              <Link
                href="/inventario"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--ts-red)] text-white text-xs font-bold hover:brightness-110 transition-all shadow-md active:scale-95 self-start sm:self-center shrink-0"
              >
                <Package className="w-4 h-4" />
                <span>Explorar Catálogo con -15%</span>
              </Link>
            </div>
          </div>

          {/* KPIs del Aliado B2B */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Descuento Preferencial</p>
              <p className="text-3xl font-black text-[var(--ts-red)] mt-1">15% OFF</p>
              <p className="text-xs text-emerald-400 font-bold mt-1.5">Garantizado en compras</p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Mis Obras Registradas</p>
              <p className="text-3xl font-black ts-text mt-1">{cotizacionesAliado.length}</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1.5">Proyectos independientes</p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Tasa BCV de Referencia</p>
              <p className="text-2xl font-black ts-text mt-1">Bs. {bcvValor.toFixed(2)}</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1.5">Para cobrar a tus clientes</p>
            </div>

            <div className="ts-surface ts-radius p-5 border ts-border">
              <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider">Respaldo Técnico</p>
              <p className="text-2xl font-black text-amber-400 mt-1">100%</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1.5">Garantía local TecnoSmart</p>
            </div>

          </div>

          {/* Grid Principal: Mis Obras & Calculadoras de Campo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Mis Obras & Clientes */}
            <div className="lg:col-span-2 ts-surface ts-radius p-5 border ts-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[var(--ts-red)]" />
                  <h2 className="text-xs font-black uppercase tracking-wider ts-text">Mis Obras & Clientes Registrados</h2>
                </div>
                <Link
                  href="/nueva"
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-[var(--ts-red)] text-white px-3.5 py-1.5 rounded-xl hover:brightness-110 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Registrar Nueva Obra</span>
                </Link>
              </div>

              {cotizacionesAliado.length === 0 ? (
                <EmptyStateCard
                  icon={Briefcase}
                  title="Aún No Has Registrado Ninguna Obra"
                  description="Anota tus clientes e instalaciones independientes aquí. Te permitirá llevar el control de tus cotizaciones con el descuento de técnico ya aplicado."
                  actionLabel="+ Registrar Mi Primera Obra"
                  actionHref="/nueva"
                />
              ) : (
                <div className="space-y-3">
                  {cotizacionesAliado.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[var(--ts-surface)] border border-[var(--ts-border)] ts-text-muted">
                          {c.numero_cotizacion}
                        </span>
                        <p className="text-xs font-bold ts-text mt-1">
                          {c.clientes?.empresa || c.clientes?.contacto || "Cliente Particular"}
                        </p>
                        <p className="text-[10px] text-[var(--ts-text-muted)]">Emitida el {formatFecha(c.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400">{formatUSD(c.total)}</span>
                        <p className="text-[10px] text-[var(--ts-text-muted)] capitalize">{c.estado}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cartelera de Eventos & Talleres Presenciales */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-[var(--ts-surface-2)] border border-blue-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-xs font-black uppercase text-blue-400">Cartelera de la Comunidad Técnica</span>
                </div>
                <h3 className="text-sm font-bold text-white">Taller Presencial: Certificación en Fibra Óptica & Domótica</h3>
                <p className="text-xs text-[var(--ts-text-muted)] mt-1 leading-relaxed">
                  Invitación especial a todos nuestros técnicos aliados. Aprende empalme por fusión y configuración de enlaces inalámbricos en nuestra sede central. ¡Reserva tu cupo con administración!
                </p>
              </div>

            </div>

            {/* Calculadoras Técnicas de Campo & Catálogo */}
            <div className="space-y-6">

              {/* Herramientas de Cálculo Rápido */}
              <div className="ts-surface ts-radius p-5 border ts-border space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider ts-text">Calculadoras de Ingeniería</h2>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] space-y-2">
                  <p className="text-xs font-bold ts-text">Almacenamiento CCTV (Discos Duros)</p>
                  <p className="text-[11px] text-[var(--ts-text-muted)]">
                    Estima cuántos TB requiere tu cliente según el número de cámaras y resolución (H.265 / H.264).
                  </p>
                  <Link
                    href="/crm"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ts-red)] hover:underline"
                  >
                    <span>Abrir Calculadora CCTV →</span>
                  </Link>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] space-y-2">
                  <p className="text-xs font-bold ts-text">Fuentes de Poder & Amperaje</p>
                  <p className="text-[11px] text-[var(--ts-text-muted)]">
                    Calcula la fuente conmutada (12V / 5A / 10A / 20A) necesaria para la cantidad de cámaras y distancias de cableado.
                  </p>
                  <Link
                    href="/crm"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ts-red)] hover:underline"
                  >
                    <span>Calcular Amperaje →</span>
                  </Link>
                </div>
              </div>

              {/* Acceso Catálogo Mayorista */}
              <div className="p-5 rounded-2xl bg-[var(--ts-surface)] border border-[var(--ts-border)] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--ts-red)]/10 text-[var(--ts-red)] flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider ts-text">Catálogo con Precios de Distribuidor</h3>
                <p className="text-xs text-[var(--ts-text-muted)] leading-relaxed">
                  Visualiza los precios especiales con tu 15% de descuento ya calculado para elaborar presupuestos a tus clientes.
                </p>
                <Link
                  href="/inventario"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ts-red)] text-white text-xs font-bold hover:brightness-110 shadow-xs"
                >
                  <span>Ver Precios Mayoristas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
