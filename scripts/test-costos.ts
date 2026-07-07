// SCRIPT DE VALIDACIÓN: COSTOS Y CARTERA (FASE 16)
// Archivo: scripts/test-costos.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO COSTOS Y ANTICIPOS (FASE 16)...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000016_costs_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar existencias de Tablas
    const tables = [
        'advance_applications',
        'costs',
        'job_budgets'
    ];

    console.log('--- Verificando existencia de tablas ---');
    for (const table of tables) {
        const hasTable = sql.includes(`CREATE TABLE ${table}`);
        console.log(`✓ Tabla '${table}' definida: ${hasTable ? 'Sí' : 'No'}`);
        if (!hasTable) {
            throw new Error(`Falta la definición de la tabla: ${table}`);
        }
    }

    // 2. Validar Restricciones Críticas
    console.log('\n--- Verificando restricciones de claves únicas ---');
    const constraints = [
        'unique_tenant_cost_code',
        'unique_tenant_job_budget_type'
    ];

    for (const constraint of constraints) {
        const hasConstraint = sql.includes(constraint);
        console.log(`✓ Restricción '${constraint}': ${hasConstraint ? 'Sí' : 'No'}`);
        if (!hasConstraint) {
            throw new Error(`Falta la restricción única obligatoria: ${constraint}`);
        }
    }

    // 3. Validar Helper y Redefinición de Pago
    console.log('\n--- Verificando redefinición de lógica de cobro ---');
    const redefChecks = [
        { name: 'Función refresh_invoice_paid_amount', pattern: 'CREATE OR REPLACE FUNCTION refresh_invoice_paid_amount' },
        { name: 'Suma de pagos aplicados', pattern: "status = 'APLICADO'" },
        { name: 'Suma de anticipos aplicados', pattern: 'FROM advance_applications' },
        { name: 'Función handle_payment_application', pattern: 'CREATE OR REPLACE FUNCTION handle_payment_application' },
        { name: 'Llamado a refresh_invoice_paid_amount en trigger', pattern: 'PERFORM refresh_invoice_paid_amount(NEW.invoice_id)' }
    ];

    for (const check of redefChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Requisito de redefinición '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta patrón de redefinición de pagos: ${check.pattern} (${check.name})`);
        }
    }

    // 4. Validar Triggers de Validación de Aplicación de Anticipos
    console.log('\n--- Verificando trigger de validación de anticipos ---');
    const advValChecks = [
        { name: 'Función validate_advance_application', pattern: 'CREATE OR REPLACE FUNCTION validate_advance_application' },
        { name: 'Validación de cliente cruzado', pattern: 'El cliente del anticipo no coincide con el cliente de la factura' },
        { name: 'Validación de estado borrador/anulada/pagada', pattern: 'No se pueden aplicar anticipos a una factura en estado' },
        { name: 'Validación de saldo disponible de anticipo', pattern: 'supera el saldo disponible del anticipo' },
        { name: 'Validación de saldo pendiente de factura', pattern: 'supera el saldo pendiente de la factura' },
        { name: 'Trigger trg_validate_advance_application', pattern: 'CREATE TRIGGER trg_validate_advance_application BEFORE INSERT OR UPDATE ON advance_applications' }
    ];

    for (const check of advValChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en validación de aplicación de anticipo: ${check.pattern} (${check.name})`);
        }
    }

    // 5. Validar Triggers de Impacto en Anticipos
    console.log('\n--- Verificando trigger de impacto en anticipos y facturas ---');
    const impactChecks = [
        { name: 'Función handle_advance_application_impact', pattern: 'CREATE OR REPLACE FUNCTION handle_advance_application_impact' },
        { name: 'Suma en customer_advances al insertar', pattern: 'applied_amount = applied_amount + NEW.applied_amount' },
        { name: 'Restar en customer_advances al soft-eliminar', pattern: 'applied_amount = applied_amount - OLD.applied_amount' },
        { name: 'Registrar evento ADVANCE_APPLIED', pattern: "'ADVANCE_APPLIED'" },
        { name: 'Registrar evento CANCELLED', pattern: "'ADVANCE_APPLICATION_CANCELLED'" },
        { name: 'Trigger trg_handle_advance_application_impact', pattern: 'CREATE TRIGGER trg_handle_advance_application_impact' }
    ];

    for (const check of impactChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en impacto de aplicación de anticipo: ${check.pattern} (${check.name})`);
        }
    }

    // 6. Validar Triggers de Secuencias Correlativas de Costos
    console.log('\n--- Verificando triggers de secuencias correlativas de costos ---');
    const seqChecks = [
        { name: 'Función handle_cost_sequences', pattern: 'CREATE OR REPLACE FUNCTION handle_cost_sequences' },
        { name: 'Prefijo secuencial COS-', pattern: "'COS-'" },
        { name: 'Trigger trg_handle_cost_code', pattern: 'CREATE TRIGGER trg_handle_cost_code BEFORE INSERT ON costs' }
    ];

    for (const check of seqChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en correlativos de costos: ${check.pattern} (${check.name})`);
        }
    }

    // 7. Validar Bloqueo de Borrado Físico (Soft Delete)
    console.log('\n--- Verificando prevención de borrado físico ---');
    const deleteChecks = [
        { name: 'Función block_physical_costs_delete', pattern: 'CREATE OR REPLACE FUNCTION block_physical_costs_delete' },
        { name: 'Trigger trg_block_adv_app_delete', pattern: 'CREATE TRIGGER trg_block_adv_app_delete BEFORE DELETE ON advance_applications' },
        { name: 'Trigger trg_block_cost_delete', pattern: 'CREATE TRIGGER trg_block_cost_delete BEFORE DELETE ON costs' },
        { name: 'Trigger trg_block_budget_delete', pattern: 'CREATE TRIGGER trg_block_budget_delete BEFORE DELETE ON job_budgets' }
    ];

    for (const check of deleteChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en prevención de borrado físico: ${check.pattern} (${check.name})`);
        }
    }

    // 8. Validar RLS habilitado
    console.log('\n--- Verificando RLS en todas las tablas ---');
    for (const table of tables) {
        const rlsPattern = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`;
        const hasRLS = sql.includes(rlsPattern);
        console.log(`✓ RLS habilitado para '${table}': ${hasRLS ? 'Sí' : 'No'}`);
        if (!hasRLS) {
            throw new Error(`Falta habilitar RLS para la tabla: ${table}`);
        }
    }

    console.log('\n[ÉXITO] Estructura sintáctica, redefinición de cobros, triggers de validación, impacto, soft delete, secuencias y RLS validados correctamente.');
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de costos y anticipos:', error);
        process.exit(1);
    }
}

main();
