"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, ArrowUpDown, X, Save, Phone, Mail,
  MapPin, FileText, TrendingUp, Calendar, Edit2,
  ChevronDown, Star, Users
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD, formatFecha } from "@/lib/utils";

type Cliente = any;
type Cotizacion = any;

// ── Sistema de Rangos ─────────────────────────────────────────
const RANGOS = [
  { min: 50000, label: "VIP Élite",    emoji: "⭐", color: "bg-amber-100 text-amber-800 border-amber-300",  dot: "bg-amber-400" },
  { min: 20000, label: "VIP Premium",  emoji: "👑", color: "bg-purple-100 text-purple-800 border-purple-300", dot: "bg-purple-400" },
  { min: 10000, label: "VIP",          emoji: "💎", color: "bg-sky-100 text-sky-800 border-sky-300",         dot: "bg-sky-400" },
  { min: 5000,  label: "Oro",          emoji: "🥇", color: "bg-yellow-100 text-yellow-800 border-yellow-300",dot: "bg-yellow-400" },
  { min: 1000,  label: "Plata",        emoji: "🥈", color: "bg-slate-100 text-slate-700 border-slate-300",   dot: "bg-slate-400" },
  { min: 100,   label: "Bronce",       emoji: "🥉", color: "bg-orange-100 text-orange-800 border-orange-300",dot: "bg-orange-300" },
  { min: 0,     label: "Nuevo",        emoji: "🆕", color: "bg-gray-100 text-[var(--ts-text-muted)] border-[var(--ts-border)]",      dot: "bg-gray-300" },
];

function getRango(total: number) {
  return RANGOS.find(r => total >= r.min) ?? RANGOS[RANGOS.length - 1];
}

type SortKey = "nombre" | "total" | "cotizaciones" | "reciente";

export default function ClientesManager() {
  const [clientes, setClientes]         = useState<Cliente[]>([]);
  const [cotByCliente, setCotByCliente] = useState<Record<string, Cotizacion[]>>({});
  const [loading, setLoading]           = useState(true);
  const [query, setQuery]               = useState("");
  const [sortBy, setSortBy]             = useState<SortKey>("total");
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [editMode, setEditMode]         = useState(false);
  const [form, setForm]                 = useState<any>({});
  const [saving, setSaving]             = useState(false);
  const [filtroRango, setFiltroRango]   = useState<string>("Todos");

  const cargarDatos = async () => {
    setLoading(true);
    const { data: cliData } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
    const { data: cotData } = await supabase
      .from("cotizaciones")
      .select("id, cliente_id, numero_cotizacion, total, estado, created_at")
      .or("eliminada.is.null,eliminada.eq.false")
      .order("created_at", { ascending: false });

    if (cliData) setClientes(cliData);
    if (cotData) {
      const grouped: Record<string, Cotizacion[]> = {};
      cotData.forEach(c => {
        if (!grouped[c.cliente_id]) grouped[c.cliente_id] = [];
        grouped[c.cliente_id].push(c);
      });
      setCotByCliente(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  // ── Métricas por cliente ──────────────────────────────────
  const getMetrics = (clienteId: string) => {
    const cots = cotByCliente[clienteId] || [];
    const totalGastado = cots
      .filter(c => c.estado === "facturada")
      .reduce((s, c) => s + Number(c.total || 0), 0);
    const cotizacionesTotal = cots.length;
    const ultima = cots[0]?.created_at || null;
    return { totalGastado, cotizacionesTotal, ultima };
  };

  // ── Lista procesada ───────────────────────────────────────
  const clientesProcesados = useMemo(() => {
    let list = clientes.map(c => ({ ...c, ...getMetrics(c.id) }));

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c =>
        c.contacto?.toLowerCase().includes(q) ||
        c.empresa?.toLowerCase().includes(q) ||
        c.rif_cedula?.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q)
      );
    }

    if (filtroRango !== "Todos") {
      list = list.filter(c => getRango(c.totalGastado).label === filtroRango);
    }

    list.sort((a, b) => {
      if (sortBy === "total")        return b.totalGastado - a.totalGastado;
      if (sortBy === "cotizaciones") return b.cotizacionesTotal - a.cotizacionesTotal;
      if (sortBy === "reciente")     return new Date(b.ultima || 0).getTime() - new Date(a.ultima || 0).getTime();
      if (sortBy === "nombre")       return (a.empresa || a.contacto || "").localeCompare(b.empresa || b.contacto || "");
      return 0;
    });

    return list;
  }, [clientes, cotByCliente, query, sortBy, filtroRango]);

  const clienteSeleccionado = clientes.find(c => c.id === selectedId);
  const metricsSeleccionado = selectedId ? getMetrics(selectedId) : null;
  const cotsSeleccionado    = selectedId ? (cotByCliente[selectedId] || []) : [];

  const openDrawer = (cli: Cliente) => {
    setSelectedId(cli.id);
    setForm({ ...cli });
    setEditMode(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("clientes").update({
      empresa:    form.empresa,
      contacto:   form.contacto,
      rif_cedula: form.rif_cedula,
      telefono:   form.telefono,
      email:      form.email,
      direccion:  form.direccion,
      tipo:       form.tipo,
      notas:      form.notas,
    }).eq("id", selectedId!);
    if (!error) {
      setClientes(prev => prev.map(c => c.id === selectedId ? { ...c, ...form } : c));
      setEditMode(false);
    }
    setSaving(false);
  };

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "total",        label: "Mayor gasto" },
    { key: "cotizaciones", label: "Más cotizaciones" },
    { key: "reciente",     label: "Más recientes" },
    { key: "nombre",       label: "Alfabético" },
  ];

  // ── Estadísticas del encabezado ───────────────────────────
  const totalClientes   = clientes.length;
  const totalFacturado  = Object.values(cotByCliente).flat()
    .filter(c => c.estado === "facturada")
    .reduce((s, c) => s + Number(c.total || 0), 0);
  const clientesVIP     = clientesProcesados.filter(c => c.totalGastado >= 10000).length;

  return (
    <div className="space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4 text-center">
          <p className="text-2xl font-extrabold text-[var(--ts-text-primary)]">{totalClientes}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium mt-0.5">Clientes Totales</p>
        </div>
        <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4 text-center">
          <p className="text-2xl font-extrabold text-[var(--ts-red)]">{formatUSD(totalFacturado)}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium mt-0.5">Facturado Total</p>
        </div>
        <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4 text-center">
          <p className="text-2xl font-extrabold text-purple-700">{clientesVIP}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium mt-0.5">Clientes VIP</p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4 flex flex-col sm:flex-row gap-3 items-center">
        {/* Buscador */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ts-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa, RIF, teléfono..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)]"
          />
        </div>

        {/* Ordenar */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-[var(--ts-text-muted)]" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            className="border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[var(--ts-red)] bg-[var(--ts-surface)]"
          >
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        {/* Filtro Rango */}
        <div className="flex items-center gap-2 shrink-0">
          <Star className="w-4 h-4 text-[var(--ts-text-muted)]" />
          <select
            value={filtroRango}
            onChange={e => setFiltroRango(e.target.value)}
            className="border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[var(--ts-red)] bg-[var(--ts-surface)]"
          >
            <option value="Todos">Todos los rangos</option>
            {RANGOS.map(r => <option key={r.label} value={r.label}>{r.emoji} {r.label}</option>)}
          </select>
        </div>

        <span className="text-[10px] text-[var(--ts-text-muted)] font-medium shrink-0">
          {clientesProcesados.length} resultado{clientesProcesados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Lista de Clientes ── */}
      {loading ? (
        <div className="text-center py-20 text-[var(--ts-text-muted)]">
          <div className="w-8 h-8 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Cargando clientes...
        </div>
      ) : (
        <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] overflow-hidden shadow-sm">
          {clientesProcesados.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-[#d9d9d9] mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--ts-text-muted)]">No se encontraron clientes</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)]">Rango</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)]">Cliente</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] hidden md:table-cell">Tipo</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] hidden lg:table-cell">Teléfono</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-right">Total Facturado</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-center hidden sm:table-cell">Cotizaciones</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-center">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ts-border-2)]">
                {clientesProcesados.map(cli => {
                  const rango = getRango(cli.totalGastado);
                  return (
                    <tr
                      key={cli.id}
                      className="hover:bg-[var(--ts-surface-2)] cursor-pointer transition-colors"
                      onClick={() => openDrawer(cli)}
                    >
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${rango.color}`}>
                          <span>{rango.emoji}</span> {rango.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-bold text-[var(--ts-text-primary)]">{cli.empresa || cli.contacto}</p>
                        {cli.empresa && cli.contacto && (
                          <p className="text-[10px] text-[var(--ts-text-muted)]">{cli.contacto}</p>
                        )}
                        {cli.rif_cedula && (
                          <p className="text-[10px] text-[var(--ts-text-muted)]">{cli.rif_cedula}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          cli.tipo === "tecnico" ? "bg-[var(--ts-red-subtle)] text-[var(--ts-red)]" : "bg-[var(--ts-bg)] text-[var(--ts-text-muted)]"
                        }`}>
                          {cli.tipo === "tecnico" ? "Técnico" : "Normal"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--ts-text-muted)] hidden lg:table-cell">
                        {cli.telefono || "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-extrabold ${cli.totalGastado > 0 ? "text-[var(--ts-text-primary)]" : "text-[var(--ts-text-muted)]"}`}>
                          {formatUSD(cli.totalGastado)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center hidden sm:table-cell">
                        <span className="text-sm font-bold text-[var(--ts-text-muted)]">{cli.cotizacionesTotal}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button className="text-[#d9d9d9] hover:text-[var(--ts-red)] transition-colors">
                          <Edit2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── DRAWER PERFIL DE CLIENTE ── */}
      {selectedId && clienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSelectedId(null); setEditMode(false); }}
          />

          {/* Panel */}
          <div className="w-full max-w-md bg-[var(--ts-surface)] h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Header del perfil */}
            {(() => {
              const rango = getRango(metricsSeleccionado!.totalGastado);
              return (
                <div className={`px-6 py-5 border-b border-[var(--ts-border)]`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${rango.color}`}>
                        {rango.emoji} {rango.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        clienteSeleccionado.tipo === "tecnico"
                          ? "bg-[var(--ts-red-subtle)] text-[var(--ts-red)]"
                          : "bg-[var(--ts-bg)] text-[var(--ts-text-muted)]"
                      }`}>
                        {clienteSeleccionado.tipo === "tecnico" ? "Técnico" : "Cliente Normal"}
                      </span>
                    </div>
                    <button onClick={() => { setSelectedId(null); setEditMode(false); }}>
                      <X className="w-5 h-5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]" />
                    </button>
                  </div>
                  <h2 className="text-xl font-extrabold text-[var(--ts-text-primary)]">
                    {clienteSeleccionado.empresa || clienteSeleccionado.contacto}
                  </h2>
                  {clienteSeleccionado.empresa && clienteSeleccionado.contacto && (
                    <p className="text-sm text-[var(--ts-text-muted)]">{clienteSeleccionado.contacto}</p>
                  )}
                </div>
              );
            })()}

            {/* Métricas rápidas */}
            <div className="grid grid-cols-3 divide-x divide-[#e5e5e5] border-b border-[var(--ts-border)]">
              <div className="p-4 text-center">
                <p className="text-lg font-extrabold text-[var(--ts-red)]">{formatUSD(metricsSeleccionado!.totalGastado)}</p>
                <p className="text-[10px] text-[var(--ts-text-muted)] font-medium">Total Facturado</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-lg font-extrabold text-[var(--ts-text-primary)]">{metricsSeleccionado!.cotizacionesTotal}</p>
                <p className="text-[10px] text-[var(--ts-text-muted)] font-medium">Cotizaciones</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-lg font-extrabold text-[var(--ts-text-primary)]">
                  {metricsSeleccionado!.ultima ? formatFecha(metricsSeleccionado!.ultima) : "—"}
                </p>
                <p className="text-[10px] text-[var(--ts-text-muted)] font-medium">Última</p>
              </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 p-5 space-y-6">

              {/* ── Datos del Cliente ── */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-wide">Datos del Cliente</h3>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ts-red)] hover:underline"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditMode(false)}
                        className="text-xs text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1 text-xs font-bold text-[var(--ts-text-primary)] bg-[var(--ts-red)] px-3 py-1 rounded-lg"
                      >
                        {saving ? "..." : <><Save className="w-3 h-3" /> Guardar</>}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Empresa",     key: "empresa",    icon: null },
                    { label: "Contacto",    key: "contacto",   icon: null },
                    { label: "RIF / Cédula",key: "rif_cedula", icon: null },
                    { label: "Teléfono",    key: "telefono",   icon: Phone },
                    { label: "Email",       key: "email",      icon: Mail },
                    { label: "Dirección",   key: "direccion",  icon: MapPin },
                  ].map(({ label, key, icon: Icon }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] mb-0.5">{label}</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={form[key] || ""}
                          onChange={e => setForm({ ...form, [key]: e.target.value })}
                          className="w-full px-3 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)]"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-3.5 h-3.5 text-[var(--ts-text-muted)] shrink-0" />}
                          <p className="text-sm text-[var(--ts-text-primary)]">{clienteSeleccionado[key] || <span className="text-[#c0c0c0]">—</span>}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Tipo */}
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] mb-0.5">Tipo de Cliente</label>
                    {editMode ? (
                      <select
                        value={form.tipo || "cliente_normal"}
                        onChange={e => setForm({ ...form, tipo: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)] bg-[var(--ts-surface)]"
                      >
                        <option value="cliente_normal">Cliente Normal</option>
                        <option value="tecnico">Técnico (precio especial)</option>
                      </select>
                    ) : (
                      <p className="text-sm text-[var(--ts-text-primary)]">
                        {clienteSeleccionado.tipo === "tecnico" ? "🔧 Técnico" : "👤 Cliente Normal"}
                      </p>
                    )}
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] mb-0.5">Notas</label>
                    {editMode ? (
                      <textarea
                        value={form.notas || ""}
                        onChange={e => setForm({ ...form, notas: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)] resize-none"
                      />
                    ) : (
                      <p className="text-sm text-[var(--ts-text-primary)]">{clienteSeleccionado.notas || <span className="text-[#c0c0c0]">Sin notas</span>}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Historial de Cotizaciones ── */}
              <div>
                <h3 className="text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Historial de Cotizaciones ({cotsSeleccionado.length})
                </h3>

                {cotsSeleccionado.length === 0 ? (
                  <p className="text-xs text-[var(--ts-text-muted)] italic">Sin cotizaciones registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {cotsSeleccionado.map(cot => {
                      const ESTADO_COLOR: Record<string, string> = {
                        borrador:  "bg-gray-100 text-gray-700",
                        pendiente: "bg-gray-100 text-gray-700",
                        enviada:   "bg-blue-100 text-blue-700",
                        aprobada:  "bg-emerald-100 text-emerald-700",
                        facturada: "bg-purple-100 text-purple-700",
                        rechazada: "bg-red-100 text-red-700",
                        vencida:   "bg-orange-100 text-orange-700",
                      };
                      return (
                        <div key={cot.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-[var(--ts-border-2)] hover:bg-[var(--ts-surface-2)]">
                          <div>
                            <p className="text-xs font-bold text-[var(--ts-red)]">{cot.numero_cotizacion}</p>
                            <p className="text-[10px] text-[var(--ts-text-muted)]">{formatFecha(cot.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_COLOR[cot.estado] || "bg-gray-100"}`}>
                              {cot.estado}
                            </span>
                            <span className="text-sm font-bold text-[var(--ts-text-primary)]">{formatUSD(Number(cot.total))}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Acciones de contacto */}
            {(clienteSeleccionado.telefono || clienteSeleccionado.email) && (
              <div className="p-5 border-t border-[var(--ts-border)] flex gap-3">
                {clienteSeleccionado.telefono && (
                  <a
                    href={`https://wa.me/${clienteSeleccionado.telefono.replace(/\D/g, "")}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-green-600 text-[var(--ts-text-primary)] text-sm font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <Phone className="w-4 h-4" /> WhatsApp
                  </a>
                )}
                {clienteSeleccionado.email && (
                  <a
                    href={`mailto:${clienteSeleccionado.email}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-[var(--ts-bg)] hover:bg-[var(--ts-border)] text-[var(--ts-text-primary)] text-sm font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Email
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
