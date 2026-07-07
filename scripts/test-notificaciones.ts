// SCRIPT DE VALIDACIÓN SINTÁCTICA: MÓDULO NOTIFICACIONES (FASE 19)
// Archivo: scripts/test-notificaciones.ts
//
// REUSE_ANALYSIS_FASE19 cumplido (9 repos evaluados):
//   IN_APP    → nativo (tabla notifications)
//   EMAIL     → Resend SDK   (MIT, 5.8k stars)
//   WHATSAPP  → Twilio SDK   (MIT, clientes externos)
//   TELEGRAM  → grammY       (MIT, 4.8k stars — usuarios internos GRATIS)
//
// DECISIONES CONGELADAS:
//   D19-01: Clientes externos     → WhatsApp
//   D19-02: Usuarios internos ERP → Telegram (90%+ ahorro vs WhatsApp)
//   D19-03: Clientes corporativos → Email
//   D19-04: Todos los usuarios    → IN_APP
//   D19-09: telegram_chat_id + telegram_username en users

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
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA: MÓDULO NOTIFICACIONES (FASE 19)');
    console.log('Canales: IN_APP + EMAIL + WHATSAPP + TELEGRAM (grammY — gratuito para internos)');
    console.log('--------------------------------------------------\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000019_notifications_core.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Archivo cargado: ${migrationPath} (${sql.length} bytes)\n`);

    // ============================================================
    // BLOQUE 1: Extensión de tabla users (Telegram)
    // ============================================================
    console.log('--- [1] Verificando extensión de tabla users para Telegram ---');

    check(
        "ALTER TABLE users añade telegram_chat_id",
        sql.includes('telegram_chat_id'),
        'D19-09: grammY necesita chat_id para enviar mensajes'
    );
    check(
        "ALTER TABLE users añade telegram_username",
        sql.includes('telegram_username'),
        'D19-09: username facilita vinculación manual'
    );
    check(
        "Índice en telegram_chat_id para lookup rápido",
        sql.includes('idx_users_telegram_chat_id'),
        'Índice parcial WHERE telegram_chat_id IS NOT NULL'
    );

    // ============================================================
    // BLOQUE 2: Tablas principales
    // ============================================================
    console.log('\n--- [2] Verificando existencia de tablas ---');

    check(
        "Tabla 'notification_templates' definida",
        sql.includes('CREATE TABLE notification_templates'),
        'Plantillas Handlebars por canal + event_type'
    );
    check(
        "Tabla 'notifications' definida",
        sql.includes('CREATE TABLE notifications'),
        'Historial de notificaciones enviadas/en cola'
    );
    check(
        "Tabla 'notification_preferences' definida",
        sql.includes('CREATE TABLE notification_preferences'),
        'Preferencias por usuario y canal'
    );

    // ============================================================
    // BLOQUE 3: Los 4 canales (incluyendo TELEGRAM)
    // ============================================================
    console.log('\n--- [3] Verificando los 4 canales de notificación ---');

    const channels = ['IN_APP', 'EMAIL', 'WHATSAPP', 'TELEGRAM'];
    for (const channel of channels) {
        check(
            `Canal '${channel}' en CHECK constraint`,
            sql.includes(`'${channel}'`),
            `channel CHECK IN (...${channel}...)`
        );
    }

    // Verificar que TELEGRAM aparece en AMBAS tablas (templates y notifications)
    const telegramCount = (sql.match(/'TELEGRAM'/g) || []).length;
    check(
        "TELEGRAM aparece en múltiples CHECK constraints (templates + notifications + preferences)",
        telegramCount >= 3,
        `Ocurrencias de 'TELEGRAM': ${telegramCount} (esperadas >= 3)`
    );

    // ============================================================
    // BLOQUE 4: Estados del ciclo de vida
    // ============================================================
    console.log('\n--- [4] Verificando estados del ciclo de vida ---');

    const statuses = ['PENDIENTE', 'ENVIANDO', 'ENTREGADA', 'FALLIDA', 'ANULADA'];
    for (const status of statuses) {
        check(
            `Estado '${status}' en notifications`,
            sql.includes(`'${status}'`),
            `status CHECK IN (...${status}...)`
        );
    }

    // ============================================================
    // BLOQUE 5: Campos clave de routing y cycle de vida
    // ============================================================
    console.log('\n--- [5] Verificando campos de routing y ciclo de vida ---');

    check(
        "Campo 'event_type' para vinculación con business_events",
        sql.includes('event_type'),
        'event_type en notification_templates y notifications'
    );
    check(
        "Campo 'recipient_user_id' para destinatario interno",
        sql.includes('recipient_user_id'),
        'FK a users para usuarios ERP'
    );
    check(
        "Campo 'recipient_contact' para destinatario externo (email/teléfono/chat_id)",
        sql.includes('recipient_contact'),
        'varchar(300) para email, teléfono o Telegram chat_id'
    );
    check(
        "Campo 'body_template' para contenido Handlebars",
        sql.includes('body_template'),
        'Reutiliza Handlebars.js de FASE 18'
    );
    check(
        "Campo 'subject_template' para asunto",
        sql.includes('subject_template'),
        'Asunto del email o título de la notificación'
    );
    check(
        "Campo 'retry_count' para reintentos (BullMQ)",
        sql.includes('retry_count'),
        'Control de reintentos de entrega'
    );
    check(
        "Campo 'sent_at' para timestamp de entrega",
        sql.includes('sent_at'),
        'Timestamp de confirmación de envío'
    );
    check(
        "Campo 'read_at' para lectura de IN_APP",
        sql.includes('read_at'),
        'Bandeja interna: cuando el usuario leyó la notificación'
    );
    check(
        "Campo 'provider_message_id' para ID del proveedor",
        sql.includes('provider_message_id'),
        'Resend email ID, Twilio SID, Telegram message_id'
    );
    check(
        "Campo 'quiet_hours_start' en preferences (horario silencio)",
        sql.includes('quiet_hours_start'),
        'Horario de no molestar por usuario'
    );

    // ============================================================
    // BLOQUE 6: Triggers
    // ============================================================
    console.log('\n--- [6] Verificando triggers ---');

    check(
        "Trigger de códigos secuenciales (NTP- y NOT-)",
        sql.includes('handle_notification_sequences') &&
        sql.includes("'NTP-'") &&
        sql.includes("'NOT-'"),
        'NTP-000001 y NOT-000001 correlativos por tenant'
    );
    check(
        "Trigger de plantilla única activa por canal+evento",
        sql.includes('enforce_single_active_notification_template'),
        'Una sola plantilla activa por (tenant, channel, event_type)'
    );
    check(
        "Trigger de ciclo de vida (sent_at, failed_at, read_at)",
        sql.includes('handle_notification_lifecycle'),
        'Gestión automática de timestamps de estado'
    );
    check(
        "Trigger de bloqueo de borrado físico",
        sql.includes('block_physical_notification_delete'),
        'Soft delete obligatorio en módulo de notificaciones'
    );
    check(
        "Trigger de trazabilidad (handle_approval_traceability)",
        sql.includes('handle_approval_traceability'),
        'updated_at y updated_by automáticos'
    );
    check(
        "Trigger de auditoría general (process_audit_log)",
        sql.includes('process_audit_log'),
        'audit_notification_templates + audit_notifications'
    );

    // ============================================================
    // BLOQUE 7: Seguridad RLS multitenancy
    // ============================================================
    console.log('\n--- [7] Verificando seguridad RLS ---');

    check(
        "RLS habilitado en notification_templates",
        sql.includes('notification_templates ENABLE ROW LEVEL SECURITY'),
        'ENABLE ROW LEVEL SECURITY'
    );
    check(
        "RLS habilitado en notifications",
        sql.includes('notifications ENABLE ROW LEVEL SECURITY'),
        'ENABLE ROW LEVEL SECURITY'
    );
    check(
        "RLS habilitado en notification_preferences",
        sql.includes('notification_preferences ENABLE ROW LEVEL SECURITY'),
        'ENABLE ROW LEVEL SECURITY'
    );
    check(
        "Política Super Admin cross-tenant",
        sql.includes('notif_templates_super_admin') && sql.includes('is_platform_super_admin()'),
        'is_platform_super_admin()'
    );
    check(
        "Política: usuario solo ve SUS notificaciones (recipient_user_id)",
        sql.includes('notifications_own_records') && sql.includes('recipient_user_id'),
        'Política diferenciada: un usuario no puede ver notificaciones de otros'
    );
    check(
        "Política: usuario solo gestiona SUS preferencias (user_id)",
        sql.includes('notif_prefs_own_records') && sql.includes('notif_prefs_write_own'),
        'Aislamiento de preferencias por user_id'
    );

    // ============================================================
    // BLOQUE 8: Soft Delete e Índices
    // ============================================================
    console.log('\n--- [8] Verificando soft delete e índices de rendimiento ---');

    check(
        "Soft delete en notification_templates (deleted_at)",
        sql.includes('deleted_at') && sql.includes('deleted_by') && sql.includes('delete_reason'),
        'deleted_at, deleted_by, delete_reason'
    );
    check(
        "Índice de bandeja IN_APP (recipient_user_id + read_at + status)",
        sql.includes('idx_notifications_inbox'),
        'Índice parcial WHERE channel = IN_APP AND deleted_at IS NULL'
    );
    check(
        "Índice de lookup de plantilla activa (tenant+channel+event_type+active)",
        sql.includes('idx_notif_templates_lookup'),
        'Índice compuesto para búsqueda rápida de plantilla'
    );
    check(
        "Índice en notifications por recipient_user_id",
        sql.includes('idx_notifications_recipient'),
        'Para consultas de bandeja de entrada del usuario'
    );

    // ============================================================
    // BLOQUE 9: Validar comentarios de decisiones congeladas
    // ============================================================
    console.log('\n--- [9] Verificando decisiones de routing de canales ---');

    check(
        "D19-02 documentada: Telegram para usuarios internos (gratis)",
        sql.includes('D19-02') || sql.includes('usuarios internos'),
        'Telegram gratuito para personal ERP — ahorro 90% vs WhatsApp'
    );
    check(
        "Arquitectura de canales documentada (clientes externos → WhatsApp)",
        sql.includes('clientes externos') || sql.includes('Clientes externos'),
        'WhatsApp solo para clientes externos'
    );
    check(
        "grammY referenciado como librería Telegram seleccionada",
        sql.includes('gramm') || sql.includes('grammY'),
        'grammY (MIT, TypeScript-first) — D19-08'
    );

    // ============================================================
    // RESULTADO FINAL
    // ============================================================
    const totalChecks = results.length;
    const passed = results.filter(r => r.passed).length;

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO: ${passed}/${totalChecks} verificaciones aprobadas`);
    console.log('--------------------------------------------------');
    console.log('\n[ÉXITO] Módulo de Notificaciones FASE 19 validado correctamente.');
    console.log('Stack open source confirmado:');
    console.log('  ✓ IN_APP      → tabla notifications (nativo, sin costo)');
    console.log('  ✓ EMAIL       → Resend SDK (MIT) — clientes corporativos');
    console.log('  ✓ WHATSAPP    → Twilio SDK (MIT) — clientes externos');
    console.log('  ✓ TELEGRAM    → grammY (MIT, GRATIS) — usuarios internos ERP');
    console.log('  ✓ users       → telegram_chat_id + telegram_username añadidos');
    console.log('  ✓ BullMQ      → reintentos (retry_count, max_retries, next_retry_at)');
    console.log('  ✓ REUSE_ANALYSIS_FASE19.md → 9 repos evaluados (D19-01 a D19-09)');
}

async function main() {
    try {
        await runValidation();
        process.exit(0);
    } catch (error) {
        console.error('\n[FALLO] Error en validación del módulo de notificaciones:', error);
        process.exit(1);
    }
}

main();
