// SCRIPT DE VALIDACIÓN: GO-LIVE / PRODUCCIÓN (FASE 23)
// Archivo: scripts/test-go-live.ts
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
        throw new Error(`[FALLO GO-LIVE] Verificación fallida: "${name}"${detail ? ` — ${detail}` : ''}`);
    }
}

async function runGoLiveValidation() {
    console.log('==================================================');
    console.log('INICIANDO VALIDACIÓN SINTÁCTICA DE PRODUCCIÓN (GO-LIVE) - FASE 23');
    console.log('==================================================\n');

    // 1. Cargar todas las migraciones en orden
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    check("Se encontraron archivos de migración", files.length > 0);
    console.log(`Cargando ${files.length} archivos de migración de la base de datos...\n`);

    let totalSql = '';
    const migrationFilesList: string[] = [];
    
    for (const file of files) {
        if (file.endsWith('.sql')) {
            migrationFilesList.push(file);
            totalSql += `\n-- ARCHIVO: ${file}\n` + fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        }
    }

    // 2. Verificar existencia de la migración de monitoreo de esta fase
    check(
        "Migración de Monitoreo de Release (Fase 23) presente",
        migrationFilesList.includes('20260617000023_release_monitoring.sql')
    );

    // 3. Verificar la definición de la vista performance_queries_summary
    console.log('\n--- [1] Verificando monitoreo y pg_stat_statements ---');
    check(
        "Vista 'performance_queries_summary' definida",
        totalSql.includes('CREATE OR REPLACE VIEW public.performance_queries_summary') || totalSql.includes('CREATE VIEW public.performance_queries_summary'),
        'La vista de análisis de rendimiento debe estar declarada'
    );
    check(
        "Vista de monitoreo configurada con security_invoker = true",
        totalSql.includes('WITH (security_invoker = true)') && totalSql.includes('performance_queries_summary'),
        'Herencia de seguridad RLS en vistas analíticas de monitoreo'
    );

    // 4. Auditoría de Seguridad RLS en todas las tablas
    console.log('\n--- [2] Auditoría de Seguridad RLS de Tablas ---');
    
    // Obtener nombres de todas las tablas creadas en el SQL
    const tableRegex = /CREATE TABLE (?:public\.)?([a-zA-Z_]+)/g;
    let match;
    const tables: string[] = [];
    while ((match = tableRegex.exec(totalSql)) !== null) {
        const tableName = match[1];
        if (!tables.includes(tableName)) {
            tables.push(tableName);
        }
    }

    console.log(`Tablas detectadas en el esquema: ${tables.length}`);

    // Para cada tabla detectada, verificar que se habilite RLS
    for (const table of tables) {
        // Excluir tablas de auditoría/sistemas si corresponde, pero las directivas congeladas obligan RLS en todo
        const rlsRegex = new RegExp(`ALTER TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
        const hasRls = rlsRegex.test(totalSql);
        
        check(
            `RLS habilitado para tabla: '${table}'`,
            hasRls,
            `La tabla ${table} debe tener Row Level Security activado`
        );
    }

    // 5. Verificar políticas de Super Admin
    console.log('\n--- [3] Auditoría de Políticas de Super Admin (Bypass) ---');
    // Todas las políticas de Super Admin deben llamarse *_super_admin y usar is_platform_super_admin()
    const policyRegex = /CREATE POLICY ([a-zA-Z_0-9]+) ON/g;
    const policies: string[] = [];
    while ((match = policyRegex.exec(totalSql)) !== null) {
        policies.push(match[1]);
    }

    const superAdminPolicies = policies.filter(p => p.endsWith('_super_admin'));
    console.log(`Políticas de Super Admin detectadas: ${superAdminPolicies.length}`);
    check("Existen políticas de Super Admin definidas", superAdminPolicies.length > 0);

    for (const policy of superAdminPolicies) {
        // Verificar que la política llame a is_platform_super_admin()
        const policyDefinitionRegex = new RegExp(`CREATE POLICY ${policy}[\\s\\S]+?USING\\s*\\([\\s\\S]*?is_platform_super_admin\\(\\)`, 'i');
        const isValid = policyDefinitionRegex.test(totalSql);
        check(
            `Política '${policy}' usa is_platform_super_admin()`,
            isValid,
            'Las políticas de Super Admin deben validar con la función de plataforma'
        );
    }

    // 6. Verificar Índices y Soft Deletes
    console.log('\n--- [4] Auditoría de Hardening e Índices ---');
    const indexMatches = totalSql.match(/CREATE INDEX/g) || [];
    const partialIndexMatches = totalSql.match(/WHERE deleted_at IS NULL/g) || [];
    
    // Al menos 28 índices parciales de Fase 21
    check(
        `Cantidad mínima de índices parciales activos: ${partialIndexMatches.length} (esperado >= 28)`,
        partialIndexMatches.length >= 28,
        'Debe haber al menos 28 índices parciales optimizando soft-deletes'
    );

    // 7. Inmutabilidad de Logs de Auditoría y Acceso
    console.log('\n--- [5] Auditoría de Inmutabilidad de Logs ---');
    check(
        "Triggers de inmutabilidad de logs activos",
        totalSql.includes('enforce_access_log_inmutability') && totalSql.includes('block_physical_access_log_delete'),
        'Logs de acceso inmutables'
    );

    console.log('\n--------------------------------------------------');
    console.log(`RESULTADO GO-LIVE: ${results.filter(r => r.passed).length}/${results.length} validaciones exitosas.`);
    console.log('[ÉXITO] Checklist de Producción (Go-Live) validado correctamente.');
    console.log('==================================================');
}

runGoLiveValidation().catch(err => {
    console.error(err);
    process.exit(1);
});
