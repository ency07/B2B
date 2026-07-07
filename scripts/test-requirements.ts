// SCRIPT DE VALIDACIÓN: REGLAS DE NEGOCIO, TRIGGERS Y RLS DE REQUERIMIENTOS Y DOCUMENTOS
// Archivo: scripts/test-requirements.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MODELO REQUERIMIENTOS Y DOCUMENTOS...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000003_requirements_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Validaciones sintácticas básicas de tablas y RLS
    const hasRequirementsTable = sql.includes('CREATE TABLE requirements');
    const hasDocumentsTable = sql.includes('CREATE TABLE documents');
    const hasSequencesTable = sql.includes('CREATE TABLE tenant_sequences');
    
    const hasReqCodeTrigger = sql.includes('trg_handle_requirement_code');
    const hasDocCodeTrigger = sql.includes('trg_handle_document_code');
    const hasDocVersionTrigger = sql.includes('trg_handle_document_versioning');
    const hasReqTraceTrigger = sql.includes('trg_handle_requirement_traceability');
    const hasReqStateTrigger = sql.includes('trg_validate_requirement_state');
    const hasReqPermsTrigger = sql.includes('trg_enforce_requirement_permissions');
    const hasReqEventsTrigger = sql.includes('trg_dispatch_requirement_events');
    const hasDocEventsTrigger = sql.includes('trg_dispatch_document_events');

    const hasRequirementsRLS = sql.includes('ALTER TABLE requirements ENABLE ROW LEVEL SECURITY');
    const hasDocumentsRLS = sql.includes('ALTER TABLE documents ENABLE ROW LEVEL SECURITY');

    console.log(`✓ Archivo de migración de Requerimientos encontrado: ${path.basename(migrationPath)}`);
    console.log(`✓ Tabla 'tenant_sequences' definida: ${hasSequencesTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'requirements' definida: ${hasRequirementsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'documents' definida: ${hasDocumentsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de autoincremento requirement_code: ${hasReqCodeTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de autoincremento document_code: ${hasDocCodeTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de versionado automático documentos: ${hasDocVersionTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de trazabilidad y SLAs requerimientos: ${hasReqTraceTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de transición de estados: ${hasReqStateTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de permisos por rol de usuario: ${hasReqPermsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de eventos de negocio de requerimientos: ${hasReqEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de eventos de negocio de documentos: ${hasDocEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en requirements: ${hasRequirementsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en documents: ${hasDocumentsRLS ? 'Sí' : 'No'}`);

    if (
        hasRequirementsTable && hasDocumentsTable && hasSequencesTable &&
        hasReqCodeTrigger && hasDocCodeTrigger && hasDocVersionTrigger &&
        hasReqTraceTrigger && hasReqStateTrigger && hasReqPermsTrigger &&
        hasReqEventsTrigger && hasDocEventsTrigger &&
        hasRequirementsRLS && hasDocumentsRLS
    ) {
        console.log('\n[ÉXITO] Estructura sintáctica, triggers y RLS de Requerimientos y Documentos validados correctamente.');
    } else {
        throw new Error('Validación de estructura SQL de Requerimientos fallida. Revise las especificaciones de la migración.');
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

    console.log('=== EJECUTANDO INTEGRACIÓN Y REGLAS DE NEGOCIO FASE 3 ===');

    // 1. Crear Tenants de prueba
    const { data: tenantA, error: errA } = await supabase
        .from('tenants')
        .insert({ tenant_code: 'REQ-T-A', name: 'Tenant A Test Requerimientos', legal_name: 'Tenant A SAS', tax_id: 'NIT-REQ-A' })
        .select().single();

    const { data: tenantB, error: errB } = await supabase
        .from('tenants')
        .insert({ tenant_code: 'REQ-T-B', name: 'Tenant B Test Requerimientos', legal_name: 'Tenant B SAS', tax_id: 'NIT-REQ-B' })
        .select().single();

    if (errA || errB) {
        throw new Error(`Error creando tenants: ${JSON.stringify(errA || errB)}`);
    }
    console.log(`✓ Tenants creados: A (${tenantA.id}), B (${tenantB.id})`);

    // Obtenemos los roles de la base de datos
    const { data: rolesList } = await supabase.from('roles').select('id, role_code');
    const ejecutivoComercialRole = rolesList?.find(r => r.role_code === 'EJECUTIVO_COMERCIAL');
    const tecnicoCampoRole = rolesList?.find(r => r.role_code === 'TECNICO_CAMPO');
    const gerenteGeneralRole = rolesList?.find(r => r.role_code === 'GERENTE_GENERAL');

    if (!ejecutivoComercialRole || !tecnicoCampoRole || !gerenteGeneralRole) {
        await cleanUp(supabase, tenantA.id, tenantB.id);
        throw new Error('No se encontraron los roles básicos sembrados en la base de datos. Ejecute la migración de semilla.');
    }

    // 2. Crear Usuarios administradores y roles de prueba
    const mockAuthIdA = '30000000-0000-0000-0000-00000000000a';
    const mockAuthIdB = '30000000-0000-0000-0000-00000000000b';

    const { data: userA, error: errUsrA } = await supabase
        .from('users')
        .insert({ tenant_id: tenantA.id, first_name: 'Comercial', last_name: 'Tenant A', email: 'comercial@t-a.test', auth_user_id: mockAuthIdA, status: 'Activo' })
        .select().single();

    const { data: userB, error: errUsrB } = await supabase
        .from('users')
        .insert({ tenant_id: tenantB.id, first_name: 'Comercial', last_name: 'Tenant B', email: 'comercial@t-b.test', auth_user_id: mockAuthIdB, status: 'Activo' })
        .select().single();

    if (errUsrA || errUsrB) {
        await cleanUp(supabase, tenantA.id, tenantB.id);
        throw new Error(`Error creando usuarios: ${JSON.stringify(errUsrA || errUsrB)}`);
    }
    console.log('✓ Usuarios creados con éxito.');

    // Asignar roles a los usuarios
    await supabase.from('user_roles').insert([
        { user_id: userA.id, role_id: ejecutivoComercialRole.id, tenant_id: tenantA.id },
        { user_id: userB.id, role_id: ejecutivoComercialRole.id, tenant_id: tenantB.id }
    ]);
    console.log('✓ Roles comerciales asignados.');

    // 3. Crear Cliente de prueba para asociar requerimientos
    const { data: clientA, error: errCliA } = await supabase
        .from('clients')
        .insert({
            tenant_id: tenantA.id,
            client_type: 'Empresa',
            legal_name: 'Cliente Prueba Requerimientos',
            tax_id: 'NIT-CLIENT-REQ',
            country: 'Colombia',
            assigned_user_id: userA.id,
            status: 'ACTIVO'
        })
        .select().single();

    if (errCliA) {
        await cleanUp(supabase, tenantA.id, tenantB.id);
        throw new Error(`Error creando cliente: ${JSON.stringify(errCliA)}`);
    }
    console.log('✓ Cliente de prueba registrado.');

    try {
        // Simular contexto de base de datos definiendo claims o bypass de service_role para operaciones normales
        // 4. Probar TC-REQ-01: Auto-incremento de requirement_code por tenant usando la tabla de secuencias
        const { data: req1, error: errReq1 } = await supabase
            .from('requirements')
            .insert({
                tenant_id: tenantA.id,
                client_id: clientA.id,
                title: 'Mantenimiento Preventivo Chiller 1',
                category: 'MANTENIMIENTO',
                priority: 'HIGH',
                status: 'BORRADOR',
                created_by: userA.id
            })
            .select().single();

        if (errReq1) throw new Error(`Error creando requerimiento: ${JSON.stringify(errReq1)}`);
        console.log(`✓ TC-REQ-01: Código generado: ${req1.requirement_code} (esperado REQ-000001)`);
        
        if (req1.requirement_code !== 'REQ-000001') {
            throw new Error('¡ERROR! Código incremental inválido.');
        }

        // Verificar SLAs físicos almacenados
        console.log(`✓ SLAs Físicos calculados: Response: ${req1.sla_response_due_at}, Close: ${req1.sla_close_due_at}`);
        if (!req1.sla_close_due_at) {
            throw new Error('¡ERROR! sla_close_due_at no se guardó físicamente.');
        }

        // 5. Probar TC-REQ-03: Bloqueo de cambio a DIAGNOSTICO sin responsable técnico
        const { error: errToDiag } = await supabase
            .from('requirements')
            .update({ status: 'DIAGNOSTICO' })
            .eq('id', req1.id);

        console.log(`✓ TC-REQ-03: Bloqueo de DIAGNOSTICO sin responsable: ${errToDiag ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errToDiag) throw new Error('¡ERROR! Se permitió avanzar a DIAGNOSTICO sin engineering_user_id.');

        // Avanzar flujo lineal: BORRADOR -> NUEVO -> EN_REVISION -> DIAGNOSTICO (con responsable técnico)
        await supabase.from('requirements').update({ status: 'NUEVO' }).eq('id', req1.id);
        await supabase.from('requirements').update({ status: 'EN_REVISION' }).eq('id', req1.id);
        
        const { error: errDiagOk } = await supabase
            .from('requirements')
            .update({ status: 'DIAGNOSTICO', engineering_user_id: userA.id })
            .eq('id', req1.id);

        if (errDiagOk) throw new Error(`Error al avanzar a DIAGNOSTICO con responsable técnico: ${JSON.stringify(errDiagOk)}`);
        console.log(`✓ Requerimiento en DIAGNOSTICO con responsable técnico asignado.`);

        // 6. Probar TC-REQ-04: Bloqueo de COTIZACION sin reporte de diagnóstico en PDF
        const { error: errToCot } = await supabase
            .from('requirements')
            .update({ status: 'COTIZACION' })
            .eq('id', req1.id);

        console.log(`✓ TC-REQ-04: Bloqueo de COTIZACION sin reporte: ${errToCot ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errToCot) throw new Error('¡ERROR! Se permitió avanzar a COTIZACION sin PDF de DIAGNOSTIC.');

        // Registrar documento diagnóstico
        const { data: docDiag, error: errDoc } = await supabase
            .from('documents')
            .insert({
                tenant_id: tenantA.id,
                document_type: 'DIAGNOSTIC',
                entity_type: 'REQUIREMENT',
                entity_id: req1.id,
                file_name: 'diagnostico.pdf',
                file_path: '/chiller1/diagnostico.pdf',
                file_size: 1024,
                checksum: 'checksum-chiller-1',
                storage_provider: 'SUPABASE',
                storage_path: 'req/1/diagnostico.pdf',
                uploaded_by: userA.id,
                status: 'PUBLICADO'
            })
            .select().single();

        if (errDoc) throw new Error(`Error cargando diagnóstico: ${JSON.stringify(errDoc)}`);
        console.log(`✓ Documento DIAGNOSTIC en PDF cargado: ${docDiag.document_code}`);

        // Intentar avanzar a COTIZACION (debe pasar con comercial y diagnóstico cargado)
        const { error: errCotOk } = await supabase
            .from('requirements')
            .update({ status: 'COTIZACION', sales_user_id: userA.id })
            .eq('id', req1.id);

        if (errCotOk) throw new Error(`Error al avanzar a COTIZACION: ${JSON.stringify(errCotOk)}`);
        console.log(`✓ Requerimiento en COTIZACION con éxito.`);

        // 7. Probar TC-DOC-01: Versionamiento documental automático
        const { data: docDiagV2, error: errDocV2 } = await supabase
            .from('documents')
            .insert({
                tenant_id: tenantA.id,
                document_code: docDiag.document_code,
                document_type: 'DIAGNOSTIC',
                entity_type: 'REQUIREMENT',
                entity_id: req1.id,
                file_name: 'diagnostico_v2.pdf',
                file_path: '/chiller1/diagnostico_v2.pdf',
                file_size: 2048,
                checksum: 'checksum-chiller-2',
                storage_provider: 'SUPABASE',
                storage_path: 'req/1/diagnostico_v2.pdf',
                uploaded_by: userA.id,
                status: 'PUBLICADO'
            })
            .select().single();

        if (errDocV2) throw new Error(`Error subiendo versión 2: ${JSON.stringify(errDocV2)}`);
        console.log(`✓ Versión 2 de Diagnóstico registrada: ${docDiagV2.document_code}, versión calculada: ${docDiagV2.version}`);

        // Comprobar que versión 1 cambió a OBSOLETO
        const { data: docDiagV1Check } = await supabase
            .from('documents')
            .select('status')
            .eq('id', docDiag.id)
            .single();

        console.log(`✓ Estado versión 1 anterior: ${docDiagV1Check?.status} (esperado OBSOLETO)`);
        if (docDiagV1Check?.status !== 'OBSOLETO') {
            throw new Error('¡ERROR! La versión previa no cambió a OBSOLETO.');
        }

        // 8. Probar TC-REQ-06: Cancelación Estructurada Obligatoria
        const { error: errCancelNoParams } = await supabase
            .from('requirements')
            .update({ status: 'CANCELADO' })
            .eq('id', req1.id);

        console.log(`✓ TC-REQ-06: Bloqueo de CANCELADO sin motivo ni código: ${errCancelNoParams ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errCancelNoParams) throw new Error('¡ERROR! Se permitió cancelar sin catálogo ni justificación.');

        const { data: reqCancelCheck, error: errCancelOk } = await supabase
            .from('requirements')
            .update({
                status: 'CANCELADO',
                cancel_code: 'SIN_PRESUPUESTO',
                cancel_reason: 'El cliente suspende inversión temporalmente.'
            })
            .eq('id', req1.id)
            .select().single();

        if (errCancelOk) throw new Error(`Error al cancelar: ${JSON.stringify(errCancelOk)}`);
        console.log(`✓ Requerimiento cancelado con código ${reqCancelCheck.cancel_code} y autor ${reqCancelCheck.cancelled_by}`);

        // 9. Probar Prevención de Eliminación Física (Soft Delete obligatorio)
        const { error: errPhysicalDelete } = await supabase
            .from('requirements')
            .delete()
            .eq('id', req1.id);

        console.log(`✓ Bloqueo de borrado físico en base de datos: ${errPhysicalDelete ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errPhysicalDelete) throw new Error('¡ERROR! Se permitió borrar físicamente un requerimiento.');

        console.log('\n[ÉXITO] Todas las validaciones de base de datos activas de Fase 3 completaron satisfactoriamente.');

    } finally {
        await cleanUp(supabase, tenantA.id, tenantB.id);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cleanUp(supabase: any, tenantAId: string, tenantBId: string) {
    console.log('\nLimpiando datos de prueba de base de datos...');
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
        console.error('\n[FALLO] Error en validación de requerimientos:', error);
        process.exit(1);
    }
}

main();
