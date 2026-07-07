import { Client } from 'pg';
import { getPgAdminConfig } from './lib/pg-admin-client';

async function main() {
  const client = new Client(getPgAdminConfig());

  try {
    await client.connect();
    console.log('¡Conectado!');

    const res1 = await client.query("SELECT current_user, session_user;");
    console.log('Users:', res1.rows);

    await client.end();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Error:', err);
  }
}

main();
