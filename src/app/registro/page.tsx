"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, User, Lock,
  Phone, MapPin, CreditCard, ArrowRight, RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

function RegistroContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [validando, setValidando] = useState(true);
  const [errorToken, setErrorToken] = useState<string | null>(null);
  const [invitacion, setInvitacion] = useState<any>(null);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [registrando, setRegistrando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  // Validar token de invitación
  useEffect(() => {
    if (!token) {
      setErrorToken("No se proporcionó ningún token de invitación válido.");
      setValidando(false);
      return;
    }

    const validar = async () => {
      const { data, error } = await supabase
        .from("invitaciones")
        .select("*, roles(*)")
        .eq("token", token)
        .eq("usada", false)
        .single();

      if (error || !data) {
        setErrorToken("Este enlace de invitación no existe o ya ha sido utilizado.");
      } else {
        // Verificar si expiró
        if (new Date(data.fecha_expiracion) < new Date()) {
          setErrorToken("Este enlace de invitación ha expirado. Solicita uno nuevo al administrador.");
        } else {
          setInvitacion(data);
        }
      }
      setValidando(false);
    };

    validar();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRegistro(null);

    if (password !== confirmPassword) {
      setErrorRegistro("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setErrorRegistro("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorRegistro("El nombre de usuario debe tener al menos 3 caracteres (sin espacios ni caracteres especiales).");
      return;
    }

    setRegistrando(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          nombre,
          username: cleanUsername,
          cedula,
          telefono,
          direccion,
          password,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Error al completar el registro.");
      }

      // Iniciar sesión de inmediato en el navegador
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: password,
      });

      // Sincronizar cookie para el middleware
      document.cookie = "ts_session=authenticated; path=/; max-age=604800";

      setRegistroExitoso(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: any) {
      setErrorRegistro(err.message || "Ocurrió un error al procesar el registro.");
    } finally {
      setRegistrando(false);
    }
  };

  if (validando) {
    return (
      <div className="text-center p-8 text-[var(--ts-text-muted)]">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--ts-red)] mb-3" />
        <p className="text-sm">Validando invitación de TecnoSmart...</p>
      </div>
    );
  }

  if (errorToken) {
    return (
      <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[var(--ts-text-primary)] mb-2">Invitación Inválida</h2>
        <p className="text-xs text-[var(--ts-text-muted)] leading-relaxed mb-6">{errorToken}</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] text-xs font-bold text-[var(--ts-text-primary)] rounded-xl transition-all"
        >
          Ir al Inicio de Sesión
        </Link>
      </div>
    );
  }

  if (registroExitoso) {
    return (
      <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-8 max-w-md w-full text-center shadow-xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-[var(--ts-text-primary)] mb-2">¡Bienvenido al Equipo!</h2>
        <p className="text-xs text-[var(--ts-text-muted)] leading-relaxed mb-4">
          Tu cuenta ha sido creada exitosamente. Te estamos redirigiendo a tu Dashboard...
        </p>
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--ts-red)]" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative">
      <div className="text-center mb-6">
        <Image src="/isotipo-rojo.png" alt="TecnoSmart" width={40} height={40} className="h-9 w-auto mx-auto mb-3" />
        <h1 className="text-xl font-bold text-[var(--ts-text-primary)]">Únete a TecnoSmart VZL</h1>
        <p className="text-xs text-[var(--ts-text-muted)] mt-1">Completa tu perfil para acceder a las herramientas del portal interno.</p>

        {/* Badge del Rol Asignado */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: invitacion?.roles?.color || "#c9242b" }} />
          <span className="text-xs font-bold text-[var(--ts-text-primary)]">{invitacion?.roles?.nombre || "Colaborador"}</span>
          <span className="text-[10px] text-[var(--ts-text-muted)]">({invitacion?.email})</span>
        </div>
      </div>

      {errorRegistro && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
          {errorRegistro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Nombre Formal y Apellido *</label>
            <div className="relative">
              <User className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Carlos Pérez"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
            <p className="text-[9px] text-[var(--ts-text-muted)] mt-1">Visible en cotizaciones y facturas</p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Nombre de Usuario (@handle) *</label>
            <div className="relative">
              <span className="text-xs font-bold text-[var(--ts-text-muted)] absolute left-3 top-2.5">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                placeholder="carlosp"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
            <p className="text-[9px] text-[var(--ts-text-muted)] mt-1">Para inicio de sesión rápido (sin espacios)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Cédula / Documento *</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="V-24.123.456"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Teléfono Móvil *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+58 412-1234567"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Dirección / Zona</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Tinaquillo, Cojedes"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Crear Contraseña *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--ts-text-primary)] block mb-1">Repetir Contraseña *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma la contraseña"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={registrando}
          className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {registrando ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Completar Registro y Entrar</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-[var(--ts-bg)] flex items-center justify-center p-4">
      <Suspense fallback={<RefreshCw className="w-8 h-8 animate-spin text-[var(--ts-red)]" />}>
        <RegistroContent />
      </Suspense>
    </div>
  );
}
