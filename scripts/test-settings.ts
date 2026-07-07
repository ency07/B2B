// SCRIPT DE VALIDACIÓN SINTÁCTICA: CENTRO DE CONFIGURACIÓN EMPRESARIAL (FASE 31)
// Archivo: scripts/test-settings.ts

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
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA: CENTRO DE CONFIGURACIÓN (FASE 31)');
    console.log('==================================================\n');

    const migPath = path.join(__dirname, '../supabase/migrations/20260617000031_settings_core.sql');
    check("Archivo de migración FASE 31 existe", fs.existsSync(migPath));
    const sql = fs.readFileSync(migPath, 'utf8');
    console.log(`Archivo cargado: ${sql.length} bytes\n`);

    // ============================================================
    // BLOQUE 1: Tabla tenant_settings
    // ============================================================
    console.log('--- [1] Verificando tabla tenant_settings ---');
    check(
        "Tabla 'tenant_settings' definida",
        sql.includes('CREATE TABLE tenant_settings'),
    );
    check(
        "Campo 'tenant_id' referenciado a tenants",
        sql.includes('tenant_id uuid NOT NULL REFERENCES tenants(id)'),
    );
    check(
        "Campo 'module' con CHECK de valores permitidos",
        sql.includes("module varchar(100) NOT NULL CHECK (module IN (") &&
        sql.includes("'EMPRESA'") && sql.includes("'LOCALIZACION'") &&
        sql.includes("'IDENTIDAD'") && sql.includes("'DOCUMENTOS'") && sql.includes("'ERP'"),
        'Módulos: EMPRESA, LOCALIZACION, IDENTIDAD, DOCUMENTOS, ERP'
    );
    check(
        "Campo 'config_key' definido",
        sql.includes("config_key varchar(150) NOT NULL"),
    );
    check(
        "Campo 'config_value' JSONB definido",
        sql.includes("config_value jsonb NOT NULL"),
        'Almacenamiento flexible JSONB'
    );
    check(
        "Campo 'is_encrypted' para credenciales sensibles (FASE 33)",
        sql.includes("is_encrypted boolean NOT NULL DEFAULT false"),
        'Preparado para cifrado de API keys'
    );
    check(
        "Restricción UNIQUE (tenant_id, module, config_key)",
        sql.includes("UNIQUE (tenant_id, module, config_key)"),
        'Evita duplicación de claves por módulo por tenant'
    );

    // ============================================================
    // BLOQUE 2: Campos de trazabilidad y soft delete
    // ============================================================
    console.log('\n--- [2] Verificando trazabilidad y soft delete ---');
    check(
        "Campo 'updated_by' definido",
        sql.includes("updated_by  uuid REFERENCES users(id)"),
    );
    check(
        "Campo 'deleted_at' para soft delete",
        sql.includes("deleted_at  timestamp"),
    );
    check(
        "Campo 'deleted_by' para trazabilidad de borrado",
        sql.includes("deleted_by  uuid REFERENCES users(id)"),
    );
    check(
        "Campo 'delete_reason' para motivo obligatorio",
        sql.includes("delete_reason text"),
    );

    // ============================================================
    // BLOQUE 3: Funciones de utilidad get/set
    // ============================================================
    console.log('\n--- [3] Verificando funciones de utilidad ---');
    check(
        "Función 'get_tenant_setting' definida",
        sql.includes('CREATE OR REPLACE FUNCTION get_tenant_setting'),
        'Lee configuración por tenant, módulo y clave'
    );
    check(
        "Función 'set_tenant_setting' definida (UPSERT)",
        sql.includes('CREATE OR REPLACE FUNCTION set_tenant_setting'),
        'Inserta o actualiza configuración atómicamente'
    );
    check(
        "set_tenant_setting usa ON CONFLICT para UPSERT",
        sql.includes('ON CONFLICT (tenant_id, module, config_key)'),
        'Garantiza que no se dupliquen claves'
    );
    check(
        "Funciones declaradas con SECURITY DEFINER",
        (sql.match(/SECURITY DEFINER/g) || []).length >= 2,
        'get_tenant_setting y set_tenant_setting con SECURITY DEFINER'
    );

    // ============================================================
    // BLOQUE 4: Triggers
    // ============================================================
    console.log('\n--- [4] Verificando triggers ---');
    check(
        "Trigger 'trg_tenant_settings_updated_at' definido",
        sql.includes('CREATE TRIGGER trg_tenant_settings_updated_at'),
        'Actualización automática de timestamp'
    );
    check(
        "Función 'block_physical_settings_delete' definida",
        sql.includes('CREATE OR REPLACE FUNCTION block_physical_settings_delete'),
        'Protección contra borrado físico accidental'
    );
    check(
        "Trigger 'trg_block_physical_settings_delete' definido",
        sql.includes('CREATE TRIGGER trg_block_physical_settings_delete') &&
        sql.includes('BEFORE DELETE ON tenant_settings'),
        'Bloqueo de DELETE físico en configuraciones'
    );
    check(
        "Trigger de auditoría 'trg_tenant_settings_audit' definido",
        sql.includes('CREATE TRIGGER trg_tenant_settings_audit') &&
        sql.includes('process_audit_log()'),
        'Integrado con audit_log global'
    );

    // ============================================================
    // BLOQUE 5: Row Level Security
    // ============================================================
    console.log('\n--- [5] Verificando RLS y Políticas ---');
    check(
        "RLS habilitado en tenant_settings",
        /ALTER TABLE\s+tenant_settings\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sql),
    );
    check(
        "Política 'tenant_settings_super_admin' definida",
        sql.includes("CREATE POLICY tenant_settings_super_admin ON tenant_settings") &&
        sql.includes("is_platform_super_admin()"),
        'Acceso global para Super Admin'
    );
    check(
        "Política de lectura 'tenant_settings_read' definida",
        sql.includes("CREATE POLICY tenant_settings_read ON tenant_settings"),
        'Lectura pública para usuarios del tenant'
    );
    check(
        "Política de escritura 'tenant_settings_write' restringida a roles de administración",
        sql.includes("CREATE POLICY tenant_settings_write ON tenant_settings") &&
        sql.includes("'ADMINISTRADOR_TENANT'") && sql.includes("'GERENTE'"),
        'Solo admins y gerentes pueden modificar configuración'
    );

    // ============================================================
    // BLOQUE 6: Índices de rendimiento
    // ============================================================
    console.log('\n--- [6] Verificando índices de rendimiento ---');
    check(
        "Índice compuesto (tenant_id, module) definido",
        sql.includes('idx_tenant_settings_tenant_module'),
        'Optimización de búsquedas por módulo'
    );
    check(
        "Índice compuesto (tenant_id, config_key) definido",
        sql.includes('idx_tenant_settings_key'),
        'Optimización de búsquedas por clave'
    );
    check(
        "Índice en updated_by definido",
        sql.includes('idx_tenant_settings_updated_by'),
        'Trazabilidad de modificaciones'
    );
    check(
        "Todos los índices son parciales (WHERE deleted_at IS NULL)",
        (sql.match(/WHERE deleted_at IS NULL/g) || []).length >= 3,
        'Optimización de soft-delete en indices'
    );

    // ============================================================
    // BLOQUE 7: Conformidad con 0.4 CONFIGURACION_GLOBAL_OBLIGATORIA
    // ============================================================
    console.log('\n--- [7] Verificando conformidad con D30-01/D30-03 ---');
    check(
        "No existe ningún valor hardcoded de teléfono, color o URL en la migración",
        !sql.includes('+57') && !sql.includes('#FF') && !sql.includes('https://empresa'),
        'D30-03: Cero hardcoding — los valores se configuran dinámicamente'
    );
    check(
        "Módulo IDENTIDAD incluye claves para logos y colores (en comentarios guía, no hardcoded)",
        sql.includes('logo_claro_url') && sql.includes('color_primario'),
        'Claves de configuración documentadas en la migración'
    );
    check(
        "Módulo ERP incluye claves de soporte y links legales",
        sql.includes('url_soporte') && sql.includes('url_politica_privacidad') && sql.includes('url_terminos'),
        'D30-03: URLs de soporte y legales configurables desde DB'
    );

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO: ${results.filter(r => r.passed).length}/${results.length} verificaciones aprobadas`);
    console.log('[ÉXITO] Centro de Configuración Empresarial FASE 31 validado correctamente.');
    console.log('--------------------------------------------------');
}

runValidation().catch(err => {
    console.error(err);
    process.exit(1);
});
