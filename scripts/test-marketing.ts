// SCRIPT DE VALIDACIÓN: MARKETING Y SLA (FASE 14)
// Archivo: scripts/test-marketing.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO MARKETING (FASE 14)...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000014_marketing_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar Alteraciones en la Tabla Leads
    console.log('--- Verificando alteraciones en la tabla leads ---');
    const checkColumns = [
        { name: 'lead_source enum check', pattern: "CHECK (lead_source IN ('Google Ads', 'SEO', 'LinkedIn', 'WhatsApp', 'Facebook', 'Instagram', 'Email Marketing', 'Directo', 'Referido', 'Distribuidor', 'Otro'))" },
        { name: 'owner_user_id', pattern: 'owner_user_id uuid REFERENCES users' },
        { name: 'assigned_at', pattern: 'assigned_at timestamp' },
        { name: 'first_contact_at', pattern: 'first_contact_at timestamp' },
        { name: 'last_contact_at', pattern: 'last_contact_at timestamp' },
        { name: 'next_follow_up_at', pattern: 'next_follow_up_at timestamp' },
        { name: 'sla_due_at', pattern: 'sla_due_at timestamp' },
        { name: 'sla_status enum check', pattern: "CHECK (sla_status IN ('PENDIENTE', 'CUMPLIDO', 'INCUMPLIDO'))" },
        { name: 'status enum check', pattern: "CHECK (status IN ('NUEVO', 'MQL', 'SQL', 'OPORTUNIDAD', 'CERRADO_CONVERTIDO', 'RECHAZADO'))" }
    ];

    for (const check of checkColumns) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Columna/Restricción '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta patrón en alteración de leads: ${check.pattern} (${check.name})`);
        }
    }

    // 2. Validar Triggers y Funciones de Cómputo de SLA
    console.log('\n--- Verificando triggers y funciones de SLA ---');
    const triggerChecks = [
        { name: 'Función handle_lead_sla_calculation', pattern: 'CREATE OR REPLACE FUNCTION handle_lead_sla_calculation' },
        { name: 'Trigger trg_handle_lead_sla', pattern: 'CREATE TRIGGER trg_handle_lead_sla BEFORE INSERT OR UPDATE ON leads' },
        { name: 'Cálculo urgencia alta (15 mins)', pattern: "INTERVAL '15 minutes'" },
        { name: 'Cálculo urgencia media (4 hours)', pattern: "INTERVAL '4 hours'" },
        { name: 'Cálculo urgencia baja (24 hours)', pattern: "INTERVAL '24 hours'" },
        { name: 'Evaluación de CUMPLIDO', pattern: "NEW.sla_status := 'CUMPLIDO'" },
        { name: 'Evaluación de INCUMPLIDO', pattern: "NEW.sla_status := 'INCUMPLIDO'" }
    ];

    for (const check of triggerChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en triggers de SLA: ${check.pattern} (${check.name})`);
        }
    }

    // 3. Validar Trigger de Notificación de Incumplimiento de SLA
    console.log('\n--- Verificando trigger de incumplimiento de SLA ---');
    const breachChecks = [
        { name: 'Función validate_lead_sla_breach', pattern: 'CREATE OR REPLACE FUNCTION validate_lead_sla_breach' },
        { name: 'Trigger trg_validate_lead_sla_breach', pattern: 'CREATE TRIGGER trg_validate_lead_sla_breach AFTER UPDATE ON leads' },
        { name: 'Inserción del evento LEAD_SLA_BREACHED', pattern: "'LEAD_SLA_BREACHED'" }
    ];

    for (const check of breachChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Lógica/Trigger '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta lógica en triggers de breach de SLA: ${check.pattern} (${check.name})`);
        }
    }

    console.log('\n[ÉXITO] Estructura sintáctica, columnas de marketing/SLA, triggers de cómputo y registro de eventos de la Fase 14 validados correctamente.');
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de marketing:', error);
        process.exit(1);
    }
}

main();
