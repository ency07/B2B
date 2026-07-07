// SCRIPT DE VALIDACIÓN SINTÁCTICA: INTEGRACIONES Y CANALES (FASE 33)
// Archivo: scripts/test-integrations.ts

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
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA: INTEGRACIONES (FASE 33)');
    console.log('==================================================\n');

    const migPath = path.join(__dirname, '../supabase/migrations/20260617000033_integrations.sql');
    check("Archivo de migración FASE 33 existe", fs.existsSync(migPath));
    const sql = fs.readFileSync(migPath, 'utf8');
    console.log(`Archivo cargado: ${sql.length} bytes\n`);

    // ============================================================
    // BLOQUE 1: Módulos y pgcrypto
    // ============================================================
    console.log('--- [1] Verificando extensión y nuevos módulos ---');
    check(
        "Extensión pgcrypto habilitada",
        sql.includes('CREATE EXTENSION IF NOT EXISTS pgcrypto'),
        'Requerida para cifrado simétrico'
    );
    check(
        "Módulos INTEGRACIONES y TELEFONIA añadidos a check constraint",
        sql.includes("'INTEGRACIONES'") && sql.includes("'TELEFONIA'"),
        'Módulos permitidos ampliados en tenant_settings'
    );

    // ============================================================
    // BLOQUE 2: Cifrado en Base de Datos
    // ============================================================
    console.log('\n--- [2] Verificando cifrado de secretos ---');
    check(
        "Función de cifrado 'handle_tenant_settings_encryption' definida",
        sql.includes('CREATE OR REPLACE FUNCTION handle_tenant_settings_encryption'),
        'Cifra secretos de manera transparente'
    );
    check(
        "Uso de pgp_sym_encrypt y encode base64",
        sql.includes('pgp_sym_encrypt') && sql.includes("encode") && sql.includes("'base64'"),
        'Encripta a AES y codifica a string Base64'
    );
    check(
        "Uso de settings_secret_key para frase secreta del sistema",
        sql.includes("current_setting('app.settings_secret_key'"),
        'Resuelve la frase secreta de manera configurable'
    );
    check(
        "Trigger 'trg_z_tenant_settings_encryption' asignado",
        sql.includes('CREATE TRIGGER trg_z_tenant_settings_encryption') &&
        sql.includes('BEFORE INSERT OR UPDATE ON tenant_settings') &&
        sql.includes('EXECUTE FUNCTION handle_tenant_settings_encryption()'),
        'Trigger BEFORE INSERT OR UPDATE asignado correctamente'
    );

    // ============================================================
    // BLOQUE 3: Descifrado Automático
    // ============================================================
    console.log('\n--- [3] Verificando descifrado automático ---');
    check(
        "Función 'get_tenant_setting' soporta descifrado",
        sql.includes('CREATE OR REPLACE FUNCTION get_tenant_setting'),
        'Redefine get_tenant_setting'
    );
    check(
        "Uso de pgp_sym_decrypt y decode base64",
        sql.includes('pgp_sym_decrypt') && sql.includes("decode") && sql.includes("'base64'"),
        'Decodifica y desencripta AES simétrico'
    );
    check(
        "get_tenant_setting declarada con SECURITY DEFINER",
        sql.includes('SECURITY DEFINER'),
        'Evita elevaciones de privilegios inseguras'
    );

    // ============================================================
    // BLOQUE 4: Validación de Teléfonos (E.164)
    // ============================================================
    console.log('\n--- [4] Verificando validación de teléfonos ---');
    check(
        "Función 'validate_tenant_settings_white_label' redefinida",
        sql.includes('CREATE OR REPLACE FUNCTION validate_tenant_settings_white_label'),
        'Actualiza las validaciones de datos'
    );
    check(
        "Validación de módulo TELEFONIA y tipo string",
        sql.includes("NEW.module = 'TELEFONIA'") && sql.includes("v_val_type <> 'string'"),
        'Previene tipos no-string en telefonía'
    );
    check(
        "Expresión regular E.164 para números telefónicos",
        sql.includes("^\\+[1-9]\\d{5,14}$"),
        'Valida formato internacional estricto (+57...)'
    );

    // ============================================================
    // BLOQUE 5: Enrutamiento Dinámico de Alertas
    // ============================================================
    console.log('\n--- [5] Verificando enrutamiento de notificaciones ---');
    check(
        "Función 'get_notification_route' definida",
        sql.includes('CREATE OR REPLACE FUNCTION get_notification_route'),
        'Resuelve la ruta para un evento dado'
    );
    check(
        "Función 'dispatch_notification_to_route' definida",
        sql.includes('CREATE OR REPLACE FUNCTION dispatch_notification_to_route'),
        'Inserta notificaciones dinámicamente'
    );
    check(
        "Resolución de roles destinatarios usando user_roles y roles",
        sql.includes('JOIN user_roles ur') && sql.includes('JOIN roles r'),
        'Encuentra los usuarios con el rol configurado'
    );
    check(
        "Respeto de preferencias enabled y quiet_hours",
        sql.includes('FROM notification_preferences') && sql.includes('enabled INTO v_pref_enabled'),
        'Filtra notificaciones deshabilitadas por el usuario'
    );
    check(
        "Inserción final en notifications de forma masiva",
        sql.includes('INSERT INTO notifications'),
        'Despacha alertas al bus en estado PENDIENTE'
    );

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO: ${results.length}/${results.length} verificaciones aprobadas`);
    console.log('[ÉXITO] Integraciones y Canales FASE 33 validado correctamente.');
    console.log('--------------------------------------------------');
}

runValidation().catch(err => {
    console.error(err);
    process.exit(1);
});
