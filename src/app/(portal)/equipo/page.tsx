"use client";

import EquipoManager from "@/components/cotizador/EquipoManager";
import { Users2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useUsuario } from "@/hooks/useUsuario";
import Link from "next/link";

export default function EquipoPage() {
  const { usuario, loading } = useUsuario();

  // Comprobar si el usuario tiene permisos de administración
  const esAdmin = usuario?.rol_id === "admin" || (usuario?.roles?.permisos || []).includes("*") || (usuario?.roles?.permisos || []).includes("administracion.roles");

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[var(--ts-bg)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--ts-text-muted)] font-bold">Verificando credenciales de acceso...</p>
        </div>
      </div>
    );
  }

  // 🛡️ BARRERA DE SEGURIDAD ESTRICTA: Acceso solo a Super Admins / Gestión de Roles
  if (!esAdmin) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[var(--ts-bg)] p-4">
        <div className="max-w-md w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-8 text-center shadow-xl space-y-5">
          <div className="w-14 h-14 bg-red-500/10 text-[var(--ts-red)] rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[var(--ts-text-primary)]">Acceso Restringido</h2>
            <p className="text-xs text-[var(--ts-text-muted)] leading-relaxed">
              El módulo de <span className="font-bold text-[var(--ts-text-primary)]">Gestión de Personal & Roles</span> está reservado exclusivamente para la Gerencia y Super Administradores de TecnoSmart VZL.
            </p>
            <p className="text-[11px] text-[var(--ts-text-muted)]">
              Tu rol actual es: <span className="font-bold text-[var(--ts-red)]">{usuario?.roles?.nombre || usuario?.rol_id}</span>.
            </p>
          </div>
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a mi Panel Principal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[var(--ts-bg)]">
      {/* ── Banner/Header ── */}
      <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
              <Users2 className="w-5 h-5 text-[var(--ts-red)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ts-text-primary)] tracking-tight">Mi Equipo & Permisos</h1>
              <p className="text-[var(--ts-text-muted)] text-sm">Administra los accesos de tus empleados, genera invitaciones y configura roles estilo Discord.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenedor principal ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <EquipoManager />
      </div>
    </div>
  );
}
