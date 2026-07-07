/**
 * Configuración compartida para conexiones Postgres directas (no vía
 * PostgREST/Supabase JS) usadas por scripts de infraestructura en scripts/.
 *
 * Antes cada script tenía el host/user/password de Postgres hardcodeados en
 * texto plano, duplicados en 6 archivos distintos. Ahora todos leen de estas
 * variables de entorno — rotar la contraseña es cambiarla en un solo lugar
 * (.env), no en 6 archivos.
 *
 * Requiere en .env: SUPABASE_DB_HOST, SUPABASE_DB_PORT (opcional, default 5432),
 * SUPABASE_DB_USER, SUPABASE_DB_PASSWORD, SUPABASE_DB_NAME (opcional, default "postgres").
 */
import type { ClientConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export function getPgAdminConfig(overrides?: Partial<ClientConfig>): ClientConfig {
  const host = process.env.SUPABASE_DB_HOST;
  const user = process.env.SUPABASE_DB_USER;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const database = process.env.SUPABASE_DB_NAME || 'postgres';
  const port = Number(process.env.SUPABASE_DB_PORT || 5432);

  if (!host || !user || !password) {
    throw new Error(
      'Faltan variables de entorno para la conexión Postgres directa: ' +
      'SUPABASE_DB_HOST, SUPABASE_DB_USER y SUPABASE_DB_PASSWORD son obligatorias. ' +
      'Revisa .env / .env.example.'
    );
  }

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    ...overrides,
  };
}
