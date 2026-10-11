"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  User, Mail, Phone, MapPin, CreditCard, Shield,
  Award, Sparkles, Check, Save, Lock, Camera,
  RefreshCw, CheckCircle2, Trophy, Flame, Star
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";

export default function PerfilManager() {
  const { usuario, loading, refetch } = useUsuario();

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cedula, setCedula] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [perfilError, setPerfilError] = useState<string | null>(null);

  // Cambio de contraseña
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [passExito, setPassExito] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setUsername(usuario.username || "");
      setTelefono(usuario.telefono || "");
      setDireccion(usuario.direccion || "");
      setCedula(usuario.cedula || "");
      setAvatarUrl(usuario.avatar_url || "");
    }
  }, [usuario]);

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setGuardando(true);
    setGuardadoExito(false);
    setPerfilError(null);

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");

    // Si cambió el username, verificar que no esté ocupado por otro
    if (cleanUsername && cleanUsername !== (usuario.username || "")) {
      const { data: existente } = await supabase
        .from("perfiles")
        .select("id")
        .eq("username", cleanUsername)
        .neq("id", usuario.id)
        .maybeSingle();

      if (existente) {
        setGuardando(false);
        setPerfilError(`El usuario "@${cleanUsername}" ya pertenece a otro miembro.`);
        return;
      }
    }

    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario.id);

    let query = supabase.from("perfiles").update({
      nombre: nombre.trim(),
      username: cleanUsername || null,
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      cedula: cedula.trim(),
      avatar_url: avatarUrl.trim(),
      updated_at: new Date().toISOString(),
    });

    if (isValidUUID && usuario.id !== "00000000-0000-0000-0000-000000000000") {
      query = query.eq("id", usuario.id);
    } else {
      query = query.ilike("username", usuario.username || "admintecno");
    }

    const { error } = await query;

    setGuardando(false);

    if (!error) {
      setGuardadoExito(true);
      setTimeout(() => setGuardadoExito(false), 3000);
      refetch();
    } else {
      alert("Error al actualizar perfil: " + error.message);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassExito(false);

    if (passwordNueva !== passwordConfirm) {
      setPassError("Las contraseñas no coinciden.");
      return;
    }

    if (passwordNueva.length < 6) {
      setPassError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setGuardandoPass(true);

    const { error } = await supabase.auth.updateUser({
      password: passwordNueva,
    });

    setGuardandoPass(false);

    if (!error) {
      setPassExito(true);
      setPasswordNueva("");
      setPasswordConfirm("");
      setTimeout(() => setPassExito(false), 4000);
    } else {
      setPassError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--ts-text-muted)]">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--ts-red)] mb-3" />
        <p className="text-sm">Cargando tu perfil de usuario...</p>
      </div>
    );
  }

  const rolColor = usuario?.roles?.color || "#c9242b";
  const rolNombre = usuario?.roles?.nombre || "Colaborador";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* ══════════════════════════════════════════════
          CARD ESTILO DISCORD: HEADER DE PERFIL
      ══════════════════════════════════════════════ */}
      <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl overflow-hidden shadow-lg relative">
        
        {/* Banner Superior Personalizado */}
        <div
          className="h-36 sm:h-44 w-full relative"
          style={{
            background: `linear-gradient(135deg, ${rolColor} 0%, #111111 100%)`,
          }}
        >
          {/* Patrón decorativo geométrico */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Sección de Avatar e Info */}
        <div className="px-6 pb-6 pt-0 relative">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
            
            {/* Avatar Flotante con Estado Activo */}
            <div className="relative inline-block">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[var(--ts-surface)] shadow-xl flex items-center justify-center text-white text-3xl font-black overflow-hidden bg-[var(--ts-surface-2)]"
                style={{ backgroundColor: avatarUrl ? "transparent" : rolColor }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={usuario?.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span>{usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : "TS"}</span>
                )}
              </div>

              {/* Indicador de estado en línea estilo Discord */}
              <div
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[var(--ts-surface)]"
                title="En línea en TecnoSmart Portal"
              />
            </div>

            {/* Rol Badge estilo Discord */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-black tracking-wide"
                style={{
                  backgroundColor: `${rolColor}15`,
                  borderColor: `${rolColor}40`,
                  color: rolColor,
                }}
              >
                <Shield className="w-4 h-4" />
                <span>{rolNombre.toUpperCase()}</span>
              </div>
            </div>

          </div>

          {/* Nombre y Cargo */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--ts-text-primary)] tracking-tight">
              {usuario?.nombre}
            </h2>
            <p className="text-xs text-[var(--ts-text-muted)] font-mono flex items-center gap-2">
              <span className="text-[var(--ts-red)] font-bold">@{usuario?.username || "sin_usuario"}</span>
              <span>•</span>
              <span>{usuario?.email}</span>
            </p>
          </div>

        </div>

        {/* Vitrina de Insignias y Logros (Gamificación) */}
        <div className="bg-[var(--ts-surface-2)] border-t border-[var(--ts-border)] px-6 py-4 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
            Insignias:
          </span>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[11px] font-bold text-amber-500 shadow-2xs">
            <Trophy className="w-3.5 h-3.5" />
            <span>Pionero del Sistema</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[11px] font-bold text-emerald-500 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verificado</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[11px] font-bold text-violet-400 shadow-2xs">
            <Flame className="w-3.5 h-3.5" />
            <span>Activo en Operaciones</span>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════
          FORMULARIOS DE EDICIÓN
      ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Datos Personales (8 Cols) */}
        <div className="md:col-span-7 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[var(--ts-text-primary)]">Datos Personales</h3>
            <p className="text-xs text-[var(--ts-text-muted)]">Mantén tu información de contacto actualizada para las órdenes y cotizaciones.</p>
          </div>

          {guardadoExito && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>¡Perfil actualizado correctamente!</span>
            </div>
          )}

          {perfilError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
              {perfilError}
            </div>
          )}

          <form onSubmit={handleGuardarPerfil} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Nombre de Usuario (@)</label>
                <div className="relative">
                  <span className="text-xs font-bold text-[var(--ts-text-muted)] absolute left-3 top-2.5">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    placeholder="carlosp"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Cédula / Documento</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="V-12.345.678"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Teléfono Móvil</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+58 412..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Dirección de Residencia</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ciudad, Estado, Zona"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">URL de Foto de Perfil (Opcional)</label>
              <div className="relative">
                <Camera className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://i.imgur.com/... o enlace de tu foto"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Guardar Información</span>
            </button>
          </form>
        </div>

        {/* Seguridad y Clave (5 Cols) */}
        <div className="md:col-span-5 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[var(--ts-text-primary)]">Seguridad de la Cuenta</h3>
            <p className="text-xs text-[var(--ts-text-muted)]">Actualiza tu contraseña periódicamente para proteger tu acceso.</p>
          </div>

          {passExito && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>¡Contraseña cambiada con éxito!</span>
            </div>
          )}

          {passError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
              {passError}
            </div>
          )}

          <form onSubmit={handleCambiarPassword} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Repetir Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Confirma la clave"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoPass}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              {guardandoPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-[var(--ts-red)]" />}
              <span>Actualizar Contraseña</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
