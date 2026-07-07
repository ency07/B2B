// SCRIPT DE VALIDACIÓN: DASHBOARDS Y KPIs (FASE 15)
// Archivo: scripts/test-dashboards.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO DASHBOARDS Y KPIs (FASE 15)...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000015_dashboards_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar existencias de Tablas
    const tables = [
        'kpi_definitions',
        'kpi_formulas',
        'kpi_history',
        'dashboards',
        'dashboard_widgets',
        'dashboard_preferences'
    ];

    console.log('--- Verificando existencia de tablas ---');
    for (const table of tables) {
        const hasTable = sql.includes(`CREATE TABLE ${table}`);
        console.log(`✓ Tabla '${table}' definida: ${hasTable ? 'Sí' : 'No'}`);
        if (!hasTable) {
            throw new Error(`Falta la definición de la tabla: ${table}`);
        }
    }

    // 2. Validar Restricciones Críticas de Claves Únicas
    console.log('\n--- Verificando restricciones de claves únicas ---');
    const constraints = [
        'unique_tenant_kpi_code',
        'unique_tenant_kpi_period',
        'unique_tenant_dashboard_code',
        'unique_tenant_widget_code',
        'unique_tenant_user_dashboard_pref'
    ];

    for (const constraint of constraints) {
        const hasConstraint = sql.includes(constraint);
        console.log(`✓ Restricción '${constraint}': ${hasConstraint ? 'Sí' : 'No'}`);
        if (!hasConstraint) {
            throw new Error(`Falta la restricción única obligatoria: ${constraint}`);
        }
    }

    // 3. Validar Triggers de Secuencias Correlativas
    console.log('\n--- Verificando triggers de secuencias correlativas ---');
    const sequenceChecks = [
        { name: 'Función handle_dashboard_sequences', pattern: 'CREATE OR REPLACE FUNCTION handle_dashboard_sequences' },
        { name: 'Generador correlativo KPI (KPI-)', pattern: "'KPI-'" },
        { name: 'Generador correlativo Dashboard (DSH-)', pattern: "'DASHBOARD'" },
        { name: 'Generador correlativo Widget (WDG-)', pattern: "'WIDGET'" },
        { name: 'Trigger trg_handle_kpi_code', pattern: 'CREATE TRIGGER trg_handle_kpi_code BEFORE INSERT ON kpi_definitions' },
        { name: 'Trigger trg_handle_dashboard_code', pattern: 'CREATE TRIGGER trg_handle_dashboard_code BEFORE INSERT ON dashboards' },
        { name: 'Trigger trg_handle_widget_code', pattern: 'CREATE TRIGGER trg_handle_widget_code BEFORE INSERT ON dashboard_widgets' }
    ];

    for (const check of sequenceChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en secuencias correlativas: ${check.pattern} (${check.name})`);
        }
    }

    // 4. Validar Trigger de Versionado de Fórmulas (Fórmula Única Activa)
    console.log('\n--- Verificando trigger de formula unica activa ---');
    const formulaChecks = [
        { name: 'Función deactivate_other_kpi_formulas', pattern: 'CREATE OR REPLACE FUNCTION deactivate_other_kpi_formulas' },
        { name: 'Lógica deactivate active=false', pattern: 'SET active = false' },
        { name: 'Trigger trg_deactivate_other_kpi_formulas', pattern: 'CREATE TRIGGER trg_deactivate_other_kpi_formulas BEFORE INSERT OR UPDATE' }
    ];

    for (const check of formulaChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en desactivación de formulas duplicadas: ${check.pattern} (${check.name})`);
        }
    }

    // 5. Validar Bloqueo de Borrado Físico (Soft Delete)
    console.log('\n--- Verificando prevención de borrado físico ---');
    const deleteChecks = [
        { name: 'Función block_physical_dashboard_delete', pattern: 'CREATE OR REPLACE FUNCTION block_physical_dashboard_delete' },
        { name: 'Mensaje de excepción soft delete', pattern: 'Eliminación física denegada' },
        { name: 'Trigger trg_block_kpi_def_delete', pattern: 'CREATE TRIGGER trg_block_kpi_def_delete BEFORE DELETE ON kpi_definitions' },
        { name: 'Trigger trg_block_kpi_formula_delete', pattern: 'CREATE TRIGGER trg_block_kpi_formula_delete BEFORE DELETE ON kpi_formulas' },
        { name: 'Trigger trg_block_kpi_hist_delete', pattern: 'CREATE TRIGGER trg_block_kpi_hist_delete BEFORE DELETE ON kpi_history' },
        { name: 'Trigger trg_block_dashboard_delete', pattern: 'CREATE TRIGGER trg_block_dashboard_delete BEFORE DELETE ON dashboards' },
        { name: 'Trigger trg_block_widget_delete', pattern: 'CREATE TRIGGER trg_block_widget_delete BEFORE DELETE ON dashboard_widgets' },
        { name: 'Trigger trg_block_preference_delete', pattern: 'CREATE TRIGGER trg_block_preference_delete BEFORE DELETE ON dashboard_preferences' }
    ];

    for (const check of deleteChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en prevención de borrado físico: ${check.pattern} (${check.name})`);
        }
    }

    // 6. Validar Triggers de Trazabilidad e Integración de Auditoría
    console.log('\n--- Verificando triggers de auditoría y trazabilidad ---');
    for (const table of tables) {
        const traceTrigger = `trg_${table.substring(0, 8)}_traceability BEFORE INSERT OR UPDATE ON ${table}`;
        const auditTrigger = `audit_${table} AFTER INSERT OR UPDATE OR DELETE ON ${table}`;

        const hasTrace = sql.includes(traceTrigger) || sql.includes(`BEFORE INSERT OR UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability`);
        const hasAudit = sql.includes(auditTrigger) || sql.includes(`AFTER INSERT OR UPDATE OR DELETE ON ${table} FOR EACH ROW EXECUTE FUNCTION process_audit_log`);

        console.log(`✓ Trazabilidad en '${table}': ${hasTrace ? 'Sí' : 'No'}`);
        console.log(`✓ Auditoría en '${table}': ${hasAudit ? 'Sí' : 'No'}`);

        if (!hasTrace && table !== 'kpi_history' && table !== 'dashboard_preferences') {
            // Note: Let's check using generic check or sub-string checks
            const hasTraceGeneric = sql.includes(`ON ${table} FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability`);
            if (!hasTraceGeneric) {
                throw new Error(`Falta trigger de trazabilidad para la tabla: ${table}`);
            }
        }
        const hasAuditGeneric = sql.includes(`ON ${table} FOR EACH ROW EXECUTE FUNCTION process_audit_log`);
        if (!hasAuditGeneric) {
            throw new Error(`Falta trigger de auditoría para la tabla: ${table}`);
        }
    }

    // 7. Validar Row Level Security (RLS) habilitado en todas las tablas
    console.log('\n--- Verificando RLS en todas las tablas ---');
    for (const table of tables) {
        const rlsPattern = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`;
        const hasRLS = sql.includes(rlsPattern);
        console.log(`✓ RLS habilitado para '${table}': ${hasRLS ? 'Sí' : 'No'}`);
        if (!hasRLS) {
            throw new Error(`Falta habilitar RLS para la tabla: ${table}`);
        }
    }

    // 8. Validar Función de Cálculo de KPI (calculate_kpi)
    console.log('\n--- Verificando función de cálculo de KPI calculate_kpi ---');
    const calcChecks = [
        { name: 'Definición de calculate_kpi', pattern: 'CREATE OR REPLACE FUNCTION calculate_kpi' },
        { name: 'Cálculo SLA Breach', pattern: 'LEAD_SLA_BREACH_RATE' },
        { name: 'Cálculo Total Invoiced', pattern: 'TOTAL_INVOICED' },
        { name: 'Cálculo Total Payments', pattern: 'TOTAL_PAYMENTS' },
        { name: 'Inserción en kpi_history', pattern: 'INSERT INTO kpi_history' },
        { name: 'ON CONFLICT DO UPDATE', pattern: 'ON CONFLICT (tenant_id, kpi_id, period) DO UPDATE' },
        { name: 'Registro de business_event KPI_CALCULATED', pattern: "'KPI_CALCULATED'" }
    ];

    for (const check of calcChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Requisito de cálculo '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta requerimiento en calculate_kpi: ${check.pattern} (${check.name})`);
        }
    }

    console.log('\n[ÉXITO] Estructura sintáctica, tablas analíticas, triggers de correlativos, versión única de fórmula, soft delete, auditoría, RLS y función calculate_kpi validados correctamente.');
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de dashboards y KPIs:', error);
        process.exit(1);
    }
}

main();
