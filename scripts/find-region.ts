import { Client } from 'pg';
import { getPgAdminConfig } from './lib/pg-admin-client';

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'sa-east-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ca-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1'
];

async function testRegion(region: string): Promise<boolean> {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`Probando región: ${region} (${host})...`);
  
  const client = new Client(getPgAdminConfig({ host, connectionTimeoutMillis: 5000 }));

  try {
    await client.connect();
    await client.end();
    console.log(`¡CONEXIÓN EXITOSA EN LA REGIÓN: ${region}!`);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // If the error message does NOT contain "tenant/user ... not found", then the project exists in this pooler!
    if (error.message && error.message.includes('not found')) {
      // Project not in this pooler
      return false;
    }
    // Any other error (like invalid password or timeout) means the project IS in this pooler
    console.log(`Proyecto encontrado en ${region} pero ocurrió un error:`, error.message);
    return true;
  }
}

async function main() {
  for (const region of regions) {
    const found = await testRegion(region);
    if (found) {
      console.log(`\nRegión identificada: ${region}`);
      process.exit(0);
    }
  }
  console.error('\nNo se pudo encontrar el proyecto en ninguna de las regiones de Supabase.');
  process.exit(1);
}

main();
