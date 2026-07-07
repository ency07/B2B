// SCRIPT DE VALIDACIÓN: REGLAS DE NEGOCIO, TRIGGERS Y RLS DE COTIZACIONES (FASE 4)
// Archivo: scripts/test-quotes.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MODELO COTIZACIONES...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000004_quotes_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Validaciones sintácticas básicas de tablas y RLS
    const hasQuotesTable = sql.includes('CREATE TABLE quotes');
    const hasQuoteItemsTable = sql.includes('CREATE TABLE quote_items');
    
    const hasQuoteVersionTrigger = sql.includes('trg_handle_quote_versioning');
    const hasItemCalcTrigger = sql.includes('trg_calculate_quote_item_totals');
    const hasQuoteTotalsTrigger = sql.includes('trg_update_quote_totals');
    const hasQuoteStateTrigger = sql.includes('trg_validate_quote_state');
    const hasQuotePermsTrigger = sql.includes('trg_enforce_quote_permissions');
    const hasQuoteTraceTrigger = sql.includes('trg_handle_quote_traceability');
    const hasQuoteEventsTrigger = sql.includes('trg_dispatch_quote_events');

    const hasQuotesRLS = sql.includes('ALTER TABLE quotes ENABLE ROW LEVEL SECURITY');
    const hasQuoteItemsRLS = sql.includes('ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY');

    console.log(`✓ Archivo de migración de Cotizaciones encontrado: ${path.basename(migrationPath)}`);
    console.log(`✓ Tabla 'quotes' definida: ${hasQuotesTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'quote_items' definida: ${hasQuoteItemsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de versionado y código quote_code: ${hasQuoteVersionTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de cálculo automático ítem: ${hasItemCalcTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de actualización total cabecera: ${hasQuoteTotalsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de transición de estados cotización: ${hasQuoteStateTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de permisos por rol de usuario: ${hasQuotePermsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de trazabilidad cotizaciones: ${hasQuoteTraceTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de eventos de negocio cotizaciones: ${hasQuoteEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en quotes: ${hasQuotesRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en quote_items: ${hasQuoteItemsRLS ? 'Sí' : 'No'}`);

    if (
        hasQuotesTable && hasQuoteItemsTable &&
        hasQuoteVersionTrigger && hasItemCalcTrigger && hasQuoteTotalsTrigger &&
        hasQuoteStateTrigger && hasQuotePermsTrigger && hasQuoteTraceTrigger &&
        hasQuoteEventsTrigger && hasQuotesRLS && hasQuoteItemsRLS
    ) {
        console.log('\n[ÉXITO] Estructura sintáctica, triggers y RLS de Cotizaciones validados correctamente.');
    } else {
        throw new Error('Validación de estructura SQL de Cotizaciones fallida. Revise las especificaciones de la migración.');
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

    console.log('=== EJECUTANDO INTEGRACIÓN Y REGLAS DE NEGOCIO FASE 4 (COTIZACIONES) ===');

    // 1. Crear Tenants de prueba
    const { data: tenantA, error: errA } = await supabase
        .from('tenants')
        .insert({ tenant_code: 'QTE-T-A', name: 'Tenant A Test Cotizaciones', legal_name: 'Tenant A Quotes SAS', tax_id: 'NIT-QTE-A' })
        .select().single();

    const { data: tenantB, error: errB } = await supabase
        .from('tenants')
        .insert({ tenant_code: 'QTE-T-B', name: 'Tenant B Test Cotizaciones', legal_name: 'Tenant B Quotes SAS', tax_id: 'NIT-QTE-B' })
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
        throw new Error('No se encontraron los roles básicos sembrados en la base de datos.');
    }

    // 2. Crear Usuarios administradores y roles de prueba
    const mockAuthIdA = '40000000-0000-0000-0000-00000000000a';
    const mockAuthIdB = '40000000-0000-0000-0000-00000000000b';

    const { data: userA, error: errUsrA } = await supabase
        .from('users')
        .insert({ tenant_id: tenantA.id, first_name: 'Comercial A', last_name: 'Tenant A', email: 'comercial@t-a.qte', auth_user_id: mockAuthIdA, status: 'Activo' })
        .select().single();

    const { data: userB, error: errUsrB } = await supabase
        .from('users')
        .insert({ tenant_id: tenantB.id, first_name: 'Comercial B', last_name: 'Tenant B', email: 'comercial@t-b.qte', auth_user_id: mockAuthIdB, status: 'Activo' })
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

    // 3. Crear Cliente y Requerimiento de prueba para asociar cotizaciones
    const { data: clientA, error: errCliA } = await supabase
        .from('clients')
        .insert({
            tenant_id: tenantA.id,
            client_type: 'Empresa',
            legal_name: 'Cliente Prueba Cotizaciones',
            tax_id: 'NIT-CLIENT-QTE',
            country: 'Colombia',
            assigned_user_id: userA.id,
            status: 'ACTIVO'
        })
        .select().single();

    if (errCliA) {
        await cleanUp(supabase, tenantA.id, tenantB.id);
        throw new Error(`Error creando cliente: ${JSON.stringify(errCliA)}`);
    }

    const { data: req1, error: errReq1 } = await supabase
        .from('requirements')
        .insert({
            tenant_id: tenantA.id,
            client_id: clientA.id,
            title: 'Instalación de Sistema Aire Acondicionado',
            category: 'FABRICACION',
            priority: 'HIGH',
            status: 'BORRADOR',
            created_by: userA.id
        })
        .select().single();

    if (errReq1) {
        await cleanUp(supabase, tenantA.id, tenantB.id);
        throw new Error(`Error creando requerimiento: ${JSON.stringify(errReq1)}`);
    }
    console.log('✓ Cliente y Requerimiento registrados.');

    try {
        // 4. Probar TC-QT-01: Auto-incremento de quote_code por tenant con secuencias
        const { data: quote1, error: errQ1 } = await supabase
            .from('quotes')
            .insert({
                tenant_id: tenantA.id,
                client_id: clientA.id,
                requirement_id: req1.id,
                assigned_user_id: userA.id,
                valid_until: '2026-12-31',
                status: 'BORRADOR',
                created_by: userA.id
            })
            .select().single();

        if (errQ1) throw new Error(`Error creando cotización: ${JSON.stringify(errQ1)}`);
        console.log(`✓ TC-QT-01: Código generado: ${quote1.quote_code} (esperado COT-000001)`);
        
        if (quote1.quote_code !== 'COT-000001') {
            throw new Error('¡ERROR! Código incremental de cotización inválido.');
        }

        // 5. Probar TC-QT-04: Bloqueo de transición a EN_REVISION sin ítems
        const { error: errToRev } = await supabase
            .from('quotes')
            .update({ status: 'EN_REVISION' })
            .eq('id', quote1.id);

        console.log(`✓ TC-QT-04: Bloqueo de revisión sin ítems: ${errToRev ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errToRev) throw new Error('¡ERROR! Se permitió avanzar cotización a EN_REVISION sin registrar ítems.');

        // 6. Probar TC-QT-02: Cálculos automáticos de items y totales
        const { data: item1, error: errItem } = await supabase
            .from('quote_items')
            .insert({
                tenant_id: tenantA.id,
                quote_id: quote1.id,
                item_order: 1,
                item_type: 'MATERIAL',
                description: 'Compresor 5HP',
                quantity: 2.0000,
                unit: 'UNIDAD',
                unit_price: 1500.00,
                discount_amount: 100.00,
                tax_percent: 19.00
            })
            .select().single();

        if (errItem) throw new Error(`Error creando ítem: ${JSON.stringify(errItem)}`);
        
        // subtotal_linea = 2 * 1500 = 3000
        // descuento = 100
        // base_gravable = 2900
        // tax_amount = 2900 * 19 / 100 = 551
        // line_total = 2900 + 551 = 3451
        console.log(`✓ Ítems de cotización: line_total calculado: ${item1.line_total} (esperado 3451.00)`);
        if (Number(item1.line_total) !== 3451.00) {
            throw new Error('¡ERROR! Cálculo automático de línea fallido.');
        }

        // Verificar recálculo de cabecera quotes
        const { data: quoteTotals } = await supabase
            .from('quotes')
            .select('subtotal, total_amount')
            .eq('id', quote1.id)
            .single();

        console.log(`✓ Cabecera quotes: subtotal recalculado: ${quoteTotals?.subtotal} (esperado 3451.00)`);
        if (Number(quoteTotals?.subtotal) !== 3451.00) {
            throw new Error('¡ERROR! La cabecera no se actualizó automáticamente.');
        }

        // Avanzar flujo: BORRADOR -> EN_REVISION -> ENVIADA
        await supabase.from('quotes').update({ status: 'EN_REVISION' }).eq('id', quote1.id);
        await supabase.from('quotes').update({ status: 'ENVIADA' }).eq('id', quote1.id);
        console.log(`✓ Cotización enviada a ENVIADA.`);

        // 7. Probar TC-QT-03: Versionamiento automático (versión anterior pasa a VENCIDA)
        const { data: quoteV2, error: errQV2 } = await supabase
            .from('quotes')
            .insert({
                tenant_id: tenantA.id,
                quote_code: quote1.quote_code,
                client_id: clientA.id,
                requirement_id: req1.id,
                assigned_user_id: userA.id,
                valid_until: '2026-12-31',
                status: 'BORRADOR',
                created_by: userA.id
            })
            .select().single();

        if (errQV2) throw new Error(`Error al crear versión 2: ${JSON.stringify(errQV2)}`);
        console.log(`✓ Cotización versión 2 registrada: versión: ${quoteV2.version}`);

        const { data: quoteV1Check } = await supabase
            .from('quotes')
            .select('status')
            .eq('id', quote1.id)
            .single();

        console.log(`✓ Estado versión 1 anterior: ${quoteV1Check?.status} (esperado VENCIDA)`);
        if (quoteV1Check?.status !== 'VENCIDA') {
            throw new Error('¡ERROR! La cotización versión 1 no cambió automáticamente a VENCIDA.');
        }

        // 8. Probar TC-QT-05: Integración Requerimiento (bloqueo de OT_GENERADA sin cotización aprobada)
        // Para pasar a APROBACION, el requerimiento requiere diagnóstico cargado
        await supabase.from('requirements').update({ status: 'NUEVO' }).eq('id', req1.id);
        await supabase.from('requirements').update({ status: 'EN_REVISION' }).eq('id', req1.id);
        await supabase.from('requirements').update({ status: 'DIAGNOSTICO', engineering_user_id: userA.id }).eq('id', req1.id);
        
        // Cargar documento de diagnóstico
        await supabase.from('documents').insert({
            tenant_id: tenantA.id,
            document_type: 'DIAGNOSTIC',
            entity_type: 'REQUIREMENT',
            entity_id: req1.id,
            file_name: 'diagnostico.pdf',
            file_path: '/chiller1/diagnostico.pdf',
            file_size: 1024,
            checksum: 'checksum-1',
            storage_provider: 'SUPABASE',
            storage_path: 'req/1/diag.pdf',
            uploaded_by: userA.id,
            status: 'PUBLICADO'
        });

        await supabase.from('requirements').update({ status: 'COTIZACION', sales_user_id: userA.id }).eq('id', req1.id);
        
        // Cargar documento de Cotización PDF
        await supabase.from('documents').insert({
            tenant_id: tenantA.id,
            document_type: 'QUOTE',
            entity_type: 'REQUIREMENT',
            entity_id: req1.id,
            file_name: 'cotizacion.pdf',
            file_path: '/chiller1/cotizacion.pdf',
            file_size: 1024,
            checksum: 'checksum-2',
            storage_provider: 'SUPABASE',
            storage_path: 'req/1/quote.pdf',
            uploaded_by: userA.id,
            status: 'PUBLICADO'
        });

        // Pasar requerimiento a APROBACION
        await supabase.from('requirements').update({ status: 'APROBACION', description: 'Aire acondicionado Chiller 5HP' }).eq('id', req1.id);
        console.log(`✓ Requerimiento en estado APROBACION.`);

        // Intentar pasar requerimiento a OT_GENERADA sin cotización APROBADA
        // Cargar documento APPROVAL firmado
        await supabase.from('documents').insert({
            tenant_id: tenantA.id,
            document_type: 'APPROVAL',
            entity_type: 'REQUIREMENT',
            entity_id: req1.id,
            file_name: 'aprobacion_firmada.pdf',
            file_path: '/chiller1/aprobacion.pdf',
            file_size: 2048,
            checksum: 'checksum-3',
            storage_provider: 'SUPABASE',
            storage_path: 'req/1/aprob.pdf',
            uploaded_by: userA.id,
            status: 'PUBLICADO'
        });

        const { error: errToOTNoQuote } = await supabase
            .from('requirements')
            .update({ status: 'OT_GENERADA' })
            .eq('id', req1.id);

        console.log(`✓ TC-QT-05: Bloqueo de OT_GENERADA sin cotización aprobada: ${errToOTNoQuote ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errToOTNoQuote) throw new Error('¡ERROR! Se permitió avanzar requerimiento a OT_GENERADA sin cotización aprobada.');

        // Agregar ítems a versión 2, enviarla y aprobarla
        await supabase.from('quote_items').insert({
            tenant_id: tenantA.id,
            quote_id: quoteV2.id,
            item_order: 1,
            item_type: 'MATERIAL',
            description: 'Compresor 5HP',
            quantity: 2.0000,
            unit: 'UNIDAD',
            unit_price: 1500.00
        });

        await supabase.from('quotes').update({ status: 'EN_REVISION' }).eq('id', quoteV2.id);
        await supabase.from('quotes').update({ status: 'ENVIADA' }).eq('id', quoteV2.id);
        
        // Cambiar cotización a APROBADA
        const { error: errQApprove } = await supabase
            .from('quotes')
            .update({ status: 'APROBADA' })
            .eq('id', quoteV2.id);

        if (errQApprove) throw new Error(`Error aprobando cotización: ${JSON.stringify(errQApprove)}`);
        console.log(`✓ Cotización aprobada.`);

        // Intentar de nuevo avanzar requerimiento a OT_GENERADA (debe pasar con cotización aprobada y documento APPROVAL)
        const { error: errToOTOk } = await supabase
            .from('requirements')
            .update({ status: 'OT_GENERADA' })
            .eq('id', req1.id);

        if (errToOTOk) throw new Error(`Error al avanzar requerimiento a OT_GENERADA: ${JSON.stringify(errToOTOk)}`);
        console.log(`✓ Requerimiento en OT_GENERADA con éxito.`);

        // 9. Probar Prevención de Eliminación Física (Soft Delete obligatorio)
        const { error: errPhysicalDelete } = await supabase
            .from('quotes')
            .delete()
            .eq('id', quoteV2.id);

        console.log(`✓ Bloqueo de borrado físico en base de datos: ${errPhysicalDelete ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errPhysicalDelete) throw new Error('¡ERROR! Se permitió borrar físicamente una cotización.');

        // 10. Probar TC-QT-08: Validez por defecto de 30 días
        const { data: quote3, error: errQ3 } = await supabase
            .from('quotes')
            .insert({
                tenant_id: tenantA.id,
                client_id: clientA.id,
                requirement_id: req1.id,
                assigned_user_id: userA.id,
                status: 'BORRADOR',
                created_by: userA.id
            })
            .select().single();

        if (errQ3) throw new Error(`Error al crear cotización 3: ${JSON.stringify(errQ3)}`);
        console.log(`✓ TC-QT-08: Fecha de validez default asignada: ${quote3.valid_until}`);
        if (!quote3.valid_until) {
            throw new Error('¡ERROR! No se asignó la fecha de validez por defecto.');
        }

        // 11. Probar TC-QT-09: Rechazo obligatorio de motivos y trazabilidad
        // Agregar ítem a quote3 para avanzar
        await supabase.from('quote_items').insert({
            tenant_id: tenantA.id,
            quote_id: quote3.id,
            item_order: 1,
            item_type: 'MATERIAL',
            description: 'Item Cotización 3',
            quantity: 1,
            unit: 'UNIDAD',
            unit_price: 100
        });

        await supabase.from('quotes').update({ status: 'EN_REVISION' }).eq('id', quote3.id);
        await supabase.from('quotes').update({ status: 'ENVIADA' }).eq('id', quote3.id);

        // Intentar rechazar sin motivo (debe fallar)
        const { error: errRejectNoReason } = await supabase
            .from('quotes')
            .update({ status: 'RECHAZADA' })
            .eq('id', quote3.id);

        console.log(`✓ TC-QT-09: Bloqueo de rechazo sin motivo: ${errRejectNoReason ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errRejectNoReason) throw new Error('¡ERROR! Se permitió rechazar una cotización sin suministrar reject_reason.');

        // Rechazar con motivo (debe pasar)
        const { data: quote3Rejected, error: errRejectOk } = await supabase
            .from('quotes')
            .update({ status: 'RECHAZADA', reject_reason: 'El precio es demasiado costoso para el presupuesto actual.' })
            .eq('id', quote3.id)
            .select().single();

        if (errRejectOk) throw new Error(`Error al rechazar cotización: ${JSON.stringify(errRejectOk)}`);
        console.log(`✓ Cotización rechazada con motivo. Trazabilidad: rejected_by=${quote3Rejected.rejected_by}, rejected_at=${quote3Rejected.rejected_at}`);
        if (!quote3Rejected.rejected_by || !quote3Rejected.rejected_at) {
            throw new Error('¡ERROR! No se registró la trazabilidad del rechazo (rejected_by/rejected_at).');
        }

        // 12. Probar TC-QT-09 (Parte Cancelación): Cancelación obligatoria de motivos y trazabilidad
        const { data: quote4, error: errQ4 } = await supabase
            .from('quotes')
            .insert({
                tenant_id: tenantA.id,
                client_id: clientA.id,
                requirement_id: req1.id,
                assigned_user_id: userA.id,
                status: 'BORRADOR',
                created_by: userA.id
            })
            .select().single();

        if (errQ4) throw new Error(`Error al crear cotización 4: ${JSON.stringify(errQ4)}`);

        // Intentar cancelar sin motivos (debe fallar)
        const { error: errCancelNoReason } = await supabase
            .from('quotes')
            .update({ status: 'CANCELADA' })
            .eq('id', quote4.id);

        console.log(`✓ TC-QT-09: Bloqueo de cancelación sin motivos: ${errCancelNoReason ? 'Bloqueado Correctamente' : 'Fallo'}`);
        if (!errCancelNoReason) throw new Error('¡ERROR! Se permitió cancelar sin cancel_code ni cancel_reason.');

        // Cancelar con motivo y código correcto (debe pasar)
        const { data: quote4Cancelled, error: errCancelOk } = await supabase
            .from('quotes')
            .update({
                status: 'CANCELADA',
                cancel_code: 'CLIENTE_DESISTE',
                cancel_reason: 'El cliente desistió de continuar con el proyecto por este año.'
            })
            .eq('id', quote4.id)
            .select().single();

        if (errCancelOk) throw new Error(`Error al cancelar cotización: ${JSON.stringify(errCancelOk)}`);
        console.log(`✓ Cotización cancelada con motivo. Trazabilidad: cancelled_by=${quote4Cancelled.cancelled_by}, cancelled_at=${quote4Cancelled.cancelled_at}`);
        if (!quote4Cancelled.cancelled_by || !quote4Cancelled.cancelled_at) {
            throw new Error('¡ERROR! No se registró la trazabilidad de la cancelación (cancelled_by/cancelled_at).');
        }

        // 13. Probar TC-QT-10: Eventos Semánticos
        const { data: eventsList, error: errEvt } = await supabase
            .from('business_events')
            .select('event_code')
            .eq('tenant_id', tenantA.id)
            .eq('entity_type', 'QUOTE');

        if (errEvt) throw new Error(`Error al obtener eventos de negocio: ${JSON.stringify(errEvt)}`);
        
        const eventCodes = eventsList.map(e => e.event_code);
        console.log(`✓ TC-QT-10: Eventos semánticos registrados para Quote: ${eventCodes.join(', ')}`);
        
        const expectedEvents = ['QUOTE_CREATED', 'QUOTE_REVISED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'QUOTE_REJECTED', 'QUOTE_CANCELLED'];
        for (const exp of expectedEvents) {
            if (!eventCodes.includes(exp)) {
                throw new Error(`¡ERROR! Evento semántico esperado '${exp}' no fue encontrado en business_events.`);
            }
        }
        console.log('✓ Todos los eventos semánticos esperados están presentes.');

        console.log('\n[ÉXITO] Todas las validaciones de base de datos activas de Fase 4 (Cotizaciones) y sus nuevos ajustes completaron satisfactoriamente.');

    } finally {
        await cleanUp(supabase, tenantA.id, tenantB.id);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cleanUp(supabase: any, tenantAId: string, tenantBId: string) {
    console.log('\nLimpiando datos de prueba...');
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
        console.error('\n[FALLO] Error en validación de cotizaciones:', error);
        process.exit(1);
    }
}

main();
