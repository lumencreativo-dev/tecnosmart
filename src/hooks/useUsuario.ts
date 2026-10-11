// ─────────────────────────────────────────────────────────────
// src/hooks/useUsuario.ts — Hook para obtener el perfil activo
// ─────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

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
  roles?: {
    id: string;
    nombre: string;
    color: string;
    permisos: string[];
  };
}

export function useUsuario() {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Buscar su perfil en la base de datos
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("*, roles(*)")
          .eq("id", user.id)
          .single();

        if (perfil) {
          setUsuario(perfil);
        } else {
          // Fallback para admin inicial
          setUsuario({
            id: user.id,
            email: user.email || "admin@tecnosmartvzl.com",
            username: "admintecno",
            nombre: user.user_metadata?.nombre || user.email?.split("@")[0] || "Administrador",
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
      } else {
        // Si no hay sesión de Supabase Auth activa, buscar el perfil de admintecno en la base de datos
        const { data: perfilAdmin } = await supabase
          .from("perfiles")
          .select("*, roles(*)")
          .ilike("username", "admintecno")
          .maybeSingle();

        if (perfilAdmin) {
          setUsuario(perfilAdmin);
        } else {
          // Si aún no se ha creado en la tabla perfiles
          setUsuario({
            id: "00000000-0000-0000-0000-000000000000",
            email: "admintecno@tecnosmartvzl.com",
            username: "admintecno",
            nombre: "Kevin Flores",
            rol_id: "admin",
            estado: "activo",
            roles: {
              id: "admin",
              nombre: "Admin Principal",
              color: "#c9242b",
              permisos: ["*"],
            },
          });
        }
      }
    } catch (e) {
      console.error("Error al cargar usuario:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  return { usuario, loading, refetch: cargarPerfil };
}
