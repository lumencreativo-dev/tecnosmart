"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, DollarSign, Users, Save, Calendar, CheckCircle,
  Clock, AlertTriangle, ArrowRight, Settings, Phone, Activity, Globe, Package
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD, formatFecha } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import Link from "next/link";

export default function DashboardManager() {
  const [loading, setLoading] = useState(true);

  // Data state
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});
  const [tasas, setTasas] = useState<any>(null);

  // Form config state
  const [descTecnico, setDescTecnico] = useState("15");
  const [diasValidez, setDiasValidez] = useState("15");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);

    // Obtener config
    const { data: confData } = await supabase.from("configuracion").select("*");
    if (confData) {
      const confMap: Record<string, any> = {};
      confData.forEach(c => confMap[c.clave] = c.valor);
      setConfig(confMap);
      setDescTecnico(confMap.descuento_tecnico || "15");
      setDiasValidez(confMap.dias_validez_cotizacion || "15");
    }

    // Obtener cotizaciones excluyendo las eliminadas (papelera)
    const { data: cotData } = await supabase
      .from("cotizaciones")
      .select("*, clientes(empresa, contacto, telefono)")
      .or("eliminada.is.null,eliminada.eq.false")
      .order("created_at", { ascending: false });
    if (cotData) setCotizaciones(cotData);

    // Obtener clientes
    const { data: cliData } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
    if (cliData) setClientes(cliData);

    // Obtener facturas activas con sus detalles para métricas de productos
    const { data: facData } = await supabase
      .from("facturas")
      .select("*, factura_detalles(*), cotizaciones(clientes(empresa, contacto))")
      .eq("estado", "activa");
    if (facData) setFacturas(facData);

    // Obtener suscripciones activas
    const { data: susData, error: susErr } = await supabase
      .from("suscripciones")
      .select("*, clientes(empresa, contacto, telefono), servicios_recurrentes(nombre)")
      .eq("estado", "Activo");
    if (susErr) console.error("Error fetching suscripciones:", susErr);
    if (susData) setSuscripciones(susData);

    // Fetch Todas las Tasas desde API
    try {
      const res = await fetch("/api/tasas");
      const data = await res.json();
      setTasas(data);
    } catch (error) {
      console.error("Tasas Fetch Error", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setConfigSuccess(false);

    await supabase.from("configuracion").upsert([
      { clave: "descuento_tecnico", valor: descTecnico },
      { clave: "dias_validez_cotizacion", valor: diasValidez }
    ]);

    setConfigSuccess(true);
    setTimeout(() => setConfigSuccess(false), 3000);
    setSavingConfig(false);
  };

  // ── MÉTRICAS ──
  const stats = useMemo(() => {
    const validezMs = parseInt(diasValidez || "15") * 24 * 60 * 60 * 1000;
    const ahora = Date.now();

    let ingresoRealUsd = 0;
    let ingresoRealBs = 0;
    let ingresoProyectado = 0;
    let aprobadasNoFacturadas = 0;

    // Ingreso Real se basa en FACTURAS (incluye desde cotización y directas)
    facturas.forEach(f => {
      ingresoRealUsd += Number(f.subtotal_usd || 0);
      ingresoRealBs += Number(f.total_bs || 0);
    });

    // Ingreso Proyectado se basa en COTIZACIONES
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

    return { ingresoRealUsd, ingresoRealBs, ingresoProyectado, aprobadasNoFacturadas };
  }, [facturas, cotizaciones, diasValidez]);

  // ── TICKET PROMEDIO ──
  const ticketPromedio = useMemo(() => {
    if (!facturas.length) return 0;
    const totalUsd = facturas.reduce((s, f) => s + Number(f.subtotal_usd || 0), 0);
    return totalUsd / facturas.length;
  }, [facturas]);

  // ── PRODUCTO MÁS VENDIDO ──
  const productoTopData = useMemo(() => {
    const conteo: Record<string, { descripcion: string; cantidad: number; ingresos: number }> = {};
    facturas.forEach(f => {
      (f.factura_detalles || []).forEach((d: any) => {
        const key = d.descripcion || "Desconocido";
        if (!conteo[key]) conteo[key] = { descripcion: key, cantidad: 0, ingresos: 0 };
        conteo[key].cantidad += Number(d.cantidad || 0);
        conteo[key].ingresos += Number(d.subtotal || 0);
      });
    });
    const sorted = Object.values(conteo).sort((a, b) => b.cantidad - a.cantidad);
    return sorted.slice(0, 3); // Top 3
  }, [facturas]);

  // ── CLIENTE MÁS FRECUENTE ──
  const clienteTopData = useMemo(() => {
    const conteo: Record<string, { nombre: string; facturas: number; total: number }> = {};
    cotizaciones.filter(c => c.estado === "facturada").forEach(c => {
      const nombre = c.clientes?.empresa || c.clientes?.contacto || "Sin nombre";
      if (!conteo[nombre]) conteo[nombre] = { nombre, facturas: 0, total: 0 };
      conteo[nombre].facturas += 1;
      conteo[nombre].total += Number(c.total || 0);
    });
    return Object.values(conteo).sort((a, b) => b.facturas - a.facturas).slice(0, 3);
  }, [cotizaciones]);

  // ── RECORDATORIOS DE SEGUIMIENTO (5 y 15 Días) ──
  const recordatorios = useMemo(() => {
    const ahora = Date.now();
    const diaMs = 24 * 60 * 60 * 1000;
    const seguimientos: any[] = [];

    cotizaciones.forEach(c => {
      // Solo hacer seguimiento si está enviada
      if (c.estado === "enviada") {
        const diasTranscurridos = Math.floor((ahora - new Date(c.created_at).getTime()) / diaMs);
        
        if (diasTranscurridos === 5) {
          seguimientos.push({ ...c, tipo: "seguimiento_5d", mensaje: "Llamar para confirmar cotización" });
        } else if (diasTranscurridos === 15) {
          seguimientos.push({ ...c, tipo: "seguimiento_15d", mensaje: "La cotización vence hoy" });
        }
      }
    });
    return seguimientos;
  }, [cotizaciones]);

  // ── SUSCRIPCIONES (MRR y Próximos Pagos) ──
  const { mrr, pagosProximos } = useMemo(() => {
    let mrrTotal = 0;
    const ahora = new Date();
    const prox7Dias = new Date();
    prox7Dias.setDate(ahora.getDate() + 7);

    const pendientes: any[] = [];

    suscripciones.forEach(s => {
      // Calcular MRR (Monthly Recurring Revenue)
      const monto = Number(s.monto || 0);
      switch(s.ciclo_facturacion) {
        case "Mensual": mrrTotal += monto; break;
        case "Bimestral": mrrTotal += monto / 2; break;
        case "Trimestral": mrrTotal += monto / 3; break;
        case "Semestral": mrrTotal += monto / 6; break;
        case "Anual": mrrTotal += monto / 12; break;
        default: mrrTotal += monto;
      }

      // Filtrar próximos pagos o vencidos
      const fechaPago = new Date(s.proximo_pago);
      if (fechaPago <= prox7Dias) {
        pendientes.push({
          ...s,
          vencido: fechaPago < ahora,
          diasFaltantes: Math.ceil((fechaPago.getTime() - ahora.getTime()) / (1000 * 3600 * 24))
        });
      }
    });

    // Ordenar de más urgentes a menos
    pendientes.sort((a, b) => new Date(a.proximo_pago).getTime() - new Date(b.proximo_pago).getTime());

    return { mrr: mrrTotal, pagosProximos: pendientes };
  }, [suscripciones]);

  // ── GRÁFICA: Cotizaciones por mes (Últimos 6 meses) ──
  const chartData = useMemo(() => {
    if (!cotizaciones.length) return [];
    
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const hoy = new Date();
    const result: { mesKey: string; nombre: string; Aprobado: number; Pendiente: number; }[] = [];

    // Construir esqueleto de los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      result.push({
        mesKey: `${d.getFullYear()}-${d.getMonth()}`,
        nombre: meses[d.getMonth()],
        Aprobado: 0,
        Pendiente: 0
      });
    }

    // Llenar datos de cotizaciones (Pendientes y Aprobadas)
    cotizaciones.forEach(c => {
      const d = new Date(c.created_at);
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      const slot = result.find(r => r.mesKey === mKey);
      
      if (slot) {
        const monto = Number(c.total || 0);
        // Si está facturada se maneja en el loop de facturas
        if (c.estado === "aprobada") {
          slot.Aprobado += monto;
        } else if (c.estado !== "rechazada" && c.estado !== "facturada") {
          slot.Pendiente += monto;
        }
      }
    });

    // Llenar datos de facturas (Ingreso cerrado)
    facturas.forEach(f => {
      const d = new Date(f.created_at);
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      const slot = result.find(r => r.mesKey === mKey);
      
      if (slot) {
        slot.Aprobado += Number(f.subtotal_usd || 0);
      }
    });

    return result;
  }, [cotizaciones, facturas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black ts-text tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-[var(--ts-red)]" /> Resumen Financiero
          </h1>
          <p className="text-sm ts-text-muted mt-1">
            Métricas de ingresos, seguimiento a clientes y actividad general.
          </p>
        </div>
      </div>

      {/* ── SECCIÓN 1: WIDGETS Y MÉTRICAS PRINCIPALES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-5">
        
        {/* Balance USD */}
        <div className="ts-surface ts-radius p-5 col-span-1 md:col-span-3 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ts-red-subtle)] rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
          <div>
            <div className="flex items-center gap-2 ts-text-muted mb-4">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Ingreso Cerrado</span>
            </div>
            <p className="text-3xl font-black ts-text tracking-tighter">
              {formatUSD(stats.ingresoRealUsd)}
            </p>
            {stats.ingresoRealBs > 0 && (
              <p className="text-sm font-bold text-[var(--ts-text-muted)] mt-1 bg-[var(--ts-surface-2)] inline-block px-2.5 py-1 rounded-md">
                Bs. {stats.ingresoRealBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        {/* Proyectado USD */}
        <div className="ts-surface ts-radius p-5 col-span-1 md:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 ts-text-muted mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Ingreso Proyectado</span>
            </div>
            <p className="text-3xl font-black ts-text tracking-tight">
              {formatUSD(stats.ingresoProyectado)}
            </p>
            <p className="text-xs ts-text-muted mt-2">
              Cotizaciones vigentes <span className="font-bold">({diasValidez} días)</span>
            </p>
          </div>
        </div>

        {/* Ingreso Recurrente MRR */}
        <div className="ts-surface ts-radius p-5 col-span-1 md:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 ts-text-muted mb-4">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider">MRR Mensual</span>
            </div>
            <p className="text-3xl font-black text-emerald-500 tracking-tight">
              {formatUSD(mrr)}
            </p>
            <p className="text-xs ts-text-muted mt-2">
              Suscripciones activas
            </p>
          </div>
        </div>

        {/* Tasas de Referencia Widget */}
        <div className="bg-[#1a1a1a] rounded-[20px] border border-white/5 p-5 col-span-1 sm:col-span-2 md:col-span-3 flex flex-col relative overflow-hidden">
          {/* Fondo sutil estilo ondas */}
          <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(200,160,50,0.15) 0%, transparent 50%)' }} />
          
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2 text-gray-300">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-bold">Tasas de referencia</span>
            </div>
            <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En vivo
            </div>
          </div>

          {tasas ? (
            <div className="space-y-3 relative z-10">
              {/* Oficial */}
              <div className="bg-[#242424] rounded-xl p-3.5 flex items-center justify-between border border-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-7 rounded bg-[#333] flex items-center justify-center text-[10px] font-black text-amber-400">BCV</div>
                  <div>
                    <p className="text-sm font-bold text-gray-100 leading-tight">BCV oficial</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Vigente de hoy</p>
                  </div>
                </div>
                <p className="text-base font-bold text-gray-100">Bs. {tasas.bcv.promedio.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              {/* Euro */}
              <div className="bg-[#242424] rounded-xl p-3.5 flex items-center justify-between border border-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-7 rounded bg-[#333] flex items-center justify-center text-[10px] font-black text-blue-300">EUR</div>
                  <div>
                    <p className="text-sm font-bold text-gray-100 leading-tight">Euro oficial</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Vigente de hoy</p>
                  </div>
                </div>
                <p className="text-base font-bold text-gray-100">Bs. {tasas.euro.promedio.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              {/* Paralelo */}
              <div className="bg-[#242424] rounded-xl p-3.5 flex items-center justify-between border border-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-7 rounded bg-[#333] flex items-center justify-center text-[10px] font-black text-gray-300">PAR</div>
                  <div>
                    <p className="text-sm font-bold text-gray-100 leading-tight">Paralelo</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{new Date(tasas.paralelo.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <p className="text-base font-bold text-gray-100">Bs. {tasas.paralelo.promedio.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              {/* Binance P2P */}
              <div className="bg-[#242424] rounded-xl p-3.5 flex items-center justify-between border border-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-7 rounded bg-[#333] flex items-center justify-center text-[10px] font-black text-amber-500">BN</div>
                  <div>
                    <p className="text-sm font-bold text-gray-100 leading-tight">Binance P2P</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{new Date(tasas.binance.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <p className="text-base font-bold text-gray-100">Bs. {tasas.binance.promedio.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-gray-500 animate-pulse">Obteniendo tasas en vivo...</p>
            </div>
          )}
        </div>

      </div>

      {/* ── SECCIÓN 1.5: MÉTRICAS ADICIONALES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Ticket Promedio */}
        <div className="ts-surface ts-radius p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider mb-1">Ticket Promedio</p>
            <p className="text-2xl font-black ts-text">{formatUSD(ticketPromedio)}</p>
            <p className="text-[10px] ts-text-muted mt-1">Por factura emitida</p>
          </div>
        </div>

        {/* Producto Más Vendido */}
        <div className="ts-surface ts-radius p-5">
          <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Productos Top
          </p>
          {productoTopData.length === 0 ? (
            <p className="text-xs ts-text-muted">Sin datos aún.</p>
          ) : (
            <div className="space-y-2">
              {productoTopData.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    i === 0 ? "bg-amber-400/20 text-amber-500" : "bg-[var(--ts-border)] ts-text-muted"
                  }`}>{i + 1}</span>
                  <span className="text-xs ts-text flex-1 truncate font-medium">{p.descripcion}</span>
                  <span className="text-xs font-bold ts-text-muted shrink-0">{p.cantidad} uds.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cliente Más Frecuente */}
        <div className="ts-surface ts-radius p-5">
          <p className="text-[10px] font-bold ts-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Clientes Frecuentes
          </p>
          {clienteTopData.length === 0 ? (
            <p className="text-xs ts-text-muted">Sin datos aún.</p>
          ) : (
            <div className="space-y-2">
              {clienteTopData.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    i === 0 ? "bg-amber-400/20 text-amber-500" : "bg-[var(--ts-border)] ts-text-muted"
                  }`}>{i + 1}</span>
                  <span className="text-xs ts-text flex-1 truncate font-medium">{c.nombre}</span>
                  <span className="text-xs font-bold ts-text-muted shrink-0">{c.facturas} fac.</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── SECCIÓN 2: GRÁFICA Y ALERTAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Gráfica de Rendimiento */}
        <div className="ts-surface ts-radius p-5 lg:col-span-2">
          <h2 className="text-sm font-bold ts-text mb-6 uppercase tracking-wider">Flujo de Cotizaciones (Últ. 6 meses)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ts-border)" />
                <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ts-text-secondary)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ts-text-secondary)' }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'var(--ts-border)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--ts-surface)', borderColor: 'var(--ts-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--ts-text-primary)' }}
                  formatter={(val: any) => [formatUSD(Number(val)), ""]}
                />
                <Bar dataKey="Aprobado" stackId="a" fill="var(--ts-red)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Pendiente" stackId="a" fill="var(--ts-border)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--ts-red)]" /><span className="text-xs ts-text-muted">Aprobado/Facturado</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--ts-border)]" /><span className="text-xs ts-text-muted">Pendiente</span></div>
          </div>
        </div>

        {/* Panel de Tareas y Alertas */}
        <div className="flex flex-col gap-5">
          
          {/* Recordatorios */}
          <div className="ts-surface ts-radius p-5 flex-1 flex flex-col">
            <h2 className="text-sm font-bold ts-text mb-4 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Seguimientos Hoy
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {recordatorios.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-xs ts-text">Todo al día, no hay recordatorios pendientes.</p>
                </div>
              ) : (
                recordatorios.map(r => (
                  <div key={r.id} className="p-3 ts-surface-2 ts-radius border ts-border border-l-4 border-l-amber-500 flex flex-col gap-2">
                    <div>
                      <p className="text-xs font-bold text-amber-600 mb-0.5">{r.mensaje}</p>
                      <p className="text-[11px] font-semibold ts-text">{r.clientes?.empresa || r.clientes?.contacto || 'Cliente'}</p>
                      <p className="text-[10px] ts-text-muted">Cotización: {r.numero_cotizacion}</p>
                    </div>
                    {r.clientes?.telefono && (
                      <a 
                        href={`https://wa.me/${r.clientes.telefono.replace(/\D/g, '')}?text=Hola, te escribimos de TecnoSmart referente a tu cotización ${r.numero_cotizacion}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#25D366]/10 text-[#128C7E] px-2 py-1 rounded-md w-fit hover:bg-[#25D366]/20 transition-colors"
                      >
                        <Phone className="w-3 h-3" /> Contactar vía WhatsApp
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Próximos Pagos Suscripciones */}
          <div className="ts-surface ts-radius p-5 flex-1 flex flex-col">
            <h2 className="text-sm font-bold ts-text mb-4 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" /> Próximos Pagos
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {pagosProximos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-xs ts-text">No hay pagos recurrentes cercanos.</p>
                </div>
              ) : (
                pagosProximos.map(p => (
                  <div key={p.id} className={`p-3 ts-surface-2 ts-radius border ts-border border-l-4 flex flex-col gap-2 ${p.vencido ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-xs font-bold mb-0.5 ${p.vencido ? 'text-red-500' : 'text-emerald-500'}`}>
                          {p.vencido ? `¡Vencido! (${p.diasFaltantes * -1} días)` : (p.diasFaltantes === 0 ? 'Vence hoy' : `Faltan ${p.diasFaltantes} días`)}
                        </p>
                        <p className="text-[11px] font-semibold ts-text">{p.clientes?.empresa || p.clientes?.contacto}</p>
                        <p className="text-[10px] ts-text-muted">{p.servicios_recurrentes?.nombre}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black ts-text">${p.monto.toFixed(2)}</span>
                      </div>
                    </div>
                    {p.clientes?.telefono && (() => {
                      const clienteNombre = p.clientes?.contacto || p.clientes?.empresa;
                      let mensaje = p.servicios_recurrentes?.mensaje_whatsapp 
                        ? p.servicios_recurrentes.mensaje_whatsapp
                            .replace(/{cliente}/g, clienteNombre)
                            .replace(/{monto}/g, `$${p.monto.toFixed(2)}`)
                            .replace(/{servicio}/g, p.servicios_recurrentes?.nombre || "")
                        : `Hola ${clienteNombre}, te escribimos de TecnoSmart para recordarte el pago de tu servicio de ${p.servicios_recurrentes?.nombre} por $${p.monto.toFixed(2)}. ${p.vencido ? 'Recordatorio de pago vencido.' : ''}`;
                      return (
                        <a 
                          href={`https://wa.me/${p.clientes.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`}
                          target="_blank"
                          rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#25D366]/10 text-[#128C7E] px-2 py-1 rounded-md w-fit hover:bg-[#25D366]/20 transition-colors"
                      >
                        <Phone className="w-3 h-3" /> Cobrar vía WhatsApp
                      </a>
                      );
                    })()}
                  </div>
                ))
              )}
            </div>
            
            <Link href="/cotizador/suscripciones" className="mt-4 text-center text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors block">
              Ver todas las suscripciones &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* ── SECCIÓN 3: CONFIGURACIÓN GLOBAL ── */}
      <div className="ts-surface ts-radius p-5 md:p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-[var(--ts-red)]" />
          <h2 className="text-base font-bold ts-text uppercase tracking-wider">Configuración Global</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Descuento Técnico */}
          <div>
            <label className="block text-xs font-bold ts-text-muted mb-1.5">Descuento a Técnicos (%)</label>
            <input
              type="number"
              value={descTecnico}
              onChange={e => setDescTecnico(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--ts-surface-2)] border ts-border rounded-xl text-sm focus:outline-none focus:border-[var(--ts-red)] transition-colors"
            />
            <p className="text-[10px] ts-text-muted mt-2">
              Aplica automático a servicios y artículos al seleccionar cliente "Técnico".
            </p>
          </div>

          {/* Días Validez */}
          <div>
            <label className="block text-xs font-bold ts-text-muted mb-1.5">Días de Validez (Cotización)</label>
            <input
              type="number"
              value={diasValidez}
              onChange={e => setDiasValidez(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--ts-surface-2)] border ts-border rounded-xl text-sm focus:outline-none focus:border-[var(--ts-red)] transition-colors"
            />
            <p className="text-[10px] ts-text-muted mt-2">
              Luego de estos días, deja de sumar a Ingresos Proyectados por considerarse vencida.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="flex items-center gap-2 bg-[var(--ts-text-primary)] hover:opacity-80 text-[var(--ts-bg)] text-xs font-bold px-6 py-2.5 rounded-xl transition-all"
          >
            <Save className="w-4 h-4" />
            {savingConfig ? "Guardando..." : "Guardar Cambios"}
          </button>
          {configSuccess && (
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> ¡Guardado!
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
