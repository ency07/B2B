// SCRIPT DE VALIDACIÓN SINTÁCTICA: MÓDULO DOCUMENTOS (FASE 18)
// Archivo: scripts/test-documentos.ts
//
// Valida el archivo de migración 20260617000018_documents_core.sql
// sin conectarse a la base de datos (validación local/offline).
//
// REUSE_ANALYSIS_FASE18 cumplido:
//   - GrapesJS  → columna template_html (editor visual)
//   - Handlebars → sintaxis {{variable}} en template_html
//   - Puppeteer  → output_format 'PDF'
//   - Docxtemplater → output_format 'DOCX' + docx_template_storage_path
//   - replace('{{variable}}') PROHIBIDO — D18-07

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
    name: string;
    passed: boolean;
    detail?: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, detail?: string): void {
    results.push({ name, passed: condition, detail });
    const icon = condition ? '✓' : '✗';
    console.log(`${icon} ${name}: ${condition ? 'Sí' : 'No'}${detail ? ` — ${detail}` : ''}`);
    if (!condition) {
        throw new Error(`[FALLO] Verificación fallida: "${name}"${detail ? ` — Buscado: ${detail}` : ''}`);
    }
}

async function runValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA: MÓDULO DOCUMENTOS (FASE 18)');
    console.log('REUSE_ANALYSIS_FASE18: GrapesJS + Handlebars + Puppeteer + Docxtemplater');
    console.log('--------------------------------------------------\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000018_documents_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Archivo cargado: ${migrationPath} (${sql.length} bytes)\n`);

    // ============================================================
    // BLOQUE 1: Tablas principales
    // ============================================================
    console.log('--- [1] Verificando existencia de tablas ---');

    check(
        "Tabla 'document_templates' definida",
        sql.includes('CREATE TABLE document_templates'),
        'CREATE TABLE document_templates'
    );
    check(
        "Tabla 'document_outputs' definida",
        sql.includes('CREATE TABLE document_outputs'),
        'CREATE TABLE document_outputs'
    );

    // ============================================================
    // BLOQUE 2: Columnas clave para el stack open source
    // ============================================================
    console.log('\n--- [2] Verificando columnas del stack open source ---');

    check(
        "Columna 'template_html' para GrapesJS",
        sql.includes('template_html'),
        'template_html text — almacena HTML generado por GrapesJS'
    );
    check(
        "Columna 'docx_template_storage_path' para Docxtemplater",
        sql.includes('docx_template_storage_path'),
        'docx_template_storage_path — ruta al .docx base en storage'
    );
    check(
        "Columna 'output_format' soporta PDF (Puppeteer)",
        sql.includes("'PDF'"),
        "output_format CHECK IN ('PDF', 'DOCX', 'AMBOS')"
    );
    check(
        "Columna 'output_format' soporta DOCX (Docxtemplater)",
        sql.includes("'DOCX'"),
        "output_format CHECK IN ('PDF', 'DOCX', 'AMBOS')"
    );
    check(
        "Columna 'template_data' para datos ERP (Handlebars input)",
        sql.includes('template_data'),
        'template_data jsonb — snapshot de datos inyectados por Handlebars'
    );
    check(
        "Columna 'variables_schema' documenta variables Handlebars",
        sql.includes('variables_schema'),
        'variables_schema jsonb — esquema de variables disponibles'
    );

    // ============================================================
    // BLOQUE 3: Tipos de documento de negocio
    // ============================================================
    console.log('\n--- [3] Verificando tipos de documento ERP ---');

    const docTypes = ['FACTURA', 'COTIZACION', 'ORDEN_TRABAJO', 'CONTRATO', 'GARANTIA', 'RECIBO_PAGO'];
    for (const docType of docTypes) {
        check(
            `Tipo de documento '${docType}' definido`,
            sql.includes(`'${docType}'`),
            `document_type CHECK IN (...${docType}...)`
        );
    }

    // ============================================================
    // BLOQUE 4: Estados del ciclo de vida de outputs
    // ============================================================
    console.log('\n--- [4] Verificando estados del ciclo de vida de document_outputs ---');

    const statuses = ['PENDIENTE', 'GENERANDO', 'COMPLETADO', 'ERROR', 'ANULADO'];
    for (const status of statuses) {
        check(
            `Estado '${status}' en document_outputs`,
            sql.includes(`'${status}'`),
            `status CHECK IN (...${status}...)`
        );
    }

    // ============================================================
    // BLOQUE 5: Triggers
    // ============================================================
    console.log('\n--- [5] Verificando triggers ---');

    check(
        'Trigger de códigos secuenciales (TPL- y DOC-)',
        sql.includes('handle_document_sequences') && sql.includes("'TPL-'") && sql.includes("'DOC-'"),
        'handle_document_sequences con prefijos TPL- y DOC-'
    );
    check(
        'Trigger de plantilla predeterminada única por tipo',
        sql.includes('enforce_single_default_template'),
        'enforce_single_default_template'
    );
    check(
        'Trigger de timestamp de generación al completar',
        sql.includes('handle_document_output_completion'),
        'handle_document_output_completion'
    );
    check(
        'Trigger de bloqueo de borrado físico',
        sql.includes('block_physical_document_delete'),
        'block_physical_document_delete'
    );
    check(
        'Trigger de trazabilidad (handle_approval_traceability)',
        sql.includes('handle_approval_traceability'),
        'trg_template_traceability + trg_output_traceability'
    );
    check(
        'Trigger de auditoría (process_audit_log)',
        sql.includes('process_audit_log'),
        'audit_document_templates + audit_document_outputs'
    );

    // ============================================================
    // BLOQUE 6: Seguridad multitenancy
    // ============================================================
    console.log('\n--- [6] Verificando seguridad RLS multitenancy ---');

    check(
        'RLS habilitado en document_templates',
        sql.includes('ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY'),
        'ENABLE ROW LEVEL SECURITY'
    );
    check(
        'RLS habilitado en document_outputs',
        sql.includes('document_outputs ENABLE ROW LEVEL SECURITY'),
        'ENABLE ROW LEVEL SECURITY on document_outputs'
    );
    check(
        'Política Super Admin cross-tenant en templates',
        sql.includes('doc_templates_super_admin') && sql.includes('is_platform_super_admin()'),
        'is_platform_super_admin()'
    );
    check(
        'Política de lectura tenant en templates',
        sql.includes('doc_templates_select_tenant'),
        'tenant_id = current user tenant_id'
    );
    check(
        'Política de escritura tenant en templates',
        sql.includes('doc_templates_write_tenant'),
        'WITH CHECK tenant_id isolation'
    );
    check(
        'Política Super Admin cross-tenant en outputs',
        sql.includes('doc_outputs_super_admin'),
        'is_platform_super_admin()'
    );
    check(
        'Política de lectura tenant en outputs',
        sql.includes('doc_outputs_select_tenant'),
        'tenant_id isolation'
    );
    check(
        'Política de escritura tenant en outputs',
        sql.includes('doc_outputs_write_tenant'),
        'WITH CHECK tenant_id isolation'
    );

    // ============================================================
    // BLOQUE 7: Soft Delete e Índices
    // ============================================================
    console.log('\n--- [7] Verificando soft delete e índices ---');

    check(
        'Columna deleted_at en document_templates',
        sql.includes('deleted_at') && sql.includes('deleted_by') && sql.includes('delete_reason'),
        'deleted_at, deleted_by, delete_reason'
    );
    check(
        'Índice de rendimiento por tenant en templates',
        sql.includes('idx_doc_templates_tenant'),
        'CREATE INDEX idx_doc_templates_tenant'
    );
    check(
        'Índice de rendimiento por tenant en outputs',
        sql.includes('idx_doc_outputs_tenant'),
        'CREATE INDEX idx_doc_outputs_tenant'
    );
    check(
        'Índice por source_entity + source_id (join polimórfico)',
        sql.includes('idx_doc_outputs_source'),
        'CREATE INDEX idx_doc_outputs_source ON document_outputs(source_entity, source_id)'
    );

    // ============================================================
    // BLOQUE 8: Verificar que NO existe código custom replace()
    // ============================================================
    console.log('\n--- [8] Verificando ausencia de código custom prohibido ---');

    // Ignorar líneas de comentario SQL (-- ...) antes de verificar
    const sqlWithoutComments = sql
        .split('\n')
        .filter(line => !line.trimStart().startsWith('--'))
        .join('\n');

    const hasCustomReplace = sqlWithoutComments.includes("replace('{{") || sqlWithoutComments.includes('replace("{{');
    check(
        "No existe replace('{{variable}}') custom en la migración",
        !hasCustomReplace,
        'D18-07: replace custom PROHIBIDO — se usa Handlebars.js en capa de aplicación'
    );

    // ============================================================
    // RESULTADO FINAL
    // ============================================================
    const totalChecks = results.length;
    const passed = results.filter(r => r.passed).length;

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO: ${passed}/${totalChecks} verificaciones aprobadas`);
    console.log('--------------------------------------------------');
    console.log('\n[ÉXITO] Módulo de Documentos FASE 18 validado correctamente.');
    console.log('Stack open source confirmado:');
    console.log('  ✓ GrapesJS     → template_html (editor visual)');
    console.log('  ✓ Handlebars.js → variables_schema + template_data (motor plantillas)');
    console.log('  ✓ Puppeteer    → output_format PDF');
    console.log('  ✓ Docxtemplater → output_format DOCX + docx_template_storage_path');
    console.log('  ✓ replace custom → PROHIBIDO (D18-07 cumplido)');
}

async function main() {
    try {
        await runValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación del módulo de documentos:', error);
        process.exit(1);
    }
}

main();
