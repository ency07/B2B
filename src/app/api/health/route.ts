import { NextResponse } from "next/server";

/**
 * Health check endpoint para monitoreo de disponibilidad.
 * - /api/health → 200 OK si la app responde
 * - /api/health?full=true → verifica conexión a Supabase (lento)
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const full = searchParams.get("full") === "true";

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    node: process.version,
    memory: process.memoryUsage(),
  };

  if (full) {
    try {
      const { supabaseAdmin } = await import("@/platform/auth/clients");
      const { error } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .limit(1);
      if (error) {
        return NextResponse.json(
          { ...health, status: "degraded", supabase: "error", error: error.message },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { ...health, supabase: "connected" },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { ...health, status: "degraded", supabase: "unreachable" },
        { status: 503 }
      );
    }
  }

  return NextResponse.json(health, { status: 200 });
}
