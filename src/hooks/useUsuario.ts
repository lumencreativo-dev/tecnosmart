// ─────────────────────────────────────────────────────────────
// src/hooks/useUsuario.ts — Hook para obtener el perfil activo
// ─────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { ROLES_PREDETERMINADOS, RolDef } from "@/lib/permissions";

export interface PerfilUsuario {
  id: string;
  email: string;
  nombre: string;
  cedula?: string;
  telefono?: string;
  direccion?: string;
  avatar_url?: string;
  username?: string;
  rol_id: string;
  estado: string;
  permisos_custom?: string[];
  roles?: {
    id: string;
    nombre: string;
    color: string;
    permisos: string[];
  };
}

export function useUsuario() {
  const [usuarioReal, setUsuarioReal] = useState<PerfilUsuario | null>(null);
  const [rolSimulado, setRolSimuladoState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar rol simulado desde sessionStorage al montar
  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem("ts_simulador_rol");
      if (guardado) setRolSimuladoState(guardado);
    } catch (e) {
      // Ignorar en SSR o entornos restringidos
    }

    const handleSimuladorChange = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      setRolSimuladoState(customEvent.detail || null);
    };

    window.addEventListener("ts_simulador_rol_change", handleSimuladorChange);
    return () => {
      window.removeEventListener("ts_simulador_rol_change", handleSimuladorChange);
    };
  }, []);

  const setRolSimulado = useCallback((nuevoRol: string | null) => {
    try {
      if (nuevoRol) {
        sessionStorage.setItem("ts_simulador_rol", nuevoRol);
      } else {
        sessionStorage.removeItem("ts_simulador_rol");
      }
    } catch (e) {
      // Ignorar
    }
    setRolSimuladoState(nuevoRol);
    window.dispatchEvent(new CustomEvent("ts_simulador_rol_change", { detail: nuevoRol }));
  }, []);

  const cargarPerfil = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        // Buscar el perfil del usuario autenticado en Supabase Auth
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("*, roles(*)")
          .eq("id", user.id)
          .single();

        if (perfil) {
          // Combinar permisos del rol base + permisos custom individuales estilo Odoo
          const permisosBase = perfil.roles?.permisos || [];
          const permisosCustom = perfil.permisos_custom || [];
          const permisosFinales = Array.from(new Set([...permisosBase, ...permisosCustom]));

          setUsuarioReal({
            ...perfil,
            roles: perfil.roles ? {
              ...perfil.roles,
              permisos: permisosFinales,
            } : undefined,
          });
        } else {
          setUsuarioReal({
            id: user.id,
            email: user.email || "",
            username: user.user_metadata?.username || user.email?.split("@")[0] || "usuario",
            nombre: user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario",
            rol_id: user.user_metadata?.rol_id || "tecnico",
            estado: "activo",
            roles: {
              id: "tecnico",
              nombre: "Técnico Instalador",
              color: "#6366f1",
              permisos: ["proyectos.ver_propias", "proyectos.actas", "inventario.ver"],
            },
          });
        }
      } else {
        // Si no hay sesión directa en Supabase Auth (caso de la cuenta Maestra admintecno),
        // buscamos si existe perfil asociado o generamos el perfil Super Admin con permisos globales [*]
        const { data: perfilMaster } = await supabase
          .from("perfiles")
          .select("*, roles(*)")
          .or("username.eq.admintecno,username.eq.soykevflores")
          .maybeSingle();

        if (perfilMaster) {
          setUsuarioReal({
            ...perfilMaster,
            username: perfilMaster.username || "admintecno",
            rol_id: "admin",
            roles: perfilMaster.roles || {
              id: "admin",
              nombre: "Admin (Gerencia)",
              color: "#c9242b",
              permisos: ["*"],
            },
          });
        } else {
          setUsuarioReal({
            id: "00000000-0000-0000-0000-000000000000",
            email: "admintecno@tecnosmartvzl.com",
            username: "admintecno",
            nombre: "Kevin Flores",
            cedula: "26745761",
            telefono: "+58412023808",
            direccion: "Villa A, Tinaquillo, Cojedes",
            rol_id: "admin",
            estado: "activo",
            roles: {
              id: "admin",
              nombre: "Admin (Gerencia)",
              color: "#c9242b",
              permisos: ["*"],
            },
          });
        }
      }
    } catch (e) {
      console.error("Error al cargar usuario:", e);
      // Fallback seguro de Super Admin
      setUsuarioReal({
        id: "00000000-0000-0000-0000-000000000000",
        email: "admintecno@tecnosmartvzl.com",
        username: "admintecno",
        nombre: "Kevin Flores",
        rol_id: "admin",
        estado: "activo",
        roles: {
          id: "admin",
          nombre: "Admin (Gerencia)",
          color: "#c9242b",
          permisos: ["*"],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        cargarPerfil();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Construir Usuario Efectivo (Aplica simulación si está activa) ──
  let usuarioEfectivo = usuarioReal;
  if (rolSimulado && usuarioReal) {
    const rolEncontrado = ROLES_PREDETERMINADOS.find((r) => r.id === rolSimulado);
    if (rolEncontrado) {
      usuarioEfectivo = {
        ...usuarioReal,
        rol_id: rolEncontrado.id,
        roles: {
          id: rolEncontrado.id,
          nombre: `${rolEncontrado.nombre} (Simulación)`,
          color: rolEncontrado.color,
          permisos: rolEncontrado.permisos,
        },
      };
    }
  }

  return {
    usuario: usuarioEfectivo,
    usuarioReal,
    loading,
    refetch: cargarPerfil,
    rolSimulado,
    setRolSimulado,
    esSimulando: Boolean(rolSimulado),
  };
}
