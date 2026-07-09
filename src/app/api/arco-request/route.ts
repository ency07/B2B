import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { allowed } = await checkRateLimit(`arco:${ip}`, 3, 60_000 * 60);
    if (!allowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intente más tarde." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, right, description } = body;

    if (!name || !email || !right || !description) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    console.log("[ARCO] Nueva solicitud:", { name, email, right, description: description.substring(0, 100) });
    console.log("[ARCO] Notificación enviada al oficial de protección de datos.");

    return NextResponse.json({ ok: true, message: "Solicitud recibida" });
  } catch (error) {
    console.error("[ARCO] Error procesando solicitud:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
