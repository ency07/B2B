// SCRIPT DE VALIDACIÓN SINTÁCTICA: MÓDULO SEGURIDAD Y AUDITORÍA AVANZADA (FASE 20)
// Archivo: scripts/test-seguridad-auditoria.ts
//

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
    name: string;
    passed: boolean;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, detail?: string): void {
    results.push({ name, passed: condition });
    const icon = condition ? '✓' : '✗';
    console.log(`${icon} ${name}: ${condition ? 'Sí' : 'No'}${detail ? ` — ${detail}` : ''}`);
    if (!condition) {
        throw new Error(`[FALLO] Verificación fallida: "${name}"${detail ? ` — ${detail}` : ''}`);
    }
}

async function runValidation() {
    console.log('--------------------------------------------------');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA: MÓDULO SEGURIDAD Y AUDITORÍA AVANZADA (FASE 20)');
    console.log('--------------------------------------------------\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000020_security_audit_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Archivo cargado: ${migrationPath} (${sql.length} bytes)\n`);

    // ============================================================
    // BLOQUE 1: Tabla principal user_access_logs
    // ============================================================
    console.log('--- [1] Verificando definición de la tabla user_access_logs ---');

    check(
        "Tabla 'user_access_logs' definida",
        sql.includes('CREATE TABLE user_access_logs'),
        'La tabla principal de auditoría de accesos debe existir'
    );
    check(
        "Campo 'tenant_id' referenciado a tenants",
        sql.includes('tenant_id uuid NOT NULL REFERENCES tenants(id)'),
        'Tenant obligatorio para SaaS multiempresa'
    );
    check(
        "Campo 'user_id' referenciado a users",
        sql.includes('user_id uuid REFERENCES users(id)'),
        'User id para identificar al usuario ERP en sesión'
    );
    check(
        "Campo 'access_code' definido",
        sql.includes('access_code varchar(50) NOT NULL'),
        'Código de correlativo comercial'
    );

    // ============================================================
    // BLOQUE 2: Campos de auditoría y ciclo de vida de la sesión
    // ============================================================
    console.log('\n--- [2] Verificando campos de sesión e IPs ---');

    check(
        "Campo 'login_at' definido",
        sql.includes('login_at timestamp NOT NULL DEFAULT NOW()'),
        'Timestamp de inicio de sesión'
    );
    check(
        "Campo 'logout_at' definido",
        sql.includes('logout_at timestamp'),
        'Timestamp de fin de sesión'
    );
    check(
        "Campo 'ip_address' definido",
        sql.includes('ip_address varchar(100)'),
        'IP del usuario para control forense'
    );
    check(
        "Campo 'user_agent' definido",
        sql.includes('user_agent text'),
        'User agent del navegador/sistema'
    );

    // ============================================================
    // BLOQUE 3: Restricción del estado de acceso
    // ============================================================
    console.log('\n--- [3] Verificando restricciones de estado (SUCCESS, FAILED, LOGOUT) ---');

    check(
        "Campo 'status' definido",
        sql.includes('status varchar(50) NOT NULL'),
        'Estado de la sesión/intento de acceso'
    );
    check(
        "Restricción CHECK de status implementada en user_access_logs",
        sql.includes("CHECK (status IN ('SUCCESS', 'FAILED', 'LOGOUT'))"),
        'Mayúsculas sostenidas y estados limitados a SUCCESS, FAILED y LOGOUT'
    );
    check(
        "Campo 'failure_reason' definido para intentos fallidos",
        sql.includes('failure_reason text'),
        'Registro de motivo de fallo en login'
    );

    // ============================================================
    // BLOQUE 4: Generación de secuencia de negocio
    // ============================================================
    console.log('\n--- [4] Verificando trigger y secuencia de código correlativo ACC- ---');

    check(
        "Función SQL de secuencia 'handle_access_log_sequences' definida",
        sql.includes('CREATE OR REPLACE FUNCTION handle_access_log_sequences'),
        'Manejador PL/pgSQL para generar ACC-000001'
    );
    check(
        "Prefijo correlativo ACC- implementado",
        sql.includes("'ACC-'"),
        "Formato del código de secuencia 'ACC-'"
    );
    check(
        "Sequence type 'ACCESS_LOG' utilizado",
        sql.includes("'ACCESS_LOG'"),
        "El tipo de secuencia en tenant_sequences debe ser 'ACCESS_LOG'"
    );
    check(
        "Trigger 'trg_handle_access_log_code' asociado a user_access_logs",
        sql.includes('CREATE TRIGGER trg_handle_access_log_code') && sql.includes('BEFORE INSERT ON user_access_logs'),
        'Genera secuencia de manera automática antes de insertar'
    );

    // ============================================================
    // BLOQUE 5: Bloqueo de borrado físico e inmutabilidad de logs
    // ============================================================
    console.log('\n--- [5] Verificando inmutabilidad y bloqueo de DELETE físico ---');

    check(
        "Función 'block_physical_access_log_delete' definida",
        sql.includes('CREATE OR REPLACE FUNCTION block_physical_access_log_delete'),
        'Excepción lanzada ante intentos de delete'
    );
    check(
        "Trigger de bloqueo de borrado asociado a user_access_logs",
        sql.includes('CREATE TRIGGER trg_block_physical_access_log_delete') && sql.includes('BEFORE DELETE ON user_access_logs'),
        'Previene borrados accidentales u maliciosos'
    );
    check(
        "Función 'enforce_access_log_inmutability' definida",
        sql.includes('CREATE OR REPLACE FUNCTION enforce_access_log_inmutability'),
        'Manejador PL/pgSQL para verificar inmutabilidad en updates'
    );
    check(
        "Trigger de inmutabilidad asociado a user_access_logs",
        sql.includes('CREATE TRIGGER trg_enforce_access_log_inmutability') && sql.includes('BEFORE UPDATE ON user_access_logs'),
        'Bloquea cualquier cambio en columnas de auditoría básicas'
    );

    // ============================================================
    // BLOQUE 6: Row Level Security (RLS)
    // ============================================================
    console.log('\n--- [6] Verificando Row Level Security (RLS) y Políticas ---');

    check(
        "Row Level Security habilitado en user_access_logs",
        /ALTER TABLE\s+user_access_logs\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sql),
        'RLS SaaS multi-tenant activado'
    );
    check(
        "Política de Super Admin definida",
        sql.includes('CREATE POLICY user_access_logs_super_admin ON user_access_logs'),
        'Acceso global cross-tenant'
    );
    check(
        "Política de lectura de Auditores/Gerentes definida",
        sql.includes('CREATE POLICY user_access_logs_tenant_auditor ON user_access_logs'),
        'Lectura de logs por auditores de tenant'
    );
    check(
        "Política de lectura de registros propios definida",
        sql.includes('CREATE POLICY user_access_logs_own_records ON user_access_logs'),
        'Usuario normal solo lee sus propios accesos'
    );
    check(
        "Política de inserción definida",
        sql.includes('CREATE POLICY user_access_logs_insert_authenticated ON user_access_logs'),
        'Inserción de login por el usuario autenticado'
    );
    check(
        "Política de actualización definida",
        sql.includes('CREATE POLICY user_access_logs_update_authenticated ON user_access_logs'),
        'Actualización de logout por el usuario autenticado'
    );

    // ============================================================
    // BLOQUE 7: Índices de rendimiento
    // ============================================================
    console.log('\n--- [7] Verificando índices de rendimiento de acceso ---');

    check(
        "Índice en tenant_id definido",
        sql.includes('CREATE INDEX idx_user_access_logs_tenant ON user_access_logs(tenant_id)'),
        'Búsqueda optimizada por inquilino'
    );
    check(
        "Índice en user_id definido",
        sql.includes('CREATE INDEX idx_user_access_logs_user ON user_access_logs(user_id)'),
        'Búsqueda optimizada por usuario'
    );
    check(
        "Índice compuesto en status + login_at definido",
        sql.includes('CREATE INDEX idx_user_access_logs_status_login ON user_access_logs(status, login_at)'),
        'Búsqueda optimizada para auditoría por rango de fecha y estado'
    );

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO: ${results.filter(r => r.passed).length}/${results.length} verificaciones aprobadas`);
    console.log('[ÉXITO] Módulo de Seguridad y Auditoría FASE 20 validado correctamente.');
    console.log('--------------------------------------------------');
}

runValidation().catch(err => {
    console.error(err);
    process.exit(1);
});
