// SCRIPT DE VALIDACIÓN: WEB PÚBLICA Y CATÁLOGO TÉCNICO (FASE 11)
// Archivo: scripts/test-website.ts

import * as fs from 'fs';
import * as path from 'path';

async function runMockValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DEL MÓDULO WEBSITE (FASE 11)...');
    console.log('--------------------------------------------------');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000011_website_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Validar las 11 Tablas
    const tables = [
        'website_pages',
        'website_forms',
        'leads',
        'lead_sources',
        'website_sessions',
        'website_events',
        'website_downloads',
        'product_categories',
        'product_families',
        'products',
        'product_specifications'
    ];

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
        { name: 'PAG- en secuencias', pattern: "'PAG-'" },
        { name: 'FRM- en secuencias', pattern: "'FRM-'" },
        { name: 'LED- en secuencias', pattern: "'LED-'" },
        { name: 'CAT- en secuencias', pattern: "'CAT-'" },
        { name: 'FAM- en secuencias', pattern: "'FAM-'" },
        { name: 'PRO- en secuencias', pattern: "'PRO-'" },
        { name: 'Evitar eliminación física (block_physical_website_delete)', pattern: 'block_physical_website_delete' }
    ];

    for (const check of criticalChecks) {
        const hasPattern = sql.includes(check.pattern);
        console.log(`✓ Restricción/Código '${check.name}': ${hasPattern ? 'Sí' : 'No'}`);
        if (!hasPattern) {
            throw new Error(`Falta el patrón crítico: ${check.pattern} (${check.name})`);
        }
    }

    // 3. Validar Triggers de Trazabilidad, Secuencia y Auditoría
    console.log('\n--- Verificando triggers de auditoría, secuencia y soft delete ---');
    const triggerChecks = [
        'handle_website_sequences',
        'trg_handle_page_code',
        'trg_handle_form_code',
        'trg_handle_lead_code',
        'trg_handle_category_code',
        'trg_handle_family_code',
        'trg_handle_product_code',
        'trg_block_page_delete',
        'trg_block_form_delete',
        'trg_block_lead_delete',
        'trg_block_category_delete',
        'trg_block_family_delete',
        'trg_block_product_delete',
        'trg_block_specification_delete',
        'trg_page_traceability',
        'trg_form_traceability',
        'trg_lead_traceability',
        'trg_category_traceability',
        'trg_family_traceability',
        'trg_product_traceability',
        'trg_specification_traceability',
        'audit_website_pages',
        'audit_website_forms',
        'audit_leads',
        'audit_product_categories',
        'audit_product_families',
        'audit_products',
        'audit_product_specifications'
    ];

    for (const trigger of triggerChecks) {
        const hasTrigger = sql.includes(trigger);
        console.log(`✓ Trigger/Función '${trigger}' registrado: ${hasTrigger ? 'Sí' : 'No'}`);
        if (!hasTrigger) {
            throw new Error(`Falta trigger/función en migración: ${trigger}`);
        }
    }

    // 4. Validar Row Level Security (RLS) habilitado en las 11 tablas
    console.log('\n--- Verificando RLS en las 11 tablas ---');
    for (const table of tables) {
        const rlsPattern = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`;
        const hasRLS = sql.includes(rlsPattern);
        console.log(`✓ RLS habilitado para '${table}': ${hasRLS ? 'Sí' : 'No'}`);
        if (!hasRLS) {
            throw new Error(`Falta habilitar RLS para la tabla: ${table}`);
        }
    }

    console.log('\n[ÉXITO] Estructura sintáctica, secuencias, prevención de borrado físico, triggers y RLS del Módulo Web y Catálogo Técnico validados correctamente.');
}

async function main() {
    try {
        await runMockValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación de website/catálogo:', error);
        process.exit(1);
    }
}

main();
