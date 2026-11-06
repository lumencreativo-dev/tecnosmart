"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Mail,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Cloud,
} from "lucide-react";
import {
  obtenerPoolAlias,
  agregarCorreosAlPool,
  liberarAlias,
  eliminarAlias,
  StarlinkEmailAlias,
} from "@/lib/starlinkEmailPool";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPoolUpdated?: () => void;
}

export default function StarlinkEmailPoolModal({ isOpen, onClose, onPoolUpdated }: Props) {
  const [tab, setTab] = useState<"inventario" | "cargar">("inventario");
  const [pool, setPool] = useState<StarlinkEmailAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "local">("local");

  // Filtros de inventario
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "disponible" | "asignado">("todos");
  const [busqueda, setBusqueda] = useState("");

  // Estado del formulario de carga
  const [textoCorreos, setTextoCorreos] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<{ agregados: number; duplicados: number } | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Generador de correlativos rápido
  const [genPrefijo, setGenPrefijo] = useState("starlink.");
  const [genDesde, setGenDesde] = useState(302);
  const [genHasta, setGenHasta] = useState(310);
  const [genDominio, setGenDominio] = useState("@somostecnosmart.com");

  // Feedback de copiado de script SQL
  const [copiadoSQL, setCopiadoSQL] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    const res = await obtenerPoolAlias();
    setPool(res.pool);
    setSource(res.source);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
      setResultadoCarga(null);
      setErrorCarga(null);
    }
  }, [isOpen]);

  // Suscripciones filtradas
  const poolFiltrado = useMemo(() => {
    return pool.filter((item) => {
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const emailMatch = item.email.toLowerCase().includes(q);
        const clienteMatch = item.cliente_nombre?.toLowerCase().includes(q) || false;
        const serialMatch = item.kit_serial?.toLowerCase().includes(q) || false;
        return emailMatch || clienteMatch || serialMatch;
      }
      return true;
    });
  }, [pool, filtroEstado, busqueda]);

  const disponiblesCount = pool.filter((p) => p.estado === "disponible").length;
  const asignadosCount = pool.filter((p) => p.estado === "asignado").length;

  // Manejar generador rápido
  const handleGenerarCorrelativos = () => {
    const list: string[] = [];
    const min = Math.min(genDesde, genHasta);
    const max = Math.max(genDesde, genHasta);
    for (let i = min; i <= max; i++) {
      list.push(`${genPrefijo}${i}${genDominio}`);
    }
    setTextoCorreos(list.join("\n"));
  };

  // Manejar guardado de correos
  const handleGuardarCorreos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoCorreos.trim()) return;

    setGuardando(true);
    setErrorCarga(null);
    setResultadoCarga(null);

    const res = await agregarCorreosAlPool(textoCorreos);
    if (res.error && res.agregados === 0) {
      setErrorCarga(res.error);
    } else {
      setResultadoCarga({ agregados: res.agregados, duplicados: res.duplicados });
      setTextoCorreos("");
      await cargarDatos();
      onPoolUpdated?.();
      setTimeout(() => {
        setTab("inventario");
        setResultadoCarga(null);
      }, 1600);
    }
    setGuardando(false);
  };

  // Liberar alias
  const handleLiberar = async (id: string, email: string) => {
    if (!confirm(`¿Deseas liberar el correo ${email} para que esté disponible para otro cliente?`)) return;
    await liberarAlias(id, email);
    await cargarDatos();
    onPoolUpdated?.();
  };

  // Eliminar alias
  const handleEliminar = async (id: string, email: string) => {
    if (!confirm(`¿Eliminar permanentemente ${email} del pool?`)) return;
    await eliminarAlias(id, email);
    await cargarDatos();
    onPoolUpdated?.();
  };

  const handleCopiarSQL = () => {
    const sql = `-- Ejecutar en Supabase SQL Editor:
create table if not exists public.starlink_email_pool (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  estado text not null default 'disponible',
  cliente_nombre text,
  kit_serial text,
  suscripcion_id uuid,
  notas text,
  fecha_asignacion timestamptz,
  created_at timestamptz default now()
);
alter table public.starlink_email_pool enable row level security;
create policy "Permitir todo a anon y auth" on public.starlink_email_pool for all to anon, authenticated using (true) with check (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiadoSQL(true);
    setTimeout(() => setCopiadoSQL(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[var(--ts-text-primary)]">
                  Pool de Alias Cloudflare Starlink
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {disponiblesCount} Disponibles
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-300 border border-gray-500/30">
                  {asignadosCount} Asignados
                </span>
              </div>
              <p className="text-xs text-[var(--ts-text-muted)]">
                Gestiona los correos creados en Cloudflare para su asignación con 1 clic en el Cockpit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[var(--ts-surface)] text-[var(--ts-text-muted)] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de pestañas */}
        <div className="px-6 pt-3 border-b border-[var(--ts-border)] flex items-center gap-4 bg-[var(--ts-surface)]">
          <button
            onClick={() => setTab("inventario")}
            className={`pb-3 text-xs font-bold transition-all relative ${
              tab === "inventario"
                ? "text-white border-b-2 border-[var(--ts-red)]"
                : "text-[var(--ts-text-muted)] hover:text-white"
            }`}
          >
            📋 Inventario del Pool ({pool.length})
          </button>
          <button
            onClick={() => setTab("cargar")}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              tab === "cargar"
                ? "text-white border-b-2 border-[var(--ts-red)]"
                : "text-[var(--ts-text-muted)] hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cargar Nuevos Correos</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === "inventario" ? (
            <div className="space-y-4">
              {/* Filtros y Buscador */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-1.5 bg-[var(--ts-surface-2)] p-1 rounded-xl border border-[var(--ts-border)] w-full sm:w-auto">
                  <button
                    onClick={() => setFiltroEstado("todos")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      filtroEstado === "todos"
                        ? "bg-[var(--ts-surface)] text-white shadow-sm"
                        : "text-[var(--ts-text-muted)] hover:text-white"
                    }`}
                  >
                    Todos ({pool.length})
                  </button>
                  <button
                    onClick={() => setFiltroEstado("disponible")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      filtroEstado === "disponible"
                        ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                        : "text-[var(--ts-text-muted)] hover:text-emerald-400"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Disponibles ({disponiblesCount})
                  </button>
                  <button
                    onClick={() => setFiltroEstado("asignado")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      filtroEstado === "asignado"
                        ? "bg-slate-700 text-white"
                        : "text-[var(--ts-text-muted)] hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Asignados ({asignadosCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[var(--ts-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por correo o cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--ts-red)] placeholder-[var(--ts-text-muted)]"
                  />
                </div>
              </div>

              {/* Tabla de correos */}
              <div className="border border-[var(--ts-border)] rounded-2xl overflow-hidden bg-[var(--ts-surface)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--ts-surface-2)] text-[10px] font-bold uppercase text-[var(--ts-text-muted)] border-b border-[var(--ts-border)]">
                    <tr>
                      <th className="px-4 py-3">Alias / Correo Cloudflare</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3">Cliente / Antena Asignada</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)]">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[var(--ts-text-muted)]">
                          Cargando inventario de correos...
                        </td>
                      </tr>
                    ) : poolFiltrado.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[var(--ts-text-muted)]">
                          <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="font-bold text-white">No hay correos en esta vista</p>
                          <p className="text-[11px] mt-1">
                            Ve a la pestaña <strong>"Cargar Nuevos Correos"</strong> para agregar los que creaste en Cloudflare.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      poolFiltrado.map((item) => {
                        const isDisp = item.estado === "disponible";
                        return (
                          <tr key={item.id} className="hover:bg-[var(--ts-surface-2)]/50 transition-colors">
                            {/* Email */}
                            <td className="px-4 py-3 align-middle font-mono font-bold">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isDisp ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                                <span className={isDisp ? "text-emerald-300" : "text-gray-300"}>
                                  {item.email}
                                </span>
                              </div>
                            </td>

                            {/* Estado */}
                            <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  isDisp
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                                }`}
                              >
                                {isDisp ? "DISPONIBLE" : "ASIGNADO"}
                              </span>
                            </td>

                            {/* Asignado a */}
                            <td className="px-4 py-3 align-middle">
                              {item.cliente_nombre ? (
                                <div>
                                  <span className="font-bold text-white block">{item.cliente_nombre}</span>
                                  {item.kit_serial && (
                                    <span className="text-[10px] font-mono text-emerald-400">
                                      KIT: {item.kit_serial}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[var(--ts-text-muted)] italic">Sin asignar (Listo)</span>
                              )}
                            </td>

                            {/* Acciones */}
                            <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isDisp && (
                                  <button
                                    onClick={() => handleLiberar(item.id, item.email)}
                                    className="px-2 py-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors flex items-center gap-1"
                                    title="Liberar este correo para que quede disponible para otro cliente"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Liberar</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEliminar(item.id, item.email)}
                                  className="p-1 text-[var(--ts-text-muted)] hover:text-red-400 rounded-lg transition-colors"
                                  title="Eliminar del pool"
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
          ) : (
            <div className="space-y-5 max-w-2xl mx-auto">
              {/* Asistente Rápido de Correlativos */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white">
                    Generador Rápido de Correlativos Cloudflare
                  </h3>
                </div>
                <p className="text-[11px] text-blue-200">
                  Configura el rango numérico que creaste en Cloudflare para autocompletar la lista con 1 clic:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-[var(--ts-text-muted)] mb-1 font-bold">Prefijo</label>
                    <input
                      type="text"
                      value={genPrefijo}
                      onChange={(e) => setGenPrefijo(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--ts-text-muted)] mb-1 font-bold">Desde</label>
                    <input
                      type="number"
                      value={genDesde}
                      onChange={(e) => setGenDesde(parseInt(e.target.value) || 0)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-white text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--ts-text-muted)] mb-1 font-bold">Hasta</label>
                    <input
                      type="number"
                      value={genHasta}
                      onChange={(e) => setGenHasta(parseInt(e.target.value) || 0)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-white text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--ts-text-muted)] mb-1 font-bold">Dominio</label>
                    <input
                      type="text"
                      value={genDominio}
                      onChange={(e) => setGenDominio(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerarCorrelativos}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Rango ({genDesde} al {genHasta})</span>
                </button>
              </div>

              {/* Formulario de Carga */}
              <form onSubmit={handleGuardarCorreos} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Correos a Agregar al Pool:
                  </label>
                  <textarea
                    rows={7}
                    required
                    value={textoCorreos}
                    onChange={(e) => setTextoCorreos(e.target.value)}
                    placeholder="Pega aquí los correos (uno por línea o separados por coma):&#10;starlink.302@somostecnosmart.com&#10;starlink.303@somostecnosmart.com&#10;starlink.304@somostecnosmart.com"
                    className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-2xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[var(--ts-red)] resize-none"
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">
                    El sistema ignorará automáticamente correos duplicados o que ya existan en la base de datos.
                  </p>
                </div>

                {errorCarga && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorCarga}</span>
                  </div>
                )}

                {resultadoCarga && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      ¡Excelente! Se agregaron <strong>{resultadoCarga.agregados}</strong> correos disponibles al pool.
                      {resultadoCarga.duplicados > 0 && ` (${resultadoCarga.duplicados} ya existían y fueron ignorados).`}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTab("inventario")}
                    className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] rounded-xl"
                  >
                    Volver al Inventario
                  </button>
                  <button
                    type="submit"
                    disabled={guardando || !textoCorreos.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{guardando ? "Guardando..." : "Guardar Correos en el Pool"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Informativo */}
        <div className="px-6 py-3 border-t border-[var(--ts-border)] bg-[var(--ts-surface-2)] flex items-center justify-between text-[11px] text-[var(--ts-text-muted)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              Todos estos alias reenvían al buzón maestro <strong>tecnosmarvzl@gmail.com</strong> vía Cloudflare.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
