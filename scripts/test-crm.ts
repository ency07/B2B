// SCRIPT DE VALIDACIÓN: CRM Y PIPELINE (FASE 13)
// Archivo: scripts/test-crm.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO CRM (FASE 13)...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000013_crm_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar Alteraciones
    console.log('--- Verificando alteraciones de tablas existentes ---');
    const hasDropNotNull = sql.includes('ALTER TABLE clients ALTER COLUMN tax_id DROP NOT NULL');
    const hasLeadsClientId = sql.includes('ALTER TABLE leads ADD COLUMN client_id uuid REFERENCES clients');
    const hasLeadsContactId = sql.includes('ALTER TABLE leads ADD COLUMN contact_id uuid REFERENCES client_contacts');

    console.log(`✓ clients.tax_id hecha nullable: ${hasDropNotNull ? 'Sí' : 'No'}`);
    console.log(`✓ leads vinculados a clients (client_id): ${hasLeadsClientId ? 'Sí' : 'No'}`);
    console.log(`✓ leads vinculados a contacts (contact_id): ${hasLeadsContactId ? 'Sí' : 'No'}`);

    if (!hasDropNotNull || !hasLeadsClientId || !hasLeadsContactId) {
        throw new Error('Faltan alteraciones críticas en las tablas clients o leads.');
    }

    // 2. Validar Nueva Tabla
    console.log('\n--- Verificando creación de tablas nuevas ---');
    const hasActivityLogsTable = sql.includes('CREATE TABLE crm_activity_logs');
    console.log(`✓ Tabla 'crm_activity_logs' definida: ${hasActivityLogsTable ? 'Sí' : 'No'}`);
    if (!hasActivityLogsTable) {
        throw new Error("Falta la definición de la tabla: 'crm_activity_logs'");
    }

    // 3. Validar Campos y Restricciones Críticas
    console.log('\n--- Verificando campos y restricciones críticas ---');
    const criticalChecks = [
        { name: 'activity_type restrict check', pattern: "CHECK (activity_type IN ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'SYSTEM'))" },
        { name: 'requirement_id vinculación', pattern: 'requirement_id uuid NOT NULL REFERENCES requirements' },
        { name: 'Evitar eliminación física (block_physical_crm_delete)', pattern: 'block_physical_crm_delete' }
    ];

    for (const check of criticalChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Restricción/Código '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta el patrón crítico: ${check.pattern} (${check.name})`);
        }
    }

    // 4. Validar Triggers
    console.log('\n--- Verificando triggers registrados ---');
    const triggerChecks = [
        'block_physical_crm_delete',
        'trg_block_crm_activity_delete',
        'trg_crm_activity_traceability',
        'audit_crm_activity_logs'
    ];

    for (const trigger of triggerChecks) {
        const hasTrigger = sql.includes(trigger);
        console.log(`✓ Trigger/Función '${trigger}' registrado: ${hasTrigger ? 'Sí' : 'No'}`);
        if (!hasTrigger) {
            throw new Error(`Falta trigger/función en migración: ${trigger}`);
        }
    }

    // 5. Validar Row Level Security (RLS) habilitado
    console.log('\n--- Verificando RLS en la tabla ---');
    const rlsPattern = 'ALTER TABLE crm_activity_logs ENABLE ROW LEVEL SECURITY';
    const hasRLS = sql.includes(rlsPattern);
    console.log(`✓ RLS habilitado para 'crm_activity_logs': ${hasRLS ? 'Sí' : 'No'}`);
    if (!hasRLS) {
        throw new Error("Falta habilitar RLS para la tabla: 'crm_activity_logs'");
    }

    console.log('\n[ÉXITO] Estructura sintáctica, alteraciones, prevención de borrado físico, triggers y RLS del Módulo CRM validados correctamente.');
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de CRM:', error);
        process.exit(1);
    }
}

main();
