import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * POST /api/auth/sync-token
 *
 * Recibe los tokens frescos del cliente Supabase tras un auto-refresh
 * y los escribe como cookies HttpOnly server-side. Esto evita que el
 * storage adapter tenga que escribir tokens en document.cookie sin
 * HttpOnly [C-01].
 *
 * El endpoint verifica que el access_token sea válido antes de emitir
 * las cookies — un token forjado o expirado es rechazado con 401.
 *
 * Dominio: "erp" | "portal" — determina el nombre de las cookies.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      domain: "erp" | "portal";
    };

    const { access_token, refresh_token, expires_in, domain } = body;

    if (!access_token || !domain || !["erp", "portal"].includes(domain)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    // Verificar que el token sea legítimo antes de emitir cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${access_token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    if (error || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const accessMaxAge = typeof expires_in === "number" && expires_in > 60
      ? expires_in - 30
      : 3570; // 59.5 min por defecto

    const response = NextResponse.json({ ok: true });

    response.cookies.set(`sb-${domain}-access-token`, access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: accessMaxAge,
    });

    if (refresh_token) {
      response.cookies.set(`sb-${domain}-refresh-token`, refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
