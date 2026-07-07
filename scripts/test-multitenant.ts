// SCRIPT DE VALIDACIÓN: AISLAMIENTO MULTITENANT Y SEGURIDAD RLS
// Archivo: scripts/test-multitenant.ts
//
// IMPORTANTE — este script reemplaza a la prueba automatizada en CI (que solo
// verifica que ciertas policies existan como texto en el .sql, no que RLS
// funcione). Aquí sí se autentica como un usuario real (anon key + JWT de
// sesión), por lo que RLS se aplica de verdad y la prueba puede fallar.
//
// Se ejecuta MANUALMENTE (no en CI) contra un proyecto Supabase real
// (staging recomendado, nunca producción) antes de cada release que toque
// políticas RLS o tablas nuevas:
//
//   npm run test:multitenant
//
// Requiere en el .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runDatabaseTests() {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
        throw new Error(
            'Faltan variables de entorno: SUPABASE_URL, SUPABASE_ANON_KEY y ' +
            'SUPABASE_SERVICE_ROLE_KEY son obligatorias para esta prueba. ' +
            'No existe modo "mock": una prueba de RLS sin BD real no prueba nada.'
        );
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    console.log('Ejecutando pruebas de aislamiento de datos en base de datos...');

    // 1. Crear Tenants de Prueba
    const { data: tenantA, error: errA } = await admin
        .from('tenants')
        .insert({ tenant_code: 'TEST-A', name: 'Tenant de Prueba A', legal_name: 'Test A S.A.', tax_id: 'NIT-TEST-A' })
        .select()
        .single();

    const { data: tenantB, error: errB } = await admin
        .from('tenants')
        .insert({ tenant_code: 'TEST-B', name: 'Tenant de Prueba B', legal_name: 'Test B S.A.', tax_id: 'NIT-TEST-B' })
        .select()
        .single();

    if (errA || errB) {
        throw new Error(`Error creando tenants de prueba: ${JSON.stringify(errA || errB)}`);
    }

    console.log(`✓ Tenants creados con éxito: Tenant A (${tenantA.id}) y Tenant B (${tenantB.id})`);

    const cleanup = async () => {
        console.log('\nLimpiando datos de prueba...');
        for (const authId of createdAuthUserIds) {
            await admin.auth.admin.deleteUser(authId).catch(() => {});
        }
        await admin.from('tenants').delete().in('id', [tenantA.id, tenantB.id]);
        console.log('✓ Limpieza completada.');
    };

    const createdAuthUserIds: string[] = [];

    try {
        // 2. Crear usuarios REALES en auth.users (no UUIDs inventados) con password,
        // para poder autenticar después con la anon key y obtener un JWT válido
        // que RLS pueda evaluar con auth.uid().
        const passwordA = crypto.randomBytes(18).toString('base64url');
        const emailA = `rls-test-a-${Date.now()}@test.invalid`;

        const { data: authUserA, error: errAuthA } = await admin.auth.admin.createUser({
            email: emailA,
            password: passwordA,
            email_confirm: true,
        });
        if (errAuthA || !authUserA?.user) {
            throw new Error(`Error creando auth user A: ${JSON.stringify(errAuthA)}`);
        }
        createdAuthUserIds.push(authUserA.user.id);

        const { error: errUsrA } = await admin
            .from('users')
            .insert({
                tenant_id: tenantA.id,
                first_name: 'Usuario',
                last_name: 'Tenant A',
                email: emailA,
                auth_user_id: authUserA.user.id,
                status: 'Activo',
            });
        if (errUsrA) {
            throw new Error(`Error creando public.users para A: ${JSON.stringify(errUsrA)}`);
        }

        console.log('✓ Usuario real de prueba creado (Tenant A).');

        // 3. Crear registros de datos para cada Tenant (Sedes)
        await admin.from('sites').insert({ tenant_id: tenantA.id, site_code: 'SITE-A', name: 'Sede Principal A', status: 'Activo' });
        await admin.from('sites').insert({ tenant_id: tenantB.id, site_code: 'SITE-B', name: 'Sede Principal B', status: 'Activo' });

        // 4. Autenticar como el Usuario A de verdad (anon key + password) para
        // obtener una sesión con un JWT real firmado por Supabase Auth.
        console.log('\nValidando políticas RLS de lectura como usuario autenticado real...');

        const authClientA = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: sessionA, error: errSignIn } = await authClientA.auth.signInWithPassword({
            email: emailA,
            password: passwordA,
        });
        if (errSignIn || !sessionA?.session) {
            throw new Error(`No se pudo autenticar al Usuario A de prueba: ${JSON.stringify(errSignIn)}`);
        }

        // Cliente scoped a la sesión real del Usuario A: anon key + JWT de sesión.
        // A diferencia de la versión anterior de este script, este cliente NO
        // usa la service_role key en ningún punto — por lo tanto RLS se aplica
        // de verdad y esta prueba puede fallar si una policy está rota o ausente.
        const clientUserA = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${sessionA.session.access_token}` } },
        });

        const { data: querySitesA, error: errQueryA } = await clientUserA.from('sites').select('*');
        if (errQueryA) {
            throw new Error(`Error consultando sites como Usuario A: ${JSON.stringify(errQueryA)}`);
        }

        console.log('Sedes visibles para el Usuario A:', querySitesA);

        // Comprobar que Usuario A ve su propia sede...
        const seesOwnSite = querySitesA?.some((s) => s.tenant_id === tenantA.id);
        if (!seesOwnSite) {
            throw new Error(
                '¡FALLO! El Usuario A no ve NINGÚN dato de su propio tenant — ' +
                'la policy de RLS puede estar bloqueando de más, o la sesión no se autenticó como se esperaba.'
            );
        }

        // ...y que NO ve la sede del Tenant B.
        const containsTenantBData = querySitesA?.some((s) => s.tenant_id === tenantB.id);
        if (containsTenantBData) {
            throw new Error('¡ERROR DE SEGURIDAD! El Usuario A puede ver datos de otra empresa (Tenant B).');
        }

        console.log('✓ ÉXITO: El Usuario A ve solo su propio tenant y no el Tenant B (RLS funcionando de verdad).');
    } finally {
        await cleanup();
    }
}

async function main() {
    try {
        await runDatabaseTests();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error durante la validación:', error);
        process.exit(1);
    }
}

main();
