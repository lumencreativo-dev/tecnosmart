"use client";

import { useState, useEffect } from "react";
import {
  Users, Shield, UserPlus, Copy, Check, Plus, Trash2,
  Lock, Save, RefreshCw, AlertCircle, Sparkles, CheckCircle2,
  ToggleLeft, ToggleRight, Info, ExternalLink, Edit, KeyRound, Ban,
  TrendingUp, DollarSign, FileSpreadsheet, ShieldAlert, X, Activity, Mail
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { GRUPOS_PERMISOS, tienePermiso } from "@/lib/permissions";
import { useUsuario } from "@/hooks/useUsuario";

interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  es_sistema: boolean;
  permisos: string[];
}

interface Perfil {
  id: string;
  email: string;
  username?: string;
  nombre: string;
  telefono: string;
  direccion: string;
  cedula: string;
  rol_id: string;
  estado: string;
  roles?: Rol;
  created_at: string;
}

interface Invitacion {
  id: string;
  email: string;
  rol_id: string;
  token: string;
  usada: boolean;
  created_at: string;
  fecha_expiracion: string;
  roles?: Rol;
}

export default function EquipoManager() {
  const { usuario: usuarioActual, loading: cargandoUsuario } = useUsuario();
  const [tab, setTab] = useState<"miembros" | "roles">("miembros");
  const [loading, setLoading] = useState(true);

  // Estados de datos
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);

  // Estado para gestión de roles (estilo Discord)
  const [rolSeleccionado, setRolSeleccionado] = useState<Rol | null>(null);
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [rolExito, setRolExito] = useState(false);

  // Modal de Invitación
  const [modalInvitar, setModalInvitar] = useState(false);
  const [invitarEmail, setInvitarEmail] = useState("");
  const [invitarRolId, setInvitarRolId] = useState("vendedor");
  const [generandoInvitacion, setGenerandoInvitacion] = useState(false);
  const [invitacionGenerada, setInvitacionGenerada] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Modal para Nuevo Rol
  const [modalNuevoRol, setModalNuevoRol] = useState(false);
  const [nuevoRolNombre, setNuevoRolNombre] = useState("");
  const [nuevoRolDesc, setNuevoRolDesc] = useState("");
  const [nuevoRolColor, setNuevoRolColor] = useState("#c9242b");

  // Modal Editar Miembro
  const [miembroAEditar, setMiembroAEditar] = useState<Perfil | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editCedula, setEditCedula] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Modal Detalle / Rendimiento del Miembro (Super Admin)
  const [miembroSeleccionado, setMiembroSeleccionado] = useState<Perfil | null>(null);
  const [cargandoMetricas, setCargandoMetricas] = useState(false);
  const [metricasMiembro, setMetricasMiembro] = useState<{
    cotizacionesCount: number;
    facturasCount: number;
    montoTotalUSD: number;
  }>({ cotizacionesCount: 0, facturasCount: 0,  montoTotalUSD: 0 });
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Permisos y condición de Administrador
  const esAdminActual = usuarioActual?.rol_id === "admin" || (usuarioActual?.roles?.permisos || []).includes("*");
  const permisosUsuarioActivo = usuarioActual?.roles?.permisos || (esAdminActual ? ["*"] : []);

  // Cargar datos desde Supabase
  const cargarDatos = async () => {
    setLoading(true);

    const { data: rolesData } = await supabase.from("roles").select("*").order("created_at", { ascending: true });
    if (rolesData) {
      setRoles(rolesData);
      if (!rolSeleccionado && rolesData.length > 0) {
        setRolSeleccionado(rolesData[0]);
      } else if (rolSeleccionado) {
        const actualizado = rolesData.find((r) => r.id === rolSeleccionado.id);
        if (actualizado) setRolSeleccionado(actualizado);
      }
    }

    const { data: perfilesData } = await supabase.from("perfiles").select("*, roles(*)").order("created_at", { ascending: false });
    if (perfilesData) setPerfiles(perfilesData);

    const { data: invData } = await supabase.from("invitaciones").select("*, roles(*)").eq("usada", false).order("created_at", { ascending: false });
    if (invData) setInvitaciones(invData);

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ── ACCIÓN: GENERAR ENLACE MÁGICO DE INVITACIÓN ───────────
  const handleCrearInvitacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitarEmail.trim()) return;

    setGenerandoInvitacion(true);
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);

    const { error } = await supabase.from("invitaciones").insert([
      {
        email: invitarEmail.toLowerCase().trim(),
        rol_id: invitarRolId,
        token: token,
        usada: false,
      },
    ]);

    setGenerandoInvitacion(false);

    if (!error) {
      const baseUrl = window.location.origin;
      const urlFinal = `${baseUrl}/registro?token=${token}`;
      setInvitacionGenerada(urlFinal);
      cargarDatos();
    } else {
      alert("Error al generar invitación: " + error.message);
    }
  };

  const copiarEnlace = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // ── ACCIÓN: INSPECCIONAR MIEMBRO Y SUS MÉTRICAS (SUPER ADMIN) ──
  const handleInspeccionarMiembro = async (m: Perfil) => {
    setMiembroSeleccionado(m);
    setResetMsg(null);
    setCargandoMetricas(true);

    try {
      // Buscar cotizaciones asociadas a su id o usuario
      const { data: cotizaciones } = await supabase
        .from("cotizaciones")
        .select("id, total, status")
        .or(`creado_por.eq.${m.id},vendedor.eq.${m.nombre}`);

      // Buscar facturas asociadas
      const { data: facturas } = await supabase
        .from("facturas")
        .select("id, total, status")
        .or(`creado_por.eq.${m.id},vendedor.eq.${m.nombre}`);

      const totalCot = cotizaciones?.length || 0;
      const totalFac = facturas?.length || 0;
      const montoTotal = (facturas || []).reduce((acc: number, f: any) => acc + (Number(f.total) || 0), 0);

      setMetricasMiembro({
        cotizacionesCount: totalCot,
        facturasCount: totalFac,
        montoTotalUSD: montoTotal,
      });
    } catch (e) {
      console.error("Error al cargar métricas de usuario:", e);
    } finally {
      setCargandoMetricas(false);
    }
  };

  // ── ACCIÓN: ENVIAR ENLACE DE RECUPERACIÓN DE CLAVE (SUPER ADMIN) ──
  const handleEnviarResetClave = async (email: string) => {
    setEnviandoReset(true);
    setResetMsg(null);
    try {
      const res = await fetch("/api/admin/member-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setResetMsg("✅ " + data.message);
      } else {
        setResetMsg("❌ Error: " + data.error);
      }
    } catch (err: any) {
      setResetMsg("❌ Error de comunicación con el servidor.");
    } finally {
      setEnviandoReset(false);
    }
  };

  // ── ACCIÓN: CAMBIAR ROL DE UN MIEMBRO ──────────────────────
  const handleCambiarRolMiembro = async (perfilId: string, nuevoRolId: string) => {
    if (!esAdminActual) {
      alert("Solo administradores pueden cambiar roles.");
      return;
    }
    const { error } = await supabase
      .from("perfiles")
      .update({ rol_id: nuevoRolId, updated_at: new Date().toISOString() })
      .eq("id", perfilId);

    if (!error) {
      cargarDatos();
      if (miembroSeleccionado && miembroSeleccionado.id === perfilId) {
        const rolNuevo = roles.find((r) => r.id === nuevoRolId);
        setMiembroSeleccionado({ ...miembroSeleccionado, rol_id: nuevoRolId, roles: rolNuevo });
      }
    } else {
      alert("Error al cambiar el rol: " + error.message);
    }
  };

  // ── ACCIÓN: ABRIR MODAL EDITAR MIEMBRO ─────────────────────
  const handleAbrirEditar = (m: Perfil) => {
    setMiembroAEditar(m);
    setEditNombre(m.nombre || "");
    setEditUsername(m.username || "");
    setEditTelefono(m.telefono || "");
    setEditCedula(m.cedula || "");
    setEditDireccion(m.direccion || "");
  };

  // ── ACCIÓN: GUARDAR EDICIÓN DE MIEMBRO ─────────────────────
  const handleGuardarEdicionMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miembroAEditar) return;
    setGuardandoEdicion(true);

    const cleanUser = editUsername.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");

    const { error } = await supabase
      .from("perfiles")
      .update({
        nombre: editNombre.trim(),
        username: cleanUser || null,
        telefono: editTelefono.trim(),
        cedula: editCedula.trim(),
        direccion: editDireccion.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", miembroAEditar.id);

    setGuardandoEdicion(false);

    if (!error) {
      setMiembroAEditar(null);
      cargarDatos();
    } else {
      alert("Error al actualizar miembro: " + error.message);
    }
  };

  // ── ACCIÓN: SUSPENDER / ACTIVAR ACCESO ─────────────────────
  const handleToggleSuspender = async (m: Perfil) => {
    if (m.rol_id === "admin") {
      alert("No puedes suspender a un usuario con rol de Administrador.");
      return;
    }
    const nuevoEstado = m.estado === "activo" ? "suspendido" : "activo";
    const { error } = await supabase
      .from("perfiles")
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq("id", m.id);

    if (!error) {
      cargarDatos();
    } else {
      alert("Error al cambiar estado: " + error.message);
    }
  };

  // ── ACCIÓN: ELIMINAR MIEMBRO ──────────────────────────────
  const handleEliminarMiembro = async (m: Perfil) => {
    if (m.rol_id === "admin") {
      alert("Por motivos de seguridad, los usuarios Admin no pueden eliminarse desde esta interfaz.");
      return;
    }
    if (m.id === usuarioActual?.id) {
      alert("No puedes eliminar tu propio usuario en sesión activa.");
      return;
    }
    const confirmar = window.confirm(`¿Estás seguro de eliminar a "${m.nombre}" del equipo? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    const { error } = await supabase.from("perfiles").delete().eq("id", m.id);
    if (!error) {
      cargarDatos();
    } else {
      alert("Error al eliminar miembro: " + error.message);
    }
  };

  // ── ACCIÓN: GUARDAR CAMBIOS EN UN ROL ──────────────────────
  const handleGuardarRol = async () => {
    if (!rolSeleccionado) return;
    setGuardandoRol(true);
    setRolExito(false);

    const { error } = await supabase
      .from("roles")
      .update({
        nombre: rolSeleccionado.nombre,
        descripcion: rolSeleccionado.descripcion,
        color: rolSeleccionado.color,
        permisos: rolSeleccionado.permisos,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rolSeleccionado.id);

    setGuardandoRol(false);
    if (!error) {
      setRolExito(true);
      setTimeout(() => setRolExito(false), 3000);
      cargarDatos();
    } else {
      alert("Error al actualizar rol: " + error.message);
    }
  };

  // ── ACCIÓN: ELIMINAR ROL PERSONALIZADO (NO DEL SISTEMA) ──
  const handleEliminarRol = async () => {
    if (!rolSeleccionado) return;
    if (rolSeleccionado.es_sistema) {
      alert("Los roles predeterminados del sistema no pueden eliminarse.");
      return;
    }

    const miembrosConEsteRol = perfiles.filter((p) => p.rol_id === rolSeleccionado.id);
    if (miembrosConEsteRol.length > 0) {
      alert(`No puedes eliminar este rol porque tiene ${miembrosConEsteRol.length} miembro(s) asignado(s). Reasígnales otro rol antes de eliminarlo.`);
      return;
    }

    const confirmar = window.confirm(`¿Estás seguro de eliminar el rol "${rolSeleccionado.nombre}"?`);
    if (!confirmar) return;

    const { error } = await supabase.from("roles").delete().eq("id", rolSeleccionado.id);
    if (!error) {
      alert("Rol eliminado exitosamente.");
      const restantes = roles.filter((r) => r.id !== rolSeleccionado.id);
      setRoles(restantes);
      setRolSeleccionado(restantes.length > 0 ? restantes[0] : null);
      cargarDatos();
    } else {
      alert("Error al eliminar rol: " + error.message);
    }
  };

  // ── TOGGLE DE PERMISOS ESTILO DISCORD ─────────────────────
  const togglePermiso = (permisoId: string) => {
    if (!rolSeleccionado) return;
    const permisosActuales = [...rolSeleccionado.permisos];

    // Si ya tiene wildcard (*), mantenerlo o desactivar
    if (permisosActuales.includes("*")) {
      return; // Admin total no se desmarca individualmente
    }

    const existe = permisosActuales.includes(permisoId);
    let nuevosPermisos: string[];

    if (existe) {
      nuevosPermisos = permisosActuales.filter((p) => p !== permisoId);
    } else {
      nuevosPermisos = [...permisosActuales, permisoId];
    }

    setRolSeleccionado({
      ...rolSeleccionado,
      permisos: nuevosPermisos,
    });
  };

  // Toggle de todo un grupo completo de facultades
  const toggleGrupoCompleto = (grupoId: string) => {
    if (!rolSeleccionado) return;
    const grupo = GRUPOS_PERMISOS.find((g) => g.id === grupoId);
    if (!grupo) return;

    const idsGrupo = grupo.permisos.map((p) => p.id);
    const todosActivos = idsGrupo.every((id) => rolSeleccionado.permisos.includes(id));

    let nuevosPermisos: string[];
    if (todosActivos) {
      // Desactivar todos los de este grupo
      nuevosPermisos = rolSeleccionado.permisos.filter((p) => !idsGrupo.includes(p));
    } else {
      // Activar todos los que falten de este grupo
      nuevosPermisos = Array.from(new Set([...rolSeleccionado.permisos, ...idsGrupo]));
    }

    setRolSeleccionado({
      ...rolSeleccionado,
      permisos: nuevosPermisos,
    });
  };

  // ── CREAR NUEVO ROL PERSONALIZADO ─────────────────────────
  const handleCrearNuevoRol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRolNombre.trim()) return;

    const idGenerado = "rol_" + Date.now().toString(36);

    const { error } = await supabase.from("roles").insert([
      {
        id: idGenerado,
        nombre: nuevoRolNombre.trim(),
        descripcion: nuevoRolDesc.trim(),
        color: nuevoRolColor,
        es_sistema: false,
        permisos: [],
      },
    ]);

    if (!error) {
      setModalNuevoRol(false);
      setNuevoRolNombre("");
      setNuevoRolDesc("");
      cargarDatos();
    } else {
      alert("Error al crear el rol: " + error.message);
    }
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--ts-text-muted)]">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--ts-red)] mb-3" />
        <p className="text-sm">Cargando equipo y configuración de roles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Tabs Superiores ── */}
      <div className="flex items-center justify-between border-b border-[var(--ts-border)] pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("miembros")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "miembros"
                ? "bg-[var(--ts-red)] text-white shadow-sm"
                : "text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Miembros del Equipo ({perfiles.length})</span>
          </button>

          <button
            onClick={() => setTab("roles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "roles"
                ? "bg-[var(--ts-red)] text-white shadow-sm"
                : "text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Roles & Facultades ({roles.length})</span>
          </button>
        </div>

        {tab === "miembros" ? (
          <button
            onClick={() => {
              setInvitacionGenerada(null);
              setModalInvitar(true);
            }}
            className="flex items-center gap-2 bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-[var(--ts-red)]" />
            <span>Invitar Miembro</span>
          </button>
        ) : (
          <button
            onClick={() => setModalNuevoRol(true)}
            className="flex items-center gap-2 bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 text-[var(--ts-red)]" />
            <span>Crear Nuevo Rol</span>
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          PESTAÑA 1: MIEMBROS DEL EQUIPO
      ══════════════════════════════════════════════ */}
      {tab === "miembros" && (
        <div className="space-y-6">
          {/* Tarjeta de Lista de Miembros */}
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--ts-border)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--ts-text-primary)]">Personal Registrado</h3>
                <p className="text-xs text-[var(--ts-text-muted)]">Usuarios con credenciales activas en el portal</p>
              </div>
            </div>

            {perfiles.length === 0 ? (
              <div className="p-8 text-center text-[var(--ts-text-muted)]">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Aún no hay miembros registrados.</p>
                <p className="text-xs mt-1">Usa el botón "Invitar Miembro" para generar el primer enlace de bienvenida.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--ts-border-2)]">
                {perfiles.map((p) => {
                  const rolInfo = roles.find((r) => r.id === p.rol_id);
                  return (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[var(--ts-surface-2)] transition-colors">
                      <div
                        onClick={() => handleInspeccionarMiembro(p)}
                        className="flex items-center gap-3 cursor-pointer group flex-1"
                        title="Ver ficha técnica, desempeño y herramientas de administración"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow-xs transition-transform group-hover:scale-105"
                          style={{ backgroundColor: rolInfo?.color || "var(--ts-red)" }}
                        >
                          {p.nombre ? p.nombre.substring(0, 2).toUpperCase() : "TS"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)] transition-colors">
                              {p.nombre}
                            </p>
                            {p.username && (
                              <span className="text-[10px] text-[var(--ts-text-muted)] font-medium">
                                @{p.username}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--ts-text-muted)]">
                            {p.email} {p.telefono && `• ${p.telefono}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Selector de Rol: solo editable por Super Admin */}
                        {esAdminActual ? (
                          <div className="relative">
                            <select
                              value={p.rol_id}
                              onChange={(e) => handleCambiarRolMiembro(p.id, e.target.value)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--ts-border)] bg-[var(--ts-surface)] text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)] cursor-pointer hover:bg-[var(--ts-surface-2)] transition-colors"
                              style={{
                                color: rolInfo?.color || "var(--ts-red)",
                              }}
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.id} className="text-[var(--ts-text-primary)]">
                                  {r.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span
                            className="px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--ts-border)] bg-[var(--ts-surface-2)]"
                            style={{ color: rolInfo?.color || "var(--ts-red)" }}
                          >
                            {rolInfo?.nombre || p.rol_id}
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            p.estado === "activo"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {p.estado}
                        </span>

                        {/* Botones de Gestión (Solo si el usuario activo es Super Admin) */}
                        {esAdminActual && (
                          <div className="flex items-center gap-1 border-l border-[var(--ts-border)] pl-2">
                            <button
                              onClick={() => handleAbrirEditar(p)}
                              title="Editar datos del empleado"
                              className="p-1.5 rounded-lg text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface)] transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {p.rol_id !== "admin" && (
                              <>
                                <button
                                  onClick={() => handleToggleSuspender(p)}
                                  title={p.estado === "activo" ? "Suspender acceso" : "Reactivar acceso"}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    p.estado === "activo"
                                      ? "text-[var(--ts-text-muted)] hover:text-amber-500 hover:bg-[var(--ts-surface)]"
                                      : "text-amber-500 hover:text-emerald-500 hover:bg-[var(--ts-surface)]"
                                  }`}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleEliminarMiembro(p)}
                                  title="Eliminar del equipo"
                                  className="p-1.5 rounded-lg text-[var(--ts-text-muted)] hover:text-red-500 hover:bg-[var(--ts-surface)] transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invitaciones Pendientes */}
          {invitaciones.length > 0 && (
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <h4 className="text-xs font-bold text-[var(--ts-text-muted)] uppercase tracking-wider mb-3">
                Enlaces de Invitación Pendientes por Aceptar ({invitaciones.length})
              </h4>
              <div className="space-y-2">
                {invitaciones.map((inv) => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/registro?token=${inv.token}` : "";
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-[var(--ts-surface-2)] rounded-xl border border-[var(--ts-border)] text-xs">
                      <div>
                        <p className="font-bold text-[var(--ts-text-primary)]">{inv.email}</p>
                        <p className="text-[10px] text-[var(--ts-text-muted)]">Rol asignado: <span className="font-semibold">{inv.roles?.nombre || inv.rol_id}</span></p>
                      </div>
                      <button
                        onClick={() => copiarEnlace(url)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ts-surface)] hover:bg-[var(--ts-border)] text-[var(--ts-text-primary)] rounded-lg font-bold border border-[var(--ts-border)] transition-all"
                      >
                        <Copy className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                        <span>Copiar Enlace</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PESTAÑA 2: ROLES & FACULTADES (ESTILO DISCORD)
      ══════════════════════════════════════════════ */}
      {tab === "roles" && rolSeleccionado && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Panel Izquierdo: Lista de Roles (3 Columnas) */}
          <div className="md:col-span-4 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-3 shadow-xs space-y-1">
            <p className="text-[10px] font-black tracking-wider text-[var(--ts-text-muted)] uppercase px-3 py-2">
              Roles Configurados
            </p>
            {roles.map((r) => {
              const activo = rolSeleccionado.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRolSeleccionado(r)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    activo
                      ? "bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] font-bold shadow-xs"
                      : "text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] hover:text-[var(--ts-text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="truncate">{r.nombre}</span>
                  </div>
                  {r.es_sistema && (
                    <span title="Rol del sistema">
                      <Lock className="w-3 h-3 text-[var(--ts-text-muted)] opacity-60" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Panel Derecho: Editor de Facultades (8 Columnas) */}
          <div className="md:col-span-8 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-6 shadow-xs space-y-6">
            
            {/* Header del Rol Seleccionado */}
            <div className="flex items-center justify-between border-b border-[var(--ts-border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: rolSeleccionado.color }} />
                  <h3 className="text-base font-bold text-[var(--ts-text-primary)]">{rolSeleccionado.nombre}</h3>
                  {rolSeleccionado.es_sistema && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[var(--ts-border)] text-[var(--ts-text-muted)]">
                      Sistema
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--ts-text-muted)] mt-1">{rolSeleccionado.descripcion}</p>
              </div>

              <div className="flex items-center gap-2">
                {!rolSeleccionado.es_sistema && (
                  <button
                    onClick={handleEliminarRol}
                    title="Eliminar este rol personalizado"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Rol</span>
                  </button>
                )}

                <button
                  onClick={handleGuardarRol}
                  disabled={guardandoRol}
                  className="flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {guardandoRol ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : rolExito ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{rolExito ? "¡Guardado!" : "Guardar Cambios"}</span>
                </button>
              </div>
            </div>

            {/* Si es Super Admin con Wildcard (*) */}
            {rolSeleccionado.permisos.includes("*") ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-start gap-3">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Facultad de Super Administrador Universal (*)</p>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    Este rol tiene acceso total y permanente a todos los módulos y herramientas presentes y futuras del sistema. No requiere marcar permisos específicos.
                  </p>
                </div>
              </div>
            ) : (
              /* Grupos de Permisos Estilo Discord */
              <div className="space-y-6">
                {GRUPOS_PERMISOS.map((grupo) => {
                  const todosActivos = grupo.permisos.every((p) => rolSeleccionado.permisos.includes(p.id));
                  const algunosActivos = grupo.permisos.some((p) => rolSeleccionado.permisos.includes(p.id)) && !todosActivos;

                  return (
                    <div key={grupo.id} className="border border-[var(--ts-border)] rounded-2xl overflow-hidden bg-[var(--ts-surface-2)]">
                      
                      {/* Cabecera del Grupo con Toggle Maestro */}
                      <div className="p-4 bg-[var(--ts-surface)] border-b border-[var(--ts-border)] flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[var(--ts-text-primary)] uppercase tracking-wider">{grupo.nombre}</h4>
                          <p className="text-[11px] text-[var(--ts-text-muted)]">{grupo.descripcion}</p>
                        </div>

                        {/* Switch de Grupo Completo */}
                        <button
                          onClick={() => toggleGrupoCompleto(grupo.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            todosActivos
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                              : algunosActivos
                              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                              : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] border border-[var(--ts-border)]"
                          }`}
                        >
                          {todosActivos ? <Check className="w-3.5 h-3.5" /> : null}
                          <span>{todosActivos ? "Todo Activo" : algunosActivos ? "Parcial" : "Activar Todos"}</span>
                        </button>
                      </div>

                      {/* Lista de Facultades Individuales */}
                      <div className="divide-y divide-[var(--ts-border-2)] p-2">
                        {grupo.permisos.map((p) => {
                          const activo = rolSeleccionado.permisos.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => togglePermiso(p.id)}
                              className="p-3 flex items-center justify-between rounded-xl hover:bg-[var(--ts-surface)] cursor-pointer transition-colors"
                            >
                              <div className="pr-4">
                                <p className="text-xs font-semibold text-[var(--ts-text-primary)]">{p.nombre}</p>
                                <p className="text-[11px] text-[var(--ts-text-muted)]">{p.descripcion}</p>
                              </div>

                              {/* Toggle individual */}
                              <div className={`w-10 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                                activo ? "bg-emerald-500 justify-end" : "bg-[var(--ts-border)] justify-start"
                              }`}>
                                <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: INVITAR MIEMBRO (ENLACE MÁGICO)
      ══════════════════════════════════════════════ */}
      {modalInvitar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-[var(--ts-text-primary)] mb-1">Invitar Nuevo Miembro</h3>
            <p className="text-xs text-[var(--ts-text-muted)] mb-5">
              Genera un enlace único de bienvenida. Al abrirlo, el empleado registrará su nombre y clave.
            </p>

            {!invitacionGenerada ? (
              <form onSubmit={handleCrearInvitacion} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--ts-text-primary)] block mb-1.5">
                    Correo Electrónico del Empleado *
                  </label>
                  <input
                    type="email"
                    required
                    value={invitarEmail}
                    onChange={(e) => setInvitarEmail(e.target.value)}
                    placeholder="ejemplo@tecnosmartvzl.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--ts-text-primary)] block mb-1.5">
                    Rol Inicial a Asignar *
                  </label>
                  <select
                    value={invitarRolId}
                    onChange={(e) => setInvitarRolId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} ({r.descripcion})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalInvitar(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--ts-border)] text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={generandoInvitacion}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    {generandoInvitacion ? "Generando..." : "Crear Enlace"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">¡Enlace de invitación generado con éxito!</p>
                </div>

                <div className="p-3 bg-[var(--ts-surface-2)] rounded-xl border border-[var(--ts-border)]">
                  <p className="text-[10px] text-[var(--ts-text-muted)] uppercase font-bold mb-1">Enlace Mágico:</p>
                  <p className="text-xs font-mono text-[var(--ts-text-primary)] break-all select-all">{invitacionGenerada}</p>
                </div>

                <button
                  onClick={() => copiarEnlace(invitacionGenerada)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiado ? "¡Enlace Copiado al Portapapeles!" : "Copiar Enlace para WhatsApp"}</span>
                </button>

                <button
                  onClick={() => setModalInvitar(false)}
                  className="w-full py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: CREAR NUEVO ROL DINÁMICO
      ══════════════════════════════════════════════ */}
      {modalNuevoRol && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-[var(--ts-text-primary)] mb-1">Crear Rol Personalizado</h3>
            <p className="text-xs text-[var(--ts-text-muted)] mb-5">
              Define el nombre y color. Luego podrás configurarle las facultades que desees.
            </p>

            <form onSubmit={handleCrearNuevoRol} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--ts-text-primary)] block mb-1">Nombre del Rol *</label>
                <input
                  type="text"
                  required
                  value={nuevoRolNombre}
                  onChange={(e) => setNuevoRolNombre(e.target.value)}
                  placeholder="ej. Pasante de Redes, Cobrador..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ts-text-primary)] block mb-1">Descripción Breve</label>
                <input
                  type="text"
                  value={nuevoRolDesc}
                  onChange={(e) => setNuevoRolDesc(e.target.value)}
                  placeholder="ej. Asiste en configuración técnica básica"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ts-text-primary)] block mb-1">Color Distintivo</label>
                <div className="flex gap-2">
                  {["#c9242b", "#05235b", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNuevoRolColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        nuevoRolColor === c ? "scale-110 border-white shadow-md" : "border-transparent opacity-80"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoRol(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--ts-border)] text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Crear Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: EDITAR MIEMBRO POR EL ADMIN
      ══════════════════════════════════════════════ */}
      {miembroAEditar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-[var(--ts-text-primary)] mb-1">Editar Perfil del Empleado</h3>
            <p className="text-xs text-[var(--ts-text-muted)] mb-5">
              Modifica los datos del empleado como Administrador de TecnoSmart.
            </p>

            <form onSubmit={handleGuardarEdicionMiembro} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Usuario (@handle)</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    placeholder="usuario"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Cédula</label>
                  <input
                    type="text"
                    value={editCedula}
                    onChange={(e) => setEditCedula(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Dirección</label>
                <input
                  type="text"
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMiembroAEditar(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--ts-border)] text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: FICHA TÉCNICA, DESEMPEÑO Y SUPER ADMIN
      ══════════════════════════════════════════════ */}
      {miembroSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Botón Cerrar */}
            <button
              onClick={() => {
                setMiembroSeleccionado(null);
                setResetMsg(null);
              }}
              className="absolute top-4 right-4 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] p-1 rounded-lg hover:bg-[var(--ts-surface-2)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header del Perfil del Empleado */}
            <div className="flex items-center gap-4 border-b border-[var(--ts-border)] pb-5 mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md shrink-0"
                style={{ backgroundColor: miembroSeleccionado.roles?.color || "var(--ts-red)" }}
              >
                {miembroSeleccionado.nombre ? miembroSeleccionado.nombre.substring(0, 2).toUpperCase() : "TS"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-[var(--ts-text-primary)]">
                    {miembroSeleccionado.nombre}
                  </h3>
                  <span
                    className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider"
                    style={{
                      backgroundColor: `${miembroSeleccionado.roles?.color || "var(--ts-red)"}20`,
                      color: miembroSeleccionado.roles?.color || "var(--ts-red)"
                    }}
                  >
                    {miembroSeleccionado.roles?.nombre || miembroSeleccionado.rol_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      miembroSeleccionado.estado === "activo"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {miembroSeleccionado.estado}
                  </span>
                </div>

                <p className="text-xs text-[var(--ts-text-muted)] mt-0.5 flex items-center gap-2">
                  <span className="font-semibold text-[var(--ts-text-primary)]">@{miembroSeleccionado.username || "usuario"}</span>
                  <span>•</span>
                  <span>{miembroSeleccionado.email}</span>
                </p>
                {miembroSeleccionado.telefono && (
                  <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                    📞 {miembroSeleccionado.telefono} {miembroSeleccionado.cedula && `• CI: ${miembroSeleccionado.cedula}`}
                  </p>
                )}
              </div>
            </div>

            {/* SECCIÓN 1: RENDIMIENTO & DESEMPEÑO COMERCIAL / OPERATIVO */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-muted)] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                  <span>Rendimiento del Colaborador</span>
                </h4>
                {cargandoMetricas && (
                  <span className="text-[10px] text-[var(--ts-text-muted)] animate-pulse">Calculando métricas...</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase">Cotizaciones</p>
                  <p className="text-xl font-black text-[var(--ts-text-primary)] mt-0.5">
                    {metricasMiembro.cotizacionesCount}
                  </p>
                  <span className="text-[9px] text-[var(--ts-text-muted)]">Generadas</span>
                </div>

                <div className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase">Facturas</p>
                  <p className="text-xl font-black text-emerald-500 mt-0.5">
                    {metricasMiembro.facturasCount}
                  </p>
                  <span className="text-[9px] text-[var(--ts-text-muted)]">Cerradas</span>
                </div>

                <div className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase">Total Facturado</p>
                  <p className="text-xl font-black text-[var(--ts-red)] mt-0.5">
                    ${metricasMiembro.montoTotalUSD.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[9px] text-[var(--ts-text-muted)]">En Ventas USD</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: HERRAMIENTAS EXCLUSIVAS DE SUPER ADMIN */}
            <div className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--ts-red)] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Herramientas de Super Administrador</span>
              </h4>

              {/* Reset de Contraseña */}
              <div className="p-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[var(--ts-text-primary)]">Recuperación de Cuenta</p>
                  <p className="text-[11px] text-[var(--ts-text-muted)]">
                    Envía un enlace oficial para que el colaborador redefina su clave si la olvidó.
                  </p>
                </div>
                <button
                  onClick={() => handleEnviarResetClave(miembroSeleccionado.email)}
                  disabled={enviandoReset}
                  className="px-3 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{enviandoReset ? "Enviando..." : "Enviar Enlace"}</span>
                </button>
              </div>

              {resetMsg && (
                <div className="p-2.5 rounded-xl text-xs font-bold bg-[var(--ts-surface)] border border-[var(--ts-border)]">
                  {resetMsg}
                </div>
              )}

              {/* Asignación Rápida de Rol */}
              <div className="p-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[var(--ts-text-primary)]">Modificar Rol & Accesos</p>
                  <p className="text-[11px] text-[var(--ts-text-muted)]">
                    Cambia instantáneamente los permisos que este colaborador tiene en la empresa.
                  </p>
                </div>
                <select
                  value={miembroSeleccionado.rol_id}
                  disabled={!esAdminActual}
                  onChange={(e) => handleCambiarRolMiembro(miembroSeleccionado.id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Editar Datos Formales */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    handleAbrirEditar(miembroSeleccionado);
                    setMiembroSeleccionado(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] text-xs font-bold text-[var(--ts-text-primary)] transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                  <span>Editar Datos Formales</span>
                </button>

                {miembroSeleccionado.rol_id !== "admin" && (
                  <button
                    onClick={() => {
                      handleToggleSuspender(miembroSeleccionado);
                      setMiembroSeleccionado(null);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-600 transition-all flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{miembroSeleccionado.estado === "activo" ? "Suspender" : "Reactivar"}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
