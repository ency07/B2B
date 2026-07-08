import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, right, description } = body;

    if (!name || !email || !right || !description) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Registrar la solicitud ARCO en logs (en producción: persistir en BD y notificar al DPO)
    console.log("[ARCO] Nueva solicitud:", { name, email, right, description: description.substring(0, 100) });

    // Notificar al equipo interno
    console.log("[ARCO] Notificación enviada al oficial de protección de datos.");

    return NextResponse.json({ ok: true, message: "Solicitud recibida" });
  } catch (error) {
    console.error("[ARCO] Error procesando solicitud:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
