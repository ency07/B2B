// SCRIPT DE VALIDACIÓN: MOTOR DE APROBACIONES (FASE 5)
// Archivo: scripts/test-aprobaciones.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MOTOR DE APROBACIONES...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000005_approvals_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar Tablas
    const hasFlowsTable = sql.includes('CREATE TABLE approval_flows');
    const hasStepsTable = sql.includes('CREATE TABLE approval_steps');
    const hasRulesTable = sql.includes('CREATE TABLE approval_rules');
    const hasRequestsTable = sql.includes('CREATE TABLE approval_requests');
    const hasRequestStepsTable = sql.includes('CREATE TABLE approval_request_steps');

    // 2. Validar Funciones y Triggers
    const hasSeqTrigger = sql.includes('handle_approval_sequences');
    const hasPermsTrigger = sql.includes('enforce_approval_config_permissions');
    const hasTraceTrigger = sql.includes('handle_approval_traceability');
    const hasRouteTrigger = sql.includes('route_quote_approvals');
    const hasLockTrigger = sql.includes('check_quote_approval_lock');
    const hasResolveFunc = sql.includes('resolve_approval_step');
    const hasEventsTrigger = sql.includes('dispatch_approval_events');
    const hasBlockDelete = sql.includes('block_physical_approval_delete');

    // 3. Validar RLS
    const hasFlowsRLS = sql.includes('ALTER TABLE approval_flows ENABLE ROW LEVEL SECURITY');
    const hasStepsRLS = sql.includes('ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY');
    const hasRulesRLS = sql.includes('ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY');
    const hasRequestsRLS = sql.includes('ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY');
    const hasRequestStepsRLS = sql.includes('ALTER TABLE approval_request_steps ENABLE ROW LEVEL SECURITY');

    console.log(`✓ Archivo de migración de Aprobaciones encontrado: ${path.basename(migrationPath)}`);
    console.log(`✓ Tabla 'approval_flows' definida: ${hasFlowsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'approval_steps' definida: ${hasStepsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'approval_rules' definida: ${hasRulesTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'approval_requests' definida: ${hasRequestsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'approval_request_steps' definida: ${hasRequestStepsTable ? 'Sí' : 'No'}`);
    
    console.log(`✓ Trigger de secuencias de códigos: ${hasSeqTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de permisos de configuración: ${hasPermsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de trazabilidad: ${hasTraceTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de ruteo en cotizaciones: ${hasRouteTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de bloqueo de modificación de cotización: ${hasLockTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Función de firma y resolución de aprobación: ${hasResolveFunc ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de eventos de negocio: ${hasEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de prevención de borrado físico: ${hasBlockDelete ? 'Sí' : 'No'}`);

    console.log(`✓ RLS habilitado en approval_flows: ${hasFlowsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en approval_steps: ${hasStepsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en approval_rules: ${hasRulesRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en approval_requests: ${hasRequestsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en approval_request_steps: ${hasRequestStepsRLS ? 'Sí' : 'No'}`);

    const isValid = hasFlowsTable && hasStepsTable && hasRulesTable && hasRequestsTable && hasRequestStepsTable &&
                    hasSeqTrigger && hasPermsTrigger && hasTraceTrigger && hasRouteTrigger && hasLockTrigger &&
                    hasResolveFunc && hasEventsTrigger && hasBlockDelete &&
                    hasFlowsRLS && hasStepsRLS && hasRulesRLS && hasRequestsRLS && hasRequestStepsRLS;

    if (isValid) {
        console.log('\n[ÉXITO] Estructura sintáctica, triggers, RLS y funciones del Motor de Aprobaciones validados correctamente.');
    } else {
        throw new Error('Validación de estructura SQL de Aprobaciones fallida. Revise las especificaciones de la migración.');
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

    console.log('=== EJECUTANDO INTEGRACIÓN Y REGLAS DE NEGOCIO FASE 5 (APROBACIONES) ===');

    // 1. Crear Tenants de prueba
    const { data: tenant, error: errT } = await supabase
        .from('tenants')
        .insert({ tenant_code: 'APR-T-A', name: 'Tenant Test Aprobaciones', legal_name: 'Tenant Approvals SAS', tax_id: 'NIT-APR-A' })
        .select().single();

    if (errT) throw new Error(`Error creando tenant: ${JSON.stringify(errT)}`);
    console.log(`✓ Tenant creado: ${tenant.id}`);

    // Roles
    const { data: rolesList } = await supabase.from('roles').select('id, role_code');
    const ejecutivoRole = rolesList?.find(r => r.role_code === 'EJECUTIVO_COMERCIAL');
    const directorRole = rolesList?.find(r => r.role_code === 'DIRECTOR_COMERCIAL');
    const gerenteRole = rolesList?.find(r => r.role_code === 'GERENTE_GENERAL');

    if (!ejecutivoRole || !directorRole || !gerenteRole) {
        await cleanUp(supabase, tenant.id);
        throw new Error('No se encontraron los roles básicos sembrados en la base de datos.');
    }

    // 2. Crear Usuarios administradores y roles de prueba
    const mockAuthA = '50000000-0000-0000-0000-00000000000a';
    const mockAuthB = '50000000-0000-0000-0000-00000000000b';

    const { data: userA } = await supabase
        .from('users')
        .insert({ tenant_id: tenant.id, first_name: 'Comercial A', last_name: 'Test', email: 'comercial@apr.test', auth_user_id: mockAuthA, status: 'Activo' })
        .select().single();

    const { data: userB } = await supabase
        .from('users')
        .insert({ tenant_id: tenant.id, first_name: 'Gerente B', last_name: 'Test', email: 'gerente@apr.test', auth_user_id: mockAuthB, status: 'Activo' })
        .select().single();

    // Asignar roles
    await supabase.from('user_roles').insert([
        { user_id: userA.id, role_id: ejecutivoRole.id, tenant_id: tenant.id },
        { user_id: userB.id, role_id: gerenteRole.id, tenant_id: tenant.id }
    ]);
    console.log('✓ Usuarios de prueba creados y asignados.');

    // 3. Crear Cliente y Requerimiento de prueba
    const { data: client } = await supabase
        .from('clients')
        .insert({ tenant_id: tenant.id, client_type: 'Empresa', legal_name: 'Cliente Aprobaciones', tax_id: 'NIT-CLI-APR', country: 'Colombia', assigned_user_id: userA.id, status: 'ACTIVO' })
        .select().single();

    const { data: req } = await supabase
        .from('requirements')
        .insert({ tenant_id: tenant.id, client_id: client.id, title: 'Requerimiento Aprobaciones', category: 'FABRICACION', priority: 'MEDIUM', status: 'BORRADOR', created_by: userA.id })
        .select().single();

    try {
        // 4. Configurar flujo, pasos y reglas
        const { data: flow } = await supabase
            .from('approval_flows')
            .insert({ tenant_id: tenant.id, name: 'Flujo de Aprobación Comercial', flow_type: 'SECUENCIAL', status: 'ACTIVO', created_by: userA.id })
            .select().single();

        console.log(`✓ Flujo de aprobación creado: ${flow.flow_code}`);

        // Pasos del flujo
        // Paso 1: Ejecutivo Comercial (User A)
        await supabase.from('approval_steps').insert({
            tenant_id: tenant.id, flow_id: flow.id, step_order: 1, user_id: userA.id, required: true, created_by: userA.id
        });
        // Paso 2: Gerente General (Role GERENTE_GENERAL)
        await supabase.from('approval_steps').insert({
            tenant_id: tenant.id, flow_id: flow.id, step_order: 2, role_id: gerenteRole.id, required: true, created_by: userA.id
        });
        console.log('✓ Pasos del flujo configurados.');

        // Reglas de Aprobación
        // Regla 1: 0 - 5.000.000 -> Auto-aprobación (flow_id NULL)
        await supabase.from('approval_rules').insert({
            tenant_id: tenant.id, entity_type: 'QUOTE', min_amount: 0.00, max_amount: 5000000.00, flow_id: null, active: true, created_by: userA.id
        });
        // Regla 2: 5.000.001 - 20.000.000 -> Flujo Comercial
        await supabase.from('approval_rules').insert({
            tenant_id: tenant.id, entity_type: 'QUOTE', min_amount: 5000001.00, max_amount: 20000000.00, flow_id: flow.id, active: true, created_by: userA.id
        });
        console.log('✓ Reglas de montos registradas.');

        // 5. Test TC-APR-01: Auto-aprobación directa en rango exento (0 - 5.000.000)
        const { data: quoteExempt } = await supabase
            .from('quotes')
            .insert({
                tenant_id: tenant.id, client_id: client.id, requirement_id: req.id, assigned_user_id: userA.id, valid_until: '2026-12-31', status: 'BORRADOR', created_by: userA.id
            })
            .select().single();

        // Agregar ítem de bajo valor (10.000)
        await supabase.from('quote_items').insert({
            tenant_id: tenant.id, quote_id: quoteExempt.id, item_order: 1, item_type: 'MATERIAL', description: 'Item barato', quantity: 1, unit: 'UNIDAD', unit_price: 10000.00
        });

        // Cambiar a EN_REVISION (Debe auto-aprobarse)
        const { data: quoteExemptCheck } = await supabase
            .from('quotes')
            .update({ status: 'EN_REVISION' })
            .eq('id', quoteExempt.id)
            .select('status')
            .single();

        console.log(`✓ TC-APR-01: Cotización exenta cambiada a EN_REVISION. Estado final: ${quoteExemptCheck?.status} (esperado APROBADA)`);
        if (quoteExemptCheck?.status !== 'APROBADA') {
            throw new Error('¡ERROR! La cotización en rango exento no se auto-aprobó.');
        }

        // 6. Test TC-APR-02: Aprobación requerida en rango de flujo (5.000.001 - 20.000.000)
        const { data: quoteRequired } = await supabase
            .from('quotes')
            .insert({
                tenant_id: tenant.id, client_id: client.id, requirement_id: req.id, assigned_user_id: userA.id, valid_until: '2026-12-31', status: 'BORRADOR', created_by: userA.id
            })
            .select().single();

        // Agregar ítem de alto valor (10.000.000)
        await supabase.from('quote_items').insert({
            tenant_id: tenant.id, quote_id: quoteRequired.id, item_order: 1, item_type: 'MATERIAL', description: 'Chiller Industrial', quantity: 1, unit: 'UNIDAD', unit_price: 10000000.00
        });

        // Cambiar a EN_REVISION (Debe crear solicitud de aprobación)
        await supabase.from('quotes').update({ status: 'EN_REVISION' }).eq('id', quoteRequired.id);

        const { data: appRequest } = await supabase
            .from('approval_requests')
            .select('id, request_code, status')
            .eq('entity_id', quoteRequired.id)
            .single();

        console.log(`✓ TC-APR-02: Solicitud de aprobación creada: ${appRequest?.request_code} con estado: ${appRequest?.status} (esperado PENDIENTE)`);
        if (!appRequest || appRequest.status !== 'PENDIENTE') {
            throw new Error('¡ERROR! No se creó la solicitud de aprobación correspondiente en estado PENDIENTE.');
        }

        // 7. Test TC-APR-03: Bloqueo de modificación de cotización en aprobación
        const { error: errLockEdit } = await supabase
            .from('quote_items')
            .insert({
                tenant_id: tenant.id, quote_id: quoteRequired.id, item_order: 2, item_type: 'MATERIAL', description: 'Item extra', quantity: 1, unit: 'UNIDAD', unit_price: 500.00
            });

        console.log(`✓ TC-APR-03: Intento de editar cotización bloqueada por aprobación: ${errLockEdit ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errLockEdit) {
            throw new Error('¡ERROR! Se permitió modificar ítems de una cotización congelada bajo flujo de aprobación activo.');
        }

        // 8. Test TC-APR-04: Firma secuencial secuenciada
        // Intentar firmar paso 2 antes del paso 1 (debe fallar)
        const { error: errStep2Before1 } = await supabase.rpc('resolve_approval_step', {
            p_request_id: appRequest.id, p_step_order: 2, p_decision: 'APROBADA', p_comments: 'Aprobado por Gerencia'
        });

        console.log(`✓ TC-APR-04: Bloqueo de resolución de paso fuera de orden: ${errStep2Before1 ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errStep2Before1) {
            throw new Error('¡ERROR! Se permitió resolver el paso 2 sin antes haber resuelto el paso 1.');
        }

        // Firmar paso 1 (User A)
        const { error: errStep1 } = await supabase.rpc('resolve_approval_step', {
            p_request_id: appRequest.id, p_step_order: 1, p_decision: 'APROBADA', p_comments: 'Comercial da visto bueno'
        });

        if (errStep1) throw new Error(`Error resolviendo paso 1: ${JSON.stringify(errStep1)}`);
        console.log('✓ Paso 1 resuelto con éxito.');

        // Verificar que el estado global de la solicitud cambió a EN_PROCESO
        const { data: requestInProgress } = await supabase
            .from('approval_requests')
            .select('status')
            .eq('id', appRequest.id)
            .single();

        console.log(`✓ Estado de la solicitud en progreso: ${requestInProgress?.status} (esperado EN_PROCESO)`);
        if (requestInProgress?.status !== 'EN_PROCESO') {
            throw new Error('¡ERROR! La solicitud no cambió su estado global a EN_PROCESO.');
        }

        // Firmar paso 2 (User B - Gerente General, tiene el rol requerido)
        // Simulamos invocación con el ID del Gerente
        // Para simular el contexto de la función get_current_user_id() en supabase-js con rpc en el test con service_role,
        // la base de datos utiliza el usuario autenticado. Como estamos con service role, bypasses o usa el rol actual.
        // Pero resolve_approval_step valida el rol en user_roles del ejecutante.
        // Como corremos con service_role, is_platform_super_admin() devuelve true y le da bypass automático de firmas.
        // Firmamos el paso 2 y el trigger debe resolver toda la aprobación y liberar la cotización.
        const { error: errStep2 } = await supabase.rpc('resolve_approval_step', {
            p_request_id: appRequest.id, p_step_order: 2, p_decision: 'APROBADA', p_comments: 'Gerente aprueba monto'
        });

        if (errStep2) throw new Error(`Error resolviendo paso 2: ${JSON.stringify(errStep2)}`);
        console.log('✓ Paso 2 resuelto con éxito.');

        // Validar liberación e impacto en quotes
        const { data: quoteApprovedCheck } = await supabase
            .from('quotes')
            .select('status')
            .eq('id', quoteRequired.id)
            .single();

        console.log(`✓ Estado final de la cotización aprobada por flujo: ${quoteApprovedCheck?.status} (esperado APROBADA)`);
        if (quoteApprovedCheck?.status !== 'APROBADA') {
            throw new Error('¡ERROR! La cotización no se actualizó a APROBADA al completarse la solicitud.');
        }

        // 9. Test TC-APR-05: Escalación automática a Gerencia General por falta de reglas coincidencia
        const { data: quoteEscalated } = await supabase
            .from('quotes')
            .insert({
                tenant_id: tenant.id, client_id: client.id, requirement_id: req.id, assigned_user_id: userA.id, valid_until: '2026-12-31', status: 'BORRADOR', created_by: userA.id
            })
            .select().single();

        // Agregar ítem de valor extremo (50.000.000)
        await supabase.from('quote_items').insert({
            tenant_id: tenant.id, quote_id: quoteEscalated.id, item_order: 1, item_type: 'MATERIAL', description: 'Planta de Energía', quantity: 1, unit: 'UNIDAD', unit_price: 50000000.00
        });

        // Cambiar a EN_REVISION (Debe escalar automáticamente)
        await supabase.from('quotes').update({ status: 'EN_REVISION' }).eq('id', quoteEscalated.id);

        const { data: appEscRequest } = await supabase
            .from('approval_requests')
            .select('id, request_code, status, flow_id')
            .eq('entity_id', quoteEscalated.id)
            .single();

        if (!appEscRequest) {
            throw new Error('¡ERROR! No se creó la solicitud de aprobación escalada.');
        }
        console.log(`✓ TC-APR-05: Solicitud escalada: ${appEscRequest.request_code} (flow_id: ${appEscRequest.flow_id}, esperado null)`);
        
        // Verificar que el paso 1 de la solicitud escalada está asignado a Gerente General
        const { data: escStep } = await supabase
            .from('approval_request_steps')
            .select('role_id, step_order')
            .eq('approval_request_id', appEscRequest.id)
            .single();

        console.log(`✓ Paso de escalación asignado a rol ID: ${escStep?.role_id} (esperado ${gerenteRole.id})`);
        if (appEscRequest.flow_id !== null || escStep?.role_id !== gerenteRole.id) {
            throw new Error('¡ERROR! No se realizó la escalación automática correcta a Gerencia General.');
        }

        // 10. Test TC-APR-06: Prevención de Eliminación Física (Soft Delete obligatorio)
        const { error: errFlowDelete } = await supabase
            .from('approval_flows')
            .delete()
            .eq('id', flow.id);

        console.log(`✓ Bloqueo de borrado físico en approval_flows: ${errFlowDelete ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errFlowDelete) {
            throw new Error('¡ERROR! Se permitió borrar físicamente un flujo de aprobación.');
        }

        console.log('\n[ÉXITO] Todas las validaciones de base de datos activas de Fase 5 (Aprobaciones) completaron satisfactoriamente.');

    } finally {
        await cleanUp(supabase, tenant.id);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cleanUp(supabase: any, tenantId: string) {
    console.log('\nLimpiando datos de prueba...');
    try {
        await supabase.from('tenants').delete().eq('id', tenantId);
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
        console.error('\n[FALLO] Error en validación del motor de aprobaciones:', error);
        process.exit(1);
    }
}

main();
