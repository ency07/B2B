import { Client } from 'pg';
import { getPgAdminConfig } from './lib/pg-admin-client';

async function main() {
  console.log('Restaurando permisos de los roles de Supabase API (anon, authenticated, service_role)...');

  const client = new Client(getPgAdminConfig());

  try {
    await client.connect();
    console.log('Conexión establecida.');

    const query = `
      -- Otorgar uso del esquema public
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL ON SCHEMA public TO postgres, service_role;

      -- Otorgar permisos sobre tablas existentes
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

      -- Configurar privilegios por defecto para futuras tablas, secuencias y funciones
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
      
      -- Asegurar permisos para postgres en el esquema
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
    `;

    await client.query(query);
    console.log('¡Permisos y privilegios de Supabase restaurados exitosamente!');
  } catch (error) {
    console.error('Error restaurando permisos:', error);
  } finally {
    await client.end();
  }
}

main();
