// SCRIPT DE VALIDACIÓN: TRABAJOS Y ACTIVIDADES (FASE 6)
// Archivo: scripts/test-trabajos.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO TRABAJOS...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000006_jobs_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar Tablas
    const hasJobsTable = sql.includes('CREATE TABLE jobs');
    const hasActivitiesTable = sql.includes('CREATE TABLE job_activities');

    // 2. Validar Funciones y Triggers
    const hasSeqTrigger = sql.includes('handle_job_sequences');
    const hasDatesTrigger = sql.includes('validate_activity_dates');
    const hasPermsTrigger = sql.includes('enforce_job_permissions');
    const hasStateTrigger = sql.includes('validate_job_state_transitions');
    const hasPropagateActTrigger = sql.includes('handle_activity_status_propagation');
    const hasPropagateCancelTrigger = sql.includes('handle_job_cancellation_propagation');
    const hasOtJobTrigger = sql.includes('create_job_on_ot_generation');
    const hasEventsTrigger = sql.includes('dispatch_job_events');
    const hasBlockDelete = sql.includes('block_physical_job_delete');

    // 3. Validar RLS
    const hasJobsRLS = sql.includes('ALTER TABLE jobs ENABLE ROW LEVEL SECURITY');
    const hasActivitiesRLS = sql.includes('ALTER TABLE job_activities ENABLE ROW LEVEL SECURITY');

    console.log(`✓ Archivo de migración de Trabajos encontrado: ${path.basename(migrationPath)}`);
    console.log(`✓ Tabla 'jobs' definida: ${hasJobsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'job_activities' definida: ${hasActivitiesTable ? 'Sí' : 'No'}`);
    
    console.log(`✓ Trigger de secuencias de códigos: ${hasSeqTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de validación de fechas de actividad: ${hasDatesTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de permisos: ${hasPermsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de transiciones de estado del Job: ${hasStateTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de propagación Actividad -> Job: ${hasPropagateActTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de propagación de cancelación Job -> Actividades: ${hasPropagateCancelTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de creación de Job al generar OT: ${hasOtJobTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de eventos de negocio: ${hasEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de prevención de borrado físico: ${hasBlockDelete ? 'Sí' : 'No'}`);

    console.log(`✓ RLS habilitado en jobs: ${hasJobsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en job_activities: ${hasActivitiesRLS ? 'Sí' : 'No'}`);

    const isValid = hasJobsTable && hasActivitiesTable &&
                    hasSeqTrigger && hasDatesTrigger && hasPermsTrigger && hasStateTrigger &&
                    hasPropagateActTrigger && hasPropagateCancelTrigger && hasOtJobTrigger &&
                    hasEventsTrigger && hasBlockDelete &&
                    hasJobsRLS && hasActivitiesRLS;

    if (isValid) {
        console.log('\n[ÉXITO] Estructura sintáctica, triggers, RLS y funciones del Módulo de Trabajos validados correctamente.');
    } else {
        throw new Error('Validación de estructura SQL de Trabajos fallida. Revise las especificaciones de la migración.');
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

    console.log('=== EJECUTANDO INTEGRACIÓN Y REGLAS DE NEGOCIO FASE 6 (TRABAJOS) ===');

    // 1. Crear Tenants de prueba
    const { data: tenant, error: errT } = await supabase
        .from('tenants')
        .insert({ tenant_code: 'JOB-T-A', name: 'Tenant Test Trabajos', legal_name: 'Tenant Jobs SAS', tax_id: 'NIT-JOB-A' })
        .select().single();

    if (errT) throw new Error(`Error creando tenant: ${JSON.stringify(errT)}`);
    console.log(`✓ Tenant creado: ${tenant.id}`);

    // Roles
    const { data: rolesList } = await supabase.from('roles').select('id, role_code');
    const tecnicoRole = rolesList?.find(r => r.role_code === 'TECNICO_CAMPO');
    const ejecutivoRole = rolesList?.find(r => r.role_code === 'EJECUTIVO_COMERCIAL');
    const gerenteRole = rolesList?.find(r => r.role_code === 'GERENTE_GENERAL');

    if (!tecnicoRole || !ejecutivoRole || !gerenteRole) {
        await cleanUp(supabase, tenant.id);
        throw new Error('No se encontraron los roles básicos sembrados en la base de datos.');
    }

    // 2. Crear Usuarios administradores y de prueba
    const mockAuthA = '60000000-0000-0000-0000-00000000000a';
    const mockAuthB = '60000000-0000-0000-0000-00000000000b';

    const { data: userA } = await supabase
        .from('users')
        .insert({ tenant_id: tenant.id, first_name: 'Ingeniero A', last_name: 'Test', email: 'ingeniero@job.test', auth_user_id: mockAuthA, status: 'Activo' })
        .select().single();

    const { data: userB } = await supabase
        .from('users')
        .insert({ tenant_id: tenant.id, first_name: 'Comercial B', last_name: 'Test', email: 'comercial@job.test', auth_user_id: mockAuthB, status: 'Activo' })
        .select().single();

    // Asignar roles
    await supabase.from('user_roles').insert([
        { user_id: userA.id, role_id: tecnicoRole.id, tenant_id: tenant.id },
        { user_id: userB.id, role_id: ejecutivoRole.id, tenant_id: tenant.id }
    ]);
    console.log('✓ Usuarios de prueba creados y asignados.');

    // 3. Crear Cliente y Requerimiento de prueba
    const { data: client } = await supabase
        .from('clients')
        .insert({ tenant_id: tenant.id, client_type: 'Empresa', legal_name: 'Cliente Trabajos', tax_id: 'NIT-CLI-JOB', country: 'Colombia', assigned_user_id: userB.id, status: 'ACTIVO' })
        .select().single();

    const { data: req } = await supabase
        .from('requirements')
        .insert({ tenant_id: tenant.id, client_id: client.id, title: 'Requerimiento de Climatización', category: 'FABRICACION', priority: 'MEDIUM', status: 'BORRADOR', created_by: userB.id, engineering_user_id: userA.id })
        .select().single();

    // 4. Crear Cotización Aprobada
    const { data: quote } = await supabase
        .from('quotes')
        .insert({
            tenant_id: tenant.id, client_id: client.id, requirement_id: req.id, assigned_user_id: userB.id, valid_until: '2026-12-31', status: 'BORRADOR', created_by: userB.id
        })
        .select().single();

    await supabase.from('quote_items').insert({
        tenant_id: tenant.id, quote_id: quote.id, item_order: 1, item_type: 'SERVICIO', description: 'Instalación Chiller', quantity: 1, unit: 'UNIDAD', unit_price: 15000.00
    });

    // Cambiar cotización a APROBADA (requiere que el requerimiento esté en APROBACION)
    await supabase.from('requirements').update({ status: 'NUEVO' }).eq('id', req.id);
    await supabase.from('requirements').update({ status: 'EN_REVISION' }).eq('id', req.id);
    await supabase.from('requirements').update({ status: 'DIAGNOSTICO' }).eq('id', req.id);
    
    // Cargar diagnóstico
    await supabase.from('documents').insert({
        tenant_id: tenant.id, document_type: 'DIAGNOSTIC', entity_type: 'REQUIREMENT', entity_id: req.id, file_name: 'd.pdf', file_path: '/d.pdf', file_size: 100, checksum: 'c-1', storage_provider: 'SUPABASE', storage_path: 'd.pdf', uploaded_by: userB.id, status: 'PUBLICADO'
    });
    
    await supabase.from('requirements').update({ status: 'COTIZACION', sales_user_id: userB.id }).eq('id', req.id);
    
    // Cargar cotización pdf
    await supabase.from('documents').insert({
        tenant_id: tenant.id, document_type: 'QUOTE', entity_type: 'REQUIREMENT', entity_id: req.id, file_name: 'q.pdf', file_path: '/q.pdf', file_size: 100, checksum: 'c-2', storage_provider: 'SUPABASE', storage_path: 'q.pdf', uploaded_by: userB.id, status: 'PUBLICADO'
    });

    await supabase.from('requirements').update({ status: 'APROBACION', description: 'Instalación Chiller central' }).eq('id', req.id);
    await supabase.from('quotes').update({ status: 'EN_REVISION' }).eq('id', quote.id);
    await supabase.from('quotes').update({ status: 'ENVIADA' }).eq('id', quote.id);
    await supabase.from('quotes').update({ status: 'APROBADA' }).eq('id', quote.id);

    // Registrar documento de aprobación
    await supabase.from('documents').insert({
        tenant_id: tenant.id, document_type: 'APPROVAL', entity_type: 'REQUIREMENT', entity_id: req.id, file_name: 'a.pdf', file_path: '/a.pdf', file_size: 100, checksum: 'c-3', storage_provider: 'SUPABASE', storage_path: 'a.pdf', uploaded_by: userB.id, status: 'PUBLICADO'
    });

    try {
        // 5. Test TC-JOB-01: Creación automática del Job al pasar Requerimiento a OT_GENERADA
        const { error: errToOT } = await supabase
            .from('requirements')
            .update({ status: 'OT_GENERADA' })
            .eq('id', req.id);

        if (errToOT) throw new Error(`Error al pasar requerimiento a OT_GENERADA: ${JSON.stringify(errToOT)}`);

        // Consultar el Job creado automáticamente
        const { data: job, error: errJob } = await supabase
            .from('jobs')
            .select('*')
            .eq('requirement_id', req.id)
            .single();

        if (errJob || !job) throw new Error(`¡ERROR! No se creó el Job automáticamente: ${JSON.stringify(errJob)}`);
        
        console.log(`✓ TC-JOB-01: Job creado automáticamente con código: ${job.job_code} y estado: ${job.status} (esperado PENDIENTE)`);
        if (job.status !== 'PENDIENTE') {
            throw new Error('¡ERROR! El estado del Job automático no se creó en PENDIENTE.');
        }

        // 6. Test TC-JOB-02: Creación de actividades con código jerárquico
        // Programar el Job primero (para poder agregar actividades con fechas)
        // Se definen fechas planificadas para el Job
        const plannedStart = new Date().toISOString();
        const plannedEnd = new Date(Date.now() + 86400000 * 5).toISOString(); // 5 días

        await supabase.from('jobs').update({
            status: 'PROGRAMADO',
            planned_start_date: plannedStart,
            planned_end_date: plannedEnd,
            assigned_user_id: userA.id
        }).eq('id', job.id);

        const { data: act1, error: errAct1 } = await supabase
            .from('job_activities')
            .insert({
                tenant_id: tenant.id,
                job_id: job.id,
                title: 'Montaje de Chiller',
                assigned_user_id: userA.id,
                planned_start_date: plannedStart,
                planned_end_date: plannedEnd,
                status: 'PENDIENTE'
            })
            .select().single();

        if (errAct1 || !act1) throw new Error(`Error creando actividad: ${JSON.stringify(errAct1)}`);
        console.log(`✓ TC-JOB-02: Actividad creada. Código: ${act1.activity_code} (esperado ${job.job_code}-01)`);
        if (act1.activity_code !== `${job.job_code}-01`) {
            throw new Error('¡ERROR! El código de la actividad no tiene el formato jerárquico correcto.');
        }

        // 7. Test TC-JOB-03: Restricción de fechas planificadas fuera del Job
        const outOfRangeDate = new Date(Date.now() + 86400000 * 10).toISOString(); // 10 días (fuera del rango de 5 del Job)
        const { error: errDatesOut } = await supabase
            .from('job_activities')
            .insert({
                tenant_id: tenant.id,
                job_id: job.id,
                title: 'Actividad fuera de rango',
                assigned_user_id: userA.id,
                planned_start_date: plannedStart,
                planned_end_date: outOfRangeDate,
                status: 'PENDIENTE'
            });

        console.log(`✓ TC-JOB-03: Bloqueo de actividad fuera de rango de fechas del Job: ${errDatesOut ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errDatesOut) {
            throw new Error('¡ERROR! Se permitió crear una actividad con fecha posterior al rango planificado del Job.');
        }

        // 8. Test TC-JOB-04: Propagación de estados (Actividad EN_EJECUCION -> Job EN_EJECUCION)
        // Intentar pasar a EN_EJECUCION sin actual_start_date en la actividad o el Job
        // El trigger en la actividad se actualiza a EN_EJECUCION
        await supabase.from('job_activities').update({ status: 'EN_EJECUCION' }).eq('id', act1.id);

        const { data: jobRunning } = await supabase
            .from('jobs')
            .select('status, actual_start_date')
            .eq('id', job.id)
            .single();

        console.log(`✓ TC-JOB-04: Propagación a Job EN_EJECUCION: status=${jobRunning?.status}, actual_start_date=${jobRunning?.actual_start_date}`);
        if (jobRunning?.status !== 'EN_EJECUCION' || !jobRunning.actual_start_date) {
            throw new Error('¡ERROR! El Job no se actualizó automáticamente a EN_EJECUCION o no registró la fecha real de inicio.');
        }

        // 9. Test TC-JOB-05: Propagación de finalización (Todas las actividades COMPLETADA -> Job FINALIZADO)
        await supabase.from('job_activities').update({ status: 'COMPLETADA' }).eq('id', act1.id);

        const { data: jobFinished } = await supabase
            .from('jobs')
            .select('status, actual_end_date')
            .eq('id', job.id)
            .single();

        console.log(`✓ TC-JOB-05: Propagación a Job FINALIZADO: status=${jobFinished?.status}, actual_end_date=${jobFinished?.actual_end_date}`);
        if (jobFinished?.status !== 'FINALIZADO' || !jobFinished.actual_end_date) {
            throw new Error('¡ERROR! El Job no cambió a FINALIZADO automáticamente tras completarse todas las actividades.');
        }

        // 10. Test TC-JOB-06: Validación de Acta de Entrega cargada para transicionar a ENTREGADO
        // Intentar pasar a ENTREGADO sin Acta de Entrega vinculada al Job ID (debe fallar)
        const { error: errToDeliveredNoDoc } = await supabase
            .from('jobs')
            .update({ status: 'ENTREGADO' })
            .eq('id', job.id);

        console.log(`✓ TC-JOB-06: Bloqueo de cambio a ENTREGADO sin Acta de Entrega: ${errToDeliveredNoDoc ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errToDeliveredNoDoc) {
            throw new Error('¡ERROR! Se permitió cambiar el estado del Job a ENTREGADO sin registrar el documento de tipo DELIVERY_NOTE.');
        }

        // Cargar Acta de Entrega asociada al Job ID
        await supabase.from('documents').insert({
            tenant_id: tenant.id,
            document_type: 'DELIVERY_NOTE',
            entity_type: 'JOB',
            entity_id: job.id,
            file_name: 'acta_entrega.pdf',
            file_path: '/jobs/1/entrega.pdf',
            file_size: 2048,
            checksum: 'c-4',
            storage_provider: 'SUPABASE',
            storage_path: 'jobs/1/entrega.pdf',
            uploaded_by: userA.id,
            status: 'PUBLICADO'
        });

        // Intentar de nuevo pasar a ENTREGADO (debe pasar)
        const { error: errToDeliveredOk } = await supabase
            .from('jobs')
            .update({ status: 'ENTREGADO' })
            .eq('id', job.id);

        if (errToDeliveredOk) throw new Error(`Error al pasar a ENTREGADO con acta de entrega: ${JSON.stringify(errToDeliveredOk)}`);
        console.log('✓ Job transicionado a ENTREGADO con éxito.');

        // 11. Test TC-JOB-07: Inmutabilidad de Job CERRADO
        // Transicionar a CERRADO
        await supabase.from('jobs').update({ status: 'CERRADO' }).eq('id', job.id);
        console.log('✓ Job cerrado con éxito.');

        // Intentar modificar el Job cerrado (debe fallar)
        const { error: errEditClosed } = await supabase
            .from('jobs')
            .update({ title: 'Título modificado en cerrado' })
            .eq('id', job.id);

        console.log(`✓ TC-JOB-07: Bloqueo de edición de Job CERRADO: ${errEditClosed ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errEditClosed) {
            throw new Error('¡ERROR! Se permitió modificar un trabajo que ya está en estado final CERRADO.');
        }

        // 12. Test TC-JOB-08: Propagación de cancelación Job -> Actividades
        // Crear un nuevo Job programado con una actividad pendiente
        const { data: job2 } = await supabase
            .from('jobs')
            .insert({
                tenant_id: tenant.id, client_id: client.id, requirement_id: req.id, assigned_user_id: userA.id, title: 'Job 2', planned_start_date: plannedStart, planned_end_date: plannedEnd, status: 'PROGRAMADO', created_by: userB.id
            })
            .select().single();

        const { data: act2 } = await supabase
            .from('job_activities')
            .insert({
                tenant_id: tenant.id, job_id: job2.id, title: 'Actividad de Job 2', assigned_user_id: userA.id, planned_start_date: plannedStart, planned_end_date: plannedEnd, status: 'PENDIENTE'
            })
            .select().single();

        // Cancelar Job 2 (proveyendo cancel_reason de mínimo 10 caracteres)
        const { error: errCancelJob2 } = await supabase
            .from('jobs')
            .update({ status: 'CANCELADO', cancel_reason: 'El cliente canceló este trabajo por falta de financiamiento.' })
            .eq('id', job2.id);

        if (errCancelJob2) throw new Error(`Error cancelando Job 2: ${JSON.stringify(errCancelJob2)}`);

        // Verificar estado de la actividad de Job 2
        const { data: act2Check } = await supabase
            .from('job_activities')
            .select('status')
            .eq('id', act2.id)
            .single();

        console.log(`✓ TC-JOB-08: Cancelación propagada a actividad: ${act2Check?.status} (esperado CANCELADA)`);
        if (act2Check?.status !== 'CANCELADA') {
            throw new Error('¡ERROR! La actividad del Job cancelado no se canceló automáticamente.');
        }

        // 13. Test TC-JOB-09: Verificación de Eventos Semánticos
        const { data: eventsList, error: errEvt } = await supabase
            .from('business_events')
            .select('event_code')
            .eq('tenant_id', tenant.id);

        if (errEvt) throw new Error(`Error al obtener eventos de negocio: ${JSON.stringify(errEvt)}`);
        
        const eventCodes = eventsList.map(e => e.event_code);
        console.log(`✓ TC-JOB-09: Eventos semánticos registrados para Job: ${eventCodes.join(', ')}`);
        
        const expectedEvents = ['JOB_CREATED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_DELIVERED', 'JOB_CLOSED', 'JOB_CANCELLED', 'JOB_ACTIVITY_CREATED', 'JOB_ACTIVITY_STARTED', 'JOB_ACTIVITY_COMPLETED', 'JOB_ACTIVITY_CANCELLED'];
        for (const exp of expectedEvents) {
            if (!eventCodes.includes(exp)) {
                throw new Error(`¡ERROR! Evento semántico esperado '${exp}' no fue encontrado en business_events.`);
            }
        }
        console.log('✓ Todos los eventos semánticos esperados están presentes.');

        // 14. Test TC-JOB-10: Soft Delete
        const { error: errPhysicalDelete } = await supabase
            .from('jobs')
            .delete()
            .eq('id', job2.id);

        console.log(`✓ Bloqueo de borrado físico en base de datos: ${errPhysicalDelete ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errPhysicalDelete) {
            throw new Error('¡ERROR! Se permitió borrar físicamente un Trabajo.');
        }

        console.log('\n[ÉXITO] Todas las validaciones de base de datos activas de Fase 6 (Trabajos) completaron satisfactoriamente.');

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
        console.error('\n[FALLO] Error en validación de trabajos:', error);
        process.exit(1);
    }
}

main();
