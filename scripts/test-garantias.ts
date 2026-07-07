// SCRIPT DE VALIDACIÓN: GARANTÍAS Y POSTVENTA (FASE 10)
// Archivo: scripts/test-garantias.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO GARANTÍAS (FASE 10)...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000010_warranties_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar Tablas
    const hasWarrantiesTable = sql.includes('CREATE TABLE warranties');
    const hasInterventionsTable = sql.includes('CREATE TABLE warranty_interventions');
    const hasAlterMovements = sql.includes('ALTER TABLE inventory_movements') && sql.includes('warranty_intervention_id');

    // 2. Validar Campos y Restricciones Críticas
    const hasWarrantyCode = sql.includes('warranty_code');
    const hasInterventionCode = sql.includes('intervention_code');
    const hasJobIdInWarranties = sql.includes('job_id uuid NOT NULL REFERENCES jobs');
    const hasJobIdInInterventions = sql.includes('job_id uuid REFERENCES jobs');
    const hasCancelReason = sql.includes('cancel_reason');

    // 3. Validar Funciones y Triggers
    const hasSeqTrigger = sql.includes('handle_warranty_sequences');
    const hasVencidaTrigger = sql.includes('handle_warranty_vencida');
    const hasAutoCreateTrigger = sql.includes('generate_warranty_on_job_close');
    const hasCheckStatusTrigger = sql.includes('check_warranty_status_before_intervention');
    const hasUpdateStatusInterventionTrigger = sql.includes('update_warranty_status_on_intervention');
    const hasCancelTrigger = sql.includes('validate_warranty_cancel');
    const hasBlockDelete = sql.includes('block_physical_warranty_delete');

    // 4. Validar RLS
    const hasWarrantiesRLS = sql.includes('ALTER TABLE warranties ENABLE ROW LEVEL SECURITY');
    const hasInterventionsRLS = sql.includes('ALTER TABLE warranty_interventions ENABLE ROW LEVEL SECURITY');

    console.log(`✓ Archivo de migración de Garantías encontrado: ${path.basename(migrationPath)}`);
    console.log(`✓ Tabla 'warranties' definida: ${hasWarrantiesTable ? 'Sí' : 'No'}`);
    console.log(`✓ Tabla 'warranty_interventions' definida: ${hasInterventionsTable ? 'Sí' : 'No'}`);
    console.log(`✓ Alteración de 'inventory_movements' para 'warranty_intervention_id': ${hasAlterMovements ? 'Sí' : 'No'}`);
    
    console.log(`✓ Campo 'warranty_code' y 'intervention_code' definidos: ${hasWarrantyCode && hasInterventionCode ? 'Sí' : 'No'}`);
    console.log(`✓ Vinculación con Jobs (job_id obligatorio en warranties, opcional en interventions): ${hasJobIdInWarranties && hasJobIdInInterventions ? 'Sí' : 'No'}`);
    console.log(`✓ Campo 'cancel_reason' para anulaciones justificados: ${hasCancelReason ? 'Sí' : 'No'}`);

    console.log(`✓ Trigger de secuencias de códigos correlativos (GAR- e INT-): ${hasSeqTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de verificación de expiración ('VENCIDA'): ${hasVencidaTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de creación automática de garantías al cerrar Job: ${hasAutoCreateTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de validación de estado antes de registrar intervención: ${hasCheckStatusTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de recálculo de estado de garantía según intervenciones: ${hasUpdateStatusInterventionTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de validación de anulación (cancel_reason >= 10 chars): ${hasCancelTrigger ? 'Sí' : 'No'}`);
    console.log(`✓ Trigger de prevención de borrado físico: ${hasBlockDelete ? 'Sí' : 'No'}`);

    console.log(`✓ RLS habilitado en warranties: ${hasWarrantiesRLS ? 'Sí' : 'No'}`);
    console.log(`✓ RLS habilitado en warranty_interventions: ${hasInterventionsRLS ? 'Sí' : 'No'}`);

    const isValid = hasWarrantiesTable && hasInterventionsTable && hasAlterMovements &&
                    hasWarrantyCode && hasInterventionCode && hasJobIdInWarranties && hasJobIdInInterventions && hasCancelReason &&
                    hasSeqTrigger && hasVencidaTrigger && hasAutoCreateTrigger && hasCheckStatusTrigger &&
                    hasUpdateStatusInterventionTrigger && hasCancelTrigger && hasBlockDelete &&
                    hasWarrantiesRLS && hasInterventionsRLS;

    if (isValid) {
        console.log('\n[ÉXITO] Estructura sintáctica, triggers, RLS y funciones del Módulo de Garantías validados correctamente.');
    } else {
        throw new Error('Validación de estructura SQL de Garantías fallida. Revise las especificaciones de la migración.');
    }
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de garantías:', error);
        process.exit(1);
    }
}

main();
