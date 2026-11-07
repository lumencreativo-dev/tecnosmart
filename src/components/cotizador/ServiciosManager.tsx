"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Wrench, Plus, Search, Filter, Edit3, Trash2, Check, X,
  RefreshCw, AlertCircle, Sparkles, Layers, DollarSign,
  Tag, ArrowRight, ShieldCheck, CheckCircle2
} from "lucide-react";
import {
  cargarServicios, upsertServicio, eliminarServicio,
  restaurarServiciosPredeterminados, SERVICIOS_PREDETERMINADOS
} from "@/lib/supabase/servicios";
import type { ServicioManoObra } from "@/lib/types";
import { formatUSD } from "@/lib/utils";

const UNIDADES_SUGERIDAS = [
  "punto",
  "metro",
  "equipo",
  "global",
  "día",
  "hora",
  "mes",
  "unidad",
];

const CATEGORIAS_SUGERIDAS = [
  "Instalación",
  "Cableado",
  "Configuración",
  "Mantenimiento",
  "Logística",
  "Starlink",
  "Redes y Fibra",
  "Seguridad Electrónica",
  "Otros"
];

const CAT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Instalación:    { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30" },
  Cableado:       { text: "text-slate-300",   bg: "bg-slate-500/10",   border: "border-slate-500/30" },
  Configuración:  { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30" },
  Mantenimiento:  { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30" },
  Logística:      { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  Starlink:       { text: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30" },
  "Redes y Fibra":{ text: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/30" },
};

export default function ServiciosManager() {
  const [servicios, setServicios] = useState<ServicioManoObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");

  // Edición rápida inline
  const [preciosEditados, setPreciosEditados] = useState<Record<string, { base?: number; tecnico?: number }>>({});
  const [guardandoInline, setGuardandoInline] = useState<string | null>(null);

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioManoObra | null>(null);
  const [savingModal, setSavingModal] = useState(false);

  // Modal Confirmar Eliminar
  const [deleteConfirm, setDeleteConfirm] = useState<ServicioManoObra | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Mensaje de éxito temporal
  const [avisoExito, setAvisoExito] = useState<string | null>(null);

  // Formulario Modal
  const [formCodigo, setFormCodigo] = useState("");
  const [formConcepto, setFormConcepto] = useState("");
  const [formCategoria, setFormCategoria] = useState("Instalación");
  const [formCategoriaCustom, setFormCategoriaCustom] = useState("");
  const [formUnidad, setFormUnidad] = useState("punto");
  const [formPrecioBase, setFormPrecioBase] = useState<number>(0);
  const [formPrecioMax, setFormPrecioMax] = useState<number>(0);
  const [formPrecioTecnico, setFormPrecioTecnico] = useState<number>(0);
  const [formDetalles, setFormDetalles] = useState("");

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await cargarServicios(false);
      setServicios(data);
    } catch (err) {
      console.error("Error cargando servicios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const notificar = (msg: string) => {
    setAvisoExito(msg);
    setTimeout(() => setAvisoExito(null), 4000);
  };

  // Categorías presentes en los servicios actuales
  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>();
    servicios.forEach(s => { if (s.categoria) set.add(s.categoria); });
    CATEGORIAS_SUGERIDAS.forEach(c => set.add(c));
    return Array.from(set);
  }, [servicios]);

  // Filtrado
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(s => {
      const matchCat = filtroCategoria === "TODAS" || s.categoria?.toUpperCase() === filtroCategoria.toUpperCase();
      const q = busqueda.trim().toLowerCase();
      const matchQ = !q ||
        s.concepto.toLowerCase().includes(q) ||
        s.codigo.toLowerCase().includes(q) ||
        (s.categoria || "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [servicios, filtroCategoria, busqueda]);

  // Métricas
  const kpis = useMemo(() => {
    const total = servicios.length;
    const activos = servicios.filter(s => s.activo !== false).length;
    const promedioBase = total > 0 ? servicios.reduce((acc, s) => acc + (s.precio_base || 0), 0) / total : 0;
    const conTarifaTecnico = servicios.filter(s => (s.precio_tecnico || 0) > 0).length;
    return { total, activos, promedioBase, conTarifaTecnico };
  }, [servicios]);

  // Guardar cambio inline de precio base o técnico
  const handleGuardarInline = async (s: ServicioManoObra) => {
    const edicion = preciosEditados[s.id];
    if (!edicion) return;

    setGuardandoInline(s.id);
    try {
      const nuevoBase = edicion.base !== undefined ? edicion.base : s.precio_base;
      const nuevoTecnico = edicion.tecnico !== undefined ? edicion.tecnico : s.precio_tecnico;

      const actualizado = await upsertServicio({
        ...s,
        precio_base: nuevoBase,
        precio_tecnico: nuevoTecnico,
        precio_max: s.precio_max && s.precio_max < nuevoBase ? nuevoBase : s.precio_max
      });

      setServicios(prev => prev.map(item => item.id === s.id ? actualizado : item));
      setPreciosEditados(prev => {
        const copy = { ...prev };
        delete copy[s.id];
        return copy;
      });
      notificar(`✓ Tarifa de "${s.concepto}" actualizada.`);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la tarifa.");
    } finally {
      setGuardandoInline(null);
    }
  };

  // Abrir Modal para Crear
  const abrirCrear = () => {
    setEditingServicio(null);
    setFormCodigo("");
    setFormConcepto("");
    setFormCategoria("Instalación");
    setFormCategoriaCustom("");
    setFormUnidad("punto");
    setFormPrecioBase(0);
    setFormPrecioMax(0);
    setFormPrecioTecnico(0);
    setFormDetalles("");
    setModalOpen(true);
  };

  // Abrir Modal para Editar
  const abrirEditar = (s: ServicioManoObra) => {
    setEditingServicio(s);
    setFormCodigo(s.codigo);
    setFormConcepto(s.concepto);
    if (CATEGORIAS_SUGERIDAS.includes(s.categoria || "")) {
      setFormCategoria(s.categoria || "Instalación");
      setFormCategoriaCustom("");
    } else {
      setFormCategoria("OTRA");
      setFormCategoriaCustom(s.categoria || "");
    }
    setFormUnidad(s.unidad || "punto");
    setFormPrecioBase(s.precio_base || 0);
    setFormPrecioMax(s.precio_max || s.precio_base || 0);
    setFormPrecioTecnico(s.precio_tecnico || 0);
    setFormDetalles(s.detalles || "");
    setModalOpen(true);
  };

  // Autogenerar código sugerido
  const sugerirCodigo = () => {
    const cat = formCategoria === "OTRA" ? formCategoriaCustom : formCategoria;
    const prefijos: Record<string, string> = {
      Instalación: "INS",
      Cableado: "CAB",
      Configuración: "CFG",
      Mantenimiento: "MTO",
      Logística: "LOG",
      Starlink: "SL",
      "Redes y Fibra": "RED",
      "Seguridad Electrónica": "SEC",
    };
    const prefix = prefijos[cat] || "SRV";
    const rand = Math.floor(100 + Math.random() * 900);
    setFormCodigo(`${prefix}-${rand}`);
  };

  // Guardar Modal
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConcepto.trim()) {
      alert("Por favor indica el nombre o concepto del servicio.");
      return;
    }

    const catFinal = formCategoria === "OTRA"
      ? (formCategoriaCustom.trim() || "General")
      : formCategoria;

    let codFinal = formCodigo.trim().toUpperCase();
    if (!codFinal) {
      codFinal = `SRV-${Date.now().toString().slice(-4)}`;
    }

    setSavingModal(true);
    try {
      const payload: Partial<ServicioManoObra> & { concepto: string; precio_base: number } = {
        id: editingServicio?.id,
        codigo: codFinal,
        concepto: formConcepto.trim(),
        categoria: catFinal,
        unidad: formUnidad.trim(),
        precio_base: Number(formPrecioBase) || 0,
        precio_max: Number(formPrecioMax) || Number(formPrecioBase) || 0,
        precio_tecnico: Number(formPrecioTecnico) || undefined,
        detalles: formDetalles.trim(),
        activo: editingServicio ? editingServicio.activo : true,
      };

      const guardado = await upsertServicio(payload);

      if (editingServicio) {
        setServicios(prev => prev.map(s => s.id === guardado.id ? guardado : s));
        notificar(`✓ Servicio "${guardado.concepto}" actualizado.`);
      } else {
        setServicios(prev => [guardado, ...prev]);
        notificar(`✓ Nuevo servicio "${guardado.concepto}" añadido al catálogo.`);
      }

      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(`Error guardando servicio: ${err.message || "Error desconocido"}`);
    } finally {
      setSavingModal(false);
    }
  };

  // Eliminar
  const handleConfirmarEliminar = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await eliminarServicio(deleteConfirm.id);
      setServicios(prev => prev.filter(s => s.id !== deleteConfirm.id));
      notificar(`✓ Servicio "${deleteConfirm.concepto}" eliminado.`);
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el servicio.");
    } finally {
      setDeleting(false);
    }
  };

  // Restaurar Predeterminados
  const handleRestaurar = async () => {
    if (!confirm("¿Deseas recargar la lista de los 15 servicios estándar iniciales de TecnoSmart?")) return;
    setLoading(true);
    try {
      const res = await restaurarServiciosPredeterminados();
      setServicios(res);
      notificar("✓ Servicios predeterminados restablecidos exitosamente.");
    } catch (e) {
      console.error(e);
      alert("Error restableciendo servicios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── ENCABEZADO PRINCIPAL ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--ts-surface)] border border-[var(--ts-border)] p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-[var(--ts-red)]/15 text-[var(--ts-red)] rounded-xl">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-[var(--ts-text-primary)]">
              Servicios & Mano de Obra
            </h1>
          </div>
          <p className="text-xs text-[var(--ts-text-muted)] max-w-2xl leading-relaxed">
            Administra las tarifas de instalación, cableado, mantenimiento y viáticos. Todos los cambios que hagas aquí se conectan y reflejan automáticamente en el Cotizador y en Facturación.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRestaurar}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl transition-all"
            title="Cargar los 15 servicios estándar predeterminados de TecnoSmart"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Iniciales</span>
          </button>

          <button
            type="button"
            onClick={abrirCrear}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[var(--ts-red)] hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* AVISO DE ÉXITO */}
      {avisoExito && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{avisoExito}</span>
        </div>
      )}

      {/* ── KPIS RÁPIDOS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--ts-surface)] border border-[var(--ts-border)]">
          <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Total Servicios</p>
          <p className="text-2xl font-black text-white mt-1">{kpis.total}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">{kpis.activos} activos para cotizar</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ts-surface)] border border-[var(--ts-border)]">
          <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Categorías</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{categoriasDisponibles.length}</p>
          <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Especialidades operativas</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ts-surface)] border border-[var(--ts-border)]">
          <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Tarifa Base Promedio</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatUSD(kpis.promedioBase)}</p>
          <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">PVP referencial</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ts-surface)] border border-[var(--ts-border)]">
          <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Tarifas Técnicos</p>
          <p className="text-2xl font-black text-purple-400 mt-1">{kpis.conTarifaTecnico}</p>
          <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Precios aliados configurados</p>
        </div>
      </div>

      {/* ── FILTROS Y BÚSQUEDA ── */}
      <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por concepto, código o categoría..."
            className="w-full pl-9 pr-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-xs text-white placeholder-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)]"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--ts-text-muted)] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro Categoría */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[var(--ts-text-muted)] shrink-0" />
          <button
            type="button"
            onClick={() => setFiltroCategoria("TODAS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filtroCategoria === "TODAS"
                ? "bg-[var(--ts-red)] text-white shadow-sm"
                : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] hover:text-white"
            }`}
          >
            Todas ({servicios.length})
          </button>
          {categoriasDisponibles.map(c => {
            const count = servicios.filter(s => s.categoria?.toUpperCase() === c.toUpperCase()).length;
            if (count === 0) return null;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFiltroCategoria(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filtroCategoria.toUpperCase() === c.toUpperCase()
                    ? "bg-[var(--ts-red)] text-white shadow-sm"
                    : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] hover:text-white"
                }`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TABLA DE SERVICIOS ── */}
      <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] border-b border-[var(--ts-border)] uppercase text-[10px] tracking-wider font-extrabold">
              <tr>
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5 min-w-[260px]">Concepto / Servicio</th>
                <th className="p-3.5 text-center">Unidad</th>
                <th className="p-3.5 text-right whitespace-nowrap">Precio Base (PVP)</th>
                <th className="p-3.5 text-right whitespace-nowrap">Precio Técnico</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ts-border)] font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[var(--ts-text-muted)]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--ts-red)] mb-2" />
                    Cargando catálogo de servicios...
                  </td>
                </tr>
              ) : serviciosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[var(--ts-text-muted)]">
                    No se encontraron servicios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                serviciosFiltrados.map((s, idx) => {
                  const edicion = preciosEditados[s.id];
                  const hayCambios = edicion !== undefined && (
                    (edicion.base !== undefined && edicion.base !== s.precio_base) ||
                    (edicion.tecnico !== undefined && edicion.tecnico !== s.precio_tecnico)
                  );
                  const catStyle = CAT_COLORS[s.categoria || ""] || { text: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/30" };

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-[var(--ts-surface-2)]/60 transition-colors ${
                        idx % 2 === 0 ? "bg-[var(--ts-surface)]" : "bg-[var(--ts-surface)]/60"
                      }`}
                    >
                      {/* Código */}
                      <td className="p-3.5 font-mono font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--ts-surface-2)] text-white border border-[var(--ts-border)] text-[11px]">
                          {s.codigo}
                        </span>
                      </td>

                      {/* Categoría */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {s.categoria || "General"}
                        </span>
                      </td>

                      {/* Concepto */}
                      <td className="p-3.5">
                        <p className="font-bold text-white text-xs leading-snug">{s.concepto}</p>
                        {s.detalles && (
                          <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5 line-clamp-1">{s.detalles}</p>
                        )}
                      </td>

                      {/* Unidad */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="text-[11px] text-[var(--ts-text-muted)] font-mono bg-black/20 px-2 py-0.5 rounded">
                          por {s.unidad}
                        </span>
                      </td>

                      {/* Precio Base (con edición rápida inline) */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] text-[var(--ts-text-muted)] font-mono">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={edicion?.base !== undefined ? edicion.base : s.precio_base}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setPreciosEditados(prev => ({
                                ...prev,
                                [s.id]: { ...prev[s.id], base: val }
                              }));
                            }}
                            className={`w-20 text-right bg-[var(--ts-surface-2)] border rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-[var(--ts-red)] ${
                              edicion?.base !== undefined && edicion.base !== s.precio_base
                                ? "border-amber-500 bg-amber-500/10"
                                : "border-[var(--ts-border)]"
                            }`}
                          />
                        </div>
                      </td>

                      {/* Precio Técnico */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] text-[var(--ts-text-muted)] font-mono">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={edicion?.tecnico !== undefined ? edicion.tecnico : (s.precio_tecnico ?? s.precio_base)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setPreciosEditados(prev => ({
                                ...prev,
                                [s.id]: { ...prev[s.id], tecnico: val }
                              }));
                            }}
                            className={`w-20 text-right bg-[var(--ts-surface-2)] border rounded-lg px-2 py-1 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-[var(--ts-red)] ${
                              edicion?.tecnico !== undefined && edicion.tecnico !== s.precio_tecnico
                                ? "border-amber-500 bg-amber-500/10"
                                : "border-[var(--ts-border)]"
                            }`}
                          />
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          s.activo !== false
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.activo !== false ? "bg-emerald-400" : "bg-slate-400"}`} />
                          {s.activo !== false ? "ACTIVO" : "PAUSADO"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {hayCambios ? (
                            <button
                              type="button"
                              onClick={() => handleGuardarInline(s)}
                              disabled={guardandoInline === s.id}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                              title="Guardar cambios de tarifa"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => abrirEditar(s)}
                              className="p-1.5 rounded-lg text-[var(--ts-text-muted)] hover:text-white hover:bg-[var(--ts-surface-2)] border border-transparent hover:border-[var(--ts-border)] transition-all"
                              title="Editar servicio completo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(s)}
                            className="p-1.5 rounded-lg text-[var(--ts-text-muted)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL CREAR / EDITAR SERVICIO ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ts-border)]">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[var(--ts-red)]/15 text-[var(--ts-red)] rounded-xl">
                  <Wrench className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-white">
                  {editingServicio ? "Editar Servicio de Mano de Obra" : "Nuevo Servicio de Mano de Obra"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[var(--ts-text-muted)] hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              {/* Concepto / Nombre */}
              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-wider mb-1">
                  Concepto / Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder="Ej: Tendido de Fibra Óptica Aérea con Tensor"
                  className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              {/* Categoría y Código */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-wider mb-1">
                    Categoría
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                  >
                    {CATEGORIAS_SUGERIDAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="OTRA">+ Otra Categoría...</option>
                  </select>
                  {formCategoria === "OTRA" && (
                    <input
                      type="text"
                      placeholder="Escribe la nueva categoría..."
                      value={formCategoriaCustom}
                      onChange={(e) => setFormCategoriaCustom(e.target.value)}
                      className="mt-1.5 w-full bg-[var(--ts-surface-2)] border border-amber-500/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
                      Código SKU
                    </label>
                    <button
                      type="button"
                      onClick={sugerirCodigo}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Autogenerar
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: FIB-AER-M"
                    className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              {/* Unidad de Cobro */}
              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-wider mb-1">
                  Unidad de Cobro
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={formUnidad}
                    onChange={(e) => setFormUnidad(e.target.value)}
                    className="flex-1 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                  >
                    {UNIDADES_SUGERIDAS.map(u => (
                      <option key={u} value={u}>por {u}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="o personalizada..."
                    value={formUnidad}
                    onChange={(e) => setFormUnidad(e.target.value)}
                    className="w-36 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              {/* Tarifas */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-black/20 rounded-2xl border border-[var(--ts-border)]">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    Precio Base (PVP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ts-text-muted)] font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formPrecioBase || ""}
                      onChange={(e) => setFormPrecioBase(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
                    Precio Técnico (Aliado)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ts-text-muted)] font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPrecioTecnico || ""}
                      onChange={(e) => setFormPrecioTecnico(parseFloat(e.target.value) || 0)}
                      placeholder="Opcional"
                      className="w-full pl-7 pr-3 py-2 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-wider mb-1">
                  Detalles / Qué incluye (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formDetalles}
                  onChange={(e) => setFormDetalles(e.target.value)}
                  placeholder="Ej: Incluye fijación de herrajes y peinado de cables hasta 3 metros de altura."
                  className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--ts-red)] resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ts-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingModal}
                  className="px-5 py-2 text-xs font-bold text-white bg-[var(--ts-red)] hover:bg-red-700 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {savingModal ? "Guardando..." : editingServicio ? "Actualizar Servicio" : "Crear Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR ELIMINACIÓN ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--ts-surface)] border border-red-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-red-500/15 text-red-400 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">¿Eliminar este servicio?</h3>
                <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                  Esta acción quitará el servicio de la lista de selección activa.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[var(--ts-surface-2)] rounded-xl border border-[var(--ts-border)] text-xs">
              <p className="font-bold text-white">{deleteConfirm.concepto}</p>
              <p className="text-[10px] text-[var(--ts-text-muted)] font-mono mt-0.5">
                Código: {deleteConfirm.codigo} · PVP: {formatUSD(deleteConfirm.precio_base)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
