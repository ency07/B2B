// SCRIPT DE VALIDACIÓN SINTÁCTICA: WHITE LABEL (FASE 32)
// Archivo: scripts/test-white-label.ts

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
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA: WHITE LABEL (FASE 32)');
    console.log('==================================================\n');

    const migPath = path.join(__dirname, '../supabase/migrations/20260617000032_white_label.sql');
    check("Archivo de migración FASE 32 existe", fs.existsSync(migPath));
    const sql = fs.readFileSync(migPath, 'utf8');
    console.log(`Archivo cargado: ${sql.length} bytes\n`);

    // ============================================================
    // BLOQUE 1: Trigger de Validación de Formato de Branding
    // ============================================================
    console.log('--- [1] Verificando función y trigger de validación ---');
    check(
        "Función 'validate_tenant_settings_white_label' definida",
        sql.includes('CREATE OR REPLACE FUNCTION validate_tenant_settings_white_label'),
        'Función trigger para validar configuraciones visuales'
    );
    check(
        "Filtro por módulos visuales (IDENTIDAD, ERP, DOCUMENTOS)",
        sql.includes("NEW.module IN ('IDENTIDAD', 'ERP', 'DOCUMENTOS')"),
        'Filtro selectivo de validación'
    );
    check(
        "Trigger 'trg_validate_tenant_settings_white_label' asignado",
        sql.includes('CREATE TRIGGER trg_validate_tenant_settings_white_label') &&
        sql.includes('BEFORE INSERT OR UPDATE ON tenant_settings') &&
        sql.includes('EXECUTE FUNCTION validate_tenant_settings_white_label()'),
        'Trigger BEFORE INSERT OR UPDATE asignado correctamente'
    );

    // ============================================================
    // BLOQUE 2: Reglas de Validación de Color y URL
    // ============================================================
    console.log('\n--- [2] Verificando reglas de validación (Regex) ---');
    check(
        "Validación de tipo string en colores",
        sql.includes("v_val_type <> 'string'") && sql.includes("'color_primario'"),
        'Previene tipos no-string para colores'
    );
    check(
        "Validación de formato hexadecimal/rgba/hsla de color",
        sql.includes("color_primario") && sql.includes("color_secundario") &&
        sql.includes("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"),
        'Expresión regular para colores hex'
    );
    check(
        "Validación de tipo string en URLs",
        sql.includes("logo_claro_url") && sql.includes("favicon_url") && sql.includes("v_val_type <> 'string'"),
        'Previene tipos no-string para URLs'
    );
    check(
        "Validación de formato de URL (http/https, relative, base64)",
        sql.includes("^https?:\\/\\/.*") && sql.includes("^\\/.*") && sql.includes("^data:image\\/"),
        'Expresión regular para URLs seguras y rutas relativas'
    );

    // ============================================================
    // BLOQUE 3: Validación de Layouts JSONB
    // ============================================================
    console.log('\n--- [3] Verificando validación de layouts ---');
    check(
        "Validación de layouts (sidebar, dashboard, widgets, menus)",
        sql.includes("layout_sidebar") && sql.includes("layout_dashboard") &&
        sql.includes("layout_menus") && sql.includes("layout_widgets"),
        'Claves de layouts dinámicos detectadas'
    );
    check(
        "Validación de tipo JSON (objeto o array)",
        sql.includes("v_val_type NOT IN ('object', 'array')"),
        'Previene tipos atómicos (números, strings) para layouts'
    );

    // ============================================================
    // BLOQUE 4: Funciones de Branding Dinámico get_white_label_config
    // ============================================================
    console.log('\n--- [4] Verificando funciones de branding dinámico ---');
    check(
        "Función 'get_white_label_config' definida",
        sql.includes('CREATE OR REPLACE FUNCTION get_white_label_config'),
        'Función para consolidar todo el branding de un tenant'
    );
    check(
        "Función 'get_my_white_label_config' definida",
        sql.includes('CREATE OR REPLACE FUNCTION get_my_white_label_config'),
        'Función para obtener branding del token JWT'
    );
    check(
        "Uso de SECURITY DEFINER en funciones de lectura",
        sql.includes('get_white_label_config') && sql.includes('SECURITY DEFINER'),
        'Bypass RLS controlado mediante SECURITY DEFINER'
    );
    check(
        "Resolución segura de tenant_id vía JWT",
        sql.includes("(auth.jwt() ->> 'tenant_id')::uuid"),
        'get_my_white_label_config lee tenant de forma inalterable'
    );

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO: ${results.length}/${results.length} verificaciones aprobadas`);
    console.log('[ÉXITO] White Label FASE 32 validado correctamente.');
    console.log('--------------------------------------------------');
}

runValidation().catch(err => {
    console.error(err);
    process.exit(1);
});
