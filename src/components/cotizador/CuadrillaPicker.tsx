// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/CuadrillaPicker.tsx
// Asignación de cuadrilla técnica a una orden de trabajo — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";
import { HardHat, Users, X, CheckCircle2, Loader2, Search, Star, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";

interface Tecnico {
  id: string;
  nombre: string;
  email: string;
  avatar_url: string | null;
  rol_id: string;
  roles?: { nombre: string; color: string };
}

interface OrdenResumen {
  id: string;
  numero: string;
  tipo_servicio: string;
  tecnico_lider_id: string | null;
  ayudantes: string[] | null;
}

export default function CuadrillaPicker({
  orden,
  onClose,
}: {
  orden: OrdenResumen;
  onClose: () => void;
}) {
  const { usuario } = useUsuario();
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [lider, setLider] = useState<string>(orden.tecnico_lider_id || "");
  const [ayudantes, setAyudantes] = useState<string[]>(orden.ayudantes || []);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("perfiles")
      .select("id, nombre, email, avatar_url, rol_id, roles(nombre, color)")
      .eq("estado", "activo")
      .order("nombre")
      .then(({ data }) => {
        if (data) setTecnicos(data as unknown as Tecnico[]);
      });
  }, []);

  const tecnicosFiltrados = tecnicos.filter(t =>
    !query || t.nombre.toLowerCase().includes(query.toLowerCase()) || t.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggleAyudante = (id: string) => {
    if (id === lider) return; // El líder no puede ser ayudante
    setAyudantes(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const guardar = async () => {
    setSaving(true);
    await supabase
      .from("ordenes_trabajo")
      .update({
        tecnico_lider_id: lider || null,
        ayudantes: ayudantes.length > 0 ? ayudantes : null,
        estado: lider ? "programado" : "pendiente",
      })
      .eq("id", orden.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const TecnicoRow = ({ t }: { t: Tecnico }) => {
    const esLider = lider === t.id;
    const esAyudante = ayudantes.includes(t.id);

    return (
      <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
        esLider ? "border-[var(--ts-red)] bg-red-50 dark:bg-red-900/10"
        : esAyudante ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10"
        : "ts-border hover:bg-[var(--ts-surface-2)]"
      }`}>
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--ts-surface-2)] border ts-border shrink-0 flex items-center justify-center text-sm font-bold ts-text-muted">
          {t.avatar_url ? (
            <img src={t.avatar_url} alt={t.nombre} className="w-full h-full object-cover" />
          ) : (
            t.nombre.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold ts-text truncate">{t.nombre}</p>
            {esLider && <Star className="w-3 h-3 text-[var(--ts-red)] shrink-0" aria-label="Técnico Líder" />}
          </div>
          <p className="text-xs ts-text-muted truncate">{t.roles?.nombre || t.rol_id}</p>
        </div>

        {/* Botones acción */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              if (esLider) { setLider(""); }
              else {
                setLider(t.id);
                setAyudantes(prev => prev.filter(a => a !== t.id));
              }
            }}
            title="Asignar como Técnico Líder"
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
              esLider
                ? "bg-[var(--ts-red)] text-white"
                : "border ts-border ts-text-muted hover:border-[var(--ts-red)] hover:text-[var(--ts-red)]"
            }`}
          >
            <Star className="w-3 h-3" />
            {esLider ? "Líder" : "Líder"}
          </button>

          <button
            onClick={() => toggleAyudante(t.id)}
            disabled={esLider}
            title="Agregar como Ayudante"
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors disabled:opacity-30 ${
              esAyudante
                ? "bg-blue-600 text-white"
                : "border ts-border ts-text-muted hover:border-blue-500 hover:text-blue-500"
            }`}
          >
            <Users className="w-3 h-3" />
            {esAyudante ? "Ayudante" : "Ayudante"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="ts-surface rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b ts-border">
          <div>
            <h2 className="text-base font-black ts-text flex items-center gap-2">
              <HardHat className="w-4 h-4 text-[var(--ts-red)]" /> Asignar Cuadrilla
            </h2>
            <p className="text-xs ts-text-muted">{orden.numero} — {orden.tipo_servicio}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen actual */}
        {(lider || ayudantes.length > 0) && (
          <div className="px-5 py-3 border-b ts-border bg-[var(--ts-surface-2)]">
            <p className="text-xs font-bold ts-text-muted uppercase mb-2">Cuadrilla Asignada</p>
            <div className="flex flex-wrap gap-2">
              {lider && (
                <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-[var(--ts-red)]/10 text-[var(--ts-red)] border border-[var(--ts-red)]/30">
                  <Star className="w-3 h-3" />
                  {tecnicos.find(t => t.id === lider)?.nombre || "Líder"}
                </div>
              )}
              {ayudantes.map(id => (
                <div key={id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-900/30">
                  <Users className="w-3 h-3" />
                  {tecnicos.find(t => t.id === id)?.nombre || "Ayudante"}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="p-4 border-b ts-border">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ts-text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar técnico por nombre..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
            />
          </div>
        </div>

        {/* Lista de técnicos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs ts-text-muted mb-2">
            Selecciona 1 Técnico Líder (estrella) y los ayudantes que participarán
          </p>
          {tecnicosFiltrados.map(t => <TecnicoRow key={t.id} t={t} />)}
          {tecnicosFiltrados.length === 0 && (
            <p className="text-xs ts-text-muted text-center py-8">Sin resultados</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-5 border-t ts-border">
          <p className="text-xs ts-text-muted">
            {ayudantes.length + (lider ? 1 : 0)} persona{ayudantes.length + (lider ? 1 : 0) !== 1 ? "s" : ""} en cuadrilla
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs px-3 py-2 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)]">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={saving || !lider}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-[var(--ts-red)] text-white hover:bg-red-700 disabled:opacity-40 transition-colors font-bold"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
               : saved  ? <CheckCircle2 className="w-3.5 h-3.5" />
               : <UserCheck className="w-3.5 h-3.5" />}
              {saved ? "¡Guardado!" : "Confirmar Cuadrilla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
