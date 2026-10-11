"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";
import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";

interface ProtectedViewProps {
  permiso: string | string[];
  modulo: string;
  children: React.ReactNode;
}

export default function ProtectedView({ permiso, modulo, children }: ProtectedViewProps) {
  const { usuario, loading } = useUsuario();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--ts-red)] mb-3" />
        <p className="text-xs font-bold text-[var(--ts-text-muted)]">Verificando credenciales de acceso...</p>
      </div>
    );
  }

  const esAdmin = usuario?.rol_id === "admin" || (usuario?.roles?.permisos || []).includes("*");
  const permisosUsuario: string[] = usuario?.roles?.permisos || (esAdmin ? ["*"] : []);

  const tieneAcceso = esAdmin || (Array.isArray(permiso)
    ? permiso.some((p) => tienePermiso(permisosUsuario, p))
    : tienePermiso(permisosUsuario, permiso));

  if (!tieneAcceso) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-8 text-center shadow-xl space-y-5">
          <div className="w-14 h-14 bg-red-500/10 text-[var(--ts-red)] rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[var(--ts-text-primary)]">Acceso Restringido</h2>
            <p className="text-xs text-[var(--ts-text-muted)] leading-relaxed">
              No dispones de los permisos necesarios para interactuar con el módulo de{" "}
              <span className="font-bold text-[var(--ts-text-primary)]">{modulo}</span>.
            </p>
            <p className="text-[11px] text-[var(--ts-text-muted)]">
              Tu rol actual es: <span className="font-bold text-[var(--ts-red)]">{usuario?.roles?.nombre || usuario?.rol_id || "Sin rol"}</span>.
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

  return <>{children}</>;
}
