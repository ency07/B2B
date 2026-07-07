// SCRIPT DE VALIDACIÓN: FACTURACIÓN Y PAGOS (FASE 8)
// Archivo: scripts/test-facturas.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO FACTURACIÓN...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000008_invoices_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar Tablas
    const hasInvoicesTable = sql.includes('CREATE TABLE invoices');
    const hasItemsTable = sql.includes('CREATE TABLE invoice_items');
    const hasTaxesTable = sql.includes('CREATE TABLE invoice_taxes');
    const hasPaymentsTable = sql.includes('CREATE TABLE payments');
    const hasAdvancesTable = sql.includes('CREATE TABLE customer_advances');

    // 2. Validar Campos y Restricciones Críticas
    const hasSourceType = sql.includes('source_type');
    const hasSourceId = sql.includes('source_id');
    const hasPaymentLink = sql.includes('payment_link');
    const hasPaymentUrl = sql.includes('payment_url');
    const hasLineTotal = sql.includes('line_total');
    const hasBalanceAmount = sql.includes('balance_amount');

    // 3. Validar Funciones y Triggers
    const hasSeqTrigger = sql.includes('handle_invoice_sequences');
    const hasDefaultsTrigger = sql.includes('validate_invoice_defaults');
    const hasItemTotalsTrigger = sql.includes('handle_invoice_item_totals');
    const hasHeaderUpdateTrigger = sql.includes('update_invoice_headers');
    const hasImmutabilityTrigger = sql.includes('enforce_invoice_immutability');
    const hasPermsTrigger = sql.includes('enforce_invoice_permissions');
    const hasPaymentTrigger = sql.includes('handle_payment_application');
    const hasEventsTrigger = sql.includes('dispatch_invoice_events');
    const hasBlockDelete = sql.includes('block_physical_invoice_delete');

    // 4. Validar RLS
    const hasInvoicesRLS = sql.includes('ALTER TABLE invoices ENABLE ROW LEVEL SECURITY');
    const hasItemsRLS = sql.includes('ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY');
    const hasTaxesRLS = sql.includes('ALTER TABLE invoice_taxes ENABLE ROW LEVEL SECURITY');
    const hasPaymentsRLS = sql.includes('ALTER TABLE payments ENABLE ROW LEVEL SECURITY');
    const hasAdvancesRLS = sql.includes('ALTER TABLE customer_advances ENABLE ROW LEVEL SECURITY');

    console.log(`✓ Archivo de migración de Facturación encontrado: ${path.basename(migrationPath)}`);
    console.log(`✓ Tabla 'invoices' definida: ${hasInvoicesTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'invoice_items' definida: ${hasItemsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'invoice_taxes' definida: ${hasTaxesTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'payments' definida: ${hasPaymentsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'customer_advances' definida: ${hasAdvancesTable ? 'Sí' : 'No'}`);
    
    console.log(`✓ Campo 'source_type' y 'source_id' (Trazabilidad Origen): ${hasSourceType && hasSourceId ? 'Sí' : 'No'}`);
    console.log(`✓ Campos 'payment_link' y 'payment_url' (Pasarela Wompi): ${hasPaymentLink && hasPaymentUrl ? 'Sí' : 'No'}`);
    console.log(`✓ Columnas calculadas 'line_total' y 'balance_amount': ${hasLineTotal && hasBalanceAmount ? 'Sí' : 'No'}`);

    console.log(`✓ Trigger de secuencias de códigos correlativos: ${hasSeqTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de validaciones de fechas por defecto: ${hasDefaultsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de cálculo de totales de línea: ${hasItemTotalsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de actualización de acumuladores de cabecera: ${hasHeaderUpdateTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de inmutabilidad de facturas emitidas: ${hasImmutabilityTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de permisos (RBAC): ${hasPermsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de aplicación de pagos y anticipos: ${hasPaymentTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de despacho de eventos de negocio: ${hasEventsTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de prevención de borrado físico: ${hasBlockDelete ? 'Sí' : 'No'}`);

    console.log(`✓ RLS habilitado en invoices: ${hasInvoicesRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en invoice_items: ${hasItemsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en invoice_taxes: ${hasTaxesRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en payments: ${hasPaymentsRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en customer_advances: ${hasAdvancesRLS ? 'Sí' : 'No'}`);

    const isValid = hasInvoicesTable && hasItemsTable && hasTaxesTable && hasPaymentsTable && hasAdvancesTable &&
                    hasSourceType && hasSourceId && hasPaymentLink && hasPaymentUrl && hasLineTotal && hasBalanceAmount &&
                    hasSeqTrigger && hasDefaultsTrigger && hasItemTotalsTrigger && hasHeaderUpdateTrigger &&
                    hasImmutabilityTrigger && hasPermsTrigger && hasPaymentTrigger && hasEventsTrigger && hasBlockDelete &&
                    hasInvoicesRLS && hasItemsRLS && hasTaxesRLS && hasPaymentsRLS && hasAdvancesRLS;

    if (isValid) {
        console.log('\n[ÉXITO] Estructura sintáctica, triggers, RLS y funciones del Módulo de Facturación validados correctamente.');
    } else {
        throw new Error('Validación de estructura SQL de Facturación fallida. Revise las especificaciones de la migración.');
    }
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de facturación:', error);
        process.exit(1);
    }
}

main();
