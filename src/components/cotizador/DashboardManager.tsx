"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, DollarSign, Users, Save, Calendar, CheckCircle,
  Clock, AlertTriangle, ArrowRight, Settings, Phone, Activity, Globe
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
  const [config, setConfig] = useState<any>({});
  const [tasaBcv, setTasaBcv] = useState<{ dolar: number; eur: number; fecha: string } | null>(null);

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

    // Fetch BCV
    try {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
      const d = await res.json();
      const resE = await fetch("https://ve.dolarapi.com/v1/euros/oficial");
      const e = await resE.json();
      setTasaBcv({ dolar: d.promedio, eur: e.promedio, fecha: d.fechaActualizacion });
    } catch (error) {
      console.error("BCV Fetch Error", error);
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

    let ingresoReal = 0;
    let ingresoProyectado = 0;
    let aprobadasNoFacturadas = 0;

    cotizaciones.forEach(c => {
      const d = new Date(c.created_at).getTime();
      const monto = Number(c.total || 0);
      const isVigente = (ahora - d) <= validezMs;

      if (c.estado === "facturada") {
        ingresoReal += monto;
      } else if (c.estado === "aprobada") {
        aprobadasNoFacturadas += monto;
        if (isVigente) ingresoProyectado += monto;
      } else if (c.estado !== "rechazada" && isVigente) {
        ingresoProyectado += monto;
      }
    });

    return { ingresoReal, ingresoProyectado, aprobadasNoFacturadas };
  }, [cotizaciones, diasValidez]);

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

    // Llenar datos
    cotizaciones.forEach(c => {
      const d = new Date(c.created_at);
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      const slot = result.find(r => r.mesKey === mKey);
      
      if (slot) {
        const monto = Number(c.total || 0);
        if (c.estado === "facturada" || c.estado === "aprobada") {
          slot.Aprobado += monto;
        } else if (c.estado !== "rechazada") {
          slot.Pendiente += monto;
        }
      }
    });

    return result;
  }, [cotizaciones]);

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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Balance USD */}
        <div className="ts-surface ts-radius p-5 col-span-1 md:col-span-4 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ts-red-subtle)] rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
          <div>
            <div className="flex items-center gap-2 ts-text-muted mb-4">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Ingreso Cerrado</span>
            </div>
            <p className="text-4xl font-black ts-text tracking-tighter">
              {formatUSD(stats.ingresoReal)}
            </p>
            <p className="text-xs ts-text-muted mt-2">
              <span className="text-emerald-500 font-bold">✓ Facturado</span> exitosamente
            </p>
          </div>
        </div>

        {/* Proyectado USD */}
        <div className="ts-surface ts-radius p-5 col-span-1 md:col-span-4 flex flex-col justify-between">
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

        {/* BCV Widget */}
        <div className="ts-surface-2 ts-radius border ts-border p-5 col-span-1 md:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 ts-text-muted">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Tasa BCV Oficial</span>
              </div>
            </div>
            {tasaBcv ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold ts-text flex items-center gap-2">
                    🇺🇸 USD
                  </span>
                  <span className="text-lg font-black ts-text">Bs {tasaBcv.dolar.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold ts-text flex items-center gap-2">
                    🇪🇺 EUR
                  </span>
                  <span className="text-lg font-black ts-text">Bs {tasaBcv.eur.toFixed(2)}</span>
                </div>
                <p className="text-[10px] ts-text-muted pt-2 border-t ts-border">
                  Actualizado: {new Date(tasaBcv.fecha).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-xs ts-text-muted animate-pulse">Obteniendo tasa...</p>
            )}
          </div>
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
