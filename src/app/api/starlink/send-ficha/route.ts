import { NextRequest, NextResponse } from "next/server";
import { sendStarlinkFichaEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      toEmail,
      clientName,
      modalidad,
      kitSerial,
      wifiSsid,
      wifiPassword,
      diaCorte,
      planNombre,
      montoMensual,
      ubicacion,
      cuentaClienteEmail,
    } = body;

    if (!toEmail) {
      return NextResponse.json(
        { ok: false, error: "El correo electrónico del cliente es obligatorio para el envío." },
        { status: 400 }
      );
    }

    const result = await sendStarlinkFichaEmail({
      toEmail: toEmail.trim(),
      options: {
        clientName: clientName || "Cliente",
        modalidad: modalidad || "flota_administrada",
        kitSerial: kitSerial || "N/A",
        wifiSsid: wifiSsid || "Starlink",
        wifiPassword: wifiPassword || "Configurado en sitio",
        diaCorte: diaCorte || 5,
        planNombre: planNombre || "Starlink Satelital",
        montoMensual: montoMensual ? Number(montoMensual) : undefined,
        ubicacion,
        cuentaClienteEmail,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || "No se pudo entregar el correo de la ficha Starlink." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Ficha técnica de Starlink enviada con éxito a ${toEmail}.`,
      data: result.data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno procesando envío de ficha Starlink";
    console.error("Error en /api/starlink/send-ficha:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
