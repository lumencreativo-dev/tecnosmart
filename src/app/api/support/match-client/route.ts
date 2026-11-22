import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json({ matched: false });
    }

    const clean = query.trim().toLowerCase();
    // Limpiar caracteres para búsqueda flexible de cédula / RIF / teléfono
    const digitsOnly = clean.replace(/\D/g, "");

    // Buscar en public.clientes (sin limit arbitrario para encontrar clientes en toda la base)
    const { data: clientes, error } = await supabase
      .from("clientes")
      .select("id, contacto, empresa, rif_cedula, telefono, email, direccion, ciudad, tipo")
      .order("created_at", { ascending: false });

    if (error || !clientes || clientes.length === 0) {
      return NextResponse.json({ matched: false });
    }

    const match = clientes.find((c: any) => {
      const cEmail = (c.email || "").toLowerCase().trim();
      const cRif = (c.rif_cedula || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanRifQuery = clean.replace(/[^a-z0-9]/g, "");
      const cTel = (c.telefono || "").replace(/\D/g, "");
      const cContacto = (c.contacto || "").toLowerCase();
      const cEmpresa = (c.empresa || "").toLowerCase();

      if (cEmail && (cEmail === clean || cEmail.includes(clean))) return true;
      if (cRif && cleanRifQuery && (cRif === cleanRifQuery || cRif.includes(cleanRifQuery) || cleanRifQuery.includes(cRif))) return true;
      if (digitsOnly.length >= 7 && cTel && (cTel.includes(digitsOnly) || digitsOnly.includes(cTel))) return true;
      if (clean.length >= 4 && (cContacto.includes(clean) || cEmpresa.includes(clean))) return true;
      return false;
    });

    if (match) {
      return NextResponse.json({
        matched: true,
        cliente: {
          id: match.id,
          nombre: match.contacto || match.empresa,
          empresa: match.empresa,
          contacto: match.contacto,
          rif_cedula: match.rif_cedula,
          telefono: match.telefono,
          email: match.email,
          ciudad: match.ciudad || match.direccion,
          tipo: match.tipo || "Normal",
          esVip: match.tipo === "VIP" || match.tipo === "vip",
        },
      });
    }

    return NextResponse.json({ matched: false });
  } catch (err: any) {
    console.error("Error matching client:", err);
    return NextResponse.json({ matched: false, error: err.message }, { status: 500 });
  }
}
