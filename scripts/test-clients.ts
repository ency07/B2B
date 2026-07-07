// SCRIPT DE VALIDACIÓN: REGLAS DE NEGOCIO, TRIGGERS Y RLS DE CLIENTES Y SEDES
// Archivo: scripts/test-clients.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MODELO CLIENTES Y SEDES...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000002_clients_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Validaciones sintácticas básicas de tablas y RLS
    const hasClientsTable = sql.includes('CREATE TABLE clients');
    const hasContactsTable = sql.includes('CREATE TABLE client_contacts');
    const hasSitesTable = sql.includes('CREATE TABLE client_sites');
    const hasEventsTable = sql.includes('CREATE TABLE business_events');
    
    const hasClientCodeTrigger = sql.includes('trg_handle_client_code');
    const hasPrimaryContactTrigger = sql.includes('trg_handle_primary_contact');
    const hasClientTraceTrigger = sql.includes('trg_handle_client_traceability');
    const hasContactTraceTrigger = sql.includes('trg_handle_contact_traceability');
    const hasSiteTraceTrigger = sql.includes('trg_handle_client_site_traceability');
    const hasClientEventsTrigger = sql.includes('trg_dispatch_client_events');
    const hasContactEventsTrigger = sql.includes('trg_dispatch_contact_events');
    const hasSiteEventsTrigger = sql.includes('trg_dispatch_client_site_events');

    const hasClientsRLS = sql.includes('ALTER TABLE clients ENABLE ROW LEVEL SECURITY');
    const hasContactsRLS = sql.includes('ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY');
    const hasSitesRLS = sql.includes('ALTER TABLE client_sites ENABLE ROW LEVEL SECURITY');
    const hasEventsRLS = sql.includes('ALTER TABLE business_events ENABLE ROW LEVEL SECURITY');

    console.log(`✓ Archivo de migración de Clientes encontrado: ${path.basename(migrationPath)}`);
    console.log(`✓ Tabla 'clients' definida: ${hasClientsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'client_contacts' definida: ${hasContactsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'client_sites' definida: ${hasSitesTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'business_events' definida: ${hasEventsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de autoincremento client_code: ${hasClientCodeTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de contacto principal swap: ${hasPrimaryContactTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de trazabilidad clientes: ${hasClientTraceTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de trazabilidad contactos: ${hasContactTraceTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de trazabilidad sedes: ${hasSiteTraceTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de eventos clientes: ${hasClientEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de eventos contactos: ${hasContactEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de eventos sedes: ${hasSiteEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en clients: ${hasClientsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en client_contacts: ${hasContactsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en client_sites: ${hasSitesRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en business_events: ${hasEventsRLS ? 'Sí' : 'No'}`);

    if (
        hasClientsTable && hasContactsTable && hasSitesTable && hasEventsTable &&
        hasClientCodeTrigger && hasPrimaryContactTrigger &&
        hasClientTraceTrigger && hasContactTraceTrigger && hasSiteTraceTrigger &&
        hasClientEventsTrigger && hasContactEventsTrigger && hasSiteEventsTrigger &&
        hasClientsRLS && hasContactsRLS && hasSitesRLS && hasEventsRLS
    ) {
        console.log('\n[ÉXITO] Estructura sintáctica, triggers y modelo RLS de Clientes y Sedes validados correctamente.');
    } else {
        throw new Error('Validación de estructura SQL fallida. Revise las especificaciones de triggers y políticas RLS.');
    }
}

async function runDatabaseTests() {
    if (!supabaseUrl || !supabaseKey) {
        console.log('\n[INFO] Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.');
        console.log('Se omite la prueba de base de datos activa y se ejecuta la validación mock estática.');
        await runMockValidation();
        return;
    }

    console.log('Conectando a la base de datos Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== EJECUTANDO INTEGRACIÓN Y REGLAS DE NEGOCIO FASE 2 ===');

    // 1. Crear Tenants de prueba
    const { data: tenantA, error: errA } = await supabase
        .from('tenants')
        .insert({ tenant_code: 'CLI-T-A', name: 'Tenant A Test Clientes', legal_name: 'Tenant A SAS', tax_id: 'NIT-T-A' })
        .select().single();

    const { data: tenantB, error: errB } = await supabase
        .from('tenants')
        .insert({ tenant_code: 'CLI-T-B', name: 'Tenant B Test Clientes', legal_name: 'Tenant B SAS', tax_id: 'NIT-T-B' })
        .select().single();

    if (errA || errB) {
        throw new Error(`Error creando tenants: ${JSON.stringify(errA || errB)}`);
    }
    console.log(`✓ Tenants creados: A (${tenantA.id}), B (${tenantB.id})`);

    // 2. Crear Usuarios administradores para cada Tenant
    const mockAuthIdA = '10000000-0000-0000-0000-00000000000a';
    const mockAuthIdB = '10000000-0000-0000-0000-00000000000b';

    const { data: userA, error: errUsrA } = await supabase
        .from('users')
        .insert({ tenant_id: tenantA.id, first_name: 'Admin', last_name: 'Tenant A', email: 'admin@t-a.test', auth_user_id: mockAuthIdA, status: 'Activo' })
        .select().single();

    const { data: userB, error: errUsrB } = await supabase
        .from('users')
        .insert({ tenant_id: tenantB.id, first_name: 'Admin', last_name: 'Tenant B', email: 'admin@t-b.test', auth_user_id: mockAuthIdB, status: 'Activo' })
        .select().single();

    if (errUsrA || errUsrB) {
        await cleanUp(supabase, tenantA.id, tenantB.id);
        throw new Error(`Error creando usuarios: ${JSON.stringify(errUsrA || errUsrB)}`);
    }
    console.log('✓ Usuarios creados con éxito.');

    try {
        // 3. Probar TC-CLI-01: Generación automática de client_code por tenant
        const { data: clientA1, error: errCliA1 } = await supabase
            .from('clients')
            .insert({
                tenant_id: tenantA.id,
                client_type: 'Empresa',
                legal_name: 'Empresa 1 Tenant A',
                tax_id: 'TAX-1234',
                country: 'Colombia',
                assigned_user_id: userA.id,
                status: 'PROSPECTO'
            })
            .select().single();

        const { data: clientA2, error: errCliA2 } = await supabase
            .from('clients')
            .insert({
                tenant_id: tenantA.id,
                client_type: 'Persona',
                legal_name: 'Persona 2 Tenant A',
                tax_id: 'TAX-5678',
                country: 'Colombia',
                assigned_user_id: userA.id,
                status: 'PROSPECTO'
            })
            .select().single();

        if (errCliA1 || errCliA2) throw new Error(`Error insertando clientes: ${JSON.stringify(errCliA1 || errCliA2)}`);

        console.log(`✓ TC-CLI-01: Códigos autogenerados: ${clientA1.client_code} (esperado CLI-000001), ${clientA2.client_code} (esperado CLI-000002)`);
        if (clientA1.client_code !== 'CLI-000001' || clientA2.client_code !== 'CLI-000002') {
            throw new Error('¡ERROR! Autoincremento secuencial incorrecto o nulo.');
        }

        // 4. Probar TC-CLI-02: Inmutabilidad de client_code en UPDATE
        const { data: clientA1Updated, error: errUpdateCli } = await supabase
            .from('clients')
            .update({ client_code: 'HACKED-CODE' })
            .eq('id', clientA1.id)
            .select().single();

        if (errUpdateCli) throw new Error(`Error actualizando cliente: ${JSON.stringify(errUpdateCli)}`);
        
        console.log(`✓ TC-CLI-02: Código tras intento de alteración: ${clientA1Updated.client_code}`);
        if (clientA1Updated.client_code === 'HACKED-CODE') {
            throw new Error('¡ERROR DE SEGURIDAD! El client_code fue modificado.');
        }

        // 5. Probar TC-CLI-03 y TC-CLI-04: Restricciones de TAX_ID únicas por tenant
        // Inserción duplicada en mismo Tenant A -> Debe fallar
        const { error: errDupTax } = await supabase
            .from('clients')
            .insert({
                tenant_id: tenantA.id,
                client_type: 'Empresa',
                legal_name: 'Empresa Duplicada',
                tax_id: 'TAX-1234', // Duplicado de clientA1
                country: 'Colombia',
                assigned_user_id: userA.id
            });

        console.log(`✓ TC-CLI-03: Bloqueo de TAX_ID duplicado en mismo Tenant: ${errDupTax ? 'Bloqueado Correctamente' : 'Fallo de Bloqueo'}`);
        if (!errDupTax) throw new Error('¡ERROR! Se permitió registrar el mismo TAX_ID en el mismo tenant.');

        // Inserción en Tenant B con mismo TAX_ID -> Debe pasar exitosamente
        const { data: clientB1, error: errTaxB } = await supabase
            .from('clients')
            .insert({
                tenant_id: tenantB.id,
                client_type: 'Empresa',
                legal_name: 'Empresa 1 Tenant B',
                tax_id: 'TAX-1234', // Mismo TAX_ID que clientA1
                country: 'Ecuador',
                assigned_user_id: userB.id
            })
            .select().single();

        if (errTaxB) throw new Error(`Error en TC-CLI-04: ${JSON.stringify(errTaxB)}`);
        console.log(`✓ TC-CLI-04: Mismo TAX_ID permitido en tenants cruzados. ID insertado en Tenant B: ${clientB1.id}`);

        // 6. Probar TC-CON-01: Reemplazo automático del contacto principal
        const { data: contact1, error: errCon1 } = await supabase
            .from('client_contacts')
            .insert({
                tenant_id: tenantA.id,
                client_id: clientA1.id,
                first_name: 'Primer',
                last_name: 'Contacto',
                is_primary: true
            })
            .select().single();

        if (errCon1) throw new Error(`Error creando contacto 1: ${JSON.stringify(errCon1)}`);
        console.log(`✓ Contacto 1 creado. Principal: ${contact1.is_primary}`);

        const { data: contact2, error: errCon2 } = await supabase
            .from('client_contacts')
            .insert({
                tenant_id: tenantA.id,
                client_id: clientA1.id,
                first_name: 'Segundo',
                last_name: 'Contacto',
                is_primary: true
            })
            .select().single();

        if (errCon2) throw new Error(`Error creando contacto 2: ${JSON.stringify(errCon2)}`);

        const { data: contact1Verify, error: errCon1Verify } = await supabase
            .from('client_contacts')
            .select('*')
            .eq('id', contact1.id)
            .single();

        if (errCon1Verify) throw new Error(`Error consultando contacto 1: ${JSON.stringify(errCon1Verify)}`);

        console.log(`✓ TC-CON-01: Reemplazo automático de contacto principal.`);
        console.log(`   - Contacto 1 (Viejo principal): is_primary = ${contact1Verify.is_primary} (esperado false)`);
        console.log(`   - Contacto 2 (Nuevo principal): is_primary = ${contact2.is_primary} (esperado true)`);

        if (contact1Verify.is_primary === true || contact2.is_primary === false) {
            throw new Error('¡ERROR! El reemplazo automático de contacto principal falló.');
        }

        // 7. Probar TC-CON-02: Soft delete de contacto
        const { data: contact2Deleted, error: errSoftDel } = await supabase
            .from('client_contacts')
            .update({
                deleted_at: new Date().toISOString(),
                delete_reason: 'Desvinculado por reestructuración'
            })
            .eq('id', contact2.id)
            .select().single();

        if (errSoftDel) throw new Error(`Error ejecutando soft delete: ${JSON.stringify(errSoftDel)}`);
        console.log(`✓ TC-CON-02: Soft delete ejecutado. deleted_at: ${contact2Deleted.deleted_at}, delete_reason: '${contact2Deleted.delete_reason}'`);

        // 8. Probar TC-STE-01: Registro de sedes de clientes (client_sites)
        const { data: clientSite, error: errSite } = await supabase
            .from('client_sites')
            .insert({
                tenant_id: tenantA.id,
                client_id: clientA1.id,
                site_name: 'Sucursal Medellín',
                country: 'Colombia',
                city: 'Medellín',
                address: 'Calle 10 # 50-60',
                is_billing: true
            })
            .select().single();

        if (errSite) throw new Error(`Error registrando sede del cliente: ${JSON.stringify(errSite)}`);
        console.log(`✓ TC-STE-01: Registro de sede comercial exitoso. ID: ${clientSite.id}, Nombre: ${clientSite.site_name}`);

        // 9. Probar TC-STE-02: Soft delete de sede comercial
        const { data: clientSiteDeleted, error: errSiteDel } = await supabase
            .from('client_sites')
            .update({
                deleted_at: new Date().toISOString(),
                delete_reason: 'Bodega clausurada'
            })
            .eq('id', clientSite.id)
            .select().single();

        if (errSiteDel) throw new Error(`Error en soft delete de sede: ${JSON.stringify(errSiteDel)}`);
        console.log(`✓ TC-STE-02: Soft delete de sede ejecutado con éxito. Motivo: ${clientSiteDeleted.delete_reason}`);

        // 10. Probar TC-EVT-01 y TC-EVT-02: Emisión de eventos de negocio
        const { data: events, error: errEvts } = await supabase
            .from('business_events')
            .select('*')
            .eq('tenant_id', tenantA.id);

        if (errEvts) throw new Error(`Error consultando eventos: ${JSON.stringify(errEvts)}`);
        
        console.log('\nListado de eventos de negocio capturados en business_events para Tenant A:');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events.forEach((evt: any) => {
            console.log(`   - [${evt.event_code}] Entidad: ${evt.entity_type} (${evt.entity_id}). Payload: ${JSON.stringify(evt.payload)}`);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventCodes = events.map((e: any) => e.event_code);
        if (!eventCodes.includes('CLIENT_CREATED')) {
            throw new Error('¡ERROR! Falta evento de negocio: CLIENT_CREATED');
        }
        if (!eventCodes.includes('CONTACT_PRIMARY_CHANGED')) {
            throw new Error('¡ERROR! Falta evento de negocio: CONTACT_PRIMARY_CHANGED');
        }
        if (!eventCodes.includes('CLIENT_SITE_CREATED')) {
            throw new Error('¡ERROR! Falta evento de negocio: CLIENT_SITE_CREATED');
        }
        if (!eventCodes.includes('CLIENT_SITE_DELETED')) {
            throw new Error('¡ERROR! Falta evento de negocio: CLIENT_SITE_DELETED');
        }
        console.log('✓ TC-EVT-01, 02 y TC-STE-01, 02: Eventos semánticos generados y auditados correctamente en business_events.');

    } finally {
        // Limpieza de datos al finalizar
        await cleanUp(supabase, tenantA.id, tenantB.id);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cleanUp(supabase: any, tenantAId: string, tenantBId: string) {
    console.log('\nLimpiando datos de prueba de Clientes y Sedes de la base de datos...');
    try {
        await supabase.from('tenants').delete().in('id', [tenantAId, tenantBId]);
        console.log('✓ Limpieza completada con éxito.');
    } catch (e) {
        console.error('Error durante la limpieza:', e);
    }
}

async function main() {
    try {
        await runDatabaseTests();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Falló la verificación de reglas de Clientes:', error);
        process.exit(1);
    }
}

main();
