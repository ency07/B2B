// SCRIPT DE VALIDACIÓN SINTÁCTICA: MÓDULO HARDENING / RENDIMIENTO (FASE 21)
// Archivo: scripts/test-performance-hardening.ts
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
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA: MÓDULO HARDENING / RENDIMIENTO (FASE 21)');
    console.log('--------------------------------------------------\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260617000021_performance_hardening.sql');
    if (!fs.existsSync(migrationPath)) {
        throw new Error(`No se encuentra la migración en: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Archivo cargado: ${migrationPath} (${sql.length} bytes)\n`);

    // ============================================================
    // BLOQUE 1: Índices en Capa Core / Usuarios
    // ============================================================
    console.log('--- [1] Verificando índices de Capa Core y Usuarios ---');
    check(
        "Índice idx_users_site_id definido",
        sql.includes('idx_users_site_id'),
        'Optimización FK site_id en users'
    );
    check(
        "Índice idx_users_area_id definido",
        sql.includes('idx_users_area_id'),
        'Optimización FK area_id en users'
    );
    check(
        "Índice idx_users_manager_id definido",
        sql.includes('idx_users_manager_id'),
        'Optimización FK manager_id en users'
    );

    // ============================================================
    // BLOQUE 2: Índices en Requerimientos y Documentos
    // ============================================================
    console.log('\n--- [2] Verificando índices de Requerimientos y Documentos ---');
    check(
        "Índice idx_requirements_contact_id definido",
        sql.includes('idx_requirements_contact_id'),
        'Optimización FK contact_id en requirements'
    );
    check(
        "Índice idx_requirements_site_id definido",
        sql.includes('idx_requirements_site_id'),
        'Optimización FK site_id en requirements'
    );
    check(
        "Índice idx_requirements_created_by definido",
        sql.includes('idx_requirements_created_by'),
        'Optimización FK created_by en requirements'
    );

    // ============================================================
    // BLOQUE 3: Índices en Cotizaciones
    // ============================================================
    console.log('\n--- [3] Verificando índices de Cotizaciones ---');
    check(
        "Índice idx_quotes_created_by definido",
        sql.includes('idx_quotes_created_by'),
        'Optimización FK created_by en quotes'
    );

    // ============================================================
    // BLOQUE 4: Índices en Trabajos (Jobs)
    // ============================================================
    console.log('\n--- [4] Verificando índices de Trabajos (Jobs) ---');
    check(
        "Índice idx_jobs_assigned_user_id definido",
        sql.includes('idx_jobs_assigned_user_id'),
        'Optimización FK assigned_user_id en jobs'
    );
    check(
        "Índice idx_jobs_created_by definido",
        sql.includes('idx_jobs_created_by'),
        'Optimización FK created_by en jobs'
    );
    check(
        "Índice idx_jobs_quote_id definido",
        sql.includes('idx_jobs_quote_id'),
        'Optimización FK quote_id en jobs'
    );
    check(
        "Índice idx_job_activities_assigned definido",
        sql.includes('idx_job_activities_assigned'),
        'Optimización FK assigned_user_id en job_activities'
    );
    check(
        "Índice idx_job_activities_created_by definido",
        sql.includes('idx_job_activities_created_by'),
        'Optimización FK created_by en job_activities'
    );

    // ============================================================
    // BLOQUE 5: Índices en Almacén e Inventarios
    // ============================================================
    console.log('\n--- [5] Verificando índices de Inventarios ---');
    check(
        "Índice idx_inventory_movements_item definido",
        sql.includes('idx_inventory_movements_item'),
        'Optimización FK item_id en movements'
    );
    check(
        "Índice idx_inventory_movements_warehouse definido",
        sql.includes('idx_inventory_movements_warehouse'),
        'Optimización FK warehouse_id en movements'
    );
    check(
        "Índice idx_inventory_movements_source definido",
        sql.includes('idx_inventory_movements_source'),
        'Optimización FK source_warehouse_id en movements'
    );
    check(
        "Índice idx_inventory_movements_destination definido",
        sql.includes('idx_inventory_movements_destination'),
        'Optimización FK destination_warehouse_id en movements'
    );
    check(
        "Índice idx_inventory_movements_created_by definido",
        sql.includes('idx_inventory_movements_created_by'),
        'Optimización FK created_by en movements'
    );

    // ============================================================
    // BLOQUE 6: Índices en Facturación y Pagos
    // ============================================================
    console.log('\n--- [6] Verificando índices de Facturación y Pagos ---');
    check(
        "Índice idx_invoices_quote_id definido",
        sql.includes('idx_invoices_quote_id'),
        'Optimización FK quote_id en invoices'
    );
    check(
        "Índice idx_invoices_job_id definido",
        sql.includes('idx_invoices_job_id'),
        'Optimización FK job_id en invoices'
    );
    check(
        "Índice idx_invoices_created_by definido",
        sql.includes('idx_invoices_created_by'),
        'Optimización FK created_by en invoices'
    );
    check(
        "Índice idx_payments_created_by definido",
        sql.includes('idx_payments_created_by'),
        'Optimización FK created_by en payments'
    );
    check(
        "Índice idx_customer_advances_created_by definido",
        sql.includes('idx_customer_advances_created_by'),
        'Optimización FK created_by en customer_advances'
    );

    // ============================================================
    // BLOQUE 7: Índices en Garantías (Postventa)
    // ============================================================
    console.log('\n--- [7] Verificando índices de Garantías ---');
    check(
        "Índice idx_warranties_created_by definido",
        sql.includes('idx_warranties_created_by'),
        'Optimización FK created_by en warranties'
    );
    check(
        "Índice idx_warranty_interventions_assigned definido",
        sql.includes('idx_warranty_interventions_assigned'),
        'Optimización FK assigned_user_id en interventions'
    );
    check(
        "Índice idx_warranty_interventions_created_by definido",
        sql.includes('idx_warranty_interventions_created_by'),
        'Optimización FK created_by en interventions'
    );

    // ============================================================
    // BLOQUE 8: Índices en Notificaciones y Logs de Acceso
    // ============================================================
    console.log('\n--- [8] Verificando índices de Notificaciones y Logs ---');
    check(
        "Índice idx_notifications_template definido",
        sql.includes('idx_notifications_template'),
        'Optimización FK template_id en notifications'
    );
    check(
        "Índice idx_notifications_created_by definido",
        sql.includes('idx_notifications_created_by'),
        'Optimización FK created_by en notifications'
    );
    check(
        "Índice idx_user_access_logs_created_by definido",
        sql.includes('idx_user_access_logs_created_by'),
        'Optimización FK created_by en user_access_logs'
    );

    // ============================================================
    // BLOQUE 9: Cláusula Parcial WHERE deleted_at IS NULL
    // ============================================================
    console.log('\n--- [9] Verificando presencia de la cláusula parcial WHERE deleted_at IS NULL ---');

    const totalIndicesCount = (sql.match(/CREATE INDEX/g) || []).length;
    const partialClauseCount = (sql.match(/WHERE deleted_at IS NULL/g) || []).length;

    check(
        "Todos los índices definidos son parciales para optimizar soft-deletes",
        totalIndicesCount === partialClauseCount,
        `Índices creados: ${totalIndicesCount}, Índices parciales activos: ${partialClauseCount}`
    );

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO: ${results.filter(r => r.passed).length}/${results.length} verificaciones aprobadas`);
    console.log('[ÉXITO] Módulo de Hardening y Rendimiento FASE 21 validado correctamente.');
    console.log('--------------------------------------------------');
}

runValidation().catch(err => {
    console.error(err);
    process.exit(1);
});
