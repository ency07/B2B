/**
 * apply-patch.ts
 * Aplica UN archivo de migración SQL de forma incremental (sin DROP SCHEMA).
 * Uso: npx ts-node scripts/apply-patch.ts <nombre-del-archivo.sql>
 */
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { getPgAdminConfig } from './lib/pg-admin-client';

async function main() {
  const [,, fileName] = process.argv;
  if (!fileName) {
    console.error('Uso: npx ts-node scripts/apply-patch.ts <nombre-del-archivo.sql>');
    process.exit(1);
  }

  const sqlPath = path.isAbsolute(fileName)
    ? fileName
    : path.join(__dirname, '../supabase/migrations', fileName);

  if (!fs.existsSync(sqlPath)) {
    console.error(`Error: No se encontró el archivo: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(`\n🔄  Aplicando parche: ${path.basename(sqlPath)} (${sql.length} bytes)\n`);

  const client = new Client(getPgAdminConfig());

  try {
    await client.connect();
    console.log('✅  Conexión establecida.');

    await client.query(sql);
    console.log('✅  Parche aplicado exitosamente.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('❌  Error al aplicar el parche:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
