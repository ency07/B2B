// SCRIPT DE VALIDACIÓN: RENTABILIDAD (FASE 17)
// Archivo: scripts/test-rentabilidad.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO RENTABILIDAD (FASE 17)...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000017_profitability_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar existencias de Vistas
    const views = [
        'job_profitability',
        'client_profitability'
    ];

    console.log('--- Verificando existencia de vistas ---');
    for (const view of views) {
        const hasView = sql.includes(`CREATE OR REPLACE VIEW ${view}`) || sql.includes(`CREATE VIEW ${view}`);
        console.log(`✓ Vista '${view}' definida: ${hasView ? 'Sí' : 'No'}`);
        if (!hasView) {
            throw new Error(`Falta la definición de la vista: ${view}`);
        }
    }

    // 2. Validar Parámetro de Seguridad RLS en Vistas (security_invoker)
    console.log('\n--- Verificando herencia de políticas RLS (security_invoker) ---');
    const securityChecks = [
        { name: 'security_invoker para job_profitability', pattern: 'WITH (security_invoker = true)' }
    ];

    // Contar cuántas veces aparece WITH (security_invoker = true)
    const matches = sql.match(/security_invoker\s*=\s*true/g);
    const count = matches ? matches.length : 0;
    console.log(`✓ Ocurrencias de security_invoker = true (esperadas >= 2): ${count}`);
    if (count < 2) {
        throw new Error('Las vistas no tienen habilitado security_invoker = true en todas sus definiciones.');
    }

    // 3. Validar Fórmulas e Integridad Analítica
    console.log('\n--- Verificando fórmulas financieras y soft delete ---');
    const formulaChecks = [
        { name: 'Cálculo de Margen Bruto (gross_margin)', pattern: 'total_invoiced, 0.00) - COALESCE(co.total_cost' },
        { name: 'Cálculo de Rentabilidad %', pattern: '/ i.total_invoiced) * 100' },
        { name: 'Control de División por cero', pattern: 'total_invoiced, 0.00) = 0 THEN' },
        { name: 'Ignorar facturas borrador/anuladas', pattern: "status IN ('EMITIDA', 'PARCIALMENTE_PAGADA', 'PAGADA', 'VENCIDA')" },
        { name: 'Ignorar costos no aprobados', pattern: "status = 'APROBADO'" },
        { name: 'Exclusión de Soft Delete', pattern: 'deleted_at IS NULL' }
    ];


    for (const check of formulaChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Requisito analítico '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en fórmulas financieras de rentabilidad: ${check.pattern} (${check.name})`);
        }
    }

    console.log('\n[ÉXITO] Estructura sintáctica, parámetros de seguridad RLS heredada y fórmulas de rentabilidad validados correctamente.');
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de rentabilidad:', error);
        process.exit(1);
    }
}

main();
