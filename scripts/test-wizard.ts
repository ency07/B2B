// SCRIPT DE VALIDACIÓN: WIZARD / COTIZADOR (FASE 12)
// Archivo: scripts/test-wizard.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO WIZARD (FASE 12)...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000012_wizard_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar Tablas
    const tables = ['diagnostic_reports', 'wizard_sessions'];
    console.log('--- Verificando existencia de tablas ---');
    for (const table of tables) {
        const hasTable = sql.includes(`CREATE TABLE ${table}`);
        console.log(`✓ Tabla '${table}' definida: ${hasTable ? 'Sí' : 'No'}`);
        if (!hasTable) {
            throw new Error(`Falta la definición de la tabla: ${table}`);
        }
    }

    // 2. Validar Campos y Restricciones Críticas
    console.log('\n--- Verificando campos y restricciones críticas ---');
    const criticalChecks = [
        { name: 'Correlativo DIA- en trigger', pattern: "'DIA-'" },
        { name: 'service_type restrict check', pattern: "CHECK (service_type IN ('fabricacion', 'venta', 'mantenimiento', 'reparacion'))" },
        { name: 'cfm_category restrict check', pattern: "CHECK (cfm_category IN ('CRITICAL', 'HIGH', 'STANDARD', 'COMPACT'))" },
        { name: 'Precios estimados COP', pattern: 'estimated_price_min_cop' },
        { name: 'Precios estimados USD', pattern: 'estimated_price_min_usd' },
        { name: 'Evitar eliminación física (block_physical_wizard_delete)', pattern: 'block_physical_wizard_delete' },
        { name: 'wizard_sessions step range check', pattern: 'step BETWEEN 1 AND 4' },
        { name: 'wizard_sessions completion percent', pattern: 'completion_percent' }
    ];

    for (const check of criticalChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Restricción/Código '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta el patrón crítico: ${check.pattern} (${check.name})`);
        }
    }

    // 3. Validar Triggers de Trazabilidad, Secuencia, Auditoría y Soft Delete
    console.log('\n--- Verificando triggers registrados ---');
    const triggerChecks = [
        'handle_wizard_sequences',
        'trg_handle_diagnostic_code',
        'block_physical_wizard_delete',
        'trg_block_diagnostic_delete',
        'trg_block_wizard_session_delete',
        'trg_diagnostic_traceability',
        'trg_wizard_session_traceability',
        'audit_diagnostic_reports',
        'audit_wizard_sessions'
    ];

    for (const trigger of triggerChecks) {
        const hasTrigger = sql.includes(trigger);
        console.log(`✓ Trigger/Función '${trigger}' registrado: ${hasTrigger ? 'Sí' : 'No'}`);
        if (!hasTrigger) {
            throw new Error(`Falta trigger/función en migración: ${trigger}`);
        }
    }

    // 4. Validar Row Level Security (RLS) habilitado en ambas tablas
    console.log('\n--- Verificando RLS en las tablas ---');
    for (const table of tables) {
        const rlsPattern = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`;
        const hasRLS = sql.includes(rlsPattern);
        console.log(`✓ RLS habilitado para '${table}': ${hasRLS ? 'Sí' : 'No'}`);
        if (!hasRLS) {
            throw new Error(`Falta habilitar RLS para la tabla: ${table}`);
        }
    }

    console.log('\n[ÉXITO] Estructura sintáctica, secuencias, prevención de borrado físico, triggers y RLS del Módulo Wizard / Cotizador validados correctamente.');
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de wizard/cotizador:', error);
        process.exit(1);
    }
}

main();
