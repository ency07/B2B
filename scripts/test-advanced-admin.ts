// SCRIPT DE VALIDACIÓN SINTÁCTICA: ADMINISTRACIÓN AVANZADA (FASE 34)
// Archivo: scripts/test-advanced-admin.ts

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult { name: string; passed: boolean; }
const results: CheckResult[] = [];

function check(name: string, condition: boolean, detail?: string): void {
    results.push({ name, passed: condition });
    const icon = condition ? '✓' : '✗';
    console.log(`${icon} ${name}: ${condition ? 'Sí' : 'No'}${detail ? ` — ${detail}` : ''}`);
    if (!condition) {
        throw new Error(`[FALLO] "${name}"${detail ? ` — ${detail}` : ''}`);
    }
}

async function runValidation() {
    console.log('==================================================');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA: ADMINISTRACIÓN AVANZADA (FASE 34)');
    console.log('==================================================\n');

    const migPath = path.join(__dirname, '../supabase/migrations/20260617000034_advanced_admin.sql');
    check("Archivo de migración FASE 34 existe", fs.existsSync(migPath));
    const sql = fs.readFileSync(migPath, 'utf8');
    console.log(`Archivo cargado: ${sql.length} bytes\n`);

    // ============================================================
    // BLOQUE 1: Columnas de Perfil en users
    // ============================================================
    console.log('--- [1] Verificando perfil de usuario ---');
    check(
        "Columna avatar_url en users",
        sql.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url'),
        'Soporte para avatar'
    );
    check(
        "Columna preferred_language en users",
        sql.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language'),
        'Soporte para idioma de preferencia'
    );
    check(
        "Columna preferred_theme en users",
        sql.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_theme'),
        'Soporte para tema visual'
    );
    check(
        "Columna signature_url en users",
        sql.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url'),
        'Soporte para firma digitalizada'
    );

    // ============================================================
    // BLOQUE 2: Columna custom_fields en las 7 tablas principales
    // ============================================================
    console.log('\n--- [2] Verificando columna custom_fields en tablas clave ---');
    const tables = ['clients', 'requirements', 'quotes', 'jobs', 'invoices', 'warranties', 'users'];
    for (const t of tables) {
        check(
            `Columna custom_fields añadida a ${t}`,
            sql.includes(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb`),
            'Columna JSONB para campos dinámicos'
        );
    }

    // ============================================================
    // BLOQUE 3: Tabla custom_field_definitions y trigger de validación
    // ============================================================
    console.log('\n--- [3] Verificando custom_field_definitions y trigger ---');
    check(
        "Tabla 'custom_field_definitions' definida",
        sql.includes('CREATE TABLE custom_field_definitions'),
        'Esquema relacional para definir metadatos dinámicos'
    );
    check(
        "Validación CHECK para tipo de campo (TEXT, NUMBER, DATE, LIST, FILE, BOOLEAN, JSON)",
        sql.includes("CHECK (field_type IN") &&
        sql.includes("'TEXT'") && sql.includes("'NUMBER'") && sql.includes("'DATE'") &&
        sql.includes("'LIST'") && sql.includes("'FILE'") && sql.includes("'BOOLEAN'") && sql.includes("'JSON'"),
        'Valores de tipos permitidos en la base de datos'
    );
    check(
        "Función 'validate_entity_custom_fields' definida",
        sql.includes('CREATE OR REPLACE FUNCTION validate_entity_custom_fields()'),
        'Trigger que valida esquemas JSONB al vuelo'
    );
    
    // Verificar que los triggers BEFORE INSERT OR UPDATE estén asignados en las 7 tablas
    for (const t of tables) {
        check(
            `Trigger trg_validate_custom_fields asignado a ${t}`,
            sql.includes(`CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON ${t}`) &&
            sql.includes('EXECUTE FUNCTION validate_entity_custom_fields()'),
            'Trigger BEFORE INSERT OR UPDATE asignado correctamente'
        );
    }

    // ============================================================
    // BLOQUE 4: Reglas del motor de campos personalizados
    // ============================================================
    console.log('\n--- [4] Verificando lógica de tipos de campos ---');
    check(
        "Validador verifica campos requeridos",
        sql.includes('is_required = true') && sql.includes('RAISE EXCEPTION') && sql.includes('es requerido'),
        'Rechaza payloads que omiten campos obligatorios'
    );
    check(
        "Validador valida tipo TEXT",
        sql.includes("field_type = 'TEXT'") && sql.includes("v_val_type <> 'string'"),
        'TEXT debe ser string'
    );
    check(
        "Validador valida tipo NUMBER",
        sql.includes("field_type = 'NUMBER'") && sql.includes("v_val_type <> 'number'"),
        'NUMBER debe ser número'
    );
    check(
        "Validador valida tipo DATE (Regex YYYY-MM-DD)",
        sql.includes("field_type = 'DATE'") && sql.includes("^\\d{4}-\\d{2}-\\d{2}$"),
        'DATE debe ser string con formato YYYY-MM-DD'
    );
    check(
        "Validador valida tipo LIST contra opciones configuradas",
        sql.includes("field_type = 'LIST'") && sql.includes("jsonb_array_elements_text"),
        'LIST debe pertenecer a opciones permitidas'
    );
    check(
        "Validador rechaza campos no definidos",
        sql.includes('no está definido para el tipo de entidad'),
        'Previene contaminación de campos no autorizados'
    );

    // ============================================================
    // BLOQUE 5: Motor de Automatizaciones por Reglas
    // ============================================================
    console.log('\n--- [5] Verificando motor de automatización ---');
    check(
        "Tabla 'automation_rules' definida",
        sql.includes('CREATE TABLE automation_rules'),
        'IF Event -> DO Action relacional'
    );
    check(
        "Acciones permitidas (DISPATCH_NOTIFICATION, CREATE_TASK, WRITE_LOG)",
        sql.includes("CHECK (action_type IN ('DISPATCH_NOTIFICATION', 'CREATE_TASK', 'WRITE_LOG'))"),
        'Tipos de acciones soportadas en la base de datos'
    );
    check(
        "Función 'execute_automation_rules' definida",
        sql.includes('CREATE OR REPLACE FUNCTION execute_automation_rules'),
        'Ejecución del bus de reglas'
    );
    check(
        "Llamada a dispatch_notification_to_route en la automatización",
        sql.includes('dispatch_notification_to_route'),
        'Integra enrutamiento de la Fase 33'
    );

    // ============================================================
    // BLOQUE 6: Seguridad RLS y Hardening
    // ============================================================
    console.log('\n--- [6] Verificando RLS, Políticas e Índices ---');
    check(
        "RLS habilitado en custom_field_definitions",
        sql.includes('ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY'),
        'Aislamiento de definiciones'
    );
    check(
        "RLS habilitado en automation_rules",
        sql.includes('ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY'),
        'Aislamiento de automatizaciones'
    );
    check(
        "Índice parcial idx_custom_field_defs_tenant_entity con WHERE deleted_at IS NULL",
        sql.includes('CREATE INDEX idx_custom_field_defs_tenant_entity ON custom_field_definitions') &&
        sql.includes('WHERE deleted_at IS NULL'),
        'Rendimiento en soft deletes'
    );
    check(
        "Índice parcial idx_automation_rules_tenant_event con WHERE deleted_at IS NULL",
        sql.includes('CREATE INDEX idx_automation_rules_tenant_event ON automation_rules') &&
        sql.includes('WHERE deleted_at IS NULL'),
        'Rendimiento en soft deletes'
    );
    check(
        "Trigger de bloqueo de deletes físicos asignado a las nuevas tablas",
        sql.includes('trg_block_custom_field_defs_delete') && sql.includes('trg_block_automation_rules_delete') &&
        sql.includes('block_physical_settings_delete()'),
        'Soft delete obligatorio'
    );

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO: ${results.length}/${results.length} verificaciones aprobadas`);
    console.log('[ÉXITO] Administración Avanzada FASE 34 validado correctamente.');
    console.log('--------------------------------------------------');
}

runValidation().catch(err => {
    console.error(err);
    process.exit(1);
});
